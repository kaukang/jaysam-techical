const fs = require('fs');

let shopContent = fs.readFileSync('src/pages/Shop.tsx', 'utf8');
shopContent = shopContent.replace(
  /key={c\.id}/g,
  "key={c.id || c.name}"
);
fs.writeFileSync('src/pages/Shop.tsx', shopContent);
console.log('Patched Shop.tsx keys');
