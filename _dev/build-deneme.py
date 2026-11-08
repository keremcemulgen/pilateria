#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DENEME KOPYASI (Kerem 03.11: "yapacağın güncellemeleri önce bir kopya alıp orada deneyeceksin ki yayında ki uygulamayı etkilemesin").
Aday sürümden (varsayılan: pilateria.html) deneme.html üretir. Deneme kopyası:
  • Buluta HİÇ bağlanmaz: SUPABASE_MODE=false, JSONBin itme/çekme kapalı, CSP connect-src yalnız 'self' (tarayıcı her dış isteği engeller:
    Supabase, WhatsApp API, her şey). Service worker kaydı yok.
  • Gerçek uygulamanın tarayıcı deposuna (localStorage) HİÇ YAZMAZ: tüm depolama çağrıları __DLS'ye gider; __DLS sekmeye özel
    sessionStorage'da 'deneme:' önekiyle tutar (dolarsa bellek). İlk açılışta YALNIZ gerçek veri anahtarı 'pilateria' bir kez OKUNUR
    (kopya) — giriş/senkron anahtarları kopyalanmaz. Sekme kapanınca deneme verisi silinir; "Kopyayı yenile" yeniden kopyalar.
  • Üstte kırmızı DENEME bandı + başlık.
Kullanım: python3 _dev/build-deneme.py [kaynak.html]  → deneme.html"""
import re, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else 'pilateria.html'
h = open(SRC, encoding='utf-8').read()

def rep(old, new, label, count=1):
    global h
    c = h.count(old)
    assert c == count, f'{label}: beklenen {count}, bulunan {c}'
    h = h.replace(old, new)

# 1) bulut kapalı
rep('const SUPABASE_MODE = true;', 'const SUPABASE_MODE = false; /* DENEME KOPYASI: bulut YOK */', 'supabase off')
rep('function syncConfigured() { if (SUPABASE_MODE) return false; return !!(syncCfg.enabled && syncCfg.key && syncCfg.bin); }',
    'function syncConfigured() { return false; /* DENEME KOPYASI: bulut YOK */ }', 'syncConfigured off')
rep('async function pushToCloud(silent) {', 'async function pushToCloud(silent) {\n  if (true) return false; // DENEME KOPYASI: hiçbir veri gönderilmez', 'push off')
rep('async function pullFromCloud(silent) {', 'async function pullFromCloud(silent) {\n  if (true) return false; // DENEME KOPYASI: hiçbir veri çekilmez', 'pull off')
rep("connect-src 'self' https://nvbnmhaxumrfsxdzrzzj.supabase.co wss://nvbnmhaxumrfsxdzrzzj.supabase.co", "connect-src 'self'", 'CSP connect self')
rep("navigator.serviceWorker.register('sw.js')", "Promise.resolve() /* DENEME KOPYASI: SW kaydı yok */", 'sw off')
h = h.replace('<script src="supabase-vendor.js"></script>', '<!-- DENEME KOPYASI: supabase-vendor yüklenmez -->')

# 2) depolama: gerçek localStorage'a ASLA yazılmaz
n = h.count('localStorage')
h = h.replace('localStorage', '__DLS')
SHIM = r'''<script>/* DENEME KOPYASI — depolama kalkanı: gerçek uygulamanın deposuna yazılmaz */
(function(){
  var P = 'deneme:', mem = {}, ss = null;
  try { ss = window.sessionStorage; ss.setItem(P + '__t', '1'); ss.removeItem(P + '__t'); } catch(e) { ss = null; }
  function g(k){ k = P + k; if (ss) { try { var v = ss.getItem(k); if (v !== null) return v; } catch(e) {} } return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; }
  function s(k, v){ k = P + k; v = String(v); if (ss) { try { ss.setItem(k, v); delete mem[k]; return; } catch(e) {} } mem[k] = v; }
  function r(k){ k = P + k; if (ss) { try { ss.removeItem(k); } catch(e) {} } delete mem[k]; }
  function keys(){ var out = {}; if (ss) { try { for (var i = 0; i < ss.length; i++) { var k = ss.key(i); if (k && k.indexOf(P) === 0) out[k.slice(P.length)] = 1; } } catch(e) {} } Object.keys(mem).forEach(function(k){ out[k.slice(P.length)] = 1; }); return Object.keys(out).filter(function(k){ return k !== '__seeded'; }).sort(); }
  // ilk açılış: YALNIZ gerçek veri anahtarı 'pilateria' bir kez OKUNUR (kopya). Giriş/senkron/yedek anahtarları kopyalanmaz.
  if (g('__seeded') === null) { try { var real = window['local' + 'Storage'].getItem('pilateria'); if (real) s('pilateria', real); } catch(e) {} s('__seeded', new Date().toISOString()); }
  window.__DLS = { getItem: g, setItem: s, removeItem: r, key: function(i){ return keys()[i] || null; }, clear: function(){ keys().forEach(r); }, get length(){ return keys().length; } };
  window.__denemeYenile = function(){ if (!confirm('Deneme verisi silinip gerçek uygulamadaki verinin yeni bir kopyası alınsın mı? (Gerçek veriye dokunulmaz.)')) return; keys().forEach(r); r('__seeded'); location.reload(); };
})();</script>
'''
i = h.find('<script>')
h = h[:i] + SHIM + h[i:]

# 3) bant + başlık + sürüm etiketi
rep('<title>Pilateria - Stüdyo Yönetim</title>', '<title>🧪 DENEME — Pilateria</title>', 'title')
band = ('<div id="deneme-band" style="position:sticky;top:0;z-index:1000000;background:#b91c1c;color:#fff;padding:8px 12px;text-align:center;font-size:12.5px;font-weight:700;line-height:1.45;">'
        '🧪 DENEME KOPYASI — gerçek verinin bir kopyası. Buluta bağlı DEĞİL; burada yaptığın hiçbir değişiklik gerçek uygulamaya gitmez. '
        'Sekmeyi kapatınca deneme verisi silinir. '
        '<a href="#" onclick="__denemeYenile();return false;" style="color:#fde68a;">Kopyayı yenile</a> · '
        '<a href="pilateria.html" style="color:#fde68a;">Gerçek uygulama →</a></div>\n')
i = h.find('<body'); i = h.find('>', i) + 1
h = h[:i] + '\n' + band + h[i:]
m = re.search(r'<meta name="app-version" content="([^"]+)">', h); ver = m.group(1)
h = h.replace(f'<meta name="app-version" content="{ver}">', f'<meta name="app-version" content="{ver}-deneme">')
h = h.replace(f"APP_VERSION = '{ver}'", f"APP_VERSION = '{ver}-deneme'")

# bütünlük
assert 'localStorage' not in h.replace("window['local' + 'Storage']", '')
assert "connect-src 'self';" in h or "connect-src 'self'\"" in h or "connect-src 'self' " in h
assert 'const SUPABASE_MODE = false;' in h
open('deneme.html', 'w', encoding='utf-8').write(h)
print('deneme.html üretildi:', len(h), 'karakter · sürüm', ver + '-deneme', '· depolama çağrısı', n)
