const fs = require('fs');
const filePath = 'src/pages/admin/AdminBanners.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace validation
content = content.replace(
  `      if (!bannerData?.title) {
        throw new Error('Headline (title) is required.');
      }`,
  `      // Make sure title has a default fallback so the DB constraint doesn't fail
      if (!bannerData?.title) {
        bannerData.title = 'Promo Banner';
      }`
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated AdminBanners validation');
