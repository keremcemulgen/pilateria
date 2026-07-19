const fs = require('fs');
const path = require('path');
const { JSDOM } = require('/tmp/piltest/node_modules/jsdom');
const file = process.argv[2];
const html = fs.readFileSync(file, 'utf-8');
let ok = 0, fail = 0;
function T(name, cond) { if (cond) { ok++; console.log('  OK  ' + name); } else { fail++; console.log('  FAIL ' + name); } }

// CSS metin denetimi
const css = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || []).join('\n');
T('@media max-width 768 blokları var', (css.match(/@media[^{]*max-width:\s*768px/g) || []).length >= 3);
T('bottom-nav CSS mevcut', css.includes('.bottom-nav'));
T('mobilde üst tabs gizleniyor', /max-width:\s*768px[\s\S]{0,2000}\.tabs[^{]*\{[^}]*display:\s*none/.test(css));
T('modal bottom-sheet (flex-end)', css.includes('align-items:flex-end') || css.includes('align-items: flex-end'));
T('overflow-x hidden (zoom fix)', css.includes('overflow-x:hidden') || css.includes('overflow-x: hidden'));
T('safe-area-inset kullanımı', css.includes('safe-area-inset'));
T('90dvh modal yüksekliği', css.includes('90dvh'));

const dom = new JSDOM(html, { runScripts: 'outside-only' });
const d = dom.window.document;
const bn = d.getElementById('bottom-nav');
T('bottom-nav DOM\'da', !!bn);
T('bottom-nav 5 öğe', bn && bn.querySelectorAll('[data-bnav]').length === 5);
T('more-sheet var', !!d.getElementById('more-sheet-bg'));
T('FAB var', !!d.querySelector('.fab, #fab, [class*="fab"]'));
T('members-cards konteyneri var', !!d.getElementById('members-cards'));
T('members-table-wrap var', !!d.getElementById('members-table-wrap'));
T('update-banner varsayılan gizli', (d.getElementById('new-version-banner')||{}).style && d.getElementById('new-version-banner').style.display === 'none');
T('viewport-fit=cover', /viewport-fit=cover/.test(html));
T('theme-color meta var', !!d.querySelector('meta[name="theme-color"]'));

// JS metin denetimi
const js = html;
T('calView mobil day başlangıcı', /innerWidth\s*<=\s*768/.test(js));
T('structuredClone polyfill/fallback', js.includes('structuredClone'));
T('switchPage bottom-nav senkronu', /data-bnav/.test(js) && js.includes('switchPage'));
console.log(`\nSONUC: ${ok} gecti, ${fail} kaldi`);
process.exit(fail ? 1 : 0);
