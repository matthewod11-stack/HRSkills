import { google } from 'googleapis';
import { googleClient } from './client';
import type { DriveFile, DriveFolder, FileUploadOptions } from './types';

/**
 * Google Drive Integration
 * Handles file/folder operations in Google Drive
 */

export class GoogleDriveService {
  private drive;

  constructor() {
    const auth = googleClient.getAuth();
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    const fileMetadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink'
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      webViewLink: response.data.webViewLink!
    };
  }

  /**
   * Find folder by name (optionally within a parent folder)
   */
  async findFolder(name: string, parentId?: string): Promise<DriveFolder | null> {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;

    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, webViewLink)',
      pageSize: 1
    });

    const files = response.data.files || [];
    if (files.length === 0) return null;

    return {
      id: files[0].id!,
      name: files[0].name!,
      webViewLink: files[0].webViewLink!
    };
  }

  /**
   * Get or create a folder (finds existing or creates new)
   */
  async getOrCreateFolder(name: string, parentId?: string): Promise<DriveFolder> {
    const existing = await this.findFolder(name, parentId);
    if (existing) return existing;

    return this.createFolder(name, parentId);
  }

  /**
   * Create the HR Command Center folder structure
   * Returns the folder IDs for each document type
   */
  async createHRFolderStructure(): Promise<{ [key: string]: DriveFolder }> {
    // Create root folder
    const rootFolder = await this.getOrCreateFolder('HR Command Center');

    // Document type folders
    const folderNames = [
      'Offer Letters',
      'Performance Improvement Plans',
      'Termination Letters',
      'Reference Letters',
      'Promotion Letters',
      'Transfer Letters',
      'Job Descriptions',
      'Interview Guides',
      'Onboarding Plans',
      'Exit Documents',
      'Templates',
      'Policies',
      'Communications'
    ];

    const folders: { [key: string]: DriveFolder } = {
      root: rootFolder
    };

    // Create all subfolders in parallel
    await Promise.all(
      folderNames.map(async (name) => {
        const folder = await this.getOrCreateFolder(name, rootFolder.id);
        // Convert to camelCase key for easy access
        const key = name.toLowerCase().replace(/\s+/g, '_');
        folders[key] = folder;
      })
    );

    return folders;
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(options: FileUploadOptions): Promise<DriveFile> {
    const fileMetadata: any = {
      name: options.fileName,
      mimeType: options.mimeType
    };

    if (options.folderId) {
      fileMetadata.parents = [options.folderId];
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: options.mimeType,
        body: options.content
      },
      fields: 'id, name, webViewLink, mimeType'
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      webViewLink: response.data.webViewLink!,
      mimeType: response.data.mimeType!
    };
  }

  /**
   * List files in a folder
   */
  async listFiles(folderId?: string, pageSize: number = 100): Promise<DriveFile[]> {
    let query = 'trashed=false';

    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, webViewLink, mimeType, createdTime, modifiedTime)',
      pageSize,
      orderBy: 'modifiedTime desc'
    });

    return (response.data.files || []).map(file => ({
      id: file.id!,
      name: file.name!,
      webViewLink: file.webViewLink!,
      mimeType: file.mimeType!,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime
    }));
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
  }

  /**
   * Share a file with specific email addresses
   */
  async shareFile(
    fileId: string,
    emails: string[],
    role: 'reader' | 'writer' | 'commenter' = 'reader'
  ): Promise<void> {
    await Promise.all(
      emails.map(email =>
        this.drive.permissions.create({
          fileId,
          requestBody: {
            type: 'user',
            role,
            emailAddress: email
          }
        })
      )
    );
  }

  /**
   * Make a file publicly viewable (anyone with link)
   */
  async makePublic(fileId: string, role: 'reader' | 'commenter' = 'reader'): Promise<void> {
    await this.drive.permissions.create({
      fileId,
      requestBody: {
        type: 'anyone',
        role
      }
    });
  }
}

// Singleton instance
export const driveService = new GoogleDriveService();
