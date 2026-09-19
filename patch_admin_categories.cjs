const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminCategories.tsx', 'utf8');
content = content.replace(
  /{categories\.map\(\(category\) => \(/g,
  "{categories.map((category, cIdx) => ("
);
content = content.replace(
  /<tr key={category\.id}/g,
  "<tr key={category.id || category.name || `cat-${cIdx}`}"
);
fs.writeFileSync('src/pages/admin/AdminCategories.tsx', content);
console.log('Patched AdminCategories.tsx');
