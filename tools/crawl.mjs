// crawl.mjs - polite same-origin harvest of ikiavisioncenter.com (EyeCarePro WordPress + Beaver Builder) into audit/raw/.
//   node tools/crawl.mjs [--gap 700] [--max 300]
// 1. Inventory: every <loc> of /sitemap.xml -> audit/sitemap-inventory.json (the declared architecture).
// 2. Seeds: "/" plus every sitemap URL; then BFS over every same-origin <a href> found (the menus link pages the
//    sitemap leaves out), up to --max pages.
// Breakers: ONE connection, --gap ms between requests; the first 401/403/429/503 stops the run (a refusal is a stop, never
// retried); 5 x 404 inside any 300 s window stops the run. robots.txt Disallow paths are never asked.
// Writes audit/raw/<key>.html (untouched bytes) and audit/crawl.json (url, status, chain, file, bytes, contentType).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const GAP = Number(args.gap || 700), MAX = Number(args.max || 300), MAX404 = Number(args.max404 || 5);
// --resume: keep audit/crawl.json's records, re-queue its pending URLs plus every unseen link in the saved pages.
const ORIGIN = 'https://www.ikiavisioncenter.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const RAW = path.join(PROJ, 'audit/raw');
fs.mkdirSync(RAW, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// robots.txt (fetched 2026-10-20): /wp-admin/, /wp-login.php, /wp-signup.php, /trackback, /comments, */trackback, */comments
const EXCLUDE = [/\/wp-json/i, /\/feed\/?$/i, /\/wp-admin/i, /wp-login\.php/i, /wp-signup\.php/i, /xmlrpc\.php/i, /\/trackback/i,
  /\/comments(\/|$)/i, /[?&]s=/i, /replytocom=/i, /\/wp-content\//i, /\/wp-includes\//i,
  /\.(jpe?g|png|gif|webp|svg|pdf|zip|mp4|webm|css|js|xml|ico|woff2?|ttf|ics)(\?|$)/i];

function norm(u, base) {
  let x;
  try { x = new URL(u, base); } catch { return null; }
  if (!/^https?:$/.test(x.protocol)) return null;
  if (!/^(www\.)?ikiavisioncenter\.com$/i.test(x.hostname)) return null;
  x.protocol = 'https:'; x.hostname = 'www.ikiavisioncenter.com'; x.hash = '';
  const keep = new URLSearchParams();
  for (const [k, v] of x.searchParams) if (/^(page|paged)$/i.test(k)) keep.set(k, v);
  x.search = keep.toString() ? '?' + keep.toString() : '';
  let p = x.pathname.replace(/\/{2,}/g, '/');
  if (!/\.[a-z0-9]{2,5}$/i.test(p) && !p.endsWith('/')) p += '/';
  x.pathname = p;
  const s = x.toString();
  return EXCLUDE.some((re) => re.test(s)) ? null : s;
}
const keyOf = (u) => {
  const x = new URL(u);
  let k = decodeURIComponent(x.pathname).replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'index';
  k = k.replace(/[^\p{L}\p{N}_.-]+/gu, '_');
  if (x.search) k += '__q_' + x.search.slice(1).replace(/[^a-z0-9]+/gi, '_');
  return k.toLowerCase().slice(0, 150);
};

let stopped = null;
const recent404 = [];
async function get(u) {
  const chain = [];
  let cur = u;
  for (let hop = 0; hop < 8; hop++) {
    const res = await fetch(cur, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/xml' } });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      const next = new URL(res.headers.get('location'), cur).toString();
      chain.push({ from: cur, status: res.status, to: next });
      await res.arrayBuffer().catch(() => {});
      if (!/^https?:\/\/(www\.)?ikiavisioncenter\.com/i.test(next)) return { status: res.status, chain, offOrigin: next };
      cur = next; await sleep(GAP); continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, chain, finalUrl: cur, contentType: res.headers.get('content-type') || '', buf };
  }
  return { status: 0, chain, error: 'too many redirects' };
}
function breaker(status, u) {
  if ([401, 403, 429, 503].includes(status)) { stopped = 'refusal ' + status + ' at ' + u; return true; }
  if (status === 404) {
    const now = Date.now(); recent404.push(now);
    while (recent404.length && now - recent404[0] > 300000) recent404.shift();
    if (recent404.length >= MAX404) { stopped = MAX404 + ' x 404 inside 300 s (last ' + u + ')'; return true; }
  }
  return false;
}

// ---------- 1. sitemap inventory ----------
const inventory = { origin: ORIGIN, at: new Date().toISOString(), sitemaps: [], urls: [] };
{
  const r = await get(ORIGIN + '/sitemap.xml'); await sleep(GAP);
  if (r.status !== 200) { console.error('sitemap', r.status); process.exit(1); }
  const xml = r.buf.toString('utf8');
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const loc = (/<loc>([^<]+)<\/loc>/.exec(m[1]) || [])[1];
    const lastmod = (/<lastmod>([^<]+)<\/lastmod>/.exec(m[1]) || [])[1] || null;
    return loc ? { type: 'page', url: loc.trim(), lastmod } : null;
  }).filter(Boolean);
  inventory.sitemaps.push({ sitemap: ORIGIN + '/sitemap.xml', type: 'page', status: r.status, count: urls.length });
  inventory.urls.push(...urls);
  console.log('sitemap', r.status, urls.length);
  fs.writeFileSync(path.join(PROJ, 'audit/sitemap-inventory.json'), JSON.stringify(inventory, null, 1));
}

// ---------- 2. seeds + 3. BFS ----------
const records = [];
const seen = new Set();
const queue = [];
const push = (u, from) => {
  const n = norm(u, from || ORIGIN);
  if (!n || seen.has(n)) return;
  seen.add(n); queue.push(n);
};
if (args.resume) {
  const prev = JSON.parse(fs.readFileSync(path.join(PROJ, 'audit/crawl.json'), 'utf8'));
  for (const r of prev.records) { records.push(r); seen.add(r.url); if (r.finalUrl) seen.add(r.finalUrl); }
  for (const u of prev.pending || []) push(u);
  for (const r of prev.records) {
    if (r.status !== 200 || !r.file) continue;
    const html = fs.readFileSync(path.join(PROJ, r.file), 'utf8');
    for (const m of html.matchAll(/<a\b[^>]*?\shref\s*=\s*["']\s*([^"'#][^"']*)["']/gi)) push(m[1].replace(/&amp;/g, '&').trim(), r.finalUrl || r.url);
  }
  console.log('resume: kept', records.length, 'records; queued', queue.length);
} else {
  push(ORIGIN + '/');
  for (const u of inventory.urls) push(u.url);
}
console.log('seeds', queue.length);
const MAXTOTAL = MAX + (args.resume ? records.length : 0);

while (queue.length && records.length < MAXTOTAL) {
  const u = queue.shift();
  let r;
  try { r = await get(u); } catch (e) { records.push({ url: u, status: 0, error: String(e.message || e) }); await sleep(GAP); continue; }
  const rec = { url: u, status: r.status, chain: r.chain, finalUrl: r.finalUrl || null, contentType: r.contentType || null, inSitemap: inventory.urls.some((x) => norm(x.url) === u) };
  if (r.offOrigin) rec.offOrigin = r.offOrigin;
  if (breaker(r.status, u)) { rec.refused = r.status !== 404; records.push(rec); if (stopped) break; }
  if (r.buf && /text\/html/i.test(r.contentType || '')) {
    const key = keyOf(r.finalUrl || u);
    const file = 'audit/raw/' + key + '.html';
    fs.writeFileSync(path.join(PROJ, file), r.buf);
    rec.file = file; rec.bytes = r.buf.length;
    if (r.status === 200) {
      const html = r.buf.toString('utf8');
      for (const m of html.matchAll(/<a\b[^>]*?\shref\s*=\s*["']\s*([^"'#][^"']*)["']/gi)) push(m[1].replace(/&amp;/g, '&').trim(), r.finalUrl || u);
    }
    if (r.finalUrl && r.finalUrl !== u) { const n = norm(r.finalUrl); if (n) seen.add(n); }
  }
  if (!rec.refused || r.status === 404) records.push(rec);
  process.stdout.write(`${records.length} ${r.status} ${u}${r.chain.length ? ' -> ' + (r.finalUrl || r.offOrigin) : ''}\n`);
  await sleep(GAP);
}
const out = { origin: ORIGIN, at: new Date().toISOString(), robotsHonoured: true, gapMs: GAP, max: MAX, truncated: queue.length > 0 && !stopped,
  stopped, pending: queue.slice(0, 50), pendingCount: queue.length, counts: {
    total: records.length, ok: records.filter((r) => r.status === 200).length,
    redirected: records.filter((r) => r.chain && r.chain.length).length, notFound: records.filter((r) => r.status === 404).length },
  records };
fs.writeFileSync(path.join(PROJ, 'audit/crawl.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.counts), 'stopped:', stopped, 'pending:', queue.length);
process.exitCode = stopped ? 1 : 0;
