const fs = require('fs');

let content = fs.readFileSync('src/components/admin/AdminBulkProductsModal.tsx', 'utf8');

if (!content.includes('updateExisting')) {
  content = content.replace(
    "const [csvPreview, setCsvPreview] = useState(false);",
    "const [csvPreview, setCsvPreview] = useState(false);\n  const [updateExisting, setUpdateExisting] = useState(false);"
  );
  
  content = content.replace(
    /else if \(existingSkus\.includes\(dbProduct\.sku\)\) errors\.push\(\{ row: i, message: "SKU already exists in database." \}\);/g,
    `else if (existingSkus.includes(dbProduct.sku)) {
        if (!updateExisting) {
          errors.push({ row: i, message: "SKU already exists in database. (Check 'Update Existing' to overwrite)" });
        }
      }`
  );

  content = content.replace(
    "const { error } = await supabase.from('products').insert(rowsToInsert);",
    "const { error } = await supabase.from('products').upsert(rowsToInsert, { onConflict: 'sku' });"
  );
  
  // Re-run parseCSV when updateExisting changes! Wait, parseCSV is driven by the file upload. 
  // We can just add a checkbox to the preview screen. But if we do, the errors are already calculated.
  // Instead of recalculating, we can just filter errors on import if updateExisting is checked.
  // Let's modify the error logic dynamically in the render or handleImportCSV.
}

fs.writeFileSync('src/components/admin/AdminBulkProductsModal.tsx', content);
console.log('Modal patched for upsert');
