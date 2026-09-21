import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Laptop, Headphones, Watch, Check, ChevronRight, ChevronLeft, ShieldCheck, Truck, Award, HeadphonesIcon, Monitor, Gamepad2, Camera, Home as HomeIcon, ArrowRight, Star, Quote, RefreshCcw } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import BrandCard from '../components/BrandCard';
import ResponsiveBannerImage from '../components/ResponsiveBannerImage';
import { api } from '../api';
import { Product } from '../types';
import { supabase } from '../lib/supabase';

const DEFAULT_STORE_BRANDS = [
  { name: 'Samsung', slug: 'samsung' },
  { name: 'Apple', slug: 'apple' },
  { name: 'Infinix', slug: 'infinix' },
  { name: 'Tecno', slug: 'tecno' },
  { name: 'Xiaomi', slug: 'xiaomi' },
  { name: 'Nokia', slug: 'nokia' },
  { name: 'Oppo', slug: 'oppo' },
  { name: 'Redmi', slug: 'redmi' }
];

// Helper to normalize brand identifiers across Supabase, Products, and Defaults
const normalizeBrandKey = (item: any): string => {
  if (!item) return '';
  const bySlug = (item.slug || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const byName = (item.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const byId = String(item.id || '').trim().toLowerCase().replace(/^(default-brand-|product-brand-|prod-brand-)/, '').replace(/[^a-z0-9]/g, '');
  return bySlug || byName || byId;
};

// Category icon resolver supporting various keyword patterns
const getCategoryIcon = (category: any) => {
  const s = `${category?.slug || ''} ${category?.name || ''}`.toLowerCase();
  if (s.includes('laptop') || s.includes('macbook') || s.includes('computer')) return Laptop;
  if (s.includes('tablet') || s.includes('ipad')) return Monitor;
  if (s.includes('watch') || s.includes('wearable')) return Watch;
  if (s.includes('headphone') || s.includes('audio') || s.includes('earbud') || s.includes('sound')) return HeadphonesIcon;
  if (s.includes('appliance') || s.includes('home')) return HomeIcon;
  if (s.includes('repair') || s.includes('service') || s.includes('care')) return Check;
  if (s.includes('game') || s.includes('gaming') || s.includes('console')) return Gamepad2;
  if (s.includes('camera') || s.includes('photo')) return Camera;
  if (s.includes('accessory') || s.includes('accessories') || s.includes('charger') || s.includes('cable')) return Headphones;
  return Smartphone;
};

const defaultCategoriesList = [
  { id: 'smartphones', name: 'Smartphones', slug: 'smartphones' },
  { id: 'laptops', name: 'Laptops', slug: 'laptops' },
  { id: 'tablets', name: 'Tablets', slug: 'tablets' },
  { id: 'accessories', name: 'Accessories', slug: 'accessories' },
  { id: 'smartwatches', name: 'Smartwatches', slug: 'smartwatches' },
  { id: 'headphones', name: 'Headphones', slug: 'headphones' },
  { id: 'appliances', name: 'Home Appliances', slug: 'appliances' },
  { id: 'repairs', name: 'Phone Repairs', slug: 'repairs' },
];

function CategoryCard({ category, className = '' }: { category: any; key?: any; className?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = getCategoryIcon(category);

  return (
    <Link 
      to={`/shop?category=${category.id || category.slug || ''}`}
      className={`group relative flex flex-col h-full bg-white rounded-2xl border border-slate-200/85 hover:border-[#087FF5]/40 shadow-[0_2px_10px_rgba(8,43,82,0.04)] hover:shadow-[0_16px_36px_rgba(8,43,82,0.11)] transition-all duration-300 overflow-hidden hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-[#087FF5]/30 ${className}`}
    >
      {/* Equal-sized Visual Stage */}
      <div className="w-full aspect-[4/3] bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] group-hover:from-[#F0F7FF] group-hover:to-[#E1EFFF] flex items-center justify-center p-4 sm:p-5 relative overflow-hidden transition-colors duration-300">
        {/* Soft Radial Ambient Spotlight on Hover */}
        <div className="absolute inset-0 bg-radial from-[#087FF5]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {category.image_url && !imgFailed ? (
          <img 
            src={category.image_url} 
            alt={category.name} 
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-108" 
            loading="lazy"
          />
        ) : (
          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center justify-center text-[#082B52] group-hover:text-[#087FF5] group-hover:border-[#087FF5]/30 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
            <Icon size={26} className="sm:w-7 sm:h-7" strokeWidth={1.6} />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-3.5 w-full flex items-center justify-center text-center border-t border-slate-100 bg-white">
        <h3 className="text-sm sm:text-[15px] font-bold text-[#082B52] group-hover:text-[#087FF5] transition-colors truncate w-full tracking-tight">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}

export default function Home() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [bestSellersConfig, setBestSellersConfig] = useState<any>({ is_active: true, title: 'Our Best-Selling Products' });
  const [bestSellersData, setBestSellersData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroData, setHeroData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('jayliam_hero_responsive_data');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [promoBannerData, setPromoBannerData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('jayliam_banner_responsive_data');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [categories, setCategories] = useState<any[]>([]);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [brandsData, setBrandsData] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchData();

    const handleBrandsUpdate = () => {
      fetchData();
    };

    window.addEventListener('jayliam_brands_updated', handleBrandsUpdate);
    window.addEventListener('jayliam_banner_updated', handleBrandsUpdate);
    window.addEventListener('jayliam_hero_updated', handleBrandsUpdate);
    window.addEventListener('storage', handleBrandsUpdate);
    return () => {
      window.removeEventListener('jayliam_brands_updated', handleBrandsUpdate);
      window.removeEventListener('jayliam_banner_updated', handleBrandsUpdate);
      window.removeEventListener('jayliam_hero_updated', handleBrandsUpdate);
      window.removeEventListener('storage', handleBrandsUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch dynamic categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('status', 'active')
        .order('display_order', { ascending: true });
        
      if (catData) setCategories(catData);

      // Fetch brands from Supabase
      const { data: bData } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // Fetch products from Supabase
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name, slug),
          product_images (image_url, is_primary)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      let mappedProducts: Product[] = [];
      if (productsData) {
        // Map database products to the application's Product type
        mappedProducts = productsData.map((p: any) => {
          const primaryImage = p.product_images?.find((img: any) => img.is_primary)?.image_url 
            || p.product_images?.[0]?.image_url 
            || '';

          const isAccessory = Boolean(
            p.is_accessory || 
            p.categories?.name?.toLowerCase().includes('accessor') || 
            p.categories?.slug === 'accessories' ||
            p.name?.toLowerCase().includes('charger') ||
            p.name?.toLowerCase().includes('cable') ||
            p.name?.toLowerCase().includes('case') ||
            p.name?.toLowerCase().includes('adapter') ||
            p.name?.toLowerCase().includes('protector')
          );

          let cleanBrand = (p.brand || '').trim();
          if (cleanBrand.toLowerCase() === 'jayliam' || cleanBrand.toLowerCase() === 'accessories' || cleanBrand.toLowerCase() === 'accessory') {
            cleanBrand = '';
          }

          return {
            id: p.id,
            brand: cleanBrand,
            name: p.name,
            spec: p.short_description || '',
            price: p.price,
            oldPrice: p.old_price,
            currency: 'KES',
            availability: p.stock_quantity > 10 ? 'In Stock' : p.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock',
            imageUrl: primaryImage,
            categoryId: p.category_id,
            categoryName: p.categories?.name || (isAccessory ? 'Accessories' : ''),
            isFeatured: p.is_featured,
            isAccessory: isAccessory,
            isBestSeller: Boolean(p.is_best_seller)
          };
        });

        setAllProducts(mappedProducts);

        // Use newest products for new arrivals
        setNewArrivals(mappedProducts.slice(0, 4));
        
        // Filter for featured products for "best sellers" or just use random/other items if none featured
        const featured = mappedProducts.filter(p => p.isFeatured);
        if (featured.length > 0) {
          setPopularProducts(featured.slice(0, 4));
        } else {
          setPopularProducts(mappedProducts.reverse().slice(0, 4));
        }
      }

      // Dynamically consolidate brands from:
      // 1. Supabase brands table (preserving any stored logos and custom orders)
      // 2. Local custom/admin brand updates (uploaded logos & configurations)
      // 3. Active products in the store
      // 4. Trusted phone & electronics brands (Samsung, Apple, Infinix, Tecno, Xiaomi, Nokia, Oppo, Redmi)
      let customBrands: any[] = [];
      try {
        const rawCustom = localStorage.getItem('jayliam_custom_brands');
        if (rawCustom) {
          const parsed = JSON.parse(rawCustom);
          if (Array.isArray(parsed)) {
            customBrands = parsed;
          }
        }
      } catch (e) {
        console.warn('Error reading custom brands in Home:', e);
      }

      const brandMap = new Map<string, any>();

      // 1. First add Supabase brands (preserving existing IDs and configurations)
      (bData || []).forEach((b: any) => {
        const key = normalizeBrandKey(b);
        if (key && key !== 'accessories' && key !== 'accessory' && key !== 'jayliam' && key !== 'jayliamtech') {
          brandMap.set(key, { ...b });
        }
      });

      // 2. Overlay any local custom/admin brand updates (e.g. uploaded logos & display order)
      customBrands.forEach((cb: any) => {
        const key = normalizeBrandKey(cb);
        if (key && key !== 'accessories' && key !== 'accessory' && key !== 'jayliam' && key !== 'jayliamtech') {
          const existing = brandMap.get(key) || {};
          brandMap.set(key, {
            ...existing,
            ...cb,
            id: existing.id || cb.id || `brand-${key}`,
            name: cb.name || existing.name || (key.charAt(0).toUpperCase() + key.slice(1)),
            slug: cb.slug || existing.slug || key,
            logo_url: cb.logo_url !== undefined ? cb.logo_url : existing.logo_url,
            is_active: cb.is_active !== undefined ? cb.is_active : (existing.is_active !== undefined ? existing.is_active : true),
            display_order: cb.display_order !== undefined ? cb.display_order : existing.display_order
          });
        }
      });

      // 3. Add any brands from active products not yet in the map (Accessories is a category, NOT a brand)
      if (mappedProducts.length > 0) {
        const productBrands = Array.from(new Set(mappedProducts.map(p => p.brand).filter(Boolean)));
        for (const pb of productBrands) {
          const key = normalizeBrandKey({ name: pb });
          if (key && key !== 'jayliam' && key !== 'jayliamtech' && key !== 'accessories' && key !== 'accessory' && !brandMap.has(key)) {
            const defMatch = DEFAULT_STORE_BRANDS.find(d => normalizeBrandKey(d) === key);
            brandMap.set(key, {
              id: `prod-brand-${key}`,
              name: defMatch ? defMatch.name : (pb.charAt(0).toUpperCase() + pb.slice(1).toLowerCase()),
              slug: key,
              logo_url: null,
              is_active: true,
              display_order: brandMap.size + 1
            });
          }
        }
      }

      // 4. Ensure default trusted phone & electronic brands exist
      for (const defBrand of DEFAULT_STORE_BRANDS) {
        const key = normalizeBrandKey(defBrand);
        if (key && key !== 'jayliam' && key !== 'jayliamtech' && key !== 'accessories' && key !== 'accessory' && !brandMap.has(key)) {
          brandMap.set(key, {
            id: `default-brand-${defBrand.slug || key}`,
            name: defBrand.name,
            slug: defBrand.slug || key,
            logo_url: null,
            is_active: true,
            display_order: brandMap.size + 1
          });
        }
      }

      // 5. Guarantee strict uniqueness of each brand ID and filter inactive
      const seenBrandIds = new Set<string>();
      let finalBrands = Array.from(brandMap.values())
        .filter((b: any) => {
          const k = normalizeBrandKey(b);
          const nameLower = (b.name || '').toLowerCase();
          return (
            b.is_active !== false && 
            nameLower && 
            nameLower !== 'jayliam' && 
            b.slug !== 'jayliam' &&
            nameLower !== 'accessories' &&
            b.slug !== 'accessories' &&
            nameLower !== 'accessory' &&
            b.slug !== 'accessory' &&
            k !== 'accessories' &&
            k !== 'accessory'
          );
        })
        .map((b: any, idx: number) => {
          let uniqueId = String(b.id || `brand-${b.slug || idx}`).trim();
          if (seenBrandIds.has(uniqueId)) {
            uniqueId = `${uniqueId}-${idx}`;
          }
          seenBrandIds.add(uniqueId);
          return { ...b, id: uniqueId };
        });

      finalBrands.sort((a: any, b: any) => {
        const orderA = typeof a.display_order === 'number' ? a.display_order : 999;
        const orderB = typeof b.display_order === 'number' ? b.display_order : 999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });

      setBrandsData(finalBrands);

      // Fetch Best Sellers Config in separate try-catch so it doesn't break if table is missing
      try {
        let manualIds: string[] = [];
        try {
          const { data: manualBs } = await supabase
            .from('best_seller_products')
            .select('product_id')
            .order('display_order', { ascending: true });
          if (manualBs && manualBs.length > 0) {
            manualIds = manualBs.map((item: any) => item.product_id);
          }
        } catch (mErr) {
          // Table may not exist yet
        }

        const { data: bsConfig, error: bsError } = await supabase
          .from('best_sellers_config')
          .select('*')
          .limit(1)
          .single();
          
        const configLimit = bsConfig?.limit_count || 8;
        const isActive = bsConfig ? bsConfig.is_active : true;

        if (bsConfig) {
          setBestSellersConfig(bsConfig);
        }

        if (isActive && mappedProducts && mappedProducts.length > 0) {
          // Check for products marked as Best Seller via admin checkbox or manual table
          const checkboxBestSellers = mappedProducts.filter(p => 
            p.isBestSeller || manualIds.includes(p.id)
          );

          if (checkboxBestSellers.length > 0) {
            // Sort to respect display order if present in manualIds
            const sortedBs = [...checkboxBestSellers].sort((a, b) => {
              const idxA = manualIds.indexOf(a.id);
              const idxB = manualIds.indexOf(b.id);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return 0;
            });
            setBestSellersData(sortedBs.slice(0, configLimit));
          } else if (bsConfig && bsConfig.mode === 'auto') {
            const { data: autoBs } = await supabase.rpc('get_auto_best_sellers', { limit_val: configLimit });
            if (autoBs && autoBs.length > 0) {
              const autoIds = autoBs.map((item: any) => item.product_id);
              const sortedAutoBs = autoIds.map(id => mappedProducts.find(p => p.id === id)).filter(Boolean);
              if (sortedAutoBs.length < configLimit) {
                const more = mappedProducts.filter(p => !autoIds.includes(p.id)).slice(0, configLimit - sortedAutoBs.length);
                setBestSellersData([...sortedAutoBs, ...more]);
              } else {
                setBestSellersData(sortedAutoBs);
              }
            } else {
              setBestSellersData(mappedProducts.slice(0, configLimit));
            }
          } else {
            setBestSellersData(mappedProducts.slice(0, configLimit));
          }
        }
      } catch (err) {
        console.warn('Best sellers fetch failed, using fallback.', err);
        if (mappedProducts) {
          setBestSellersData(mappedProducts.slice(0, 4));
        }
      }


      // Fetch hero data with responsive caching support
      const cachedHero = localStorage.getItem('jayliam_hero_responsive_data');
      let cachedHeroObj: any = null;
      if (cachedHero) {
        try { cachedHeroObj = JSON.parse(cachedHero); } catch (e) {}
      }

      const { data: hero } = await supabase
        .from('hero_sections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (hero) {
        setHeroData({
          ...hero,
          image_url_tablet: hero.image_url_tablet || cachedHeroObj?.image_url_tablet,
          image_url_mobile: hero.image_url_mobile || cachedHeroObj?.image_url_mobile,
        });
      } else if (cachedHeroObj) {
        setHeroData(cachedHeroObj);
      }
      
      // Fetch promotional banner data with responsive caching support
      const cachedPromo = localStorage.getItem('jayliam_banner_responsive_data');
      let cachedPromoObj: any = null;
      if (cachedPromo) {
        try { cachedPromoObj = JSON.parse(cachedPromo); } catch (e) {}
      }

      const { data: banner } = await supabase
        .from('banners')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (banner) {
        setPromoBannerData({
          ...banner,
          image_url_tablet: banner.image_url_tablet || cachedPromoObj?.image_url_tablet,
          image_url_mobile: banner.image_url_mobile || cachedPromoObj?.image_url_mobile,
          show_text_overlay: banner.show_text_overlay !== undefined ? banner.show_text_overlay : cachedPromoObj?.show_text_overlay,
        });
      } else if (cachedPromoObj) {
        setPromoBannerData(cachedPromoObj);
      }

    } catch (error) {
      if (error && error.code === 'PGRST205') {
        console.warn('Error fetching data:' + ' (Brands table missing, ignored)');
      } else {
        console.error('Error fetching data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow bg-[#F8FAFC]">
      {/* Premium Hero Section - Fluid & Responsive across 320px to 3840px */}
      <section className="relative w-full min-h-[380px] xs:min-h-[420px] sm:min-h-[480px] md:min-h-[540px] lg:min-h-[620px] xl:min-h-[680px] 2xl:min-h-[720px] max-h-[820px] flex items-center border-b border-[#E5EAF2] overflow-hidden bg-slate-950">
        {/* Responsive Background Image (Desktop, Tablet, Mobile) */}
        <div className="absolute inset-0 z-0 w-full h-full">
          <ResponsiveBannerImage
            desktopUrl={heroData?.image_url}
            tabletUrl={heroData?.image_url_tablet}
            mobileUrl={heroData?.image_url_mobile}
            fallbackUrl="https://images.unsplash.com/photo-1550009158-9ebf6d1736de?q=80&w=2000&auto=format&fit=crop"
            alt={heroData?.headline || "Jayliam Tech Hero Banner"}
            priority={true}
            imgClassName="w-full h-full object-cover object-center sm:object-right-top md:object-center"
          />
        </div>
        
        {/* Layered Gradient Overlays - Optical Readability Protection */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/95 via-black/80 to-black/35 md:via-black/60 md:to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent sm:hidden pointer-events-none" />

        {/* Content Container - Constrained for ultra-wide TVs / Large Monitors */}
        <div className="max-w-[1440px] 2xl:max-w-[1720px] w-full mx-auto px-3.5 xs:px-4 sm:px-6 lg:px-12 relative z-20">
          <div className="py-7 xs:py-9 sm:py-12 md:py-16 lg:py-20 flex flex-col items-start w-full max-w-[720px]">
            <span className="text-[10px] xs:text-[11px] sm:text-[12px] md:text-[13px] font-bold text-white/95 tracking-[0.14em] sm:tracking-[0.18em] uppercase mb-2.5 sm:mb-3.5 block border border-white/20 rounded-full px-2.5 xs:px-3 sm:px-4 py-1 sm:py-1.5 backdrop-blur-sm bg-white/10 shadow-sm">
              WELCOME TO JAYLIAM TECH
            </span>
            <h1 
              className="font-extrabold text-white tracking-tight leading-[1.14] mb-1.5 sm:mb-2 drop-shadow-lg"
              style={{ fontSize: 'clamp(1.65rem, 5vw + 0.35rem, 4rem)' }}
            >
              <span className="block sm:hidden">
                {(heroData?.headline || 'Elevate Your Digital Lifestyle.').replace(/\\n/g, ' ').replace(/\n/g, ' ')}
              </span>
              <span className="hidden sm:block whitespace-pre-line">
                {heroData?.headline?.replace('\\n', '\n') || 'Elevate Your Digital\nLifestyle.'}
              </span>
            </h1>
            <h2 
              className="font-extrabold text-[#38bdf8] tracking-tight leading-[1.14] mb-3 sm:mb-5 drop-shadow-md"
              style={{ fontSize: 'clamp(1.35rem, 4.2vw + 0.25rem, 3.25rem)' }}
            >
              {heroData?.highlighted_text || 'Premium Tech'}
            </h2>
            <p 
              className="text-gray-200 w-full mb-5 sm:mb-7 leading-relaxed drop-shadow max-w-xl line-clamp-3 xs:line-clamp-4 sm:line-clamp-none"
              style={{ fontSize: 'clamp(0.8125rem, 1.2vw + 0.45rem, 1.0625rem)' }}
            >
              {heroData?.description || 'Discover the latest premium smartphones, cutting-edge laptops, and high-fidelity audio equipment. Expertly curated for the modern professional.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 w-full sm:w-auto">
              <Link 
                to={heroData?.primary_btn_link || '/shop'} 
                className="bg-[#38bdf8] hover:bg-[#0284c7] text-white font-semibold py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl flex items-center justify-center text-[13px] xs:text-[14px] sm:text-[15px] transition-all shadow-lg hover:shadow-xl active:scale-[0.98] min-h-[46px] sm:min-h-[48px] text-center"
              >
                {heroData?.primary_btn_text || 'Shop New Arrivals'}
              </Link>
              <Link 
                to={heroData?.secondary_btn_link || '/shop?sale=true'} 
                className="bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-medium py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl flex items-center justify-center text-[13px] xs:text-[14px] sm:text-[15px] transition-all shadow-lg hover:shadow-xl active:scale-[0.98] min-h-[46px] sm:min-h-[48px] text-center"
              >
                {heroData?.secondary_btn_text || 'View Special Offers'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Section - Clean, Modern, Elegant Horizontal Scroll Row */}
      <section className="py-8 sm:py-12 bg-white border-b border-slate-100 relative">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Section Header - Just "Shop by Categories" */}
          <div className="flex items-center justify-between mb-5 sm:mb-6 pb-3 border-b border-slate-100">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#082B52] tracking-tight">
              Shop by Categories
            </h2>
            
            {/* Horizontal Navigation Arrows */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => scrollCategories('left')}
                disabled={!canScrollLeft}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-[#082B52] hover:bg-[#F8FAFC] hover:border-[#087FF5]/40 hover:text-[#087FF5] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                aria-label="Scroll categories left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollCategories('right')}
                disabled={!canScrollRight}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-[#082B52] hover:bg-[#F8FAFC] hover:border-[#087FF5]/40 hover:text-[#087FF5] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                aria-label="Scroll categories right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {/* Horizontal Track with Edge Fade Gradients */}
          <div className="relative group">
            {/* Left Edge Shadow Fade (visible when scrolled) */}
            <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 z-10 bg-gradient-to-r from-white to-transparent transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
            
            {/* Right Edge Shadow Fade (visible when can scroll right) */}
            <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 z-10 bg-gradient-to-l from-white to-transparent transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

            <div 
              ref={categoryScrollRef}
              onScroll={checkCategoryScroll}
              className="flex gap-3.5 sm:gap-5 overflow-x-auto scroll-smooth py-2 px-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {(categories.length > 0 ? categories : defaultCategoriesList).map((c) => (
                <div key={c.id || c.slug || c.name} className="shrink-0 w-[165px] xs:w-[185px] sm:w-[210px] md:w-[230px] lg:w-[245px] snap-start">
                  <CategoryCard category={c} className="h-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Brands Showcase (Samsung, Apple, Infinix, Tecno, etc.) */}
      {brandsData.map((brand, bIdx) => {
        if (!brand.name) return null;
        const brandNameLower = brand.name.toLowerCase();
        const brandSlugLower = (brand.slug || '').toLowerCase();
        if (['jayliam', 'accessories', 'accessory'].includes(brandNameLower) || ['jayliam', 'accessories', 'accessory'].includes(brandSlugLower)) {
          return null;
        }

        const brandProducts = allProducts.filter(p => 
          p.brand && p.brand.toLowerCase() === brandNameLower
        );
        if (brandProducts.length === 0) return null;

        const viewAllLink = `/shop?brand=${encodeURIComponent(brand.name)}`;

        return (
          <section key={`brand-section-${brand.id || brand.slug || bIdx}`} className="py-8 sm:py-12 bg-white">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
              <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-[#E5EAF2] pb-4 gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {brand.logo_url && (
                    <img src={brand.logo_url} alt={brand.name} className="h-6 sm:h-8 object-contain shrink-0" />
                  )}
                  <h2 className="text-xl sm:text-2xl font-bold text-[#082B52] truncate">{brand.name}</h2>
                </div>
                <Link to={viewAllLink} className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-medium text-[#087FF5] hover:text-[#1D4ED8] transition-colors group shrink-0 whitespace-nowrap">
                  View all <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="relative group">
                <div className="flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth pb-6 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {brandProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[165px] xs:w-[185px] sm:w-[220px] md:w-[240px] lg:w-[260px] snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Dedicated Accessories Category Showcase (Accessories is a Category, NOT a brand) */}
      {(() => {
        const accessoryProducts = allProducts.filter(p => p.isAccessory || p.categoryName?.toLowerCase().includes('accessor'));
        if (accessoryProducts.length === 0) return null;

        return (
          <section className="py-8 sm:py-12 bg-[#F8FAFC] border-y border-[#E5EAF2]">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
              <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-[#E5EAF2] pb-4 gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#EBF5FF] flex items-center justify-center text-[#087FF5] shrink-0">
                    <Headphones size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#082B52] truncate">Accessories</h2>
                    <p className="text-xs sm:text-sm text-[#64748B] hidden sm:block">Cases, chargers, cables, audio & essentials</p>
                  </div>
                </div>
                <Link to="/shop?category=accessories" className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-medium text-[#087FF5] hover:text-[#1D4ED8] transition-colors group shrink-0 whitespace-nowrap">
                  View all accessories <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="relative group">
                <div className="flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth pb-6 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {accessoryProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[165px] xs:w-[185px] sm:w-[220px] md:w-[240px] lg:w-[260px] snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Popular Products */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white border-y border-[#E5EAF2]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#082B52]">Popular Products</h2>
            </div>
            <Link to="/shop" className="inline-flex items-center gap-1 text-[14px] sm:text-[15px] font-medium text-[#087FF5] hover:text-[#1D4ED8] transition-colors group whitespace-nowrap">
              View all <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 xl:gap-8">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="border border-[#E5EAF2] rounded-xl bg-white p-4 flex flex-col h-[340px] sm:h-[380px]">
                  <div className="aspect-square bg-[#F8FAFC] animate-pulse rounded-lg mb-4" />
                  <div className="h-3 bg-[#F8FAFC] animate-pulse rounded w-1/3 mb-2" />
                  <div className="h-4 bg-[#F8FAFC] animate-pulse rounded w-3/4 mb-auto" />
                  <div className="h-9 bg-[#F8FAFC] animate-pulse rounded-lg mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 xl:gap-8">
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotional Banner Section - Fits All Phones, Tablets & Desktops Without Cropping */}
      <section className="py-6 sm:py-10 md:py-14 bg-[#F8FAFC]">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-3.5 xs:px-4 sm:px-6 lg:px-12">
          {promoBannerData?.status !== 'inactive' && (
            <div className="w-full">
              {promoBannerData?.show_text_overlay === true && promoBannerData?.title && promoBannerData.title !== 'Promo Banner' ? (
                <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-[#E5EAF2] transition-all bg-slate-900 group">
                  {/* Real responsive picture that scales naturally with width without being cropped as a background */}
                  <ResponsiveBannerImage
                    desktopUrl={promoBannerData?.image_url}
                    tabletUrl={promoBannerData?.image_url_tablet}
                    mobileUrl={promoBannerData?.image_url_mobile}
                    fallbackUrl="https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000&auto=format&fit=crop"
                    alt={promoBannerData?.title || 'Promotional Banner'}
                    className="w-full block"
                    imgClassName="w-full h-auto block"
                  />

                  {/* Optional HTML Text Overlay */}
                  <div className="absolute inset-0 z-10 flex items-center bg-gradient-to-r from-black/85 via-black/55 to-transparent sm:via-black/40 p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12">
                    <div className="max-w-[640px] flex flex-col items-start justify-center">
                      <h3 
                        className="font-extrabold text-white leading-tight mb-1.5 sm:mb-2 drop-shadow-md"
                        style={{ fontSize: 'clamp(1.15rem, 2.6vw + 0.4rem, 2.25rem)' }}
                      >
                        {promoBannerData.title}
                      </h3>
                      {promoBannerData.subtitle && (
                        <p 
                          className="text-slate-200 line-clamp-2 sm:line-clamp-3 leading-snug mb-3.5 sm:mb-5 max-w-md drop-shadow"
                          style={{ fontSize: 'clamp(0.75rem, 1.2vw + 0.35rem, 1rem)' }}
                        >
                          {promoBannerData.subtitle}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        {promoBannerData.btn_text && (
                          <Link 
                            to={promoBannerData.btn_link || '/shop'} 
                            className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold min-h-[40px] flex items-center justify-center shadow-md active:scale-95 transition-all"
                          >
                            {promoBannerData.btn_text}
                          </Link>
                        )}
                        {promoBannerData.secondary_btn_text && (
                          <Link 
                            to={promoBannerData.secondary_btn_link || '/shop'} 
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium min-h-[40px] flex items-center justify-center active:scale-95 transition-all"
                          >
                            {promoBannerData.secondary_btn_text}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Pure Graphic Banner Mode - 100% full image fits all phones & tablets without cropping */
                <Link 
                  to={promoBannerData?.btn_link || '/shop'}
                  className="block w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-[#E5EAF2] transition-all group bg-white focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                  aria-label={promoBannerData?.title || 'Promotional Banner'}
                >
                  <ResponsiveBannerImage
                    desktopUrl={promoBannerData?.image_url}
                    tabletUrl={promoBannerData?.image_url_tablet}
                    mobileUrl={promoBannerData?.image_url_mobile}
                    fallbackUrl="https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000&auto=format&fit=crop"
                    alt={promoBannerData?.title || 'Promotional Banner'}
                    className="w-full block"
                    imgClassName="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.008]"
                  />
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us - Horizontal Trust Features */}
      <section className="pb-8 lg:pb-12 bg-[#F8FAFC] -mt-3 sm:-mt-6 relative z-10">
        <div className="max-w-[1440px] mx-auto px-3.5 xs:px-4 sm:px-6 lg:px-12">
          <div className="bg-[#082B52] rounded-2xl shadow-md border border-[#0A3668] overflow-hidden relative">
            {/* Mobile Phone Mode: Smooth Continuous CSS Marquee Animation */}
            <div className="block sm:hidden relative overflow-hidden py-1">
              {/* Soft Edge Gradient Fades for Smooth Entrance/Exit */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-[#082B52] to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-[#082B52] to-transparent" />

              <div className="animate-trust-marquee flex items-center select-none py-1.5">
                {/* Render two identical sets for seamless 100% gapless CSS infinite marquee loop */}
                {[0, 1].map((copyIndex) => (
                  <div key={copyIndex} className="flex items-center shrink-0">
                    {[
                      { title: "Fast & Reliable", desc: "Swift doorstep delivery across Kenya.", icon: Truck },
                      { title: "100% Genuine", desc: "Verified authentic brand products.", icon: ShieldCheck },
                      { title: "Easy Returns", desc: "Hassle-free 7-day return policy.", icon: RefreshCcw },
                      { title: "24/7 Support", desc: "Dedicated expert tech assistance.", icon: HeadphonesIcon }
                    ].map((feature, idx) => (
                      <div 
                        key={`${copyIndex}-${idx}`} 
                        className="shrink-0 w-[230px] px-3.5 py-2 flex items-center gap-3 border-r border-white/10"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 text-[#38bdf8] flex items-center justify-center animate-badge-pulse shadow-sm">
                          <feature.icon size={17} strokeWidth={2} />
                        </div>
                        <div className="text-left flex-grow overflow-hidden">
                          <h3 className="text-xs font-bold text-white mb-0.5 leading-tight truncate">{feature.title}</h3>
                          <p className="text-slate-300 text-[10.5px] leading-snug truncate">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Tablet & Desktop Mode: High-Density Structured Grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              {[
                { title: "Fast & Reliable", desc: "Swift doorstep delivery across Kenya.", icon: Truck },
                { title: "100% Genuine", desc: "Verified authentic brand products.", icon: ShieldCheck },
                { title: "Easy Returns", desc: "Hassle-free 7-day return policy.", icon: RefreshCcw },
                { title: "24/7 Support", desc: "Dedicated expert tech assistance.", icon: HeadphonesIcon }
              ].map((feature, idx) => (
                <div key={idx} className="p-3.5 sm:p-4 lg:p-5 flex items-center justify-start md:justify-start lg:justify-center gap-3 sm:gap-3.5 group transition-colors hover:bg-white/5">
                  <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 text-[#38bdf8] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#38bdf8] group-hover:text-[#082B52] transition-all duration-300">
                    <feature.icon size={18} className="lg:w-5 lg:h-5" strokeWidth={1.75} />
                  </div>
                  <div className="text-left flex-grow">
                    <h3 className="text-xs sm:text-[13px] lg:text-sm font-bold text-white mb-0.5 leading-tight">{feature.title}</h3>
                    <p className="text-slate-300 text-[11px] lg:text-xs leading-snug whitespace-nowrap">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      {bestSellersConfig?.is_active && bestSellersData.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-white border-y border-[#E5EAF2]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex justify-between items-center mb-8 sm:mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#082B52]">{bestSellersConfig?.title || 'Our Best-Selling Products'}</h2>
              </div>
              <Link to="/shop?sort=popular" className="inline-flex items-center gap-1 text-[14px] sm:text-[15px] font-medium text-[#087FF5] hover:text-[#1D4ED8] transition-colors group whitespace-nowrap">
                View all <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 xl:gap-8">
              {bestSellersData.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop by Brand Section */}
      <section id="shop-by-brand" className="py-12 sm:py-16 lg:py-20 bg-[#F8FAFC] border-b border-[#E5EAF2]">
        <div className="max-w-[1440px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3 sm:gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#082B52] tracking-tight">
                Shop by Brand
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] mt-1 sm:mt-2">
                Find your favorite devices and accessories from trusted brands.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-[14px] sm:text-[15px] font-semibold text-[#087FF5] hover:text-[#1D4ED8] transition-colors group self-start sm:self-auto whitespace-nowrap"
            >
              <span>View all inventory</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-5">
            {brandsData.map((brand, idx) => (
              <BrandCard
                key={`brand-card-${brand.id || brand.slug || idx}`}
                brand={brand}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
