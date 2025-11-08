import { googleOAuthClient } from '../../integrations/google/oauth-client';
import { google } from 'googleapis';

export interface DriveTemplate {
  id: string;
  name: string;
  skillName: string;
  content?: string;
}

export interface SkillTemplates {
  skillName: string;
  templates: Record<string, string>; // Map of template name to content
}

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
export async function fetchTemplateList(): Promise<DriveTemplate[]> {
  // Check cache first
  if (templateListCache && Date.now() - templateListCache.timestamp < TEMPLATE_LIST_CACHE_TTL) {
    return templateListCache.templates;
  }

  if (!googleOAuthClient.isAuthenticated()) {
    throw new Error('Not authenticated with Google Drive');
  }

  await googleOAuthClient.refreshTokenIfNeeded();
  const auth = googleOAuthClient.getAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Find the HR Command Center folder
  const searchRootResponse = await drive.files.list({
    q: `name='HR Command Center' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1
  });

  if (!searchRootResponse.data.files || searchRootResponse.data.files.length === 0) {
    throw new Error('HR Command Center folder not found');
  }

  const rootFolderId = searchRootResponse.data.files[0].id!;

  // Find Templates subfolder
  const searchTemplatesResponse = await drive.files.list({
    q: `name='Templates' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1
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
    orderBy: 'name'
  });

  const skillFolders = skillFoldersResponse.data.files || [];
  const templates: DriveTemplate[] = [];

  // For each skill folder, get the template files
  for (const skillFolder of skillFolders) {
    const filesResponse = await drive.files.list({
      q: `'${skillFolder.id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 100,
      orderBy: 'name'
    });

    const files = filesResponse.data.files || [];

    for (const file of files) {
      templates.push({
        id: file.id!,
        name: file.name!,
        skillName: skillFolder.name!
      });
    }
  }

  // Update cache
  templateListCache = {
    templates,
    timestamp: Date.now()
  };

  return templates;
}

/**
 * Fetch content of a specific template (with caching)
 */
export async function fetchTemplateContent(documentId: string): Promise<string> {
  // Check cache first
  const cached = templateContentCache.get(documentId);
  if (cached && Date.now() - cached.timestamp < TEMPLATE_CONTENT_CACHE_TTL) {
    return cached.content;
  }

  if (!googleOAuthClient.isAuthenticated()) {
    throw new Error('Not authenticated with Google Drive');
  }

  await googleOAuthClient.refreshTokenIfNeeded();
  const auth = googleOAuthClient.getAuth();
  const docs = google.docs({ version: 'v1', auth });

  // Get the document
  const doc = await docs.documents.get({ documentId });

  // Convert Google Docs content to markdown
  const markdown = convertDocsToMarkdown(doc.data);

  // Update cache
  templateContentCache.set(documentId, {
    content: markdown,
    timestamp: Date.now()
  });

  return markdown;
}

/**
 * Load all templates for a specific skill
 */
export async function loadSkillTemplatesFromDrive(skillName: string): Promise<SkillTemplates | null> {
  try {
    const allTemplates = await fetchTemplateList();

    // Filter templates for this skill
    const skillTemplates = allTemplates.filter(t =>
      t.skillName.toLowerCase() === skillName.toLowerCase()
    );

    if (skillTemplates.length === 0) {
      return null;
    }

    // Fetch content for each template
    const templates: Record<string, string> = {};

    for (const template of skillTemplates) {
      const content = await fetchTemplateContent(template.id);
      templates[template.name] = content;
    }

    return {
      skillName,
      templates
    };
  } catch (error) {
    console.error(`Error loading templates for skill ${skillName}:`, error);
    return null;
  }
}

/**
 * Convert Google Docs content to markdown
 */
function convertDocsToMarkdown(doc: any): string {
  if (!doc.body || !doc.body.content) {
    return '';
  }

  let markdown = '';

  for (const element of doc.body.content) {
    if (!element.paragraph) continue;

    const paragraph = element.paragraph;
    let text = '';
    let isBold = false;
    let isItalic = false;

    // Extract text with inline formatting
    if (paragraph.elements) {
      for (const elem of paragraph.elements) {
        if (elem.textRun) {
          let runText = elem.textRun.content || '';

          // Check formatting
          const style = elem.textRun.textStyle || {};
          isBold = style.bold === true;
          isItalic = style.italic === true;

          // Apply markdown formatting
          if (isBold && isItalic) {
            runText = `***${runText.trim()}***`;
          } else if (isBold) {
            runText = `**${runText.trim()}**`;
          } else if (isItalic) {
            runText = `*${runText.trim()}*`;
          }

          text += runText;
        }
      }
    }

    // Clean up extra whitespace
    text = text.trim();

    if (text === '') {
      markdown += '\n';
      continue;
    }

    // Apply paragraph styles
    const style = paragraph.paragraphStyle?.namedStyleType;

    switch (style) {
      case 'HEADING_1':
        markdown += `# ${text}\n\n`;
        break;
      case 'HEADING_2':
        markdown += `## ${text}\n\n`;
        break;
      case 'HEADING_3':
        markdown += `### ${text}\n\n`;
        break;
      case 'HEADING_4':
        markdown += `#### ${text}\n\n`;
        break;
      case 'HEADING_5':
        markdown += `##### ${text}\n\n`;
        break;
      case 'HEADING_6':
        markdown += `###### ${text}\n\n`;
        break;
      default:
        // Check for bullet lists
        if (paragraph.bullet) {
          const indentLevel = paragraph.paragraphStyle?.indentStart?.magnitude || 0;
          const indent = '  '.repeat(Math.floor(indentLevel / 18)); // 18pt = 1 level
          markdown += `${indent}- ${text}\n`;
        } else {
          markdown += `${text}\n\n`;
        }
    }
  }

  return markdown.trim();
}

/**
 * Clear template caches (useful for testing or when templates are updated)
 */
export function clearTemplateCache(): void {
  templateListCache = null;
  templateContentCache.clear();
}
