const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

const regex = /<div className="relative sm:w-64">[\s\S]*?<\/select>\s*<\/div>/;
const newUI = `<div className="w-full sm:w-auto flex flex-wrap gap-2">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]">
            <option value="all">All Categories</option>
            {categories.map((c, cIdx) => (<option key={c.id || c.name || \`cat-opt-\${cIdx}\`} value={c.id}>{c.name}</option>))}
          </select>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]">
            <option value="all">All Brands</option>
            {brands.map((b, bIdx) => (<option key={b.id || \`brand-opt-\${bIdx}\`} value={b.name}>{b.name}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5]">
            <option value="all">All Stock</option>
            <option value="in">In Stock (>5)</option>
            <option value="low">Low Stock (1-5)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>`;

content = content.replace(regex, newUI);
fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
console.log('Patched UI');
