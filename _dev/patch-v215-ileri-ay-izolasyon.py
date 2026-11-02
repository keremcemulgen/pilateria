# -*- coding: utf-8 -*-
# v215 — İLERİ AY İŞLEMİ ÖNCEKİ AYLARI DEĞİŞTİRMEZ (Kerem 02.11: "İleri ki aylı tarihlerde ki üye eklemeleri geriye dönük ayları
# etkiliyor hâlâ. Bu kaçıncı aynı sorun bunu düzelt. Uygulamaya bu ve benzeri konular ile ilgili tam tarama yap eksik hata olmasın.")
# TARAMA: `future-add-isolation-215-test` — 14+ ekleme/taşıma/aktive/düzenleme yolu × (bu ay / +1 / +2 ay) × (hazırlıksız / hazır ileri ay)
# her işlemden önce/sonra önceki TÜM ayların görünümünü (Üyeler satırları + istatistik, kadrolar, aylık kayıtlar, paket dersleri,
# ödemeler, Geciken Ödemeler, paylar, Gruplar listesi) karşılaştırır. Yamasız v214'te 36 FAIL.
# KÖK-1 (asıl): `__isGroupDetailOpen()` `style.display`'e bakıyordu; pencereler `classList 'open'` ile açıldığı için (v15'ten beri)
#   HER ZAMAN false → grup detayı hangi ayda açık olursa olsun boş slota ekleme / slottan yeni üye / Grubu Düzenle dışı işlemler
#   ÜYELER SAYFASININ AYINA (çoğu zaman bu ay) yazılıyordu: Aralık grubuna eklenen üye Kasım kadrosuna, Kasım derslerine, Kasım
#   ücretine giriyordu (Kasım borcu). Düzeltme: `classList.contains('open')`.
# KÖK-2: taşımada eski grubun önceki ayın paketi bu aya SARKIYORSA (v179 U4) üye ÖNCEKİ AYIN kadrosundan çıkarılıp pay yazılıyor,
#   ödemesi taşınıyordu → önceki ayda üye bireysel + 4.500 ₺ borç. KEREM KARARI (02.11): "Hiçbir şeye dokunma" → ayrılma/taşıma yalnız
#   işlem ayından itibaren; önceki paket, kadrosu, ödemesi ve sarkan planlı dersleri aynen (Grubu Düzenle'de çıkarma dahil).
# KÖK-3: gruba alınan üye, işlem ayından ÖNCEKİ (bugünden sonraki) planlı BİREYSEL derslerinden de çıkarılıyor; ayrıca takvimdeki
#   TÜM boş bireysel planlı dersler siliniyordu → yalnız işlem ayının ve sonrasının paketleri; silme yalnız bu işlemle boşalan dersler.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:160])
    s = s.replace(old, new)

rep('<meta name="app-version" content="2026.11.02.137">', '<meta name="app-version" content="2026.11.02.138">')
rep("const APP_VERSION = '2026.11.02.137';", "const APP_VERSION = '2026.11.02.138';")

# KÖK-1
rep("""function __isGroupDetailOpen() {
  const bg = document.getElementById('modal-group-detail');
  return !!(bg && bg.style.display && bg.style.display !== 'none');
}""", """function __isGroupDetailOpen() {
  const bg = document.getElementById('modal-group-detail');
  return !!(bg && bg.classList.contains('open')); // v215: pencereler classList 'open' ile açılır — style.display hep boştu (grup ayı yok sayılıyordu)
}""")

# KÖK-2 + KÖK-3: removeMemberFromOtherContexts
rep("""      const __effAy179 = __spillPackageMonth179(g, memberId, __ay) || __ay; // v179 (U4): sarkan paket → ayrilma paketin ayindan""",
    """      const __effAy179 = __ay; // v215 (Kerem "Hiçbir şeye dokunma"): ayrılma YALNIZ işlem ayından — önceki ayın (sarkan) paketi, kadrosu, ödemesi aynen""")
rep("""      __dropFromFutureLessons179(g, memberId, __ay); // v179: onceki paketlerin bu aya sarkan planli dersleri
      __transferShareAndPayments177(g, memberId, keepGroupId, __effAy179, __ay);""",
    """      // v215: önceki paketlerin bu aya sarkan planlı derslerine DOKUNULMAZ (eski v179 __dropFromFutureLessons179 çağrısı kaldırıldı)
      __transferShareAndPayments177(g, memberId, keepGroupId, __effAy179, __ay);""")
rep("""  // İleri tarihli planned bireysel derslerden de çıkar
  const today = todayISO();
  state.lessons.forEach(l => {
    if (!l.groupId && l.status === 'planned' && l.date >= today && l.memberIds.includes(memberId)) {
      l.memberIds = l.memberIds.filter(x => x !== memberId);
      removed.individualLessons++;
    }
  });
  // Boş kalan ileri tarihli bireysel planlı dersleri temizle
  state.lessons = state.lessons.filter(l => {
    if (!l.groupId && l.status === 'planned' && l.date >= today && l.memberIds.length === 0) return false;
    return true;
  });
  return removed;""", """  // İleri tarihli planned bireysel derslerden de çıkar — v215: YALNIZ işlem ayının ve sonrasının paketleri (önceki ayın paketi aynen)
  const today = todayISO();
  const __emptied215 = new Set();
  state.lessons.forEach(l => {
    const __pm215 = l.packageMonth || String(l.date || '').slice(0, 7);
    if (!l.groupId && l.status === 'planned' && l.date >= today && __pm215 >= __ay && l.memberIds.includes(memberId)) {
      l.memberIds = l.memberIds.filter(x => x !== memberId);
      removed.individualLessons++;
      if (!l.memberIds.length) __emptied215.add(l.id);
    }
  });
  // Bu işlemle boşalan ileri tarihli bireysel planlı dersler temizlenir (v215: başka boş kayıtlara dokunulmaz)
  if (__emptied215.size) state.lessons = state.lessons.filter(l => !(l && __emptied215.has(l.id) && !l.groupId && l.status === 'planned' && !(l.memberIds || []).length));
  return removed;""")

# KÖK-2: Grubu Düzenle'de çıkarılan üye
rep("""          const __effR = __spillPackageMonth179(__pg0, rid, __gAy);
          if (__effR) { applyRosterChange(__pg0, __effR, mids => { const out = mids.map(x => x === rid ? '' : x); while (out.length > 0 && out[out.length-1] === '') out.pop(); return out; }); syncGroupLessonsToRoster(__pg0.id, __effR); }
          __dropFromFutureLessons179(__pg0, rid, __gAy);""",
    """          const __effR = ''; // v215 (Kerem "Hiçbir şeye dokunma"): çıkarma YALNIZ bu aydan — önceki ayın (sarkan) paketi ve planlı dersleri aynen""")

# KÖK-2 (pasife alma): bu aydan pasife alınan üye ÖNCEKİ ayın (bu aya sarkan) paketinin planlı derslerinden çıkarılmaz (aynı karar)
rep("""    if ((__pm >= monthISO || String(l.date || '') >= monthISO + '-01') && (l.memberIds||[]).includes(memberId)) { // v179 (U4): onceki paketin bu aya sarkan planli dersleri de""",
    """    if (__pm >= monthISO && (l.memberIds||[]).includes(memberId)) { // v215 (Kerem \"Hiçbir şeye dokunma\"): önceki ayın paketinin bu aya sarkan planlı dersleri AYNEN (eski v179 U4 kaldırıldı)""")

# KÖK-1b: işlem ayı = EN ÜSTTEKİ açık bağlam penceresinin ayı (üye detayı kendi ayıyla / grup detayı kendi ayıyla), yoksa Üyeler sayfası
rep("""function __groupOpsCtxMonth() {
  if (__isGroupDetailOpen() && typeof currentGroupDetailMonth !== 'undefined' && currentGroupDetailMonth) return currentGroupDetailMonth;
  return ((document.getElementById('member-month')||{}).value || '') || currentMonth();
}""", """function __groupOpsCtxMonth() {
  // v215: EN ÜSTTEKİ açık bağlam penceresi kazanır — üye detayı (kendi ayı) ya da grup detayı (kendi ayı); ikisi de yoksa Üyeler sayfasının ayı
  try {
    for (let __i = __modalStack.length - 1; __i >= 0; __i--) {
      const __id = __modalStack[__i]; const __el = document.getElementById(__id);
      if (!__el || !__el.classList.contains('open')) continue;
      if (__id === 'modal-member-detail') { if (typeof currentMemberDetailMonth !== 'undefined' && currentMemberDetailMonth) return currentMemberDetailMonth; break; }
      if (__id === 'modal-group-detail') { if (typeof currentGroupDetailMonth !== 'undefined' && currentGroupDetailMonth) return currentGroupDetailMonth; break; }
    }
  } catch(e) {}
  // v215: pencere yoksa AKTİF SAYFANIN ayı — Gruplar sayfası kendi ay seçicisiyle (eskiden hep Üyeler sayfasının ayı)
  try { const __pg = document.querySelector('.page.active'); if (__pg && __pg.id === 'page-groups') { const __v = (document.getElementById('group-month') || {}).value || ''; if (/^\\d{4}-\\d{2}$/.test(__v)) return __v; } } catch(e) {}
  return ((document.getElementById('member-month')||{}).value || '') || currentMonth();
}""")
# Grup penceresi (Yeni Grup / Düzenle) ayı: grup detayı GERÇEKTEN açıksa onun ayı; değilse işlem ayı (eskiden kapanmış detayın BAYAT ayı)
rep("""  const __gmAy = (typeof currentGroupDetailMonth !== 'undefined' && currentGroupDetailMonth) ? currentGroupDetailMonth : (((document.getElementById('member-month')||{}).value || '') || currentMonth());""",
    """  const __gmAy = (__isGroupDetailOpen() && typeof currentGroupDetailMonth !== 'undefined' && currentGroupDetailMonth) ? currentGroupDetailMonth : __groupOpsCtxMonth(); // v215: kapanmış detayın bayat ayı kullanılmaz; Gruplar sayfası kendi ayı""")
# grup detayından açılan üye detayı GRUBUN AYINDA açılır (görünen ay = işlem ayı)
rep("""onclick="event.stopPropagation();openMemberDetail('${m.id}')" title="Üye detayı — grup detayı arka planda açık kalır">Detay</button>""",
    """onclick="event.stopPropagation();openMemberDetail('${m.id}','${monthISO||''}')" title="Üye detayı — grup detayı arka planda açık kalır">Detay</button>""")
# Grubu pasife al: grup penceresinin ayı ileri bir aysa o aydan (bu ay ve önceki aylar aynen)
rep("""function archiveGroupMonthly(id) {
  const g = state.groups.find(x => x.id === id);
  if (!g) return;
  const cm = currentMonth();""", """function archiveGroupMonthly(id) {
  const g = state.groups.find(x => x.id === id);
  if (!g) return;
  let cm = currentMonth();
  { const __ctx215 = (typeof window.__groupEditCtxMonth === 'string' && window.__groupEditCtxMonth) || __groupOpsCtxMonth(); if (/^\\d{4}-\\d{2}$/.test(String(__ctx215 || '')) && __ctx215 > cm) cm = __ctx215; } // v215: ileri ayın sayfasından → o aydan itibaren""")
rep("""  g.archivedAt = (eff === cm) ? todayISO() : (eff + '-01');""", """  g.archivedAt = (eff === currentMonth()) ? todayISO() : (eff + '-01'); // v215: ileri ay → o ayın 1'i""")
# grup detayından yapılan işlem sonrası detay AYNI AYDA yeniden açılır (eskiden Üyeler sayfasının ayına atlıyordu → sonraki işlem yanlış aya)
rep("""  save();
  alert(`${created} ders oluşturuldu${skipped?`, ${skipped} ders atlandı (çakışma veya mevcut)`:''}.`);
  openGroupDetail(groupId);""", """  save();
  alert(`${created} ders oluşturuldu${skipped?`, ${skipped} ders atlandı (çakışma veya mevcut)`:''}.`);
  openGroupDetail(groupId, __ay156); // v215: aynı ay""")
rep("""  g.packageStartDate = todayISO();
  g.rescheduleUsed = 0;
  g.cancelUsed = 0;
  save();
  openGroupDetail(id);
}
// v26""", """  g.packageStartDate = todayISO();
  g.rescheduleUsed = 0;
  g.cancelUsed = 0;
  save();
  openGroupDetail(id, (__isGroupDetailOpen() && currentGroupDetailMonth) || undefined); // v215: aynı ay
}
// v26""")
rep("""  g.packageStartDate = todayISO();
  g.rescheduleUsed = 0;
  g.cancelUsed = 0;
  save();
  openGroupDetail(id);
}
function scheduleGroupMonth""", """  g.packageStartDate = todayISO();
  g.rescheduleUsed = 0;
  g.cancelUsed = 0;
  save();
  openGroupDetail(id, (__isGroupDetailOpen() && currentGroupDetailMonth) || undefined); // v215: aynı ay
}
function scheduleGroupMonth""")
# pasif (eski arşiv bayraklı) üyeye ders / ödeme girilince: AKTİFLİK o dersin/ödemenin PAKET AYINDAN başlar (bu aydan değil)
rep("""  checked.forEach(mid => { if (isMemberArchived(mid)) unarchiveMember(mid); });""",
    """  checked.forEach(mid => { if (isMemberArchived(mid)) unarchiveMember(mid, packageMonth || undefined); }); // v215: dersin paket ayından""")
rep("""  if (memberId && isMemberArchived(memberId)) unarchiveMember(memberId);
  if (id) { const i = state.payments.findIndex(x=>x.id===id); state.payments[i] = data; }""",
    """  if (memberId && isMemberArchived(memberId)) unarchiveMember(memberId, data.packageMonth || undefined); // v215: ödemenin paket ayından
  if (id) { const i = state.payments.findIndex(x=>x.id===id); state.payments[i] = data; }""")
rep("""    if (isMemberArchived(mid)) unarchiveMember(mid);
    if (packageMonth >= ROSTER_START_MONTH) setMemberMonthly(mid, packageMonth, { enrolled: true }); // v23""",
    """    if (isMemberArchived(mid)) unarchiveMember(mid, packageMonth || undefined); // v215: ödemenin paket ayından
    if (packageMonth >= ROSTER_START_MONTH) setMemberMonthly(mid, packageMonth, { enrolled: true }); // v23""")

io.open(P, 'w', encoding='utf-8').write(s)
W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v214-2026-11-02-137';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v214-2026-11-02-137';", "const CACHE_NAME = 'pilateria-v215-2026-11-02-138';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v215 OK')
