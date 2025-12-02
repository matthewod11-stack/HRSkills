/**
 * T3 Env Configuration
 * Type-safe environment variables for HRSkills platform
 *
 * @see https://env.t3.gg/docs/nextjs
 * @see ENV_INVENTORY.md for complete variable documentation
 */

import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Server-side environment variables
   * NEVER exposed to the client
   */
  server: {
    // AI Providers
    ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
    ANTHROPIC_MANAGED_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),

    // Authentication & Security
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters')
      .default('CHANGE_THIS_IN_PRODUCTION_MIN_32_CHARS'),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD_HASH: z.string().optional(),

    // Database
    DATABASE_URL: z.string().optional(),
    DB_DIR: z.string().default('../data'),
    ANALYTICS_DATA_DIR: z.string().optional(),

    // Google Workspace - Service Account
    GOOGLE_CREDENTIALS_PATH: z.string().optional(),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

    // Google Workspace - OAuth
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:3000/api/auth/google/callback'),

    // Google Cloud Platform
    GOOGLE_CLOUD_PROJECT: z.string().optional(),

    // Vertex AI
    VERTEX_AI_LOCATION: z.string().default('us-central1'),
    VERTEX_AI_ATTRITION_ENDPOINT_ID: z.string().optional(),
    VERTEX_AI_PERFORMANCE_ENDPOINT_ID: z.string().optional(),
    VERTEX_AI_PROMOTION_ENDPOINT_ID: z.string().optional(),

    // Google Drive & Templates
    HR_DRIVE_FOLDER_ID: z.string().optional(),
    GOOGLE_TEMPLATE_OFFER_LETTER_ID: z.string().optional(),
    GOOGLE_TEMPLATE_ONBOARDING_ID: z.string().optional(),
    GOOGLE_TEMPLATE_PERFORMANCE_REVIEW_ID: z.string().optional(),
    GOOGLE_TEMPLATE_TERMINATION_ID: z.string().optional(),
    GOOGLE_TEMPLATE_PIP_ID: z.string().optional(),
    GOOGLE_TEMPLATE_PROMOTION_ID: z.string().optional(),
    GOOGLE_TEMPLATE_RESIGNATION_ID: z.string().optional(),
    GOOGLE_TEMPLATE_EXIT_INTERVIEW_ID: z.string().optional(),

    // Cron Jobs
    CRON_SECRET: z.string().optional(),

    // Rate Limiting
    SHARED_KEY_DAILY_LIMIT: z
      .string()
      .regex(/^\d+$/, 'Must be a number string')
      .default('100')
      .transform((val) => val),

    // Upstash Rate Limiting (Feature Flag)
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    ENABLE_UPSTASH_RATE_LIMIT: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default('false'),

    // Security & Monitoring
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ORG: z.string().default('foundryhr'),
    SENTRY_PROJECT: z.string().default('hrcommandcenter'),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_RELEASE: z.string().optional(),

    // CORS
    ALLOWED_ORIGIN: z.string().url().default('http://localhost:3000'),

    // Stripe (Desktop App Licensing)
    STRIPE_SECRET_KEY: z.string().optional(), // sk_live_... or sk_test_...
    STRIPE_WEBHOOK_SECRET: z.string().optional(), // whsec_...
    STRIPE_PRODUCT_ID: z.string().optional(), // prod_...
    STRIPE_PRICE_ID: z.string().optional(), // price_... (optional, can look up from product)

    // Email (Resend for license delivery)
    RESEND_API_KEY: z.string().optional(), // re_...

    // Build-time (also used in runtime)
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },

  /**
   * Client-side environment variables
   * Exposed to the browser (NEXT_PUBLIC_* prefix required)
   */
  client: {
    // App Metadata
    NEXT_PUBLIC_APP_NAME: z.string().default('HR Command Center'),
    NEXT_PUBLIC_APP_VERSION: z.string().default('0.1.0'),

    // Monitoring
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

    // Feature Flags - AI Services
    NEXT_PUBLIC_ENABLE_NLP: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),
    NEXT_PUBLIC_ENABLE_TRANSLATION: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),
    NEXT_PUBLIC_ENABLE_SPEECH: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),
    NEXT_PUBLIC_ENABLE_DOCUMENT_AI: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),
    NEXT_PUBLIC_ENABLE_VERTEX_AI: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),
    NEXT_PUBLIC_ENABLE_VISION: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),

    // Feature Flags - DLP
    NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),

    // Vercel Analytics
    NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),
    NEXT_PUBLIC_SPEED_INSIGHTS_ENABLED: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),
  },

  /**
   * Runtime environment mapping
   * REQUIRED: Explicitly map process.env to schema
   */
  runtimeEnv: {
    // AI Providers
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MANAGED_KEY: process.env.ANTHROPIC_MANAGED_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,

    // Authentication & Security
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,

    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    DB_DIR: process.env.DB_DIR,
    ANALYTICS_DATA_DIR: process.env.ANALYTICS_DATA_DIR,

    // Google Workspace - Service Account
    GOOGLE_CREDENTIALS_PATH: process.env.GOOGLE_CREDENTIALS_PATH,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,

    // Google Workspace - OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,

    // Google Cloud Platform
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,

    // Vertex AI
    VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION,
    VERTEX_AI_ATTRITION_ENDPOINT_ID: process.env.VERTEX_AI_ATTRITION_ENDPOINT_ID,
    VERTEX_AI_PERFORMANCE_ENDPOINT_ID: process.env.VERTEX_AI_PERFORMANCE_ENDPOINT_ID,
    VERTEX_AI_PROMOTION_ENDPOINT_ID: process.env.VERTEX_AI_PROMOTION_ENDPOINT_ID,

    // Google Drive & Templates
    HR_DRIVE_FOLDER_ID: process.env.HR_DRIVE_FOLDER_ID,
    GOOGLE_TEMPLATE_OFFER_LETTER_ID: process.env.GOOGLE_TEMPLATE_OFFER_LETTER_ID,
    GOOGLE_TEMPLATE_ONBOARDING_ID: process.env.GOOGLE_TEMPLATE_ONBOARDING_ID,
    GOOGLE_TEMPLATE_PERFORMANCE_REVIEW_ID: process.env.GOOGLE_TEMPLATE_PERFORMANCE_REVIEW_ID,
    GOOGLE_TEMPLATE_TERMINATION_ID: process.env.GOOGLE_TEMPLATE_TERMINATION_ID,
    GOOGLE_TEMPLATE_PIP_ID: process.env.GOOGLE_TEMPLATE_PIP_ID,
    GOOGLE_TEMPLATE_PROMOTION_ID: process.env.GOOGLE_TEMPLATE_PROMOTION_ID,
    GOOGLE_TEMPLATE_RESIGNATION_ID: process.env.GOOGLE_TEMPLATE_RESIGNATION_ID,
    GOOGLE_TEMPLATE_EXIT_INTERVIEW_ID: process.env.GOOGLE_TEMPLATE_EXIT_INTERVIEW_ID,

    // Cron Jobs
    CRON_SECRET: process.env.CRON_SECRET,

    // Rate Limiting
    SHARED_KEY_DAILY_LIMIT: process.env.SHARED_KEY_DAILY_LIMIT,

    // Security & Monitoring
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_RELEASE: process.env.SENTRY_RELEASE,

    // CORS
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,

    // Build-time
    NODE_ENV: process.env.NODE_ENV,

    // Client variables
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_ENABLE_NLP: process.env.NEXT_PUBLIC_ENABLE_NLP,
    NEXT_PUBLIC_ENABLE_TRANSLATION: process.env.NEXT_PUBLIC_ENABLE_TRANSLATION,
    NEXT_PUBLIC_ENABLE_SPEECH: process.env.NEXT_PUBLIC_ENABLE_SPEECH,
    NEXT_PUBLIC_ENABLE_DOCUMENT_AI: process.env.NEXT_PUBLIC_ENABLE_DOCUMENT_AI,
    NEXT_PUBLIC_ENABLE_VERTEX_AI: process.env.NEXT_PUBLIC_ENABLE_VERTEX_AI,
    NEXT_PUBLIC_ENABLE_VISION: process.env.NEXT_PUBLIC_ENABLE_VISION,
    NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT: process.env.NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT,

    // Upstash Rate Limiting
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ENABLE_UPSTASH_RATE_LIMIT: process.env.ENABLE_UPSTASH_RATE_LIMIT,

    // Vercel Analytics
    NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED,
    NEXT_PUBLIC_SPEED_INSIGHTS_ENABLED: process.env.NEXT_PUBLIC_SPEED_INSIGHTS_ENABLED,

    // Stripe (Desktop App Licensing)
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRODUCT_ID: process.env.STRIPE_PRODUCT_ID,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,

    // Email (Resend)
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },

  /**
   * Skip validation during build if dependencies not installed
   * Useful for Docker builds and CI/CD
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
