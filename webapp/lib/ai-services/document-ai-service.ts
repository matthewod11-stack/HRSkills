/**
 * Document AI Service
 *
 * Provides document processing capabilities using Google Cloud Document AI:
 * - Resume parsing with structured field extraction
 * - Form parsing for W-4, I-9, and other HR forms
 * - General OCR for scanned documents
 * - Table extraction from PDFs
 *
 * Cost: 1,000 pages/month FREE, then $1.50-$10/1000 pages
 *
 * Setup:
 * 1. Enable Document AI API in Google Cloud Console
 * 2. Create processors (Resume Parser, Form Parser, OCR)
 * 3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 4. Set processor IDs in environment variables
 *
 * @see https://cloud.google.com/document-ai/docs
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai'

// Singleton client instance
let documentAIClient: DocumentProcessorServiceClient | null = null

/**
 * Get or create Document AI client
 */
function getDocumentAIClient(): DocumentProcessorServiceClient {
  if (!documentAIClient) {
    try {
      documentAIClient = new DocumentProcessorServiceClient()
    } catch (error) {
      console.error('Failed to initialize Document AI client:', error)
      throw new Error('Document AI client initialization failed')
    }
  }
  return documentAIClient
}

/**
 * Check if Document AI is available
 */
export async function isDocumentAIAvailable(): Promise<boolean> {
  try {
    const client = getDocumentAIClient()
    // Simple test - try to get project info
    return true
  } catch (error) {
    console.error('Document AI not available:', error)
    return false
  }
}

// ============================================
// TypeScript Interfaces
// ============================================

export interface ResumeData {
  // Personal Information
  name?: string
  email?: string
  phone?: string
  address?: string
  linkedin?: string
  website?: string

  // Professional Summary
  summary?: string
  objective?: string

  // Experience
  experience: WorkExperience[]

  // Education
  education: Education[]

  // Skills
  skills: string[]
  skillCategories?: Record<string, string[]>

  // Additional
  certifications?: string[]
  languages?: string[]
  awards?: string[]

  // Metadata
  rawText?: string
  confidence?: number
  extractedAt?: string
}

export interface WorkExperience {
  company: string
  title: string
  location?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description?: string
  achievements?: string[]
}

export interface Education {
  institution: string
  degree?: string
  field?: string
  graduationDate?: string
  gpa?: string
  honors?: string[]
}

export interface FormField {
  name: string
  value: string
  confidence: number
  type: 'text' | 'number' | 'date' | 'checkbox' | 'signature'
  page?: number
}

export interface FormParseResult {
  fields: FormField[]
  tables?: TableData[]
  rawText?: string
  confidence?: number
  formType?: string
}

export interface TableData {
  headers: string[]
  rows: string[][]
  page?: number
}

export interface OCRResult {
  text: string
  confidence: number
  pages: OCRPage[]
  tables?: TableData[]
  entities?: DetectedEntity[]
}

export interface OCRPage {
  pageNumber: number
  text: string
  confidence: number
  blocks?: TextBlock[]
}

export interface TextBlock {
  text: string
  confidence: number
  boundingBox?: BoundingBox
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectedEntity {
  type: string // 'PERSON', 'DATE', 'ORGANIZATION', 'LOCATION', 'EMAIL', 'PHONE'
  mentionText: string
  confidence: number
}

export interface DocumentProcessingConfig {
  processorId?: string
  projectId?: string
  location?: string
  skipHumanReview?: boolean
  extractTables?: boolean
  extractEntities?: boolean
  ocrLanguages?: string[]
}

// ============================================
// Resume Parsing
// ============================================

/**
 * Parse a resume PDF/image and extract structured information
 */
export async function parseResume(
  documentBuffer: Buffer,
  config: DocumentProcessingConfig = {}
): Promise<ResumeData> {
  try {
    const client = getDocumentAIClient()

    // Use environment variable for processor ID if not provided
    const processorId = config.processorId || process.env.DOCUMENT_AI_RESUME_PROCESSOR_ID
    const projectId = config.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id'
    const location = config.location || process.env.DOCUMENT_AI_LOCATION || 'us'

    if (!processorId) {
      // Graceful degradation - return basic OCR extraction
      console.warn('Resume processor not configured, using basic text extraction')
      return await extractResumeFromOCR(documentBuffer)
    }

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`

    const request = {
      name,
      rawDocument: {
        content: documentBuffer.toString('base64'),
        mimeType: 'application/pdf',
      },
      skipHumanReview: config.skipHumanReview !== false,
    }

    const [result] = await client.processDocument(request)
    const document = result.document

    if (!document) {
      throw new Error('No document returned from processor')
    }

    // Extract structured data from Document AI result
    const resumeData: ResumeData = {
      experience: [],
      education: [],
      skills: [],
      rawText: document.text || '',
      confidence: calculateAverageConfidence(document),
      extractedAt: new Date().toISOString(),
    }

    // Parse entities from the document
    if (document.entities) {
      for (const entity of document.entities) {
        const entityType = entity.type || ''
        const mentionText = entity.mentionText || ''

        switch (entityType) {
          case 'person_name':
          case 'name':
            resumeData.name = mentionText
            break
          case 'email':
          case 'email_address':
            resumeData.email = mentionText
            break
          case 'phone':
          case 'phone_number':
            resumeData.phone = mentionText
            break
          case 'address':
            resumeData.address = mentionText
            break
          case 'linkedin':
          case 'linkedin_url':
            resumeData.linkedin = mentionText
            break
          case 'website':
          case 'url':
            resumeData.website = mentionText
            break
          case 'summary':
          case 'professional_summary':
            resumeData.summary = mentionText
            break
          case 'work_experience':
          case 'job':
            resumeData.experience.push(parseWorkExperience(entity))
            break
          case 'education':
            resumeData.education.push(parseEducation(entity))
            break
          case 'skill':
          case 'skills':
            resumeData.skills.push(mentionText)
            break
          case 'certification':
            if (!resumeData.certifications) resumeData.certifications = []
            resumeData.certifications.push(mentionText)
            break
          case 'language':
            if (!resumeData.languages) resumeData.languages = []
            resumeData.languages.push(mentionText)
            break
        }
      }
    }

    return resumeData
  } catch (error) {
    console.error('Resume parsing error:', error)
    // Graceful degradation
    return await extractResumeFromOCR(documentBuffer)
  }
}

/**
 * Parse work experience from entity
 */
function parseWorkExperience(entity: any): WorkExperience {
  const experience: WorkExperience = {
    company: '',
    title: '',
  }

  if (entity.properties) {
    for (const prop of entity.properties) {
      const propType = prop.type || ''
      const value = prop.mentionText || ''

      switch (propType) {
        case 'company':
        case 'employer':
          experience.company = value
          break
        case 'job_title':
        case 'title':
          experience.title = value
          break
        case 'location':
          experience.location = value
          break
        case 'start_date':
          experience.startDate = value
          break
        case 'end_date':
          experience.endDate = value
          break
        case 'description':
          experience.description = value
          break
      }
    }
  }

  return experience
}

/**
 * Parse education from entity
 */
function parseEducation(entity: any): Education {
  const education: Education = {
    institution: '',
  }

  if (entity.properties) {
    for (const prop of entity.properties) {
      const propType = prop.type || ''
      const value = prop.mentionText || ''

      switch (propType) {
        case 'school':
        case 'institution':
        case 'university':
          education.institution = value
          break
        case 'degree':
          education.degree = value
          break
        case 'field':
        case 'major':
          education.field = value
          break
        case 'graduation_date':
          education.graduationDate = value
          break
        case 'gpa':
          education.gpa = value
          break
      }
    }
  }

  return education
}

/**
 * Fallback: Extract resume data using basic OCR + pattern matching
 */
async function extractResumeFromOCR(documentBuffer: Buffer): Promise<ResumeData> {
  const ocrResult = await performOCR(documentBuffer)

  const resumeData: ResumeData = {
    experience: [],
    education: [],
    skills: [],
    rawText: ocrResult.text,
    confidence: ocrResult.confidence,
    extractedAt: new Date().toISOString(),
  }

  // Extract email using regex
  const emailMatch = ocrResult.text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  if (emailMatch) {
    resumeData.email = emailMatch[0]
  }

  // Extract phone using regex
  const phoneMatch = ocrResult.text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)
  if (phoneMatch) {
    resumeData.phone = phoneMatch[0]
  }

  // Extract entities for names, skills, etc.
  if (ocrResult.entities) {
    for (const entity of ocrResult.entities) {
      if (entity.type === 'PERSON' && !resumeData.name) {
        resumeData.name = entity.mentionText
      }
    }
  }

  return resumeData
}

// ============================================
// Form Parsing (W-4, I-9, etc.)
// ============================================

/**
 * Parse a form (W-4, I-9, etc.) and extract field values
 */
export async function parseForm(
  documentBuffer: Buffer,
  config: DocumentProcessingConfig = {}
): Promise<FormParseResult> {
  try {
    const client = getDocumentAIClient()

    const processorId = config.processorId || process.env.DOCUMENT_AI_FORM_PROCESSOR_ID
    const projectId = config.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id'
    const location = config.location || process.env.DOCUMENT_AI_LOCATION || 'us'

    if (!processorId) {
      console.warn('Form processor not configured, using basic OCR')
      const ocrResult = await performOCR(documentBuffer, { extractTables: true })
      return {
        fields: [],
        tables: ocrResult.tables,
        rawText: ocrResult.text,
        confidence: ocrResult.confidence,
      }
    }

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`

    const request = {
      name,
      rawDocument: {
        content: documentBuffer.toString('base64'),
        mimeType: 'application/pdf',
      },
      skipHumanReview: config.skipHumanReview !== false,
    }

    const [result] = await client.processDocument(request)
    const document = result.document

    if (!document) {
      throw new Error('No document returned from processor')
    }

    const formResult: FormParseResult = {
      fields: [],
      rawText: document.text || '',
      confidence: calculateAverageConfidence(document),
    }

    // Extract form fields
    if (document.entities) {
      for (const entity of document.entities) {
        formResult.fields.push({
          name: entity.type || 'unknown',
          value: entity.mentionText || '',
          confidence: entity.confidence || 0,
          type: inferFieldType(entity.type || ''),
        })
      }
    }

    // Extract tables
    if (document.pages) {
      formResult.tables = []
      for (const page of document.pages) {
        if (page.tables) {
          for (const table of page.tables) {
            formResult.tables.push(parseTable(table, document.text || ''))
          }
        }
      }
    }

    // Detect form type
    formResult.formType = detectFormType(formResult.fields, formResult.rawText || '')

    return formResult
  } catch (error) {
    console.error('Form parsing error:', error)
    // Graceful degradation
    const ocrResult = await performOCR(documentBuffer, { extractTables: true })
    return {
      fields: [],
      tables: ocrResult.tables,
      rawText: ocrResult.text,
      confidence: ocrResult.confidence,
    }
  }
}

/**
 * Infer field type from field name
 */
function inferFieldType(fieldName: string): FormField['type'] {
  const lowerName = fieldName.toLowerCase()

  if (lowerName.includes('date') || lowerName.includes('dob')) return 'date'
  if (lowerName.includes('sign')) return 'signature'
  if (lowerName.includes('check') || lowerName.includes('agree')) return 'checkbox'
  if (lowerName.includes('age') || lowerName.includes('year') || lowerName.includes('ssn')) return 'number'

  return 'text'
}

/**
 * Detect form type from fields and text
 */
function detectFormType(fields: FormField[], text: string): string {
  const lowerText = text.toLowerCase()

  if (lowerText.includes('form w-4') || lowerText.includes('employee\'s withholding')) {
    return 'W-4'
  }
  if (lowerText.includes('form i-9') || lowerText.includes('employment eligibility')) {
    return 'I-9'
  }
  if (lowerText.includes('w-2') || lowerText.includes('wage and tax statement')) {
    return 'W-2'
  }
  if (lowerText.includes('performance review') || lowerText.includes('evaluation')) {
    return 'Performance Review'
  }

  return 'Unknown Form'
}

// ============================================
// General OCR
// ============================================

/**
 * Perform OCR on a document (PDF or image)
 */
export async function performOCR(
  documentBuffer: Buffer,
  config: DocumentProcessingConfig = {}
): Promise<OCRResult> {
  try {
    const client = getDocumentAIClient()

    const processorId = config.processorId || process.env.DOCUMENT_AI_OCR_PROCESSOR_ID
    const projectId = config.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id'
    const location = config.location || process.env.DOCUMENT_AI_LOCATION || 'us'

    if (!processorId) {
      throw new Error('OCR processor not configured')
    }

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`

    const request = {
      name,
      rawDocument: {
        content: documentBuffer.toString('base64'),
        mimeType: detectMimeType(documentBuffer),
      },
      skipHumanReview: true,
    }

    const [result] = await client.processDocument(request)
    const document = result.document

    if (!document) {
      throw new Error('No document returned from processor')
    }

    const ocrResult: OCRResult = {
      text: document.text || '',
      confidence: calculateAverageConfidence(document),
      pages: [],
    }

    // Extract page-level text
    if (document.pages) {
      for (let i = 0; i < document.pages.length; i++) {
        const page = document.pages[i]

        ocrResult.pages.push({
          pageNumber: i + 1,
          text: extractPageText(page, document.text || ''),
          confidence: calculatePageConfidence(page),
        })
      }
    }

    // Extract tables if requested
    if (config.extractTables && document.pages) {
      ocrResult.tables = []
      for (const page of document.pages) {
        if (page.tables) {
          for (const table of page.tables) {
            ocrResult.tables.push(parseTable(table, document.text || ''))
          }
        }
      }
    }

    // Extract entities if requested
    if (config.extractEntities && document.entities) {
      ocrResult.entities = []
      for (const entity of document.entities) {
        ocrResult.entities.push({
          type: entity.type || 'UNKNOWN',
          mentionText: entity.mentionText || '',
          confidence: entity.confidence || 0,
        })
      }
    }

    return ocrResult
  } catch (error) {
    console.error('OCR error:', error)
    throw error
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate average confidence from document
 */
function calculateAverageConfidence(document: any): number {
  if (!document.pages || document.pages.length === 0) {
    return 0
  }

  let totalConfidence = 0
  let count = 0

  for (const page of document.pages) {
    if (page.blocks) {
      for (const block of page.blocks) {
        if (block.layout?.confidence) {
          totalConfidence += block.layout.confidence
          count++
        }
      }
    }
  }

  return count > 0 ? totalConfidence / count : 0
}

/**
 * Calculate page confidence
 */
function calculatePageConfidence(page: any): number {
  if (!page.blocks) return 0

  let totalConfidence = 0
  let count = 0

  for (const block of page.blocks) {
    if (block.layout?.confidence) {
      totalConfidence += block.layout.confidence
      count++
    }
  }

  return count > 0 ? totalConfidence / count : 0
}

/**
 * Extract text from a page
 */
function extractPageText(page: any, fullText: string): string {
  if (!page.layout?.textAnchor?.textSegments) {
    return ''
  }

  let pageText = ''
  for (const segment of page.layout.textAnchor.textSegments) {
    const startIndex = parseInt(segment.startIndex || '0')
    const endIndex = parseInt(segment.endIndex || '0')
    pageText += fullText.substring(startIndex, endIndex)
  }

  return pageText
}

/**
 * Parse table from Document AI result
 */
function parseTable(table: any, fullText: string): TableData {
  const tableData: TableData = {
    headers: [],
    rows: [],
  }

  if (!table.headerRows || !table.bodyRows) {
    return tableData
  }

  // Extract headers
  for (const headerRow of table.headerRows) {
    if (headerRow.cells) {
      const headerTexts = headerRow.cells.map((cell: any) => extractCellText(cell, fullText))
      tableData.headers.push(...headerTexts)
    }
  }

  // Extract body rows
  for (const bodyRow of table.bodyRows) {
    if (bodyRow.cells) {
      const rowData = bodyRow.cells.map((cell: any) => extractCellText(cell, fullText))
      tableData.rows.push(rowData)
    }
  }

  return tableData
}

/**
 * Extract text from a table cell
 */
function extractCellText(cell: any, fullText: string): string {
  if (!cell.layout?.textAnchor?.textSegments) {
    return ''
  }

  let cellText = ''
  for (const segment of cell.layout.textAnchor.textSegments) {
    const startIndex = parseInt(segment.startIndex || '0')
    const endIndex = parseInt(segment.endIndex || '0')
    cellText += fullText.substring(startIndex, endIndex)
  }

  return cellText.trim()
}

/**
 * Detect MIME type from buffer
 */
function detectMimeType(buffer: Buffer): string {
  // Check PDF magic number
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf'
  }

  // Check PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png'
  }

  // Check JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg'
  }

  // Check TIFF
  if ((buffer[0] === 0x49 && buffer[1] === 0x49) || (buffer[0] === 0x4D && buffer[1] === 0x4D)) {
    return 'image/tiff'
  }

  // Default to PDF
  return 'application/pdf'
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate processing cost for documents
 * @param pageCount Number of pages processed
 * @param processorType Type of processor used
 * @returns Cost in USD
 */
export function calculateDocumentCost(pageCount: number, processorType: 'resume' | 'form' | 'ocr'): number {
  // First 1000 pages per month are free
  const freePages = 1000
  const billablePages = Math.max(0, pageCount - freePages)

  // Pricing per 1000 pages
  const pricing: Record<string, number> = {
    resume: 10, // Specialized parser: $10/1000 pages
    form: 10,   // Form parser: $10/1000 pages
    ocr: 1.5,   // General OCR: $1.50/1000 pages
  }

  const costPer1000 = pricing[processorType] || 1.5

  return (billablePages / 1000) * costPer1000
}

/**
 * Extract key contact information from resume data
 */
export function extractContactInfo(resumeData: ResumeData): {
  name?: string
  email?: string
  phone?: string
  linkedin?: string
} {
  return {
    name: resumeData.name,
    email: resumeData.email,
    phone: resumeData.phone,
    linkedin: resumeData.linkedin,
  }
}

/**
 * Map resume data to employee schema
 */
export function mapResumeToEmployee(resumeData: ResumeData): any {
  return {
    name: resumeData.name || '',
    email: resumeData.email || '',
    phone: resumeData.phone || '',
    // Skills as tags
    skills: resumeData.skills,
    // Most recent position
    currentTitle: resumeData.experience[0]?.title || '',
    currentCompany: resumeData.experience[0]?.company || '',
    // Education
    education: resumeData.education.map(edu => ({
      degree: edu.degree,
      institution: edu.institution,
      year: edu.graduationDate,
    })),
    // Work history
    workHistory: resumeData.experience.map(exp => ({
      company: exp.company,
      title: exp.title,
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: exp.description,
    })),
  }
}
