const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminBulkBrandsModal.tsx', 'utf8');

content = content.replace(
  "const values = lines[i].split(',').map(v => v.trim());",
  "const values = lines[i].split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/).map(v => v.trim().replace(/^\"|\"$/g, ''));"
);

fs.writeFileSync('src/components/admin/AdminBulkBrandsModal.tsx', content);
console.log('Patched AdminBulkBrandsModal.tsx');
