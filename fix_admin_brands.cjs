const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminBrands.tsx', 'utf8');

content = content.replace(
  "if (error) throw error;",
  "if (error && error.code !== 'PGRST205') throw error;"
);

content = content.replace(
  "const { data: bData, error: bError } = await supabase\n          .from('brands')\n          .select('id')\n          .eq('name', b.name)\n          .single();\n\n        if (bError && bError.code !== 'PGRST116') {",
  "const { data: bData, error: bError } = await supabase\n          .from('brands')\n          .select('id')\n          .eq('name', b.name)\n          .single();\n\n        if (bError && bError.code !== 'PGRST116' && bError.code !== 'PGRST205') {"
);

fs.writeFileSync('src/pages/admin/AdminBrands.tsx', content);
console.log('Fixed AdminBrands.tsx');
