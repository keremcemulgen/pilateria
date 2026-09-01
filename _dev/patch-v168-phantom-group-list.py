# -*- coding: utf-8 -*-
# v168 — HAYALET (BOS) GRUP LISTEDE GORUNMESIN. Canli veri (2026-09-01, salt-okunur inceleme): bugunku
# pre-v162 kazasindan kalan, kadrosu tasimayla bosaltilmis "SEVDİ CAN AKTAŞ" (vvzb4rcc) grubu Eylul
# paketi (4500, ders/odeme yok) yuzunden Gruplar sayfasinda 0 uyeyle listeleniyor; Agustos'ta da
# "MESUT BULUT-FATMA ASLI DEVELİOĞLU" (9uqzhzko) ayni sekilde. groupNavListForMonth'un 3/4. kurallari
# ("o ay paketi var" / "packageStartDate o ayda") kadroyu hic denetlemiyordu.
# v168 KURALI: paket/baslangic kurali yalniz su hallerde listeler: o ay COZUMLU kadrosu bos degil VEYA o
# ay dersi/odemesi var VEYA (ay gecmis degil VE grup hic uye gormemis = kurulmakta olan bos grup).
# Uye listesi/raporlar zaten kadro/odeme bazli (hayalet oralarda yoktu); VERI SILINMEZ, yalniz liste.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

rep("""      // 3) Paket o ay'a denk gelirse (sarkma/sonradan paket için)
      if ((g.packages||[]).some(function(p){ return p.month === monthISO; })) return true;
      // 4) packageStartDate o ay'da başlıyorsa
      return g.packageStartDate && g.packageStartDate.startsWith(monthISO);""",
"""      // 3) Paket o ay'a denk gelirse (sarkma/sonradan paket için)
      // v168: HAYALET KORUMASI — kadrosu bosaltilmis (tasima) grup, yetim paketi yuzunden listelenmez.
      const __pkgHit = (g.packages||[]).some(function(p){ return p.month === monthISO; }) || !!(g.packageStartDate && g.packageStartDate.startsWith(monthISO));
      if (!__pkgHit) return false;
      if ((resolveGroupMembersForMonth(g, monthISO)||[]).filter(Boolean).length) return true;      // o ay kadrosu var (pasif olsa da)
      if (state.lessons.some(function(l){ return l && l.groupId === g.id && l.status !== 'cancelled' && (l.packageMonth || String(l.date||'').slice(0,7)) === monthISO; })) return true; // o ay dersi var
      const __everHad = (g.memberIds||[]).some(Boolean) || Object.keys(g.monthlyMembers||{}).some(function(k){ return (g.monthlyMembers[k]||[]).some(Boolean); });
      return !__everHad && monthISO >= currentMonth(); // kurulmakta olan bos grup (hic uye gormemis, ay gecmemis)""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.01.90">', '<meta name="app-version" content="2026.09.01.91">')
rep("const APP_VERSION = '2026.09.01.90';", "const APP_VERSION = '2026.09.01.91';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v167-2026-09-01-90';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v168-2026-09-01-91';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
