// blocks.mjs - INNER lane: every block type of BUILD-CONTRACT 4.3 as "Iris Noir" markup.
// Exports renderRows(rows, ctx, page), renderBlocks(blocks, ctx, page, opts) and richHtml(html, ctx).
// opts.ground: 'paper' (lit canvas panel) | 'dark' (stage panel / glass) | 'aside' (inside the sticky glass aside).
import { esc, attr, strip, isExt, linkAttrs, ICON } from './util.mjs';
import { btn, safeImg, sectionArt, stars, pools } from './parts.mjs';

export const MAP_SRC = 'https://maps.google.com/maps?q=14405B%20Bellaire%20Blvd%2C%20Houston%2C%20TX%2077083&output=embed';
/** html -> text that is safe to print: tags out, valid entities kept, stray & and < escaped (never double-escaped) */
export const plain = (s) => strip(s).replace(/&(?!(?:[a-z][a-z0-9]*|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ico = (name, cls = 'i') => '<span class="' + cls + '">' + (ICON[name] || '') + '</span>';
const uid = (ctx, p) => { ctx._pg = ctx._pg || { n: 0, js: false }; ctx._pg.n += 1; return 'pg-' + p + ctx._pg.n; };
const needJs = (ctx) => { ctx._pg = ctx._pg || { n: 0, js: false }; ctx._pg.js = true; };
const isLogoRef = (ref) => /\/ecp-samurai\//.test(ref) || /\.gif(\?|#|$)/i.test(ref);
const dec = (s) => String(s || '').replace(/&amp;/g, '&');

/** the click-to-load poster for a YouTube/Vimeo embed: nothing third-party loads until the click */
function videoPoster(src, title, ctx) {
  needJs(ctx);
  let poster = '';
  try { poster = safeImg(ctx, 'G-IRIS', { alt: '', sizes: '(min-width: 900px) 640px, 100vw', widths: [480, 640, 960] }); } catch (e) { poster = ''; }
  return '<div class="pg-video frame">' + poster
    + '<button class="pg-video__btn" type="button" data-video-src="' + attr(dec(src)) + '" data-video-title="' + attr(title || 'Video') + '">'
    + '<span class="pg-video__play">' + ICON.play + '</span><span class="pg-video__t">Play video' + (title ? ': ' + esc(title) : '') + '</span></button></div>';
}

/** rich html from a page model: images through ctx.img (never throws), logo lists on light chips, inline photos as
 *  right-floated figures (wide screens), tables in a scrolling wrapper, video embeds as click-to-load posters */
export function richHtml(html, ctx) {
  let h = String(html || '');
  // video embeds (<p><div data-video></div></p> is invalid nesting: lift the div out of the p)
  h = h.replace(/<p>\s*(<div\b[^>]*\bdata-video="[^"]*"[^>]*>\s*<\/div>)\s*<\/p>/g, '$1');
  h = h.replace(/<div\b[^>]*\bdata-video="([^"]*)"[^>]*>\s*<\/div>/g, (m, src) => videoPoster(src, (m.match(/\bdata-title="([^"]*)"/) || [])[1] || '', ctx));
  // images
  h = h.replace(/<img\b[^>]*\bdata-ref="([^"]+)"[^>]*>/g, (m, ref) => {
    const alt = dec((m.match(/\balt="([^"]*)"/) || [])[1] || '');
    const r = dec(ref);
    // a dead / unharvested live image (its alt is often a file name such as "clipart 010"): no empty frame, no stray alt text
    const fail = () => '<!--pg-noimg-->'; // dead live image: left out (named in the INNER report); inside a link the link keeps its host as text
    if (isLogoRef(r)) { try { return '<span class="pg-logo">' + ctx.img(r, { alt, sizes: '180px', widths: [240, 360], cls: 'pg-logo__img', loading: 'lazy' }) + '</span>'; } catch (e) { return fail(); } }
    let im;
    try { im = ctx.img(r, { alt, sizes: '(min-width: 900px) 340px, 100vw', widths: [360, 480, 720], cls: 'pg-inline', loading: 'lazy' }); } catch (e) { return fail(); }
    const w = Number((im.match(/\bwidth="(\d+)"/) || [])[1] || 0);
    if (w && w < 300) im = im.replace(/class="pg-inline/, 'style="--w:' + w + 'px" class="pg-inline pg-inline--small');
    return im;
  });
  h = h.replace(/(<a\b[^>]*\bhref="([^"]+)"[^>]*>)\s*<!--pg-noimg-->\s*(<\/a>)/g, (m, open, href, close) => open + esc(String(href).replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0]) + close).replace(/<!--pg-noimg-->/g, '');
  // a list whose items are only logos -> the logo grid
  h = h.replace(/<ul>((?:\s*<li>\s*<span class="pg-logo">[\s\S]*?<\/span>\s*<\/li>)+)\s*<\/ul>/g, (m, inner) => '<ul class="pg-logos">' + inner + '</ul>');
  // a long list of short plain items (plan names) -> columns
  h = h.replace(/<ul>((?:\s*<li>[^<]{1,48}<\/li>){12,})\s*<\/ul>/g, (m, inner) => '<ul class="pg-list-cols">' + inner + '</ul>');
  // tables scroll sideways on phones
  h = h.replace(/<table\b[\s\S]*?<\/table>/g, (t) => '<div class="pg-table">' + t + '</div>');
  return h;
}

const BADGE_ICON = { 'fa-calendar': 'calendar', 'fa-pencil-square-o': 'form', 'fa-envelope-o': 'mail', 'ecp-customicon-computer-eye': 'glasses', 'fa-address-card-o': 'card', 'fa-phone': 'phone', 'fa-map-marker': 'pin', 'fa-plus': 'eye' };
const badgeIcon = (n) => { const k = Object.keys(BADGE_ICON).find((x) => String(n || '').includes(x)); return k ? BADGE_ICON[k] : 'eye'; };
const hTag = (level, html, cls) => { const n = Math.min(6, Math.max(2, Number(level) || 2)); return '<h' + n + (cls ? ' class="' + cls + '"' : '') + '>' + html + '</h' + n + '>'; };
const isCaps = (s) => { const t = strip(s); return /[A-Z]/.test(t) && !/[a-z]/.test(t) && t.length > 3; };

function hours(list) {
  if (!list || !list.length) return '';
  return '<table class="hours pg-hours"><tbody>' + list.map((h) => '<tr data-day="' + attr(h.day) + '"><th scope="row">' + esc(h.day) + '</th><td>' + esc(h.time) + '</td></tr>').join('') + '</tbody></table>';
}

function location(it, ctx, opts) {
  const plain = opts.ground === 'aside';
  const pay = it.payment;
  const addr = (it.address || []).filter((l) => !(pay && pay.label && l.trim() === pay.label.trim()));
  let h = '';
  if (it.name) h += '<h3 class="pg-loc__name">' + (it.href ? '<a href="' + attr(it.href) + '">' + esc(it.name) + '</a>' : esc(it.name)) + '</h3>';
  if (addr.length) h += '<address class="pg-loc__addr">' + ico('pin') + '<span>' + addr.map(esc).join('<br>') + '</span></address>';
  if (it.phone) h += '<p class="pg-loc__tel"><a href="' + attr(it.tel || ('tel:' + it.phone)) + '">' + ico('phone') + '<span>' + esc(it.phone) + '</span></a></p>';
  if (it.hours && it.hours.length) h += hours(it.hours);
  if (pay) {
    h += '<div class="pg-pay">' + (pay.label ? '<p class="pg-pay__label">' + esc(pay.label) + '</p>' : '')
      + (pay.methods && pay.methods.length ? '<ul class="pg-pay__chips">' + pay.methods.map((m) => '<li class="chip">' + ico('card') + esc(m) + '</li>').join('') + '</ul>' : '')
      + (pay.html ? '<div class="pg-pay__html">' + richHtml(pay.html, ctx) + '</div>' : '') + '</div>';
  }
  if (it.html) h += '<div class="prose pg-loc__html">' + richHtml(it.html, ctx) + '</div>';
  if (it.labels && it.labels.length) h += '<p class="pg-loc__labels">' + it.labels.map((l) => '<span class="chip">' + esc(typeof l === 'string' ? l : (l.text || l.label || '')) + '</span>').join('') + '</p>';
  if (it.name && addr.length && !plain) {
    needJs(ctx);
    h += '<div class="pg-mapbox"><button class="btn btn--glass btn--sm pg-map__btn" type="button" data-map-src="' + attr(MAP_SRC) + '" data-map-title="' + attr('Map: ' + addr.join(', ')) + '">' + ico('pin', 'ico ico--lead') + '<span class="btn__t">Show map</span></button><div class="pg-map" hidden></div></div>';
  }
  const paper = opts.ground === 'paper';
  return '<div class="pg-loc' + (plain ? ' pg-loc--plain' : paper ? ' card--paper pg-loc--paper' : ' glass glass--pad') + '"' + (plain ? '' : ' data-reveal="up"') + '>' + h + '</div>';
}

function callout(b, ctx, opts) {
  const paper = opts.ground === 'paper';
  // an image-only callout is a photo: framed, the odd one protrudes from its panel
  if (b.image && !b.title && !strip(b.html)) {
    const im = safeImg(ctx, b.image, { alt: b.imageAlt || '', sizes: '(min-width: 1100px) 520px, 100vw', widths: [480, 640, 960, 1280] });
    const fr = '<figure class="frame pg-photo pg-pop" data-reveal="zoom">' + im + '</figure>';
    return b.href ? '<a class="pg-photo__link" href="' + attr(b.href) + '"' + linkAttrs(b.href) + '>' + fr + '</a>' : fr;
  }
  const media = b.image ? '<div class="card__media">' + safeImg(ctx, b.image, { alt: b.imageAlt || '', sizes: '(min-width: 1100px) 420px, 100vw', widths: [480, 640, 960] }) + '</div>' : '';
  const icn = !b.image && b.icon ? '<span class="i i--lg pg-callout__ico">' + ICON[badgeIcon(b.icon)] + '</span>' : '';
  const title = b.title ? '<h3 class="pg-callout__t">' + esc(b.title) + '</h3>' : '';
  const body = strip(b.html) ? '<div class="prose pg-callout__html">' + richHtml(b.html, ctx) + '</div>' : '';
  const link = b.href ? '<a class="card__link" href="' + attr(b.href) + '"' + linkAttrs(b.href) + ' aria-label="' + attr(b.title || strip(b.html).slice(0, 60) || 'Read more') + '"></a>' : '';
  return '<article class="card ' + (paper ? 'card--paper' : 'card--glass') + ' pg-callout' + (media ? '' : ' pg-callout--flat') + '" data-reveal="up">' + media + '<div class="card__body">' + icn + title + body + link + '</div></article>';
}

function figure(src, alt, ctx, o = {}) {
  const im = safeImg(ctx, src, { alt: alt || '', sizes: o.sizes || '(min-width: 1100px) 560px, 100vw', widths: o.widths || [480, 640, 960, 1280] });
  return im;
}

function cardsChild(items, ctx, ground) {
  const paper = ground === 'paper';
  return '<ul class="grid-3 pg-cards" data-stagger>' + items.map((it) => {
    let media = '';
    if (it.image) media = safeImg(ctx, it.image, { alt: it.imageAlt || '', sizes: '(min-width: 1100px) 30vw, (min-width: 680px) 45vw, 100vw', widths: [480, 640, 960] });
    else {
      const slot = sectionArt({ path: it.href || '/', kind: 'page' });
      media = safeImg(ctx, slot, { alt: '', sizes: '(min-width: 1100px) 30vw, (min-width: 680px) 45vw, 100vw', widths: [480, 640, 960] });
    }
    return '<li class="card ' + (paper ? 'card--paper' : 'card--glass') + ' pg-card" data-tilt>'
      + '<div class="card__media">' + media + '</div>'
      + '<div class="card__body"><h3>' + esc(it.title || '') + '</h3>' + (it.summary ? '<p>' + plain(it.summary) + '</p>' : '')
      + '<span class="pg-card__go" aria-hidden="true">' + ICON.arrow + '</span>'
      + '<a class="card__link" href="' + attr(it.href) + '"' + linkAttrs(it.href) + ' aria-label="' + attr(it.title || '') + '"></a></div></li>';
  }).join('') + '</ul>';
}
export const childCards = cardsChild;

function team(b, ctx, opts) {
  const items = b.items || [];
  if (b.view === 'complete') {
    return items.map((it) => '<article class="pg-profile">'
      + (it.photo ? '<figure class="pg-profile__ph" data-reveal="iris"><span class="frame frame--round">' + safeImg(ctx, it.photo, { alt: it.photoAlt || it.name || '', sizes: '(min-width: 700px) 360px, 70vw', widths: [360, 480, 720] }) + '</span></figure>' : '')
      + '<div class="pg-profile__body">' + (it.name ? '<h2 class="pg-profile__name">' + esc(it.name) + '</h2>' : '') + (it.role ? '<p class="pg-profile__role">' + esc(it.role) + '</p>' : '')
      + (it.html ? '<div class="prose">' + (/^\s*</.test(it.html) ? richHtml(it.html, ctx) : '<p>' + esc(it.html) + '</p>') + '</div>' : '') + '</div></article>').join('');
  }
  return '<div class="pg-team">' + items.map((it) => {
    if (!it.name && !it.photo) return it.html ? '<div class="prose pg-team__bio">' + (/^\s*</.test(it.html) ? richHtml(it.html, ctx) : '<p>' + esc(it.html) + '</p>') + '</div>' : '';
    return '<article class="' + (opts.ground === 'paper' ? 'card--paper' : 'glass') + ' pg-person" data-reveal="up">'
      + (it.photo ? '<span class="frame frame--round pg-person__ph">' + safeImg(ctx, it.photo, { alt: it.photoAlt || it.name || '', sizes: '200px', widths: [240, 360, 480] }) + '</span>' : '')
      + '<h3 class="pg-person__name">' + esc(it.name || '') + '</h3>' + (it.role ? '<p class="pg-person__role">' + esc(it.role) + '</p>' : '')
      + (it.html ? '<p class="pg-person__bio">' + plain(it.html) + '</p>' : '')
      + (it.href ? '<a class="card__link" href="' + attr(it.href) + '" aria-label="' + attr(it.name || '') + '"></a>' : '') + '</article>';
  }).join('') + '</div>';
}

function testimonials(b, ctx, opts) {
  return '<ul class="pg-quotes" data-stagger>' + (b.items || []).map((it) => '<li class="pg-quote ' + (opts.ground === 'paper' ? 'card--paper' : 'glass') + '">'
    + '<span class="pg-quote__mark" aria-hidden="true">' + ICON.quote + '</span>'
    + (it.rating ? stars(it.rating) : '')
    + '<blockquote class="pg-quote__q">' + (/^\s*</.test(it.html || '') ? richHtml(it.html, ctx) : '<p>' + esc(it.html || '') + '</p>') + '</blockquote>'
    + '<p class="pg-quote__by">' + (it.photo ? '<span class="frame frame--round pg-quote__ph">' + safeImg(ctx, it.photo, { alt: '', sizes: '48px', widths: [96] }) + '</span>' : '')
    + '<span><strong>' + esc(it.name || '') + '</strong>' + (it.when ? '<span class="pg-quote__when">' + esc(it.when) + '</span>' : '') + '</span></p></li>').join('') + '</ul>';
}

function posts(b, ctx) {
  needJs(ctx);
  const items = b.items || [];
  return '<div class="pg-postlist"><ul class="grid-3 pg-posts" data-more="12">' + items.map((it) => '<li class="card card--paper pg-post">'
    + '<div class="card__body">' + (it.date ? '<p><span class="chip chip--amber pg-date">' + ico('calendar') + esc(it.date) + '</span></p>' : '')
    + '<h3>' + esc(it.title || '') + '</h3>' + (it.excerpt ? '<p>' + esc(it.excerpt) + '</p>' : '')
    + '<a class="card__link" href="' + attr(it.path) + '" aria-label="' + attr(it.title || '') + '"></a></div></li>').join('') + '</ul>'
    + (items.length > 12 ? '<p class="pg-more__wrap"><button class="btn btn--amber pg-more" type="button" hidden><span class="btn__t">Load more</span><span class="ico">' + ICON.chevron + '</span></button></p>' : '') + '</div>';
}

function badges(b, ctx, opts) {
  return '<ul class="pg-badges' + (opts.ground === 'aside' ? ' pg-badges--aside' : '') + '"' + (opts.ground === 'aside' ? '' : ' data-stagger') + '>' + (b.items || []).map((it) => '<li><a class="pg-badge" href="' + attr(it.href) + '"' + linkAttrs(it.href) + '>'
    + '<span class="pg-badge__ico">' + ICON[badgeIcon(it.icon)] + '</span><span class="pg-badge__t">' + esc(it.label) + '</span>'
    + (isExt(it.href) ? '<span class="pg-badge__ext">' + ICON.ext + '</span><span class="sr-only"> (opens in a new tab)</span>' : '') + '</a></li>').join('') + '</ul>';
}

function search(b, ctx) {
  const id = uid(ctx, 'q');
  const label = (b.label || 'Search').replace(/:\s*$/, '');
  return '<form class="pg-search" action="/sitemap/" method="get" role="search"><label class="sr-only" for="' + id + '">' + esc(b.label || 'Search') + '</label>'
    + '<span class="pg-search__ico">' + ICON.search + '</span><input id="' + id + '" name="q" type="search" autocomplete="off" placeholder="' + attr(label) + '">'
    + '<button class="pg-search__go" type="submit" aria-label="Search">' + ICON.arrow + '</button></form>';
}

// ---------- forms (UNWIRED: method post, action #, every control disabled) ----------
function fieldHtml(f, ctx, fid) {
  const req = f.required ? '<span class="pg-req" aria-hidden="true">*</span>' : '';
  const reqA = f.required ? ' required aria-required="true"' : '';
  const desc = f.description ? '<p class="pg-fdesc" id="' + fid + '-d">' + richHtml(f.description, ctx) + '</p>' : '';
  const dA = f.description ? ' aria-describedby="' + fid + '-d"' : '';
  const t = f.type;
  if (t === 'html') return '<div class="prose pg-fhtml">' + richHtml(f.html, ctx) + '</div>';
  if (t === 'section') return '<div class="pg-fsec"><h2>' + esc(f.label || '') + '</h2>' + (strip(f.html) ? '<div class="prose">' + richHtml(f.html, ctx) + '</div>' : '') + '</div>';
  if (t === 'radio' || t === 'checkbox' || t === 'consent') {
    const opts = f.options && f.options.length ? f.options : [f.label || ''];
    return '<fieldset class="field pg-choice"' + dA + '><legend>' + esc(f.label || '') + req + '</legend>' + desc + '<div class="pg-opts' + (opts.length > 6 ? ' pg-opts--many' : '') + '">'
      + opts.map((o, i) => '<label class="pg-opt"><input type="' + (t === 'radio' ? 'radio' : 'checkbox') + '" name="' + fid + (t === 'radio' ? '' : '-' + i) + '" value="' + attr(o) + '" disabled' + (t === 'radio' && f.required ? ' required' : '') + '><span>' + esc(o) + '</span></label>').join('') + '</div></fieldset>';
  }
  if (t === 'name' || t === 'address') {
    const subs = f.sub && f.sub.length ? f.sub : [{ label: f.label, type: 'text' }];
    return '<fieldset class="field pg-multi pg-multi--' + t + '"' + dA + '><legend>' + esc(f.label || '') + req + '</legend>' + desc + '<div class="pg-sub">'
      + subs.map((s, i) => {
        const sid = fid + '-' + i;
        const ctl = s.type === 'select'
          ? '<select id="' + sid + '" name="' + sid + '" disabled' + reqA + '><option value=""></option>' + (f.options || []).map((o) => '<option>' + esc(o) + '</option>').join('') + '</select>'
          : '<input id="' + sid + '" name="' + sid + '" type="text" disabled' + reqA + '>';
        return '<div class="field pg-sub__f' + (/street|line/i.test(s.label) ? ' pg-sub__f--wide' : '') + '">' + ctl + '<label for="' + sid + '">' + esc(s.label) + '</label></div>';
      }).join('') + '</div></fieldset>';
  }
  if (t === 'time') {
    return '<fieldset class="field pg-multi pg-multi--time"' + dA + '><legend>' + esc(f.label || '') + req + '</legend>' + desc + '<div class="pg-sub pg-sub--time">'
      + '<div class="field"><input id="' + fid + '-h" name="' + fid + '-h" type="number" min="1" max="12" disabled' + reqA + '><label for="' + fid + '-h">HH</label></div>'
      + '<div class="field"><input id="' + fid + '-m" name="' + fid + '-m" type="number" min="0" max="59" disabled' + reqA + '><label for="' + fid + '-m">MM</label></div>'
      + (f.options && f.options.length ? '<div class="field"><select id="' + fid + '-a" name="' + fid + '-a" disabled>' + f.options.map((o) => '<option>' + esc(o) + '</option>').join('') + '</select><label for="' + fid + '-a">' + esc(f.options.join(' / ')) + '</label></div>' : '')
      + '</div></fieldset>';
  }
  let ctl;
  if (t === 'textarea') ctl = '<textarea id="' + fid + '" name="' + fid + '" rows="4" disabled' + reqA + dA + '></textarea>';
  else if (t === 'select') ctl = '<select id="' + fid + '" name="' + fid + '" disabled' + reqA + dA + '>' + (f.options || []).map((o) => '<option>' + esc(o) + '</option>').join('') + '</select>';
  else {
    const it = f.inputType || ({ phone: 'tel', email: 'email', number: 'number', website: 'url', date: 'text' }[t]) || 'text';
    ctl = '<input id="' + fid + '" name="' + fid + '" type="' + attr(it) + '" disabled' + reqA + dA + '>';
  }
  return '<div class="field pg-field' + (t === 'textarea' ? ' pg-field--wide' : '') + '"><label for="' + fid + '">' + esc(f.label || '') + req + '</label>' + ctl + desc + '</div>';
}

export function formBlock(b, ctx) {
  const id = attr(b.id || uid(ctx, 'form'));
  const phone = ctx.site.phone || '';
  const tel = ctx.site.tel || ('tel:' + phone);
  const msg = 'This preview form is not connected yet. Please call the clinic at ' + phone + '.';
  return '<form class="pg-form" id="' + id + '" method="post" action="#" data-unwired="' + attr(msg) + '" novalidate>'
    + '<p class="form-note pg-form__note" role="note">' + ico('phone') + '<span>This preview form is not connected yet. Please call the clinic at <a href="' + attr(tel) + '">' + esc(phone) + '</a>.</span></p>'
    + (b.title ? '<h2 class="pg-form__title">' + esc(b.title) + '</h2>' : '') + (b.html ? '<div class="prose">' + richHtml(b.html, ctx) + '</div>' : '')
    + '<div class="pg-fields">' + (b.fields || []).map((f, i) => fieldHtml(f, ctx, id + '-f' + i)).join('') + '</div>'
    + '<p class="pg-form__go"><button class="btn btn--amber" type="submit" disabled><span class="btn__t">' + esc(b.submit || 'Submit') + '</span><span class="ico">' + ICON.arrow + '</span></button></p></form>';
}

/** one block -> html. Unknown types render their html as prose (and ctx.warn names them). */
export function renderBlock(b, ctx, page, opts = {}) {
  const ground = opts.ground || 'paper';
  switch (b.t) {
    case 'heading': {
      const lvl = Number(b.level) === 1 ? 2 : b.level;
      return hTag(lvl, b.html, 'pg-h' + (isCaps(b.html) ? ' pg-caps' : '') + (Number(lvl) <= 2 ? ' display display--sm' : ''));
    }
    case 'rich': case 'html': return strip(b.html) || /<img|data-video/.test(b.html || '') ? '<div class="prose pg-rich">' + richHtml(b.html, ctx) + '</div>' : '';
    case 'unknown': return '<div class="prose pg-rich" data-module="' + attr(b.module || '') + '">' + richHtml(b.html, ctx) + '</div>';
    case 'button': return '<p class="btns pg-btns">' + btn(b.text, b.href, opts.btnKind || 'amber') + '</p>';
    case 'callout': return callout(b, ctx, opts);
    case 'image': {
      const fr = '<figure class="frame pg-photo" data-reveal="zoom">' + figure(b.src, b.alt, ctx) + (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') + '</figure>';
      return b.href ? '<a class="pg-photo__link" href="' + attr(b.href) + '"' + linkAttrs(b.href) + '>' + fr + '</a>' : fr;
    }
    case 'gallery': return '<ul class="grid-3 pg-gallery" data-stagger>' + (b.items || []).map((it) => {
      const fr = '<figure class="frame pg-gal">' + figure(it.src, it.alt, ctx, { sizes: '(min-width: 1100px) 30vw, 100vw', widths: [480, 640, 960] }) + (it.title ? '<figcaption>' + esc(it.title) + '</figcaption>' : '') + '</figure>';
      return '<li>' + (it.href ? '<a href="' + attr(it.href) + '"' + linkAttrs(it.href) + '>' + fr + '</a>' : fr) + '</li>';
    }).join('') + '</ul>';
    case 'carousel': return '<div class="rail pg-rail"><ul class="rail__track">' + (b.items || []).map((it) => '<li><figure class="frame pg-gal">' + figure(it.src, it.alt, ctx, { sizes: '360px', widths: [480, 720] }) + (it.title ? '<figcaption>' + esc(it.title) + '</figcaption>' : '') + '</figure></li>').join('') + '</ul>'
      + '<div class="rail__nav"><button class="rail__btn" type="button" data-rail="prev" aria-label="Previous">' + ICON.left + '</button><button class="rail__btn" type="button" data-rail="next" aria-label="Next">' + ICON.right + '</button></div></div>';
    case 'accordion': return '<div class="accordion pg-acc">' + (b.items || []).map((it) => '<details><summary>' + plain(it.q) + '</summary><div class="accordion__body prose">' + richHtml(it.html, ctx) + '</div></details>').join('') + '</div>';
    case 'testimonials': return testimonials(b, ctx, opts);
    case 'team': return team(b, ctx, opts);
    case 'locations': return '<div class="pg-locs">' + (b.items || []).map((it) => location(it, ctx, opts)).join('') + '</div>';
    case 'childpages': return cardsChild(b.items || [], ctx, ground);
    case 'posts': return posts(b, ctx);
    case 'badges': return badges(b, ctx, opts);
    case 'form': return formBlock(b, ctx);
    case 'divider': return '<hr class="pg-rule">';
    case 'search': return search(b, ctx);
    case 'video': return videoPoster(b.src, b.title, ctx);
    case 'crumbs': return '';
    default:
      ctx.warn('block: unknown type ' + b.t);
      return b.html ? '<div class="prose pg-rich">' + richHtml(b.html, ctx) + '</div>' : '';
  }
}

/** blocks -> html; consecutive buttons share one .btns row (the first amber, the rest glass) */
export function renderBlocks(blocks, ctx, page, opts = {}) {
  const out = [];
  const list = blocks || [];
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (b.t === 'button') {
      const run = [];
      while (i < list.length && list[i].t === 'button') run.push(list[i++]);
      i--;
      out.push('<p class="btns pg-btns">' + run.map((x, k) => btn(x.text, x.href, k === 0 ? 'amber' : 'glass', /^tel:/.test(x.href) ? { lead: 'phone', ico: '' } : {})).join('') + '</p>');
      continue;
    }
    out.push(renderBlock(b, ctx, page, opts));
  }
  return out.join('');
}

const colsOf = (g) => g.cols || [];
const groupsOf = (r) => (r.groups ? r.groups : [{ cols: r.cols || [] }]);
const allBlocks = (r) => groupsOf(r).flatMap((g) => colsOf(g).flatMap((c) => c.blocks || []));

/** builder rows -> panels that alternate the lit canvas (paper) and a dark stage; badge/search-only rows sit bare */
export function renderRows(rows, ctx, page, opts = {}) {
  let k = opts.start || 0;
  return (rows || []).map((r) => {
    const bl = allBlocks(r);
    if (!bl.length || bl.every((b) => b.t === 'crumbs')) return '';
    const bare = bl.every((b) => b.t === 'badges' || b.t === 'search' || b.t === 'crumbs' || b.t === 'divider');
    const glassy = bl.every((b) => ['locations', 'testimonials', 'badges', 'search', 'crumbs'].includes(b.t) || (b.t === 'team' && b.view !== 'complete'));
    const photo = r.bg && r.bg.kind === 'photo' && r.bg.image;
    const ground = bare ? 'bare' : photo ? 'photo' : glassy ? (k++, 'dark') : (k++ % 2 === 0 ? 'paper' : 'dark');
    const g2 = ground === 'paper' ? 'paper' : ground === 'bare' ? 'dark' : 'dark';
    const inner = groupsOf(r).map((g, gi) => {
      const cs = colsOf(g).filter((c) => (c.blocks || []).some((b) => b.t !== 'crumbs'));
      if (!cs.length) return '';
      const gc = cs.length > 1 ? ' style="--gc:' + cs.map((c) => 'minmax(0,' + (Number(c.w) || 50) + 'fr)').join(' ') + '"' : '';
      return '<div class="pg-group' + (gi === 0 ? ' pg-group--first' : '') + (cs.length > 1 ? ' pg-group--cols' : '') + '"' + gc + '>' + cs.map((c) => '<div class="pg-col' + (c.small ? ' pg-col--small' : '') + '">' + renderBlocks(c.blocks, ctx, page, { ground: g2 }) + '</div>').join('') + '</div>';
    }).join('');
    const cls = 'pg-row pg-row--' + ground + (ground === 'dark' || ground === 'photo' ? ' stage' : ground === 'paper' ? ' paper' : '') + (r.vis === 'desktop' ? ' pg-desk' : '');
    let back = '';
    if (ground === 'dark') back = pools('rim');
    if (ground === 'photo') back = '<div class="backdrop pg-row__photo"><div class="backdrop__media" aria-hidden="true">' + safeImg(ctx, r.bg.image, { alt: '', sizes: '(min-width: 1100px) 900px, 100vw', widths: [640, 960, 1280] }) + '</div><div class="backdrop__smoke"></div></div>' + pools('amber');
    return '<section class="' + cls + '"' + (ground === 'paper' ? ' data-reveal="up"' : '') + '>' + back + inner + '</section>';
  }).join('');
}
