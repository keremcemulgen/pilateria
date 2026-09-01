# -*- coding: utf-8 -*-
# v163 — TAM TARAMA (Kerem, 2026-09-01: "0 hata; bayt bayt tara; hatalari gider oyle guncelle").
# AILE: ham g.memberIds (temel kadro) kullanan ay-baglamli yollar + ay'da PASIF grubu "sahip" sayan
# kontroller + bugune capalanan yazma. v57 kanonu: "bu ay kadroda kim var?" TEK KAYNAK =
# resolveGroupMembersForMonth / activeGroupRosterForMonth; pasif grup uye tutamaz; yazma sayfanin ayina.
# Bulgular (month-roster-audit-test ile yamasiz build'de 11 FAIL olculdu):
#  F1  addGroupLesson: ders kadrosu ham memberIds -> o ayin aktif kadrosu
#  F2  saveBatchDates: yeni paketin startDate=bugun -> paketin ILK DERS GUNU (yoksa ay/bugun kurali)
#  F3  regenGroupLessons (UI'da yok): capa packageStartDate -> detay ayi
#  F4  openLessonModal grup on-secimi: ham -> o ayin kadrosu (modal zaten kesisiyordu; tutarlilik)
#  F5  autoGenerateGroupLessons: uretilen ders kadrosu ham -> paket ayinin kadrosu
#  F6  scheduleGroupMonth: ayni
#  F7  uye detayi "Toplu Ders Gir" gizleme: !archived+ham -> memberActiveGroupForMonth(ctxAy)
#  F8  instructorMemberBreakdown / instructorGroupCountForMonth: ay verildiyse ay-cozumlu kadro,
#      pasif grup sayilmaz, bireysel = o ay aktif grubu olmayan
#  F9  paymentMemberGroup(uye, ay): o ay aktif grup; cagiranlar paket ayini iletir
#  F10 saveGroupPaymentAll: odeme yalniz o ayin kayitli kadrosuna (ayrilan uyeye ODEME YAZILMAZ)
#  F12 reactivateMemberForMonth ders senkronu: ay-cozumlu uyelik
#  F13 fillEmptySlot uygun uye: pasif grup uyeyi tutmaz
#  F14 getNextWeekMissing inAnyGroupP: pasif grup kadrosu sayilmaz
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# F1 addGroupLesson
rep("""  const dISO = todayISO();
  const time = g.defaultTime || hourSlots()[0];
  const dur = +state.settings.lessonDuration || +state.settings.duration || 60;
  const mids = (g.memberIds||[]).filter(x => x && state.members.find(m=>m.id===x));""",
"""  const dISO = todayISO();
  const time = g.defaultTime || hourSlots()[0];
  const dur = +state.settings.lessonDuration || +state.settings.duration || 60;
  const mids = activeGroupRosterForMonth(g, ctxMonth || String(dISO).slice(0,7)); // v163: o ayin aktif kadrosu (ham memberIds degil)""")

# F2 saveBatchDates: paket baslangici = ilk ders gunu
rep("""    // O ay için paket kaydı yoksa oluştur
    if (!(g.packages||[]).find(p => p.month === packageMonth)) {
      createGroupPackage(g, packageMonth, todayISO());
    }
  } else {
    m = state.members.find(x => x.id === __batchDatesTarget.id);
    if (!m) return;
    if (!(m.packages||[]).find(p => p.month === packageMonth)) {
      createMemberPackage(m, packageMonth, todayISO());
    }
  }""",
"""    // O ay için paket kaydı yoksa oluştur — v163: baslangic = paketin ILK DERS GUNU (bugun degil)
    if (!(g.packages||[]).find(p => p.month === packageMonth)) {
      createGroupPackage(g, packageMonth, __bdPkgStart163(packageMonth));
    }
  } else {
    m = state.members.find(x => x.id === __batchDatesTarget.id);
    if (!m) return;
    if (!(m.packages||[]).find(p => p.month === packageMonth)) {
      createMemberPackage(m, packageMonth, __bdPkgStart163(packageMonth));
    }
  }""")

rep("""function saveBatchDates() {
  if (!__batchDatesTarget) return;""",
"""// v163: toplu girisle olusan paketin baslangici = listedeki (iptal-disi) EN ERKEN ders gunu;
// liste tarihsizse: paket ayi bu aysa bugun, degilse ayin 1'i (bugune capalama yok).
function __bdPkgStart163(packageMonth) {
  const ds = (__batchDatesRows || []).filter(function(r){ return r && r.date && (r.status || 'planned') !== 'cancelled'; }).map(function(r){ return r.date; }).sort();
  if (ds.length) return ds[0];
  return (packageMonth === currentMonth()) ? todayISO() : (packageMonth + '-01');
}
function saveBatchDates() {
  if (!__batchDatesTarget) return;""")

# F3 regenGroupLessons (UI'da yok; ileride baglanirsa hastalik geri gelmesin)
rep("""  const start = g.packageStartDate || todayISO();
  const r = autoGenerateGroupLessons(id, start);""",
"""  const __ay163 = ((typeof currentGroupDetailMonth !== 'undefined' && currentGroupDetailMonth) || currentMonth());
  const start = (__ay163 === currentMonth()) ? todayISO() : (__ay163 + '-01'); // v163: detay ayi (eski packageStartDate capasi degil)
  const r = autoGenerateGroupLessons(id, start);""")

# F4 openLessonModal grup on-secimi
rep("""      instructorId: g.defaultInstructorId||'', size: g.size||1,
      memberIds: (g.memberIds||[]).filter(x => x && state.members.find(m=>m.id===x)), groupId: groupId, note:'',
      packageOwnerType:'group', packageOwnerId: groupId, packageMonth: (ctxMonth || String(date||todayISO()).slice(0,7))""",
"""      instructorId: g.defaultInstructorId||'', size: g.size||1,
      memberIds: activeGroupRosterForMonth(g, (ctxMonth || String(date||todayISO()).slice(0,7))), groupId: groupId, note:'', // v163: o ayin kadrosu
      packageOwnerType:'group', packageOwnerId: groupId, packageMonth: (ctxMonth || String(date||todayISO()).slice(0,7))""")

# F5 autoGenerateGroupLessons
rep("""            memberIds: [...(g.memberIds||[])],
            groupId,
            packageMonth: packageMonth,""",
"""            memberIds: activeGroupRosterForMonth(g, packageMonth), // v163: paket ayinin kadrosu
            groupId,
            packageMonth: packageMonth,""")

# F6 scheduleGroupMonth
rep("""        instructorId: g.defaultInstructorId||'', size: g.size, packageMonth: __ay156, /* v156 */
        memberIds: (g.memberIds||[]).filter(x => x && state.members.find(m=>m.id===x)), groupId: groupId, note: ''""",
"""        instructorId: g.defaultInstructorId||'', size: g.size, packageMonth: __ay156, /* v156 */
        memberIds: activeGroupRosterForMonth(g, __ay156), groupId: groupId, note: '' /* v163: o ayin kadrosu */""")

# F7 uye detayi
rep("""  const inAnyGroup = state.groups.some(g => !g.archived && (g.memberIds||[]).includes(id));""",
"""  const inAnyGroup = !!memberActiveGroupForMonth(id, ctxAy); // v163: o ay AKTIF bir grupta mi (pasif grubun temel kadrosu sayilmaz)""")

# F8 hoca dagilimi (iki fonksiyon)
rep("""    const inGroup = state.groups.some(g => !g.archived && (g.memberIds||[]).includes(m.id));""",
"""    const inGroup = monthISO ? !!memberActiveGroupForMonth(m.id, monthISO) : state.groups.some(g => !g.archived && (g.memberIds||[]).includes(m.id)); // v163: ay verildiyse ay-cozumlu""", 2)
rep("""    const activeMids = (g.memberIds||[]).filter(mid => {""",
"""    if (monthISO && isGroupInactiveInMonth(g, monthISO)) return; // v163: o ay pasif grup sayilmaz
    const activeMids = (monthISO ? resolveGroupMembersForMonth(g, monthISO) : (g.memberIds||[])).filter(mid => { // v163: ay-cozumlu kadro""", 2)

# F9 paymentMemberGroup + cagiranlar
rep("""function paymentMemberGroup(memberId) {
  return state.groups.find(g => !g.archived && (g.memberIds||[]).includes(memberId)) || null;
}""",
"""function paymentMemberGroup(memberId, monthISO) { // v163: o ay AKTIF grup (pasif grubun temel kadrosu sayilmaz)
  const __ay = monthISO || ((document.getElementById('mp-pkg-month')||{}).value) || (typeof __groupOpsCtxMonth === 'function' ? __groupOpsCtxMonth() : currentMonth());
  return memberActiveGroupForMonth(memberId, __ay);
}""")

# F10 gruba toplu odeme: yalniz o ayin kayitli kadrosu
rep("""  for (const mid of (g.memberIds||[])) {
    if (!mid) continue;
    const __m = state.members.find(x=>x.id===mid);
    const __cap = paymentCapCheck(mid, groupId, packageMonth, amount, '');""",
"""  const __ros163 = activeGroupRosterForMonth(g, packageMonth); // v163: odeme YALNIZ o ayin kayitli kadrosuna (ayrilan uyeye yazilmaz)
  if (!__ros163.length) { alert(packageMonth + ' ayında bu grubun kayıtlı üyesi yok — önce kadroyu o aya yaz.'); return; }
  for (const mid of __ros163) {
    if (!mid) continue;
    const __m = state.members.find(x=>x.id===mid);
    const __cap = paymentCapCheck(mid, groupId, packageMonth, amount, '');""")

# F12 reactivate ders senkronu
rep("""  state.groups.forEach(g => { if ((g.memberIds||[]).includes(id) && typeof syncGroupLessonsToRoster==='function') syncGroupLessonsToRoster(g.id, month); });""",
"""  state.groups.forEach(g => { if (!isGroupInactiveInMonth(g, month) && (resolveGroupMembersForMonth(g, month)||[]).includes(id) && typeof syncGroupLessonsToRoster==='function') syncGroupLessonsToRoster(g.id, month); }); // v163: ay-cozumlu""")

# F13 fillEmptySlot uygun uye
rep("""    .filter(m => !state.groups.some(gr => resolveGroupMembersForMonth(gr, __ctxAy).includes(m.id) && isMemberEnrolledInMonth(m.id, __ctxAy))) // v.36: pasif/arsivli de gosterilir (eklenince otomatik aktive olur)""",
"""    .filter(m => !state.groups.some(gr => !isGroupInactiveInMonth(gr, __ctxAy) && resolveGroupMembersForMonth(gr, __ctxAy).includes(m.id) && isMemberEnrolledInMonth(m.id, __ctxAy))) // v.36: pasif/arsivli de gosterilir; v163: pasif grup uye tutmaz""")

# F14 gelecek hafta inAnyGroupP
rep("""  const inAnyGroupP = new Set(); state.groups.forEach(g => months.forEach(mo => __activeRosterForMonth(g, mo).forEach(id => inAnyGroupP.add(__rootOf(id)))));""",
"""  const inAnyGroupP = new Set(); state.groups.forEach(g => months.forEach(mo => { if (isGroupInactiveInMonth(g, mo)) return; __activeRosterForMonth(g, mo).forEach(id => inAnyGroupP.add(__rootOf(id))); })); // v163: pasif grup kadrosu sayilmaz""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.01.85">', '<meta name="app-version" content="2026.09.01.86">')
rep("const APP_VERSION = '2026.09.01.85';", "const APP_VERSION = '2026.09.01.86';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v162-2026-09-01-85';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v163-2026-09-01-86';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
