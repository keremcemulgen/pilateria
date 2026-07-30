# -*- coding: utf-8 -*-
# v130 — GRUP MESAJI HAZIRLAYICI (A+B'nin B'si)
# Sunucu v2 (wa-morning-v2-groups.sql) bugun kuruldu: wa_morning_log.data.gruplar uretiliyor
# (bugun 4 grup, gercek veriyle dogrulandi). Bu yama panele grup bolumunu ekler:
#  - kartta "N grup mesaji hazir"
#  - detay modalinde grup satirlari + 📋 Kopyala (panoya kopyala -> WhatsApp grubuna yapistir)
# NOT: resmi API grup sohbetine GONDEREMEZ — bu bilincli olarak kopyala/yapistir akisidir.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# 1) kartta grup sayisi
rep("""      + (bad ? ' · <span style="color:#c62828;font-weight:700;">' + bad + ' sorunlu numara</span>' : '')
      + ' · <a href="#" onclick="waMorningDetail();return false;">listele</a>';
""",
"""      + (bad ? ' · <span style="color:#c62828;font-weight:700;">' + bad + ' sorunlu numara</span>' : '')
      + ((d.gruplar && d.gruplar.length) ? ' · <b>' + d.gruplar.length + '</b> grup mesajı hazır 📋' : '')
      + ' · <a href="#" onclick="waMorningDetail();return false;">listele</a>';
""")

# 2) detay modaline grup bolumu + kopyalama fonksiyonlari
rep("""  mdl.innerHTML = `<div class="modal" style="max-width:600px;max-height:82vh;overflow:auto;">
    <h3>📱 Sabah mesajları — ${todayISO()} (${d.mode === 'live' ? 'CANLI' : 'GÖLGE MOD'})</h3>
""",
"""  const gs = (d.gruplar || []).map(function(g, i) {
    return `<div class="row" style="gap:8px;align-items:center;margin:4px 0;padding:8px 10px;background:#F1F8FF;border-radius:8px;flex-wrap:wrap;">
      <b>👯 ${escapeHtml(g.ad || 'Grup')}</b><span class="badge ok">${escapeHtml(g.saat || '')}</span>
      <span style="flex:1;color:var(--muted);font-size:12px;min-width:180px;">${escapeHtml(g.mesaj || '')}</span>
      <button class="btn small" onclick="waCopyGroupMsg(${i})">📋 Kopyala</button>
    </div>`;
  }).join('');
  mdl.innerHTML = `<div class="modal" style="max-width:600px;max-height:82vh;overflow:auto;">
    <h3>📱 Sabah mesajları — ${todayISO()} (${d.mode === 'live' ? 'CANLI' : 'GÖLGE MOD'})</h3>
    ${gs ? `<div style="margin:6px 0 10px;">
      <div style="font-weight:700;font-size:13px;margin-bottom:2px;">💬 Grup mesajları — kopyala, WhatsApp grubuna yapıştır</div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:4px;">Resmî WhatsApp sistemi grup sohbetine otomatik gönderemez; metinler hazır, yapıştırmak 30 saniye.</div>
      ${gs}
    </div>` : ''}
""")

rep("""function waMorningDetail() {
""",
"""// v130: grup mesajini panoya kopyala (WhatsApp grubuna yapistirilir — otomatik gonderim resmi API'de yok)
function waCopyGroupMsg(i) {
  const d = window.__waMorningData;
  const g = d && d.gruplar && d.gruplar[i];
  if (!g) return;
  const txt = g.mesaj || '';
  const done = function() { if (window.plToast) plToast('📋 Kopyalandı — WhatsApp\\'ta "' + (g.ad || 'grup') + '" sohbetine yapıştır'); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function() { __waCopyFallback(txt, done); });
    } else __waCopyFallback(txt, done);
  } catch(e) { __waCopyFallback(txt, done); }
}
function __waCopyFallback(txt, done) {
  try {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); done();
  } catch(e) { alert(txt); }
}
function waMorningDetail() {
""")

# 3) surum
rep('<meta name="app-version" content="2026.07.30.52">', '<meta name="app-version" content="2026.07.30.53">')
rep("const APP_VERSION = '2026.07.30.52';", "const APP_VERSION = '2026.07.30.53';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v129-2026-07-30-52';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v130-2026-07-30-53';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
