const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminBrands.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  "import { Plus, Edit2, Trash2, Image as ImageIcon, X, Upload } from 'lucide-react';",
  "import { Plus, Edit2, Trash2, Image as ImageIcon, X, Upload, ListPlus } from 'lucide-react';\nimport AdminBulkBrandsModal from '../../components/admin/AdminBulkBrandsModal';"
);

// 2. Add state
content = content.replace(
  "const [isModalOpen, setIsModalOpen] = useState(false);",
  "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);"
);

// 3. Update fetchBrands
content = content.replace(
  /const fetchBrands = async \(\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/,
  `const fetchBrands = async () => {
    try {
      const { data: brandsData, error } = await supabase
        .from('brands')
        .select('*')
        .order('display_order', { ascending: true });
            
      if (error) throw error;
      
      const { data: productsData } = await supabase.from('products').select('brand');
      const counts: Record<string, number> = {};
      if (productsData) {
        productsData.forEach(p => {
          const b = (p.brand || '').toLowerCase();
          counts[b] = (counts[b] || 0) + 1;
        });
      }
      
      const brandsWithCounts = (brandsData || []).map(b => ({
        ...b,
        product_count: counts[(b.name || '').toLowerCase()] || 0
      }));

      setBrands(brandsWithCounts);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };`
);

// 4. Update Header
content = content.replace(
  /<div className="flex items-center justify-between">\s*<h1 className="text-2xl font-bold text-\[\#082B52\]">Brands<\/h1>\s*<button\s*onClick=\{\(\) => handleOpenModal\(\)\}\s*className="bg-\[\#087FF5\] hover:bg-\[\#0666C5\] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"\s*>\s*<Plus size=\{18\} \/>\s*Add Brand\s*<\/button>\s*<\/div>/,
  `<div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#082B52]">Brands</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <ListPlus size={18} />
            Bulk Add Brands
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add Brand
          </button>
        </div>
      </div>`
);

// 5. Update Table Header
content = content.replace(
  /<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Image<\/th>\s*<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name<\/th>\s*<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Slug<\/th>\s*<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status<\/th>\s*<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions<\/th>/,
  `<th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>`
);

// 6. Update Table Body Row
content = content.replace(
  /<td className="px-6 py-4 whitespace-nowrap">\s*\{brand\.logo_url \? \([\s\S]*?\) : \([\s\S]*?\}\s*<\/td>\s*<td className="px-6 py-4 whitespace-nowrap">\s*<div className="font-medium text-slate-900">\{brand\.name\}<\/div>\s*<\/td>\s*<td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">\s*\{brand\.slug\}\s*<\/td>\s*<td className="px-6 py-4 whitespace-nowrap">\s*<span className=\{\`inline-flex items-center px-2\.5 py-0\.5 rounded-full text-xs font-medium \$\{\s*brand\.is_active === true \? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'\s*\}\`\}>\s*\{brand\.is_active \? 'Active' : 'Inactive'\}\s*<\/span>\s*<\/td>/,
  `<td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon size={16} />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{brand.name}</div>
                        <div className="text-sm text-slate-500">{brand.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                      brand.is_active === true ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }\`}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {brand.product_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {brand.display_order}
                  </td>`
);

// 7. Add AdminBulkBrandsModal at the end of the return statement
content = content.replace(
  /<\/div>\s*\);\s*\}\s*$/g,
  `      <AdminBulkBrandsModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          setIsBulkModalOpen(false);
          fetchBrands();
        }}
        existingBrands={brands}
      />
    </div>
  );
}
`
);

fs.writeFileSync('src/pages/admin/AdminBrands.tsx', content);
console.log('Patched AdminBrands.tsx');
