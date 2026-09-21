import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { STORE_CONFIG } from '../config';
import { CheckCircle2, ShieldCheck, Lock, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Get current user if any
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // 2. Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: userId,
          total_amount: subtotal,
          shipping_address: formData.address,
          billing_address: `${formData.firstName} ${formData.lastName}, ${formData.phone}`,
          order_status: 'pending',
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Update product stock (simple approach)
      for (const item of items) {
        // Just call a decrement, would ideally be an RPC but this is fine for now
        const { data: productData } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.id)
          .single();
          
        if (productData && productData.stock_quantity > 0) {
          await supabase
            .from('products')
            .update({ stock_quantity: Math.max(0, productData.stock_quantity - item.quantity) })
            .eq('id', item.id);
        }
      }

      setCompleted(true);
      clearCart();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <main className="flex-grow py-24 md:py-32 text-center bg-[#F8FAFC] min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-[#F8FAFC] text-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <CheckCircle2 size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-3 tracking-tight">Order Confirmed</h1>
          <p className="text-slate-500 mb-8 leading-relaxed text-sm font-light px-2">
            Thank you for choosing {STORE_CONFIG.name}. We have received your order and will contact you shortly.
          </p>
          <Link to="/" className="inline-flex justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-3 px-8 rounded-xl transition-all active:scale-[0.98] w-full sm:w-auto text-sm">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex-grow py-24 text-center bg-white min-h-[60vh]">
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">Checkout Unavailable</h1>
        <p className="text-slate-500 mb-8 font-light text-sm">Your cart is currently empty.</p>
        <Link to="/shop" className="text-[14px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-6 py-3 rounded-xl transition-colors">
          Return to Shop
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-grow py-6 sm:py-8 md:py-12 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-12">
        
        <header className="mb-6 sm:mb-8 text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082B52] tracking-tight">Secure Checkout</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Provide your delivery info to confirm your order</p>
        </header>

        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:gap-8 lg:gap-10 items-start">
          
          {/* Main Form Area */}
          <div className="w-full lg:w-[60%]">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 bg-white p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs">
              
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <ShieldCheck className="text-[#087FF5]" size={18} strokeWidth={2} />
                <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">Information is 256-bit encrypted</span>
              </div>

              {/* Contact Information */}
              <section>
                <h2 className="text-base sm:text-lg font-bold text-[#082B52] mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label htmlFor="email" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email address</label>
                    <input type="email" id="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-[16px] sm:text-[14px] text-slate-900 placeholder-slate-400 shadow-2xs" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Phone number (M-Pesa / Call)</label>
                    <input type="tel" id="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-[16px] sm:text-[14px] text-slate-900 placeholder-slate-400 shadow-2xs" placeholder="e.g. 0726 503 735" />
                  </div>
                </div>
              </section>

              {/* Delivery Information */}
              <section className="pt-5 border-t border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-[#082B52] mb-4">Delivery Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-[13px] font-semibold text-slate-700 mb-1.5">First name</label>
                    <input type="text" id="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-[16px] sm:text-[14px] text-slate-900 shadow-2xs" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Last name</label>
                    <input type="text" id="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-[16px] sm:text-[14px] text-slate-900 shadow-2xs" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Delivery Address ({STORE_CONFIG.address.city})</label>
                    <input type="text" id="address" value={formData.address} onChange={handleInputChange} required className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-[16px] sm:text-[14px] text-slate-900 placeholder-slate-400 shadow-2xs" placeholder="Street, Building, Floor or Landmark" />
                  </div>
                </div>
              </section>
              
              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full min-h-[48px] bg-[#087FF5] hover:bg-[#0666C5] disabled:bg-blue-400 text-white text-[14px] sm:text-[15px] font-bold py-3.5 px-6 rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  {loading ? <Loader className="animate-spin" size={18} /> : <Lock size={18} strokeWidth={2} />}
                  <span>{loading ? 'Processing Order...' : `Confirm & Place Order (${formatPrice(subtotal)})`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Checkout Summary Area */}
          <div className="w-full lg:w-[40%]">
            <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-4 sm:p-6 lg:sticky lg:top-28">
              <h2 className="text-base sm:text-lg font-bold text-[#082B52] mb-4">Order Items ({items.length})</h2>
              
              <div className="space-y-3.5 mb-5 max-h-[35vh] lg:max-h-[40vh] overflow-y-auto pr-1 scrollbar-hide">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 relative shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#082B52] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="text-[13px] sm:text-[14px] font-bold text-[#082B52] truncate mb-0.5">{item.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{item.brand}</p>
                      </div>
                    </div>
                    <span className="text-[13px] sm:text-[14px] font-bold text-slate-900 whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-100 pt-4 space-y-2.5 mb-4">
                <div className="flex justify-between text-[13px] sm:text-[14px]">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900 font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px] sm:text-[14px]">
                  <span className="text-slate-500">Delivery</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm sm:text-base">Total Due</span>
                <span className="font-extrabold text-[#082B52] text-lg sm:text-xl">{formatPrice(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
