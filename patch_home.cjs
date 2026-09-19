const fs = require('fs');

const filePath = 'src/pages/Home.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldHeroRegex = /\{\/\* Premium Hero Section \*\/\}\s*<section className="bg-gradient-to-br from-white to-\[\#F4F9FF\] relative overflow-hidden border-b border-\[\#E5EAF2\]">[\s\S]*?\{\/\* Trust Indicators \*\/\}/;

const newHero = `{/* Premium Hero Section */}
      <section className="relative min-h-[600px] md:min-h-[700px] lg:min-h-[800px] flex items-center border-b border-[#E5EAF2] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: \`url(\${heroData?.image_url || 'https://images.unsplash.com/photo-1550009158-9ebf6d1736de?q=80&w=2000&auto=format&fit=crop'})\` 
          }}
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 z-10 bg-black/40 md:hidden"></div> {/* Extra dimming for mobile readability */}

        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="py-12 md:py-16 lg:py-20 flex flex-col items-start w-full max-w-[700px]">
            <span className="text-[12px] sm:text-[13px] font-bold text-white/90 tracking-[0.2em] uppercase mb-4 block border border-white/20 rounded-full px-4 py-1.5 backdrop-blur-sm bg-white/10">
              WELCOME TO JAYLIAM TECH
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-2 whitespace-pre-line drop-shadow-lg">
              {heroData?.headline?.replace('\\\\n', '\\n') || 'Elevate Your Digital\\nLifestyle.'}
            </h1>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-[#38bdf8] tracking-tight leading-[1.1] mb-6 drop-shadow-md">
              {heroData?.highlighted_text || 'Premium Tech'}
            </h2>
            <p className="text-[16px] lg:text-[18px] text-gray-200 w-full mb-8 leading-relaxed drop-shadow">
              {heroData?.description || 'Discover the latest premium smartphones, cutting-edge laptops, and high-fidelity audio equipment. Expertly curated for the modern professional.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to={heroData?.primary_btn_link || '/shop'} className="bg-[#38bdf8] hover:bg-[#0284c7] text-white font-medium py-3.5 px-8 rounded-lg flex items-center justify-center text-[15px] transition-all shadow-lg hover:shadow-xl">
                {heroData?.primary_btn_text || 'Shop New Arrivals'}
              </Link>
              <Link to={heroData?.secondary_btn_link || '/shop?sale=true'} className="bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-medium py-3.5 px-8 rounded-lg flex items-center justify-center text-[15px] transition-all shadow-lg hover:shadow-xl">
                {heroData?.secondary_btn_text || 'View Special Offers'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}`;

if (oldHeroRegex.test(content)) {
  const newContent = content.replace(oldHeroRegex, newHero);
  fs.writeFileSync(filePath, newContent);
  console.log('Successfully replaced hero section');
} else {
  console.log('Could not find hero section to replace');
}
