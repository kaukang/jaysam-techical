const fs = require('fs');
const filePath = 'src/pages/Home.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Rename bestSellers to popularProducts
content = content.replace(/const \[bestSellers, setBestSellers\]/g, 'const [popularProducts, setPopularProducts]');
content = content.replace(/setBestSellers/g, 'setPopularProducts');
content = content.replace(/bestSellers\.map/g, 'popularProducts.map');

// 2. Add best sellers states
content = content.replace(
  "const [popularProducts, setPopularProducts] = useState<Product[]>([]);",
  "const [popularProducts, setPopularProducts] = useState<Product[]>([]);\n  const [bestSellersConfig, setBestSellersConfig] = useState<any>({ is_active: true, title: 'Our Best-Selling Products' });\n  const [bestSellersData, setBestSellersData] = useState<Product[]>([]);"
);

// 3. Add fetch logic in fetchData
const oldBrandsFetch = `      setBrandsData(finalBrands);`;
const newBestSellersFetch = `      setBrandsData(finalBrands);

      // Fetch Best Sellers Config in separate try-catch so it doesn't break if table is missing
      try {
        const { data: bsConfig, error: bsError } = await supabase
          .from('best_sellers_config')
          .select('*')
          .limit(1)
          .single();
          
        if (bsConfig) {
          setBestSellersConfig(bsConfig);
          if (bsConfig.is_active && mappedProducts) {
            if (bsConfig.mode === 'auto') {
               const { data: autoBs } = await supabase.rpc('get_auto_best_sellers', { limit_val: bsConfig.limit_count });
               if (autoBs && autoBs.length > 0) {
                 const autoIds = autoBs.map((item: any) => item.product_id);
                 const sortedAutoBs = autoIds.map(id => mappedProducts.find(p => p.id === id)).filter(Boolean);
                 // Fallback if not enough data
                 if (sortedAutoBs.length < bsConfig.limit_count) {
                   const more = mappedProducts.filter(p => !autoIds.includes(p.id)).slice(0, bsConfig.limit_count - sortedAutoBs.length);
                   setBestSellersData([...sortedAutoBs, ...more]);
                 } else {
                   setBestSellersData(sortedAutoBs);
                 }
               } else {
                 setBestSellersData(mappedProducts.slice(0, bsConfig.limit_count));
               }
            } else {
               const { data: manualBs } = await supabase
                 .from('best_seller_products')
                 .select('product_id')
                 .order('display_order', { ascending: true })
                 .limit(bsConfig.limit_count);
                 
               if (manualBs && manualBs.length > 0) {
                 const manualIds = manualBs.map((item: any) => item.product_id);
                 const sortedManualBs = manualIds.map(id => mappedProducts.find(p => p.id === id)).filter(Boolean);
                 setBestSellersData(sortedManualBs);
               } else {
                 setBestSellersData(mappedProducts.slice(0, bsConfig.limit_count));
               }
            }
          }
        } else {
          // If no config found but no error (empty table), fallback to defaults
          setBestSellersData(mappedProducts.slice(0, 4));
        }
      } catch (err) {
         console.warn('Best sellers fetch failed, using fallback.', err);
         if (mappedProducts) {
           setBestSellersData(mappedProducts.slice(0, 4));
         }
      }
`;
content = content.replace(oldBrandsFetch, newBestSellersFetch);

// 4. Replace Testimonials with Best Sellers
const testRegex = /\{\/\* Testimonials \*\/\}\s*<section className="py-16 lg:py-24 bg-white border-y border-\[\#E5EAF2\]">[\s\S]*?\{\/\* About Section \*\/\}/;

const newSectionHtml = `{/* Best Sellers Section */}
      {bestSellersConfig?.is_active && bestSellersData.length > 0 && (
        <section className="py-16 lg:py-24 bg-white border-y border-[#E5EAF2]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-[5vw]">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-[#082B52]">{bestSellersConfig?.title || 'Our Best-Selling Products'}</h2>
              </div>
              <Link to="/shop?sort=popular" className="hidden sm:inline-flex items-center gap-1 text-[15px] font-medium text-[#087FF5] hover:text-[#1D4ED8] transition-colors group">
                View all <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {bestSellersData.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}`;

if (testRegex.test(content)) {
  content = content.replace(testRegex, newSectionHtml);
  fs.writeFileSync(filePath, content);
  console.log('Successfully replaced Testimonials with Best Sellers');
} else {
  console.log('Could not find Testimonials section to replace');
}
