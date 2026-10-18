# -*- coding: utf-8 -*-
# v197b (Kerem 18.10, ekran görüntüsü): "Bak üst satır böyle ortaya düşüyor sayfada" — üye detay penceresindeki ders tablosunun
# başlık satırı (Tarih · Saat · Hoca · Tip · Durum · İşlem) geniş ekranda kaydırınca pencerenin ORTASINA yapışıp bir satırı örtüyor.
# KÖK: v11 "yapışkan tablo başlığı" kuralı (thead.sticky-thead th { position:sticky; top:110px/108px }) ana sayfadaki sekme
# çubuğunu hesaba katarak yazıldı; pencere (modal) içindeki tablolara da uygulanıyor. Pencerede kaydırma kabı .modal-bg olduğu
# için başlık görünür alanın 108 px altında asılı kalıyor (Chromium 1366px'de üretildi: başlık 17.10 satırını örttü).
# ≤768px'de sticky zaten kapalı (v63) → telefonda görünmüyor; bilgisayar + yatay tablet etkileniyor.
# ÇÖZÜM: pencere içindeki tablolarda yapışkan başlık KAPALI (position:static). Başka hiçbir stil değişmez.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep("""  .table-wrap:has(table.sticky-head),
  .table-wrap:has(thead.sticky-thead) {
    overflow-x: visible;
    overflow-y: visible;
  }
""",
"""  .table-wrap:has(table.sticky-head),
  .table-wrap:has(thead.sticky-thead) {
    overflow-x: visible;
    overflow-y: visible;
  }
  /* v197 (Kerem 18.10): pencere (modal) içindeki tablolarda yapışkan başlık KAPALI — kaydırma kabı pencere olduğu için
     başlık 108 px aşağıda, satırların ortasında asılı kalıyordu. Pencere tabloları kısa; başlık yerinde durur. */
  .modal thead.sticky-thead th, .modal table.sticky-head thead th { position: static !important; top: auto !important; box-shadow: none !important; }
  .modal .table-wrap:has(table.sticky-head), .modal .table-wrap:has(thead.sticky-thead) { overflow-x: auto; overflow-y: visible; }
""")

# sürüm üçlüsü (meta + APP_VERSION; sw.js ayrı)
rep('<meta name="app-version" content="2026.10.17.119">', '<meta name="app-version" content="2026.10.18.120">')
rep("const APP_VERSION = '2026.10.17.119';", "const APP_VERSION = '2026.10.18.120';")
io.open(P, 'w', encoding='utf-8').write(s)
print('OK v197b modal-sticky + version: %d -> %d (+%d)' % (n0, len(s), len(s) - n0))

SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v196-2026-10-17-119';"
assert w.count(old) == 1, 'sw.js CACHE_NAME anchor'
w = w.replace(old, "const CACHE_NAME = 'pilateria-v197-2026-10-18-120';")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
