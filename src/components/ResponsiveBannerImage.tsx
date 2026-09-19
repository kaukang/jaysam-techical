import React, { useState, useEffect } from 'react';

interface ResponsiveBannerImageProps {
  desktopUrl?: string;
  tabletUrl?: string;
  mobileUrl?: string;
  fallbackUrl?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  objectPosition?: string;
  priority?: boolean;
  onLoad?: () => void;
}

const DEFAULT_BANNER_FALLBACK = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2000&auto=format&fit=crop';

export default function ResponsiveBannerImage({
  desktopUrl,
  tabletUrl,
  mobileUrl,
  fallbackUrl = DEFAULT_BANNER_FALLBACK,
  alt,
  className = 'w-full h-full block',
  imgClassName = 'w-full h-full object-cover',
  objectPosition = 'center',
  priority = false,
  onLoad,
}: ResponsiveBannerImageProps) {
  const [hasError, setHasError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  // Reset error states whenever image URL inputs change
  useEffect(() => {
    setHasError(false);
    setTriedFallback(false);
  }, [desktopUrl, tabletUrl, mobileUrl, fallbackUrl]);

  // Clean empty strings or whitespace
  const cleanDesktop = desktopUrl?.trim() || '';
  const cleanTablet = tabletUrl?.trim() || '';
  const cleanMobile = mobileUrl?.trim() || '';
  const cleanFallback = fallbackUrl?.trim() || DEFAULT_BANNER_FALLBACK;

  // Resolve active sources
  const resolvedDesktop = cleanDesktop || cleanFallback;
  const resolvedTablet = cleanTablet || resolvedDesktop;
  const resolvedMobile = cleanMobile || resolvedTablet;

  const handleImageError = () => {
    // If the primary image failed and we haven't tried the fallback yet, switch to fallback
    if (!triedFallback && cleanFallback && (cleanDesktop || cleanTablet || cleanMobile)) {
      setTriedFallback(true);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`${className} bg-gradient-to-r from-slate-900 via-[#082B52] to-slate-950 flex items-center justify-center`}>
        <div className="text-center px-4">
          <span className="text-white/50 text-xs sm:text-sm font-medium tracking-wide">Jayliam Tech Electronics</span>
        </div>
      </div>
    );
  }

  // If primary image errored and we are trying the fallback image directly
  if (triedFallback) {
    return (
      <div className={className}>
        <img
          src={cleanFallback}
          alt={alt}
          className={imgClassName}
          style={{ objectPosition }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          onLoad={onLoad}
        />
      </div>
    );
  }

  // Check if tablet or desktop artwork are actually distinct from mobile
  const hasDistinctDesktop = resolvedDesktop && resolvedDesktop !== resolvedMobile;
  const hasDistinctTablet = resolvedTablet && resolvedTablet !== resolvedMobile;

  return (
    <picture className={className}>
      {/* Desktop Viewport: 1024px and wider */}
      {hasDistinctDesktop && (
        <source 
          media="(min-width: 1024px)" 
          srcSet={resolvedDesktop} 
        />
      )}
      
      {/* Tablet Viewport: 640px to 1023px */}
      {hasDistinctTablet && (
        <source 
          media="(min-width: 640px)" 
          srcSet={resolvedTablet} 
        />
      )}
      
      {/* Fallback image element / default mobile */}
      <img
        src={resolvedMobile}
        alt={alt}
        className={imgClassName}
        style={{ objectPosition }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleImageError}
        onLoad={onLoad}
      />
    </picture>
  );
}
