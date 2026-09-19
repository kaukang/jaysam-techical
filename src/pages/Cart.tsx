import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, subtotal } = useCart();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
  };

  if (items.length === 0) {
    return (
      <main className="flex-grow py-24 md:py-32 text-center bg-[#F8FAFC] min-h-[70vh]">
        <div className="w-16 h-16 bg-white text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
          <ShoppingBag size={24} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-3 tracking-tight">Your cart is empty</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm font-light">Looks like you haven't added any premium tech to your cart yet.</p>
        <Link to="/shop" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-xl shadow-sm transition-all active:scale-[0.98]">
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-grow py-6 sm:py-8 md:py-16 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082B52] tracking-tight">Shopping Cart</h1>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
            {items.reduce((acc, i) => acc + i.quantity, 0)} {items.reduce((acc, i) => acc + i.quantity, 0) === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 items-start">
          {/* Cart Items Area */}
          <div className="w-full lg:w-[65%]">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {items.map((item, idx) => (
                <div key={item.id} className={`p-4 sm:p-6 flex flex-row items-center gap-3.5 sm:gap-6 ${idx !== items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <Link to={`/product/${item.id}`} className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-[#F8FAFC] border border-slate-100 rounded-xl p-2 sm:p-3 flex items-center justify-center overflow-hidden mix-blend-multiply">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                  </Link>
                  
                  <div className="flex-grow flex flex-col sm:flex-row justify-between w-full min-w-0">
                    <div className="flex flex-col justify-center min-w-0 pr-2">
                      <p className="text-[10px] sm:text-[11px] text-[#087FF5] font-bold uppercase tracking-wider mb-0.5">{item.brand}</p>
                      <Link to={`/product/${item.id}`} className="text-[14px] sm:text-[15px] font-bold text-[#082B52] hover:text-[#087FF5] transition-colors line-clamp-1 sm:line-clamp-2 leading-snug">{item.name}</Link>
                      <p className="text-[14px] sm:text-[15px] font-extrabold text-[#082B52] mt-1 sm:mt-2">{formatPrice(item.price)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center w-full sm:w-auto mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Modern Quantity Selector */}
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors font-bold text-base"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-[13px] font-bold text-slate-900 text-center select-none">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors font-bold text-base"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-[12px] font-semibold text-rose-500 hover:text-rose-700 transition-colors mt-0 sm:mt-2 flex items-center gap-1 py-1"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 sm:mt-6">
              <Link to="/shop" className="inline-flex items-center text-[13px] font-semibold text-slate-600 hover:text-[#087FF5] transition-colors py-1">
                <ArrowLeft size={15} className="mr-1.5" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Premium Order Summary */}
          <div className="w-full lg:w-[35%]">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 lg:sticky lg:top-28 shadow-xs">
              <h2 className="text-lg font-bold text-[#082B52] mb-5">Order Summary</h2>
              
              <div className="space-y-3.5 mb-6">
                <div className="flex justify-between text-[14px]">
                  <span className="text-slate-500 font-normal">Subtotal</span>
                  <span className="text-slate-900 font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-slate-500 font-normal">Estimated Shipping</span>
                  <span className="text-[#087FF5] font-semibold text-[13px]">Calculated at Checkout</span>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-4 mb-6 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-base">Total</span>
                <span className="font-extrabold text-[#082B52] text-xl">{formatPrice(subtotal)}</span>
              </div>
              
              <Link 
                to="/checkout"
                className="w-full min-h-[48px] bg-[#087FF5] hover:bg-[#0666C5] text-white font-semibold text-[14px] sm:text-[15px] py-3.5 px-6 rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
