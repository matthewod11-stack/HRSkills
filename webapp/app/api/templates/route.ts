import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthClient } from '../../../../integrations/google/oauth-client';
import { google } from 'googleapis';

export const runtime = 'nodejs';

/**
 * GET /api/templates
 *
 * List all available templates from Google Drive
 * Returns a structured list of templates grouped by skill
 */
export async function GET(request: NextRequest) {
  try {
    // Check if authenticated
    if (!googleOAuthClient.isAuthenticated()) {
      return NextResponse.json({ error: 'Not authenticated with Google Drive' }, { status: 401 });
    }

    // Refresh token if needed
    await googleOAuthClient.refreshTokenIfNeeded();
    const auth = googleOAuthClient.getAuth();
    const drive = google.drive({ version: 'v3', auth });

    // Find the HR Templates folder
    const searchRootResponse = await drive.files.list({
      q: `name='HR Command Center' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      pageSize: 1,
    });

    if (!searchRootResponse.data.files || searchRootResponse.data.files.length === 0) {
      return NextResponse.json(
        { error: 'HR Command Center folder not found', templates: [] },
        { status: 404 }
      );
    }

    const rootFolderId = searchRootResponse.data.files[0].id!;

    // Find Templates subfolder
    const searchTemplatesResponse = await drive.files.list({
      q: `name='Templates' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      pageSize: 1,
    });

    if (!searchTemplatesResponse.data.files || searchTemplatesResponse.data.files.length === 0) {
      return NextResponse.json(
        { error: 'Templates folder not found', templates: [] },
        { status: 404 }
      );
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
    const templates: any[] = [];

    // For each skill folder, get the template files
    for (const skillFolder of skillFolders) {
      const filesResponse = await drive.files.list({
        q: `'${skillFolder.id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
        fields: 'files(id, name, modifiedTime, webViewLink)',
        pageSize: 100,
        orderBy: 'name',
      });

      const files = filesResponse.data.files || [];

      for (const file of files) {
        templates.push({
          id: file.id,
          name: file.name,
          skillName: skillFolder.name,
          modifiedTime: file.modifiedTime,
          webViewLink: file.webViewLink,
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);

    // Handle auth errors
    if (error.message?.includes('Not authenticated') || error.message?.includes('expired')) {
      return NextResponse.json(
        { error: 'Authentication expired', needsAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    );
  }
}
