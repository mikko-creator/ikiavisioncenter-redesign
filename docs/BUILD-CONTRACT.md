# Build contract: Icare Clinic (ikiavisioncenter.com) redesign pitch, "Iris Noir"

Owner: the orchestrator. Every lane agent reads this file first and works only inside its own files (section 3).

## 1. The job

A fast redesign PITCH for a prospect (not a client yet): a working, presentable static site that keeps the live site's
exact structure (every crawled page at its own URL, the same menus and page hierarchy, the same copy) under a total
visual overhaul. The operator's brief, verbatim intent:
- keep the existing branding and brand tone (logo, orange accent, black bands, friendly community voice);
- multiple layers and depth, images protruding into other sections or out of their frames (depth illusion);
- a combination of **glassmorphism and tenebrism**, clean and modern;
- scroll-through animations and hover effects;
- existing imagery plus fal-generated and Higgsfield images/motion for the eye-care industry;
- skip unnecessary verification; speed matters.

Rules that still hold (they are cheap and they protect the pitch):
- **Copy is verbatim.** Never invent copy, facts, reviews, credentials, prices or claims. Short UI labels (Menu, Close,
  Read more, Next, Previous) are fine. Section eyebrows may only reuse words already on the site.
- **No generated image stands in for a real person, place or result of this practice** (Dr. Ike Ikechi, staff,
  patients, the Houston office). Generated people are generic illustrative models only.
- **No runtime dependency, no framework, no CDN.** Node builtins for the build; vanilla JS + CSS in the browser; fonts
  self-hosted. Keys never enter the project tree.
- **Browser checks are offline** (`tools/cdp.mjs` blocks every host except localhost).
- **Foreground only.** No background chains that outlive you. Run `date` when you start; respect your time box; stop
  cleanly and report what is left.
- **No git commits and no memory-note writes** from lane agents. The orchestrator commits.
- **Reduced motion** (`prefers-reduced-motion: reduce`) turns off parallax, tilt, autoplay video and large movement.

## 2. Design direction: "Iris Noir"

The logo is an eye with an orange iris. The site becomes a dark stage (tenebrism: deep warm shadow, one strong light
source) where the light is the brand's amber: every section is "lit" by an amber key light and a cool teal rim light,
and the content sits on frosted glass (the lens) or on a lit ivory canvas (where the spotlight falls, for reading).

- **Grounds.** Dark stages: `--night`/`--umber`/`--void` with light pools (`--pool-amber`, `--pool-teal`) and a
  vignette. Reading surfaces: `--paper`/`--ivory` panels with `--sh-paper`, raised off the dark stage like a lit page.
  Alternate dark stages and lit canvases so long pages breathe. Never flat #000 everywhere.
- **Glass.** `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-sat))` over `--glass` (dark) or
  `--glass-light`, a 1px `--glass-line` rim, a specular `--glass-spec` sheen on `::before`, and a top edge highlight.
  Glass only where it frames something with a VARIED backdrop behind it (hero pane, header, menus, drawers, cards
  over photos or light pools). A glass card over a flat field reads as a grey box: put a pool or a photo behind it.
  A parent with `backdrop-filter` blinds its children's blur: frost the header on `::before`, not on the bar.
- **Type.** `--f-display` Instrument Serif (regular + italic) for display headings and quotes, set large with tight
  leading; one italic word or an amber accent per display heading at most. `--f-sans` Manrope for UI and body.
  Eyebrows: small caps tracking .14em with a short amber rule.
- **Depth (3 planes).** Back plane (photo/loop/pools with parallax), mid plane (glass/paper panels), front plane
  (cut-outs: eyeglasses and sunglasses PNGs) that cross section seams with `--sh-cut`. Sections overlap their
  neighbours (negative margins, images bleeding over the seam). Measure that a protrusion really crosses a hard seam.
- **Motion.** Reveal on scroll (`data-reveal="up|fade|zoom|iris|blur|left|right"`, `data-stagger` on a parent);
  iris reveal = `clip-path: circle()` opening like an aperture; parallax via `data-depth` (rAF transform only);
  pointer spotlight on dark stages (CSS vars `--mx`/`--my`); tilt + moving specular on cards (`data-tilt`);
  magnetic primary buttons; header shrinks on scroll. All transform/opacity/clip-path only. Content must never be
  stranded invisible: a reveal failsafe shows everything after 2.5 s or when IntersectionObserver is absent.
- **Hover.** Cards lift and their image scales 1.06 inside a clipped frame; glass brightens its rim; links draw an
  amber underline from the left; buttons glow (`--glow-amber`).
- **Brand.** Logo: `assets/brand/logo.png` (light grounds) and `assets/brand/logo-on-dark.png` (black parts turned
  ivory, orange kept) for dark grounds. The orange is the only warm accent; teal is the secondary cool accent.

## 3. Files and owners (one writer per file)

| Lane | Owns |
|---|---|
| orchestrator | `docs/BUILD-CONTRACT.md`, `src/styles/tokens.css` (lanes may APPEND tokens), `src/content/site.json`, `src/content/pages/*.json`, `src/lib/extract.mjs`, `tools/extract.mjs`, `tools/crawl.mjs`, `tools/harvest-assets.mjs`, `src/build.mjs`, `src/lib/images.mjs`, `src/lib/site.mjs` |
| MEDIA | `src/content/image-plan.json`, `assets/generated/**`, `audit/generated-images.json`, `tmp/img/**`, `tmp/hf/**`, `docs/MEDIA.md` |
| FOUNDATION | `src/styles/{base,components,chrome,motion}.css`, `src/scripts/site.js`, `src/theme/{index,util,shell,chrome,parts}.mjs`, `assets/fonts/**`, `assets/brand/**`, `tmp/lab/**`, stubs of `src/theme/{home,inner,blocks}.mjs` marked `// STUB` |
| HOME (later) | `src/theme/home.mjs`, `src/styles/home.css` |
| INNER (later) | `src/theme/{inner,blocks}.mjs`, `src/styles/pages.css` |
| QA (later) | `src/styles/fix.css` (loads last), `docs/QA.md`; edits elsewhere only by naming the file and line in docs/QA.md |

CSS bundle order (`src/build.mjs` ORDER): tokens, base, components, chrome, motion, home, pages, fix.

## 4. Interfaces

### 4.1 The theme contract
`src/theme/index.mjs` exports `renderPage(page, ctx)` (string, a whole HTML document) and `render404(ctx)`. Home is
`page.path === '/'`. Build: `node src/build.mjs` writes `dist/` (each page at `dist/<path>/index.html`). Serve:
`node tools/serve.mjs --root dist --port <port> --not-found 404.html`.

### 4.2 ctx (from src/build.mjs)
- `ctx.site`: `src/content/site.json` (NAP, hours, nav with `children` for the two mega items, footer, social,
  emergency, logo, headerButtons).
- `ctx.img(ref, { alt, sizes, cls, loading, fetchpriority, widths, attrs })` returns an `<img>` with a WebP srcset,
  intrinsic width/height. `ref` is a live image URL found in a page model (harvested; resolves through
  docs/data/images.json), a local file under `assets/source|generated|brand/`, or an image-plan slot id. A declared
  slot not generated yet renders an empty `.img-slot` frame; any other unknown ref THROWS (wrap in try/catch and
  `ctx.warn`).
- `ctx.imgSrc(ref, width)` returns a URL for CSS backgrounds (null for a declared, ungenerated slot).
- `ctx.video(slotId)` returns `{ mp4, webm, mp4Phone, poster, posterSrcset, width, height, alt }` or null (not
  generated yet: render the still).
- `ctx.plan` (slot id to `{ file, alt }`), `ctx.pages` (Map path to `{ path, title, h1, kind }`), `ctx.warn(msg)`,
  `ctx.assets.css`, `ctx.assets.js`, `ctx.origin` (`https://www.ikiavisioncenter.com`).

### 4.3 Page models (`src/content/pages/<key>.json`, written by `tools/extract.mjs`; 340 pages)
Kinds: home 1 · page 52 (builder pages, hubs, about, location) · article 131 (the eye-health/eyewear library) ·
post 151 (dated blog posts at the root) · blog 1 (`/whats-new/`, lists all 151 posts) · form 3 (appointment, contact,
patient registration) · sitemap 1 (ADDED `/sitemap/`: list every ctx.pages entry grouped by section).
```
{ path, url, key, kind, section: first path segment ('' for home),
  title (live <title>), h1 (live H1 text; render it as the page's only <h1>),
  head: { title, description, canonical, robots, og: {...}, jsonld: [...] },
  crumbs: [{ name, path }]      // Home, then URL ancestors that exist as pages (named by their H1), then this page
  liveCrumbs: [{ name, path }] | null
  children: [{ path, title }]   // pages directly under this one in the URL tree
  hero: { image: <live url>, overlay, blocks: [Block] } | null   // builder pages only: the live first photo row.
        // The image is a small live photo (often 1280 px or less): use it as a framed/cut photo or a blurred back
        // plane, or use the section art (4.4) as the full-bleed back plane. hero.blocks are mostly heading/rich/button
        // (render in the hero pane) but can hold ANY block type (e.g. locations on /hours-location/): render the
        // non-text ones in the first content section, never drop them.
  rows: [ { id, vis: 'all'|'desktop', bg: { kind: 'photo'|'color'|'none', image?, overlay? },
            groups: [ { cols: [ { w, small, blocks: [Block] } ] } ] } ]
        // builder pages: the live rows in order (a row may stack several groups; cols are side by side);
        // article/post/blog/form pages: ONE row id "content" with one column holding the content blocks.
  date: 'Oct 30, 2013' | null   // posts
}
```
Block (`t`):
- `heading {level, html}` (an h1 level inside rows is the live page H1: render it as the page's h1 if the template has
  not printed one, else as h2) · `rich {html}` · `html {html}` · `unknown {module, html}` (render like rich)
- `button {text, href, external}` · `callout {title, html, href, external, image, imageAlt, icon}`
- `image {src, alt, href, caption}` · `gallery {items:[{src, alt, title, href}]}` · `carousel {items:[{src, alt}]}`
- `accordion {items:[{q, html}]}` · `testimonials {view, items:[{html, name, rating, photo, when?}]}`
- `team {view: 'summary'|'complete', items:[{name, role, photo, photoAlt, href, html}]}` (complete = one bio)
- `locations {view, items:[{name, address:[lines], phone, tel, hours:[{day,time}], href, html, payment:{title, label, methods:[...], html}|null, labels}]}`
- `childpages {items:[{title, href, summary, image, imageAlt}]}` (hub listings: render as image/glass cards)
- `posts {items:[{path, title, date, excerpt, image}]}` · `badges {items:[{label, href, external, icon}]}` (the live
  quick-link row: Schedule An Appointment, Patient History Form, Email Us, Browse Eyewear, Enroll in Vision Membership Plan)
- `form {id, title, html, fields:[{type, label, required, description, options, sub:[{label,type}], inputType, html}], submit}`:
  render a real-looking form that is UNWIRED: `<form method="post" action="#" data-unwired>` with every control
  `disabled` until the practice connects a backend, plus a short notice. No GET (a GET would put patient data in a URL).
- `divider {}` · `search {label?}` (render the site search field) · `video {src, title}` (YouTube/Vimeo: a
  click-to-load poster button, no third-party request on load) · `crumbs {text}` (a breadcrumb typed into the live
  copy: do NOT print it; the template prints page.crumbs)
Rich html: internal links root-relative (`/eye-care-services/`), images as `<img data-ref="<live url>" alt="...">`
placeholders (render them with ctx.img inside try/catch: a few live images are dead and unharvested), video embeds as
`<div data-video="..." data-title="...">`, no scripts, no inline styles, no platform classes. Render every block type;
never drop one silently.
`ctx.site.sidebar` = the live global right sidebar of inner pages, as blocks: `search`, `badges`, `locations` (the
clinic card with hours). Inner pages show it as a sticky glass aside on wide screens and after the content on phones.
Known live defects carried or declared: the home's VSP banner image (`www.earnmorewithvsp.com/...get-vision-coverage.jpg`)
is dead on the live site too: omit that `html` block. Payment method icons are platform images: print the methods as
text chips from `payment.methods`.

### 4.4 Image-plan slots (MEDIA writes `src/content/image-plan.json`; templates reference these ids)
Stills (fal, tenebrist photography, no text anywhere): `G-HERO-HOME` (16:9 wide, subject in the right third) ·
`G-EXAM` · `G-OPTICAL` · `G-CONTACT` · `G-KIDS` · `G-IRIS` · `G-LIBRARY` · `G-SENIOR` · `G-SCREEN` · `G-SUN` ·
`G-CARE` · `G-DROP` · `G-LIGHT` (abstract amber/teal light through glass, no subject) · `G-TEAM-BG` (abstract warm
light, no people).
Cut-outs (transparent PNG): `CUT-FRAMES` (eyeglasses, 3/4 view) · `CUT-SUNGLASSES` (amber-lens sunglasses).
Loops (Higgsfield i2v, then `tools/make-loop.mjs`): `V-HERO` (from G-HERO-HOME) · `V-LIGHT` (from G-LIGHT).
Section art map (for inner heroes and menu cards): eye-care-services: G-EXAM; your-eye-health library: G-LIBRARY;
eye conditions / dry eye: G-DROP; eye exams / pediatric: G-KIDS; contact lenses: G-CONTACT; eyeglasses-contacts and
designer frames: G-OPTICAL; sunglasses: G-SUN; lens care / frames: G-CARE; vision over 40/60: G-SENIOR; computer
eyestrain / blue light: G-SCREEN; doctors / staff / about: G-TEAM-BG; contact / forms / insurance / location: G-LIGHT;
blog posts: G-IRIS. A page whose own model has a hero photo uses that real photo first.

### 4.5 Shared component vocabulary (FOUNDATION implements; HOME/INNER use; add page-specific classes with `hm-`/`pg-` prefixes)
`.wrap .wrap--wide .wrap--text` · `.section .stage` (dark tenebrist ground, pools via `.pool--amber/.pool--teal` children) ·
`.canvas` (lit ivory ground) · `.eyebrow` · `.display` (+ `em` = amber italic accent) · `.lede` ·
`.btn .btn--amber .btn--glass .btn--ghost .btn--sm .btn .ico` · `.glass .glass--light .glass--strong` ·
`.card .card--glass .card--paper .card__media .card__body` · `.chip` · `.frame` (rounded clipped image, inner glow) ·
`.cutout` (+ `data-depth`) · `.iris-ring` (decorative SVG ring) · `.prose` (long-form reading on paper) ·
`.accordion` (`details/summary`) · `.stars` · `.grid-2 .grid-3 .grid-4` (`minmax(0,1fr)` tracks) · `.rail` ·
`.seam-up` / `.seam-down` (overlap the neighbour section) · `.spotlight` (pointer light) ·
`[data-reveal] [data-stagger] [data-depth] [data-tilt] [data-magnetic]`. `parts.mjs` exports helpers:
`btn(text, href, kind)`, `eyebrow(text)`, `pools(kind)`, `cutout(slot, opts)`, `loopOrStill(ctx, videoSlot, stillSlot, opts)`,
`sectionArt(page)` (the 4.4 map), `icon(name)`, `stars(n)`.

## 5. Checks per lane (fast set)
- `node src/build.mjs` exits 0 (warnings listed, none for your files).
- Pages render without JS errors: `node tools/jserrors.mjs --base http://127.0.0.1:<port> --paths /,<a few>/`.
- No horizontal overflow at 390 and 1280: `node tools/overflow.mjs --url <url> --width 390`.
- Look at screenshots of your own work at 1280x585 (the operator's laptop window), 1440x900 and 390x844:
  `node tools/shoot.mjs --url <url> --widths 1280,1440,390 --height 800 --out tmp/shots/<lane>/<name> --scroll-steps 8 --slices 1600`
  and Read the PNGs. Fix what looks wrong. That look is the acceptance test.
