import React, { useState } from 'react';
import { X, Save, AlertCircle, Flame } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminBulkEditModal({
  isOpen,
  onClose,
  onSuccess,
  selectedProductIds,
  categories,
  brands
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedProductIds: string[];
  categories: any[];
  brands: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [updateFields, setUpdateFields] = useState({
    updateCategory: false,
    categoryId: '',
    updateBrand: false,
    brandName: '',
    updateStatus: false,
    status: 'active',
    updateStock: false,
    stock: 0,
    updatePrice: false,
    priceAction: 'set', // 'set', 'increase', 'decrease'
    priceValue: 0,
    updateBestSeller: false,
    bestSellerValue: true
  });

  if (!isOpen) return null;

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      
      // We need to fetch the current products if we are doing relative price updates
      let productsToUpdate: any[] = [];
      if (updateFields.updatePrice && updateFields.priceAction !== 'set') {
        const { data, error: fetchErr } = await supabase.from('products').select('id, price').in('id', selectedProductIds);
        if (fetchErr) throw fetchErr;
        productsToUpdate = data || [];
      }
      
      const staticUpdates: any = {};
      if (updateFields.updateCategory) staticUpdates.category_id = updateFields.categoryId;
      if (updateFields.updateBrand) staticUpdates.brand = updateFields.brandName;
      if (updateFields.updateStatus) staticUpdates.status = updateFields.status;
      if (updateFields.updateStock) staticUpdates.stock_quantity = updateFields.stock;
      if (updateFields.updateBestSeller) staticUpdates.is_best_seller = updateFields.bestSellerValue;
      
      if (updateFields.updatePrice && updateFields.priceAction === 'set') {
        staticUpdates.price = updateFields.priceValue;
      }
      
      // If no relative updates, do one massive update
      if (Object.keys(staticUpdates).length > 0 && !(updateFields.updatePrice && updateFields.priceAction !== 'set')) {
        let { error: updateErr } = await supabase.from('products').update(staticUpdates).in('id', selectedProductIds);
        if (updateErr && (updateErr.message?.includes('is_best_seller') || updateErr.code === 'PGRST204')) {
          const fallback = { ...staticUpdates };
          delete fallback.is_best_seller;
          const res = await supabase.from('products').update(fallback).in('id', selectedProductIds);
          updateErr = res.error;
        }
        if (updateErr) throw updateErr;
      } else if (updateFields.updatePrice && updateFields.priceAction !== 'set') {
        // We have to loop and update each product
        for (const pId of selectedProductIds) {
          const updates = { ...staticUpdates };
          const pData = productsToUpdate.find(p => p.id === pId);
          if (pData) {
            if (updateFields.priceAction === 'increase') {
              updates.price = Math.round(pData.price * (1 + (updateFields.priceValue / 100)));
            } else if (updateFields.priceAction === 'decrease') {
              updates.price = Math.round(pData.price * (1 - (updateFields.priceValue / 100)));
            }
          }
          let { error: updSingleErr } = await supabase.from('products').update(updates).eq('id', pId);
          if (updSingleErr && (updSingleErr.message?.includes('is_best_seller') || updSingleErr.code === 'PGRST204')) {
            const fallback = { ...updates };
            delete fallback.is_best_seller;
            await supabase.from('products').update(fallback).eq('id', pId);
          }
        }
      } else if (Object.keys(staticUpdates).length === 0) {
        return; // Nothing to update
      }

      // Sync best seller tables and local storage if updateBestSeller was checked
      if (updateFields.updateBestSeller) {
        try {
          if (updateFields.bestSellerValue) {
            for (let i = 0; i < selectedProductIds.length; i++) {
              const pid = selectedProductIds[i];
              await supabase.from('best_seller_products').upsert([{ product_id: pid, display_order: i }]);
            }
            await supabase.from('best_sellers_config').update({ is_active: true, mode: 'manual' }).neq('id', '00000000-0000-0000-0000-000000000000');
          } else {
            await supabase.from('best_seller_products').delete().in('product_id', selectedProductIds);
          }
        } catch (e) {}

        try {
          const stored = localStorage.getItem('jayliam_best_sellers_ids');
          let idSet = new Set<string>();
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) idSet = new Set(parsed);
            } catch (e) {}
          }
          if (updateFields.bestSellerValue) {
            selectedProductIds.forEach(id => idSet.add(id));
          } else {
            selectedProductIds.forEach(id => idSet.delete(id));
          }
          localStorage.setItem('jayliam_best_sellers_ids', JSON.stringify(Array.from(idSet)));
        } catch (e) {}
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-[#082B52]">Bulk Update {selectedProductIds.length} Products</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          {/* Status Update */}
          <div className="flex items-start gap-3">
            <div className="pt-1">
              <input type="checkbox" id="upd-status" checked={updateFields.updateStatus} onChange={(e) => setUpdateFields({...updateFields, updateStatus: e.target.checked})} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
            </div>
            <div className="flex-1">
              <label htmlFor="upd-status" className="font-medium text-slate-800 cursor-pointer block mb-2">Update Status</label>
              <select disabled={!updateFields.updateStatus} value={updateFields.status} onChange={(e) => setUpdateFields({...updateFields, status: e.target.value})} className="w-full sm:w-1/2 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] disabled:opacity-50 disabled:bg-slate-50">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          {/* Stock Update */}
          <div className="flex items-start gap-3">
            <div className="pt-1">
              <input type="checkbox" id="upd-stock" checked={updateFields.updateStock} onChange={(e) => setUpdateFields({...updateFields, updateStock: e.target.checked})} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
            </div>
            <div className="flex-1">
              <label htmlFor="upd-stock" className="font-medium text-slate-800 cursor-pointer block mb-2">Update Stock</label>
              <input type="number" disabled={!updateFields.updateStock} value={updateFields.stock} onChange={(e) => setUpdateFields({...updateFields, stock: parseInt(e.target.value)})} className="w-full sm:w-1/2 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] disabled:opacity-50 disabled:bg-slate-50" />
            </div>
          </div>
          
          {/* Price Update */}
          <div className="flex items-start gap-3">
            <div className="pt-1">
              <input type="checkbox" id="upd-price" checked={updateFields.updatePrice} onChange={(e) => setUpdateFields({...updateFields, updatePrice: e.target.checked})} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
            </div>
            <div className="flex-1">
              <label htmlFor="upd-price" className="font-medium text-slate-800 cursor-pointer block mb-2">Update Price</label>
              <div className="flex gap-2">
                <select disabled={!updateFields.updatePrice} value={updateFields.priceAction} onChange={(e) => setUpdateFields({...updateFields, priceAction: e.target.value})} className="w-1/3 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] disabled:opacity-50 disabled:bg-slate-50">
                  <option value="set">Set Price</option>
                  <option value="increase">Increase by %</option>
                  <option value="decrease">Decrease by %</option>
                </select>
                <input type="number" disabled={!updateFields.updatePrice} value={updateFields.priceValue} onChange={(e) => setUpdateFields({...updateFields, priceValue: parseFloat(e.target.value)})} placeholder="Amount/Percentage" className="flex-1 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] disabled:opacity-50 disabled:bg-slate-50" />
              </div>
            </div>
          </div>
          
          {/* Brand Update */}
          <div className="flex items-start gap-3">
            <div className="pt-1">
              <input type="checkbox" id="upd-brand" checked={updateFields.updateBrand} onChange={(e) => setUpdateFields({...updateFields, updateBrand: e.target.checked})} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
            </div>
            <div className="flex-1">
              <label htmlFor="upd-brand" className="font-medium text-slate-800 cursor-pointer block mb-2">Change Brand</label>
              <select disabled={!updateFields.updateBrand} value={updateFields.brandName} onChange={(e) => setUpdateFields({...updateFields, brandName: e.target.value})} className="w-full sm:w-1/2 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] disabled:opacity-50 disabled:bg-slate-50">
                <option value="">Select Brand...</option>
                {brands.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Category Update */}
          <div className="flex items-start gap-3">
            <div className="pt-1">
              <input type="checkbox" id="upd-cat" checked={updateFields.updateCategory} onChange={(e) => setUpdateFields({...updateFields, updateCategory: e.target.checked})} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
            </div>
            <div className="flex-1">
              <label htmlFor="upd-cat" className="font-medium text-slate-800 cursor-pointer block mb-2">Change Category</label>
              <select disabled={!updateFields.updateCategory} value={updateFields.categoryId} onChange={(e) => setUpdateFields({...updateFields, categoryId: e.target.value})} className="w-full sm:w-1/2 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] disabled:opacity-50 disabled:bg-slate-50">
                <option value="">Select Category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Best Seller Update */}
          <div className="flex items-start gap-3">
            <div className="pt-1">
              <input type="checkbox" id="upd-bestseller" checked={updateFields.updateBestSeller} onChange={(e) => setUpdateFields({...updateFields, updateBestSeller: e.target.checked})} className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer" />
            </div>
            <div className="flex-1">
              <label htmlFor="upd-bestseller" className="font-medium text-slate-800 cursor-pointer block mb-2 flex items-center gap-1.5">
                <Flame size={16} className="text-orange-600 fill-orange-500" />
                <span>Update Best Seller Status</span>
              </label>
              <select disabled={!updateFields.updateBestSeller} value={updateFields.bestSellerValue ? 'yes' : 'no'} onChange={(e) => setUpdateFields({...updateFields, bestSellerValue: e.target.value === 'yes'})} className="w-full sm:w-1/2 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#087FF5] disabled:opacity-50 disabled:bg-slate-50 text-sm">
                <option value="yes">🔥 Mark as Best Seller (Feature on Homepage)</option>
                <option value="no">Remove from Best Sellers</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Controls whether these products appear in the "OUR BEST SELLING PRODUCTS" section on the homepage.</p>
            </div>
          </div>
          
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleUpdate} disabled={loading} className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
            {loading ? 'Applying...' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
