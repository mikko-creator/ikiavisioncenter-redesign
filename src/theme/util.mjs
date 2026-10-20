// util.mjs - small theme helpers shared by every template (FOUNDATION lane). No dependencies.
export const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const attr = (s) => esc(s).replace(/"/g, '&quot;');
/** html -> plain text (tags out, whitespace collapsed); entities are left as they are */
export const strip = (h) => String(h || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
export const isExt = (h) => /^https?:\/\//i.test(h || '');
/** ' target="_blank" rel="noopener"' for an external URL, '' otherwise */
export const linkAttrs = (h) => (isExt(h) ? ' target="_blank" rel="noopener"' : '');
/** ' aria-current="page"' when href is the page being rendered */
export const current = (page, href) => (page && page.path && page.path === href ? ' aria-current="page"' : '');

const S = (body, vb = '0 0 24 24', extra = '') => '<svg viewBox="' + vb + '" fill="none" aria-hidden="true" focusable="false"' + extra + '>' + body + '</svg>';
const st = 'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

/** inline SVG icons (aria-hidden; label the control that holds them) */
export const ICON = {
  phone: S('<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" ' + st + '/>'),
  pin: S('<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" ' + st + '/><circle cx="12" cy="9" r="2.5" ' + st + '/>'),
  clock: S('<circle cx="12" cy="12" r="8.5" ' + st + '/><path d="M12 7.5V12l3 2" ' + st + '/>'),
  calendar: S('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" ' + st + '/><path d="M3.5 10h17M8 3v4M16 3v4" ' + st + '/>'),
  arrow: S('<path d="M5 12h14M13 6l6 6-6 6" ' + st + '/>'),
  chevron: S('<path d="m6 9 6 6 6-6" ' + st + '/>'),
  left: S('<path d="m15 5-7 7 7 7" ' + st + '/>'),
  right: S('<path d="m9 5 7 7-7 7" ' + st + '/>'),
  ext: S('<path d="M7 17 17 7M9 7h8v8" ' + st + '/>'),
  menu: S('<path d="M4 7h16M4 12h16M4 17h10" ' + st + '/>'),
  close: S('<path d="M6 6l12 12M18 6 6 18" ' + st + '/>'),
  search: S('<circle cx="11" cy="11" r="6.5" ' + st + '/><path d="m16 16 4.5 4.5" ' + st + '/>'),
  mic: S('<rect x="9" y="3" width="6" height="11" rx="3" ' + st + '/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" ' + st + '/>'),
  facebook: S('<path fill="currentColor" d="M14 8V6.5c0-.8.2-1.3 1.4-1.3H17V2.2C16.7 2.1 15.7 2 14.6 2 12.2 2 10.6 3.4 10.6 6.1V8H8v3.4h2.6V22H14V11.4h2.7L17 8h-3Z"/>'),
  yelp: S('<path fill="currentColor" d="M11.2 2.3c.5.2.8.7.8 1.2v8.2c0 .9-1.1 1.3-1.7.6L4.8 6.1a1 1 0 0 1 .2-1.5 15 15 0 0 1 5.5-2.4c.2 0 .5 0 .7.1Zm2.5 11.1 6.6 2.4c.6.2.8.9.5 1.4a9 9 0 0 1-3.4 3.4c-.5.3-1.2 0-1.4-.5l-2.9-6.2c-.4-.8.4-1.6 1.2-1.4h-.1Zm-.2-2.6 5.6-3.2c.5-.3 1.2-.1 1.4.5.5 1.2.7 2.5.6 3.8 0 .6-.6 1-1.2.9l-6-1.1c-.9-.2-1.1-1.4-.4-1.9Zm-2.8 3.7-4.9 4.4a1 1 0 0 1-1.5-.2 8.5 8.5 0 0 1-1.1-3.7c0-.6.5-1 1.1-1l6 .3c.9 0 1.2 1.1.4 1.7v-1.5Zm1.6 1.3 1.5 6.3c.1.6-.3 1.1-.9 1.2-1.3.2-2.6 0-3.8-.4-.6-.2-.8-.9-.5-1.4l3-5.9c.4-.8 1.6-.6 1.7.2Z"/>'),
  google: S('<path fill="currentColor" d="M21.6 10.2H12v3.9h5.5c-.5 2.6-2.7 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.5 0 2.9.6 4 1.5l2.9-2.9A10.2 10.2 0 0 0 12 1.8a10.2 10.2 0 1 0 0 20.4c5.1 0 9.8-3.7 9.8-10.2 0-.6-.1-1.2-.2-1.8Z"/>'),
  star: S('<path fill="currentColor" d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9L12 2.6Z"/>'),
  mail: S('<rect x="3" y="5" width="18" height="14" rx="3" ' + st + '/><path d="m4 7 8 6 8-6" ' + st + '/>'),
  eye: S('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" ' + st + '/><circle cx="12" cy="12" r="3.2" ' + st + '/>'),
  glasses: S('<circle cx="6.5" cy="14" r="3.6" ' + st + '/><circle cx="17.5" cy="14" r="3.6" ' + st + '/><path d="M10.1 13.4c1.2-.8 2.6-.8 3.8 0M2.9 13 4.5 7.5M21.1 13l-1.6-5.5" ' + st + '/>'),
  form: S('<rect x="5" y="3.5" width="14" height="17" rx="2.5" ' + st + '/><path d="M9 8.5h6M9 12h6M9 15.5h3.5" ' + st + '/>'),
  card: S('<rect x="2.5" y="5.5" width="19" height="13" rx="2.5" ' + st + '/><path d="M2.5 10h19M6 15h4" ' + st + '/>'),
  play: S('<path fill="currentColor" d="M8 5.5v13l10.5-6.5L8 5.5Z"/>', '0 0 24 24', ' class="i-play"'),
  pause: S('<path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>', '0 0 24 24', ' class="i-pause"'),
  quote: S('<path fill="currentColor" d="M10 6.5C6.6 7.6 4.5 10.2 4.5 13.8V18h5.6v-5.6H7.4c.2-1.9 1.4-3.3 3.3-4l-.7-1.9Zm9 0c-3.4 1.1-5.5 3.7-5.5 7.3V18h5.6v-5.6h-2.7c.2-1.9 1.4-3.3 3.3-4L19 6.5Z"/>'),
  check: S('<path d="m5 12.5 4.5 4.5L19 7.5" ' + st + '/>'),
};
export const icon = (name) => ICON[name] || '';
