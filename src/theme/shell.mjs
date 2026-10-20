// shell.mjs - the document (FOUNDATION lane): head carried from the live page model (title, description, robots,
// OG/Twitter, JSON-LD verbatim), canonical = the LIVE URL (the pitch never competes with the live site), fonts,
// icons, the bundle, then topbar + header + <main id="main"> + footer.
import { esc, attr } from './util.mjs';
import { topbar, header, footer } from './chrome.mjs';

/**
 * shell(ctx, { page, main, bodyClass, preload }) -> a whole HTML document.
 *   page: the page model (path, kind, head); main: the <main> inner HTML; preload: extra <link rel=preload> tags.
 */
export function shell(ctx, o) {
  const p = o.page || {};
  const h = p.head || {};
  const title = h.title || p.title || ctx.site.name || '';
  const desc = h.description || '';
  const canonical = ctx.origin + (p.path || '/');
  const robots = h.robots || 'index, follow';
  const og = h.og && typeof h.og === 'object' && !Array.isArray(h.og) ? h.og : {};
  let ogImg = null;
  const ogRef = og['og:image'] || og['og:image:url'] || og['og:image:secure_url'];
  if (ogRef) { try { ogImg = ctx.imgSrc(ogRef, 1280); } catch (e) { ogImg = null; } }
  let meta = '';
  for (const [k, v] of Object.entries(og)) {
    if (v == null || typeof v === 'object') continue;
    if (/^og:image/.test(k) || k === 'og:url') continue;
    if (/^twitter:image/.test(k)) continue;
    meta += /^twitter:/.test(k) ? '<meta name="' + attr(k) + '" content="' + attr(v) + '">' : '<meta property="' + attr(k) + '" content="' + attr(v) + '">';
  }
  if (!og['og:title']) meta += '<meta property="og:title" content="' + attr(title) + '">';
  if (!og['og:type']) meta += '<meta property="og:type" content="' + (p.kind === 'post' ? 'article' : 'website') + '">';
  if (!og['og:description'] && desc) meta += '<meta property="og:description" content="' + attr(desc) + '">';
  meta += '<meta property="og:url" content="' + attr(canonical) + '">';
  if (ogImg) meta += '<meta property="og:image" content="' + attr(ogImg) + '">';
  if (!og['twitter:card']) meta += '<meta name="twitter:card" content="' + (ogImg ? 'summary_large_image' : 'summary') + '">';
  const ld = (Array.isArray(h.jsonld) ? h.jsonld : h.jsonld ? [h.jsonld] : []).map((j) => '<script type="application/ld+json">' + (typeof j === 'string' ? j : JSON.stringify(j)).replace(/<\/(script)/gi, '<\\/$1') + '</script>').join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    + '<title>' + esc(title) + '</title>'
    + (desc ? '<meta name="description" content="' + attr(desc) + '">' : '')
    + '<link rel="canonical" href="' + attr(canonical) + '">'
    + '<meta name="robots" content="' + attr(robots) + '">'
    + meta
    + '<meta name="theme-color" content="#0b0c0e"><meta name="color-scheme" content="dark light">'
    + '<link rel="icon" href="/favicon.png" type="image/png" sizes="64x64"><link rel="apple-touch-icon" href="/apple-touch-icon.png">'
    + '<link rel="preload" href="/assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>'
    + '<link rel="preload" href="/assets/fonts/instrument-serif-normal-latin.woff2" as="font" type="font/woff2" crossorigin>'
    + (o.preload || '')
    + '<link rel="stylesheet" href="' + attr(ctx.assets.css) + '">'
    // motion states apply only while the script is alive: the class goes again after 2.5 s if site.js never ran
    + '<script>document.documentElement.classList.add("js-motion");setTimeout(function(){if(!window.__icare)document.documentElement.classList.remove("js-motion")},2500)</script>'
    + '<script src="' + attr(ctx.assets.js) + '" defer></script>'
    + ld
    + '</head><body class="' + attr(o.bodyClass || '') + '">'
    + '<a class="skip" href="#main">Skip to content</a>'
    + topbar(ctx) + header(ctx, p)
    + '<main id="main" tabindex="-1">' + (o.main || '') + '</main>'
    + footer(ctx)
    + '</body></html>';
}
