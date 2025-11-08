'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Edit,
  X,
  Globe,
  Linkedin,
} from 'lucide-react'
import type { ResumeData, WorkExperience, Education } from '@/lib/ai-services/document-ai-service'

interface ResumeParserProps {
  onParsed?: (resumeData: ResumeData) => void
  onEmployeeMapping?: (employeeData: any) => void
  className?: string
  showEmployeeMapping?: boolean
}

/**
 * Resume parser component with drag-and-drop upload and structured data preview
 */
export function ResumeParser({
  onParsed,
  onEmployeeMapping,
  className = '',
  showEmployeeMapping = true,
}: ResumeParserProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    setError(null)
    setIsProcessing(true)
    setUploadedFile(file)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('mapToEmployee', showEmployeeMapping ? 'true' : 'false')

      const response = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse resume')
      }

      const parsedData = result.data.resume
      setResumeData(parsedData)
      onParsed?.(parsedData)

      if (showEmployeeMapping && result.data.employeeMapping) {
        onEmployeeMapping?.(result.data.employeeMapping)
      }
    } catch (err) {
      console.error('Resume parsing error:', err)
      setError(err instanceof Error ? err.message : 'Failed to parse resume')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setResumeData(null)
    setUploadedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      {!resumeData && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
            isDragging
              ? 'border-blue-500/50 bg-blue-500/10'
              : 'border-white/20 bg-black/40 hover:border-white/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center text-center space-y-4">
            {isProcessing ? (
              <>
                <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                <h3 className="text-xl font-bold">Parsing Resume...</h3>
                <p className="text-gray-400">
                  Extracting information from {uploadedFile?.name}
                </p>
              </>
            ) : (
              <>
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full">
                  <Upload className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Upload Resume</h3>
                <p className="text-gray-400 max-w-md">
                  Drag and drop a resume PDF or image, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                >
                  Browse Files
                </button>
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, PNG, JPG, TIFF (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-400">Parsing Failed</p>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      {/* Parsed Resume Display */}
      {resumeData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="text-xl font-bold">Resume Parsed Successfully</h3>
                <p className="text-sm text-gray-400">
                  {uploadedFile?.name} • Confidence: {((resumeData.confidence || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
            >
              Upload Another
            </button>
          </div>

          {/* Personal Information */}
          <div className="bg-black/40 border-2 border-white/20 rounded-xl p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Personal Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField icon={User} label="Name" value={resumeData.name} />
              <InfoField icon={Mail} label="Email" value={resumeData.email} />
              <InfoField icon={Phone} label="Phone" value={resumeData.phone} />
              <InfoField icon={MapPin} label="Address" value={resumeData.address} />
              <InfoField icon={Linkedin} label="LinkedIn" value={resumeData.linkedin} />
              <InfoField icon={Globe} label="Website" value={resumeData.website} />
            </div>

            {resumeData.summary && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Professional Summary</p>
                <p className="text-gray-200">{resumeData.summary}</p>
              </div>
            )}
          </div>

          {/* Work Experience */}
          {resumeData.experience.length > 0 && (
            <div className="bg-black/40 border-2 border-white/20 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Work Experience ({resumeData.experience.length})
              </h4>

              <div className="space-y-4">
                {resumeData.experience.map((exp, index) => (
                  <ExperienceCard key={index} experience={exp} />
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resumeData.education.length > 0 && (
            <div className="bg-black/40 border-2 border-white/20 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-400" />
                Education ({resumeData.education.length})
              </h4>

              <div className="space-y-4">
                {resumeData.education.map((edu, index) => (
                  <EducationCard key={index} education={edu} />
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resumeData.skills.length > 0 && (
            <div className="bg-black/40 border-2 border-white/20 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-yellow-400" />
                Skills ({resumeData.skills.length})
              </h4>

              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          {(resumeData.certifications || resumeData.languages || resumeData.awards) && (
            <div className="bg-black/40 border-2 border-white/20 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-400" />
                Additional Information
              </h4>

              <div className="space-y-4">
                {resumeData.certifications && resumeData.certifications.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Certifications</p>
                    <ul className="list-disc list-inside space-y-1">
                      {resumeData.certifications.map((cert, index) => (
                        <li key={index} className="text-gray-200">{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resumeData.languages && resumeData.languages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.languages.map((lang, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {resumeData.awards && resumeData.awards.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Awards & Honors</p>
                    <ul className="list-disc list-inside space-y-1">
                      {resumeData.awards.map((award, index) => (
                        <li key={index} className="text-gray-200">{award}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

/**
 * Info field component
 */
function InfoField({ icon: Icon, label, value }: {
  icon: any
  label: string
  value?: string
}) {
  if (!value) return null

  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
      <Icon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-gray-200 break-words">{value}</p>
      </div>
    </div>
  )
}

/**
 * Experience card component
 */
function ExperienceCard({ experience }: { experience: WorkExperience }) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h5 className="font-bold text-lg">{experience.title}</h5>
          <p className="text-purple-400">{experience.company}</p>
        </div>
        {experience.current && (
          <span className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-400">
            Current
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
        {experience.startDate && (
          <span>{experience.startDate} - {experience.endDate || 'Present'}</span>
        )}
        {experience.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {experience.location}
          </span>
        )}
      </div>

      {experience.description && (
        <p className="text-gray-300 text-sm">{experience.description}</p>
      )}

      {experience.achievements && experience.achievements.length > 0 && (
        <ul className="mt-3 space-y-1">
          {experience.achievements.map((achievement, index) => (
            <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>{achievement}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Education card component
 */
function EducationCard({ education }: { education: Education }) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h5 className="font-bold text-lg">{education.institution}</h5>
          {education.degree && (
            <p className="text-green-400">
              {education.degree}
              {education.field && ` in ${education.field}`}
            </p>
          )}
        </div>
        {education.graduationDate && (
          <span className="text-sm text-gray-400">{education.graduationDate}</span>
        )}
      </div>

      {education.gpa && (
        <p className="text-sm text-gray-400">GPA: {education.gpa}</p>
      )}

      {education.honors && education.honors.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Honors:</p>
          <div className="flex flex-wrap gap-2">
            {education.honors.map((honor, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs"
              >
                {honor}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
