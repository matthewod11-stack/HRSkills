/**
 * Workflow Detection Tests
 *
 * Comprehensive test suite to validate 95%+ accuracy target for workflow detection
 */

import { describe, it, expect } from '@jest/globals'
import {
  detectWorkflow,
  detectDocumentType,
  detectEmployeeMention,
  detectDepartmentMention,
  isActionIntent,
  isAnalysisIntent,
  validateDetection,
  buildDetectionContext
} from '../detection'
import type { WorkflowId } from '../types'

describe('Workflow Detection', () => {
  // ========================================================================
  // HIRING WORKFLOW TESTS
  // ========================================================================

  describe('HIRING workflow detection', () => {
    it('should detect job description queries', () => {
      const testCases = [
        'Write a job description for a senior engineer',
        'Can you help me create a JD?',
        'Draft a job posting for marketing manager',
        'Review this job description',
        'Update the software engineer JD'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('hiring')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect interview-related queries', () => {
      const testCases = [
        'Create an interview guide for product manager',
        'What interview questions should I ask?',
        'Help me design a candidate scorecard',
        'Generate screening questions for this role'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('hiring')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect offer letter queries', () => {
      const testCases = [
        'Draft an offer letter for Sarah',
        'Create an employment offer',
        'Generate offer package for senior engineer role'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('hiring')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect headcount planning queries', () => {
      const testCases = [
        'Show me the headcount plan for Q4',
        'We need to plan engineering hiring',
        'Create a hiring roadmap for next quarter'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('hiring')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })
  })

  // ========================================================================
  // PERFORMANCE WORKFLOW TESTS
  // ========================================================================

  describe('PERFORMANCE workflow detection', () => {
    it('should detect performance review queries', () => {
      const testCases = [
        'Help me write a performance review for John',
        'Draft a 360 review',
        'Create performance evaluation document',
        'What should I include in this review cycle?'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('performance')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect PIP queries', () => {
      const testCases = [
        'Create a PIP for underperforming employee',
        'Draft a performance improvement plan',
        'John needs a 90-day PIP',
        'Help me write a performance improvement plan'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('performance')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect coaching and 1:1 queries', () => {
      const testCases = [
        'Create a 1:1 agenda template',
        'Help me with one-on-one meetings',
        'Design a coaching plan for my team',
        'What should I discuss in our next 1:1?'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('performance')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect feedback and recognition queries', () => {
      const testCases = [
        'Synthesize 360 feedback for Sarah',
        'Create a recognition program',
        'How do I give constructive feedback?',
        'Design an employee awards program'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('performance')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })
  })

  // ========================================================================
  // ANALYTICS WORKFLOW TESTS
  // ========================================================================

  describe('ANALYTICS workflow detection', () => {
    it('should detect headcount queries', () => {
      const testCases = [
        'Show me engineering headcount',
        'What is the current headcount?',
        'Tell me about headcount by department',
        'How many employees do we have?'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('analytics')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect turnover queries', () => {
      const testCases = [
        'What is our turnover rate?',
        'Show me attrition by department',
        'Analyze retention trends',
        'Why are people leaving engineering?'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('analytics')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect diversity queries', () => {
      const testCases = [
        'Show me diversity metrics',
        'What is our gender representation?',
        'Analyze diversity by department',
        'Create a DEI dashboard'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('analytics')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect engagement queries', () => {
      const testCases = [
        'What is our eNPS score?',
        'Show me engagement by team',
        'Analyze survey results',
        'Who are my flight risks?'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('analytics')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })

    it('should detect comparison and trend queries', () => {
      const testCases = [
        'Compare engineering to sales headcount',
        'Show me trends over the last quarter',
        'What changed in the diversity metrics?',
        'Breakdown by department and location'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('analytics')
        expect(result.confidence).toBeGreaterThanOrEqual(75)
      })
    })
  })

  // ========================================================================
  // GENERAL FALLBACK TESTS
  // ========================================================================

  describe('GENERAL workflow fallback', () => {
    it('should fallback to general for ambiguous queries', () => {
      const testCases = [
        'Hello',
        'What can you help me with?',
        'I need assistance',
        'Can you help?'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('general')
        expect(result.confidence).toBeLessThan(75)
      })
    })

    it('should fallback to general for non-HR queries', () => {
      const testCases = [
        'What is the weather today?',
        'Tell me a joke',
        'How do I cook pasta?'
      ]

      testCases.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('general')
      })
    })
  })

  // ========================================================================
  // CONTEXT-BASED ROUTING TESTS
  // ========================================================================

  describe('Context-based document type detection', () => {
    it('should route offer letters to HIRING', () => {
      const result = detectDocumentType('Create an offer letter for Sarah')
      expect(result).not.toBeNull()
      expect(result?.workflowId).toBe('hiring')
      expect(result?.documentType).toBe('offer_letter')
    })

    it('should route PIPs to PERFORMANCE', () => {
      const result = detectDocumentType('Draft a PIP for John')
      expect(result).not.toBeNull()
      expect(result?.workflowId).toBe('performance')
      expect(result?.documentType).toBe('pip')
    })

    it('should route termination letters to OFFBOARDING', () => {
      const result = detectDocumentType('Create a termination letter')
      expect(result).not.toBeNull()
      expect(result?.workflowId).toBe('offboarding')
      expect(result?.documentType).toBe('termination_letter')
    })

    it('should route job descriptions to HIRING', () => {
      const result = detectDocumentType('Write a job description')
      expect(result).not.toBeNull()
      expect(result?.workflowId).toBe('hiring')
      expect(result?.documentType).toBe('job_description')
    })
  })

  // ========================================================================
  // CONVERSATION CONTINUITY TESTS
  // ========================================================================

  describe('Conversation continuity boost', () => {
    it('should boost current workflow when conversation continues', () => {
      const message = 'What about interview questions?'

      // Without context - might match hiring or performance
      const withoutContext = buildDetectionContext(message)
      const resultWithout = detectWorkflow(withoutContext)

      // With HIRING context - should strongly prefer hiring
      const withContext = buildDetectionContext(message, [], 'hiring')
      const resultWith = detectWorkflow(withContext)

      expect(resultWith.workflowId).toBe('hiring')
      expect(resultWith.confidence).toBeGreaterThan(resultWithout.confidence)
    })
  })

  // ========================================================================
  // HELPER FUNCTION TESTS
  // ========================================================================

  describe('Helper detection functions', () => {
    describe('detectEmployeeMention', () => {
      it('should detect employee names', () => {
        expect(detectEmployeeMention('Create a review for John Smith')).toBe('John Smith')
        expect(detectEmployeeMention('About Sarah Johnson')).toBe('Sarah Johnson')
        expect(detectEmployeeMention("John's performance review")).toBe('John')
      })

      it('should return null when no employee mentioned', () => {
        expect(detectEmployeeMention('Create a general review template')).toBeNull()
      })
    })

    describe('detectDepartmentMention', () => {
      it('should detect department names', () => {
        expect(detectDepartmentMention('Show me engineering headcount')).toBe('Engineering')
        expect(detectDepartmentMention('Sales team turnover')).toBe('Sales')
        expect(detectDepartmentMention('marketing metrics')).toBe('Marketing')
      })

      it('should return null when no department mentioned', () => {
        expect(detectDepartmentMention('Show me overall headcount')).toBeNull()
      })
    })

    describe('isActionIntent', () => {
      it('should detect action verbs', () => {
        expect(isActionIntent('Create a job description')).toBe(true)
        expect(isActionIntent('Draft an offer letter')).toBe(true)
        expect(isActionIntent('Send email to candidates')).toBe(true)
        expect(isActionIntent('Help me write a PIP')).toBe(true)
      })

      it('should return false for information queries', () => {
        expect(isActionIntent('What is the headcount?')).toBe(false)
        expect(isActionIntent('Show me turnover rates')).toBe(false)
      })
    })

    describe('isAnalysisIntent', () => {
      it('should detect analysis queries', () => {
        expect(isAnalysisIntent('Why is turnover high?')).toBe(true)
        expect(isAnalysisIntent('Analyze performance trends')).toBe(true)
        expect(isAnalysisIntent('What changed in Q2?')).toBe(true)
        expect(isAnalysisIntent('Compare engineering to sales')).toBe(true)
      })

      it('should return false for simple data queries', () => {
        expect(isAnalysisIntent('Show me headcount')).toBe(false)
        expect(isAnalysisIntent('List all employees')).toBe(false)
      })
    })
  })

  // ========================================================================
  // ACCURACY VALIDATION TEST
  // ========================================================================

  describe('Overall accuracy validation', () => {
    it('should achieve 95%+ accuracy on test set', () => {
      const testCases: Array<{ message: string; expectedWorkflow: WorkflowId }> = [
        // HIRING
        { message: 'Write a job description for senior engineer', expectedWorkflow: 'hiring' },
        { message: 'Create interview guide', expectedWorkflow: 'hiring' },
        { message: 'Draft offer letter', expectedWorkflow: 'hiring' },
        { message: 'We need to hire 5 engineers', expectedWorkflow: 'hiring' },
        { message: 'Create candidate scorecard', expectedWorkflow: 'hiring' },

        // PERFORMANCE
        { message: 'Write a performance review for John', expectedWorkflow: 'performance' },
        { message: 'Create a PIP', expectedWorkflow: 'performance' },
        { message: 'Draft 1:1 agenda', expectedWorkflow: 'performance' },
        { message: 'Synthesize 360 feedback', expectedWorkflow: 'performance' },
        { message: 'John is underperforming', expectedWorkflow: 'performance' },

        // ANALYTICS
        { message: 'Show me engineering headcount', expectedWorkflow: 'analytics' },
        { message: 'What is our turnover rate?', expectedWorkflow: 'analytics' },
        { message: 'Who are my flight risks?', expectedWorkflow: 'analytics' },
        { message: 'Analyze diversity metrics', expectedWorkflow: 'analytics' },
        { message: 'Compare Q1 to Q2 headcount', expectedWorkflow: 'analytics' },

        // GENERAL
        { message: 'Hello', expectedWorkflow: 'general' },
        { message: 'What can you do?', expectedWorkflow: 'general' },
        { message: 'Help me', expectedWorkflow: 'general' }
      ]

      const validation = validateDetection(testCases)

      console.log(`\nWorkflow Detection Accuracy: ${validation.accuracy.toFixed(2)}%`)

      if (validation.failures.length > 0) {
        console.log('\nFailures:')
        validation.failures.forEach(failure => {
          console.log(`  - "${failure.message}"`)
          console.log(`    Expected: ${failure.expected}, Got: ${failure.actual} (confidence: ${failure.confidence})`)
        })
      }

      expect(validation.accuracy).toBeGreaterThanOrEqual(95)
    })
  })

  // ========================================================================
  // EDGE CASE TESTS
  // ========================================================================

  describe('Edge cases', () => {
    it('should handle empty messages', () => {
      const context = buildDetectionContext('')
      const result = detectWorkflow(context)
      expect(result.workflowId).toBe('general')
    })

    it('should handle very long messages', () => {
      const longMessage = 'I need help with ' + 'creating a job description '.repeat(50)
      const context = buildDetectionContext(longMessage)
      const result = detectWorkflow(context)
      expect(result.workflowId).toBe('hiring')
    })

    it('should handle messages with special characters', () => {
      const message = 'Create JD for Sr. Engineer ($150k-$200k) !@#$%'
      const context = buildDetectionContext(message)
      const result = detectWorkflow(context)
      expect(result.workflowId).toBe('hiring')
    })

    it('should handle case variations', () => {
      const variations = [
        'SHOW ME ENGINEERING HEADCOUNT',
        'show me engineering headcount',
        'ShOw Me EnGiNeErInG HeAdCoUnT'
      ]

      variations.forEach(message => {
        const context = buildDetectionContext(message)
        const result = detectWorkflow(context)
        expect(result.workflowId).toBe('analytics')
      })
    })
  })
})
