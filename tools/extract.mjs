// extract.mjs - audit/raw (the crawl) -> src/content/pages/*.json + the derived parts of src/content/site.json.
//   node tools/extract.mjs [--min 0.97]
// Per page: src/lib/extract.mjs extractPage(), then crumbs (URL ancestors that exist as pages, named by their live
// H1, home first) and children (pages directly under it in the URL tree). Also writes into site.json (keeping every
// hand-written field): redirects (the crawl's same-origin redirect chains, B9) and sidebar (the global right widget
// area: search, quick-link badges, location card). ADDS one page: /sitemap/ (the live footer links it, live 404s).
// Recall: every word of the live article/main text must appear in the model; pages under --min are listed and the
// run exits 1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPage, extractSidebar, rawMainText, ORIGIN } from '../src/lib/extract.mjs';
import { decode } from '../src/lib/html-util.mjs';

const PROJ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const MIN = Number(args.min || 0.97);
const crawl = JSON.parse(fs.readFileSync(path.join(PROJ, 'audit/crawl.json'), 'utf8'));
const OUTDIR = path.join(PROJ, 'src/content/pages');
fs.rmSync(OUTDIR, { recursive: true, force: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const keyOf = (p) => (p === '/' ? 'index' : p.replace(/^\/|\/$/g, '').replace(/\//g, '__').replace(/[^\p{L}\p{N}_.-]+/gu, '_').toLowerCase());
const byPath = new Map();
for (const r of crawl.records) {
  if (r.status !== 200 || !r.file) continue;
  const final = new URL(r.finalUrl || r.url);
  if (final.search) continue;
  if (byPath.has(final.pathname)) continue;
  byPath.set(final.pathname, r);
}
const pages = [];
for (const [p, r] of [...byPath].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  const html = fs.readFileSync(path.join(PROJ, r.file), 'utf8');
  const m = extractPage(html, ORIGIN + p);
  m.key = keyOf(p);
  m.rawFile = r.file;
  pages.push(m);
}
const have = new Map(pages.map((m) => [m.path, m]));
const depth = (p) => p.split('/').filter(Boolean).length;
for (const m of pages) {
  const parts = m.path.split('/').filter(Boolean);
  const crumbs = [{ name: 'Home', path: '/' }];
  for (let i = 1; i < parts.length; i++) {
    const a = '/' + parts.slice(0, i).join('/') + '/';
    if (have.has(a)) crumbs.push({ name: have.get(a).h1 || have.get(a).title, path: a });
  }
  if (m.path !== '/') crumbs.push({ name: m.h1 || m.title, path: m.path });
  m.crumbs = crumbs;
  m.children = pages.filter((q) => q.path !== m.path && q.path.startsWith(m.path) && depth(q.path) === depth(m.path) + 1 && m.path !== '/')
    .map((q) => ({ path: q.path, title: q.h1 || q.title }));
}

// ---------- /sitemap/ (ADD): the live footer links it and the live server answers 404 ----------
pages.push({
  path: '/sitemap/', url: ORIGIN + '/sitemap/', key: 'sitemap', kind: 'sitemap', section: 'sitemap', title: 'Sitemap | Icare Clinic', h1: 'Sitemap',
  head: { title: 'Sitemap | Icare Clinic', description: null, canonical: null, robots: 'noindex, follow', og: {}, jsonld: [] },
  liveCrumbs: null, hero: null, rows: [], date: null, crumbs: [{ name: 'Home', path: '/' }, { name: 'Sitemap', path: '/sitemap/' }], children: [],
  added: 'ADD: the live footer links /sitemap/, which answers 404 on the live site; the rebuild lists every page here.',
});

// ---------- recall ----------
const wordsOf = (s) => (decode(String(s)).toLowerCase().replace(/[’‘]/g, "'").match(/[a-z0-9]+(?:'[a-z]+)?/g) || []);
const report = [];
for (const m of pages) {
  if (m.kind === 'sitemap') continue;
  const raw = fs.readFileSync(path.join(PROJ, m.rawFile), 'utf8');
  const want = new Set(wordsOf(rawMainText(raw).replace(/\[CITY\]/g, 'Houston')));
  const got = new Set(wordsOf(JSON.stringify({ h1: m.h1, hero: m.hero, rows: m.rows, date: m.date }).replace(/<[^>]+>/g, ' ').replace(/\\u[0-9a-f]{4}/gi, (x) => String.fromCharCode(parseInt(x.slice(2), 16)))));
  const miss = [...want].filter((w) => !got.has(w));
  const recall = want.size ? (want.size - miss.length) / want.size : 1;
  report.push({ path: m.path, kind: m.kind, words: want.size, recall: +recall.toFixed(4), missing: miss.slice(0, 25) });
}
report.sort((a, b) => a.recall - b.recall);
const med = report[Math.floor(report.length / 2)].recall;
const low = report.filter((r) => r.recall < MIN);

// ---------- write ----------
for (const m of pages) { delete m.rawFile; fs.writeFileSync(path.join(OUTDIR, m.key + '.json'), JSON.stringify(m, null, 1) + '\n'); }
const siteFile = path.join(PROJ, 'src/content/site.json');
const site = JSON.parse(fs.readFileSync(siteFile, 'utf8'));
site.redirects = [];
for (const r of crawl.records) {
  if (!r.chain || !r.chain.length || r.status !== 200) continue;
  const from = new URL(r.url).pathname, to = new URL(r.finalUrl).pathname;
  if (from !== to && !site.redirects.some((x) => x.from === from)) site.redirects.push({ from, to, status: r.chain[0].status });
}
const staff = crawl.records.find((r) => r.file && /the-staff\.html$/.test(r.file));
site.sidebar = staff ? extractSidebar(fs.readFileSync(path.join(PROJ, staff.file), 'utf8'), ORIGIN + '/the-staff/') : [];
fs.writeFileSync(siteFile, JSON.stringify(site, null, 2) + '\n');
fs.mkdirSync(path.join(PROJ, 'docs/data'), { recursive: true });
fs.writeFileSync(path.join(PROJ, 'docs/data/extract-recall.json'), JSON.stringify({ min: MIN, median: med, pages: report }, null, 1));
const kinds = {};
for (const m of pages) kinds[m.kind] = (kinds[m.kind] || 0) + 1;
console.log('pages', pages.length, JSON.stringify(kinds), '| redirects', site.redirects.length, '| sidebar blocks', site.sidebar.length);
console.log('recall median', med, '| below', MIN + ':', low.length);
for (const r of low.slice(0, 30)) console.log('  ', r.recall, r.path, r.missing.slice(0, 12).join(' '));
process.exitCode = low.length ? 1 : 0;
