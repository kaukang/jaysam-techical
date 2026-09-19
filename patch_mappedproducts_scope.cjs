const fs = require('fs');
const filePath = 'src/pages/Home.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "      if (productsData) {",
  "      let mappedProducts: Product[] = [];\n      if (productsData) {"
);

content = content.replace(
  "const mappedProducts = productsData.map((p: any) => {",
  "mappedProducts = productsData.map((p: any) => {"
);

fs.writeFileSync(filePath, content);
console.log('Successfully fixed mappedProducts scope');
