# -*- coding: utf-8 -*-
# v139 — Kerem: tam sigortada FARKIN yaninda GERCEK SGK primi de gorunsun.
# Hoca satiri: 'SGK tam X / gercek Y' · odeme modali: '(gercek Y)' · ay seridi: gercek toplam alt satiri.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# 1) hoca satiri kirilimi: tam modda 'SGK tam X / gercek Y'
rep("""' · SGK ' + money(__pr134.sgk) : ''}""",
"""' · SGK ' + (__pr134.tam ? 'tam ' + money(__pr134.sgk) + ' / gerçek ' + money(__pr134.sgkReal) : money(__pr134.sgk)) : ''}""")

# 2) odeme modali seridi: gercek SGK parantezde
rep("""· SGK: <b>${money(pr.sgk)} ₺</b>""",
"""· SGK: <b>${money(pr.sgk)} ₺</b>${pr.tam ? ` <span style="color:var(--muted);">(gerçek ${money(pr.sgkReal)} ₺)</span>` : ''}""")

# 3) ay seridi: gercek SGK toplami (tam-normal karisik aylarda dogru toplam)
rep("""acc.iban += p.iban; acc.nakit += p.nakit; acc.sgk += p.sgk; acc.saat += p.saat; return acc; }, { iban:0, nakit:0, sgk:0, saat:0 });""",
"""acc.iban += p.iban; acc.nakit += p.nakit; acc.sgk += p.sgk; acc.saat += p.saat; acc.sgkReal += (p.sgkReal != null ? p.sgkReal : p.sgk); return acc; }, { iban:0, nakit:0, sgk:0, saat:0, sgkReal:0 });""")

rep("""<div class="stat ok"><div class="label">SGK Primi</div><div class="value">${money(Math.round(prT.sgk*100)/100)} ₺</div>""",
"""<div class="stat ok"><div class="label">SGK Primi</div><div class="value">${money(Math.round(prT.sgk*100)/100)} ₺</div>${Math.round(prT.sgkReal*100)/100 !== Math.round(prT.sgk*100)/100 ? `<div style="font-size:10px;color:var(--muted);">gerçek: ${money(Math.round(prT.sgkReal*100)/100)} ₺ · fark hocalardan</div>` : ''}""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.31.61">', '<meta name="app-version" content="2026.07.31.62">')
rep("const APP_VERSION = '2026.07.31.61';", "const APP_VERSION = '2026.07.31.62';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v138-2026-07-31-61';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v139-2026-07-31-62';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
