import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ArrowLeft, Shield, Truck, ShoppingCart, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // First try to fetch from Supabase
      // Check if id is a uuid to know if we should search supabase or fallback api
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '');

      if (isUUID) {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories (id, name, slug),
            product_images (image_url, is_primary)
          `)
          .eq('id', id)
          .single();

        if (data && !error) {
          const primaryImage = data.product_images?.find((img: any) => img.is_primary)?.image_url 
            || data.product_images?.[0]?.image_url 
            || '';

          const isAccessory = Boolean(
            data.is_accessory || 
            data.categories?.name?.toLowerCase().includes('accessor') || 
            data.categories?.slug === 'accessories' ||
            data.name?.toLowerCase().includes('charger') ||
            data.name?.toLowerCase().includes('cable') ||
            data.name?.toLowerCase().includes('case') ||
            data.name?.toLowerCase().includes('adapter') ||
            data.name?.toLowerCase().includes('protector')
          );

          let cleanBrand = (data.brand || '').trim();
          if (cleanBrand.toLowerCase() === 'jayliam' || cleanBrand.toLowerCase() === 'accessories' || cleanBrand.toLowerCase() === 'accessory') {
            cleanBrand = '';
          }

          setProduct({
            id: data.id,
            brand: cleanBrand,
            name: data.name,
            spec: data.short_description || data.description || '',
            price: data.price,
            oldPrice: data.old_price,
            currency: 'KES',
            availability: data.stock_quantity > 10 ? 'In Stock' : data.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock',
            imageUrl: primaryImage,
            categoryId: data.category_id,
            categoryName: data.categories?.name || (isAccessory ? 'Accessories' : ''),
            isFeatured: data.is_featured,
            isAccessory: isAccessory
          });
          setLoading(false);
          return;
        }
      }

      // Fallback
      api.getProduct(id || '').then(data => {
        setProduct(data || null);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error fetching product details", error);
      // Fallback
      api.getProduct(id || '').then(data => {
        setProduct(data || null);
        setLoading(false);
      });
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  if (loading) {
    return (
      <main className="flex-grow py-8 md:py-16 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 w-full bg-white">
        <div className="animate-pulse flex flex-col md:flex-row gap-8 lg:gap-16">
          <div className="w-full md:w-1/2 aspect-square bg-slate-50 rounded-2xl border border-slate-100"></div>
          <div className="w-full md:w-1/2 flex flex-col gap-6 py-6 lg:py-12">
            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
            <div className="h-10 bg-slate-100 rounded w-3/4"></div>
            <div className="h-8 bg-slate-100 rounded w-1/3 mt-2"></div>
            <div className="h-32 bg-slate-100 rounded w-full mt-8"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-grow py-32 text-center bg-white min-h-[60vh]">
        <div className="w-16 h-16 bg-[#F8FAFC] border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search size={24} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-3 tracking-tight">Product Not Found</h1>
        <p className="text-slate-500 mb-8 font-light text-sm">The item you are looking for does not exist or is no longer available.</p>
        <Link to="/shop" className="inline-flex items-center text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-6 py-3 rounded-xl transition-colors shadow-sm">
          Return to Shop
        </Link>
      </main>
    );
  }

  const isLowStock = product.availability === 'Low Stock';
  const isOutOfStock = product.availability === 'Out of Stock';

  return (
    <main className="flex-grow py-4 sm:py-6 md:py-12 bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        
        <Link to="/shop" className="inline-flex items-center text-[13px] font-medium text-slate-500 hover:text-[#087FF5] mb-4 sm:mb-8 transition-colors py-1">
          <ArrowLeft size={16} className="mr-2" />
          Back to Inventory
        </Link>

        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-14 items-start">
          
          {/* Image Gallery Area */}
          <div className="w-full md:w-1/2 md:sticky md:top-28">
            <div className="aspect-square bg-[#F8FAFC] rounded-2xl border border-slate-200 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden group">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
          </div>
          
          {/* Product Details Area */}
          <div className="w-full md:w-1/2 flex flex-col py-1 sm:py-2 lg:py-4">
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-[11px] sm:text-[12px] font-bold text-[#087FF5] tracking-widest uppercase bg-blue-50 px-2.5 py-0.5 rounded">
                {product.brand ? product.brand : (product.categoryName || 'TECH')}
              </span>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">SKU: {product.id.slice(0, 8)}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#082B52] tracking-tight leading-snug mb-3 sm:mb-4">
              {product.name}
            </h1>
            
            <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 mb-6">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#082B52] tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-base sm:text-lg text-slate-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
              <div className="flex items-center">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                  isOutOfStock ? 'bg-slate-100 text-slate-500' :
                  isLowStock ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-50 text-emerald-700'
                }`}>
                  {product.availability}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 py-5 sm:py-6">
              <h3 className="text-[12px] sm:text-[13px] font-bold text-slate-900 mb-3 uppercase tracking-wider">Key Specifications</h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {product.spec.split('•').filter(Boolean).map((s, i) => (
                  <li key={i} className="text-slate-600 flex items-start text-[14px] sm:text-[15px] font-normal leading-relaxed">
                    <span className="text-[#087FF5] mr-2.5 mt-0.5">&bull;</span>
                    {s.trim()}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full min-h-[48px] py-3.5 sm:py-4 px-6 rounded-xl text-[15px] font-semibold transition-all duration-200 flex justify-center items-center gap-2 active:scale-[0.98] ${
                  isOutOfStock 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                    : 'bg-[#087FF5] hover:bg-[#0666C5] text-white shadow-sm hover:shadow-md'
                }`}
              >
                {isOutOfStock ? 'Sold Out' : <><ShoppingCart size={18} strokeWidth={2} /> Add to Cart</>}
              </button>
            </div>
            
            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2.5 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-[#F8FAFC] rounded-xl border border-slate-100">
                <Shield size={18} className="text-[#087FF5] shrink-0" strokeWidth={2} />
                <div>
                  <h4 className="text-[12px] sm:text-[13px] font-bold text-slate-900 leading-tight">Warranty Included</h4>
                  <p className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5">1 Year Official Brand Warranty</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-[#F8FAFC] rounded-xl border border-slate-100">
                <Truck size={18} className="text-[#087FF5] shrink-0" strokeWidth={2} />
                <div>
                  <h4 className="text-[12px] sm:text-[13px] font-bold text-slate-900 leading-tight">Fast Delivery</h4>
                  <p className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5">Same-day across Nairobi</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
