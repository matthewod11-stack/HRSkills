import { google } from 'googleapis';
import { googleOAuthClient } from './oauth-client';
import type { GoogleDocRequest, GoogleDocResponse } from './types';

/**
 * Google Docs Integration with OAuth
 * Uses user's OAuth credentials instead of service account
 */

export class GoogleDocsOAuthService {
  /**
   * Create a new Google Doc from markdown content using OAuth
   */
  async createDocumentFromMarkdown(request: GoogleDocRequest): Promise<GoogleDocResponse> {
    // Ensure we're authenticated
    await googleOAuthClient.refreshTokenIfNeeded();
    const auth = googleOAuthClient.getAuth();

    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });

    // Step 1: Create empty document via Drive API
    const fileMetadata: any = {
      name: request.title,
      mimeType: 'application/vnd.google-apps.document'
    };

    if (request.folderId) {
      fileMetadata.parents = [request.folderId];
    }

    const createResponse = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id'
    });

    const documentId = createResponse.data.id!;

    // Step 2: Convert markdown to Google Docs requests
    const requests = this.markdownToDocsRequests(request.content);

    // Step 3: Batch update the document with content
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests }
      });
    }

    // Step 4: Get final document data
    const doc = await docs.documents.get({ documentId });

    return {
      documentId,
      title: doc.data.title!,
      webViewLink: `https://docs.google.com/document/d/${documentId}/view`,
      editLink: `https://docs.google.com/document/d/${documentId}/edit`
    };
  }

  /**
   * Convert markdown to Google Docs API batch requests
   * (Reusing the same logic from the service account version)
   */
  private markdownToDocsRequests(markdown: string): any[] {
    const requests: any[] = [];
    const lines = markdown.split('\n');
    let currentIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === '') {
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: '\n'
          }
        });
        currentIndex += 1;
        continue;
      }

      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const headerType = level === 1 ? 'HEADING_1' : level === 2 ? 'HEADING_2' : level === 3 ? 'HEADING_3' : 'HEADING_4';

        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: text + '\n'
          }
        });

        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + text.length + 1
            },
            paragraphStyle: { namedStyleType: headerType },
            fields: 'namedStyleType'
          }
        });

        currentIndex += text.length + 1;
        continue;
      }

      // Bullet lists
      const bulletMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
      if (bulletMatch) {
        const text = bulletMatch[1];
        const indentLevel = Math.floor((line.length - line.trimStart().length) / 2);

        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: text + '\n'
          }
        });

        requests.push({
          createParagraphBullets: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + text.length + 1
            },
            bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
          }
        });

        if (indentLevel > 0) {
          requests.push({
            updateParagraphStyle: {
              range: {
                startIndex: currentIndex,
                endIndex: currentIndex + text.length + 1
              },
              paragraphStyle: {
                indentStart: { magnitude: indentLevel * 18, unit: 'PT' }
              },
              fields: 'indentStart'
            }
          });
        }

        currentIndex += text.length + 1;
        continue;
      }

      // Numbered lists
      const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      if (numberedMatch) {
        const text = numberedMatch[1];

        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: text + '\n'
          }
        });

        requests.push({
          createParagraphBullets: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + text.length + 1
            },
            bulletPreset: 'NUMBERED_DECIMAL_ALPHA_ROMAN'
          }
        });

        currentIndex += text.length + 1;
        continue;
      }

      // Regular paragraph with inline formatting
      const processedLine = this.processInlineFormatting(line);

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: processedLine.text + '\n'
        }
      });

      // Apply inline styles
      for (const style of processedLine.styles) {
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex + style.start,
              endIndex: currentIndex + style.end
            },
            textStyle: style.format,
            fields: Object.keys(style.format).join(',')
          }
        });
      }

      currentIndex += processedLine.text.length + 1;
    }

    return requests;
  }

  /**
   * Process inline formatting (bold, italic)
   */
  private processInlineFormatting(text: string): { text: string; styles: any[] } {
    let processedText = text;
    const styles: any[] = [];
    let offset = 0;

    // Process bold (**text**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = boldRegex.exec(text)) !== null) {
      const start = match.index - offset;
      const content = match[1];
      const end = start + content.length;

      styles.push({
        start,
        end,
        format: { bold: true }
      });

      processedText = processedText.replace(match[0], content);
      offset += 4; // Remove ** from both sides
    }

    // Process italic (*text*)
    const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
    offset = text.length - processedText.length;
    while ((match = italicRegex.exec(text)) !== null) {
      const start = match.index - offset;
      const content = match[1];
      const end = start + content.length;

      styles.push({
        start,
        end,
        format: { italic: true }
      });

      processedText = processedText.replace(match[0], content);
      offset += 2;
    }

    return { text: processedText, styles };
  }
}

// Singleton instance
export const docsOAuthService = new GoogleDocsOAuthService();
