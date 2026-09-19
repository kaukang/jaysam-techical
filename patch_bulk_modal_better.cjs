const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminBulkProductsModal.tsx', 'utf8');

// 1. Add updateExisting state
if (!content.includes('const [updateExisting')) {
  content = content.replace(
    "const [importing, setImporting] = useState(false);",
    "const [importing, setImporting] = useState(false);\n  const [updateExisting, setUpdateExisting] = useState(false);"
  );
}

// 2. Change upsert in handleImportCSV
content = content.replace(
  "const { error } = await supabase.from('products').insert(rowsToInsert);",
  "const { error } = await supabase.from('products').upsert(rowsToInsert, { onConflict: 'sku' });"
);

// 3. Make validRows dynamic based on updateExisting
// Find: const validRows = csvData.filter((_, index) => !csvErrors.find(e => e.row === index + 1));
content = content.replace(
  "const validRows = csvData.filter((_, index) => !csvErrors.find(e => e.row === index + 1));",
  `const activeErrors = csvErrors.filter(e => !(updateExisting && e.message.includes('SKU already exists')));
    const validRows = csvData.filter((_, index) => !activeErrors.find(e => e.row === index + 1));`
);

// 4. Update the failedCount and errors assignment in handleImportCSV
content = content.replace(
  "let failedCount = csvErrors.length;",
  "let failedCount = activeErrors.length;"
);
content = content.replace(
  "const errors = csvErrors.map(e => `Row ${e.row}: ${e.message}`);",
  "const errors = activeErrors.map(e => `Row ${e.row}: ${e.message}`);"
);

// 5. Update render logic for activeErrors
content = content.replace(
  "const rowError = csvErrors.find(e => e.row === index + 1);",
  "const rowError = csvErrors.find(e => e.row === index + 1 && !(updateExisting && e.message.includes('SKU already exists')));"
);

content = content.replace(
  "Valid: {csvData.length - csvErrors.length}",
  "Valid: {csvData.length - csvErrors.filter(e => !(updateExisting && e.message.includes('SKU already exists'))).length}"
);
content = content.replace(
  "Errors: {csvErrors.length}",
  "Errors: {csvErrors.filter(e => !(updateExisting && e.message.includes('SKU already exists'))).length}"
);

// 6. Add checkbox to UI
const importButtonBlock = `<button
                          onClick={handleImportCSV}
                          disabled={importing || csvData.length === 0}
                          className="bg-[#087FF5] hover:bg-[#0666C5] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >`;

const checkboxBlock = `<div className="flex items-center gap-2 mr-4 text-sm text-slate-700">
                          <input type="checkbox" id="update-existing" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5]" />
                          <label htmlFor="update-existing" className="cursor-pointer">Update existing SKUs</label>
                        </div>
                        <button`;

content = content.replace(importButtonBlock, checkboxBlock);

fs.writeFileSync('src/components/admin/AdminBulkProductsModal.tsx', content);
console.log('AdminBulkProductsModal.tsx improved.');
