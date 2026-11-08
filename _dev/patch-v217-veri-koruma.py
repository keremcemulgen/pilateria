# -*- coding: utf-8 -*-
# v217 — KALICI KURAL (Kerem 03.11): "Bir daha hiçbir güncelleme uygulamada mevcut girilmiş bilgileri değiştirmeyecek."
# (1) v216 ONARIM-4 ("Grubundan düşmüş üye") açılış sorusu KAPATILDI — Kerem 02.11 kararı "Dokunma, ben bakacağım"; tarama fonksiyonu
#     yalnız teşhis için durur (hiçbir şey yazmaz, kendiliğinden çağrılmaz).
# (2) Güncelleme veri koruma kapısı: `_dev/tests/update-data-invariance-217-test.js` — eski (canlı) ve yeni sürüm aynı kayıtlı veriyle
#     açılır; kaydedilen veri birebir aynı olmalı. Her yüklemeden önce takımda koşar; FAIL ise yükleme YAPILMAZ.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:160])
    s = s.replace(old, new)

rep('<meta name="app-version" content="2026.11.02.139">', '<meta name="app-version" content="2026.11.03.140">')
rep("const APP_VERSION = '2026.11.02.139';", "const APP_VERSION = '2026.11.03.140';")
rep("""  try { await __offerGroupOrphanRepair216(); } catch(e) {} // v216""",
    """  // v217 (Kerem 03.11: "Bir daha hiçbir güncelleme uygulamada mevcut girilmiş bilgileri değiştirmeyecek" · 02.11 "Dokunma, ben bakacağım"):
  // v216 ONARIM-4 açılış sorusu KAPALI — onarım yalnız Kerem açıkça isterse.""")
io.open(P, 'w', encoding='utf-8').write(s)
W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v216-2026-11-02-139';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v216-2026-11-02-139';", "const CACHE_NAME = 'pilateria-v217-2026-11-03-140';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v217 OK')
