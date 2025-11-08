import { google } from 'googleapis';
import { googleClient } from './client';
import type { GoogleDocRequest, GoogleDocResponse } from './types';

/**
 * Google Docs Integration
 * Handles document creation and markdown-to-Docs conversion
 */

interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: { magnitude: number; unit: string };
}

interface ParagraphStyle {
  namedStyleType?: string;
  alignment?: string;
  indentFirstLine?: { magnitude: number; unit: string };
  indentStart?: { magnitude: number; unit: string };
  spaceAbove?: { magnitude: number; unit: string };
  spaceBelow?: { magnitude: number; unit: string };
}

export class GoogleDocsService {
  private docs;

  constructor() {
    const auth = googleClient.getAuth();
    this.docs = google.docs({ version: 'v1', auth });
  }

  /**
   * Create a new Google Doc from markdown content
   */
  async createDocumentFromMarkdown(request: GoogleDocRequest): Promise<GoogleDocResponse> {
    // Step 1: Create empty document via Drive API (to avoid quota issues)
    const drive = google.drive({ version: 'v3', auth: googleClient.getAuth() });

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
      await this.docs.documents.batchUpdate({
        documentId,
        requestBody: { requests }
      });
    }

    // Step 4: Transfer ownership to user (to avoid service account quota issues)
    const userEmail = process.env.GOOGLE_ADMIN_EMAIL;
    if (userEmail) {
      try {
        await drive.permissions.create({
          fileId: documentId,
          requestBody: {
            type: 'user',
            role: 'owner',
            emailAddress: userEmail
          },
          transferOwnership: true
        });
      } catch (permError) {
        console.warn('Failed to transfer ownership, document may remain with service account:', permError.message);
      }
    }

    // Step 5: Get final document data
    const doc = await this.docs.documents.get({ documentId });

    return {
      documentId,
      title: doc.data.title!,
      webViewLink: `https://docs.google.com/document/d/${documentId}/view`,
      editLink: `https://docs.google.com/document/d/${documentId}/edit`
    };
  }

  /**
   * Convert markdown to Google Docs API batch requests
   */
  private markdownToDocsRequests(markdown: string): any[] {
    const requests: any[] = [];
    const lines = markdown.split('\n');
    let currentIndex = 1; // Start after the initial newline

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines but add paragraph break
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

      // Headers (##, ###, etc.)
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

      // Bullet lists (- or *)
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

        const styledText = this.parseInlineStyles(text);
        if (styledText.length > 0) {
          this.applyInlineStyles(requests, currentIndex, styledText);
        }

        currentIndex += text.length + 1;
        continue;
      }

      // Numbered lists (1. , 2. , etc.)
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

        const styledText = this.parseInlineStyles(text);
        if (styledText.length > 0) {
          this.applyInlineStyles(requests, currentIndex, styledText);
        }

        currentIndex += text.length + 1;
        continue;
      }

      // Regular paragraph
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: line + '\n'
        }
      });

      // Apply inline styles (bold, italic)
      const styledText = this.parseInlineStyles(line);
      if (styledText.length > 0) {
        this.applyInlineStyles(requests, currentIndex, styledText);
      }

      currentIndex += line.length + 1;
    }

    return requests;
  }

  /**
   * Parse inline markdown styles (**, *, etc.)
   */
  private parseInlineStyles(text: string): Array<{ start: number; end: number; style: TextStyle }> {
    const styles: Array<{ start: number; end: number; style: TextStyle }> = [];

    // Bold (**text**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = boldRegex.exec(text)) !== null) {
      styles.push({
        start: match.index,
        end: match.index + match[1].length + 4,
        style: { bold: true }
      });
    }

    // Italic (*text*)
    const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
    while ((match = italicRegex.exec(text)) !== null) {
      styles.push({
        start: match.index,
        end: match.index + match[1].length + 2,
        style: { italic: true }
      });
    }

    return styles;
  }

  /**
   * Apply inline text styles to requests
   */
  private applyInlineStyles(
    requests: any[],
    baseIndex: number,
    styles: Array<{ start: number; end: number; style: TextStyle }>
  ): void {
    // First, remove markdown syntax
    for (const styleInfo of styles.reverse()) {
      const { start, end, style } = styleInfo;

      // Determine markdown syntax to remove
      let syntaxLength = 0;
      if (style.bold) syntaxLength = 2; // **
      if (style.italic) syntaxLength = 1; // *

      // Remove ending syntax
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: baseIndex + end - syntaxLength,
            endIndex: baseIndex + end
          }
        }
      });

      // Remove starting syntax
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: baseIndex + start,
            endIndex: baseIndex + start + syntaxLength
          }
        }
      });

      // Apply text style
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: baseIndex + start,
            endIndex: baseIndex + end - (syntaxLength * 2)
          },
          textStyle: style,
          fields: Object.keys(style).join(',')
        }
      });
    }
  }

  /**
   * Get document content as plain text
   */
  async getDocumentText(documentId: string): Promise<string> {
    const doc = await this.docs.documents.get({ documentId });

    if (!doc.data.body?.content) return '';

    let text = '';
    for (const element of doc.data.body.content) {
      if (element.paragraph) {
        for (const el of element.paragraph.elements || []) {
          if (el.textRun?.content) {
            text += el.textRun.content;
          }
        }
      }
    }

    return text;
  }

  /**
   * Share document with specific users
   */
  async shareDocument(
    documentId: string,
    emails: string[],
    role: 'reader' | 'writer' | 'commenter' = 'reader'
  ): Promise<void> {
    const drive = google.drive({ version: 'v3', auth: googleClient.getAuth() });

    await Promise.all(
      emails.map(email =>
        drive.permissions.create({
          fileId: documentId,
          requestBody: {
            type: 'user',
            role,
            emailAddress: email
          },
          sendNotificationEmail: true
        })
      )
    );
  }
}

// Singleton instance
export const docsService = new GoogleDocsService();
