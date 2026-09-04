# -*- coding: utf-8 -*-
# v170 — Kerem (2026-09-01): "SON 1 DERSI KALAN uye/gruplarin yaninda YILDIZ gozukuyordu, simdi
# cikmiyor — bu dogru mu?" EVET, dogru. Olculdu (jsdom):
#   masaustu HAFTA/GUN: yildiz 1  ·  masaustu AY: 0  ·  MOBIL gun: 0  ·  MOBIL ay: 0
#   4 ders hakli uye: HICBIR yerde yildiz yok (hak=4 ama yildiz kurali 8 bekliyordu)
# IKI KOK NEDEN:
#  (1) IKINCI HAK KAYNAGI (v169 ailesinin aynisi): isLastLessonOfPackage, "paketin tum dersleri
#      girildi mi?" sorusunu packageExpectedSessions'a soruyordu — o da paket kaydi/paket TIPI/8'e
#      bakip AYLIK HAK'i (sessionsOverride / monthlySessions) GORMUYORDU. 4 haklik uyede 4 ders
#      girilse bile "8 bekleniyor" dendigi icin yildiz hic dogmuyordu.
#  (2) v132 MOBIL TAKVIM YENIDEN YAZIMI: telefon gorunumu pcal-* kartlarina gecerken ⭐ tasinmadi;
#      masaustu AY gorunumunun cip'lerinde de hic yoktu. Kerem telefonda baktigi icin "kayboldu".
# v170 KURALI: (a) packageExpectedSessions = sessionQuotaFor (TEK KAYNAK — tavan denetimi, kalan ders
# ve yildiz ayni hakki gorur), (b) yildiz TUM takvim yuzeylerinde: masaustu hafta/gun (vardi), masaustu
# ay cipleri, mobil gun/ay kartlari. Yildizin ANLAMI DEGISMEDI (v18.1 kurali): elle ⭐ isaretli ders
# her zaman son derstir; otomatik rozet YALNIZ paketin tum dersleri girilince kronolojik son derse.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) hak TEK KAYNAK ----------
rep("""// v18: Paketin BEKLENEN ders sayisi (paket kaydindan; yoksa varsayilan paketten; yoksa 8)
function packageExpectedSessions(ownerType, ownerId, pm) {
  let owner = null, pk = null;
  if (ownerType === 'group') owner = state.groups.find(x => x.id === ownerId);
  else owner = state.members.find(x => x.id === ownerId);
  if (owner) pk = (owner.packages||[]).find(x => x.month === pm);
  if (pk && +pk.sessions) return +pk.sessions;
  if (owner && owner.defaultPackageId) {
    const pt = state.packageTypes.find(x => x.id === owner.defaultPackageId);
    if (pt && +pt.sessions) return +pt.sessions;
  }
  return 8;
}""",
"""// v18: Paketin BEKLENEN ders sayisi. v170 KOK FIX (Kerem: "1 dersi kalanin yildizi cikmiyor"):
// burasi kendi hak zincirini kuruyordu (paket kaydi > paket TIPI > 8) ve AYLIK HAK'i
// (uye sessionsOverride / grup monthlySessions) GORMUYORDU -> 4 haklik uyede 4 ders girilse bile
// "8 bekleniyor" denip yildiz hic dogmuyordu. Artik v43 kanonuyla TEK KAYNAK: sessionQuotaFor
// (aylik hak > o ayin paketi > paket tipi > 8) — tavan denetimi, kalan ders ve yildiz AYNI hakki gorur.
function packageExpectedSessions(ownerType, ownerId, pm) {
  const q = +sessionQuotaFor(ownerType, ownerId, pm || currentMonth());
  return (q > 0) ? q : 8;
}""")

# ---------- 2) yildiz TUM takvim yuzeylerinde ----------
# 2a) mobil gun/ay kartlari (v132'de dusmustu)
rep("""  const dolu = (l.memberIds||[]).filter(Boolean).length;
  return `<div class="pcal-card pcst-${st}" onclick="openLessonModal('${l.id}')">
    <div class="pcal-c1">${l.time} · ${escapeHtml(kisiler)}${cancelled ? ' — iptal' : ''}</div>""",
"""  const dolu = (l.memberIds||[]).filter(Boolean).length;
  const __star170 = isLastLessonOfPackage(l) ? ' <span class="gev-star" title="Paketin son dersi">⭐</span>' : ''; // v170: v132'de dusen yildiz geri geldi
  return `<div class="pcal-card pcst-${st}" onclick="openLessonModal('${l.id}')">
    <div class="pcal-c1">${l.time} · ${escapeHtml(kisiler)}${__star170}${cancelled ? ' — iptal' : ''}</div>""")

# 2b) masaustu AY gorunumu cipleri (hic yoktu)
rep("""      const st = l.status || 'planned';
      return `<div class="gm-chip gst-${st}" onclick="event.stopPropagation();openLessonModal('${l.id}')" title="${l.time} ${escapeHtml(label)}"><span class="gmc-time">${l.time}</span> ${escapeHtml(label)}</div>`;""",
"""      const st = l.status || 'planned';
      const __star170 = isLastLessonOfPackage(l) ? ' <span class="gev-star" title="Paketin son dersi">⭐</span>' : ''; // v170
      return `<div class="gm-chip gst-${st}" onclick="event.stopPropagation();openLessonModal('${l.id}')" title="${l.time} ${escapeHtml(label)}"><span class="gmc-time">${l.time}</span> ${escapeHtml(label)}${__star170}</div>`;""")

# ---------- 3) KAPALI GUNDEKI DERSLER MASAUSTU TAKVIMDE GORUNMEZDI (ayni aile: tek gercek, cok yuzey) ----------
# Olculdu: Pazar (workDays disi) bir derse yildiz kurali "son ders" diyor, mobil ajanda ve AY gorunumu
# dersi gosteriyor, ama masaustu gun/hafta izgarasi `if (!closed)` yuzunden HIC cizmiyordu — baslikta
# "1 ders" yazip govde bos kaliyordu (telafi/ozel gun dersleri masaustunde gorunmez). v170: kapali
# gunde de MEVCUT dersler cizilir; bos saat kutulari (tiklayip ders ekleme) kapali kalir.
rep("""    if (!closed) {
      const dayLessons = state.lessons.filter(l => l.date === dISO && l.time);
      inner += gcalLayout(dayLessons).map(ev => __gcalEventHtml(ev, dISO)).join('');
    }""",
"""    { // v170: kapali gunde de MEVCUT dersler gorunur (bos saat kutulari yine kapali — yanlislikla ders eklenmesin)
      const dayLessons = state.lessons.filter(l => l.date === dISO && l.time);
      if (dayLessons.length) inner += gcalLayout(dayLessons).map(ev => __gcalEventHtml(ev, dISO)).join('');
    }""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.01.92">', '<meta name="app-version" content="2026.09.01.93">')
rep("const APP_VERSION = '2026.09.01.92';", "const APP_VERSION = '2026.09.01.93';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v169-2026-09-01-92';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v170-2026-09-01-93';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
