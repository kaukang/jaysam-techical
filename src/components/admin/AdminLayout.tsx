import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingCart, 
  Users, 
  Image as ImageIcon,
  MonitorPlay,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  MessageSquare,
  Wrench,
  Info
, Star } from 'lucide-react';

export default function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setIsAdmin(false);
        navigate('/admin/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setIsAdmin(false);
        return; // Don't redirect, let them see an error or retry, but they can't see the dashboard. Wait, actually we should redirect to login.
      }

      if (profile?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        navigate('/admin/login'); // Should probably redirect to / account or show 'Not Admin'
      }
    } catch (err) {
      console.error('Admin check failed:', err);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#087FF5] mb-4"></div>
        <p className="text-slate-600 font-medium">Verifying admin credentials...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">You do not have administrative privileges or your session has expired.</p>
          <button 
            onClick={() => navigate('/admin/login')}
            className="w-full bg-[#087FF5] hover:bg-[#0666C5] text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Brands', path: '/admin/brands', icon: Star },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Homepage', path: '/admin/homepage', icon: MonitorPlay },
    { name: 'Best Sellers', path: '/admin/best-sellers', icon: Star },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Testimonials', path: '/admin/testimonials', icon: MessageSquare },
    { name: 'Services', path: '/admin/services', icon: Wrench },
    { name: 'About Section', path: '/admin/about', icon: Info },
    { name: 'Media Library', path: '/admin/media', icon: ImageIcon },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#082B52] text-slate-300 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/admin/dashboard" className="text-white font-extrabold text-xl tracking-tight flex items-center gap-2">
            JAYLIAM TECH<span className="text-[#087FF5]">.</span>
          </Link>
          <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-[#087FF5] text-white' : 'hover:bg-white/10 hover:text-white'}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden text-slate-600 hover:text-slate-900 p-2 -ml-1 rounded-xl hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h2 className="font-bold text-[#082B52] text-base sm:text-lg">
              {navItems.find(item => location.pathname.startsWith(item.path))?.name || 'Admin Panel'}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to="/" 
              className="text-xs sm:text-sm font-semibold text-[#087FF5] hover:text-[#0666C5] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>View Store</span>
            </Link>
            <div className="h-8 w-8 rounded-full bg-[#087FF5] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
