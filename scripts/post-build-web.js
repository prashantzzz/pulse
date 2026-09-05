const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const vercelJson = path.join(rootDir, 'vercel.json');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Ensure Google Site Verification meta tag is present in index.html, then copy to 404.html
const indexHtml = path.join(distDir, 'index.html');
const notFoundHtml = path.join(distDir, '404.html');
const googleMetaTag = '<meta name="google-site-verification" content="vVBrobRRHCqwVUdK0Df9oFh0m0JRvcul6E8HRZrxwrE" />';

if (fs.existsSync(indexHtml)) {
  let content = fs.readFileSync(indexHtml, 'utf8');
  if (!content.includes('google-site-verification')) {
    content = content.replace('</head>', `    ${googleMetaTag}\n  </head>`);
    fs.writeFileSync(indexHtml, content, 'utf8');
    console.log('✓ Injected google-site-verification meta tag into dist/index.html');
  }
  fs.copyFileSync(indexHtml, notFoundHtml);
  console.log('✓ Copied dist/index.html -> dist/404.html');
}

// 2. Generate dist/vercel.json with SPA rewrites
const distVercelConfig = {
  cleanUrls: true,
  trailingSlash: false,
  rewrites: [
    { source: '/privacy', destination: '/privacy.html' },
    { source: '/privacy/', destination: '/privacy.html' },
    { source: '/terms', destination: '/terms.html' },
    { source: '/terms/', destination: '/terms.html' },
    { source: '/delete-account', destination: '/delete-account.html' },
    { source: '/delete-account/', destination: '/delete-account.html' },
    { source: '/((?!assets|_expo|favicon.ico|metadata.json|privacy|terms|delete-account).*)', destination: '/index.html' },
  ],
};
fs.writeFileSync(path.join(distDir, 'vercel.json'), JSON.stringify(distVercelConfig, null, 2), 'utf8');
console.log('✓ Generated dist/vercel.json');

// 3. Recursively copy all files and folders from public/ to dist/
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${path.relative(rootDir, srcPath)} -> ${path.relative(rootDir, destPath)}`);
    }
  }
}

copyRecursive(publicDir, distDir);
console.log('✓ Web post-build completed successfully.');
