const fs = require('fs');

let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');
homeContent = homeContent.replace(
  /{brandsData\.map\(brand => {/g,
  "{brandsData.map((brand, bIdx) => {"
);
homeContent = homeContent.replace(
  /<section key={brand\.id}/g,
  "<section key={brand.id || brand.name || `brand-${bIdx}`}"
);

homeContent = homeContent.replace(
  /categories\.map\(\(c, index\) => {/g,
  "categories.map((c, index) => {" // keep
);
homeContent = homeContent.replace(
  /<Link key={c\.id}/g,
  "<Link key={c.id || c.name || `cat-${c.name}`}"
);

fs.writeFileSync('src/pages/Home.tsx', homeContent);
console.log('Patched Home.tsx keys');

let adminBrandsContent = fs.readFileSync('src/pages/admin/AdminBrands.tsx', 'utf8');
adminBrandsContent = adminBrandsContent.replace(
  /{brands\.map\(\(brand\) => \(/g,
  "{brands.map((brand, bIdx) => ("
);
adminBrandsContent = adminBrandsContent.replace(
  /<tr key={brand\.id}/g,
  "<tr key={brand.id || brand.slug || `brand-${bIdx}`}"
);
fs.writeFileSync('src/pages/admin/AdminBrands.tsx', adminBrandsContent);
console.log('Patched AdminBrands.tsx keys');
