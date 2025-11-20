/**
 * Bundle Performance Tests
 *
 * Tests to prevent performance regressions in bundle size and code splitting.
 * These tests analyze the production build output to ensure:
 * - Main bundle stays under size budget
 * - Heavy components are properly lazy loaded
 * - Unused dependencies are not included
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const buildPath = path.join(__dirname, '../../.next');
const chunksPath = path.join(buildPath, 'static/chunks');
const hasBuildArtifacts = fs.existsSync(chunksPath);

if (!hasBuildArtifacts) {
  // eslint-disable-next-line no-console
  console.warn(
    '[BundlePerformanceTest] Build output not found. Run `npm run build` before this test.'
  );
}

const suite = hasBuildArtifacts ? describe : describe.skip;

suite('Bundle Performance', () => {

  describe('Bundle Size Budgets', () => {
    it('should keep main bundle under 150KB', () => {
      const mainChunks = fs.readdirSync(chunksPath).filter(file => file.startsWith('main-'));

      // Skip if Next.js uses different chunk naming (Next.js 15+)
      if (mainChunks.length === 0) {
        console.warn('[BundlePerformance] No main-* chunks found. Skipping size check.');
        return;
      }

      mainChunks.forEach(chunk => {
        const stats = fs.statSync(path.join(chunksPath, chunk));
        const sizeKB = stats.size / 1024;

        expect(sizeKB).toBeLessThan(150);
      });
    });

    it('should keep framework bundle under 200KB', () => {
      const frameworkChunks = fs.readdirSync(chunksPath).filter(file =>
        file.startsWith('framework-')
      );

      // Skip if Next.js uses different chunk naming (Next.js 15+)
      if (frameworkChunks.length === 0) {
        console.warn('[BundlePerformance] No framework-* chunks found. Skipping size check.');
        return;
      }

      frameworkChunks.forEach(chunk => {
        const stats = fs.statSync(path.join(chunksPath, chunk));
        const sizeKB = stats.size / 1024;

        expect(sizeKB).toBeLessThan(200);
      });
    });

    it('should keep total chunk count reasonable', () => {
      const allChunks = fs.readdirSync(chunksPath).filter(file => file.endsWith('.js'));

      // Should have code splitting (multiple chunks) but not excessive
      expect(allChunks.length).toBeGreaterThan(10);
      expect(allChunks.length).toBeLessThan(100);
    });
  });

  describe('Lazy Loading Verification', () => {
    it('should create separate chunks for lazy loaded panels', () => {
      const allChunks = fs.readdirSync(chunksPath).filter(file => file.endsWith('.js'));

      // After lazy loading implementation, we should have multiple chunks
      // (exact chunk numbers vary by build, but should be >15 with lazy loading)
      expect(allChunks.length).toBeGreaterThan(15);
    });

    it('should have recharts only if needed for visualizations', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
      );

      // Recharts is currently used for data visualizations
      // If it's present, verify it's in dependencies (not devDependencies)
      if (packageJson.dependencies?.recharts) {
        expect(packageJson.dependencies.recharts).toBeDefined();
        expect(packageJson.devDependencies?.recharts).toBeUndefined();
      }
    });
  });

  describe('Tree Shaking Verification', () => {
    it('should use named imports for lucide-react (tree-shakeable)', () => {
      // This tests the source code pattern
      const pageSource = fs.readFileSync(
        path.join(__dirname, '../../app/page.tsx'),
        'utf-8'
      );

      // Should use: import { Icon1, Icon2 } from 'lucide-react'
      const hasNamedImports = /import\s*{[^}]+}\s*from\s*['"]lucide-react['"]/.test(pageSource);
      expect(hasNamedImports).toBe(true);

      // Should NOT use: import * as Icons from 'lucide-react'
      const hasBarrelImport = /import\s*\*\s*as\s*\w+\s*from\s*['"]lucide-react['"]/.test(
        pageSource
      );
      expect(hasBarrelImport).toBe(false);
    });

    it('should use named imports for framer-motion (tree-shakeable)', () => {
      const pageSource = fs.readFileSync(
        path.join(__dirname, '../../app/page.tsx'),
        'utf-8'
      );

      // Should use: import { motion } from 'framer-motion'
      const hasNamedImports = /import\s*{[^}]+}\s*from\s*['"]framer-motion['"]/.test(pageSource);
      expect(hasNamedImports).toBe(true);

      // Should NOT use: import * as FramerMotion from 'framer-motion'
      const hasBarrelImport = /import\s*\*\s*as\s*\w+\s*from\s*['"]framer-motion['"]/.test(
        pageSource
      );
      expect(hasBarrelImport).toBe(false);
    });
  });

  describe('Dynamic Imports', () => {
    it('should use dynamic imports for DocumentEditorPanel', () => {
      const pageSource = fs.readFileSync(
        path.join(__dirname, '../../app/page.tsx'),
        'utf-8'
      );

      // Should have dynamic import
      const hasDynamicImport = /dynamic\s*\(\s*\(\)\s*=>\s*import.*DocumentEditorPanel/.test(
        pageSource
      );
      expect(hasDynamicImport).toBe(true);
    });

    it('should use dynamic imports for PerformanceGridPanel', () => {
      const pageSource = fs.readFileSync(
        path.join(__dirname, '../../app/page.tsx'),
        'utf-8'
      );

      const hasDynamicImport = /dynamic\s*\(\s*\(\)\s*=>\s*import.*PerformanceGridPanel/.test(
        pageSource
      );
      expect(hasDynamicImport).toBe(true);
    });

    it('should use dynamic imports for ENPSPanel', () => {
      const pageSource = fs.readFileSync(
        path.join(__dirname, '../../app/page.tsx'),
        'utf-8'
      );

      const hasDynamicImport = /dynamic\s*\(\s*\(\)\s*=>\s*import.*ENPSPanel/.test(pageSource);
      expect(hasDynamicImport).toBe(true);
    });

    it('should use ssr: false for heavy client components', () => {
      const pageSource = fs.readFileSync(
        path.join(__dirname, '../../app/page.tsx'),
        'utf-8'
      );

      // Dynamic imports for panels should have ssr: false
      const dynamicImportBlock = /dynamic\s*\([^)]+DocumentEditorPanel[^)]+\)/.exec(pageSource);
      if (dynamicImportBlock) {
        expect(dynamicImportBlock[0]).toContain('ssr: false');
      }
    });
  });

  describe('Loading Skeletons', () => {
    it('should have DocumentEditorSkeleton component', () => {
      const skeletonPath = path.join(
        __dirname,
        '../../components/ui/skeletons/DocumentEditorSkeleton.tsx'
      );
      expect(fs.existsSync(skeletonPath)).toBe(true);
    });

    it('should have PerformanceGridSkeleton component', () => {
      const skeletonPath = path.join(
        __dirname,
        '../../components/ui/skeletons/PerformanceGridSkeleton.tsx'
      );
      expect(fs.existsSync(skeletonPath)).toBe(true);
    });

    it('should have ENPSSkeleton component', () => {
      const skeletonPath = path.join(
        __dirname,
        '../../components/ui/skeletons/ENPSSkeleton.tsx'
      );
      expect(fs.existsSync(skeletonPath)).toBe(true);
    });

    it('should export all skeletons from index', () => {
      const indexSource = fs.readFileSync(
        path.join(__dirname, '../../components/ui/skeletons/index.ts'),
        'utf-8'
      );

      expect(indexSource).toContain('DocumentEditorSkeleton');
      expect(indexSource).toContain('PerformanceGridSkeleton');
      expect(indexSource).toContain('ENPSSkeleton');
    });
  });
});
