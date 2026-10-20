// parts.mjs - shared parts for every template (FOUNDATION lane, BUILD-CONTRACT 4.5): buttons, eyebrows, light pools,
// protruding cut-outs, loop-or-still backdrops, the section-art map (4.4), icons, stars. Every image call is wrapped:
// a missing ref never kills a page (ctx.warn names it).
import { esc, attr, linkAttrs, isExt, ICON, icon as iconOf } from './util.mjs';

export const icon = iconOf;

/**
 * btn(text, href, kind = 'amber', opts = {}) -> <a class="btn btn--<kind>">
 *   kind: 'amber' (primary, magnetic) | 'glass' | 'ghost' | 'light' (dark text, for paper grounds), plus optional
 *         modifiers in the same string: 'amber sm', 'glass sm block'.
 *   opts: { ico: icon name or '' (default: 'ext' for an external URL, 'arrow' otherwise), cls, attrs (string),
 *           current (bool: aria-current="page"), lead: icon name placed BEFORE the text (e.g. 'phone', 'calendar') }
 */
export function btn(text, href, kind = 'amber', opts = {}) {
  const parts = String(kind || 'amber').split(/\s+/).filter(Boolean);
  const cls = ['btn'].concat(parts.map((k) => 'btn--' + k));
  if (opts.cls) cls.push(opts.cls);
  const ico = opts.ico === undefined ? (isExt(href) ? 'ext' : 'arrow') : opts.ico;
  const mag = parts.includes('amber') && !parts.includes('sm') ? ' data-magnetic' : '';
  return '<a class="' + cls.join(' ') + '" href="' + attr(href) + '"' + linkAttrs(href) + mag + (opts.current ? ' aria-current="page"' : '') + (opts.attrs ? ' ' + opts.attrs : '') + '>'
    + (opts.lead ? '<span class="ico ico--lead">' + iconOf(opts.lead) + '</span>' : '')
    + '<span class="btn__t">' + esc(text) + '</span>'
    + (ico ? '<span class="ico">' + iconOf(ico) + '</span>' : '')
    + (isExt(href) ? '<span class="sr-only"> (opens in a new tab)</span>' : '')
    + '</a>';
}

/** eyebrow(text, tag = 'p') -> a small-caps label with a short amber rule. Reuse words already on the site only. */
export const eyebrow = (text, tag = 'p') => '<' + tag + ' class="eyebrow">' + esc(text) + '</' + tag + '>';

/**
 * pools(kind = 'both') -> absolutely positioned light pools for a .stage (the parent must be position:relative;
 * .stage and .section already are). kind: 'amber' | 'teal' | 'both' | 'key' (one big amber key light, top right) |
 * 'rim' (a teal rim low left + a small amber, for long stages). Decorative, aria-hidden, slow drift.
 */
export function pools(kind = 'both') {
  const P = {
    amber: ['pool--amber pool--tr'],
    teal: ['pool--teal pool--bl'],
    both: ['pool--amber pool--tr', 'pool--teal pool--bl'],
    key: ['pool--amber pool--key'],
    rim: ['pool--teal pool--bl', 'pool--amber pool--sm pool--tr'],
  };
  return '<div class="pools" aria-hidden="true">' + (P[kind] || P.both).map((c) => '<span class="pool ' + c + '"></span>').join('') + '</div>';
}

/**
 * cutout(ctx, slot, opts) -> a transparent PNG (CUT-FRAMES, CUT-SUNGLASSES, or any local PNG) as a front-plane object
 * that the CALLER positions with its own class (e.g. 'hm-hero__cut'), with the --sh-cut drop shadow, an optional
 * gentle float, and scroll parallax via data-depth (the parallax writes `transform` on this outer element, so never put
 * data-reveal or a hover transform on it: reveal a parent instead).
 *   opts: { cls, depth (0.08..0.3, default 0.14; 0 = none), rot (deg), float (default true), sizes ('30vw'),
 *           widths, alt ('' = decorative) }
 * Returns '' while the slot is not generated (a cut-out never renders as an empty frame).
 * Also accepts cutout(slot, { ctx, ...opts }).
 */
export function cutout(ctx, slot, opts = {}) {
  if (typeof ctx === 'string') { opts = slot || {}; slot = ctx; ctx = opts.ctx; }
  if (!ctx) return '';
  if (/^(G|CUT|V)-[A-Z0-9-]+$/.test(String(slot)) && !(ctx.plan && ctx.plan[slot])) return '';
  let src = null;
  try { src = ctx.imgSrc(slot, 320); } catch (e) { ctx.warn('cutout: ' + e.message); return ''; }
  if (!src) return '';
  let im = '';
  try { im = ctx.img(slot, { alt: opts.alt || '', sizes: opts.sizes || '30vw', widths: opts.widths || [320, 480, 640, 960, 1280] }); } catch (e) { ctx.warn('cutout: ' + e.message); return ''; }
  const depth = opts.depth == null ? 0.14 : opts.depth;
  return '<div class="cutout' + (opts.cls ? ' ' + attr(opts.cls) : '') + '"' + (depth ? ' data-depth="' + depth + '"' : '') + (opts.alt ? '' : ' aria-hidden="true"')
    + ' style="--rot:' + (Number(opts.rot) || 0) + 'deg"><div class="cutout__in' + (opts.float === false ? '' : ' cutout__in--float') + '">' + im + '</div></div>';
}

/**
 * loopOrStill(ctx, videoSlot, stillSlot, opts) -> a full-bleed decorative backdrop for a positioned parent (.stage,
 * .section): the loop (poster first, plays only while visible, never under reduced motion, with a pause/play button)
 * when ctx.video(videoSlot) exists, else the still (ctx.img(stillSlot)), else '' (the pools carry the light alone).
 *   opts: { cls, pos ('50% 50%'), eager (bool: hero above the fold), smoke (default true: the dark scrim that keeps
 *           text readable), depth (parallax of the media, default 0), sizes ('100vw'), label (the toggle's label) }
 * videoSlot or stillSlot may be null. Any slot id may be undeclared: the call never throws.
 */
export function loopOrStill(ctx, videoSlot, stillSlot, opts = {}) {
  const pos = opts.pos || '50% 50%';
  const eager = !!opts.eager;
  const smoke = opts.smoke === false ? '' : '<div class="backdrop__smoke"></div>';
  const depth = opts.depth ? ' data-depth="' + opts.depth + '"' : '';
  const cls = 'backdrop' + (opts.cls ? ' ' + attr(opts.cls) : '');
  let v = null;
  if (videoSlot) { try { v = ctx.video(videoSlot, { posterWidth: 1920 }); } catch (e) { ctx.warn('loop: ' + e.message); v = null; } }
  if (v) {
    return '<div class="' + cls + ' backdrop--loop" data-loop-box>'
      + '<div class="backdrop__media" aria-hidden="true"' + depth + '>'
      + '<img src="' + attr(v.poster) + '" srcset="' + attr(v.posterSrcset) + '" sizes="' + attr(opts.sizes || '100vw') + '" alt="" ' + (eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" style="object-position:' + attr(pos) + '"' + (v.width ? ' width="' + v.width + '" height="' + v.height + '"' : '') + '>'
      + '<video muted playsinline loop preload="none" tabindex="-1" poster="' + attr(v.poster) + '"' + (v.mp4Phone ? ' data-src-phone="' + attr(v.mp4Phone) + '"' : '') + ' style="object-position:' + attr(pos) + '">'
      + (v.webm ? '<source data-src="' + attr(v.webm) + '" type="video/webm">' : '') + '<source data-src="' + attr(v.mp4) + '" type="video/mp4"></video>'
      + '</div>' + smoke
      + '<button class="loop-toggle" type="button" aria-label="' + attr(opts.label || 'Pause background video') + '" aria-pressed="false">' + ICON.pause + ICON.play + '</button>'
      + '</div>';
  }
  if (stillSlot) {
    let im = '';
    try { im = ctx.img(stillSlot, { alt: '', sizes: opts.sizes || '100vw', loading: eager ? 'eager' : 'lazy', fetchpriority: eager ? 'high' : undefined, attrs: { style: 'object-position:' + pos } }); } catch (e) { ctx.warn('still: ' + e.message); im = ''; }
    if (im && !/class="img-slot/.test(im)) return '<div class="' + cls + '"><div class="backdrop__media" aria-hidden="true"' + depth + '>' + im + '</div>' + smoke + '</div>';
  }
  return '';
}

/**
 * safeImg(ctx, ref, opts) -> ctx.img(...) that never throws: an undeclared/unknown ref renders the same dark
 * .img-slot frame a declared-but-ungenerated slot gets (and ctx.warn names it).
 */
export function safeImg(ctx, ref, opts = {}) {
  const frame = () => '<div class="img-slot' + (opts.cls ? ' ' + attr(opts.cls) : '') + '" data-slot="' + attr(ref) + '" role="img" aria-label="' + attr(opts.alt || '') + '"></div>';
  // a slot id the image plan does not declare yet: the same quiet frame (MEDIA may still be writing the plan)
  if (/^(G|CUT|V)-[A-Z0-9-]+$/.test(String(ref)) && !(ctx.plan && ctx.plan[ref])) return frame();
  try { return ctx.img(ref, opts); } catch (e) { ctx.warn('img: ' + e.message); return frame(); }
}

/** hasSlot(ctx, id) -> true when the image plan declares the slot AND its file exists (ctx.imgSrc resolves it) */
export function hasSlot(ctx, id) {
  if (!(ctx.plan && ctx.plan[id])) return false;
  try { return !!ctx.imgSrc(id, 320); } catch (e) { return false; }
}

/** sectionArt(page) -> the image-plan slot for a page's hero / menu card (BUILD-CONTRACT 4.4, first match wins) */
const ART = [
  [(p, k) => k === 'post' || k === 'blog' || /^\/whats-new\//.test(p), 'G-IRIS'],
  [(p) => /computer-eyestrain|blue-light|computer-glasses|computer-vision/.test(p), 'G-SCREEN'],
  [(p) => /vision-over-40|vision-over-60/.test(p), 'G-SENIOR'],
  [(p) => /sunglass/.test(p), 'G-SUN'],
  [(p) => /caring-for-lenses|frame-maintenance|lens-care|eyeglass-frames|frame-materials|lens-treatments/.test(p), 'G-CARE'],
  [(p) => /designer-frames/.test(p), 'G-OPTICAL'],
  [(p) => /contact-lens/.test(p), 'G-CONTACT'],
  [(p) => /dry-eye|eye-conditions/.test(p), 'G-DROP'],
  [(p) => /pediatric|childrens-vision|eye-exams|kids/.test(p), 'G-KIDS'],
  [(p) => /\/your-eye-health\//.test(p), 'G-LIBRARY'],
  [(p) => /^\/eyeglasses-contacts\/|^\/eyeglasses\//.test(p), 'G-OPTICAL'],
  [(p) => /^\/eye-care-services\//.test(p), 'G-EXAM'],
  [(p) => /^\/(our-eye-doctors|the-staff|about|associations-awards|community-outreach)/.test(p), 'G-TEAM-BG'],
  [(p) => /^\/(contact-us|insurance|hours-location|sitemap)|form/.test(p), 'G-LIGHT'],
];
export function sectionArt(page) {
  const p = String((page && page.path) || '/');
  const k = page && page.kind;
  for (const [test, slot] of ART) if (test(p, k)) return slot;
  return 'G-LIGHT';
}

/** seam(html, cls) -> a zero-height layer placed BETWEEN two sections (not inside either); what it holds (usually a
 *  cutout positioned with top: -Npx / bottom) paints above both neighbours, so it can cross the seam either way. */
export const seam = (html, cls = '') => (html ? '<div class="seam' + (cls ? ' ' + attr(cls) : '') + '" aria-hidden="true">' + html + '</div>' : '');

/** stars(n) -> n of 5 amber stars with an accessible label */
export function stars(n = 5) {
  const k = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
  return '<span class="stars" role="img" aria-label="' + k + ' out of 5 stars">' + ICON.star.repeat(k) + (k < 5 ? '<span class="stars__off">' + ICON.star.repeat(5 - k) + '</span>' : '') + '</span>';
}

/** irisRing(cls) -> the decorative concentric amber rings (lens / iris), aria-hidden; position it with cls */
export function irisRing(cls = '') {
  return '<svg class="iris-ring' + (cls ? ' ' + attr(cls) : '') + '" viewBox="0 0 200 200" aria-hidden="true" focusable="false">'
    + '<circle cx="100" cy="100" r="98" /><circle cx="100" cy="100" r="80" /><circle cx="100" cy="100" r="62" class="iris-ring__dash" />'
    + '<circle cx="100" cy="100" r="44" /><circle cx="100" cy="100" r="22" class="iris-ring__core" /></svg>';
}
