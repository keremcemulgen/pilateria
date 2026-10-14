# -*- coding: utf-8 -*-
# v193 (Kerem 14.10, panel ekran goruntusu): v192'nin "bulut N ders = uygulama N" kaniti panelin EN ALTINDAKI kartta
# (sayfa ustunden ~4.900 px asagida) kaliyordu; Kerem'in baktigi yerde (sayac kutularinin hemen alti) gorunmuyordu.
# Ayni metin artik sayac kutularinin hemen altina da yazilir (tek kaynak: __renderSyncStatusLine, iki hedef).
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep("""    <div class="stat bad"><div class="label">1 Kalan / Biten</div><div class="value" id="s-low">0</div></div>
  </div>
  <div class="card">
    <h2>🔔 Yaklaşan Dersler (Bugün kalan + Yarın)</h2>""",
"""    <div class="stat bad"><div class="label">1 Kalan / Biten</div><div class="value" id="s-low">0</div></div>
  </div>
  <div id="dash-sync-status-top" style="margin:-4px 0 10px 2px;font-size:12px;color:var(--muted);"></div><!-- v193: bulut/uygulama ders sayimi kaniti ustte -->
  <div class="card">
    <h2>🔔 Yaklaşan Dersler (Bugün kalan + Yarın)</h2>""")

rep("""function __renderSyncStatusLine(mode, last) {
  const el = document.getElementById('dash-sync-status');
  if (!el) return;
  if (SUPABASE_MODE && !sbClient) { el.textContent = ''; return; }
  if (mode === 'offline') {
    el.innerHTML = '⚠️ <b style="color:#c62828;">Buluta GÖNDERİLEMİYOR</b> — değişiklikler bu cihazda bekliyor' + (last ? ' · son başarılı gönderim: ' + last : '') + ' · <a href="#" onclick="cloudDotClick();return false;">şimdi dene</a>';
  } else if (mode === 'syncing' || mode === 'pending') {
    el.textContent = '☁️ Buluta yazılıyor…';
  } else {""",
"""function __renderSyncStatusLine(mode, last) {
  const el = document.getElementById('dash-sync-status');
  if (!el) return;
  const __top193 = document.getElementById('dash-sync-status-top'); // v193: ayni metin sayac kutularinin altinda da
  const __mirror193 = function(){ try { if (__top193) __top193.innerHTML = el.innerHTML; } catch(e) {} };
  if (SUPABASE_MODE && !sbClient) { el.textContent = ''; __mirror193(); return; }
  if (mode === 'offline') {
    el.innerHTML = '⚠️ <b style="color:#c62828;">Buluta GÖNDERİLEMİYOR</b> — değişiklikler bu cihazda bekliyor' + (last ? ' · son başarılı gönderim: ' + last : '') + ' · <a href="#" onclick="cloudDotClick();return false;">şimdi dene</a>';
    __mirror193();
  } else if (mode === 'syncing' || mode === 'pending') {
    el.textContent = '☁️ Buluta yazılıyor…';
    __mirror193();
  } else {""")
rep("""    el.innerHTML = '☁️ Bulut senkron aktif' + (last ? ' · son gönderim: ' + escapeHtml(String(last)) : '') + __cnt192;
  }
}""",
"""    el.innerHTML = '☁️ Bulut senkron aktif' + (last ? ' · son gönderim: ' + escapeHtml(String(last)) : '') + __cnt192;
    __mirror193();
  }
}""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.10.14.115">', '<meta name="app-version" content="2026.10.14.116">')
rep("const APP_VERSION = '2026.10.14.115';", "const APP_VERSION = '2026.10.14.116';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v192-2026-10-14-115'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v193-2026-10-14-116'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
