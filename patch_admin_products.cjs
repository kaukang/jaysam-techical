const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

content = content.replace(
  /{categories\.map\(c => \(/g,
  "{categories.map((c, cIdx) => ("
);
content = content.replace(
  /<option key={c\.id}/g,
  "<option key={c.id || c.name || `cat-opt-${cIdx}`}"
);

content = content.replace(
  /{filteredProducts\.map\(\(product\) => \(/g,
  "{filteredProducts.map((product, pIdx) => ("
);
content = content.replace(
  /<tr key={product\.id}/g,
  "<tr key={product.id || `prod-${pIdx}`}"
);

fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
console.log('Patched AdminProducts.tsx');
