# -*- coding: utf-8 -*-
# v196 ADIM 4 — KART EKSTRESİ OKUYUCU (PDF / CSV / metin yapıştır) + ÖĞRENEN KURALLAR + ÇİFT KAYIT KORUMASI (adım 1-3 üstüne)
# - PDF: kendi sunulan pdf.js (pdf-vendor.js + pdf-worker-vendor.js; CSP script-src 'self') isteğe bağlı yüklenir; şifreli PDF'te şifre
#   o an sorulur, saklanmaz. Metin satırları (tarih … açıklama … tutar) genel çözümleyiciyle okunur; banka adı ipucu (Garanti BBVA /
#   VakıfBank / Türkiye Finans) yalnız bilgi. Dönem borcu + son ödeme tarihi yakalanırsa kart vade kalemi olur.
# - Önizleme: her satır işaretli gelir; kategori/cari önerisi kurallardan ("MİGROS → Malzeme"), yoksa yerleşik ipuçları; "işletme dışı"
#   satır gider olmaz, kart sahibinin ortak çekimi olur (kart borcunda kalır). Daha önce işlenmiş satır (parmak izi) işaretsiz + gri.
# - İşle: gider (kaynak: card-import, parmak izi) / ortak çekimi / iade; kurallar öğrenilir; ekstre kaydı tutulur; Geri Al.
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
rep("""  .fin-kpi { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin:8px 0; }""",
"""  .fin-kpi { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin:8px 0; }
  .fin-imp-table td, .fin-imp-table th { font-size:12.5px; vertical-align:middle; }
  .fin-imp-table tr.dup td { opacity:.5; } .fin-imp-table tr.pay td { opacity:.6; font-style:italic; }
  .fin-imp-table select { max-width:150px; font-size:12px; padding:3px 4px; }
  .fin-drop { border:2px dashed var(--border); border-radius:10px; padding:14px; text-align:center; color:var(--muted); font-size:13px; }""")

# ───────── Hareketler araç çubuğu: ekstre yükle ─────────
rep("""      <button class="btn secondary pl-owner-only" onclick="openFinMoveModal196()" title="Virman, ortak çekimi, sermaye, mutabakat, kart borcu ödemesi">+ Nakit Hareketi</button>""",
"""      <button class="btn secondary pl-owner-only" onclick="openFinMoveModal196()" title="Virman, ortak çekimi, sermaye, mutabakat, kart borcu ödemesi">+ Nakit Hareketi</button>
      <button class="btn secondary pl-owner-only" onclick="openFinImportModal196()" title="Kredi kartı ekstresini yükle (PDF / CSV / metin): giderler okunur, kategori önerilir, çift kayıt engellenir">📄 Kart Ekstresi Yükle</button>""")

# ───────── kart borcu ödemesi → açık kart vade kalemini kapatır ─────────
rep("""    __undoSnapshot(FIN_MOVE_OPS196[op] + ': ' + money(amount) + ' ₺');
    state.finMoves.push(mv);""",
"""    __undoSnapshot(FIN_MOVE_OPS196[op] + ': ' + money(amount) + ' ₺');
    state.finMoves.push(mv);
    if (op === 'cardpay') { try { finCloseCardDue196(mv); } catch(e) {} } // v196 adım 4: ekstre kalemi kapanır""")

# ───────── ÇEKİRDEK ─────────
rep("""function renderPayments() {
  try { __renderPaymentRecords196(); }""",
r"""// ═══════════════════════ v196 ADIM 4 — KART EKSTRESİ OKUYUCU ═══════════════════════
// Not: JS /i bayrağı Türkçe İ/ı için çalışmaz (ı→I kanonikleşmez). Metin önce finTrUpper196 ile BÜYÜTÜLÜR; desenler büyük harfli, /i'siz.
function finTrUpper196(x) { return String(x || '').replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase(); }
const FIN_CAT_HINTS196 = [
  [/İSKİ|ISKI|ASKİ|SU İDARESİ|SU IDARESI|BEDAŞ|BEDAS|AYEDAŞ|AYEDAS|CLK|ENERJİSA|ENERJISA|ELEKTRİK|ELEKTRIK|İGDAŞ|IGDAS|DOĞALGAZ|DOGALGAZ|ENERJİ|ENERJI/, 'Elektrik/Su/Doğalgaz'],
  [/MİGROS|MIGROS|CARREFOUR|A101|BİM |BIM |ŞOK MARKET|SOK MARKET|METRO|KOÇTAŞ|KOCTAS|IKEA|BAUHAUS|TEMİZLİK|TEMIZLIK|CLEAN/, 'Temizlik'],
  [/DECATHLON|SPOR|PILATES|PİLATES|REFORMER|MAT |EKİPMAN|EKIPMAN|HEPSİBURADA|HEPSIBURADA|TRENDYOL|AMAZON|N11/, 'Malzeme/Ekipman'],
  [/REKLAM|ADS|META |FACEBOOK|INSTAGRAM|GOOGLE|CANVA|MATBAA|AFİŞ|AFIS/, 'Pazarlama'],
  [/SGK|SOSYAL GÜVENLİK|SOSYAL GUVENLIK|VERGİ DAİRESİ|VERGI DAIRESI|GİB |GIB /, 'Vergi/SGK'],
  [/KİRA|KIRA/, 'Kira']
];
const FIN_PAYMENT_RX196 = /ÖDEME\s*[-–]?\s*TEŞEKKÜR|ODEME\s*[-–]?\s*TESEKKUR|EKSTRE\s*ÖDEME|EKSTRE\s*ODEME|BORÇ\s*ÖDEME|BORC\s*ODEME|KART\s*BORCU\s*ÖDEME|KART\s*BORCU\s*ODEME|İNTERNET\s*ÖDEME|INTERNET\s*ODEME|HAVALE\s*İLE\s*ÖDEME|TEŞEKKÜR EDERİZ|TESEKKUR EDERIZ|ÖDEME\s*ALINDI|ODEME\s*ALINDI/;
const FIN_SUMMARY_RX196 = /^(TOPLAM|DÖNEM\s*BORCU|DONEM\s*BORCU|ASGARİ|ASGARI|DEVREDEN|KALAN\s*BORÇ|KALAN\s*BORC|ÖNCEKİ\s*DÖNEM|ONCEKI\s*DONEM|GENEL\s*TOPLAM|HESAP\s*ÖZETİ|HESAP\s*OZETI|KULLANILABİLİR|KULLANILABILIR|LİMİT|LIMIT|EKSTRE\s*BORCU|SON\s*ÖDEME|SON\s*ODEME|HESAP\s*KESİM|HESAP\s*KESIM|KESİM\s*TARİH|KESIM\s*TARIH|ÖDENECEK|ODENECEK|KART\s*LİMİT|KART\s*LIMIT|FAİZ\s*ORANI|FAIZ\s*ORANI)/;
function finMerchantKey196(desc) {
  const u = finTrUpper196(desc).replace(/[0-9]+[./-]?[0-9]*/g, ' ').replace(/[^A-ZÇĞİÖŞÜ ]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = u.split(' ').filter(function(w){ return w.length >= 2 && !/^(TAKSİT|TAKSIT|TL|TRY|USD|EUR|İST|IST|ISTANBUL|İSTANBUL|TR|WWW|COM)$/.test(w); });
  return words.slice(0, 3).join(' ');
}
function finParseAmountTR196(str) {
  let t = String(str || '').trim(); if (!t) return null;
  let neg = /^-|-$|^\(|\)$/.test(t); t = t.replace(/[()\s]/g, '').replace(/TL|₺|TRY/gi, '').replace(/[+-]/g, '');
  if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else if (/\.\d{1,2}$/.test(t) && !/\.\d{3}$/.test(t)) t = t.replace(/,/g, '');
  else t = t.replace(/[.,]/g, '');
  const v = parseFloat(t); if (isNaN(v)) return null;
  return neg ? -v : v;
}
function finParseStatementText196(text, opts) {
  opts = opts || {}; const period = opts.period || currentMonth(); const py = +period.slice(0, 4), pm = +period.slice(5, 7);
  const all = String(text || '').replace(/ /g, ' ');
  const U = finTrUpper196(all); // Türkçe büyük harf — desenler /i'siz (JS /i Türkçe İ/ı için çalışmaz)
  const meta = { bank: '', sonOdeme: '', kesim: '', toplam: null, asgari: null };
  if (/GARANTİ|GARANTI/.test(U)) meta.bank = 'Garanti BBVA'; else if (/VAKIF/.test(U)) meta.bank = 'VakıfBank'; else if (/TÜRKİYE\s*FİNANS|TURKIYE\s*FINANS/.test(U)) meta.bank = 'Türkiye Finans';
  const dtFull = function(m){ if (!m) return ''; const y = m[3].length === 2 ? ('20' + m[3]) : m[3]; return y + '-' + m[2] + '-' + m[1]; };
  const mS = U.match(/SON\s*[ÖO]DEME\s*(?:TAR[İI]H[İI]|G[ÜU]N[ÜU])?\s*:?\s*(\d{2})[./](\d{2})[./](\d{4}|\d{2})/); if (mS) meta.sonOdeme = dtFull(mS);
  const mK = U.match(/(?:HESAP\s*)?KES[İI]M\s*(?:TAR[İI]H[İI])?\s*:?\s*(\d{2})[./](\d{2})[./](\d{4}|\d{2})/); if (mK) meta.kesim = dtFull(mK);
  const mT = U.match(/(?:D[ÖO]NEM\s*BORCU|TOPLAM\s*BOR[ÇC]|EKSTRE\s*BORCU|HESAP\s*[ÖO]ZET[İI]\s*BORCU|TOPLAM\s*TUTAR|[ÖO]DENECEK\s*TUTAR)\s*(?:\(TL\))?\s*:?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2})/); if (mT) meta.toplam = finParseAmountTR196(mT[1]);
  const mA = U.match(/ASGAR[İI]\s*(?:[ÖO]DEME)?\s*(?:TUTARI)?\s*:?\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/); if (mA) meta.asgari = finParseAmountTR196(mA[1]);
  const rows = []; const seen = {};
  const DATE_RX = /(\d{2})[./](\d{2})(?:[./](\d{4}|\d{2}))?/g; const AMT_RX = /[-+]?\(?\d{1,3}(?:\.\d{3})*,\d{2}\)?(?:\s*(?:TL|₺|TRY))?\s*[-+]?|[-+]?\d+,\d{2}(?:\s*(?:TL|₺|TRY))?\s*[-+]?/g;
  all.split(/\r?\n/).forEach(function(rawLine){
    const line = rawLine.replace(/\s+/g, ' ').trim(); if (!line || line.length < 8) return;
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
    let desc = line.slice(descStart, amt.i).replace(/\s+/g, ' ').trim();
    if (!desc) desc = line.slice(0, d0.i).trim() || line;
    desc = desc.replace(/^[|:\-–•]+\s*/, '').replace(/\s*[|:\-–]+$/, '').trim();
    const UD = finTrUpper196(desc);
    let v = amt.v; const credit = v < 0 || /İADE|IADE|ALACAK/.test(UD) || /\)\s*$/.test(amt.raw) || /-\s*$/.test(amt.raw);
    v = Math.abs(v); if (!v) return;
    const isPay = credit && FIN_PAYMENT_RX196.test(UD);
    const key = finMerchantKey196(desc);
    const base = date + '|' + v.toFixed(2) + '|' + key; const n = seen[base] || 0; seen[base] = n + 1;
    rows.push({ date: date, desc: desc, amount: v, credit: credit, kind: isPay ? 'payment' : (credit ? 'credit' : 'expense'), key: key, fp: base + '|' + n, raw: line });
  });
  return { meta: meta, rows: rows };
}
function finKnownFingerprints196(accountId) { const set = {}; (state.finImports || []).forEach(function(im){ if (!im || im.accountId !== accountId) return; (im.fingerprints || []).forEach(function(f){ set[f] = 1; }); }); (state.expenses || []).forEach(function(e){ if (e && e.accountId === accountId && e.fingerprint) set[e.fingerprint] = 1; }); return set; }
function finRuleFor196(desc) {
  const key = finMerchantKey196(desc); if (!key) return null;
  const u = finTrUpper196(desc);
  let best = null; (state.finRules || []).forEach(function(r){ if (!r || !r.pattern) return; if (key === r.pattern || u.indexOf(r.pattern) !== -1) { if (!best || (r.pattern.length > best.pattern.length) || ((r.hits || 0) > (best.hits || 0) && r.pattern.length === best.pattern.length)) best = r; } });
  return best;
}
function finGuessCategory196(desc) {
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
}
// pdf.js (kendi sunulan) — isteğe bağlı yükleme; worker da 'self'
function finLoadPdfJs196() {
  return new Promise(function(resolve, reject){
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const sc = document.createElement('script'); sc.src = 'pdf-vendor.js?v=' + encodeURIComponent(APP_VERSION);
    sc.onload = function(){ try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf-worker-vendor.js?v=' + encodeURIComponent(APP_VERSION); resolve(window.pdfjsLib); } catch(e) { reject(e); } };
    sc.onerror = function(){ reject(new Error('pdf-vendor.js yüklenemedi (çevrimiçi misin?)')); };
    document.head.appendChild(sc);
  });
}
async function finPdfToText196(arrayBuffer) {
  const lib = await finLoadPdfJs196();
  let password = undefined; let doc = null;
  for (let attempt = 0; attempt < 3 && !doc; attempt++) {
    try { doc = await lib.getDocument({ data: arrayBuffer.slice(0), password: password }).promise; }
    catch(e) {
      if (e && (e.name === 'PasswordException' || /password/i.test(String(e.message || '')))) {
        const p = await plPrompt((attempt ? 'Şifre yanlış. ' : 'Bu PDF şifreli (bankalar genelde TC kimlik no / doğum tarihi ister). ') + 'Şifreyi gir — kaydedilmez:', '', { type: 'password' });
        if (p === null || p === '') throw new Error('Şifre girilmedi'); password = p; continue;
      }
      throw e;
    }
  }
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p); const tc = await page.getTextContent();
    const items = (tc.items || []).filter(function(it){ return it && typeof it.str === 'string' && it.str.trim(); }).map(function(it){ return { x: it.transform[4], y: Math.round(it.transform[5] / 2) * 2, s: it.str }; });
    const byY = {}; items.forEach(function(it){ const k = String(it.y); (byY[k] = byY[k] || []).push(it); });
    Object.keys(byY).map(Number).sort(function(a, b){ return b - a; }).forEach(function(y){ const row = byY[String(y)].sort(function(a, b){ return a.x - b.x; }); lines.push(row.map(function(it){ return it.s; }).join(' ')); });
    lines.push('');
  }
  try { doc.destroy(); } catch(e) {}
  return lines.join('\n');
}
async function finReadStatementFile196(file) {
  const name = String(file.name || '').toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') { const buf = await file.arrayBuffer(); return await finPdfToText196(buf); }
  const txt = await file.text(); return txt;
}
// ─────────── EKRAN: ekstre yükleme penceresi ───────────
let __finImp196 = null; // { accountId, period, parsed, rows:[{...row, checked, category, counterpartyId, business, dup}] }
function openFinImportModal196() {
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  const cards = finAccounts196().filter(function(a){ return a.type === 'card'; });
  if (!cards.length) { alert('Önce 🏦 Hesaplar sekmesinden bir kart hesabı ekle (banka + sahibi + başlangıç borcu).'); return; }
  const old = document.getElementById('modal-fin-imp'); if (old) old.remove();
  __finImp196 = null;
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-imp'; mdl.className = 'modal-bg open';
  mdl.innerHTML = '<div class="modal" style="max-width:900px;"><h3>📄 Kart Ekstresi Yükle</h3>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end;"><div class="field" style="min-width:200px;"><label>Kart</label><select id="fi-acc">' + cards.map(function(a){ return '<option value="' + a.id + '">' + escapeHtml(finAccountLabel196(a.id)) + (a.owner ? ' · ' + escapeHtml(a.owner) : '') + (a.bank ? ' (' + escapeHtml(a.bank) + ')' : '') + '</option>'; }).join('') + '</select></div><div class="field"><label>Ekstre dönemi</label><input type="month" id="fi-period" value="' + currentMonth() + '"></div><div class="field"><label>Dosya (PDF / CSV / TXT)</label><input type="file" id="fi-file" accept=".pdf,.csv,.txt,application/pdf,text/plain,text/csv"></div></div>' +
    '<div class="field"><label>…ya da ekstre metnini yapıştır (satırlar: tarih, açıklama, tutar)</label><textarea id="fi-text" rows="4" placeholder="05/10/2026  MİGROS KADIKÖY  1.240,50&#10;07.10.2026  DECATHLON  899,90"></textarea></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;"><button class="btn" onclick="finImportRead196()">Oku ve önizle</button><span class="fin-note">Hiçbir şey okuma aşamasında yazılmaz; önizlemede onaylayınca işlenir. Şifreli PDF\'te şifre o an sorulur, saklanmaz.</span></div>' +
    '<div id="fi-preview" style="margin-top:10px;"></div>' +
    '<div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px;"><button class="btn secondary" onclick="document.getElementById(\'modal-fin-imp\').remove()">Kapat</button><button class="btn" id="fi-process" style="display:none;" onclick="finImportProcess196()">İşle</button></div></div>';
  document.body.appendChild(mdl);
}
async function finImportRead196() {
  const acc = (document.getElementById('fi-acc') || {}).value; const period = (document.getElementById('fi-period') || {}).value || currentMonth();
  const fileEl = document.getElementById('fi-file'); const pasted = ((document.getElementById('fi-text') || {}).value || '').trim();
  let text = pasted; const pv = document.getElementById('fi-preview');
  try {
    if (fileEl && fileEl.files && fileEl.files[0]) { if (pv) pv.innerHTML = '<div class="fin-note">Okunuyor…</div>'; text = await finReadStatementFile196(fileEl.files[0]); }
  } catch(e) { if (pv) pv.innerHTML = '<div class="fin-warn">Dosya okunamadı: ' + escapeHtml(String(e && e.message || e)) + '</div>'; return; }
  if (!text) { if (pv) pv.innerHTML = '<div class="fin-warn">Dosya seç ya da metni yapıştır.</div>'; return; }
  finImportPreview196(text, acc, period);
}
function finImportPreview196(text, accountId, period) {
  const parsed = finParseStatementText196(text, { period: period });
  const known = finKnownFingerprints196(accountId);
  const rows = parsed.rows.map(function(r){ const g = finGuessCategory196(r.desc); const dup = !!known[r.fp]; return Object.assign({}, r, { category: g.category, counterpartyId: g.counterpartyId, business: g.business, fromRule: g.fromRule, dup: dup, checked: !dup && r.kind !== 'payment' }); });
  __finImp196 = { accountId: accountId, period: period, meta: parsed.meta, rows: rows, text: text };
  finImportRenderPreview196();
}
function finImportRenderPreview196() {
  const pv = document.getElementById('fi-preview'); const I = __finImp196; if (!pv || !I) return;
  const cats = EXPENSE_CATS; const cps = finCounterparties196();
  const nNew = I.rows.filter(function(r){ return !r.dup && r.kind !== 'payment'; }).length, nDup = I.rows.filter(function(r){ return r.dup; }).length, nPay = I.rows.filter(function(r){ return r.kind === 'payment'; }).length;
  const head = '<div class="fin-tot">' + (I.meta.bank ? '<b>' + escapeHtml(I.meta.bank) + '</b> · ' : '') + I.rows.length + ' satır okundu: <b>' + nNew + ' yeni</b>' + (nDup ? ' · ' + nDup + ' zaten işlenmiş' : '') + (nPay ? ' · ' + nPay + ' kart ödemesi (atlanır)' : '') + '</div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end;"><div class="field" style="max-width:180px;"><label>Dönem borcu (₺)</label><input type="number" id="fi-total" step="0.01" value="' + (I.meta.toplam !== null && I.meta.toplam !== undefined ? I.meta.toplam : '') + '" placeholder="ekstredeki toplam"></div><div class="field" style="max-width:180px;"><label>Son ödeme tarihi</label><input type="date" id="fi-due" value="' + escapeHtml(I.meta.sonOdeme || '') + '"></div><span class="fin-note">İkisi de doluysa Vadeler\'e "kart ekstresi ödemesi" kalemi düşer; bankadan ödeyince kapanır.</span></div>';
  if (!I.rows.length) { pv.innerHTML = head + '<div class="fin-warn">Satır bulunamadı. Metinde her satırda tarih (gg.aa.yyyy) ve tutar (1.234,56) olmalı. PDF taranmış görüntüyse okunamaz — bankanın metin PDF\'i ya da CSV gerekir.</div>'; const b0 = document.getElementById('fi-process'); if (b0) b0.style.display = 'none'; return; }
  const body = I.rows.map(function(r, i){
    const cls = r.dup ? 'dup' : (r.kind === 'payment' ? 'pay' : '');
    const st = r.dup ? '<span class="badge">zaten işlendi</span>' : (r.kind === 'payment' ? '<span class="badge">kart ödemesi</span>' : (r.kind === 'credit' ? '<span class="badge ok">iade</span>' : (r.fromRule ? '<span class="badge ok" title="öğrenilmiş kural">kural</span>' : '<span class="badge">yeni</span>')));
    return '<tr class="' + cls + '"><td><input type="checkbox" ' + (r.checked ? 'checked' : '') + ' onchange="__finImp196.rows[' + i + '].checked=this.checked; finImportCount196()"></td><td data-label="Tarih">' + fmtDate(r.date) + '</td><td data-label="Açıklama" style="white-space:normal;max-width:260px;">' + escapeHtml(r.desc) + ' ' + st + '</td><td data-label="Tutar" style="text-align:right;white-space:nowrap;">' + (r.credit ? '−' : '') + money(r.amount) + ' ₺</td>' +
      '<td data-label="Kategori"><select onchange="__finImp196.rows[' + i + '].category=this.value">' + cats.map(function(c){ return '<option' + (c === r.category ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></td>' +
      '<td data-label="Cari"><select onchange="__finImp196.rows[' + i + '].counterpartyId=this.value"><option value="">—</option>' + cps.map(function(c){ return '<option value="' + c.id + '"' + (c.id === r.counterpartyId ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>'; }).join('') + '</select></td>' +
      '<td data-label="İşletme dışı" style="text-align:center;"><input type="checkbox" ' + (r.business === false ? 'checked' : '') + ' onchange="__finImp196.rows[' + i + '].business=!this.checked" title="Şahsi harcama: gider olmaz, kart sahibinin ortak çekimi olur"></td></tr>';
  }).join('');
  pv.innerHTML = head + '<div class="table-wrap" style="max-height:420px;overflow:auto;"><table class="resp-cards fin-imp-table"><thead><tr><th><input type="checkbox" checked onchange="__finImp196.rows.forEach(function(r){ if (!r.dup && r.kind!==\'payment\') r.checked=this.checked; }, this); finImportRenderPreview196()"></th><th>Tarih</th><th>Açıklama</th><th style="text-align:right;">Tutar</th><th>Kategori</th><th>Cari</th><th title="Şahsi harcama">İşl. dışı</th></tr></thead><tbody>' + body + '</tbody></table></div>';
  const b = document.getElementById('fi-process'); if (b) { b.style.display = ''; } finImportCount196();
}
function finImportCount196() { const b = document.getElementById('fi-process'); if (!b || !__finImp196) return; const n = __finImp196.rows.filter(function(r){ return r.checked; }).length; b.textContent = 'İşle (' + n + ' satır)'; b.disabled = !n; }
function finImportProcess196(opt) {
  const I = __finImp196; if (!I) return null;
  opt = opt || {};
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return null; }
  const card = finAccount196(I.accountId); if (!card || card.type !== 'card') { alert('Kart hesabı seçilmedi.'); return null; }
  const sel = I.rows.filter(function(r){ return r.checked; }); if (!sel.length) { alert('İşlenecek satır seçilmedi.'); return null; }
  const totalRaw = opt.total !== undefined ? opt.total : (document.getElementById('fi-total') || {}).value; const dueRaw = opt.dueDate !== undefined ? opt.dueDate : (document.getElementById('fi-due') || {}).value;
  __undoSnapshot('Kart ekstresi: ' + (card.name || '') + ' ' + I.period + ' (' + sel.length + ' satır)');
  __finNormalize196(state); state.expenses = state.expenses || [];
  let nExp = 0, nDraw = 0, nCredit = 0; const fps = [];
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
  });
  const total = finR2_196(totalRaw); const due = String(dueRaw || '');
  let dueMade = false;
  if (total > 0 && /^\d{4}-\d{2}-\d{2}$/.test(due)) {
    const id = 'cdue-' + card.id + '-' + I.period; let d = state.finDues.find(function(x){ return x && x.id === id; });
    if (!d) { d = { id: id, kind: 'due', dtype: 'card', status: 'open', createdAt: new Date().toISOString() }; state.finDues.push(d); }
    if (d.status === 'open') { d.title = finAccountLabel196(card.id) + (card.owner ? ' · ' + card.owner : '') + ' — ' + I.period + ' ekstresi'; d.amount = total; d.dueDate = due; d.period = I.period; d.accountId = card.id; d.category = 'Diğer'; dueMade = true; }
  }
  state.finImports.push({ id: uid(), kind: 'import', accountId: card.id, period: I.period, bank: I.meta.bank || card.bank || '', at: new Date().toISOString(), n: sel.length, total: total || null, dueDate: due || '', fingerprints: fps });
  save();
  const mdl = document.getElementById('modal-fin-imp'); if (mdl) mdl.remove(); __finImp196 = null;
  try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast('📄 Ekstre işlendi: ' + nExp + ' gider' + (nCredit ? ', ' + nCredit + ' iade' : '') + (nDraw ? ', ' + nDraw + ' şahsi' : '') + (dueMade ? ' · son ödeme kalemi eklendi' : ''));
  return { expenses: nExp, credits: nCredit, draws: nDraw, due: dueMade };
}
// kart borcu ödemesi → o kartın en eski açık ekstre kalemi kapanır (tutar ≥ kalem) ya da azalır (kısmi)
function finCloseCardDue196(mv) {
  if (!mv || mv.op !== 'cardpay') return;
  const open = (state.finDues || []).filter(function(d){ return d && d.dtype === 'card' && d.accountId === mv.toAccountId && d.status === 'open'; }).sort(function(a, b){ return String(a.dueDate).localeCompare(String(b.dueDate)); });
  if (!open.length) return;
  const d = open[0]; const paid = finR2_196(mv.amount);
  if (paid >= d.amount - 0.5) { d.status = 'paid'; d.paidRef = { type: 'move', id: mv.id }; d.paidDate = mv.date; d.paidAmount = paid; }
  else { d.amount = finR2_196(d.amount - paid); d.note = (d.note ? d.note + ' · ' : '') + fmtDate(mv.date) + ' ' + money(paid) + ' ₺ ödendi'; }
}
function renderPayments() {
  try { __renderPaymentRecords196(); }""")

# nakit hareketi silinince bağlı kart kalemi yeniden açılır
rep("""  __undoSnapshot('Hareket sil: ' + (FIN_MOVE_OPS196[mv.op] || '') + ' ' + money(Math.abs(+mv.amount || 0)) + ' ₺');
  state.finMoves = (state.finMoves || []).filter(function(x){ return !(x && x.id === id); });""",
"""  __undoSnapshot('Hareket sil: ' + (FIN_MOVE_OPS196[mv.op] || '') + ' ' + money(Math.abs(+mv.amount || 0)) + ' ₺');
  (state.finDues || []).forEach(function(d){ if (d && d.paidRef && d.paidRef.type === 'move' && d.paidRef.id === id) { d.status = 'open'; delete d.paidRef; delete d.paidDate; delete d.paidAmount; } }); // v196 adım 4
  state.finMoves = (state.finMoves || []).filter(function(x){ return !(x && x.id === id); });""")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
