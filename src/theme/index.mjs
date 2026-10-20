// index.mjs - the theme contract (BUILD-CONTRACT 4.1): renderPage(page, ctx) and render404(ctx). FOUNDATION lane.
// Home = page.path '/' (home.mjs: homePage(page, ctx) -> <main> inner HTML); every other page goes to inner.mjs
// (innerPage(page, ctx) -> <main> inner HTML). Both return the inside of <main>; the shell adds the chrome.
import { shell } from './shell.mjs';
import { homePage } from './home.mjs';
import { innerPage } from './inner.mjs';
import { esc, attr, ICON } from './util.mjs';
import { btn, loopOrStill, pools, irisRing, eyebrow } from './parts.mjs';

const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '');

export function renderPage(page, ctx) {
  if (page.path === '/') return shell(ctx, { page, main: homePage(page, ctx), bodyClass: 'l-home k-home' });
  const sec = clean(page.section || page.path.split('/').filter(Boolean)[0] || 'page');
  return shell(ctx, { page, main: innerPage(page, ctx), bodyClass: 'l-inner l-' + sec + ' k-' + clean(page.kind || 'page') });
}

/** the 404: a dark stage (G-IRIS when it exists), the way home and the main sections */
export function render404(ctx) {
  const page = { path: '/404.html', kind: '404', head: { title: 'Page not found | ' + (ctx.site.name || ''), robots: 'noindex, follow', description: '' } };
  const quick = ((ctx.site.footer || {}).quick || {}).links || [];
  const main = '<section class="section stage nf spotlight">'
    + loopOrStill(ctx, null, ctx.plan && ctx.plan['G-IRIS'] ? 'G-IRIS' : null, { eager: true, pos: '70% 50%' }) + pools('both')
    + irisRing('nf__ring')
    + '<div class="wrap nf__in">'
    + '<div class="nf__card glass" data-reveal="iris">'
    + eyebrow('404')
    + '<h1 class="display">Page not <em>found</em></h1>'
    + '<div class="nf__btns">' + btn('Home', '/', 'amber') + btn('Contact Us', '/contact-us/', 'glass') + '</div>'
    + '<ul class="nf__links" data-stagger>' + quick.map((l) => '<li><a class="chip" href="' + attr(l.href) + '">' + esc(l.text) + '</a></li>').join('') + '</ul>'
    + '</div></div></section>';
  return shell(ctx, { page, main, bodyClass: 'l-404 k-404' });
}
