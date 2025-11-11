Task 3.3: Data Input Hub + Document Library - Detailed Implementation
  Plan

 Overview

 Transform /data-sources into a comprehensive Data Input Hub with
 side-by-side CSV uploads and Document Library, add header navigation,
  and implement draft-based document persistence.

 ---
 Phase 1: Document Persistence Infrastructure (Day 1)

 1.1 Create Document API Routes

 File: /webapp/app/api/documents/route.ts
 - GET: List documents with filters (type, employee, status, search)
   - Query params:
 ?type=offer_letter&status=draft&search=senior&limit=20
   - Return paginated results with metadata
   - Apply RBAC: require documents:read permission
 - POST: Create document (from chat or manual)
   - Body: { type, title, content, employeeId?, status: 'draft' | 
 'final', metadataJson? }
   - Auto-save as draft by default
   - Return document ID and URL

 File: /webapp/app/api/documents/[id]/route.ts
 - GET: Fetch single document with full content
 - PATCH: Update document (content, title, status, metadata)
   - Support status transition: draft → final
 - DELETE: Soft delete with audit log

 Security: All routes use requireAuth(), rate limiting, and audit
 logging

 1.2 Update Document Handler

 File: /webapp/lib/workflows/actions/handlers/document-handler.ts
 - Replace mock URL creation with actual DB insert
 - Use Drizzle ORM: db.insert(documents).values({ ... })
 - Default status: 'draft'
 - Return real document ID: /documents/{id}

 1.3 Add Document Service Layer

 File: /webapp/lib/services/document-service.ts
 - createDocument(data) - Insert with validation
 - updateDocument(id, updates) - Update with version tracking
 - listDocuments(filters) - Query with Drizzle + pagination
 - finalizeDocument(id) - Transition draft → final
 - deleteDocument(id) - Soft delete with audit

 1.4 Update Database Schema (if needed)

 File: /webapp/db/schema.ts
 - Verify status field exists on documents table (add if missing)
 - Add index: CREATE INDEX idx_documents_status ON documents(status)
 - Add index: CREATE INDEX idx_documents_type_created ON 
 documents(type, createdAt DESC)

 ---
 Phase 2: Header Navigation Update (Day 1)

 2.1 Add Data Input Icon to Header

 File: /webapp/app/page.tsx (lines 302-338)
 - Add new icon next to Settings icon (right side)
 - Icon: <Database /> or <Upload /> from lucide-react
 - Link to /data-sources
 - Tooltip: "Upload Data & Documents"

 Layout:
 [Logo] HR Command Center                [Clock] [DataInput Icon]
 [Settings Icon] [User Menu]

 2.2 Update Settings Page Link

 File: /webapp/app/settings/page.tsx
 - Keep existing "Upload CSV" button but update label
 - New label: "Go to Data Input Hub →"
 - Update description to mention document library

 ---
 Phase 3: Data Input Hub - Side-by-Side Layout (Day 2)

 3.1 Restructure Data Sources Page

 File: /webapp/app/data-sources/page.tsx
 - Update layout to two-column grid (60/40 split)
 - Left column: CSV Upload section (existing DataSourceManager)
 - Right column: Document Library preview (new component)

 Layout Structure:
 <div className="grid grid-cols-[3fr_2fr] gap-6">
   {/* Left: CSV Upload */}
   <section>
     <h2>Upload Employee Data</h2>
     <SmartFileUpload />
     <DataSourcesList />
     <DemoCSVHelperCards /> {/* NEW */}
   </section>

   {/* Right: Document Library Preview */}
   <section>
     <h2>Recent Documents</h2>
     <RecentDocumentsWidget /> {/* NEW */}
     <Button href="/documents">View All Documents →</Button>
   </section>
 </div>

 3.2 Create Demo CSV Helper Cards

 File: /webapp/components/custom/DemoCSVHelperCards.tsx
 - Card displaying: "Try dragging these sample files:"
 - Show file paths with copy buttons:
   - /webapp/__tests__/fixtures/sample-employees.csv
   - /webapp/__tests__/fixtures/sample-employees-edge-cases.csv
 - Icon: clipboard with checkmark on copy
 - Helper text: "Drag these files from your file explorer to test
 uploads"

 3.3 Create Recent Documents Widget

 File: /webapp/components/custom/RecentDocumentsWidget.tsx
 - Fetch last 5-10 documents via useSWR('/api/documents?limit=5')
 - Display compact cards with:
   - Document type icon + title
   - Employee name (if linked)
   - Status badge (draft/final)
   - Date created
   - Quick actions: View, Edit, Delete
 - Empty state: "No documents yet. Create one via chat!"
 - Loading skeleton while fetching

 ---
 Phase 4: Full Document Library Page (Day 2-3)

 4.1 Create Documents Page

 File: /webapp/app/documents/page.tsx
 - Full-page document browser (similar to /data-sources layout)
 - Grid/list view toggle
 - Search bar with debounced fuzzy search
 - Filter sidebar (type, employee, status, date range)
 - "Create New" button with type dropdown

 Layout:
 <div className="grid grid-cols-[250px_1fr] gap-6">
   <aside>
     <DocumentFilters />
   </aside>
   <main>
     <DocumentSearchBar />
     <DocumentGrid documents={filteredDocs} />
   </main>
 </div>

 4.2 Create Document Components

 File: /webapp/components/custom/DocumentFilters.tsx
 - Filter by type (checkboxes for each doc type)
 - Filter by status (draft/final radio buttons)
 - Filter by employee (autocomplete search)
 - Date range picker
 - "Clear Filters" button

 File: /webapp/components/custom/DocumentGrid.tsx
 - Responsive grid (3 columns desktop, 2 tablet, 1 mobile)
 - Renders DocumentCard components
 - Pagination footer (20 docs per page)
 - Empty state with illustration + CTA

 File: /webapp/components/custom/DocumentCard.tsx
 - Card with hover effects (framer-motion scale + shadow)
 - Header: Type icon + title
 - Body: Preview (first 100 chars), employee name, date
 - Footer: Status badge + action buttons (View, Edit, Delete)
 - Click card → navigate to /documents/[id]

 File: /webapp/components/custom/DocumentSearchBar.tsx
 - Input with search icon
 - Debounced search (500ms)
 - Keyboard shortcut hint: "Press ⌘K to search"
 - Clear button when text present

 4.3 Create Single Document View

 File: /webapp/app/documents/[id]/page.tsx
 - Fetch document via GET /api/documents/[id]
 - Reuse DocumentEditorPanel component (from context panels)
 - Add header with:
   - Breadcrumb: Documents → [Type] → [Title]
   - Status indicator (draft/final)
   - "Finalize Draft" button (if status = draft)
   - Export to Google Docs button
   - Delete button
 - Show document metadata sidebar:
   - Created date, last updated
   - Linked employee (if any)
   - Document type
   - Tags (from metadataJson)

 ---
 Phase 5: Draft/Final Workflow Integration (Day 3)

 5.1 Update DocumentEditorPanel

 File: /webapp/components/custom/DocumentEditorPanel.tsx
 - Add auto-save indicator: "Saving..." → "Saved as draft ✓"
 - Debounced auto-save (2 seconds after typing stops)
 - Show status banner if document is draft:
   - "This is a draft. Click 'Finalize' when ready."
 - Add "Finalize Document" button:
   - Changes status: draft → final
   - Shows confirmation modal
   - Success: "Document finalized and saved to library"

 5.2 Update Chat Document Creation Flow

 File: /webapp/app/api/chat/route.ts
 - When document action is created via chat:
   - Call DocumentHandler with status: 'draft'
   - Return document ID in chat response
   - Show inline message: "Document saved as draft. [View in Library]"

 5.3 Add Context Panel Draft Indicator

 File: /webapp/components/custom/ContextPanel.tsx
 - When showing document in context panel:
   - Display draft badge if status = draft
   - Show "Finalize Draft" button prominently
   - Auto-save changes to draft every 2 seconds

 ---
 Phase 6: Polish & Testing (Day 3)

 6.1 Add Quick Action Tiles to Dashboard

 File: /webapp/app/page.tsx
 - After chat interface, add quick action section:
   - Tile: Upload Data (icon: Upload, route: /data-sources)
   - Tile: Documents (icon: FileText, route: /documents)
   - Tile: Employees (icon: Users, route: /employees)
   - Tile: Settings (icon: Settings, route: /settings)
 - Use framer-motion for hover animations

 File: /webapp/components/custom/QuickActionTile.tsx
 - Reusable tile component
 - Props: { icon, label, description, href }
 - Hover: scale(1.05) + shadow
 - Click: navigate to href

 6.2 Update Data Source Quick Action Copy

 File: /webapp/app/page.tsx (if quick action tile exists)
 - Update description: "Upload employee data via CSV and manage your
 document library"

 6.3 Testing Checklist

 Unit Tests:
 - Document service CRUD operations
 - Document status transitions (draft → final)
 - Search/filter query builder

 API Integration Tests:
 - GET /api/documents (with various filters)
 - POST /api/documents (create draft)
 - PATCH /api/documents/[id] (finalize draft)
 - DELETE /api/documents/[id] (soft delete)

 E2E Tests:
 - Create document via chat → appears in library as draft
 - Finalize draft → status changes to final
 - Search documents by title
 - Filter documents by type
 - Delete document from library

 Accessibility Tests:
 - DocumentGrid keyboard navigation
 - Screen reader announcements for status changes
 - Focus management in document editor

 ---
 File Checklist

 New Files (10):

 1. /webapp/app/api/documents/route.ts
 2. /webapp/app/api/documents/[id]/route.ts
 3. /webapp/app/documents/page.tsx
 4. /webapp/app/documents/[id]/page.tsx
 5. /webapp/lib/services/document-service.ts
 6. /webapp/components/custom/DemoCSVHelperCards.tsx
 7. /webapp/components/custom/RecentDocumentsWidget.tsx
 8. /webapp/components/custom/DocumentFilters.tsx
 9. /webapp/components/custom/DocumentGrid.tsx
 10. /webapp/components/custom/DocumentCard.tsx

 Modified Files (6):

 1. /webapp/app/page.tsx (header icon + quick action tiles)
 2. /webapp/app/data-sources/page.tsx (side-by-side layout)
 3. /webapp/app/settings/page.tsx (update upload button copy)
 4. /webapp/components/custom/DocumentEditorPanel.tsx (auto-save +
 finalize)
 5. /webapp/lib/workflows/actions/handlers/document-handler.ts (DB
 persistence)
 6. /webapp/db/schema.ts (add status field + indexes if needed)

 Test Files (4):

 1. /webapp/__tests__/lib/services/document-service.test.ts
 2. /webapp/__tests__/api/documents.test.ts
 3. /webapp/e2e/documents.spec.ts
 4. /webapp/__tests__/accessibility/document-library.test.tsx

 ---
 Success Criteria

 - ✅ Header navigation includes Data Input icon next to Settings
 - ✅ /data-sources shows side-by-side: CSV uploads (left) + Recent
 Documents (right)
 - ✅ Demo CSV helper cards display file paths with copy buttons
 - ✅ All documents created via chat auto-save as drafts
 - ✅ Document Library at /documents with search/filter/grid view
 - ✅ "Finalize Draft" workflow transitions status and updates UI
 - ✅ No regressions in existing file upload/delete/preview
 - ✅ Document Library preview works on Data Input page
 - ✅ Quick action tiles provide easy navigation to key pages

 ---
 Estimated Effort: 3 days

 - Day 1: API routes + document persistence + header navigation
 - Day 2: Data Input Hub layout + Document Library page
 - Day 3: Draft/final workflow + polish + testing