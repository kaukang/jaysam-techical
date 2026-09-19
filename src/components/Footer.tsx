import { useState, FormEvent } from 'react';
import { STORE_CONFIG } from '../config';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => {
      setSubscribed(false);
    }, 6000);
  };

  return (
    <footer className="bg-[#082B52] text-slate-300 pb-12 md:pb-0 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] aspect-square bg-[#087FF5]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] aspect-square bg-[#087FF5]/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 relative z-10">
        {/* Navigation Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="mb-4 sm:mb-6 block">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white items-center">
                JAYLIAM TECH<span className="text-[#38bdf8]">.</span>
              </span>
            </Link>
            <p className="text-[14px] text-slate-400 max-w-sm leading-relaxed">
              {STORE_CONFIG.description}
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-[15px] text-white mb-4 sm:mb-5">Quick Links</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li><Link to="/" className="text-[14px] text-slate-400 hover:text-white transition-colors inline-block py-0.5">Home</Link></li>
              <li><Link to="/shop" className="text-[14px] text-slate-400 hover:text-white transition-colors inline-block py-0.5">Shop</Link></li>
              <li><Link to="/about" className="text-[14px] text-slate-400 hover:text-white transition-colors inline-block py-0.5">About Us</Link></li>
              <li><Link to="/services" className="text-[14px] text-slate-400 hover:text-white transition-colors inline-block py-0.5">Services</Link></li>
              <li><Link to="/contact" className="text-[14px] text-slate-400 hover:text-white transition-colors inline-block py-0.5">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-[15px] text-white mb-4 sm:mb-5">Customer Service</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li><Link to="/contact" className="text-[14px] text-slate-400 hover:text-white transition-colors inline-block py-0.5">Help Center</Link></li>
              <li><span className="text-[14px] text-slate-400 inline-block py-0.5">Shipping Info</span></li>
              <li><span className="text-[14px] text-slate-400 inline-block py-0.5">Returns & Refunds</span></li>
              <li><span className="text-[14px] text-slate-400 inline-block py-0.5">Privacy Policy</span></li>
              <li><span className="text-[14px] text-slate-400 inline-block py-0.5">Terms & Conditions</span></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-[15px] text-white mb-4 sm:mb-5">Contact Us</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="break-all"><a href={`mailto:${STORE_CONFIG.supportEmail}`} className="text-[14px] text-slate-400 hover:text-white transition-colors">{STORE_CONFIG.supportEmail}</a></li>
              <li><a href={`tel:${STORE_CONFIG.supportPhone}`} className="text-[14px] text-slate-400 hover:text-white transition-colors">Phone: {STORE_CONFIG.supportPhone}</a></li>
              <li><span className="text-[14px] text-slate-400">{STORE_CONFIG.address.street}, {STORE_CONFIG.address.city}</span></li>
            </ul>
          </div>
        </div>

        {/* Stay Updated Newsletter Section (Down) */}
        <div className="border-t border-white/10 mt-12 sm:mt-14 pt-10 sm:pt-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12 bg-white/[0.04] border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10">
            <div className="text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#38bdf8] text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-3">
                <Mail size={13} />
                <span>Newsletter</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
                Stay Updated
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                Get the latest deals, new arrivals and technology updates directly in your inbox.
              </p>
            </div>

            <div className="w-full lg:w-auto max-w-md">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address" 
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-[15px] rounded-xl px-4 sm:px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:bg-white/20 transition-all min-h-[48px]"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="bg-[#087FF5] hover:bg-[#0666C5] text-white font-semibold py-3.5 px-7 rounded-xl transition-all text-[15px] whitespace-nowrap min-h-[48px] active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer"
                >
                  {subscribed ? 'Subscribed!' : 'Subscribe'}
                </button>
              </form>
              {subscribed && (
                <div className="flex items-center justify-center lg:justify-start gap-1.5 mt-2.5 text-xs text-emerald-400 font-medium animate-fadeIn">
                  <CheckCircle2 size={14} />
                  <span>Thank you for subscribing! Check your inbox for updates.</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Copyright Bar */}
        <div className="border-t border-white/10 mt-10 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-[13px] sm:text-[14px] text-slate-400">
            &copy; {new Date().getFullYear()} {STORE_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] sm:text-[12px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              100% Genuine Tech &bull; Secure Payments
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
