 Google AI/ML API Integration - 12-Week Implementation Plan

 Overview

 Integrate 6 Google AI/ML APIs into HR Command Center with focus on:
 sentiment analysis, predictive analytics, interview transcription,
 and multilingual support. Budget: ~$50-100/month, leveraging rich
 employee feedback dataset.

 ---
 Phase 1: Foundation (Weeks 1-2) - Natural Language API

 Goal: Analyze employee sentiment at scale

 Tasks:

 1. Install dependencies & create service layer
   - Install @google-cloud/language
   - Create /webapp/lib/ai-services/nlp-service.ts (following DLP
 pattern)
   - Singleton client, graceful degradation, preset configurations
 2. Implement sentiment analysis
   - analyzeSentiment(text) - Returns score (-1 to 1), magnitude,
 category
   - extractEntities(text) - Extract people, places, topics mentioned
   - classifyContent(text) - Categorize feedback themes
   - Batch processing support (100 texts at once)
 3. Integrate with Performance Insights skill
   - Add sentiment scores to performance reviews in
 master-employees.json
   - Create new endpoint: POST /api/ai/analyze-sentiment
   - Process all existing performance review comments (~50+
 employees)
 4. Integrate with Survey Analyzer skill
   - Batch analyze exit interview responses
   - Auto-categorize feedback (comp, manager, growth, culture)
   - Generate sentiment trend report by department
 5. Add analytics dashboard widget
   - "Team Morale" card showing avg sentiment by dept
   - Sentiment trend chart over time
   - Alert for sudden sentiment drops

 Deliverables:
 - NLP service module (200 lines)
 - 2 API endpoints (sentiment, entities)
 - Enhanced Performance Insights skill
 - Analytics dashboard sentiment widgets
 - Test script with real employee data

 Cost: ~$5-10/month (5,000 API calls in free tier, then $1/1000)

 ---
 Phase 2: Multilingual Support (Weeks 3-4) - Translation API

 Goal: Support global workforce with translated documents & surveys

 Tasks:

 1. Install & create translation service
   - Install @google-cloud/translate
   - Create /webapp/lib/ai-services/translation-service.ts
   - Auto-detect language, batch translate, caching
 2. Enhance HR Document Generator skill
   - Add language selector to document generation UI
   - Translate offer letters, PIPs, termination letters
   - Support 10+ languages (Spanish, Mandarin, French, German, etc.)
   - Export translated docs to Google Drive
 3. Enhance Survey Analyzer skill
   - Translate survey questions to employee's language
   - Analyze responses in any language (translate to English first)
   - Multi-language reporting
 4. Add chat translation
   - "Translate this to..." button in chat interface
   - Auto-translate employee questions to English for Claude
   - Translate Claude responses back to user's language
 5. Update UI components
   - Language dropdown in document generator
   - Translation preview modal
   - Language preference in user settings

 Deliverables:
 - Translation service module (150 lines)
 - 2 API endpoints (translate, detect-language)
 - Multi-language document generator
 - Translated survey support
 - UI language selector component

 Cost: ~$10-15/month (500,000 chars free, then $20/1M chars)

 ---
 Phase 3: Interview Intelligence (Weeks 5-6) - Speech-to-Text API

 Goal: Transcribe & analyze interviews in real-time

 Tasks:

 1. Install & create speech service
   - Install @google-cloud/speech
   - Create /webapp/lib/ai-services/speech-service.ts
   - Real-time streaming transcription
   - Speaker diarization (identify speakers)
 2. Create transcription API endpoints
   - POST /api/ai/transcribe - Upload audio file
   - WS /api/ai/transcribe-stream - Real-time streaming
   - Support MP3, WAV, M4A formats
 3. Enhance Interview Guide Creator skill
   - Add "Record Interview" button
   - Live transcription display during interview
   - Searchable transcript storage
   - Timestamp markers for key moments
 4. Enhance Exit Interview Builder
   - Record exit interviews
   - Auto-extract themes from transcript (using NLP)
   - Sentiment analysis on transcript
   - Compare verbal vs written feedback
 5. Build transcript viewer component
   - /webapp/components/ai/TranscriptViewer.tsx
   - Searchable, timestamped, speaker-labeled
   - Export to PDF/Google Docs
   - Privacy controls (who can access transcripts)
 6. Add to chat interface
   - Microphone button for voice queries
   - Real-time voice-to-text in chat
   - Accessibility enhancement

 Deliverables:
 - Speech service module (200 lines)
 - 2 API endpoints (file upload, streaming)
 - Interview recording feature in 2 skills
 - Transcript viewer component
 - Voice-enabled chat interface

 Cost: ~$15-20/month (60 mins free, then $0.024/min = $1.44/hour)

 ---
 Phase 4: Document Intelligence (Weeks 7-8) - Document AI

 Goal: Extract data from PDFs, resumes, scanned forms

 Tasks:

 1. Set up Document AI processors
   - Create processors in Google Cloud Console
   - Resume parser processor
   - Form parser processor (W-4, I-9)
   - General OCR processor
 2. Install & create Document AI service
   - Install @google-cloud/documentai
   - Create /webapp/lib/ai-services/document-ai-service.ts
   - Parse resume into structured data
   - Extract form fields from PDFs
   - OCR scanned images
 3. Enhance data upload flow
   - Accept PDF/image uploads (not just CSV)
   - Auto-detect document type
   - Extract employee data from scanned docs
   - Preview extracted fields before import
 4. Create resume parsing feature
   - Upload resume → extract name, email, phone, skills, experience
   - Map to employee schema
   - Pre-fill candidate information
   - Integration with Interview Guide Creator skill
 5. Enhance Employee Relations skill
   - Upload evidence documents (PDFs, images)
   - OCR emails, text messages
   - Search within scanned documents
   - Auto-extract case details (dates, names, locations)

 Deliverables:
 - Document AI service module (250 lines)
 - 3 API endpoints (parse-resume, extract-form, ocr-image)
 - PDF/image upload support in data manager
 - Resume parser feature
 - Document evidence in ER cases

 Cost: ~$10-15/month (1,000 pages free, then $1.50-10/1000 pages
 depending on processor)

 ---
 Phase 5: Predictive Analytics (Weeks 9-10) - Vertex AI

 Goal: Predict attrition, performance, promotion readiness

 Tasks:

 1. Data preparation
   - Extract features from master-employees.json
   - Features: tenure, eNPS, review sentiment, comp percentile,
 promotion history
   - Target: voluntary termination within 6 months
   - Train/test split (80/20)
 2. Install & create Vertex AI service
   - Install @google-cloud/aiplatform
   - Create /webapp/lib/ai-services/vertex-ai-service.ts
   - Model training pipeline
   - Prediction endpoint
   - Feature engineering helpers
 3. Train attrition prediction model
   - Use AutoML Tables (no ML expertise needed)
   - Features: tenure, eNPS, sentiment_score, manager_tenure,
 last_raise_months_ago
   - Target: will_leave_6mo (binary classification)
   - Evaluate accuracy, precision, recall
 4. Create prediction API endpoints
   - POST /api/ai/predict/attrition - Predict employee flight risk
   - POST /api/ai/predict/performance - Predict next review rating
   - POST /api/ai/predict/promotion - Predict promotion readiness
   - Batch prediction support
 5. Enhance Analytics Dashboard
   - "Flight Risk" widget (top 10 at-risk employees)
   - Predicted attrition trend chart
   - Recommended interventions (generated by Claude)
   - Filter employees by risk score
 6. Enhance Performance Insights skill
   - Add "Predicted Performance" field
   - Compare predicted vs actual ratings
   - Identify surprises (predicted high, performed low)

 Deliverables:
 - Vertex AI service module (300 lines)
 - 3 trained ML models (attrition, performance, promotion)
 - 3 prediction API endpoints
 - Flight Risk dashboard widget
 - Model monitoring & retraining pipeline

 Cost: ~$20-30/month (AutoML training $19.32/hour, predictions
 $0.000002/prediction)

 ---
 Phase 6: Vision & OCR (Weeks 11-12) - Vision API

 Goal: ID verification, image moderation, evidence analysis

 Tasks:

 1. Install & create Vision service
   - Install @google-cloud/vision
   - Create /webapp/lib/ai-services/vision-service.ts
   - Text detection (OCR)
   - Object detection
   - Safe search (content moderation)
 2. Enhance Onboarding Builder skill
   - Upload driver's license photo for I-9 verification
   - Extract name, DOB, address, license number
   - Auto-populate employee record
   - Verify ID authenticity (detect fake IDs)
 3. Enhance Employee Relations skill
   - Analyze evidence photos
   - Detect text in images (screenshots, photos of documents)
   - Object detection (identify workplace safety violations)
   - Auto-tag evidence by content
 4. Create profile photo moderation
   - Upload profile photo
   - Safe search (detect inappropriate content)
   - Reject photos with explicit content
   - Auto-crop to square aspect ratio
 5. Create API endpoints
   - POST /api/ai/verify-id - Verify ID document
   - POST /api/ai/analyze-image - Extract text/objects
   - POST /api/ai/moderate-image - Check for inappropriate content

 Deliverables:
 - Vision service module (200 lines)
 - 3 API endpoints
 - ID verification in onboarding
 - Evidence analysis in ER cases
 - Profile photo moderation

 Cost: ~$5-10/month (1,000 units free, then $1.50/1000 images)

 ---
 Infrastructure & Cross-Cutting Concerns

 1. Service Account Setup (Week 1)

 - Create hr-ai-services service account
 - Roles: Cloud AI Platform User, Cloud Translation API User, etc.
 - Download JSON key
 - Add to .gitignore
 - Set GOOGLE_APPLICATION_CREDENTIALS env var

 2. Environment Variables

 # Google AI Services
 GOOGLE_APPLICATION_CREDENTIALS=/path/to/hr-ai-services-key.json

 # Feature Flags (enable gradually)
 NEXT_PUBLIC_ENABLE_NLP=true
 NEXT_PUBLIC_ENABLE_TRANSLATION=true
 NEXT_PUBLIC_ENABLE_SPEECH=true
 NEXT_PUBLIC_ENABLE_DOCUMENT_AI=true
 NEXT_PUBLIC_ENABLE_VERTEX_AI=true
 NEXT_PUBLIC_ENABLE_VISION=true

 # Cost Control
 NEXT_PUBLIC_AI_DAILY_BUDGET=5.00  # $5/day limit
 NEXT_PUBLIC_AI_ENABLE_CACHING=true

 3. Cost Optimization (All Phases)

 - Caching: 5-min cache for identical requests (60-80% reduction)
 - Sampling: Process 10% of data if >1000 items
 - Batching: Batch API calls (20-30% discount)
 - Feature flags: Disable expensive features if needed
 - Budget alerts: Google Cloud billing alerts at $25, $50, $75

 4. Monitoring & Alerting

 - Track API usage in Google Cloud Console
 - Log all AI operations to audit trail
 - Alert if cost exceeds $100/month
 - Track accuracy metrics (predictions vs actuals)

 5. Documentation

 - Update /docs/guides/ with AI integration guides
 - Create /docs/guides/AI_SERVICES_GUIDE.md
 - Update docs/context/claude.md with AI service info
 - Add API reference docs for each endpoint

 6. Testing

 - Create /tests/ai-integration/ directory
 - Integration tests for each service
 - Mock API responses for unit tests
 - Load testing for batch operations

 ---
 File Structure

 /webapp/
 ├── lib/
 │   ├── ai-services/
 │   │   ├── nlp-service.ts           (Phase 1 - 200 lines)
 │   │   ├── translation-service.ts   (Phase 2 - 150 lines)
 │   │   ├── speech-service.ts        (Phase 3 - 200 lines)
 │   │   ├── document-ai-service.ts   (Phase 4 - 250 lines)
 │   │   ├── vertex-ai-service.ts     (Phase 5 - 300 lines)
 │   │   └── vision-service.ts        (Phase 6 - 200 lines)
 │   └── types/
 │       └── ai-services.ts           (Shared types)
 │
 ├── app/api/ai/
 │   ├── analyze-sentiment/route.ts
 │   ├── extract-entities/route.ts
 │   ├── translate/route.ts
 │   ├── transcribe/route.ts
 │   ├── transcribe-stream/route.ts
 │   ├── parse-resume/route.ts
 │   ├── extract-document/route.ts
 │   ├── predict/
 │   │   ├── attrition/route.ts
 │   │   ├── performance/route.ts
 │   │   └── promotion/route.ts
 │   ├── verify-id/route.ts
 │   └── analyze-image/route.ts
 │
 ├── components/ai/
 │   ├── TranscriptViewer.tsx
 │   ├── SentimentBadge.tsx
 │   ├── LanguageSelector.tsx
 │   ├── VoiceRecorder.tsx
 │   └── FlightRiskIndicator.tsx
 │
 └── __tests__/ai-integration/
     ├── test-nlp-service.ts
     ├── test-translation-service.ts
     ├── test-speech-service.ts
     ├── test-document-ai-service.ts
     ├── test-vertex-ai-service.ts
     └── test-vision-service.ts

 /docs/guides/
 ├── AI_SERVICES_GUIDE.md            (New - comprehensive guide)
 ├── NLP_INTEGRATION.md               (Phase 1 specific)
 ├── TRANSLATION_GUIDE.md             (Phase 2 specific)
 ├── SPEECH_TO_TEXT_GUIDE.md          (Phase 3 specific)
 └── VERTEX_AI_PREDICTIONS.md         (Phase 5 specific)

 /skills/ (Enhanced)
 ├── performance-insights-analyst/
 │   └── SKILL.md                     (+ sentiment analysis)
 ├── survey-analyzer-action-planner/
 │   └── SKILL.md                     (+ NLP auto-categorization)
 ├── offboarding-exit-builder/
 │   └── SKILL.md                     (+ transcription & sentiment)
 ├── interview-guide-creator/
 │   └── SKILL.md                     (+ real-time transcription)
 └── hr-document-generator/
     └── SKILL.md                     (+ multi-language support)

 ---
 Success Metrics

 Technical KPIs

 - API response time: < 2 seconds (95th percentile)
 - Cache hit rate: > 60%
 - Error rate: < 1%
 - Monthly cost: $50-100 (within budget)

 Business KPIs

 - Exit interview analysis time: 2 hours → 15 minutes
 - Document translation time: 30 min → 30 seconds
 - Interview transcription: 4 hours → real-time
 - Attrition prediction accuracy: > 75%
 - Sentiment analysis adoption: > 80% of surveys

 User Adoption

 - HR users using AI features: > 60% within 3 months
 - Positive feedback on AI accuracy: > 80%
 - Time saved per week: 10+ hours

 ---
 Cost Breakdown (Estimated)

 | Phase | API              | Monthly Cost | Usage               |
 |-------|------------------|--------------|---------------------|
 | 1     | Natural Language | $5-10        | 10,000 API calls    |
 | 2     | Translation      | $10-15       | 2M characters       |
 | 3     | Speech-to-Text   | $15-20       | 12 hours audio      |
 | 4     | Document AI      | $10-15       | 5,000 pages         |
 | 5     | Vertex AI        | $20-30       | 100,000 predictions |
 | 6     | Vision           | $5-10        | 5,000 images        |
 | Total | All 6 APIs       | $65-100      | Full platform       |

 Free tier benefits: ~40% of usage covered by free tiers

 ---
 Risk Mitigation

 1. API Quota Limits
   - Request quota increases proactively
   - Rate limiting (already implemented)
   - Graceful degradation (features work without AI)
 2. Cost Overruns
   - Budget alerts at $50, $75, $100
   - Feature flags to disable expensive features
   - Daily cost tracking dashboard
 3. PII Exposure
   - Use existing DLP service to scan before AI calls
   - Data minimization (send only needed fields)
   - Audit logging for all AI operations
 4. Accuracy Issues
   - Human-in-the-loop for critical decisions
   - Confidence scores displayed to users
   - Validate model accuracy monthly

 ---
 Timeline Summary

 - Week 1-2: Natural Language API (sentiment analysis)
 - Week 3-4: Translation API (multilingual support)
 - Week 5-6: Speech-to-Text API (interview transcription)
 - Week 7-8: Document AI (resume parsing, OCR)
 - Week 9-10: Vertex AI (predictive analytics)
 - Week 11-12: Vision API (ID verification)

 Total Duration: 12 weeksTotal Cost: ~$800-1,200 over 12 weeksLines 
 of Code: ~2,500 new linesFiles Created: ~30 filesAPIs Integrated: 6
 Google AI/ML APIs