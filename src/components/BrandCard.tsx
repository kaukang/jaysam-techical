import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface BrandCardProps {
  brand: {
    id?: string;
    name: string;
    slug?: string;
    logo_url?: string | null;
  };
  key?: React.Key;
}

export default function BrandCard({ brand }: BrandCardProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [brand.logo_url]);

  const hasValidLogo = Boolean(brand.logo_url && !imgError && brand.logo_url.trim() !== '');

  return (
    <Link
      to={`/shop?brand=${encodeURIComponent(brand.name)}`}
      id={`brand-card-${brand.slug || brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      title={brand.name}
      aria-label={`Shop ${brand.name}`}
      className="group bg-white border border-slate-200/90 hover:border-[#087FF5]/40 rounded-2xl px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-center text-center shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[76px] xs:min-h-[84px] sm:min-h-[96px] md:min-h-[104px] w-full"
    >
      {/* Smart, centered brand logo maintaining natural aspect ratio */}
      <div className="w-full h-full flex items-center justify-center">
        {hasValidLogo ? (
          <img
            src={brand.logo_url!}
            alt={brand.name}
            className="max-h-7 xs:max-h-8 sm:max-h-9 md:max-h-10 w-auto max-w-[80%] sm:max-w-[75%] object-contain group-hover:scale-105 transition-transform duration-200 filter group-hover:drop-shadow-xs"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className="text-xs xs:text-sm sm:text-base font-bold text-slate-500 group-hover:text-[#087FF5] tracking-wide transition-colors">
            {brand.name}
          </span>
        )}
      </div>
    </Link>
  );
}
