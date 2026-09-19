import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Package, LogOut, Loader2, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

export default function Account() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        navigate('/login');
        return;
      }

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      setProfile(profileData);

      // Fetch Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url))')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'processing': return <Package size={16} className="text-blue-500" />;
      case 'shipped': return <Truck size={16} className="text-purple-500" />;
      case 'delivered': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'cancelled': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-[#087FF5] animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your account details...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-12 py-6 sm:py-10 lg:py-16">
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        
        {/* Sidebar / Mobile Nav */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#F4F9FF] border border-[#087FF5]/20 text-[#087FF5] rounded-full flex items-center justify-center text-lg sm:text-xl font-bold shrink-0">
                {(profile.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-[#082B52] truncate">{profile.full_name || 'User'}</h2>
                <p className="text-xs text-slate-500 truncate">{profile.email}</p>
              </div>
            </div>

            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-[#087FF5] text-white'
                    : 'text-slate-600 hover:bg-slate-50 bg-slate-50 md:bg-transparent'
                }`}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-[#087FF5] text-white'
                    : 'text-slate-600 hover:bg-slate-50 bg-slate-50 md:bg-transparent'
                }`}
              >
                <Package size={16} />
                <span>Orders ({orders.length})</span>
              </button>
            </nav>

            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs">
          
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-[#082B52] border-b border-slate-100 pb-3 sm:pb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <div className="text-[14px] sm:text-[15px] font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 break-words">
                    {profile.full_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <div className="text-[14px] sm:text-[15px] font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 break-words">
                    {profile.email}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <div className="text-[14px] sm:text-[15px] font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
                    {profile.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Role</label>
                  <div className="text-[14px] sm:text-[15px] font-medium text-slate-900 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 capitalize">
                    {profile.role}
                  </div>
                </div>
              </div>
              
              {profile.role === 'admin' && (
                <div className="mt-6 sm:mt-8 bg-[#F4F9FF] border border-[#087FF5]/20 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#082B52]">Admin Privileges</h4>
                    <p className="text-xs sm:text-sm text-slate-600">You have administrative access to manage products, banners, and orders.</p>
                  </div>
                  <Link to="/admin" className="w-full sm:w-auto text-center px-5 py-2.5 bg-[#087FF5] text-white font-semibold rounded-xl text-xs sm:text-sm hover:bg-[#0666C5] transition-colors shrink-0">
                    Go to Dashboard
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#082B52] border-b border-slate-100 pb-3 sm:pb-4 mb-4 sm:mb-6">Order History</h3>
              
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 px-4">
                  <Package size={44} className="mx-auto text-slate-300 mb-3" />
                  <h4 className="text-base sm:text-lg font-bold text-slate-700">No orders yet</h4>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1 mb-5">Looks like you haven't made your first purchase.</p>
                  <Link to="/shop" className="px-6 py-2.5 bg-[#087FF5] text-white rounded-full font-semibold hover:bg-[#0666C5] transition-colors inline-block text-xs sm:text-sm">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-sm transition-shadow">
                      <div className="bg-slate-50 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Order Placed</p>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">
                            {new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Total Amount</p>
                          <p className="font-extrabold text-[#087FF5] text-xs sm:text-sm">
                            KSh {order.total_amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-0.5 hidden sm:block">Status</p>
                          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${getStatusColor(order.order_status)}`}>
                            {getStatusIcon(order.order_status)}
                            <span>{order.order_status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3.5 sm:p-5">
                        <div className="space-y-3 sm:space-y-4">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3 sm:gap-4">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1 border border-slate-200">
                                {item.products?.image_url ? (
                                  <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-contain mix-blend-multiply" />
                                ) : (
                                  <Package size={20} className="text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{item.products?.name || 'Unknown Product'}</h5>
                                <p className="text-slate-500 text-xs mt-0.5">Qty: {item.quantity}</p>
                              </div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm shrink-0">
                                KSh {item.unit_price.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
