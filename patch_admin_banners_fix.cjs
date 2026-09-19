const fs = require('fs');
const filePath = 'src/pages/admin/AdminBanners.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const defaultBannerState = `{
          title: 'Upgrade Your World with Premium Technology',
          subtitle: 'Explore our latest collection of premium smartphones, powerful laptops, and high-quality accessories designed to keep you connected and productive.',
          btn_text: 'Shop Now',
          btn_link: '/shop',
          secondary_btn_text: 'Explore Brands',
          secondary_btn_link: '/shop',
          image_url: '',
          status: 'active'
        }`;

// 1. Fix fetch error leaving bannerData null
content = content.replace(
  `} catch (error) {`,
  `} catch (error: any) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        // Table doesn't exist yet, just use defaults
        setBannerData(${defaultBannerState});
      }`
);

// 2. Fix the toggle crash just in case
content = content.replace(
  `bannerData.status === 'active' ? 'inactive' : 'active'`,
  `(bannerData?.status === 'active' ? 'inactive' : 'active')`
);

// 3. Fix handleSave validating empty values
const handleSaveStart = `  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {`;
    
const validationInsert = `  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (!bannerData?.title) {
        throw new Error('Headline (title) is required.');
      }
      if (!bannerData?.image_url) {
        throw new Error('Banner Background Image is required. Please upload an image first.');
      }`;

content = content.replace(handleSaveStart, validationInsert);

fs.writeFileSync(filePath, content);
console.log('Successfully fixed AdminBanners.tsx');
