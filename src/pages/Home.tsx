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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [categories, setCategories] = useState<any[]>([]);

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

          return {
            id: p.id,
            brand: p.brand || 'JAYLIAM',
            name: p.name,
            spec: p.short_description || '',
            price: p.price,
            oldPrice: p.old_price,
            currency: 'KES',
            availability: p.stock_quantity > 10 ? 'In Stock' : p.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock',
            imageUrl: primaryImage,
            categoryId: p.category_id,
            isFeatured: p.is_featured
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
        if (key) {
          brandMap.set(key, { ...b });
        }
      });

      // 2. Overlay any local custom/admin brand updates (e.g. uploaded logos & display order)
      customBrands.forEach((cb: any) => {
        const key = normalizeBrandKey(cb);
        if (key) {
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

      // 3. Add any brands from active products not yet in the map
      if (mappedProducts.length > 0) {
        const productBrands = Array.from(new Set(mappedProducts.map(p => p.brand).filter(Boolean)));
        for (const pb of productBrands) {
          const key = normalizeBrandKey({ name: pb });
          if (key && !brandMap.has(key)) {
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
        if (key && !brandMap.has(key)) {
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
        .filter((b: any) => b.is_active !== false && b.name)
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
        const { data: bsConfig, error: bsError } = await supabase
          .from('best_sellers_config')
          .select('*')
          .limit(1)
          .single();
          
        if (bsConfig) {
          setBestSellersConfig(bsConfig);
          if (bsConfig.is_active && mappedProducts) {
            if (bsConfig.mode === 'auto') {
               const { data: autoBs } = await supabase.rpc('get_auto_best_sellers', { limit_val: bsConfig.limit_count });
               if (autoBs && autoBs.length > 0) {
                 const autoIds = autoBs.map((item: any) => item.product_id);
                 const sortedAutoBs = autoIds.map(id => mappedProducts.find(p => p.id === id)).filter(Boolean);
                 // Fallback if not enough data
                 if (sortedAutoBs.length < bsConfig.limit_count) {
                   const more = mappedProducts.filter(p => !autoIds.includes(p.id)).slice(0, bsConfig.limit_count - sortedAutoBs.length);
                   setBestSellersData([...sortedAutoBs, ...more]);
                 } else {
                   setBestSellersData(sortedAutoBs);
                 }
               } else {
                 setBestSellersData(mappedProducts.slice(0, bsConfig.limit_count));
               }
            } else {
               const { data: manualBs } = await supabase
                 .from('best_seller_products')
                 .select('product_id')
                 .order('display_order', { ascending: true })
                 .limit(bsConfig.limit_count);
                 
               if (manualBs && manualBs.length > 0) {
                 const manualIds = manualBs.map((item: any) => item.product_id);
                 const sortedManualBs = manualIds.map(id => mappedProducts.find(p => p.id === id)).filter(Boolean);
                 setBestSellersData(sortedManualBs);
               } else {
                 setBestSellersData(mappedProducts.slice(0, bsConfig.limit_count));
               }
            }
          }
        } else {
          // If no config found but no error (empty table), fallback to defaults
          setBestSellersData(mappedProducts.slice(0, 4));
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

      {/* Trust Indicators */}
      <section className="bg-white py-8 sm:py-10 border-b border-[#E5EAF2]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-0 md:divide-x divide-[#E5EAF2]">
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3 p-2 sm:p-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F4F9FF] flex items-center justify-center text-[#087FF5]">
                <Truck size={22} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[13px] sm:text-[15px] font-bold text-[#082B52]">Fast Delivery</h3>
                <p className="text-[11px] sm:text-[13px] text-[#64748B] mt-0.5">Across Kenya</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3 p-2 sm:p-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F4F9FF] flex items-center justify-center text-[#087FF5]">
                <ShieldCheck size={22} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[13px] sm:text-[15px] font-bold text-[#082B52]">Genuine Products</h3>
                <p className="text-[11px] sm:text-[13px] text-[#64748B] mt-0.5">100% Original</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3 p-2 sm:p-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F4F9FF] flex items-center justify-center text-[#087FF5]">
                <Award size={22} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[13px] sm:text-[15px] font-bold text-[#082B52]">Secure Payments</h3>
                <p className="text-[11px] sm:text-[13px] text-[#64748B] mt-0.5">Safe Shopping</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3 p-2 sm:p-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F4F9FF] flex items-center justify-center text-[#087FF5]">
                <HeadphonesIcon size={22} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[13px] sm:text-[15px] font-bold text-[#082B52]">Expert Support</h3>
                <p className="text-[11px] sm:text-[13px] text-[#64748B] mt-0.5">We're Here to Help</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#082B52]">Browse Our Categories</h2>
          </div>
          
          <div className="relative group">
            {/* Navigation Buttons (Desktop) */}
            <button 
              onClick={() => scrollCategories('left')}
              className="hidden md:flex absolute -left-4 lg:-left-5 top-1/2 -translate-y-1/2 w-11 h-11 lg:w-12 lg:h-12 bg-white rounded-full shadow-[0_4px_20px_rgba(8,43,82,0.1)] items-center justify-center text-[#082B52] hover:text-[#087FF5] hover:shadow-[0_8px_30px_rgba(8,43,82,0.15)] transition-all z-10 opacity-0 group-hover:opacity-100 disabled:opacity-0"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => scrollCategories('right')}
              className="hidden md:flex absolute -right-4 lg:-right-5 top-1/2 -translate-y-1/2 w-11 h-11 lg:w-12 lg:h-12 bg-white rounded-full shadow-[0_4px_20px_rgba(8,43,82,0.1)] items-center justify-center text-[#082B52] hover:text-[#087FF5] hover:shadow-[0_8px_30px_rgba(8,43,82,0.15)] transition-all z-10 opacity-0 group-hover:opacity-100 disabled:opacity-0"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex gap-3 sm:gap-5 lg:gap-6 overflow-x-auto scroll-smooth pb-6 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {categories.length > 0 ? (
                categories.map((c) => {
                  let Icon = Smartphone;
                  if (c.slug?.includes('laptop')) Icon = Laptop;
                  if (c.slug?.includes('tablet')) Icon = Monitor;
                  if (c.slug?.includes('watch')) Icon = Watch;
                  if (c.slug?.includes('audio') || c.slug?.includes('headphone')) Icon = HeadphonesIcon;
                  if (c.slug?.includes('appliance')) Icon = HomeIcon;
                  if (c.slug?.includes('repair')) Icon = Check;

                  return (
                    <Link key={c.id || c.name || `cat-${c.name}`} to={`/shop?category=${c.id}`} className="flex-shrink-0 w-[145px] xs:w-[165px] sm:w-[190px] md:w-[210px] lg:w-[230px] group flex flex-col items-center text-center bg-white border border-[#E5EAF2] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#087FF5]/30 hover:shadow-[0_12px_40px_rgba(8,43,82,0.08)] snap-start">
                      <div className="w-full aspect-[4/3] bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden group-hover:bg-[#F4F9FF] transition-colors">
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#087FF5]/40 group-hover:text-[#087FF5] transition-colors duration-500 group-hover:scale-110">
                            <Icon size={40} className="sm:w-12 sm:h-12" strokeWidth={1.2} />
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 w-full border-t border-[#E5EAF2]/50 bg-white">
                        <h3 className="text-[14px] sm:text-[16px] font-bold text-[#082B52] group-hover:text-[#087FF5] transition-colors truncate">{c.name}</h3>
                      </div>
                    </Link>
                  );
                })
              ) : (
                [
                  { id: 'smartphones', name: 'Smartphones', icon: Smartphone },
                  { id: 'laptops', name: 'Laptops', icon: Laptop },
                  { id: 'tablets', name: 'Tablets', icon: Monitor },
                  { id: 'accessories', name: 'Accessories', icon: Headphones },
                  { id: 'smartwatches', name: 'Smartwatches', icon: Watch },
                  { id: 'headphones', name: 'Headphones', icon: HeadphonesIcon },
                  { id: 'appliances', name: 'Home Appliances', icon: HomeIcon },
                  { id: 'repairs', name: 'Phone Repairs', icon: Check },
                ].map(c => (
                  <Link key={c.id || c.name || `cat-${c.name}`} to={`/shop?category=${c.id}`} className="flex-shrink-0 w-[145px] xs:w-[165px] sm:w-[190px] md:w-[210px] lg:w-[230px] group flex flex-col items-center text-center bg-white border border-[#E5EAF2] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#087FF5]/30 hover:shadow-[0_12px_40px_rgba(8,43,82,0.08)] snap-start">
                    <div className="w-full aspect-[4/3] bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden group-hover:bg-[#F4F9FF] transition-colors">
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#087FF5]/40 group-hover:text-[#087FF5] transition-colors duration-500 group-hover:scale-110">
                        <c.icon size={40} className="sm:w-12 sm:h-12" strokeWidth={1.2} />
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 w-full border-t border-[#E5EAF2]/50 bg-white">
                      <h3 className="text-[14px] sm:text-[16px] font-bold text-[#082B52] group-hover:text-[#087FF5] transition-colors truncate">{c.name}</h3>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Brand Products */}
      {brandsData.map((brand, bIdx) => {
        const brandProducts = allProducts.filter(p => p.brand?.toLowerCase() === brand.name?.toLowerCase());
        if (brandProducts.length === 0) return null;

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
                <Link to={`/shop?brand=${encodeURIComponent(brand.name)}`} className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-medium text-[#087FF5] hover:text-[#1D4ED8] transition-colors group shrink-0 whitespace-nowrap">
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

      {/* Promotional Banner Section - Fluid, Responsive & Adaptive across 320px to 3840px */}
      <section className="py-8 sm:py-12 md:py-16 bg-[#F8FAFC]">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-3.5 xs:px-4 sm:px-6 lg:px-12">
          {promoBannerData?.status !== 'inactive' && (
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#E5EAF2] hover:shadow-lg transition-all group bg-slate-900">
              <div className="relative w-full aspect-[4/3] xs:aspect-[16/10] sm:aspect-[21/9] md:aspect-[2.6/1] lg:aspect-[3.1/1] min-h-[190px] xs:min-h-[220px] sm:min-h-[260px] md:min-h-[300px] max-h-[460px] flex items-center">
                {/* Responsive picture artwork with intelligent fallback */}
                <ResponsiveBannerImage
                  desktopUrl={promoBannerData?.image_url}
                  tabletUrl={promoBannerData?.image_url_tablet}
                  mobileUrl={promoBannerData?.image_url_mobile}
                  fallbackUrl="https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000&auto=format&fit=crop"
                  alt={promoBannerData?.title || 'Promotional Banner'}
                  className="absolute inset-0 w-full h-full block"
                  imgClassName="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                />

                {/* Optional HTML Text Overlay (Active when title exists and not explicitly disabled) */}
                {promoBannerData?.show_text_overlay !== false && promoBannerData?.title && promoBannerData.title !== 'Promo Banner' ? (
                  <div className="absolute inset-0 z-10 flex items-center bg-gradient-to-r from-black/85 via-black/55 to-transparent sm:via-black/40">
                    <div className="p-4 xs:p-6 sm:p-8 md:p-10 lg:p-12 max-w-[640px] flex flex-col items-start justify-center">
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
                ) : (
                  /* Whole banner is a clickable link when used as pure artwork */
                  promoBannerData?.btn_link && (
                    <Link 
                      to={promoBannerData.btn_link} 
                      className="absolute inset-0 z-10" 
                      aria-label={promoBannerData?.title || 'Shop Promotion'} 
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="pb-8 lg:pb-12 bg-[#F8FAFC] -mt-4 sm:-mt-6 relative z-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="bg-[#082B52] rounded-xl shadow-md border border-[#0A3668] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              {[
                { title: "Fast & Reliable", desc: "Swift doorstep delivery.", icon: Truck },
                { title: "100% Genuine", desc: "Verified authentic products.", icon: ShieldCheck },
                { title: "Easy Returns", desc: "Hassle-free return policy.", icon: RefreshCcw },
                { title: "24/7 Support", desc: "Always here to help you.", icon: HeadphonesIcon }
              ].map((feature, idx) => (
                <div key={idx} className="p-3.5 sm:p-4 lg:p-5 flex items-center justify-start sm:justify-center md:justify-start lg:justify-center gap-3 sm:gap-4 group transition-colors hover:bg-white/5">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-white/10 text-[#38bdf8] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#38bdf8] group-hover:text-[#082B52] transition-all duration-300">
                    <feature.icon size={18} className="lg:w-5 lg:h-5" strokeWidth={1.5} />
                  </div>
                  <div className="text-left flex-grow max-w-[200px]">
                    <h3 className="text-[13px] lg:text-[14px] font-bold text-white mb-0.5 leading-tight">{feature.title}</h3>
                    <p className="text-slate-300 text-[11px] lg:text-[12px] leading-snug">{feature.desc}</p>
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
