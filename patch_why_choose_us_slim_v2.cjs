const fs = require('fs');
const filePath = 'src/pages/Home.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetRegex = /\{\/\* Why Choose Us \*\/\}\s*<section className="pb-8 lg:pb-12 bg-\[\#F8FAFC\] -mt-6 relative z-10">[\s\S]*?\{\/\* Best Sellers Section \*\/\}/;

const newSectionHtml = `{/* Why Choose Us */}
      <section className="pb-8 lg:pb-12 bg-[#F8FAFC] -mt-4 relative z-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-[5vw]">
          <div className="bg-[#082B52] rounded-xl shadow-md border border-[#0A3668] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {[
                { title: "Fast & Reliable", desc: "Swift doorstep delivery.", icon: Truck },
                { title: "100% Genuine", desc: "Verified authentic products.", icon: ShieldCheck },
                { title: "Easy Returns", desc: "Hassle-free return policy.", icon: RefreshCcw },
                { title: "24/7 Support", desc: "Always here to help you.", icon: HeadphonesIcon }
              ].map((feature, idx) => (
                <div key={idx} className="p-4 lg:p-5 flex items-center justify-center md:justify-start lg:justify-center gap-3 lg:gap-4 group transition-colors hover:bg-white/5">
                  <div className="flex-shrink-0 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/10 text-[#38bdf8] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#38bdf8] group-hover:text-[#082B52] transition-all duration-300">
                    <feature.icon size={18} className="lg:w-5 lg:h-5" strokeWidth={1.5} />
                  </div>
                  <div className="text-left flex-grow max-w-[180px]">
                    <h3 className="text-[13px] lg:text-[14px] font-bold text-white mb-0.5 leading-tight truncate">{feature.title}</h3>
                    <p className="text-slate-300 text-[11px] lg:text-[12px] leading-snug truncate">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, newSectionHtml);
  fs.writeFileSync(filePath, content);
  console.log('Successfully replaced Why Choose Us section with v2 slim layout');
} else {
  console.log('Could not find Why Choose Us section to replace v2');
}
