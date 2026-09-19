const fs = require('fs');
const filePath = 'src/pages/Home.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetRegex = /\{\/\* Promotional Banners \*\/\}\s*<section className="py-16 bg-\[\#F8FAFC\]">[\s\S]*?\{\/\* Why Choose Us \*\/\}/;

const newBannerHtml = `{/* Promotional Banners */}
      <section className="py-12 md:py-16 bg-[#F8FAFC]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-[5vw]">
          {promoBannerData?.btn_link ? (
            <Link to={promoBannerData.btn_link} className="block relative rounded-2xl overflow-hidden shadow-md border border-[#E5EAF2] hover:shadow-lg transition-all group">
              <div className="w-full aspect-[21/9] sm:aspect-[3/1] max-h-[500px] relative bg-slate-100">
                <img 
                  src={promoBannerData?.image_url || 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000&auto=format&fit=crop'} 
                  alt={promoBannerData?.title || 'Promotional Banner'} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
            </Link>
          ) : (
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#E5EAF2]">
              <div className="w-full aspect-[21/9] sm:aspect-[3/1] max-h-[500px] relative bg-slate-100">
                <img 
                  src={promoBannerData?.image_url || 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000&auto=format&fit=crop'} 
                  alt={promoBannerData?.title || 'Promotional Banner'} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, newBannerHtml);
  fs.writeFileSync(filePath, content);
  console.log('Successfully replaced promotional banner with image-only layout');
} else {
  console.log('Could not find promotional banner section to replace');
}
