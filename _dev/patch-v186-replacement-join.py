# -*- coding: utf-8 -*-
# v186 — (Kerem 2026-10-04) YERINE GELEN UYE + UYENIN KENDI DERS HAKKI.
# KOK 1 (canli: «SIL*** KIB***» — Eylul paketi 27.09 basladi, kalan 7 ders Ekim tarihli ama paket ayi Eylul):
#   Ekim'de yapilan kadro degisikligi ASIMETRIKTI — cikan uye Eylul (devam eden) paketinden cikiyor, yeni uye yalniz "Ekim"
#   kadrosuna giriyordu; Ekim derslerinin hepsi Eylul paketine ait oldugundan yeni uye hicbir derse giremiyor, ders
#   penceresinde bile listelenmiyordu ("Kubis'i eklemeye izin vermiyor"). v186: __joinSpilledPackage186 — yeni uye DEVAM EDEN
#   (sarkan) pakete gidenin bos slotuna girer, katilis tarihinden sonraki planli derslere yazilir, ucret/hak kalan derse gore
#   (v171 sorusu). "Pasife al / bu aydan cikar" v179 kanonu aynen (devam eden paket ve odemesi oldugu gibi; yeni uye ek kisi).
#   Gruptan cikarilip baska yere gitmeyen uye icin "Pasif mi / Bireysel mi" sorulur (Kerem: sorsun).
# KOK 2 ("6 ders girdim 8 yaziyor", "8 ders disinda giremiyorum"): odeme penceresindeki Ders Sayisi hicbir seyi degistirmiyordu
#   (12 × 562,50 girilince "tanimli fiyat asilamaz"); uyenin kendi hakki varken Kalan Ders grubun 8'inden gosteriliyordu;
#   ozel hakla girilen ucret sonraki aya kopyalaniyordu (Kerem: tasinmasin); ay icinde secilen paket tipi (12) onceden
#   acilmis 8'lik paket kaydi yuzunden etkisizdi. v186: Ders Sayisi → hak + ucret (1 ders ucreti sabit, yalniz o ay),
#   __memberOwnRemaining186, ay-ozel fiyat (__prorata), paket tipi degisince o ayin paket kaydi hakki guncellenir.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# ---------- 1) yardimcilar (sarkan paket) ----------
rep(r"""// Onceki paketlerin bu ay ve sonrasi tarihli PLANLI derslerinden uyeyi cikar (paket ayi ne olursa olsun)
function __dropFromFutureLessons179(g, memberId, ctxAy) {""",
r"""// ===== v186: DEVAM EDEN (SARKAN) PAKETE KATILIM — yerine gelen uye gidenin yerine gecer =====
// Grubun ctxAy'dan ONCEKI bir pakete ait, ctxAy ve sonrasi tarihli planli dersi varsa o paket "devam ediyor"dur.
function __groupSpillMonth186(g, ctxAy) {
  let best = '';
  (state.lessons || []).forEach(function(l){
    if (!l || !g || l.groupId !== g.id || l.status !== 'planned') return;
    const pm = l.packageMonth || String(l.date || '').slice(0, 7);
    if (pm >= ctxAy || String(l.date || '') < ctxAy + '-01') return;
    if (!best || pm < best) best = pm;
  });
  return best;
}
// Yeni uye devam eden pakete (S) de girer: gidenin bos slotu, katilis tarihi, S kaydi, kalan derse gore ucret/hak sorusu.
function __joinSpilledPackage186(g, mid, ctxAy) {
  try {
    if (!g || !mid || !ctxAy) return '';
    const S = __groupSpillMonth186(g, ctxAy); if (!S) return '';
    if (activeGroupRosterForMonth(g, S).includes(mid)) return '';
    const m = state.members.find(function(x){ return x && x.id === mid; }); if (!m) return '';
    applyRosterChange(g, S, function(mids){ const out = mids.slice(); if (out.includes(mid)) return out; const fi = out.indexOf(''); if (fi >= 0) out[fi] = mid; else out.push(mid); return out; });
    setMemberMonthly(mid, S, { enrolled: true });
    try { __closeArchivePeriodAt(m, S); } catch(e) {}
    if (!g.memberJoinDates) g.memberJoinDates = {};
    const jd = (ctxAy === currentMonth()) ? todayISO() : (ctxAy + '-01');
    if (!g.memberJoinDates[mid] || String(g.memberJoinDates[mid]) < S + '-01' || String(g.memberJoinDates[mid]) > jd) g.memberJoinDates[mid] = jd;
    __queueJoinOffer(g, mid, S); // kalan derse gore ucret + hak (v171)
    try { syncGroupLessonsToRoster(g.id, S); } catch(e) {}
    try { __autoNameAfterRosterChange(g, S); } catch(e) {}
    return S;
  } catch(e) { return ''; }
}
// Onceki paketlerin bu ay ve sonrasi tarihli PLANLI derslerinden uyeyi cikar (paket ayi ne olursa olsun)
function __dropFromFutureLessons179(g, memberId, ctxAy) {""")

# ---------- 2) saveGroup: cikan icin soru, eklenen icin devam eden pakete katilim ----------
rep(r"""          __queuePartialOffer(__pg0, rid, __effR || __gAy);
        });""",
r"""          __queuePartialOffer(__pg0, rid, __effR || __gAy);
          __queueLeaveUnit186(__pg0, rid, __gAy); // v186: baska yere gitmiyorsa "Pasif mi / Bireysel mi"
        });
        __added.forEach(aid => { __joinSpilledPackage186(__pg0, aid, __gAy); }); // v186: devam eden pakete gidenin yerine""")

# ---------- 3) assignMemberToSlot (bos slot doldurma) ----------
rep(r"""  __queueJoinOffer(g, memberId, __ctxAy); // v171""",
r"""  __joinSpilledPackage186(g, memberId, __ctxAy); // v186: devam eden (sarkan) pakete de gidenin yerine
  __queueJoinOffer(g, memberId, __ctxAy); // v171""")

# ---------- 5) sira isleyicisi: "Pasif mi / Bireysel mi" ----------
rep(r"""function __queueJoinOffer(g, memberId, ay) {""",
r"""// v186 (Kerem: "sorsun"): gruptan cikarilan ve o ay baska bir birimi olmayan uye icin soru siraya girer
function __queueLeaveUnit186(g, memberId, ay) {
  try {
    if (!g || !memberId || !ay) return;
    if (__partialOfferQueue.some(function(q){ return q.kind === 'leaveunit186' && q.mid === memberId && q.ay === ay; })) return;
    __partialOfferQueue.push({ kind: 'leaveunit186', gid: g.id, mid: memberId, ay: ay });
    clearTimeout(__partialOfferQueue._t); __partialOfferQueue._t = setTimeout(__runPartialOffers, 0);
  } catch(e) {}
}
function __queueJoinOffer(g, memberId, ay) {""")
rep(r"""      if (it.kind === 'leave') {""",
r"""      if (it.kind === 'leaveunit186') { // v186
        if (!isMemberEnrolledInMonth(it.mid, it.ay) || memberActiveGroupForMonth(it.mid, it.ay)) continue;
        const __pmOf186 = x => x.packageMonth || String(x.date || '').slice(0, 7);
        const __own186 = (state.lessons || []).some(function(l){ return l && !l.groupId && l.status !== 'cancelled' && (l.memberIds || []).includes(it.mid) && __pmOf186(l) === it.ay; })
          || (state.payments || []).some(function(p){ return p && p.memberId === it.mid && !p.groupId && __pmOf186(p) === it.ay; })
          || (m.packages || []).some(function(p){ return p && p.month === it.ay; });
        if (__own186) continue; // zaten bireysel birimi var — sorulmaz
        const __lbl = pkgMonthLabel(it.ay);
        let ansU = await plDialog({
          msg: m.name + ' «' + gName + '» grubundan çıkarıldı.\n\n' + __lbl + ' ayında ne olsun?\n\n' +
            '• Pasif: ' + __lbl + ' listesinden çıkar (geçmiş aylar, aldığı dersler ve payı korunur).\n' +
            '• Bireysel: ' + __lbl + ' listesinde bireysel üye olarak kalır (bu ayın ücreti borç görünür).',
          buttons: [{ label: '⏸ Pasif', value: 'passive', cls: 'ok' }, { label: '👤 Bireysel devam', value: 'individual' }, { label: 'Sonra karar veririm', value: null, cls: 'secondary' }],
          escValue: null
        });
        if (ansU !== 'passive') continue; // varsayilan/Vazgec: eski davranis (listede kalir)
        __undoSnapshot('Pasife al: ' + m.name + ' — ' + it.ay);
        __removeMemberFromMonthCore(it.mid, it.ay);
        changed = true;
        if (typeof plToast === 'function') { try { plToast('⏸ ' + m.name + ' — ' + __lbl + ' ayından itibaren pasif'); } catch(e) {} }
        continue;
      }
      if (it.kind === 'leave') {""")
# katilim onerisi: kalan derse gore ucret kurus hassasiyetinde (1 ders ucreti × kalan)
rep(r"""        const sug = base > 0 ? Math.round(base * kalan / q) : 0;""",
r"""        const sug = base > 0 ? Math.round(base * kalan / q * 100) / 100 : 0; // v186: 1 ders ucreti × kalan (kurus hassas)""")

# ---------- 6) uyenin KENDI hakki varsa kalan ders kendi hakkindan ----------
rep(r"""function memberRemainingForMonth(memberId, monthISO){""",
r"""// v186: grupta uyeye ozel hak (elle hak / kalan derse gore hak) varsa kalan = kendi hakki − kendi iptal-disi dersleri
function __memberOwnRemaining186(memberId, g, ay) {
  try {
    if (!g || !memberId || !ay) return null;
    const ov = memberSessionsOverride(memberId, ay); if (ov === null) return null;
    if (__pkgClosedEarlyLesson('group', g.id, ay)) return 0;
    const used = (state.lessons || []).filter(function(l){ return l && l.groupId === g.id && l.status !== 'cancelled' && (l.packageMonth || String(l.date || '').slice(0, 7)) === ay && (l.memberIds || []).includes(memberId); }).length;
    return Math.max(0, ov - used);
  } catch(e) { return null; }
}
function memberRemainingForMonth(memberId, monthISO){""")
rep(r"""  if (g) return sessionsRemainingFor('group', g.id, ay);""",
r"""  if (g) { const __own186 = __memberOwnRemaining186(memberId, g, ay); if (__own186 !== null) return __own186; return sessionsRemainingFor('group', g.id, ay); }""")
rep(r"""    const rem = sessionsRemainingFor('group', id, monthISO || currentMonth());""",
r"""    const rem = (function(){ const __o = __memberOwnRemaining186(m.id, g, monthISO || currentMonth()); return __o !== null ? __o : sessionsRemainingFor('group', id, monthISO || currentMonth()); })(); // v186: uyenin kendi hakki""")

# ---------- 7) Uye Duzenle: ozel hakla girilen ucret ay-ozel; paket tipi degisince o ayin kaydi ----------
rep(r"""    if (totalPrice !== null) { __mm.totalPrice = totalPrice; __mm.__prorata = false; } // v171: elle girilen fiyat kalici (bayrak kalkar)
    __mm.packageId = (document.getElementById('mm-package')||{}).value || ''; // v25: paket de AY bazli
    __mm.sessionsOverride = __sessOverride; // v43: ders hakki (bos='' -> otomatik)
    setMemberMonthly(id, __ctxM, __mm);""",
r"""    if (totalPrice !== null) { __mm.totalPrice = totalPrice; __mm.__prorata = (__sessRaw !== ''); } // v171: elle fiyat kalici · v186 (Kerem): bu aya OZEL hakla girilen ucret yalniz bu ay (sonraki aya tasinmaz)
    const __oldMonthPid186 = (((__prevM.monthly || {})[__ctxM] || {}).packageId) || __prevM.defaultPackageId || '';
    __mm.packageId = (document.getElementById('mm-package')||{}).value || ''; // v25: paket de AY bazli
    __mm.sessionsOverride = __sessOverride; // v43: ders hakki (bos='' -> otomatik)
    setMemberMonthly(id, __ctxM, __mm);
    // v186: ay icinde paket TIPI degistiyse o ayin (onceden 8 ile acilmis) paket kaydinin hakki yeni tipe esitlenir
    try { if (__mm.packageId && __mm.packageId !== __oldMonthPid186) { const __pt186 = (state.packageTypes || []).find(function(p){ return p.id === __mm.packageId; }); const __rec186 = (__prevM.packages || []).find(function(p){ return p && p.month === __ctxM; }); if (__pt186 && +__pt186.sessions > 0 && __rec186) __rec186.sessions = +__pt186.sessions; } } catch(e) {}""")

# ---------- 8) Odeme penceresi: Ders Sayisi → hak + ucret ----------
rep(r"""<input type="number" id="mp-sessions" min="0" placeholder="otomatik: 8">""",
r"""<input type="number" id="mp-sessions" min="0" placeholder="otomatik: 8" oninput="onPaySessionsChange186()">""")
rep(r"""  renderPayBalanceStrip(); // v123
  __refreshPayCarry181(); // v181
  openModal('modal-payment');
}""",
r"""  renderPayBalanceStrip(); // v123
  __refreshPayCarry181(); // v181
  __payBase186Set(); // v186
  openModal('modal-payment');
}
// ===== v186: ODEME PENCERESI "DERS SAYISI" → bu ayin HAKKI + UCRETI (1 ders ucreti sabit) =====
function __payBase186Set() {
  try {
    const editId = (document.getElementById('mp-id') || {}).value || '';
    const mid = (document.getElementById('mp-member') || {}).value || '';
    const gid = (document.getElementById('mp-group') || {}).value || '';
    const pm = ((document.getElementById('mp-pkg-month') || {}).value) || currentMonth();
    if (editId || !mid) { window.__payBase186 = null; return; }
    const q = +memberEffectiveQuota(mid, pm, gid || '') || 0;
    let price = +memberPriceForGroupMonth(mid, gid || '', pm) || 0;
    if (!(price > 0)) price = +((document.getElementById('mp-list') || {}).value) || 0;
    window.__payBase186 = { mid: mid, gid: gid || '', pm: pm, q: q, price: price, per: (q > 0 && price > 0) ? price / q : 0 };
  } catch(e) { window.__payBase186 = null; }
}
function onPaySessionsChange186() {
  const b = window.__payBase186; if (!b) return;
  const info = document.getElementById('mp-discount-info');
  const n = Math.round(+((document.getElementById('mp-sessions') || {}).value) || 0);
  if (!(n > 0) || !(b.per > 0)) return;
  const newPrice = (n === b.q) ? b.price : Math.round(n * b.per * 100) / 100;
  const paid = memberPaidTowardsMonth(b.mid, b.gid, b.pm);
  document.getElementById('mp-list').value = newPrice;
  document.getElementById('mp-amount').value = Math.max(0, Math.round((newPrice - paid) * 100) / 100);
  if (info) info.textContent = (n === b.q) ? '' : ('📐 ' + n + ' ders × ' + money(b.per) + ' ₺ = ' + money(newPrice) + ' ₺ — kaydedince bu üyenin ' + pkgMonthLabel(b.pm) + ' ders hakkı ' + n + ', ücreti ' + money(newPrice) + ' ₺ olur (1 ders ücreti aynı; yalnız bu ay).');
  try { renderTaxBreakdown(); } catch(e) {}
}""")
rep(r"""  renderPayBalanceStrip(); // v123
  __refreshPayCarry181(); // v181
}
function savePayment() {""",
r"""  renderPayBalanceStrip(); // v123
  __refreshPayCarry181(); // v181
  __payBase186Set(); // v186
}
function savePayment() {""")
rep(r"""  if (!isRefund) {
    const __pmMonth = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7);
    const __cap = paymentCapCheck(memberId, groupId, __pmMonth, amount, id || '');""",
r"""  // v186: Ders Sayisi uyenin bu ayki hakkindan farkliysa → bu ayin HAKKI + UCRETI (ay-ozel); kayit basarisizsa geri alinir
  let __hk186 = null;
  if (!id && !isRefund && !(document.getElementById('mp-prorate') && document.getElementById('mp-prorate').checked)) {
    const __b186 = window.__payBase186; const __pm186 = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7);
    const __gEx186 = !groupId || (function(){ const gg = state.groups.find(x => x.id === groupId); if (!gg) return false; return (gg.packages || []).some(p => p && p.month === __pm186); })(); // grup paketi henuz yoksa eski davranis (v172: alan grubun paketini belirler)
    if (__gEx186 && __b186 && __b186.mid === memberId && __b186.gid === (groupId || '') && __b186.pm === __pm186 && sessions > 0 && sessions !== __b186.q && __b186.per > 0) {
      const __m186 = state.members.find(x => x.id === memberId);
      if (__m186) {
        const __np186 = listPrice > 0 ? listPrice : Math.round(sessions * __b186.per * 100) / 100;
        __hk186 = { m: __m186, pm: __pm186, prev: (__m186.monthly && __m186.monthly[__pm186]) ? JSON.parse(JSON.stringify(__m186.monthly[__pm186])) : null };
        setMemberMonthly(memberId, __pm186, { sessionsOverride: sessions, totalPrice: __np186, __prorata: true });
      }
    }
  }
  const __undo186 = () => { if (!__hk186) return; if (__hk186.prev) __hk186.m.monthly[__hk186.pm] = __hk186.prev; else delete __hk186.m.monthly[__hk186.pm]; };
  if (!isRefund) {
    const __pmMonth = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7);
    const __cap = paymentCapCheck(memberId, groupId, __pmMonth, amount, id || '');""")
rep(r"""        alert(`⛔ ${(__dm&&__dm.name)||'Üye'} — ${__pmMonth} paketi ${money(__cap.defined)} ₺.\nŞimdiye kadar ödenen: ${money(__cap.paid)} ₺.\nEn fazla ${money(__cap.kalan)} ₺ daha alınabilir (taksit toplamı tanımlı fiyatı aşamaz).`);
        return;""",
r"""        alert(`⛔ ${(__dm&&__dm.name)||'Üye'} — ${__pmMonth} paketi ${money(__cap.defined)} ₺.\nŞimdiye kadar ödenen: ${money(__cap.paid)} ₺.\nEn fazla ${money(__cap.kalan)} ₺ daha alınabilir (taksit toplamı tanımlı fiyatı aşamaz).`);
        __undo186();
        return;""")

# ---------- 9) sarkan paketin dersleri: ders TARIHININ ayindan ACIKCA cikarilan uye geri yazilmaz ----------
rep(r"""    mids = __applyRosterOverrides(mids, l, g); // v54: elle cikarma + gec katilim
    if (JSON.stringify(l.memberIds||[]) === JSON.stringify(mids)) return;""",
r"""    mids = __applyRosterOverrides(mids, l, g); // v54: elle cikarma + gec katilim
    { const __dm186 = String(l.date || '').slice(0, 7); if (__dm186 > pm) mids = mids.filter(function(mid){ const mm = state.members.find(function(x){ return x.id === mid; }); return !(mm && __prepMemberOut(mm, __dm186)); }); } // v186: sarkan paketin dersi — dersin AYINDAN acikca cikarilan (pasif) uye geri yazilmaz
    if (JSON.stringify(l.memberIds||[]) === JSON.stringify(mids)) return;""")

rep('<meta name="app-version" content="2026.10.02.108">', '<meta name="app-version" content="2026.10.04.109">')
rep("const APP_VERSION = '2026.10.02.108';", "const APP_VERSION = '2026.10.04.109';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v185-2026-10-02-108'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v186-2026-10-04-109'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
