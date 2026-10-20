// home.mjs - the HOME lane: homePage(page, ctx) -> the inside of <main> for '/'.
// Every word comes from the home model (src/content/pages/index.json: page.hero, page.rows, in live order) or from
// ctx.site (NAP, header buttons). Styles: src/styles/home.css (hm- classes). Rows are recognised by what they hold,
// so a row this file does not know still renders (renderBlocks), never dropped.
import { esc, attr, strip, isExt, linkAttrs } from './util.mjs';
import { btn, pools, cutout, loopOrStill, safeImg, stars, irisRing, icon, seam } from './parts.mjs';
import { richHtml, renderBlocks } from './blocks.mjs';

// plain text of a model html fragment (tags out, entities decoded so esc() never double-escapes them)
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…' };
const txt = (h) => strip(h).replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m));
const colsOf = (r) => (r.groups ? r.groups.flatMap((g) => g.cols || []) : r.cols || []);
const blocksOf = (r) => colsOf(r).flatMap((c) => c.blocks || []);
const ext = (href) => (isExt(href) ? '<span class="sr-only"> (opens in a new tab)</span>' : '');
/** wrap the last word(s) of a heading in the one amber italic accent the display type allows */
const accent = (text, re) => { const t = esc(text); const m = t.match(re); return m ? t.slice(0, m.index) + '<em>' + m[0] + '</em>' + t.slice(m.index + m[0].length) : t; };

/* live data-icon names (font-awesome / ecp custom icons) -> ICON entries */
function iconFor(name) {
  const n = String(name || '');
  if (/calendar/.test(n)) return 'calendar';
  if (/pencil|edit|square/.test(n)) return 'form';
  if (/envelope|mail/.test(n)) return 'mail';
  if (/eye|glass/.test(n)) return 'eye';
  if (/card/.test(n)) return 'card';
  return 'arrow';
}

/* ---------- 1. hero: V-HERO loop, glass pane on the dark left half (her face is in the right half) ---------- */
function hero(page, ctx) {
  const s = ctx.site || {};
  const hs = ((page.hero && page.hero.blocks) || []).filter((b) => b.t === 'heading').map((b) => txt(b.html)).filter(Boolean);
  const rest = ((page.hero && page.hero.blocks) || []).filter((b) => b.t !== 'heading');
  const lines = hs.map((t, i) => (i === hs.length - 1 && hs.length > 1 ? '<em>' + esc(t) + '</em>' : '<span>' + esc(t) + '</span>')).join('');
  const hb = s.headerButtons || [];
  const appt = hb.find((b) => /appointment/i.test(b.href || '')) || { text: 'Make an Appointment', href: '/contact-us/appointment-request-form/' };
  const shop = hb.find((b) => isExt(b.href)) || { text: 'Browse Eyewear', href: 'https://shop.ikiavisioncenter.com/' };
  const a = s.address || {};
  const addr = [a.street, a.city, [a.region, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return '<section class="section stage spotlight hm-hero" aria-label="' + attr(s.name || '') + '">'
    + loopOrStill(ctx, 'V-HERO', 'G-HERO-HOME', { eager: true, pos: '50% 30%', smoke: false, cls: 'hm-hero__bg', label: 'Pause background video' })
    + '<div class="hm-hero__shade" aria-hidden="true"></div>'
    + '<div class="pools" aria-hidden="true"><span class="pool pool--amber hm-hero__pool"></span><span class="pool pool--teal hm-hero__rim"></span></div>'
    + '<div class="wrap wrap--wide hm-hero__in">'
    + '<div class="glass hm-hero__pane" data-reveal="up">'
    + '<p class="display hm-hero__title">' + lines + '</p>'
    + '<div class="btns hm-hero__btns">' + btn(appt.text, appt.href, 'amber', { lead: 'calendar', ico: '' }) + btn(shop.text, shop.href, 'glass') + '</div>'
    + '<p class="hm-hero__nap">'
    + '<a href="/hours-location/"><span class="i">' + icon('pin') + '</span><span>' + esc(addr) + '</span></a>'
    + (s.phone ? '<a href="' + attr(s.tel || 'tel:' + s.phone) + '"><span class="i">' + icon('phone') + '</span><span>' + esc(s.phone) + '</span></a>' : '')
    + '</p>'
    + (rest.length ? renderBlocks(rest, ctx, page) : '')
    + '</div></div>'
    + '<span class="hm-cue" aria-hidden="true"><span></span></span>'
    + '</section>';
}

/* ---------- 2. welcome: the page's h1 + live copy on the lit canvas, a layered photo collage ---------- */
function welcome(row, ctx, page) {
  const bs = blocksOf(row);
  const h1 = bs.find((b) => b.t === 'heading' && b.level === 1) || bs.find((b) => b.t === 'heading');
  const im = bs.find((b) => b.t === 'image');
  const copy = bs.filter((b) => b.t === 'rich' || b.t === 'unknown');
  // contract 4.3: the VSP banner html block is dead on the live site too -> omitted; any other html block renders
  const html = bs.filter((b) => b.t === 'html' && !/earnmorewithvsp\.com/.test(b.html || ''));
  const other = bs.filter((b) => !['heading', 'image', 'rich', 'unknown', 'html', 'divider'].includes(b.t));
  const divider = bs.some((b) => b.t === 'divider');
  const h1Text = h1 ? txt(h1.html) : (page.h1 || '');
  const sub = page.hero && page.hero.image;
  return '<section class="section canvas hm-welcome" id="welcome">'
    + '<div class="wrap hm-welcome__in">'
    + '<div class="hm-collage">'
    + irisRing('hm-collage__ring')
    + (im ? '<div class="frame hm-collage__main" data-reveal="iris">' + safeImg(ctx, im.src, { alt: im.alt || '', sizes: '(min-width: 1080px) 560px, 92vw', widths: [480, 640, 960, 1280] }) + '</div>' : '')
    + (sub ? '<div class="hm-collage__sub" data-depth="0.07"><div class="frame hm-collage__subf" data-reveal="up" style="--d:.35s">' + safeImg(ctx, sub, { alt: '', sizes: '(min-width: 1080px) 340px, 60vw', widths: [480, 640, 960] }) + '</div></div>' : '')
    + '</div>'
    + '<div class="hm-welcome__copy">'
    + '<h1 class="display display--md hm-welcome__h1" data-reveal="up">' + accent(h1Text, /Houston, Texas$/) + '</h1>'
    + '<div class="hm-welcome__text" data-reveal="up" style="--d:.12s">' + copy.map((b) => richHtml(b.html, ctx)).join('') + html.map((b) => richHtml(b.html, ctx)).join('') + '</div>'
    + (other.length ? renderBlocks(other, ctx, page) : '')
    + (divider ? '<hr class="hm-hair" aria-hidden="true">' : '')
    + '</div>'
    + '</div></section>';
}

/* ---------- 3. quick links: the live badges as glass tiles over V-LIGHT ---------- */
function quick(row, ctx) {
  const items = blocksOf(row).filter((b) => b.t === 'badges').flatMap((b) => b.items || []);
  return '<section class="section stage spotlight hm-quick" aria-label="Quick Links">'
    + loopOrStill(ctx, 'V-LIGHT', 'G-LIGHT', { cls: 'hm-quick__bg', depth: 0.05, label: 'Pause background video' })
    + pools('both')
    + '<div class="wrap wrap--wide"><div class="hm-quick__grid" data-stagger>'
    + items.map((it) => '<a class="glass hm-tile" href="' + attr(it.href) + '"' + linkAttrs(it.href) + '>'
      + '<span class="hm-tile__ico">' + icon(iconFor(it.icon)) + '</span>'
      + '<span class="hm-tile__t">' + esc(it.label) + '</span>'
      + '<span class="hm-tile__go">' + icon(isExt(it.href) ? 'ext' : 'arrow') + '</span>' + ext(it.href) + '</a>').join('')
    + '</div></div></section>';
}

/* ---------- 4. services: the live gallery as tall cards, staggered offsets, glass captions ---------- */
function services(row, ctx, page) {
  const bs = blocksOf(row);
  const h = bs.find((b) => b.t === 'heading');
  const hHref = h && ((h.html || '').match(/href="([^"]+)"/) || [])[1];
  const hText = h ? txt(h.html) : '';
  const items = bs.filter((b) => b.t === 'gallery').flatMap((b) => b.items || []);
  const other = bs.filter((b) => !['heading', 'gallery'].includes(b.t));
  const title = accent(hText, /Services$/);
  return '<section class="section canvas hm-svc">'
    + '<div class="wrap">'
    + (h ? '<h2 class="display display--md hm-svc__title" data-reveal="up">' + (hHref ? '<a href="' + attr(hHref) + '">' + title + '</a>' : title) + '</h2>' : '')
    + '<div class="hm-svc__grid">'
    + items.map((it, i) => '<article class="card hm-svc__card" data-tilt="4">'
      + '<div class="card__media hm-svc__media" data-reveal="iris" style="--d:' + (i * 0.12).toFixed(2) + 's">' + safeImg(ctx, it.src, { alt: it.alt || '', sizes: '(min-width: 1080px) 290px, (min-width: 681px) 46vw, 92vw', widths: [320, 480, 640] }) + '</div>'
      + '<div class="glass hm-svc__cap" data-reveal="up" style="--d:' + (0.25 + i * 0.12).toFixed(2) + 's"><h3>' + esc(it.title || '') + '</h3><span class="ico">' + icon('arrow') + '</span></div>'
      + (it.href ? '<a class="card__link" href="' + attr(it.href) + '"' + linkAttrs(it.href) + ' aria-label="' + attr(it.title || it.alt || '') + '"></a>' : '')
      + '</article>').join('')
    + '</div>'
    + (other.length ? renderBlocks(other, ctx, page) : '')
    + '</div></section>';
}

/* ---------- 5. #HappyPatients: portraits + testimonial rail on a dark stage with a spotlight ---------- */
function happy(row, ctx, page) {
  const bs = blocksOf(row);
  const h = bs.find((b) => b.t === 'heading');
  const photos = bs.filter((b) => b.t === 'carousel').flatMap((b) => b.items || []);
  const quotes = bs.filter((b) => b.t === 'testimonials').flatMap((b) => b.items || []);
  const buttons = bs.filter((b) => b.t === 'button');
  const other = bs.filter((b) => !['heading', 'carousel', 'testimonials', 'button'].includes(b.t));
  return '<section class="section stage spotlight hm-happy">'
    + pools('key') + '<div class="pools" aria-hidden="true"><span class="pool pool--teal hm-happy__rim"></span></div>'
    + '<div class="wrap hm-happy__in">'
    + '<div class="hm-happy__side">'
    + (h ? '<h2 class="display display--md hm-happy__title" data-reveal="up">' + accent(txt(h.html), /Patients$/) + '</h2>' : '')
    + '<div class="hm-portraits" data-stagger>'
    + photos.map((p, i) => '<div class="hm-portrait hm-portrait--' + (i + 1) + '">' + irisRing('hm-portrait__ring') + '<div class="hm-portrait__img">' + safeImg(ctx, p.src, { alt: '', sizes: '200px', widths: [320] }) + '</div></div>').join('')
    + '</div></div>'
    + '<div class="hm-happy__main">'
    + '<div class="rail hm-rail">'
    + '<div class="rail__track hm-rail__track" tabindex="0" role="region" aria-label="' + attr(h ? txt(h.html) : 'Reviews') + '">'
    + quotes.map((q, i) => '<figure class="glass hm-quote" data-reveal="up" style="--d:' + (i * 0.12).toFixed(2) + 's">'
      + '<span class="hm-quote__mark" aria-hidden="true">' + icon('quote') + '</span>'
      + stars(q.rating || 5)
      + '<blockquote class="hm-quote__text"><p>' + esc(txt(q.html)) + '</p></blockquote>'
      + '<figcaption class="hm-quote__name">' + esc(q.name || '') + (q.when ? ' <span class="muted">' + esc(q.when) + '</span>' : '') + '</figcaption>'
      + '</figure>').join('')
    + '</div>'
    + '<div class="rail__nav hm-rail__nav">'
    + buttons.map((b) => btn(b.text, b.href, 'amber')).join('')
    + '<span class="hm-rail__arrows"><button class="rail__btn" type="button" data-rail="prev" aria-label="Previous">' + icon('left') + '</button>'
    + '<button class="rail__btn" type="button" data-rail="next" aria-label="Next">' + icon('right') + '</button></span>'
    + '</div></div>'
    + (other.length ? renderBlocks(other, ctx, page) : '')
    + '</div></div></section>';
}

/* ---------- 6. #HeretoHelp: glass panel + accordion over G-IRIS (parallax back plane), the doctor's real photo ---------- */
const DOC_PHOTO = 'https://da4e1j5r7gw87.cloudfront.net/wp-content/uploads/sites/3016/2019/12/ike_GSP_UID_8d9b3106-b304-428f-9dd3-d84576320c96.jpg';
function help(row, ctx, page) {
  const bs = blocksOf(row);
  const hs = bs.filter((b) => b.t === 'heading');
  const acc = bs.filter((b) => b.t === 'accordion').flatMap((b) => b.items || []);
  const other = bs.filter((b) => !['heading', 'accordion'].includes(b.t));
  const [h1, ...hRest] = hs;
  const doc = ctx.pages && ctx.pages.get('/our-eye-doctors/');
  // the doctor's real photo (live doctors page) beside the question that names him; the iris stays clear on the right
  const docLink = doc ? '<a class="hm-doc" href="/our-eye-doctors/" tabindex="-1" aria-hidden="true">'
    + '<span class="frame hm-doc__photo">' + safeImg(ctx, DOC_PHOTO, { alt: '', sizes: '112px', widths: [320] }) + '</span>' : '';
  return '<section class="section stage hm-help">'
    + loopOrStill(ctx, null, 'G-IRIS', { depth: 0.08, pos: '30% 50%', smoke: false, cls: 'hm-help__bg' })
    + '<div class="hm-help__shade" aria-hidden="true"></div>'
    + '<div class="wrap hm-help__in">'
    + '<div class="glass glass--strong hm-help__panel" data-reveal="up">'
    + (h1 ? '<h2 class="display display--md hm-help__title">' + accent(txt(h1.html), /Help$/) + '</h2>' : '')
    + '<div class="hm-help__head">'
    + (doc ? docLink + '</a>' : '')
    + '<div>' + hRest.map((h) => '<h3 class="hm-help__ask">' + esc(txt(h.html)) + '</h3>').join('')
    + (doc ? '<a class="hm-doc__name" href="/our-eye-doctors/"><span>Dr. Ike Ikechi, OD</span><span class="ico">' + icon('arrow') + '</span></a>' : '')
    + '</div></div>'
    + (acc.length ? '<div class="accordion hm-help__acc">' + acc.map((it) => '<details><summary>' + esc(txt(it.q)) + '</summary><div class="accordion__body">' + richHtml(it.html, ctx) + '</div></details>').join('') + '</div>' : '')
    + (other.length ? renderBlocks(other, ctx, page) : '')
    + '</div>'
    + '</div></section>';
}

/* ---------- 7. Our Designer Optical: the four live brand callouts on a teal-lit stage ---------- */
function optical(row, ctx, page) {
  const bs = blocksOf(row);
  const titleB = bs.find((b) => (b.t === 'rich' || b.t === 'heading') && txt(b.html));
  const callouts = bs.filter((b) => b.t === 'callout');
  const other = bs.filter((b) => b !== titleB && b.t !== 'callout');
  return '<section class="section stage hm-optical">'
    + '<div class="pools" aria-hidden="true"><span class="pool pool--teal hm-optical__key"></span><span class="pool pool--teal hm-optical__low"></span><span class="pool pool--amber pool--sm hm-optical__warm"></span></div>'
    + '<div class="wrap hm-optical__in">'
    + (titleB ? '<h2 class="display display--md hm-optical__title" data-reveal="up">' + accent(txt(titleB.html), /Optical$/) + '</h2>' : '')
    + '<div class="hm-brands">'
    + callouts.map((c, i) => {
      const name = txt(c.title || c.html);
      const inner = (c.image ? '<span class="frame hm-brand__img" data-reveal="iris" style="--d:' + (i * 0.12).toFixed(2) + 's">' + safeImg(ctx, c.image, { alt: c.imageAlt || '', sizes: '240px', widths: [250] }) + '</span>' : '')
        + '<span class="glass hm-brand__name" data-reveal="up" style="--d:' + (0.2 + i * 0.12).toFixed(2) + 's"><span>' + esc(name) + '</span><span class="ico">' + icon('arrow') + '</span></span>';
      return c.href ? '<a class="hm-brand" href="' + attr(c.href) + '"' + linkAttrs(c.href) + '>' + inner + ext(c.href) + '</a>' : '<div class="hm-brand">' + inner + '</div>';
    }).join('')
    + '</div>'
    + (other.length ? renderBlocks(other, ctx, page) : '')
    + '</div></section>';
}

/* ---------- 8. location + emergency + click-to-load map on a dark stage with an amber pool ---------- */
const MAP_SRC = 'https://maps.google.com/maps?q=14405B%20Bellaire%20Blvd%2C%20Houston%2C%20TX%2077083&output=embed';
function visit(row, ctx, page) {
  const bs = blocksOf(row);
  const locs = bs.filter((b) => b.t === 'locations').flatMap((b) => b.items || []);
  const em = bs.find((b) => b.t === 'callout');
  const emText = bs.filter((b) => b.t === 'rich' || b.t === 'unknown');
  const emBtns = bs.filter((b) => b.t === 'button');
  const other = bs.filter((b) => !['locations', 'callout', 'rich', 'unknown', 'button'].includes(b.t));
  const loc = locs.map((l) => '<article class="paper hm-loc" data-reveal="up">'
    + '<h2 class="hm-loc__name">' + (l.href ? '<a href="' + attr(l.href) + '">' + esc(l.name) + '</a>' : esc(l.name)) + '</h2>'
    + '<address class="hm-loc__addr"><span class="i">' + icon('pin') + '</span><span>' + (l.address || []).map(esc).join('<br>') + '</span></address>'
    + (l.phone ? '<p class="hm-loc__tel"><a href="' + attr(l.tel || 'tel:' + l.phone) + '"><span class="i">' + icon('phone') + '</span><span>' + esc(l.phone) + '</span></a></p>' : '')
    + (l.html ? '<div class="hm-loc__html">' + richHtml(l.html, ctx) + '</div>' : '')
    + ((l.hours || []).length ? '<table class="hours hm-loc__hours"><tbody>' + l.hours.map((h) => '<tr data-day="' + attr(h.day) + '"><th scope="row">' + esc(h.day) + '</th><td>' + esc(h.time) + '</td></tr>').join('') + '</tbody></table>' : '')
    + '</article>').join('');
  const emer = em ? '<article class="glass hm-emerg" data-reveal="up" style="--d:.12s">'
    + '<p class="hm-emerg__flag"><span class="hm-emerg__dot pulse" aria-hidden="true"></span></p>'
    + '<h2 class="display display--sm hm-emerg__title">' + esc(em.title || txt(em.html)) + '</h2>'
    + (em.title && txt(em.html) ? '<div class="hm-emerg__text">' + richHtml(em.html, ctx) + '</div>' : '')
    + emText.map((b) => '<div class="hm-emerg__text">' + richHtml(b.html, ctx) + '</div>').join('')
    + '<div class="btns">' + emBtns.map((b) => btn(b.text, b.href, 'amber', { lead: /^tel:/.test(b.href || '') ? 'phone' : undefined, ico: /^tel:/.test(b.href || '') ? '' : undefined })).join('') + '</div>'
    + '</article>' : emText.map((b) => richHtml(b.html, ctx)).join('');
  const l0 = locs[0] || {};
  const map = '<div class="glass hm-map" data-hm-map data-reveal="up" style="--d:.24s">'
    + '<div class="hm-map__box">'
    + '<span class="hm-map__pin" aria-hidden="true">' + icon('pin') + '</span>'
    + '<p class="hm-map__addr">' + (l0.address || []).map(esc).join('<br>') + '</p>'
    + '<button class="btn btn--glass btn--sm hm-map__btn" type="button" data-hm-map-btn><span class="ico ico--lead">' + icon('pin') + '</span><span class="btn__t">Show map</span></button>'
    + '</div>'
    + '<template><iframe src="' + attr(MAP_SRC) + '" loading="lazy" title="Map" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></template>'
    + '</div>';
  return '<section class="section stage spotlight hm-visit">'
    + '<div class="pools" aria-hidden="true"><span class="pool pool--amber hm-visit__pool"></span><span class="pool pool--teal hm-visit__rim"></span></div>'
    + '<div class="wrap wrap--wide hm-visit__grid">' + loc + emer + map + '</div>'
    + (other.length ? '<div class="wrap">' + renderBlocks(other, ctx, page) + '</div>' : '')
    // click-to-load map: no third-party request until the visitor asks for it
    + '<script>(function(){var b=document.querySelectorAll("[data-hm-map-btn]");for(var i=0;i<b.length;i++)b[i].addEventListener("click",function(){var m=this.closest("[data-hm-map]"),t=m&&m.querySelector("template"),x=m&&m.querySelector(".hm-map__box");if(!t||!x)return;x.innerHTML="";x.appendChild(t.content.cloneNode(true));m.classList.add("is-map");});})();</script>'
    + '</section>';
}

/* ---------- any row this file does not recognise: rendered plainly, never dropped ---------- */
function generic(row, ctx, page) {
  return '<section class="section canvas"><div class="wrap">' + renderBlocks(blocksOf(row), ctx, page) + '</div></section>';
}

export function homePage(page, ctx) {
  const rows = page.rows || [];
  const has = (r, t) => blocksOf(r).some((b) => b.t === t);
  const kindOf = (r) => {
    const bs = blocksOf(r);
    if (bs.some((b) => b.t === 'heading' && b.level === 1)) return 'welcome';
    if (has(r, 'badges')) return 'quick';
    if (has(r, 'gallery')) return 'services';
    if (has(r, 'testimonials') || has(r, 'carousel')) return 'happy';
    if (has(r, 'accordion')) return 'help';
    if (has(r, 'locations')) return 'visit';
    if (bs.filter((b) => b.t === 'callout' && b.image).length > 1) return 'optical';
    return 'generic';
  };
  const R = { welcome, quick, services, happy, help, optical, visit, generic };
  let out = hero(page, ctx);
  rows.forEach((r, i) => {
    const k = kindOf(r);
    out += R[k](r, ctx, page);
    const next = rows[i + 1] ? kindOf(rows[i + 1]) : '';
    // front plane: cut-outs that cross a hard seam (a zero-height layer between the two sections)
    if (k === 'welcome' && next === 'quick') out += seam(cutout(ctx, 'CUT-FRAMES', { cls: 'hm-cut-frames', depth: 0.1, rot: -9, sizes: '(min-width: 900px) 30vw, 70vw', widths: [480, 640, 960] }));
    if (k === 'optical') out += seam(cutout(ctx, 'CUT-SUNGLASSES', { cls: 'hm-cut-sun', depth: 0.12, rot: 12, sizes: '(min-width: 900px) 30vw, 70vw', widths: [480, 640, 960] }));
  });
  return out;
}
