import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Package, 
  Tags, 
  ShoppingCart, 
  Users, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStock: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Low Stock Products
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('stock_quantity', 10);

      // Categories
      const { count: categoriesCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      // Orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Pending Orders
      const { count: pendingOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('order_status', 'pending');

      // Customers
      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      setStats({
        totalProducts: productsCount || 0,
        totalCategories: categoriesCount || 0,
        totalOrders: ordersCount || 0,
        totalCustomers: customersCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        lowStock: lowStockCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100', link: '/admin/products' },
    { title: 'Total Categories', value: stats.totalCategories, icon: Tags, color: 'text-indigo-600', bg: 'bg-indigo-100', link: '/admin/categories' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-100', link: '/admin/orders' },
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', link: '/admin/customers' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100', link: '/admin/orders?status=pending' },
    { title: 'Low Stock Products', value: stats.lowStock, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', link: '/admin/products?stock=low' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#082B52]">Dashboard Overview</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Link 
            key={index} 
            to={card.link}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${card.bg} ${card.color}`}>
              <card.icon size={28} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 group-hover:text-[#087FF5] transition-colors">{card.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#082B52]">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-medium text-[#087FF5] hover:underline">View All</Link>
          </div>
          <div className="text-sm text-slate-500 text-center py-8">
            Connect to Supabase to view recent orders
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#082B52]">Low Stock Products</h2>
            <Link to="/admin/products" className="text-sm font-medium text-[#087FF5] hover:underline">View All</Link>
          </div>
          <div className="text-sm text-slate-500 text-center py-8">
            Connect to Supabase to view low stock products
          </div>
        </div>
      </div>
    </div>
  );
}
