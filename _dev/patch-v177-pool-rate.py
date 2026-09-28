# -*- coding: utf-8 -*-
# v177 — HAVUZ ODEME + GRUP DERSINDE UYEYE OZEL HOCA ORANI (Kerem 2026-09-28)
# Kerem'in kararlari: (1) "EVET — yarida baska gruba gectiyse [eski grupta] sadece 1 derslik parasi x kac derse
# girdiyse o para olmali"; (2) "Gruptaki Tum Uyeler Icin Kaydet" OLDUGU GIBI KALSIN (dokunulmadi);
# (3) "3'u yap, grupta da kisiye ozel [oran] olabiliyor".
#
#  P1 groupPaidForMonth (grubun "Toplanan"i): yalniz o ay kadrodaki uyelerin (kendi fiyatina kadar) + payi olan
#     ayrilanlarin (payina kadar) odemeleri. Kadro disi paysiz odeme ve fazlasi ASKIDA (grup toplamina sayilmaz;
#     uyenin kartinda / odeme listesinde "fazla odeme / kadro disi" rozeti). Fiyatsiz kadro uyesi: sinir yok (eski).
#     Grup detayi "Toplanan", vadesi gecen (grup) ve Uyeler satiri ayni tek kaynagi kullanir.
#  P2 Tasinma (removeMemberFromOtherContexts: slot doldurma, grup penceresi, yeni grup, bireysele gecis): eski grupta
#     pay = uyenin 1-ders fiyati x aldigi ders (otomatik, sorusuz; fiyatsiz uyede v171 sorusu kalir); odemenin payi
#     asan kismi yeni gruba / bireysele tasinir — kayit ikiye bolunur (toplam degismez, vergi alanlari yeniden),
#     "Geri Al" adimi 'Tasinma: ...'.
#  P3 Hoca hakedisi: grup dersinde / grupsuz cok uyeli derste her uyenin payi KENDI oraniyla —
#     resolveInstructorRate(ders, uye): ders override > grubun uye-bazli orani > grup orani > hoca > ayar;
#     grupsuz: ders override > uyenin orani > hoca > ayar. Paket kaydina kopyalanan oran (bayat anlik goruntu)
#     cozumden cikti — grubun/uyenin GUNCEL orani her ay (Kerem 28.09: eski aylar guncel kurala gore).
#     Hocalar sayfasi ders satirinda karma oran etiketi.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# ---------- P1: groupPaidForMonth — kadro + pay siniri; askida odeme yardimcilari ----------
rep("""function groupPaidForMonth(g, ay) {
  return state.payments.filter(p => {
    if (p.groupId !== g.id) return false;
    if (!ay) return true;
    return (p.packageMonth || (p.date ? String(p.date).slice(0,7) : '')) === ay;
  }).reduce((a,b)=>a+(+b.amount||0),0);
}
""",
"""function groupPaidForMonth(g, ay) {
  if (!g) return 0;
  const __all = state.payments.filter(p => {
    if (!p || p.groupId !== g.id) return false;
    if (!ay) return true;
    return (p.packageMonth || (p.date ? String(p.date).slice(0,7) : '')) === ay;
  });
  if (!ay) return __all.reduce((a,b)=>a+(+b.amount||0),0);
  // v177 (P1, Kerem 28.09): grubun TOPLANAN'i = kadrodaki uyelerin (kendi fiyatina kadar) + payi olan ayrilanlarin
  // (payina kadar) odemeleri. Kadro disi paysiz odeme ve fazlasi ASKIDA — kalan uyelerin borcunu gizlemez.
  let sum = 0; const seen = {};
  __all.forEach(p => {
    const mid = p.memberId || '';
    if (!mid) { sum += (+p.amount || 0); return; } // uyesiz eski kayit: eski davranis
    if (seen[mid]) return; seen[mid] = 1;
    sum += memberPaidTowardsMonth(mid, g.id, ay) - __memberGroupExcess177(mid, g.id, ay);
  });
  return Math.round(sum * 100) / 100;
}
// v177 (P1): uyenin o ay o gruba yaptigi odemenin, o gruptaki payini asan (askida) kismi.
// Kadro uyesi: kendi ay fiyati (fiyatsizsa sinir yok); ayrilan payli: payin ucreti; kadro disi paysiz: 0 (tamami askida).
function __memberGroupExcess177(memberId, groupId, ay) {
  try {
    const g = state.groups.find(x => x && x.id === groupId); if (!g || !memberId || !ay) return 0;
    const paid = memberPaidTowardsMonth(memberId, groupId, ay);
    if (!(paid > 0)) return 0;
    let cap;
    if (activeGroupRosterForMonth(g, ay).includes(memberId)) { const pr = +memberMonthlyTotalPrice(memberId, ay) || 0; if (!(pr > 0)) return 0; cap = pr; }
    else { const ps = partialShareFor(groupId, memberId, ay); cap = ps ? (+ps.price || 0) : 0; }
    return Math.max(0, Math.round((paid - cap) * 100) / 100);
  } catch(e) { return 0; }
}
function __memberExcess177(memberId, ay) {
  let sum = 0; const seen = {};
  (state.payments || []).forEach(p => { if (!p || p.memberId !== memberId || !p.groupId || seen[p.groupId]) return; if ((p.packageMonth || String(p.date||'').slice(0,7)) !== ay) return; seen[p.groupId] = 1; sum += __memberGroupExcess177(memberId, p.groupId, ay); });
  return Math.round(sum * 100) / 100;
}
// Odeme satiri rozeti: kadro disi / fazla odeme (grup toplamina sayilmayan kisim)
function __poolBadge177(p) {
  try {
    if (!p || !p.groupId || !p.memberId) return '';
    const ay = p.packageMonth || String(p.date || '').slice(0, 7);
    const ex = __memberGroupExcess177(p.memberId, p.groupId, ay);
    if (!(ex > 0)) return '';
    const g = state.groups.find(x => x && x.id === p.groupId);
    const inRoster = !!(g && activeGroupRosterForMonth(g, ay).includes(p.memberId));
    const ps = partialShareFor(p.groupId, p.memberId, ay);
    const lbl = inRoster ? ('fazla ödeme ' + money(ex) + ' ₺') : (ps ? ('payı aşan ' + money(ex) + ' ₺') : 'kadro dışı — grup toplamına sayılmaz');
    return ' <span class="badge" style="background:#fff3e0;color:#8a5a00;font-size:10px;" title="Bu tutar grubun Toplanan\\'ına sayılmaz: iade et ya da ödeme kaydının ayını/grubunu düzelt.">⚠️ ' + lbl + '</span>';
  } catch(e) { return ''; }
}
""")

# grup detayi "Toplanan (Ay)" ayni tek kaynak
rep("""  const totalRevenue = groupPayments.reduce((a,b)=>a+(+b.amount||0),0);
  const days = (g.defaultDays||[]).map(d=>DAYS[d]).join(', ') || '—';""",
"""  const totalRevenue = monthISO ? groupPaidForMonth(g, monthISO) : groupPayments.reduce((a,b)=>a+(+b.amount||0),0); // v177 (P1): ay gorunumunde kadro+pay siniri (askida odeme sayilmaz)
  const days = (g.defaultDays||[]).map(d=>DAYS[d]).join(', ') || '—';""")

# vadesi gecen (grup): indeks yerine tek kaynak
rep("""    const rows = __ovRows(__ovMonths(gLessons),
      ay => (isGroupInactiveInMonth(g, ay) ? 0 : groupExpectedTotal(g, ay)),
      ay => __gPaid.get(g.id + '|' + ay) || 0);""",
"""    const rows = __ovRows(__ovMonths(gLessons),
      ay => (isGroupInactiveInMonth(g, ay) ? 0 : groupExpectedTotal(g, ay)),
      ay => groupPaidForMonth(g, ay)); // v177 (P1): kadro+pay siniri (indeks tum odemeleri sayiyordu)""")

# uye detayi: fazla odeme uyarisi
rep("""      <div class="stat warn"><div class="label">Ödeme (${ctxAy}) ₺</div><div class="value">${money(totalPaid)}</div>${(function(){try{const __b=memberBalanceForMonth(id, ctxAy);return __b>0?('<div style="font-size:10px;color:#c62828;font-weight:700;margin-top:2px;">Kalan '+money(__b)+' ₺ — taksit devam</div>'):''}catch(e){return ''}})()}</div>""",
"""      <div class="stat warn"><div class="label">Ödeme (${ctxAy}) ₺</div><div class="value">${money(totalPaid)}</div>${(function(){try{const __b=memberBalanceForMonth(id, ctxAy);return __b>0?('<div style="font-size:10px;color:#c62828;font-weight:700;margin-top:2px;">Kalan '+money(__b)+' ₺ — taksit devam</div>'):''}catch(e){return ''}})()}${(function(){try{const __x=__memberExcess177(id, ctxAy);return __x>0?('<div style="font-size:10px;color:#8a5a00;font-weight:700;margin-top:2px;" title="Grup toplamına sayılmayan tutar: iade et ya da ödeme kaydının ayını/grubunu düzelt.">⚠️ Fazla ödeme '+money(__x)+' ₺ — grup toplamına sayılmaz</div>'):''}catch(e){return ''}})()}</div>""")

# odemeler listesi: rozet
rep("""    const groupCell = p.groupId ? `<br><small style="color:var(--p2)">👯 ${groupNameForMonth(p.groupId, p.packageMonth || String(p.date||'').slice(0,7))}</small>` : '';""",
"""    const groupCell = p.groupId ? `<br><small style="color:var(--p2)">👯 ${groupNameForMonth(p.groupId, p.packageMonth || String(p.date||'').slice(0,7))}</small>${__poolBadge177(p)}` : ''; // v177 (P1): askida/fazla odeme rozeti""")

# grup detayi "bu ay ayrilanlar": payi asan odeme
rep("""      '<td>' + (noPrice ? '<span style="color:#c62828;">— <small>ücret gir (✏️)</small></span>' : ('<b>' + money(p.price || 0) + ' ₺</b>')) + (kalan > 0 && paid > 0 ? '<br><span style="font-size:11px;color:#c62828;">Kalan ' + money(kalan) + ' ₺</span>' : '') + '</td>' +""",
"""      '<td>' + (noPrice ? '<span style="color:#c62828;">— <small>ücret gir (✏️)</small></span>' : ('<b>' + money(p.price || 0) + ' ₺</b>')) + (kalan > 0 && paid > 0 ? '<br><span style="font-size:11px;color:#c62828;">Kalan ' + money(kalan) + ' ₺</span>' : '') + ((paid - (+p.price || 0)) > 0.005 ? '<br><span style="font-size:11px;color:#8a5a00;">⚠️ payı aşan ' + money(paid - (+p.price || 0)) + ' ₺ (grup toplamına sayılmaz)</span> <button class="btn small secondary pl-owner-only" style="padding:2px 6px;font-size:11px;" onclick="__moveExcessToCurrentUnit177(\\'' + g.id + '\\',\\'' + p.memberId + '\\',\\'' + ay + '\\')" title="Payı aşan tutarı üyenin bu ayki grubuna / bireysel kaydına taşı (ödeme kaydı bölünür)">↔ Fazlayı taşı</button>' : '') + '</td>' +""")

# Uyeler satiri (ayrilan): not
rep("""        note: 'ayrıldı · ' + (p.sessions || 0) + ' ders' + (p.note ? ' · ' + p.note : ''),""",
"""        note: 'ayrıldı · ' + (p.sessions || 0) + ' ders' + (p.note ? ' · ' + p.note : '') + ((paid - (+p.price || 0)) > 0.005 ? ' · ⚠️ payı aşan ' + money(paid - (+p.price || 0)) + ' ₺' : ''), // v177""")

# ---------- P2: tasinma — pay otomatik (1-ders x alinan), odeme bolunmesi ----------
rep("""function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };
  const __ay = ctxAy || __groupOpsCtxMonth(); // v34
  const __keep = state.groups.find(x => x.id === keepGroupId);
  state.groups.forEach(g => {""",
"""// v177 (P2, Kerem 28.09): TASINMA — eski grupta pay = uyenin 1-ders fiyati x aldigi ders (otomatik); odemenin payi asan
// kismi yeni gruba (keepGroupId) ya da bireysele ('') tasinir. Fiyatsiz uyede (ders almissa) kural hesaplanamaz →
// v171 sorusu kalir, odeme yerinde. Elle pay zaten varsa dokunulmaz.
function __retaxPayment177(p) {
  try { const t = calcTax(+p.amount || 0, p.method); p.kdvRate = t.kdvRate; p.gvRate = t.gvRate; p.net = Math.round(t.net*100)/100; p.kdv = Math.round(t.kdv*100)/100; p.gv = Math.round(t.gv*100)/100; p.pocket = Math.round(t.pocket*100)/100; } catch(e) {}
}
function __movePaymentsOnTransfer177(memberId, fromGid, toGid, ay, keepAmt, note) {
  const pays = (state.payments || []).filter(p => p && p.memberId === memberId && (p.groupId || '') === fromGid && (p.packageMonth || String(p.date || '').slice(0, 7)) === ay && !p.refund && (+p.amount || 0) > 0)
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const total = pays.reduce((a, p) => a + (+p.amount || 0), 0);
  let move = Math.round((total - (+keepAmt || 0)) * 100) / 100;
  if (move <= 0.005) return { moved: 0 };
  let moved = 0;
  for (let i = pays.length - 1; i >= 0 && move > 0.005; i--) { // en son odemeden geriye
    const p = pays[i]; const amt = +p.amount || 0;
    if (amt <= move + 0.005) {
      p.groupId = toGid; p.__movedFrom177 = fromGid; p.note = ((p.note || '') + ' ' + note).trim();
      moved += amt; move = Math.round((move - amt) * 100) / 100;
    } else {
      const np = Object.assign({}, p, { id: uid(), amount: move, listPrice: move, discount: 0, campaignId: '', campaignName: '', groupId: toGid, note: ((p.note || '') + ' ' + note).trim(), __splitOf177: p.id, __movedFrom177: fromGid });
      p.amount = Math.round((amt - move) * 100) / 100; p.listPrice = p.amount; p.discount = 0;
      p.note = ((p.note || '') + ' (bölündü: ' + money(move) + ' ₺ ' + note + ')').trim();
      __retaxPayment177(p); __retaxPayment177(np);
      state.payments.push(np);
      moved += move; move = 0;
    }
  }
  return { moved: Math.round(moved * 100) / 100 };
}
function __transferShareAndPayments177(g, memberId, keepGroupId, ay) {
  try {
    if (!g || !memberId || !ay) return null;
    const m = state.members.find(x => x && x.id === memberId); if (!m) return null;
    if (partialShareFor(g.id, memberId, ay)) return null;
    const __staff = !!(typeof SUPABASE_MODE !== 'undefined' && SUPABASE_MODE && typeof __sbRole !== 'undefined' && __sbRole === 'staff');
    if (__staff) return null; // F16: personel para gormez (fiyat/odeme tablolari sahibe ozel) — v171 personel sorusu (yalniz ders sayisi) kalir; ucreti ve fazlayi yonetici tasir
    const taken = __lessonsTakenInGroup(memberId, g.id, ay);
    const per = +memberPerLessonPrice(memberId, ay) || 0;
    if (taken > 0 && !(per > 0)) return null;
    const paysTotal = memberPaidTowardsMonth(memberId, g.id, ay);
    const keepG = keepGroupId ? state.groups.find(x => x && x.id === keepGroupId) : null;
    const toName = keepGroupId ? ('«' + ((keepG && (groupDisplayName(keepG, ay) || keepG.name)) || 'yeni grup') + '»') : 'bireysel';
    const fromName = '«' + (groupDisplayName(g, ay) || g.name || 'Grup') + '»';
    let share = 0;
    if (taken > 0) { share = Math.round(per * taken * 100) / 100; setPartialShare(g.id, memberId, ay, taken, share, 'taşındı → ' + toName); }
    let mv = { moved: 0 };
    if (paysTotal > share + 0.005) mv = __movePaymentsOnTransfer177(memberId, g.id, keepGroupId || '', ay, share, '↔ taşındı: ' + fromName + ' → ' + toName);
    if (typeof plToast === 'function' && (taken > 0 || mv.moved > 0)) { try { plToast('📎 ' + (m.name || 'Üye') + ' — ' + fromName + ' payı: ' + taken + ' ders · ' + money(share) + ' ₺' + (mv.moved > 0 ? ' · ' + money(mv.moved) + ' ₺ ödeme ' + toName + ' kaydına taşındı' : '')); } catch(e) {} }
    return { taken: taken, share: share, moved: mv.moved };
  } catch(e) { return null; }
}
// Yonetici: ayrilanlar bolumunden "payi asan odemeyi" uyenin O AYKI birimine (yeni grubu / bireysel) tasir
// (personelin tasidigi uye, sonradan yazilan odeme, elle duzeltilen pay).
async function __moveExcessToCurrentUnit177(groupId, memberId, ay) {
  const g = state.groups.find(x => x && x.id === groupId); const m = state.members.find(x => x && x.id === memberId);
  if (!g || !m || !ay) return;
  const ps = partialShareFor(groupId, memberId, ay); if (!ps) { alert('Pay kaydı yok.'); return; }
  const ex = __memberGroupExcess177(memberId, groupId, ay); if (!(ex > 0)) { alert('Payı aşan ödeme yok.'); return; }
  const cur = memberActiveGroupForMonth(memberId, ay); const toGid = cur ? cur.id : '';
  if (toGid === groupId) { alert('Üye hâlâ bu grupta.'); return; }
  const toName = cur ? ('«' + (groupDisplayName(cur, ay) || cur.name || 'Grup') + '»') : 'bireysel kaydına';
  const ok = await plConfirm((m.name || 'Üye') + ' — ' + pkgMonthLabel(ay) + ': «' + (groupDisplayName(g, ay) || g.name || 'Grup') + '» grubuna yaptığı ödemenin payı (' + money(+ps.price || 0) + ' ₺) aşan ' + money(ex) + ' ₺ kısmı ' + toName + ' taşınsın mı?\\n\\n(Ödeme kaydı bölünür, toplam değişmez.)', 'Evet, taşı');
  if (!ok) return;
  __undoSnapshot('Fazla ödemeyi taşı: ' + (m.name || 'Üye') + ' — ' + ay);
  const r = __movePaymentsOnTransfer177(memberId, groupId, toGid, ay, +ps.price || 0, '↔ taşındı: «' + (groupDisplayName(g, ay) || g.name || 'Grup') + '» → ' + (cur ? toName : 'bireysel'));
  save(); try { __refreshUIInPlace(); refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {}
  if (typeof plToast === 'function') { try { plToast('↔ ' + money(r.moved) + ' ₺ ' + toName + ' taşındı'); } catch(e) {} }
}
function __undoSnapshotIfMove177(memberId, keepGroupId, ay) {
  try {
    const m = state.members.find(x => x && x.id === memberId); if (!m || !ay) return;
    const from = state.groups.filter(g => g && g.id !== keepGroupId && !isGroupInactiveInMonth(g, ay) && activeGroupRosterForMonth(g, ay).includes(memberId) && (memberPaidTowardsMonth(memberId, g.id, ay) > 0 || __lessonsTakenInGroup(memberId, g.id, ay) > 0));
    if (!from.length) return;
    const keepG = keepGroupId ? state.groups.find(x => x && x.id === keepGroupId) : null;
    __undoSnapshot('Taşınma: ' + (m.name || 'Üye') + ' — ' + from.map(g => '«' + (groupDisplayName(g, ay) || g.name || 'Grup') + '»').join(', ') + ' → ' + (keepGroupId ? ('«' + ((keepG && (groupDisplayName(keepG, ay) || keepG.name)) || 'yeni grup') + '»') : 'bireysel'));
  } catch(e) {}
}
function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };
  const __ay = ctxAy || __groupOpsCtxMonth(); // v34
  const __keep = state.groups.find(x => x.id === keepGroupId);
  __undoSnapshotIfMove177(memberId, keepGroupId, __ay); // v177: tasinma tek "Geri Al" adimi (kadro + pay + odeme)
  state.groups.forEach(g => {""")
rep("""      syncGroupLessonsToRoster(g.id, __ay);
      __queuePartialOffer(g, memberId, __ay); // v171: eski grupta aldigi dersler varsa payi sorulur""",
"""      syncGroupLessonsToRoster(g.id, __ay);
      __transferShareAndPayments177(g, memberId, keepGroupId, __ay); // v177 (P2): pay = 1-ders x alinan; fazla odeme yeni kayda
      __queuePartialOffer(g, memberId, __ay); // v171: (pay yazilmadiysa — fiyatsiz uye) payi sorulur""")

# ---------- P3: uyeye ozel oran grup dersinde; paket orani kopyasi cozumden cikti ----------
rep("""function resolveInstructorRate(lesson) {
  if (!lesson) return (+state.settings.instructorShareRate || 30);
  // 1) Ders bazında override (en yüksek öncelik)
  if (rateDefined(lesson.instructorRateOverride)) return +lesson.instructorRateOverride; // v58: 0 override tanimsiz sayilir
  // 2) Paket bazında (groupPackage veya memberPackage'in instructorShareRate'i)
  if (lesson.packageOwnerType === 'group' && lesson.packageOwnerId && lesson.packageMonth) {
    const g = state.groups.find(x => x.id === lesson.packageOwnerId);
    if (g) {
      const pkg = (g.packages||[]).find(p => p.month === lesson.packageMonth);
      if (pkg && rateDefined(pkg.instructorShareRate)) return +pkg.instructorShareRate;
      // 2b) Grup içi üye bazlı yüzdelik (tek üye varsa o üye için ayarlanan rate)
      if (g.memberInstructorRates && lesson.memberIds && lesson.memberIds.length === 1) {
        const rate = g.memberInstructorRates[lesson.memberIds[0]];
        if (rateDefined(rate)) return +rate;
      }
      // 2c) Grup default rate
      if (rateDefined(g.instructorShareRate)) return +g.instructorShareRate;
    }
  }
  if (lesson.packageOwnerType === 'member' && lesson.packageOwnerId && lesson.packageMonth) {
    const m = state.members.find(x => x.id === lesson.packageOwnerId);
    if (m) {
      const pkg = (m.packages||[]).find(p => p.month === lesson.packageMonth);
      if (pkg && rateDefined(pkg.instructorShareRate)) return +pkg.instructorShareRate;
      if (rateDefined(m.instructorShareRate)) return +m.instructorShareRate;
    }
  }
  // 3) Bireysel üye (groupId yok)
  if (!lesson.groupId && lesson.memberIds && lesson.memberIds[0]) {
    const m = state.members.find(x => x.id === lesson.memberIds[0]);
    if (m && rateDefined(m.instructorShareRate)) return +m.instructorShareRate;
  }
  // 4) Hoca kendi default rate'i
  if (lesson.instructorId) {
    const inst = state.instructors.find(i => i.id === lesson.instructorId);
    if (inst && rateDefined(inst.shareRate)) return +inst.shareRate;
  }
  // 5) Settings varsayılan
  return (+state.settings.instructorShareRate || 30);
}""",
"""function resolveInstructorRate(lesson, memberId) {
  // v177 (P3, Kerem 28.09): oran UYE BAZINDA cozulur (memberId verilirse o uyenin payi icin). Sira:
  //   ders override > grubun uye-bazli orani (memberInstructorRates — artik cok kisilik derste de) > grup orani >
  //   (grupsuz/bireysel: uyenin orani) > hoca > ayar. Paket kaydina kopyalanan oran (bayat anlik goruntu) cozumde
  //   YOK: grubun/uyenin GUNCEL orani her ay gecerlidir (eski aylar guncel kurala gore).
  if (!lesson) return (+state.settings.instructorShareRate || 30);
  // 1) Ders bazında override (en yüksek öncelik)
  if (rateDefined(lesson.instructorRateOverride)) return +lesson.instructorRateOverride; // v58: 0 override tanimsiz sayilir
  const __mid = memberId || ((lesson.memberIds && lesson.memberIds.length === 1) ? lesson.memberIds[0] : '');
  // 2) Grup paketi: uye-bazli grup orani > grup orani
  if (lesson.packageOwnerType === 'group' && lesson.packageOwnerId && lesson.packageMonth) {
    const g = state.groups.find(x => x.id === lesson.packageOwnerId);
    if (g) {
      if (__mid && g.memberInstructorRates && rateDefined(g.memberInstructorRates[__mid])) return +g.memberInstructorRates[__mid];
      if (rateDefined(g.instructorShareRate)) return +g.instructorShareRate;
    }
  }
  if (lesson.packageOwnerType === 'member' && lesson.packageOwnerId && lesson.packageMonth) {
    const m = state.members.find(x => x.id === lesson.packageOwnerId);
    if (m && rateDefined(m.instructorShareRate)) return +m.instructorShareRate;
  }
  // 3) Grupsuz ders: uyenin kendi orani (cok uyeli derste memberId ile o uye; verilmezse ilk uye)
  if (!lesson.groupId && lesson.memberIds && lesson.memberIds.length) {
    const m = state.members.find(x => x.id === (memberId || lesson.memberIds[0]));
    if (m && rateDefined(m.instructorShareRate)) return +m.instructorShareRate;
  }
  // 4) Hoca kendi default rate'i
  if (lesson.instructorId) {
    const inst = state.instructors.find(i => i.id === lesson.instructorId);
    if (inst && rateDefined(inst.shareRate)) return +inst.shareRate;
  }
  // 5) Settings varsayılan
  return (+state.settings.instructorShareRate || 30);
}""")

# perLessonPriceForLesson: uye paylarini toplayici (hakedis uye bazli oranla carpar)
rep("""function perLessonPriceForLesson(l) {
  if (!l) return 0;""",
"""function perLessonPriceForLesson(l, __coll) {
  // v177 (P3): __coll verilirse uye paylari [{mid, share}] toplanir; toplam uye paylarindan geldiyse __coll.perMember = true
  if (!l) return 0;""")
rep("""        (l.memberIds || []).forEach(mid => {
          if (__roster.has(mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth, g.id); __n++; }
          else if (__partial171[mid]) { const __p = __partial171[mid]; __sum += (+__p.sessions > 0 ? (+__p.price || 0) / +__p.sessions : memberPerLessonPrice(mid, l.packageMonth, g.id)); __n++; }
          else if (__happened176 && __groupEverHad176(g, mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth, g.id); __n++; } // v176 (F28): katilmis, sonradan ayrilmis/pasif GRUP uyesi (baska grubun sizan uyesi DEGIL — v49)
        });
        if (__n > 0 && __sum > 0) return __sum;""",
"""        (l.memberIds || []).forEach(mid => {
          let __sh = null;
          if (__roster.has(mid)) { __sh = memberPerLessonPrice(mid, l.packageMonth, g.id); }
          else if (__partial171[mid]) { const __p = __partial171[mid]; __sh = (+__p.sessions > 0 ? (+__p.price || 0) / +__p.sessions : memberPerLessonPrice(mid, l.packageMonth, g.id)); }
          else if (__happened176 && __groupEverHad176(g, mid)) { __sh = memberPerLessonPrice(mid, l.packageMonth, g.id); } // v176 (F28): katilmis, sonradan ayrilmis/pasif GRUP uyesi (baska grubun sizan uyesi DEGIL — v49)
          if (__sh === null) return;
          __sum += __sh; __n++;
          if (__coll) __coll.push({ mid: mid, share: __sh }); // v177 (P3)
        });
        if (__n > 0 && __sum > 0) { if (__coll) __coll.perMember = true; return __sum; }""")
rep("""    const __pmF = l.packageMonth || String(l.date || '').slice(0, 7);
    let __sF = 0; l.memberIds.forEach(function(mid){ __sF += memberPerLessonPrice(mid, __pmF); });
    if (__sF > 0) return __sF;""",
"""    const __pmF = l.packageMonth || String(l.date || '').slice(0, 7);
    let __sF = 0; l.memberIds.forEach(function(mid){ const __shF = memberPerLessonPrice(mid, __pmF); __sF += __shF; if (__coll) __coll.push({ mid: mid, share: __shF }); });
    if (__sF > 0) { if (__coll) __coll.perMember = true; return __sF; }""")
rep("""function instructorEarningForLesson(l) {
  if (!lessonHappened(l) || !l.instructorId) return 0;
  const rate = resolveInstructorRate(l) / 100;
  return perLessonPriceForLesson(l) * rate;
}""",
"""function instructorEarningForLesson(l) {
  if (!lessonHappened(l) || !l.instructorId) return 0;
  // v177 (P3): taban uye paylarindan geliyorsa her pay KENDI oraniyla (grupta uyeye ozel oran; grupsuz derste uyenin orani)
  const __coll = [];
  const base = perLessonPriceForLesson(l, __coll);
  if (__coll.perMember && __coll.length) {
    let tot = 0; __coll.forEach(function(x){ tot += (+x.share || 0) * (resolveInstructorRate(l, x.mid) / 100); });
    return tot;
  }
  return base * (resolveInstructorRate(l) / 100);
}
// Hocalar sayfasi: dersin oran etiketi — uyeler farkli oranla odeniyorsa "karma" (efektif oran + uyeye ozel)
function __lessonRateLabel177(l) {
  try {
    const __coll = []; const base = perLessonPriceForLesson(l, __coll);
    if (__coll.perMember && __coll.length > 1) {
      const rates = __coll.map(function(x){ return resolveInstructorRate(l, x.mid); });
      const mn = Math.min.apply(null, rates), mx = Math.max.apply(null, rates);
      if (mx !== mn) { const eff = base > 0 ? Math.round(instructorEarningForLesson(l) / base * 1000) / 10 : 0; return '%' + mn + '–' + mx + ' <small title="Üyeye özel oranlar: ' + __coll.map(function(x, i){ return escapeHtml(memberName(x.mid)) + ' %' + rates[i]; }).join(', ') + '">(karma · efektif %' + eff + ')</small>'; }
    }
  } catch(e) {}
  return '%' + resolveInstructorRate(l);
}""")
rep("""          const __rt = resolveInstructorRate(l);
          const __earn = instructorEarningForLesson(l);
          return '<tr><td style="white-space:nowrap;">' + fmtShort(l.date) + ' ' + l.time + '</td><td>' + escapeHtml(__who) + '</td><td>' + (l.status==='missed'?'🔥':'✅') + '</td><td>' + money(__per) + ' ₺</td><td>%' + __rt + '</td><td><b>' + money(__earn) + ' ₺</b></td></tr>';""",
"""          const __rt = __lessonRateLabel177(l); // v177 (P3): karma oran etiketi
          const __earn = instructorEarningForLesson(l);
          return '<tr><td style="white-space:nowrap;">' + fmtShort(l.date) + ' ' + l.time + '</td><td>' + escapeHtml(__who) + '</td><td>' + (l.status==='missed'?'🔥':'✅') + '</td><td>' + money(__per) + ' ₺</td><td>' + __rt + '</td><td><b>' + money(__earn) + ' ₺</b></td></tr>';""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.09.27.99">', '<meta name="app-version" content="2026.09.28.100">')
rep("const APP_VERSION = '2026.09.27.99';", "const APP_VERSION = '2026.09.28.100';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v176-2026-09-27-99'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v177-2026-09-28-100'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
