# -*- coding: utf-8 -*-
# v195 (Kerem 15.10): "Ekim'e Ayse Kaya diye uye ekliyorum, Eylul'e de ekliyor. Bu olmamali; bunlari daha once duzeltmistik.
# Surekli yama yapiyoruz, bu problemler KOKTEN cozulmeli."
# KOK: v186 "yerine gelen uye devam eden pakete girer" kurali (Kumis vakasi) OTOMATIKTI: Ekim'de gruba eklenen HER uye, grubun
# Eylul paketi Ekim'e sarkiyorsa, Eylul kadrosuna da yaziliyordu (kadro dolu olsa bile 5. kisi). Oysa Kumis (ayrilanin yerine,
# kalan 6 derse) ile Ayse (Ekim paketinden yeni baslayan) ayni islem, FARKLI niyet — uygulama niyeti bilemez.
# ILKE (tek cumle, kodda tek nokta): "Bir ayda yapilan kadro degisikligi yalniz o aya ve sonrasina yazilir; ONCEKI ayin
# (sarkan paketin) kadrosuna yalniz kullanicinin ACIK cevabiyla girilir." (v34 "islem yapilan sayfanin ayi" kanonu geri.)
# - saveGroup / assignMemberToSlot: Eylul'e YAZMAZ; kosullar uygunsa (sarkan paket var + kadroda bos yer var + v191 engeli yok)
#   SORAR: "«Grup» Eylul paketi Ekim'e sarkiyor: 6 planli ders. Ayse bu derslere de girsin mi?" Evet → Eylul'e de girer (ucret/hak
#   kalan derse gore sorulur, v171). Hayir / Esc → yalniz Ekim. Kadro doluysa SORMAZ (bilgi toast'i).
# - Karar kaydedilir (g.spillJoin195["uye|ay"] = 'yes'|'no', bulutla senkron) — acilis onarimi ayni soruyu tekrar sormaz.
# - ONARIM (eski otomatik yazimlar icin, acilista yonetici): Eylul kadrosunda olup katilis tarihi Ekim olan, karari kaydedilmemis
#   ve Eylul paketinden henuz HIC ders yapmamis uye → tek tek sorulur: "Eylul'den cikar" / "Kalsin"; cevap kaydedilir.
#   (Kumis gibi ders yapmis olanlar sorulmaz.)
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep("""function __joinSpilledPackage186(g, mid, ctxAy) {
  try {
    if (!g || !mid || !ctxAy) return '';
    const S = __groupSpillMonth186(g, ctxAy); if (!S) return '';
    if (activeGroupRosterForMonth(g, S).includes(mid)) return '';
    const m = state.members.find(function(x){ return x && x.id === mid; }); if (!m) return '';
    { const __blk191 = __spillJoinBlock191(g, mid, S); if (__blk191) { try { __trace('SARKAN PAKET: ' + (m.name || mid) + ' ' + S + ' paketine eklenmedi (' + __blk191 + ')'); } catch(e) {} return ''; } } // v191
    applyRosterChange(g, S, function(mids){""",
"""// v195 ILKE: T ayinda yapilan kadro degisikligi yalniz T ve sonrasina yazilir. Sarkan paketin (S) kadrosuna yalniz
// kullanicinin ACIK cevabiyla girilir — burasi SORUYU KUYRUGA ALIR, hicbir sey yazmaz. Kadro doluysa sorulmaz.
function __spillJoinKey195(mid, S) { return String(mid) + '|' + String(S); }
function __spillJoinDecision195(g, mid, S) { try { return (g && g.spillJoin195 && g.spillJoin195[__spillJoinKey195(mid, S)]) || ''; } catch(e) { return ''; } }
function __spillJoinRecord195(g, mid, S, v) { try { if (!g.spillJoin195 || typeof g.spillJoin195 !== 'object') g.spillJoin195 = {}; g.spillJoin195[__spillJoinKey195(mid, S)] = v; } catch(e) {} }
function __spillPlannedLessons195(g, S, ctxAy) { return (state.lessons || []).filter(function(l){ return l && g && l.groupId === g.id && l.status === 'planned' && (l.packageMonth || String(l.date || '').slice(0, 7)) === S && String(l.date || '') >= ctxAy + '-01'; }).sort(function(a, b){ return String(a.date).localeCompare(String(b.date)); }); }
// Sarkan paketin KALAN derslerindeki doluluk = o derslere yazili farkli uyeler (takvimdeki a/b). S kadro sayisi DEGIL:
// T'de ayrilan (Nese) S kadrosunda kalir ama kalan derslerden dusmustur — yeri bostur (Kumis vakasi).
function __spillOccupancy195(g, S, ctxAy, mid) { const ids = {}; __spillPlannedLessons195(g, S, ctxAy).forEach(function(l){ (l.memberIds || []).forEach(function(x){ if (x && x !== mid) ids[x] = 1; }); }); return Object.keys(ids).length; }
function __joinSpilledPackage186(g, mid, ctxAy) {
  try {
    if (!g || !mid || !ctxAy) return '';
    const S = __groupSpillMonth186(g, ctxAy); if (!S) return '';
    if (activeGroupRosterForMonth(g, S).includes(mid)) return '';
    const m = state.members.find(function(x){ return x && x.id === mid; }); if (!m) return '';
    { const __blk191 = __spillJoinBlock191(g, mid, S); if (__blk191) { try { __trace('SARKAN PAKET: ' + (m.name || mid) + ' ' + S + ' paketine eklenmedi (' + __blk191 + ')'); } catch(e) {} return ''; } } // v191
    const __act = __spillOccupancy195(g, S, ctxAy, mid);
    if (+g.size > 0 && __act >= +g.size) { try { __trace('SARKAN PAKET: ' + (m.name || mid) + ' — ' + S + ' paketinin kalan dersleri dolu (' + __act + '/' + g.size + '), yalnız ' + ctxAy); } catch(e) {} if (typeof plToast === 'function') { try { plToast('ℹ️ ' + (m.name || 'Üye') + ' — ' + pkgMonthLabel(S) + ' paketinin kalan dersleri dolu (' + __act + '/' + g.size + '); yalnız ' + pkgMonthLabel(ctxAy) + ' paketinden itibaren', 6000); } catch(e) {} } return ''; }
    if (__partialOfferQueue.some(function(q){ return q.kind === 'spilljoin195' && q.gid === g.id && q.mid === mid && q.S === S; })) return '';
    __partialOfferQueue.push({ kind: 'spilljoin195', gid: g.id, mid: mid, ay: ctxAy, S: S });
    clearTimeout(__partialOfferQueue._t); __partialOfferQueue._t = setTimeout(__runPartialOffers, 0);
    return '';
  } catch(e) { return ''; }
}
// Kullanici EVET dedi: sarkan pakete (S) gercekten gir — gidenin bos slotu, S kaydi, katilis tarihi, kalan derse gore ucret/hak sorusu.
function __joinSpilledPackageDo195(g, mid, ctxAy, S) {
  try {
    if (!g || !mid || !ctxAy || !S) return '';
    if (activeGroupRosterForMonth(g, S).includes(mid)) return S;
    const m = state.members.find(function(x){ return x && x.id === mid; }); if (!m) return '';
    applyRosterChange(g, S, function(mids){""")

rep("""    __queueJoinOffer(g, mid, S); // kalan derse gore ucret + hak (v171)
    try { syncGroupLessonsToRoster(g.id, S); } catch(e) {}
    try { __autoNameAfterRosterChange(g, S); } catch(e) {}
    return S;
  } catch(e) { return ''; }
}""",
"""    __queueJoinOffer(g, mid, S); // kalan derse gore ucret + hak (v171)
    try { syncGroupLessonsToRoster(g.id, S); } catch(e) {}
    try { __autoNameAfterRosterChange(g, S); } catch(e) {}
    return S;
  } catch(e) { return ''; }
}
// v195: uyenin S ayinda BU GRUP DISINDA kaydi var mi? (baska grup kadrosu / pay / paket / bireysel ya da baska grup dersi /
// baska birime odeme / elle girilmis S fiyati). Yoksa S kaydi yalniz otomatik yazimdan dogmustur.
function __spillOtherUnitInS195(m, g, S) {
  try {
    const pmOf = function(x){ return x.packageMonth || String(x.date || '').slice(0, 7); };
    if ((state.groups || []).some(function(o){ return o && o.id !== g.id && (activeGroupRosterForMonth(o, S) || []).includes(m.id); })) return true;
    if ((state.groups || []).some(function(o){ return o && !!partialShareFor(o.id, m.id, S); })) return true;
    if ((m.packages || []).some(function(p){ return p && p.month === S; })) return true;
    if ((state.lessons || []).some(function(l){ return l && l.status !== 'cancelled' && (l.memberIds || []).includes(m.id) && pmOf(l) === S && l.groupId !== g.id; })) return true;
    if ((state.payments || []).some(function(p){ return p && p.memberId === m.id && pmOf(p) === S && (p.groupId || '') !== g.id; })) return true;
    const mo = (m.monthly || {})[S];
    if (mo && mo.__prorata !== true && mo.totalPrice !== undefined && mo.totalPrice !== null && mo.totalPrice !== '') return true; // ELLE girilmis S fiyati (oneriyle yazilan __prorata fiyati kanit degil)
  } catch(e) {}
  return false;
}
// v195: sarkan pakete OTOMATIK yazilmis uyeyi (S) geri al — v186'nin yazdigi HER SEY: kadro, bu paketin planli dersleri,
// oneriyle yazilan ucret/hak, (S'de baska kaydi yoksa) S kaydi ve S'ye kisaltilmis pasif donemi (→ T). T kaydi aynen.
function __spillJoinUndo195(g, mid, S, T) {
  try {
    if (!g || !mid || !S) return;
    if (g.monthlyMembers && g.monthlyMembers[S]) g.monthlyMembers[S] = (g.monthlyMembers[S] || []).filter(function(x){ return x !== mid; });
    (state.lessons || []).forEach(function(l){ if (l && l.groupId === g.id && l.status === 'planned' && (l.packageMonth || String(l.date || '').slice(0, 7)) === S && (l.memberIds || []).includes(mid)) l.memberIds = (l.memberIds || []).filter(function(x){ return x !== mid; }); });
    const m = (state.members || []).find(function(x){ return x && x.id === mid; });
    if (m) {
      const mo = m.monthly && m.monthly[S];
      if (mo && mo.__prorata === true) { delete mo.totalPrice; delete mo.sessionsOverride; delete mo.__prorata; }
      if (!__spillOtherUnitInS195(m, g, S)) {
        if (mo) { delete mo.enrolled; if (!Object.keys(mo).length) delete m.monthly[S]; else mo.enrolled = false; }
        if (T && Array.isArray(m.archivePeriods)) m.archivePeriods.forEach(function(per){ if (per && per.to && String(per.to).slice(0, 7) === S) per.to = T; });
      }
    }
    try { __autoNameAfterRosterChange(g, S); } catch(e) {}
  } catch(e) {}
}""")

# runner: spilljoin195 sorusu
rep("""      if (it.kind === 'leaveunit186') { // v186""",
"""      if (it.kind === 'spilljoin195') { // v195: sarkan pakete katilim yalniz ACIK cevapla
        const S = it.S; if (!S) continue;
        if (activeGroupRosterForMonth(g, S).includes(it.mid)) continue;
        if (__spillJoinBlock191(g, it.mid, S)) continue;
        if (!activeGroupRosterForMonth(g, it.ay).includes(it.mid)) continue; // T'den cikarilmis — soru anlamsiz
        const __actS = __spillOccupancy195(g, S, it.ay, it.mid);
        if (+g.size > 0 && __actS >= +g.size) continue;
        const __pl = __spillPlannedLessons195(g, S, it.ay);
        const __lblS = pkgMonthLabel(S), __lblT = pkgMonthLabel(it.ay);
        const __gNameS = groupDisplayName(g, S) || g.name || 'Grup';
        const ans = await plDialog({
          msg: '«' + __gNameS + '» ' + __lblS + ' paketi ' + __lblT + ' ayına sarkıyor: ' + __pl.length + ' planlı ders' + (__pl.length ? ' (' + __pl.slice(0, 8).map(function(l){ return fmtDate(l.date); }).join(', ') + (__pl.length > 8 ? '…' : '') + ')' : '') + '. Kalan derslerde kadro ' + __actS + '/' + (+g.size || '?') + '.\\n\\n' +
            m.name + ' bu derslere de girsin mi?\\n\\n' +
            '• Evet: ayrılan üyenin yerine ' + __lblS + ' paketine de katılır (ücret ve ders hakkı kalan derse göre sorulur).\\n' +
            '• Hayır: yalnız ' + __lblT + ' paketinden itibaren; ' + __lblS + ' listesine dokunulmaz.',
          buttons: [{ label: '✅ Evet, ' + __lblS + ' paketine de girsin', value: 'yes', cls: 'ok' }, { label: 'Hayır, yalnız ' + __lblT, value: 'no', cls: 'secondary' }],
          escValue: 'no'
        });
        const __yes = (ans === 'yes' || ans === true);
        __spillJoinRecord195(g, it.mid, S, __yes ? 'yes' : 'no');
        changed = true;
        if (!__yes) { try { __trace('SARKAN PAKET: ' + m.name + ' — ' + S + ' paketine girmedi (kullanıcı: yalnız ' + it.ay + ')'); } catch(e) {} continue; }
        __undoSnapshot(__lblS + ' paketine katıl: ' + m.name);
        __joinSpilledPackageDo195(g, it.mid, it.ay, S);
        if (typeof plToast === 'function') { try { plToast('✓ ' + m.name + ' — ' + __lblS + ' paketinin kalan ' + __pl.length + ' dersine de yazıldı'); } catch(e) {} }
        continue;
      }
      if (it.kind === 'leaveunit186') { // v186""")

# onarim: karari kaydedilmemis + S'de ders yapmamis otomatik yazimlar tek tek sorulur
rep("""async function __offerSpillJoinRepair191() {
  if (__spillRepairAsked191) return;
  const hits = __spillJoinRepairScan191(); if (!hits.length) return;
  __spillRepairAsked191 = true;""",
"""// v195 ONARIM-2: v186'nin OTOMATIK yazdigi, karari kaydedilmemis ve sarkan paketten HIC ders yapmamis uyeler (Ayse Kaya vakasi)
// Taban: v186 04.10.2026'da yayinlandi — otomatik yazim yalniz Eylul 2026 ve sonrasi paketlerde olabilir (eski veri taranmaz).
var __SPILL_SCAN_SINCE195 = '2026-09';
function __spillJoinUndecidedScan195() {
  const hits = [];
  try {
    (state.groups || []).forEach(function(g){
      if (!g || !g.monthlyMembers) return;
      Object.keys(g.monthlyMembers).forEach(function(S){
        if (!/^\\d{4}-\\d{2}$/.test(S) || S < __SPILL_SCAN_SINCE195) return;
        (g.monthlyMembers[S] || []).filter(Boolean).forEach(function(mid){
          const jd = String(((g.memberJoinDates || {})[mid]) || '');
          if (!jd || jd.slice(0, 7) <= S) return;
          if (__spillJoinDecision195(g, mid, S)) return;
          const m = (state.members || []).find(function(x){ return x && x.id === mid; }); if (!m) return;
          const done = (state.lessons || []).some(function(l){ return l && l.groupId === g.id && (l.status === 'completed' || l.status === 'missed') && (l.packageMonth || String(l.date || '').slice(0, 7)) === S && (l.memberIds || []).includes(mid); });
          if (done) return; // ders yapmis — kalmasi gercek (Kumis)
          const paid = (state.payments || []).some(function(p){ return p && p.memberId === mid && (p.groupId || '') === g.id && (p.packageMonth || String(p.date || '').slice(0, 7)) === S; });
          if (paid) return; // S paketi icin odeme girilmis — bilerek alinmis
          hits.push({ gid: g.id, S: S, mid: mid, jd: jd, other: __spillOtherUnitInS195(m, g, S) });
        });
      });
    });
  } catch(e) {}
  return hits;
}
async function __offerSpillJoinUndecided195() {
  const hits = __spillJoinUndecidedScan195(); if (!hits.length) return;
  let n = 0;
  for (const h of hits) {
    const g = state.groups.find(function(x){ return x.id === h.gid; }); const m = state.members.find(function(x){ return x.id === h.mid; });
    if (!g || !m) continue;
    const T = h.jd.slice(0, 7); const lblS = pkgMonthLabel(h.S), lblT = pkgMonthLabel(T);
    const pl = __spillPlannedLessons195(g, h.S, T);
    const ans = await plDialog({
      msg: '🔧 ' + m.name + ' — «' + (groupDisplayName(g, h.S) || g.name || 'Grup') + '»\\n\\n' + fmtDate(h.jd) + ' tarihinde ' + lblT + ' için gruba alınırken ' + lblS + ' paketine de otomatik yazılmış; ' + lblS + ' paketinden henüz ders yapmamış' + (pl.length ? ' (' + pl.length + ' planlı derste)' : '') + '.\\n\\n' + lblS + ' listesinden çıkarılsın mı?\\n• Çıkar: ' + lblS + ' kadrosu, bu paketin planlı dersleri ve varsa öneriyle yazılan ücret/hak temizlenir; ' + (h.other ? lblS + ' ayındaki diğer kaydı korunur' : lblS + ' ayında başka kaydı olmadığından ' + lblS + ' kaydı da kaldırılır') + '; ' + lblT + ' kaydı aynen kalır.\\n• Kalsın: ' + lblS + ' paketinde kalır (ayrılanın yerine geldi).',
      buttons: [{ label: lblS + ' paketinden çıkar', value: 'remove', cls: 'ok' }, { label: 'Kalsın', value: 'keep', cls: 'secondary' }, { label: 'Sonra', value: null, cls: 'secondary' }],
      escValue: null
    });
    if (ans === 'remove' || ans === true) { if (!n) __undoSnapshot('Onarım: sarkan pakete otomatik katılım'); __spillJoinUndo195(g, h.mid, h.S, T); __spillJoinRecord195(g, h.mid, h.S, 'no'); n++; }
    else if (ans === 'keep') { __spillJoinRecord195(g, h.mid, h.S, 'yes'); n++; }
  }
  if (n) { save(); try { renderMembers(); renderGroups(); renderDashboard(); renderCalendar(); refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {} }
}
async function __offerSpillJoinRepair191() {
  if (__spillRepairAsked191) return;
  __spillRepairAsked191 = true;
  try { await __offerSpillJoinUndecided195(); } catch(e) {} // v195
  const hits = __spillJoinRepairScan191(); if (!hits.length) return;""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.10.14.117">', '<meta name="app-version" content="2026.10.15.118">')
rep("const APP_VERSION = '2026.10.14.117';", "const APP_VERSION = '2026.10.15.118';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v194-2026-10-14-117'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v195-2026-10-15-118'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
