const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

content = content.replace(/>5\)</g, '&gt;5)');
fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
