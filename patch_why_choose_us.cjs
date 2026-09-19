const fs = require('fs');
const filePath = 'src/pages/Home.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetRegex = /\{\/\* Why Choose Us \*\/\}\s*<section className="py-16 lg:py-24 bg-\[\#F8FAFC\]">[\s\S]*?\{\/\* Testimonials \*\/\}/;

const newSectionHtml = `{/* Why Choose Us */}
      <section className="pb-12 md:pb-16 bg-[#F8FAFC]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-[5vw]">
          <div className="bg-[#082B52] rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {[
                { title: "Fast & Reliable Delivery", desc: "Get your orders delivered to your doorstep swiftly.", icon: Truck },
                { title: "100% Genuine Products", desc: "We only source authentic products from verified distributors.", icon: ShieldCheck },
                { title: "Easy Returns", desc: "Hassle-free return policy for your peace of mind.", icon: RefreshCcw },
                { title: "24/7 Customer Support", desc: "Our team is here to assist you with any tech issues.", icon: HeadphonesIcon }
              ].map((feature, idx) => (
                <div key={idx} className="p-8 lg:p-10 text-center flex flex-col items-center group transition-colors hover:bg-white/5">
                  <div className="w-14 h-14 rounded-full bg-white/10 text-[#38bdf8] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#38bdf8] group-hover:text-[#082B52] transition-all duration-300">
                    <feature.icon size={26} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[16px] lg:text-[17px] font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-300 text-[13px] lg:text-[14px] leading-relaxed max-w-[250px] mx-auto">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, newSectionHtml);
  fs.writeFileSync(filePath, content);
  console.log('Successfully replaced Why Choose Us section');
} else {
  console.log('Could not find Why Choose Us section to replace');
}
