# -*- coding: utf-8 -*-
# v200 — ORTAK KASA (Kerem 18.10): "Bu işletme benim ve eşimin; kasa ortak; bütün evimizin/hayatımızın giderleri ortak kasada;
# benim 100 bin TL maaşım var ayın 5'inde; Derya'nın bütün giderleri bizim giderlerimiz; vergileri kredi kartından ödüyorum;
# ev kirası 22 bin ayın 10'u benim hesabımdan; işveren masraflarını hiç katma; stüdyonun tek başına net kazancını da net görmek isterim;
# hiçbiri karışmamalı."
# (A) EKSTRE OKUYUCU — gerçek Garanti/VakıfBank biçimleri: "03 Ekim 2026" tarih; "1,924.50" / "1.260,00" / "570.00" sayı biçimi (son
#     ayraç ondalık); taksit ("1.260,00x6=7.560,00", "1x1,924.50") ve puan sütunları; +tutar / tutar+ = alacak; ÖNCEKİ DÖNEM / DEVİR /
#     Toplam Harcama / HESAP ÖZETİ satırları atlanır; ÖDEMENİZ İÇİN TEŞEKKÜRLER = kart ödemesi; tarihsiz FAİZ/ÜCRET satırı kesim tarihli
#     gider; Dönem Borcunuz / Toplam Borcunuz / Asgari / Minimum Ödeme meta. Vakıf: tutar = açıklamadan sonraki İLK tutar; Garanti: SON.
# (B) KAPSAM — gider.scope 'studio'|'hane' (eski business===false → hane); kartta scopeDefault + employerSkip; önizlemede satır başına
#     Stüdyo / Hane / Atla(işveren); stüdyo ipuçları (vergi kodu 0015/0003, SGK, Bağ-Kur taban tutarı, reklam, Natro, fatura); işveren
#     ipuçları (otel/uçuş/otobüs bileti/araç kiralama/otopark) → atla; hane kategorileri; mükerrer: aynı hesap+tarih+tutar gider;
#     hane satırı GİDER (çekim yok); atlanan satır yazılmaz (parmak izi tutulur); kart kalemi = ekstre toplamı − atlananlar.
# (C) GELİR — finMoves op 'income' {toAccountId, scope, title}; şablon flow 'in' → vade dtype 'income' → "Alındı" → gelir hareketi;
#     projeksiyon + ; Hareketler türü 'gelir'; nakit akış tablosu 'in:gelir'.
# (D) HESAP — yeni hesapta tür (kart/banka/kasa); RAPOR — Stüdyo net, Diğer gelir, Hane giderleri, Hane net; netProfitForMonth
#     (Aylık Rapor) hane giderini SAYMAZ; Giderler listesinde hane rozeti; gider formunda kapsam seçici.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:120])
    s = s.replace(old, new)

# ═══════════ (B/D) KATEGORİLER + GİDER FORMU ═══════════
rep("const EXPENSE_CATS = ['Kira','Elektrik/Su/Doğalgaz','Malzeme/Ekipman','Temizlik','Pazarlama','Vergi/SGK','Stopaj','Bağkur','KDV Ödemesi','Hoca Maaşı','Diğer'];",
    "const EXPENSE_CATS = ['Kira','Elektrik/Su/Doğalgaz','Malzeme/Ekipman','Temizlik','Pazarlama','Vergi/SGK','Stopaj','Bağkur','KDV Ödemesi','Hoca Maaşı','Abonelik/İletişim','Market/Yemek','Giyim','Sağlık','Ulaşım/Yakıt','Diğer']; // v200: hane kategorileri eklendi\n"
    "const FIN_SCOPES200 = { studio: 'Stüdyo', hane: 'Hane' }; // v200 ORTAK KASA: her gider stüdyo ya da hane kapsamında; ikisi de kasaya/bakiyeye girer, resmi defter yalnız resmi stüdyo giderini görür\n"
    "function finExpScope200(e) { if (!e) return 'studio'; if (e.scope === 'hane') return 'hane'; if (e.business === false) return 'hane'; return 'studio'; }")
rep("""        <select id="exp-cp" class="pl-owner-only" title="Karşı taraf (cari) — isteğe bağlı"></select>
""",
"""        <select id="exp-cp" class="pl-owner-only" title="Karşı taraf (cari) — isteğe bağlı"></select>
        <select id="exp-scope" class="pl-owner-only" title="Kapsam: stüdyo gideri mi, hane (ev/aile) gideri mi — ikisi de ortak kasadan çıkar"><option value="studio">Stüdyo</option><option value="hane">Hane</option></select>
""")
# addExpense: kapsam
rep("""  const __vadeli196 = !!((document.getElementById('exp-vadeli')||{}).checked);
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış — Ayarlar/Finans uyarısındaki SQL önce çalıştırılmalı.'); return; }""",
"""  const __vadeli196 = !!((document.getElementById('exp-vadeli')||{}).checked);
  const __scope200 = ((document.getElementById('exp-scope')||{}).value) === 'hane' ? 'hane' : 'studio'; // v200
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış — Ayarlar/Finans uyarısındaki SQL önce çalıştırılmalı.'); return; }""")
rep("""    state.finDues.push({ id: uid(), kind: 'due', dtype: 'expense', title: note || cat, amount: Math.round(amount*100)/100, dueDate: __due, period: String(__due).slice(0, 7), category: cat, counterpartyId: __cp196, accountId: __acc196, resmi: resmi, kdvRate: resmi ? ekdv : 0, status: 'open', note: '', createdAt: new Date().toISOString() });""",
"""    state.finDues.push({ id: uid(), kind: 'due', dtype: 'expense', title: note || cat, amount: Math.round(amount*100)/100, dueDate: __due, period: String(__due).slice(0, 7), category: cat, counterpartyId: __cp196, accountId: __acc196, resmi: resmi, kdvRate: resmi ? ekdv : 0, scope: __scope200, status: 'open', note: '', createdAt: new Date().toISOString() });""")
rep("""  state.expenses.push({ id: uid(), date: date, category: cat, amount: Math.round(amount*100)/100, note: note, resmi: resmi, kdvRate: resmi ? ekdv : 0, accountId: __acc196, counterpartyId: __cp196, source: 'manual' });""",
"""  state.expenses.push({ id: uid(), date: date, category: cat, amount: Math.round(amount*100)/100, note: note, resmi: resmi, kdvRate: resmi ? ekdv : 0, accountId: __acc196, counterpartyId: __cp196, scope: __scope200, source: 'manual' });""")
# Giderler listesi: hane rozeti + toplam ayrımı
rep("""  if (totEl) totEl.innerHTML = list.length ? `${ay}: <b>${money(expensesTotalForMonth(ay))} ₺</b> (${list.length} kayıt)` : `${ay}: kayıt yok`;""",
"""  if (totEl) { const __h200 = Math.round(list.filter(e => finExpScope200(e) === 'hane').reduce((a, e) => a + (+e.amount || 0), 0) * 100) / 100; const __tot200 = expensesTotalForMonth(ay); totEl.innerHTML = list.length ? `${ay}: <b>${money(__tot200)} ₺</b> (${list.length} kayıt)` + (__h200 ? ` · stüdyo ${money(Math.round((__tot200 - __h200) * 100) / 100)} · 🏠 hane ${money(__h200)}` : '') : `${ay}: kayıt yok`; } // v200""")
rep("""    <span class="badge" style="background:#ECEFF1;color:#37474F;">${escapeHtml(e.category||'Diğer')}</span>${e.resmi ? `<span title="Faturalı/resmi${(+e.kdvRate||0) > 0 ? ' — KDV %' + (+e.kdvRate) : ''}">🧾</span>` : ''}""",
"""    <span class="badge" style="background:#ECEFF1;color:#37474F;">${escapeHtml(e.category||'Diğer')}</span>${finExpScope200(e) === 'hane' ? `<span class="badge" style="background:#FFF3E0;color:#7a4a00;" title="Hane (ev/aile) gideri — ortak kasadan, resmi deftere girmez">🏠 hane</span>` : ''}${e.resmi ? `<span title="Faturalı/resmi${(+e.kdvRate||0) > 0 ? ' — KDV %' + (+e.kdvRate) : ''}">🧾</span>` : ''}""")
# netProfitForMonth: hane hariç (stüdyo net), hane ayrı alan
rep("""  const exp = Math.round((expensesTotalForMonth(monthISO) - expMaas) * 100) / 100;
  return { rev: Math.round(rev*100)/100, pay: pay, exp: exp, expMaas: expMaas, net: Math.round((rev - pay - exp)*100)/100 };""",
"""  const hane = Math.round(expensesForMonth(monthISO).filter(function(e){ return e && finExpScope200(e) === 'hane'; }).reduce(function(a,e){ return a + (+e.amount||0); }, 0) * 100) / 100; // v200: hane gideri stüdyo netine GİRMEZ
  const exp = Math.round((expensesTotalForMonth(monthISO) - expMaas - hane) * 100) / 100;
  return { rev: Math.round(rev*100)/100, pay: pay, exp: exp, expMaas: expMaas, hane: hane, net: Math.round((rev - pay - exp)*100)/100 };""")

# ═══════════ (C) GELİR HAREKETİ ═══════════
rep("var FIN_MOVE_OPS196 = { transfer:'Virman', cardpay:'Kart borcu ödemesi', draw:'Ortak çekimi', capital:'Sermaye', reconcile:'Mutabakat' };",
    "var FIN_MOVE_OPS196 = { transfer:'Virman', cardpay:'Kart borcu ödemesi', income:'Gelir (maaş / iade / diğer)', draw:'Ortak çekimi', capital:'Sermaye', reconcile:'Mutabakat' }; // v200: income")
rep("""    else if (mv.op === 'capital') { if (!amt) return; push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.toAccountId || mv.accountId, dir: 1, amount: Math.abs(amt), type: 'sermaye', who: 'Sermaye' + (mv.partner ? ' · ' + mv.partner : ''), note: nt }); }""",
"""    else if (mv.op === 'capital') { if (!amt) return; push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.toAccountId || mv.accountId, dir: 1, amount: Math.abs(amt), type: 'sermaye', who: 'Sermaye' + (mv.partner ? ' · ' + mv.partner : ''), note: nt }); }
    else if (mv.op === 'income') { if (!amt) return; push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.toAccountId || mv.accountId, dir: 1, amount: Math.abs(amt), type: 'gelir', who: (mv.title || 'Gelir') + (mv.scope === 'hane' ? ' · hane' : ''), note: nt, scope: mv.scope === 'hane' ? 'hane' : 'studio' }); } // v200""")
# hareketler: gider hareketine kapsam (hane) etiketi
rep("""    push({ id: 'exp:' + e.id, src: 'expense', srcId: e.id, date: String(e.paidDate || e.date || '').slice(0, 10), accountId: e.accountId || '', dir: amt > 0 ? -1 : 1, amount: Math.abs(amt), type: 'gider', who: (e.category || 'Diğer') + (e.counterpartyId ? ' · ' + finCounterpartyName196(e.counterpartyId) : ''), note: e.note || '' });""",
"""    push({ id: 'exp:' + e.id, src: 'expense', srcId: e.id, date: String(e.paidDate || e.date || '').slice(0, 10), accountId: e.accountId || '', dir: amt > 0 ? -1 : 1, amount: Math.abs(amt), type: 'gider', who: (e.category || 'Diğer') + (finExpScope200(e) === 'hane' ? ' · 🏠 hane' : '') + (e.counterpartyId ? ' · ' + finCounterpartyName196(e.counterpartyId) : ''), note: e.note || '', scope: finExpScope200(e) });""")
# hane giderleri de harekete girer (v196'da business===false dışlanıyordu — artık çekim değil gider)
rep("""    if (!e || !e.id) return; if (e.status === 'open') return; if (e.business === false) return; if (e.category === 'Hoca Maaşı') return;""",
"""    if (!e || !e.id) return; if (e.status === 'open') return; if (e.category === 'Hoca Maaşı') return; /* v200: hane gideri de kasadan çıkar */""")
rep("""  const typeLbl = { tahsilat: '💳 Üye tahsilatı', iade: '↩️ İade', gider: '💸 Gider', hoca: '🧑‍🏫 Hoca ödemesi', virman: '🔁 Virman', cekim: '👤 Ortak çekimi', sermaye: '🏷️ Sermaye', mutabakat: '🧮 Mutabakat', kart: '💳 Kart borcu ödemesi' };""",
"""  const typeLbl = { tahsilat: '💳 Üye tahsilatı', iade: '↩️ İade', gider: '💸 Gider', hoca: '🧑‍🏫 Hoca ödemesi', virman: '🔁 Virman', cekim: '👤 Ortak çekimi', sermaye: '🏷️ Sermaye', mutabakat: '🧮 Mutabakat', kart: '💳 Kart borcu ödemesi', gelir: '💰 Gelir' }; // v200""")
rep("""<option value="sermaye">Sermaye</option><option value="mutabakat">Mutabakat</option><option value="kart">Kart borcu ödemesi</option></select>""",
    """<option value="sermaye">Sermaye</option><option value="gelir">Gelir (maaş / iade)</option><option value="mutabakat">Mutabakat</option><option value="kart">Kart borcu ödemesi</option></select>""")
# hareket penceresi: gelir alanları
rep("""    '<div class="field" id="fm-partner-wrap" style="display:none;"><label>Ortak</label>'""",
"""    '<div class="field" id="fm-title-wrap" style="display:none;"><label>Gelir başlığı</label><input id="fm-title" placeholder="örn. Kerem maaş, işveren iadesi"><div class="row" style="gap:10px;margin-top:6px;align-items:center;"><label style="font-size:12.5px;">Kapsam</label><select id="fm-scope"><option value="hane">Hane (maaş vb.)</option><option value="studio">Stüdyo</option></select></div></div>' +
    '<div class="field" id="fm-partner-wrap" style="display:none;"><label>Ortak</label>'""")
rep("""  show('fm-to-wrap', op === 'transfer' || op === 'cardpay' || op === 'capital');""",
    """  show('fm-to-wrap', op === 'transfer' || op === 'cardpay' || op === 'capital' || op === 'income');
  show('fm-title-wrap', op === 'income'); // v200""")
rep("""  const tl = document.querySelector('#fm-to-wrap label'); if (tl) tl.textContent = op === 'capital' ? 'Hangi hesaba kondu' : (op === 'cardpay' ? 'Ödenen kart' : 'Giren hesap');""",
    """  const tl = document.querySelector('#fm-to-wrap label'); if (tl) tl.textContent = op === 'capital' ? 'Hangi hesaba kondu' : (op === 'cardpay' ? 'Ödenen kart' : (op === 'income' ? 'Hangi hesaba girdi' : 'Giren hesap'));""")
rep("""    else if (op === 'capital') { if (!to) { alert('Hesap seç.'); return; } mv.toAccountId = to; mv.partner = partner; }
    const chk = [mv.fromAccountId, mv.toAccountId].filter(Boolean).map(finAccount196);""",
"""    else if (op === 'capital') { if (!to) { alert('Hesap seç.'); return; } mv.toAccountId = to; mv.partner = partner; }
    else if (op === 'income') { if (!to) { alert('Hesap seç.'); return; } mv.toAccountId = to; mv.title = ((document.getElementById('fm-title') || {}).value || '').trim() || 'Gelir'; mv.scope = ((document.getElementById('fm-scope') || {}).value) === 'studio' ? 'studio' : 'hane'; } // v200
    const chk = [mv.fromAccountId, mv.toAccountId].filter(Boolean).map(finAccount196);""")

# ═══════════ (C) ŞABLON / VADE: yön + kapsam ═══════════
rep("""    '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Başlangıç ayı</label><input type="month" id="ft-start" value="' + (tp ? (tp.startMonth || '') : currentMonth()) + '"></div><div class="field" style="flex:1"><label>Bitiş ayı (boş = süresiz)</label><input type="month" id="ft-end" value="' + (tp ? (tp.endMonth || '') : '') + '"></div></div>' +""",
"""    '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Başlangıç ayı</label><input type="month" id="ft-start" value="' + (tp ? (tp.startMonth || '') : currentMonth()) + '"></div><div class="field" style="flex:1"><label>Bitiş ayı (boş = süresiz)</label><input type="month" id="ft-end" value="' + (tp ? (tp.endMonth || '') : '') + '"></div></div>' +
    '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Yön</label><select id="ft-flow"><option value="out"' + (!tp || tp.flow !== 'in' ? ' selected' : '') + '>Ödeme (gider)</option><option value="in"' + (tp && tp.flow === 'in' ? ' selected' : '') + '>Tahsilat (gelir: maaş vb.)</option></select></div><div class="field" style="flex:1"><label>Kapsam</label><select id="ft-scope"><option value="studio"' + (!tp || tp.scope !== 'hane' ? ' selected' : '') + '>Stüdyo</option><option value="hane"' + (tp && tp.scope === 'hane' ? ' selected' : '') + '>Hane (ev/aile)</option></select></div></div>' +""")
rep("""  rec.startMonth = (document.getElementById('ft-start') || {}).value || currentMonth(); rec.endMonth = (document.getElementById('ft-end') || {}).value || '';
  rec.resmi = !!((document.getElementById('ft-resmi') || {}).checked); rec.kdvRate = rec.resmi ? (+((document.getElementById('ft-kdv') || {}).value) || 0) : 0;""",
"""  rec.startMonth = (document.getElementById('ft-start') || {}).value || currentMonth(); rec.endMonth = (document.getElementById('ft-end') || {}).value || '';
  rec.flow = ((document.getElementById('ft-flow') || {}).value) === 'in' ? 'in' : 'out'; rec.scope = ((document.getElementById('ft-scope') || {}).value) === 'hane' ? 'hane' : 'studio'; // v200
  rec.resmi = !!((document.getElementById('ft-resmi') || {}).checked); rec.kdvRate = rec.resmi ? (+((document.getElementById('ft-kdv') || {}).value) || 0) : 0;""")
rep("""        state.finDues.push({ id: id, kind: 'due', dtype: 'expense', templateId: tp.id, period: m, title: tp.title, amount: finR2_196(tp.amount), dueDate: finDayInMonth196(m, tp.dayOfMonth || 1), category: tp.category || 'Diğer', counterpartyId: tp.counterpartyId || '', accountId: tp.accountId || '', resmi: !!tp.resmi, kdvRate: tp.resmi ? (+tp.kdvRate || 0) : 0, status: 'open', note: '', createdAt: new Date().toISOString() });""",
"""        state.finDues.push({ id: id, kind: 'due', dtype: tp.flow === 'in' ? 'income' : 'expense', templateId: tp.id, period: m, title: tp.title, amount: finR2_196(tp.amount), dueDate: finDayInMonth196(m, tp.dayOfMonth || 1), category: tp.category || 'Diğer', counterpartyId: tp.counterpartyId || '', accountId: tp.accountId || '', resmi: !!tp.resmi, kdvRate: tp.resmi ? (+tp.kdvRate || 0) : 0, scope: tp.scope === 'hane' ? 'hane' : 'studio', status: 'open', note: '', createdAt: new Date().toISOString() }); // v200: yön + kapsam""")
# vade listesi: gelir vadeleri ödeme listesinde değil, tahsilat tarafında
rep("""function finStoredDues196() { __finNormalize196(state); return state.finDues.filter(function(d){ return d && d.status === 'open'; }); }""",
    """function finStoredDues196() { __finNormalize196(state); return state.finDues.filter(function(d){ return d && d.status === 'open' && d.dtype !== 'income'; }); } // v200: gelir vadeleri finIncomeDues200
function finIncomeDues200() { __finNormalize196(state); const today = todayISO(); return state.finDues.filter(function(d){ return d && d.status === 'open' && d.dtype === 'income'; }).map(function(d){ return Object.assign({}, d, { overdue: String(d.dueDate || '') < today }); }).sort(function(a, b){ return String(a.dueDate).localeCompare(String(b.dueDate)); }); }""")
# finPayDue196: gelir vadesi → gelir hareketi
rep("""  const __pre199 = !a.openingDate || date < a.openingDate; // v199: açılış öncesi → kayıt tutulur, bakiyeye girmez (açılış penceresi dışı)
  __undoSnapshot('Vade ödendi: ' + d.title + ' ' + money(amount) + ' ₺');""",
"""  const __pre199 = !a.openingDate || date < a.openingDate; // v199: açılış öncesi → kayıt tutulur, bakiyeye girmez (açılış penceresi dışı)
  if (d.dtype === 'income') { // v200: gelir vadesi → gelir hareketi (maaş, iade…)
    __undoSnapshot('Gelir alındı: ' + d.title + ' ' + money(amount) + ' ₺');
    const mv = { id: uid(), kind: 'move', op: 'income', date: date, amount: amount, toAccountId: acc, scope: d.scope === 'hane' ? 'hane' : 'studio', title: d.title, note: note, dueId: d.id, at: new Date().toISOString() };
    state.finMoves = state.finMoves || []; state.finMoves.push(mv);
    const kalanI = finR2_196(d.amount - amount);
    d.status = 'paid'; d.paidRef = { type: 'move', id: mv.id }; d.paidDate = date; d.paidAmount = amount;
    if (kalanI > 0.05) { let n2 = 1; while (state.finDues.some(function(x){ return x && x.id === d.id + '-k' + n2; })) n2++; state.finDues.push(Object.assign({}, d, { id: d.id + '-k' + n2, amount: kalanI, status: 'open', note: 'kalan (' + fmtDate(date) + ' ' + money(amount) + ' ₺ alındı)', paidRef: undefined, paidDate: undefined, paidAmount: undefined })); }
    const mdlI = document.getElementById('modal-fin-pay'); if (mdlI) mdlI.remove();
    save(); try { __refreshUIInPlace(); } catch(err) {}
    if (window.plToast) plToast('✓ ' + d.title + ' alındı' + (kalanI > 0.05 ? ' · kalan ' + money(kalanI) + ' ₺ açık' : '') + (__pre199 ? ' · açılış öncesi, bakiyeye girmedi' : ''));
    return mv;
  }
  __undoSnapshot('Vade ödendi: ' + d.title + ' ' + money(amount) + ' ₺');""")
rep("""  const e = { id: uid(), date: date, paidDate: date, category: d.category || 'Diğer', amount: amount, note: d.title + (note ? ' — ' + note : ''), resmi: !!d.resmi, kdvRate: d.resmi ? (+d.kdvRate || 0) : 0, accountId: acc, counterpartyId: d.counterpartyId || '', dueId: d.id, source: 'due' };""",
"""  const e = { id: uid(), date: date, paidDate: date, category: d.category || 'Diğer', amount: amount, note: d.title + (note ? ' — ' + note : ''), resmi: !!d.resmi, kdvRate: d.resmi ? (+d.kdvRate || 0) : 0, accountId: acc, counterpartyId: d.counterpartyId || '', scope: d.scope === 'hane' ? 'hane' : 'studio', dueId: d.id, source: 'due' }; // v200: kapsam""")
# ödeme penceresi başlığı (gelir)
rep("""  mdl.innerHTML = '<div class="modal" style="max-width:440px;"><h3>✓ Ödendi: ' + escapeHtml(d.title) + '</h3><div class="fin-note">Vade ' + fmtDate(d.dueDate) + ' · ' + escapeHtml(d.category || '') + (d.counterpartyId ? ' · ' + escapeHtml(finCounterpartyName196(d.counterpartyId)) : '') + '</div>' +""",
"""  mdl.innerHTML = '<div class="modal" style="max-width:440px;"><h3>' + (d.dtype === 'income' ? '✓ Alındı: ' : '✓ Ödendi: ') + escapeHtml(d.title) + '</h3><div class="fin-note">Vade ' + fmtDate(d.dueDate) + ' · ' + escapeHtml(d.category || '') + (d.counterpartyId ? ' · ' + escapeHtml(finCounterpartyName196(d.counterpartyId)) : '') + (d.scope === 'hane' ? ' · 🏠 hane' : '') + '</div>' +""")
rep("""    '<div class="field"><label>Ödeme günü</label><input type="date" id="fp-date" value="' + todayISO() + '" onchange="finPayPreNote199()" oninput="finPayPreNote199()"></div>' +
    '<div class="field"><label>Hesap</label><select id="fp-acc" onchange="finPayPreNote199()"></select></div>' +""",
"""    '<div class="field"><label>' + (d.dtype === 'income' ? 'Alındığı gün' : 'Ödeme günü') + '</label><input type="date" id="fp-date" value="' + todayISO() + '" onchange="finPayPreNote199()" oninput="finPayPreNote199()"></div>' +
    '<div class="field"><label>' + (d.dtype === 'income' ? 'Hangi hesaba girdi' : 'Hesap') + '</label><select id="fp-acc" onchange="finPayPreNote199()"></select></div>' +""")
# Vadeler ekranı: tahsilat tarafına gelir vadeleri
rep("""  const pay = finDueItems196().filter(inWin); const rec = finReceivables196().filter(inWin); const ren = finRenewals196().filter(function(it){ return String(it.dueDate) <= limit; });""",
    """  const pay = finDueItems196().filter(inWin); const rec = finReceivables196().filter(inWin).concat(finIncomeDues200().filter(inWin)); const ren = finRenewals196().filter(function(it){ return String(it.dueDate) <= limit; }); // v200: gelir vadeleri tahsilat tarafında""")
rep("""    if (it.dtype === 'member') act = '<button class="btn small ok" onclick="openPaymentModal(\\'' + it.memberId + '\\',null,\\'' + (it.groupId || '') + '\\',\\'' + it.ay + '\\')">+ Ödeme</button>';
    else act = '<span class="fin-note">tahmin</span>';""",
"""    if (it.dtype === 'member') act = '<button class="btn small ok" onclick="openPaymentModal(\\'' + it.memberId + '\\',null,\\'' + (it.groupId || '') + '\\',\\'' + it.ay + '\\')">+ Ödeme</button>';
    else if (it.dtype === 'income') act = '<button class="btn small ok" onclick="finPayDueModal196(\\'' + it.id + '\\')" title="Alındı — hesap sorar, gelir yazar">✓ Alındı</button> <button class="btn small secondary" onclick="openFinDueModal196(\\'' + it.id + '\\')" title="Düzenle">✎</button> <button class="btn small secondary" onclick="finSkipDue196(\\'' + it.id + '\\')" title="Bu dönem atla">Atla</button>'; // v200
    else act = '<span class="fin-note">tahmin</span>';""")
# projeksiyon: gelir vadeleri giriş
rep("""  finReceivables196().forEach(function(it){ ev.push({ day: Math.max(0, finDaysBetween196(today, it.dueDate)), amount: +it.amount || 0, title: it.title, kind: 'member', overdue: !!it.overdue, id: it.id }); });""",
"""  finReceivables196().forEach(function(it){ ev.push({ day: Math.max(0, finDaysBetween196(today, it.dueDate)), amount: +it.amount || 0, title: it.title, kind: 'member', overdue: !!it.overdue, id: it.id }); });
  finIncomeDues200().forEach(function(it){ ev.push({ day: Math.max(0, finDaysBetween196(today, it.dueDate)), amount: +it.amount || 0, title: it.title, kind: 'income', overdue: !!it.overdue, id: it.id }); }); // v200: beklenen gelir (maaş vb.)""")
# cari: gelir vadesi "biz borçluyuz"a girmez
rep("""  const cpRows = cps.map(function(c){ const open = (state.finDues || []).filter(function(d){ return d && d.counterpartyId === c.id && d.status === 'open'; });""",
    """  const cpRows = cps.map(function(c){ const open = (state.finDues || []).filter(function(d){ return d && d.counterpartyId === c.id && d.status === 'open' && d.dtype !== 'income'; }); /* v200: gelir vadesi borç değil */""")
rep("""  const insD = finInstructorDues196(); const cpOpen = (state.finDues || []).filter(function(d){ return d && d.status === 'open'; });""",
    """  const insD = finInstructorDues196(); const cpOpen = (state.finDues || []).filter(function(d){ return d && d.status === 'open' && d.dtype !== 'income'; }); /* v200 */""")
# cari ekstresi (dış cari): gelir vadeleri listelenmez
rep("""    (state.finDues || []).filter(function(d){ return d && d.counterpartyId === id && d.status !== 'skipped' && finMonthInScope196(String(d.period || d.dueDate || '').slice(0, 7)); }).forEach(function(d){ rows.push(""",
    """    (state.finDues || []).filter(function(d){ return d && d.counterpartyId === id && d.status !== 'skipped' && d.dtype !== 'income' && finMonthInScope196(String(d.period || d.dueDate || '').slice(0, 7)); }).forEach(function(d){ rows.push(""", 2)
# nakit akış tablosu etiketi
rep("""    const lbl = { 'in:tahsilat': 'Giriş · üye tahsilatı', 'in:sermaye': 'Giriş · sermaye',""",
    """    const lbl = { 'in:tahsilat': 'Giriş · üye tahsilatı', 'in:gelir': 'Giriş · diğer gelir (maaş vb.)', 'in:sermaye': 'Giriş · sermaye',""")

# ═══════════ (D) HESAP TÜRÜ ═══════════
rep("""  mdl.innerHTML = '<div class="modal" style="max-width:460px;"><h3>' + (a ? '🏦 ' + escapeHtml(a.name || '') : '💳 Yeni kart hesabı') + '</h3>' +
    '<div class="field"><label>Ad</label><input id="fa-name" value="' + escapeHtml(a ? (a.name || '') : '') + '" placeholder="örn. Garanti Bonus (Kerem)"' + (a && a.type !== 'card' ? '' : '') + '></div>' +""",
"""  mdl.innerHTML = '<div class="modal" style="max-width:460px;"><h3>' + (a ? '🏦 ' + escapeHtml(a.name || '') : '➕ Yeni hesap') + '</h3>' +
    (a ? '' : '<div class="field"><label>Tür</label><select id="fa-type" onchange="__finAccTypeFields200()"><option value="card">💳 Kredi kartı</option><option value="bank">🏦 Banka hesabı (örn. şahsi hesap)</option><option value="cash">💵 Kasa / nakit</option></select></div>') + // v200
    '<div class="field"><label>Ad</label><input id="fa-name" value="' + escapeHtml(a ? (a.name || '') : '') + '" placeholder="örn. Garanti Bonus (Kerem) / Kerem Banka"' + (a && a.type !== 'card' ? '' : '') + '></div>' +""")
rep("""    '<div class="field"><label>' + (isCard ? 'Başlangıçtaki kart borcu (₺)' : 'Açılış bakiyesi (₺)') + '</label><input type="number" id="fa-bal" step="0.01" value="' + (a ? Math.abs(+a.openingBalance || 0) : '') + '" placeholder="₺"></div>' +
    (isCard ? '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Hesap kesim günü</label><input type="number" id="fa-cut" min="1" max="31" value="' + (a && a.cutoffDay ? a.cutoffDay : '') + '"></div><div class="field" style="flex:1"><label>Son ödeme günü</label><input type="number" id="fa-due" min="1" max="31" value="' + (a && a.dueDay ? a.dueDay : '') + '"></div></div>' : '') +""",
"""    '<div class="field"><label id="fa-bal-label">' + (isCard ? 'Başlangıçtaki kart borcu (₺)' : 'Açılış bakiyesi (₺)') + '</label><input type="number" id="fa-bal" step="0.01" value="' + (a ? Math.abs(+a.openingBalance || 0) : '') + '" placeholder="₺"></div>' +
    (isCard ? '<div id="fa-card-wrap"><div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Hesap kesim günü</label><input type="number" id="fa-cut" min="1" max="31" value="' + (a && a.cutoffDay ? a.cutoffDay : '') + '"></div><div class="field" style="flex:1"><label>Son ödeme günü</label><input type="number" id="fa-due" min="1" max="31" value="' + (a && a.dueDay ? a.dueDay : '') + '"></div></div>' +
      '<div class="field"><label>Ekstre satırlarının varsayılan kapsamı</label><select id="fa-scope"><option value="studio"' + (!a || a.scopeDefault !== 'hane' ? ' selected' : '') + '>Stüdyo (bu karttaki her şey stüdyo gideri)</option><option value="hane"' + (a && a.scopeDefault === 'hane' ? ' selected' : '') + '>Hane (vergi/reklam/fatura gibi stüdyo kalemleri kendiliğinden ayrılır)</option></select></div>' +
      '<div class="field"><label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="fa-employer"' + (a && a.employerSkip ? ' checked' : '') + '> İşveren masrafları olabilir — otel/uçuş/otobüs bileti/araç kiralama/otopark satırları "atla" olarak gelsin</label></div></div>' : '') +""")
rep("""  const isCard = !a || a.type === 'card';
  const bal = Math.round((+balRaw || 0) * 100) / 100;
  const rec = a || { id: uid(), kind: 'account', type: 'card', active: true };""",
"""  const __newType200 = a ? a.type : (((document.getElementById('fa-type') || {}).value) || 'card'); // v200: yeni hesapta tür
  const isCard = __newType200 === 'card';
  const bal = Math.round((+balRaw || 0) * 100) / 100;
  const rec = a || { id: uid(), kind: 'account', type: (__newType200 === 'bank' || __newType200 === 'cash') ? __newType200 : 'card', active: true };""")
rep("""  if (isCard) { rec.cutoffDay = +((document.getElementById('fa-cut') || {}).value) || 0; rec.dueDay = +((document.getElementById('fa-due') || {}).value) || 0; const ac = document.getElementById('fa-active'); if (ac) rec.active = !!ac.checked; }""",
"""  if (isCard) { rec.cutoffDay = +((document.getElementById('fa-cut') || {}).value) || 0; rec.dueDay = +((document.getElementById('fa-due') || {}).value) || 0; const ac = document.getElementById('fa-active'); if (ac) rec.active = !!ac.checked; rec.scopeDefault = ((document.getElementById('fa-scope') || {}).value) === 'hane' ? 'hane' : 'studio'; rec.employerSkip = !!((document.getElementById('fa-employer') || {}).checked); } // v200""")
rep("""function saveFinAccount196(id) {""",
"""function __finAccTypeFields200() { // v200: yeni hesap penceresinde tür değişince kart alanları / etiketler
  const ty = ((document.getElementById('fa-type') || {}).value) || 'card';
  const cw = document.getElementById('fa-card-wrap'); if (cw) cw.style.display = ty === 'card' ? '' : 'none';
  const bl = document.getElementById('fa-bal-label'); if (bl) bl.textContent = ty === 'card' ? 'Başlangıçtaki kart borcu (₺)' : 'Açılış bakiyesi (₺)';
  const nm = document.getElementById('fa-name'); if (nm) nm.placeholder = ty === 'card' ? 'örn. Garanti Bonus (Kerem)' : (ty === 'bank' ? 'örn. Kerem Banka' : 'örn. Ev kasası');
}
function saveFinAccount196(id) {""")
# hesap listesi: kart kapsamı rozeti
rep("""      (a.type === 'card' && (a.cutoffDay || a.dueDay) ? '<span class="fin-note">kesim ' + (a.cutoffDay || '—') + ' · son ödeme ' + (a.dueDay || '—') + '</span>' : '') +""",
"""      (a.type === 'card' && (a.cutoffDay || a.dueDay) ? '<span class="fin-note">kesim ' + (a.cutoffDay || '—') + ' · son ödeme ' + (a.dueDay || '—') + '</span>' : '') + (a.type === 'card' ? '<span class="fin-note">· ekstre: ' + (a.scopeDefault === 'hane' ? 'hane' : 'stüdyo') + (a.employerSkip ? ' · işveren satırları atlanır' : '') + '</span>' : '') +""")

# ═══════════ (A) OKUYUCU ═══════════
rep("""const FIN_CAT_HINTS196 = [
  [/İSKİ|ISKI|ASKİ|SU İDARESİ|SU IDARESI|BEDAŞ|BEDAS|AYEDAŞ|AYEDAS|CLK|ENERJİSA|ENERJISA|ELEKTRİK|ELEKTRIK|İGDAŞ|IGDAS|DOĞALGAZ|DOGALGAZ|ENERJİ|ENERJI/, 'Elektrik/Su/Doğalgaz'],
  [/MİGROS|MIGROS|CARREFOUR|A101|BİM |BIM |ŞOK MARKET|SOK MARKET|METRO|KOÇTAŞ|KOCTAS|IKEA|BAUHAUS|TEMİZLİK|TEMIZLIK|CLEAN/, 'Temizlik'],
  [/DECATHLON|SPOR|PILATES|PİLATES|REFORMER|MAT |EKİPMAN|EKIPMAN|HEPSİBURADA|HEPSIBURADA|TRENDYOL|AMAZON|N11/, 'Malzeme/Ekipman'],
  [/REKLAM|ADS|META |FACEBOOK|INSTAGRAM|GOOGLE|CANVA|MATBAA|AFİŞ|AFIS/, 'Pazarlama'],
  [/SGK|SOSYAL GÜVENLİK|SOSYAL GUVENLIK|VERGİ DAİRESİ|VERGI DAIRESI|GİB |GIB /, 'Vergi/SGK'],
  [/KİRA|KIRA/, 'Kira']
];""",
"""const FIN_CAT_HINTS196 = [ // v200: gerçek ekstre işyeri adlarına göre genişletildi; sıra önemli (önce özel, sonra genel)
  [/VERGİ TH.*\\/0015|VERGI TH.*\\/0015|KDV/, 'KDV Ödemesi'],
  [/VERGİ TH.*\\/0003|VERGI TH.*\\/0003|MUHTASAR|STOPAJ/, 'Stopaj'],
  [/BAĞ-KUR|BAGKUR|BAĞKUR|BAG-KUR/, 'Bağkur'],
  [/SGK|SOSYAL GÜVENLİK|SOSYAL GUVENLIK|VERGİ DAİRESİ|VERGI DAIRESI|VERGİ TH|VERGI TH|GİB |GIB |İŞLEM BEDELİ|ISLEM BEDELI/, 'Vergi/SGK'],
  [/İSKİ|ISKI|ASKİ|SU İDARESİ|SU IDARESI|BEDAŞ|BEDAS|AYEDAŞ|AYEDAS|CLK|ENERJİSA|ENERJISA|ELEKTRİK|ELEKTRIK|İGDAŞ|IGDAS|DOĞALGAZ|DOGALGAZ|BSKNTDOG|BAŞKENTGAZ|BASKENTGAZ|BAŞKENT DOĞALGAZ|ENERJİ|ENERJI/, 'Elektrik/Su/Doğalgaz'],
  [/TRKCLL|TURKCELL|SUPERONL|TÜRK TELEKOM|TURK TELEKOM|TTNET|VODAFONE|NETFLIX|SPOTIFY|YOUTUBE|HBOMAX|HBO MAX|AMAZONPRIME|AMAZON PRIME|DISNEY|EXXEN|BLUTV|APPLE\\.COM|ICLOUD|GOOGLE ONE|ABONELİK|ABONELIK/, 'Abonelik/İletişim'],
  [/REKLAM|\\*ADS|GOOGLE \\*ADS|FACEBK|FACEBOOK|INSTAGRAM|META PLATFORMS|CANVA|MATBAA|AFİŞ|AFIS|NATRO|HOSTING|DOMAIN|GODADDY|WIX|SQUARESPACE/, 'Pazarlama'],
  [/ECZANE|ECZANESİ|ECZANESI|DİŞ|DIS SAGLIK|DİŞ SAĞLIK|HASTANE|KLİNİK|KLINIK|POLİKLİNİK|SAĞLIK|SAGLIK|MEDİKAL|MEDIKAL|DOKTOR|OPTİK|OPTIK|ROSSMANN|GRATİS|GRATIS|WATSONS/, 'Sağlık'],
  [/UBER EATS|TRENDYOL YEMEK|YEMEKSEPETİ|YEMEKSEPETI|GETİR|GETIR|MİGROS|MIGROS|CARREFOUR|A101|BİM |BIM |ŞOK|SOK-|SOK MARKET|FILE |FİLE |MARKET|MANAV|KASAP|FIRIN|FİRİN|PASTA|KAHVE|COFFEE|CAFE|KAFE|RESTAURANT|RESTORAN|LOKANTA|PİDE|PIDE|DÖNER|DONER|BURGER|PIZZA|TEKEL|BAKKAL|ŞARKÜTERİ|SARKUTERI|BÜFE|BUFE|CAFFE|STARBUCKS|ESPRESSO/, 'Market/Yemek'],
  [/LEFTIES|PENTI|OYSHO|BEYMEN|ZARA|H&M|MANGO|BERSHKA|STRADIVARIUS|LC WAIKIKI|LCW|KOTON|DEFACTO|ADIDAS|NIKE|PUMA|GİYİM|GIYIM|TEKSTİL|TEKSTIL|AYAKKABI|FLO |DERİMOD|DERIMOD|KITIKATE|EBEBEK|E-BEBEK|ENGLISH HOME|MADAME COCO|BOYNER|İPEKYOL|IPEKYOL|NETWORK|VAKKO/, 'Giyim'],
  [/YANDEX|UBER |BITAKSI|BİTAKSİ|TAKSİ(?!T)|TAKSI(?!T)|TAXI|EGO KART|EGO |METRO İSTANBUL|İETT|IETT|PETROL|AKARYAKIT|SHELL|OPET|BP |TOTAL|AYTEMİZ|AYTEMIZ|POAŞ|POAS|LUKOIL|OTOPARK|İSPARK|ISPARK|HGS|OGS|KÖPRÜ|KOPRU|OTOYOL/, 'Ulaşım/Yakıt'],
  [/TEMİZLİK|TEMIZLIK|CLEAN|KOÇTAŞ|KOCTAS|IKEA|BAUHAUS/, 'Temizlik'],
  [/DECATHLON|SPOR|PILATES|PİLATES|REFORMER|MAT |EKİPMAN|EKIPMAN|HEPSİBURADA|HEPSIBURADA|TRENDYOL|AMAZON|N11|KIRTASİYE|KIRTASIYE|VATAN COMPUTER|TEKNOSA|MEDIA MARKT|MEDIAMARKT/, 'Malzeme/Ekipman'],
  [/KİRA|KIRA/, 'Kira']
];
const FIN_STUDIO_HINT_RX200 = /SGK|SOSYAL GÜVENLİK|VERGİ TH|VERGI TH|VERGİ DAİRESİ|VERGI DAIRESI|GİB |BAĞ-KUR|BAGKUR|MUHTASAR|STOPAJ|KDV|\\*ADS|FACEBK|FACEBOOK|INSTAGRAM|META PLATFORMS|REKLAM|NATRO|HOSTING|DOMAIN|TRKCLL|TURKCELL|SUPERONL|TÜRK TELEKOM|TURK TELEKOM|TTNET|VODAFONE|İSKİ|ASKİ|BEDAŞ|AYEDAŞ|ENERJİSA|ELEKTRİK|İGDAŞ|DOĞALGAZ|BSKNTDOG|BAŞKENTGAZ|BASKENTGAZ|MUHASEBE|KİRA |KIRA |SİGORTA|SIGORTA|PILATES|PİLATES|REFORMER|DECATHLON/; // v200: hane kartında bile STÜDYO olan kalemler
const FIN_EMPLOYER_HINT_RX200 = /OTEL|HOTEL|AJET|TKPAY|THY|TÜRK HAVA|TURK HAVA|PEGASUS|SUNEXPRESS|OBILET|OBİLET|ENUYGUN|BİLETALL|BILETALL|GARENTA|PRATICAR|RENT A CAR|RENTACAR|ARAÇ KİRALAMA|ARAC KIRALAMA|AVIS|BUDGET|HERTZ|SIXT|ESBPARK|HAVAALANI|HAVALİMANI|HAVALIMANI|OTOPARK/; // v200: işveren masrafı olabilecek satırlar (yalnız employerSkip kartta) → atla
const FIN_BAGKUR_AMOUNTS200 = [10156.73, 11808.23]; // 2026 4/b taban primi (5 puan indirimli / indirimsiz) — SGK ödeme satırında Bağ-Kur ipucu""")
rep("""const FIN_PAYMENT_RX196 = /ÖDEME\\s*[-–]?\\s*TEŞEKKÜR|ODEME\\s*[-–]?\\s*TESEKKUR|""",
    """const FIN_PAYMENT_RX196 = /ÖDEMENİZ\\s*İÇİN|ODEMENIZ\\s*ICIN|TEŞEKKÜRLER|TESEKKURLER|ÖDEME\\s*[-–]?\\s*TEŞEKKÜR|ODEME\\s*[-–]?\\s*TESEKKUR|""")
rep("""const FIN_SUMMARY_RX196 = /^(TOPLAM|DÖNEM\\s*BORCU|""",
    """const FIN_ROW_SKIP_RX200 = /ÖNCEKİ\\s*DÖNEM|ONCEKI\\s*DONEM|DEVİR\\s*EDİLEN|DEVIR\\s*EDILEN|DEVREDEN|HESAP\\s*ÖZETİ\\s*BAKİYE|HESAP\\s*OZETI\\s*BAKIYE|TOPLAM\\s*HARCAMA|TOPLAM\\s*TUTAR|ARA\\s*TOPLAM|GENEL\\s*TOPLAM|DÖNEM\\s*İÇİ\\s*İŞLEM|DONEM\\s*ICI\\s*ISLEM|KULLANILABİLİR\\s*LİMİT|KULLANILABILIR\\s*LIMIT/; // v200: tarihli olsa da özet satırı
const FIN_FEE_RX200 = /FAİZ|FAIZ|ÜCRET|UCRET|KOMİSYON|KOMISYON|BEDELİ|BEDELI|BSMV|KKDF|AİDAT|AIDAT|ÜYELİK|UYELIK/; // v200: tarihsiz faiz/ücret satırı → kesim tarihli gider
const FIN_SUMMARY_RX196 = /^(TOPLAM|DÖNEM\\s*BORCU|""")
rep("""function finParseAmountTR196(str) {
  let t = String(str || '').trim(); if (!t) return null;
  let neg = /^-|-$|^\\(|\\)$/.test(t); t = t.replace(/[()\\s]/g, '').replace(/TL|₺|TRY/gi, '').replace(/[+-]/g, '');
  if (/,\\d{1,2}$/.test(t)) t = t.replace(/\\./g, '').replace(',', '.');
  else if (/\\.\\d{1,2}$/.test(t) && !/\\.\\d{3}$/.test(t)) t = t.replace(/,/g, '');
  else t = t.replace(/[.,]/g, '');
  const v = parseFloat(t); if (isNaN(v)) return null;
  return neg ? -v : v;
}""",
"""function finParseAmountTR196(str) { // v200: son ayraç (2 hane öncesi) ondalıktır → "1.924,50" = "1,924.50" = 1924.5; "570.00" = 570; "1.234" = 1234
  let t = String(str || '').trim(); if (!t) return null;
  let neg = /^-|-$|^\\(|\\)$/.test(t); t = t.replace(/[()\\s]/g, '').replace(/TL|₺|TRY/gi, '').replace(/[+-]/g, '');
  const m2 = t.match(/^(.*?)([.,])(\\d{2})$/);
  if (m2) { t = m2[1].replace(/[.,]/g, '') + '.' + m2[3]; }
  else if (/^\\d+[.,]\\d{1}$/.test(t)) { t = t.replace(',', '.'); }
  else t = t.replace(/[.,]/g, '');
  const v = parseFloat(t); if (isNaN(v)) return null;
  return neg ? -v : v;
}
const FIN_TR_MONTHS200 = { OCAK:1, ŞUBAT:2, SUBAT:2, MART:3, NİSAN:4, NISAN:4, MAYIS:5, HAZİRAN:6, HAZIRAN:6, TEMMUZ:7, AĞUSTOS:8, AGUSTOS:8, EYLÜL:9, EYLUL:9, EKİM:10, EKIM:10, KASIM:11, ARALIK:12, OCA:1, ŞUB:2, SUB:2, MAR:3, NİS:4, NIS:4, MAY:5, HAZ:6, TEM:7, AĞU:8, AGU:8, EYL:9, EKİ:10, EKI:10, KAS:11, ARA:12 };""")
# ana ayrıştırıcı
rep("""  const mT = U.match(/(?:D[ÖO]NEM\\s*BORCU|TOPLAM\\s*BOR[ÇC]|EKSTRE\\s*BORCU|HESAP\\s*[ÖO]ZET[İI]\\s*BORCU|TOPLAM\\s*TUTAR|[ÖO]DENECEK\\s*TUTAR)\\s*(?:\\(TL\\))?\\s*:?\\s*(-?\\d{1,3}(?:\\.\\d{3})*,\\d{2}|-?\\d+,\\d{2})/); if (mT) meta.toplam = finParseAmountTR196(mT[1]);
  const mA = U.match(/ASGAR[İI]\\s*(?:[ÖO]DEME)?\\s*(?:TUTARI)?\\s*:?\\s*(\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+,\\d{2})/); if (mA) meta.asgari = finParseAmountTR196(mA[1]);
  const rows = []; const seen = {};
  const DATE_RX = /(\\d{2})[./](\\d{2})(?:[./](\\d{4}|\\d{2}))?/g; const AMT_RX = /[-+]?\\(?\\d{1,3}(?:\\.\\d{3})*,\\d{2}\\)?(?:\\s*(?:TL|₺|TRY))?\\s*[-+]?|[-+]?\\d+,\\d{2}(?:\\s*(?:TL|₺|TRY))?\\s*[-+]?/g;
  all.split(/\\r?\\n/).forEach(function(rawLine){
    const line = rawLine.replace(/\\s+/g, ' ').trim(); if (!line || line.length < 8) return;
    const UL = finTrUpper196(line);
    if (FIN_SUMMARY_RX196.test(UL)) return;
    const dates = []; let m; DATE_RX.lastIndex = 0; while ((m = DATE_RX.exec(line))) { if (+m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12) dates.push({ i: m.index, len: m[0].length, d: +m[1], mo: +m[2], y: m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : 0 }); }
    if (!dates.length) return;
    const amts = []; AMT_RX.lastIndex = 0; while ((m = AMT_RX.exec(line))) { const v = finParseAmountTR196(m[0]); if (v !== null) amts.push({ i: m.index, len: m[0].length, v: v, raw: m[0] }); }
    const amts2 = amts.filter(function(a){ return !dates.some(function(d){ return a.i >= d.i && a.i < d.i + d.len; }); });
    const d0 = dates[0];
    const amts3 = amts2.filter(function(a){ return a.i > d0.i + d0.len; }); // tutar tarihten SONRA gelir (başlık/özet satırları elenir)
    if (!amts3.length) return;
    const amt = amts3[amts3.length - 1];
    let y = d0.y; if (!y) { y = py; if (d0.mo > pm + 1) y = py - 1; if (pm === 1 && d0.mo === 12) y = py - 1; }
    const date = y + '-' + String(d0.mo).padStart(2, '0') + '-' + String(d0.d).padStart(2, '0');
    let descStart = d0.i + d0.len; if (dates[1] && dates[1].i <= descStart + 3) descStart = dates[1].i + dates[1].len;
    let desc = line.slice(descStart, amt.i).replace(/\\s+/g, ' ').trim();
    if (!desc) desc = line.slice(0, d0.i).trim() || line;
    desc = desc.replace(/^[|:\\-–•]+\\s*/, '').replace(/\\s*[|:\\-–]+$/, '').trim();
    const UD = finTrUpper196(desc);
    let v = amt.v; const credit = v < 0 || /İADE|IADE|ALACAK/.test(UD) || /\\)\\s*$/.test(amt.raw) || /-\\s*$/.test(amt.raw);
    v = Math.abs(v); if (!v) return;
    const isPay = credit && FIN_PAYMENT_RX196.test(UD);
    const key = finMerchantKey196(desc);
    const base = date + '|' + v.toFixed(2) + '|' + key; const n = seen[base] || 0; seen[base] = n + 1;
    rows.push({ date: date, desc: desc, amount: v, credit: credit, kind: isPay ? 'payment' : (credit ? 'credit' : 'expense'), key: key, fp: base + '|' + n, raw: line });
  });
  return { meta: meta, rows: rows };
}""",
"""  // v200: genel tutar deseni — son ayraç ondalık ("18.133,59", "74,875.40", "570.00"); meta: Dönem/Toplam Borcunuz, Asgari/Minimum Ödeme
  const AMT_ANY = '(-?\\\\d{1,3}(?:[.,]\\\\d{3})*[.,]\\\\d{2}|-?\\\\d+[.,]\\\\d{2})';
  const mT = U.match(new RegExp('(?:D[ÖO]NEM\\\\s*BORCU(?:NUZ)?|TOPLAM\\\\s*BORCU(?:NUZ)?|TOPLAM\\\\s*BOR[ÇC]|EKSTRE\\\\s*BORCU|HESAP\\\\s*[ÖO]ZET[İI]\\\\s*BORCU|TOPLAM\\\\s*TUTAR|[ÖO]DENECEK\\\\s*TUTAR)\\\\s*(?:\\\\(TL\\\\))?\\\\s*:?\\\\s*' + AMT_ANY)); if (mT) meta.toplam = finParseAmountTR196(mT[1]);
  const mA = U.match(new RegExp('(?:ASGAR[İI]|M[İI]N[İI]MUM)\\\\s*(?:[ÖO]DEME)?\\\\s*(?:TUTARI(?:NIZ)?)?\\\\s*:?\\\\s*' + AMT_ANY)); if (mA) meta.asgari = finParseAmountTR196(mA[1]);
  if (!meta.kesim) { const mK2 = U.match(/(?:HESAP\\s*)?KES[İI]M\\s*(?:TAR[İI]H[İI])?\\s*:?\\s*(\\d{1,2})\\s+([A-ZÇĞİÖŞÜ]{3,8})\\s+(\\d{4})/); if (mK2 && FIN_TR_MONTHS200[mK2[2]]) meta.kesim = mK2[3] + '-' + String(FIN_TR_MONTHS200[mK2[2]]).padStart(2, '0') + '-' + String(+mK2[1]).padStart(2, '0'); }
  if (!meta.sonOdeme) { const mS2 = U.match(/SON\\s*[ÖO]DEME\\s*(?:TAR[İI]H[İI]|G[ÜU]N[ÜU])?\\s*:?\\s*(\\d{1,2})\\s+([A-ZÇĞİÖŞÜ]{3,8})\\s+(\\d{4})/); if (mS2 && FIN_TR_MONTHS200[mS2[2]]) meta.sonOdeme = mS2[3] + '-' + String(FIN_TR_MONTHS200[mS2[2]]).padStart(2, '0') + '-' + String(+mS2[1]).padStart(2, '0'); }
  const pickFirst = meta.bank === 'VakıfBank'; // Vakıf: TUTAR | KALAN TAKSİT | WORLDPUAN → tutar açıklamadan sonraki İLK; Garanti/TF: Tutar son sütun
  const rows = []; const seen = {};
  const DATE_RX = /(\\d{2})[./](\\d{2})(?:[./](\\d{4}|\\d{2}))?/g;
  const DATE_TR_RX = /(\\d{1,2})\\s+([A-Za-zÇĞİÖŞÜçğıöşü]{3,8})\\s+(\\d{4})/g; // "03 Ekim 2026"
  const AMT_RX = /[-+]?\\(?\\d{1,3}(?:[.,]\\d{3})*[.,]\\d{2}\\)?(?:\\s*(?:TL|₺|TRY))?\\s*[-+]?|[-+]?\\d+[.,]\\d{2}(?:\\s*(?:TL|₺|TRY))?\\s*[-+]?/g;
  const feeDate = meta.kesim || (period + '-' + String(new Date(py, pm, 0).getDate()).padStart(2, '0'));
  all.split(/\\r?\\n/).forEach(function(rawLine){
    const line = rawLine.replace(/\\s+/g, ' ').trim(); if (!line || line.length < 8) return;
    const UL = finTrUpper196(line);
    if (FIN_SUMMARY_RX196.test(UL)) return;
    const dates = []; let m; DATE_RX.lastIndex = 0; while ((m = DATE_RX.exec(line))) { if (+m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12) dates.push({ i: m.index, len: m[0].length, d: +m[1], mo: +m[2], y: m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : 0 }); }
    DATE_TR_RX.lastIndex = 0; while ((m = DATE_TR_RX.exec(line))) { const mo = FIN_TR_MONTHS200[finTrUpper196(m[2])]; if (mo && +m[1] >= 1 && +m[1] <= 31) dates.push({ i: m.index, len: m[0].length, d: +m[1], mo: mo, y: +m[3] }); }
    dates.sort(function(a, b){ return a.i - b.i; });
    const amts = []; AMT_RX.lastIndex = 0;
    while ((m = AMT_RX.exec(line))) {
      const v = finParseAmountTR196(m[0]); if (v === null) continue;
      const coreLen = m[0].replace(/\s*[-+]?\s*$/, '').length; // eşleşme sondaki boşluk/işareti de yutar; yapışıklık çekirdeğe göre bakılır
      const before = m.index > 0 ? line[m.index - 1] : ' ', after = line[m.index + coreLen] || ' ';
      const glued = /[A-Za-z0-9=x×%]/.test(before) || /[A-Za-z0-9=x×%]/.test(after); // "1.260,00x6=7.560,00", "1x1,924.50", "%2,84" → taksit/oran, tutar değil
      amts.push({ i: m.index, len: m[0].length, v: v, raw: m[0], glued: glued });
    }
    const amts2 = amts.filter(function(a){ return !dates.some(function(d){ return a.i >= d.i && a.i < d.i + d.len; }); });
    if (!dates.length) { // v200: tarihsiz faiz/ücret satırı (GEÇ ÖDEME FAİZİ 153,77) → kesim tarihli gider; diğer tarihsiz satırlar atlanır
      if (!FIN_FEE_RX200.test(UL) || FIN_ROW_SKIP_RX200.test(UL)) return;
      const fa = amts2.filter(function(a){ return !a.glued; }); if (fa.length !== 1) return;
      if (line.length > 60 || /%/.test(line) || !/\d[.,]\d{2}\s*[-+]?\s*(?:TL|₺|TRY)?\s*[-+]?$/.test(line)) return; // açıklama tabloları ("Yurtiçi Diğer Banka Şubeleri %4,45 + 1,72 TL") satır değildir
      const a0 = fa[fa.length - 1]; let fv = Math.abs(a0.v); if (!fv) return;
      const fdesc = line.slice(0, a0.i).replace(/\\s+/g, ' ').trim(); const fcredit = /\\+\\s*$/.test(a0.raw) || /İADE|IADE/.test(UL);
      const fkey = finMerchantKey196(fdesc); const fbase = feeDate + '|' + fv.toFixed(2) + '|' + fkey; const fn = seen[fbase] || 0; seen[fbase] = fn + 1;
      rows.push({ date: feeDate, desc: fdesc, amount: fv, credit: fcredit, kind: fcredit ? 'credit' : 'expense', key: fkey, fp: fbase + '|' + fn, raw: line, fee: true });
      return;
    }
    const d0 = dates[0];
    const amts3 = amts2.filter(function(a){ return a.i > d0.i + d0.len && !a.glued; }); // tutar tarihten SONRA gelir; taksit/oran parçaları elenir
    if (!amts3.length) return;
    const amt = pickFirst ? amts3[0] : amts3[amts3.length - 1];
    let y = d0.y; if (!y) { y = py; if (d0.mo > pm + 1) y = py - 1; if (pm === 1 && d0.mo === 12) y = py - 1; }
    const date = y + '-' + String(d0.mo).padStart(2, '0') + '-' + String(d0.d).padStart(2, '0');
    let descStart = d0.i + d0.len; if (dates[1] && dates[1].i <= descStart + 3) descStart = dates[1].i + dates[1].len;
    const firstNum = amts2.filter(function(a){ return a.i > descStart; }).sort(function(a, b){ return a.i - b.i; })[0]; // açıklama ilk sayısal parçada biter (taksit "1.260,00x6" dahil)
    const descEnd = Math.min(amt.i, firstNum ? firstNum.i : amt.i);
    let desc = line.slice(descStart, descEnd).replace(/\\s+/g, ' ').trim();
    if (!desc) desc = line.slice(0, d0.i).trim() || line;
    desc = desc.replace(/^[|:\\-–•]+\\s*/, '').replace(/\\s*[|:\\-–]+$/, '').trim();
    const UD = finTrUpper196(desc);
    if (FIN_ROW_SKIP_RX200.test(UD)) return; // "ÖNCEKİ DÖNEM HESAP ÖZETİ BAKİYENİZ", "Toplam Harcama Tutarı"
    let v = amt.v; const credit = v < 0 || /İADE|IADE|ALACAK/.test(UD) || /\\)\\s*$/.test(amt.raw) || /-\\s*$/.test(amt.raw) || /^\\s*\\+/.test(amt.raw) || /\\+\\s*$/.test(amt.raw) || FIN_PAYMENT_RX196.test(UD);
    v = Math.abs(v); if (!v) return;
    const isPay = FIN_PAYMENT_RX196.test(UD);
    const key = finMerchantKey196(desc);
    const base = date + '|' + v.toFixed(2) + '|' + key; const n = seen[base] || 0; seen[base] = n + 1;
    rows.push({ date: date, desc: desc, amount: v, credit: credit, kind: isPay ? 'payment' : (credit ? 'credit' : 'expense'), key: key, fp: base + '|' + n, raw: line });
  });
  return { meta: meta, rows: rows };
}""")
# kategori tahmini: tutar ipucu (Bağ-Kur taban) + kural kapsamı
rep("""function finRuleFor196(desc) {
  const key = finMerchantKey196(desc); if (!key) return null;""",
"""function finDefaultScope200(desc, card, guess) { // v200: satırın kapsamı — kural > işveren ipucu (employerSkip kartta) > stüdyo ipucu > kartın varsayılanı
  if (guess && guess.fromRule && guess.scope) return guess.scope;
  const UD = finTrUpper196(desc);
  if (card && card.employerSkip && FIN_EMPLOYER_HINT_RX200.test(UD)) return 'skip';
  if (card && card.scopeDefault === 'hane') return FIN_STUDIO_HINT_RX200.test(UD) ? 'studio' : 'hane';
  return 'studio';
}
function finRuleFor196(desc) {
  const key = finMerchantKey196(desc); if (!key) return null;""")
rep("""function finGuessCategory196(desc) {
  const r = finRuleFor196(desc); if (r) return { category: r.category || 'Diğer', counterpartyId: r.counterpartyId || '', business: r.business !== false, fromRule: true };
  const UD = finTrUpper196(desc) + ' ';
  for (let i = 0; i < FIN_CAT_HINTS196.length; i++) { if (FIN_CAT_HINTS196[i][0].test(UD)) return { category: FIN_CAT_HINTS196[i][1], counterpartyId: '', business: true, fromRule: false }; }
  return { category: 'Diğer', counterpartyId: '', business: true, fromRule: false };
}
function finLearnRule196(desc, category, counterpartyId, business) {
  const key = finMerchantKey196(desc); if (!key || key.length < 3) return;
  __finNormalize196(state);
  let r = state.finRules.find(function(x){ return x && x.pattern === key; });
  if (!r) { r = { id: uid(), kind: 'rule', pattern: key, hits: 0, createdAt: new Date().toISOString() }; state.finRules.push(r); }
  r.category = category || 'Diğer'; r.counterpartyId = counterpartyId || ''; r.business = business !== false; r.hits = (r.hits || 0) + 1; r.updatedAt = new Date().toISOString();
}""",
"""function finGuessCategory196(desc, opt) {
  opt = opt || {};
  const r = finRuleFor196(desc); if (r) return { category: r.category || 'Diğer', counterpartyId: r.counterpartyId || '', business: r.business !== false, scope: r.scope || (r.business === false ? 'hane' : ''), fromRule: true };
  const UD = finTrUpper196(desc) + ' ';
  if (/SGK|SOSYAL GÜVENLİK|SOSYAL GUVENLIK|BAĞ-KUR|BAGKUR/.test(UD) && opt.amount && FIN_BAGKUR_AMOUNTS200.some(function(a){ return Math.abs(a - (+opt.amount)) < 0.01; })) return { category: 'Bağkur', counterpartyId: '', business: true, scope: '', fromRule: false }; // v200: taban prim tutarı
  for (let i = 0; i < FIN_CAT_HINTS196.length; i++) { if (FIN_CAT_HINTS196[i][0].test(UD)) return { category: FIN_CAT_HINTS196[i][1], counterpartyId: '', business: true, scope: '', fromRule: false }; }
  return { category: 'Diğer', counterpartyId: '', business: true, scope: '', fromRule: false };
}
function finLearnRule196(desc, category, counterpartyId, business, scope) {
  const key = finMerchantKey196(desc); if (!key || key.length < 3) return;
  __finNormalize196(state);
  let r = state.finRules.find(function(x){ return x && x.pattern === key; });
  if (!r) { r = { id: uid(), kind: 'rule', pattern: key, hits: 0, createdAt: new Date().toISOString() }; state.finRules.push(r); }
  r.category = category || 'Diğer'; r.counterpartyId = counterpartyId || ''; r.business = business !== false; r.scope = scope || (business === false ? 'hane' : 'studio'); r.hits = (r.hits || 0) + 1; r.updatedAt = new Date().toISOString(); // v200: kapsam öğrenilir
}
function finDupExpense200(accountId, date, amount, credit) { // v200: elle girilmiş aynı gider (hesap + tarih + tutar) → mükerrer
  const amt = finR2_196(credit ? -amount : amount);
  return (state.expenses || []).some(function(e){ return e && e.accountId === accountId && String(e.date || '').slice(0, 10) === date && Math.abs(finR2_196(e.amount) - amt) < 0.005; });
}""")
# önizleme: kapsam
rep("""  const rows = parsed.rows.map(function(r){ const g = finGuessCategory196(r.desc); const dup = !!known[r.fp]; return Object.assign({}, r, { category: g.category, counterpartyId: g.counterpartyId, business: g.business, fromRule: g.fromRule, dup: dup, checked: !dup && r.kind !== 'payment' }); });""",
"""  const card = finAccount196(accountId);
  const rows = parsed.rows.map(function(r){ const g = finGuessCategory196(r.desc, { amount: r.amount }); const dup = !!known[r.fp] || finDupExpense200(accountId, r.date, r.amount, r.credit); const scope = r.kind === 'payment' ? 'skip' : finDefaultScope200(r.desc, card, g); return Object.assign({}, r, { category: g.category, counterpartyId: g.counterpartyId, business: scope !== 'hane', scope: scope, fromRule: g.fromRule, dup: dup, checked: !dup && r.kind !== 'payment' }); }); // v200: kapsam + mükerrer gider""")
rep("""    '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end;"><div class="field" style="max-width:180px;"><label>Dönem borcu (₺)</label><input type="number" id="fi-total" step="0.01" value="' + (I.meta.toplam !== null && I.meta.toplam !== undefined ? I.meta.toplam : '') + '" placeholder="ekstredeki toplam"></div><div class="field" style="max-width:180px;"><label>Son ödeme tarihi</label><input type="date" id="fi-due" value="' + escapeHtml(I.meta.sonOdeme || '') + '"></div><span class="fin-note">İkisi de doluysa Vadeler\\'e "kart ekstresi ödemesi" kalemi düşer; bankadan ödeyince kapanır.</span></div>';""",
"""    (function(){ const sk = I.rows.filter(function(r){ return r.scope === 'skip' && r.kind !== 'payment' && !r.dup; }); const skSum = finR2_196(sk.reduce(function(a, r){ return a + (r.credit ? -r.amount : r.amount); }, 0)); const tot = (I.meta.toplam !== null && I.meta.toplam !== undefined) ? I.meta.toplam : null; const sug = tot !== null ? finR2_196(tot - skSum) : null; return '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end;"><div class="field" style="max-width:180px;"><label>Dönem borcu (₺)</label><input type="number" id="fi-total" step="0.01" value="' + (sug !== null ? sug : '') + '" placeholder="ekstredeki toplam"></div><div class="field" style="max-width:180px;"><label>Son ödeme tarihi</label><input type="date" id="fi-due" value="' + escapeHtml(I.meta.sonOdeme || '') + '"></div><span class="fin-note">İkisi de doluysa Vadeler\\'e "kart ekstresi ödemesi" kalemi düşer; bankadan ödeyince kapanır.' + (sk.length ? ' <b>Ekstre toplamı ' + money(tot || 0) + ' ₺ − atlanan ' + sk.length + ' satır ' + money(skSum) + ' ₺ = ' + money(sug || 0) + ' ₺</b> (işveren satırları karta da girmez).' : '') + '</span></div>'; })(); // v200""")
rep("""    const cls = r.dup ? 'dup' : (r.kind === 'payment' ? 'pay' : '');""",
    """    const cls = r.dup ? 'dup' : (r.kind === 'payment' ? 'pay' : (r.scope === 'skip' ? 'pay' : ''));""")
rep("""      '<td data-label="İşletme dışı" style="text-align:center;"><input type="checkbox" ' + (r.business === false ? 'checked' : '') + ' onchange="__finImp196.rows[' + i + '].business=!this.checked" title="Şahsi harcama: gider olmaz, kart sahibinin ortak çekimi olur"></td></tr>';""",
"""      '<td data-label="Kapsam"><select onchange="__finImp196.rows[' + i + '].scope=this.value; __finImp196.rows[' + i + '].business=(this.value!==\\'hane\\'); finImportRenderPreview196()" title="Stüdyo gideri / hane gideri / atla (işveren masrafı — hiç yazılmaz)">' + [['studio', 'Stüdyo'], ['hane', '🏠 Hane'], ['skip', '⛔ Atla (işveren)']].map(function(p){ return '<option value="' + p[0] + '"' + (p[0] === (r.scope || 'studio') ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select></td></tr>'; // v200""")
rep("""<th>Kategori</th><th>Cari</th><th title="Şahsi harcama">İşl. dışı</th></tr></thead><tbody>' + body + '</tbody></table></div>';""",
    """<th>Kategori</th><th>Cari</th><th title="Stüdyo / Hane / Atla">Kapsam</th></tr></thead><tbody>' + body + '</tbody></table></div>';""")
rep("""  const nNew = I.rows.filter(function(r){ return !r.dup && r.kind !== 'payment'; }).length, nDup = I.rows.filter(function(r){ return r.dup; }).length, nPay = I.rows.filter(function(r){ return r.kind === 'payment'; }).length;
  const head = '<div class="fin-tot">' + (I.meta.bank ? '<b>' + escapeHtml(I.meta.bank) + '</b> · ' : '') + I.rows.length + ' satır okundu: <b>' + nNew + ' yeni</b>' + (nDup ? ' · ' + nDup + ' zaten işlenmiş' : '') + (nPay ? ' · ' + nPay + ' kart ödemesi (atlanır)' : '') + '</div>' +""",
"""  const nNew = I.rows.filter(function(r){ return !r.dup && r.kind !== 'payment' && r.scope !== 'skip'; }).length, nDup = I.rows.filter(function(r){ return r.dup; }).length, nPay = I.rows.filter(function(r){ return r.kind === 'payment'; }).length, nSkip = I.rows.filter(function(r){ return r.scope === 'skip' && r.kind !== 'payment' && !r.dup; }).length, nHane = I.rows.filter(function(r){ return r.scope === 'hane' && !r.dup; }).length;
  const head = '<div class="fin-tot">' + (I.meta.bank ? '<b>' + escapeHtml(I.meta.bank) + '</b> · ' : '') + I.rows.length + ' satır okundu: <b>' + nNew + ' yeni</b>' + (nHane ? ' (' + nHane + ' hane)' : '') + (nSkip ? ' · ' + nSkip + ' atlanacak (işveren)' : '') + (nDup ? ' · ' + nDup + ' zaten işlenmiş' : '') + (nPay ? ' · ' + nPay + ' kart ödemesi (atlanır)' : '') + '</div>' +""")
# işleme: hane = gider; skip = yazma; sayım
rep("""  let nExp = 0, nDraw = 0, nCredit = 0; const fps = [];
  sel.forEach(function(r){
    const amt = finR2_196(r.amount); if (!amt) return;
    const dateOk = (r.date && card.openingDate && r.date >= card.openingDate) ? r.date : (card.openingDate && r.date < card.openingDate ? card.openingDate : r.date);
    if (r.business === false) {
      if (r.credit) { state.finMoves.push({ id: uid(), kind: 'move', op: 'capital', date: dateOk, amount: amt, toAccountId: card.id, partner: card.owner || '', note: 'Kart iadesi (şahsi): ' + r.desc, fingerprint: r.fp, source: 'card-import', at: new Date().toISOString() }); }
      else { state.finMoves.push({ id: uid(), kind: 'move', op: 'draw', date: dateOk, amount: amt, fromAccountId: card.id, partner: card.owner || '', note: 'Şahsi kart harcaması: ' + r.desc, fingerprint: r.fp, source: 'card-import', at: new Date().toISOString() }); nDraw++; }
    } else {
      state.expenses.push({ id: uid(), date: dateOk, paidDate: dateOk, category: r.category || 'Diğer', amount: r.credit ? -amt : amt, note: r.desc, resmi: false, kdvRate: 0, accountId: card.id, counterpartyId: r.counterpartyId || '', source: 'card-import', fingerprint: r.fp });
      if (r.credit) nCredit++; else nExp++;
    }
    fps.push(r.fp);
    finLearnRule196(r.desc, r.category, r.counterpartyId, r.business !== false);
  });""",
"""  let nExp = 0, nDraw = 0, nCredit = 0, nSkip = 0, nHane = 0; const fps = [];
  sel.forEach(function(r){
    const amt = finR2_196(r.amount); if (!amt) return;
    const dateOk = r.date; // v200: işlem tarihi korunur (açılış öncesi satır bakiyeye girmez, rapora girer — Kerem: "ekstre hangi ayınsa o aya yaz")
    const scope = r.scope === 'skip' ? 'skip' : (r.scope === 'hane' || r.business === false ? 'hane' : 'studio');
    if (scope === 'skip') { nSkip++; fps.push(r.fp); finLearnRule196(r.desc, r.category, r.counterpartyId, true, 'skip'); return; } // işveren masrafı: hiç yazılmaz, parmak izi tutulur
    state.expenses.push({ id: uid(), date: dateOk, paidDate: dateOk, category: r.category || 'Diğer', amount: r.credit ? -amt : amt, note: r.desc, resmi: false, kdvRate: 0, accountId: card.id, counterpartyId: r.counterpartyId || '', scope: scope, source: 'card-import', fingerprint: r.fp });
    if (r.credit) nCredit++; else nExp++; if (scope === 'hane') nHane++;
    fps.push(r.fp);
    finLearnRule196(r.desc, r.category, r.counterpartyId, scope !== 'hane', scope);
  });""")
rep("""  state.finImports.push({ id: uid(), kind: 'import', accountId: card.id, period: I.period, bank: I.meta.bank || card.bank || '', at: new Date().toISOString(), n: sel.length, total: total || null, dueDate: due || '', fingerprints: fps });""",
    """  state.finImports.push({ id: uid(), kind: 'import', accountId: card.id, period: I.period, bank: I.meta.bank || card.bank || '', at: new Date().toISOString(), n: sel.length, skipped: nSkip, hane: nHane, total: total || null, dueDate: due || '', fingerprints: fps }); // v200""")
rep("""  if (window.plToast) plToast('📄 Ekstre işlendi: ' + nExp + ' gider' + (nCredit ? ', ' + nCredit + ' iade' : '') + (nDraw ? ', ' + nDraw + ' şahsi' : '') + (dueMade ? ' · son ödeme kalemi eklendi' : ''));
  return { expenses: nExp, credits: nCredit, draws: nDraw, due: dueMade };""",
"""  if (window.plToast) plToast('📄 Ekstre işlendi: ' + nExp + ' gider' + (nHane ? ' (' + nHane + ' hane)' : '') + (nCredit ? ', ' + nCredit + ' iade' : '') + (nSkip ? ', ' + nSkip + ' atlandı (işveren)' : '') + (dueMade ? ' · son ödeme kalemi eklendi' : ''));
  return { expenses: nExp, credits: nCredit, draws: nDraw, skipped: nSkip, hane: nHane, due: dueMade };""")

# ═══════════ (D) RAPOR: Stüdyo net / Hane net ═══════════
rep("""function finPlRows196(months) {
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
}""",
"""function finPlRows196(months) { // v200 ORTAK KASA: stüdyo bloğu → "Stüdyo net"; diğer gelir + hane giderleri → "Hane net" (hiçbiri karışmaz)
  const cats = {}, hcats = {}; const inc = {}, pay = {}, incS = {}, incH = {}, cashDelta = {};
  months.forEach(function(ay){
    const n = netProfitForMonth(ay); inc[ay] = n.rev; pay[ay] = n.pay; incS[ay] = 0; incH[ay] = 0;
    expensesForMonth(ay).forEach(function(e){ if (!e || e.category === 'Hoca Maaşı' || (e.note && String(e.note).indexOf('MAAS-OTO-') !== -1)) return; const c = e.category || 'Diğer'; const tgt = finExpScope200(e) === 'hane' ? hcats : cats; tgt[c] = tgt[c] || {}; tgt[c][ay] = finR2_196((tgt[c][ay] || 0) + (+e.amount || 0)); });
    (state.finMoves || []).forEach(function(mv){ if (!mv || mv.op !== 'income' || String(mv.date || '').slice(0, 7) !== ay) return; const a = finR2_196(mv.amount); if (mv.scope === 'hane') incH[ay] = finR2_196(incH[ay] + a); else incS[ay] = finR2_196(incS[ay] + a); });
    let d = 0; finMovements196().forEach(function(m){ if (String(m.date).slice(0, 7) !== ay) return; const a = finAccount196(m.accountId); if (!a || a.type === 'card') return; if (m.type === 'virman') return; d += m.dir * m.amount; }); cashDelta[ay] = finR2_196(d);
  });
  const rows = [];
  rows.push({ label: 'Üye tahsilatları (paket ayı)', vals: months.map(function(ay){ return inc[ay] || 0; }), cls: '' });
  if (months.some(function(ay){ return incS[ay]; })) rows.push({ label: 'Diğer gelir (stüdyo)', vals: months.map(function(ay){ return incS[ay] || 0; }), cls: '' });
  rows.push({ label: 'Hoca ödemeleri', vals: months.map(function(ay){ return -(pay[ay] || 0); }), cls: '' });
  Object.keys(cats).sort(function(a, b){ return a.localeCompare(b, 'tr'); }).forEach(function(c){ rows.push({ label: 'Gider · ' + c, vals: months.map(function(ay){ return -(cats[c][ay] || 0); }), cls: '' }); });
  const netS = months.map(function(ay, i){ return finR2_196(rows.reduce(function(a, r){ return a + (r.vals[i] || 0); }, 0)); });
  rows.push({ label: 'Stüdyo net', vals: netS, cls: 'net' });
  const hStart = rows.length;
  if (months.some(function(ay){ return incH[ay]; })) rows.push({ label: 'Diğer gelir (hane)', vals: months.map(function(ay){ return incH[ay] || 0; }), cls: '' });
  Object.keys(hcats).sort(function(a, b){ return a.localeCompare(b, 'tr'); }).forEach(function(c){ rows.push({ label: 'Hane · ' + c, vals: months.map(function(ay){ return -(hcats[c][ay] || 0); }), cls: '' }); });
  const netH = months.map(function(ay, i){ return finR2_196(netS[i] + rows.slice(hStart).reduce(function(a, r){ return a + (r.vals[i] || 0); }, 0)); });
  rows.push({ label: 'Hane net', vals: netH, cls: 'net' });
  rows.push({ label: 'Nakit değişimi (tüm nakit/banka hesapları, gerçekleşen)', vals: months.map(function(ay){ return cashDelta[ay]; }), cls: 'tot' });
  return rows;
}""")
rep("""    body = '<div class="fin-note">Tahsilat paket ayına, gider ödeme tarihine, hoca ödemesi ödendiği aya göre. Hoca Maaşı gider kaydı çift sayılmaz. Son satır: Kasa+Banka gerçekleşen değişim (virman hariç).</div>""",
    """    body = '<div class="fin-note">Tahsilat paket ayına, gider işlem tarihine, hoca ödemesi ödendiği aya göre. <b>Stüdyo net</b>: üye tahsilatı − stüdyo giderleri (Derya\\'nın kartları dahil). <b>Hane net</b>: + maaş/diğer gelir − hane giderleri (ev kirası, aile harcamaları). Vergi paneli yalnız faturalı/resmi stüdyo giderlerini görür. Son satır: tüm nakit/banka hesaplarında gerçekleşen değişim (virman hariç).</div>""")

# banka tespiti: kart markası ipuçları (Garanti: Bonus; Vakıf: Worldpuan/BusinessCard/VB Müşteri No)
rep("""  if (/GARANTİ|GARANTI/.test(U)) meta.bank = 'Garanti BBVA'; else if (/VAKIF/.test(U)) meta.bank = 'VakıfBank'; else if (/TÜRKİYE\\s*FİNANS|TURKIYE\\s*FINANS/.test(U)) meta.bank = 'Türkiye Finans';""",
    """  if (/GARANTİ|GARANTI|BONUS\\s*(?:BUSINESS|CARD|FLAŞ|FLAS|PROGRAM)/.test(U)) meta.bank = 'Garanti BBVA'; else if (/VAKIF|WORLDPUAN|VB\\s*MÜŞTERİ|VB\\s*MUSTERI/.test(U)) meta.bank = 'VakıfBank'; else if (/TÜRKİYE\\s*FİNANS|TURKIYE\\s*FINANS/.test(U)) meta.bank = 'Türkiye Finans'; // v200: kart markası ipuçları""")
# sürüm
rep('<meta name="app-version" content="2026.10.18.122">', '<meta name="app-version" content="2026.10.18.123">')
rep("const APP_VERSION = '2026.10.18.122';", "const APP_VERSION = '2026.10.18.123';")
io.open(P, 'w', encoding='utf-8').write(s)
print('OK v200: %d -> %d (+%d)' % (n0, len(s), len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v199-2026-10-18-122';"
assert w.count(old) == 1, 'sw.js CACHE_NAME anchor'
w = w.replace(old, "const CACHE_NAME = 'pilateria-v200-2026-10-18-123';")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
