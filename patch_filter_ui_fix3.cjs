const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

content = content.replace(/In Stock \(over 5\)\/option>/g, 'In Stock (over 5)</option>');
fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
