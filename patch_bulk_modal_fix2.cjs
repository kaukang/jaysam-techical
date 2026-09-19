const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminBulkProductsModal.tsx', 'utf8');

content = content.replace(
  /<div className="flex items-center gap-2 mr-4 text-sm text-slate-700">[\s\S]*?<button\s*\{importing \? 'Importing\.\.\.' : `Import \$\{csvData\.length - csvErrors\.length\} Products`\}/g,
  `<div className="flex items-center gap-2 mr-4 text-sm text-slate-700">
     <input type="checkbox" id="update-existing" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
     <label htmlFor="update-existing" className="cursor-pointer">Update existing SKUs</label>
   </div>
   <button onClick={handleImportCSV} disabled={importing || csvData.length === 0} className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
     {importing ? 'Importing...' : \`Import \${csvData.length - csvErrors.filter(e => !(updateExisting && e.message.includes('SKU already exists'))).length} Products\`}`
);

fs.writeFileSync('src/components/admin/AdminBulkProductsModal.tsx', content);
