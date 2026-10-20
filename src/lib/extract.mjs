// extract.mjs - ikiavisioncenter.com (EyeCarePro: WordPress + Beaver Builder `fl-module-ecp-*`) raw HTML -> page models
// (Node builtins only). Owner: orchestrator. Contract: docs/BUILD-CONTRACT.md 4.3.
//
// Page anatomy on this platform:
//   header widget (template 5: logo, address/phone callouts, menu)  -> site.json, never in a model
//   main#content: breadcrumb, then <article> with
//     .ecp-entry-header h1.ecp-entry-title  (library pages, posts, most inner pages)
//     .ecp-entry-content: plain WordPress HTML, which may hold shortcode widgets (.ecp-posts-wrapper-team|testimonial|
//       location|post, gravity forms) -> one row of blocks
//     or .fl-builder-content-primary: Beaver Builder rows -> groups -> cols -> modules -> rows of typed blocks
//   .ecp-widget-area: the global right sidebar (search, quick-link badges, location card) -> site.json sidebar
//   footer widget (template 4) -> site.json
// Copy is carried verbatim. Platform runtime (scripts, inline styles, splide/wow classes, the keyed Maps iframe,
// tracking) never reaches a model.
import { parse, findAll, findFirst, isEl, cls, hasCls, elChildren, textOf, squash, esc, escAttr, decode, htmlText } from './html-util.mjs';

export const ORIGIN = 'https://www.ikiavisioncenter.com';
const OWN = /^(?:https?:)?\/\/(?:www\.)?ikiavisioncenter\.com/i;

// Declared copy fixes (docs/DECISIONS.md D3): a template placeholder left on the live home page, resolved to the
// practice's own city as printed everywhere else on the site. Nothing else is ever rewritten.
const TOKEN_FIXES = [['[CITY]', 'Houston']];
const fixTokens = (s) => TOKEN_FIXES.reduce((a, [k, v]) => a.split(k).join(v), String(s));

/** an href found in the live HTML -> what the rebuild links to (own origin becomes root-relative) */
export function localHref(href, base = ORIGIN + '/') {
  let h = decode(String(href || '')).trim();
  if (!h || h === '#') return null;
  if (/^(mailto:|tel:|sms:)/i.test(h)) return h.replace(/\s+/g, '');
  if (/^javascript:/i.test(h)) return null;
  if (h.startsWith('#')) return h;
  let u;
  try { u = new URL(h, base); } catch { return h; }
  if (!/^https?:$/.test(u.protocol)) return h;
  if (OWN.test(u.protocol + '//' + u.host)) {
    let p = u.pathname.replace(/\/{2,}/g, '/');
    if (!/\.[a-z0-9]{2,5}$/i.test(p) && !p.endsWith('/')) p += '/';
    return p + (u.search && !/^\?s=/.test(u.search) ? u.search : '') + u.hash;
  }
  return u.toString();
}
export const isExternal = (h) => !!h && /^https?:\/\//i.test(h);
const absImg = (src, base) => { try { const u = new URL(decode(String(src)).trim(), base); if (OWN.test(u.protocol + '//' + u.host)) u.hostname = 'www.ikiavisioncenter.com'; u.protocol = 'https:'; return u.toString(); } catch { return null; } };
const imgSrcOf = (img) => img.attrs['data-src'] || img.attrs['data-lazy-src'] || img.attrs.src || '';

// ---------------------------------------------------------------- rich HTML (block level)
const BLOCK_KEEP = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'figure', 'figcaption', 'hr', 'dl', 'dt', 'dd', 'pre']);
const INLINE_KEEP = { a: 'a', strong: 'strong', b: 'strong', em: 'em', i: 'em', u: 'u', s: 's', sup: 'sup', sub: 'sub', small: 'small', mark: 'mark', code: 'code' };
const DROP = new Set(['script', 'style', 'noscript', 'template', 'svg', 'form', 'input', 'button', 'select', 'textarea', 'label', 'object', 'embed', 'canvas', 'link', 'meta', 'title', 'head']);

/**
 * Serialise a subtree's CHILDREN as clean block HTML. opts.base (page URL) resolves links and images.
 * Images become <img data-ref="<absolute live url>" alt="..."> placeholders; YouTube/Vimeo iframes become
 * <div data-video="<src>" data-title="..."></div>; every other iframe is dropped (the keyed Maps embed among them).
 */
export function richHtml(nodes, opts = {}) {
  const base = opts.base || ORIGIN + '/';
  let out = '';
  const rec = (x) => {
    if (!x) return;
    if (x.tag === '#text') { if (!x.raw) out += esc(fixTokens(decode(x.text))); return; }
    if (x.tag === '#comment' || DROP.has(x.tag)) return;
    if (x.tag === 'br') { out += '<br>'; return; }
    if (x.tag === 'img') {
      const src = absImg(imgSrcOf(x), base);
      if (src) out += '<img data-ref="' + escAttr(src) + '" alt="' + escAttr(decode(x.attrs.alt || '')) + '">';
      return;
    }
    if (x.tag === 'iframe') {
      const src = decode(x.attrs.src || x.attrs['data-src'] || '');
      if (/youtube(-nocookie)?\.com\/embed|player\.vimeo\.com/i.test(src)) out += '<div data-video="' + escAttr(src.startsWith('//') ? 'https:' + src : src) + '" data-title="' + escAttr(decode(x.attrs.title || '')) + '"></div>';
      return;
    }
    if (x.tag === 'i' && /\bfa[srlbd]?\b|\bfa-/.test(x.attrs.class || '') && !squash(textOf(x))) return;
    const idAttr = x.attrs.id && /^[A-Za-z][\w-]*$/.test(x.attrs.id) && !/^(field|input|gform|post|menu-item|choice|label)_?/.test(x.attrs.id) ? ' id="' + escAttr(x.attrs.id) + '"' : '';
    if (x.tag === 'a') {
      const href = localHref(x.attrs.href, base);
      if (!href) { if (x.attrs.name || x.attrs.id) out += '<span' + (idAttr || (x.attrs.name ? ' id="' + escAttr(x.attrs.name) + '"' : '')) + '></span>'; (x.children || []).forEach(rec); return; }
      let at = ' href="' + escAttr(href) + '"';
      if (isExternal(href)) at += ' target="_blank" rel="noopener"';
      if (x.attrs.title) at += ' title="' + escAttr(decode(x.attrs.title)) + '"';
      if (x.attrs['aria-label']) at += ' aria-label="' + escAttr(decode(x.attrs['aria-label'])) + '"';
      out += '<a' + at + idAttr + '>'; (x.children || []).forEach(rec); out += '</a>';
      return;
    }
    if (INLINE_KEEP[x.tag]) { const t = INLINE_KEEP[x.tag]; out += '<' + t + '>'; (x.children || []).forEach(rec); out += '</' + t + '>'; return; }
    if (x.tag === 'h1') { out += '<h2' + idAttr + '>'; (x.children || []).forEach(rec); out += '</h2>'; return; }
    if (BLOCK_KEEP.has(x.tag)) {
      let at = idAttr;
      if ((x.tag === 'td' || x.tag === 'th') && x.attrs.colspan) at += ' colspan="' + escAttr(x.attrs.colspan) + '"';
      if ((x.tag === 'td' || x.tag === 'th') && x.attrs.rowspan) at += ' rowspan="' + escAttr(x.attrs.rowspan) + '"';
      if (x.tag === 'ol' && x.attrs.start) at += ' start="' + escAttr(x.attrs.start) + '"';
      out += '<' + x.tag + at + '>'; (x.children || []).forEach(rec); out += x.tag === 'hr' ? '' : '</' + x.tag + '>';
      return;
    }
    // div, section, span, font, center, article, header, ... : unwrap; a div that only holds inline content becomes a <p>
    const kids = x.children || [];
    if (['div', 'section', 'article', 'center', 'header', 'footer', 'aside'].includes(x.tag) && kids.length && kids.every((k) => k.tag === '#text' || k.tag === 'br' || INLINE_KEEP[k.tag] || k.tag === 'span' || k.tag === 'font' || k.tag === 'img') && squash(textOf(x))) {
      out += '<p' + idAttr + '>'; kids.forEach(rec); out += '</p>';
      return;
    }
    if (idAttr && x.tag !== 'span') out += '<span' + idAttr + '></span>';
    kids.forEach(rec);
  };
  for (const n of nodes) rec(n);
  return tidy(out);
}
function tidy(h) {
  let s = h.replace(/[ \t\r\n\f\v]+/g, ' ').replace(/ /g, ' ');
  // empty inline wrappers and empty paragraphs (the live editor leaves many &nbsp; paragraphs)
  for (let k = 0; k < 3; k++) s = s.replace(/<(strong|em|u|s|small|mark|code|sup|sub)>\s*<\/\1>/g, ' ').replace(/<p>(\s|<br>|&nbsp;| )*<\/p>/g, '').replace(/<li>\s*<\/li>/g, '');
  s = s.replace(/<p>\s+/g, '<p>').replace(/\s+<\/p>/g, '</p>').replace(/(<br>\s*){3,}/g, '<br><br>').replace(/<p>(<br>\s*)+/g, '<p>').replace(/(<br>\s*)+<\/p>/g, '</p>');
  s = s.replace(/\s*(<\/?(?:p|h[2-6]|ul|ol|li|blockquote|table|thead|tbody|tr|td|th|figure|figcaption|dl|dt|dd)\b[^>]*>)\s*/g, '$1');
  return s.trim();
}
const inline = (n, base) => richHtml(n ? n.children || [] : [], { base }).replace(/^<p>([\s\S]*)<\/p>$/, '$1');

// ---------------------------------------------------------------- widgets (shared by builder modules and entry content)
const postsOf = (w) => findAll(w, (n) => hasCls(n, 'ecp-post'));
function testimonials(w, base) {
  return postsOf(w).map((p) => {
    const content = findFirst(p, (n) => hasCls(n, 'ecp-post-content'));
    const name = findFirst(p, (n) => hasCls(n, 'ecp-post-attribute'));
    const rating = findAll(p, (n) => hasCls(n, 'ecp-rating-star-full')).length || null;
    const img = findFirst(p, (n) => n.tag === 'img');
    return { html: content ? richHtml(content.children, { base }) || esc(squash(textOf(content))) : '', name: name ? squash(textOf(name)).replace(/^-\s*/, '') : '', rating, photo: img ? absImg(imgSrcOf(img), base) : null };
  }).filter((t) => htmlText(t.html)).concat(reviews(w, base));
}
function team(w, base) {
  return postsOf(w).map((p) => {
    const t = findFirst(p, (n) => hasCls(n, 'ecp-post-title'));
    const a = t && findFirst(t, (n) => n.tag === 'a');
    const img = findFirst(p, (n) => n.tag === 'img');
    const content = findFirst(p, (n) => hasCls(n, 'ecp-post-content'));
    const role = findFirst(p, (n) => /ecp-post-(position|subtitle|role|meta-position)/.test(n.attrs.class || ''));
    return { name: t ? squash(textOf(t)) : '', role: role ? squash(textOf(role)) || null : null, photo: img ? absImg(imgSrcOf(img), base) : null, photoAlt: img ? decode(img.attrs.alt || '') : '', href: a ? localHref(a.attrs.href, base) : null, html: content ? richHtml(content.children, { base }) : '' };
  }).filter((m) => m.name || m.photo || htmlText(m.html));
}
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function locations(w, base) {
  return postsOf(w).map((p) => {
    const title = findFirst(p, (n) => hasCls(n, 'ecp-post-title') || hasCls(n, 'ecp-location-title') || /^h[2-4]$/.test(n.tag));
    const a = title && findFirst(title, (n) => n.tag === 'a');
    const txt = textOf(p, { skip: (n) => hasCls(n, 'ecp-post-subheading') }).split('\n').map(squash).filter(Boolean);
    const hours = [];
    const items = findAll(p, (n) => hasCls(n, 'ecp-post-hours-item'));
    if (items.length) {
      for (const it of items) { const l = findFirst(it, (n) => hasCls(n, 'ecp-post-label')); const d = findFirst(it, (n) => hasCls(n, 'ecp-post-data')); hours.push({ day: l ? squash(textOf(l)).replace(/:$/, '') : '', time: d ? squash(textOf(d)) : '' }); }
    } else {
      for (const d of DAYS) {
        const i = txt.findIndex((l) => l.replace(/:$/, '') === d || l.startsWith(d + ':'));
        if (i < 0) continue;
        const same = /^[A-Za-z]+:\s*\S/.test(txt[i]) && txt[i].replace(/^[A-Za-z]+:\s*/, '');
        hours.push({ day: d, time: same || txt[i + 1] || '' });
      }
    }
    const tel = findFirst(p, (n) => n.tag === 'a' && /^tel:/i.test(n.attrs.href || ''));
    const name = title ? squash(textOf(title)) : null;
    const addrEl = findFirst(p, (n) => hasCls(n, 'ecp-post-address'));
    let address;
    if (addrEl) address = textOf(addrEl, { skip: (n) => hasCls(n, 'ecp-post-subheading') }).split('\n').map(squash).filter(Boolean);
    else { const phoneIdx = txt.findIndex((l) => /^Phone:?/i.test(l)); address = txt.slice(name ? txt.indexOf(name) + 1 : 0, phoneIdx > 0 ? phoneIdx : undefined).filter((l) => !/^(Phone|Hours|Contact Details|Address)/i.test(l) && !DAYS.some((d) => l.startsWith(d))).slice(0, 3); }
    const content = findFirst(p, (n) => hasCls(n, 'ecp-post-content'));
    // payment block: the methods are theme icons (never harvested: platform images); carry their alt text as labels
    const pay = findFirst(p, (n) => hasCls(n, 'ecp-post-paymentinfo'));
    let payment = null;
    if (pay) {
      const methods = findAll(pay, (n) => n.tag === 'img' && /payment-icons/.test(n.attrs.src || '')).map((i) => decode(i.attrs.alt || '')).filter(Boolean);
      const sub = findFirst(pay, (n) => hasCls(n, 'ecp-post-subheading'));
      const rest = richHtml((pay.children || []).filter((k) => k !== sub && !(isEl(k) && hasCls(k, 'ecp-post-paymentinfo-methods'))), { base });
      const lead = findFirst(pay, (n) => n.tag === 'strong');
      payment = { title: sub ? squash(textOf(sub)) : 'Payment Information', label: lead ? squash(textOf(lead)) : null, methods, html: rest };
    }
    const labels = findAll(p, (n) => hasCls(n, 'ecp-post-subheading')).map((n) => squash(textOf(n))).filter(Boolean);
    return { name, address, phone: tel ? squash(textOf(tel)) || tel.attrs.href.replace(/^tel:/i, '') : null, tel: tel ? tel.attrs.href.replace(/\s+/g, '') : null, hours, href: a ? localHref(a.attrs.href, base) : null, html: content ? richHtml(content.children, { base }) : '', payment, labels };
  }).filter((l) => l.name || l.hours.length || l.address.length);
}
function childpages(w, base) {
  return findAll(w, (n) => n.tag === 'li' && hasCls(n, 'ecp-childpages-link')).map((li) => {
    const t = findFirst(li, (n) => n.tag === 'div' && hasCls(n, 'ecp-childpages-link'));
    const a = t ? findFirst(t, (n) => n.tag === 'a') : findFirst(li, (n) => n.tag === 'a' && squash(textOf(n)));
    const s = findFirst(li, (n) => hasCls(n, 'ecp-childpages-summary'));
    const imgWrap = findFirst(li, (n) => hasCls(n, 'ecp-childpages-image'));
    const img = imgWrap && findFirst(imgWrap, (n) => n.tag === 'img');
    return { title: a ? squash(textOf(a)) : '', href: a ? localHref(a.attrs.href, base) : null, summary: s ? squash(textOf(s)) : '', image: img ? absImg(imgSrcOf(img), base) : null, imageAlt: img ? decode(img.attrs.alt || '') : '' };
  }).filter((i) => i.title);
}
function reviews(w, base) {
  return findAll(w, (n) => hasCls(n, 'ecp-review')).map((r) => {
    const c = findFirst(r, (n) => hasCls(n, 'ecp-review-comment'));
    const nm = findFirst(r, (n) => hasCls(n, 'ecp-review-name'));
    const tm = findFirst(r, (n) => hasCls(n, 'ecp-rating-time'));
    return { html: c ? richHtml(c.children, { base }) : '', name: nm ? squash(textOf(nm)).replace(/^-\s*/, '') : '', rating: findAll(r, (n) => hasCls(n, 'ecp-rating-star-full')).length || null, when: tm ? squash(textOf(tm)) : null, photo: null };
  }).filter((t) => htmlText(t.html) || t.name);
}
function postList(w, base) {
  return postsOf(w).map((p) => {
    const t = findFirst(p, (n) => hasCls(n, 'ecp-post-title'));
    const a = t && findFirst(t, (n) => n.tag === 'a');
    const date = findFirst(p, (n) => hasCls(n, 'ecp-post-date'));
    const content = findFirst(p, (n) => hasCls(n, 'ecp-post-content'));
    const img = findFirst(p, (n) => n.tag === 'img');
    return { path: a ? localHref(a.attrs.href, base) : null, title: t ? squash(textOf(t)) : '', date: date ? squash(textOf(date)) : null, excerpt: content ? squash(textOf(content)) : '', image: img ? absImg(imgSrcOf(img), base) : null };
  }).filter((p) => p.title);
}
function gform(w, base) {
  const form = findFirst(w, (n) => n.tag === 'form');
  const title = findFirst(w, (n) => hasCls(n, 'gform_title'));
  const desc = findFirst(w, (n) => hasCls(n, 'gform_description'));
  const fields = [];
  for (const f of findAll(w, (n) => hasCls(n, 'gfield'))) {
    const tcls = cls(f).find((c) => c.startsWith('gfield--type-') && c !== 'gfield--type-choice');
    const type = tcls ? tcls.slice(13) : 'text';
    if (cls(f).includes('gfield_visibility_hidden') || type === 'hidden' || type === 'honeypot' || type === 'captcha') continue;
    const label = findFirst(f, (n) => hasCls(n, 'gfield_label') || hasCls(n, 'gsection_title'));
    const required = !!findFirst(f, (n) => hasCls(n, 'gfield_required'));
    const descN = findFirst(f, (n) => hasCls(n, 'gfield_description') && !hasCls(n, 'validation_message'));
    const field = { type, label: label ? squash(textOf(label, { skip: (n) => hasCls(n, 'gfield_required') })) : '', required };
    if (descN) field.description = inline(descN, base);
    if (type === 'html') { field.html = richHtml(f.children, { base }); delete field.label; }
    if (type === 'section') field.html = descN ? inline(descN, base) : '';
    const choices = findAll(f, (n) => hasCls(n, 'gchoice'));
    if (choices.length) field.options = choices.map((c) => squash(textOf(c))).filter(Boolean);
    const sel = findFirst(f, (n) => n.tag === 'select');
    if (sel) field.options = findAll(sel, (n) => n.tag === 'option').map((o) => squash(textOf(o))).filter(Boolean);
    const subs = findAll(f, (n) => n.tag === 'span' && /ginput_(left|right|full)|name_|address_/.test(n.attrs.class || '') && findFirst(n, (k) => k.tag === 'label'));
    if (subs.length > 1) field.sub = subs.map((s) => { const inp = findFirst(s, (k) => ['input', 'select', 'textarea'].includes(k.tag)); const l = findFirst(s, (k) => k.tag === 'label'); return { label: l ? squash(textOf(l)) : '', type: inp ? (inp.tag === 'input' ? inp.attrs.type || 'text' : inp.tag) : 'text' }; });
    const inp = findFirst(f, (n) => n.tag === 'input' && !['hidden', 'radio', 'checkbox'].includes(n.attrs.type || 'text'));
    if (inp && !field.sub) field.inputType = inp.attrs.type || 'text';
    if (findFirst(f, (n) => n.tag === 'textarea')) field.inputType = 'textarea';
    fields.push(field);
  }
  const submit = findFirst(w, (n) => (n.tag === 'input' && n.attrs.type === 'submit') || (n.tag === 'button' && n.attrs.type === 'submit'));
  return { t: 'form', id: form ? form.attrs.id || null : null, title: title ? squash(textOf(title)) : null, html: desc ? inline(desc, base) : null, fields, submit: submit ? decode(submit.attrs.value || squash(textOf(submit)) || 'Submit') : 'Submit' };
}
/** the widget type of a node, or null */
function widgetKind(n) {
  const c = cls(n);
  if (c.includes('ecp-posts-wrapper-testimonial')) return 'testimonials';
  if (c.includes('ecp-posts-wrapper-team')) return 'team';
  if (c.includes('ecp-posts-wrapper-location')) return 'locations';
  if (c.includes('ecp-posts-wrapper-post')) return 'posts';
  if (c.includes('gform_wrapper')) return 'form';
  if (c.includes('ecp-childpages')) return 'childpages';
  return null;
}
function widgetBlock(kind, n, base) {
  const view = cls(n).includes('ecp-view-complete') ? 'complete' : 'summary';
  if (kind === 'testimonials') { const items = testimonials(n, base); return items.length ? { t: 'testimonials', view, items } : null; }
  if (kind === 'team') { const items = team(n, base); return items.length ? { t: 'team', view, items } : null; }
  if (kind === 'locations') { const items = locations(n, base); return items.length ? { t: 'locations', view, items } : null; }
  if (kind === 'childpages') { const items = childpages(n, base); return items.length ? { t: 'childpages', items } : null; }
  if (kind === 'posts') { const items = postList(n, base); return items.length ? { t: 'posts', items } : null; }
  if (kind === 'form') return gform(n, base);
  return null;
}
/**
 * a content container -> blocks: rich html runs, split around widgets and video embeds.
 * opts.skip(node) prunes a subtree (the entry header, the builder content handled elsewhere).
 */
export function contentBlocks(container, base, opts = {}) {
  const blocks = [];
  let buf = [];
  const flush = () => { if (!buf.length) return; const html = richHtml(buf, { base }); buf = []; if (htmlText(html) || /<img |data-video/.test(html)) blocks.push({ t: 'rich', html }); };
  const visit = (nodes) => {
    for (const x of nodes) {
      if (!isEl(x)) { buf.push(x); continue; }
      if (opts.skip && opts.skip(x)) continue;
      if (DROP.has(x.tag) && x.tag !== 'form') continue;
      const k = widgetKind(x);
      if (k) { flush(); const b = widgetBlock(k, x, base); if (b) blocks.push(b); continue; }
      const nested = findFirst(x, (n) => n !== x && (!!widgetKind(n) || (opts.skip && opts.skip(n))));
      if (nested && x.tag !== 'p') { visit(x.children || []); continue; }
      buf.push(x);
    }
  };
  visit(container.children || []);
  flush();
  return blocks;
}

// ---------------------------------------------------------------- Beaver Builder modules
const moduleType = (m) => { const c = cls(m).find((x) => x.startsWith('fl-module-') && x !== 'fl-module-content'); return c ? c.slice(10) : 'unknown'; };
export function moduleBlocks(m, base) {
  const type = moduleType(m);
  const content = findFirst(m, (n) => hasCls(n, 'fl-module-content')) || m;
  const wk = findFirst(content, (n) => !!widgetKind(n));
  switch (type) {
    case 'ecp-heading': {
      const h = findFirst(content, (n) => /^h[1-6]$/.test(n.tag)) || findFirst(content, (n) => hasCls(n, 'ecp-heading'));
      if (!h || !squash(textOf(h))) return [];
      return [{ t: 'heading', level: /^h[1-6]$/.test(h.tag) ? Number(h.tag[1]) : 2, html: inline(h, base) }];
    }
    case 'ecp-richtext': case 'rich-text': {
      if (wk) return contentBlocks(content, base);
      const html = richHtml(content.children, { base });
      return htmlText(html) || /<img /.test(html) ? [{ t: 'rich', html }] : [];
    }
    case 'ecp-button': {
      const a = findFirst(content, (n) => n.tag === 'a');
      if (!a) return [];
      const href = localHref(a.attrs.href, base);
      return [{ t: 'button', text: squash(textOf(a)), href, external: isExternal(href) }];
    }
    case 'ecp-callout': {
      const imgry = findFirst(content, (n) => hasCls(n, 'ecp-callout-imagery'));
      const img = imgry && findFirst(imgry, (n) => n.tag === 'img');
      const icon = imgry && findFirst(imgry, (n) => n.attrs['data-icon']);
      const a = findFirst(content, (n) => n.tag === 'a' && n.attrs.href && n.attrs.href !== '#');
      const title = findFirst(content, (n) => hasCls(n, 'ecp-callout-title'));
      const body = findFirst(content, (n) => hasCls(n, 'ecp-callout-content'));
      const href = a ? localHref(a.attrs.href, base) : null;
      return [{ t: 'callout', title: title ? squash(textOf(title)) : null, html: body ? richHtml(body.children, { base }) : '', href, external: isExternal(href), image: img ? absImg(imgSrcOf(img), base) : null, imageAlt: img ? decode(img.attrs.alt || '') : '', icon: icon ? icon.attrs['data-icon'] : null }];
    }
    case 'ecp-image': {
      const img = findFirst(content, (n) => n.tag === 'img');
      if (!img) return [];
      const a = findFirst(content, (n) => n.tag === 'a');
      const cap = findFirst(content, (n) => n.tag === 'figcaption' || hasCls(n, 'ecp-image-caption'));
      const href = a ? localHref(a.attrs.href, base) : null;
      return [{ t: 'image', src: absImg(imgSrcOf(img), base), alt: decode(img.attrs.alt || ''), href, external: isExternal(href), caption: cap ? squash(textOf(cap)) : null }];
    }
    case 'ecp-gallery': {
      const items = findAll(content, (n) => hasCls(n, 'ecp-gallery-item')).map((it) => {
        const img = findFirst(it, (n) => n.tag === 'img'); const a = findFirst(it, (n) => n.tag === 'a'); const cap = findFirst(it, (n) => hasCls(n, 'ecp-gallery-item-caption'));
        const href = a ? localHref(a.attrs.href, base) : null;
        return { src: img ? absImg(imgSrcOf(img), base) : null, alt: img ? decode(img.attrs.alt || '') : '', title: cap ? squash(textOf(cap)) : null, href, external: isExternal(href) };
      }).filter((i) => i.src || i.title);
      return items.length ? [{ t: 'gallery', items }] : [];
    }
    case 'ecp-carousel': {
      const items = findAll(content, (n) => hasCls(n, 'ecp-carousel-item')).map((it) => {
        const img = findFirst(it, (n) => n.tag === 'img'); const a = findFirst(it, (n) => n.tag === 'a'); const cap = findFirst(it, (n) => /caption|title/.test(n.attrs.class || ''));
        const href = a ? localHref(a.attrs.href, base) : null;
        return { src: img ? absImg(imgSrcOf(img), base) : null, alt: img ? decode(img.attrs.alt || '') : '', title: cap ? squash(textOf(cap)) : null, href, external: isExternal(href) };
      }).filter((i) => i.src);
      return items.length ? [{ t: 'carousel', items }] : [];
    }
    case 'ecp-accordion': {
      const items = findAll(content, (n) => hasCls(n, 'ecp-accordion-item')).map((it) => {
        const q = findFirst(it, (n) => hasCls(n, 'ecp-accordion-trigger-label')); const a = findFirst(it, (n) => hasCls(n, 'ecp-accordion-content'));
        return { q: q ? squash(textOf(q)) : '', html: a ? richHtml(a.children, { base }) : '' };
      }).filter((i) => i.q);
      return items.length ? [{ t: 'accordion', items }] : [];
    }
    case 'ecp-badges': {
      const items = findAll(content, (n) => hasCls(n, 'ecp-badge')).map((b) => {
        const t = findFirst(b, (n) => hasCls(n, 'ecp-badge-title')); const ic = findFirst(b, (n) => n.attrs['data-icon']);
        const href = localHref(b.attrs.href, base);
        return { label: t ? squash(textOf(t)) : decode(b.attrs['aria-label'] || ''), href, external: isExternal(href), icon: ic ? ic.attrs['data-icon'] : null };
      }).filter((i) => i.label);
      return items.length ? [{ t: 'badges', items }] : [];
    }
    case 'ecp-list-testimonials': case 'ecp-list-team': case 'ecp-list-locations': case 'ecp-list-posts': case 'ecp-posts': {
      const w = findFirst(content, (n) => !!widgetKind(n));
      const b = w ? widgetBlock(widgetKind(w), w, base) : null;
      return b ? [b] : [];
    }
    case 'ecp-html': {
      if (wk) return contentBlocks(content, base);
      const html = richHtml(content.children, { base });
      return htmlText(html) || /<img |data-video/.test(html) ? [{ t: 'html', html }] : [];
    }
    case 'ecp-divider': return [{ t: 'divider' }];
    case 'ecp-search': return [{ t: 'search' }];
    case 'ecp-video': case 'video': {
      const f = findFirst(content, (n) => n.tag === 'iframe');
      const src = f ? decode(f.attrs.src || f.attrs['data-src'] || '') : '';
      return src ? [{ t: 'video', src: src.startsWith('//') ? 'https:' + src : src, title: decode((f && f.attrs.title) || '') }] : [];
    }
    default: {
      if (wk) return contentBlocks(content, base);
      const html = richHtml(content.children, { base });
      return htmlText(html) ? [{ t: 'unknown', module: type, html }] : [];
    }
  }
}

function rowOf(row, base) {
  const c = cls(row);
  const vis = c.includes('fl-visible-mobile') && !c.includes('fl-visible-desktop') ? 'mobile' : c.includes('fl-visible-desktop') && !c.includes('fl-visible-mobile') ? 'desktop' : 'all';
  const bgImg = row.attrs['data-background-image-src'];
  const bg = c.includes('fl-row-bg-photo') && bgImg ? { kind: 'photo', image: absImg(bgImg, base), overlay: c.includes('fl-row-bg-overlay') } : c.includes('fl-row-bg-color') ? { kind: 'color' } : { kind: 'none' };
  const groups = [];
  const content = findFirst(row, (n) => hasCls(n, 'fl-row-content')) || row;
  for (const g of elChildren(content).filter((n) => hasCls(n, 'fl-col-group'))) {
    const colsEls = elChildren(g).filter((n) => hasCls(n, 'fl-col'));
    const cols = colsEls.map((col) => {
      const mods = findAll(col, (n) => hasCls(n, 'fl-module'));
      const blocks = mods.flatMap((m) => moduleBlocks(m, base));
      return { w: Math.round(100 / colsEls.length), small: hasCls(col, 'fl-col-small'), blocks };
    }).filter((col) => col.blocks.length);
    if (cols.length) groups.push({ cols });
  }
  return { id: row.attrs['data-node'] || null, vis, bg, groups };
}

// ---------------------------------------------------------------- head
function headOf(root) {
  const head = findFirst(root, (n) => n.tag === 'head') || root;
  const meta = (k, v) => { const m = findFirst(head, (n) => n.tag === 'meta' && n.attrs[k] === v); return m ? decode(m.attrs.content || '') : null; };
  const t = findFirst(head, (n) => n.tag === 'title');
  const canon = findFirst(head, (n) => n.tag === 'link' && n.attrs.rel === 'canonical');
  const og = {};
  for (const m of findAll(head, (n) => n.tag === 'meta' && /^(og:|twitter:|article:)/.test(n.attrs.property || n.attrs.name || ''))) og[m.attrs.property || m.attrs.name] = decode(m.attrs.content || '');
  const jsonld = [];
  for (const s of findAll(root, (n) => n.tag === 'script' && n.attrs.type === 'application/ld+json')) {
    const raw = (s.children || []).map((k) => k.text || '').join('');
    try { jsonld.push(JSON.parse(raw)); } catch { /* skip unparsable */ }
  }
  return { title: t ? squash(decode((t.children || []).map((k) => k.text || '').join(''))) : '', description: meta('name', 'description'), canonical: canon ? canon.attrs.href : null, robots: meta('name', 'robots'), og, jsonld };
}

// ---------------------------------------------------------------- page
/**
 * raw html + its final URL -> page model (without crumbs/children: tools/extract.mjs adds those from the whole set).
 */
export function extractPage(html, url) {
  const root = parse(html);
  const u = new URL(url);
  const path = u.pathname;
  const base = url;
  const head = headOf(root);
  const main = findFirst(root, (n) => n.tag === 'main') || root;
  const article = findFirst(main, (n) => n.tag === 'article') || main;
  const h1el = findFirst(article, (n) => hasCls(n, 'ecp-entry-title')) || findFirst(main, (n) => n.tag === 'h1');
  // builder rows live in .fl-builder-content-primary, or (on some hub pages) straight inside the entry content
  const primary = findFirst(article, (n) => hasCls(n, 'fl-builder-content-primary')) || (findFirst(article, (n) => hasCls(n, 'fl-row')) ? findFirst(article, (n) => hasCls(n, 'ecp-entry-content')) : null);
  const entry = findFirst(article, (n) => hasCls(n, 'ecp-entry-content'));
  const postWrap = findFirst(article, (n) => hasCls(n, 'ecp-posts-wrapper-post') && hasCls(n, 'ecp-view-complete'));
  const isPost = cls(article).includes('type-post');
  const crumbEl = findFirst(main, (n) => /breadcrumb/.test(n.attrs.class || '') || n.attrs.id === 'breadcrumbs');
  let rows = [];
  let date = null;
  let kind = path === '/' ? 'home' : isPost ? 'post' : 'page';
  const oneRow = (id, blocks) => ({ id, vis: 'all', bg: { kind: 'none' }, groups: [{ cols: [{ w: 100, small: false, blocks }] }] });
  const isHeader = (n) => hasCls(n, 'ecp-entry-header');
  if (primary) {
    const rowEls = findAll(primary, (n) => hasCls(n, 'fl-row') && !hasAncestorRow(n, primary));
    rows = rowEls.map((r) => rowOf(r, base)).filter((r) => r.groups.length);
    // the rest of the article (child-page lists, widgets, text) after the builder content
    const rest = contentBlocks(article, base, { skip: (n) => isHeader(n) || n === primary || (hasCls(n, 'fl-row') && !hasAncestorRow(n, article)) });
    if (rest.length) rows.push(oneRow('after-builder', rest));
    // a breadcrumb typed into a rich-text module duplicates the template's own crumbs: mark it, never print it twice
    for (const r of rows) for (const g of r.groups) for (const c of g.cols) c.blocks = c.blocks.map((b) => (b.t === 'rich' && /^Home\s*»/.test(htmlText(b.html)) && htmlText(b.html).length < 120 ? { t: 'crumbs', text: htmlText(b.html) } : b));
  } else if (isPost && postWrap) {
    const d = findFirst(postWrap, (n) => hasCls(n, 'ecp-post-date'));
    date = d ? squash(textOf(d)) : null;
    const c = findFirst(postWrap, (n) => hasCls(n, 'ecp-post-content'));
    rows = [oneRow('content', c ? contentBlocks(c, base) : [])];
    const rest = contentBlocks(article, base, { skip: (n) => isHeader(n) || n === postWrap });
    if (rest.length) rows.push(oneRow('after-post', rest));
  } else {
    rows = [oneRow('content', contentBlocks(article, base, { skip: isHeader }))];
  }
  void entry;
  // drop mobile-only duplicate rows whose words all appear in the other rows (the platform's phone copies)
  const words = (r) => new Set(htmlText(JSON.stringify(r.groups).replace(/\\"/g, '"')).toLowerCase().match(/[a-z0-9']+/g) || []);
  const others = new Set(rows.filter((r) => r.vis !== 'mobile').flatMap((r) => [...words(r)]));
  const dropped = [];
  rows = rows.filter((r) => { if (r.vis !== 'mobile') return true; const w = [...words(r)]; const dup = w.every((x) => others.has(x)); if (dup) dropped.push(r.id); return !dup; });
  // hero: the first photo row of a builder page (its photo + its headings/text/buttons)
  let hero = null;
  if (primary && rows.length && rows[0].bg.kind === 'photo') {
    const r = rows.shift();
    const blocks = r.groups.flatMap((g) => g.cols.flatMap((c) => c.blocks));
    hero = { image: r.bg.image, overlay: r.bg.overlay, blocks };
  }
  const h1 = h1el ? squash(textOf(h1el)) : '';
  const isBlogIndex = rows.some((r) => r.groups.some((g) => g.cols.some((c) => c.blocks.some((b) => b.t === 'posts')))) && !isPost;
  if (isBlogIndex) kind = 'blog';
  if (rows.some((r) => r.groups.some((g) => g.cols.some((c) => c.blocks.some((b) => b.t === 'form'))))) kind = kind === 'page' ? 'form' : kind;
  if (kind === 'page' && !primary && /tag-all-about-vision|type-page/.test(article.attrs.class || '') && /\/(your-eye-health|eyeglass-basics|prescription-eyeglasses|specialty-eyewear|lens-treatments|transitions-lenses|sunglasses|eye-conditions-info|contact-lens-basics)\//.test(path)) kind = 'article';
  const liveCrumbs = crumbEl ? findAll(crumbEl, (n) => n.tag === 'a').map((a) => ({ name: squash(textOf(a)), path: localHref(a.attrs.href, base) })) : null;
  return {
    path, url: ORIGIN + path, kind, section: path.split('/').filter(Boolean)[0] || '',
    title: head.title, h1, head,
    liveCrumbs, hero, rows, date,
    removed: dropped.length ? { mobileDuplicateRows: dropped } : undefined,
  };
}
function hasAncestorRow(n, stop) { for (let x = n.parent; x && x !== stop; x = x.parent) if (hasCls(x, 'fl-row')) return true; return false; }

/** the global sidebar (right widget area) of any inner page -> { search, badges, location } */
export function extractSidebar(html, url) {
  const root = parse(html);
  const area = findFirst(root, (n) => hasCls(n, 'ecp-widget-area'));
  if (!area) return null;
  const blocks = [];
  for (const w of elChildren(area)) {
    if (cls(w).includes('widget_search')) { blocks.push({ t: 'search', label: squash(textOf(w)).replace(/\s*Search$/, '') }); continue; }
    const badges = findAll(w, (n) => hasCls(n, 'ecp-badges'));
    for (const b of badges) blocks.push(...moduleBlocks({ tag: 'div', attrs: { class: 'fl-module fl-module-ecp-badges' }, children: [b], parent: null }, url));
    const loc = findFirst(w, (n) => hasCls(n, 'ecp-posts-wrapper-location'));
    if (loc) { const b = widgetBlock('locations', loc, url); if (b) blocks.push(b); }
    if (!badges.length && !loc) { const html = richHtml(w.children, { base: url }); if (htmlText(html)) blocks.push({ t: 'rich', html }); }
  }
  return blocks;
}

/** all visible words of a page's main content in the RAW html (the recall yardstick for tools/extract.mjs) */
export function rawMainText(html) {
  const root = parse(html);
  const main = findFirst(root, (n) => n.tag === 'main') || root;
  const article = findFirst(main, (n) => n.tag === 'article') || main;
  return textOf(article, { skip: (n) => n.tag === 'form' || hasCls(n, 'gform_wrapper') || hasCls(n, 'ecp-entry-header') || /fl-visible-mobile/.test(n.attrs.class || '') && !/fl-visible-desktop/.test(n.attrs.class || '') });
}
