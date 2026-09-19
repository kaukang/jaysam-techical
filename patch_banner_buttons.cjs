const fs = require('fs');

// --- Patch Home.tsx ---
const homePath = 'src/pages/Home.tsx';
let homeContent = fs.readFileSync(homePath, 'utf8');

const targetHomeStr = `<Link to="/shop" className="bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-medium py-3.5 px-8 rounded-lg flex items-center justify-center text-[15px] transition-all shadow-lg hover:shadow-xl">
                  Explore Brands
                </Link>`;
                
const replacementHomeStr = `{promoBannerData?.secondary_btn_text ? (
                  <Link to={promoBannerData.secondary_btn_link || '/shop'} className="bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-medium py-3.5 px-8 rounded-lg flex items-center justify-center text-[15px] transition-all shadow-lg hover:shadow-xl">
                    {promoBannerData.secondary_btn_text}
                  </Link>
                ) : null}`;

if (homeContent.includes(targetHomeStr)) {
  homeContent = homeContent.replace(targetHomeStr, replacementHomeStr);
  fs.writeFileSync(homePath, homeContent);
  console.log('Successfully patched Home.tsx');
} else {
  console.log('Could not find target string in Home.tsx');
}

// --- Patch AdminBanners.tsx ---
const adminPath = 'src/pages/admin/AdminBanners.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Add default values for secondary buttons
adminContent = adminContent.replace(
  "btn_link: '/shop',",
  "btn_link: '/shop',\n          secondary_btn_text: 'Explore Brands',\n          secondary_btn_link: '/shop',"
);

// Add the input fields in the JSX
const targetAdminStr = `              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Button Link</label>
                <input
                  type="text"
                  name="btn_link"
                  value={bannerData?.btn_link || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent"
                />
              </div>
            </div>`;

const replacementAdminStr = `              <div>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Button Text</label>
                <input
                  type="text"
                  name="secondary_btn_text"
                  value={bannerData?.secondary_btn_text || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Button Link</label>
                <input
                  type="text"
                  name="secondary_btn_link"
                  value={bannerData?.secondary_btn_link || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent"
                />
              </div>
            </div>`;

if (adminContent.includes(targetAdminStr)) {
  adminContent = adminContent.replace(targetAdminStr, replacementAdminStr);
}

// Update error handling to catch column missing error gracefully
adminContent = adminContent.replace(
  "setMessage({ type: 'error', text: error.message || 'Failed to save banner data.' });",
  `if (error.message?.includes('column') || error.code?.startsWith('PGRST')) {
        setMessage({ type: 'error', text: 'Database schema needs updating. Please run the SQL snippet provided by the assistant to add secondary button columns.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to save banner data.' });
      }`
);

fs.writeFileSync(adminPath, adminContent);
console.log('Successfully patched AdminBanners.tsx');
