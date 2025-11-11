import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthClient } from '../../../../../integrations/google/oauth-client';
import { docsOAuthService } from '../../../../../integrations/google/docs-oauth';

export const runtime = 'nodejs';

/**
 * POST /api/documents/export-to-google-docs
 *
 * Export a markdown document to Google Docs using OAuth
 */
export async function POST(request: NextRequest) {
  try {
    // Check if authenticated
    if (!googleOAuthClient.isAuthenticated()) {
      return NextResponse.json(
        {
          error: 'Not authenticated',
          message: 'Please connect your Google account first',
          needsAuth: true,
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, documentType, metadata } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title and content' },
        { status: 400 }
      );
    }

    // Generate filename with metadata
    let documentTitle = title;
    if (metadata?.date || metadata?.employeeName) {
      const datePart = metadata.date || new Date().toISOString().split('T')[0];
      const namePart = metadata.employeeName || '';
      documentTitle = `${datePart}_${documentType}${namePart ? '_' + namePart : ''}`;
    }

    // Create Google Doc in user's shared folder
    const folderId = process.env.HR_DRIVE_FOLDER_ID;
    const doc = await docsOAuthService.createDocumentFromMarkdown({
      title: documentTitle,
      content,
      folderId,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      documentId: doc.documentId,
      title: doc.title,
      webViewLink: doc.webViewLink,
      editLink: doc.editLink,
    });
  } catch (error: any) {
    console.error('Error exporting to Google Docs:', error);

    // Handle auth errors
    if (error.message?.includes('Not authenticated') || error.message?.includes('expired')) {
      return NextResponse.json(
        {
          error: 'Authentication expired',
          message: 'Please reconnect your Google account',
          needsAuth: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to export document', details: error.message },
      { status: 500 }
    );
  }
}
