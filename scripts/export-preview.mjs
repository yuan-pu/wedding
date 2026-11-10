import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// A portable, generated snapshot: open preview.html without Node or a web server.
// The deployable site stays in dist/; content/wedding.json remains the source.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
const mimeTypes = { '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.avif': 'image/avif', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const inlineAsset = (asset, base) => {
  if (/^(data:|https?:|#)/.test(asset)) return asset;
  const path = resolve(base, asset);
  if (!path.startsWith(`${dist}/`)) throw new Error(`Preview asset outside dist: ${asset}`);
  const type = mimeTypes[extname(path).toLowerCase()];
  if (!type) throw new Error(`Unsupported preview asset: ${asset}`);
  return `data:${type};base64,${readFileSync(path).toString('base64')}`;
};

let html = readFileSync(resolve(dist, 'index.html'), 'utf8');
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, (tag) => {
  const href = tag.match(/href="([^"]+)"/)[1];
  const path = resolve(dist, href);
  const css = readFileSync(path, 'utf8').replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (_, quote, asset) => `url("${inlineAsset(asset, dirname(path))}")`);
  return `<style>${css}</style>`;
});
const scripts = [];
html = html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => {
  scripts.push(readFileSync(resolve(dist, src), 'utf8'));
  return '';
});
html = html.replace(/\b(src|href)="([^"#][^"]*)"/g, (attribute, key, asset) => {
  if (!/^(\.\/)?assets\//.test(asset)) return attribute;
  return `${key}="${inlineAsset(asset, dist)}"`;
});
html = html.replace('</body>', `<script>${scripts.join('\n').replace(/<\/script/gi, '<\\/script')}</script>\n</body>`);
writeFileSync(resolve(root, 'preview.html'), html);
console.log('Portable preview generated: preview.html');
const twoLineTitle = html.replace('<span class="hero__main-line">our wedding</span>', '<span class="hero__main-line">our <br />wedding</span>');
writeFileSync(resolve(root, 'preview-title-two-lines.html'), twoLineTitle);
console.log('Two-line title comparison generated: preview-title-two-lines.html');
