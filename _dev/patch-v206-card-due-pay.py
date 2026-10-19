# -*- coding: utf-8 -*-
# v206 — KART EKSTRESİ ÖDEMESİ GİDER DEĞİLDİR (Kerem 19.10: "Buradaki Ekim giderleri tamamen ödendi; bir yanlışlık var, çözemedim").
# KÖK: Vadeler'deki ekstre kalemi (dtype 'card', içe aktarmadan gelen SAKLI kalem) "🏦 Öde" → finPayItem196 yalnız TÜRETİLMİŞ kart hatırlatıcısını
# kart ödemesine yönlendiriyordu; saklı kalem genel finPayDueModal196 → finPayDue196 GİDER yoluna düşüyor, hesap varsayılanı kalemin hesabı = KARTIN
# KENDİSİ. Sonuç (canlı, 19.10): Vakıf (Kerem) 132.896,13 + Vakıf (Derya) 74.875,40 = 207.771,53 ₺ sahte Ekim gideri (ekstre satırları zaten
# gider) ve kart borçları sıfırlanacağına ikiye katlandı (türetilmiş hatırlatıcılar 304.608,69 / 149.750,80 "kart borcu" gösterdi).
# ÇÖZÜM: (1) her kart kalemi (saklı ya da türetilmiş) → yeni "💳 Kart ödemesi" penceresi: tutar, gün (gecikmişse vade günü), ÇIKAN hesap yalnız
# banka/kasa (varsayılan: kart sahibinin bankası, yoksa Banka) → finMoves 'cardpay' (çıkan banka → giren kart), kalem kapanır (paidRef move);
# kısmi ödeme kalemi azaltır (mv.dueReduced; hareket silinince geri gelir); hesap açılmamışsa da kaydedilir (v199 ilkesi; bakiyeye açılıştan sonra
# işler); GİDER YAZILMAZ. (2) finPayDueModal196 / finPayDue196 kart kalemini bu yola yönlendirir (genel yoldan gider doğamaz; kaynak olarak kart
# reddedilir). (3) Ödeme/alındı pencerelerinde gecikmiş kalemin tarihi VADE GÜNÜ gelir (Kerem tikleri sonradan atıyor; 19.10'da atılan tikler
# bugünün tarihini almıştı). (4) Hareket penceresinden kart ödemesi (finCloseCardDue196) de kalemi kayda bağlar; kısmi ödeme silinince tutar geri gelir.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:120])
    s = s.replace(old, new)

# (1) yeni pencere + kayıt — finPayDueModal196'nın önüne
rep("""function finPayDueModal196(id) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === id; }); if (!d || d.status !== 'open') return;""",
"""// ═══════ v206 KART ÖDEMESİ (ekstre kalemi / kart borcu) → bankadan karta geçiş; GİDER DEĞİL ═══════
function finPayDefaultDate206(dueDate) { const t = todayISO(); return (dueDate && /^\\d{4}-\\d{2}-\\d{2}$/.test(String(dueDate)) && String(dueDate) < t) ? String(dueDate) : t; } // gecikmiş kalemde vade günü
function finCardPaySources206(card) { // ödemenin ÇIKACAĞI hesaplar: kart dışı (banka/kasa); varsayılan kart sahibinin bankası, yoksa Banka
  const list = finAccounts196().filter(function(a){ return a && a.type !== 'card'; });
  let def = '';
  if (card && card.owner) { const own = list.find(function(a){ return a.type === 'bank' && a.owner && a.owner === card.owner; }); if (own) def = own.id; }
  if (!def && list.some(function(a){ return a.id === FIN_ACC_BANK; })) def = FIN_ACC_BANK;
  if (!def && list.length) def = list[0].id;
  return { list: list, def: def };
}
function finCardPayItem206(id) { return finDueItems196().find(function(x){ return x && x.id === id && x.dtype === 'card'; }) || null; }
function finPayCardDueModal206(id) {
  const it = finCardPayItem206(id); if (!it) return;
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  const card = finAccount196(it.accountId); if (!card) { alert('Kart hesabı bulunamadı.'); return; }
  const src = finCardPaySources206(card);
  if (!src.list.length) { alert('Ödemenin çıkacağı banka/kasa hesabı yok — 🏦 Hesaplar sekmesinden ekle.'); return; }
  const old = document.getElementById('modal-fin-cardpay'); if (old) old.remove();
  const dflt = finPayDefaultDate206(it.dueDate);
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-cardpay'; mdl.className = 'modal-bg open'; mdl.dataset.dueId = it.id;
  mdl.innerHTML = '<div class="modal" style="max-width:440px;"><h3>💳 Kart ödemesi: ' + escapeHtml(finAccountLabel196(card.id)) + '</h3>' +
    '<div class="fin-note">' + escapeHtml(it.title) + ' · son ödeme ' + fmtDate(it.dueDate) + '. Bankadan karta geçiş olarak kaydedilir — <b>gider değildir</b> (kart harcamaları ekstreden zaten gider olarak işlendi).</div>' +
    '<div class="field"><label>Tutar (₺)</label><input type="number" id="fcp-amount" step="0.01" min="0" value="' + it.amount + '"><div class="fin-note">Eksik ödersen kalan tutar kalemde açık kalır.</div></div>' +
    '<div class="field"><label>Ödeme günü</label><input type="date" id="fcp-date" value="' + dflt + '" onchange="finCardPayNote206()" oninput="finCardPayNote206()">' + (dflt !== todayISO() ? '<div class="fin-note">Gecikmiş kalem — tarih vade günüyle geldi; başka gün ödendiyse değiştir.</div>' : '') + '</div>' +
    '<div class="field"><label>Hangi hesaptan ödendi</label><select id="fcp-from" onchange="finCardPayNote206()">' + src.list.map(function(a){ return '<option value="' + a.id + '"' + (a.id === src.def ? ' selected' : '') + '>' + escapeHtml(finAccountLabel196(a.id)) + (a.owner ? ' · ' + escapeHtml(a.owner) : '') + '</option>'; }).join('') + '</select></div>' +
    '<div class="fin-note" id="fcp-pre-note" style="display:none;color:#7a4a00;"></div>' +
    '<div class="field"><label>Not</label><input id="fcp-note" value=""></div>' +
    '<div class="row" style="justify-content:flex-end;gap:8px;"><button class="btn secondary" onclick="document.getElementById(\\'modal-fin-cardpay\\').remove()">Vazgeç</button><button class="btn" id="fcp-save">Kaydet</button></div></div>';
  document.body.appendChild(mdl);
  const sv = document.getElementById('fcp-save'); if (sv) sv.onclick = function(){ finPayCardDue206(it.id); };
  finCardPayNote206();
}
function finCardPayNote206() {
  try {
    const n = document.getElementById('fcp-pre-note'); if (!n) return;
    const mdl = document.getElementById('modal-fin-cardpay'); const it = mdl ? finCardPayItem206(mdl.dataset.dueId) : null; const card = it ? finAccount196(it.accountId) : null;
    const a = finAccount196((document.getElementById('fcp-from') || {}).value || ''); const date = (document.getElementById('fcp-date') || {}).value || '';
    const msgs = [];
    if (!a || !a.openingDate) msgs.push('⚠️ Çıkan hesap henüz açılmadı — ödeme kaydedilir, hesap açılınca açılış tarihinden itibaren bakiyesine işler.');
    else if (date && date < a.openingDate) msgs.push('⚠️ Seçilen gün çıkan hesabın açılışından (' + fmtDate(a.openingDate) + ') önce — kaydedilir, o hesabın bakiyesine girmez.');
    if (card && card.openingDate && date && date < card.openingDate) msgs.push('⚠️ Seçilen gün kartın açılışından (' + fmtDate(card.openingDate) + ') önce — kart bakiyesine girmez.');
    n.style.display = msgs.length ? '' : 'none'; n.textContent = msgs.join(' ');
  } catch(e) {}
}
function finPayCardDue206(id, opt) { // kart kalemi ödemesi → finMoves 'cardpay' (çıkan banka/kasa → giren kart); saklı kalem kapanır; GİDER YAZILMAZ
  opt = opt || {};
  const it = finCardPayItem206(id); if (!it) return null;
  const card = finAccount196(it.accountId); if (!card || card.type !== 'card') { alert('Kart hesabı bulunamadı.'); return null; }
  const amount = finR2_196(opt.amount !== undefined ? opt.amount : (document.getElementById('fcp-amount') || {}).value);
  const date = opt.date || (document.getElementById('fcp-date') || {}).value || finPayDefaultDate206(it.dueDate);
  const from = opt.fromAccountId || opt.accountId || (document.getElementById('fcp-from') || {}).value || '';
  const note = (opt.note !== undefined ? String(opt.note) : ((document.getElementById('fcp-note') || {}).value || '')).trim();
  if (amount <= 0) { alert('Tutar 0\\'dan büyük olmalı.'); return null; }
  const a = finAccount196(from); if (!a) { alert('Ödemenin çıktığı hesabı seç.'); return null; }
  if (a.type === 'card') { alert('Kart borcu bir kart hesabından ödenemez — banka ya da kasa seç.'); return null; }
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(String(date))) { alert('Tarih seç.'); return null; }
  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return null; }
  __undoSnapshot('Kart ödemesi: ' + (card.name || '') + ' ' + money(amount) + ' ₺');
  state.finMoves = state.finMoves || [];
  const mv = { id: uid(), kind: 'move', op: 'cardpay', date: date, amount: amount, fromAccountId: a.id, toAccountId: card.id, note: note, at: new Date().toISOString() };
  const d = it.derived ? null : (state.finDues || []).find(function(x){ return x && x.id === it.id && x.status === 'open'; });
  if (d) {
    mv.dueId = d.id;
    if (amount >= finR2_196(d.amount) - 0.5) { d.status = 'paid'; d.paidRef = { type: 'move', id: mv.id }; d.paidDate = date; d.paidAmount = amount; }
    else { mv.dueReduced = amount; d.amount = finR2_196(d.amount - amount); d.note = (d.note ? d.note + ' · ' : '') + fmtDate(date) + ' ' + money(amount) + ' ₺ ödendi'; }
  }
  state.finMoves.push(mv);
  const pre = !a.openingDate || date < a.openingDate;
  const mdl = document.getElementById('modal-fin-cardpay'); if (mdl) mdl.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast('✓ ' + (card.name || 'Kart') + ' ödemesi kaydedildi' + (d && d.status === 'open' ? ' · kalan ' + money(d.amount) + ' ₺ açık' : '') + (pre ? ' · ' + (a.name || 'hesap') + ' açılış öncesi, bakiyesine girmedi' : ''));
  return mv;
}
function finPayDueModal196(id) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === id; }); if (!d || d.status !== 'open') return;
  if (d.dtype === 'card') { finPayCardDueModal206(id); return; } // v206: ekstre kalemi gider yoluna DÜŞMEZ""")

# (3) gecikmiş kalemde varsayılan tarih = vade günü
rep("""    '<div class="field"><label>' + (d.dtype === 'income' ? 'Alındığı gün' : 'Ödeme günü') + '</label><input type="date" id="fp-date" value="' + todayISO() + '" onchange="finPayPreNote199()" oninput="finPayPreNote199()"></div>' +""",
    """    '<div class="field"><label>' + (d.dtype === 'income' ? 'Alındığı gün' : 'Ödeme günü') + '</label><input type="date" id="fp-date" value="' + finPayDefaultDate206(d.dueDate) + '" onchange="finPayPreNote199()" oninput="finPayPreNote199()">' + (finPayDefaultDate206(d.dueDate) !== todayISO() ? '<div class="fin-note">Gecikmiş kalem — tarih vade günüyle geldi; başka gün ' + (d.dtype === 'income' ? 'alındıysa' : 'ödendiyse') + ' değiştir.</div>' : '') + '</div>' + // v206""")

# (2) finPayDue196 guard
rep("""function finPayDue196(id, opt) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === id; }); if (!d || d.status !== 'open') return null;
  opt = opt || {};""",
"""function finPayDue196(id, opt) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === id; }); if (!d || d.status !== 'open') return null;
  opt = opt || {};
  if (d.dtype === 'card') return finPayCardDue206(id, opt); // v206: kart kalemi → bankadan karta ödeme (gider yazılmaz; kaynak kart olamaz)""")

# finPayItem196: her kart kalemi yeni pencereye
rep("""  if (it.dtype === 'card' && it.derived) { openFinMoveModal196('cardpay'); try { const to = document.getElementById('fm-to'); if (to) to.value = it.accountId; const am = document.getElementById('fm-amount'); if (am) am.value = it.amount; __finMoveFields196(); } catch(e) {} return; }
  finPayDueModal196(id);""",
"""  if (it.dtype === 'card') { finPayCardDueModal206(it.id); return; } // v206: ekstre kalemi de türetilmiş kart borcu da → kart ödemesi penceresi (gider DEĞİL)
  finPayDueModal196(id);""")

# Vadeler satırı: kart düğmesi ipucu
rep("""    else if (it.dtype === 'card') act = '<button class="btn small ok" onclick="finPayItem196(\\'' + it.id + '\\')">🏦 Öde</button>';""",
    """    else if (it.dtype === 'card') act = '<button class="btn small ok" onclick="finPayItem196(\\'' + it.id + '\\')" title="Bankadan karta ödeme — gider yazmaz">🏦 Öde</button>'; // v206""")

# (4) hareket penceresinden kart ödemesi: kalem kayda bağlanır; kısmi ödeme izlenir
rep("""  const d = open[0]; const paid = finR2_196(mv.amount);
  if (paid >= d.amount - 0.5) { d.status = 'paid'; d.paidRef = { type: 'move', id: mv.id }; d.paidDate = mv.date; d.paidAmount = paid; }
  else { d.amount = finR2_196(d.amount - paid); d.note = (d.note ? d.note + ' · ' : '') + fmtDate(mv.date) + ' ' + money(paid) + ' ₺ ödendi'; }""",
"""  const d = open[0]; const paid = finR2_196(mv.amount);
  mv.dueId = d.id; // v206
  if (paid >= d.amount - 0.5) { d.status = 'paid'; d.paidRef = { type: 'move', id: mv.id }; d.paidDate = mv.date; d.paidAmount = paid; }
  else { mv.dueReduced = paid; d.amount = finR2_196(d.amount - paid); d.note = (d.note ? d.note + ' · ' : '') + fmtDate(mv.date) + ' ' + money(paid) + ' ₺ ödendi'; } // v206: silinirse tutar geri gelir""")

# removeFinMove196: kısmi ödeme silinince kalem tutarı geri gelir
rep("""  (state.finDues || []).forEach(function(d){ if (d && d.paidRef && d.paidRef.type === 'move' && d.paidRef.id === id) { d.status = 'open'; delete d.paidRef; delete d.paidDate; delete d.paidAmount; } }); // v196 adım 4""",
"""  (state.finDues || []).forEach(function(d){ if (d && d.paidRef && d.paidRef.type === 'move' && d.paidRef.id === id) { d.status = 'open'; delete d.paidRef; delete d.paidDate; delete d.paidAmount; } }); // v196 adım 4
  if (mv.dueId && +mv.dueReduced > 0) { // v206: kısmi kart ödemesi silindi → kalemin tutarı geri gelir (kalem bu arada kapandıysa silinen kadar yeni açık kalem)
    const dd = (state.finDues || []).find(function(x){ return x && x.id === mv.dueId; });
    if (dd) {
      const frag = fmtDate(mv.date) + ' ' + money(+mv.dueReduced) + ' ₺ ödendi';
      if (dd.status === 'open') { dd.amount = finR2_196((+dd.amount || 0) + (+mv.dueReduced)); dd.note = String(dd.note || '').replace(' · ' + frag, '').replace(frag, '').trim(); }
      else { let n = 1; while (state.finDues.some(function(x){ return x && x.id === dd.id + '-r' + n; })) n++; state.finDues.push(Object.assign({}, dd, { id: dd.id + '-r' + n, amount: finR2_196(+mv.dueReduced), status: 'open', note: 'silinen kısmi ödeme (' + fmtDate(mv.date) + ')', paidRef: undefined, paidDate: undefined, paidAmount: undefined, createdAt: new Date().toISOString() })); }
    }
  }""")

rep('<meta name="app-version" content="2026.10.18.128">', '<meta name="app-version" content="2026.10.19.129">')
rep("const APP_VERSION = '2026.10.18.128';", "const APP_VERSION = '2026.10.19.129';")
io.open(P, 'w', encoding='utf-8').write(s)
w = io.open('sw.js', encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v205-2026-10-18-128';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v205-2026-10-18-128';", "const CACHE_NAME = 'pilateria-v206-2026-10-19-129';")
io.open('sw.js', 'w', encoding='utf-8').write(w)
print('v206 yama tamam')
