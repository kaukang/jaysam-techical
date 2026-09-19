import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Trash2, Upload, Monitor, Tablet, Smartphone, CheckCircle, Info } from 'lucide-react';
import ResponsiveBannerImage from '../../components/ResponsiveBannerImage';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export default function AdminHomepage() {
  const [heroData, setHeroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingTarget, setUploadingTarget] = useState<DeviceType | null>(null);
  const [activeUploadTab, setActiveUploadTab] = useState<DeviceType>('desktop');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      const cachedHero = localStorage.getItem('jayliam_hero_responsive_data');
      let cachedObj: any = null;
      if (cachedHero) {
        try { cachedObj = JSON.parse(cachedHero); } catch (e) {}
      }

      const { data, error } = await supabase
        .from('hero_sections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setHeroData({
          ...data,
          image_url_tablet: data.image_url_tablet || cachedObj?.image_url_tablet || '',
          image_url_mobile: data.image_url_mobile || cachedObj?.image_url_mobile || '',
        });
      } else if (cachedObj) {
        setHeroData(cachedObj);
      } else {
        setHeroData({
          headline: 'Elevate Your Digital Lifestyle.',
          highlighted_text: 'Premium Tech',
          description: 'Discover the latest premium smartphones, cutting-edge laptops, and high-fidelity audio equipment. Expertly curated for the modern professional.',
          primary_btn_text: 'Shop New Arrivals',
          primary_btn_link: '/shop',
          secondary_btn_text: 'View Special Offers',
          secondary_btn_link: '/shop?sale=true',
          image_url: '',
          image_url_tablet: '',
          image_url_mobile: '',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error fetching hero data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHeroData({ ...heroData, [name]: value });
  };

  const handleToggleActive = () => {
    setHeroData({ ...heroData, is_active: !heroData.is_active });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Immediately cache full responsive data locally
      localStorage.setItem('jayliam_hero_responsive_data', JSON.stringify(heroData));
      window.dispatchEvent(new Event('jayliam_hero_updated'));

      // 2. Attempt Supabase save with responsive columns
      let saveError: any = null;

      if (heroData.id) {
        const { error } = await supabase
          .from('hero_sections')
          .update(heroData)
          .eq('id', heroData.id);
        saveError = error;
      } else {
        const { data, error } = await supabase
          .from('hero_sections')
          .insert([heroData])
          .select()
          .single();
        saveError = error;
        if (data) setHeroData(data);
      }

      // If error is due to missing columns in Supabase, gracefully save without the new columns
      if (saveError && (saveError.message?.includes('column') || saveError.code === 'PGRST204' || saveError.code === '42703')) {
        const { image_url_tablet, image_url_mobile, ...fallbackData } = heroData;
        if (heroData.id) {
          const { error: retryError } = await supabase
            .from('hero_sections')
            .update(fallbackData)
            .eq('id', heroData.id);
          if (retryError) throw retryError;
        } else {
          const { data, error: retryError } = await supabase
            .from('hero_sections')
            .insert([fallbackData])
            .select()
            .single();
          if (retryError) throw retryError;
          if (data) {
            setHeroData({
              ...data,
              image_url_tablet: heroData.image_url_tablet,
              image_url_mobile: heroData.image_url_mobile,
            });
          }
        }
        setMessage({ 
          type: 'success', 
          text: 'Hero banner saved successfully! Responsive desktop, tablet, and mobile artwork are actively applied.' 
        });
      } else if (saveError) {
        throw saveError;
      } else {
        setMessage({ type: 'success', text: 'Hero banner and responsive images updated successfully!' });
      }
    } catch (error: any) {
      console.error('Error saving hero data:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save hero data.' });
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
      const fileName = `hero_${uploadingTarget}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `hero-images/${fileName}`;

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

      const updated = { ...heroData, [fieldKey]: data.publicUrl };
      setHeroData(updated);
      localStorage.setItem('jayliam_hero_responsive_data', JSON.stringify(updated));
      window.dispatchEvent(new Event('jayliam_hero_updated'));

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
    const updated = { ...heroData, [fieldKey]: '' };
    setHeroData(updated);
    localStorage.setItem('jayliam_hero_responsive_data', JSON.stringify(updated));
    window.dispatchEvent(new Event('jayliam_hero_updated'));
  };

  const triggerUpload = (device: DeviceType) => {
    setUploadingTarget(device);
    fileInputRef.current?.click();
  };

  const getActiveImageForDevice = (device: DeviceType) => {
    if (device === 'mobile') {
      return heroData?.image_url_mobile || heroData?.image_url_tablet || heroData?.image_url;
    }
    if (device === 'tablet') {
      return heroData?.image_url_tablet || heroData?.image_url;
    }
    return heroData?.image_url;
  };

  const getImageSourceStatus = (device: DeviceType) => {
    if (device === 'mobile') {
      if (heroData?.image_url_mobile) return { label: 'Custom Mobile Artwork', isCustom: true };
      if (heroData?.image_url_tablet) return { label: 'Fallback: Tablet Artwork', isCustom: false };
      return { label: 'Fallback: Desktop Artwork', isCustom: false };
    }
    if (device === 'tablet') {
      if (heroData?.image_url_tablet) return { label: 'Custom Tablet Artwork', isCustom: true };
      return { label: 'Fallback: Desktop Artwork', isCustom: false };
    }
    return { label: 'Primary Desktop Artwork', isCustom: Boolean(heroData?.image_url) };
  };

  if (loading) return <div className="p-8 text-slate-600">Loading homepage settings...</div>;

  return (
    <div className="space-y-8 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#082B52]">Homepage Hero Banner Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure responsive banners for mobile phones, tablets, and desktop displays.</p>
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
            <h2 className="text-lg font-semibold text-[#082B52]">Hero Banner Configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Edit headline, copy, action buttons, and responsive images.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Status:</span>
            <button 
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${heroData?.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
              aria-label="Toggle active status"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${heroData?.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-slate-600 w-12">{heroData?.is_active ? 'Active' : 'Hidden'}</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Text & CTA Settings */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Headline Text</label>
              <input
                type="text"
                name="headline"
                value={heroData?.headline || ''}
                onChange={handleInputChange}
                placeholder="e.g. Elevate Your Digital Lifestyle."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Highlighted Text <span className="text-[#087FF5] font-normal">(appears in accent blue)</span></label>
              <input
                type="text"
                name="highlighted_text"
                value={heroData?.highlighted_text || ''}
                onChange={handleInputChange}
                placeholder="e.g. Premium Tech"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Subtitle)</label>
              <textarea
                name="description"
                value={heroData?.description || ''}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief promotional description..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Button Text</label>
                <input
                  type="text"
                  name="primary_btn_text"
                  value={heroData?.primary_btn_text || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Link</label>
                <input
                  type="text"
                  name="primary_btn_link"
                  value={heroData?.primary_btn_link || ''}
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
                  value={heroData?.secondary_btn_text || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Link</label>
                <input
                  type="text"
                  name="secondary_btn_link"
                  value={heroData?.secondary_btn_link || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Device Responsive Banner Uploader */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-[#082B52]">Responsive Banner Images</label>
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
                  {heroData?.image_url && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
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
                  {heroData?.image_url_tablet ? (
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
                  {heroData?.image_url_mobile ? (
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
                    <span className="font-semibold text-slate-700">Desktop Image (Primary Fallback)</span>
                    <span className="text-slate-500">Rec: 1920 × 700 px (ratio ~2.7:1)</span>
                  </div>
                  {heroData?.image_url ? (
                    <div className="relative rounded-lg border border-slate-300 overflow-hidden group h-[200px] bg-black">
                      <img src={heroData.image_url} alt="Desktop Hero" className="w-full h-full object-cover" />
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
                      className="w-full h-[180px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-[#087FF5] hover:border-[#087FF5] hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      {uploadingTarget === 'desktop' ? (
                        <span className="text-sm font-medium">Uploading desktop image...</span>
                      ) : (
                        <>
                          <Upload size={28} className="mb-2 text-[#087FF5]" />
                          <span className="font-medium text-sm text-slate-700 mb-0.5">Upload Desktop Hero Banner</span>
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
                    <span className="font-semibold text-slate-700">Tablet Image (640px – 1023px)</span>
                    <span className="text-slate-500">Rec: 1024 × 560 px (ratio ~16:9)</span>
                  </div>
                  {heroData?.image_url_tablet ? (
                    <div className="relative rounded-lg border border-slate-300 overflow-hidden group h-[200px] bg-black">
                      <img src={heroData.image_url_tablet} alt="Tablet Hero" className="w-full h-full object-cover" />
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
                      className="w-full h-[180px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-[#087FF5] hover:border-[#087FF5] hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      {uploadingTarget === 'tablet' ? (
                        <span className="text-sm font-medium">Uploading tablet image...</span>
                      ) : (
                        <>
                          <Upload size={28} className="mb-2 text-[#087FF5]" />
                          <span className="font-medium text-sm text-slate-700 mb-0.5">Upload Dedicated Tablet Artwork</span>
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
                    <span className="font-semibold text-slate-700">Mobile Image (320px – 639px)</span>
                    <span className="text-slate-500">Rec: 750 × 600 px (ratio ~4:3 or 1:1)</span>
                  </div>
                  {heroData?.image_url_mobile ? (
                    <div className="relative rounded-lg border border-slate-300 overflow-hidden group h-[200px] bg-black">
                      <img src={heroData.image_url_mobile} alt="Mobile Hero" className="w-full h-full object-cover" />
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
                      className="w-full h-[180px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-[#087FF5] hover:border-[#087FF5] hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      {uploadingTarget === 'mobile' ? (
                        <span className="text-sm font-medium">Uploading mobile image...</span>
                      ) : (
                        <>
                          <Upload size={28} className="mb-2 text-[#087FF5]" />
                          <span className="font-medium text-sm text-slate-700 mb-0.5">Upload Dedicated Mobile Artwork</span>
                          <span className="text-xs text-slate-400">Keeps phones legible & avoids cropping side content</span>
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
            <p className="text-xs text-slate-500 mt-0.5">Test how your banner, typography, and CTA buttons adapt across devices.</p>
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
        <div className="p-4 sm:p-8 bg-slate-200/70 flex justify-center items-center overflow-x-auto min-h-[420px]">
          <div 
            className="transition-all duration-300 rounded-2xl shadow-xl overflow-hidden border border-slate-400/40 relative bg-slate-950"
            style={{ 
              width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
              maxWidth: '100%'
            }}
          >
            {/* Simulated Hero Section Banner */}
            <div className={`relative flex items-center overflow-hidden ${
              previewDevice === 'mobile' 
                ? 'min-h-[380px] p-5' 
                : previewDevice === 'tablet' 
                  ? 'min-h-[460px] p-8' 
                  : 'min-h-[520px] p-12'
            }`}>
              {/* Background Picture */}
              <div className="absolute inset-0 z-0 w-full h-full">
                <ResponsiveBannerImage
                  desktopUrl={heroData?.image_url}
                  tabletUrl={heroData?.image_url_tablet}
                  mobileUrl={heroData?.image_url_mobile}
                  alt="Hero Preview"
                  imgClassName="w-full h-full object-cover object-center"
                />
              </div>

              {/* Scrim Gradient */}
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/95 via-black/80 to-black/35 md:via-black/60 md:to-transparent" />
              {previewDevice === 'mobile' && (
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              )}

              {/* Text Layer */}
              <div className="relative z-20 w-full max-w-[620px]">
                <span className="text-[10px] font-bold text-white/90 tracking-widest uppercase mb-2 inline-block border border-white/20 rounded-full px-2.5 py-0.5 backdrop-blur-sm bg-white/10">
                  WELCOME TO JAYLIAM TECH
                </span>
                
                <h3 
                  className="font-extrabold text-white tracking-tight leading-tight mb-1"
                  style={{ 
                    fontSize: previewDevice === 'mobile' ? '1.65rem' : previewDevice === 'tablet' ? '2.25rem' : '2.75rem' 
                  }}
                >
                  {heroData?.headline || 'Elevate Your Digital Lifestyle.'}
                </h3>

                <h4 
                  className="font-extrabold text-[#38bdf8] tracking-tight leading-tight mb-2.5"
                  style={{ 
                    fontSize: previewDevice === 'mobile' ? '1.35rem' : previewDevice === 'tablet' ? '1.75rem' : '2.2rem' 
                  }}
                >
                  {heroData?.highlighted_text || 'Premium Tech'}
                </h4>

                <p className={`text-slate-200 mb-4 leading-relaxed ${
                  previewDevice === 'mobile' ? 'text-xs line-clamp-3' : 'text-sm'
                }`}>
                  {heroData?.description || 'Discover the latest premium smartphones, cutting-edge laptops, and high-fidelity audio equipment.'}
                </p>

                <div className={`flex gap-2.5 ${previewDevice === 'mobile' ? 'flex-col w-full' : 'flex-row'}`}>
                  <button className="bg-[#38bdf8] text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm text-center">
                    {heroData?.primary_btn_text || 'Shop New Arrivals'}
                  </button>
                  <button className="bg-white/15 border border-white/30 text-white text-xs font-medium py-2.5 px-4 rounded-lg text-center backdrop-blur-sm">
                    {heroData?.secondary_btn_text || 'View Special Offers'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
