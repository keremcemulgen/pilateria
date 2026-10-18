# -*- coding: utf-8 -*-
# v201 — EKSTRE SATIRLARI EKSTRE AYINA (Kerem 18.10: "Ekstre hangi aya aitse o"): kart ekstresi içe alınırken ay dışı tarihli satırlar
# (önceki ayın sonu, taksit kökeni, kesim günü sonrası) ekstre döneminin ilk/son gününe yazılır. Önizlemede "→ 01.09.2026" işareti ve
# "N satır ekstre ayına çekilir" sayımı; pencerede "Satırları ekstre ayına yaz" kutusu (varsayılan açık). Mükerrer denetimi (aynı hesap+
# tarih+tutar) ORİJİNAL işlem tarihiyle yapılır (elle girilen vergi ödemeleri yakalanır). finImportProcess196(opt) → opt.clamp ile
# programatik; kutu yoksa (eski testler) tarih korunur. İçe alma kaydına clamp bayrağı.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:120])
    s = s.replace(old, new)

# (1) pencere: kutu
rep("""<div class="field"><label>Ekstre dönemi</label><input type="month" id="fi-period" value="' + currentMonth() + '"></div><div class="field"><label>Dosya (PDF / CSV / TXT)</label>""",
    """<div class="field"><label>Ekstre dönemi</label><input type="month" id="fi-period" value="' + currentMonth() + '"></div><div class="field"><label style="display:flex;align-items:center;gap:6px;white-space:nowrap;" title="Ay dışı tarihli satırlar (önceki ayın sonu, taksit kökeni, kesim sonrası) ekstre ayının ilk/son gününe yazılır — Kerem: ekstre hangi aya aitse gider o aya. Mükerrer denetimi işlem tarihiyle yapılır."><input type="checkbox" id="fi-clamp" checked onchange="finImportRenderPreview196()"> Satırları ekstre ayına yaz</label></div><div class="field"><label>Dosya (PDF / CSV / TXT)</label>""")

# (2) yardımcılar
rep("""function finImportRenderPreview196() {
  const pv = document.getElementById('fi-preview'); const I = __finImp196; if (!pv || !I) return;""",
"""function finImportClampDate201(date, period) { // v201: ay dışı tarih → ekstre ayının ilk/son günü
  if (!date || !period || !/^\\d{4}-\\d{2}$/.test(String(period))) return date;
  const s0 = period + '-01', e0 = finMonthEnd196(period);
  return date < s0 ? s0 : (date > e0 ? e0 : date);
}
function finImportClampOn201(opt) { if (opt && opt.clamp !== undefined) return !!opt.clamp; const el = document.getElementById('fi-clamp'); return el ? !!el.checked : false; }
function finImportRenderPreview196() {
  const pv = document.getElementById('fi-preview'); const I = __finImp196; if (!pv || !I) return;
  const clamp201 = finImportClampOn201(); const nMove = clamp201 ? I.rows.filter(function(r){ return !r.dup && r.kind !== 'payment' && r.scope !== 'skip' && finImportClampDate201(r.date, I.period) !== r.date; }).length : 0;""")
rep("""(nDup ? ' · ' + nDup + ' zaten işlenmiş' : '') + (nPay ? ' · ' + nPay + ' kart ödemesi (atlanır)' : '') + '</div>' +""",
    """(nDup ? ' · ' + nDup + ' zaten işlenmiş' : '') + (nPay ? ' · ' + nPay + ' kart ödemesi (atlanır)' : '') + (nMove ? ' · <span title="ay dışı tarihli satırlar ekstre ayına yazılır">' + nMove + ' satır ekstre ayına çekilir</span>' : '') + '</div>' +""")
rep("""<td data-label="Tarih">' + fmtDate(r.date) + '</td><td data-label="Açıklama" style="white-space:normal;max-width:260px;">""",
    """<td data-label="Tarih" style="white-space:nowrap;">' + fmtDate(r.date) + (function(){ const t = clamp201 ? finImportClampDate201(r.date, I.period) : r.date; return (t !== r.date && !r.dup && r.kind !== 'payment' && r.scope !== 'skip') ? ' <span class="fin-note" title="ekstre ayına yazılır">→ ' + fmtDate(t) + '</span>' : ''; })() + '</td><td data-label="Açıklama" style="white-space:normal;max-width:260px;">""")

# (3) işleme
rep("""  const totalRaw = opt.total !== undefined ? opt.total : (document.getElementById('fi-total') || {}).value; const dueRaw = opt.dueDate !== undefined ? opt.dueDate : (document.getElementById('fi-due') || {}).value;
  __undoSnapshot('Kart ekstresi: ' + (card.name || '') + ' ' + I.period + ' (' + sel.length + ' satır)');""",
"""  const totalRaw = opt.total !== undefined ? opt.total : (document.getElementById('fi-total') || {}).value; const dueRaw = opt.dueDate !== undefined ? opt.dueDate : (document.getElementById('fi-due') || {}).value;
  const clamp201 = finImportClampOn201(opt); // v201: satırlar ekstre ayına
  __undoSnapshot('Kart ekstresi: ' + (card.name || '') + ' ' + I.period + ' (' + sel.length + ' satır)');""")
rep("""    const dateOk = r.date; // v200: işlem tarihi korunur (açılış öncesi satır bakiyeye girmez, rapora girer — Kerem: "ekstre hangi ayınsa o aya yaz")""",
    """    const dateOk = clamp201 ? finImportClampDate201(r.date, I.period) : r.date; // v201: ekstre ayına (Kerem: "ekstre hangi aya aitse o"); kutu kapalıysa işlem tarihi""")
rep("""n: sel.length, skipped: nSkip, hane: nHane, total: total || null, dueDate: due || '', fingerprints: fps }); // v200""",
    """n: sel.length, skipped: nSkip, hane: nHane, clamp: clamp201, total: total || null, dueDate: due || '', fingerprints: fps }); // v200 · v201 clamp""")

# (3b) mükerrer: elle girilen (ekstre dışı) kayıt için ±7 gün penceresi — vergi/Bağ-Kur ödemeleri vade günüyle girildi, kartta işlem günü farklı olabilir
rep("""function finDupExpense200(accountId, date, amount, credit) { // v200: elle girilmiş aynı gider (hesap + tarih + tutar) → mükerrer
  const amt = finR2_196(credit ? -amount : amount);
  return (state.expenses || []).some(function(e){ return e && e.accountId === accountId && String(e.date || '').slice(0, 10) === date && Math.abs(finR2_196(e.amount) - amt) < 0.005; });
}""",
"""function finDupExpense200(accountId, date, amount, credit) { // v200: elle girilmiş aynı gider (hesap + tarih + tutar) → mükerrer · v201: ekstre dışı kayıt için ±7 gün
  const amt = finR2_196(credit ? -amount : amount);
  const t0 = /^\\d{4}-\\d{2}-\\d{2}$/.test(String(date || '')) ? new Date(date + 'T00:00:00').getTime() : NaN;
  return (state.expenses || []).some(function(e){
    if (!e || e.accountId !== accountId || Math.abs(finR2_196(e.amount) - amt) >= 0.005) return false;
    const d = String(e.date || '').slice(0, 10); if (d === date) return true;
    if (e.source === 'card-import' || !isFinite(t0) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(d)) return false; // ekstreden gelen kayıt yalnız aynı gün
    return Math.abs(new Date(d + 'T00:00:00').getTime() - t0) <= 7 * 86400000; // elle girilen vergi/Bağ-Kur: aynı hesap + aynı tutar, 7 gün içinde
  });
}""")

# (4) sürüm
rep('<meta name="app-version" content="2026.10.18.123">', '<meta name="app-version" content="2026.10.18.124">')
rep("const APP_VERSION = '2026.10.18.123';", "const APP_VERSION = '2026.10.18.124';")
io.open(P, 'w', encoding='utf-8').write(s)

SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v200-2026-10-18-123';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v200-2026-10-18-123';", "const CACHE_NAME = 'pilateria-v201-2026-10-18-124';")
io.open(SW, 'w', encoding='utf-8').write(w)
print('v201 yama tamam')
