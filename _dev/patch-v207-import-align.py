# -*- coding: utf-8 -*-
# v207 — EKSTREYLE EŞLEŞEN ELLE KAYIT EKSTRE AYINA TAŞINIR (Kerem 19.10 "yap"): kartla ödenip ELLE işaretlenen kalem (ör. Bağ-Kur 31.10 Kerem
# kartıyla) ekstre içe alımında "zaten işlendi" olunca ekstre ayının dışında kalıyordu (31.10 → Ekim; ama Kasım ekstresinde → kural: Kasım).
# (1) Mükerrer eşleşmesi BİRE BİR (finImportMatchDups207): her mevcut gider en fazla BİR ekstre satırını "zaten işlendi" yapar — önce aynı gün
#     (her kaynak), sonra ±7 gün (yalnız elle girilmiş), en yakın gün; aynı tutarlı iki gerçek satır tek elle kayda düşmez (v201'de ikisi de düşerdi).
# (2) "Satırları ekstre ayına yaz" açıkken, işaretsiz kalan mükerrer satırın eşleştiği ELLE kayıt ekstre ayı dışındaysa ekstre ayına çekilir
#     (tarih + ödeme günü; not: "kart ödeme günü …"; bağlı vade kaleminin ödeme günü). Önizlemede satırda "→ ekstre ayına: gg.aa.yyyy", başlıkta
#     sayım; tüm satırlar mükerrer olsa da taşıma yapılabilir ("İşle (0 satır + N taşıma)"). Kullanıcı mükerrer satırı işaretlerse taşıma yapılmaz.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:120])
    s = s.replace(old, new)

# (1) bire bir eşleşme + taşıma hedefleri
rep("""function finImportPreview196(text, accountId, period) {
  const parsed = finParseStatementText196(text, { period: period });
  const known = finKnownFingerprints196(accountId);
  const card = finAccount196(accountId);
  const rows = parsed.rows.map(function(r){ const g = finGuessCategory196(r.desc, { amount: r.amount }); const dup = !!known[r.fp] || finDupExpense200(accountId, r.date, r.amount, r.credit); const scope = r.kind === 'payment' ? 'skip' : finDefaultScope200(r.desc, card, g); return Object.assign({}, r, { category: g.category, counterpartyId: g.counterpartyId, business: scope !== 'hane', scope: scope, fromRule: g.fromRule, dup: dup, checked: !dup && r.kind !== 'payment' }); }); // v200: kapsam + mükerrer gider""",
"""function finImportMatchDups207(accountId, rows, known) { // v207: mükerrer eşleşmesi BİRE BİR — önce aynı gün (her kaynak), sonra ±7 gün (yalnız elle girilmiş), en yakın gün
  const used = {}; const pool = (state.expenses || []).filter(function(e){ return e && e.accountId === accountId; });
  const ms = function(d){ return /^\\d{4}-\\d{2}-\\d{2}$/.test(String(d || '').slice(0, 10)) ? new Date(String(d).slice(0, 10) + 'T00:00:00').getTime() : NaN; };
  const res = rows.map(function(r){ return (known && known[r.fp]) ? { dup: true, by: 'fp' } : null; });
  [0, 1].forEach(function(pass){
    rows.forEach(function(r, i){
      if (res[i] || r.kind === 'payment') return;
      const amt = finR2_196(r.credit ? -r.amount : r.amount); const t0 = ms(r.date);
      let best = null, bestDiff = Infinity;
      pool.forEach(function(e){
        if (used[e.id] || Math.abs(finR2_196(e.amount) - amt) >= 0.005) return;
        const d = String(e.date || '').slice(0, 10);
        if (pass === 0) { if (d === r.date && !best) { best = e; bestDiff = 0; } return; }
        if (e.source === 'card-import') return;
        const diff = Math.abs(ms(d) - t0); if (!isFinite(diff) || diff > 7 * 86400000) return;
        if (diff < bestDiff) { best = e; bestDiff = diff; }
      });
      if (best) { used[best.id] = 1; res[i] = { dup: true, by: 'exp', matchId: best.id, manual: best.source !== 'card-import' }; }
    });
  });
  return res;
}
function finImportAligns207(I, clamp) { // v207: işaretsiz mükerrer satırın eşleştiği ELLE kayıt ekstre ayı dışındaysa → ekstre ayına taşınacak
  if (!I || !clamp || !/^\\d{4}-\\d{2}$/.test(String(I.period || ''))) return [];
  const out = [];
  (I.rows || []).forEach(function(r){
    if (!r || !r.dup || r.checked || !r.dupManual || !r.dupMatchId) return;
    const e = (state.expenses || []).find(function(x){ return x && x.id === r.dupMatchId; }); if (!e) return;
    const from = String(e.date || '').slice(0, 10); const to = finImportClampDate201(from, I.period);
    if (to && to !== from) out.push({ row: r, e: e, from: from, to: to });
  });
  return out;
}
function finImportPreview196(text, accountId, period) {
  const parsed = finParseStatementText196(text, { period: period });
  const known = finKnownFingerprints196(accountId);
  const card = finAccount196(accountId);
  const m207 = finImportMatchDups207(accountId, parsed.rows, known); // v207: bire bir
  const rows = parsed.rows.map(function(r, i){ const g = finGuessCategory196(r.desc, { amount: r.amount }); const mm = m207[i]; const dup = !!(mm && mm.dup); const scope = r.kind === 'payment' ? 'skip' : finDefaultScope200(r.desc, card, g); return Object.assign({}, r, { category: g.category, counterpartyId: g.counterpartyId, business: scope !== 'hane', scope: scope, fromRule: g.fromRule, dup: dup, dupMatchId: (mm && mm.matchId) || '', dupManual: !!(mm && mm.manual), checked: !dup && r.kind !== 'payment' }); }); // v200: kapsam + mükerrer gider · v207: bire bir eşleşme""")

# (2) önizleme: başlık sayımı + satır rozeti
rep("""(nMove ? ' · <span title="ay dışı tarihli satırlar ekstre ayına yazılır">' + nMove + ' satır ekstre ayına çekilir</span>' : '') + '</div>' +""",
    """(nMove ? ' · <span title="ay dışı tarihli satırlar ekstre ayına yazılır">' + nMove + ' satır ekstre ayına çekilir</span>' : '') + (function(){ const al = finImportAligns207(I, clamp201); return al.length ? ' · <span title="ekstreyle eşleşen elle girilmiş kayıtlar ekstre ayına taşınır">' + al.length + ' elle kayıt ekstre ayına taşınacak</span>' : ''; })() + '</div>' + // v207""")
rep("""    const st = r.dup ? '<span class="badge">zaten işlendi</span>'""",
    """    const st = r.dup ? '<span class="badge">zaten işlendi</span>' + (function(){ const al = finImportAligns207(I, clamp201).find(function(a){ return a.row === r; }); return al ? ' <span class="fin-note" title="eşleşen elle kayıt ekstre ayına taşınır">→ ekstre ayına: ' + fmtDate(al.to) + '</span>' : ''; })()""")
# İşle düğmesi: taşıma sayısı
rep("""function finImportCount196() { const b = document.getElementById('fi-process'); if (!b || !__finImp196) return; const n = __finImp196.rows.filter(function(r){ return r.checked; }).length; b.textContent = 'İşle (' + n + ' satır)'; b.disabled = !n; }""",
    """function finImportCount196() { const b = document.getElementById('fi-process'); if (!b || !__finImp196) return; const n = __finImp196.rows.filter(function(r){ return r.checked; }).length; const a = finImportAligns207(__finImp196, finImportClampOn201()).length; b.textContent = 'İşle (' + n + ' satır' + (a ? ' + ' + a + ' taşıma' : '') + ')'; b.disabled = !n && !a; } // v207""")

# (3) işleme: taşımalar
rep("""  const sel = I.rows.filter(function(r){ return r.checked; }); if (!sel.length) { alert('İşlenecek satır seçilmedi.'); return null; }
  const totalRaw = opt.total !== undefined ? opt.total : (document.getElementById('fi-total') || {}).value; const dueRaw = opt.dueDate !== undefined ? opt.dueDate : (document.getElementById('fi-due') || {}).value;
  const clamp201 = finImportClampOn201(opt); // v201: satırlar ekstre ayına""",
"""  const sel = I.rows.filter(function(r){ return r.checked; });
  const totalRaw = opt.total !== undefined ? opt.total : (document.getElementById('fi-total') || {}).value; const dueRaw = opt.dueDate !== undefined ? opt.dueDate : (document.getElementById('fi-due') || {}).value;
  const clamp201 = finImportClampOn201(opt); // v201: satırlar ekstre ayına
  const aligns207 = finImportAligns207(I, clamp201); // v207: eşleşen elle kayıtlar ekstre ayına
  if (!sel.length && !aligns207.length) { alert('İşlenecek satır seçilmedi.'); return null; }""")
rep("""  const total = finR2_196(totalRaw); const due = String(dueRaw || '');
  let dueMade = false;""",
"""  let nAlign = 0; // v207: ekstreyle eşleşen elle kayıt → ekstre ayına (Kerem: "ekstre hangi aya aitse o")
  aligns207.forEach(function(a){
    const e = a.e; if (!e) return; const orig = String(e.date || '').slice(0, 10); if (orig !== a.from) return;
    e.date = a.to; e.paidDate = a.to; e.note = String(e.note || '') + ' · kart ödeme günü ' + fmtDate(orig) + ' (' + I.period + ' ekstresi → ' + a.to.slice(0, 7) + ')';
    if (e.dueId) { const dd = (state.finDues || []).find(function(x){ return x && x.id === e.dueId; }); if (dd && dd.paidRef && dd.paidRef.id === e.id) dd.paidDate = a.to; }
    nAlign++;
  });
  const total = finR2_196(totalRaw); const due = String(dueRaw || '');
  let dueMade = false;""")
rep("""n: sel.length, skipped: nSkip, hane: nHane, clamp: clamp201, total: total || null, dueDate: due || '', fingerprints: fps }); // v200 · v201 clamp""",
    """n: sel.length, skipped: nSkip, hane: nHane, clamp: clamp201, aligned: nAlign, total: total || null, dueDate: due || '', fingerprints: fps }); // v200 · v201 clamp · v207 aligned""")
rep("""(nSkip ? ', ' + nSkip + ' atlandı (işveren)' : '') + (dueMade ? ' · son ödeme kalemi eklendi' : ''));
  return { expenses: nExp, credits: nCredit, draws: nDraw, skipped: nSkip, hane: nHane, due: dueMade };""",
"""(nSkip ? ', ' + nSkip + ' atlandı (işveren)' : '') + (nAlign ? ', ' + nAlign + ' elle kayıt ekstre ayına taşındı' : '') + (dueMade ? ' · son ödeme kalemi eklendi' : ''));
  return { expenses: nExp, credits: nCredit, draws: nDraw, skipped: nSkip, hane: nHane, aligned: nAlign, due: dueMade };""")

rep('<meta name="app-version" content="2026.10.19.129">', '<meta name="app-version" content="2026.10.19.130">')
rep("const APP_VERSION = '2026.10.19.129';", "const APP_VERSION = '2026.10.19.130';")
io.open(P, 'w', encoding='utf-8').write(s)
w = io.open('sw.js', encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v206-2026-10-19-129';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v206-2026-10-19-129';", "const CACHE_NAME = 'pilateria-v207-2026-10-19-130';")
io.open('sw.js', 'w', encoding='utf-8').write(w)
print('v207 yama tamam')
