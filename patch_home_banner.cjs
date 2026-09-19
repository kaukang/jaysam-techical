const fs = require('fs');

const filePath = 'src/pages/Home.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state for promoBanner
content = content.replace(
  "const [heroData, setHeroData] = useState<any>(null);",
  "const [heroData, setHeroData] = useState<any>(null);\n  const [promoBannerData, setPromoBannerData] = useState<any>(null);"
);

// 2. Fetch promo banner data
const fetchHeroReplacement = `      if (hero) {
        setHeroData(hero);
      }
      
      const { data: banner } = await supabase
        .from('banners')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (banner) {
        setPromoBannerData(banner);
      }
`;

content = content.replace(
  `      if (hero) {
        setHeroData(hero);
      }`,
  fetchHeroReplacement
);

// 3. Replace the three-card layout with a large responsive banner
const oldCardsRegex = /\{\/\* Promotional Banners \*\/\}\s*<section className="py-16 bg-\[\#F8FAFC\]">[\s\S]*?\{\/\* Why Choose Us \*\/\}/;

const newBannerHtml = `{/* Promotional Banners */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-[5vw]">
          <div 
            className="relative rounded-2xl overflow-hidden min-h-[400px] flex items-center bg-cover bg-center group"
            style={{ 
              backgroundImage: \`url(\${promoBannerData?.image_url || 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000&auto=format&fit=crop'})\` 
            }}
          >
            {/* Dark Gradient Overlay for Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#082B52]/90 via-[#082B52]/70 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90"></div>
            
            <div className="relative z-20 w-full max-w-2xl p-8 sm:p-12 lg:p-16 flex flex-col items-start">
              <span className="text-[12px] sm:text-[14px] font-bold text-[#38bdf8] tracking-widest uppercase mb-4 block drop-shadow">
                Premium Collection
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-md">
                {promoBannerData?.title || 'Upgrade Your World with Premium Technology.'}
              </h3>
              <p className="text-gray-200 text-[15px] sm:text-[17px] mb-8 leading-relaxed max-w-lg drop-shadow">
                {promoBannerData?.subtitle || 'Explore our latest collection of premium smartphones, powerful laptops, and high-quality accessories designed to keep you connected and productive.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link to={promoBannerData?.btn_link || '/shop'} className="bg-[#38bdf8] hover:bg-[#0284c7] text-white font-medium py-3.5 px-8 rounded-lg flex items-center justify-center text-[15px] transition-all shadow-lg hover:shadow-xl">
                  {promoBannerData?.btn_text || 'Shop Now'} <ArrowRight size={18} className="ml-2" />
                </Link>
                <Link to="/brands" className="bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-medium py-3.5 px-8 rounded-lg flex items-center justify-center text-[15px] transition-all shadow-lg hover:shadow-xl">
                  Explore Brands
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}`;

if (oldCardsRegex.test(content)) {
  content = content.replace(oldCardsRegex, newBannerHtml);
  fs.writeFileSync(filePath, content);
  console.log('Successfully replaced promotional banner section');
} else {
  console.log('Could not find promotional banner section to replace');
}

