import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, User, Menu, X, Heart, Truck, ShieldCheck, HeadphonesIcon, ChevronDown, ShieldAlert, Phone, Mail, Zap, CreditCard, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { STORE_CONFIG } from '../config';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAdmin();
    setIsMobileMenuOpen(false);
  }, [location]);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (data && data.role === 'admin') {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error("Error checking admin status", error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About Us', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Contact', path: '/contact' },
  ];

  const marqueeAnnouncements = [
    { icon: Truck, text: 'Free Delivery on Orders Over KSh 5,000' },
    { icon: ShieldCheck, text: '100% Genuine Tech & Brand Warranty' },
    { icon: Zap, text: 'Express Same-Day Dispatch in Nairobi' },
    { icon: HeadphonesIcon, text: '24/7 Dedicated Customer & Tech Support' },
    { icon: CreditCard, text: 'Secure Payments via Lipa Na M-PESA & Cards' },
    { icon: Sparkles, text: 'Official Authorized Electronics & Accessories Dealer' },
  ];

  return (
    <>
      {/* Top Blue Marquee Trust Bar */}
      <div 
        id="header-announcement-marquee" 
        className="relative bg-[#082B52] text-white border-b border-[#0c396c] overflow-hidden select-none"
        aria-label="Store Announcements"
      >
        {/* Soft edge gradient fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 z-10 bg-gradient-to-r from-[#082B52] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 z-10 bg-gradient-to-l from-[#082B52] to-transparent" />

        <div className="h-9 sm:h-10 flex items-center overflow-hidden">
          <div className="animate-marquee flex items-center shrink-0">
            {/* Render items twice for a gapless, infinite marquee loop */}
            {[0, 1].map((copyIndex) => (
              <div key={copyIndex} className="flex items-center shrink-0">
                {marqueeAnnouncements.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={`${copyIndex}-${index}`} 
                      className="flex items-center gap-2 px-4 sm:px-7 text-[11px] sm:text-xs font-medium text-[#E5EAF2] shrink-0 tracking-wide"
                    >
                      <Icon size={14} className="text-[#38bdf8] shrink-0" />
                      <span>{item.text}</span>
                      <span className="text-[#38bdf8]/40 ml-4 sm:ml-7 text-[10px]" aria-hidden="true">✦</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5EAF2] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-12">
          {/* Desktop & Tablet Layout */}
          <div className="flex justify-between items-center h-[72px] sm:h-[84px] lg:h-[96px] gap-2 sm:gap-4">
            
            {/* Left: Logo & Mobile Menu Toggle */}
            <div className="flex items-center shrink-0 gap-2 sm:gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-[#102A43] hover:text-[#087FF5] transition-colors p-2 -ml-2 rounded-lg active:bg-slate-100 flex items-center justify-center min-w-[44px] min-h-[44px]"
                aria-label="Open navigation menu"
              >
                {isMobileMenuOpen ? <X size={24} strokeWidth={2} /> : <Menu size={24} strokeWidth={1.5} />}
              </button>
              <Link to="/" className="flex items-center">
                <img 
                  src="/logo.png" 
                  alt="JAYLIAM TECH" 
                  className="h-7 sm:h-8 lg:h-10 w-auto object-contain max-w-[160px] sm:max-w-none" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.classList.remove('hidden'); }} 
                />
                <span className="hidden font-extrabold text-lg sm:text-xl lg:text-2xl tracking-tight text-[#102A43] items-center gap-1.5">
                  JAYLIAM TECH<span className="text-[#087FF5]">.</span>
                </span>
              </Link>
            </div>

            {/* Center/Left: Navigation (Desktop) */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-8 xl:gap-10 ml-4 lg:ml-8 xl:ml-12 mr-auto">
              {navLinks.map((link) => {
                const isActive = link.path === '/' 
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path) && link.name !== 'Home';
                
                return (
                  <Link 
                    key={link.name} 
                    to={link.path} 
                    className={`text-[14px] lg:text-[15px] font-medium transition-colors relative py-2 flex items-center gap-1 whitespace-nowrap group ${
                      isActive 
                        ? 'text-[#087FF5]' 
                        : 'text-[#102A43] hover:text-[#087FF5]'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#087FF5] rounded-t-full" />
                    )}
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#087FF5] transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100 rounded-t-full" />
                  </Link>
                );
              })}
            </nav>

            {/* Right: Search Bar & Icons */}
            <div className="flex items-center justify-end gap-2 sm:gap-4 lg:gap-6 shrink-0">
              
              {/* Desktop Search */}
              <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative group w-[280px] xl:w-[400px] h-[46px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-[#64748B] group-focus-within:text-[#087FF5] transition-colors" strokeWidth={2} />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands..." 
                  className="w-full h-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#102A43] text-[15px] rounded-full focus:ring-2 focus:ring-[#087FF5]/20 focus:border-[#087FF5] focus:bg-white block pl-11 pr-14 transition-all outline-none placeholder:text-[#64748B]" 
                />
                <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#087FF5] hover:bg-[#2563EB] text-white w-[38px] rounded-full flex items-center justify-center transition-colors">
                  <Search size={16} strokeWidth={2.5} />
                </button>
              </form>
              
              {/* Action Icons */}
              <div className="flex items-center gap-1 sm:gap-3 lg:gap-4 shrink-0">
                {isAdmin && (
                  <Link to="/admin" className="hidden sm:flex items-center gap-1.5 text-[12px] lg:text-[13px] font-medium text-[#087FF5] bg-[#F4F9FF] border border-[#087FF5]/20 px-3 py-1.5 rounded-full hover:bg-[#EBF4FF] transition-colors">
                    <ShieldAlert size={14} />
                    <span>Admin</span>
                  </Link>
                )}
                
                <Link 
                  to="/account" 
                  className="hidden sm:flex text-[#102A43] hover:text-[#087FF5] transition-colors p-2 rounded-full hover:bg-slate-100 min-w-[40px] min-h-[40px] items-center justify-center"
                  aria-label="User account"
                >
                  <User size={22} strokeWidth={1.5} />
                </Link>
                
                <Link 
                  to="/cart" 
                  className="text-[#102A43] hover:text-[#087FF5] transition-colors relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 min-w-[44px] min-h-[44px]"
                  aria-label="View shopping cart"
                >
                  <ShoppingBag size={22} strokeWidth={1.5} />
                  {itemCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-[#087FF5] text-white text-[11px] font-bold flex items-center justify-center rounded-full ring-2 ring-white shadow-sm">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile & Tablet Search Row (visible on screens below lg) */}
          <div className="lg:hidden pb-3 sm:pb-4 px-0.5">
            <form onSubmit={handleSearchSubmit} className="relative group w-full h-[44px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={18} className="text-[#64748B] group-focus-within:text-[#087FF5] transition-colors" strokeWidth={2} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands..." 
                className="w-full h-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#102A43] text-[16px] rounded-full focus:ring-2 focus:ring-[#087FF5]/20 focus:border-[#087FF5] focus:bg-white block pl-10 pr-12 transition-all outline-none placeholder:text-[#64748B]" 
              />
              <button 
                type="submit" 
                className="absolute right-1 top-1 bottom-1 bg-[#087FF5] hover:bg-[#2563EB] text-white w-[36px] rounded-full flex items-center justify-center transition-colors"
                aria-label="Submit search"
              >
                <Search size={15} strokeWidth={2.5} />
              </button>
            </form>
          </div>

        </div>
      </header>

      {/* Mobile Slide-out Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-[85%] max-w-[340px] bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto">
            {/* Header of Drawer */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#082B52] text-white">
              <span className="font-extrabold text-lg tracking-tight">
                JAYLIAM TECH<span className="text-[#38bdf8]">.</span>
              </span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg active:bg-white/10"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav Links */}
            <div className="p-4 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Navigation</p>
              {navLinks.map((link) => {
                const isActive = link.path === '/' 
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path) && link.name !== 'Home';
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                      isActive 
                        ? 'bg-[#F4F9FF] text-[#087FF5] font-semibold' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{link.name}</span>
                    <span className="text-slate-400">&rsaquo;</span>
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl text-[15px] font-medium text-[#087FF5] bg-[#F4F9FF] border border-[#087FF5]/20 mt-2"
                >
                  <ShieldAlert size={18} />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>

            {/* Quick Links / Account */}
            <div className="p-4 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1">Account</p>
              <Link 
                to="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-slate-700 hover:bg-slate-50"
              >
                <User size={18} className="text-slate-400" />
                <span>My Account / Profile</span>
              </Link>
              <Link 
                to="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-slate-700 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag size={18} className="text-slate-400" />
                  <span>My Cart</span>
                </div>
                {itemCount > 0 && (
                  <span className="bg-[#087FF5] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Contact details footer inside drawer */}
            <div className="mt-auto p-4 border-t border-slate-100 bg-[#F8FAFC]">
              <div className="space-y-2 text-[12px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#087FF5] shrink-0" />
                  <span>{STORE_CONFIG.supportPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-[#087FF5] shrink-0" />
                  <span className="truncate">{STORE_CONFIG.supportEmail}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

