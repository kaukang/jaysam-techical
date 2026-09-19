const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminBulkBrandsModal.tsx', 'utf8');

content = content.replace(
  "brand[header] = values[index]?.toLowerCase() === 'true';",
  "brand[header] = ['true', '1', 'active', 'yes'].includes(values[index]?.toLowerCase());"
);

fs.writeFileSync('src/components/admin/AdminBulkBrandsModal.tsx', content);
console.log('Patched AdminBulkBrandsModal.tsx active check');
