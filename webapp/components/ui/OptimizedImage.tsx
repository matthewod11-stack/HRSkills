/**
 * OptimizedImage Component
 *
 * Wrapper around next/image with automatic optimization.
 * Provides blur placeholder, lazy loading, and format optimization.
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/profile.jpg"
 *   alt="User profile"
 *   width={256}
 *   height={256}
 *   priority={false}
 * />
 * ```
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getBlurDataURL } from '@/lib/image-utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  objectFit = 'cover',
  quality = 75,
  onLoad,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        placeholder="blur"
        blurDataURL={getBlurDataURL(width, height)}
        quality={quality}
        style={{ objectFit }}
        onLoadingComplete={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        className={`duration-300 ${isLoading ? 'blur-sm scale-105' : 'blur-0 scale-100'}`}
      />
      {isLoading && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
    </div>
  );
}

/**
 * OptimizedAvatar Component
 *
 * Pre-configured for avatar/profile images.
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 64,
  className = '',
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      objectFit="cover"
      {...props}
    />
  );
}

/**
 * OptimizedHero Component
 *
 * Pre-configured for hero/banner images.
 */
export function OptimizedHero({
  src,
  alt,
  className = '',
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      priority={true}
      className={className}
      objectFit="cover"
      quality={90}
      {...props}
    />
  );
}
