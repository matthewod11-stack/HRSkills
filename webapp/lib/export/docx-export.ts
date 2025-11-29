/**
 * DOCX Export Utility
 *
 * Client-side document export using the `docx` package.
 * Converts markdown content to Word documents without server-side processing.
 */

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} from 'docx';

interface DocxExportOptions {
  title?: string;
  author?: string;
  subject?: string;
}

/**
 * Parse markdown content into structured elements
 */
function parseMarkdownLine(
  line: string
): { type: string; content: string; level?: number; cells?: string[] } {
  // Headings
  const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    return {
      type: 'heading',
      level: headingMatch[1].length,
      content: headingMatch[2],
    };
  }

  // Horizontal rule
  if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
    return { type: 'hr', content: '' };
  }

  // Table row
  if (line.includes('|') && !line.match(/^\s*\|?\s*[-:]+\s*\|/)) {
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length > 0) {
      return { type: 'table-row', content: '', cells };
    }
  }

  // Table separator (skip)
  if (line.match(/^\s*\|?\s*[-:]+\s*\|/)) {
    return { type: 'table-separator', content: '' };
  }

  // Bullet list
  if (/^\s*[-*]\s+/.test(line)) {
    return {
      type: 'bullet',
      content: line.replace(/^\s*[-*]\s+/, ''),
    };
  }

  // Numbered list
  if (/^\s*\d+\.\s+/.test(line)) {
    return {
      type: 'numbered',
      content: line.replace(/^\s*\d+\.\s+/, ''),
    };
  }

  // Checkbox
  if (/^\s*\[[ x]\]\s+/.test(line)) {
    const checked = /^\s*\[x\]/i.test(line);
    return {
      type: 'checkbox',
      content: `${checked ? '☑' : '☐'} ${line.replace(/^\s*\[[ x]\]\s+/i, '')}`,
    };
  }

  // Empty line
  if (line.trim() === '') {
    return { type: 'empty', content: '' };
  }

  // Regular paragraph
  return { type: 'paragraph', content: line };
}

/**
 * Convert inline markdown formatting to TextRun elements
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];

  // Simplified inline parsing - handles bold, italic, and bold-italic
  let remaining = text;

  while (remaining.length > 0) {
    // Bold + Italic: ***text*** or ___text___
    const boldItalicMatch = remaining.match(/^(\*{3}|_{3})(.+?)\1/);
    if (boldItalicMatch) {
      runs.push(new TextRun({ text: boldItalicMatch[2], bold: true, italics: true }));
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*{2}|_{2})(.+?)\1/);
    if (boldMatch) {
      runs.push(new TextRun({ text: boldMatch[2], bold: true }));
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch) {
      runs.push(new TextRun({ text: italicMatch[2], italics: true }));
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Code: `text`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      runs.push(
        new TextRun({
          text: codeMatch[1],
          font: 'Courier New',
          shading: { fill: 'f5f5f5' },
        })
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Regular text - find next special character or end
    const nextSpecial = remaining.search(/[*_`]/);
    if (nextSpecial === -1) {
      runs.push(new TextRun({ text: remaining }));
      break;
    } else if (nextSpecial === 0) {
      // Special char that didn't match a pattern, treat as literal
      runs.push(new TextRun({ text: remaining[0] }));
      remaining = remaining.slice(1);
    } else {
      runs.push(new TextRun({ text: remaining.slice(0, nextSpecial) }));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text })];
}

/**
 * Convert heading level to docx HeadingLevel
 */
function getHeadingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    case 6:
      return HeadingLevel.HEADING_6;
    default:
      return HeadingLevel.HEADING_1;
  }
}

/**
 * Build a table from collected rows
 */
function buildTable(rows: string[][]): Table {
  const tableRows = rows.map(
    (cells, rowIndex) =>
      new TableRow({
        children: cells.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: parseInlineFormatting(cell),
                  alignment: AlignmentType.LEFT,
                }),
              ],
              width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
              shading: rowIndex === 0 ? { fill: 'f0f0f0' } : undefined,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
              },
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

/**
 * Convert markdown content to a DOCX document
 */
export async function markdownToDocx(
  content: string,
  options: DocxExportOptions = {}
): Promise<Blob> {
  const lines = content.split('\n');
  const children: (Paragraph | Table)[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseMarkdownLine(lines[i]);

    // Handle table accumulation
    if (parsed.type === 'table-row' && parsed.cells) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(parsed.cells);
      continue;
    }

    if (parsed.type === 'table-separator') {
      // Skip separator rows but stay in table mode
      continue;
    }

    // If we were in a table and hit a non-table row, flush the table
    if (inTable) {
      if (tableRows.length > 0) {
        children.push(buildTable(tableRows));
        children.push(new Paragraph({ text: '' })); // Spacing after table
      }
      inTable = false;
      tableRows = [];
    }

    // Handle different line types
    switch (parsed.type) {
      case 'heading':
        children.push(
          new Paragraph({
            children: parseInlineFormatting(parsed.content),
            heading: getHeadingLevel(parsed.level ?? 1),
            spacing: { before: 240, after: 120 },
          })
        );
        break;

      case 'hr':
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '─'.repeat(50) })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        );
        break;

      case 'bullet':
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '• ' }), ...parseInlineFormatting(parsed.content)],
            indent: { left: 720 },
          })
        );
        break;

      case 'numbered':
        children.push(
          new Paragraph({
            children: parseInlineFormatting(parsed.content),
            indent: { left: 720 },
          })
        );
        break;

      case 'checkbox':
        children.push(
          new Paragraph({
            children: parseInlineFormatting(parsed.content),
            indent: { left: 720 },
          })
        );
        break;

      case 'empty':
        children.push(new Paragraph({ text: '' }));
        break;

      case 'paragraph':
      default:
        if (parsed.content.trim()) {
          children.push(
            new Paragraph({
              children: parseInlineFormatting(parsed.content),
            })
          );
        }
        break;
    }
  }

  // Flush any remaining table
  if (inTable && tableRows.length > 0) {
    children.push(buildTable(tableRows));
  }

  const doc = new Document({
    creator: options.author ?? 'HR Command Center',
    title: options.title ?? 'HR Document',
    subject: options.subject,
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Trigger a browser download of a DOCX file
 */
export function downloadDocx(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (fallbackError) {
      console.error('Failed to copy to clipboard:', fallbackError);
      return false;
    }
  }
}

/**
 * Generate a filename from document type and optional employee name
 */
export function generateFilename(documentType: string, employeeName?: string): string {
  const date = new Date().toISOString().split('T')[0];
  const typePart = documentType.replace(/[\s_]+/g, '-').toLowerCase();
  const namePart = employeeName ? `_${employeeName.trim().replace(/\s+/g, '-')}` : '';

  return `${typePart}${namePart}_${date}.docx`;
}

/**
 * Export content as DOCX and trigger download
 */
export async function exportToDocx(
  content: string,
  documentType: string,
  employeeName?: string
): Promise<void> {
  const filename = generateFilename(documentType, employeeName);
  const blob = await markdownToDocx(content, {
    title: documentType,
    subject: employeeName ? `Document for ${employeeName}` : undefined,
  });
  downloadDocx(blob, filename);
}
