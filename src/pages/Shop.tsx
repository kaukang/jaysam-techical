import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { api } from '../api';
import { Product } from '../types';
import { STORE_CONFIG } from '../config';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const brandQuery = searchParams.get('brand');
  const searchQueryParam = searchParams.get('search') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>(STORE_CONFIG.categories);

  useEffect(() => {
    fetchData();
  }, [categoryId, brandQuery, searchQueryParam]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch dynamic categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('status', 'active')
        .order('display_order', { ascending: true });
        
      if (catData && catData.length > 0) {
        setCategories(catData.map(c => ({ id: c.id, name: c.name })));
      }

      // Resolve category filter (handles both UUIDs and slugs like 'accessories')
      let resolvedCategoryId = categoryId;
      let isAccessoryFilter = false;
      if (categoryId) {
        const catMatch = catData?.find((c: any) => 
          c.id === categoryId || 
          c.slug?.toLowerCase() === categoryId.toLowerCase() || 
          c.name?.toLowerCase() === categoryId.toLowerCase()
        );
        if (catMatch) {
          resolvedCategoryId = catMatch.id;
          if (catMatch.slug === 'accessories' || catMatch.name?.toLowerCase().includes('accessor')) {
            isAccessoryFilter = true;
          }
        } else if (categoryId.toLowerCase() === 'accessories') {
          isAccessoryFilter = true;
        }
      }

      // Fetch products from Supabase
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (id, name, slug),
          product_images (image_url, is_primary)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (isAccessoryFilter) {
        query = query.or(`category_id.eq.${resolvedCategoryId},is_accessory.eq.true`);
      } else if (resolvedCategoryId) {
        query = query.eq('category_id', resolvedCategoryId);
      }
      if (brandQuery) {
        query = query.ilike('brand', brandQuery);
      }
      if (searchQueryParam) {
        query = query.or(`name.ilike.%${searchQueryParam}%,brand.ilike.%${searchQueryParam}%,short_description.ilike.%${searchQueryParam}%`);
      }

      const { data: productsData } = await query;

      if (productsData) {
        // Map database products to the application's Product type
        const mappedProducts = productsData.map((p: any) => {
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
            isAccessory: isAccessory
          };
        });

        setProducts(mappedProducts);
      } else {
        // Fallback to local
        const data = await api.getProducts(categoryId || undefined);
        let filtered = categoryId ? data.filter(p => p.categoryId === categoryId) : data;
        if (searchQueryParam) {
          filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQueryParam.toLowerCase()) || p.brand.toLowerCase().includes(searchQueryParam.toLowerCase()));
        }
        setProducts(filtered);
      }
    } catch (error) {
      if (error && (error as any).code === 'PGRST205') {
        console.warn('Error fetching data: Brands table missing, ignored');
      } else {
        console.error('Error fetching data:', error);
      }
      // Fallback
      const data = await api.getProducts(categoryId || undefined);
      let filtered = categoryId ? data.filter(p => p.categoryId === categoryId) : data;
      if (brandQuery) {
        filtered = filtered.filter(p => p.brand.toLowerCase() === brandQuery.toLowerCase());
      }
      if (searchQueryParam) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQueryParam.toLowerCase()) || p.brand.toLowerCase().includes(searchQueryParam.toLowerCase()));
      }
      setProducts(filtered);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow py-6 sm:py-8 md:py-12 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-12">
        <header className="mb-6 sm:mb-8 md:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#082B52] tracking-tight mb-1">
                Explore Inventory
              </h1>
              <p className="text-slate-500 font-normal text-xs sm:text-sm md:text-base">
                {loading ? 'Loading inventory...' : `${products.length} products available`}
                {searchQueryParam && <span className="font-semibold text-[#087FF5]"> matching "{searchQueryParam}"</span>}
                {brandQuery && <span className="font-semibold text-[#087FF5]"> for {brandQuery}</span>}
              </p>
            </div>
            {(searchQueryParam || categoryId || brandQuery) && (
              <Link to="/shop" className="text-[13px] font-semibold text-[#087FF5] hover:underline self-start sm:self-end">
                Reset filters
              </Link>
            )}
          </div>
          
          {/* Category Pills - Scrollable on mobile */}
          <div className="flex overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 gap-2 sm:gap-3 scrollbar-hide">
            <Link 
              to="/shop"
              className={`whitespace-nowrap px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[13px] sm:text-[14px] font-medium transition-all ${
                !categoryId 
                  ? 'bg-[#087FF5] text-white shadow-sm font-semibold' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              All Products
            </Link>
            {categories.map(c => (
              <Link 
                key={c.id || c.name}
                to={`/shop?category=${c.id}`}
                className={`whitespace-nowrap px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[13px] sm:text-[14px] font-medium transition-all ${
                  categoryId === c.id 
                    ? 'bg-[#087FF5] text-white shadow-sm font-semibold' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 xl:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="border border-slate-200 rounded-2xl bg-white p-4 h-[340px] sm:h-[380px] animate-pulse">
                 <div className="aspect-square bg-slate-50 animate-pulse rounded-xl mb-4" />
                 <div className="h-3 bg-slate-100 animate-pulse rounded w-1/3 mb-2" />
                 <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4 mb-auto" />
                 <div className="h-8 bg-slate-100 animate-pulse rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 xl:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 sm:py-24 text-center bg-white rounded-2xl border border-slate-200 max-w-2xl mx-auto mt-6 sm:mt-12 shadow-sm px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#F8FAFC] text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Search size={22} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-500 mb-6 font-normal text-sm">We couldn't find any devices matching your search or filters.</p>
            <Link to="/shop" className="inline-flex items-center justify-center px-6 py-3 bg-[#087FF5] text-white font-medium rounded-xl hover:bg-[#0666C5] transition-all shadow-sm text-sm min-h-[44px]">
              Clear filters
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
