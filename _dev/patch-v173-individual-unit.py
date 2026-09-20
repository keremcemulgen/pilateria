# -*- coding: utf-8 -*-
# v173 — Kerem (2026-09-20), IKI KOK NEDEN:
#
# A) "Temmuzdan sarkan paketin son dersi 19 Eylul'deymis ama panel uyarmadi."
#    KOK NEDEN — CELISKILI IKI KURAL: panelin "1 Kalan / Biten" listesinde
#      • v158: "Biten" satiri YALNIZ icinde bulunulan ayda AKTIF KADROSU olan birim icin gosterilir;
#      • v157 (__supersededGroupFin / __supersededMemberFin): birimin o aydan SONRAKI bir ayda
#        KADRO/kayit izi varsa (g.monthlyMembers[mo>ay] ya da uyenin monthly[mo>ay].enrolled===true)
#        "yeni paket acilmis" sayilip satir DUSURULUR.
#    Temmuz paketi Eylul'de biterse bu ikisi AYNI ANDA saglanamaz: uyari icin Eylul kadrosu sart,
#    ama Eylul kadrosu kaydi "superseded" sayiliyor → uyari HIC dogmuyordu (olculdu: yamasiz build'de
#    son ders "planli" iken "1 ders kaldi" cikiyor, "yapildi" isaretlenince satir kayboluyor).
#    COZUM: (a) GERCEK yeni paket kaydi (packages[].month > ay, ikiz/klon paketleri) her zaman dusurur;
#    (b) salt kadro/enrolled kaydi ise YALNIZ paketin BITIS AYINDAN SONRAKI bir ay icinse dusurur.
#    Paketin bitis ayi = o pakete ait iptal-disi derslerin en gec TARIH ayi (__pkgEndMonth173).
#    Boylece "Temmuz'da bitmis paket + Eylul kaydi" eskisi gibi duser (v157 amaci korunur), ama
#    "Temmuz paketi EYLUL'DE bitti + Eylul kaydi" artik panelde gorunur.
#    (c) CANLI VERIDE OLCULEN ASIL VAKA (Duygu): uye AGUSTOS'tan itibaren PASIF (archivePeriods
#    2026-08→acik, Eylul kaydi yok) ama TEMMUZ paketinin son dersi 19 EYLUL'de (hala planli, 7/8).
#    Panel v153 ("pasife alinan uye/grup listeden duser") ve v159 ("sonraki aydan silinen takip
#    edilmez") kurallariyla onu tamamen eliyordu. Oysa paketi HALA CALISIYOR. v173: bu iki eleme
#    YALNIZ paketi BU AYDAN ONCE bitmis birimlere uygulanir; paketin son dersi bu ay (veya sonrasi)
#    ise birim "canli" sayilir ve 1-kaldi/bitti uyarisi gosterilir (v158 kadro sarti da ayni sekilde).
#    "Canli" YALNIZ SARKAN paket icindir (paket ayi < bu ay): bu ayin paketinde v153/v158/v159 aynen
#    calisir — "sonraki aydan silinen uye takip edilmez" kurali (v159) bozulmaz.
#    (d) 2. PAKET KURALI (canli veride olculdu): Duygu'nun Temmuz'da IKI paketi var — bireysel paket
#    (dersleri 19 Eylul'e sarkiyor) ve grup "(2. Paket)" klonu (13 Agustos'ta bitmis). Eski kural
#    "ayni ay 2. paket acilmis" deyip 1. paketin "bitti" satirini dusuruyordu; oysa 2. paket ONCE
#    bitmis. Artik klon/ikiz yalnizca KENDI BITISI >= bu paketin bitisi ise "devami" sayilir.
#
# B) "Yeni paketi 1 kisilik yaptigimda da grup gorunumunde cikiyor, BIREYSEL secmeme ragmen."
#    KOK NEDEN: grup penceresindeki boyut secenegi "1 kisilik (bireysel)" yaziyor ama her zaman GRUP
#    kaydi aciyordu (Gruplar listesi + Uyeler'de grup blogu). Uygulamada "bireysel birim" = hicbir
#    grupta olmayan uye; yani etiket ile davranis celisiyordu ve bireysel paket acmanin yolu yoktu.
#    Ayrica yeni grup boyutu her zaman 2 geliyordu ("iki kisilik grupta geliyor").
#    COZUM (Kerem onayi): 1 kisilik + TEK uye secili YENI birimde kaydederken tek soru sorulur;
#    "Tamam" → GRUP KAYDI ACILMAZ: uye baglam ayina yazilir (paket/fiyat/hoca/gun-saat uyeye gecer),
#    uye paketi + BIREYSEL dersler olusur, varsa o ay baska gruptan cikarilir (v171 pay teklifi calisir),
#    islem Geri Al kapsamindadir. "Vazgec" → eski davranis (1 kisilik grup). 2+ kisilikte hicbir degisiklik yok.
#    Yeni grupta boyut, kullanici elle degistirene kadar secili uye sayisini izler.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:100])
    s = s.replace(old, new)

# ---------- A1) UYE: sonraki ayda "kayitli olmak" yeni paket DEGILDIR ----------
rep("""    ((x.packages) || []).forEach(function(pk){ if (pk && pk.month && pk.month > ay) sup = true; });
    Object.keys(x.monthly || {}).forEach(function(mo){ const e = x.monthly[mo]; if (e && e.enrolled === true && mo > ay) sup = true; });""",
"""    ((x.packages) || []).forEach(function(pk){ if (pk && pk.month && pk.month > ay) sup = true; });
    // v173 (Kerem: "sarkan paketin bitisi panelde cikmadi"): salt KAYITLI OLMAK yalniz paketin BITIS
    // AYINDAN SONRAKI bir ay icinse "devam etti" sayilir. Eskiden monthly[mo>ay].enrolled===true her
    // durumda dusuruyordu; paket o ayda bitse bile (Temmuz paketi Eylul'de bitti + Eylul kaydi) satir
    // hic dogmuyordu — v158'in "guncel ayda kadrosu olmali" kuraliyla celisiyordu.
    Object.keys(x.monthly || {}).forEach(function(mo){ const e = x.monthly[mo]; if (e && e.enrolled === true && mo > __endAy173) sup = true; });""")

# ---------- A1b) paketin BITIS AYI yardimcisi + uye fonksiyonunda tanim ----------
rep("""function __supersededMemberFin(mid, ay) {
  const me = (state.members || []).find(function(x){ return x && x.id === mid; });
  if (!me || !ay) return false;""",
"""// v173: paketin BITIS AYI = o pakete (packageMonth===ay) ait iptal-disi derslerin en gec TARIH ayi.
// Sarkan paket (Temmuz paketi, son ders Eylul) icin 'ay' Temmuz, bitis ayi Eylul'dur.
function __pkgEndMonth173(ownerType, ownerId, ay) {
  let mx = ay || '';
  (state.lessons || []).forEach(function(l){
    if (!l || l.status === 'cancelled') return;
    const pm = l.packageMonth || String(l.date || '').slice(0, 7);
    if (pm !== ay) return;
    if (ownerType === 'group') { if (l.groupId !== ownerId) return; }
    else { if (l.groupId) return; if (!(l.memberIds || []).includes(ownerId)) return; }
    const dm = String(l.date || '').slice(0, 7);
    if (dm && dm > mx) mx = dm;
  });
  return mx;
}
function __supersededMemberFin(mid, ay) {
  const me = (state.members || []).find(function(x){ return x && x.id === mid; });
  if (!me || !ay) return false;
  const __endAy173 = __pkgEndMonth173('member', mid, ay); // v173""")


# ---------- A1c) KLON/IKIZ "2. paket" ancak KENDI BITISI daha gec/esitse devam sayilir ----------
rep("""    if (!sup && x.id !== mid && (__pkgNumOfName(x.name) || 1) > myNum) {
      if (isMemberEnrolledInMonth(x.id, ay) || ((x.packages) || []).some(function(pk){ return pk && pk.month === ay; })) sup = true;
    }""",
"""    if (!sup && x.id !== mid && (__pkgNumOfName(x.name) || 1) > myNum) {
      // v173 (canli vaka): klon "devami" sayilmak icin KENDI BITISI bu paketin bitisinden once olmamali.
      // Duygu: 2. paket (grup) 13 Agustos'ta bitti, 1. paket (bireysel) 19 Eylul'e sarkiyor → devam DEGIL.
      const __cloneEnd173 = (function(){
        let e = '';
        ((x.packages) || []).forEach(function(pk){ if (pk && pk.month && pk.month > e) e = pk.month; });
        (state.lessons || []).forEach(function(l){ if (!l || l.status === 'cancelled' || !(l.memberIds || []).includes(x.id)) return; const dm = String(l.date || '').slice(0, 7); if (dm > e) e = dm; });
        return e;
      })();
      if ((isMemberEnrolledInMonth(x.id, ay) || ((x.packages) || []).some(function(pk){ return pk && pk.month === ay; })) && (!__cloneEnd173 || __cloneEnd173 >= __endAy173)) sup = true;
    }""")
rep("""    mos.forEach(function(mo){ if (mo > ay || (mo === ay && xNum > myNum)) newer = true; });""",
"""    // v173: ikiz grup da ancak KENDI BITISI bu paketin bitisinden once degilse "devami" sayilir
    const __twinEnd173 = (function(){ let e = ''; (state.lessons || []).forEach(function(l){ if (!l || l.status === 'cancelled' || l.groupId !== x.id) return; const dm = String(l.date || '').slice(0, 7); if (dm > e) e = dm; }); return e; })();
    const __myEnd173 = __pkgEndMonth173('group', gid, ay);
    mos.forEach(function(mo){ if (mo > __myEnd173 || (mo === ay && xNum > myNum && (!__twinEnd173 || __twinEnd173 >= __myEnd173))) newer = true; });""")

# ---------- A2) GRUP: sonraki ayda "kadroda olmak" yeni paket DEGILDIR ----------
rep("""  if (((g.packages) || []).some(function(pk){ return pk && pk.month && pk.month > ay; })) return true;
  if (Object.keys(g.monthlyMembers || {}).some(function(mo){ return mo > ay && (g.monthlyMembers[mo] || []).length > 0; })) return true;""",
"""  if (((g.packages) || []).some(function(pk){ return pk && pk.month && pk.month > ay; })) return true;
  // v173: SONRAKI AYIN KADROSUNDA OLMAK, yalniz paketin BITIS AYINDAN SONRAKI bir ay icinse "devam"
  // sayilir (v158 "guncel ayda kadrosu olmali" kuraliyla celismesin: Temmuz paketi Eylul'de bitip
  // Eylul kadrosu varsa uyari HIC cikmiyordu). Ikiz (2. paket) gruplari asagida ayrica taranir.
  { const __endAyG173 = __pkgEndMonth173('group', gid, ay);
    if (Object.keys(g.monthlyMembers || {}).some(function(mo){ return mo > __endAyG173 && (g.monthlyMembers[mo] || []).length > 0; })) return true; }""")


# ---------- A3) PANEL: paketi HALA CALISAN birim, pasif/silinmis olsa da listelenir ----------
rep("""    state.groups.forEach(function(g){
      const ay = __curAy('group', g.id); if (!ay) return;
      if (isGroupInactiveInMonth(g, ay)) return;
      if (isGroupInactiveInMonth(g, __nowAy)) return; // v153: pasife alinan grup listeden duser
      if (__groupRemovedForward(g, __nowAy)) return; // v159: sonraki aydan silinen grup takip edilmez""",
"""    state.groups.forEach(function(g){
      const ay = __curAy('group', g.id); if (!ay) return;
      if (isGroupInactiveInMonth(g, ay)) return;
      // v173 (Kerem, canli vaka): paketin son dersi BU AY (veya sonrasi) ise birim HALA CALISIYOR —
      // pasif/silinmis olsa bile uyarisi gosterilir. v153/v159/v158 elemeleri yalniz BU AYDAN ONCE
      // bitmis paketlere uygulanir (panel eski birimlerle kirlenmesin diye konmuslardi).
      // "canli" = SARKAN paket: paketin ayi GECMISTE ama son dersi bu ay/sonrasinda. Bu ayin paketinde
      // eski kurallar aynen gecerli (v159: sonraki aydan silinen uye takip edilmez).
      const __live173 = (ay < __nowAy) && (__pkgEndMonth173('group', g.id, ay) >= __nowAy);
      if (!__live173 && isGroupInactiveInMonth(g, __nowAy)) return; // v153: pasife alinan grup listeden duser
      if (!__live173 && __groupRemovedForward(g, __nowAy)) return; // v159: sonraki aydan silinen grup takip edilmez""")
rep("""      if (st === 2 && !((typeof activeGroupRosterForMonth === 'function' ? activeGroupRosterForMonth(g, __nowAy) : []) || []).length) return;""",
"""      if (st === 2 && !__live173 && !((typeof activeGroupRosterForMonth === 'function' ? activeGroupRosterForMonth(g, __nowAy) : []) || []).length) return;""")
rep("""      if (!isMemberEnrolledInMonth(mm.id, ay)) return;
      if (isMemberInactiveInMonth(mm, __nowAy)) return; // v153: pasife alinan uye listeden duser
      if (__removedAfter(mm.id, ay)) return; // v159: sonraki aydan silinen uye takip edilmez (1-kaldi dahil)""",
"""      if (!isMemberEnrolledInMonth(mm.id, ay)) return;
      const __liveM173 = (ay < __nowAy) && (__pkgEndMonth173('member', mm.id, ay) >= __nowAy); // v173: SARKAN paket hala calisiyor mu?
      if (!__liveM173 && isMemberInactiveInMonth(mm, __nowAy)) return; // v153: pasife alinan uye listeden duser
      if (!__liveM173 && __removedAfter(mm.id, ay)) return; // v159: sonraki aydan silinen uye takip edilmez (1-kaldi dahil)""")

# ---------- B1) BIREYSEL BIRIM KURUCU ----------
rep("""function saveGroup() {
  clearModalErrors('modal-group');""",
"""// ===== v173 (Kerem): "1 kisilik (bireysel)" GERCEKTEN BIREYSEL BIRIM ACAR =====
// Grup kaydi YARATILMAZ: uye baglam ayina yazilir, paket/fiyat/hoca/gun-saat uyeye gecer, uye paketi
// ve BIREYSEL dersler olusur, varsa o ay baska gruptan cikarilir (v171 pay teklifi tetiklenir).
function __createIndividualUnit173(memberId, ay, o) {
  const m = state.members.find(function(x){ return x && x.id === memberId; });
  if (!m || !ay) return null;
  o = o || {};
  __undoSnapshot('Bireysel paket: ' + (m.name || 'Üye') + ' — ' + ay); // v165
  const removed = removeMemberFromOtherContexts(memberId, '', ay); // eski grup/ileri bireysel dersler
  if (m.archived && typeof unarchiveMember === 'function') unarchiveMember(memberId, ay);
  const __mm = { enrolled: true };
  if (o.packageId) __mm.packageId = o.packageId;
  if (o.price !== null && o.price !== undefined && o.price !== '' && !isNaN(+o.price)) __mm.totalPrice = +o.price;
  if (o.note) __mm.note = String(o.note);
  setMemberMonthly(memberId, ay, __mm);
  try { __closeArchivePeriodAt(m, ay); } catch(e) {}
  if (o.days && o.days.length) m.defaultDays = o.days.slice();
  if (o.time) m.defaultTime = o.time;
  if (o.instructorId && !m.instructorId) m.instructorId = o.instructorId;
  if (o.rate !== null && o.rate !== undefined && o.rate !== '' && !isNaN(+o.rate)) m.instructorShareRate = +o.rate;
  const __start = (ay === currentMonth()) ? todayISO() : (ay + '-01');
  let __q = 0; try { __q = +sessionQuotaFor('member', memberId, ay) || 0; } catch(e) { __q = 0; }
  if (!(m.packages || []).some(function(p){ return p && p.month === ay; })) {
    createMemberPackage(m, ay, __start, {
      sessions: __q > 0 ? __q : undefined,
      price: (o.price !== null && o.price !== undefined && o.price !== '' && !isNaN(+o.price)) ? +o.price : (+memberMonthlyTotalPrice(memberId, ay) || +m.totalPrice || 0),
      instructorId: o.instructorId || m.instructorId || '',
      instructorShareRate: (o.rate !== null && o.rate !== undefined && o.rate !== '' && !isNaN(+o.rate)) ? +o.rate : undefined
    });
  }
  const gen = autoGenerateMemberLessons(memberId, __start, { days: o.days || [], time: o.time || '', instructorId: o.instructorId || m.instructorId || '', sessionCount: __q > 0 ? __q : undefined });
  save();
  return { removed: removed, gen: gen };
}
function saveGroup() {
  clearModalErrors('modal-group');""")

# ---------- B2) saveGroup: 1 kisilik + tek uye → bireysel sorusu ----------
rep("""  if (errs) { alert('Kırmızı ile işaretli alanları kontrol et.'); return; }
  // Yeni grup kuruluyorsa otomatik ders için uyarı (şart değil, uyarı)""",
"""  if (errs) { alert('Kırmızı ile işaretli alanları kontrol et.'); return; }
  // ===== v173: "1 kisilik (bireysel)" secildiyse GERCEKTEN bireysel ac (grup kaydi yaratma) =====
  if (!id && +size === 1 && memberIds.length === 1) {
    const __ayI = (typeof window.__groupEditCtxMonth === 'string' && window.__groupEditCtxMonth) ? window.__groupEditCtxMonth : __groupOpsCtxMonth();
    const __mI = state.members.find(function(x){ return x && x.id === memberIds[0]; });
    const __nmI = (__mI && __mI.name) || 'Üye';
    if (confirm('👤 «' + __nmI + '» için ' + pkgMonthLabel(__ayI) + ' ayına BİREYSEL paket açayım mı?\\n\\n' +
                '• Tamam: GRUP kaydı açılmaz — üye "Bireysel" olarak listelenir, Gruplar sayfasında görünmez; paketi ve dersleri kendi adına açılır (o ay başka gruptaysa oradan çıkarılır).\\n' +
                '• Vazgeç: eskisi gibi 1 kişilik GRUP olarak kaydedilir.')) {
      if ((!defaultDays.length || !defaultTime) && !confirm('⚠️ Gün veya saat seçmediğin için otomatik ders oluşturulmayacak. Üye detayından "Toplu Ders Gir" ile sonradan girebilirsin. Yine de kaydet?')) return;
      const __r173 = __createIndividualUnit173(memberIds[0], __ayI, {
        packageId: defaultPackageId, price: (customTotalRaw === '' ? null : customTotalPrice),
        days: defaultDays, time: defaultTime, instructorId: defaultInstructorId, rate: groupRate,
        note: ((document.getElementById('mg-note') || {}).value || '').trim()
      });
      closeModal('modal-group');
      try { renderMembers(); renderGroups(); renderCalendar(); renderDashboard(); refreshMemberDetailIfOpen(); } catch(e) {}
      let __msg173 = '✅ «' + __nmI + '» ' + pkgMonthLabel(__ayI) + ' ayına BİREYSEL paketle eklendi (Üyeler sayfasında "Bireysel" satırı).';
      const __g173 = (__r173 && __r173.gen) || {};
      if (__g173.created > 0) __msg173 += '\\n📅 ' + __g173.created + ' ders otomatik takvime eklendi' + (__g173.skipped ? ' (' + __g173.skipped + ' çakışma atlandı)' : '') + '.';
      else if (__g173.reason === 'no-schedule') __msg173 += '\\nℹ️ Gün/saat seçilmediği için ders oluşturulmadı — üye detayından "Toplu Ders Gir" ile girebilirsin.';
      else if (__g173.reason === 'no-quota') __msg173 += '\\n⚠️ Ders hakkı 0 göründüğü için ders oluşturulmadı — üyenin paketini/hakkını kontrol et.';
      if (__r173 && __r173.removed && __r173.removed.groups && __r173.removed.groups.length) __msg173 += '\\nℹ️ ' + __r173.removed.groups.join(', ') + ' kaydından bu ay için çıkarıldı.';
      alert(__msg173);
      return;
    }
  }
  // Yeni grup kuruluyorsa otomatik ders için uyarı (şart değil, uyarı)""")

# ---------- B3) YENI grupta boyut secili uye sayisini izler ----------
rep("""  document.getElementById('mg-size').value = g.size || 2;""",
"""  document.getElementById('mg-size').value = g.size || 2;
  window.__mgSizeTouched = false; // v173: boyut elle degistirilene kadar secili uye sayisini izler""")
rep("""  document.getElementById('mg-size').onchange = updateGroupPricePreview;""",
"""  document.getElementById('mg-size').onchange = function(){ window.__mgSizeTouched = true; updateGroupPricePreview(); }; // v173""")
rep("""    ? rows
    : '<div class="empty" style="padding:20px;">Uygun üye yok. <button type="button" class="btn small" onclick="quickAddMemberFromGroup(\\''+(currentGroupId||'')+'\\')">+ Yeni Üye Oluştur</button></div>'));
}""",
"""    ? rows
    : '<div class="empty" style="padding:20px;">Uygun üye yok. <button type="button" class="btn small" onclick="quickAddMemberFromGroup(\\''+(currentGroupId||'')+'\\')">+ Yeni Üye Oluştur</button></div>'));
  // v173 (Kerem: "iki kisilik grupta geliyor"): YENI grupta boyut secili uye sayisini izler — elle
  // degistirildiyse (mg-size onchange) dokunulmaz; mevcut grubu duzenlerken hic degismez.
  try {
    const __isNewMg = !(((document.getElementById('mg-id') || {}).value) || '') && !currentGroupId;
    const __selN = (selected || []).length;
    if (__isNewMg && !window.__mgSizeTouched && __selN >= 1) {
      const __se = document.getElementById('mg-size');
      const __want = String(Math.max(1, Math.min(5, __selN)));
      if (__se && __se.value !== __want) { __se.value = __want; if (typeof updateGroupPricePreview === 'function') updateGroupPricePreview(); }
    }
  } catch(e) {}
}""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.16.95">', '<meta name="app-version" content="2026.09.20.96">')
rep("const APP_VERSION = '2026.09.16.95';", "const APP_VERSION = '2026.09.20.96';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v172-2026-09-16-95';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v173-2026-09-20-96';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
