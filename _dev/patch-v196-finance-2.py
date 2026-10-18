# -*- coding: utf-8 -*-
# v196 ADIM 2 — CARİ + VADELER + ŞABLONLAR (adım 1'in üstüne uygulanır)
# Cari: üyeler (bize borçlu, türetilmiş) + hocalar (biz borçluyuz, türetilmiş; "Ortak — hakediş ödenmez" bayrağı hariç) + dış cariler (elle).
# Vadeler: şablondan tembel/idempotent üretilen vade kalemleri (deterministik id: due-<şablon>-<ay>), elle vadeli gider, hoca hakediş
# vadeleri (ay sonu), kart son ödeme hatırlatıcısı (borç = güncel bakiye), üye alacakları (ilk ders tarihi) ve beklenen yenilemeler
# (tahmin). Tik → hesap sorar → hareket oluşur, kalem kapanır; kısmi ödeme kalan kalem açar; bağlı gider silinirse kalem yeniden açılır.
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
rep("""  .fin-acc-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:8px 0; border-bottom:1px dashed var(--border); }""",
"""  .fin-acc-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:8px 0; border-bottom:1px dashed var(--border); }
  .fin-cols { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width: 820px) { .fin-cols { grid-template-columns:1fr; } }
  .fin-col h3 { margin:0 0 6px; font-size:15px; }
  .fin-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:7px 0; border-bottom:1px dashed var(--border); font-size:13px; }
  .fin-row .d { min-width:84px; font-variant-numeric:tabular-nums; } .fin-row .t { flex:1; min-width:140px; } .fin-row .a { min-width:96px; text-align:right; font-weight:700; font-variant-numeric:tabular-nums; }
  .fin-row.overdue .d, .fin-row.overdue .a { color:var(--bad); } .fin-row.est { opacity:.62; } .fin-row.est .a { font-weight:500; }
  .fin-sec { margin:12px 0 4px; padding-top:8px; border-top:1px solid var(--border); font-weight:700; }
  .fin-tot { font-size:13px; color:var(--muted); margin:2px 0 8px; } .fin-tot b { color:var(--text); }""")

# ───────── GİDER FORMU: cari + vadeli ─────────
rep("""        <select id="exp-acc" class="pl-owner-only" title="Hangi hesaptan ödendi"></select>""",
"""        <select id="exp-acc" class="pl-owner-only" title="Hangi hesaptan ödendi"></select>
        <select id="exp-cp" class="pl-owner-only" title="Karşı taraf (cari) — isteğe bağlı"></select>
        <label class="pl-owner-only" style="display:flex;align-items:center;gap:4px;font-size:12.5px;white-space:nowrap;" title="Şimdi ödenmedi: borç doğar, Vadeler listesinde bekler"><input type="checkbox" id="exp-vadeli" onchange="(function(){ const d=document.getElementById('exp-due'); if (d) d.style.display = document.getElementById('exp-vadeli').checked ? '' : 'none'; })()"> vadeli</label>
        <input type="date" id="exp-due" class="pl-owner-only" style="display:none;" title="Vade tarihi">""")
rep("""  const __acc196 = ((document.getElementById('exp-acc')||{}).value) || ''; // v196: hangi hesaptan ödendi
  if (finActive196() && !__acc196) { alert('Hangi hesaptan ödendiğini seç (Kasa / Banka / kart).'); return; }
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış — Ayarlar/Finans uyarısındaki SQL önce çalıştırılmalı.'); return; }
  __undoSnapshot('Gider: ' + cat + ' ' + money(amount) + ' ₺');
  state.expenses.push({ id: uid(), date: date, category: cat, amount: Math.round(amount*100)/100, note: note, resmi: resmi, kdvRate: resmi ? ekdv : 0, accountId: __acc196, source: 'manual' });""",
"""  const __acc196 = ((document.getElementById('exp-acc')||{}).value) || ''; // v196: hangi hesaptan ödendi
  const __cp196 = ((document.getElementById('exp-cp')||{}).value) || '';   // v196: karşı taraf (cari)
  const __vadeli196 = !!((document.getElementById('exp-vadeli')||{}).checked);
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış — Ayarlar/Finans uyarısındaki SQL önce çalıştırılmalı.'); return; }
  if (__vadeli196) { // v196 ADIM 2: şimdi ödenmedi → vade kalemi (borç), ödenince gider olur
    const __due = ((document.getElementById('exp-due')||{}).value) || date;
    __undoSnapshot('Vadeli gider: ' + cat + ' ' + money(amount) + ' ₺');
    state.finDues = state.finDues || [];
    state.finDues.push({ id: uid(), kind: 'due', dtype: 'expense', title: note || cat, amount: Math.round(amount*100)/100, dueDate: __due, period: String(__due).slice(0, 7), category: cat, counterpartyId: __cp196, accountId: __acc196, resmi: resmi, kdvRate: resmi ? ekdv : 0, status: 'open', note: '', createdAt: new Date().toISOString() });
    save();
    const aEl2 = document.getElementById('exp-amount'); if (aEl2) aEl2.value = '';
    const nEl2 = document.getElementById('exp-note'); if (nEl2) nEl2.value = '';
    const vEl2 = document.getElementById('exp-vadeli'); if (vEl2) { vEl2.checked = false; const dd = document.getElementById('exp-due'); if (dd) dd.style.display = 'none'; }
    try { __refreshUIInPlace(); } catch(e) {}
    if (window.plToast) plToast('⏰ Vadeli kalem kaydedildi — Vadeler sekmesinde');
    return;
  }
  if (finActive196() && !__acc196) { alert('Hangi hesaptan ödendiğini seç (Kasa / Banka / kart).'); return; }
  __undoSnapshot('Gider: ' + cat + ' ' + money(amount) + ' ₺');
  state.expenses.push({ id: uid(), date: date, category: cat, amount: Math.round(amount*100)/100, note: note, resmi: resmi, kdvRate: resmi ? ekdv : 0, accountId: __acc196, counterpartyId: __cp196, source: 'manual' });""")
rep("""  __undoSnapshot('Gider sil: ' + (e.category||'') + ' ' + money(+e.amount||0) + ' ₺'); // v196
  state.expenses = (state.expenses||[]).filter(x => !(x && x.id === id));""",
"""  __undoSnapshot('Gider sil: ' + (e.category||'') + ' ' + money(+e.amount||0) + ' ₺'); // v196
  if (e.dueId) { const __d = (state.finDues||[]).find(x => x && x.id === e.dueId); if (__d && __d.paidRef && __d.paidRef.id === e.id) { __d.status = 'open'; delete __d.paidRef; delete __d.paidDate; delete __d.paidAmount; } } // v196 ADIM 2: bağlı vade kalemi yeniden açılır
  state.expenses = (state.expenses||[]).filter(x => !(x && x.id === id));""")
rep("""  try { finFillAccountSelect196(document.getElementById('exp-acc'), 'Hesap seç…'); } catch(e) {} // v196""",
"""  try { finFillAccountSelect196(document.getElementById('exp-acc'), 'Hesap seç…'); } catch(e) {} // v196
  try { finFillCpSelect196(document.getElementById('exp-cp'), 'Cari (isteğe bağlı)'); } catch(e) {} // v196 ADIM 2""")
# gider listesi: cari rozeti
rep("""${e.accountId ? `<span class="badge" title="Ödendiği hesap">${escapeHtml(finAccountLabel196(e.accountId))}</span>` : ''}""",
    """${e.accountId ? `<span class="badge" title="Ödendiği hesap">${escapeHtml(finAccountLabel196(e.accountId))}</span>` : ''}${e.counterpartyId ? `<span class="badge" title="Cari">👥 ${escapeHtml(finCounterpartyName196(e.counterpartyId))}</span>` : ''}""")

# ───────── HAREKETLER: hoca maaşı gider kaydı çift sayılmaz ─────────
rep("""    if (!e || !e.id) return; if (e.status === 'open') return; if (e.business === false) return; const amt = r2(e.amount); if (!amt) return;""",
    """    if (!e || !e.id) return; if (e.status === 'open') return; if (e.business === false) return; if (e.category === 'Hoca Maaşı') return; /* hoca ödemeleri instructorPayouts'tan gelir — çift sayım yok */ const amt = r2(e.amount); if (!amt) return;""")

# ───────── ALACAKLAR: getOverduePayments gelecek vadeleri de verebilsin ─────────
rep("""function getOverduePayments() {
  const today = todayISO();
  const out = [];""",
"""function getOverduePayments(opts) {
  opts = opts || {}; // v196: {includeFuture:true} → vadesi gelmemiş aylar da (Vadeler/Cari için)
  const today = todayISO();
  const out = [];""")
rep("""      const firstDate = map[ay];
      if (firstDate >= today) return;                 // vadesi gelmemis ay""",
"""      const firstDate = map[ay];
      if (!opts.includeFuture && firstDate >= today) return;                 // vadesi gelmemis ay""")
rep("""      rows.push({ ay, firstDate, expected, paid, missing });
    });
    return rows;""",
"""      rows.push({ ay, firstDate, expected, paid, missing, overdue: firstDate < today });
    });
    return rows;""")

# ───────── HOCA: "Ortak — hakediş ödenmez" bayrağı ─────────
rep("""    <div class="field"><label>Not</label><textarea id="mi-note" rows="2"></textarea></div>
    <div class="row end">
      <button class="btn danger" id="mi-delete-btn" """,
"""    <div class="field"><label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="mi-partner"> Ortak — hakedişi ödenmez (Finans vadelerine ve cariye düşmez)</label></div>
    <div class="field"><label>Not</label><textarea id="mi-note" rows="2"></textarea></div>
    <div class="row end">
      <button class="btn danger" id="mi-delete-btn" """)
rep("""  const data = { id: id||uid(), name, phone, note: document.getElementById('mi-note').value.trim(), shareRate };
  if (id) { const i = state.instructors.findIndex(x=>x.id===id); state.instructors[i] = data; }""",
"""  const data = { id: id||uid(), name, phone, note: document.getElementById('mi-note').value.trim(), shareRate };
  { const __pe = document.getElementById('mi-partner'); if (__pe && __pe.checked) data.partner = true; } // v196 ADIM 2
  if (id) { const i = state.instructors.findIndex(x=>x.id===id); state.instructors[i] = data; }""")
rep("""  document.getElementById('mi-note').value = i.note||'';
  // v10: shareRate input'u doldur""",
"""  document.getElementById('mi-note').value = i.note||'';
  { const __pe = document.getElementById('mi-partner'); if (__pe) __pe.checked = !!i.partner; } // v196 ADIM 2
  // v10: shareRate input'u doldur""")

# ───────── AÇILIŞ: şablon vadeleri ─────────
rep("""  try { if (__sbRole === 'owner') setTimeout(function(){ try { __offerSpillJoinRepair191(); } catch(e) {} }, 2500); } catch(e) {} // v191""",
"""  try { if (__sbRole === 'owner') setTimeout(function(){ try { __offerSpillJoinRepair191(); } catch(e) {} }, 2500); } catch(e) {} // v191
  try { if (__sbRole === 'owner') setTimeout(function(){ try { if (finEnsureTemplateDues196()) __refreshUIInPlace(); } catch(e) {} }, 4000); } catch(e) {} // v196: şablon vadeleri""")

# ───────── ÇEKİRDEK + EKRANLAR ─────────
rep("""function renderPayments() {
  try { __renderPaymentRecords196(); }""",
r"""// ═══════════════════════ v196 ADIM 2 — CARİ + VADELER + ŞABLONLAR ═══════════════════════
const FIN_CP_TYPES196 = { landlord:'Kiralayan', supplier:'Tedarikçi', accountant:'Muhasebeci', tax:'SGK / Vergi dairesi', other:'Diğer' };
function finR2_196(x) { return Math.round((+x || 0) * 100) / 100; }
function finMonthAdd196(ay, k) { const p = String(ay).split('-').map(Number); const d = new Date(p[0], p[1] - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function finMonthEnd196(ay) { const p = String(ay).split('-').map(Number); const d = new Date(p[0], p[1], 0); return ay + '-' + String(d.getDate()).padStart(2, '0'); }
function finDayInMonth196(ay, day) { const p = String(ay).split('-').map(Number); const last = new Date(p[0], p[1], 0).getDate(); const dd = Math.max(1, Math.min(last, +day || 1)); return ay + '-' + String(dd).padStart(2, '0'); }
function finCounterparties196(includeInactive) { __finNormalize196(state); return state.finCounterparties.filter(function(c){ return c && (includeInactive || c.active !== false); }).slice().sort(function(a, b){ return String(a.name || '').localeCompare(String(b.name || ''), 'tr'); }); }
function finCounterparty196(id) { return (state.finCounterparties || []).find(function(c){ return c && c.id === id; }) || null; }
function finFillCpSelect196(sel, placeholder, keepValue) {
  if (!sel) return;
  const cur = keepValue !== undefined ? keepValue : (sel.value || '');
  sel.innerHTML = '<option value="">' + escapeHtml(placeholder || '—') + '</option>' + finCounterparties196().map(function(c){ return '<option value="' + c.id + '">' + escapeHtml(c.name) + (c.type && FIN_CP_TYPES196[c.type] ? ' · ' + FIN_CP_TYPES196[c.type] : '') + '</option>'; }).join('');
  if (cur && [...sel.options].some(function(o){ return o.value === cur; })) sel.value = cur;
}
function openFinCpModal196(id) {
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  const c = id ? finCounterparty196(id) : null;
  const old = document.getElementById('modal-fin-cp'); if (old) old.remove();
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-cp'; mdl.className = 'modal-bg open';
  mdl.innerHTML = '<div class="modal" style="max-width:440px;"><h3>' + (c ? '👥 ' + escapeHtml(c.name) : '👥 Yeni cari') + '</h3>' +
    '<div class="field"><label>Ad</label><input id="fc-name" value="' + escapeHtml(c ? c.name : '') + '" placeholder="örn. Mülk sahibi, Muhasebeci, SGK"></div>' +
    '<div class="field"><label>Tür</label><select id="fc-type">' + Object.keys(FIN_CP_TYPES196).map(function(k){ return '<option value="' + k + '"' + (c && c.type === k ? ' selected' : '') + '>' + FIN_CP_TYPES196[k] + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Not</label><input id="fc-note" value="' + escapeHtml(c ? (c.note || '') : '') + '"></div>' +
    (c ? '<div class="field"><label><input type="checkbox" id="fc-active"' + (c.active !== false ? ' checked' : '') + '> Aktif</label></div>' : '') +
    '<div class="row" style="justify-content:flex-end;gap:8px;">' + (c ? '<button class="btn danger" style="margin-right:auto;" onclick="removeFinCp196(\'' + c.id + '\')">🗑 Sil</button>' : '') + '<button class="btn secondary" onclick="document.getElementById(\'modal-fin-cp\').remove()">Vazgeç</button><button class="btn" onclick="saveFinCp196(\'' + (c ? c.id : '') + '\')">Kaydet</button></div></div>';
  document.body.appendChild(mdl);
}
function saveFinCp196(id) {
  __finNormalize196(state);
  const name = ((document.getElementById('fc-name') || {}).value || '').trim(); if (!name) { alert('Ad gir.'); return; }
  const c = id ? finCounterparty196(id) : null;
  const rec = c || { id: uid(), kind: 'counterparty', active: true, createdAt: new Date().toISOString() };
  __undoSnapshot('Cari: ' + name);
  rec.name = name; rec.type = (document.getElementById('fc-type') || {}).value || 'other'; rec.note = ((document.getElementById('fc-note') || {}).value || '').trim();
  const ac = document.getElementById('fc-active'); if (ac) rec.active = !!ac.checked;
  if (!c) state.finCounterparties.push(rec);
  const mdl = document.getElementById('modal-fin-cp'); if (mdl) mdl.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
}
async function removeFinCp196(id) {
  const c = finCounterparty196(id); if (!c) return;
  const used = (state.expenses || []).some(function(e){ return e && e.counterpartyId === id; }) || (state.finDues || []).some(function(d){ return d && d.counterpartyId === id; }) || (state.finTemplates || []).some(function(t){ return t && t.counterpartyId === id; });
  if (used) { alert('Bu cariye bağlı gider/vade/şablon var — silinemez; pasife al.'); return; }
  const ok = await plConfirm('«' + c.name + '» carisi silinecek. Emin misin?', 'Evet, sil'); if (!ok) return;
  __undoSnapshot('Cari sil: ' + c.name);
  state.finCounterparties = (state.finCounterparties || []).filter(function(x){ return !(x && x.id === id); });
  const mdl = document.getElementById('modal-fin-cp'); if (mdl) mdl.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
}
// ─────────── ŞABLONLAR → VADE KALEMLERİ (tembel, idempotent, deterministik id) ───────────
function finEnsureTemplateDues196() {
  if (!finCloudReady196()) return 0;
  __finNormalize196(state);
  const cur = currentMonth(); const until = finMonthAdd196(cur, 1); const floor = finMonthAdd196(cur, -12);
  let n = 0;
  (state.finTemplates || []).forEach(function(tp){
    if (!tp || !tp.id || tp.active === false) return;
    let m = tp.startMonth || cur; if (m < floor) m = floor;
    for (let guard = 0; guard < 40 && m <= until; guard++) {
      if (tp.endMonth && m > tp.endMonth) break;
      const id = 'due-' + tp.id + '-' + m;
      if (!state.finDues.some(function(d){ return d && d.id === id; })) {
        state.finDues.push({ id: id, kind: 'due', dtype: 'expense', templateId: tp.id, period: m, title: tp.title, amount: finR2_196(tp.amount), dueDate: finDayInMonth196(m, tp.dayOfMonth || 1), category: tp.category || 'Diğer', counterpartyId: tp.counterpartyId || '', accountId: tp.accountId || '', resmi: !!tp.resmi, kdvRate: tp.resmi ? (+tp.kdvRate || 0) : 0, status: 'open', note: '', createdAt: new Date().toISOString() });
        n++;
      }
      m = finMonthAdd196(m, 1);
    }
  });
  if (n) { try { save(); } catch(e) {} }
  return n;
}
function openFinTemplateModal196(id) {
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  const tp = id ? (state.finTemplates || []).find(function(x){ return x && x.id === id; }) : null;
  const old = document.getElementById('modal-fin-tpl'); if (old) old.remove();
  const accSel = function(sel){ return '<select id="ft-acc"><option value="">— (ödeme anında seçilir)</option>' + finAccounts196().map(function(a){ return '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + escapeHtml(finAccountLabel196(a.id)) + '</option>'; }).join('') + '</select>'; };
  const cpSel = function(sel){ return '<select id="ft-cp"><option value="">— (isteğe bağlı)</option>' + finCounterparties196().map(function(c){ return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>'; }).join('') + '</select>'; };
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-tpl'; mdl.className = 'modal-bg open';
  mdl.innerHTML = '<div class="modal" style="max-width:480px;"><h3>' + (tp ? '🔁 ' + escapeHtml(tp.title) : '🔁 Yeni tekrar eden kalem') + '</h3><div class="fin-note">Her ay vade listesine kendiliğinden düşer; o ayın tutarını kalemde değiştirebilirsin.</div>' +
    '<div class="field"><label>Başlık</label><input id="ft-title" value="' + escapeHtml(tp ? tp.title : '') + '" placeholder="örn. Kira, Muhasebeci, SGK, Bağkur"></div>' +
    '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Tutar (₺)</label><input type="number" id="ft-amount" min="0" step="0.01" value="' + (tp ? tp.amount : '') + '"></div><div class="field" style="flex:1"><label>Ayın günü</label><input type="number" id="ft-day" min="1" max="31" value="' + (tp ? (tp.dayOfMonth || 1) : 1) + '"></div></div>' +
    '<div class="field"><label>Kategori</label><select id="ft-cat">' + EXPENSE_CATS.map(function(c){ return '<option' + (tp && tp.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Cari</label>' + cpSel(tp ? tp.counterpartyId : '') + '</div>' +
    '<div class="field"><label>Varsayılan hesap</label>' + accSel(tp ? tp.accountId : FIN_ACC_BANK) + '</div>' +
    '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Başlangıç ayı</label><input type="month" id="ft-start" value="' + (tp ? (tp.startMonth || '') : currentMonth()) + '"></div><div class="field" style="flex:1"><label>Bitiş ayı (boş = süresiz)</label><input type="month" id="ft-end" value="' + (tp ? (tp.endMonth || '') : '') + '"></div></div>' +
    '<div class="row" style="gap:12px;align-items:center;flex-wrap:wrap;"><label style="display:flex;align-items:center;gap:4px;font-size:13px;"><input type="checkbox" id="ft-resmi"' + (tp && tp.resmi ? ' checked' : '') + '> 🧾 Faturalı/resmi</label><select id="ft-kdv"><option value="20"' + (tp && +tp.kdvRate === 20 ? ' selected' : '') + '>KDV %20</option><option value="10"' + (tp && +tp.kdvRate === 10 ? ' selected' : '') + '>KDV %10</option><option value="1"' + (tp && +tp.kdvRate === 1 ? ' selected' : '') + '>KDV %1</option><option value="0"' + (tp && +tp.kdvRate === 0 ? ' selected' : '') + '>KDV %0</option></select>' + (tp ? '<label style="display:flex;align-items:center;gap:4px;font-size:13px;"><input type="checkbox" id="ft-active"' + (tp.active !== false ? ' checked' : '') + '> Aktif</label>' : '') + '</div>' +
    '<div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px;">' + (tp ? '<button class="btn danger" style="margin-right:auto;" onclick="removeFinTemplate196(\'' + tp.id + '\')">🗑 Sil</button>' : '') + '<button class="btn secondary" onclick="document.getElementById(\'modal-fin-tpl\').remove()">Vazgeç</button><button class="btn" onclick="saveFinTemplate196(\'' + (tp ? tp.id : '') + '\')">Kaydet</button></div></div>';
  document.body.appendChild(mdl);
}
function saveFinTemplate196(id) {
  __finNormalize196(state);
  const title = ((document.getElementById('ft-title') || {}).value || '').trim(); const amount = finR2_196((document.getElementById('ft-amount') || {}).value);
  if (!title) { alert('Başlık gir.'); return; } if (amount <= 0) { alert('Tutar 0\'dan büyük olmalı.'); return; }
  const tp = id ? (state.finTemplates || []).find(function(x){ return x && x.id === id; }) : null;
  const rec = tp || { id: uid(), kind: 'template', active: true, createdAt: new Date().toISOString() };
  __undoSnapshot('Şablon: ' + title);
  rec.title = title; rec.amount = amount; rec.dayOfMonth = Math.max(1, Math.min(31, +((document.getElementById('ft-day') || {}).value) || 1));
  rec.category = (document.getElementById('ft-cat') || {}).value || 'Diğer'; rec.counterpartyId = (document.getElementById('ft-cp') || {}).value || ''; rec.accountId = (document.getElementById('ft-acc') || {}).value || '';
  rec.startMonth = (document.getElementById('ft-start') || {}).value || currentMonth(); rec.endMonth = (document.getElementById('ft-end') || {}).value || '';
  rec.resmi = !!((document.getElementById('ft-resmi') || {}).checked); rec.kdvRate = rec.resmi ? (+((document.getElementById('ft-kdv') || {}).value) || 0) : 0;
  const ac = document.getElementById('ft-active'); if (ac) rec.active = !!ac.checked;
  if (!tp) state.finTemplates.push(rec);
  const mdl = document.getElementById('modal-fin-tpl'); if (mdl) mdl.remove();
  save(); finEnsureTemplateDues196(); try { __refreshUIInPlace(); } catch(e) {}
}
async function removeFinTemplate196(id) {
  const tp = (state.finTemplates || []).find(function(x){ return x && x.id === id; }); if (!tp) return;
  const openD = (state.finDues || []).filter(function(d){ return d && d.templateId === id && d.status === 'open'; }).length;
  const ok = await plConfirm('«' + tp.title + '» şablonu silinecek' + (openD ? '; açık ' + openD + ' vade kalemi de kaldırılacak (ödenmişler kalır)' : '') + '. Emin misin?', 'Evet, sil'); if (!ok) return;
  __undoSnapshot('Şablon sil: ' + tp.title);
  state.finTemplates = (state.finTemplates || []).filter(function(x){ return !(x && x.id === id); });
  state.finDues = (state.finDues || []).filter(function(d){ return !(d && d.templateId === id && d.status === 'open'); });
  const mdl = document.getElementById('modal-fin-tpl'); if (mdl) mdl.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
}
// ─────────── VADE KALEMLERİ (saklanan + türetilmiş) ───────────
function finStoredDues196() { __finNormalize196(state); return state.finDues.filter(function(d){ return d && d.status === 'open'; }); }
function finInstructorDues196() {
  const out = []; const cur = currentMonth(); const today = todayISO();
  (state.instructors || []).forEach(function(inst){
    if (!inst || inst.partner) return;
    const months = {}; (state.lessons || []).forEach(function(l){ if (l && l.instructorId === inst.id && l.date && lessonHappened(l)) months[String(l.date).slice(0, 7)] = 1; });
    (state.instructorPayouts || []).forEach(function(po){ if (po && po.instructorId === inst.id && po.year && po.month) months[po.year + '-' + String(po.month).padStart(2, '0')] = 1; });
    Object.keys(months).sort().forEach(function(m){
      if (m > cur) return;
      const hak = finR2_196((instructorEarningsForMonth(inst.id, m) || {}).total);
      const p = m.split('-').map(Number);
      const paid = finR2_196((state.instructorPayouts || []).filter(function(po){ return po && po.instructorId === inst.id && po.year === p[0] && po.month === p[1]; }).reduce(function(a, po){ return a + (+po.amount || 0); }, 0));
      const kalan = finR2_196(hak - paid); if (kalan <= 0.05) return;
      const due = finMonthEnd196(m);
      out.push({ id: 'ins:' + inst.id + ':' + m, dtype: 'instructor', derived: true, instructorId: inst.id, ay: m, title: inst.name + ' — ' + m + ' hakedişi', amount: kalan, hak: hak, paid: paid, dueDate: due, overdue: due < today });
    });
  });
  return out;
}
function finCardReminders196() {
  const out = []; const today = todayISO(); const cur = currentMonth();
  finAccounts196().forEach(function(a){
    if (a.type !== 'card') return;
    const debt = (function(){ const b = finBalance196(a.id); return (b !== null && b < 0) ? -b : 0; })();
    if (!a.dueDay) return;
    let due = finDayInMonth196(cur, a.dueDay); if (due < today) due = finDayInMonth196(finMonthAdd196(cur, 1), a.dueDay);
    const imported = (state.finDues || []).find(function(d){ return d && d.dtype === 'card' && d.accountId === a.id && d.status === 'open'; });
    if (imported) return; // ekstreden gelen kalem (adım 4) zaten listede
    if (debt <= 0.05) return;
    out.push({ id: 'card:' + a.id + ':' + due, dtype: 'card', derived: true, accountId: a.id, title: finAccountLabel196(a.id) + (a.owner ? ' · ' + a.owner : '') + ' — kart borcu', amount: debt, dueDate: due, overdue: false, estimate: true });
  });
  return out;
}
function finDueItems196() {
  const today = todayISO();
  const stored = finStoredDues196().map(function(d){ return Object.assign({}, d, { overdue: String(d.dueDate || '') < today }); });
  return stored.concat(finInstructorDues196(), finCardReminders196()).sort(function(a, b){ return String(a.dueDate).localeCompare(String(b.dueDate)) || String(a.title).localeCompare(String(b.title), 'tr'); });
}
function finReceivables196() {
  const out = []; const today = todayISO(); const limitAy = finMonthAdd196(currentMonth(), 1);
  (getOverduePayments({ includeFuture: true }) || []).forEach(function(o){
    (o.monthsDetail || []).forEach(function(r){
      if (!r || r.ay > limitAy) return;
      out.push({ id: 'rcv:' + (o.groupId || o.memberId) + ':' + r.ay, dtype: 'member', derived: true, memberId: o.memberId, groupId: o.groupId || '', label: o.label, ay: r.ay, title: o.label + ' — ' + r.ay, amount: r.missing, expected: r.expected, paid: r.paid, dueDate: r.firstDate, overdue: r.firstDate < today });
    });
  });
  return out.sort(function(a, b){ return String(a.dueDate).localeCompare(String(b.dueDate)) || String(a.title).localeCompare(String(b.title), 'tr'); });
}
function finRenewals196() {
  const out = []; const cur = currentMonth(); const next = finMonthAdd196(cur, 1); const today = todayISO();
  const fsOk = function(f){ return f && f.quota >= 1 && f.done >= f.quota - 1; };
  const firstPlanned = function(pred){ let d = ''; (state.lessons || []).forEach(function(l){ if (!l || l.status !== 'planned' || !pred(l)) return; if (!l.date || l.date < today) return; if (!d || l.date < d) d = l.date; }); return d; };
  (state.groups || []).forEach(function(g){
    if (!g || isGroupInactiveInMonth(g, cur) || isGroupInactiveInMonth(g, next)) return;
    if (!(activeGroupRosterForMonth(g, cur) || []).length) return;
    const f = sessionsFinishState('group', g.id, cur); if (!fsOk(f)) return;
    if ((groupPaidForMonth(g, next) || 0) > 0) return;
    const amt = finR2_196(groupExpectedTotal(g, cur)); if (amt <= 0) return;
    const pl = firstPlanned(function(l){ return l.groupId === g.id && (l.packageMonth || String(l.date).slice(0, 7)) === next; });
    out.push({ id: 'ren:g:' + g.id, dtype: 'renewal', derived: true, estimate: true, groupId: g.id, title: groupDisplayName(g, cur) + ' — ' + next + ' yenileme (tahmin)', amount: amt, dueDate: pl || (next + '-01'), overdue: false });
  });
  (state.members || []).forEach(function(m){
    if (!m || !isMemberEnrolledInMonth(m.id, cur) || isMemberInactiveInMonth(m, next)) return;
    if (memberActiveGroupForMonth(m.id, cur)) return;
    const f = sessionsFinishState('member', m.id, cur); if (!fsOk(f)) return;
    if ((memberPaidTowardsMonth(m.id, '', next) || 0) > 0) return;
    const amt = finR2_196(memberMonthlyTotalPrice(m.id, cur)); if (amt <= 0) return;
    const pl = firstPlanned(function(l){ return !l.groupId && (l.memberIds || []).includes(m.id) && (l.packageMonth || String(l.date).slice(0, 7)) === next; });
    out.push({ id: 'ren:m:' + m.id, dtype: 'renewal', derived: true, estimate: true, memberId: m.id, title: m.name + ' — ' + next + ' yenileme (tahmin)', amount: amt, dueDate: pl || (next + '-01'), overdue: false });
  });
  return out.sort(function(a, b){ return String(a.dueDate).localeCompare(String(b.dueDate)); });
}
// ─────────── VADE ÖDEME / ATLAMA / DÜZENLEME ───────────
function finPayDueModal196(id) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === id; }); if (!d || d.status !== 'open') return;
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  if (!finActive196()) { alert('Önce 🏦 Hesaplar sekmesinden Kasa/Banka başlangıcını gir.'); return; }
  const old = document.getElementById('modal-fin-pay'); if (old) old.remove();
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-pay'; mdl.className = 'modal-bg open';
  mdl.innerHTML = '<div class="modal" style="max-width:440px;"><h3>✓ Ödendi: ' + escapeHtml(d.title) + '</h3><div class="fin-note">Vade ' + fmtDate(d.dueDate) + ' · ' + escapeHtml(d.category || '') + (d.counterpartyId ? ' · ' + escapeHtml(finCounterpartyName196(d.counterpartyId)) : '') + '</div>' +
    '<div class="field"><label>Tutar (₺)</label><input type="number" id="fp-amount" step="0.01" min="0" value="' + d.amount + '"><div class="fin-note">Eksik girersen kalan tutar için yeni bir açık kalem oluşur.</div></div>' +
    '<div class="field"><label>Ödeme günü</label><input type="date" id="fp-date" value="' + todayISO() + '"></div>' +
    '<div class="field"><label>Hesap</label><select id="fp-acc"></select></div>' +
    '<div class="field"><label>Not</label><input id="fp-note" value=""></div>' +
    '<div class="row" style="justify-content:flex-end;gap:8px;"><button class="btn secondary" onclick="document.getElementById(\'modal-fin-pay\').remove()">Vazgeç</button><button class="btn" onclick="finPayDue196(\'' + d.id + '\')">Kaydet</button></div></div>';
  document.body.appendChild(mdl);
  finFillAccountSelect196(document.getElementById('fp-acc'), '', d.accountId || undefined);
}
function finPayDue196(id, opt) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === id; }); if (!d || d.status !== 'open') return null;
  opt = opt || {};
  const amount = finR2_196(opt.amount !== undefined ? opt.amount : (document.getElementById('fp-amount') || {}).value);
  const date = opt.date || (document.getElementById('fp-date') || {}).value || todayISO();
  const acc = opt.accountId || (document.getElementById('fp-acc') || {}).value || '';
  const note = (opt.note !== undefined ? opt.note : ((document.getElementById('fp-note') || {}).value || '')).trim();
  if (amount <= 0) { alert('Tutar 0\'dan büyük olmalı.'); return null; }
  if (!acc) { alert('Hesap seç.'); return null; }
  const a = finAccount196(acc); if (!a || !a.openingDate || date < a.openingDate) { alert('Hesabın açılış tarihi yok ya da ödeme günü açılıştan önce.'); return null; }
  __undoSnapshot('Vade ödendi: ' + d.title + ' ' + money(amount) + ' ₺');
  const e = { id: uid(), date: date, paidDate: date, category: d.category || 'Diğer', amount: amount, note: d.title + (note ? ' — ' + note : ''), resmi: !!d.resmi, kdvRate: d.resmi ? (+d.kdvRate || 0) : 0, accountId: acc, counterpartyId: d.counterpartyId || '', dueId: d.id, source: 'due' };
  state.expenses = state.expenses || []; state.expenses.push(e);
  const kalan = finR2_196(d.amount - amount);
  d.status = 'paid'; d.paidRef = { type: 'expense', id: e.id }; d.paidDate = date; d.paidAmount = amount;
  if (kalan > 0.05) { let n = 1; while (state.finDues.some(function(x){ return x && x.id === d.id + '-k' + n; })) n++; state.finDues.push(Object.assign({}, d, { id: d.id + '-k' + n, amount: kalan, status: 'open', note: 'kalan (' + fmtDate(date) + ' ' + money(amount) + ' ₺ ödendi)', paidRef: undefined, paidDate: undefined, paidAmount: undefined, createdAt: new Date().toISOString() })); }
  const mdl = document.getElementById('modal-fin-pay'); if (mdl) mdl.remove();
  save(); try { __refreshUIInPlace(); } catch(err) {}
  if (window.plToast) plToast('✓ ' + d.title + ' ödendi' + (kalan > 0.05 ? ' · kalan ' + money(kalan) + ' ₺ açık' : ''));
  return e;
}
async function finSkipDue196(id) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === id; }); if (!d || d.status !== 'open') return;
  const ok = await plConfirm('«' + d.title + '» (' + fmtDate(d.dueDate) + ', ' + money(d.amount) + ' ₺) bu dönem için atlanacak — ödeme beklenmez. Emin misin?', 'Evet, atla'); if (!ok) return;
  __undoSnapshot('Vade atla: ' + d.title);
  d.status = 'skipped'; d.skippedAt = new Date().toISOString();
  save(); try { __refreshUIInPlace(); } catch(e) {}
}
function openFinDueModal196(id) {
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  const d = id ? (state.finDues || []).find(function(x){ return x && x.id === id; }) : null;
  if (id && (!d || d.status !== 'open')) return;
  const old = document.getElementById('modal-fin-due'); if (old) old.remove();
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-due'; mdl.className = 'modal-bg open';
  mdl.innerHTML = '<div class="modal" style="max-width:460px;"><h3>' + (d ? '⏰ ' + escapeHtml(d.title) : '⏰ Yeni vadeli kalem') + '</h3>' +
    '<div class="field"><label>Başlık</label><input id="fd-title" value="' + escapeHtml(d ? d.title : '') + '" placeholder="örn. Reformer bakım faturası"></div>' +
    '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Tutar (₺)</label><input type="number" id="fd-amount" min="0" step="0.01" value="' + (d ? d.amount : '') + '"></div><div class="field" style="flex:1"><label>Vade</label><input type="date" id="fd-due" value="' + (d ? d.dueDate : todayISO()) + '"></div></div>' +
    '<div class="field"><label>Kategori</label><select id="fd-cat">' + EXPENSE_CATS.map(function(c){ return '<option' + (d && d.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Cari</label><select id="fd-cp"></select></div>' +
    '<div class="field"><label>Varsayılan hesap</label><select id="fd-acc"></select></div>' +
    '<div class="row" style="gap:12px;align-items:center;flex-wrap:wrap;"><label style="display:flex;align-items:center;gap:4px;font-size:13px;"><input type="checkbox" id="fd-resmi"' + (d && d.resmi ? ' checked' : '') + '> 🧾 Faturalı/resmi</label><select id="fd-kdv"><option value="20"' + (d && +d.kdvRate === 20 ? ' selected' : '') + '>KDV %20</option><option value="10"' + (d && +d.kdvRate === 10 ? ' selected' : '') + '>KDV %10</option><option value="1"' + (d && +d.kdvRate === 1 ? ' selected' : '') + '>KDV %1</option><option value="0"' + (d && +d.kdvRate === 0 ? ' selected' : '') + '>KDV %0</option></select></div>' +
    '<div class="field"><label>Not</label><input id="fd-note" value="' + escapeHtml(d ? (d.note || '') : '') + '"></div>' +
    '<div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px;">' + (d ? '<button class="btn danger" style="margin-right:auto;" onclick="removeFinDue196(\'' + d.id + '\')">🗑 Sil</button>' : '') + '<button class="btn secondary" onclick="document.getElementById(\'modal-fin-due\').remove()">Vazgeç</button><button class="btn" onclick="saveFinDue196(\'' + (d ? d.id : '') + '\')">Kaydet</button></div></div>';
  document.body.appendChild(mdl);
  finFillCpSelect196(document.getElementById('fd-cp'), '— (isteğe bağlı)', d ? (d.counterpartyId || '') : '');
  finFillAccountSelect196(document.getElementById('fd-acc'), '— (ödeme anında)', d ? (d.accountId || '') : '');
}
function saveFinDue196(id) {
  __finNormalize196(state);
  const title = ((document.getElementById('fd-title') || {}).value || '').trim(); const amount = finR2_196((document.getElementById('fd-amount') || {}).value); const due = (document.getElementById('fd-due') || {}).value || '';
  if (!title) { alert('Başlık gir.'); return; } if (amount <= 0) { alert('Tutar 0\'dan büyük olmalı.'); return; } if (!due) { alert('Vade tarihi seç.'); return; }
  const d = id ? (state.finDues || []).find(function(x){ return x && x.id === id; }) : null;
  const rec = d || { id: uid(), kind: 'due', dtype: 'manual', status: 'open', createdAt: new Date().toISOString() };
  __undoSnapshot('Vade: ' + title);
  rec.title = title; rec.amount = amount; rec.dueDate = due; rec.period = String(due).slice(0, 7); rec.category = (document.getElementById('fd-cat') || {}).value || 'Diğer';
  rec.counterpartyId = (document.getElementById('fd-cp') || {}).value || ''; rec.accountId = (document.getElementById('fd-acc') || {}).value || '';
  rec.resmi = !!((document.getElementById('fd-resmi') || {}).checked); rec.kdvRate = rec.resmi ? (+((document.getElementById('fd-kdv') || {}).value) || 0) : 0; rec.note = ((document.getElementById('fd-note') || {}).value || '').trim();
  if (!d) state.finDues.push(rec);
  const mdl = document.getElementById('modal-fin-due'); if (mdl) mdl.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
}
async function removeFinDue196(id) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === id; }); if (!d || d.status !== 'open') return;
  const ok = await plConfirm('«' + d.title + '» kalemi silinecek. Emin misin?', 'Evet, sil'); if (!ok) return;
  __undoSnapshot('Vade sil: ' + d.title);
  state.finDues = (state.finDues || []).filter(function(x){ return !(x && x.id === id); });
  const mdl = document.getElementById('modal-fin-due'); if (mdl) mdl.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
}
function finPayItem196(id) { // vade listesindeki tik — türüne göre doğru akış
  const it = finDueItems196().find(function(x){ return x.id === id; }); if (!it) return;
  if (it.dtype === 'instructor') { payInstructor(it.instructorId, it.ay, it.hak); return; }
  if (it.dtype === 'card' && it.derived) { openFinMoveModal196('cardpay'); try { const to = document.getElementById('fm-to'); if (to) to.value = it.accountId; const am = document.getElementById('fm-amount'); if (am) am.value = it.amount; __finMoveFields196(); } catch(e) {} return; }
  finPayDueModal196(id);
}
// ─────────── EKRAN: VADELER ───────────
let __finDueWin196 = (function(){ try { return +localStorage.getItem('pilateria_fin_due_win') || 30; } catch(e) { return 30; } })();
function finSetDueWin196(v) { __finDueWin196 = +v || 30; try { localStorage.setItem('pilateria_fin_due_win', String(__finDueWin196)); } catch(e) {} renderFinDues196(); }
function finDueRow196(it, side) {
  const cls = 'fin-row' + (it.overdue ? ' overdue' : '') + (it.estimate ? ' est' : '');
  const who = it.counterpartyId ? '<small style="color:var(--muted)"> · ' + escapeHtml(finCounterpartyName196(it.counterpartyId)) + '</small>' : '';
  let act = '';
  if (side === 'pay') {
    if (it.dtype === 'instructor') act = '<button class="btn small ok" onclick="finPayItem196(\'' + it.id + '\')">💸 Öde</button>';
    else if (it.dtype === 'card') act = '<button class="btn small ok" onclick="finPayItem196(\'' + it.id + '\')">🏦 Öde</button>';
    else act = '<button class="btn small ok" onclick="finPayItem196(\'' + it.id + '\')" title="Ödendi — hesap sorar, gider yazar">✓ Öde</button> <button class="btn small secondary" onclick="openFinDueModal196(\'' + it.id + '\')" title="Düzenle">✎</button> <button class="btn small secondary" onclick="finSkipDue196(\'' + it.id + '\')" title="Bu dönem atla">Atla</button>';
  } else {
    if (it.dtype === 'member') act = '<button class="btn small ok" onclick="openPaymentModal(\'' + it.memberId + '\',null,\'' + (it.groupId || '') + '\',\'' + it.ay + '\')">+ Ödeme</button>';
    else act = '<span class="fin-note">tahmin</span>';
  }
  return '<div class="' + cls + '"><span class="d">' + fmtDate(it.dueDate) + (it.overdue ? ' <small>gecikti</small>' : '') + '</span><span class="t">' + escapeHtml(it.title) + who + (it.accountId && side === 'pay' && it.dtype !== 'card' ? '<small style="color:var(--muted)"> · ' + escapeHtml(finAccountLabel196(it.accountId)) + '</small>' : '') + '</span><span class="a">' + money(it.amount) + ' ₺</span><span>' + act + '</span></div>';
}
function renderFinDues196() {
  const el = document.getElementById('fin-dues-body'); if (!el) return;
  try { finEnsureTemplateDues196(); } catch(e) {}
  const today = todayISO(); const limit = addDaysISO(today, __finDueWin196);
  const inWin = function(it){ return it.overdue || String(it.dueDate) <= limit; };
  const pay = finDueItems196().filter(inWin); const rec = finReceivables196().filter(inWin); const ren = finRenewals196().filter(function(it){ return String(it.dueDate) <= limit; });
  const sum = function(arr){ return finR2_196(arr.reduce(function(a, x){ return a + (+x.amount || 0); }, 0)); };
  const payOver = pay.filter(function(x){ return x.overdue; }), recOver = rec.filter(function(x){ return x.overdue; });
  const winSel = '<select onchange="finSetDueWin196(this.value)" style="max-width:140px;">' + [30, 60, 90].map(function(v){ return '<option value="' + v + '"' + (v === __finDueWin196 ? ' selected' : '') + '>' + v + ' gün</option>'; }).join('') + '</select>';
  const tpls = (state.finTemplates || []).filter(Boolean).slice().sort(function(a, b){ return String(a.title).localeCompare(String(b.title), 'tr'); });
  el.innerHTML = '<div class="row between" style="flex-wrap:wrap;gap:8px;align-items:center;"><h2 style="margin:0;">⏰ Vadeler</h2><div class="row" style="gap:8px;align-items:center;">' + winSel + '<button class="btn small" onclick="openFinDueModal196(\'\')">+ Vadeli kalem</button><button class="btn small secondary" onclick="openFinTemplateModal196(\'\')">+ Şablon</button></div></div>' +
    (!finActive196() ? '<div class="fin-warn">Hesaplar henüz açılmadı — ödeme tikleri hesap ister. 🏦 Hesaplar sekmesinden başlangıcı gir.</div>' : '') +
    '<div class="fin-cols" style="margin-top:8px;">' +
    '<div class="fin-col"><h3>📤 Yaklaşan Ödemeler</h3><div class="fin-tot">' + __finDueWin196 + ' gün: <b>' + money(sum(pay)) + ' ₺</b> (' + pay.length + ' kalem)' + (payOver.length ? ' · <b style="color:var(--bad)">gecikti ' + money(sum(payOver)) + ' ₺</b>' : '') + '</div>' + (pay.length ? pay.map(function(it){ return finDueRow196(it, 'pay'); }).join('') : '<div class="empty">Bu pencerede ödeme yok.</div>') + '</div>' +
    '<div class="fin-col"><h3>📥 Yaklaşan Tahsilatlar</h3><div class="fin-tot">' + __finDueWin196 + ' gün: <b>' + money(sum(rec)) + ' ₺</b> (' + rec.length + ' kalem)' + (recOver.length ? ' · <b style="color:var(--bad)">gecikti ' + money(sum(recOver)) + ' ₺</b>' : '') + (ren.length ? ' · beklenen yenileme <b>' + money(sum(ren)) + ' ₺</b> (' + ren.length + ', tahmin)' : '') + '</div>' + (rec.length || ren.length ? rec.map(function(it){ return finDueRow196(it, 'rec'); }).join('') + ren.map(function(it){ return finDueRow196(it, 'rec'); }).join('') : '<div class="empty">Bu pencerede tahsilat yok.</div>') + '</div>' +
    '</div>' +
    '<div class="fin-sec">🔁 Tekrar eden kalemler (şablonlar) <small class="fin-note">her ay vade listesine kendiliğinden düşer</small></div>' +
    (tpls.length ? tpls.map(function(tp){ return '<div class="fin-row' + (tp.active === false ? ' est' : '') + '"><span class="t"><b>' + escapeHtml(tp.title) + '</b>' + (tp.active === false ? ' <span class="badge">pasif</span>' : '') + '<small style="color:var(--muted)"> · ayın ' + (tp.dayOfMonth || 1) + '\'i · ' + escapeHtml(tp.category || '') + (tp.counterpartyId ? ' · ' + escapeHtml(finCounterpartyName196(tp.counterpartyId)) : '') + (tp.accountId ? ' · ' + escapeHtml(finAccountLabel196(tp.accountId)) : '') + (tp.endMonth ? ' · bitiş ' + tp.endMonth : '') + '</small></span><span class="a">' + money(tp.amount) + ' ₺</span><span><button class="btn small secondary" onclick="openFinTemplateModal196(\'' + tp.id + '\')">✎</button></span></div>'; }).join('') : '<div class="fin-note">Şablon yok — kira, muhasebeci, SGK, Bağkur gibi her ay tekrar edenleri bir kez tanımla.</div>');
}
// ─────────── EKRAN: CARİ ───────────
function renderFinCari196() {
  const el = document.getElementById('fin-cari-body'); if (!el) return;
  try { finEnsureTemplateDues196(); } catch(e) {}
  const sum = function(arr){ return finR2_196(arr.reduce(function(a, x){ return a + (+x.amount || 0); }, 0)); };
  // A) üyeler (bize borçlu) — birim bazlı toplama
  const recv = finReceivables196(); const byUnit = {};
  recv.forEach(function(r){ const k = (r.groupId ? 'g:' + r.groupId : 'm:' + r.memberId); if (!byUnit[k]) byUnit[k] = { key: k, label: r.label, memberId: r.memberId, groupId: r.groupId, amount: 0, overdue: false, months: [] }; byUnit[k].amount = finR2_196(byUnit[k].amount + r.amount); if (r.overdue) byUnit[k].overdue = true; byUnit[k].months.push(r.ay); });
  const units = Object.values(byUnit).sort(function(a, b){ return (b.overdue - a.overdue) || b.amount - a.amount; });
  // B) hocalar (biz borçluyuz)
  const insD = finInstructorDues196(); const byIns = {};
  insD.forEach(function(d){ if (!byIns[d.instructorId]) byIns[d.instructorId] = { instructorId: d.instructorId, name: instructorName(d.instructorId), amount: 0, months: [] }; byIns[d.instructorId].amount = finR2_196(byIns[d.instructorId].amount + d.amount); byIns[d.instructorId].months.push(d.ay); });
  const insRows = Object.values(byIns).sort(function(a, b){ return b.amount - a.amount; });
  // C) dış cariler
  const cps = finCounterparties196(true);
  const cpRows = cps.map(function(c){ const open = (state.finDues || []).filter(function(d){ return d && d.counterpartyId === c.id && d.status === 'open'; }); const paidYear = (state.expenses || []).filter(function(e){ return e && e.counterpartyId === c.id && String(e.paidDate || e.date || '').slice(0, 4) === todayISO().slice(0, 4); }); return { c: c, open: sum(open), openN: open.length, overdue: open.some(function(d){ return String(d.dueDate) < todayISO(); }), paidYear: sum(paidYear) }; });
  const cardDebt = finCardDebt196();
  const owe = finR2_196(sum(insD) + cpRows.reduce(function(a, r){ return a + r.open; }, 0) + cardDebt);
  el.innerHTML = '<div class="row between" style="flex-wrap:wrap;gap:8px;align-items:center;"><h2 style="margin:0;">👥 Cari Hesaplar</h2><button class="btn small" onclick="openFinCpModal196(\'\')">+ Dış cari</button></div>' +
    '<div class="fin-bal" style="margin-top:8px;"><span class="chip">Bize borçlu (üyeler): <b>' + money(sum(recv)) + ' ₺</b></span><span class="chip">Biz borçluyuz: <b>' + money(owe) + ' ₺</b> <small style="color:var(--muted)">(hoca ' + money(sum(insD)) + ' · dış cari ' + money(cpRows.reduce(function(a, r){ return a + r.open; }, 0)) + ' · kart ' + money(cardDebt) + ')</small></span></div>' +
    '<div class="fin-sec">📥 Bize borçlu — üyeler <small class="fin-note">(paket ücreti − ödenen; Üyeler sayfasındaki kayıtlardan)</small></div>' +
    (units.length ? units.map(function(u){ return '<div class="fin-row' + (u.overdue ? ' overdue' : '') + '"><span class="t"><b>' + escapeHtml(u.label) + '</b><small style="color:var(--muted)"> · ' + u.months.join(', ') + '</small></span><span class="a">' + money(u.amount) + ' ₺</span><span><button class="btn small secondary" onclick="openFinStatement196(\'' + (u.groupId ? 'group' : 'member') + '\',\'' + (u.groupId || u.memberId) + '\')">Ekstre</button> <button class="btn small ok" onclick="openPaymentModal(\'' + u.memberId + '\',null,\'' + (u.groupId || '') + '\',\'' + u.months[0] + '\')">+ Ödeme</button></span></div>'; }).join('') : '<div class="fin-note">Açık üye alacağı yok.</div>') +
    '<div class="fin-sec">📤 Biz borçluyuz — hocalar <small class="fin-note">(hakediş − ödenen; "Ortak" işaretli hoca hariç)</small></div>' +
    (insRows.length ? insRows.map(function(r){ return '<div class="fin-row"><span class="t"><b>' + escapeHtml(r.name) + '</b><small style="color:var(--muted)"> · ' + r.months.join(', ') + '</small></span><span class="a">' + money(r.amount) + ' ₺</span><span><button class="btn small secondary" onclick="openFinStatement196(\'instructor\',\'' + r.instructorId + '\')">Ekstre</button> <button class="btn small ok" onclick="switchPage(\'instructors\')">Hocalar</button></span></div>'; }).join('') : '<div class="fin-note">Açık hoca hakedişi yok.</div>') +
    '<div class="fin-sec">🏢 Dış cariler <small class="fin-note">(kiralayan, tedarikçi, muhasebeci, SGK/vergi…)</small></div>' +
    (cpRows.length ? cpRows.map(function(r){ return '<div class="fin-row' + (r.overdue ? ' overdue' : '') + (r.c.active === false ? ' est' : '') + '"><span class="t"><b>' + escapeHtml(r.c.name) + '</b><small style="color:var(--muted)"> · ' + (FIN_CP_TYPES196[r.c.type] || '') + (r.c.active === false ? ' · pasif' : '') + ' · bu yıl ödenen ' + money(r.paidYear) + ' ₺</small></span><span class="a">' + (r.openN ? money(r.open) + ' ₺' : '—') + '</span><span><button class="btn small secondary" onclick="openFinStatement196(\'cp\',\'' + r.c.id + '\')">Ekstre</button> <button class="btn small secondary" onclick="openFinCpModal196(\'' + r.c.id + '\')">✎</button></span></div>'; }).join('') : '<div class="fin-note">Dış cari yok — "+ Dış cari" ile ekle.</div>');
}
function openFinStatement196(kind, id) {
  const old = document.getElementById('modal-fin-stm'); if (old) old.remove();
  let title = '', rows = [], bal = 0; const r2 = finR2_196;
  if (kind === 'member' || kind === 'group') {
    const g = kind === 'group' ? (state.groups || []).find(function(x){ return x && x.id === id; }) : null; const m = kind === 'member' ? (state.members || []).find(function(x){ return x && x.id === id; }) : null;
    title = (g ? groupDisplayName(g, currentMonth()) : (m ? m.name : id)) + ' — üye ekstresi';
    const months = {}; (getOverduePayments({ includeFuture: true }) || []).forEach(function(o){ if ((kind === 'group' ? o.groupId === id : (!o.groupId && o.memberId === id))) (o.monthsDetail || []).forEach(function(r){ months[r.ay] = r; }); });
    const pays = (state.payments || []).filter(function(p){ return p && (kind === 'group' ? p.groupId === id : (p.memberId === id && !p.groupId)); });
    const allM = {}; Object.keys(months).forEach(function(k){ allM[k] = 1; }); pays.forEach(function(p){ allM[paymentMonthOf(p)] = 1; });
    Object.keys(allM).sort().forEach(function(ay){ const r = months[ay]; if (r) { rows.push({ d: ay + '-01', t: ay + ' paket ücreti', a: r.expected, dir: 1 }); } pays.filter(function(p){ return paymentMonthOf(p) === ay; }).sort(function(a, b){ return String(a.date).localeCompare(String(b.date)); }).forEach(function(p){ rows.push({ d: p.date, t: 'ödeme · ' + (p.method || '') + (kind === 'group' ? ' · ' + memberName(p.memberId) : '') + (p.note ? ' · ' + p.note : ''), a: +p.amount || 0, dir: -1 }); }); });
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
  let run = 0; const body = rows.map(function(r){ if (!(r.direct)) run = r2(run + r.dir * r.a); else run = r2(run); return '<tr><td>' + fmtDate(r.d) + '</td><td>' + escapeHtml(r.t) + '</td><td style="text-align:right;">' + (r.dir > 0 ? money(r.a) : '') + '</td><td style="text-align:right;">' + (r.dir < 0 ? money(r.a) : '') + '</td><td style="text-align:right;"><b>' + money(run) + '</b></td></tr>'; }).join('');
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-stm'; mdl.className = 'modal-bg open';
  mdl.innerHTML = '<div class="modal" style="max-width:720px;"><h3>📄 ' + escapeHtml(title) + '</h3><div class="fin-note">Borç = ücret/hakediş/kalem; alacak = ödeme. Bakiye pozitifse ödenmemiş tutar vardır.' + (kind === 'cp' ? ' Vadesiz girilen giderler bilgi olarak listelenir, bakiyeyi etkilemez.' : '') + '</div><div class="table-wrap"><table class="fin-table"><thead><tr><th>Tarih</th><th>Açıklama</th><th style="text-align:right;">Borç</th><th style="text-align:right;">Ödeme</th><th style="text-align:right;">Bakiye</th></tr></thead><tbody>' + (body || '<tr><td colspan="5"><div class="empty">Kayıt yok.</div></td></tr>') + '</tbody></table></div><div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px;"><button class="btn secondary" onclick="document.getElementById(\'modal-fin-stm\').remove()">Kapat</button></div></div>';
  document.body.appendChild(mdl);
}
function renderPayments() {
  try { __renderPaymentRecords196(); }""")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
