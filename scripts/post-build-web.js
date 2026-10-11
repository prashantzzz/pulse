const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const vercelJson = path.join(rootDir, 'vercel.json');

// Optional base path for subpath hosting (e.g. GitHub Pages project sites
// served at /<repo>/). Empty = serve from domain root.
const BASE_PATH = (process.env.PROMO_BASE_PATH || '').replace(/\/+$/, '');

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
  if (BASE_PATH) {
    // Subpath routing shim: expo-router reads window.location directly with
    // no basename support, so strip the hosting prefix before the bundle
    // boots, and keep every in-app navigation inside the prefix by wrapping
    // history.pushState/replaceState. Back/forward works because our
    // popstate listener (registered first) re-strips before the router reads.
    const shim = `<script>(function(){var base=${JSON.stringify(BASE_PATH)};function strip(){var p=location.pathname;var s=p===base?'/':(p.indexOf(base+'/')===0?p.slice(base.length):null);if(s!==null){history.replaceState(history.state,'',s+location.search+location.hash);}}strip();function add(u){if(typeof u!=='string')return u;if(u.charAt(0)==='/'&&u!==base&&u.indexOf(base+'/')!==0)return base+u;return u;}var _p=history.pushState,_r=history.replaceState;history.pushState=function(s,t,u){return _p.call(this,s,t,add(u));};history.replaceState=function(s,t,u){return _r.call(this,s,t,add(u));};window.addEventListener('popstate',strip);})();</script>`;
    content = fs.readFileSync(indexHtml, 'utf8');
    if (!content.includes('history.replaceState(history.state')) {
      content = content.replace('</head>', `    ${shim}\n  </head>`);
      fs.writeFileSync(indexHtml, content, 'utf8');
      console.log(`✓ Injected subpath routing shim (${BASE_PATH}) into dist/index.html`);
    }
  }
  fs.copyFileSync(indexHtml, notFoundHtml);
  console.log('✓ Copied dist/index.html -> dist/404.html');
}

// 2. Optional base-path rewrite for subpath hosting (e.g. GitHub Pages
// project sites served at /<repo>/). Set PROMO_BASE_PATH=/pulse to rewrite
// every root-absolute asset URL ("/_expo/...", "/assets/...", ...) to its
// subpath form. Without this, project-subpath deployments load a blank page
// because the browser requests the assets from the domain root.
if (BASE_PATH) {
  const rewriteTargets = ['/_expo/', '/assets/', '/favicon.ico', '/metadata.json'];
  function rewriteFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const prefix of rewriteTargets) {
      // Plain, JSON-escaped and CSS-url() forms of root-absolute references.
      // (`\\/` and `\"` are how "/" and quotes appear inside JSON-embedded
      // strings in the bundle.)
      for (const form of [`"${prefix}`, `\\"${prefix}`, `\\/${prefix.slice(1)}`, `(${prefix}`]) {
        if (content.includes(form)) {
          const replacement =
            form[0] === '"'
              ? `"${BASE_PATH}${prefix}`
              : form.startsWith('\\"')
                ? `\\"${BASE_PATH}${prefix}`
                : form.startsWith('\\/')
                  ? `\\/${BASE_PATH}/${prefix.slice(1)}`
                  : `(${BASE_PATH}${prefix}`;
          content = content.split(form).join(replacement);
          changed = true;
        }
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  }
  function walkAndRewrite(dir) {
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += walkAndRewrite(p);
      } else if (/\.(html|js|json|css|txt|xml)$/.test(entry.name)) {
        if (rewriteFile(p)) {
          count += 1;
        }
      }
    }
    return count;
  }
  const rewritten = walkAndRewrite(distDir);
  console.log(`✓ Rewrote ${rewritten} file(s) with base path ${BASE_PATH}`);
}

// 3. Generate dist/vercel.json with SPA rewrites
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
