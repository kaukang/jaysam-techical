const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

// Add state variables
if (!content.includes('brandFilter')) {
  content = content.replace(
    "const [categoryFilter, setCategoryFilter] = useState('all');",
    "const [categoryFilter, setCategoryFilter] = useState('all');\n  const [brandFilter, setBrandFilter] = useState('all');\n  const [statusFilter, setStatusFilter] = useState('all');\n  const [stockFilter, setStockFilter] = useState('all');"
  );
}

// Add filtering logic
content = content.replace(
  /const matchesCategory = categoryFilter === 'all' \|\| p\.category_id === categoryFilter;\s*return matchesSearch && matchesCategory;/g,
  `const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    const matchesBrand = brandFilter === 'all' || p.brand === brandFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    let matchesStock = true;
    if (stockFilter === 'out') matchesStock = p.stock_quantity === 0;
    else if (stockFilter === 'low') matchesStock = p.stock_quantity > 0 && p.stock_quantity <= 5;
    else if (stockFilter === 'in') matchesStock = p.stock_quantity > 5;
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesStock;`
);

// Update UI filter row
const oldFilterUI = `<div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087FF5] appearance-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c, cIdx) => (
              <option key={c.id || c.name || \`cat-opt-\${cIdx}\`} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>`;
        
const newFilterUI = `<div className="w-full sm:w-auto flex flex-wrap gap-2">
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

content = content.replace(oldFilterUI, newFilterUI);
// Note: If the replace doesn't perfectly match due to formatting, I'll need a regex approach. 
// Let's check if oldFilterUI was replaced.
fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
console.log('Patched filters');
