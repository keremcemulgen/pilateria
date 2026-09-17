// PİLATERİA — ÇAPRAZ YÜZEY TUTARLILIK DENETİMİ (v172, Kerem: "ödemelerin, toplam ödemelerin, bütün ödeme ve
// derslerin birbirini sağladığından emin ol"). SALT-OKUNUR: state'e dokunmaz, save() çağırmaz; yalnız UI
// yüzeylerini çizip (Üyeler istatistikleri, Panel, Ödemeler, Raporlar, grup detayı, üye detayı) okur ve
// birbirine + motora + ham kayıtlara karşı sağlar. Dönen özet yalnız SAYI ve maskeli örnek içerir.
// Kullanım (sayfa içinde): __plAudit('2026-09') → {ay, checks, mismatchCount, sample, counts, notes}
window.__plAudit = function(ay, opts) {
  opts = opts || {};
  const M = ay || currentMonth();
  const R = { ay: M, checks: 0, mismatches: [], notes: [], counts: {} };
  const mask = s => String(s).replace(/[A-Za-z0-9_-]{6,}/g, '#');
  const bad = (code, detail) => { R.mismatches.push(code + (detail !== undefined ? ' ' + mask(detail) : '')); };
  const eq = (a, b) => Math.abs((+a || 0) - (+b || 0)) < 0.011;
  const parseTL = s => { s = String(s || '').replace(/[^\d.,-]/g, ''); if (!s) return 0; if (s.indexOf(',') !== -1) s = s.replace(/\./g, '').replace(',', '.'); else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); return +s || 0; };
  const payMonth = p => p.packageMonth || (p.date ? String(p.date).slice(0, 7) : '');
  const lesMonth = l => l.packageMonth || String(l.date || '').slice(0, 7);
  const statsOf = sel => [...document.querySelectorAll(sel)].map(e => ({ label: ((e.querySelector('.label') || {}).textContent || '').trim(), val: ((e.querySelector('.value') || {}).textContent || '').trim() }));
  const pick = (st, lbl) => { const s = st.find(x => x.label.indexOf(lbl) === 0); return s ? s.val : null; };
  const pays = (state.payments || []).filter(p => p && payMonth(p) === M);
  const sumPay = Math.round(pays.reduce((a, p) => a + (+p.amount || 0), 0) * 100) / 100;
  R.counts.payments = pays.length; R.counts.paySum = sumPay;

  // ---- 1) ÜYELER SATIRLARI ↔ MOTOR ↔ HAM KAYITLAR ----
  const rows = buildMemberRows(M);
  let expected = 0, paid = 0, pending = 0;
  rows.forEach(r => { if (r.type === 'individual' || r.isFirstInGroup) { expected += +r.totalPrice || 0; pending += +r.remaining || 0; } paid += +r.paid || 0; });
  expected = Math.round(expected * 100) / 100; paid = Math.round(paid * 100) / 100; pending = Math.round(pending * 100) / 100;
  R.counts.rows = rows.length; R.counts.expected = expected; R.counts.paid = paid; R.counts.pending = pending;
  rows.filter(r => r.type === 'group' && r.isFirstInGroup).forEach(r => {
    const g = state.groups.find(x => x.id === r.groupId); if (!g) { bad('ROW_GROUP_MISSING', r.groupId); return; }
    R.checks++; if (!eq(r.totalPrice, groupExpectedTotal(g, M))) bad('ROW_GTOTAL≠groupExpectedTotal', g.id);
    R.checks++; if (!eq(r.groupPaid, groupPaidForMonth(g, M))) bad('ROW_GPAID≠groupPaidForMonth', g.id);
    const paysG = pays.filter(p => p.groupId === g.id).reduce((a, p) => a + (+p.amount || 0), 0);
    R.checks++; if (!eq(r.groupPaid, paysG)) bad('ROW_GPAID≠Σpayments(group)', g.id);
    R.checks++; if (!eq(r.remaining, Math.max(0, (+r.totalPrice || 0) - (+r.groupPaid || 0)))) bad('ROW_GREMAIN≠max(0,total−paid)', g.id);
    R.checks++; if (!eq(r.remaining, groupBalanceForMonth(g.id, M))) bad('ROW_GREMAIN≠groupBalanceForMonth', g.id);
    const mrows = rows.filter(x => x.type === 'group' && x.groupId === g.id && x.memberId);
    mrows.forEach(x => {
      R.checks++; if (!eq(x.ownPrice, memberPriceForGroupMonth(x.memberId, g.id, M))) bad('ROW_OWNPRICE≠memberPriceForGroupMonth', x.memberId);
      R.checks++; if (!eq(x.paid, memberPaidTowardsMonth(x.memberId, g.id, M))) bad('ROW_MPAID≠memberPaidTowardsMonth', x.memberId);
    });
    const sumOwn = mrows.reduce((a, x) => a + (+x.ownPrice || 0), 0);
    if (sumOwn > 0) { R.checks++; if (!eq(sumOwn, r.totalPrice)) bad('ROW_GTOTAL≠Σownprice', g.id); }
    const sumMPaid = mrows.reduce((a, x) => a + (+x.paid || 0), 0);
    R.checks++; if (!eq(sumMPaid, r.groupPaid)) bad('ROW_GPAID≠Σmemberpaid(kadro dışı ödeme?)', g.id);
  });
  rows.filter(r => r.type === 'individual').forEach(r => {
    R.checks++; if (!eq(r.paid, memberPaidTowardsMonth(r.memberId, '', M))) bad('ROW_IPAID≠memberPaidTowardsMonth', r.memberId);
    R.checks++; if (!eq(r.remaining, Math.max(0, (+r.totalPrice || 0) - (+r.paid || 0)))) bad('ROW_IREMAIN', r.memberId);
    const defined = +memberMonthlyTotalPrice(r.memberId, M) || 0;
    if (defined > 0) { R.checks++; if (!eq(r.remaining, memberBalanceForMonth(r.memberId, M))) bad('ROW_IREMAIN≠memberBalanceForMonth', r.memberId); }
    else R.notes.push('bireysel fiyat tanımsız (satırda varsayılan) ' + mask(r.memberId));
  });

  // ---- 2) ÖDENMİŞ (Üyeler) ↔ TÜM ÖDEMELER (Panel / Ödemeler / Raporlar): yetim ödemeler ----
  R.checks++;
  const seen = new Set(rows.filter(r => r.memberId).map(r => r.memberId + '|' + (r.groupId || '')));
  const orphans = pays.filter(p => !seen.has(p.memberId + '|' + (p.groupId || '')));
  const cats = {};
  orphans.forEach(p => {
    const m = state.members.find(x => x.id === p.memberId);
    let c;
    if (!m) c = 'uye_yok';
    else if (p.groupId && !state.groups.find(x => x.id === p.groupId)) c = 'grup_yok';
    else if (!isMemberEnrolledInMonth(m.id, M)) c = 'uye_o_ay_pasif';
    else if (p.groupId && isGroupInactiveInMonth(state.groups.find(x => x.id === p.groupId), M)) c = 'grup_o_ay_pasif';
    else if (p.groupId) c = 'grup_odemesi_kadro_disi_paysiz';
    else c = 'bireysel_odeme_ama_uye_grupta';
    cats[c] = (cats[c] || 0) + 1;
  });
  R.counts.orphans = orphans.length; R.counts.orphanCats = cats;
  R.counts.orphanSum = Math.round(orphans.reduce((a, p) => a + (+p.amount || 0), 0) * 100) / 100;
  if (!eq(paid, sumPay)) bad('PAID_ROWS≠ΣPAYMENTS', JSON.stringify({ rows: paid, payments: sumPay, orphans: orphans.length, cats: cats }));

  // ---- 3) UI YÜZEYLERİ: Üyeler istatistikleri, Panel geliri, Ödemeler toplamı, Raporlar ----
  try {
    const sel = document.getElementById('member-month'); const prev = sel ? sel.value : null;
    if (sel) { if (![...sel.options].some(o => o.value === M)) sel.insertAdjacentHTML('beforeend', '<option value="' + M + '">' + M + '</option>'); sel.value = M; }
    const q = document.getElementById('member-search'); const pq = q ? q.value : ''; if (q) q.value = '';
    const f = document.getElementById('member-filter'); const pf = f ? f.value : ''; if (f) f.value = 'all';
    renderMembers();
    const st = statsOf('#members-stats .stat');
    R.checks++; if (!eq(parseTL(pick(st, 'Beklenen')), expected)) bad('UI_MEMBERS_EXPECTED', pick(st, 'Beklenen') + '≠' + expected);
    R.checks++; if (!eq(parseTL(pick(st, 'Ödenmiş')), paid)) bad('UI_MEMBERS_PAID', pick(st, 'Ödenmiş') + '≠' + paid);
    R.checks++; if (!eq(parseTL(pick(st, 'Ödenecek')), pending)) bad('UI_MEMBERS_PENDING', pick(st, 'Ödenecek') + '≠' + pending);
    if (q) q.value = pq; if (f) f.value = pf; if (sel && prev !== null) sel.value = prev;
  } catch (e) { bad('UI_MEMBERS_ERR', e.message); }
  try {
    const dm = document.getElementById('dash-month'); const prevD = dm ? dm.value : null; const prevSet = window.__dashMonthUserSet;
    if (dm) { dm.value = M; window.__dashMonthUserSet = true; }
    renderDashboard();
    const rev = parseTL(document.getElementById('s-revenue').textContent);
    R.checks++; if (!eq(rev, sumPay)) bad('UI_DASH_REVENUE≠Σpayments', rev + '≠' + sumPay);
    if (dm && prevD !== null) { dm.value = prevD; window.__dashMonthUserSet = prevSet; }
  } catch (e) { bad('UI_DASH_ERR', e.message); }
  try {
    const pm = document.getElementById('pay-month'); const prevP = pm ? pm.value : null; const mf = document.getElementById('pay-member-filter'); const prevF = mf ? mf.value : '';
    if (pm) pm.value = M; if (mf) mf.value = '';
    renderPayments();
    const ps = statsOf('#pay-summary .stat');
    R.checks++; if (!eq(parseTL(pick(ps, 'Toplam Tutar')), sumPay)) bad('UI_PAYMENTS_TOTAL≠Σpayments', pick(ps, 'Toplam Tutar'));
    R.checks++; if (+pick(ps, 'Ödeme Sayısı') !== pays.length) bad('UI_PAYMENTS_COUNT', pick(ps, 'Ödeme Sayısı'));
    if (pm && prevP !== null) pm.value = prevP; if (mf) mf.value = prevF;
  } catch (e) { bad('UI_PAYMENTS_ERR', e.message); }
  try {
    const rm = document.getElementById('rep-month'); const prevR = rm ? rm.value : null;
    if (rm) rm.value = M;
    renderReports();
    const rs = statsOf('#report-content .stat');
    R.checks++; if (!eq(parseTL(pick(rs, 'Gelir')), sumPay)) bad('UI_REPORT_REVENUE≠Σpayments', pick(rs, 'Gelir'));
    R.checks++; if (+pick(rs, 'Ödeme Sayısı') !== pays.length) bad('UI_REPORT_PAYCOUNT', pick(rs, 'Ödeme Sayısı'));
    const lesByDate = (state.lessons || []).filter(l => l && l.date && l.date.startsWith(M)).length;
    R.checks++; if (+pick(rs, 'Toplam Ders') !== lesByDate) bad('UI_REPORT_LESSONS(by date)', pick(rs, 'Toplam Ders'));
    (state.instructors || []).forEach(inst => {
      const e1 = instructorEarningsForMonth(inst.id, M).total;
      const b = instructorEarningsByGroupSize(inst.id, M); const e2 = b[1] + b[2] + b[3] + b[4] + b[5];
      R.checks++; if (!eq(e1, e2)) bad('INSTR_EARN_MISMATCH', inst.id);
      const e3 = (state.lessons || []).filter(l => l.instructorId === inst.id && lessonHappened(l) && (l.date || '').startsWith(M)).reduce((a, l) => a + instructorEarningForLesson(l), 0);
      R.checks++; if (!eq(e1, e3)) bad('INSTR_EARN≠Σlesson', inst.id);
      const cell = [...document.querySelectorAll('#instructor-perf tbody tr')].find(tr => tr.textContent.indexOf(inst.name) !== -1);
      if (cell) { const tds = cell.querySelectorAll('td'); const last = tds[tds.length - 1]; R.checks++; if (!eq(parseTL(last.textContent), e1)) bad('UI_REPORT_INSTR_EARN', inst.id); }
    });
    if (rm && prevR !== null) rm.value = prevR;
  } catch (e) { bad('UI_REPORT_ERR', e.message); }
  try {
    const sm = document.getElementById('sal-month'); const prevS = sm ? sm.value : null;
    if (sm && typeof renderSalaries === 'function') {
      sm.value = M; renderSalaries();
      (state.instructors || []).forEach(inst => {
        const e1 = instructorEarningsForMonth(inst.id, M).total;
        const row = [...document.querySelectorAll('#salaries-content tr')].find(tr => tr.textContent.indexOf(inst.name) !== -1);
        if (row && e1 > 0) { R.checks++; if (!/₺/.test(row.textContent) || ![...row.querySelectorAll('td')].some(td => eq(parseTL(td.textContent), e1))) bad('UI_SALARY_EARN', inst.id); }
      });
      if (prevS !== null) sm.value = prevS;
    }
  } catch (e) { bad('UI_SALARY_ERR', e.message); }

  // ---- 4) GRUP DETAYI ----
  const activeGroups = state.groups.filter(g => g && !isGroupInactiveInMonth(g, M) && (activeGroupRosterForMonth(g, M).length || __partialsOf(g, M).length));
  R.counts.groups = activeGroups.length;
  activeGroups.forEach(g => {
    try {
      openGroupDetail(g.id, M);
      const gs = statsOf('#gd-content .grid-stats .stat');
      R.checks++; if (!eq(parseTL(pick(gs, 'Grup Toplam')), groupExpectedTotal(g, M))) bad('GD_TOTAL≠groupExpectedTotal', g.id);
      R.checks++; if (!eq(parseTL(pick(gs, 'Toplanan')), groupPaidForMonth(g, M))) bad('GD_PAID≠groupPaidForMonth', g.id);
      R.checks++; if (+pick(gs, 'Kalan Ders') !== sessionsRemainingFor('group', g.id, M)) bad('GD_REMAIN_LESSONS', g.id);
      const gl = (state.lessons || []).filter(l => l && l.groupId === g.id && lesMonth(l) === M);
      R.checks++; if (+pick(gs, 'Toplam Ders') !== gl.length) bad('GD_LESSON_COUNT', g.id);
      const roster = activeGroupRosterForMonth(g, M);
      const trs = [...document.querySelectorAll('#gd-content table tbody tr')];
      roster.forEach(mid => {
        const nm = memberName(mid);
        const tr = trs.find(x => x.textContent.indexOf(nm) !== -1);
        if (!tr) { bad('GD_MEMBER_ROW_MISSING', mid); return; }
        const tds = [...tr.querySelectorAll('td')];
        const priceTd = tds.find(td => /₺/.test(td.textContent));
        const want = memberPriceForGroupMonth(mid, g.id, M);
        R.checks++; if (want > 0 && (!priceTd || !eq(parseTL(priceTd.textContent.split('₺')[0]), want))) bad('GD_MEMBER_PRICE', mid);
      });
      __partialsOf(g, M).forEach(p => {
        const nm = memberName(p.memberId);
        const tr = trs.find(x => x.textContent.indexOf(nm) !== -1 && x.textContent.indexOf('ayrıldı') !== -1);
        R.checks++; if (!tr) bad('GD_PARTIAL_ROW_MISSING', p.memberId);
      });
    } catch (e) { bad('GD_ERR', g.id + ' ' + e.message); }
  });
  try { closeModal('modal-group-detail'); } catch (e) {}

  // ---- 5) ÜYE DETAYI + bakiye yeniden hesap ----
  const activeMembers = state.members.filter(m => m && isMemberEnrolledInMonth(m.id, M));
  R.counts.members = activeMembers.length;
  activeMembers.forEach(m => {
    try {
      const bal = memberBalanceForMonth(m.id, M);
      const g = memberActiveGroupForMonth(m.id, M);
      const own = g ? memberPriceForGroupMonth(m.id, g.id, M) : (+memberMonthlyTotalPrice(m.id, M) || 0);
      const pd = memberPaidTowardsMonth(m.id, g ? g.id : '', M);
      const recomputed = (own > 0 ? Math.max(0, Math.round((own - pd) * 100) / 100) : 0) + memberPartialDebtForMonth(m.id, M);
      R.checks++; if (!eq(bal, recomputed)) bad('MBAL≠recomputed', m.id);
      if (opts.detail !== false) {
        openMemberDetail(m.id, M);
        const txt = (document.getElementById('md-content') || document.body).textContent;
        const mm = txt.match(/Kalan Ders \([^)]+\)\s*(\d+)/);
        R.checks++; if (!mm || +mm[1] !== memberRemainingForMonth(m.id, M)) bad('MD_REMAIN_LESSONS', m.id);
        const km = txt.match(/Kalan ([\d.,]+) ₺ — taksit devam/);
        R.checks++; if (bal > 0) { if (!km || !eq(parseTL(km[1]), bal)) bad('MD_BALANCE_TEXT', m.id); } else if (km) bad('MD_BALANCE_TEXT_UNEXPECTED', m.id);
        const pm2 = txt.match(/Ödeme \([^)]+\) ₺\s*([\d.,-]+)/);
        const paidAll = pays.filter(p => p.memberId === m.id).reduce((a, p) => a + (+p.amount || 0), 0);
        R.checks++; if (!pm2 || !eq(parseTL(pm2[1]), paidAll)) bad('MD_PAID_TEXT', m.id);
      }
    } catch (e) { bad('MD_ERR', m.id + ' ' + e.message); }
  });
  try { closeModal('modal-member-detail'); } catch (e) {}

  // ---- 6) VADESİ GEÇENLER ----
  try {
    const ov = getOverduePayments();
    ov.forEach(o => {
      (o.monthsDetail || []).filter(d => d.ay === M).forEach(d => {
        if (o.groupId) { const g = state.groups.find(x => x.id === o.groupId); R.checks++; if (!g || !eq(d.expected, groupExpectedTotal(g, M)) || !eq(d.paid, groupPaidForMonth(g, M))) bad('OVERDUE_GROUP', o.groupId); }
        else { R.checks++; const exp = memberActiveGroupForMonth(o.memberId, M) ? 0 : (+memberMonthlyTotalPrice(o.memberId, M) || 0); if (!eq(d.expected, exp) || !eq(d.paid, memberPaidTowardsMonth(o.memberId, '', M))) bad('OVERDUE_MEMBER', o.memberId); }
        R.checks++; if (!eq(d.missing, Math.max(0, d.expected - d.paid))) bad('OVERDUE_MISSING', o.groupId || o.memberId);
      });
    });
    R.counts.overdueUnits = ov.length;
  } catch (e) { bad('OVERDUE_ERR', e.message); }

  // ---- 7) DERSLER: sahiplik, hak/kullanılan/kalan, üye kalanı = grubun kalanı ----
  const les = (state.lessons || []).filter(l => l && lesMonth(l) === M);
  R.counts.lessons = les.length;
  les.forEach(l => {
    if (l.groupId && !state.groups.find(x => x.id === l.groupId)) bad('LESSON_GROUP_MISSING', l.id);
    (l.memberIds || []).forEach(mid => { if (!state.members.find(x => x.id === mid)) bad('LESSON_MEMBER_MISSING', l.id); });
  });
  activeGroups.forEach(g => {
    const q = sessionQuotaFor('group', g.id, M), used = sessionsUsedFor('group', g.id, M), rem = sessionsRemainingFor('group', g.id, M);
    R.checks++; if (!(__pkgClosedEarlyLesson('group', g.id, M) ? rem === 0 : rem === Math.max(0, q - used))) bad('GROUP_REMAIN_FORMULA', g.id);
    activeGroupRosterForMonth(g, M).forEach(mid => { R.checks++; if (memberRemainingForMonth(mid, M) !== rem) bad('MEMBER_REMAIN≠GROUP_REMAIN', mid); });
  });
  activeMembers.filter(m => !memberActiveGroupForMonth(m.id, M)).forEach(m => {
    const q = sessionQuotaFor('member', m.id, M), used = sessionsUsedFor('member', m.id, M), rem = sessionsRemainingFor('member', m.id, M);
    R.checks++; if (!(__pkgClosedEarlyLesson('member', m.id, M) ? rem === 0 : rem === Math.max(0, q - used))) bad('MEMBER_REMAIN_FORMULA', m.id);
  });

  // ---- 8) ÖDEME KAYITLARI: bütünlük + (bilgi) kaydın ders sayısı ↔ üyenin hakkı (v172 tek kaynak) ----
  let sessDiff = 0, sessChecked = 0;
  pays.forEach(p => {
    if (!state.members.find(x => x.id === p.memberId)) bad('PAY_MEMBER_MISSING', p.id);
    if (p.groupId && !state.groups.find(x => x.id === p.groupId)) bad('PAY_GROUP_MISSING', p.id);
    if (!(+p.amount === +p.amount)) bad('PAY_AMOUNT_NAN', p.id);
    if (typeof memberEffectiveQuota === 'function' && !p.refund && +p.amount >= 0 && state.members.find(x => x.id === p.memberId)) {
      try { sessChecked++; if (+p.sessions !== +memberEffectiveQuota(p.memberId, M, p.groupId || '')) sessDiff++; } catch (e) {}
    }
  });
  R.counts.paySessionsChecked = sessChecked; R.counts.paySessionsDiff = sessDiff; // bilgi: eski kayıtlar (v172 öncesi) farklı olabilir

  R.mismatchCount = R.mismatches.length;
  R.sample = R.mismatches.slice(0, 15);
  delete R.mismatches;
  return R;
};
