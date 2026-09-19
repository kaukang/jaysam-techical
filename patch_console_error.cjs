const fs = require('fs');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace console.error(..., error) with a check for PGRST205
  content = content.replace(/console\.error\((['"`][^'"`]+['"`]), (error|err|fetchErr|updateErr|profileError)\);/g, (match, msg, errVar) => {
    return `if (${errVar} && ${errVar}.code === 'PGRST205') {
        console.warn(${msg} + ' (Brands table missing, ignored)');
      } else {
        console.error(${msg}, ${errVar});
      }`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Patched', filePath);
  }
}

const files = [
  'src/pages/admin/AdminBrands.tsx',
  'src/pages/admin/AdminProducts.tsx',
  'src/pages/Home.tsx',
  'src/components/admin/AdminBulkProductsModal.tsx',
  'src/pages/Shop.tsx'
];

files.forEach(patchFile);
