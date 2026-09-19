import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, Grid } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/shop', icon: Grid, label: 'Shop' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/cart', icon: ShoppingBag, label: 'Cart', badge: itemCount },
    { path: '/account', icon: User, label: 'Account' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                           (item.path === '/shop' && location.pathname.includes('/shop')) ||
                           (item.path === '/account' && location.pathname === '/login');
          return (
            <Link 
              key={item.path} 
              to={item.path === '/search' ? '/shop' : item.path} 
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-h-[44px] ${
                isActive ? 'text-[#087FF5]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.75} />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#087FF5] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white min-w-[18px] text-center shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
