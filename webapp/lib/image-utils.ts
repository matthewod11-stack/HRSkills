/**
 * Image Optimization Utilities
 *
 * Helpers for optimizing images with next/image.
 * These utilities prepare the infrastructure for future image usage.
 */

export const IMAGE_SIZES = {
  thumbnail: 64,
  small: 128,
  medium: 256,
  large: 512,
  xlarge: 1024,
  full: 1920
} as const;

export const IMAGE_QUALITY = {
  low: 60,
  medium: 75,
  high: 90,
  max: 100
} as const;

/**
 * Generate base64 shimmer placeholder for blur effect
 */
function shimmer(w: number, h: number): string {
  return `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;
}

function toBase64(str: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);
}

/**
 * Get blur data URL for placeholder
 * @param width Image width
 * @param height Image height
 * @returns Data URL for blur placeholder
 */
export function getBlurDataURL(width: number, height: number): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`;
}

/**
 * Calculate responsive image sizes
 * @param maxWidth Maximum width in pixels
 * @returns sizes string for next/image
 */
export function getResponsiveSizes(maxWidth: number): string {
  return `(max-width: 640px) ${Math.min(640, maxWidth)}px, (max-width: 1024px) ${Math.min(1024, maxWidth)}px, ${maxWidth}px`;
}

/**
 * Image optimization recommendations
 */
export const IMAGE_BEST_PRACTICES = {
  /**
   * Recommended formats:
   * - AVIF: Best compression, modern browsers
   * - WebP: Good compression, wide support
   * - JPEG: Fallback for older browsers
   */
  formats: ['image/avif', 'image/webp', 'image/jpeg'] as const,

  /**
   * Lazy loading recommendations:
   * - Above fold: priority={true}, loading="eager"
   * - Below fold: priority={false}, loading="lazy"
   */
  loadingStrategy: {
    aboveFold: { priority: true, loading: 'eager' as const },
    belowFold: { priority: false, loading: 'lazy' as const }
  },

  /**
   * Size recommendations by use case
   */
  sizesByUseCase: {
    avatar: IMAGE_SIZES.thumbnail,
    thumbnail: IMAGE_SIZES.small,
    card: IMAGE_SIZES.medium,
    hero: IMAGE_SIZES.xlarge,
    fullscreen: IMAGE_SIZES.full
  }
} as const;
