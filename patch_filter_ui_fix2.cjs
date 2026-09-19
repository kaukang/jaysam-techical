const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

content = content.replace(/In Stock \(&gt;5\)/g, 'In Stock (over 5)');
content = content.replace(/In Stock \(>5\)/g, 'In Stock (over 5)');
fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
