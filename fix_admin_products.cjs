const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

// Fix Promise.all order
content = content.replace(
  /const \[productsRes, categoriesRes, brandsRes\] = await Promise\.all\(\[\s*supabase\.from\('brands'\)\.select\('id, name'\)\.order\('name'\),\s*supabase\.from\('products'\)\.select\('\*, categories\(name\)'\)\.order\('created_at', \{ ascending: false \}\),\s*supabase\.from\('categories'\)\.select\('id, name'\)\.order\('name'\)\s*\]\);/g,
  `const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('brands').select('id, name').order('name')
      ]);`
);

content = content.replace(
  /if \(brandsRes && !brandsRes\.error\) setBrands\(brandsRes\.data \|\| \[\]\);/g,
  ""
);

// Add the setBrands logic after the error throws
content = content.replace(
  "if (categoriesRes.error) throw categoriesRes.error;",
  "if (categoriesRes.error) throw categoriesRes.error;\n      if (brandsRes && !brandsRes.error) setBrands(brandsRes.data || []);"
);

fs.writeFileSync('src/pages/admin/AdminProducts.tsx', content);
console.log('Fixed AdminProducts.tsx');
