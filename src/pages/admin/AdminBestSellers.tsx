import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Search, GripVertical, Plus, X, Trash2 } from 'lucide-react';

export default function AdminBestSellers() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch config
      let { data: bsConfig, error: configError } = await supabase
        .from('best_sellers_config')
        .select('*')
        .limit(1)
        .single();
        
      if (configError && configError.code === 'PGRST116') {
         // Create default if missing
         const { data: newConfig } = await supabase
           .from('best_sellers_config')
           .insert([{ is_active: true, mode: 'auto', limit_count: 4, title: 'Our Best-Selling Products' }])
           .select()
           .single();
         bsConfig = newConfig;
      } else if (configError) {
         throw configError;
      }
      setConfig(bsConfig);

      // 2. Fetch all products for search
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, brand, product_images(image_url, is_primary)')
        .eq('status', 'active');
        
      if (products) {
        setAllProducts(products.map(p => ({
          ...p,
          primaryImage: p.product_images?.find((img: any) => img.is_primary)?.image_url || p.product_images?.[0]?.image_url || ''
        })));
      }

      // 3. Fetch manual selection
      if (bsConfig) {
        const { data: manualList } = await supabase
          .from('best_seller_products')
          .select('product_id, display_order')
          .order('display_order', { ascending: true });
          
        if (manualList && manualList.length > 0 && products) {
           const selected = manualList.map((item: any) => {
             const prod = products.find(p => p.id === item.product_id);
             return prod ? {
                ...prod,
                primaryImage: prod.product_images?.find((img: any) => img.is_primary)?.image_url || prod.product_images?.[0]?.image_url || ''
             } : null;
           }).filter(Boolean);
           setSelectedProducts(selected);
        }
      }

    } catch (error: any) {
      if (error.message?.includes('relation') || error.code?.startsWith('PGRST')) {
         setMessage({ type: 'error', text: 'Database tables missing. Please run the provided SQL snippet.' });
      } else {
         setMessage({ type: 'error', text: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setConfig({ 
      ...config, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    });
  };

  const handleToggleActive = () => {
    setConfig({ ...config, is_active: !config.is_active });
  };

  const addProduct = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) return;
    if (selectedProducts.length >= config.limit_count) {
      setMessage({ type: 'error', text: `Maximum limit of ${config.limit_count} reached.` });
      return;
    }
    setSelectedProducts([...selectedProducts, product]);
    setSearchQuery('');
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...selectedProducts];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setSelectedProducts(newItems);
  };

  const moveDown = (index: number) => {
    if (index === selectedProducts.length - 1) return;
    const newItems = [...selectedProducts];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setSelectedProducts(newItems);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      // Update config
      if (config.id) {
        await supabase.from('best_sellers_config').update(config).eq('id', config.id);
      } else {
        await supabase.from('best_sellers_config').insert([config]);
      }

      // Update manual list
      await supabase.from('best_seller_products').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
      
      if (selectedProducts.length > 0) {
        const inserts = selectedProducts.map((p, idx) => ({
          product_id: p.id,
          display_order: idx
        }));
        await supabase.from('best_seller_products').insert(inserts);
      }

      setMessage({ type: 'success', text: 'Best Sellers updated successfully!' });
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#082B52]">Best Sellers Section</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 p-4 sm:p-6 flex flex-wrap justify-between items-center gap-3 bg-slate-50">
          <h2 className="text-base sm:text-lg font-semibold text-[#082B52]">Section Settings</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-medium text-slate-600">Status:</span>
            <button 
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config?.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config?.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs sm:text-sm font-medium text-slate-600 w-12">{config?.is_active ? 'Active' : 'Hidden'}</span>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Section Title</label>
            <input
              type="text"
              name="title"
              value={config?.title || ''}
              onChange={handleConfigChange}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Max Products to Display</label>
            <input
              type="number"
              name="limit_count"
              min="1"
              max="12"
              value={config?.limit_count || 4}
              onChange={handleConfigChange}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] text-sm"
            />
          </div>
          
          <div className="md:col-span-2 pt-2">
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Selection Mode</label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-700">
                <input 
                  type="radio" 
                  name="mode" 
                  value="auto" 
                  checked={config?.mode === 'auto'} 
                  onChange={handleConfigChange} 
                  className="text-[#087FF5] focus:ring-[#087FF5]"
                />
                <span>Automatic (Based on completed sales)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-700">
                <input 
                  type="radio" 
                  name="mode" 
                  value="manual" 
                  checked={config?.mode === 'manual'} 
                  onChange={handleConfigChange} 
                  className="text-[#087FF5] focus:ring-[#087FF5]"
                />
                <span>Manual Selection</span>
              </label>
            </div>
            {config?.mode === 'auto' && (
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Products will be automatically ranked by the total quantity sold across all valid, paid orders.
              </p>
            )}
          </div>
        </div>
      </div>

      {config?.mode === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selected Products List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-[#082B52] mb-4">Selected Products</h2>
            <div className="flex-grow space-y-3">
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  No products selected. Search and add products from the panel.
                </div>
              ) : (
                selectedProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                    <div className="flex flex-col gap-1 text-slate-400">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0} className="hover:text-[#087FF5] disabled:opacity-30"><GripVertical size={16} /></button>
                      <button onClick={() => moveDown(idx)} disabled={idx === selectedProducts.length - 1} className="hover:text-[#087FF5] disabled:opacity-30"><GripVertical size={16} /></button>
                    </div>
                    <img src={p.primaryImage || 'https://via.placeholder.com/150'} alt={p.name} className="w-12 h-12 rounded object-cover border border-slate-100" />
                    <div className="flex-grow">
                      <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{p.name}</h4>
                      <span className="text-xs text-slate-500">{p.brand}</span>
                    </div>
                    <button onClick={() => removeProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-500 flex justify-between">
              <span>{selectedProducts.length} of {config.limit_count} selected</span>
            </div>
          </div>

          {/* Product Search Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[500px]">
            <h2 className="text-lg font-semibold text-[#082B52] mb-4">Search Products</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or brand..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
              />
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
              {filteredProducts.slice(0, 20).map(p => {
                const isSelected = selectedProducts.some(sp => sp.id === p.id);
                return (
                  <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isSelected ? 'border-emerald-200 bg-emerald-50 opacity-60' : 'border-slate-200 hover:border-[#087FF5] bg-white cursor-pointer'}`} onClick={() => !isSelected && addProduct(p)}>
                    <img src={p.primaryImage || 'https://via.placeholder.com/150'} alt={p.name} className="w-10 h-10 rounded object-cover" />
                    <div className="flex-grow">
                      <h4 className="text-sm font-medium text-slate-800 line-clamp-1">{p.name}</h4>
                      <span className="text-xs text-slate-500 font-medium">KES {p.price.toLocaleString()}</span>
                    </div>
                    {!isSelected && (
                      <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#087FF5] hover:bg-[#087FF5] hover:text-white transition-colors">
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-slate-500">No products found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
