/**
 * Google Drive Template Management
 *
 * Phase 2: Updated to use unified GoogleWorkspaceClient
 * - Supports both Service Account and OAuth
 * - Secure token storage in database
 * - Template caching for performance
 */

import { getOAuthClient } from './google/workspace-client';
import type { DriveTemplate, SkillTemplates } from './google/types';

// In-memory cache for templates (1 hour TTL)
interface CachedTemplates {
  templates: DriveTemplate[];
  timestamp: number;
}

let templateListCache: CachedTemplates | null = null;
const TEMPLATE_LIST_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const templateContentCache = new Map<string, { content: string; timestamp: number }>();
const TEMPLATE_CONTENT_CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface TemplateMatchCacheEntry {
  result: DriveTemplateMatch | null;
  timestamp: number;
}

const templateMatchCache = new Map<string, TemplateMatchCacheEntry>();
const TEMPLATE_MATCH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

type DocumentSourceType =
  | 'job_description'
  | 'offer_letter'
  | 'pip'
  | 'termination_letter'
  | 'interview_guide'
  | 'performance_review'
  | 'onboarding_checklist'
  | 'policy'
  | 'custom'
  | 'general';

interface TemplateMatcherConfig {
  keywords: string[];
  preferredSkills?: string[];
  fallbackKeywords?: string[];
}

const DOCUMENT_TEMPLATE_MATCHERS: Record<DocumentSourceType, TemplateMatcherConfig> = {
  job_description: {
    keywords: ['job description', 'jd', 'role profile'],
    preferredSkills: ['job-description-writer'],
  },
  offer_letter: {
    keywords: ['offer letter', 'employment offer'],
    preferredSkills: ['hr-document-generator'],
    fallbackKeywords: ['offer template', 'offer draft'],
  },
  pip: {
    keywords: ['performance improvement plan', 'pip'],
    preferredSkills: ['pip-builder-monitor'],
  },
  termination_letter: {
    keywords: ['termination', 'separation', 'dismissal'],
    preferredSkills: ['offboarding-exit-builder', 'hr-document-generator'],
  },
  interview_guide: {
    keywords: ['interview guide', 'interview plan', 'interview rubric'],
    preferredSkills: ['interview-guide-creator'],
  },
  performance_review: {
    keywords: ['performance review', 'review template', 'evaluation'],
    preferredSkills: ['performance-insights-analyst', 'hr-document-generator'],
  },
  onboarding_checklist: {
    keywords: ['onboarding', 'new hire checklist', 'orientation'],
    preferredSkills: ['onboarding-program-builder'],
  },
  policy: {
    keywords: ['policy', 'handbook', 'procedure'],
    preferredSkills: ['policy-lifecycle-manager', 'hr-document-generator'],
  },
  custom: {
    keywords: [],
  },
  general: {
    keywords: [],
  },
};

export interface DriveTemplateMatch {
  templateId: string;
  name: string;
  skillName: string;
  content: string;
  webViewLink?: string;
  matchConfidence: number;
  matchReason?: string;
  source: 'environment' | 'keyword';
}

/**
 * Fetch list of all templates from Google Drive (with caching)
 */
export async function fetchTemplateList(userId: string): Promise<DriveTemplate[]> {
  // Check cache first
  if (templateListCache && Date.now() - templateListCache.timestamp < TEMPLATE_LIST_CACHE_TTL) {
    return templateListCache.templates;
  }

  const client = getOAuthClient(userId);
  await client.ensureAuthenticated();
  const drive = await client.getDrive();

  // Find the HR Command Center folder
  const searchRootResponse = await drive.files.list({
    q: `name='HR Command Center' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1,
  });

  if (!searchRootResponse.data.files || searchRootResponse.data.files.length === 0) {
    throw new Error('HR Command Center folder not found');
  }

  const rootFolderId = searchRootResponse.data.files[0].id!;

  // Find Templates subfolder
  const searchTemplatesResponse = await drive.files.list({
    q: `name='Templates' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1,
  });

  if (!searchTemplatesResponse.data.files || searchTemplatesResponse.data.files.length === 0) {
    throw new Error('Templates folder not found');
  }

  const templatesFolderId = searchTemplatesResponse.data.files[0].id!;

  // Get all skill folders
  const skillFoldersResponse = await drive.files.list({
    q: `'${templatesFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 100,
    orderBy: 'name',
  });

  const skillFolders = skillFoldersResponse.data.files || [];
  const templates: DriveTemplate[] = [];

  // For each skill folder, get the template files
  for (const skillFolder of skillFolders) {
    const filesResponse = await drive.files.list({
      q: `'${skillFolder.id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'files(id, name, webViewLink)',
      pageSize: 100,
      orderBy: 'name',
    });

    const files = filesResponse.data.files || [];

    for (const file of files) {
      templates.push({
        id: file.id!,
        name: file.name!,
        skillName: skillFolder.name!,
        webViewLink: file.webViewLink || undefined,
      });
    }
  }

  // Cache the results
  templateListCache = {
    templates,
    timestamp: Date.now(),
  };

  return templates;
}

/**
 * Fetch template content by ID (with caching)
 */
export async function fetchTemplateContent(userId: string, templateId: string): Promise<string> {
  // Check cache first
  const cached = templateContentCache.get(templateId);
  if (cached && Date.now() - cached.timestamp < TEMPLATE_CONTENT_CACHE_TTL) {
    return cached.content;
  }

  const client = getOAuthClient(userId);
  await client.ensureAuthenticated();
  const docs = await client.getDocs();

  const doc = await docs.documents.get({
    documentId: templateId,
  });

  // Extract plain text content
  const content = extractTextFromDoc(doc.data);

  // Cache the content
  templateContentCache.set(templateId, {
    content,
    timestamp: Date.now(),
  });

  return content;
}

/**
 * Get templates organized by skill
 */
export async function getTemplatesBySkill(userId: string): Promise<SkillTemplates[]> {
  const templates = await fetchTemplateList(userId);

  // Group by skill
  const skillMap = new Map<string, Record<string, string>>();

  for (const template of templates) {
    if (!skillMap.has(template.skillName)) {
      skillMap.set(template.skillName, {});
    }

    const content = await fetchTemplateContent(userId, template.id);
    skillMap.get(template.skillName)![template.name] = content;
  }

  // Convert to array
  return Array.from(skillMap.entries()).map(([skillName, templates]) => ({
    skillName,
    templates,
  }));
}

/**
 * Clear template caches
 */
export function clearTemplateCache(): void {
  templateListCache = null;
  templateContentCache.clear();
  templateMatchCache.clear();
}

/**
 * Extract plain text from Google Docs document
 */
function extractTextFromDoc(doc: any): string {
  if (!doc.body || !doc.body.content) {
    return '';
  }

  const textParts: string[] = [];

  function extractFromElement(element: any): void {
    if (element.paragraph) {
      const paragraph = element.paragraph;
      if (paragraph.elements) {
        for (const elem of paragraph.elements) {
          if (elem.textRun && elem.textRun.content) {
            textParts.push(elem.textRun.content);
          }
        }
      }
    }

    if (element.table) {
      const table = element.table;
      if (table.tableRows) {
        for (const row of table.tableRows) {
          if (row.tableCells) {
            for (const cell of row.tableCells) {
              if (cell.content) {
                for (const content of cell.content) {
                  extractFromElement(content);
                }
              }
            }
          }
        }
      }
    }
  }

  for (const element of doc.body.content) {
    extractFromElement(element);
  }

  return textParts.join('');
}

/**
 * Fetch the best-matching Google Drive template for a given document type.
 */
export async function fetchBestTemplateForDocumentType(
  userId: string,
  documentType: string
): Promise<DriveTemplateMatch | null> {
  const normalizedType = normalizeDocumentType(documentType);
  const cacheKey = `${userId}:${normalizedType}`;

  const cached = templateMatchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < TEMPLATE_MATCH_CACHE_TTL) {
    return cached.result;
  }

  try {
    const envOverride = getEnvTemplateOverride(normalizedType);
    if (envOverride) {
      const templates = await fetchTemplateList(userId);
      const match = templates.find((template) => template.id === envOverride);

      if (!match) {
        throw new Error(
          `Environment override provided for ${normalizedType}, but template ${envOverride} was not found`
        );
      }

      const content = await fetchTemplateContent(userId, envOverride);
      const result: DriveTemplateMatch = {
        templateId: envOverride,
        name: match.name,
        skillName: match.skillName,
        content,
        webViewLink: match.webViewLink,
        matchConfidence: 100,
        source: 'environment',
        matchReason: 'Explicit environment override',
      };

      templateMatchCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    const templates = await fetchTemplateList(userId);
    const config = DOCUMENT_TEMPLATE_MATCHERS[normalizedType] ?? DOCUMENT_TEMPLATE_MATCHERS.general;

    let bestMatch: {
      template: DriveTemplate;
      score: number;
      reasons: string[];
    } | null = null;

    for (const template of templates) {
      const evaluation = scoreTemplateMatch(template, config, normalizedType);
      if (evaluation.score <= 0) continue;

      if (!bestMatch || evaluation.score > bestMatch.score) {
        bestMatch = {
          template,
          score: evaluation.score,
          reasons: evaluation.reasons,
        };
      }
    }

    if (!bestMatch || bestMatch.score < 30) {
      templateMatchCache.set(cacheKey, { result: null, timestamp: Date.now() });
      return null;
    }

    const content = await fetchTemplateContent(userId, bestMatch.template.id);
    const result: DriveTemplateMatch = {
      templateId: bestMatch.template.id,
      name: bestMatch.template.name,
      skillName: bestMatch.template.skillName,
      content,
      webViewLink: bestMatch.template.webViewLink,
      matchConfidence: Math.min(95, bestMatch.score),
      matchReason: bestMatch.reasons.join('; '),
      source: 'keyword',
    };

    templateMatchCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (error) {
    templateMatchCache.set(cacheKey, { result: null, timestamp: Date.now() });
    throw error;
  }
}

function normalizeDocumentType(documentType: string): DocumentSourceType {
  const normalized = documentType?.toLowerCase().replace(/\s+/g, '_') || 'general';
  if (normalized in DOCUMENT_TEMPLATE_MATCHERS) {
    return normalized as DocumentSourceType;
  }
  return 'general';
}

function getEnvTemplateOverride(documentType: string): string | undefined {
  const envKey = `GOOGLE_TEMPLATE_${documentType.toUpperCase()}_ID`;
  return process.env[envKey];
}

function scoreTemplateMatch(
  template: DriveTemplate,
  config: TemplateMatcherConfig,
  documentType: string
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const templateName = template.name.toLowerCase();
  const typeLabel = documentType.replace(/_/g, ' ');

  if (config.preferredSkills?.some((skill) => template.skillName.toLowerCase().includes(skill))) {
    score += 35;
    reasons.push(`Preferred skill folder (${template.skillName})`);
  }

  for (const keyword of config.keywords) {
    if (templateName.includes(keyword)) {
      score += 30;
      reasons.push(`Matched keyword "${keyword}"`);
    }
  }

  if (config.fallbackKeywords) {
    for (const keyword of config.fallbackKeywords) {
      if (templateName.includes(keyword)) {
        score += 15;
        reasons.push(`Matched fallback keyword "${keyword}"`);
      }
    }
  }

  if (templateName.includes(typeLabel)) {
    score += 20;
    reasons.push(`Template name includes document type (${typeLabel})`);
  }

  // Slight boost for shorter, direct template names
  if (template.name.length < 40) {
    score += 5;
  }

  return { score, reasons };
}
