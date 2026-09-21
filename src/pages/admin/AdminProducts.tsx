import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Upload, Search, Filter, CheckSquare, Sparkles, Headphones, Tag, Flame } from 'lucide-react';
import AdminBulkProductsModal from '../../components/admin/AdminBulkProductsModal';
import AdminBulkEditModal from '../../components/admin/AdminBulkEditModal';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [badgeFilter, setBadgeFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category_id: '',
    description: '',
    short_description: '',
    price: 0,
    old_price: 0,
    sku: '',
    stock_quantity: 0,
    is_featured: false,
    is_accessory: false,
    is_best_seller: false,
    on_sale: false,
    status: 'active'
  });

  const [productImages, setProductImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name, slug').order('name'),
        supabase.from('brands').select('id, name').order('name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (brandsRes && !brandsRes.error) {
        setBrands((brandsRes.data || []).filter((b: any) => 
          b.name && !['accessories', 'accessory', 'jayliam'].includes(b.name.toLowerCase())
        ));
      }

      // One-time auto cleanup for any legacy product where brand was incorrectly stored as 'Accessories'
      try {
        await supabase.from('products').update({ brand: '' }).ilike('brand', 'accessories');
        await supabase.from('brands').delete().ilike('name', 'accessories');
      } catch (e) {}

      let cats = categoriesRes.data || [];
      // Ensure Accessories category is recognized
      const hasAccessories = cats.some((c: any) => 
        c.name?.toLowerCase().includes('accessor') || c.slug === 'accessories'
      );
      if (!hasAccessories) {
        try {
          const { data: newCat } = await supabase
            .from('categories')
            .insert([{
              name: 'Accessories',
              slug: 'accessories',
              status: 'active',
              display_order: 4,
              description: 'Phone cases, chargers, screen protectors, cables & tech accessories'
            }])
            .select()
            .single();
          if (newCat) {
            cats = [...cats, newCat];
          }
        } catch (e) {
          // Handled gracefully if session not present
        }
      }

      // Fetch Best Sellers to identify which products are currently marked
      const bsProductIds = new Set<string>();
      try {
        const { data: bsItems } = await supabase.from('best_seller_products').select('product_id');
        if (bsItems && bsItems.length > 0) {
          bsItems.forEach((b: any) => { if (b.product_id) bsProductIds.add(b.product_id); });
        }
      } catch (e) {
        // Table may not exist yet or empty
      }
      try {
        const localBs = localStorage.getItem('jayliam_best_sellers_ids');
        if (localBs) {
          const parsed = JSON.parse(localBs);
          if (Array.isArray(parsed)) parsed.forEach((id: string) => bsProductIds.add(id));
        }
      } catch (e) {}

      // Fetch primary images for each product
      const productData = await Promise.all(
        (productsRes.data || []).map(async (p: any) => {
          const { data: images } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', p.id)
            .eq('is_primary', true)
            .limit(1)
            .single();
          
          const isBestSeller = Boolean(p.is_best_seller || bsProductIds.has(p.id));
          return { 
            ...p, 
            primary_image: images?.image_url || null,
            is_best_seller: isBestSeller
          };
        })
      );

      setProducts(productData);
      setCategories(cats);
    } catch (error) {
      if (error && (error as any).code === 'PGRST205') {
        console.warn('Error fetching data:' + ' (Brands table missing, ignored)');
      } else {
        console.error('Error fetching data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (product: any = null) => {
    if (product) {
      setEditingId(product.id);
      const isAcc = (product.is_accessory !== undefined && product.is_accessory !== null)
        ? Boolean(product.is_accessory)
        : (
            product.categories?.name?.toLowerCase().includes('accessor') || 
            categories.find(c => c.id === product.category_id)?.name?.toLowerCase().includes('accessor') ||
            product.name?.toLowerCase().includes('accessory') ||
            product.name?.toLowerCase().includes('case') ||
            product.name?.toLowerCase().includes('cable') ||
            product.name?.toLowerCase().includes('charger')
          );
      const isOnSale = (product.old_price && Number(product.old_price) > Number(product.price)) || false;

      const isBestSeller = (product.is_best_seller !== undefined && product.is_best_seller !== null)
        ? Boolean(product.is_best_seller)
        : false;

      const cleanExistingBrand = (product.brand || '').trim();
      setFormData({
        name: product.name,
        brand: ['accessories', 'accessory', 'jayliam'].includes(cleanExistingBrand.toLowerCase()) ? '' : cleanExistingBrand,
        category_id: product.category_id || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price,
        old_price: product.old_price || 0,
        sku: product.sku || '',
        stock_quantity: product.stock_quantity || 0,
        is_featured: product.is_featured || false,
        is_accessory: Boolean(isAcc),
        is_best_seller: Boolean(isBestSeller),
        on_sale: Boolean(isOnSale),
        status: product.status || 'active'
      });

      // Fetch images
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });
      
      setProductImages(images || []);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        brand: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        description: '',
        short_description: '',
        price: 0,
        old_price: 0,
        sku: '',
        stock_quantity: 0,
        is_featured: false,
        is_accessory: false,
        is_best_seller: false,
        on_sale: false,
        status: 'active'
      });
      setProductImages([]);
    }
    setIsModalOpen(true);
  };

  const syncBestSeller = async (productId: string, isBestSeller: boolean) => {
    try {
      if (isBestSeller) {
        const { data: existing } = await supabase
          .from('best_seller_products')
          .select('id')
          .eq('product_id', productId)
          .limit(1);
        if (!existing || existing.length === 0) {
          await supabase
            .from('best_seller_products')
            .insert([{ product_id: productId, display_order: 0 }]);
        }
        await supabase
          .from('best_sellers_config')
          .update({ is_active: true, mode: 'manual' })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      } else {
        await supabase
          .from('best_seller_products')
          .delete()
          .eq('product_id', productId);
      }
    } catch (e) {
      console.warn('best_seller_products sync notice:', e);
    }

    try {
      const stored = localStorage.getItem('jayliam_best_sellers_ids');
      let idSet = new Set<string>();
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) idSet = new Set(parsed);
        } catch (e) {}
      }
      if (isBestSeller) {
        idSet.add(productId);
      } else {
        idSet.delete(productId);
      }
      localStorage.setItem('jayliam_best_sellers_ids', JSON.stringify(Array.from(idSet)));
    } catch (e) {}
  };

  const handleToggleBestSeller = async (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newStatus = !product.is_best_seller;

    // Optimistically update products state
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_best_seller: newStatus } : p));

    // Try updating product column
    try {
      await supabase.from('products').update({ is_best_seller: newStatus }).eq('id', product.id);
    } catch (err) {}

    // Sync best seller table and localStorage
    await syncBestSeller(product.id, newStatus);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setProductImages([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      
      if (name === 'is_accessory') {
        const accCat = categories.find((c: any) => 
          c.name?.toLowerCase().includes('accessor') || c.slug === 'accessories'
        );
        setFormData(prev => ({
          ...prev,
          is_accessory: checked,
          category_id: checked && accCat ? accCat.id : prev.category_id
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (name === 'category_id') {
      const selectedCat = categories.find((c: any) => c.id === value);
      const isAcc = selectedCat?.name?.toLowerCase().includes('accessor') || selectedCat?.slug === 'accessories';
      setFormData(prev => ({
        ...prev,
        category_id: value,
        is_accessory: Boolean(isAcc)
      }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalCategoryId = formData.category_id;
      if (formData.is_accessory) {
        const accCat = categories.find((c: any) => 
          c.name?.toLowerCase().includes('accessor') || c.slug === 'accessories'
        );
        if (accCat) {
          finalCategoryId = accCat.id;
        }
      }

      // Database payload - Accessories is a category, NOT a brand
      let finalBrand = formData.brand?.trim() || '';
      if (['accessories', 'accessory', 'jayliam'].includes(finalBrand.toLowerCase())) {
        finalBrand = '';
      }

      const payload: any = {
        name: formData.name.trim(),
        brand: finalBrand,
        category_id: finalCategoryId || null,
        description: formData.description || '',
        short_description: formData.short_description || '',
        price: Number(formData.price) || 0,
        old_price: Number(formData.old_price) || 0,
        sku: formData.sku?.trim() || '',
        stock_quantity: Number(formData.stock_quantity) || 0,
        is_featured: Boolean(formData.is_featured),
        is_accessory: Boolean(formData.is_accessory),
        is_best_seller: Boolean(formData.is_best_seller),
        status: formData.status || 'active'
      };

      let productId = editingId;

      const performSave = async (dataPayload: any) => {
        if (editingId) {
          return await supabase
            .from('products')
            .update({ ...dataPayload, updated_at: new Date().toISOString() })
            .eq('id', editingId);
        } else {
          return await supabase
            .from('products')
            .insert([dataPayload])
            .select()
            .single();
        }
      };

      let result = await performSave(payload);

      // If is_best_seller or is_accessory columns haven't been added via SQL yet, retry safely without them
      if (result.error && (result.error.message?.includes('is_best_seller') || result.error.message?.includes('is_accessory') || result.error.code === 'PGRST204')) {
        const fallbackPayload = { ...payload };
        if (result.error.message?.includes('is_best_seller') || result.error.code === 'PGRST204') {
          delete fallbackPayload.is_best_seller;
        }
        if (result.error.message?.includes('is_accessory')) {
          delete fallbackPayload.is_accessory;
        }
        result = await performSave(fallbackPayload);
      }

      if (result.error) throw result.error;
      if (!editingId && result.data) {
        productId = result.data.id;
      }
      
      const targetId = editingId || productId;
      if (targetId) {
        await syncBestSeller(targetId, Boolean(formData.is_best_seller));
      }
      
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      if (error && error.code === 'PGRST205') {
        console.warn('Error saving product:' + ' (Brands table missing, ignored)');
      } else {
        console.error('Error saving product:', error);
      }
      alert(error.message || 'Error saving product');
    }
  };

  
  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) return;
    
    let confirmMsg = '';
    if (action === 'delete') confirmMsg = `Are you sure you want to delete ${selectedProducts.length} products?`;
    else confirmMsg = `Are you sure you want to change status to ${action} for ${selectedProducts.length} products?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
      setBulkActionLoading(true);
      if (action === 'delete') {
        // Must delete images first to avoid orphans, but for simplicity let's just delete products
        // (Supabase cascade rules might handle it)
        const { error } = await supabase.from('products').delete().in('id', selectedProducts);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').update({ status: action }).in('id', selectedProducts);
        if (error) throw error;
      }
      setSelectedProducts([]);
      fetchData();
    } catch (error) {
      if (error && error.code === 'PGRST205') {
        console.warn('Error in bulk action:' + ' (Brands table missing, ignored)');
      } else {
        console.error('Error in bulk action:', error);
      }
      alert('An error occurred during bulk action.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkBestSeller = async (markAsBestSeller: boolean) => {
    if (selectedProducts.length === 0) return;
    try {
      setBulkActionLoading(true);
      // Optimistically update products state
      setProducts(prev => prev.map(p => selectedProducts.includes(p.id) ? { ...p, is_best_seller: markAsBestSeller } : p));

      // Attempt DB update
      try {
        await supabase.from('products').update({ is_best_seller: markAsBestSeller }).in('id', selectedProducts);
      } catch (e) {}

      // Sync best seller tables and local storage for each
      for (const id of selectedProducts) {
        await syncBestSeller(id, markAsBestSeller);
      }

      setSelectedProducts([]);
      fetchData();
    } catch (error) {
      console.error('Error in bulk best seller update:', error);
      alert('An error occurred during best seller update.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(pId => pId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? All associated images will be deleted.')) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      if (error && error.code === 'PGRST205') {
        console.warn('Error deleting product:' + ' (Brands table missing, ignored)');
      } else {
        console.error('Error deleting product:', error);
      }
      alert('Error deleting product');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!editingId) {
        alert('Please save the product details first before uploading images.');
        return;
      }

      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const newImages = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `product_${editingId}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // Save to DB
        const { data: newImage, error: dbError } = await supabase
          .from('product_images')
          .insert([{
            product_id: editingId,
            image_url: data.publicUrl,
            is_primary: productImages.length === 0 && i === 0,
            display_order: productImages.length + i
          }])
          .select()
          .single();

        if (dbError) throw dbError;
        newImages.push(newImage);
      }

      setProductImages([...productImages, ...newImages]);
    } catch (error) {
      if (error && error.code === 'PGRST205') {
        console.warn('Upload error:' + ' (Brands table missing, ignored)');
      } else {
        console.error('Upload error:', error);
      }
      alert('Error uploading image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    try {
      // Set all to false
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', editingId);
      
      // Set selected to true
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      setProductImages(productImages.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
    } catch (error) {
      if (error && error.code === 'PGRST205') {
        console.warn('Error setting primary image:' + ' (Brands table missing, ignored)');
      } else {
        console.error('Error setting primary image:', error);
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);
      if (error) throw error;
      
      setProductImages(productImages.filter(img => img.id !== imageId));
    } catch (error) {
      if (error && error.code === 'PGRST205') {
        console.warn('Error deleting image:' + ' (Brands table missing, ignored)');
      } else {
        console.error('Error deleting image:', error);
      }
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    const matchesBrand = brandFilter === 'all' || p.brand === brandFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    let matchesStock = true;
    if (stockFilter === 'out') matchesStock = p.stock_quantity === 0;
    else if (stockFilter === 'low') matchesStock = p.stock_quantity > 0 && p.stock_quantity <= 5;
    else if (stockFilter === 'in') matchesStock = p.stock_quantity > 5;

    let matchesBadge = true;
    if (badgeFilter === 'best_seller') matchesBadge = Boolean(p.is_best_seller);
    else if (badgeFilter === 'featured') matchesBadge = Boolean(p.is_featured);
    else if (badgeFilter === 'accessory') matchesBadge = Boolean(p.is_accessory);
    else if (badgeFilter === 'sale') matchesBadge = Boolean(p.old_price && Number(p.old_price) > Number(p.price));
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesStock && matchesBadge;
  });

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#082B52]">Products</h1>
        
  <div className="flex gap-2">
    <button 
      onClick={() => setIsBulkModalOpen(true)}
      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
    >
      <Upload size={18} />
      <span className="hidden sm:inline">Bulk Add</span>
    </button>
    <button 
      onClick={() => handleOpenModal()}
      className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
    >
      <Plus size={18} />
      <span className="hidden sm:inline">Add Product</span>
    </button>
  </div>
  
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
          />
        </div>
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] text-xs sm:text-sm">
            <option value="all">All Categories</option>
            {categories.map((c, cIdx) => (<option key={c.id || c.name || `cat-opt-${cIdx}`} value={c.id}>{c.name}</option>))}
          </select>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] text-xs sm:text-sm">
            <option value="all">All Brands</option>
            {brands.map((b, bIdx) => (<option key={b.id || `brand-opt-${bIdx}`} value={b.name}>{b.name}</option>))}
          </select>
          <select value={badgeFilter} onChange={(e) => setBadgeFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] text-xs sm:text-sm">
            <option value="all">All Highlights</option>
            <option value="best_seller">🔥 Best Sellers</option>
            <option value="featured">⭐ Featured</option>
            <option value="accessory">🎧 Accessories</option>
            <option value="sale">🏷️ On Sale</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] text-xs sm:text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] text-xs sm:text-sm">
            <option value="all">All Stock</option>
            <option value="in">In Stock (over 5)</option>
            <option value="low">Low Stock (1-5)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      
  {selectedProducts.length > 0 && (
    <div className="bg-[#F4F9FF] border border-[#087FF5]/20 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-[#082B52]">
        <CheckSquare size={18} className="text-[#087FF5]" />
        <span className="font-medium">{selectedProducts.length} selected</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button 
          onClick={() => handleBulkBestSeller(true)} 
          disabled={bulkActionLoading} 
          className="text-xs font-semibold px-3 py-1.5 bg-orange-50 border border-orange-200 rounded text-orange-700 hover:bg-orange-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Flame size={13} className="fill-orange-600 text-orange-600" />
          Mark as Best Seller
        </button>
        <button 
          onClick={() => handleBulkBestSeller(false)} 
          disabled={bulkActionLoading} 
          className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          Remove Best Seller
        </button>
        <button onClick={() => setIsBulkEditModalOpen(true)} className="text-xs font-medium px-4 py-1.5 bg-white border border-[#E5EAF2] rounded text-[#082B52] hover:bg-slate-50 transition-colors">Bulk Actions ▼</button>
        <button onClick={() => handleBulkAction('delete')} disabled={bulkActionLoading} className="text-xs font-medium px-3 py-1.5 bg-red-50 border border-red-200 rounded text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">Delete Selected</button>
      </div>
    </div>
  )}

<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 w-12 text-center"><input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5] cursor-pointer" /></th><th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status & Highlights</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((product, pIdx) => (
                <tr key={product.id || `prod-${pIdx}`} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 text-center"><input type="checkbox" checked={selectedProducts.includes(product.id || `prod-${pIdx}`)} onChange={() => toggleSelect(product.id || `prod-${pIdx}`)} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5] cursor-pointer" /></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      {product.primary_image ? (
                        <img src={product.primary_image} alt={product.name} className="w-12 h-12 rounded object-cover bg-slate-50 border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-800">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.sku || 'No SKU'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {product.categories?.name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                    KSh {product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock_quantity > 10 ? 'bg-emerald-100 text-emerald-800' : 
                      product.stock_quantity > 0 ? 'bg-amber-100 text-amber-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.stock_quantity} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {product.status}
                      </span>
                      {/* Best Seller Checkbox Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleBestSeller(product, e)}
                        title={product.is_best_seller ? 'Best Seller on Home Page - Click to remove' : 'Click to feature in Best Sellers on Home Page'}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                          product.is_best_seller
                            ? 'bg-orange-500 text-white border-orange-600 shadow-xs hover:bg-orange-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50'
                        }`}
                      >
                        <Flame size={11} className={product.is_best_seller ? 'text-white fill-white' : 'text-slate-400'} />
                        <span>{product.is_best_seller ? 'Best Seller' : '+ Best Seller'}</span>
                      </button>
                      {product.is_featured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          <Sparkles size={11} className="text-purple-600" />
                          Featured
                        </span>
                      )}
                      {(product.categories?.name?.toLowerCase().includes('accessor') || 
                        product.name?.toLowerCase().includes('accessory') ||
                        product.name?.toLowerCase().includes('charger') ||
                        product.name?.toLowerCase().includes('cable') ||
                        product.name?.toLowerCase().includes('case')) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <Headphones size={11} className="text-emerald-600" />
                          Accessory
                        </span>
                      )}
                      {product.old_price && Number(product.old_price) > Number(product.price) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Tag size={10} className="text-amber-600" />
                          Sale
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleOpenModal(product)}
                      className="text-[#087FF5] hover:text-[#0666C5] mr-4"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
              <h2 className="text-xl font-bold text-[#082B52]">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="product-form" onSubmit={handleSave} className="space-y-8">
                
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                      <select
                        name="category_id"
                        required
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                      >
                        <option value="">Select a category</option>
                        {categories.map((c, cIdx) => (
                          <option key={c.id || c.name || `cat-opt-${cIdx}`} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Pricing & Inventory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Price (KSh) *</label>
                      <input
                        type="number"
                        name="price"
                        required
                        min="0"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Old Price (Optional)</label>
                      <input
                        type="number"
                        name="old_price"
                        min="0"
                        value={formData.old_price}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity *</label>
                      <input
                        type="number"
                        name="stock_quantity"
                        required
                        min="0"
                        value={formData.stock_quantity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Description</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Short Description</label>
                      <textarea
                        name="short_description"
                        value={formData.short_description}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Classification Options */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Status & Classification Badges</h3>
                  
                  <div className="mb-5 max-w-xs">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] bg-white text-sm"
                    >
                      <option value="active">Active (Visible in Store)</option>
                      <option value="inactive">Inactive (Hidden from Customers)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                      Product Badges & Options
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Select checkboxes to classify and highlight this product across the store:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Best Seller Checkbox */}
                      <label 
                        htmlFor="is_best_seller" 
                        className={`relative flex items-start p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.is_best_seller 
                            ? 'border-orange-500 bg-orange-50/70 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            type="checkbox"
                            id="is_best_seller"
                            name="is_best_seller"
                            checked={formData.is_best_seller}
                            onChange={handleInputChange}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                        </div>
                        <div className="ml-3 text-left">
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#082B52]">
                            <Flame size={16} className={formData.is_best_seller ? 'text-orange-600 fill-orange-500' : 'text-slate-400'} />
                            <span>Best Seller</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">
                            Feature in "OUR BEST SELLING PRODUCTS" section on the homepage
                          </p>
                        </div>
                      </label>

                      {/* Featured Product Checkbox */}
                      <label 
                        htmlFor="is_featured" 
                        className={`relative flex items-start p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.is_featured 
                            ? 'border-[#087FF5] bg-[#F4F9FF] shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            type="checkbox"
                            id="is_featured"
                            name="is_featured"
                            checked={formData.is_featured}
                            onChange={handleInputChange}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-[#087FF5] focus:ring-[#087FF5] cursor-pointer"
                          />
                        </div>
                        <div className="ml-3 text-left">
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#082B52]">
                            <Sparkles size={16} className={formData.is_featured ? 'text-[#087FF5]' : 'text-slate-400'} />
                            <span>Featured Product</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">
                            Showcase in homepage highlights and promotional banners
                          </p>
                        </div>
                      </label>

                      {/* Accessories Checkbox */}
                      <label 
                        htmlFor="is_accessory" 
                        className={`relative flex items-start p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.is_accessory 
                            ? 'border-emerald-500 bg-emerald-50/70 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            type="checkbox"
                            id="is_accessory"
                            name="is_accessory"
                            checked={formData.is_accessory}
                            onChange={handleInputChange}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </div>
                        <div className="ml-3 text-left">
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#082B52]">
                            <Headphones size={16} className={formData.is_accessory ? 'text-emerald-600' : 'text-slate-400'} />
                            <span>Accessories</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">
                            Classify as accessory (chargers, cables, cases, adapters, audio)
                          </p>
                        </div>
                      </label>

                      {/* On Sale / Promotion Checkbox */}
                      <label 
                        htmlFor="on_sale" 
                        className={`relative flex items-start p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.on_sale 
                            ? 'border-amber-500 bg-amber-50/70 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            type="checkbox"
                            id="on_sale"
                            name="on_sale"
                            checked={formData.on_sale}
                            onChange={handleInputChange}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </div>
                        <div className="ml-3 text-left">
                          <div className="flex items-center gap-1.5 font-bold text-sm text-[#082B52]">
                            <Tag size={16} className={formData.on_sale ? 'text-amber-600' : 'text-slate-400'} />
                            <span>On Sale / Offer</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">
                            Display discount badge comparing current price with regular price
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </form>

              {/* Images (Only show if editing an existing product) */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center justify-between">
                  Product Images
                  {!editingId && <span className="text-sm font-normal text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Save product first to upload images</span>}
                </h3>
                
                {editingId && (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                      {productImages.map((img) => (
                        <div key={img.id} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden group bg-slate-50">
                          <img src={img.image_url} alt="" className="w-full h-full object-contain" />
                          {img.is_primary && (
                            <div className="absolute top-2 left-2 bg-[#087FF5] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                              Primary
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            {!img.is_primary && (
                              <button 
                                onClick={() => handleSetPrimaryImage(img.id)}
                                className="text-xs bg-white text-slate-800 px-3 py-1.5 rounded font-medium hover:bg-slate-100"
                              >
                                Set Primary
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteImage(img.id)}
                              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded font-medium hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Upload Button */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-[#087FF5] hover:border-[#087FF5] hover:bg-blue-50/50 transition-colors cursor-pointer"
                      >
                        {uploading ? (
                          <span>Uploading...</span>
                        ) : (
                          <>
                            <Upload size={24} className="mb-2" />
                            <span className="text-sm font-medium">Add Images</span>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/png, image/jpeg, image/webp"
                        multiple
                        className="hidden" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 shrink-0 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {editingId ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
      <AdminBulkProductsModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        onSuccess={() => { setIsBulkModalOpen(false); fetchData(); }} 
        categories={categories} 
      />
      <AdminBulkEditModal 
        isOpen={isBulkEditModalOpen} 
        onClose={() => setIsBulkEditModalOpen(false)} 
        onSuccess={() => { setIsBulkEditModalOpen(false); setSelectedProducts([]); fetchData(); }} 
        selectedProductIds={selectedProducts}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
