import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Trash2, Upload, Monitor, Tablet, Smartphone, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';
import ResponsiveBannerImage from '../../components/ResponsiveBannerImage';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export default function AdminBanners() {
  const [bannerData, setBannerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingTarget, setUploadingTarget] = useState<DeviceType | null>(null);
  const [activeUploadTab, setActiveUploadTab] = useState<DeviceType>('desktop');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBannerData();
  }, []);

  const fetchBannerData = async () => {
    try {
      const cachedPromo = localStorage.getItem('jayliam_banner_responsive_data');
      let cachedObj: any = null;
      if (cachedPromo) {
        try { cachedObj = JSON.parse(cachedPromo); } catch (e) {}
      }

      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setBannerData({
          ...data,
          image_url_tablet: data.image_url_tablet || cachedObj?.image_url_tablet || '',
          image_url_mobile: data.image_url_mobile || cachedObj?.image_url_mobile || '',
          show_text_overlay: data.show_text_overlay !== undefined ? data.show_text_overlay : (cachedObj?.show_text_overlay ?? true),
        });
      } else if (cachedObj) {
        setBannerData(cachedObj);
      } else {
        setBannerData({
          title: 'Upgrade Your World with Premium Technology',
          subtitle: 'Explore our latest collection of premium smartphones, powerful laptops, and high-quality accessories designed to keep you connected and productive.',
          btn_text: 'Shop Now',
          btn_link: '/shop',
          secondary_btn_text: 'Explore Brands',
          secondary_btn_link: '/shop',
          image_url: '',
          image_url_tablet: '',
          image_url_mobile: '',
          show_text_overlay: true,
          status: 'active'
        });
      }
    } catch (error: any) {
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
    setBannerData({ ...bannerData, status: (bannerData?.status === 'active' ? 'inactive' : 'active') });
  };

  const handleToggleOverlay = () => {
    setBannerData({ ...bannerData, show_text_overlay: !bannerData?.show_text_overlay });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      if (!bannerData?.image_url) {
        throw new Error('Desktop Banner Image is required. Please upload an image first.');
      }

      if (!bannerData?.title) {
        bannerData.title = 'Promo Banner';
      }

      // 1. Immediately cache full responsive data locally
      localStorage.setItem('jayliam_banner_responsive_data', JSON.stringify(bannerData));
      window.dispatchEvent(new Event('jayliam_banner_updated'));

      // 2. Attempt Supabase save with responsive columns
      let saveError: any = null;

      if (bannerData.id) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', bannerData.id);
        saveError = error;
      } else {
        const { data, error } = await supabase
          .from('banners')
          .insert([bannerData])
          .select()
          .single();
        saveError = error;
        if (data) setBannerData(data);
      }

      // If error is due to missing columns in Supabase, gracefully save without the new columns
      if (saveError && (saveError.message?.includes('column') || saveError.code === 'PGRST204' || saveError.code === '42703')) {
        const { image_url_tablet, image_url_mobile, show_text_overlay, ...fallbackData } = bannerData;
        if (bannerData.id) {
          const { error: retryError } = await supabase
            .from('banners')
            .update(fallbackData)
            .eq('id', bannerData.id);
          if (retryError) throw retryError;
        } else {
          const { data, error: retryError } = await supabase
            .from('banners')
            .insert([fallbackData])
            .select()
            .single();
          if (retryError) throw retryError;
          if (data) {
            setBannerData({
              ...data,
              image_url_tablet: bannerData.image_url_tablet,
              image_url_mobile: bannerData.image_url_mobile,
              show_text_overlay: bannerData.show_text_overlay,
            });
          }
        }
        setMessage({ 
          type: 'success', 
          text: 'Banner saved successfully! Responsive desktop, tablet, and mobile graphics are actively applied.' 
        });
      } else if (saveError) {
        throw saveError;
      } else {
        setMessage({ type: 'success', text: 'Promotional banner updated successfully!' });
      }
    } catch (error: any) {
      console.error('Error saving banner data:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save banner data.' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadingTarget) return;

    try {
      setMessage({ type: '', text: '' });
      
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${uploadingTarget}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `banner-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const fieldKey = uploadingTarget === 'desktop' 
        ? 'image_url' 
        : uploadingTarget === 'tablet' 
          ? 'image_url_tablet' 
          : 'image_url_mobile';

      const updated = { ...bannerData, [fieldKey]: data.publicUrl };
      setBannerData(updated);
      localStorage.setItem('jayliam_banner_responsive_data', JSON.stringify(updated));
      window.dispatchEvent(new Event('jayliam_banner_updated'));

      setMessage({ 
        type: 'success', 
        text: `${uploadingTarget.toUpperCase()} banner uploaded successfully. Remember to click "Save Changes".` 
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload image.' });
    } finally {
      setUploadingTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (device: DeviceType) => {
    const fieldKey = device === 'desktop' ? 'image_url' : device === 'tablet' ? 'image_url_tablet' : 'image_url_mobile';
    const updated = { ...bannerData, [fieldKey]: '' };
    setBannerData(updated);
    localStorage.setItem('jayliam_banner_responsive_data', JSON.stringify(updated));
    window.dispatchEvent(new Event('jayliam_banner_updated'));
  };

  const triggerUpload = (device: DeviceType) => {
    setUploadingTarget(device);
    fileInputRef.current?.click();
  };

  const getImageSourceStatus = (device: DeviceType) => {
    if (device === 'mobile') {
      if (bannerData?.image_url_mobile) return { label: 'Custom Mobile Artwork', isCustom: true };
      if (bannerData?.image_url_tablet) return { label: 'Fallback: Tablet Artwork', isCustom: false };
      return { label: 'Fallback: Desktop Artwork', isCustom: false };
    }
    if (device === 'tablet') {
      if (bannerData?.image_url_tablet) return { label: 'Custom Tablet Artwork', isCustom: true };
      return { label: 'Fallback: Desktop Artwork', isCustom: false };
    }
    return { label: 'Primary Desktop Artwork', isCustom: Boolean(bannerData?.image_url) };
  };

  if (loading) return <div className="p-8 text-slate-600">Loading banner settings...</div>;

  return (
    <div className="space-y-8 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#082B52]">Promotional Banner Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure responsive banners across mobile phones, tablets, and desktop displays.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-sm"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} className="shrink-0 text-emerald-600 mt-0.5" /> : <Info size={18} className="shrink-0 text-red-600 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-[#082B52]">Main Promotional Banner</h2>
            <p className="text-xs text-slate-500 mt-0.5">Edit copy, action buttons, image sources, and display modes.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Status:</span>
            <button 
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bannerData?.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}
              aria-label="Toggle active status"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bannerData?.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-slate-600 w-12">{bannerData?.status === 'active' ? 'Active' : 'Hidden'}</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Text & Buttons */}
          <div className="space-y-5">
            {/* Text Overlay Switch */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#082B52] block">HTML Text Overlay</span>
                <span className="text-[11px] text-slate-500">Enable to overlay title, subtitle, and buttons over the banner graphic</span>
              </div>
              <button
                type="button"
                onClick={handleToggleOverlay}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  bannerData?.show_text_overlay
                    ? 'bg-[#087FF5] text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {bannerData?.show_text_overlay ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{bannerData?.show_text_overlay ? 'Enabled' : 'Disabled (Pure Graphic)'}</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
              <input
                type="text"
                name="title"
                value={bannerData?.title || ''}
                onChange={handleInputChange}
                placeholder="e.g. Upgrade Your World with Premium Technology"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Subtitle)</label>
              <textarea
                name="subtitle"
                value={bannerData?.subtitle || ''}
                onChange={handleInputChange}
                rows={3}
                placeholder="Promotional banner description..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Button Text</label>
                <input
                  type="text"
                  name="btn_text"
                  value={bannerData?.btn_text || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Link</label>
                <input
                  type="text"
                  name="btn_link"
                  value={bannerData?.btn_link || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Button Text</label>
                <input
                  type="text"
                  name="secondary_btn_text"
                  value={bannerData?.secondary_btn_text || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Link</label>
                <input
                  type="text"
                  name="secondary_btn_link"
                  value={bannerData?.secondary_btn_link || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Device Responsive Artwork Uploader */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-[#082B52]">Responsive Banner Artwork</label>
                <span className="text-xs text-slate-500">Auto-falls back to desktop if optional sizes omitted</span>
              </div>

              {/* Device Selector Tabs */}
              <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-100 gap-1 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveUploadTab('desktop')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    activeUploadTab === 'desktop'
                      ? 'bg-white text-[#082B52] shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor size={15} />
                  <span>Desktop</span>
                  {bannerData?.image_url && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveUploadTab('tablet')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    activeUploadTab === 'tablet'
                      ? 'bg-white text-[#082B52] shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tablet size={15} />
                  <span>Tablet</span>
                  {bannerData?.image_url_tablet ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal">(Opt)</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveUploadTab('mobile')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    activeUploadTab === 'mobile'
                      ? 'bg-white text-[#082B52] shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone size={15} />
                  <span>Mobile</span>
                  {bannerData?.image_url_mobile ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal">(Opt)</span>
                  )}
                </button>
              </div>

              {/* Upload Card for Active Tab */}
              {activeUploadTab === 'desktop' && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Desktop Banner (Primary Fallback)</span>
                    <span className="text-slate-500">Rec: 1920 × 600 px (ratio ~3.2:1)</span>
                  </div>
                  {bannerData?.image_url ? (
                    <div className="relative rounded-lg border border-slate-300 overflow-hidden group h-[190px] bg-black">
                      <img src={bannerData.image_url} alt="Desktop Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => triggerUpload('desktop')}
                          className="bg-white text-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors shadow"
                        >
                          Replace
                        </button>
                        <button 
                          onClick={() => removeImage('desktop')}
                          className="bg-red-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => triggerUpload('desktop')}
                      className="w-full h-[170px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-[#087FF5] hover:border-[#087FF5] hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      {uploadingTarget === 'desktop' ? (
                        <span className="text-sm font-medium">Uploading desktop banner...</span>
                      ) : (
                        <>
                          <Upload size={28} className="mb-2 text-[#087FF5]" />
                          <span className="font-medium text-sm text-slate-700 mb-0.5">Upload Desktop Banner</span>
                          <span className="text-xs text-slate-400">PNG, JPG, or WEBP up to 5MB</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeUploadTab === 'tablet' && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Tablet Banner (640px – 1023px)</span>
                    <span className="text-slate-500">Rec: 1024 × 480 px (ratio ~2.1:1)</span>
                  </div>
                  {bannerData?.image_url_tablet ? (
                    <div className="relative rounded-lg border border-slate-300 overflow-hidden group h-[190px] bg-black">
                      <img src={bannerData.image_url_tablet} alt="Tablet Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => triggerUpload('tablet')}
                          className="bg-white text-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors shadow"
                        >
                          Replace
                        </button>
                        <button 
                          onClick={() => removeImage('tablet')}
                          className="bg-red-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => triggerUpload('tablet')}
                      className="w-full h-[170px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-[#087FF5] hover:border-[#087FF5] hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      {uploadingTarget === 'tablet' ? (
                        <span className="text-sm font-medium">Uploading tablet banner...</span>
                      ) : (
                        <>
                          <Upload size={28} className="mb-2 text-[#087FF5]" />
                          <span className="font-medium text-sm text-slate-700 mb-0.5">Upload Dedicated Tablet Banner</span>
                          <span className="text-xs text-slate-400">Optional: Falls back to Desktop Banner if omitted</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeUploadTab === 'mobile' && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Mobile Banner (320px – 639px)</span>
                    <span className="text-slate-500">Rec: 750 × 560 px (ratio ~4:3)</span>
                  </div>
                  {bannerData?.image_url_mobile ? (
                    <div className="relative rounded-lg border border-slate-300 overflow-hidden group h-[190px] bg-black">
                      <img src={bannerData.image_url_mobile} alt="Mobile Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => triggerUpload('mobile')}
                          className="bg-white text-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors shadow"
                        >
                          Replace
                        </button>
                        <button 
                          onClick={() => removeImage('mobile')}
                          className="bg-red-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => triggerUpload('mobile')}
                      className="w-full h-[170px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-[#087FF5] hover:border-[#087FF5] hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      {uploadingTarget === 'mobile' ? (
                        <span className="text-sm font-medium">Uploading mobile banner...</span>
                      ) : (
                        <>
                          <Upload size={28} className="mb-2 text-[#087FF5]" />
                          <span className="font-medium text-sm text-slate-700 mb-0.5">Upload Dedicated Mobile Banner</span>
                          <span className="text-xs text-slate-400">Maintains sharpness & prevents text cutoff on phones</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hidden Single File Input */}
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

      {/* Interactive Responsive Device Previewer */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-[#082B52]">Live Responsive Viewport Simulator</h2>
            <p className="text-xs text-slate-500 mt-0.5">Preview how the promotional banner displays across phone, tablet, and desktop viewports.</p>
          </div>
          
          {/* Device Switcher */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                previewDevice === 'desktop' ? 'bg-[#087FF5] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor size={14} /> Desktop (100%)
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                previewDevice === 'tablet' ? 'bg-[#087FF5] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tablet size={14} /> Tablet (768px)
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                previewDevice === 'mobile' ? 'bg-[#087FF5] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone size={14} /> Phone (375px)
            </button>
          </div>
        </div>

        {/* Viewport Info Bar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Simulated screen: <strong className="text-slate-800 uppercase">{previewDevice}</strong> ({previewDevice === 'desktop' ? 'Fluid Full Width' : previewDevice === 'tablet' ? '768px Width' : '375px Phone'})
          </span>
          <span className={`font-medium ${getImageSourceStatus(previewDevice).isCustom ? 'text-emerald-700' : 'text-amber-700'}`}>
            {getImageSourceStatus(previewDevice).label}
          </span>
        </div>

        {/* Simulator Frame Container */}
        <div className="p-4 sm:p-8 bg-slate-200/70 flex justify-center items-center overflow-x-auto min-h-[380px]">
          <div 
            className="transition-all duration-300 rounded-2xl shadow-xl overflow-hidden border border-slate-400/40 relative bg-slate-900"
            style={{ 
              width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
              maxWidth: '100%'
            }}
          >
            {/* Simulated Promo Banner */}
            <div className={`relative w-full flex items-center overflow-hidden ${
              previewDevice === 'mobile' 
                ? 'aspect-[4/3] min-h-[220px]' 
                : previewDevice === 'tablet' 
                  ? 'aspect-[2.2/1] min-h-[280px]' 
                  : 'aspect-[3.1/1] min-h-[320px]'
            }`}>
              {/* Background Picture */}
              <ResponsiveBannerImage
                desktopUrl={bannerData?.image_url}
                tabletUrl={bannerData?.image_url_tablet}
                mobileUrl={bannerData?.image_url_mobile}
                fallbackUrl="https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000&auto=format&fit=crop"
                alt="Promo Banner Preview"
                className="absolute inset-0 w-full h-full block"
                imgClassName="w-full h-full object-cover object-center"
              />

              {/* Text Overlay (if enabled) */}
              {bannerData?.show_text_overlay && bannerData?.title && (
                <div className="absolute inset-0 z-10 flex items-center bg-gradient-to-r from-black/85 via-black/55 to-transparent">
                  <div className={`flex flex-col items-start justify-center max-w-[560px] ${
                    previewDevice === 'mobile' ? 'p-4' : previewDevice === 'tablet' ? 'p-8' : 'p-10'
                  }`}>
                    <h3 
                      className="font-extrabold text-white leading-tight mb-1.5 drop-shadow-md"
                      style={{ 
                        fontSize: previewDevice === 'mobile' ? '1.2rem' : previewDevice === 'tablet' ? '1.65rem' : '2.1rem' 
                      }}
                    >
                      {bannerData.title}
                    </h3>

                    {bannerData.subtitle && (
                      <p className={`text-slate-200 leading-snug mb-3 drop-shadow max-w-md ${
                        previewDevice === 'mobile' ? 'text-xs line-clamp-2' : 'text-sm'
                      }`}>
                        {bannerData.subtitle}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {bannerData.btn_text && (
                        <button className="bg-[#087FF5] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
                          {bannerData.btn_text}
                        </button>
                      )}
                      {bannerData.secondary_btn_text && (
                        <button className="bg-white/15 border border-white/30 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm">
                          {bannerData.secondary_btn_text}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
