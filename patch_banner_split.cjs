const fs = require('fs');
const filePath = 'src/pages/Home.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetRegex = /\{\/\* Promotional Banners \*\/\}\s*<section className="py-16 bg-\[\#F8FAFC\]">[\s\S]*?\{\/\* Why Choose Us \*\/\}/;

const newBannerHtml = `{/* Promotional Banners */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-[5vw]">
          <div className="bg-[#082B52] rounded-2xl overflow-hidden flex flex-col lg:flex-row items-center shadow-lg border border-[#082B52]">
            
            {/* Text Content (Left side on desktop, Top on mobile) */}
            <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col items-start justify-center order-2 lg:order-1 relative z-10">
              <span className="text-[12px] sm:text-[14px] font-bold text-[#38bdf8] tracking-widest uppercase mb-4 block">
                Premium Collection
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                {promoBannerData?.title || 'Upgrade Your World with Premium Technology.'}
              </h3>
              <p className="text-slate-300 text-[15px] sm:text-[17px] mb-8 leading-relaxed max-w-lg">
                {promoBannerData?.subtitle || 'Explore our latest collection of premium smartphones, powerful laptops, and high-quality accessories designed to keep you connected and productive.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link to={promoBannerData?.btn_link || '/shop'} className="bg-[#38bdf8] hover:bg-[#0284c7] text-white font-medium py-3.5 px-8 rounded-lg flex items-center justify-center text-[15px] transition-all shadow-md hover:shadow-lg">
                  {promoBannerData?.btn_text || 'Shop Now'} <ArrowRight size={18} className="ml-2" />
                </Link>
                {promoBannerData?.secondary_btn_text ? (
                  <Link to={promoBannerData.secondary_btn_link || '/shop'} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3.5 px-8 rounded-lg flex items-center justify-center text-[15px] transition-all shadow-md hover:shadow-lg">
                    {promoBannerData.secondary_btn_text}
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Image Content (Right side on desktop, Bottom on mobile) */}
            <div className="w-full lg:w-1/2 min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] h-full relative order-1 lg:order-2">
              <img 
                src={promoBannerData?.image_url || 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000&auto=format&fit=crop'} 
                alt={promoBannerData?.title || 'Promotional Banner'} 
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Optional: Slight gradient purely to blend the edge nicely if needed, but keeping it mostly clean */}
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#082B52] to-transparent hidden lg:block z-10"></div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Why Choose Us */}`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, newBannerHtml);
  fs.writeFileSync(filePath, content);
  console.log('Successfully replaced promotional banner section with a split layout');
} else {
  console.log('Could not find promotional banner section to replace');
}
