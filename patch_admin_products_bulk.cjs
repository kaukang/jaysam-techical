const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

// 1. Add import for the bulk modal
if (!content.includes('AdminBulkProductsModal')) {
  content = content.replace(
    "import { Plus, Edit2, Trash2, Image as ImageIcon, X, Upload, Search, Filter } from 'lucide-react';",
    "import { Plus, Edit2, Trash2, Image as ImageIcon, X, Upload, Search, Filter, CheckSquare } from 'lucide-react';\nimport AdminBulkProductsModal from '../../components/admin/AdminBulkProductsModal';"
  );
}

// 2. Add state variables for bulk modal and selection
if (!content.includes('isBulkModalOpen')) {
  content = content.replace(
    "const [isModalOpen, setIsModalOpen] = useState(false);",
    "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);\n  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);\n  const [bulkActionLoading, setBulkActionLoading] = useState(false);"
  );
}

// 3. Add handleBulkAction function after handleDelete
const handleBulkAction = `
  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) return;
    
    let confirmMsg = '';
    if (action === 'delete') confirmMsg = \`Are you sure you want to delete \${selectedProducts.length} products?\`;
    else confirmMsg = \`Are you sure you want to change status to \${action} for \${selectedProducts.length} products?\`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
      setBulkActionLoading(true);
      if (action === 'delete') {
        // Must delete images first to avoid orphans, but for simplicity let's just delete products
        // (Supabase cascade rules might handle it)
        const { error } = await supabase.from('products').delete().in('id', selectedProducts);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').update({ status: action }).in('id', selectedProducts);
        if (error) throw error;
      }
      setSelectedProducts([]);
      fetchData();
    } catch (error) {
      console.error('Error in bulk action:', error);
      alert('An error occurred during bulk action.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(pId => pId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };
`;
if (!content.includes('handleBulkAction')) {
  content = content.replace("const handleDelete = async (id: string) => {", handleBulkAction + "\n  const handleDelete = async (id: string) => {");
}

// 4. Update the add button
content = content.replace(
  /<button\s+onClick=\{\(\) => handleOpenModal\(\)\}\s+className="bg-\[\#087FF5\] hover:bg-\[\#0666C5\] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"\s*>\s*<Plus size=\{18\} \/>\s*Add Product\s*<\/button>/g,
  `
  <div className="flex gap-2">
    <button 
      onClick={() => setIsBulkModalOpen(true)}
      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
    >
      <Upload size={18} />
      <span className="hidden sm:inline">Bulk Add</span>
    </button>
    <button 
      onClick={() => handleOpenModal()}
      className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
    >
      <Plus size={18} />
      <span className="hidden sm:inline">Add Product</span>
    </button>
  </div>
  `
);

// 5. Add bulk actions bar and table selection checkboxes
const tableHeaderRegex = /<table className="w-full text-left border-collapse">([\s\S]*?)<\/table>/g;
let tableMatch = tableHeaderRegex.exec(content);
if (tableMatch) {
  let tableContent = tableMatch[1];
  
  // Add select all checkbox to header
  tableContent = tableContent.replace(
    /<th className="py-3 px-4 text-[#64748B] font-medium text-sm">Product<\/th>/,
    `<th className="py-3 px-4 w-12 text-center">
       <input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
     </th>
     <th className="py-3 px-4 text-[#64748B] font-medium text-sm">Product</th>`
  );

  // Add individual checkbox to rows
  tableContent = tableContent.replace(
    /<td className="py-4 px-4 border-b border-slate-100">/,
    `<td className="py-4 px-4 border-b border-slate-100 text-center">
       <input type="checkbox" checked={selectedProducts.includes(product.id || \`prod-\${pIdx}\`)} onChange={() => toggleSelect(product.id || \`prod-\${pIdx}\`)} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
     </td>
     <td className="py-4 px-4 border-b border-slate-100">`
  );
  
  // Replace the original table
  content = content.replace(tableMatch[1], tableContent);
}

// 6. Add bulk action bar above the table
const bulkBar = `
  {selectedProducts.length > 0 && (
    <div className="bg-[#F4F9FF] border border-[#087FF5]/20 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-[#082B52]">
        <CheckSquare size={18} className="text-[#087FF5]" />
        <span className="font-medium">{selectedProducts.length} selected</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => handleBulkAction('active')} disabled={bulkActionLoading} className="text-xs font-medium px-3 py-1.5 bg-white border border-[#E5EAF2] rounded text-[#082B52] hover:bg-slate-50 transition-colors disabled:opacity-50">Set Active</button>
        <button onClick={() => handleBulkAction('inactive')} disabled={bulkActionLoading} className="text-xs font-medium px-3 py-1.5 bg-white border border-[#E5EAF2] rounded text-[#082B52] hover:bg-slate-50 transition-colors disabled:opacity-50">Set Inactive</button>
        <button onClick={() => handleBulkAction('delete')} disabled={bulkActionLoading} className="text-xs font-medium px-3 py-1.5 bg-red-50 border border-red-200 rounded text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">Delete Selected</button>
      </div>
    </div>
  )}
`;

if (!content.includes('selectedProducts.length > 0')) {
  content = content.replace(
    '<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">',
    bulkBar + '\n<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">'
  );
}

// 7. Render AdminBulkProductsModal at the end
if (!content.includes('<AdminBulkProductsModal')) {
  content = content.replace(
    "    </div>\n  );\n}\n",
    "      <AdminBulkProductsModal \n        isOpen={isBulkModalOpen} \n        onClose={() => setIsBulkModalOpen(false)} \n        onSuccess={() => { setIsBulkModalOpen(false); fetchData(); }} \n        categories={categories} \n      />\n    </div>\n  );\n}\n"
  );
}

fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
console.log('AdminProducts.tsx patched.');
