# -*- coding: utf-8 -*-
# v196 ADIM 1 — FİNANS ÇEKİRDEĞİ: hesaplar (Kasa, Banka, N kart) + türetilmiş hareketler + bakiye + Finans sekmesi
# (Ödemeler → Finans, alt sekmeler) + nakit hareketi (virman / ortak çekimi / sermaye / mutabakat / kart borcu ödemesi)
# + gider girişinde hesap + tik ödemesinde "Nakit mi IBAN mı" + Kredi Kartı seçeneği gizli + isteğe bağlı bulut tablosu `finance`.
# Tasarım: _dev/_docs/finans-tasarim-2026-10.md (Kerem 17.10: gerçek bakiye, tek cari, Ödemeler→Finans, otomatik, 2 ortak, şahıs şirketi)
import io, re
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:120])
    s = s.replace(old, new)

# ───────────────────────── CSS ─────────────────────────
rep("""  body.pl-staff-view .pl-owner-only { display:none !important; }""",
"""  body.pl-staff-view .pl-owner-only { display:none !important; }
  /* v196 FİNANS */
  .fin-tabs { display:flex; gap:6px; flex-wrap:wrap; }
  .fin-tab { padding:7px 12px; border-radius:9px; border:1px solid var(--border); background:var(--card); color:var(--muted); cursor:pointer; font-weight:600; font-size:13px; white-space:nowrap; }
  .fin-tab.active { background:var(--acc-soft, #e6f4f1); color:var(--acc-strong, var(--p2)); border-color:transparent; }
  .fin-tab:not(.active):hover { color:var(--text); }
  .fin-panel { display:none; } .fin-panel.active { display:block; }
  .fin-bal { display:flex; gap:8px; flex-wrap:wrap; margin:8px 0; }
  .fin-bal .chip { padding:6px 10px; border-radius:9px; border:1px solid var(--border); background:var(--card); font-size:13px; }
  .fin-bal .chip b { font-variant-numeric: tabular-nums; }
  .fin-bal .chip.neg b { color: var(--bad); }
  .fin-in { color: var(--ok); font-weight:700; } .fin-out { color: var(--bad); font-weight:700; }
  .fin-warn { margin:8px 0; padding:8px 10px; border-radius:9px; background:#FFF3E0; color:#7a4a00; border:1px solid #F0D9B5; font-size:12.5px; }
  .fin-note { font-size:12px; color:var(--muted); margin:4px 0 8px; }
  .fin-table td, .fin-table th { font-size:13px; }
  .fin-acc-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:8px 0; border-bottom:1px dashed var(--border); }
  @media (max-width: 640px) { .fin-tabs { flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:2px; } .fin-tab { padding:7px 10px; font-size:12.5px; } }""")

# ───────────────────────── NAV ─────────────────────────
rep("""<button class="tab" data-page="payments">💳 Ödemeler</button>""", """<button class="tab" data-page="payments">💰 Finans</button>""")
rep("""<button class="bnav-item" data-bnav="payments" onclick="switchPage('payments')"><span class="bnav-ic">💳</span>Ödeme</button>""",
    """<button class="bnav-item" data-bnav="payments" onclick="switchPage('payments')"><span class="bnav-ic">💰</span>Finans</button>""")
rep("""  { key:'payments',  label:'💳 Ödemeler', money:true },""", """  { key:'payments',  label:'💰 Finans (Ödemeler)', money:true },""")

# ───────────────────────── SAYFA: Ödemeler → Finans (alt sekmeler) ─────────────────────────
rep("""<section class="page" id="page-payments">
  <div class="card">
    <div class="toolbar">
      <button class="btn" onclick="openPaymentModal()">+ Ödeme Kaydet</button>
      <input type="month" id="pay-month" onchange="renderPayments()">
      <select id="pay-member-filter" onchange="renderPayments()">
        <option value="">Tüm üyeler</option>
      </select>
    </div>
    <div id="pay-summary" class="grid-stats"></div>""",
"""<section class="page" id="page-payments">
  <div class="card" style="padding:10px 12px;">
    <div class="fin-tabs" id="fin-tabs">
      <button class="fin-tab pl-owner-only" data-fin="cash" onclick="finSwitchTab196('cash')">💰 Nakit Akışı</button>
      <button class="fin-tab active" data-fin="moves" onclick="finSwitchTab196('moves')">🔁 Hareketler</button>
      <button class="fin-tab pl-owner-only" data-fin="cari" onclick="finSwitchTab196('cari')">👥 Cari</button>
      <button class="fin-tab pl-owner-only" data-fin="dues" onclick="finSwitchTab196('dues')">⏰ Vadeler</button>
      <button class="fin-tab pl-owner-only" data-fin="reports" onclick="finSwitchTab196('reports')">📈 Raporlar</button>
      <button class="fin-tab pl-owner-only" data-fin="accounts" onclick="finSwitchTab196('accounts')">🏦 Hesaplar</button>
    </div>
    <div id="fin-cloud-warn" class="fin-warn pl-owner-only" style="display:none;"></div>
  </div>
  <div class="fin-panel" id="fin-panel-cash"><div class="card"><div id="fin-cash-body"></div></div></div>
  <div class="fin-panel active" id="fin-panel-moves">
  <div class="card">
    <div class="toolbar">
      <button class="btn" onclick="openPaymentModal()">+ Ödeme Kaydet</button>
      <button class="btn secondary pl-owner-only" onclick="openFinMoveModal196()" title="Virman, ortak çekimi, sermaye, mutabakat, kart borcu ödemesi">+ Nakit Hareketi</button>
      <input type="month" id="pay-month" onchange="renderPayments()">
      <select id="pay-member-filter" onchange="renderPayments()">
        <option value="">Tüm üyeler</option>
      </select>
    </div>
    <div id="fin-balance-line" class="fin-bal pl-owner-only"></div>
    <details id="fin-moves-card" class="pl-owner-only" open style="margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:10px;">
      <summary style="cursor:pointer;font-weight:700;">🔁 Hesap Hareketleri <span id="fin-moves-sub" style="font-weight:400;color:var(--muted);margin-left:6px;"></span></summary>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin:8px 0;">
        <select id="fin-move-acc" onchange="renderFinMoves196()" style="max-width:240px;"><option value="">Tüm hesaplar</option></select>
        <select id="fin-move-type" onchange="renderFinMoves196()" style="max-width:240px;"><option value="">Tüm türler</option><option value="tahsilat">Üye tahsilatı</option><option value="iade">İade</option><option value="gider">Gider</option><option value="hoca">Hoca ödemesi</option><option value="virman">Virman</option><option value="cekim">Ortak çekimi</option><option value="sermaye">Sermaye</option><option value="mutabakat">Mutabakat</option><option value="kart">Kart borcu ödemesi</option></select>
      </div>
      <div id="fin-unassigned" style="display:none;" class="fin-warn"></div>
      <div class="table-wrap"><table class="resp-cards fin-table"><thead><tr><th>Tarih</th><th>Hesap</th><th>Tür</th><th>Kim / Ne</th><th>Tutar</th><th>Not</th><th>İşlem</th></tr></thead><tbody id="fin-moves-tbody"></tbody></table></div>
    </details>
    <div id="pay-summary" class="grid-stats"></div>""")

rep("""        <input id="exp-note" placeholder="Not (örn. Temmuz kirası)" style="flex:1;min-width:140px;">""",
"""        <select id="exp-acc" class="pl-owner-only" title="Hangi hesaptan ödendi"></select>
        <input id="exp-note" placeholder="Not (örn. Temmuz kirası)" style="flex:1;min-width:140px;">""")

rep("""        <tbody id="payments-tbody"></tbody>
      </table>
    </div>
  </div>
</section>

<!-- REPORTS -->""",
"""        <tbody id="payments-tbody"></tbody>
      </table>
    </div>
  </div>
  </div>
  <div class="fin-panel" id="fin-panel-cari"><div class="card"><div id="fin-cari-body"></div></div></div>
  <div class="fin-panel" id="fin-panel-dues"><div class="card"><div id="fin-dues-body"></div></div></div>
  <div class="fin-panel" id="fin-panel-reports"><div class="card"><div id="fin-reports-body"></div></div></div>
  <div class="fin-panel" id="fin-panel-accounts"><div class="card"><h2>🏦 Hesaplar</h2><div class="fin-note">Kasa ve Banka sabittir; kart hesaplarını (her ortağın her kartı ayrı) buradan eklersin. Bakiye hiçbir yerde saklanmaz: açılış bakiyesi + açılış tarihinden sonraki hareketler.</div><div id="fin-accounts-body"></div></div></div>
</section>

<!-- REPORTS -->""")

# Ödeme penceresi: yalnız Nakit / IBAN (eski kayıt düzenlenirken yöntemi dinamik eklenir)
rep("""          <option>Nakit</option><option>IBAN</option><option>Kredi Kartı</option><option>Diğer</option>""",
    """          <option>Nakit</option><option>IBAN</option>""")
rep("""      document.getElementById('mp-method').value = pay.method||'Nakit';""",
"""      { const __ms = document.getElementById('mp-method'); const __mv = pay.method || 'Nakit'; if (__ms && ![...__ms.options].some(o => o.value === __mv)) { const __o = document.createElement('option'); __o.textContent = __mv; __ms.appendChild(__o); } } // v196: eski yöntem (Kredi Kartı/Diğer) yalnız düzenlemede görünür
      document.getElementById('mp-method').value = pay.method||'Nakit';""")
rep("""    <div class="field"><label>Yöntem</label><select id="ip-method"><option>Nakit</option><option>IBAN</option><option>Kredi Kartı</option></select></div>""",
    """    <div class="field"><label>Yöntem</label><select id="ip-method"><option>Nakit</option><option>IBAN</option></select></div>""")

# ───────────────────────── STATE ─────────────────────────
rep("""let state = load();""",
"""// v196 FİNANS sabitleri — load() bunları kullanır, bu yüzden state'ten ÖNCE (var: TDZ yok)
var FIN_COLLS196 = { finAccounts:'account', finMoves:'move', finCounterparties:'counterparty', finDues:'due', finTemplates:'template', finRules:'rule', finImports:'import' };
var FIN_ACC_CASH = 'acc-cash', FIN_ACC_BANK = 'acc-bank';
var FIN_MOVE_OPS196 = { transfer:'Virman', cardpay:'Kart borcu ödemesi', draw:'Ortak çekimi', capital:'Sermaye', reconcile:'Mutabakat' };
let state = load();""")
rep("""function load() {
  let raw = '';
  try { raw = localStorage.getItem('pilateria') || ''; } catch(e) { raw = ''; }
  if (!raw) return structuredClone(DEFAULT_STATE);""",
"""// v196 FİNANS normalize — load() açılışta kullanır (sabitler `let state = load()` satırından ÖNCE tanımlı)
function __finNormalize196(st) {
  if (!st || typeof st !== 'object') return;
  Object.keys(FIN_COLLS196).forEach(function(k){ if (!Array.isArray(st[k])) st[k] = []; });
  st.settings = st.settings || {};
  if (!st.settings.finance || typeof st.settings.finance !== 'object') st.settings.finance = {};
  const fs = st.settings.finance;
  if (!Array.isArray(fs.partners)) fs.partners = [];
  fs.safetyMin = +fs.safetyMin || 0;
  if (!st.finAccounts.some(function(a){ return a && a.id === FIN_ACC_CASH; })) st.finAccounts.push({ id: FIN_ACC_CASH, kind: 'account', type: 'cash', name: 'Kasa', bank: '', owner: '', openingDate: '', openingBalance: 0, active: true });
  if (!st.finAccounts.some(function(a){ return a && a.id === FIN_ACC_BANK; })) st.finAccounts.push({ id: FIN_ACC_BANK, kind: 'account', type: 'bank', name: 'Banka', bank: '', owner: '', openingDate: '', openingBalance: 0, active: true });
  st.finAccounts.forEach(function(a){ if (!a) return; a.kind = 'account'; if (a.id === FIN_ACC_CASH) a.type = 'cash'; else if (a.id === FIN_ACC_BANK) a.type = 'bank'; else if (!a.type) a.type = 'card'; if (a.active === undefined) a.active = true; });
}
function load() {
  let raw = '';
  try { raw = localStorage.getItem('pilateria') || ''; } catch(e) { raw = ''; }
  if (!raw) { const __d = structuredClone(DEFAULT_STATE); try { __finNormalize196(__d); } catch(e) {} return __d; }""")

rep("""  expenses: [], // v127: giderler [{id,date,category,amount,note}]""",
"""  expenses: [], // v127: giderler [{id,date,category,amount,note}] · v196: +accountId, paidDate, counterpartyId, dueId, source, fingerprint, business
  finAccounts: [],       // v196: {id, kind:'account', type:'cash'|'bank'|'card', name, bank, owner, openingDate, openingBalance, cutoffDay, dueDay, active}
  finMoves: [],          // v196: {id, kind:'move', op:'transfer'|'cardpay'|'draw'|'capital'|'reconcile', date, amount, fromAccountId, toAccountId, accountId, partner, note, actual, computed}
  finCounterparties: [], // v196: dış cariler
  finDues: [],           // v196: vade kalemleri
  finTemplates: [],      // v196: tekrar eden kalem şablonları
  finRules: [],          // v196: kart ekstresi kategori kuralları
  finImports: [],        // v196: işlenmiş ekstreler (parmak izleri)""")
rep("""    if (!Array.isArray(merged.instructorPayouts)) merged.instructorPayouts = [];""",
"""    if (!Array.isArray(merged.instructorPayouts)) merged.instructorPayouts = [];
    try { __finNormalize196(merged); } catch(e) {} // v196""")
rep("""  if (!Array.isArray(s.expenses)) s.expenses = []; // v127: eski kayitli durumlarda gider dizisini tamamla""",
"""  if (!Array.isArray(s.expenses)) s.expenses = []; // v127: eski kayitli durumlarda gider dizisini tamamla
  try { __finNormalize196(s); } catch(e) {} // v196""")
rep("""    const colls = ['members','groups','lessons','payments','instructors','packageTypes','campaigns','waTemplates','expenses','instructorPayouts'];""",
    """    const colls = ['members','groups','lessons','payments','instructors','packageTypes','campaigns','waTemplates','expenses','instructorPayouts','finAccounts','finMoves','finCounterparties','finDues','finTemplates','finRules','finImports'];""")
rep("""    if (t === 'expenses') return '🧾 Gider';""", """    if (t === 'expenses') return '🧾 Gider';
    if (t === 'finance') return '💰 Finans';""")

# ───────────────────────── SENKRON: isteğe bağlı `finance` tablosu ─────────────────────────
rep("""const SB_TABLES = ['members','member_finance','groups','group_finance','lessons','instructors','instructor_finance','payments','instructor_payouts','package_types','campaigns','wa_templates','settings','expenses']; // v127: expenses eklendi""",
"""const SB_TABLES = ['members','member_finance','groups','group_finance','lessons','instructors','instructor_finance','payments','instructor_payouts','package_types','campaigns','wa_templates','settings','expenses','finance']; // v127: expenses eklendi · v196: finance (isteğe bağlı)
const SB_OPTIONAL_TABLES = ['finance']; // v196: tablo kurulmamışsa açılış/tazeleme/gönderim DURMAZ, bu tablo atlanır
let __sbMissingTables = {};   // v196: tablo -> true (sunucuda yok) / false (var)
let __sbTableChecked = {};    // v196: tablo -> ilk başarılı/başarısız çekim yapıldı mı
function __sbIsMissingTable(err) { try { const c = String((err && err.code) || ''), m = String((err && err.message) || ''); return c === 'PGRST205' || c === '42P01' || /does not exist|schema cache|Could not find the table/i.test(m); } catch(e) { return false; } }""")
rep("""function __sbMergeColls() { return ['members','groups','lessons','instructors','payments','packageTypes','campaigns','expenses']; } // v127: gider kayitlari da kayit-bazli birlesir""",
    """function __sbMergeColls() { return ['members','groups','lessons','instructors','payments','packageTypes','campaigns','expenses','finAccounts','finMoves','finCounterparties','finDues','finTemplates','finRules','finImports']; } // v127: gider kayitlari da kayit-bazli birlesir · v196: finans""")
rep("""  (S.expenses || []).forEach(e => { if (e && e.id) rows.expenses[e.id] = e; }); // v127""",
"""  (S.expenses || []).forEach(e => { if (e && e.id) rows.expenses[e.id] = e; }); // v127
  Object.keys(FIN_COLLS196).forEach(k => { (S[k] || []).forEach(r => { if (r && r.id) rows.finance[r.id] = Object.assign({}, r, { kind: FIN_COLLS196[k] }); }); }); // v196: tek tablo, kind ile türlenir""")
rep("""  fresh.expenses = Object.values(by('expenses')); // v127""",
"""  fresh.expenses = Object.values(by('expenses')); // v127
  { const __fr = Object.values(by('finance')); // v196: tablo yokken ya da bulutta HENÜZ satır yokken yerel finans verisi korunur (bulut boşsa gölge boşaltılır → hepsi gönderilir)
    if (__sbMissingTables.finance || !__fr.length) { Object.keys(FIN_COLLS196).forEach(k => { fresh[k] = JSON.parse(JSON.stringify((typeof state !== 'undefined' && state && state[k]) || [])); }); }
    else { Object.keys(FIN_COLLS196).forEach(k => { fresh[k] = __fr.filter(r => r && r.kind === FIN_COLLS196[k]); }); } }
  try { __finNormalize196(fresh); } catch(e) {}""")
rep("""  SB_TABLES.forEach(t => { __sbShadow[t] = {}; for (const id in rows[t]) __sbShadow[t][id] = JSON.stringify(rows[t][id]); });""",
    """  SB_TABLES.forEach(t => { __sbShadow[t] = {}; if (__sbMissingTables[t]) return; /* v196: sunucuda olmayan tablo gölgeye girmez — kurulunca hepsi gönderilir */
    if (SB_OPTIONAL_TABLES.indexOf(t) !== -1 && (__sbCloudCounts[t] || 0) === 0 && Object.keys(rows[t] || {}).length) return; /* v196: bulut BOŞ, yerelde satır var → gölge boş kalır, ilk gönderimde hepsi gider */
    for (const id in rows[t]) __sbShadow[t][id] = JSON.stringify(rows[t][id]); });""")
rep("""    const r = await q;
    if (r && r.error) return { data: null, error: r.error };""",
"""    const r = await q;
    if (r && r.error) {
      if (SB_OPTIONAL_TABLES.indexOf(t) !== -1 && __sbIsMissingTable(r.error)) { // v196: isteğe bağlı tablo sunucuda yok → boş say, yükleme DURMAZ
        if (!__sbMissingTables[t]) { try { __trace('ℹ️ Bulut tablosu kurulmamış: ' + t + ' — bu bölüm yerelde bekliyor (SQL: _dev/' + t + '-setup.sql)'); } catch(e) {} }
        __sbMissingTables[t] = true; __sbTableChecked[t] = true;
        return { data: [], error: null, missing: true };
      }
      return { data: null, error: r.error };
    }""")
rep("""  __sbCloudCounts[t] = rows.length;
  return { data: rows, error: null };""",
"""  __sbCloudCounts[t] = rows.length;
  if (SB_OPTIONAL_TABLES.indexOf(t) !== -1) { if (__sbMissingTables[t]) { try { __trace('✅ Bulut tablosu kuruldu: ' + t + ' — bekleyen kayıtlar gönderilecek'); } catch(e) {} } __sbMissingTables[t] = false; __sbTableChecked[t] = true; }
  return { data: rows, error: null };""")
rep("""  for (const t of SB_TABLES) {
    const ups = [], dels = [], upJson = {}, __ghost = [];""",
"""  for (const t of SB_TABLES) {
    if (__sbMissingTables[t]) continue; // v196: sunucuda olmayan isteğe bağlı tablo — gönderim atlanır, diğerleri etkilenmez, gölge değişmez
    const ups = [], dels = [], upJson = {}, __ghost = [];""")
rep("""      const r = await sbClient.from(t).upsert(part);
      if (r.error) { alert('Taşıma hatası (' + t + '): ' + r.error.message); try { sbSubscribeAll(); } catch(e){} return; }""",
"""      const r = await sbClient.from(t).upsert(part);
      if (r.error && SB_OPTIONAL_TABLES.indexOf(t) !== -1 && __sbIsMissingTable(r.error)) { __sbMissingTables[t] = true; __sbTableChecked[t] = true; break; } // v196: isteğe bağlı tablo yok → atla
      if (r.error) { alert('Taşıma hatası (' + t + '): ' + r.error.message); try { sbSubscribeAll(); } catch(e){} return; }""")
rep("""  else if (t === 'expenses') { state.expenses = state.expenses || []; upsert(state.expenses, S('expenses')); } // v127""",
"""  else if (t === 'expenses') { state.expenses = state.expenses || []; upsert(state.expenses, S('expenses')); } // v127
  else if (t === 'finance') { // v196: kind'e göre koleksiyon
    const d = S('finance'); const colls = Object.keys(FIN_COLLS196);
    if (d == null) { colls.forEach(k => { state[k] = (state[k] || []).filter(x => String(x && x.id) !== String(id)); }); }
    else { const k = colls.find(c => FIN_COLLS196[c] === d.kind); if (k) { state[k] = state[k] || []; upsert(state[k], d); } }
  }""")
rep("""    el.innerHTML = '☁️ Bulut senkron aktif' + (last ? ' · son gönderim: ' + escapeHtml(String(last)) : '') + __cnt192;
    __mirror193();""",
"""    el.innerHTML = '☁️ Bulut senkron aktif' + (last ? ' · son gönderim: ' + escapeHtml(String(last)) : '') + __cnt192 + (__sbMissingTables.finance ? ' · <b style="color:#b26a00;">Finans bulut tablosu kurulmamış</b>' : '');
    __mirror193();""")

# ───────────────────────── TİK ÖDEMESİ: Nakit mi IBAN mı ─────────────────────────
rep("""    if (!confirm(`"${m.name}" ${ay}: ${money(__paidSum)} ₺ ödendi, kalan ${money(__kal)} ₺.\\n\\nKalanı da ÖDENDİ olarak kaydedeyim mi?\\n(Vazgeç = değişiklik yok; taksitler Ödemeler sayfasından da girilebilir)`)) return;""",
"""    const __msg196a = `"${m.name}" ${ay}: ${money(__paidSum)} ₺ ödendi, kalan ${money(__kal)} ₺.\\n\\nKalanı da ÖDENDİ olarak kaydedeyim mi?\\n(Vazgeç = değişiklik yok; taksitler Finans sayfasından da girilebilir)`;
    const __mth196a = finActive196() ? await __finAskMethod196(__msg196a) : (confirm(__msg196a) ? 'Nakit' : null); if (!__mth196a) return; // v196 (finans pasifken eski eşzamanlı confirm yolu)""")
rep("""    const __rec2 = buildPaymentRecord('', memberId, groupId||'', todayISO(), __pk0, (memberEffectiveQuota(memberId, ay, groupId || '') || (+__pk0.sessions||8)), __kal, __kal, 'Nakit', '', '', 'Tik ile kalan tahsil'""",
    """    const __rec2 = buildPaymentRecord('', memberId, groupId||'', todayISO(), __pk0, (memberEffectiveQuota(memberId, ay, groupId || '') || (+__pk0.sessions||8)), __kal, __kal, __mth196a, '', '', 'Tik ile kalan tahsil'""")
rep("""      if (!confirm(`"${m.name}" için ${ay} ayına ${money(amount)} ₺ ödeme kaydı oluşturulacak.${__n181 ? '\\n\\n' + __n181 + '\\n\\n' : ' '}Devam?`)) return; }""",
"""      const __msg196 = `"${m.name}" için ${ay} ayına ${money(amount)} ₺ ödeme kaydı oluşturulacak.${__n181 ? '\\n\\n' + __n181 + '\\n\\n' : ' '}Devam?`;
      var __mth196 = finActive196() ? await __finAskMethod196(__msg196) : (confirm(__msg196) ? 'Nakit' : null); if (!__mth196) return; } // v196: hesap (Nakit→Kasa / IBAN→Banka); finans pasifken eski eşzamanlı confirm""")
rep("""    const rec = buildPaymentRecord('', memberId, groupId||'', today, pkgObj, sessions, amount, amount, 'Nakit', '', '', 'Tik ile kaydedildi' + (__psT171 ? ' (ayrılan üye payı)' : ''), false);""",
    """    const rec = buildPaymentRecord('', memberId, groupId||'', today, pkgObj, sessions, amount, amount, __mth196, '', '', 'Tik ile kaydedildi' + (__psT171 ? ' (ayrılan üye payı)' : ''), false);""")

# ───────────────────────── GİDER: hesap + geri al ─────────────────────────
rep("""  state.expenses.push({ id: uid(), date: date, category: cat, amount: Math.round(amount*100)/100, note: note, resmi: resmi, kdvRate: resmi ? ekdv : 0 });
  save();""",
"""  const __acc196 = ((document.getElementById('exp-acc')||{}).value) || ''; // v196: hangi hesaptan ödendi
  if (finActive196() && !__acc196) { alert('Hangi hesaptan ödendiğini seç (Kasa / Banka / kart).'); return; }
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış — Ayarlar/Finans uyarısındaki SQL önce çalıştırılmalı.'); return; }
  __undoSnapshot('Gider: ' + cat + ' ' + money(amount) + ' ₺');
  state.expenses.push({ id: uid(), date: date, category: cat, amount: Math.round(amount*100)/100, note: note, resmi: resmi, kdvRate: resmi ? ekdv : 0, accountId: __acc196, source: 'manual' });
  try { localStorage.setItem('pilateria_fin_last_acc', __acc196); } catch(e) {}
  save();""")
rep("""  state.expenses = (state.expenses||[]).filter(x => !(x && x.id === id));
  save();
  renderExpenses();""",
"""  __undoSnapshot('Gider sil: ' + (e.category||'') + ' ' + money(+e.amount||0) + ' ₺'); // v196
  state.expenses = (state.expenses||[]).filter(x => !(x && x.id === id));
  save();
  renderExpenses();""")
rep("""  const dEl = document.getElementById('exp-date'); if (dEl && !dEl.value) dEl.value = todayISO();
  const ay = monthISO || ((document.getElementById('pay-month')||{}).value) || currentMonth();""",
"""  const dEl = document.getElementById('exp-date'); if (dEl && !dEl.value) dEl.value = todayISO();
  try { finFillAccountSelect196(document.getElementById('exp-acc'), 'Hesap seç…'); } catch(e) {} // v196
  const ay = monthISO || ((document.getElementById('pay-month')||{}).value) || currentMonth();""")
rep("""    <span class="badge" style="background:#ECEFF1;color:#37474F;">${escapeHtml(e.category||'Diğer')}</span>${e.resmi ? `<span title="Faturalı/resmi${(+e.kdvRate||0) > 0 ? ' — KDV %' + (+e.kdvRate) : ''}">🧾</span>` : ''}""",
"""    <span class="badge" style="background:#ECEFF1;color:#37474F;">${escapeHtml(e.category||'Diğer')}</span>${e.resmi ? `<span title="Faturalı/resmi${(+e.kdvRate||0) > 0 ? ' — KDV %' + (+e.kdvRate) : ''}">🧾</span>` : ''}${e.accountId ? `<span class="badge" title="Ödendiği hesap">${escapeHtml(finAccountLabel196(e.accountId))}</span>` : ''}""")

# ───────────────────────── FİNANS ÇEKİRDEĞİ + EKRANLAR ─────────────────────────
rep("""function renderPayments() {
  // member filter options""",
r"""// ═══════════════════════ v196 FİNANS — ÇEKİRDEK ═══════════════════════
// İLKE: bakiye SAKLANMAZ; her hesap için açılış bakiyesi + açılış tarihinden sonraki hareketler. Hareketler TÜRETİLİR:
// üye ödemeleri (Nakit→Kasa, IBAN→Banka), ödenmiş giderler (accountId), hoca ödemeleri (yöntem), nakit hareketleri (finMoves).
function finAccounts196(includeInactive) {
  __finNormalize196(state);
  const order = { cash: 0, bank: 1, card: 2 };
  return state.finAccounts.filter(function(a){ return a && (includeInactive || a.active !== false); }).slice()
    .sort(function(a, b){ return ((order[a.type] !== undefined ? order[a.type] : 9) - (order[b.type] !== undefined ? order[b.type] : 9)) || String(a.name || '').localeCompare(String(b.name || ''), 'tr'); });
}
function finAccount196(id) { return (state.finAccounts || []).find(function(a){ return a && a.id === id; }) || null; }
function finAccountLabel196(id) { const a = finAccount196(id); if (!a) return id ? '(silinmiş hesap)' : '—'; return (a.type === 'cash' ? '💵 ' : a.type === 'bank' ? '🏦 ' : '💳 ') + (a.name || ''); }
function finAccountForMethod196(method) { const m = String(method || '').trim(); if (m === 'Nakit') return FIN_ACC_CASH; if (m === 'IBAN') return FIN_ACC_BANK; return ''; }
function finActive196() { const a = finAccount196(FIN_ACC_CASH), b = finAccount196(FIN_ACC_BANK); return !!((a && a.openingDate) || (b && b.openingDate)); }
function finStartDate196() { let d = ''; (state.finAccounts || []).forEach(function(a){ if (a && a.openingDate && (!d || a.openingDate < d)) d = a.openingDate; }); return d; }
// Bulut tablosu hazır mı? (SUPABASE_MODE + istemci varken tablo sunucuda bulunana kadar finans YAZIMI kapalı — yerel-tek veri doğmaz, kaybolmaz)
function finCloudReady196() {
  try { if (!SUPABASE_MODE || !sbClient) return true; if (__sbMissingTables.finance) return false; return true; } catch(e) { return true; }
}
function finFillAccountSelect196(sel, placeholder, keepValue) {
  if (!sel) return;
  const cur = keepValue !== undefined ? keepValue : (sel.value || (function(){ try { return localStorage.getItem('pilateria_fin_last_acc') || ''; } catch(e) { return ''; } })());
  sel.innerHTML = (placeholder ? '<option value="">' + escapeHtml(placeholder) + '</option>' : '') + finAccounts196().map(function(a){ return '<option value="' + a.id + '">' + escapeHtml(finAccountLabel196(a.id)) + (a.owner ? ' · ' + escapeHtml(a.owner) : '') + '</option>'; }).join('');
  if (cur && [...sel.options].some(function(o){ return o.value === cur; })) sel.value = cur;
}
// Tik ile ödeme: finans etkinse "Nakit mi IBAN mı" (hesap); değilse eski confirm. Dönüş: 'Nakit' | 'IBAN' | null
async function __finAskMethod196(msg) {
  if (!finActive196()) return confirm(msg) ? 'Nakit' : null;
  const ans = await plDialog({ msg: msg + '\n\nPara nasıl geldi?', buttons: [{ label: '💵 Nakit (Kasa)', value: 'Nakit', cls: 'ok' }, { label: '🏦 IBAN (Banka)', value: 'IBAN' }, { label: 'Vazgeç', value: null, cls: 'secondary' }], escValue: null });
  if (ans === true) return 'Nakit';
  return (ans === 'Nakit' || ans === 'IBAN') ? ans : null;
}
// TÜRETİLMİŞ HAREKETLER — {id, src, srcId, date, accountId, dir(+1 giriş / -1 çıkış), amount(>0), type, who, note}
function finMovements196(opt) {
  opt = opt || {};
  const out = [];
  const accs = {}; (state.finAccounts || []).forEach(function(a){ if (a) accs[a.id] = a; });
  const finStart = finStartDate196();
  const r2 = function(x){ return Math.round((+x || 0) * 100) / 100; };
  const push = function(o) {
    if (!o.date) return;
    if (!o.accountId || !accs[o.accountId]) { if (opt.withUnassigned && finStart && o.date >= finStart) { o.unassigned = true; out.push(o); } return; }
    const a = accs[o.accountId]; if (!a.openingDate || o.date < a.openingDate) return;
    out.push(o);
  };
  (state.payments || []).forEach(function(p){
    if (!p || !p.id) return; const amt = r2(p.amount); if (!amt) return;
    push({ id: 'pay:' + p.id, src: 'payment', srcId: p.id, date: String(p.date || '').slice(0, 10), accountId: finAccountForMethod196(p.method), dir: amt > 0 ? 1 : -1, amount: Math.abs(amt), type: amt > 0 ? 'tahsilat' : 'iade', who: memberName(p.memberId) + (p.groupId ? ' (grup)' : ''), note: (p.pkgName ? p.pkgName + (p.packageMonth ? ' · ' + p.packageMonth : '') : '') + (p.note ? ' — ' + p.note : ''), method: p.method || '' });
  });
  (state.expenses || []).forEach(function(e){
    if (!e || !e.id) return; if (e.status === 'open') return; if (e.business === false) return; const amt = r2(e.amount); if (!amt) return;
    push({ id: 'exp:' + e.id, src: 'expense', srcId: e.id, date: String(e.paidDate || e.date || '').slice(0, 10), accountId: e.accountId || '', dir: amt > 0 ? -1 : 1, amount: Math.abs(amt), type: 'gider', who: (e.category || 'Diğer') + (e.counterpartyId ? ' · ' + finCounterpartyName196(e.counterpartyId) : ''), note: e.note || '' });
  });
  (state.instructorPayouts || []).forEach(function(po){
    if (!po || !po.id) return; const amt = r2(po.amount); if (!amt) return;
    push({ id: 'po:' + po.id, src: 'payout', srcId: po.id, date: String(po.paidDate || '').slice(0, 10), accountId: finAccountForMethod196(po.method), dir: amt > 0 ? -1 : 1, amount: Math.abs(amt), type: 'hoca', who: instructorName(po.instructorId) || 'Hoca', note: (po.year && po.month ? po.year + '-' + String(po.month).padStart(2, '0') + ' ' : '') + (po.note || ''), method: po.method || '' });
  });
  (state.finMoves || []).forEach(function(mv){
    if (!mv || !mv.id) return; const amt = r2(mv.amount); const d = String(mv.date || '').slice(0, 10); const nt = mv.note || '';
    if (mv.op === 'transfer' || mv.op === 'cardpay') {
      if (!amt) return; const tp = mv.op === 'cardpay' ? 'kart' : 'virman'; const lbl = FIN_MOVE_OPS196[mv.op];
      push({ id: 'mv:' + mv.id + ':out', src: 'move', srcId: mv.id, date: d, accountId: mv.fromAccountId, dir: -1, amount: Math.abs(amt), type: tp, who: lbl + ' → ' + finAccountLabel196(mv.toAccountId), note: nt });
      push({ id: 'mv:' + mv.id + ':in', src: 'move', srcId: mv.id, date: d, accountId: mv.toAccountId, dir: 1, amount: Math.abs(amt), type: tp, who: lbl + ' ← ' + finAccountLabel196(mv.fromAccountId), note: nt });
    } else if (mv.op === 'draw') { if (!amt) return; push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.fromAccountId || mv.accountId, dir: -1, amount: Math.abs(amt), type: 'cekim', who: 'Ortak çekimi' + (mv.partner ? ' · ' + mv.partner : ''), note: nt }); }
    else if (mv.op === 'capital') { if (!amt) return; push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.toAccountId || mv.accountId, dir: 1, amount: Math.abs(amt), type: 'sermaye', who: 'Sermaye' + (mv.partner ? ' · ' + mv.partner : ''), note: nt }); }
    else if (mv.op === 'reconcile') { if (!amt) return; push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.accountId, dir: amt > 0 ? 1 : -1, amount: Math.abs(amt), type: 'mutabakat', who: 'Mutabakat düzeltmesi', note: nt || ('sayım ' + money(+mv.actual || 0) + ' / uygulama ' + money(+mv.computed || 0)) }); }
  });
  out.sort(function(a, b){ return String(b.date).localeCompare(String(a.date)) || String(a.id).localeCompare(String(b.id)); });
  return out;
}
function finCounterpartyName196(id) { const c = (state.finCounterparties || []).find(function(x){ return x && x.id === id; }); return c ? (c.name || '') : ''; }
function finBalance196(accountId, asOf) {
  const a = finAccount196(accountId); if (!a || !a.openingDate) return null;
  let b = +a.openingBalance || 0;
  finMovements196().forEach(function(m){ if (m.accountId !== accountId) return; if (asOf && m.date > asOf) return; b += m.dir * m.amount; });
  return Math.round(b * 100) / 100;
}
function finBalances196(asOf) { const o = {}; finAccounts196(true).forEach(function(a){ o[a.id] = finBalance196(a.id, asOf); }); return o; }
function finUnassigned196() { return finMovements196({ withUnassigned: true }).filter(function(m){ return m.unassigned; }); }
function finCash196(asOf) { let t = 0, any = false; finAccounts196().forEach(function(a){ if (a.type === 'card') return; const b = finBalance196(a.id, asOf); if (b !== null) { t += b; any = true; } }); return any ? Math.round(t * 100) / 100 : null; }
function finCardDebt196(asOf) { let t = 0; finAccounts196().forEach(function(a){ if (a.type !== 'card') return; const b = finBalance196(a.id, asOf); if (b !== null && b < 0) t += -b; }); return Math.round(t * 100) / 100; }
function finMoneyS196(v) { return (v === null || v === undefined) ? '—' : (money(v) + ' ₺'); }
// Mutabakat: hesabın o günkü GERÇEK bakiyesi girilir; fark tek, işaretli hareketle kapanır
function finReconcile196(accountId, date, actual, note) {
  const a = finAccount196(accountId); if (!a || !a.openingDate) return null;
  const computed = finBalance196(accountId, date); const diff = Math.round(((+actual || 0) - computed) * 100) / 100;
  const mv = { id: uid(), kind: 'move', op: 'reconcile', date: date, accountId: accountId, amount: diff, actual: Math.round((+actual || 0) * 100) / 100, computed: computed, note: note || '', at: new Date().toISOString() };
  state.finMoves = state.finMoves || []; state.finMoves.push(mv); return mv;
}
// ─────────── EKRAN: alt sekmeler ───────────
let __finTab196 = (function(){ try { return localStorage.getItem('pilateria_fin_tab') || 'moves'; } catch(e) { return 'moves'; } })();
function finSwitchTab196(tab) {
  const staff = !!(typeof SUPABASE_MODE !== 'undefined' && SUPABASE_MODE && typeof __sbRole !== 'undefined' && __sbRole === 'staff');
  if (staff) tab = 'moves';
  __finTab196 = tab || 'moves';
  try { localStorage.setItem('pilateria_fin_tab', __finTab196); } catch(e) {}
  document.querySelectorAll('#fin-tabs .fin-tab').forEach(function(b){ b.classList.toggle('active', b.dataset.fin === __finTab196); });
  document.querySelectorAll('#page-payments .fin-panel').forEach(function(p){ p.classList.toggle('active', p.id === 'fin-panel-' + __finTab196); });
  renderFinance196();
}
function renderFinance196() {
  try { __finNormalize196(state); } catch(e) {}
  const staff = !!(typeof SUPABASE_MODE !== 'undefined' && SUPABASE_MODE && typeof __sbRole !== 'undefined' && __sbRole === 'staff');
  if (staff && __finTab196 !== 'moves') { __finTab196 = 'moves'; }
  document.querySelectorAll('#fin-tabs .fin-tab').forEach(function(b){ b.classList.toggle('active', b.dataset.fin === __finTab196); });
  document.querySelectorAll('#page-payments .fin-panel').forEach(function(p){ p.classList.toggle('active', p.id === 'fin-panel-' + __finTab196); });
  const warn = document.getElementById('fin-cloud-warn');
  if (warn) { const miss = !finCloudReady196(); warn.style.display = miss ? '' : 'none'; if (miss) warn.innerHTML = '⚠️ <b>Finans bulut tablosu kurulmamış.</b> Supabase → SQL Editor → <code>_dev/finance-setup.sql</code> içeriğini çalıştır (tek seferlik). Tablo kurulana kadar finans kayıtları (hesap, hareket, cari, vade) yazılamaz; üye ödemeleri ve giderler etkilenmez.'; }
  const fn = { moves: renderFinMoves196, accounts: renderFinAccounts196, cash: (typeof renderFinCash196 === 'function' ? renderFinCash196 : null), cari: (typeof renderFinCari196 === 'function' ? renderFinCari196 : null), dues: (typeof renderFinDues196 === 'function' ? renderFinDues196 : null), reports: (typeof renderFinReports196 === 'function' ? renderFinReports196 : null) }[__finTab196];
  if (fn) { try { fn(); } catch(e) { if (typeof __pilLogErr === 'function') __pilLogErr('fin:' + __finTab196, (e && e.stack) || e); } }
}
function renderFinBalanceLine196() {
  const el = document.getElementById('fin-balance-line'); if (!el) return;
  if (!finActive196()) { el.innerHTML = '<span class="fin-note">Hesaplar henüz açılmadı — 🏦 Hesaplar sekmesinden Kasa ve Banka için başlangıç tarihi ve açılış bakiyesi gir; o tarihten sonraki her ödeme ve gider hesaplara işler.</span>'; return; }
  const chips = finAccounts196().map(function(a){ const b = finBalance196(a.id); const neg = b !== null && b < 0; return '<span class="chip' + (neg ? ' neg' : '') + '" title="' + (a.openingDate ? 'açılış ' + fmtDate(a.openingDate) + ' · ' + money(+a.openingBalance || 0) + ' ₺' : 'açılış tarihi yok') + '">' + escapeHtml(finAccountLabel196(a.id)) + (a.owner ? ' <small style="color:var(--muted)">' + escapeHtml(a.owner) + '</small>' : '') + ': <b>' + (a.type === 'card' && b !== null ? (b < 0 ? 'borç ' + money(-b) + ' ₺' : money(b) + ' ₺') : finMoneyS196(b)) + '</b></span>'; });
  const cash = finCash196(); const debt = finCardDebt196();
  chips.push('<span class="chip" style="border-style:dashed;">Σ nakit: <b>' + finMoneyS196(cash) + '</b>' + (debt ? ' · kart borcu <b style="color:var(--bad)">' + money(debt) + ' ₺</b>' : '') + '</span>');
  el.innerHTML = chips.join('');
}
function renderFinMoves196() {
  try { renderFinBalanceLine196(); } catch(e) {}
  const tb = document.getElementById('fin-moves-tbody'); if (!tb) return;
  finFillAccountSelect196(document.getElementById('fin-move-acc'), 'Tüm hesaplar', (document.getElementById('fin-move-acc') || {}).value || '');
  const ay = ((document.getElementById('pay-month') || {}).value) || currentMonth();
  const accF = (document.getElementById('fin-move-acc') || {}).value || '';
  const typF = (document.getElementById('fin-move-type') || {}).value || '';
  let list = finMovements196().filter(function(m){ return String(m.date).slice(0, 7) === ay; });
  if (accF) list = list.filter(function(m){ return m.accountId === accF; });
  if (typF) list = list.filter(function(m){ return m.type === typF; });
  let tin = 0, tout = 0; list.forEach(function(m){ if (m.type === 'virman' || m.type === 'kart') return; /* hesaplar arası: dış giriş/çıkış değil */ if (m.dir > 0) tin += m.amount; else tout += m.amount; });
  const sub = document.getElementById('fin-moves-sub'); if (sub) sub.innerHTML = finActive196() ? (ay + ': giriş <span class="fin-in">+' + money(tin) + '</span> / çıkış <span class="fin-out">−' + money(tout) + '</span> ₺ · ' + list.length + ' hareket') : '';
  const un = finUnassigned196(); const unEl = document.getElementById('fin-unassigned');
  if (unEl) { unEl.style.display = un.length ? '' : 'none'; if (un.length) unEl.innerHTML = '⚠️ <b>' + un.length + ' hesapsız hareket</b> (başlangıçtan sonra, hesabı belli olmayan ödeme/gider — bakiyeye GİRMİYOR): ' + un.slice(0, 6).map(function(m){ return fmtDate(m.date) + ' ' + escapeHtml(m.who) + ' ' + money(m.amount) + ' ₺' + (m.method ? ' (' + escapeHtml(m.method) + ')' : ''); }).join(' · ') + (un.length > 6 ? ' …' : '') + ' — kaydı düzenleyip Nakit/IBAN ya da hesap seç.'; }
  if (!list.length) { tb.innerHTML = '<tr><td colspan="7"><div class="empty">' + (finActive196() ? 'Bu ayda hareket yok.' : 'Hesaplar açılınca hareketler burada listelenir.') + '</div></td></tr>'; return; }
  const typeLbl = { tahsilat: '💳 Üye tahsilatı', iade: '↩️ İade', gider: '💸 Gider', hoca: '🧑‍🏫 Hoca ödemesi', virman: '🔁 Virman', cekim: '👤 Ortak çekimi', sermaye: '🏷️ Sermaye', mutabakat: '🧮 Mutabakat', kart: '💳 Kart borcu ödemesi' };
  tb.innerHTML = list.map(function(m){
    const act = m.src === 'move' ? '<button class="btn small secondary pl-owner-only" onclick="removeFinMove196(\'' + m.srcId + '\')">Sil</button>'
      : m.src === 'payment' ? '<button class="btn small secondary" onclick="(function(){ const p = state.payments.find(x=>x.id===\'' + m.srcId + '\'); if (p) openPaymentModal(p.memberId, p.id); })()" title="Ödeme kaydını aç">Aç</button>'
      : m.src === 'expense' ? '<span class="fin-note">gider</span>' : '<span class="fin-note">Hocalar</span>';
    return '<tr><td data-label="Tarih">' + fmtDate(m.date) + '</td><td data-label="Hesap">' + escapeHtml(finAccountLabel196(m.accountId)) + '</td><td data-label="Tür">' + (typeLbl[m.type] || m.type) + '</td><td data-label="Kim / Ne" class="card-title">' + escapeHtml(m.who || '') + '</td><td data-label="Tutar"><span class="' + (m.dir > 0 ? 'fin-in' : 'fin-out') + '">' + (m.dir > 0 ? '+' : '−') + money(m.amount) + ' ₺</span></td><td data-label="Not">' + escapeHtml(m.note || '') + '</td><td class="card-actions">' + act + '</td></tr>';
  }).join('');
}
// ─────────── NAKİT HAREKETİ (virman / kart borcu / çekim / sermaye / mutabakat) ───────────
function openFinMoveModal196(op) {
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış — önce _dev/finance-setup.sql çalıştırılmalı.'); return; }
  if (!finActive196()) { alert('Önce 🏦 Hesaplar sekmesinden Kasa/Banka için başlangıç tarihi ve açılış bakiyesi gir.'); return; }
  const old = document.getElementById('modal-fin-move'); if (old) old.remove();
  const accOpts = function(sel){ return finAccounts196().map(function(a){ return '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + escapeHtml(finAccountLabel196(a.id)) + (a.owner ? ' · ' + escapeHtml(a.owner) : '') + '</option>'; }).join(''); };
  const partners = ((state.settings.finance || {}).partners || []);
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-move'; mdl.className = 'modal-bg open';
  mdl.innerHTML = '<div class="modal" style="max-width:460px;"><h3>🔁 Nakit Hareketi</h3>' +
    '<div class="field"><label>Tür</label><select id="fm-op" onchange="__finMoveFields196()">' + Object.keys(FIN_MOVE_OPS196).map(function(k){ return '<option value="' + k + '"' + (k === (op || 'transfer') ? ' selected' : '') + '>' + FIN_MOVE_OPS196[k] + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Tarih</label><input type="date" id="fm-date" value="' + todayISO() + '"></div>' +
    '<div class="field" id="fm-from-wrap"><label>Çıkan hesap</label><select id="fm-from">' + accOpts(FIN_ACC_CASH) + '</select></div>' +
    '<div class="field" id="fm-to-wrap"><label>Giren hesap</label><select id="fm-to">' + accOpts(FIN_ACC_BANK) + '</select></div>' +
    '<div class="field" id="fm-acc-wrap" style="display:none;"><label>Hesap</label><select id="fm-acc">' + accOpts(FIN_ACC_CASH) + '</select></div>' +
    '<div class="field" id="fm-amount-wrap"><label>Tutar (₺)</label><input type="number" id="fm-amount" min="0" step="0.01" placeholder="₺"></div>' +
    '<div class="field" id="fm-actual-wrap" style="display:none;"><label>Gerçek bakiye (sayım / ekstre) (₺)</label><input type="number" id="fm-actual" step="0.01" placeholder="₺"><div class="fin-note" id="fm-actual-hint"></div></div>' +
    '<div class="field" id="fm-partner-wrap" style="display:none;"><label>Ortak</label>' + (partners.length ? '<select id="fm-partner">' + partners.map(function(p){ return '<option>' + escapeHtml(p) + '</option>'; }).join('') + '</select>' : '<input id="fm-partner" placeholder="Ortak adı (Hesaplar sekmesinde tanımlanabilir)">') + '</div>' +
    '<div class="field"><label>Not</label><input id="fm-note" placeholder="isteğe bağlı"></div>' +
    '<div class="row" style="justify-content:flex-end;gap:8px;"><button class="btn secondary" onclick="document.getElementById(\'modal-fin-move\').remove()">Vazgeç</button><button class="btn" onclick="saveFinMove196()">Kaydet</button></div></div>';
  document.body.appendChild(mdl);
  __finMoveFields196();
}
function __finMoveFields196() {
  const op = (document.getElementById('fm-op') || {}).value || 'transfer';
  const show = function(id, on){ const el = document.getElementById(id); if (el) el.style.display = on ? '' : 'none'; };
  show('fm-from-wrap', op === 'transfer' || op === 'cardpay' || op === 'draw');
  show('fm-to-wrap', op === 'transfer' || op === 'cardpay' || op === 'capital');
  show('fm-acc-wrap', op === 'reconcile');
  show('fm-amount-wrap', op !== 'reconcile');
  show('fm-actual-wrap', op === 'reconcile');
  show('fm-partner-wrap', op === 'draw' || op === 'capital');
  const fl = document.querySelector('#fm-from-wrap label'); if (fl) fl.textContent = op === 'draw' ? 'Hangi hesaptan çekildi' : 'Çıkan hesap';
  const tl = document.querySelector('#fm-to-wrap label'); if (tl) tl.textContent = op === 'capital' ? 'Hangi hesaba kondu' : (op === 'cardpay' ? 'Ödenen kart' : 'Giren hesap');
  if (op === 'cardpay') { const to = document.getElementById('fm-to'); if (to) { const card = finAccounts196().find(function(a){ return a.type === 'card'; }); if (card && ![...to.selectedOptions].some(function(o){ return (finAccount196(o.value) || {}).type === 'card'; })) to.value = card.id; } const fr = document.getElementById('fm-from'); if (fr) fr.value = FIN_ACC_BANK; }
  if (op === 'reconcile') { const acc = (document.getElementById('fm-acc') || {}).value; const dt = (document.getElementById('fm-date') || {}).value || todayISO(); const b = finBalance196(acc, dt); const h = document.getElementById('fm-actual-hint'); if (h) h.textContent = 'Uygulamaya göre ' + fmtDate(dt) + ' bakiyesi: ' + finMoneyS196(b) + ' — fark tek hareketle kapanır.'; }
}
function saveFinMove196() {
  const op = (document.getElementById('fm-op') || {}).value || 'transfer';
  const date = (document.getElementById('fm-date') || {}).value || ''; if (!date) { alert('Tarih seç.'); return; }
  const note = ((document.getElementById('fm-note') || {}).value || '').trim();
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  state.finMoves = state.finMoves || [];
  if (op === 'reconcile') {
    const acc = (document.getElementById('fm-acc') || {}).value; const actualRaw = (document.getElementById('fm-actual') || {}).value;
    if (!acc || actualRaw === '' || actualRaw === undefined || isNaN(+actualRaw)) { alert('Hesap ve gerçek bakiye gir.'); return; }
    const a = finAccount196(acc); if (!a || !a.openingDate) { alert('Bu hesabın açılış tarihi yok.'); return; }
    if (date < a.openingDate) { alert('Tarih hesabın açılış tarihinden önce olamaz.'); return; }
    const computed = finBalance196(acc, date); const diff = Math.round(((+actualRaw) - computed) * 100) / 100;
    if (!diff) { if (window.plToast) plToast('✓ Fark yok — bakiye tutuyor'); const m0 = document.getElementById('modal-fin-move'); if (m0) m0.remove(); return; }
    __undoSnapshot('Mutabakat: ' + (a.name || acc) + ' ' + fmtDate(date));
    finReconcile196(acc, date, +actualRaw, note);
    if (window.plToast) plToast('🧮 Mutabakat: fark ' + (diff > 0 ? '+' : '−') + money(Math.abs(diff)) + ' ₺ kaydedildi');
  } else {
    const amount = Math.round((+((document.getElementById('fm-amount') || {}).value) || 0) * 100) / 100; if (amount <= 0) { alert('Tutar 0\'dan büyük olmalı.'); return; }
    const from = (document.getElementById('fm-from') || {}).value || '', to = (document.getElementById('fm-to') || {}).value || '';
    const partner = ((document.getElementById('fm-partner') || {}).value || '').trim();
    const mv = { id: uid(), kind: 'move', op: op, date: date, amount: amount, note: note, at: new Date().toISOString() };
    if (op === 'transfer' || op === 'cardpay') { if (!from || !to || from === to) { alert('Çıkan ve giren hesap farklı olmalı.'); return; } if (op === 'cardpay' && (finAccount196(to) || {}).type !== 'card') { alert('Kart borcu ödemesinde giren hesap bir kart hesabı olmalı.'); return; } mv.fromAccountId = from; mv.toAccountId = to; }
    else if (op === 'draw') { if (!from) { alert('Hesap seç.'); return; } mv.fromAccountId = from; mv.partner = partner; }
    else if (op === 'capital') { if (!to) { alert('Hesap seç.'); return; } mv.toAccountId = to; mv.partner = partner; }
    const chk = [mv.fromAccountId, mv.toAccountId].filter(Boolean).map(finAccount196); if (chk.some(function(a){ return !a || !a.openingDate || date < a.openingDate; })) { alert('Hesabın açılış tarihi yok ya da tarih açılıştan önce.'); return; }
    __undoSnapshot(FIN_MOVE_OPS196[op] + ': ' + money(amount) + ' ₺');
    state.finMoves.push(mv);
    if (window.plToast) plToast('✓ ' + FIN_MOVE_OPS196[op] + ' kaydedildi');
  }
  const mdl = document.getElementById('modal-fin-move'); if (mdl) mdl.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
}
async function removeFinMove196(id) {
  const mv = (state.finMoves || []).find(function(x){ return x && x.id === id; }); if (!mv) return;
  const ok = await plConfirm((FIN_MOVE_OPS196[mv.op] || 'Hareket') + ' ' + fmtDate(mv.date) + ' ' + money(Math.abs(+mv.amount || 0)) + ' ₺ silinecek. Emin misin?', 'Evet, sil');
  if (!ok) return;
  __undoSnapshot('Hareket sil: ' + (FIN_MOVE_OPS196[mv.op] || '') + ' ' + money(Math.abs(+mv.amount || 0)) + ' ₺');
  state.finMoves = (state.finMoves || []).filter(function(x){ return !(x && x.id === id); });
  save(); try { __refreshUIInPlace(); } catch(e) {}
}
// ─────────── HESAPLAR (ayar) ───────────
function renderFinAccounts196() {
  const el = document.getElementById('fin-accounts-body'); if (!el) return;
  const fs = (state.settings.finance || {});
  const rows = finAccounts196(true).map(function(a){
    const b = finBalance196(a.id);
    return '<div class="fin-acc-row">' +
      '<span style="min-width:150px;"><b>' + escapeHtml(finAccountLabel196(a.id)) + '</b>' + (a.active === false ? ' <span class="badge">pasif</span>' : '') + (a.bank ? '<br><small style="color:var(--muted)">' + escapeHtml(a.bank) + '</small>' : '') + '</span>' +
      '<span style="min-width:110px;">' + (a.owner ? '👤 ' + escapeHtml(a.owner) : '<span class="fin-note">ortak: —</span>') + '</span>' +
      '<span style="min-width:170px;">' + (a.openingDate ? 'açılış ' + fmtDate(a.openingDate) + ' · ' + (a.type === 'card' ? 'borç ' + money(Math.abs(+a.openingBalance || 0)) : money(+a.openingBalance || 0)) + ' ₺' : '<span class="fin-warn" style="padding:2px 6px;margin:0;">başlangıç girilmedi</span>') + '</span>' +
      '<span style="min-width:130px;">bakiye: <b' + (b !== null && b < 0 ? ' style="color:var(--bad)"' : '') + '>' + (a.type === 'card' && b !== null ? (b < 0 ? 'borç ' + money(-b) + ' ₺' : money(b) + ' ₺') : finMoneyS196(b)) + '</b></span>' +
      (a.type === 'card' && (a.cutoffDay || a.dueDay) ? '<span class="fin-note">kesim ' + (a.cutoffDay || '—') + ' · son ödeme ' + (a.dueDay || '—') + '</span>' : '') +
      '<span style="flex:1"></span><button class="btn small secondary" onclick="openFinAccountModal196(\'' + a.id + '\')">Düzenle</button></div>';
  }).join('');
  el.innerHTML = rows + '<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap;"><button class="btn small" onclick="openFinAccountModal196(\'\')">+ Kart hesabı ekle</button></div>' +
    '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);"><b>Ortaklar</b> <span class="fin-note">(çekim/sermaye kayıtlarında ve kart sahipliğinde kullanılır)</span>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;margin:6px 0;"><input id="fin-partners" style="flex:1;min-width:200px;" placeholder="Virgülle ayır: Kerem, Ortak" value="' + escapeHtml((fs.partners || []).join(', ')) + '"><button class="btn small secondary" onclick="saveFinSettings196()">Kaydet</button></div>' +
    '<b>Güvenlik payı</b> <span class="fin-note">(nakit akışı projeksiyonunda bu tutarın altına düşen gün uyarılır)</span>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;margin:6px 0;"><input type="number" id="fin-safety" style="width:160px;" min="0" step="100" value="' + (+fs.safetyMin || 0) + '"><span class="fin-note">₺</span><button class="btn small secondary" onclick="saveFinSettings196()">Kaydet</button></div></div>';
}
function saveFinSettings196() {
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  __finNormalize196(state);
  const ps = ((document.getElementById('fin-partners') || {}).value || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean);
  const sm = Math.max(0, Math.round((+((document.getElementById('fin-safety') || {}).value) || 0) * 100) / 100);
  __undoSnapshot('Finans ayarları');
  state.settings.finance.partners = ps; state.settings.finance.safetyMin = sm;
  save(); renderFinAccounts196(); if (window.plToast) plToast('✓ Finans ayarları kaydedildi');
}
function openFinAccountModal196(id) {
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış — önce _dev/finance-setup.sql çalıştırılmalı.'); return; }
  const a = id ? finAccount196(id) : null;
  const isCard = !a || a.type === 'card';
  const partners = ((state.settings.finance || {}).partners || []);
  const old = document.getElementById('modal-fin-acc'); if (old) old.remove();
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-acc'; mdl.className = 'modal-bg open';
  mdl.innerHTML = '<div class="modal" style="max-width:460px;"><h3>' + (a ? '🏦 ' + escapeHtml(a.name || '') : '💳 Yeni kart hesabı') + '</h3>' +
    '<div class="field"><label>Ad</label><input id="fa-name" value="' + escapeHtml(a ? (a.name || '') : '') + '" placeholder="örn. Garanti Bonus (Kerem)"' + (a && a.type !== 'card' ? '' : '') + '></div>' +
    (isCard ? '<div class="field"><label>Banka</label><input id="fa-bank" list="fa-bank-list" value="' + escapeHtml(a ? (a.bank || '') : '') + '" placeholder="Garanti BBVA / VakıfBank / Türkiye Finans"><datalist id="fa-bank-list"><option value="Garanti BBVA"><option value="VakıfBank"><option value="Türkiye Finans"></datalist></div>' : '<div class="field"><label>Banka</label><input id="fa-bank" value="' + escapeHtml(a ? (a.bank || '') : '') + '" placeholder="isteğe bağlı"></div>') +
    '<div class="field"><label>Sahibi (ortak)</label>' + (partners.length ? '<select id="fa-owner"><option value="">—</option>' + partners.map(function(p){ return '<option' + (a && a.owner === p ? ' selected' : '') + '>' + escapeHtml(p) + '</option>'; }).join('') + '</select>' : '<input id="fa-owner" value="' + escapeHtml(a ? (a.owner || '') : '') + '" placeholder="Ortak adı">') + '</div>' +
    '<div class="field"><label>Başlangıç tarihi</label><input type="date" id="fa-open" value="' + escapeHtml(a ? (a.openingDate || '') : '') + '"><div class="fin-note">Bu tarihten önceki ödeme/gider bakiyeye girmez (raporlarda kalır).</div></div>' +
    '<div class="field"><label>' + (isCard ? 'Başlangıçtaki kart borcu (₺)' : 'Açılış bakiyesi (₺)') + '</label><input type="number" id="fa-bal" step="0.01" value="' + (a ? Math.abs(+a.openingBalance || 0) : '') + '" placeholder="₺"></div>' +
    (isCard ? '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Hesap kesim günü</label><input type="number" id="fa-cut" min="1" max="31" value="' + (a && a.cutoffDay ? a.cutoffDay : '') + '"></div><div class="field" style="flex:1"><label>Son ödeme günü</label><input type="number" id="fa-due" min="1" max="31" value="' + (a && a.dueDay ? a.dueDay : '') + '"></div></div>' : '') +
    (a && a.type === 'card' ? '<div class="field"><label><input type="checkbox" id="fa-active"' + (a.active !== false ? ' checked' : '') + '> Aktif (kapalı kart listelenmez)</label></div>' : '') +
    '<div class="row" style="justify-content:flex-end;gap:8px;"><button class="btn secondary" onclick="document.getElementById(\'modal-fin-acc\').remove()">Vazgeç</button><button class="btn" onclick="saveFinAccount196(\'' + (a ? a.id : '') + '\')">Kaydet</button></div></div>';
  document.body.appendChild(mdl);
}
function saveFinAccount196(id) {
  __finNormalize196(state);
  const a = id ? finAccount196(id) : null;
  const name = ((document.getElementById('fa-name') || {}).value || '').trim(); if (!name) { alert('Ad gir.'); return; }
  const open = (document.getElementById('fa-open') || {}).value || '';
  const balRaw = (document.getElementById('fa-bal') || {}).value;
  if (open && (balRaw === '' || balRaw === undefined || isNaN(+balRaw))) { alert('Açılış bakiyesini gir (0 olabilir).'); return; }
  const isCard = !a || a.type === 'card';
  const bal = Math.round((+balRaw || 0) * 100) / 100;
  const rec = a || { id: uid(), kind: 'account', type: 'card', active: true };
  __undoSnapshot('Hesap: ' + name);
  rec.name = name; rec.bank = ((document.getElementById('fa-bank') || {}).value || '').trim(); rec.owner = ((document.getElementById('fa-owner') || {}).value || '').trim();
  rec.openingDate = open; rec.openingBalance = isCard ? -Math.abs(bal) : bal;
  if (isCard) { rec.cutoffDay = +((document.getElementById('fa-cut') || {}).value) || 0; rec.dueDay = +((document.getElementById('fa-due') || {}).value) || 0; const ac = document.getElementById('fa-active'); if (ac) rec.active = !!ac.checked; }
  if (!a) state.finAccounts.push(rec);
  const mdl = document.getElementById('modal-fin-acc'); if (mdl) mdl.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast('✓ Hesap kaydedildi');
}
function renderPayments() {
  try { __renderPaymentRecords196(); } catch(e) { if (typeof __pilLogErr === 'function') __pilLogErr('renderPayments', (e && e.stack) || e); }
  try { renderFinance196(); } catch(e) { if (typeof __pilLogErr === 'function') __pilLogErr('renderFinance', (e && e.stack) || e); }
}
function __renderPaymentRecords196() {
  // member filter options""")

# ---------- sürüm ----------
rep('<meta name="app-version" content="2026.10.15.118">', '<meta name="app-version" content="2026.10.17.119">')
rep("const APP_VERSION = '2026.10.15.118';", "const APP_VERSION = '2026.10.17.119';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v195-2026-10-15-118'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v196-2026-10-17-119'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
