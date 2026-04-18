"use client";

import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  priority = false,
}: OptimizedImageProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Add Cloudinary optimization parameters
  const getOptimizedSrc = (url: string) => {
    if (imgError) {
      return "https://picsum.photos/400/300?random=fallback";
    }
    
    // If using Cloudinary, add optimization parameters
    if (url.includes('cloudinary')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}f_auto,q_auto,w_${width || 400},c_fill`;
    }
    
    return url;
  };

  const optimizedSrc = getOptimizedSrc(src);

  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={optimizedSrc}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoadingComplete={() => setLoaded(true)}
          onError={() => setImgError(true)}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading={priority ? "eager" : "lazy"}
        />
        {!loaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
        )}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoadingComplete={() => setLoaded(true)}
        onError={() => setImgError(true)}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
      />
      {!loaded && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg"
          style={{ width, height }}
        />
      )}
    </div>
  );
}