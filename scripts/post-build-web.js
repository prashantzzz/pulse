const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const vercelJson = path.join(rootDir, 'vercel.json');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Copy index.html to 404.html for SPA routing fallback
const indexHtml = path.join(distDir, 'index.html');
const notFoundHtml = path.join(distDir, '404.html');
if (fs.existsSync(indexHtml)) {
  fs.copyFileSync(indexHtml, notFoundHtml);
  console.log('✓ Copied dist/index.html -> dist/404.html');
}

// 2. Copy root vercel.json to dist/vercel.json
if (fs.existsSync(vercelJson)) {
  fs.copyFileSync(vercelJson, path.join(distDir, 'vercel.json'));
  console.log('✓ Copied vercel.json -> dist/vercel.json');
}

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
