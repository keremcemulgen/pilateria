#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# PILATERIA v119 — PARASAL BAKIYE KANONU (Kerem 27 Tem)
#
# KOK KUSUR: memberRemaining() DERS ADEDI dondurur (dashboard'da "{n} ders"), groupRemaining() ise TL.
# "Bugunun Mesajlari" paneli ikisini de ayni `remaining` alanina koyup `money(x) + ' ₺'` ile basiyordu:
#   • parasini ODEMIS ama 8 dersi kalan uye  -> "8 ₺ odeme bakiyeniz bulunmakta"
#   • dersi bitmis ama HIC ODEMEMIS uye      -> yesil "Tam"
# Yani hem MEBLAG hem KISI SECIMI yanlisti. Ayrica:
#   • getOverduePayments() ILK dersin ayina kilitliydi -> ilk ay odenince sonraki aylar HIC denetlenmiyordu
#   • fillWaTemplate ' ₺' ekliyordu, sablonda da ₺ varsa "1.000 ₺ ₺" cikiyordu
#
# YENI KANON: para = *BalanceForMonth (TL) · ders = *RemainingForMonth (adet). Ikisi ASLA karismaz.
import io, sys, re

SRC = 'pilateria.html'
OLD_VER, NEW_VER = '2026.07.27.41', '2026.07.27.42'

with io.open(SRC, encoding='utf-8') as f:
    s = f.read()
orig_len = len(s)

def rep(old, new, n=1, tag=''):
    global s
    c = s.count(old)
    assert c == n, 'ANCHOR "%s": beklenen %d, bulunan %d' % (tag, n, c)
    s = s.replace(old, new)
    print('  OK  %s' % tag)

# ─────────────────────────────────────────────────────────────────────────────
# [1] YENI PARASAL KANON — groupRemaining bloku yerine tam kanon seti
# ─────────────────────────────────────────────────────────────────────────────
rep("""// Grubun kalan ödemesi (tüm üyelerin borç toplamı)
// Yeni davranış: expected = sadece üyelerin tanımlı totalPrice'larının toplamı (slot fallback yok)
function groupRemaining(groupId) {
  const g = state.groups.find(x => x.id === groupId);
  if (!g) return 0;
  const ay = currentMonth();
  return Math.max(0, groupExpectedTotal(g, ay) - groupPaidForMonth(g, ay));
}""",
"""// ───────── v119 PARASAL BAKIYE KANONU (Kerem 27 Tem) ─────────
// KOK KUSUR: memberRemaining() DERS ADEDI dondurur, groupRemaining() ise TL. "Bugunun Mesajlari"
// paneli ikisini de ayni kutuya koyup `money(x) + ' ₺'` ile basiyordu -> parasini odemis uyeye
// "8 ₺ bakiyeniz var", hic odememis uyeye yesil "Tam". Hem MEBLAG hem KISI yanlisti.
// KANON: PARA = *BalanceForMonth (TL) · DERS = *RemainingForMonth (adet). Ikisi ASLA karismaz.
// Uyenin o ayki AKTIF grubu (yoksa null) — taksit kanonu icin groupId gerekir.
function memberActiveGroupForMonth(memberId, monthISO) {
  const ay = monthISO || currentMonth();
  return state.groups.find(gr => !isGroupInactiveInMonth(gr, ay) &&
    (typeof __activeRosterForMonth === 'function' ? __activeRosterForMonth(gr, ay) : resolveGroupMembersForMonth(gr, ay)).includes(memberId)) || null;
}
// Uyenin o ayki KALAN ODEMESI (TL). v110 taksit kanonu: kalan = max(0, tanimli fiyat − o aya odenen).
// Fiyat tanimli degilse (<=0) BORC UYDURULMAZ -> 0.
function memberBalanceForMonth(memberId, monthISO) {
  const ay = monthISO || currentMonth();
  const defined = +memberMonthlyTotalPrice(memberId, ay) || 0;
  if (defined <= 0) return 0;
  const g = memberActiveGroupForMonth(memberId, ay);
  const paid = memberPaidTowardsMonth(memberId, g ? g.id : '', ay);
  return Math.max(0, Math.round((defined - paid) * 100) / 100);
}
// Grubun o ayki KALAN ODEMESI (TL) — o ayin kadro fiyat toplami − o aya odenen.
function groupBalanceForMonth(groupId, monthISO) {
  const g = state.groups.find(x => x.id === groupId);
  if (!g) return 0;
  const ay = monthISO || currentMonth();
  if (isGroupInactiveInMonth(g, ay)) return 0;
  const expected = +groupExpectedTotal(g, ay) || 0;
  if (expected <= 0) return 0;
  const paid = +groupPaidForMonth(g, ay) || 0;
  return Math.max(0, Math.round((expected - paid) * 100) / 100);
}
// Geriye donuk ad (HER ZAMAN TL dondururdu) — artik kanona delege eder.
function groupRemaining(groupId) { return groupBalanceForMonth(groupId, currentMonth()); }""",
1, '[1] parasal kanon (memberActiveGroupForMonth/memberBalanceForMonth/groupBalanceForMonth)')

# ─────────────────────────────────────────────────────────────────────────────
# [2] memberRemaining — ADET oldugu ARTIK yazili (ileride tekrar karistirilmasin)
# ─────────────────────────────────────────────────────────────────────────────
rep("""function memberRemaining(memberId) {
  // v43: ODEMEDEN BAGIMSIZ kanona baglandi (8 default, grup=tek birim). Geriye donuk imza korunur.
  return memberRemainingForMonth(memberId, currentMonth());
}""",
"""function memberRemaining(memberId) {
  // v43: ODEMEDEN BAGIMSIZ kanona baglandi (8 default, grup=tek birim). Geriye donuk imza korunur.
  // ⚠️ v119 UYARI: BU DEGER DERS ADEDIDIR (adet), PARA DEGILDIR. Dashboard'da "{n} ders" olarak
  // gosterilir. ₺ basilacak her yerde memberBalanceForMonth() kullan — v118'e kadarki panel hatasi
  // tam olarak bu ikisinin karistirilmasiydi.
  return memberRemainingForMonth(memberId, currentMonth());
}""", 1, '[2] memberRemaining ADET uyarisi')

# ─────────────────────────────────────────────────────────────────────────────
# [3] fillWaTemplate — ₺ TEK KEZ (sablonda ₺ olsa da olmasa da)
# ─────────────────────────────────────────────────────────────────────────────
rep("""function fillWaTemplate(text, ctx) {
  ctx = ctx || {};
  return (text || '')
    .replace(/\\{ad\\}/g, ctx.ad || '')
    .replace(/\\{paket\\}/g, ctx.paket || '')
    .replace(/\\{kalan\\}/g, ctx.kalan !== undefined ? (money(ctx.kalan) + ' ₺') : '')
    .replace(/\\{tarih\\}/g, ctx.tarih ? fmtDate(ctx.tarih) : '')
    .replace(/\\{saat\\}/g, ctx.saat || '')
    .replace(/\\{fiyat\\}/g, ctx.fiyat !== undefined ? (money(ctx.fiyat) + ' ₺') : '');
}""",
"""// v119: ₺ TEK KEZ yazilir. Kayitli sablonlarin bir kismi "{kalan} ₺" (₺ sablonda), bir kismi
// "{kalan}" yaziyor; fonksiyon her durumda ' ₺' ekledigi icin ilkinde "1.000 ₺ ₺" cikiyordu.
function fillWaTemplate(text, ctx) {
  ctx = ctx || {};
  const tlKalan = ctx.kalan !== undefined ? (money(ctx.kalan) + ' ₺') : '';
  const tlFiyat = ctx.fiyat !== undefined ? (money(ctx.fiyat) + ' ₺') : '';
  return (text || '')
    .replace(/\\{ad\\}/g, ctx.ad || '')
    .replace(/\\{paket\\}/g, ctx.paket || '')
    .replace(/\\{kalan\\}[ \\u00A0]*₺/g, () => tlKalan)
    .replace(/\\{kalan\\}/g, () => tlKalan)
    .replace(/\\{tarih\\}/g, ctx.tarih ? fmtDate(ctx.tarih) : '')
    .replace(/\\{saat\\}/g, ctx.saat || '')
    .replace(/\\{fiyat\\}[ \\u00A0]*₺/g, () => tlFiyat)
    .replace(/\\{fiyat\\}/g, () => tlFiyat);
}""", 1, '[3] fillWaTemplate cift ₺ kapatildi')

# ─────────────────────────────────────────────────────────────────────────────
# [4] openWhatsAppModal — {kalan} = TL bakiye, {fiyat} = O AYIN fiyati
# ─────────────────────────────────────────────────────────────────────────────
rep("""  const rem = memberRemaining(memberId);
  const memberPays = state.payments.filter(p => p.memberId === memberId).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const lastPay = memberPays[memberPays.length-1];
  const pkgName = lastPay ? lastPay.pkgName : (state.packageTypes[0]||{}).name || '';
  const price = lastPay ? lastPay.amount : (state.packageTypes[0]||{}).price || 0;""",
"""  // v119: {kalan} = PARA BAKIYESI (TL). Eskiden memberRemaining() (DERS ADEDI) yaziliyordu ->
  // parasini odemis uyeye "8 ₺ bakiyeniz var" mesaji hazirlaniyordu.
  const __waAy = currentMonth();
  const rem = memberBalanceForMonth(memberId, __waAy);
  const memberPays = state.payments.filter(p => p.memberId === memberId).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const lastPay = memberPays[memberPays.length-1];
  const pkgName = lastPay ? lastPay.pkgName : (state.packageTypes[0]||{}).name || '';
  // v119: {fiyat} = uyenin O AYKI TANIMLI fiyati (son odemenin tutari DEGIL)
  const price = (+memberMonthlyTotalPrice(memberId, __waAy) || 0) ||
                (lastPay ? (+lastPay.amount || 0) : ((state.packageTypes[0]||{}).price || 0));""",
1, '[4] openWhatsAppModal TL bakiye + ay fiyati')

# ─────────────────────────────────────────────────────────────────────────────
# [5] getTodayMessageTargets — `balance` (TL) alani; `remaining` de artik TL
# ─────────────────────────────────────────────────────────────────────────────
rep("""function getTodayMessageTargets() {
  const today = todayISO();""",
"""function getTodayMessageTargets() {
  const today = todayISO();
  const ay = today.slice(0,7); // v119: bakiye ayi = BUGUNUN ayi""",
1, '[5a] getTodayMessageTargets ay')

rep("""      groups.push({
        group: g,
        lesson: l,
        time: l.time,
        remaining: groupRemaining(g.id),
      });""",
"""      const gBal = groupBalanceForMonth(g.id, ay);
      groups.push({
        group: g,
        lesson: l,
        time: l.time,
        // v119: PARA (TL). Eski `remaining` adi geriye donuk uyum icin AYNI TL degeri tasir.
        balance: gBal,
        remaining: gBal,
      });""", 1, '[5b] grup hedefi balance (TL)')

rep("""        individuals.push({
          member: m,
          lesson: l,
          time: l.time,
          remaining: memberRemaining(mid),
        });""",
"""        const mBal = memberBalanceForMonth(mid, ay);
        individuals.push({
          member: m,
          lesson: l,
          time: l.time,
          // v119: PARA (TL). Eskiden memberRemaining() = DERS ADEDI idi ve panelde ₺ basiliyordu.
          balance: mBal,
          remaining: mBal,
        });""", 1, '[5c] bireysel hedef balance (TL)')

# ─────────────────────────────────────────────────────────────────────────────
# [6] renderTodayMessages — iki dal da `balance` okur
# ─────────────────────────────────────────────────────────────────────────────
rep("""  const grpRows = groups.map(({ group, time, remaining }) => {
    const hasOverdue = remaining > 0;""",
"""  const grpRows = groups.map(({ group, time, balance }) => {
    const hasOverdue = balance > 0; // v119: TL bakiye""", 1, '[6a] grup dali balance')

rep("""      ad: group.name,
      saat: time,
      tarih: todayISO(),
      kalan: remaining,""",
"""      ad: group.name,
      saat: time,
      tarih: todayISO(),
      kalan: balance,""", 1, '[6b] grup ctx kalan=balance')

rep("""  const indRows = individuals.map(({ member, time, remaining }) => {
    const hasOverdue = remaining > 0;""",
"""  const indRows = individuals.map(({ member, time, balance }) => {
    const hasOverdue = balance > 0; // v119: TL bakiye""", 1, '[6c] bireysel dal balance')

rep("""      ad: firstName,
      saat: time,
      tarih: todayISO(),
      kalan: remaining,""",
"""      ad: firstName,
      saat: time,
      tarih: todayISO(),
      kalan: balance,""", 1, '[6d] bireysel ctx kalan=balance')

rep("""      <td>${hasOverdue ? `<span style="color:var(--bad)">${money(remaining)} ₺</span>` : '<span class="badge ok">Tam</span>'}</td>""",
"""      <td>${hasOverdue ? `<span style="color:var(--bad)">${money(balance)} ₺</span>` : '<span class="badge ok">Tam</span>'}</td>""",
2, '[6e] Odeme sutunu money(balance) — 2 dal')

# ─────────────────────────────────────────────────────────────────────────────
# [7] openWaBulkModal — TL bakiye
# ─────────────────────────────────────────────────────────────────────────────
rep("""    const rem = memberRemaining(id);""",
"""    const rem = memberBalanceForMonth(id, currentMonth()); // v119: TL bakiye (DERS ADEDI degil)""",
1, '[7] openWaBulkModal TL bakiye')

# ─────────────────────────────────────────────────────────────────────────────
# [8] getOverduePayments — TUM aylari tarar (ILK AYA kilitlenme kusuru)
# ─────────────────────────────────────────────────────────────────────────────
rep("""function getOverduePayments() {
  const today = todayISO();
  const out = [];
  // group-level: each group with at least one lesson done
  state.groups.forEach(g => {
    const gLessons = state.lessons.filter(l => l.groupId === g.id && l.status !== 'cancelled')
      .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    if (!gLessons.length) return;
    const first = gLessons[0];
    // skip if first lesson not yet happened
    if (first.date >= today) return;
    // KANONİK: grup beklenen/ödenen (ilk dersin paket ayına göre)
    const ovMonth = (first.date||'').slice(0,7) || currentMonth();
    const expected = groupExpectedTotal(g, ovMonth);
    const paid = groupPaidForMonth(g, ovMonth);
    if (Math.max(0, expected - paid) <= 0) return;
    const daysOverdue = Math.floor((parseISO(today) - parseISO(first.date)) / (1000*60*60*24));
    out.push({
      label: g.name,
      groupId: g.id,
      memberId: (g.memberIds||[])[0] || '',
      firstLessonDate: first.date,
      expected, paid,
      missing: Math.max(0, expected - paid),
      daysOverdue
    });
  });
  // individual members (no group): find members with at least one lesson done who have unpaid
  state.members.forEach(m => {
    const activeGroupFor = state.groups.find(g => (g.memberIds||[]).includes(m.id));
    if (activeGroupFor) return; // handled above
    const mLessons = state.lessons.filter(l => l.memberIds.includes(m.id) && !l.groupId && l.status !== 'cancelled')
      .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    if (!mLessons.length) return;
    const first = mLessons[0];
    if (first.date >= today) return;
    const ovMonthM = (first.date||'').slice(0,7) || currentMonth();
    const expected = memberMonthlyTotalPrice(m.id, ovMonthM) || (m.totalPrice ? +m.totalPrice : 0);
    const paid = memberPaidForMonth(m.id, ovMonthM);
    if (Math.max(0, expected - paid) <= 0) return;
    const daysOverdue = Math.floor((parseISO(today) - parseISO(first.date)) / (1000*60*60*24));
    out.push({
      label: m.name,
      groupId: '',
      memberId: m.id,
      firstLessonDate: first.date,
      expected, paid,
      missing: Math.max(0, expected - paid),
      daysOverdue
    });
  });
  return out.sort((a,b)=>b.daysOverdue - a.daysOverdue);
}""",
"""// v119 (Kerem 27 Tem): GECIKEN ODEMELER ARTIK HER AYI AYRI DENETLER.
// ESKI KUSUR: ovMonth = owner'in EN ILK dersinin ayi idi. O ay odendiginde owner SONSUZA KADAR
// "borcu yok" gorunurdu — sonraki aylarin borcu HIC denetlenmiyordu (panelin yanlis uyari vermesinin
// ikinci sebebi). YENI KANON: dersi olan HER ay ayri bakilir; VADESI GELMIS (o ayin ilk dersi
// bugunden ONCE) ve expected > paid olan aylar owner bazinda TOPLANIR. Alan sozlesmesi korunur
// (label, groupId, memberId, firstLessonDate, expected, paid, missing, daysOverdue) + months/monthsDetail eklenir.
function __plLessonMonth(l) { return (l && (l.packageMonth || String(l.date || '').slice(0, 7))) || ''; }
function getOverduePayments() {
  const today = todayISO();
  const out = [];
  // Derslerin AYLARI -> {ay: o ayin EN ERKEN ders tarihi}
  function __ovMonths(lessons) {
    const map = {};
    lessons.forEach(l => {
      const ay = __plLessonMonth(l);
      if (!ay || !l.date) return;
      if (!map[ay] || l.date < map[ay]) map[ay] = l.date;
    });
    return map;
  }
  // Vadesi gelmis + borclu aylari sec (fiyat tanimsizsa BORC UYDURULMAZ)
  function __ovRows(map, expectedFn, paidFn) {
    const rows = [];
    Object.keys(map).sort().forEach(ay => {
      const firstDate = map[ay];
      if (firstDate >= today) return;                 // vadesi gelmemis ay
      const expected = +expectedFn(ay) || 0;
      if (expected <= 0) return;                       // fiyat yok -> borc yok
      const paid = +paidFn(ay) || 0;
      const missing = Math.max(0, Math.round((expected - paid) * 100) / 100);
      if (missing <= 0) return;
      rows.push({ ay, firstDate, expected, paid, missing });
    });
    return rows;
  }
  function __ovPush(base, rows) {
    if (!rows.length) return;
    const firstLessonDate = rows[0].firstDate;
    const daysOverdue = Math.floor((parseISO(today) - parseISO(firstLessonDate)) / (1000*60*60*24));
    out.push(Object.assign({}, base, {
      firstLessonDate,
      expected: Math.round(rows.reduce((a,r)=>a+r.expected, 0) * 100) / 100,
      paid:     Math.round(rows.reduce((a,r)=>a+r.paid, 0) * 100) / 100,
      missing:  Math.round(rows.reduce((a,r)=>a+r.missing, 0) * 100) / 100,
      daysOverdue,
      months: rows.map(r => r.ay),
      monthsDetail: rows
    }));
  }
  // GRUPLAR — o ay pasifse borc yok
  state.groups.forEach(g => {
    const gLessons = state.lessons.filter(l => l.groupId === g.id && l.status !== 'cancelled');
    if (!gLessons.length) return;
    const rows = __ovRows(__ovMonths(gLessons),
      ay => (isGroupInactiveInMonth(g, ay) ? 0 : groupExpectedTotal(g, ay)),
      ay => groupPaidForMonth(g, ay));
    if (!rows.length) return;
    const firstAy = rows[0].ay;
    const roster = (typeof __activeRosterForMonth === 'function') ? __activeRosterForMonth(g, firstAy) : [];
    __ovPush({
      label: (typeof groupDisplayName === 'function') ? groupDisplayName(g, firstAy) : g.name,
      groupId: g.id,
      memberId: roster[0] || (g.memberIds||[])[0] || ''
    }, rows);
  });
  // BIREYSEL — uye O AY aktif bir gruba bagliysa o ay GRUP satiri kapsar
  state.members.forEach(m => {
    const mLessons = state.lessons.filter(l => l && !l.groupId && l.status !== 'cancelled' && (l.memberIds||[]).includes(m.id));
    if (!mLessons.length) return;
    const rows = __ovRows(__ovMonths(mLessons),
      ay => (memberActiveGroupForMonth(m.id, ay) ? 0 : ((+memberMonthlyTotalPrice(m.id, ay) || 0) || (m.totalPrice ? +m.totalPrice : 0))),
      ay => memberPaidForMonth(m.id, ay));
    __ovPush({ label: m.name, groupId: '', memberId: m.id }, rows);
  });
  return out.sort((a,b)=>b.daysOverdue - a.daysOverdue);
}""", 1, '[8] getOverduePayments TUM aylar')

# ─────────────────────────────────────────────────────────────────────────────
# [9] Geciken odemeler kartinda hangi aylar oldugu gorunsun (Kerem: "dogru uyari versin")
# ─────────────────────────────────────────────────────────────────────────────
rep("""        <td>${fmtDate(o.firstLessonDate)} <small style="color:var(--muted)">(${o.daysOverdue} gün geçti)</small></td>""",
"""        <td>${fmtDate(o.firstLessonDate)} <small style="color:var(--muted)">(${o.daysOverdue} gün geçti)</small>${(o.months&&o.months.length)?`<br><small style="color:var(--p2)">📅 ${o.months.join(', ')}</small>`:''}</td>""",
1, '[9] geciken kartinda borclu AYLAR')

# ─────────────────────────────────────────────────────────────────────────────
# [10] SURUM
# ─────────────────────────────────────────────────────────────────────────────
rep('<meta name="app-version" content="%s">' % OLD_VER,
    '<meta name="app-version" content="%s">' % NEW_VER, 1, '[10a] meta app-version')
rep("const APP_VERSION = '%s';" % OLD_VER,
    "const APP_VERSION = '%s';" % NEW_VER, 1, '[10b] const APP_VERSION')

with io.open(SRC, 'w', encoding='utf-8') as f:
    f.write(s)
print('\nYAZILDI: %s  (%d -> %d bayt, %+d)' % (SRC, orig_len, len(s), len(s)-orig_len))
