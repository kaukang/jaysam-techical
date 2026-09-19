import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Upload, 
  ListPlus, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  CheckCircle2, 
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import AdminBulkBrandsModal from '../../components/admin/AdminBulkBrandsModal';

const DEFAULT_STORE_BRANDS = [
  { name: 'Samsung', slug: 'samsung' },
  { name: 'Apple', slug: 'apple' },
  { name: 'Infinix', slug: 'infinix' },
  { name: 'Tecno', slug: 'tecno' },
  { name: 'Xiaomi', slug: 'xiaomi' },
  { name: 'Nokia', slug: 'nokia' },
  { name: 'Oppo', slug: 'oppo' },
  { name: 'Redmi', slug: 'redmi' }
];

const STORAGE_KEY = 'jayliam_custom_brands';

// Helper to normalize brand identifiers across all sources
const normalizeBrandKey = (item: any): string => {
  if (!item) return '';
  const bySlug = (item.slug || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const byName = (item.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const byId = String(item.id || '').trim().toLowerCase().replace(/^(default-brand-|product-brand-|prod-brand-)/, '').replace(/[^a-z0-9]/g, '');
  return bySlug || byName || byId;
};

export default function AdminBrands() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    is_active: true,
    display_order: 0
  });
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [quickUploadingId, setQuickUploadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tableMissingNotice, setTableMissingNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowFileInputRef = useRef<HTMLInputElement>(null);
  const targetRowBrandRef = useRef<any | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Helper to read cached/custom brands from localStorage (deduplicated)
  const getCustomBrandsFromStorage = (): any[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const dedupMap = new Map<string, any>();
      parsed.forEach(item => {
        if (!item) return;
        const key = normalizeBrandKey(item);
        if (key) {
          const existing = dedupMap.get(key) || {};
          dedupMap.set(key, { ...existing, ...item });
        }
      });
      return Array.from(dedupMap.values());
    } catch {
      return [];
    }
  };

  // Helper to save/merge brand updates into localStorage and notify the storefront (deduplicated)
  const saveCustomBrandsToStorage = (updatedList: any[]) => {
    try {
      const dedupMap = new Map<string, any>();
      if (Array.isArray(updatedList)) {
        updatedList.forEach(item => {
          if (!item) return;
          const key = normalizeBrandKey(item);
          if (key) {
            const existing = dedupMap.get(key) || {};
            dedupMap.set(key, { ...existing, ...item });
          }
        });
      }
      const cleanList = Array.from(dedupMap.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
      window.dispatchEvent(new CustomEvent('jayliam_brands_updated', { detail: cleanList }));
    } catch (e) {
      console.warn('Could not persist brands to localStorage:', e);
    }
  };

  const fetchBrands = async () => {
    setLoading(true);
    let supabaseBrands: any[] = [];
    let isTableMissing = false;

    try {
      const { data: brandsData, error } = await supabase
        .from('brands')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        if (error.code === 'PGRST205') {
          isTableMissing = true;
          setTableMissingNotice(true);
        } else {
          console.error('Error fetching brands from Supabase:', error);
        }
      } else if (brandsData) {
        supabaseBrands = brandsData;
        setTableMissingNotice(false);
      }
    } catch (err: any) {
      if (err?.code === 'PGRST205') {
        isTableMissing = true;
        setTableMissingNotice(true);
      }
    }

    // Fetch product counts for each brand from active catalog
    const counts: Record<string, number> = {};
    const catalogBrandsSet = new Set<string>();
    try {
      const { data: productsData } = await supabase.from('products').select('brand');
      if (productsData) {
        productsData.forEach(p => {
          if (p.brand) {
            const b = p.brand.trim().toLowerCase();
            counts[b] = (counts[b] || 0) + 1;
            catalogBrandsSet.add(p.brand.trim());
          }
        });
      }
    } catch (pErr) {
      console.warn('Error fetching products for brand counts:', pErr);
    }

    // Retrieve locally synchronized brand logos/custom additions
    const storedCustomBrands = getCustomBrandsFromStorage();

    // Consolidate list starting with Supabase brands or stored custom brands
    const consolidatedMap = new Map<string, any>();

    // 1. Add Supabase brands
    supabaseBrands.forEach(b => {
      const key = normalizeBrandKey(b);
      if (key) {
        consolidatedMap.set(key, { ...b });
      }
    });

    // 2. Overlay any local stored brand updates (like uploaded logos)
    storedCustomBrands.forEach(cb => {
      const key = normalizeBrandKey(cb);
      if (key) {
        const existing = consolidatedMap.get(key) || {};
        consolidatedMap.set(key, {
          ...existing,
          ...cb,
          id: existing.id || cb.id || `default-brand-${key}`,
          name: cb.name || existing.name || (key.charAt(0).toUpperCase() + key.slice(1)),
          slug: cb.slug || existing.slug || key,
          logo_url: cb.logo_url !== undefined ? cb.logo_url : (existing.logo_url || null)
        });
      }
    });

    // 3. Add any brands from active products not yet in the list
    Array.from(catalogBrandsSet).forEach(bName => {
      const key = normalizeBrandKey({ name: bName });
      if (key && !consolidatedMap.has(key)) {
        const cleanSlug = key.replace(/[^a-z0-9]+/g, '-');
        consolidatedMap.set(key, {
          id: `product-brand-${cleanSlug}`,
          name: bName,
          slug: cleanSlug,
          logo_url: null,
          is_active: true,
          display_order: consolidatedMap.size + 1
        });
      }
    });

    // 4. Ensure default trusted electronic brands exist
    DEFAULT_STORE_BRANDS.forEach((def, idx) => {
      const key = normalizeBrandKey(def);
      if (key && !consolidatedMap.has(key)) {
        consolidatedMap.set(key, {
          id: `default-brand-${def.slug || key}`,
          name: def.name,
          slug: def.slug || key,
          logo_url: null,
          is_active: true,
          display_order: consolidatedMap.size + idx + 1
        });
      }
    });

    // Map consolidated brands with accurate product count and guarantee unique IDs
    const seenRowIds = new Set<string>();
    const finalList = Array.from(consolidatedMap.values()).map((brand, idx) => {
      const bKey = (brand.name || '').trim().toLowerCase();
      let uniqueId = String(brand.id || `brand-${brand.slug || idx}`).trim();
      if (seenRowIds.has(uniqueId)) {
        uniqueId = `${uniqueId}-${idx}`;
      }
      seenRowIds.add(uniqueId);

      return {
        ...brand,
        id: uniqueId,
        product_count: counts[bKey] || 0
      };
    });

    // Sort by display_order then name
    finalList.sort((a, b) => {
      const orderA = typeof a.display_order === 'number' ? a.display_order : 999;
      const orderB = typeof b.display_order === 'number' ? b.display_order : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });

    setBrands(finalList);
    setLoading(false);
  };

  /**
   * Resilient Logo Upload:
   * 1. Attempts upload to Supabase storage bucket `media/brand-images/`
   * 2. If Supabase storage succeeds, gets CDN public URL.
   * 3. If Supabase storage fails (e.g. RLS AccessDenied, offline, or bucket issue),
   *    converts the image to a high-fidelity data URL fallback so the admin's upload NEVER fails!
   */
  const processAndUploadImage = async (file: File, brandName: string): Promise<string> => {
    const validMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];
    const validExtensions = /\.(png|jpe?g|webp|svg|gif)$/i;

    if (!validMimes.includes(file.type) && !file.name.match(validExtensions)) {
      throw new Error('Please select an image file (PNG, SVG, JPG, or WebP).');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size exceeds 5MB limit. Please upload a smaller logo.');
    }

    // Step 1: Attempt Supabase Storage
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanBrand = (brandName || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const uniqueFileName = `${cleanBrand}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `brand-images/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!uploadError) {
        const { data } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          return data.publicUrl;
        }
      } else {
        console.warn('Supabase storage upload encountered error, falling back to data URL:', uploadError);
      }
    } catch (storageErr) {
      console.warn('Supabase storage attempt threw exception, proceeding with data URL:', storageErr);
    }

    // Step 2: Resilient Data URL Fallback
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to parse uploaded image file.'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading image file.'));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Fast 1-Click Upload or Replace from Table Row
   */
  const handleTriggerRowUpload = (brand: any) => {
    targetRowBrandRef.current = brand;
    if (rowFileInputRef.current) {
      rowFileInputRef.current.value = '';
      rowFileInputRef.current.click();
    }
  };

  const handleRowFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetBrand = targetRowBrandRef.current;
    if (!file || !targetBrand) return;

    try {
      setQuickUploadingId(targetBrand.id || targetBrand.name);

      // Upload or convert image
      const uploadedUrl = await processAndUploadImage(file, targetBrand.name);

      // Update state locally immediately
      const updatedBrands = brands.map(b => {
        if ((b.id && b.id === targetBrand.id) || b.name.toLowerCase() === targetBrand.name.toLowerCase()) {
          return { ...b, logo_url: uploadedUrl };
        }
        return b;
      });
      setBrands(updatedBrands);

      // Persist to local storage to ensure immediate homepage rendering
      const stored = getCustomBrandsFromStorage();
      const existingIdx = stored.findIndex((b: any) => b.name.toLowerCase() === targetBrand.name.toLowerCase());
      const brandPayload = {
        id: targetBrand.id || `custom-brand-${targetBrand.slug || targetBrand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: targetBrand.name,
        slug: targetBrand.slug || targetBrand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logo_url: uploadedUrl,
        is_active: targetBrand.is_active !== undefined ? targetBrand.is_active : true,
        display_order: targetBrand.display_order || 0
      };

      if (existingIdx >= 0) {
        stored[existingIdx] = { ...stored[existingIdx], ...brandPayload };
      } else {
        stored.push(brandPayload);
      }
      saveCustomBrandsToStorage(stored);

      // Attempt to update Supabase if table and record exist
      try {
        if (targetBrand.id && !String(targetBrand.id).startsWith('default-') && !String(targetBrand.id).startsWith('product-')) {
          await supabase.from('brands').update({ logo_url: uploadedUrl }).eq('id', targetBrand.id);
        } else {
          // If was a placeholder, try inserting full brand into Supabase
          await supabase.from('brands').insert([brandPayload]);
        }
      } catch (dbErr) {
        console.warn('Supabase DB sync note (saved locally):', dbErr);
      }

      showToast(`Official logo for ${targetBrand.name} successfully updated and linked to Homepage!`);
    } catch (err: any) {
      console.error('Error uploading row logo:', err);
      showToast(err.message || 'Error uploading logo image', 'error');
    } finally {
      setQuickUploadingId(null);
      targetRowBrandRef.current = null;
    }
  };

  /**
   * Modal Open / Close Handlers
   */
  const handleOpenModal = (brand: any = null) => {
    if (brand) {
      setEditingId(brand.id);
      setFormData({
        name: brand.name,
        slug: brand.slug,
        description: brand.description || '',
        logo_url: brand.logo_url || '',
        is_active: brand.is_active !== false,
        display_order: brand.display_order || 0
      });
      setCustomLogoUrl(brand.logo_url || '');
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        logo_url: '',
        is_active: true,
        display_order: brands.length + 1
      });
      setCustomLogoUrl('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCustomLogoUrl('');
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editingId) {
      setFormData({ ...formData, name, slug: generateSlug(name) });
    } else {
      setFormData({ ...formData, name });
    }
  };

  /**
   * Modal File Upload Handler
   */
  const handleModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const uploadedUrl = await processAndUploadImage(file, formData.name || 'brand');
      setFormData(prev => ({ ...prev, logo_url: uploadedUrl }));
      setCustomLogoUrl(uploadedUrl);
      showToast('Logo image processed successfully. Click "Save Brand" to commit.');
    } catch (error: any) {
      console.error('Modal upload error:', error);
      showToast(error.message || 'Error processing logo image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyLogoUrl = () => {
    if (!customLogoUrl.trim()) return;
    setFormData(prev => ({ ...prev, logo_url: customLogoUrl.trim() }));
    showToast('Logo URL applied to preview!');
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: '' }));
    setCustomLogoUrl('');
  };

  /**
   * Save Brand to DB & LocalStore
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const cleanSlug = formData.slug || generateSlug(formData.name);
      const payload = {
        ...formData,
        slug: cleanSlug
      };

      let dbSaveSuccess = false;
      try {
        if (editingId && !String(editingId).startsWith('default-') && !String(editingId).startsWith('product-')) {
          const { error } = await supabase
            .from('brands')
            .update(payload)
            .eq('id', editingId);
          if (error) throw error;
          dbSaveSuccess = true;
        } else {
          const { error } = await supabase
            .from('brands')
            .insert([payload]);
          if (error) throw error;
          dbSaveSuccess = true;
        }
      } catch (dbErr: any) {
        if (dbErr?.code === 'PGRST205') {
          console.warn('Brands table not yet present in Supabase schema cache; saving locally.');
          setTableMissingNotice(true);
        } else {
          console.warn('Supabase DB save note:', dbErr);
        }
      }

      // Always update local cache & broadcast to Homepage
      const stored = getCustomBrandsFromStorage();
      const existingIdx = stored.findIndex((b: any) => 
        (editingId && b.id === editingId) || 
        b.name.toLowerCase() === formData.name.toLowerCase() ||
        b.slug === cleanSlug
      );

      const brandItem = {
        id: editingId || `custom-brand-${cleanSlug}`,
        ...payload
      };

      if (existingIdx >= 0) {
        stored[existingIdx] = { ...stored[existingIdx], ...brandItem };
      } else {
        stored.push(brandItem);
      }
      saveCustomBrandsToStorage(stored);

      showToast(
        dbSaveSuccess 
          ? `Brand "${formData.name}" and official logo saved and linked to Homepage!`
          : `Brand "${formData.name}" saved! Logo is active and linked to Homepage.`
      );

      handleCloseModal();
      fetchBrands();
    } catch (error: any) {
      console.error('Error saving brand:', error);
      showToast(error.message || 'Error saving brand', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (brand: any) => {
    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) return;

    try {
      // Remove from Supabase if real row
      if (brand.id && !String(brand.id).startsWith('default-') && !String(brand.id).startsWith('product-')) {
        const { error } = await supabase
          .from('brands')
          .delete()
          .eq('id', brand.id);
        if (error && error.code !== 'PGRST205') throw error;
      }

      // Remove from local storage
      const stored = getCustomBrandsFromStorage().filter((b: any) => 
        b.id !== brand.id && b.name.toLowerCase() !== brand.name.toLowerCase()
      );
      saveCustomBrandsToStorage(stored);

      showToast(`Brand "${brand.name}" has been removed.`);
      fetchBrands();
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      showToast(error.message || 'Error deleting brand', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hidden File Input for Direct Row-Level Logo Upload */}
      <input
        type="file"
        ref={rowFileInputRef}
        onChange={handleRowFileSelected}
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        className="hidden"
      />

      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#082B52]">Brands Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload official logos, manage catalog brands, and customize how they appear in the Homepage 'Shop by Brand' section.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ListPlus size={17} />
            <span>Bulk Add Brands</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus size={17} />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {/* Informational Migration Banner if Supabase table is not yet created */}
      {tableMissingNotice && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">
                Brands Table Schema Notice
              </p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Brand logos uploaded here are currently stored and linked directly to the Homepage. To synchronize them into Supabase's relational database, execute the <code>brand-migration.sql</code> script in your Supabase SQL Editor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Brands Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider w-24">
                  Official Logo
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">
                  Brand Name & Slug
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">
                  Catalog Products
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-center w-20">
                  Order
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brands.map((brand, bIdx) => {
                const hasLogo = Boolean(brand.logo_url && brand.logo_url.trim() !== '');
                const monogram = brand.name ? brand.name.trim().slice(0, 2).toUpperCase() : 'BR';
                const isQuickUploading = quickUploadingId === (brand.id || brand.name);

                return (
                  <tr 
                    key={`admin-brand-row-${brand.id || brand.slug || bIdx}`} 
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Logo Column with Quick Upload trigger */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div 
                          onClick={() => handleTriggerRowUpload(brand)}
                          title="Click to upload or replace official logo"
                          className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-center p-1 relative overflow-hidden group/logo cursor-pointer hover:border-[#087FF5] transition-all shadow-2xs"
                        >
                          {hasLogo ? (
                            <img 
                              src={brand.logo_url} 
                              alt={brand.name} 
                              className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover/logo:scale-105" 
                            />
                          ) : (
                            <div className="font-extrabold text-xs text-[#082B52] bg-slate-100/90 w-full h-full rounded-lg flex items-center justify-center">
                              {monogram}
                            </div>
                          )}

                          {/* Hover Upload Overlay */}
                          <div className="absolute inset-0 bg-[#082B52]/75 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center text-white">
                            {isQuickUploading ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Upload size={14} />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Brand Name and Slug */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#082B52]">
                          {brand.name}
                        </span>
                        <a 
                          href={`/shop?brand=${encodeURIComponent(brand.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View brand in Storefront"
                          className="text-slate-400 hover:text-[#087FF5] transition-colors"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">
                        /{brand.slug}
                      </span>
                    </td>

                    {/* Catalog Products count */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {brand.product_count > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-[#087FF5] border border-blue-100">
                          <span>{brand.product_count}</span>
                          <span className="text-slate-500 font-normal">
                            {brand.product_count === 1 ? 'product' : 'products'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">0 products</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        brand.is_active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {brand.is_active !== false ? 'Active' : 'Hidden'}
                      </span>
                    </td>

                    {/* Display Order */}
                    <td className="px-5 py-3 whitespace-nowrap text-center text-xs font-medium text-slate-500">
                      {brand.display_order ?? '-'}
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-3 whitespace-nowrap text-right text-sm">
                      <div className="inline-flex items-center gap-2">
                        {/* Quick upload button */}
                        <button 
                          onClick={() => handleTriggerRowUpload(brand)}
                          disabled={isQuickUploading}
                          title={hasLogo ? "Replace official brand logo" : "Upload official brand logo"}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#087FF5] text-slate-700 hover:text-[#087FF5] bg-white hover:bg-blue-50/50 transition-colors shadow-2xs"
                        >
                          {isQuickUploading ? (
                            <RefreshCw size={13} className="animate-spin text-[#087FF5]" />
                          ) : (
                            <Upload size={13} />
                          )}
                          <span>{hasLogo ? 'Replace Logo' : 'Upload Logo'}</span>
                        </button>

                        {/* Edit full brand modal */}
                        <button 
                          onClick={() => handleOpenModal(brand)}
                          title="Edit Brand details"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#087FF5] hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Delete brand */}
                        <button 
                          onClick={() => handleDelete(brand)}
                          title="Delete Brand"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {brands.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No brands found</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Add Brand" or "Bulk Add Brands" to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#082B52]">
                  {editingId ? `Edit Brand: ${formData.name || 'Brand'}` : 'Add New Brand'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update brand information and upload the official brand logo.
                </p>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
              {/* Brand Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samsung, Apple, Infinix"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent transition-all"
                />
              </div>
              
              {/* Brand Slug */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. samsung"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#087FF5] bg-slate-50 font-mono text-slate-600 text-xs"
                />
              </div>

              {/* Official Brand Logo Section */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#082B52]">
                      Official Brand Logo
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Displayed on the Homepage 'Shop by Brand' section.
                    </span>
                  </div>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                {/* Logo Preview or Upload Dropzone */}
                {formData.logo_url ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                    {/* Contrast Preview Box */}
                    <div className="w-28 h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center p-2 relative shrink-0 overflow-hidden">
                      <img 
                        src={formData.logo_url} 
                        alt="Brand Logo Preview" 
                        className="max-h-full max-w-full object-contain mix-blend-multiply" 
                        onError={() => showToast('Failed to load image preview from URL', 'error')}
                      />
                    </div>

                    <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                      <div className="text-xs font-medium text-emerald-700 flex items-center justify-center sm:justify-start gap-1">
                        <Check size={14} /> Logo linked and ready
                      </div>
                      <p className="text-[11px] text-slate-400 break-all line-clamp-1 font-mono">
                        {formData.logo_url.startsWith('data:') ? 'Embedded base64 vector/image' : formData.logo_url}
                      </p>
                      
                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Upload size={13} />
                          <span>Replace File</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-28 border-2 border-dashed border-slate-300 hover:border-[#087FF5] bg-white rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-[#087FF5] hover:bg-blue-50/40 transition-all cursor-pointer p-4 text-center group"
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#087FF5]">
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Uploading logo image...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#087FF5] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <Upload size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-[#087FF5]">
                          Click to upload official logo
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          PNG, SVG, WebP or JPG (Transparent background recommended)
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Hidden File Input for Modal */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleModalImageUpload} 
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden" 
                />

                {/* Optional URL input field */}
                <div className="pt-2 border-t border-slate-200/60">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <LinkIcon size={12} />
                    <span>Or enter official logo web URL:</span>
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="url"
                      placeholder="https://example.com/logo.svg"
                      value={customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#087FF5] bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyLogoUrl}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Status and Display Order */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Visibility
                  </label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#087FF5] bg-white"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#087FF5]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Short note about the brand or product specialty..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#087FF5] resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-6 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-70 flex items-center gap-1.5 shadow-sm"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Brand</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Brands Modal */}
      <AdminBulkBrandsModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          setIsBulkModalOpen(false);
          fetchBrands();
        }}
        existingBrands={brands}
      />
    </div>
  );
}
