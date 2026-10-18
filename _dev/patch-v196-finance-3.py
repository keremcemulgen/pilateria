# -*- coding: utf-8 -*-
# v196 ADIM 3 — NAKİT AKIŞI EKRANI + FİNANS RAPORLARI (adım 1+2'nin üstüne)
# Nakit Akışı: Kasa/Banka/Σ nakit, kart borçları + en yakın son ödeme, bize borçlu / biz borçluyuz; 30-60-90 günlük projeksiyon
# (A: vadeli tahsilat + ödeme; B: yalnız ödemeler, tahsilat gelmezse), güvenlik payı altı gün uyarısı, günlük akış listesi.
# Raporlar: aylar yan yana gelir–gider (kategori satırları, net), hesap ekstresi (yürüyen bakiye, CSV), cari ekstre (CSV),
# gerçekleşen nakit akış tablosu (ay başı/sonu nakit, giriş-çıkış türleri). Mevcut Raporlar sayfası ayrı (link).
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:120])
    s = s.replace(old, new)

# ───────── CSS ─────────
rep("""  .fin-tot { font-size:13px; color:var(--muted); margin:2px 0 8px; } .fin-tot b { color:var(--text); }""",
"""  .fin-tot { font-size:13px; color:var(--muted); margin:2px 0 8px; } .fin-tot b { color:var(--text); }
  .fin-chart { width:100%; height:auto; display:block; margin:6px 0; }
  .fin-chart text { font-size:11px; fill:var(--muted); }
  @media (max-width: 640px) { .fin-chart text { font-size:18px; } } /* viewBox ölçeklenince telefonda okunur kalsın */
  .fin-rep-table th, .fin-rep-table td { font-size:12.5px; white-space:nowrap; font-variant-numeric:tabular-nums; }
  .fin-rep-table td.n, .fin-rep-table th.n { text-align:right; }
  .fin-rep-table tr.tot td { font-weight:700; border-top:2px solid var(--border); }
  .fin-rep-table tr.net td { font-weight:700; background:var(--acc-soft, #e6f4f1); }
  .fin-kpi { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin:8px 0; }
  @media (max-width: 640px) { .fin-kpi { grid-template-columns:1fr 1fr; } }""")

# ───────── varsayılan alt sekme: finans etkinse Nakit Akışı ─────────
rep("""let __finTab196 = (function(){ try { return localStorage.getItem('pilateria_fin_tab') || 'moves'; } catch(e) { return 'moves'; } })();""",
"""let __finTab196 = (function(){ try { return localStorage.getItem('pilateria_fin_tab') || ''; } catch(e) { return ''; } })(); // '' = henüz seçilmedi → finans etkinse Nakit Akışı, değilse Hareketler""")
rep("""function renderFinance196() {
  try { __finNormalize196(state); } catch(e) {}
  const staff = !!(typeof SUPABASE_MODE !== 'undefined' && SUPABASE_MODE && typeof __sbRole !== 'undefined' && __sbRole === 'staff');
  if (staff && __finTab196 !== 'moves') { __finTab196 = 'moves'; }""",
"""function renderFinance196() {
  try { __finNormalize196(state); } catch(e) {}
  const staff = !!(typeof SUPABASE_MODE !== 'undefined' && SUPABASE_MODE && typeof __sbRole !== 'undefined' && __sbRole === 'staff');
  if (!__finTab196) __finTab196 = (!staff && finActive196()) ? 'cash' : 'moves'; // v196 adım 3
  if (staff && __finTab196 !== 'moves') { __finTab196 = 'moves'; }""")

# ───────── ÇEKİRDEK + EKRANLAR ─────────
rep("""function renderPayments() {
  try { __renderPaymentRecords196(); }""",
r"""// ═══════════════════════ v196 ADIM 3 — NAKİT AKIŞI + RAPORLAR ═══════════════════════
let __finCashWin196 = (function(){ try { return +localStorage.getItem('pilateria_fin_cash_win') || 30; } catch(e) { return 30; } })();
function finSetCashWin196(v) { __finCashWin196 = +v || 30; try { localStorage.setItem('pilateria_fin_cash_win', String(__finCashWin196)); } catch(e) {} renderFinCash196(); }
function finDaysBetween196(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
// PROJEKSİYON: bugünkü nakit (Kasa+Banka) + vadeli tahsilatlar − vadeli ödemeler, gün gün. Gecikmişler bugüne yazılır.
// A = beklenen (tahsilat + ödeme) · B = temkinli (yalnız ödemeler; tahsilat hiç gelmezse). Yenilemeler (tahmin) ikisine de GİRMEZ.
function finProjection196(days) {
  days = +days || 30; const today = todayISO(); const safety = +((state.settings.finance || {}).safetyMin) || 0;
  const start = finCash196(); const active = start !== null;
  const ev = [];
  finDueItems196().forEach(function(it){ ev.push({ day: Math.max(0, finDaysBetween196(today, it.dueDate)), amount: -(+it.amount || 0), title: it.title, kind: it.dtype, overdue: !!it.overdue, id: it.id }); });
  finReceivables196().forEach(function(it){ ev.push({ day: Math.max(0, finDaysBetween196(today, it.dueDate)), amount: +it.amount || 0, title: it.title, kind: 'member', overdue: !!it.overdue, id: it.id }); });
  const ren = finRenewals196().map(function(it){ return { day: Math.max(0, finDaysBetween196(today, it.dueDate)), amount: +it.amount || 0, title: it.title, kind: 'renewal', estimate: true, id: it.id }; });
  const inWin = function(e){ return e.day <= days; };
  const points = []; let a = start || 0, b = start || 0;
  for (let i = 0; i <= days; i++) {
    const dayEv = ev.filter(function(e){ return e.day === i; });
    dayEv.forEach(function(e){ a += e.amount; if (e.amount < 0) b += e.amount; });
    points.push({ i: i, d: addDaysISO(today, i), a: finR2_196(a), b: finR2_196(b), events: dayEv });
  }
  const thr = safety > 0 ? safety : 0;
  const warnA = points.find(function(p){ return p.a < thr - 0.005; }) || null;
  const warnB = points.find(function(p){ return p.b < 0 - 0.005; }) || null;
  const sum = function(f){ return finR2_196(ev.filter(inWin).filter(f).reduce(function(x, e){ return x + Math.abs(e.amount); }, 0)); };
  return { active: active, start: start || 0, days: days, safety: safety, points: points, events: ev.filter(inWin), renewals: ren.filter(inWin), warnA: warnA, warnB: warnB,
    totIn: sum(function(e){ return e.amount > 0; }), totOut: sum(function(e){ return e.amount < 0; }), totRen: finR2_196(ren.filter(inWin).reduce(function(x, e){ return x + e.amount; }, 0)),
    overdueIn: sum(function(e){ return e.amount > 0 && e.overdue; }), overdueOut: sum(function(e){ return e.amount < 0 && e.overdue; }), end: points.length ? points[points.length - 1] : null };
}
function finChartSvg196(pr) {
  const W = 640, H = 200, padL = 8, padR = 8, padT = 16, padB = 26;
  const vals = []; pr.points.forEach(function(p){ vals.push(p.a, p.b); }); vals.push(0, pr.safety);
  const maxV = Math.max.apply(null, vals), minV = Math.min.apply(null, vals); const span = (maxV - minV) || 1;
  const y = function(v){ return padT + (maxV - v) / span * (H - padT - padB); };
  const x = function(i){ return padL + i / Math.max(1, pr.days) * (W - padL - padR); };
  const path = function(key){ return pr.points.map(function(p, i){ return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[key]).toFixed(1); }).join(' '); };
  const fmtK = function(v){ return money(v); };
  let ticks = ''; const step = pr.days <= 30 ? 5 : (pr.days <= 60 ? 10 : 15);
  for (let i = 0; i <= pr.days; i += step) { const p = pr.points[i]; if (!p) continue; const anc = i === 0 ? 'start' : (i + step > pr.days ? 'end' : 'middle'); ticks += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + anc + '">' + fmtDate(p.d).slice(0, 5) + '</text>'; }
  const safe = pr.safety > 0 ? '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(pr.safety).toFixed(1) + '" y2="' + y(pr.safety).toFixed(1) + '" stroke="var(--bad)" stroke-dasharray="4 4" stroke-width="1"></line><text x="' + (W - padR) + '" y="' + (y(pr.safety) - 4).toFixed(1) + '" text-anchor="end" fill="var(--bad)">güvenlik payı ' + fmtK(pr.safety) + '</text>' : '';
  const zero = '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '" stroke="var(--border)" stroke-width="1"></line>';
  const warn = pr.warnA ? '<circle cx="' + x(pr.warnA.i).toFixed(1) + '" cy="' + y(pr.warnA.a).toFixed(1) + '" r="5" fill="var(--bad)"></circle>' : '';
  const endA = pr.end ? '<text x="' + (W - padR) + '" y="' + (y(pr.end.a) - 6).toFixed(1) + '" text-anchor="end" fill="var(--text)" font-weight="700">' + fmtK(pr.end.a) + ' ₺</text>' : '';
  return '<svg class="fin-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Nakit akışı projeksiyonu">' + zero + safe +
    '<path d="' + path('b') + '" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"></path>' +
    '<path d="' + path('a') + '" fill="none" stroke="var(--tc-net, #2E7D32)" stroke-width="2.5"></path>' + warn + endA + ticks +
    '<text x="' + padL + '" y="' + (padT - 4) + '">bugün ' + fmtK(pr.start) + ' ₺</text></svg>';
}
function renderFinCash196() {
  const el = document.getElementById('fin-cash-body'); if (!el) return;
  try { finEnsureTemplateDues196(); } catch(e) {}
  if (!finActive196()) { el.innerHTML = '<h2>💰 Nakit Akışı</h2><div class="fin-warn">Hesaplar henüz açılmadı. 🏦 Hesaplar sekmesinden Kasa ve Banka için <b>başlangıç tarihi</b> ve <b>açılış bakiyesi</b> gir; o günden sonraki her ödeme ve gider hesaplara işler, bu ekran dolar.</div>'; return; }
  const pr = finProjection196(__finCashWin196);
  const cash = finBalance196(FIN_ACC_CASH), bank = finBalance196(FIN_ACC_BANK), tot = finCash196(), debt = finCardDebt196();
  const cards = finAccounts196().filter(function(a){ return a.type === 'card'; });
  const nearest = finCardReminders196().slice().sort(function(a, b){ return String(a.dueDate).localeCompare(String(b.dueDate)); })[0];
  const recv = finReceivables196(); const sum = function(arr){ return finR2_196(arr.reduce(function(a, x){ return a + (+x.amount || 0); }, 0)); };
  const insD = finInstructorDues196(); const cpOpen = (state.finDues || []).filter(function(d){ return d && d.status === 'open'; });
  const owe = finR2_196(sum(insD) + sum(cpOpen) + debt);
  const winSel = '<select onchange="finSetCashWin196(this.value)" style="max-width:140px;">' + [30, 60, 90].map(function(v){ return '<option value="' + v + '"' + (v === __finCashWin196 ? ' selected' : '') + '>' + v + ' gün</option>'; }).join('') + '</select>';
  const un = finUnassigned196();
  let warnTxt = '';
  if (pr.warnA) { const evs = pr.warnA.events.filter(function(e){ return e.amount < 0; }).map(function(e){ return e.title; }).slice(0, 3).join(' + '); warnTxt = '<div class="fin-warn">⚠️ <b>' + fmtDate(pr.warnA.d) + '</b>: beklenen nakit <b>' + money(pr.warnA.a) + ' ₺</b>' + (pr.safety > 0 ? ' — güvenlik payının (' + money(pr.safety) + ' ₺) altı' : ' — eksiye düşüyor') + (evs ? ' (' + escapeHtml(evs) + ')' : '') + '.</div>'; }
  else if (pr.warnB) { warnTxt = '<div class="fin-warn" style="background:transparent;">ℹ️ Tahsilatlar hiç gelmezse <b>' + fmtDate(pr.warnB.d) + '</b> günü nakit eksiye düşer (' + money(pr.warnB.b) + ' ₺); beklenen tahsilatlarla sorun yok.</div>'; }
  el.innerHTML = '<div class="row between" style="flex-wrap:wrap;gap:8px;align-items:center;"><h2 style="margin:0;">💰 Nakit Akışı</h2>' + winSel + '</div>' +
    '<div class="grid-stats" style="margin-top:8px;">' +
    '<div class="stat ok"><div class="label">💵 Kasa</div><div class="value">' + finMoneyS196(cash) + '</div></div>' +
    '<div class="stat blue"><div class="label">🏦 Banka</div><div class="value">' + finMoneyS196(bank) + '</div></div>' +
    '<div class="stat"><div class="label">Σ Nakit</div><div class="value">' + finMoneyS196(tot) + '</div></div>' +
    '<div class="stat ' + (debt > 0 ? 'bad' : '') + '"><div class="label">💳 Kart borcu' + (cards.length ? ' (' + cards.length + ' kart)' : '') + '</div><div class="value">' + money(debt) + ' ₺</div>' + (nearest ? '<div class="fin-note">en yakın son ödeme ' + fmtDate(nearest.dueDate) + ' · ' + money(nearest.amount) + ' ₺</div>' : '') + '</div>' +
    '<div class="stat warn"><div class="label">📥 Bize borçlu (üyeler)</div><div class="value">' + money(sum(recv)) + ' ₺</div>' + (pr.overdueIn ? '<div class="fin-note" style="color:var(--bad)">gecikmiş ' + money(pr.overdueIn) + ' ₺</div>' : '') + '</div>' +
    '<div class="stat bad"><div class="label">📤 Biz borçluyuz</div><div class="value">' + money(owe) + ' ₺</div><div class="fin-note">hoca ' + money(sum(insD)) + ' · vadeli ' + money(sum(cpOpen)) + ' · kart ' + money(debt) + '</div></div>' +
    '</div>' +
    (un.length ? '<div class="fin-warn">⚠️ ' + un.length + ' hesapsız hareket bakiyeye girmiyor — Hareketler sekmesinde listelenir.</div>' : '') +
    '<div class="fin-sec">📈 ' + __finCashWin196 + ' günlük projeksiyon <small class="fin-note">düz çizgi: vadeli tahsilat + ödeme · kesikli: yalnız ödemeler (tahsilat gelmezse) · yenilemeler tahmindir, çizgiye girmez</small></div>' +
    finChartSvg196(pr) +
    '<div class="fin-tot">' + __finCashWin196 + ' günde beklenen giriş <b class="fin-in">+' + money(pr.totIn) + '</b> · çıkış <b class="fin-out">−' + money(pr.totOut) + '</b> → dönem sonu <b>' + money(pr.end ? pr.end.a : pr.start) + ' ₺</b>' + (pr.totRen ? ' · beklenen yenileme <b>+' + money(pr.totRen) + ' ₺</b> (tahmin, ' + pr.renewals.length + ' birim)' : '') + (pr.overdueOut ? ' · <b style="color:var(--bad)">gecikmiş ödeme ' + money(pr.overdueOut) + ' ₺</b>' : '') + '</div>' +
    warnTxt +
    '<div class="fin-sec">🗓️ Günlük akış <small class="fin-note">(ilk 15 kalem)</small></div>' +
    (function(){ const list = pr.events.slice().sort(function(a, b){ return a.day - b.day || a.amount - b.amount; }).slice(0, 15); if (!list.length) return '<div class="fin-note">Pencerede vadeli kalem yok.</div>'; let run = pr.start; return list.map(function(e){ run = finR2_196(run + e.amount); return '<div class="fin-row' + (e.overdue ? ' overdue' : '') + '"><span class="d">' + fmtDate(addDaysISO(todayISO(), e.day)) + (e.overdue ? ' <small>gecikmiş</small>' : '') + '</span><span class="t">' + escapeHtml(e.title) + '</span><span class="a ' + (e.amount > 0 ? 'fin-in' : 'fin-out') + '">' + (e.amount > 0 ? '+' : '−') + money(Math.abs(e.amount)) + ' ₺</span><span style="min-width:100px;text-align:right;font-variant-numeric:tabular-nums;color:var(--muted);">' + money(run) + ' ₺</span></div>'; }).join(''); })();
}
// ─────────── RAPORLAR ───────────
let __finRep196 = { kind: 'pl', months: 6, acc: FIN_ACC_BANK, cpKind: 'cp', cpId: '' };
function finRepSet196(k, v) { __finRep196[k] = v; renderFinReports196(); }
function finMonthsBack196(n) { const out = []; const cur = currentMonth(); for (let i = n - 1; i >= 0; i--) out.push(finMonthAdd196(cur, -i)); return out; }
function finPlRows196(months) {
  const cats = {}; const inc = {}, pay = {}, cashDelta = {};
  months.forEach(function(ay){
    const n = netProfitForMonth(ay); inc[ay] = n.rev; pay[ay] = n.pay;
    expensesForMonth(ay).forEach(function(e){ if (!e || e.category === 'Hoca Maaşı' || (e.note && String(e.note).indexOf('MAAS-OTO-') !== -1)) return; if (e.business === false) return; const c = e.category || 'Diğer'; cats[c] = cats[c] || {}; cats[c][ay] = finR2_196((cats[c][ay] || 0) + (+e.amount || 0)); });
    let d = 0; finMovements196().forEach(function(m){ if (String(m.date).slice(0, 7) !== ay) return; const a = finAccount196(m.accountId); if (!a || a.type === 'card') return; if (m.type === 'virman') return; d += m.dir * m.amount; }); cashDelta[ay] = finR2_196(d);
  });
  const rows = [];
  rows.push({ label: 'Üye tahsilatları (paket ayı)', vals: months.map(function(ay){ return inc[ay] || 0; }), cls: '' });
  rows.push({ label: 'Hoca ödemeleri', vals: months.map(function(ay){ return -(pay[ay] || 0); }), cls: '' });
  Object.keys(cats).sort(function(a, b){ return a.localeCompare(b, 'tr'); }).forEach(function(c){ rows.push({ label: 'Gider · ' + c, vals: months.map(function(ay){ return -(cats[c][ay] || 0); }), cls: '' }); });
  const net = months.map(function(ay, i){ return finR2_196(rows.reduce(function(a, r){ return a + (r.vals[i] || 0); }, 0)); });
  rows.push({ label: 'Net', vals: net, cls: 'net' });
  rows.push({ label: 'Nakit değişimi (Kasa+Banka, gerçekleşen)', vals: months.map(function(ay){ return cashDelta[ay]; }), cls: 'tot' });
  return rows;
}
function finAccountStatement196(accId, months) {
  const a = finAccount196(accId); if (!a || !a.openingDate) return { rows: [], opening: null, closing: null };
  const from = months && months.length ? months[0] + '-01' : a.openingDate; const to = months && months.length ? finMonthEnd196(months[months.length - 1]) : '9999-12-31';
  let run = finBalance196(accId, addDaysISO(from, -1)); if (from <= a.openingDate) run = +a.openingBalance || 0;
  const opening = run;
  const list = finMovements196().filter(function(m){ return m.accountId === accId && m.date >= from && m.date <= to; }).sort(function(x, y){ return String(x.date).localeCompare(String(y.date)) || String(x.id).localeCompare(String(y.id)); });
  const rows = list.map(function(m){ run = finR2_196(run + m.dir * m.amount); return { date: m.date, type: m.type, who: m.who, note: m.note, inA: m.dir > 0 ? m.amount : 0, outA: m.dir < 0 ? m.amount : 0, bal: run }; });
  return { rows: rows, opening: opening, closing: run };
}
function finStatementRows196(kind, id) {
  let title = '', rows = []; const r2 = finR2_196;
  if (kind === 'member' || kind === 'group') {
    const g = kind === 'group' ? (state.groups || []).find(function(x){ return x && x.id === id; }) : null; const m = kind === 'member' ? (state.members || []).find(function(x){ return x && x.id === id; }) : null;
    title = (g ? groupDisplayName(g, currentMonth()) : (m ? m.name : id)) + ' — üye ekstresi';
    const months = {}; (getOverduePayments({ includeFuture: true }) || []).forEach(function(o){ if ((kind === 'group' ? o.groupId === id : (!o.groupId && o.memberId === id))) (o.monthsDetail || []).forEach(function(r){ months[r.ay] = r; }); });
    const pays = (state.payments || []).filter(function(p){ return p && (kind === 'group' ? p.groupId === id : (p.memberId === id && !p.groupId)); });
    const allM = {}; Object.keys(months).forEach(function(k){ allM[k] = 1; }); pays.forEach(function(p){ allM[paymentMonthOf(p)] = 1; });
    Object.keys(allM).sort().forEach(function(ay){ const r = months[ay]; if (r) rows.push({ d: ay + '-01', t: ay + ' paket ücreti', a: r.expected, dir: 1 }); pays.filter(function(p){ return paymentMonthOf(p) === ay; }).sort(function(a, b){ return String(a.date).localeCompare(String(b.date)); }).forEach(function(p){ rows.push({ d: p.date, t: 'ödeme · ' + (p.method || '') + (kind === 'group' ? ' · ' + memberName(p.memberId) : '') + (p.note ? ' · ' + p.note : ''), a: +p.amount || 0, dir: -1 }); }); });
  } else if (kind === 'instructor') {
    const inst = (state.instructors || []).find(function(x){ return x && x.id === id; }); title = (inst ? inst.name : id) + ' — hoca ekstresi';
    const months = {}; (state.lessons || []).forEach(function(l){ if (l && l.instructorId === id && l.date && lessonHappened(l)) months[String(l.date).slice(0, 7)] = 1; }); (state.instructorPayouts || []).forEach(function(po){ if (po && po.instructorId === id) months[po.year + '-' + String(po.month).padStart(2, '0')] = 1; });
    Object.keys(months).sort().forEach(function(m){ const hak = r2((instructorEarningsForMonth(id, m) || {}).total); if (hak) rows.push({ d: finMonthEnd196(m), t: m + ' hakedişi', a: hak, dir: 1 }); const p = m.split('-').map(Number); (state.instructorPayouts || []).filter(function(po){ return po && po.instructorId === id && po.year === p[0] && po.month === p[1]; }).forEach(function(po){ rows.push({ d: po.paidDate || finMonthEnd196(m), t: 'ödeme · ' + (po.method || '') + (po.note ? ' · ' + po.note : ''), a: +po.amount || 0, dir: -1 }); }); });
  } else {
    const c = finCounterparty196(id); title = (c ? c.name : id) + ' — cari ekstresi';
    (state.finDues || []).filter(function(d){ return d && d.counterpartyId === id && d.status !== 'skipped'; }).forEach(function(d){ rows.push({ d: d.dueDate, t: d.title + (d.status === 'paid' ? ' (ödendi)' : ' (açık)'), a: d.amount, dir: 1 }); });
    (state.expenses || []).filter(function(e){ return e && e.counterpartyId === id; }).forEach(function(e){ rows.push({ d: e.paidDate || e.date, t: 'ödeme · ' + (e.category || '') + (e.accountId ? ' · ' + finAccountLabel196(e.accountId) : '') + (e.note ? ' · ' + e.note : '') + (e.dueId ? '' : ' (vadesiz gider)'), a: +e.amount || 0, dir: -1, direct: !e.dueId }); });
  }
  rows.sort(function(a, b){ return String(a.d).localeCompare(String(b.d)); });
  let run = 0; rows.forEach(function(r){ if (!r.direct) run = r2(run + r.dir * r.a); r.bal = run; });
  return { title: title, rows: rows, balance: run };
}
function finCashflowRows196(months) {
  return months.map(function(ay){
    const open = finCash196(addDaysISO(ay + '-01', -1)); const close = finCash196(finMonthEnd196(ay));
    const by = {}; finMovements196().forEach(function(m){ if (String(m.date).slice(0, 7) !== ay) return; const a = finAccount196(m.accountId); if (!a || a.type === 'card') return; if (m.type === 'virman') return; const k = (m.dir > 0 ? 'in:' : 'out:') + m.type; by[k] = finR2_196((by[k] || 0) + m.amount); });
    return { ay: ay, open: open, close: close, by: by };
  });
}
function renderFinReports196() {
  const el = document.getElementById('fin-reports-body'); if (!el) return;
  const R = __finRep196; const months = finMonthsBack196(R.months);
  const kinds = { pl: 'Gelir–Gider (aylar yan yana)', acc: 'Hesap ekstresi', cp: 'Cari ekstre', cf: 'Nakit akış tablosu (gerçekleşen)' };
  const head = '<div class="row between" style="flex-wrap:wrap;gap:8px;align-items:center;"><h2 style="margin:0;">📈 Finans Raporları</h2><div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;">' +
    '<select onchange="finRepSet196(\'kind\', this.value)" style="max-width:260px;">' + Object.keys(kinds).map(function(k){ return '<option value="' + k + '"' + (R.kind === k ? ' selected' : '') + '>' + kinds[k] + '</option>'; }).join('') + '</select>' +
    (R.kind !== 'cp' ? '<select onchange="finRepSet196(\'months\', +this.value)" style="max-width:110px;">' + [3, 6, 12].map(function(n){ return '<option value="' + n + '"' + (R.months === n ? ' selected' : '') + '>' + n + ' ay</option>'; }).join('') + '</select>' : '') +
    (R.kind === 'acc' ? '<select id="fin-rep-acc" onchange="finRepSet196(\'acc\', this.value)" style="max-width:220px;"></select>' : '') +
    (R.kind === 'cp' ? '<select onchange="finRepSet196(\'cpKind\', this.value); finRepSet196(\'cpId\', \'\')">' + [['cp', 'Dış cari'], ['instructor', 'Hoca'], ['member', 'Üye (bireysel)'], ['group', 'Grup']].map(function(p){ return '<option value="' + p[0] + '"' + (R.cpKind === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select><select id="fin-rep-cp" onchange="finRepSet196(\'cpId\', this.value)"></select>' : '') +
    '<button class="btn small secondary" onclick="finExportReportCsv196()">⬇️ CSV</button><button class="btn small secondary" onclick="switchPage(\'reports\')" title="Aylık rapor, vergi paneli, trend">Aylık Rapor →</button></div></div>';
  let body = '';
  const fm = function(v){ return v === null || v === undefined ? '—' : money(v); };
  if (R.kind === 'pl') {
    const rows = finPlRows196(months);
    body = '<div class="fin-note">Tahsilat paket ayına, gider ödeme tarihine, hoca ödemesi ödendiği aya göre. Hoca Maaşı gider kaydı çift sayılmaz. Son satır: Kasa+Banka gerçekleşen değişim (virman hariç).</div><div class="table-wrap"><table class="fin-rep-table"><thead><tr><th></th>' + months.map(function(ay){ return '<th class="n">' + ay + '</th>'; }).join('') + '<th class="n">Toplam</th></tr></thead><tbody>' +
      rows.map(function(r){ const tot = finR2_196(r.vals.reduce(function(a, v){ return a + (v || 0); }, 0)); return '<tr class="' + r.cls + '"><td>' + escapeHtml(r.label) + '</td>' + r.vals.map(function(v){ return '<td class="n"' + (v < 0 ? ' style="color:var(--bad)"' : '') + '>' + fm(v) + '</td>'; }).join('') + '<td class="n">' + fm(tot) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  } else if (R.kind === 'acc') {
    const st = finAccountStatement196(R.acc, months); const a = finAccount196(R.acc);
    body = '<div class="fin-tot">' + (a ? escapeHtml(finAccountLabel196(a.id)) : '') + ' · ' + months[0] + ' → ' + months[months.length - 1] + ' · açılış <b>' + fm(st.opening) + ' ₺</b> · kapanış <b>' + fm(st.closing) + ' ₺</b> · ' + st.rows.length + ' hareket</div>' +
      '<div class="table-wrap"><table class="fin-rep-table"><thead><tr><th>Tarih</th><th>Tür</th><th>Kim / Ne</th><th>Not</th><th class="n">Giriş</th><th class="n">Çıkış</th><th class="n">Bakiye</th></tr></thead><tbody>' +
      (st.rows.length ? st.rows.map(function(r){ return '<tr><td>' + fmtDate(r.date) + '</td><td>' + escapeHtml(r.type) + '</td><td>' + escapeHtml(r.who || '') + '</td><td style="white-space:normal;">' + escapeHtml(r.note || '') + '</td><td class="n fin-in">' + (r.inA ? money(r.inA) : '') + '</td><td class="n fin-out">' + (r.outA ? money(r.outA) : '') + '</td><td class="n"><b>' + money(r.bal) + '</b></td></tr>'; }).join('') : '<tr><td colspan="7"><div class="empty">Hareket yok.</div></td></tr>') + '</tbody></table></div>';
  } else if (R.kind === 'cp') {
    const st = R.cpId ? finStatementRows196(R.cpKind, R.cpId) : null;
    body = st ? ('<div class="fin-tot"><b>' + escapeHtml(st.title) + '</b> · bakiye <b>' + money(st.balance) + ' ₺</b></div><div class="table-wrap"><table class="fin-rep-table"><thead><tr><th>Tarih</th><th>Açıklama</th><th class="n">Borç</th><th class="n">Ödeme</th><th class="n">Bakiye</th></tr></thead><tbody>' + (st.rows.length ? st.rows.map(function(r){ return '<tr><td>' + fmtDate(r.d) + '</td><td style="white-space:normal;">' + escapeHtml(r.t) + '</td><td class="n">' + (r.dir > 0 ? money(r.a) : '') + '</td><td class="n">' + (r.dir < 0 ? money(r.a) : '') + '</td><td class="n"><b>' + money(r.bal) + '</b></td></tr>'; }).join('') : '<tr><td colspan="5"><div class="empty">Kayıt yok.</div></td></tr>') + '</tbody></table></div>') : '<div class="fin-note">Cari seç.</div>';
  } else {
    const cf = finCashflowRows196(months); const keys = {}; cf.forEach(function(r){ Object.keys(r.by).forEach(function(k){ keys[k] = 1; }); });
    const lbl = { 'in:tahsilat': 'Giriş · üye tahsilatı', 'in:sermaye': 'Giriş · sermaye', 'in:mutabakat': 'Giriş · mutabakat (+)', 'in:gider': 'Giriş · gider iadesi', 'in:hoca': 'Giriş · hocadan iade', 'in:kart': 'Giriş · kart', 'out:gider': 'Çıkış · gider', 'out:hoca': 'Çıkış · hoca ödemesi', 'out:cekim': 'Çıkış · ortak çekimi', 'out:kart': 'Çıkış · kart borcu ödemesi', 'out:iade': 'Çıkış · üye iadesi', 'out:mutabakat': 'Çıkış · mutabakat (−)' };
    const ks = Object.keys(keys).sort(function(a, b){ return (a.indexOf('in:') === 0 ? 0 : 1) - (b.indexOf('in:') === 0 ? 0 : 1) || a.localeCompare(b); });
    body = '<div class="fin-note">Kasa + Banka (kart hesapları hariç, virman hariç). Ay başı = önceki ay sonu bakiyesi.</div><div class="table-wrap"><table class="fin-rep-table"><thead><tr><th></th>' + months.map(function(ay){ return '<th class="n">' + ay + '</th>'; }).join('') + '</tr></thead><tbody>' +
      '<tr class="tot"><td>Ay başı nakit</td>' + cf.map(function(r){ return '<td class="n">' + fm(r.open) + '</td>'; }).join('') + '</tr>' +
      ks.map(function(k){ return '<tr><td>' + (lbl[k] || k) + '</td>' + cf.map(function(r){ const v = r.by[k] || 0; return '<td class="n"' + (k.indexOf('out:') === 0 && v ? ' style="color:var(--bad)"' : '') + '>' + (v ? (k.indexOf('out:') === 0 ? '−' : '+') + money(v) : '') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '<tr class="net"><td>Ay sonu nakit</td>' + cf.map(function(r){ return '<td class="n">' + fm(r.close) + '</td>'; }).join('') + '</tr></tbody></table></div>';
  }
  el.innerHTML = head + body;
  if (R.kind === 'acc') finFillAccountSelect196(document.getElementById('fin-rep-acc'), '', R.acc);
  if (R.kind === 'cp') { const sel = document.getElementById('fin-rep-cp'); if (sel) { const opts = R.cpKind === 'cp' ? finCounterparties196(true).map(function(c){ return [c.id, c.name]; }) : R.cpKind === 'instructor' ? (state.instructors || []).map(function(i){ return [i.id, i.name]; }) : R.cpKind === 'group' ? (state.groups || []).filter(function(g){ return g && !g.archived; }).map(function(g){ return [g.id, groupDisplayName(g, currentMonth())]; }) : (state.members || []).filter(function(m){ return m && !m.archived; }).slice().sort(function(a, b){ return String(a.name).localeCompare(String(b.name), 'tr'); }).map(function(m){ return [m.id, m.name]; }); sel.innerHTML = '<option value="">— seç —</option>' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (R.cpId === o[0] ? ' selected' : '') + '>' + escapeHtml(o[1]) + '</option>'; }).join(''); } }
}
function finExportReportCsv196() {
  const R = __finRep196; const months = finMonthsBack196(R.months); let rows = [], name = 'finans';
  if (R.kind === 'pl') { rows.push(['Kalem'].concat(months)); finPlRows196(months).forEach(function(r){ rows.push([r.label].concat(r.vals.map(function(v){ return v === null || v === undefined ? '' : String(v); }))); }); name = 'gelir-gider'; }
  else if (R.kind === 'acc') { const st = finAccountStatement196(R.acc, months); rows.push(['Tarih', 'Tür', 'Kim/Ne', 'Not', 'Giriş', 'Çıkış', 'Bakiye']); st.rows.forEach(function(r){ rows.push([r.date, r.type, r.who || '', r.note || '', r.inA || '', r.outA || '', r.bal]); }); name = 'hesap-ekstresi-' + R.acc; }
  else if (R.kind === 'cp') { if (!R.cpId) { alert('Cari seç.'); return; } const st = finStatementRows196(R.cpKind, R.cpId); rows.push(['Tarih', 'Açıklama', 'Borç', 'Ödeme', 'Bakiye']); st.rows.forEach(function(r){ rows.push([r.d, r.t, r.dir > 0 ? r.a : '', r.dir < 0 ? r.a : '', r.bal]); }); name = 'cari-ekstre'; }
  else { const cf = finCashflowRows196(months); rows.push(['Ay', 'Ay başı', 'Ay sonu'].concat([])); cf.forEach(function(r){ rows.push([r.ay, r.open === null ? '' : r.open, r.close === null ? '' : r.close].concat(Object.keys(r.by).map(function(k){ return k + '=' + r.by[k]; }))); }); name = 'nakit-akis'; }
  __dlCsv('pilateria-' + name + '-' + todayISO() + '.csv', rows);
}
function renderPayments() {
  try { __renderPaymentRecords196(); }""")

# openFinStatement196 → ortak satır üretici kullanır (tek kaynak)
rep("""function openFinStatement196(kind, id) {
  const old = document.getElementById('modal-fin-stm'); if (old) old.remove();
  let title = '', rows = [], bal = 0; const r2 = finR2_196;""",
"""function openFinStatement196(kind, id) {
  const old = document.getElementById('modal-fin-stm'); if (old) old.remove();
  if (typeof finStatementRows196 === 'function') { const st = finStatementRows196(kind, id); const body2 = st.rows.map(function(r){ return '<tr><td>' + fmtDate(r.d) + '</td><td>' + escapeHtml(r.t) + '</td><td style="text-align:right;">' + (r.dir > 0 ? money(r.a) : '') + '</td><td style="text-align:right;">' + (r.dir < 0 ? money(r.a) : '') + '</td><td style="text-align:right;"><b>' + money(r.bal) + '</b></td></tr>'; }).join(''); const mdl2 = document.createElement('div'); mdl2.id = 'modal-fin-stm'; mdl2.className = 'modal-bg open'; mdl2.innerHTML = '<div class="modal" style="max-width:720px;"><h3>📄 ' + escapeHtml(st.title) + '</h3><div class="fin-note">Borç = ücret/hakediş/kalem; alacak = ödeme. Bakiye pozitifse ödenmemiş tutar vardır.' + (kind === 'cp' ? ' Vadesiz girilen giderler bilgi olarak listelenir, bakiyeyi etkilemez.' : '') + '</div><div class="table-wrap"><table class="fin-table"><thead><tr><th>Tarih</th><th>Açıklama</th><th style="text-align:right;">Borç</th><th style="text-align:right;">Ödeme</th><th style="text-align:right;">Bakiye</th></tr></thead><tbody>' + (body2 || '<tr><td colspan="5"><div class="empty">Kayıt yok.</div></td></tr>') + '</tbody></table></div><div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px;"><button class="btn secondary" onclick="document.getElementById(\\'modal-fin-stm\\').remove()">Kapat</button></div></div>'; document.body.appendChild(mdl2); return; }
  let title = '', rows = [], bal = 0; const r2 = finR2_196;""")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
