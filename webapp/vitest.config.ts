import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(), // Resolves TypeScript path aliases (@/...)
  ],
  test: {
    // Test environment (jsdom for React component testing)
    environment: 'jsdom',

    // Enable global test APIs (describe, it, expect, etc.) without imports
    globals: true,

    // Setup files to run before tests
    setupFiles: ['./vitest.setup.ts'],

    // Test file patterns
    include: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/e2e/**', // Playwright E2E tests (separate from unit tests)
      '**/dist/**',
      '**/build/**',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8', // Fast coverage using V8
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      // Coverage thresholds (80% minimum per ~/claude-docs/rules.md)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Test timeout (default: 5000ms)
    testTimeout: 10000, // Increased for API/database tests

    // Hook timeout
    hookTimeout: 10000,
  },

  resolve: {
    // React 19 JSX transform conditions (critical for Vitest)
    conditions: ['development', 'browser'],
    alias: {
      '@': path.resolve(__dirname, './'),
      // Force single React version for tests (React 19 compatibility)
      // Note: node_modules is at project root (../)
      'react': path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
      // React 19 JSX runtime entry points (fixes "Failed to resolve import" errors)
      'react/jsx-dev-runtime': path.resolve(__dirname, '../node_modules/react/jsx-dev-runtime.js'),
      'react/jsx-runtime': path.resolve(__dirname, '../node_modules/react/jsx-runtime.js'),
    },
  },
});
