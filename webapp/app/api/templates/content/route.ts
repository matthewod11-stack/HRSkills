import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthClient } from '../../../../../integrations/google/oauth-client';
import { google } from 'googleapis';

export const runtime = 'nodejs';

/**
 * GET /api/templates/content?documentId=xxx
 *
 * Fetch the content of a specific template document from Google Docs
 * Converts Google Docs format back to markdown for processing
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId parameter' },
        { status: 400 }
      );
    }

    // Check if authenticated
    if (!googleOAuthClient.isAuthenticated()) {
      return NextResponse.json(
        { error: 'Not authenticated with Google Drive', needsAuth: true },
        { status: 401 }
      );
    }

    // Refresh token if needed
    await googleOAuthClient.refreshTokenIfNeeded();
    const auth = googleOAuthClient.getAuth();
    const docs = google.docs({ version: 'v1', auth });

    // Get the document
    const doc = await docs.documents.get({ documentId });

    // Convert Google Docs content to markdown
    const markdown = convertDocsToMarkdown(doc.data);

    return NextResponse.json({
      success: true,
      documentId,
      title: doc.data.title,
      content: markdown
    });

  } catch (error: any) {
    console.error('Error fetching template content:', error);

    // Handle auth errors
    if (error.message?.includes('Not authenticated') || error.message?.includes('expired')) {
      return NextResponse.json(
        { error: 'Authentication expired', needsAuth: true },
        { status: 401 }
      );
    }

    // Handle not found
    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch template content', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Convert Google Docs content to markdown
 * Simplified converter that handles basic formatting
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
