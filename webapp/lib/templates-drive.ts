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
      fields: 'files(id, name)',
      pageSize: 100,
      orderBy: 'name',
    });

    const files = filesResponse.data.files || [];

    for (const file of files) {
      templates.push({
        id: file.id!,
        name: file.name!,
        skillName: skillFolder.name!,
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
