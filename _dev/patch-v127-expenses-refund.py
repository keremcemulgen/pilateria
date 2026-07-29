# -*- coding: utf-8 -*-
# v127 — GIDER TAKIBI + NET KAR + IADE
#  5) state.expenses: tam senkron kablolamasi (SB_TABLES + rows + merge + tombstone otomatik + realtime apply)
#     Sunucu tarafi BUGUN kuruldu (expenses-setup.sql, 5/5 dogrulandi): tablo+RLS+realtime+arsiv+yedek kapsami.
#     UI: Odemeler sayfasinda Giderler karti; Raporlar + Panel'de NET KAR = tahsilat − hoca odemeleri − giderler.
#  9) IADE: odeme modalinde "Iade kaydi" — tutar negatif yazilir, aciklama zorunlu, tavan/paket mantigi atlanir.
#  recover.html + kurtar.html: tablo listelerine expenses eklenir (kurtarma kapsami).
import io, re

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ============ A) SENKRON KABLOLAMASI ============
rep("const SB_TABLES = ['members','member_finance','groups','group_finance','lessons','instructors','instructor_finance','payments','instructor_payouts','package_types','campaigns','wa_templates','settings'];",
    "const SB_TABLES = ['members','member_finance','groups','group_finance','lessons','instructors','instructor_finance','payments','instructor_payouts','package_types','campaigns','wa_templates','settings','expenses']; // v127: expenses eklendi")

rep("""  (state.waTemplates || []).forEach((w, ix) => { const id = w.id || ('wt-' + ix); rows.wa_templates[id] = w; });
""",
"""  (state.waTemplates || []).forEach((w, ix) => { const id = w.id || ('wt-' + ix); rows.wa_templates[id] = w; });
  (state.expenses || []).forEach(e => { if (e && e.id) rows.expenses[e.id] = e; }); // v127
""")

rep("""  fresh.waTemplates = Object.values(by('wa_templates'));
""",
"""  fresh.waTemplates = Object.values(by('wa_templates'));
  fresh.expenses = Object.values(by('expenses')); // v127
""")

rep("function __sbMergeColls() { return ['members','groups','lessons','instructors','payments','packageTypes','campaigns']; }",
    "function __sbMergeColls() { return ['members','groups','lessons','instructors','payments','packageTypes','campaigns','expenses']; } // v127: gider kayitlari da kayit-bazli birlesir")

rep("""  else if (t === 'wa_templates') { state.waTemplates = state.waTemplates || []; upsert(state.waTemplates, S('wa_templates')); }
""",
"""  else if (t === 'wa_templates') { state.waTemplates = state.waTemplates || []; upsert(state.waTemplates, S('wa_templates')); }
  else if (t === 'expenses') { state.expenses = state.expenses || []; upsert(state.expenses, S('expenses')); } // v127
""")

rep("""const DEFAULT_STATE = {
  monthInit: {}, // v23: hangi aylarin listesi baslatildi (>=2026-08)
""",
"""const DEFAULT_STATE = {
  monthInit: {}, // v23: hangi aylarin listesi baslatildi (>=2026-08)
  expenses: [], // v127: giderler [{id,date,category,amount,note}]
""")

rep("""function applyV10MigrationToState(s) {
""",
"""function applyV10MigrationToState(s) {
  if (!Array.isArray(s.expenses)) s.expenses = []; // v127: eski kayitli durumlarda gider dizisini tamamla
""")

# ============ B) GIDER UI ============
rep("""    <div id="pay-summary" class="grid-stats"></div>
""",
"""    <div id="pay-summary" class="grid-stats"></div>
    <details id="expenses-card" style="margin:10px 0;padding:10px 12px;background:#FFF8F2;border:1px solid #F0DCC8;border-radius:10px;">
      <summary style="cursor:pointer;font-weight:700;">💸 Giderler <span id="expenses-total" style="font-weight:400;color:var(--muted);margin-left:6px;"></span></summary>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin:10px 0;">
        <input type="date" id="exp-date">
        <select id="exp-cat"></select>
        <input type="number" id="exp-amount" placeholder="Tutar ₺" style="width:110px;">
        <input id="exp-note" placeholder="Not (örn. Temmuz kirası)" style="flex:1;min-width:140px;">
        <button class="btn small pl-owner-only" onclick="addExpense()">Ekle</button>
      </div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px;">Hoca maaşları buraya YAZILMAZ — Hocalar sayfasındaki maaş ödemeleri net kâra otomatik girer (çift sayım olmaz).</div>
      <div id="expenses-list"></div>
    </details>
""")

rep("""function renderPayments() {
""",
"""// ===== v127: GIDER TAKIBI =====
const EXPENSE_CATS = ['Kira','Elektrik/Su/Doğalgaz','Malzeme/Ekipman','Temizlik','Pazarlama','Vergi/SGK','Diğer'];
function expensesForMonth(monthISO) {
  return (state.expenses||[]).filter(e => e && String(e.date||'').slice(0,7) === monthISO);
}
function expensesTotalForMonth(monthISO) {
  return Math.round(expensesForMonth(monthISO).reduce((a,e)=>a+(+e.amount||0),0) * 100) / 100;
}
function instructorPayoutsTotalForMonth(monthISO) {
  const pr = String(monthISO||'').split('-').map(Number);
  return Math.round(((state.instructorPayouts||[]).filter(p => p && p.year === pr[0] && p.month === pr[1]).reduce((a,p)=>a+(+p.amount||0),0)) * 100) / 100;
}
function netProfitForMonth(monthISO) {
  const rev = (state.payments||[]).filter(p => (p.packageMonth || (p.date ? String(p.date).slice(0,7) : '')) === monthISO).reduce((a,b)=>a+(+b.amount||0),0);
  const pay = instructorPayoutsTotalForMonth(monthISO);
  const exp = expensesTotalForMonth(monthISO);
  return { rev: Math.round(rev*100)/100, pay: pay, exp: exp, net: Math.round((rev - pay - exp)*100)/100 };
}
function renderExpenses(monthISO) {
  const el = document.getElementById('expenses-list');
  if (!el) return;
  const cEl = document.getElementById('exp-cat');
  if (cEl && !cEl.options.length) cEl.innerHTML = EXPENSE_CATS.map(c => `<option>${c}</option>`).join('');
  const dEl = document.getElementById('exp-date'); if (dEl && !dEl.value) dEl.value = todayISO();
  const ay = monthISO || ((document.getElementById('pay-month')||{}).value) || currentMonth();
  const list = expensesForMonth(ay).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const totEl = document.getElementById('expenses-total');
  if (totEl) totEl.innerHTML = list.length ? `${ay}: <b>${money(expensesTotalForMonth(ay))} ₺</b> (${list.length} kayıt)` : `${ay}: kayıt yok`;
  el.innerHTML = list.map(e => `<div class="row" style="gap:8px;align-items:center;margin:3px 0;font-size:13px;flex-wrap:wrap;">
    <span style="min-width:86px;">${fmtDate(e.date)}</span>
    <span class="badge" style="background:#ECEFF1;color:#37474F;">${escapeHtml(e.category||'Diğer')}</span>
    <b>${money(+e.amount||0)} ₺</b>
    <span style="color:var(--muted);flex:1;">${escapeHtml(e.note||'')}</span>
    <button class="btn small secondary pl-owner-only" onclick="removeExpense('${e.id}')">Sil</button>
  </div>`).join('');
}
function addExpense() {
  const date = (document.getElementById('exp-date')||{}).value;
  const cat = (document.getElementById('exp-cat')||{}).value || 'Diğer';
  const amount = +((document.getElementById('exp-amount')||{}).value) || 0;
  const note = ((document.getElementById('exp-note')||{}).value||'').trim();
  if (!date) { alert('Gider tarihi seç.'); return; }
  if (amount <= 0) { alert('Tutar 0\\'dan büyük olmalı.'); return; }
  state.expenses = state.expenses || [];
  state.expenses.push({ id: uid(), date: date, category: cat, amount: Math.round(amount*100)/100, note: note });
  save();
  const aEl = document.getElementById('exp-amount'); if (aEl) aEl.value = '';
  const nEl = document.getElementById('exp-note'); if (nEl) nEl.value = '';
  renderExpenses(String(date).slice(0,7));
  try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast('💸 Gider kaydedildi');
}
function removeExpense(id) {
  const e = (state.expenses||[]).find(x => x && x.id === id);
  if (!e) return;
  if (!confirm(fmtDate(e.date) + ' — ' + (e.category||'') + ' ' + money(+e.amount||0) + ' ₺ gider kaydı silinecek. Emin misin?')) return;
  state.expenses = (state.expenses||[]).filter(x => !(x && x.id === id));
  save();
  renderExpenses();
  try { __refreshUIInPlace(); } catch(err) {}
}
function renderPayments() {
""")

# renderPayments icinde gider listesini de tazele
rep("""  const mm = document.getElementById('pay-month').value;
""",
"""  const mm = document.getElementById('pay-month').value;
  try { renderExpenses(mm || currentMonth()); } catch(e) {} // v127
""")

# ============ C) NET KAR — RAPORLAR + PANEL ============
rep("""    <div id="tax-panel"></div>
""",
"""    <div id="net-profit-panel" style="margin:10px 0;"></div>
    <div id="tax-panel"></div>
""")

rep("""  document.getElementById('tax-panel').innerHTML = `""",
"""  // v127: NET KAR — tahsilat − hoca odemeleri − giderler (panel geliri artik brut degil)
  (function(){
    const np = document.getElementById('net-profit-panel');
    if (!np) return;
    const N = netProfitForMonth(m);
    np.innerHTML = `<h3 style="margin:4px 0 8px;">💰 Net Kâr (${m})</h3><div class="grid-stats">
      <div class="stat blue"><div class="label">Tahsilat</div><div class="value">${money(N.rev)} ₺</div></div>
      <div class="stat warn"><div class="label">Hoca Ödemeleri</div><div class="value">−${money(N.pay)} ₺</div></div>
      <div class="stat warn"><div class="label">Giderler</div><div class="value">−${money(N.exp)} ₺</div></div>
      <div class="stat ${N.net >= 0 ? 'ok' : 'warn'}"><div class="label">NET KÂR</div><div class="value">${money(N.net)} ₺</div></div>
    </div>`;
  })();
  document.getElementById('tax-panel').innerHTML = `""")

rep("""    <div class="stat ok"><div class="label" id="s-revenue-label">Bu Ay Gelir (₺)</div><div class="value" id="s-revenue">0</div></div>
""",
"""    <div class="stat ok"><div class="label" id="s-revenue-label">Bu Ay Gelir (₺)</div><div class="value" id="s-revenue">0</div></div>
    <div class="stat blue"><div class="label">Net Kâr (₺)</div><div class="value" id="s-netprofit">—</div></div>
""")

rep("""  const rev = state.payments.filter(p => (p.packageMonth || (p.date ? String(p.date).slice(0,7) : '')) === m).reduce((a,b)=>a+(+b.amount||0),0);
  document.getElementById('s-revenue').textContent = money(rev);
""",
"""  const rev = state.payments.filter(p => (p.packageMonth || (p.date ? String(p.date).slice(0,7) : '')) === m).reduce((a,b)=>a+(+b.amount||0),0);
  document.getElementById('s-revenue').textContent = money(rev);
  try { const __np = netProfitForMonth(m); const __npe = document.getElementById('s-netprofit'); if (__npe) __npe.textContent = money(__np.net); } catch(e) {} // v127
""")

# ============ D) IADE ============
rep("""    <div class="field"><label>Not</label><input id="mp-note"></div>
""",
"""      <label id="mp-refund-wrap" style="display:flex;align-items:center;gap:6px;margin:4px 0 8px;font-size:13px;cursor:pointer;"><input type="checkbox" id="mp-refund" onchange="onRefundToggle()" style="width:auto;"> ↩️ İade kaydı (para çıkışı — tutar negatif yazılır, açıklama zorunlu)</label>
    <div class="field"><label>Not</label><input id="mp-note"></div>
""")

rep("""function onCustomPriceToggle() {
""",
"""// v127: IADE — tutar negatif kaydedilir, kalan bakiye artar; tavan/paket mantigi calismaz
function onRefundToggle() {
  const cb = document.getElementById('mp-refund');
  const amountEl = document.getElementById('mp-amount');
  const info = document.getElementById('mp-discount-info');
  if (cb && cb.checked) {
    amountEl.readOnly = false; amountEl.style.background = '#FDECEA';
    if (info) info.textContent = '↩️ İade: girdiğin tutar NEGATİF kaydedilir; üyenin kalan bakiyesi artar. Açıklama (Not) zorunlu.';
  } else {
    amountEl.style.background = '';
    setupPayPriceLock(document.getElementById('mp-member').value, document.getElementById('mp-id').value, document.getElementById('mp-group').value);
    if (info) info.textContent = '';
  }
  renderTaxBreakdown();
  renderPayBalanceStrip();
}
function onCustomPriceToggle() {
""")

rep("""  const pcb = document.getElementById('mp-prorate');
  if (pcb) { pcb.checked = false; document.getElementById('mp-prorate-fields').style.display='none'; document.getElementById('mp-prorate-info').textContent=''; }
""",
"""  const pcb = document.getElementById('mp-prorate');
  if (pcb) { pcb.checked = false; document.getElementById('mp-prorate-fields').style.display='none'; document.getElementById('mp-prorate-info').textContent=''; }
  const rcb = document.getElementById('mp-refund'); // v127: iade kutusunu sifirla / duzenlemede esitle
  if (rcb) { rcb.checked = false; const __eP = editId ? state.payments.find(p=>p.id===editId) : null; if (__eP && (+__eP.amount < 0 || __eP.refund)) { rcb.checked = true; document.getElementById('mp-amount').value = Math.abs(+__eP.amount || 0); document.getElementById('mp-amount').readOnly = false; } }
""")

rep("""  {
    const __pmMonth = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7);
    const __cap = paymentCapCheck(memberId, groupId, __pmMonth, amount, id || '');
""",
"""  const isRefund = !!(document.getElementById('mp-refund') && document.getElementById('mp-refund').checked); // v127
  if (isRefund && !(amount > 0)) { markInvalid('mp-amount', 'İade tutarı 0\\'dan büyük olmalı'); return; }
  if (isRefund && !note) { markInvalid('mp-note', 'İade için açıklama zorunlu'); alert('⛔ İade kaydı için Not alanına kısa bir açıklama yaz (örn. "2 ders iadesi").'); return; }
  if (!isRefund) {
    const __pmMonth = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7);
    const __cap = paymentCapCheck(memberId, groupId, __pmMonth, amount, id || '');
""")

rep("""  const data = buildPaymentRecord(id, memberId, groupId, date, pkgObj, sessions, listPrice, amount, method, campaignId, campaignName, note, partial);
""",
"""  const data = buildPaymentRecord(id, memberId, groupId, date, pkgObj, sessions, listPrice, (isRefund ? -Math.abs(amount) : amount), method, campaignId, campaignName, note, partial);
""")

rep("""  data.packageMonth = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7);
""",
"""  data.packageMonth = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7);
  if (isRefund) { data.refund = true; data.listPrice = 0; data.discount = 0; data.sessions = 0; } // v127
""")

rep("""  if (groupId && !id && !partial) ensureGroupPackageStart(groupId, __pkgStart);
""",
"""  if (groupId && !id && !partial && !isRefund) ensureGroupPackageStart(groupId, __pkgStart);
""")

rep("""  if (!partial) {
    if (groupId) {
""",
"""  if (!partial && !isRefund) {
    if (groupId) {
""")

rep("""  if (memberId && (data.packageMonth >= ROSTER_START_MONTH""",
"""  if (!isRefund) if (memberId && (data.packageMonth >= ROSTER_START_MONTH""")

rep("""  const groupId = document.getElementById('mp-group').value;
  if (!groupId) { alert('Grup bilgisi yok.'); return; }
""",
"""  const groupId = document.getElementById('mp-group').value;
  if (!groupId) { alert('Grup bilgisi yok.'); return; }
  if (document.getElementById('mp-refund') && document.getElementById('mp-refund').checked) { alert('↩️ İade kaydı tek üye için "Kaydet" ile yapılır (toplu değil).'); return; } // v127
""")

# ============ SURUM ============
rep('<meta name="app-version" content="2026.07.29.49">', '<meta name="app-version" content="2026.07.29.50">')
rep("const APP_VERSION = '2026.07.29.49';", "const APP_VERSION = '2026.07.29.50';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

# ============ sw.js ============
Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v126-2026-07-29-49';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v127-2026-07-29-50';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')

# ============ recover.html + kurtar.html: expenses kapsami ============
for F in ('recover.html', 'kurtar.html'):
    r = io.open(F, encoding='utf-8').read()
    r0 = len(r)
    old = "'package_types','campaigns','wa_templates','settings'];"
    assert r.count(old) == 1, F + ' SB_TABLES anchor!'
    r = r.replace(old, "'package_types','campaigns','wa_templates','settings','expenses'];")
    old2 = "(state.waTemplates||[]).forEach((w,ix)=>{const id=w.id||('wt-'+ix);rows.wa_templates[id]=w;});"
    assert r.count(old2) == 1, F + ' stateToRows anchor!'
    r = r.replace(old2, old2 + "\n  (state.expenses||[]).forEach(e=>{if(e&&e.id)rows.expenses[e.id]=e;});")
    io.open(F, 'w', encoding='utf-8').write(r)
    print('%s OK (%+d bayt)' % (F, len(r) - r0))

# recover.html rowsToState
r = io.open('recover.html', encoding='utf-8').read()
old3 = "st.waTemplates=Object.values(by('wa_templates'));"
assert r.count(old3) == 1, 'recover rowsToState anchor!'
r = r.replace(old3, old3 + "\n  st.expenses=Object.values(by('expenses'));")
io.open('recover.html', 'w', encoding='utf-8').write(r)
print('recover.html rowsToState OK')

# kurtar.html rowsMapToState cagrisi
r = io.open('kurtar.html', encoding='utf-8').read()
old4 = "wa_templates:by('wa_templates'),settings:by('settings')})"
assert r.count(old4) == 1, 'kurtar map anchor!'
r = r.replace(old4, "wa_templates:by('wa_templates'),settings:by('settings'),expenses:by('expenses')})")
io.open('kurtar.html', 'w', encoding='utf-8').write(r)
print('kurtar.html map OK')
