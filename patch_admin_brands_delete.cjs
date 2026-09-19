const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminBrands.tsx', 'utf8');

content = content.replace(
  "console.error('Error deleting brand:', error);\n      alert('Error deleting brand');",
  `console.error('Error deleting brand:', error);
      if (error && error.code === 'PGRST205') {
        alert('The Brands table does not exist in your Supabase database. Please run the SQL migration provided by the assistant.');
      } else {
        alert('Error deleting brand: ' + (error.message || 'Unknown error'));
      }`
);

fs.writeFileSync('src/pages/admin/AdminBrands.tsx', content);
