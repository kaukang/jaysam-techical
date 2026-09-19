const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

// Header patch
content = content.replace(
  '<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>',
  '<th className="px-6 py-4 w-12 text-center"><input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5] cursor-pointer" /></th><th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>'
);

// Row patch
content = content.replace(
  /<tr key=\{product\.id \|\| `prod-\$\{pIdx\}`\} className="hover:bg-slate-50 transition-colors">/g,
  '<tr key={product.id || `prod-${pIdx}`} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 text-center"><input type="checkbox" checked={selectedProducts.includes(product.id || `prod-${pIdx}`)} onChange={() => toggleSelect(product.id || `prod-${pIdx}`)} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5] cursor-pointer" /></td>'
);

fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
console.log("Patched table successfully");
