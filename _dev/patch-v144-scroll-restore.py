# -*- coding: utf-8 -*-
# v144 — Kerem (2026-08-16): "grup/uye sayfasindan cikinca sayfa oldugum yerde degil daha ASAGIDA aciliyor."
# KOK NEDEN: modal acikken govde kilidi yalniz body'de (body.pl-modal-open{overflow:hidden}) —
# Android/mobil tarayicilarda dokunmatik kaydirma html uzerinden ARKA SAYFAYI kaydirmaya devam
# edebiliyor (v41 overscroll-contain yalniz zincirlemeyi keser, dogrudan govde kaydirmayi kesmez).
# Uzun detayda gezinirken arka liste sessizce asagi kayiyor; modal kapaninca kullanici "asagida" kaliyor.
# COZUM (cift katman):
#  1) Mekanizmadan bagimsiz KESIN kural: ILK modal acilirken sayfa kaydirma konumu kaydedilir,
#     SON modal kapaninca (closeModal + popstate yollarinin ikisi de) aynen geri getirilir.
#  2) Savunma: govde kilidi html'e de uygulanir (html:has(body.pl-modal-open)).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# 1) durum degiskeni
rep("const __modalStack = []; // sırasıyla açık modal id'leri (en sondaki en üstte)",
"""const __modalStack = []; // sırasıyla açık modal id'leri (en sondaki en üstte)
let __pageScrollY = 0; // v144: ilk modal acilmadan onceki sayfa kaydirma konumu — son modal kapaninca geri getirilir""")

# 2) acilista kaydet (yalniz ILK modal; refresh/yeniden-acilis konumu EZMEZ)
rep("""  if (!wasInStack) __modalStack.push(id);""",
"""  if (!wasInStack && __modalStack.length === 0) { try { __pageScrollY = window.scrollY || document.documentElement.scrollTop || 0; } catch(e) { __pageScrollY = 0; } } // v144
  if (!wasInStack) __modalStack.push(id);""")

# 3) kapanista geri getir — closeModal VE popstate yollarinin ikisinde de (ayni satir 2x)
rep("""  if (__modalStack.length === 0) document.body.classList.remove('pl-modal-open');""",
"""  if (__modalStack.length === 0) { document.body.classList.remove('pl-modal-open'); try { window.scrollTo(0, __pageScrollY); } catch(e) {} } // v144: kullanici biraktigi yere doner""", 2)

# 4) govde kilidi html'e de
rep("""  body.pl-modal-open { overflow: hidden; }""",
"""  body.pl-modal-open { overflow: hidden; }
  html:has(body.pl-modal-open) { overflow: hidden; } /* v144: Android'de arka sayfa modal altinda kaymasin */""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.14.66">', '<meta name="app-version" content="2026.08.16.67">')
rep("const APP_VERSION = '2026.08.14.66';", "const APP_VERSION = '2026.08.16.67';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v143-2026-08-14-66';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v144-2026-08-16-67';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
