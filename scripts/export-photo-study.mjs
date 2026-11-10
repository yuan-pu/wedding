import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { invitationPalette, renderContourPhoto } from '../src/render.mjs';

// This local review sheet stays outside dist/ and is never part of the invitation.
const root = fileURLToPath(new URL('../', import.meta.url));
const data = JSON.parse(readFileSync(resolve(root, 'content/wedding.json'), 'utf8'));
const { hero } = data.photos;
const photos = [hero, ...(data.photos.gallery || [])].filter((photo) => photo.src && photo.originalSrc);
const paperColor = data.dressCode.find((swatch) => swatch.name === '白')?.color || '#faf7ed';
const palette = invitationPalette(data);
if (!hero.src || !hero.originalSrc) {
  console.log('Photo comparison skipped: hero.src and hero.originalSrc are required.');
  process.exit(0);
}
const embed = (path) => {
  if (!/^assets\/[\w./-]+$/.test(path) || path.split('/').includes('..')) throw new Error('Photo study requires a project asset path.');
  const type = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' }[extname(path).toLowerCase()];
  if (!type) throw new Error('Unsupported comparison image format.');
  return `data:${type};base64,${readFileSync(resolve(root, 'public', path)).toString('base64')}`;
};
let html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>照片处理对比</title>
<style>
@font-face{font-family:'Wedding Mincho';src:url('${embed('assets/fonts/wedding-mincho.woff2')}') format('woff2')}@font-face{font-family:'Wedding Text';src:url('${embed('assets/fonts/wedding-text.woff2')}') format('woff2')}
.cutout-art{display:block;width:100%;height:100%;overflow:visible;--paper-stroke:52px;--cutline-outer:28px;--cutline-inner:24px}.cutout-art__paper{stroke-width:var(--paper-stroke)}.cutout-art__dashes{stroke-width:var(--cutline-outer)}.cutout-art__inner{stroke-width:var(--cutline-inner)}
*{box-sizing:border-box}body{margin:0;background:#f4f0e6;color:#30372e;font-family:'Wedding Text','Wedding Mincho',serif;padding:48px 26px}main{max-width:1040px;margin:auto}h1{font-weight:400;font-size:28px;letter-spacing:3px;margin:0 0 12px}header p,footer{font-size:12px;color:#6f7466;line-height:1.9}header{padding-bottom:28px;border-bottom:1px solid #c9cabd}.comparison{margin-top:40px}.comparison>h2{font-size:20px;font-weight:400;letter-spacing:2px}.samples{display:grid;grid-template-columns:1fr 1fr;gap:52px;margin-top:22px}h3{font-weight:400;font-size:14px;letter-spacing:2px;margin:0 0 16px}.stage{position:relative;width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:12px}img{display:block;max-width:100%;max-height:100%;object-fit:contain}.cutout{filter:url('#study-paper-tint') drop-shadow(0 5px 5px #33322216)}.square{position:relative;padding:23px;width:100%;height:100%;filter:drop-shadow(0 5px 5px #33322216);transform:rotate(2deg)}.square::before{content:'';position:absolute;inset:0;background:${paperColor};clip-path:polygon(0 1%,13% 0,27% 1%,41% 0,58% 1%,74% 0,88% 1%,100% 0,99% 15%,100% 31%,99% 47%,100% 62%,99% 81%,100% 99%,84% 100%,69% 99%,53% 100%,38% 99%,21% 100%,0 99%,1% 84%,0 68%,1% 50%,0 33%,1% 16%)}.square img{position:relative;width:100%;height:100%;object-fit:contain}footer{margin-top:42px;padding-top:22px;border-top:1px solid #c9cabd}@media(max-width:650px){body{padding:30px 24px}.samples{grid-template-columns:1fr;gap:36px}.stage{max-width:420px;margin:auto}.square{padding:18px}h1{font-size:24px}}
</style></head><body><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="study-paper-tint" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 30 30 30 0 -87" result="whitePixels"/><feComposite in="whitePixels" in2="SourceAlpha" operator="in" result="paperMask"/><feFlood flood-color="${paperColor}" result="paperColor"/><feComposite in="paperColor" in2="paperMask" operator="in" result="tintedPaper"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="tintedPaper"/></feMerge></filter></defs></svg><main><header><h1>照片处理对比</h1><p>三张都已抠图，纸边加宽并与 dress code 的白色一致。此页保留完整背景版供对照。</p></header>
${photos.map((photo, index) => `<section class="comparison"><h2>${['夕阳合照', '山间合照', '毕业合照'][index] || `照片 ${index + 1}`}</h2><div class="samples"><article><h3>人物剪纸</h3><div class="stage">${renderContourPhoto(photo, index, palette) || `<img class="cutout" src="${embed(photo.src)}" alt="人物剪纸，加宽纸白色撕纸边">`}</div></article><article><h3>完整背景</h3><div class="stage"><div class="square"><img src="${embed(photo.originalSrc)}" alt="保留完整背景的原始构图"></div></div></article></div></section>`).join('')}
<footer>原片未修改。抠图版是 AI 处理试样，请对照原片确认人像细节；网页整体效果请查看 preview.html。</footer></main></body></html>`;
html = html.replace(/href="\/(assets\/[\w./-]+)"/g, (_, asset) => `href="${embed(asset)}"`);
writeFileSync(resolve(root, 'photo-study.html'), html);
console.log('Local photo comparison generated: photo-study.html');
