import { readFileSync } from 'node:fs';

const photoContours = JSON.parse(readFileSync(new URL('../content/photo-contours.json', import.meta.url), 'utf8'));
const escape = (value = '') => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const lines = (value) => escape(value).replace(/\n/g, '<br />');
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ordinalSuffix = (day) => day % 100 >= 11 && day % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th');

function safeHttpUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

// Media stays in this project's public/assets folder; no remote requests needed.
function assetPath(value) {
  if (!value) return '';
  const path = String(value).replace(/^\.?\//, '');
  if (!/^assets\/[\w./-]+$/i.test(path) || path.split('/').includes('..')) return '';
  return `/${path}`;
}

function validate(data) {
  const { month, day, year, startTime, endTime, timeZone } = data.event;
  const date = new Date(Date.UTC(year ?? 2000, month - 1, day));
  if (!Number.isInteger(month) || !Number.isInteger(day) || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || (year !== null && (!Number.isInteger(year) || year < 1900 || year > 9999))) {
    throw new Error('请检查 content/wedding.json：event 的年月日无效；年份暂未确定时填 null。');
  }
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(startTime) || !timePattern.test(endTime) || startTime >= endTime) {
    throw new Error('请检查 content/wedding.json：时间请用 HH:mm，且结束时间要晚于开始时间。');
  }
  try { new Intl.DateTimeFormat('en', { timeZone }); } catch {
    throw new Error('请检查 content/wedding.json：event.timeZone 需要有效的 IANA 时区。');
  }
}

function photoStyle(photo) {
  return ['photo', 'cutout', 'sticker'].includes(photo.style) ? photo.style : 'cutout';
}

const safeColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

export function invitationPalette(data) {
  const swatch = (name, fallback) => safeColor(data.dressCode.find((color) => color.name === name)?.color, fallback);
  return {
    white: swatch('白', '#faf7ed'), red: swatch('红', '#962e3e'), pink: swatch('粉', '#e5b7bb'),
    green: safeColor(data.appearance?.calendarColor, '#e8ebdf'),
    greenInk: safeColor(data.appearance?.greenInk, '#657459'),
  };
}

export function renderContourPhoto(photo, index, palette) {
  const contour = photoContours[photo.src];
  if (!contour || photoStyle(photo) !== 'sticker') return '';
  const outline = `photo-outline-${index}`;
  const clip = `photo-clip-${index}`;
  const color = palette[photo.cutline] || palette.pink;
  return `<svg class="cutout-art" viewBox="0 0 ${contour.width} ${contour.height}" width="${contour.width}" height="${contour.height}" role="img" aria-label="${escape(photo.alt)}" data-cutline="${escape(photo.cutline || 'pink')}">
    <defs><path id="${outline}" d="${escape(contour.path)}" vector-effect="non-scaling-stroke" /><clipPath id="${clip}"><use href="#${outline}" /></clipPath></defs>
    <use class="cutout-art__paper" href="#${outline}" fill="${palette.white}" stroke="${palette.white}" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
    <use class="cutout-art__dashes" href="#${outline}" fill="none" stroke="${color}" vector-effect="non-scaling-stroke" stroke-dasharray="7 7" stroke-linejoin="round" />
    <use class="cutout-art__inner" href="#${outline}" fill="${palette.white}" stroke="${palette.white}" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
    <image class="cutout-art__image" href="${assetPath(photo.src)}" width="${contour.width}" height="${contour.height}" clip-path="url(#${clip})" preserveAspectRatio="none" />
  </svg>`;
}

function photoMarkup(photo, index = 0, palette) {
  const src = assetPath(photo.src);
  const placeholder = `<div class="photo-placeholder ${index ? 'photo-placeholder--numbered' : ''}" ${src ? 'hidden' : ''}>
    ${index ? `<span class="photo-placeholder__number" role="img" aria-label="第 ${index + 1} 张照片占位">${String(index + 1).padStart(2, '0')}</span>` : '<img src="/assets/couple-placeholder.svg" width="430" height="440" alt="两个人物剪纸的合照占位插画" />'}
  </div>`;
  const width = Number.isInteger(photo.width) && photo.width > 0 ? photo.width : 1200;
  const height = Number.isInteger(photo.height) && photo.height > 0 ? photo.height : 1200;
  return `<div class="photo-slot ${src ? `photo-slot--${photoStyle(photo)}` : 'photo-slot--placeholder'}">
    ${src ? renderContourPhoto(photo, index, palette) || `<img class="couple-photo" src="${escape(src)}" width="${width}" height="${height}" alt="${escape(photo.alt)}" ${index > 2 ? 'loading="lazy" decoding="async"' : index ? 'decoding="async"' : 'fetchpriority="high"'} />` : ''}
    ${placeholder}
  </div>`;
}

function photoPiece(photo, index, palette, extra = false) {
  const kind = extra ? 'extra' : index === 0 ? 'main' : `side-${index}`;
  return `<figure class="photo-piece photo-piece--${kind} photo-piece--${photoStyle(photo)}" data-photo data-reveal>
    <div class="photo-piece__motion"><div class="portrait-paper">
      ${index === 0 && photoStyle(photo) === 'photo' ? '<span class="paper-tape" aria-hidden="true"></span>' : ''}
      ${photoMarkup(photo, index, palette)}
    </div></div>
  </figure>`;
}

export function renderMetadata(data) {
  const title = escape(data.sharing.title);
  const description = escape(data.sharing.description);
  const url = safeHttpUrl(data.sharing.siteUrl);
  const cover = assetPath(data.sharing.image);
  const coverUrl = url && cover ? new URL(cover.slice(1), url.endsWith('/') ? url : `${url}/`).href : '';
  return `<title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="zh_CN" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    ${url ? `<link rel="canonical" href="${escape(url)}" /><meta property="og:url" content="${escape(url)}" />` : ''}
    ${coverUrl ? `<meta property="og:image" content="${escape(coverUrl)}" /><meta property="og:image:alt" content="${title}" />` : ''}`;
}

export function renderInvitation(data) {
  validate(data);
  const { couple, event, venue, copy } = data;
  const month = months[event.month - 1];
  const dateLabel = `${event.month} 月 ${event.day} 日`;
  const suffix = ordinalSuffix(event.day);
  const englishDate = `${month} ${event.day}${suffix}`;
  const calendarDate = new Date(Date.UTC(event.year ?? 2000, event.month - 1, event.day, 12));
  const weekDay = event.year ? new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: 'UTC' }).format(calendarDate) : '';
  const englishWeekDay = event.year ? new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(calendarDate) : '';
  const dateISO = event.year ? `${event.year}-${String(event.month).padStart(2, '0')}-${String(event.day).padStart(2, '0')}` : '';
  const dateMarkup = dateISO ? `<time datetime="${dateISO}">${escape(dateLabel)}</time>` : escape(dateLabel);
  const zoneAbbreviation = new Intl.DateTimeFormat('en-US', { timeZone: event.timeZone, timeZoneName: 'short' }).formatToParts(calendarDate).find((part) => part.type === 'timeZoneName')?.value;
  const mapUrl = safeHttpUrl(venue.mapUrl) || (venue.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.city}, ${venue.region}`)}` : '');
  const swatches = data.dressCode.map(({ name, english, color }, index) => `<li class="swatch swatch--${index}"><span class="swatch__paper" style="--swatch-color:${/^#[0-9a-f]{6}$/i.test(color) ? color : '#f4f0e6'}" aria-hidden="true"></span><span class="swatch__name">${escape(name)}</span>${english ? `<span class="swatch__english" lang="en">${escape(english)}</span>` : ''}</li>`).join('');
  const timeline = (event.timeline || []).map(({ time, chinese, english }) => `<li><span><span lang="en">${escape(time)}</span> ${escape(chinese)}</span><span lang="en">${escape(english)}</span></li>`).join('');
  const gallery = Array.isArray(data.photos.gallery) ? data.photos.gallery : [];
  const photos = [data.photos.hero, ...gallery];
  const musicSrc = assetPath(data.music?.src);
  const musicVolume = Number.isFinite(data.music?.volume) ? Math.max(0, Math.min(1, data.music.volume)) : 0.35;
  const palette = invitationPalette(data);
  const paperColor = palette.white;

  return `<div class="page" style="--wine:${palette.red};--pink:${palette.pink};--paper-light:${palette.white};--calendar-paper:${palette.green};--green:${palette.greenInk}">
  <a class="skip-link" href="#details">时间与地点 / Time &amp; place</a>
  <svg class="svg-definitions" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <filter id="paper-cutout" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="18" result="expanded" />
        <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="3" seed="8" result="grain" />
        <feDisplacementMap in="expanded" in2="grain" scale="10" xChannelSelector="R" yChannelSelector="G" result="roughEdge" />
        <feFlood flood-color="${paperColor}" result="paper" />
        <feComposite in="paper" in2="roughEdge" operator="in" result="border" />
        <feMerge><feMergeNode in="border" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="paper-tint" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  30 30 30 0 -87" result="whitePixels" />
        <feComposite in="whitePixels" in2="SourceAlpha" operator="in" result="paperMask" />
        <feFlood flood-color="${paperColor}" result="paperColor" />
        <feComposite in="paperColor" in2="paperMask" operator="in" result="tintedPaper" />
        <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="tintedPaper" /></feMerge>
      </filter>
    </defs>
  </svg>
  <div class="invitation">
    <main>
      <section class="hero" aria-labelledby="welcome-title">
        <div class="hero__words" data-reveal>
          ${copy.eyebrow ? `<p class="eyebrow">${escape(copy.eyebrow)}</p>` : ''}
          <h1 id="welcome-title" lang="en"><span class="hero__welcome">Welcome to</span> <span class="hero__main-line">our wedding</span></h1>
          <p class="hero__chinese-title">${escape(copy.invitationTitle || '婚礼请柬')}<svg class="hero__spark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 3c0 9-4 13-12 13 8 0 12 4 12 13 0-9 4-13 12-13C20 16 16 12 16 3Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" /></svg></p>
          <div class="couple-names">
            <div class="couple-names__person"><span class="couple-names__chinese">${escape(couple.name1)}</span>${couple.english1 ? `<span class="couple-names__english" lang="en">${escape(couple.english1)}</span>` : ''}</div>
            <span class="couple-names__amp" lang="en" aria-label="和">&amp;</span>
            <div class="couple-names__person"><span class="couple-names__chinese">${escape(couple.name2)}</span>${couple.english2 ? `<span class="couple-names__english" lang="en">${escape(couple.english2)}</span>` : ''}</div>
          </div>
          ${copy.intro ? `<p class="hero__intro">${lines(copy.intro)}</p>` : ''}
        </div>
        <div class="collage ${gallery.length ? 'collage--multiple' : 'collage--single'}" role="group" aria-label="我们的照片">
          ${photos.slice(0, 3).map((photo, index) => photoPiece(photo, index, palette)).join('')}
        </div>
        <div class="hero__foot"><span lang="en">${escape(englishDate)}${event.year ? `, ${event.year}` : ''}<span class="hero__divider">/</span>${escape(event.startTime)}–${escape(event.endTime)}</span><a class="scroll-arrow" href="#details" aria-label="查看时间与地点 / View time and location"><span aria-hidden="true">↓</span></a></div>
      </section>
      ${photos.length > 3 ? `<div class="photo-strip" role="group" aria-label="更多照片">${photos.slice(3).map((photo, index) => photoPiece(photo, index + 3, palette, true)).join('')}</div>` : ''}
      <section id="details" class="details" ${copy.detailsTitle ? 'aria-labelledby="details-title"' : 'aria-label="婚礼信息"'}>
        ${copy.detailsTitle ? `<div class="section-heading" data-reveal><h2 id="details-title">${escape(copy.detailsTitle)}</h2></div>` : ''}
        <div class="details__grid">
          <div class="date-card-wrap" data-calendar data-reveal><article class="date-card" aria-labelledby="date-title">
            <span class="date-card__pin" aria-hidden="true"></span>
            <p class="small-label" id="date-title">时间 · <span lang="en">When</span></p>
            <p class="date-card__month" lang="en">${escape(month)}</p>
            <p class="date-card__day" lang="en">${escape(event.day)}<sup>${suffix}</sup></p>
            ${englishWeekDay ? `<p class="date-card__weekday" lang="en">${escape(englishWeekDay)}</p>` : ''}
            <p class="date-card__chinese">${dateMarkup}${weekDay ? `<span>${event.year} · ${weekDay}</span>` : ''}</p>
            <div class="date-card__time"><strong lang="en">${escape(event.startTime)} <span>—</span> ${escape(event.endTime)}</strong><span class="date-card__zone">当地时间<span lang="en">Local time${zoneAbbreviation ? ` · ${escape(zoneAbbreviation)}` : ''}</span></span></div>
            ${timeline ? `<ol class="date-card__timeline" aria-label="婚礼流程 / Wedding timeline">${timeline}</ol>` : ''}
          </article></div>
          <div class="details__right">
            <article class="venue" aria-labelledby="venue-title" data-reveal>
              <p class="small-label">地点 · <span lang="en">Where</span></p>
              <h3 id="venue-title" lang="en">${escape(venue.city)}</h3>
              <p class="venue__name" lang="en">${escape(venue.name)}</p>
              ${venue.address ? `<p class="venue__address" lang="en">${lines(venue.address)}</p>` : `<p class="venue__address" lang="en">${escape(venue.region)}</p>`}
              ${venue.note ? `<p class="venue__note">${lines(venue.note)}</p>` : ''}
              ${mapUrl ? `<a class="map-link" href="${escape(mapUrl)}" target="_blank" rel="noopener noreferrer">地图 <span lang="en">Map</span><span class="map-link__arrow" aria-hidden="true">↗</span></a>` : ''}
            </article>
            <article class="dress-code" aria-labelledby="dress-title" data-reveal>
              <p class="small-label" id="dress-title">穿搭 · <span lang="en">Dress Code</span></p>
              <ul class="swatches" aria-label="建议穿搭颜色">${swatches}</ul>
              ${copy.dressCodeNote || copy.dressCodeNoteEnglish ? `<p class="dress-code__note">${copy.dressCodeNote ? `<span>${lines(copy.dressCodeNote)}</span>` : ''}${copy.dressCodeNoteEnglish ? `<span lang="en">${lines(copy.dressCodeNoteEnglish)}</span>` : ''}</p>` : ''}
            </article>
          </div>
        </div>
      </section>
      <section class="closing" aria-labelledby="closing-title" data-reveal>
        <h2 id="closing-title">${escape(copy.closing)}</h2>
        ${copy.closingEnglish ? `<p class="closing__english" lang="en"><span>${lines(copy.closingEnglish).replace(', ', ',</span> <span>')}</span></p>` : ''}
        <p class="closing__signature">${escape(couple.name1)} <span>&amp;</span> ${escape(couple.name2)}</p>
      </section>
    </main>
  </div>
  ${musicSrc ? `<audio id="wedding-music" src="${escape(musicSrc)}" preload="none" loop data-volume="${musicVolume}"></audio>
  <button class="music-control" type="button" data-music-control aria-controls="wedding-music" aria-label="播放音乐 / Play music" aria-pressed="false" title="播放音乐 / Play music" hidden>
    <svg class="music-control__note" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 17V6l10-2v11M10 9l10-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="7" cy="17.5" rx="3" ry="2.5" fill="currentColor"/><ellipse cx="17" cy="15.5" rx="3" ry="2.5" fill="currentColor"/></svg>
    <svg class="music-control__pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="5" width="3" height="14" rx="1"/><rect x="14" y="5" width="3" height="14" rx="1"/></svg>
  </button>
  <span class="visually-hidden" data-music-status role="status" aria-live="polite"></span>` : ''}
  </div>`;
}
