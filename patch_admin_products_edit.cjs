const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

// Add import
if (!content.includes('AdminBulkEditModal')) {
  content = content.replace(
    "import AdminBulkProductsModal from '../../components/admin/AdminBulkProductsModal';",
    "import AdminBulkProductsModal from '../../components/admin/AdminBulkProductsModal';\nimport AdminBulkEditModal from '../../components/admin/AdminBulkEditModal';"
  );
}

// Add state
if (!content.includes('isBulkEditModalOpen')) {
  content = content.replace(
    "const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);",
    "const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);\n  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);\n  const [brands, setBrands] = useState<any[]>([]);"
  );
}

// Ensure we fetch brands to pass them to BulkEditModal
// the fetchData function is defined around line 50. Let's patch it to also fetch brands if it doesn't already
if (!content.includes("supabase.from('brands')")) {
  // Let's replace the fetchData promise.all block
  content = content.replace(
    "const [productsRes, categoriesRes] = await Promise.all([",
    "const [productsRes, categoriesRes, brandsRes] = await Promise.all([\n        supabase.from('brands').select('id, name').order('name'),"
  );
  // Actually wait, that breaks the promise all array order. Let's just do it simpler:
  content = content.replace(
    /const \[productsRes, categoriesRes\] = await Promise\.all\(\[\s*supabase\.from\('products'\)\.select\('\*, categories\(name\)'\)\.order\('created_at', \{ ascending: false \}\),\s*supabase\.from\('categories'\)\.select\('id, name'\)\.order\('name'\)\s*\]\);/g,
    `const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('brands').select('id, name').order('name')
      ]);
      if (brandsRes && !brandsRes.error) setBrands(brandsRes.data || []);`
  );
}

// Replace old bulk action UI
const oldBulkBar = `        <button onClick={() => handleBulkAction('active')} disabled={bulkActionLoading} className="text-xs font-medium px-3 py-1.5 bg-white border border-[#E5EAF2] rounded text-[#082B52] hover:bg-slate-50 transition-colors disabled:opacity-50">Set Active</button>
        <button onClick={() => handleBulkAction('inactive')} disabled={bulkActionLoading} className="text-xs font-medium px-3 py-1.5 bg-white border border-[#E5EAF2] rounded text-[#082B52] hover:bg-slate-50 transition-colors disabled:opacity-50">Set Inactive</button>
        <button onClick={() => handleBulkAction('delete')} disabled={bulkActionLoading} className="text-xs font-medium px-3 py-1.5 bg-red-50 border border-red-200 rounded text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">Delete Selected</button>`;

const newBulkBar = `        <button onClick={() => setIsBulkEditModalOpen(true)} className="text-xs font-medium px-4 py-1.5 bg-white border border-[#E5EAF2] rounded text-[#082B52] hover:bg-slate-50 transition-colors">Bulk Actions ▼</button>
        <button onClick={() => handleBulkAction('delete')} disabled={bulkActionLoading} className="text-xs font-medium px-3 py-1.5 bg-red-50 border border-red-200 rounded text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">Delete Selected</button>`;

content = content.replace(oldBulkBar, newBulkBar);

// Append AdminBulkEditModal at the bottom
if (!content.includes('<AdminBulkEditModal')) {
  content = content.replace(
    "categories={categories} \n      />",
    "categories={categories} \n      />\n      <AdminBulkEditModal \n        isOpen={isBulkEditModalOpen} \n        onClose={() => setIsBulkEditModalOpen(false)} \n        onSuccess={() => { setIsBulkEditModalOpen(false); setSelectedProducts([]); fetchData(); }} \n        selectedProductIds={selectedProducts}\n        categories={categories}\n        brands={brands}\n      />"
  );
}

fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
console.log('AdminProducts.tsx edit modal patched.');
