# -*- coding: utf-8 -*-
# v155 — Kerem (2026-08-30): "takvimde agustos ayi icinde dersleri yapilmis paketler 8 hak
# yaziyor, eylule sarkan 8 yaziyor — sebebi nedir?"
# TESHIS (canli veriden olculdu): "8 sarkan" gorunen kayitlarin hicbirine ders YA DA odeme bagli
# degil (15 kayit tarandi: 15/15 bos). Bunlar gruplar yeniden kurulurken ESKI grup kaydinda kalan
# KALINTI paket kayitlari (bazilari tamamen bos-kadrolu hayalet grup — orn. "MESUT BULUT-FATMA
# ASLI..." ikizi 9uqzhzko; gercek grup lif3fih0'in Agustos paketi DOGRU: 8/8 yazili).
# Ders modali "sarkan" rozetini paket kayitlarindan (ownerUnfinishedMonths) urettigi icin bu
# kalintilar "8 sarkan" diye listeye giriyordu; bos kadrolu hayalet gruplar da secenek olarak
# gorunuyordu.
# v155 KURALI (yalniz GORUNUM — hicbir veri silinmez):
#  1) OLU GECMIS PAKET: gecmis ayin paket kaydina hic iptal-disi ders VE hic odeme bagli degilse
#     rozet/sarkan/paket-ayi listelerinde gosterilmez. Odeme bagliysa (para alinmis hak) ya da
#     kismen kullanildiysa GERCEK sarkandir, aynen kalir. Icinde bulunulan/gelecek ay kurala girmez.
#  2) Ders modalindaki grup secenekleri: AKTIF KADROSU BOS (hayalet) gruplar listelenmez
#     (v145 panel kuraliyla ayni).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) olu-gecmis-paket yardimcisi + ownerUnfinishedMonths filtresi ----------
rep("""// v46: sahibin ders hakki KALAN (bitmemis) paket aylari — en yeni once
function ownerUnfinishedMonths(ownerType, ownerId) {
  if (!ownerId) return [];
  const o = ownerType==='group' ? state.groups.find(x=>x.id===ownerId) : state.members.find(x=>x.id===ownerId);
  return ((o && o.packages) || [])
    .filter(pk => pk && pk.month && sessionsRemainingFor(ownerType, ownerId, pk.month) > 0)
    .map(pk => pk.month).sort().reverse();
}""",
"""// v155 (Kerem): OLU GECMIS PAKET — gecmis ayin paket kaydina NE iptal-disi ders NE odeme bagli
// (grup yeniden kurulurken kalan kalinti). Rozet/sarkan listelerinde gosterilmez; VERI SILINMEZ.
// Odeme bagli (para alinmis, ders yazilmamis) paket GERCEK haktir — kurala girmez.
function __deadPastPkg(ownerType, ownerId, mo) {
  if (!mo || mo >= currentMonth()) return false; // icinde bulunulan/gelecek ay normaldir
  const hasLesson = (state.lessons || []).some(function(l){
    if (!l || l.status === 'cancelled') return false;
    if ((l.packageMonth || String(l.date || '').slice(0, 7)) !== mo) return false;
    return ownerType === 'group' ? l.groupId === ownerId : (!l.groupId && (l.memberIds || []).includes(ownerId));
  });
  if (hasLesson) return false;
  const hasPay = (state.payments || []).some(function(p){
    if (!p) return false;
    if ((p.packageMonth || String(p.date || '').slice(0, 7)) !== mo) return false;
    return ownerType === 'group' ? p.groupId === ownerId : (p.memberId === ownerId && !p.groupId);
  });
  return !hasPay;
}
// v46: sahibin ders hakki KALAN (bitmemis) paket aylari — en yeni once
function ownerUnfinishedMonths(ownerType, ownerId) {
  if (!ownerId) return [];
  const o = ownerType==='group' ? state.groups.find(x=>x.id===ownerId) : state.members.find(x=>x.id===ownerId);
  return ((o && o.packages) || [])
    .filter(pk => pk && pk.month && sessionsRemainingFor(ownerType, ownerId, pk.month) > 0)
    .filter(pk => !__deadPastPkg(ownerType, ownerId, pk.month)) // v155: olu kalinti listeye girmez
    .map(pk => pk.month).sort().reverse();
}""")

# ---------- 2) ders modali grup secenekleri: bos kadrolu hayalet listelenmez ----------
rep("""    const __gOpts = state.groups.filter(g => g && !(typeof isGroupInactiveInMonth==='function' && isGroupInactiveInMonth(g, __selAy))).map(g => {""",
"""    const __gOpts = state.groups.filter(g => g && !(typeof isGroupInactiveInMonth==='function' && isGroupInactiveInMonth(g, __selAy))
      && ((typeof activeGroupRosterForMonth==='function' ? activeGroupRosterForMonth(g, __selAy) : (g.memberIds||[])).length > 0) /* v155: bos kadrolu hayalet grup secenek degil (v145 kurali) */).map(g => {""")

# ---------- 3) Paket Ayi secicisi: olu ay eklenmez, olu aya rozet yazilmaz ----------
rep("""  ((ownerObj && ownerObj.packages) || []).forEach(pk => { if (pk && pk.month && !months.includes(pk.month)) months.push(pk.month); });""",
"""  ((ownerObj && ownerObj.packages) || []).forEach(pk => { if (pk && pk.month && !months.includes(pk.month) && !(owner.id && __deadPastPkg(owner.type, owner.id, pk.month))) months.push(pk.month); }); // v155""")

rep("""    if (ownerObj && (ownerObj.packages||[]).some(pk => pk && pk.month === mo)) {
      const rem = sessionsRemainingFor(owner.type, owner.id, mo);
      mark = rem>0 ? (' · 📦 ' + rem + ' ders kalan') : ' · paket dolu';
    }""",
"""    if (ownerObj && (ownerObj.packages||[]).some(pk => pk && pk.month === mo) && !__deadPastPkg(owner.type, owner.id, mo)) {
      const rem = sessionsRemainingFor(owner.type, owner.id, mo);
      mark = rem>0 ? (' · 📦 ' + rem + ' ders kalan') : ' · paket dolu';
    }""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.24.77">', '<meta name="app-version" content="2026.08.30.78">')
rep("const APP_VERSION = '2026.08.24.77';", "const APP_VERSION = '2026.08.30.78';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v154-2026-08-24-77';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v155-2026-08-30-78';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
