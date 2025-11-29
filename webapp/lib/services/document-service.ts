/**
 * Document Service Layer
 *
 * Provides CRUD operations for documents with validation, version tracking,
 * and soft delete capabilities.
 */

import { and, desc, eq, like, or, type SQL, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { type Document, documents, type NewDocument } from '@/db/schema';
import { db } from '@/lib/db';

export interface CreateDocumentInput {
  type: string;
  title: string;
  content: string;
  employeeId?: string | null;
  status?: 'draft' | 'final';
  metadataJson?: string | null;
  googleDocId?: string | null;
  googleDriveUrl?: string | null;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  status?: 'draft' | 'final';
  employeeId?: string | null;
  metadataJson?: string | null;
  googleDocId?: string | null;
  googleDriveUrl?: string | null;
}

export interface DocumentFilters {
  type?: string;
  status?: 'draft' | 'final';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DocumentListResult {
  documents: Document[];
  total: number;
  hasMore: boolean;
}

/**
 * Create a new document
 * Defaults to 'draft' status for chat-created documents
 */
export async function createDocument(data: CreateDocumentInput): Promise<Document> {
  const id = `doc_${uuidv4()}`;

  const newDocument: NewDocument = {
    id,
    type: data.type,
    title: data.title,
    content: data.content,
    employeeId: data.employeeId || null,
    status: data.status || 'draft',
    metadataJson: data.metadataJson || null,
    googleDocId: data.googleDocId || null,
    googleDriveUrl: data.googleDriveUrl || null,
  };

  const result = await db.insert(documents).values(newDocument).returning();

  if (!result || result.length === 0) {
    throw new Error('Failed to create document');
  }

  return result[0];
}

/**
 * Update an existing document
 * Updates the updatedAt timestamp automatically
 */
export async function updateDocument(id: string, updates: UpdateDocumentInput): Promise<Document> {
  const updateData: Partial<NewDocument> = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const result = await db.update(documents).set(updateData).where(eq(documents.id, id)).returning();

  if (!result || result.length === 0) {
    throw new Error(`Document not found: ${id}`);
  }

  return result[0];
}

/**
 * List documents with optional filters and pagination
 * Supports search by title and content
 * Single-user mode: removed employeeId filtering
 */
export async function listDocuments(filters: DocumentFilters = {}): Promise<DocumentListResult> {
  const { type, status, search, limit = 20, offset = 0 } = filters;

  // Build WHERE clauses
  const conditions: SQL[] = [];

  if (type) {
    conditions.push(eq(documents.type, type));
  }

  if (status) {
    conditions.push(eq(documents.status, status));
  }

  if (search) {
    // Search in title and content (case-insensitive)
    const searchPattern = `%${search}%`;
    conditions.push(
      or(like(documents.title, searchPattern), like(documents.content, searchPattern))!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Execute query with pagination
  const [documentsResult, countResult] = await Promise.all([
    db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(documents).where(whereClause),
  ]);

  const total = countResult[0]?.count || 0;
  const hasMore = offset + documentsResult.length < total;

  return {
    documents: documentsResult,
    total,
    hasMore,
  };
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string): Promise<Document | null> {
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);

  return result[0] || null;
}

/**
 * Finalize a draft document (transition draft → final)
 * This operation is one-way and cannot be reversed
 */
export async function finalizeDocument(id: string): Promise<Document> {
  const document = await getDocument(id);

  if (!document) {
    throw new Error(`Document not found: ${id}`);
  }

  if (document.status === 'final') {
    throw new Error('Document is already finalized');
  }

  return await updateDocument(id, { status: 'final' });
}

/**
 * Soft delete a document
 * In the future, we could add a 'deleted' status instead of hard delete
 * For now, we'll use hard delete with audit logging
 *
 * Note: Audit logging is handled in the API route layer to ensure
 * complete request context (user, IP, user agent, etc.) is captured
 */
export async function deleteDocument(id: string): Promise<void> {
  const result = await db.delete(documents).where(eq(documents.id, id)).returning();

  if (!result || result.length === 0) {
    throw new Error(`Document not found: ${id}`);
  }
}

/**
 * Get document count by type (for analytics)
 */
export async function getDocumentCountByType(): Promise<Record<string, number>> {
  const result = await db
    .select({
      type: documents.type,
      count: sql<number>`count(*)`,
    })
    .from(documents)
    .groupBy(documents.type);

  return result.reduce(
    (acc, row) => {
      acc[row.type] = row.count;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Get recent documents for a specific employee
 */
export async function getEmployeeDocuments(
  employeeId: string,
  limit: number = 10
): Promise<Document[]> {
  return await db
    .select()
    .from(documents)
    .where(eq(documents.employeeId, employeeId))
    .orderBy(desc(documents.createdAt))
    .limit(limit);
}
