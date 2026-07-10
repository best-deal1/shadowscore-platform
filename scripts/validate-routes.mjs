import fs from 'node:fs';
import path from 'node:path';

const appDir = path.join(process.cwd(), 'app');
const requiredRoutes = ['/', '/about', '/security', '/privacy', '/terms', '/contact', '/login', '/intake', '/investigations', '/reports', '/monitoring', '/workspace', '/account', '/upgrade'];
const ignoredPrefixes = ['mailto:', 'http:', 'https:', '#'];
const errors = [];

function routeExists(route) {
  if (route === '/') return fs.existsSync(path.join(appDir, 'page.tsx'));
  return ['page.tsx', 'route.ts'].some((file) => fs.existsSync(path.join(appDir, route.slice(1), file)));
}

for (const route of requiredRoutes) {
  if (!routeExists(route)) errors.push(`Required route is missing: ${route}`);
}

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
}
walk(appDir); walk(path.join(process.cwd(), 'components'));

const hrefRe = /href=(?:{`([^`]+)`}|["']([^"']+)["'])/g;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = hrefRe.exec(source))) {
    const href = (match[1] || match[2] || '').split('?')[0];
    if (!href || ignoredPrefixes.some((prefix) => href.startsWith(prefix)) || href.includes('${')) continue;
    if (href.startsWith('/') && !routeExists(href)) errors.push(`${path.relative(process.cwd(), file)} links to missing route ${href}`);
  }
  const badButton = /<button(?![^>]*(onClick|type="submit"|aria-expanded))/g.test(source);
  if (badButton) errors.push(`${path.relative(process.cwd(), file)} contains a button without an explicit action or submit/menu behavior`);
}

if (errors.length) {
  console.error('Route validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Route validation passed for ${requiredRoutes.length} required routes and ${files.length} source files.`);
