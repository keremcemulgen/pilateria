# -*- coding: utf-8 -*-
# v158 — Kerem (2026-08-30 gece, mobil ekran goruntusu + secenek cevabi):
# "hala Haziran ve Temmuz gozukuyor" -> "Gruplar icin her grubun bir etiketi olmali, GUNCEL gruba
# gore degerlendirilmeli" -> secilen model: "SADECE GUNCEL GRUPLAR LISTELENSIN".
# KURAL: Panel "1 Dersi Kalan / Biten" GRUP BITEN satiri yalniz GUNCEL grup icin gosterilir —
# icinde bulunulan ayda AKTIF KADROSU olan grup. Gecmis ayda kalmis grup (devami olsun olmasin)
# Biten listesine girmez; eski takip grup detayindan yapilir.
#  - "1 ders kaldi" (st=1) SARKAN ALACAKTIR — yas sinirsiz kalir (v147 kanonu degismez).
#  - Bireysel kurallar degismez (v157: yeni ay/2. paket yazilinca duser; AZRA tipi aranacak kalir).
#  - v157 supersede kurali da yururlukte (guncel kadrolu ama yeni aya yazilmis grup yine duser).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

rep("""      const st = __st(fin); if (!st) return;
      if (st === 2 && __supersededGroupFin(g.id, ay)) return; // v157: yeni paket yazilmis — Biten satiri duser
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, ay), ay: ay, st: st, fin: fin });""",
"""      const st = __st(fin); if (!st) return;
      if (st === 2 && __supersededGroupFin(g.id, ay)) return; // v157: yeni paket yazilmis — Biten satiri duser
      // v158 (Kerem): SADECE GUNCEL GRUPLAR — Biten satiri yalniz icinde bulunulan ayda aktif
      // kadrosu olan grup icin gosterilir; gecmis ayda kalmis grup listeyi kirletmez.
      // "1 ders kaldi" sarkan alacaktir, yas sinirsiz kalir (v147).
      if (st === 2 && !((typeof activeGroupRosterForMonth === 'function' ? activeGroupRosterForMonth(g, __nowAy) : []) || []).length) return;
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, ay), ay: ay, st: st, fin: fin });""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.30.80">', '<meta name="app-version" content="2026.08.30.81">')
rep("const APP_VERSION = '2026.08.30.80';", "const APP_VERSION = '2026.08.30.81';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v157-2026-08-30-80';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v158-2026-08-30-81';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
