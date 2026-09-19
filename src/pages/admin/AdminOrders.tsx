import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Eye, ChevronDown, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (full_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setOrders(orders.map(o => o.id === id ? { ...o, order_status: status } : o));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, order_status: status });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update status');
    }
  };

  const handleViewOrder = async (order: any) => {
    try {
      // Fetch order items
      const { data: items, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products (name, sku, price)
        `)
        .eq('order_id', order.id);

      if (error) throw error;
      
      setSelectedOrder({ ...order, items: items || [] });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (o.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock size={14} className="mr-1" />;
      case 'processing': return <Truck size={14} className="mr-1" />;
      case 'shipped': return <Truck size={14} className="mr-1" />;
      case 'delivered': return <CheckCircle size={14} className="mr-1" />;
      case 'cancelled': return <XCircle size={14} className="mr-1" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#082B52]">Orders Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Order ID or Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
          />
        </div>
        <div className="relative sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading orders...</td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-slate-900">{order.id.substring(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{order.profiles?.full_name || 'Guest User'}</div>
                    <div className="text-xs text-slate-500">{order.profiles?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                    KSh {order.total_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.order_status)}`}>
                      {getStatusIcon(order.order_status)}
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleViewOrder(order)}
                      className="text-[#087FF5] hover:text-[#0666C5] flex items-center justify-end w-full gap-1"
                    >
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#082B52]">Order Details</h2>
                <p className="text-sm text-slate-500 mt-1">ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{selectedOrder.profiles?.full_name || 'Guest'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900">{selectedOrder.profiles?.email || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="font-medium text-slate-900">{selectedOrder.profiles?.phone || 'N/A'}</span></div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-2">Order Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Current Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedOrder.order_status)}`}>
                        {selectedOrder.order_status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Update Status:</label>
                      <select
                        value={selectedOrder.order_status}
                        onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Order Items</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Qty</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Price</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-slate-900">{item.products?.name || 'Unknown Product'}</div>
                          <div className="text-xs text-slate-500">SKU: {item.products?.sku || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-slate-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-700">KSh {item.unit_price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">KSh {(item.quantity * item.unit_price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50">
                      <td colSpan={3} className="px-4 py-4 text-right font-semibold text-slate-700">Total Amount</td>
                      <td className="px-4 py-4 text-right font-bold text-lg text-[#082B52]">KSh {selectedOrder.total_amount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Shipping Information</h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                  <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-500">Address:</span> <span className="font-medium">{selectedOrder.shipping_address}</span></div>
                  <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-500">City:</span> <span className="font-medium">{selectedOrder.billing_address || 'N/A'}</span></div>
                  {/* Note: Adjust DB schema if you have separate city/zip/etc */}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-200 shrink-0 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
