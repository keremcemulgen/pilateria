# -*- coding: utf-8 -*-
# v135 — KEREM KURALI (2026-07-31): hoca BORDROSUNDA her ders 1 SAAT sayilir.
# Dersler 45 dk ama aralarda dinlenme/hazirlik var; SGK ve IBAN maasi ders suresinden
# BAGIMSIZ, ders adedi x 1 saat uzerinden hesaplanir. Hakedis motoru (v41) DEGISMEZ.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) motor: saat = ders adedi ----------
rep("""  const saat = Math.round(e.lessons.reduce(function(a, l) { return a + ((+l.durationMin || +state.settings.lessonDuration || 60) / 60); }, 0) * 100) / 100;""",
"""  // v135 Kerem kurali: her ders 1 saat sayilir (45dk ders + mola vb. = 1 saat).
  // Ders suresi bordroyu ETKILEMEZ; hakedis motoru (v41) ayni kalir.
  const saat = e.lessons.length;""")

# ---------- 2) Ayarlar etiketi kurali soylesin ----------
rep("""— hocaya İBAN'dan yatan saatlik tutar; asgari ücret değişince güncelle (0 = bordro hesabı kapalı)""",
"""— hocaya İBAN'dan yatan saatlik tutar; her ders 1 saat sayılır (süreden bağımsız); asgari ücret değişince güncelle (0 = bordro hesabı kapalı)""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.30.57">', '<meta name="app-version" content="2026.07.31.58">')
rep("const APP_VERSION = '2026.07.30.57';", "const APP_VERSION = '2026.07.31.58';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v134-2026-07-30-57';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v135-2026-07-31-58';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
