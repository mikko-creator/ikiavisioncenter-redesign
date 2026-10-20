// inner.mjs - INNER lane: every page except home (BUILD-CONTRACT 4.3). innerPage(page, ctx) -> the inside of <main>.
// Templates: builder page (hubs, about, location), article, post, blog, form, sitemap. Every one opens with the HERO
// BAND (dark stage, section art back plane, the page's real photo in an iris frame, crumbs, the single <h1>), then a
// dark stage body: a main column of lit paper / dark panels plus the global sidebar as a sticky glass aside.
import fs from 'node:fs';
import { esc, attr, strip, ICON } from './util.mjs';
import { btn, pools, cutout, loopOrStill, sectionArt, safeImg, irisRing, seam } from './parts.mjs';
import { renderRows, renderBlocks, richHtml, childCards, formBlock, plain } from './blocks.mjs';

const TEXT = new Set(['heading', 'rich', 'button', 'html', 'unknown', 'crumbs']);
const norm = (s) => strip(s).toLowerCase().replace(/&[a-z#0-9]+;/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const isCaps = (s) => { const t = strip(s); return /[A-Z]/.test(t) && !/[a-z]/.test(t); };
const ico = (name, cls = 'i') => '<span class="' + cls + '">' + (ICON[name] || '') + '</span>';
const label = (p) => { const h = String((p && p.h1) || '').trim(); return h && /[a-z]/.test(h) ? h : String((p && p.title) || h).split(' | ')[0].trim() || h; };
const parentOf = (p) => p.replace(/[^/]+\/$/, '');
const blocksOf = (rows) => (rows || []).flatMap((r) => (r.groups || [{ cols: r.cols || [] }]).flatMap((g) => (g.cols || []).flatMap((c) => c.blocks || [])));

function art(page) {
  if (/^\/team\//.test(page.path)) return 'G-TEAM-BG';
  if (/^\/location\//.test(page.path)) return 'G-LIGHT';
  return sectionArt(page);
}
const h1Text = (page) => String(page.h1 || '').trim() || String((page.head && page.head.title) || page.title || '').split(' | ')[0].trim();
function accent(text) {
  const t = esc(text).trim();
  const i = t.lastIndexOf(' ');
  return i > 0 ? t.slice(0, i) + ' <em>' + t.slice(i + 1) + '</em>' : '<em>' + t + '</em>';
}

function crumbs(page) {
  const list = page.crumbs || [];
  if (list.length < 2) return '';
  return '<nav class="pg-crumbs" aria-label="Breadcrumb"><ol>' + list.map((c, i) => (i === list.length - 1
    ? '<li><span aria-current="page">' + esc(c.name) + '</span></li>'
    : '<li><a href="' + attr(c.path) + '">' + esc(c.name) + '</a></li>')).join('') + '</ol></nav>';
}

/** the hero band; returns { html, spill } where spill = hero blocks that are not hero text (rendered at the top of the content) */
function hero(page, ctx, o = {}) {
  const h1 = h1Text(page);
  const pane = [];
  const spill = [];
  for (const b of (page.hero && page.hero.blocks) || []) { if (!spill.length && TEXT.has(b.t)) pane.push(b); else spill.push(b); }
  const kick = pane.filter((b) => b.t === 'heading' && norm(b.html) !== norm(h1));
  const rich = pane.filter((b) => b.t === 'rich' || b.t === 'html' || b.t === 'unknown')
    .map((b) => String(b.html || '').replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g, (m, l, t) => (norm(t) === norm(h1) ? '' : m)))
    .filter((h) => strip(h)).map((h) => richHtml(h, ctx)).join('');
  const buttons = pane.filter((b) => b.t === 'button');
  const photo = page.hero && page.hero.image;
  const slot = art(page);
  let media = '';
  if (photo) {
    media = '<div class="pg-hero__media">' + irisRing('pg-hero__ring')
      + '<figure class="frame pg-hero__photo" data-reveal="iris">' + safeImg(ctx, photo, { alt: '', sizes: '(min-width: 1100px) 440px, (min-width: 700px) 40vw, 86vw', widths: [480, 640, 960, 1280], loading: 'eager', fetchpriority: 'high' }) + '</figure></div>';
  }
  const html = '<section class="section stage spotlight pg-hero' + (photo ? ' pg-hero--photo' : '') + (o.cls ? ' ' + o.cls : '') + '">'
    + loopOrStill(ctx, null, slot, { eager: true, depth: 0.12, pos: '62% 45%', cls: 'pg-hero__back' }) + pools('key')
    + '<div class="wrap pg-hero__in">'
    + '<div class="pg-hero__copy" data-reveal="up">' + crumbs(page)
    + (kick.length ? '<p class="pg-kicker">' + kick.map((b) => '<span>' + plain(b.html) + '</span>').join('') + '</p>' : '')
    + (o.date ? '<p class="pg-hero__date"><span class="chip chip--amber">' + ico('calendar') + '<time>' + esc(o.date) + '</time></span></p>' : '')
    + '<h1 class="display pg-h1' + (isCaps(h1) ? ' pg-caps' : '') + (h1.length > 42 ? ' pg-h1--long' : '') + '">' + accent(h1) + '</h1>'
    + (rich ? '<div class="pg-hero__lede">' + rich + '</div>' : '')
    + (buttons.length ? '<p class="btns pg-hero__btns">' + buttons.map((b, i) => btn(b.text, b.href, i === 0 ? 'amber' : 'glass')).join('') + '</p>' : '')
    + '</div>' + media + '</div></section>';
  return { html, spill };
}

/** extra light pools spaced down a long body stage, so the sticky glass aside always has light behind it */
function longPools() {
  const P = [['amber', 'right:-16%;top:-8%'], ['teal', 'left:-24%;top:22%'], ['amber', 'right:-22%;top:48%'], ['teal', 'left:-18%;top:72%'], ['amber', 'right:-14%;bottom:-10%']];
  return '<div class="pools pg-pools" aria-hidden="true">' + P.map(([k, s]) => '<span class="pool pool--' + k + ' pool--sm pg-pool" style="' + s + '"></span>').join('') + '</div>';
}

/** the global sidebar (search, badges, the clinic card), minus block types the page already shows */
function aside(page, ctx, own) {
  const have = new Set(own.map((b) => b.t));
  const sb = (ctx.site.sidebar || []).filter((b) => !have.has(b.t));
  if (!sb.length) return '';
  return '<aside class="pg-aside" aria-label="' + attr(ctx.site.name || 'Sidebar') + '"><div class="glass pg-aside__in">' + renderBlocks(sb, ctx, page, { ground: 'aside' }) + '</div></aside>';
}

function body(main, side, cls = '') {
  return '<section class="section stage pg-body' + (cls ? ' ' + cls : '') + '">' + longPools()
    + '<div class="wrap pg-layout' + (side ? '' : ' pg-layout--solo') + '"><div class="pg-main">' + main + '</div>' + side + '</div></section>';
}

/** add ids to h2s that lack them (live ids kept); returns { html, toc } */
function withToc(html) {
  const used = new Set();
  const toc = [];
  const out = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (m, at, inner) => {
    at = at || '';
    let id = (at.match(/\bid="([^"]+)"/) || [])[1];
    if (!id) {
      const base = norm(inner).replace(/\s+/g, '-').slice(0, 60) || 'section';
      id = base; let n = 2; while (used.has(id)) id = base + '-' + n++;
      at += ' id="' + id + '"';
    }
    used.add(id);
    toc.push({ id, text: plain(inner) });
    return '<h2' + at + '>' + inner + '</h2>';
  });
  if (toc.length < 3) return { html: out, toc: '' };
  return { html: out, toc: '<nav class="pg-toc" aria-label="On this page"><p class="pg-toc__t">On this page</p><ol>' + toc.map((t) => '<li><a href="#' + attr(t.id) + '">' + t.text + '</a></li>').join('') + '</ol></nav>' };
}

function siblings(page, ctx) {
  if (!ctx._pgSibs) {
    ctx._pgSibs = new Map();
    for (const p of ctx.pages.values()) {
      if (p.path === '/' || p.kind === 'post' || p.kind === 'home') continue;
      const k = parentOf(p.path);
      if (!ctx._pgSibs.has(k)) ctx._pgSibs.set(k, []);
      ctx._pgSibs.get(k).push(p);
    }
    for (const l of ctx._pgSibs.values()) l.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  }
  return ctx._pgSibs.get(parentOf(page.path)) || [];
}

function prevNext(page, ctx) {
  const sib = siblings(page, ctx);
  const i = sib.findIndex((p) => p.path === page.path);
  if (i < 0 || sib.length < 2) return '';
  const prev = i > 0 ? sib[i - 1] : null;
  const next = i < sib.length - 1 ? sib[i + 1] : null;
  const a = (p, dir) => (p ? '<a class="pg-pn__a pg-pn__a--' + dir + '" href="' + attr(p.path) + '" rel="' + dir + '"><span class="pg-pn__k">' + (dir === 'prev' ? ico('left') + 'Previous' : 'Next' + ico('right')) + '</span><span class="pg-pn__t">' + esc(label(p)) + '</span></a>' : '<span></span>');
  return '<nav class="pg-pn" aria-label="Previous and next">' + a(prev, 'prev') + a(next, 'next') + '</nav>';
}

function inThisSection(page, ctx, ground = 'dark') {
  const kids = (page.children || []).map((c) => { const p = ctx.pages.get(c.path); return { title: p ? label(p) : c.title, href: c.path, summary: '', image: null }; });
  if (!kids.length) return '';
  return '<section class="pg-row pg-row--' + ground + (ground === 'dark' ? ' stage' : '') + ' pg-sect">' + (ground === 'dark' ? pools('rim') : '') + '<h2 class="pg-h display display--sm">In this section</h2>' + childCards(kids, ctx, ground) + '</section>';
}

// ---------- templates ----------
function builderPage(page, ctx) {
  const hub = (page.children || []).length > 0;
  const { html: heroHtml, spill } = hero(page, ctx);
  const own = blocksOf(page.rows).concat(spill);
  let main = '';
  if (spill.length) {
    // non-text hero blocks (locations on /hours-location/): the first content panel, a heading opens a new cell
    const cells = [];
    for (const b of spill) {
      const last = cells[cells.length - 1];
      if (b.t === 'heading') cells.push([b]);
      else if (last && last.length === 1 && last[0].t === 'heading') last.push(b);
      else cells.push([b]);
    }
    main += '<section class="pg-row pg-row--dark stage pg-spill">' + pools('rim') + '<div class="pg-group pg-group--cells pg-cells--' + Math.min(cells.length, 3) + '">'
      + cells.map((c) => '<div class="pg-col">' + renderBlocks(c, ctx, page, { ground: 'dark' }) + '</div>').join('') + '</div></section>';
  }
  main += renderRows(page.rows, ctx, page, { start: 0 });
  if (hub && !own.some((b) => b.t === 'childpages')) main += inThisSection(page, ctx);
  const cut = hub ? seam(cutout(ctx, /^\/eyeglasses-contacts\/$/.test(page.path) ? 'CUT-SUNGLASSES' : 'CUT-FRAMES', { cls: 'pg-cut', depth: 0.05, rot: -10, sizes: '(min-width: 900px) 260px, 40vw', widths: [320, 480, 640] }), 'pg-seam') : '';
  return heroHtml + cut + body(main, aside(page, ctx, own), 'pg-body--builder');
}

function articlePage(page, ctx) {
  const { html: heroHtml } = hero(page, ctx);
  const own = blocksOf(page.rows);
  const text = own.filter((b) => b.t !== 'childpages');
  const cards = own.filter((b) => b.t === 'childpages');
  const { html, toc } = withToc(renderBlocks(text, ctx, page, { ground: 'paper' }));
  let main = '<article class="paper pg-sheet">' + toc + html + prevNext(page, ctx) + '</article>';
  if (cards.length) main += '<section class="pg-row pg-row--dark stage pg-sect">' + pools('rim') + renderBlocks(cards, ctx, page, { ground: 'dark' }) + '</section>';
  else if ((page.children || []).length) main += inThisSection(page, ctx);
  return heroHtml + body(main, aside(page, ctx, own), 'pg-body--article');
}

let POSTS = null;
function liveposts(ctx) {
  if (POSTS) return POSTS;
  try {
    const m = JSON.parse(fs.readFileSync(new URL('../content/pages/whats-new.json', import.meta.url), 'utf8'));
    POSTS = (blocksOf(m.rows).find((b) => b.t === 'posts') || { items: [] }).items;
  } catch (e) {
    ctx.warn('inner: whats-new posts unreadable (' + e.message + '), falling back to ctx.pages');
    POSTS = [...ctx.pages.values()].filter((p) => p.kind === 'post').map((p) => ({ path: p.path, title: label(p), date: p.date, excerpt: '' }));
  }
  return POSTS;
}

function postPage(page, ctx) {
  const { html: heroHtml } = hero(page, ctx, { date: page.date });
  const own = blocksOf(page.rows);
  const { html, toc } = withToc(renderBlocks(own, ctx, page, { ground: 'paper' }));
  const all = liveposts(ctx);
  const i = all.findIndex((p) => p.path === page.path);
  const more = [];
  for (let k = 1; more.length < 3 && k < all.length; k++) { const p = all[((i < 0 ? 0 : i) + k) % all.length]; if (p.path !== page.path) more.push(p); }
  const blog = ctx.pages.get('/whats-new/');
  const blogName = blog ? blog.h1 : 'What’s New';
  const moreHtml = more.length ? '<section class="pg-row pg-row--dark stage pg-more-posts">' + pools('rim')
    + '<h2 class="pg-h display display--sm">More from ' + esc(blogName) + '</h2>'
    + '<ul class="grid-3 pg-posts" data-stagger>' + more.map((p) => '<li class="card card--paper pg-post"><div class="card__body">' + (p.date ? '<p><span class="chip chip--amber pg-date">' + ico('calendar') + esc(p.date) + '</span></p>' : '')
      + '<h3>' + esc(p.title || '') + '</h3>' + (p.excerpt ? '<p>' + esc(p.excerpt) + '</p>' : '') + '<a class="card__link" href="' + attr(p.path) + '" aria-label="' + attr(p.title || '') + '"></a></div></li>').join('') + '</ul>'
    + '<p class="btns pg-btns">' + btn(blogName, '/whats-new/', 'glass') + '</p></section>' : '';
  const main = '<article class="paper pg-sheet">' + toc + html + '</article>' + moreHtml;
  return heroHtml + body(main, aside(page, ctx, own), 'pg-body--post');
}

function blogPage(page, ctx) {
  const { html: heroHtml } = hero(page, ctx);
  const own = blocksOf(page.rows);
  const intro = own.filter((b) => b.t !== 'posts');
  const list = own.filter((b) => b.t === 'posts');
  const main = (intro.length ? '<div class="paper pg-sheet pg-sheet--intro">' + renderBlocks(intro, ctx, page, { ground: 'paper' }) + '</div>' : '')
    + '<section class="pg-blog">' + renderBlocks(list, ctx, page, { ground: 'dark' }) + '</section>';
  return heroHtml + body(main, aside(page, ctx, own), 'pg-body--blog');
}

function formPage(page, ctx) {
  const { html: heroHtml } = hero(page, ctx);
  const own = blocksOf(page.rows);
  const s = ctx.site;
  const a = s.address || {};
  const side = '<aside class="pg-aside pg-aside--form" aria-label="' + attr(s.name || '') + '"><div class="glass pg-aside__in pg-nap">'
    + '<h2 class="pg-nap__t">' + esc(s.name || '') + '</h2>'
    + '<address class="pg-loc__addr">' + ico('pin') + '<span>' + esc(a.street || '') + '<br>' + esc([a.city, a.region].filter(Boolean).join(', ') + ' ' + (a.zip || '')) + '</span></address>'
    + (s.phone ? '<p class="pg-loc__tel"><a href="' + attr(s.tel || 'tel:' + s.phone) + '">' + ico('phone') + '<span>' + esc(s.phone) + '</span></a></p>' : '')
    + '<table class="hours pg-hours"><tbody>' + (s.hours || []).map((h) => '<tr data-day="' + attr(h.day) + '"><th scope="row">' + esc(h.day) + '</th><td>' + esc(h.time) + '</td></tr>').join('') + '</tbody></table>'
    + (s.phone ? '<p class="btns">' + btn(s.phone, s.tel || 'tel:' + s.phone, 'amber sm block', { lead: 'phone', ico: '' }) + '</p>' : '')
    + '</div></aside>';
  const forms = own.filter((b) => b.t === 'form');
  const other = own.filter((b) => b.t !== 'form');
  const main = (other.length ? '<div class="paper pg-sheet">' + renderBlocks(other, ctx, page, { ground: 'paper' }) + '</div>' : '')
    + forms.map((b) => '<div class="glass glass--strong pg-formpanel">' + formBlock(b, ctx) + '</div>').join('');
  return heroHtml + body(main, side, 'pg-body--form');
}

function sitemapPage(page, ctx) {
  const { html: heroHtml } = hero(page, ctx);
  const groups = new Map();
  const blogKey = 'whats-new';
  for (const p of ctx.pages.values()) {
    const seg = p.kind === 'post' ? blogKey : (p.path.split('/').filter(Boolean)[0] || '');
    if (!groups.has(seg)) groups.set(seg, []);
    groups.get(seg).push(p);
  }
  const keys = [...groups.keys()].sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a === blogKey ? 1 : b === blogKey ? -1 : a < b ? -1 : 1));
  const depth = (p) => p.split('/').filter(Boolean).length;
  const sections = keys.map((k) => {
    const list = groups.get(k).sort((a, b) => {
      if (k === blogKey) { if (a.kind !== b.kind) return a.kind === 'blog' ? -1 : 1; return a.path < b.path ? -1 : 1; }
      return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
    });
    const root = k === '' ? null : ctx.pages.get('/' + k + '/');
    const name = k === '' ? ((page.crumbs || [])[0] || {}).name || 'Home' : root ? label(root) : label(list[0]);
    return '<section class="pg-sm" aria-label="' + attr(name) + '"><h2 class="pg-sm__t">' + esc(name) + ' <span class="pg-sm__n">' + list.length + '</span></h2>'
      + '<ul class="pg-sm__list' + (list.length > 12 ? ' pg-sm__list--cols' : '') + '" data-search-list>'
      + list.map((p) => '<li class="pg-sm__d' + Math.min(4, Math.max(1, depth(p.path) - (k === blogKey && p.kind === 'post' ? -1 : 0))) + '"><a href="' + attr(p.path) + '">' + esc(label(p) || p.path) + '</a></li>').join('')
      + '</ul></section>';
  }).join('');
  const own = blocksOf(page.rows);
  const main = '<div class="paper pg-sheet pg-sitemap"><p class="pg-sm__note" data-search-note hidden role="status"></p>' + (own.length ? renderBlocks(own, ctx, page, { ground: 'paper' }) : '') + sections + '</div>';
  return heroHtml + body(main, aside(page, ctx, []), 'pg-body--sitemap');
}

// click-to-load map and video, and the posts "Load more" (no third-party request before a click; all posts show without JS)
const PGJS = '<script>(function(){var d=document;function q(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))}'
  + 'q("[data-map-src]").forEach(function(b){b.addEventListener("click",function(){var box=b.parentNode.querySelector(".pg-map");if(!box)return;var f=d.createElement("iframe");f.src=b.getAttribute("data-map-src");f.title=b.getAttribute("data-map-title")||"Map";f.loading="lazy";f.setAttribute("referrerpolicy","no-referrer-when-downgrade");f.setAttribute("allowfullscreen","");box.appendChild(f);box.hidden=false;b.hidden=true;})});'
  + 'q("[data-video-src]").forEach(function(b){b.addEventListener("click",function(){var s=b.getAttribute("data-video-src"),f=d.createElement("iframe");f.src=s+(s.indexOf("?")>-1?"&":"?")+"autoplay=1";f.title=b.getAttribute("data-video-title")||"Video";f.allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";f.setAttribute("allowfullscreen","");var w=b.parentNode;w.classList.add("is-on");w.appendChild(f);b.remove();f.focus();})});'
  + 'q("[data-more]").forEach(function(list){var n=+list.getAttribute("data-more")||12,items=q(":scope > li",list),btn=list.parentNode.querySelector(".pg-more");if(!btn||items.length<=n)return;var k=n;function show(){items.forEach(function(li,i){li.hidden=i>=k});btn.hidden=k>=items.length}show();btn.addEventListener("click",function(){var first=items[k];k+=n;show();var a=first&&first.querySelector("a");if(a)a.focus()})});'
  + '})();</script>';

export function innerPage(page, ctx) {
  ctx._pg = { n: 0, js: false };
  let html;
  switch (page.kind) {
    case 'form': html = formPage(page, ctx); break;
    case 'sitemap': html = sitemapPage(page, ctx); break;
    case 'blog': html = blogPage(page, ctx); break;
    case 'post': html = postPage(page, ctx); break;
    case 'article': html = articlePage(page, ctx); break;
    default: html = builderPage(page, ctx);
  }
  return html + (ctx._pg.js ? PGJS : '');
}
