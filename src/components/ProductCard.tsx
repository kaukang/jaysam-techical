import React from 'react';
import { Product } from '../types';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  key?: React.Key;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.availability === 'Out of Stock') return;
    addToCart(product);
  };

  return (
    <Link to={`/product/${product.id}`} className="group flex flex-col bg-white border border-[#E5EAF2] rounded-xl hover:shadow-[0_8px_30px_rgb(8,127,245,0.08)] hover:border-[#087FF5]/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative w-full">
      <div className="relative aspect-square bg-white p-3.5 sm:p-5 md:p-6 lg:p-8 flex items-center justify-center overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-[1.05] transition-transform duration-500 ease-out"
          loading="lazy"
        />
        {product.availability === 'Low Stock' && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#102A43] text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded tracking-wider uppercase z-10">
            Low Stock
          </span>
        )}
        {product.availability === 'Out of Stock' && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#F8FAFC] text-[#64748B] border border-[#E5EAF2] text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded tracking-wider uppercase z-10">
            Sold Out
          </span>
        )}
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F8FAFC]/90 backdrop-blur-xs flex items-center justify-center text-[#64748B] hover:text-red-500 hover:bg-red-50 transition-colors z-10"
          aria-label="Add to wishlist"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
      </div>
      
      <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow bg-white border-t border-transparent group-hover:border-[#E5EAF2]/50 transition-colors">
        <div className="mb-2 sm:mb-3">
          <p className="text-[9px] sm:text-[10px] text-[#64748B] font-bold tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-1.5 uppercase truncate">{product.brand}</p>
          <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#082B52] leading-snug group-hover:text-[#087FF5] transition-colors line-clamp-2 min-h-[2.5em]">{product.name}</h3>
          <p className="text-[11px] sm:text-[12px] text-[#64748B] mt-1 line-clamp-1">{product.spec}</p>
          <div className="flex items-center gap-0.5 sm:gap-1 mt-1.5 sm:mt-2">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#087FF5] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            ))}
            <span className="text-[10px] sm:text-[11px] text-[#64748B] ml-1 font-medium">(24)</span>
          </div>
        </div>
        
        <div className="mt-auto pt-2 flex items-center justify-between gap-1">
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] xs:text-[14px] sm:text-base md:text-[17px] font-bold text-[#082B52] tracking-tight truncate">{formatPrice(product.price)}</span>
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={product.availability === 'Out of Stock'}
            className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
              product.availability === 'Out of Stock' 
                ? 'bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed border border-[#E5EAF2]'
                : 'bg-[#F8FAFC] text-[#087FF5] group-hover:bg-[#087FF5] group-hover:text-white group-hover:shadow-md active:scale-95'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={16} className="shrink-0 sm:hidden" strokeWidth={2} />
            <ShoppingCart size={18} className="shrink-0 hidden sm:block" strokeWidth={2} />
          </button>
        </div>
      </div>
    </Link>
  );
}
