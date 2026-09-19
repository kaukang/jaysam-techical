const fs = require('fs');

const content = `import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Image as ImageIcon, Save, Trash2, Upload } from 'lucide-react';

export default function AdminBanners() {
  const [bannerData, setBannerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBannerData();
  }, []);

  const fetchBannerData = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setBannerData(data);
      } else {
        setBannerData({
          title: 'Upgrade Your World with Premium Technology',
          subtitle: 'Explore our latest collection of premium smartphones, powerful laptops, and high-quality accessories designed to keep you connected and productive.',
          btn_text: 'Shop Now',
          btn_link: '/shop',
          image_url: '',
          status: 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching banner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBannerData({ ...bannerData, [name]: value });
  };

  const handleToggleActive = () => {
    setBannerData({ ...bannerData, status: bannerData.status === 'active' ? 'inactive' : 'active' });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (bannerData.id) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', bannerData.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('banners')
          .insert([bannerData])
          .select()
          .single();
        if (error) throw error;
        setBannerData(data);
      }
      setMessage({ type: 'success', text: 'Banner updated successfully!' });
    } catch (error: any) {
      console.error('Error saving banner data:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save banner data.' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage({ type: '', text: '' });
      
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = \`banner_\${Math.random().toString(36).substring(2, 15)}.\${fileExt}\`;
      const filePath = \`banner-images/\${fileName}\`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      setBannerData({ ...bannerData, image_url: data.publicUrl });
      setMessage({ type: 'success', text: 'Image uploaded successfully. Remember to save changes.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setBannerData({ ...bannerData, image_url: '' });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#082B52]">Promotional Banner Management</h1>
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
        <div className={\`p-4 rounded-lg text-sm font-medium \${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}\`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-semibold text-[#082B52]">Main Promo Banner</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Status:</span>
            <button 
              onClick={handleToggleActive}
              className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors \${bannerData?.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}\`}
            >
              <span className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${bannerData?.status === 'active' ? 'translate-x-6' : 'translate-x-1'}\`} />
            </button>
            <span className="text-sm font-medium text-slate-600 w-12">{bannerData?.status === 'active' ? 'Active' : 'Hidden'}</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
              <input
                type="text"
                name="title"
                value={bannerData?.title || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Subtitle)</label>
              <textarea
                name="subtitle"
                value={bannerData?.subtitle || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
                <input
                  type="text"
                  name="btn_text"
                  value={bannerData?.btn_text || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Button Link</label>
                <input
                  type="text"
                  name="btn_link"
                  value={bannerData?.btn_link || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Banner Background Image</label>
            
            {bannerData?.image_url ? (
              <div className="relative rounded-lg border border-slate-200 overflow-hidden group">
                <img src={bannerData.image_url} alt="Banner" className="w-full h-[300px] object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-slate-800 px-4 py-2 rounded-lg font-medium hover:bg-slate-100 transition-colors"
                  >
                    Replace
                  </button>
                  <button 
                    onClick={removeImage}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[300px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-[#087FF5] hover:border-[#087FF5] hover:bg-blue-50/50 transition-colors cursor-pointer"
              >
                {uploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <Upload size={32} className="mb-3" />
                    <span className="font-medium mb-1">Click to upload image</span>
                    <span className="text-xs text-slate-400">PNG, JPG or WEBP up to 5MB</span>
                  </>
                )}
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/png, image/jpeg, image/webp"
              className="hidden" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/admin/AdminBanners.tsx', content);
console.log('Successfully updated AdminBanners.tsx');
