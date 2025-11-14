'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';

/**
 * Lazy-loaded ReactMarkdown component
 *
 * Performance optimization: ReactMarkdown + remarkGfm are ~75kb gzipped.
 * By lazy loading them, we reduce the initial bundle size and improve
 * First Contentful Paint.
 *
 * The markdown renderer is loaded on-demand when needed, with a loading
 * skeleton shown during the brief load time.
 */

// Dynamically import ReactMarkdown with remarkGfm
const DynamicReactMarkdown = dynamic(
  () => import('react-markdown').then((mod) => {
    // Also load remarkGfm
    return import('remark-gfm').then((gfm) => {
      // Return a component that uses both
      const MarkdownWithPlugins = ({ content }: { content: string }) => {
        const ReactMarkdown = mod.default;
        return <ReactMarkdown remarkPlugins={[gfm.default]}>{content}</ReactMarkdown>;
      };
      return MarkdownWithPlugins;
    });
  }),
  {
    loading: () => (
      <div className="prose prose-invert prose-sm max-w-none">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    ),
    ssr: true, // Enable SSR for SEO
  }
);

interface MessageMarkdownProps {
  content: string;
}

/**
 * MessageMarkdown Component
 *
 * Renders markdown content with lazy-loaded ReactMarkdown.
 * Memoized to prevent re-renders when parent updates.
 */
const MessageMarkdown = memo(function MessageMarkdown({ content }: MessageMarkdownProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <DynamicReactMarkdown content={content} />
    </div>
  );
});

export default MessageMarkdown;
