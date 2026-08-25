# -*- coding: utf-8 -*-
# v153 — Kerem (2026-08-24): "Biten ay dersinden sonra ders girilmemisse bu kisimda GOZUKSUN,
# girildiyse DUSSUN ya da pasife alindiysa buradan DUSSUN."
# DEGISEN: v147'nin "Bitti en fazla 1 onceki aydan" YAS SINIRI kaldirildi. Yerine EYLEM kurali:
#   - Biten birim, sonrasinda YENI DERS girilene kadar listede KALIR (yas sinirsiz) — takip edilecek
#     birimler kaybolmaz. (Yeni ders girilince dusme zaten v147'de vardi: izlenen paket = en son
#     ders yazilan ay; yeni ay dersi girilince eski ay konu olmaktan cikar.)
#   - Birim PASIFE ALINDIYSA (uye: isMemberInactiveInMonth, grup: isGroupInactiveInMonth — bugunun
#     ayina gore; yalniz ACIKCA pasif/arsiv, "henuz bu aya yazilmamis" pasif SAYILMAZ) listeden
#     DUSER. Ayrilan uye/grubu temizlemenin yolu budur — Kerem'in is akisiyla ayni.
#   - "1 ders kaldi" satirlari icin de ayni pasif kurali gecerli (ayrilana takip yapilmaz).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) yas siniri kalkti ----------
rep("""    const __nowAy = currentMonth();
    const __minFin = (function(){ const p = __nowAy.split('-'); let y = +p[0], a = +p[1] - 1;
      if (!a) { y--; a = 12; } return y + '-' + String(a).padStart(2, '0'); })(); // "Bitti" yas siniri: bu ay + 1 onceki""",
"""    const __nowAy = currentMonth();
    // v153 (Kerem): yas siniri YOK — biten birim, sonrasinda YENI DERS girilene ya da PASIFE
    // alinana kadar listede kalir. Dusme kosullari: yeni ders (izlenen paket ilerler) veya pasif.""")

# ---------- 2) grup: bugun pasifse dusur; yas siniri satiri kalkti ----------
rep("""      const ay = __curAy('group', g.id); if (!ay) return;
      if (isGroupInactiveInMonth(g, ay)) return;""",
"""      const ay = __curAy('group', g.id); if (!ay) return;
      if (isGroupInactiveInMonth(g, ay)) return;
      if (isGroupInactiveInMonth(g, __nowAy)) return; // v153: pasife alinan grup listeden duser""")

rep("""      const st = __st(fin); if (!st) return;
      if (st === 2 && ay < __minFin) return; // cok eski bitmis — artik konu degil
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, ay), ay: ay, st: st, fin: fin });""",
"""      const st = __st(fin); if (!st) return;
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, ay), ay: ay, st: st, fin: fin });""")

# ---------- 3) uye: bugun pasifse dusur; yas siniri satiri kalkti ----------
rep("""      const ay = __curAy('member', mm.id); if (!ay) return;
      if (!isMemberEnrolledInMonth(mm.id, ay)) return;""",
"""      const ay = __curAy('member', mm.id); if (!ay) return;
      if (!isMemberEnrolledInMonth(mm.id, ay)) return;
      if (isMemberInactiveInMonth(mm, __nowAy)) return; // v153: pasife alinan uye listeden duser""")

rep("""      const st = __st(fin); if (!st) return;
      if (st === 2 && ay < __minFin) return;
      rows.push({ tip:'member', id:mm.id, ad: mm.name, ay: ay, st: st, fin: fin });""",
"""      const st = __st(fin); if (!st) return;
      rows.push({ tip:'member', id:mm.id, ad: mm.name, ay: ay, st: st, fin: fin });""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.24.75">', '<meta name="app-version" content="2026.08.24.76">')
rep("const APP_VERSION = '2026.08.24.75';", "const APP_VERSION = '2026.08.24.76';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v152-2026-08-24-75';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v153-2026-08-24-76';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
