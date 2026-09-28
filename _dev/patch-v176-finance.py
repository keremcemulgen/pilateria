# -*- coding: utf-8 -*-
# v176 — MALI DENETIM DUZELTMELERI (Kerem 2026-09-27: "uygulamayi bastan sona kontrol et, gelir hesaplamasinda
# vs bir hata var mi yok mu bundan emin ol"). Uc bagimsiz kod denetimi (gelir/vergi, hoca hakedisi, bakiye/hak)
# + dogrulama olcumleri (_dev/tests/finance-audit-test.js, F1..F27). Her madde tek kaynak/kanonla uyumlu,
# mevcut davranisi bilincli kural (vNNN yorumlari) disinda degistirmez.
#  F1  Grup "Paket Uzadi (0 TL)": aya ozel fiyati olan uye de 0 (eski fiyat __extPrev'de, geri alinca doner)
#  F2  Tik (grup): uyeye ozel hak grubun paket kaydina yazilmiyor — grubun hakki (v172)
#  F3  Odeme penceresi ayi: vadesi gecen karti / uye detayi borcun-detayin ayini verir; on-dolum paket ayi fiyati
#  F4  WhatsApp {kalan}: vadesi gecen → borclu aylarin toplami; toplu → gorunen ay; bugunun dersi → dersin paket ayi
#  F5  "Onceki ay listesini bu aya cek": 2. paket klonlari tasinmaz (v58 kurali, Yeni Ay Hazirligi ile ayni)
#  F6  Ayrilan payi + yeniden aktive / aya ekle: uye kadroya donunce payi duser (v171 "cift sayilmaz")
#  F7  memberBalanceForMonth: o ay kayitli degilse kendi fiyati borc degildir (yalniz odenmemis pay)
#  F8  v175 Bireysele Cevir: grubun AYLIK hakki (monthlySessions) uyeye gecer
#  F9  Gruplar karti + otomatik tamamlama: paket kaydinin sessions'i degil sessionQuotaFor (v170 tek kaynak)
#  F10 Iptal/saat sayaclari dersin PAKET kaydina da islenir (grup detayi ay gorunumu paket sayacini okur; hep 0 gorunuyordu)
#  F11 Vergi modeli: gecmis yil zarari kullanildikca duser
#  F12 KDV: tek kaynak __kdvRateCfg (varsayilan 20, acik 0 = 0) + resmi yontem (IBAN/+KK) calcTax'ta da
#  F13 Net kar: "Hoca Maasi" kategorisi (bordro payout'ta) cift dusulmez — defterle ayni kural
#  F14 Rapor "Diger" satiri: kayit varsa gorunur (negatif toplamda da)
#  F15 Odemeler "Toplam Ders Hakki": paket (uye+grup+ay) basina bir kez
#  F16 Uyeler satiri / vadesi gecen: fiyat tanimsizsa borc uydurulmaz (7000/4500/son odeme uydurmasi kalkti);
#      acik 0 (uzadi) borc degildir
#  F17 Hoca hakedisi tabani: uyelerde fiyat yoksa grup toplami (0 odeniyordu); grupsuz cok-uyeli ders → uyelerin
#      paylari (packageTypes[0]/8 degil). Bolen v54 kalir (uyenin KENDI hakki) — canli veride grubun hak kaydi guvenilmez.
#  F18 2. paket klonlari hoca oranini tasir (uye: instructorShareRate; grup: instructorShareRate + memberInstructorRates)
#      + MEVCUT klonlar icin yukleme onarimi __migV176CloneRates (kok oranini kopyalar; canli veride %50→%30 kaybi)
#  F19 Hoca Maaslari "Kalan": hoca hoca max(0, hak−odenen) toplami; silinmis hocanin odemesi karismaz
#  F20 Ders penceresi placeholder: grup/uye sahibi ile cozulur
#  F21 Ders hakki: paketi olmayan ay eski aktif paketi miras almaz (v170: o ayin paketi > tip > 8)
#  F22 Uye penceresi paket degisimi: gecmis (dersi/odemesi olan) aylar mevcut fiyat/paketiyle dondurulur
#  F23 Kampanya: indirim o ayin fiyatina islenir (borc kalmaz); taksitte indirim bir kez; kullanim paket bazli;
#      duzenlemede kayittaki kampanya listede kalir; kilitli grup payinda uygulanmayan kampanya kaydedilmez
#  F24 Grubu pasife al: bu ayda ders/odeme varsa gelecek aydan; yalniz o aydan itibaren paketlerin planli dersleri iptal
#  F25 Orantili (sonradan katildi) odeme: orantili liste fiyati o ayin fiyati olur
#  F26 Vadesi gecen: 0,01 ₺ yuvarlama farki borc degildir
#  F27 Resmi defter "kayit disi fark": iki taraf da tahsilat ayi esasiyla
#  F28 Yapilmis derste KATILAN herkes hoca tabanina girer (sonradan kadrodan cikan/pasif dahil); ders penceresi onlari
#      isaretli + "kadro disi" rozetiyle gosterir (takvim 4/4 ↔ pencere 3 celiskisi)
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# ---------- F1: grup "Paket Uzadi" — tum kadro 0, eski fiyat saklanir ----------
rep("""  try { resolveGroupMembersForMonth(g, monthISO).forEach(function(mid){ if (!mid) return; const mm = state.members.find(function(x){return x.id===mid;}); const cur = mm && mm.monthly && mm.monthly[monthISO]; if (cur && cur.totalPrice !== undefined && cur.totalPrice !== null && cur.totalPrice !== '' && !cur.__extZero) return; setMemberMonthly(mid, monthISO, { totalPrice: 0, __extZero: true }); }); } catch(e) {}
  return pkg;""",
"""  // v176 (F1): AYA OZEL fiyati olan uye de 0'lanir (eskiden atlaniyordu → "uzadi" dendigi halde borc kaliyordu);
  // eski fiyat __extPrev'de saklanir, geri alinca (mark=false) aynen doner.
  try { resolveGroupMembersForMonth(g, monthISO).forEach(function(mid){ if (!mid) return; const mm = state.members.find(function(x){return x.id===mid;}); const cur = mm && mm.monthly && mm.monthly[monthISO]; if (cur && cur.__extZero) return; const __prev = (cur && cur.totalPrice !== undefined && cur.totalPrice !== null && cur.totalPrice !== '') ? +cur.totalPrice : null; setMemberMonthly(mid, monthISO, { totalPrice: 0, __extZero: true, __extPrev: __prev }); }); } catch(e) {}
  return pkg;""")
rep("""    try { resolveGroupMembersForMonth(g, monthISO).forEach(function(mid){ const mm = state.members.find(function(x){return x.id===mid;}); const cur = mm && mm.monthly && mm.monthly[monthISO]; if (cur && cur.__extZero) { delete cur.totalPrice; delete cur.__extZero; } }); } catch(e) {}""",
"""    try { resolveGroupMembersForMonth(g, monthISO).forEach(function(mid){ const mm = state.members.find(function(x){return x.id===mid;}); const cur = mm && mm.monthly && mm.monthly[monthISO]; if (cur && cur.__extZero) { if (cur.__extPrev !== undefined && cur.__extPrev !== null) cur.totalPrice = +cur.__extPrev; else delete cur.totalPrice; delete cur.__extZero; delete cur.__extPrev; } }); } catch(e) {} // v176 (F1): eski aya-ozel fiyat geri gelir""")

# ---------- F2: tik ile olusan grup paketi grubun hakkini tasir ----------
rep("""      if (gg2 && !(gg2.packages||[]).find(pp=>pp.month===ay)) createGroupPackage(gg2, ay, __st, { sessions });""",
"""      if (gg2 && !(gg2.packages||[]).find(pp=>pp.month===ay)) createGroupPackage(gg2, ay, __st, { sessions: __groupPkgSessions172(memberId, groupId, ay, sessions) }); // v176 (F2): uyeye ozel hak/pay grubun paketine yazilmaz""")

# ---------- F3: odeme penceresi ayi ----------
rep("""          <button class="btn small" onclick="openPaymentModal('${o.memberId}',null,'${o.groupId||''}')">+ Ödeme</button>""",
"""          <button class="btn small" onclick="openPaymentModal('${o.memberId}',null,'${o.groupId||''}','${(o.months||[])[0]||''}')">+ Ödeme</button>""")
rep("""      <button class="btn pl-owner-only" onclick="openPaymentModal('${id}');" title="Ödeme penceresi üstte açılır — üye detayı arkada açık kalır">+ Paket/Ödeme</button>""",
"""      <button class="btn pl-owner-only" onclick="openPaymentModal('${id}', null, '', '${thisMonth}');" title="Ödeme penceresi üstte açılır — üye detayı arkada açık kalır (ödeme bu ayın paketine yazılır)">+ Paket/Ödeme</button>""")
rep("""    const _own = memberMonthlyTotalPrice(memberId, (document.getElementById('mp-date').value||'').slice(0,7)||currentMonth()) || ((state.members.find(x=>x.id===memberId)||{}).totalPrice);""",
"""    const _own = memberMonthlyTotalPrice(memberId, ((document.getElementById('mp-pkg-month')||{}).value) || (document.getElementById('mp-date').value||'').slice(0,7) || currentMonth()) || ((state.members.find(x=>x.id===memberId)||{}).totalPrice); // v176 (F3): PAKET AYININ fiyati (odeme tarihinin ayi degil)""")

# ---------- F4: WhatsApp {kalan} ----------
rep("""  const __waAy = currentMonth();
  const rem = memberBalanceForMonth(memberId, __waAy);""",
"""  const __waAy = currentMonth();
  // v176 (F4): vadesi gecen baglaminda {kalan} = BORCLU AYLARIN toplami (yalniz bugunun ayi degil)
  let rem = memberBalanceForMonth(memberId, __waAy);
  if (contextType === 'overdue') { try { const __ov = getOverduePayments().filter(function(o){ return o.memberId === memberId && !o.groupId; }); if (__ov.length) rem = Math.round(__ov.reduce(function(a, o){ return a + (+o.missing || 0); }, 0) * 100) / 100; } catch(e) {} }""")
rep("""    const rem = memberBalanceForMonth(id, currentMonth()); // v119: TL bakiye (DERS ADEDI degil)""",
"""    const rem = memberBalanceForMonth(id, ((document.getElementById('member-month')||{}).value) || currentMonth()); // v119: TL bakiye · v176 (F4): GORUNEN ayin bakiyesi""")
rep("""      const gBal = groupBalanceForMonth(g.id, ay);""",
"""      const gBal = groupBalanceForMonth(g.id, l.packageMonth || ay); // v176 (F4): dersin PAKET ayinin bakiyesi (sarkan paket bugunun ayina bakmaz)""")
rep("""        const mBal = memberBalanceForMonth(mid, ay);""",
"""        const mBal = memberBalanceForMonth(mid, l.packageMonth || ay); // v176 (F4)""")

# ---------- F5: onceki ay listesi — klonlar tasinmaz ----------
rep("""  const candidates = state.members.filter(m => {
    if (m.archived) return false;
    return isMemberEnrolledInMonth(m.id, prev);
  });""",
"""  const candidates = state.members.filter(m => {
    if (m.archived) return false;
    if (m.secondOfMember) return false; // v176 (F5): 2. paket klonu sonraki aya miras yok (v58; Yeni Ay Hazirligi ile ayni)
    return isMemberEnrolledInMonth(m.id, prev);
  });""")

# ---------- F6: kadroya donen uyenin payi duser ----------
rep("""  setMemberMonthly(id, month, { enrolled: true });
  // gruptaki uyeyse o ayin gruop derslerine geri kat""",
"""  setMemberMonthly(id, month, { enrolled: true });
  __dropPartialIfBackInRoster176(id, month); // v176 (F6): kadroda ise payi duser (v171: pay + kadro fiyati cift sayilmaz)
  // gruptaki uyeyse o ayin gruop derslerine geri kat""")
rep("""function addMemberToMonth(memberId, monthISO) {
  setMemberMonthly(memberId, monthISO, { enrolled: true });""",
"""// v176 (F6): uye o ay bir grubun kadrosunda (yeniden) aktifse o gruptaki "ayrilan payi" kalkar
function __dropPartialIfBackInRoster176(memberId, monthISO) {
  try {
    (state.groups || []).forEach(function(g){
      if (!g || isGroupInactiveInMonth(g, monthISO)) return;
      if (!(resolveGroupMembersForMonth(g, monthISO) || []).includes(memberId)) return;
      if (partialShareFor(g.id, memberId, monthISO)) removePartialShare(g.id, memberId, monthISO);
    });
  } catch(e) {}
}
function addMemberToMonth(memberId, monthISO) {
  setMemberMonthly(memberId, monthISO, { enrolled: true });
  __dropPartialIfBackInRoster176(memberId, monthISO); // v176 (F6)""")

# ---------- F7: kayitli olmayan uyenin kendi fiyati borc degil ----------
rep("""  const defined = +memberMonthlyTotalPrice(memberId, ay) || 0;
  if (defined <= 0) return __pd;
  const g = memberActiveGroupForMonth(memberId, ay);""",
"""  const defined = +memberMonthlyTotalPrice(memberId, ay) || 0;
  if (defined <= 0) return __pd;
  if (ay >= ROSTER_START_MONTH && !isMemberEnrolledInMonth(memberId, ay)) return __pd; // v176 (F7): o ay kayitli degilse (pasif) kendi fiyati borc degildir
  const g = memberActiveGroupForMonth(memberId, ay);""")

# ---------- F8: v175 donusumde grubun AYLIK hakki ----------
rep("""  let quota = 0; try { quota = (gpkg && +gpkg.sessions) ? +gpkg.sessions : (+sessionQuotaFor('member', memberId, ay) || 0); } catch(e) { quota = (gpkg && +gpkg.sessions) || 0; }""",
"""  let quota = 0; try { quota = +sessionQuotaFor('group', gid, ay) || 0; } catch(e) { quota = (gpkg && +gpkg.sessions) || 0; } // v176 (F8): grubun O AYKI hakki (aylik hak > paket > tip) uyeye gecer""")

# ---------- F9: gruplar karti + otomatik tamamlama tek kaynak ----------
rep("""      const sessions = showPkg ? (showPkg.sessions || 8) : 8;""",
"""      const sessions = showPkg ? (+sessionQuotaFor('group', g.id, showPkg.month) || (showPkg.sessions || 8)) : 8; // v176 (F9): gercek hak (aylik hak > paket > tip)""")
rep("""      const used = packageUsedSessions('group', g.id, pkg.month);
      if (used >= (pkg.sessions || 8)) {""",
"""      const used = packageUsedSessions('group', g.id, pkg.month);
      if (used >= (+sessionQuotaFor('group', g.id, pkg.month) || pkg.sessions || 8)) { // v176 (F9): tek kaynak""")

# ---------- F10: iptal/saat sayaclari PAKET kaydina da islenir (grup detayi ay gorunumu paket sayacini okur — sayfa izolasyonu) ----------
rep("""// Mark lesson status (✅ yapıldı / 🔥 yandı / 🚫 iptal / 🕐 planlı)
function markLessonStatus(newStatus) {""",
"""// v176 (F10): grup detayinin AY gorunumu paket kaydindaki sayaclari gosterir (v109 sayfa izolasyonu); artislar
// eskiden yalniz g.cancelUsed/g.rescheduleUsed'a yaziliyordu → ekranda hep 0/1. Artik dersin PAKET AYI kaydina da islenir.
function __bumpPkgCounter176(l, key, delta) {
  try {
    if (!l || !l.groupId) return;
    const g = state.groups.find(function(x){ return x.id === l.groupId; }); if (!g) return;
    const pm = l.packageMonth || String(l.date || '').slice(0, 7);
    const pkg = (g.packages || []).find(function(p){ return p && p.month === pm; }); if (!pkg) return;
    pkg[key] = Math.max(0, (+pkg[key] || 0) + delta);
  } catch(e) {}
}
// Mark lesson status (✅ yapıldı / 🔥 yandı / 🚫 iptal / 🕐 planlı)
function markLessonStatus(newStatus) {""")
rep("""        g.cancelUsed = used + 1;
      }
    }
  }
  // Restore counter if moving FROM cancelled back to another status
  if (prev === 'cancelled' && newStatus !== 'cancelled' && l.groupId) {
    const g = state.groups.find(x=>x.id===l.groupId);
    if (g && g.cancelUsed) g.cancelUsed = Math.max(0, g.cancelUsed - 1);
  }
  l.status = newStatus;""",
"""        g.cancelUsed = used + 1;
        __bumpPkgCounter176(l, 'cancelUsed', 1); // v176 (F10)
      }
    }
  }
  // Restore counter if moving FROM cancelled back to another status
  if (prev === 'cancelled' && newStatus !== 'cancelled' && l.groupId) {
    const g = state.groups.find(x=>x.id===l.groupId);
    if (g && g.cancelUsed) g.cancelUsed = Math.max(0, g.cancelUsed - 1);
    __bumpPkgCounter176(l, 'cancelUsed', -1); // v176 (F10)
  }
  l.status = newStatus;""")
rep("""    if (g) g.rescheduleUsed = (g.rescheduleUsed||0) + 1;
  }
  save();""",
"""    if (g) g.rescheduleUsed = (g.rescheduleUsed||0) + 1;
    __bumpPkgCounter176(l, 'rescheduleUsed', 1); // v176 (F10)
  }
  save();""")
rep("""      g.cancelUsed = used + 1;
    }
  }
  if (prev === 'cancelled' && status !== 'cancelled' && l.groupId) {
    const g = state.groups.find(x=>x.id===l.groupId);
    if (g && g.cancelUsed) g.cancelUsed = Math.max(0, g.cancelUsed - 1);
  }
  l.status = status;""",
"""      g.cancelUsed = used + 1;
      __bumpPkgCounter176(l, 'cancelUsed', 1); // v176 (F10)
    }
  }
  if (prev === 'cancelled' && status !== 'cancelled' && l.groupId) {
    const g = state.groups.find(x=>x.id===l.groupId);
    if (g && g.cancelUsed) g.cancelUsed = Math.max(0, g.cancelUsed - 1);
    __bumpPkgCounter176(l, 'cancelUsed', -1); // v176 (F10)
  }
  l.status = status;""")

# ---------- F11: zarar devri kullanildikca duser ----------
rep("""    if (y !== yil) { if (ytd < 0) zararDevir = Math.round((zararDevir - ytd) * 100) / 100; ytd = 0; yil = y; } // gecmis yil zarari devreder (5 yil kurali muhasebecide)""",
"""    if (y !== yil) { if (ytd < 0) zararDevir = Math.round((zararDevir - ytd) * 100) / 100; else zararDevir = Math.max(0, Math.round((zararDevir - ytd) * 100) / 100); ytd = 0; yil = y; } // gecmis yil zarari devreder; v176 (F11): karli yil devri KULLANIR (tekrar dusulmez) — 5 yil kurali muhasebecide""")

# ---------- F12: KDV tek kaynak + resmi yontem calcTax'ta ----------
rep("""function calcTax(amount, method) {
  const r = state.settings || {};
  const kdvRate = +r.kdvRate || 0;
  const gvRate = +r.gvRate || 0;
  if (method !== 'IBAN') {
    // Cash and card (elden) — no recorded tax in this model; pocket = amount
    return { net: amount, kdv: 0, gv: 0, pocket: amount, kdvRate:0, gvRate:0 };
  }""",
"""// v176 (F12): KDV orani TEK KAYNAK — bos/gecersiz = %20 (varsayilan), acikca 0 girilmisse 0.
function __kdvRateCfg() { const s = state.settings || {}; const v = s.kdvRate; return (v === undefined || v === null || v === '' || !isFinite(+v)) ? 20 : +v; }
function calcTax(amount, method) {
  const r = state.settings || {};
  const kdvRate = __kdvRateCfg();
  const gvRate = +r.gvRate || 0;
  // v176 (F12): RESMI yontem = Ayarlar'daki secim (v137 karari: IBAN + Kredi Karti; 'iban' = yalniz IBAN) —
  // odeme penceresi / odeme listesi / rapor tablosu, Resmi Defter ile AYNI kumeyi kullanir.
  let __official; try { __official = __taxOfficialMethods(); } catch(e) { __official = ['IBAN']; }
  if (__official.indexOf(method) === -1) {
    // Nakit (ve resmi sayilmayan yontemler) — kayitli vergi yok; pocket = amount
    return { net: amount, kdv: 0, gv: 0, pocket: amount, kdvRate:0, gvRate:0 };
  }""")
rep("""    rate: +s.kdvRate || 20,""", """    rate: __kdvRateCfg(), // v176 (F12): tek kaynak""")
rep("""  const kdvRate = state.settings.kdvRate ?? 20;""", """  const kdvRate = __kdvRateCfg(); // v176 (F12): tek kaynak""")
rep("""  state.settings.kdvRate = +document.getElementById('set-kdv').value || 0;""",
"""  state.settings.kdvRate = (function(){ const v = (document.getElementById('set-kdv').value || '').trim(); return v === '' ? 20 : (+v || 0); })(); // v176 (F12): bos = varsayilan 20, acik 0 = 0""")

# ---------- F13: net kar — Hoca Maasi kategorisi cift dusulmez ----------
rep("""  const expMaas = Math.round(expensesForMonth(monthISO).filter(function(e){ return e && e.note && String(e.note).indexOf('MAAS-OTO-') !== -1; }).reduce(function(a,e){ return a + (+e.amount||0); }, 0) * 100) / 100;""",
"""  const expMaas = Math.round(expensesForMonth(monthISO).filter(function(e){ return e && ((e.note && String(e.note).indexOf('MAAS-OTO-') !== -1) || (e.category === 'Hoca Maaşı')); }).reduce(function(a,e){ return a + (+e.amount||0); }, 0) * 100) / 100; // v176 (F13): elle girilen "Hoca Maasi" gideri de bordro (payout) ile cift sayilmaz — Resmi Defter ile ayni kural""")

# ---------- F14: Diger satiri kayit varsa gorunur ----------
rep("""        ${otherGross>0 ? `<tr>
          <td>Diğer</td><td>${otherPayments.length}</td><td>${money(otherGross)} ₺</td>""",
"""        ${otherPayments.length>0 ? `<tr>
          <td>Diğer</td><td>${otherPayments.length}</td><td>${money(otherGross)} ₺</td>""")

# ---------- F15: Toplam Ders Hakki paket basina bir kez ----------
rep("""  const totalSess = list.reduce((a,b)=>a+(+b.sessions||0),0);""",
"""  const totalSess = (function(){ const seen = {}; let t = 0; list.forEach(function(p){ if (!p || p.refund) return; const k = (p.memberId||'') + '|' + (p.groupId||'') + '|' + paymentMonthOf(p); if (seen[k]) return; seen[k] = 1; t += (+p.sessions||0); }); return t; })(); // v176 (F15): taksitler ayni paketin hakkini tekrar saymaz""")

# ---------- F16: fiyat tanimsizsa borc uydurulmaz ----------
rep("""    let expected = monthISO ? memberMonthlyTotalPrice(m.id, monthISO) : 0;
    if (!expected) {
      const memberOwnPrice = (m.totalPrice !== undefined && m.totalPrice !== null && m.totalPrice !== '') ? +m.totalPrice : null;
      expected = (memberOwnPrice !== null) ? memberOwnPrice : (latestPay ? (+latestPay.listPrice || +latestPay.amount) : defaultPkgPrice);
    }""",
"""    // v176 (F16): TANIMLI fiyat = ay override (acik 0 dahil) > genel > atanan paket tipi (memberMonthlyTotalPrice). Tanimsizsa 0 —
    // son odemenin tutari / ilk paket tipi / 7000 UYDURULMAZ (bakiye ve vadesi-gecen kanonu ile ayni: "fiyat tanimsizsa borc yok").
    let expected = monthISO ? (+memberMonthlyTotalPrice(m.id, monthISO) || 0) : (+memberMonthlyTotalPrice(m.id, '') || 0);
    if (expected < 0) expected = 0;""")
rep("""      ay => (memberActiveGroupForMonth(m.id, ay) ? 0 : ((+memberMonthlyTotalPrice(m.id, ay) || 0) || (m.totalPrice ? +m.totalPrice : 0))),""",
"""      ay => (memberActiveGroupForMonth(m.id, ay) ? 0 : (+memberMonthlyTotalPrice(m.id, ay) || 0)), // v176 (F16): acik 0 (uzadi) genel fiyata DUSMEZ""")

# ---------- F17: hoca hakedisi tabani ----------
rep("""function memberPerLessonPrice(memberId, monthISO) {
  // v54: bir uyenin 1-ders parasal payi = ay-fiyati / KENDI ders sayisi (sessionQuotaFor; 8 varsayilan,
  // gec-katilan/az-ders uye icin 5/7...). Grup+bireysel hoca ucreti tabaninda kullanilir.
  const price = +memberMonthlyTotalPrice(memberId, monthISO) || 0;
  if (!price) return 0;
  let q;
  try { q = +sessionQuotaFor('member', memberId, monthISO); } catch (e) { q = 0; }
  if (!q || q < 1) q = PKG_LESSON_DIVISOR;
  return price / q;
}""",
"""// v176 (F17): HAKEDIS TABANI — TUM aylar guncel kurala gore (Kerem 2026-09-28: "eski aylardaki odemelerde hatali
// olduysa guncel duruma gore hesaplat"). Eksik odenmis ay Maaslar sayfasinda "Kismi" gorunur, "Kalani Ode" ile kapanir.
// BOLEN KARARI (canli veriyle dogrulandi): uyenin 1-ders payi = uyenin fiyati / UYENIN KENDI paket ders sayisi (v54) —
// Kerem: "4,3,2 ve bireysel uyelerin fiyatlari fix". Grubun paket kaydindaki hak GUVENILMEZ olabilir (tik ile yanlis
// yazilmis 4'luk Temmuz kaydi: 8 ders yapilmis, uyeler 4500/8) — grubun hakkiyla bolmek hocayi 2 kat oderdi.
// Not: 12 derslik grupta uyelerin paket tipi de 12 olmali (fiyat ↔ ders sayisi ayni kayitta).
const EARN_BASE_FROM_176 = '0000-00';
function memberPerLessonPrice(memberId, monthISO, groupId) {
  // v54: bir uyenin 1-ders parasal payi = ay-fiyati / KENDI ders sayisi (sessionQuotaFor; 8 varsayilan,
  // gec-katilan/az-ders uye icin 5/7...). Grup+bireysel hoca ucreti tabaninda kullanilir. (groupId yalniz imza uyumu)
  const price = +memberMonthlyTotalPrice(memberId, monthISO) || 0;
  if (!price) return 0;
  let q;
  try { q = +sessionQuotaFor('member', memberId, monthISO); } catch (e) { q = 0; }
  if (!q || q < 1) q = PKG_LESSON_DIVISOR;
  return price / q;
}""")
rep("""        let __sum = 0, __n = 0;
        (l.memberIds || []).forEach(mid => {
          if (__roster.has(mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth); __n++; }
          else if (__partial171[mid]) { const __p = __partial171[mid]; __sum += (+__p.sessions > 0 ? (+__p.price || 0) / +__p.sessions : memberPerLessonPrice(mid, l.packageMonth)); __n++; }
        });
        if (__n > 0) return __sum;
        const __gTot = groupExpectedTotal(g, l.packageMonth) || (pkg ? (+pkg.price || 0) : 0);
        return (+__gTot || 0) / PKG_LESSON_DIVISOR;""",
"""        let __sum = 0, __n = 0;
        (l.memberIds || []).forEach(mid => {
          if (__roster.has(mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth, g.id); __n++; }
          else if (__partial171[mid]) { const __p = __partial171[mid]; __sum += (+__p.sessions > 0 ? (+__p.price || 0) / +__p.sessions : memberPerLessonPrice(mid, l.packageMonth, g.id)); __n++; }
        });
        if (__n > 0 && __sum > 0) return __sum;
        // v176 (F17): uyelerde fiyat yok ama grup toplam fiyati (ozel toplam / paket fiyati) varsa: derse katilan
        // kadro uyesi basina (grup toplami / kadro / grubun hakki) — hoca 0 almaz. (Yururluk: EARN_BASE_FROM_176)
        if (__n > 0 && String(l.packageMonth || '') >= EARN_BASE_FROM_176) {
          const __gTot2 = +groupExpectedTotal(g, l.packageMonth) || (pkg ? (+pkg.price || 0) : 0) || (+g.customTotalPrice || 0);
          const __q2 = +sessionQuotaFor('group', g.id, l.packageMonth) || PKG_LESSON_DIVISOR;
          const __rc2 = Math.max(1, __roster.size);
          if (__gTot2 > 0) return (__gTot2 / __rc2 / __q2) * __n;
          return 0;
        }
        if (__n > 0) return 0;
        const __gTot = groupExpectedTotal(g, l.packageMonth) || (pkg ? (+pkg.price || 0) : 0);
        return (+__gTot || 0) / (String(l.packageMonth || '') >= EARN_BASE_FROM_176 ? (+sessionQuotaFor('group', g.id, l.packageMonth) || PKG_LESSON_DIVISOR) : PKG_LESSON_DIVISOR);""")
rep("""  // 2) Geriye dönük uyumluluk — eski v9 ders/ödeme verilerine
  let pkg = null;
  if (l.groupId) {""",
"""  // v176 (F17): paket etiketi olmayan GRUPSUZ ders (2+ uye secilerek acilan): taban = katilan uyelerin
  // 1-ders paylari toplami (her uye kendi ay fiyati / kendi hakki). Eski v9 yolu (packageTypes[0]/8 × kapasite)
  // yalniz hicbir uyede fiyat yoksa kalir.
  if (!l.groupId && Array.isArray(l.memberIds) && l.memberIds.length > 0 && String(l.packageMonth || String(l.date || '').slice(0, 7)) >= EARN_BASE_FROM_176) {
    const __pmF = l.packageMonth || String(l.date || '').slice(0, 7);
    let __sF = 0; l.memberIds.forEach(function(mid){ __sF += memberPerLessonPrice(mid, __pmF); });
    if (__sF > 0) return __sF;
  }
  // 2) Geriye dönük uyumluluk — eski v9 ders/ödeme verilerine
  let pkg = null;
  if (l.groupId) {""")

# ---------- F18: 2. paket klonlari hoca oranini tasir ----------
rep("""    health: '', note: '', instructorShareRate: null,
    totalPrice: (root.totalPrice !== undefined ? root.totalPrice : ''),
    defaultPackageId: root.defaultPackageId || '',
    monthly: { [ay]: { enrolled: true } },
    packages: [], archived: false
  };""",
"""    health: '', note: '', instructorShareRate: (rateDefined(root.instructorShareRate) ? +root.instructorShareRate : null), // v176 (F18): hoca orani klona gecer
    totalPrice: (root.totalPrice !== undefined ? root.totalPrice : ''),
    defaultPackageId: root.defaultPackageId || '',
    monthly: { [ay]: { enrolled: true } },
    packages: [], archived: false
  };""")
rep("""      health: '', note: '', instructorShareRate: null,
      totalPrice: (root.totalPrice !== undefined ? root.totalPrice : ''),
      defaultPackageId: root.defaultPackageId || '',
      monthly: {}, packages: [], archived: false
    };
    clone.monthly[ay] = { enrolled: true };
    state.members.push(clone); return clone.id;
  }).filter(Boolean);""",
"""      health: '', note: '', instructorShareRate: (rateDefined(root.instructorShareRate) ? +root.instructorShareRate : null), // v176 (F18)
      totalPrice: (root.totalPrice !== undefined ? root.totalPrice : ''),
      defaultPackageId: root.defaultPackageId || '',
      monthly: {}, packages: [], archived: false
    };
    clone.monthly[ay] = { enrolled: true };
    clone.__cloneOf176 = mid;
    state.members.push(clone); return clone.id;
  }).filter(Boolean);
  // v176 (F18): grup orani + grup ici uye oranlari klon gruba (klon uye id'leriyle) gecer
  const __mirCl = {}; (g.memberInstructorRates && typeof g.memberInstructorRates === 'object') && cloneIds.forEach(function(cid){ const cm = state.members.find(function(x){ return x.id === cid; }); const src = cm && cm.__cloneOf176; if (src && rateDefined(g.memberInstructorRates[src])) __mirCl[cid] = +g.memberInstructorRates[src]; if (cm) delete cm.__cloneOf176; });""")
rep("""    defaultTime: g.defaultTime || '', defaultDays: (g.defaultDays || []).slice(),
    monthlyMembers: {}, monthlyNotes: {}, packages: [], note: ''
  };
  ng.monthlyMembers[ay] = cloneIds.slice();""",
"""    defaultTime: g.defaultTime || '', defaultDays: (g.defaultDays || []).slice(),
    instructorShareRate: (rateDefined(g.instructorShareRate) ? +g.instructorShareRate : null), memberInstructorRates: __mirCl, // v176 (F18)
    monthlyMembers: {}, monthlyNotes: {}, packages: [], note: ''
  };
  ng.monthlyMembers[ay] = cloneIds.slice();""")

# ---------- F19: Hoca Maaslari Kalan hoca hoca ----------
rep("""  const grandTotal = state.instructors.reduce((a,i)=>a+instructorEarningsForMonth(i.id, m).total, 0);
  const paidTotal = (state.instructorPayouts||[])
    .filter(p => p.year===y && p.month===mo)
    .reduce((a,p)=>a+(+p.amount||0), 0);
  const pending = Math.max(0, grandTotal - paidTotal);""",
"""  const grandTotal = state.instructors.reduce((a,i)=>a+instructorEarningsForMonth(i.id, m).total, 0);
  // v176 (F19): "Odenen" = LISTEDEKI hocalarin odemeleri; "Kalan" = hoca hoca max(0, hak − odenen) toplami —
  // bir hocaya fazla odeme digerinin borcunu gizlemez, silinmis hocanin odemesi karismaz.
  const __ids176 = new Set(state.instructors.map(i => i.id));
  const paidTotal = (state.instructorPayouts||[])
    .filter(p => p.year===y && p.month===mo && __ids176.has(p.instructorId))
    .reduce((a,p)=>a+(+p.amount||0), 0);
  const pending = Math.round(state.instructors.reduce((a,i)=>{ const t = instructorEarningsForMonth(i.id, m).total; const pd = (state.instructorPayouts||[]).filter(p => p.instructorId===i.id && p.year===y && p.month===mo).reduce((x,p)=>x+(+p.amount||0), 0); return a + Math.max(0, t - pd); }, 0) * 100) / 100;""")

# ---------- F21: ders hakki — yalniz O AYIN paketi ----------
rep("""    const pkg = groupPackageForMonth(g, ay); if (pkg && +pkg.sessions) return +pkg.sessions;
    const pts = __ptSessions(g.defaultPackageId); if (pts) return pts;""",
"""    const pkg = (g.packages || []).find(function(p){ return p && p.month === ay; }); if (pkg && +pkg.sessions) return +pkg.sessions; // v176 (F21): eski aktif paket miras alinmaz (v170: aylik hak > o ayin paketi > tip > 8)
    const pts = __ptSessions(g.defaultPackageId); if (pts) return pts;""")
rep("""    const pkg = memberPackageForMonth(m, ay); if (pkg && +pkg.sessions) return +pkg.sessions;
    const pid = ((getMemberMonthlyOverride(ownerId, ay)||{}).packageId) || m.defaultPackageId;""",
"""    const pkg = (m.packages || []).find(function(p){ return p && p.month === ay; }); if (pkg && +pkg.sessions) return +pkg.sessions; // v176 (F21)
    const pid = ((getMemberMonthlyOverride(ownerId, ay)||{}).packageId) || m.defaultPackageId;""")

# ---------- F22: paket degisimi gecmisi dondurur ----------
rep("""  if (__ctxM && __prevM) {
    const __mm = {};
    __mm.note = __noteVal;""",
"""  if (__ctxM && __prevM) {
    // v176 (F22): varsayilan paket degisiyorsa GECMIS (dersi/odemesi/kaydi olan) aylar eski paketiyle dondurulur —
    // fiyat/hak gecmise dogru degismez (v22/v25: "onceki/sonraki aylar etkilenmez; paket de AY bazli").
    try { const __newPid = (document.getElementById('mm-package')||{}).value || ''; const __oldPid = __prevM.defaultPackageId || ''; if (__newPid !== __oldPid) __freezePastMonthsPkg176(__prevM, __ctxM, __oldPid); } catch(e) {}
    const __mm = {};
    __mm.note = __noteVal;""")
rep("""// v12: Aktif üye detayı (cross-modal refresh için)
let currentMemberDetailId = null;""",
"""// v176 (F22): ctxAy'dan onceki, uyenin kaydi/dersi/odemesi olan aylara eski paket (yoksa mevcut 0 fiyat) yazilir
function __freezePastMonthsPkg176(m, ctxAy, oldPid) {
  if (!m || !ctxAy) return;
  const months = new Set();
  (state.lessons || []).forEach(function(l){ if (l && (l.memberIds || []).includes(m.id)) { const pm = l.packageMonth || String(l.date || '').slice(0, 7); if (pm && pm < ctxAy) months.add(pm); } });
  (state.payments || []).forEach(function(p){ if (p && p.memberId === m.id) { const pm = p.packageMonth || String(p.date || '').slice(0, 7); if (pm && pm < ctxAy) months.add(pm); } });
  Object.keys(m.monthly || {}).forEach(function(k){ if (k < ctxAy && m.monthly[k] && m.monthly[k].enrolled) months.add(k); });
  months.forEach(function(mk){
    const ov = (m.monthly || {})[mk] || {};
    if (ov.packageId) return;
    if (oldPid) setMemberMonthly(m.id, mk, { packageId: oldPid });
    else if (ov.totalPrice === undefined || ov.totalPrice === null || ov.totalPrice === '') { if (m.totalPrice === undefined || m.totalPrice === null || m.totalPrice === '') setMemberMonthly(m.id, mk, { totalPrice: 0 }); }
  });
}
// v12: Aktif üye detayı (cross-modal refresh için)
let currentMemberDetailId = null;""")

# ---------- F23: kampanya ----------
rep("""  if (+c.limit > 0) {
    const used = (state.payments||[]).filter(p => p && p.campaignId === c.id).length;
    if (used >= +c.limit) return false;
  }
  return true;
}""",
"""  if (+c.limit > 0) {
    const used = __campaignUses176(c.id); // v176 (F23): kullanim = PAKET (uye+grup+ay) sayisi, taksit kayitlari degil
    if (used >= +c.limit) return false;
  }
  return true;
}
// v176 (F23): kampanyanin kullanildigi paket sayisi (ayni uye+grup+ay bir kez)
function __campaignUses176(cid) {
  const seen = {}; let n = 0;
  (state.payments || []).forEach(function(p){ if (!p || p.campaignId !== cid) return; const k = (p.memberId||'') + '|' + (p.groupId||'') + '|' + paymentMonthOf(p); if (!seen[k]) { seen[k] = 1; n++; } });
  return n;
}
// v176 (F23): kampanyanin liste fiyatina indirimi (tanimdan; tutar−liste farkindan DEGIL — taksit indirim degildir)
function __campaignDiscount176(c, list) {
  if (!c || !(+list > 0)) return 0;
  let d = 0;
  if (c.type === 'percent') d = (+list) * ((+c.value || 0) / 100);
  else if (c.type === 'amount') d = Math.min(+list, +c.value || 0);
  else if (c.type === 'fixed') d = Math.max(0, (+list) - (+c.value || 0));
  return Math.round(d * 100) / 100;
}
// v176 (F23): kampanya kaydi isleme — ilk odemede indirim o AYIN fiyatina islenir (borc kalmaz), sonraki
// taksitte indirim 0; uygulanmamis (kilitli pay) kampanya kaydedilmez. Donus: kayit uzerinde degisiklik.
function __applyCampaignToRecord176(data, camp, listPrice, memberId, groupId, packageMonth, isEditId) {
  if (!data || !camp || !data.campaignId) return;
  const prior = (state.payments || []).some(function(p){ return p && p.id !== (isEditId || '') && p.campaignId === camp.id && p.memberId === memberId && (p.groupId || '') === (groupId || '') && paymentMonthOf(p) === packageMonth; });
  if (prior) { data.discount = 0; return; }
  const d = __campaignDiscount176(camp, listPrice);
  const applied = d > 0 && (+data.amount || 0) <= Math.round((listPrice - d) * 100) / 100 + 0.005;
  if (!applied) { data.campaignId = ''; data.campaignName = ''; data.discount = 0; return; }
  data.discount = d;
  const target = Math.round((listPrice - d) * 100) / 100;
  try { const cur = +memberPriceForGroupMonth(memberId, groupId || '', packageMonth) || 0; if (cur <= 0 || cur > target + 0.005) setMemberMonthly(memberId, packageMonth, { totalPrice: target, __campaign176: camp.id }); } catch(e) {}
}""")
rep("""  if (isRefund) { data.refund = true; data.listPrice = 0; data.discount = 0; data.sessions = 0; } // v127
  // v131: TAKSIT INDIRIM DEGILDIR — v110 kanonu geregi tanimli fiyat varken dusuk tutar taksittir;
  // v123 kalan-on-dolumuyla buildPaymentRecord'un (liste−tutar) farki sahte "indirim" uretiyordu (rapor sisiyordu).
  if (!isRefund && !data.campaignId) {""",
"""  if (isRefund) { data.refund = true; data.listPrice = 0; data.discount = 0; data.sessions = 0; } // v127
  if (!isRefund && data.campaignId) __applyCampaignToRecord176(data, camp, listPrice, memberId, groupId, data.packageMonth, id); // v176 (F23)
  // v131: TAKSIT INDIRIM DEGILDIR — v110 kanunu geregi tanimli fiyat varken dusuk tutar taksittir;
  // v123 kalan-on-dolumuyla buildPaymentRecord'un (liste−tutar) farki sahte "indirim" uretiyordu (rapor sisiyordu).
  if (!isRefund && !data.campaignId) {""")
rep("""    const rec = buildPaymentRecord('', mid, groupId, date, __mPkg, __sess172, listPrice, __amt, method, campaignId, campaignName, note, false);
    rec.packageMonth = packageMonth;
    if (!campaignId) { const __cDsc = paymentCapCheck(mid, groupId, packageMonth, 0, ''); if (__cDsc.defined > 0) rec.discount = 0; } // v131: taksit indirim degildir""",
"""    const rec = buildPaymentRecord('', mid, groupId, date, __mPkg, __sess172, listPrice, __amt, method, campaignId, campaignName, note, false);
    rec.packageMonth = packageMonth;
    if (campaignId) __applyCampaignToRecord176(rec, camp, listPrice, mid, groupId, packageMonth, ''); // v176 (F23)
    if (!rec.campaignId) { const __cDsc = paymentCapCheck(mid, groupId, packageMonth, 0, ''); if (__cDsc.defined > 0) rec.discount = 0; } // v131: taksit indirim degildir""")
rep("""      if (pay.campaignId && cSel.querySelector(`option[value="${pay.campaignId}"]`)) {
        cSel.value = pay.campaignId;
      } else {
        cSel.value = 'none';
      }""",
"""      // v176 (F23): kayittaki kampanya (suresi bitmis / limiti dolmus olsa da) listede kalir — duzenleme kampanyayi dusurmez
      if (pay.campaignId && !cSel.querySelector(`option[value="${pay.campaignId}"]`)) { const __pc = (state.campaigns||[]).find(c => c.id === pay.campaignId); cSel.insertAdjacentHTML('beforeend', `<option value="${pay.campaignId}">${escapeHtml((__pc && __pc.name) || pay.campaignName || 'Kampanya')} (kayıttaki)</option>`); }
      if (pay.campaignId && cSel.querySelector(`option[value="${pay.campaignId}"]`)) {
        cSel.value = pay.campaignId;
      } else {
        cSel.value = 'none';
      }""")

# ---------- F24: grubu pasife al — bu ayda etkinlik varsa gelecek aydan ----------
rep("""  const cm = currentMonth();
  if (!confirm(`"${groupDisplayName(g, cm)}" grubu ${cm} ayından itibaren PASİFE alınacak.\\n\\n• Geçmiş aylar (dersler, ödemeler, üye listesi) AYNEN kalır.\\n• ${cm} ve sonrasında listede görünmez; planlı dersleri iptal edilir.\\n• İstediğinde yeniden aktive edebilirsin (geçmiş pasiflik kaydı sabit kalır).\\n\\nDevam?`)) return;
  __undoSnapshot('Grup pasife al: ' + groupDisplayName(g, cm)); // v165
  g.archived = true;
  g.archivedAt = todayISO();
  let cancelled = 0;
  state.lessons.forEach(l => {
    if (l.groupId === id && l.status === 'planned' && String(l.date||'').slice(0,7) >= cm) { l.status = 'cancelled'; cancelled++; }
  });""",
"""  const cm = currentMonth();
  // v176 (F24): bu ayda YAPILMIS ders ya da odeme varsa grup bu ayin muhasebesinden dusurulmez — GELECEK aydan pasif
  // (aksi halde odenmis/bitmis grup bu ay silinip uyeleri "borclu bireysel" gorunuyordu). Iptal: yalniz pasif
  // aydan itibaren PAKETLERIN planli dersleri — onceki paketin sarkan planli dersleri (odenmis hak) korunur.
  const __actCm = (state.lessons || []).some(l => l && l.groupId === id && (l.status === 'completed' || l.status === 'missed') && (l.packageMonth || String(l.date||'').slice(0,7)) === cm)
    || (state.payments || []).some(p => p && p.groupId === id && (p.packageMonth || String(p.date||'').slice(0,7)) === cm);
  const eff = __actCm ? __taxNextMonth(cm) : cm;
  if (!confirm(`"${groupDisplayName(g, cm)}" grubu ${eff} ayından itibaren PASİFE alınacak.${eff !== cm ? `\\n(Bu ay yapılmış ders/ödeme olduğu için ${cm} ayı olduğu gibi kalır.)` : ''}\\n\\n• Geçmiş aylar (dersler, ödemeler, üye listesi) AYNEN kalır.\\n• ${eff} ve sonrasında listede görünmez; ${eff} ve sonrası paketlerin planlı dersleri iptal edilir (önceki paketin sarkan dersleri korunur).\\n• İstediğinde yeniden aktive edebilirsin (geçmiş pasiflik kaydı sabit kalır).\\n\\nDevam?`)) return;
  __undoSnapshot('Grup pasife al: ' + groupDisplayName(g, cm)); // v165
  g.archived = true;
  g.archivedAt = (eff === cm) ? todayISO() : (eff + '-01');
  let cancelled = 0;
  state.lessons.forEach(l => {
    if (l.groupId === id && l.status === 'planned' && (l.packageMonth || String(l.date||'').slice(0,7)) >= eff) { l.status = 'cancelled'; cancelled++; }
  });""")
rep("""  alert(`✅ Grup ${cm} ayından itibaren pasife alındı${cancelled?` (${cancelled} planlı ders iptal edildi)`:''}. Geçmiş aylar değişmedi.`);""",
"""  alert(`✅ Grup ${eff} ayından itibaren pasife alındı${cancelled?` (${cancelled} planlı ders iptal edildi)`:''}. Geçmiş aylar değişmedi.`);""")

# ---------- F25: orantili odeme o ayin fiyati olur ----------
rep("""  const partial = !!(document.getElementById('mp-prorate') && document.getElementById('mp-prorate').checked);
  const data = buildPaymentRecord(id, memberId, groupId, date, pkgObj, sessions, listPrice, (isRefund ? -Math.abs(amount) : amount), method, campaignId, campaignName, note, partial);""",
"""  const partial = !!(document.getElementById('mp-prorate') && document.getElementById('mp-prorate').checked);
  const data = buildPaymentRecord(id, memberId, groupId, date, pkgObj, sessions, listPrice, (isRefund ? -Math.abs(amount) : amount), method, campaignId, campaignName, note, partial);
  // v176 (F25): "sonradan katildi" orantili odeme — orantili liste fiyati o AYIN fiyati olur (kalan borc uydurulmaz; v171 __prorata)
  if (partial && !isRefund && listPrice > 0) { try { const __pm25 = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7); const __cur25 = +memberPriceForGroupMonth(memberId, groupId || '', __pm25) || 0; if (__cur25 > listPrice + 0.005 || __cur25 <= 0) setMemberMonthly(memberId, __pm25, { totalPrice: Math.round(listPrice * 100) / 100, __prorata: true }); } catch(e) {} }""")

# ---------- F26: kurus yuvarlama farki borc degil ----------
rep("""      const missing = Math.max(0, Math.round((expected - paid) * 100) / 100);
      if (missing <= 0) return;""",
"""      const missing = Math.max(0, Math.round((expected - paid) * 100) / 100);
      if (missing <= 0.05) return; // v176 (F26): kurus yuvarlama farki (grup payi bolme) borc degildir""")

# ---------- F27: resmi defter farki tahsilat ayi esasiyla ----------
rep("""  const reel = netProfitForMonth(String(ay));
  return Object.assign({}, raw, {""",
"""  const reel = netProfitForMonth(String(ay));
  // v176 (F27): defter tahsilat AYI esasli — "kayit disi fark" da tahsilat ayi esasli reel net ile hesaplanir
  // (paket ayi esasli Net Kar ile karistirilinca gec odeme bir ayda "kayit disi", digerinde eksi gorunuyordu).
  const reelDate = __netProfitByDate176(String(ay));
  return Object.assign({}, raw, {""")
rep("""    reelNet: reel.net, kayitDisiFark: Math.round((reel.net - raw.kar) * 100) / 100""",
"""    reelNet: reelDate.net, reelNetPkg: reel.net, kayitDisiFark: Math.round((reelDate.net - raw.kar) * 100) / 100""")
rep("""function netProfitForMonth(monthISO) {""",
"""// v176 (F27): tahsilat AYI esasli net (Resmi Defter karsilastirmasi icin) — gelir p.date ayina gore
function __netProfitByDate176(monthISO) {
  const rev = (state.payments||[]).filter(p => p && String(p.date || '').slice(0,7) === monthISO).reduce((a,b)=>a+(+b.amount||0),0);
  const pay = instructorPayoutsTotalForMonth(monthISO);
  const expMaas = Math.round(expensesForMonth(monthISO).filter(function(e){ return e && ((e.note && String(e.note).indexOf('MAAS-OTO-') !== -1) || (e.category === 'Hoca Maaşı')); }).reduce(function(a,e){ return a + (+e.amount||0); }, 0) * 100) / 100;
  const exp = Math.round((expensesTotalForMonth(monthISO) - expMaas) * 100) / 100;
  return { rev: Math.round(rev*100)/100, pay: pay, exp: exp, net: Math.round((rev - pay - exp)*100)/100 };
}
function netProfitForMonth(monthISO) {""")

# ---------- F23b: kampanya/orantili liste fiyati = UYENIN tanimli fiyati (paket tipi fiyati degil) ----------
rep("""  const pkgId = document.getElementById('mp-pkg').value;
  const campId = document.getElementById('mp-campaign').value;
  const list = computeListPrice(pkgId);
  document.getElementById('mp-list').value = list || '';""",
"""  const pkgId = document.getElementById('mp-pkg').value;
  const campId = document.getElementById('mp-campaign').value;
  const list = __payListBase176(pkgId); // v176 (F23): uyenin o ayki TANIMLI fiyati > paket tipi fiyati
  document.getElementById('mp-list').value = list || '';""")
rep("""function computeListPrice(pkgId) {
  const p = state.packageTypes.find(x=>x.id===pkgId);
  return p ? p.price : 0;
}""",
"""function computeListPrice(pkgId) {
  const p = state.packageTypes.find(x=>x.id===pkgId);
  return p ? p.price : 0;
}
// v176 (F23): kampanya/orantili hesabinin TABANI = uyenin o ayki tanimli fiyati (ay override > genel > paket tipi);
// eskiden paket tipinin fiyati aliniyordu → ozel fiyatli uyede (6.000) kampanya 4.500 uzerinden hesaplaniyordu.
function __payListBase176(pkgId) {
  try {
    const mid = (document.getElementById('mp-member')||{}).value || '';
    const gid = (document.getElementById('mp-group')||{}).value || '';
    const pm = ((document.getElementById('mp-pkg-month')||{}).value) || currentMonth();
    const own = mid ? (+memberPriceForGroupMonth(mid, gid, pm) || 0) : 0;
    if (own > 0) return own;
  } catch(e) {}
  return computeListPrice(pkgId);
}""")
rep("""  const fullList = pkg.price;
  const proratedList = Math.round((fullList * remaining / total) * 100) / 100;""",
"""  const fullList = __payListBase176(pkg.id) || pkg.price; // v176 (F23): uyenin tanimli fiyati
  const proratedList = Math.round((fullList * remaining / total) * 100) / 100;""")

# ---------- kozmetik: Hocalar sayfasi "÷8" etiketi (v54'ten beri bolen = ders hakki) ----------
rep("""<th>Ders Ücreti (÷8)</th>""", """<th>Ders Ücreti (÷ hak)</th>""")
rep("""Ders ücreti = grubun/üyenin o ayki toplam fiyatı ÷ 8 · Hakediş = ders ücreti × hoca oranı.""",
    """Ders ücreti = üyenin o ayki fiyatı ÷ o ayki ders hakkı (grup üyesinde grubun hakkı; derse katılanların payları toplanır) · Hakediş = ders ücreti × hoca oranı.""")

# ---------- F18b: MEVCUT 2. paket klonlarinin kaybolan hoca orani — yukleme onarimi (idempotent) ----------
rep("""  // 7) v162: ay-capasiz dogan gruplar + kanon-oncesi celiskili "cikarildi" kayitlari (idempotent)
  try { __migV162Repair(s); } catch(e) {}
  return s;
}""",
"""  // 7) v162: ay-capasiz dogan gruplar + kanon-oncesi celiskili "cikarildi" kayitlari (idempotent)
  try { __migV162Repair(s); } catch(e) {}
  // 8) v176 (F18): 2. paket klonlarinin kaybolan hoca orani kokten geri yazilir (idempotent)
  try { __migV176CloneRates(s); } catch(e) { try { console.error('[MIG] v176 clone rates', e); } catch(_) {} }
  return s;
}
// v176 (F18) ONARIM — Kerem 2026-09-28: "%50 oran verilmis uyelerin ikinci paketleri %30 varsayilan gelmis".
// Klon uye (secondOfMember) oransizsa kok uyenin orani; klon grup (secondOfGroup) oransizsa kok grubun orani ve
// kok gruptaki uye-bazli oranlar (klon uye id'leriyle). Yalniz BOS olan doldurulur — elle girilmis orana dokunulmaz.
function __migV176CloneRates(s) {
  if (!s) return 0;
  const rd = function(v){ return v !== undefined && v !== null && v !== '' && isFinite(+v) && +v > 0; };
  let n = 0;
  const byId = {}; (s.members || []).forEach(function(m){ if (m && m.id) byId[m.id] = m; });
  (s.members || []).forEach(function(m){
    if (!m || !m.secondOfMember || rd(m.instructorShareRate)) return;
    const root = byId[m.secondOfMember];
    if (root && rd(root.instructorShareRate)) { m.instructorShareRate = +root.instructorShareRate; n++; }
  });
  const gById = {}; (s.groups || []).forEach(function(g){ if (g && g.id) gById[g.id] = g; });
  (s.groups || []).forEach(function(g){
    if (!g || !g.secondOfGroup) return;
    const root = gById[g.secondOfGroup]; if (!root) return;
    if (!rd(g.instructorShareRate) && rd(root.instructorShareRate)) { g.instructorShareRate = +root.instructorShareRate; n++; }
    const rmr = (root.memberInstructorRates && typeof root.memberInstructorRates === 'object') ? root.memberInstructorRates : {};
    if (!Object.keys(rmr).length) return;
    if (!g.memberInstructorRates || typeof g.memberInstructorRates !== 'object') g.memberInstructorRates = {};
    const ids = new Set((g.memberIds || []).filter(Boolean));
    Object.keys(g.monthlyMembers || {}).forEach(function(k){ (g.monthlyMembers[k] || []).filter(Boolean).forEach(function(x){ ids.add(x); }); });
    ids.forEach(function(cid){
      if (rd(g.memberInstructorRates[cid])) return;
      const cm = byId[cid]; const rootId = (cm && cm.secondOfMember) || cid;
      if (rd(rmr[rootId])) { g.memberInstructorRates[cid] = +rmr[rootId]; n++; }
    });
  });
  return n;
}""")

# ---------- F28: YAPILMIS derste KATILAN herkes hoca tabanina girer (kadrodan sonra cikan/pasif olan dahil) ----------
# Kerem 2026-09-28 (canli: 07.09 20:00 dersi): takvim 4/4, pencere 3 isaretli, hoca 3 uzerinden aliyordu — 4. katilan
# ders yapildiktan SONRA pasife alinip kadrodan cikmisti; v49 "kadro disi sizan uye" emniyeti onu da eliyordu.
# Kural: YAPILDI/YANDI dersin memberIds'i KATILIM KAYDIDIR — kayitli her uye tabana girer (pay varsa payin fiyati,
# yoksa kendi ay fiyati / hakki). Planli derste v49 emniyeti aynen kalir (kadro senkronu zaten temizler).
rep("""        let __sum = 0, __n = 0;
        (l.memberIds || []).forEach(mid => {
          if (__roster.has(mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth, g.id); __n++; }
          else if (__partial171[mid]) { const __p = __partial171[mid]; __sum += (+__p.sessions > 0 ? (+__p.price || 0) / +__p.sessions : memberPerLessonPrice(mid, l.packageMonth, g.id)); __n++; }
        });""",
"""        let __sum = 0, __n = 0;
        const __happened176 = lessonHappened(l);
        (l.memberIds || []).forEach(mid => {
          if (__roster.has(mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth, g.id); __n++; }
          else if (__partial171[mid]) { const __p = __partial171[mid]; __sum += (+__p.sessions > 0 ? (+__p.price || 0) / +__p.sessions : memberPerLessonPrice(mid, l.packageMonth, g.id)); __n++; }
          else if (__happened176 && __groupEverHad176(g, mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth, g.id); __n++; } // v176 (F28): katilmis, sonradan ayrilmis/pasif GRUP uyesi (baska grubun sizan uyesi DEGIL — v49)
        });""")
# yardimci: uye bu grubun kadrosunda HIC bulundu mu (herhangi bir ayin anlik goruntusu / ham liste / katilim tarihi / pay)
rep("""function perLessonPriceForLesson(l) {
  if (!l) return 0;""",
"""// v176 (F28): uye bu grubun kadrosunda HERHANGI bir zaman bulundu mu? (aylik anlik goruntuler, ham liste, katilim tarihi, pay)
// Yapilmis dersin katilim kaydinda olup su anki kadroda olmayan uye: gruptan AYRILMIS/pasif uye ise tabana girer;
// hicbir zaman bu grupta olmamis (baska gruptan sizan) uye ise girmez (v49 emniyeti aynen).
function __groupEverHad176(g, mid) {
  if (!g || !mid) return false;
  if ((g.memberIds || []).includes(mid)) return true;
  if (g.memberJoinDates && g.memberJoinDates[mid]) return true;
  const mm = g.monthlyMembers || {};
  for (const k in mm) { if ((mm[k] || []).includes(mid)) return true; }
  const mp = g.monthlyPartials || {};
  for (const a in mp) { if ((mp[a] || []).some(function(p){ return p && p.memberId === mid; })) return true; }
  return false;
}
function perLessonPriceForLesson(l) {
  if (!l) return 0;""")
rep("""    const __monthRoster = new Set(__gmids); // v57: kesisim de KANONIK kadroyla (filtresiz resolve degil)
    const __checkedInGroup = currentlyChecked.filter(mid => __monthRoster.has(mid));
    const __gset = new Set(__gmids.concat(__checkedInGroup));
    sortedMembers = sortedMembers.filter(m => __gset.has(m.id));""",
"""    const __monthRoster = new Set(__gmids); // v57: kesisim de KANONIK kadroyla (filtresiz resolve degil)
    // v176 (F28): dersin ISARETLI (katilmis) uyesi kadro disina cikmis/pasif olsa da LISTEDE ve ISARETLI kalir —
    // yapilmis ders katilim kaydidir (takvim 4/4 iken pencerede 3 gorunmesi biter). Kadroda olmayan "kadro disi" rozeti alir.
    const __checkedInGroup = currentlyChecked.filter(mid => __monthRoster.has(mid) || (state.members.some(x => x && x.id === mid) && __groupEverHad176(__lg, mid))); // baska grubun sizan uyesi yine listelenmez (v49)
    window.__mlOutsideRoster176 = new Set(__checkedInGroup.filter(mid => !__monthRoster.has(mid)));
    const __gset = new Set(__gmids.concat(__checkedInGroup));
    sortedMembers = sortedMembers.filter(m => __gset.has(m.id));""")
rep("""    return `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;">
      <input type="checkbox" value="${m.id}" ${checked?'checked':''} style="width:auto" onchange="onLessonMemberToggle(this)">
      <span>${m.name}</span> ${badge} ${payTag}""",
"""    const __outBadge176 = (window.__mlOutsideRoster176 && window.__mlOutsideRoster176.has(m.id)) ? ' <span class="badge" style="background:#fff3e0;color:#8a5a00;" title="Bu ders yapıldığında katılmış; şu an o ayın kadrosunda değil (ayrılmış/pasif). Hoca hakedişine dahildir.">kadro dışı</span>' : '';
    return `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;">
      <input type="checkbox" value="${m.id}" ${checked?'checked':''} style="width:auto" onchange="onLessonMemberToggle(this)">
      <span>${m.name}</span>${__outBadge176} ${badge} ${payTag}""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.09.23.98">', '<meta name="app-version" content="2026.09.27.99">')
rep("const APP_VERSION = '2026.09.23.98';", "const APP_VERSION = '2026.09.27.99';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v175-2026-09-23-98'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v176-2026-09-27-99'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
