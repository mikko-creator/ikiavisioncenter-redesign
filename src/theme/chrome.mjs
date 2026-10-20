// chrome.mjs - topbar, glass header with the two mega panels, mobile drawer, footer (FOUNDATION lane).
// Every label and link comes from src/content/site.json (the live header and footer); nothing is invented beyond short
// UI labels (Menu, Close, Today, Hours, Search).
import { esc, attr, linkAttrs, current, ICON } from './util.mjs';
import { btn, loopOrStill, pools, safeImg } from './parts.mjs';

const MEGA_ART = { '/eye-care-services/': 'G-EXAM', '/eyeglasses-contacts/': 'G-OPTICAL' };
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const inSection = (page, href) => !!(page && page.path && href !== '/' && page.path.startsWith(href));

function logo(ctx, dark = true, eager = true) {
  const s = ctx.site.logo || {};
  return safeImg(ctx, dark ? 'assets/brand/logo-on-dark.png' : 'assets/brand/logo.png', { alt: s.alt || 'Ike Ikechi, OD logo', sizes: '150px', widths: [160, 300], loading: eager ? 'eager' : 'lazy', cls: 'logo-img' });
}

export function topbar(ctx) {
  const s = ctx.site;
  const t = s.topbar || {};
  return '<div class="topbar"><div class="wrap wrap--wide topbar__in">'
    + '<a class="topbar__loc" href="' + attr(t.locationHref || '/hours-location/') + '">' + ICON.pin + '<span>' + esc(t.location || '') + '</span></a>'
    + '<div class="topbar__right">'
    + '<a class="topbar__hours chip chip--dark" href="/hours-location/" data-today=\'' + attr(JSON.stringify(s.hours || [])) + '\'>' + ICON.clock + '<span class="topbar__today">Hours</span></a>'
    + '<a class="topbar__phone" href="' + attr(s.tel) + '">' + ICON.phone + '<span>' + esc(s.phone) + '</span></a>'
    + '</div></div></div>';
}

function megaPanel(ctx, it, page, id) {
  const art = MEGA_ART[it.href] || 'G-LIGHT';
  const im = safeImg(ctx, art, { alt: '', sizes: '300px', widths: [320, 480, 640] });
  const cols = (it.children || []).map((c) => '<div class="mega__group">'
    + '<a class="mega__link" href="' + attr(c.href) + '"' + current(page, c.href) + '>' + esc(c.text) + '</a>'
    + (c.children && c.children.length ? '<ul class="mega__sub">' + c.children.map((g) => '<li><a href="' + attr(g.href) + '"' + current(page, g.href) + '>' + esc(g.text) + '</a></li>').join('') + '</ul>' : '')
    + '</div>').join('');
  return '<div class="mega" id="' + id + '" data-mega-panel><div class="mega__panel glass glass--strong">'
    + '<a class="mega__lead" href="' + attr(it.href) + '"' + current(page, it.href) + '><span class="mega__art frame">' + im + '</span>'
    + '<span class="mega__lead-t"><span class="mega__lead-h">' + esc(it.text) + '</span><span class="mega__lead-go">' + ICON.arrow + '</span></span></a>'
    + '<div class="mega__cols">' + cols + '</div>'
    + '</div></div>';
}

export function header(ctx, page) {
  const s = ctx.site;
  const items = (s.nav || []).map((it, i) => {
    const on = inSection(page, it.href);
    const cur = page && page.path === it.href ? ' aria-current="page"' : on ? ' data-in-section' : '';
    if (it.mega && it.children && it.children.length) {
      const id = 'mega-' + slug(it.text);
      return '<li class="nav__item has-mega" data-mega>'
        + '<a class="nav__link" href="' + attr(it.href) + '"' + cur + '>' + esc(it.text) + '</a>'
        + '<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="' + id + '" aria-label="' + attr(it.text) + ': show pages">' + ICON.chevron + '</button>'
        + megaPanel(ctx, it, page, id) + '</li>';
    }
    return '<li class="nav__item"><a class="nav__link" href="' + attr(it.href) + '"' + cur + '>' + esc(it.text) + '</a></li>';
  }).join('');
  const buttons = (s.headerButtons || []).map((b) => btn(b.text, b.href, (b.kind || 'glass') + ' sm', { ico: b.external ? 'ext' : 'calendar' })).join('');
  return '<header class="hdr" data-hdr><div class="wrap wrap--wide hdr__wrap"><div class="hdr__bar">'
    + '<a class="hdr__logo" href="/" aria-label="Icare Clinic home">' + logo(ctx, true, true) + '</a>'
    + '<nav class="nav" aria-label="Main"><ul class="nav__list">' + items + '</ul></nav>'
    + '<div class="hdr__cta">' + buttons + '</div>'
    + '<button class="burger" type="button" aria-expanded="false" aria-controls="drawer"><span class="burger__lines" aria-hidden="true"><span></span><span></span><span></span></span><span class="burger__t">Menu</span></button>'
    + '</div></div></header>'
    + drawer(ctx, page);
}

function drawer(ctx, page) {
  const s = ctx.site;
  const links = (s.nav || []).map((it) => {
    if (it.mega && it.children && it.children.length) {
      return '<li><details class="drawer__acc"><summary><span>' + esc(it.text) + '</span>' + ICON.chevron + '</summary>'
        + '<ul class="drawer__sub"><li><a class="drawer__hub" href="' + attr(it.href) + '"' + current(page, it.href) + '>' + esc(it.text) + ICON.arrow + '</a></li>'
        + it.children.map((c) => '<li><a href="' + attr(c.href) + '"' + current(page, c.href) + '>' + esc(c.text) + '</a>'
          + (c.children && c.children.length ? '<ul class="drawer__sub2">' + c.children.map((g) => '<li><a href="' + attr(g.href) + '"' + current(page, g.href) + '>' + esc(g.text) + '</a></li>').join('') + '</ul>' : '')
          + '</li>').join('')
        + '</ul></details></li>';
    }
    return '<li><a class="drawer__link" href="' + attr(it.href) + '"' + current(page, it.href) + '>' + esc(it.text) + '</a></li>';
  }).join('');
  const buttons = (s.headerButtons || []).map((b) => btn(b.text, b.href, (b.kind || 'glass') + ' block', { ico: b.external ? 'ext' : 'calendar' })).join('');
  return '<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Menu" hidden data-drawer>'
    + '<div class="drawer__scrim" data-drawer-close></div>'
    + '<div class="drawer__panel glass glass--strong">'
    + '<div class="drawer__top"><a class="drawer__logo" href="/" aria-label="Icare Clinic home">' + logo(ctx, true, false) + '</a>'
    + '<button class="drawer__close" type="button" data-drawer-close aria-label="Close menu">' + ICON.close + '</button></div>'
    + '<nav aria-label="Mobile"><ul class="drawer__nav">' + links + '</ul></nav>'
    + '<div class="drawer__foot">' + buttons
    + '<a class="drawer__phone" href="' + attr(s.tel) + '">' + ICON.phone + '<span>' + esc(s.phone) + '</span></a></div>'
    + '</div></div>';
}

export function footer(ctx) {
  const s = ctx.site;
  const f = s.footer || {};
  const ul = (group) => '<div class="ftr__col"><h2 class="ftr__h">' + esc(group.title) + '</h2><ul class="ftr__links">'
    + (group.links || []).map((l) => '<li><a href="' + attr(l.href) + '"' + linkAttrs(l.href) + '>' + esc(l.text) + '</a></li>').join('') + '</ul></div>';
  const hours = '<table class="hours"><caption class="sr-only">Hours</caption><tbody>' + (s.hours || []).map((h) => '<tr data-day="' + attr(h.day) + '"><th scope="row">' + esc(h.day) + '</th><td>' + esc(h.time) + '</td></tr>').join('') + '</tbody></table>';
  const social = '<ul class="social">' + (s.social || []).map((x) => '<li><a href="' + attr(x.href) + '" target="_blank" rel="noopener" aria-label="' + attr(x.label) + '">' + (ICON[x.name] || ICON.arrow) + '</a></li>').join('') + '</ul>';
  const bg = loopOrStill(ctx, ctx.plan && ctx.plan['V-LIGHT'] ? 'V-LIGHT' : null, ctx.plan && ctx.plan['G-LIGHT'] ? 'G-LIGHT' : null, { cls: 'ftr__bg', label: 'Pause background video' });
  const a = s.address || {};
  return '<footer class="ftr stage spotlight">' + bg + pools('rim')
    + '<div class="wrap ftr__in">'
    + '<div class="ftr__top" data-reveal="up">'
    + '<a class="ftr__logo" href="/" aria-label="Icare Clinic home">' + logo(ctx, true, false) + '</a>'
    + '<p class="ftr__nap">' + esc(f.napLine || '') + '</p>'
    + '<div class="ftr__cta">' + btn(s.phone, s.tel, 'glass', { ico: '', lead: 'phone' }) + (s.headerButtons || []).filter((b) => !b.external).map((b) => btn(b.text, b.href, 'amber', { ico: 'calendar' })).join('') + '</div>'
    + '</div>'
    + '<div class="ftr__grid" data-stagger>'
    + (f.important ? ul(f.important) : '')
    + (f.quick ? ul(f.quick) : '')
    + '<div class="ftr__col ftr__col--hours"><h2 class="ftr__h">Hours</h2>' + hours
    + '<address class="ftr__addr">' + esc(a.street) + '<br>' + esc(a.city) + ', ' + esc(a.region) + ' ' + esc(a.zip) + '</address></div>'
    + '<div class="ftr__col ftr__col--search glass"><h2 class="ftr__h">' + esc(f.searchTitle || 'Search') + '</h2>'
    + '<form class="ftr__search" action="/sitemap/" method="get" role="search">'
    + '<label class="sr-only" for="ftr-q">' + esc(f.searchTitle || 'Search') + '</label>'
    + '<input id="ftr-q" name="q" type="search" autocomplete="off" placeholder="Search">'
    + '<button class="ftr__mic" type="button" data-voice hidden aria-label="Voice search">' + ICON.mic + '</button>'
    + '<button class="ftr__go" type="submit" aria-label="Search">' + ICON.search + '</button></form>'
    + social + '</div>'
    + '</div>'
    + '<div class="ftr__bottom"><p class="ftr__copy">&copy; <span data-year>2026</span> ' + esc(s.name || '') + '</p>'
    + '<ul class="ftr__legal">' + (f.bottom || []).map((l) => '<li><a href="' + attr(l.href) + '">' + esc(l.text) + '</a></li>').join('') + '</ul></div>'
    + '</div></footer>';
}
