# -*- coding: utf-8 -*-
# v197 (Kerem 18.10): "6. ayın ödemeleri yapıldı sanırım; yapıldı işaretlenmediği için borç gözüküyor. HESAPLAMAYA TEMMUZ AYI
# İTİBARİ İLE BAŞLASIN UYGULAMA. Bu ayki ödemeleri ve düzenli ödemeleri daha sonra gireceğim."
# KÖK: getOverduePayments (Panel "Geciken Ödemeler", Finans üye alacakları/ekstre/nakit akışı, WhatsApp borç) ve
# finInstructorDues196 (hoca hakedişi) ders olan TÜM ayları tarar; Haziran'da ödemesi uygulamaya işlenmemiş üyeler/gruplar ve
# hoca hakedişleri borç olarak listelenir. Şablon vade üretimi de şablonun başlangıç ayından (12 ay geriye kadar) üretir;
# Gelir–Gider raporu 12 ay geriye (2025-11) sütun açar.
# ÇÖZÜM (tek ayar, tek kapı): settings.finance.startMonth — varsayılan '2026-07', '' = sınır yok; 🏦 Hesaplar'da düzenlenir.
#   finStartMonth196() / finMonthInScope196(ay) → getOverduePayments (ay < başlangıç → o ay hesaba girmez), finInstructorDues196,
#   finEnsureTemplateDues196 (üretim tabanı), finStatementRows196 (üye/grup/hoca/cari ekstre satırları), finMonthsBack196
#   (rapor sütunları; hepsi elenirse bu ay). Hesap BAKİYELERİ hesabın açılış tarihine bağlıdır → bu ayardan ETKİLENMEZ.
#   Cari başlıklarında ve Panel kartında "Temmuz ve sonrası" notu. Kerem isterse ayı boşaltıp Haziran'ı geri getirebilir.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# 1) sabit — load() öncesi (var)
rep("var FIN_MOVE_OPS196 = { transfer:'Virman', cardpay:'Kart borcu ödemesi', draw:'Ortak çekimi', capital:'Sermaye', reconcile:'Mutabakat' };\n",
    "var FIN_MOVE_OPS196 = { transfer:'Virman', cardpay:'Kart borcu ödemesi', draw:'Ortak çekimi', capital:'Sermaye', reconcile:'Mutabakat' };\n"
    "var FIN_START_DEFAULT196 = '2026-07'; // v197: finans başlangıç ayı varsayılanı (Kerem 18.10: \"hesaplamaya Temmuz itibarıyla başlasın\")\n")

# 2) normalize: tanımsız/geçersiz → varsayılan; '' korunur (sınır yok)
rep("  fs.safetyMin = +fs.safetyMin || 0;\n  if (!st.finAccounts.some(",
    "  fs.safetyMin = +fs.safetyMin || 0;\n"
    "  if (!(fs.startMonth === '' || (typeof fs.startMonth === 'string' && /^\\d{4}-(0[1-9]|1[0-2])$/.test(fs.startMonth)))) fs.startMonth = FIN_START_DEFAULT196; // v197: '' = sınır yok\n"
    "  if (!st.finAccounts.some(")

# 3) yardımcılar
rep("function finActive196() { const a = finAccount196(FIN_ACC_CASH), b = finAccount196(FIN_ACC_BANK); return !!((a && a.openingDate) || (b && b.openingDate)); }\n",
    "function finActive196() { const a = finAccount196(FIN_ACC_CASH), b = finAccount196(FIN_ACC_BANK); return !!((a && a.openingDate) || (b && b.openingDate)); }\n"
    "// v197 FİNANS BAŞLANGIÇ AYI (Kerem 18.10): bu aydan ÖNCEKİ aylar üye borcu (Panel \"Geciken Ödemeler\" dahil), hoca hakedişi, şablon vadesi,\n"
    "// ekstre ve rapor sütunu hesabına GİRMEZ. '' = sınır yok. Hesap bakiyeleri hesabın açılış tarihine bağlıdır, bu ayardan etkilenmez.\n"
    "function finStartMonth196() { try { const v = ((state && state.settings && state.settings.finance) || {}).startMonth; if (v === '') return ''; if (typeof v === 'string' && /^\\d{4}-(0[1-9]|1[0-2])$/.test(v)) return v; return FIN_START_DEFAULT196; } catch(e) { return FIN_START_DEFAULT196; } }\n"
    "function finMonthInScope196(ay) { const s = finStartMonth196(); return !s || !ay || String(ay).slice(0, 7) >= s; }\n")

# 4) getOverduePayments: başlangıç ayından önceki ay hesaba girmez (Panel + Finans + WhatsApp aynı kaynak)
rep("""  // Vadesi gelmis + borclu aylari sec (fiyat tanimsizsa BORC UYDURULMAZ)
  function __ovRows(map, expectedFn, paidFn) {
    const rows = [];
    Object.keys(map).sort().forEach(ay => {
      const firstDate = map[ay];
""",
"""  // Vadesi gelmis + borclu aylari sec (fiyat tanimsizsa BORC UYDURULMAZ)
  const __fs197 = (typeof finStartMonth196 === 'function') ? finStartMonth196() : ''; // v197: finans başlangıç ayı
  function __ovRows(map, expectedFn, paidFn) {
    const rows = [];
    Object.keys(map).sort().forEach(ay => {
      if (__fs197 && ay < __fs197) return;              // v197: başlangıç ayından önceki ay hesaba girmez (Kerem: Haziran ödendi, işaretlenmedi)
      const firstDate = map[ay];
""")

# 5) hoca hakediş vadeleri
rep("""    Object.keys(months).sort().forEach(function(m){
      if (m > cur) return;
      const hak = finR2_196((instructorEarningsForMonth(inst.id, m) || {}).total);""",
"""    Object.keys(months).sort().forEach(function(m){
      if (m > cur || !finMonthInScope196(m)) return; // v197: başlangıç ayı
      const hak = finR2_196((instructorEarningsForMonth(inst.id, m) || {}).total);""")

# 6) şablon vade üretimi tabanı
rep("    let m = tp.startMonth || cur; if (m < floor) m = floor;\n",
    "    let m = tp.startMonth || cur; if (m < floor) m = floor; { const fs197 = finStartMonth196(); if (fs197 && m < fs197) m = fs197; } // v197: başlangıç ayından önceye kalem üretilmez\n")

# 7) ekstreler (finStatementRows196 + eski satır içi kopya aynı kalıbı taşır → 2x)
rep("pays.forEach(function(p){ allM[paymentMonthOf(p)] = 1; });",
    "pays.forEach(function(p){ if (finMonthInScope196(paymentMonthOf(p))) allM[paymentMonthOf(p)] = 1; }); /* v197 */", 2)
rep("Object.keys(months).sort().forEach(function(m){ const hak = r2((instructorEarningsForMonth(id, m) || {}).total); if (hak) rows.push(",
    "Object.keys(months).sort().forEach(function(m){ if (!finMonthInScope196(m)) return; /* v197 */ const hak = r2((instructorEarningsForMonth(id, m) || {}).total); if (hak) rows.push(", 2)
rep("(state.finDues || []).filter(function(d){ return d && d.counterpartyId === id && d.status !== 'skipped'; }).forEach(function(d){ rows.push(",
    "(state.finDues || []).filter(function(d){ return d && d.counterpartyId === id && d.status !== 'skipped' && finMonthInScope196(String(d.period || d.dueDate || '').slice(0, 7)); }).forEach(function(d){ rows.push(", 2)
rep("(state.expenses || []).filter(function(e){ return e && e.counterpartyId === id; }).forEach(function(e){ rows.push(",
    "(state.expenses || []).filter(function(e){ return e && e.counterpartyId === id && finMonthInScope196(String(e.paidDate || e.date || '').slice(0, 7)); }).forEach(function(e){ rows.push(", 2)

# 8) rapor sütunları
rep("function finMonthsBack196(n) { const out = []; const cur = currentMonth(); for (let i = n - 1; i >= 0; i--) out.push(finMonthAdd196(cur, -i)); return out; }",
    "function finMonthsBack196(n) { const out = []; const cur = currentMonth(); const fs = finStartMonth196(); for (let i = n - 1; i >= 0; i--) { const m = finMonthAdd196(cur, -i); if (fs && m < fs) continue; out.push(m); } if (!out.length) out.push(cur); return out; } // v197: başlangıç ayından önceki sütun açılmaz")

# 9) Cari başlık notları
rep("""function renderFinCari196() {
  const el = document.getElementById('fin-cari-body'); if (!el) return;
  try { finEnsureTemplateDues196(); } catch(e) {}
""",
"""function renderFinCari196() {
  const el = document.getElementById('fin-cari-body'); if (!el) return;
  try { finEnsureTemplateDues196(); } catch(e) {}
  const __fsNote197 = (function(){ const s = finStartMonth196(); return s ? '; ' + pkgMonthLabel(s) + ' ve sonrası' : ''; })(); // v197
""")
rep("'<div class=\"fin-sec\">📥 Bize borçlu — üyeler <small class=\"fin-note\">(paket ücreti − ödenen; Üyeler sayfasındaki kayıtlardan)</small></div>'",
    "'<div class=\"fin-sec\">📥 Bize borçlu — üyeler <small class=\"fin-note\">(paket ücreti − ödenen; Üyeler sayfasındaki kayıtlardan' + __fsNote197 + ')</small></div>'")
rep("'<div class=\"fin-sec\">📤 Biz borçluyuz — hocalar <small class=\"fin-note\">(hakediş − ödenen; \"Ortak\" işaretli hoca hariç)</small></div>'",
    "'<div class=\"fin-sec\">📤 Biz borçluyuz — hocalar <small class=\"fin-note\">(hakediş − ödenen; \"Ortak\" işaretli hoca hariç' + __fsNote197 + ')</small></div>'")

# 10) Panel "Geciken Ödemeler" notu
rep("""  const overdue = getOverduePayments();
  const ocard = document.getElementById('overdue-card');
""",
"""  const overdue = getOverduePayments();
  const __ovNote197 = (function(){ try { const s2 = (typeof finStartMonth196 === 'function') ? finStartMonth196() : ''; return s2 ? '<div style="font-size:12px;color:var(--muted);margin-top:6px;">📅 ' + pkgMonthLabel(s2) + ' ve sonrası hesaba girer (Finans › 🏦 Hesaplar › Finans başlangıç ayı)</div>' : ''; } catch(e) { return ''; } })(); // v197
  const ocard = document.getElementById('overdue-card');
""")
rep("""      </tr>`).join('') + '</tbody></table></div>';
  }

  // Bugünün Mesajları (sabah 08:00 hatırlatmaları için)""",
"""      </tr>`).join('') + '</tbody></table></div>' + __ovNote197;
  }

  // Bugünün Mesajları (sabah 08:00 hatırlatmaları için)""")

# 11) Hesaplar: ayar alanı
rep("    '<b>Güvenlik payı</b> <span class=\"fin-note\">(nakit akışı projeksiyonunda bu tutarın altına düşen gün uyarılır)</span>' +\n",
    "    '<b>Finans başlangıç ayı</b> <span class=\"fin-note\">(bu aydan önceki aylar hesaba girmez: üye borcu — Panel \"Geciken Ödemeler\" dahil —, hoca hakedişi, vade kalemleri, ekstre ve rapor sütunları; boş = sınır yok. Hesap bakiyeleri hesabın açılış tarihine bağlıdır, etkilenmez.)</span>' +\n"
    "    '<div class=\"row\" style=\"gap:8px;flex-wrap:wrap;margin:6px 0;\"><input type=\"month\" id=\"fin-start\" style=\"width:180px;\" value=\"' + escapeHtml(finStartMonth196()) + '\"><button class=\"btn small secondary\" onclick=\"saveFinSettings196()\">Kaydet</button></div>' +\n"
    "    '<b>Güvenlik payı</b> <span class=\"fin-note\">(nakit akışı projeksiyonunda bu tutarın altına düşen gün uyarılır)</span>' +\n")

# 12) kaydet
rep("""  const sm = Math.max(0, Math.round((+((document.getElementById('fin-safety') || {}).value) || 0) * 100) / 100);
  __undoSnapshot('Finans ayarları');
  state.settings.finance.partners = ps; state.settings.finance.safetyMin = sm;
  save(); renderFinAccounts196(); if (window.plToast) plToast('✓ Finans ayarları kaydedildi');""",
"""  const sm = Math.max(0, Math.round((+((document.getElementById('fin-safety') || {}).value) || 0) * 100) / 100);
  const __stEl197 = document.getElementById('fin-start'); let __fs197 = state.settings.finance.startMonth; // v197
  if (__stEl197) { const v = String(__stEl197.value || '').trim(); if (v !== '' && !/^\\d{4}-(0[1-9]|1[0-2])$/.test(v)) { alert('Finans başlangıç ayı YYYY-AA biçiminde olmalı (örn. 2026-07) ya da boş bırakılmalı.'); return; } __fs197 = v; }
  __undoSnapshot('Finans ayarları');
  state.settings.finance.partners = ps; state.settings.finance.safetyMin = sm; state.settings.finance.startMonth = __fs197;
  save(); renderFinAccounts196(); try { __refreshUIInPlace(); } catch(e) {} if (window.plToast) plToast('✓ Finans ayarları kaydedildi');""")

io.open(P, 'w', encoding='utf-8').write(s)
print('OK v197 finance-start-month: %d -> %d (+%d)' % (n0, len(s), len(s) - n0))
