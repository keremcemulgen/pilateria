# -*- coding: utf-8 -*-
# v209 — SADE FİNANS (Kerem 20.10): "Raporlar kısmı Finans başlığının altında olmalı; başlıklar çok karmaşık, ben muhasebeci değilim,
# cari vb. anlamıyorum; başlıkları azalt, içeriği basitleştir ve otomatikleştir."
# Kararlar (AskUserQuestion): bankadan/kasadan ödenen düzenli kalemler vade gününde KENDİLİĞİNDEN ödendi sayılır (maaş girişi dahil);
# kartla ödenen tek düzenli kalem Bağ-Kur (ekstreyle kapanır); Finans'ta 4 sekme.
# (1) Üst menüdeki "📈 Raporlar" Finans'ın içine taşındı (Finans › 📈 Raporlar); switchPage('reports') → Finans › Raporlar.
# (2) Finans sekmeleri: 📊 Özet · 💸 Gelir & Gider · 📈 Raporlar · ⚙️ Hesaplar. Cari / Vadeler / Nakit Akışı / Tablolar sekmeleri arayüzden
#     kalktı (paneller ve fonksiyonlar kodda durur, kayıt silinmez); eski seçili sekme bir kez Özet'e (Tablolar → Raporlar'a) taşınır.
# (3) Otomatik: finAutoPayDues209 — banka/kasa hesaplı düzenli kalem vade günü gelince ödendi (gider ya da maaş girişi; kimlik 'ap-'+kalem),
#     olası ödeme varsa ona bağlanır; kart hesaplı kalem beklemez, ekstreyle kapanır (Özet'te "💳 ekstreyle"). Yalnız sahip, bulut çekimi
#     tamamlandıktan sonra (bayat yerel veriyle asla); 20.10.2026'dan (ya da şablonun eklendiği günden) önceki kalemler otomatik ödenmez;
#     düzenli kalemin ödeme kaydı silinirse (ya da "Ödenmedi") kalem bir daha otomatik ödenmez (noAuto) — silinen kendiliğinden geri gelmez.
# (4) Özet: kart son ödemeleri (🏦 Öde), düzenli satırlarda "✓ Ödendi" / "✎" (tutar-tarih-hesap düzelt, "ödenmedi" geri al), 30 gün tahmini.
# (5) Gelir & Gider: + Üye ödemesi · + Gider · 📄 Kart ekstresi · ⇄ Para aktar; "cari", "vadeli", "virman", "mutabakat", "sermaye",
#     "ortak çekimi" kelimeleri kalktı (sade adlar). Hesap hareketleri kapalı gelir.
# (6) Hesaplar: hesaplarım · düzenli ödemeler ve gelirler (🤖 otomatik / 💳 ekstreyle / ✋ elle) · döviz kuru · diğer ayarlar (kapalı).
# (7) Güvenlik: bankadan OTOMATİK ödendi sayılan düzenli kalem kart ekstresinde çıkarsa (aynı tutar, ±10 gün) otomatik banka kaydı silinir, kalem
#     ekstre satırına (kart) bağlanır — çift sayılmaz, banka bakiyesi düzelir. Elle onaylanmış banka ödemesi (otomatik değil) v208 gibi "zaten ödendi".
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:140])
    s = s.replace(old, new)

# ── 0) sürüm
rep('<meta name="app-version" content="2026.10.20.131">', '<meta name="app-version" content="2026.10.20.132">')
rep("const APP_VERSION = '2026.10.20.131';", "const APP_VERSION = '2026.10.20.132';")

# ── 1) CSS: v208 "⋯ Diğer" kuralları kalktı; yazdırmada Finans sekme şeridi gizli
rep("""  #fin-tabs .fin-tab-more { display:none; }
  #fin-tabs.more .fin-tab-more, #fin-tabs .fin-tab-more.active { display:inline-block; }
""", """  .fo-act { display:inline-flex; gap:6px; align-items:center; flex-wrap:wrap; }
  .fo-act .btn.small { padding:2px 8px; font-size:12px; }
""")
rep("""    #tabs, .bnav, .bnav-item, .toolbar, .btn, .no-print, #cloud-dot, .modal-bg, nav { display:none !important; }""",
    """    #tabs, .bnav, .bnav-item, .toolbar, .btn, .no-print, #cloud-dot, .modal-bg, nav, #fin-tabs { display:none !important; }""")

# ── 2) Üst menü ve mobil "Diğer" menüsünden Raporlar kalktı (Finans'ın içinde)
rep("""  <button class="tab" data-page="reports">📈 Raporlar</button>
""", "")
rep("""    <button class="more-item" onclick="closeMoreMenu();switchPage('reports')">📈 Raporlar</button>
""", "")

# ── 3) Finans sekmeleri: 4 sekme
rep("""      <button class="fin-tab pl-owner-only" data-fin="ozet" onclick="finSwitchTab196('ozet')">📊 Özet</button>
      <button class="fin-tab active" data-fin="moves" onclick="finSwitchTab196('moves')">🔁 Hareketler</button>
      <button class="fin-tab pl-owner-only" data-fin="dues" onclick="finSwitchTab196('dues')">⏰ Düzenli &amp; Vadeler</button>
      <button class="fin-tab pl-owner-only" data-fin="accounts" onclick="finSwitchTab196('accounts')">🏦 Hesaplar</button>
      <button class="fin-tab pl-owner-only fin-more-btn" type="button" aria-expanded="false" onclick="finToggleMore208()" title="Nakit akışı projeksiyonu, cari ekstreler, tablolar">⋯ Diğer</button>
      <button class="fin-tab pl-owner-only fin-tab-more" data-fin="cash" onclick="finSwitchTab196('cash')">💰 Nakit Akışı</button>
      <button class="fin-tab pl-owner-only fin-tab-more" data-fin="cari" onclick="finSwitchTab196('cari')">👥 Cari</button>
      <button class="fin-tab pl-owner-only fin-tab-more" data-fin="reports" onclick="finSwitchTab196('reports')">📈 Tablolar</button>
""", """      <button class="fin-tab pl-owner-only" data-fin="ozet" onclick="finSwitchTab196('ozet')">📊 Özet</button>
      <button class="fin-tab active" data-fin="moves" onclick="finSwitchTab196('moves')">💸 Gelir &amp; Gider</button>
      <button class="fin-tab fin-tab-rapor" data-fin="rapor" onclick="finSwitchTab196('rapor')">📈 Raporlar</button>
      <button class="fin-tab pl-owner-only" data-fin="accounts" onclick="finSwitchTab196('accounts')">⚙️ Hesaplar</button>
""")

# ── 4) Gelir & Gider (eski Hareketler) — sade düğmeler ve adlar
rep("""      <button class="btn" onclick="openPaymentModal()">+ Ödeme Kaydet</button>
      <button class="btn secondary pl-owner-only" onclick="openFinMoveModal196()" title="Virman, ortak çekimi, sermaye, mutabakat, kart borcu ödemesi">+ Nakit Hareketi</button>
      <button class="btn secondary pl-owner-only" onclick="openFinImportModal196()" title="Kredi kartı ekstresini yükle (PDF / CSV / metin): giderler okunur, kategori önerilir, çift kayıt engellenir">📄 Kart Ekstresi Yükle</button>
      <input type="month" id="pay-month" onchange="renderPayments()">""", """      <button class="btn" onclick="openPaymentModal()">+ Üye ödemesi</button>
      <button class="btn secondary pl-owner-only" onclick="finOpenExpenseForm209()" title="Elle gider ekle (kartla ödenenler ekstreden gelir)">+ Gider</button>
      <button class="btn secondary pl-owner-only" onclick="openFinImportModal196()" title="Kredi kartı ekstresini yükle (PDF / CSV / metin): giderler okunur, kategori önerilir, aynı kayıt iki kez yazılmaz, düzenli kalemler kendiliğinden kapanır">📄 Kart ekstresi yükle</button>
      <button class="btn secondary pl-owner-only" onclick="openFinMoveModal196()" title="Hesaplar arası aktarma (kasadan bankaya…), kart borcu ödeme, maaş vb. gelir, bakiye düzeltme">⇄ Para aktar</button>
      <input type="month" id="pay-month" onchange="renderPayments()">""")
rep("""    <details id="fin-moves-card" class="pl-owner-only" open style="margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:10px;">
      <summary style="cursor:pointer;font-weight:700;">🔁 Hesap Hareketleri <span id="fin-moves-sub" style="font-weight:400;color:var(--muted);margin-left:6px;"></span></summary>""",
    """    <details id="fin-moves-card" class="pl-owner-only" style="margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:10px;">
      <summary style="cursor:pointer;font-weight:700;">🔁 Hesaplardaki tüm giriş–çıkışlar <span id="fin-moves-sub" style="font-weight:400;color:var(--muted);margin-left:6px;"></span></summary>""")
rep("""<option value="virman">Virman</option><option value="cekim">Ortak çekimi</option><option value="sermaye">Sermaye</option><option value="gelir">Gelir (maaş / iade)</option><option value="mutabakat">Mutabakat</option><option value="kart">Kart borcu ödemesi</option>""",
    """<option value="virman">Hesaplar arası aktarma</option><option value="cekim">Kişisel çekim</option><option value="sermaye">Hesaba para koyma</option><option value="gelir">Gelir (maaş vb.)</option><option value="mutabakat">Bakiye düzeltme</option><option value="kart">Kredi kartı borcu ödeme</option>""")
rep("""        <select id="exp-cp" class="pl-owner-only" title="Karşı taraf (cari) — isteğe bağlı"></select>
        <select id="exp-scope" class="pl-owner-only" title="Kapsam: stüdyo gideri mi, hane (ev/aile) gideri mi — ikisi de ortak kasadan çıkar"><option value="studio">Stüdyo</option><option value="hane">Hane</option></select>
        <label class="pl-owner-only" style="display:flex;align-items:center;gap:4px;font-size:12.5px;white-space:nowrap;" title="Şimdi ödenmedi: borç doğar, Vadeler listesinde bekler"><input type="checkbox" id="exp-vadeli" onchange="(function(){ const d=document.getElementById('exp-due'); if (d) d.style.display = document.getElementById('exp-vadeli').checked ? '' : 'none'; })()"> vadeli</label>""",
    """        <select id="exp-cp" class="pl-owner-only" style="display:none;" title="(v209: arayüzde yok)"></select>
        <select id="exp-scope" class="pl-owner-only" title="Stüdyo gideri mi, ev gideri mi — ikisi de ortak kasadan çıkar; stüdyonun net kazancı ayrı görünür"><option value="studio">Stüdyo</option><option value="hane">🏠 Ev</option></select>
        <label class="pl-owner-only" style="display:none;" title="(v209: arayüzde yok — düzenli kalemler Hesaplar'da)"><input type="checkbox" id="exp-vadeli" onchange="(function(){ const d=document.getElementById('exp-due'); if (d) d.style.display = document.getElementById('exp-vadeli').checked ? '' : 'none'; })()"> vadeli</label>""")

# ── 5) Raporlar sayfası Finans'ın içine (fin-panel-rapor); ay seçilince kendiliğinden çizilir
_r0 = s.index("""<!-- REPORTS -->
<section class="page" id="page-reports">
""")
_r1 = s.index("""</section>

<!-- SETTINGS -->""", _r0)
_rep_inner = s[_r0 + len("""<!-- REPORTS -->
<section class="page" id="page-reports">
"""):_r1]
assert _rep_inner.count('id="report-content"') == 1 and _rep_inner.count('id="instructor-perf"') == 1
s = s[:_r0] + s[_r1 + len("""</section>

"""):]
_rep_inner = _rep_inner.replace("""      <input type="month" id="rep-month">""", """      <input type="month" id="rep-month" onchange="renderReports()">""")
_rep_inner = _rep_inner.replace("""      <button class="btn" onclick="renderReports()">Göster</button>
""", "")
assert 'Göster' not in _rep_inner
rep("""  <div class="fin-panel" id="fin-panel-accounts"><div class="card"><h2>🏦 Hesaplar</h2><div class="fin-note">Kasa ve Banka sabittir; kart hesaplarını (her ortağın her kartı ayrı) buradan eklersin. Bakiye hiçbir yerde saklanmaz: açılış bakiyesi + açılış tarihinden sonraki hareketler.</div><div id="fin-accounts-body"></div></div></div>
</section>""", """  <div class="fin-panel" id="fin-panel-rapor"><!-- v209: Raporlar Finans'ın içinde -->
""" + _rep_inner + """  </div>
  <div class="fin-panel" id="fin-panel-accounts"><div class="card"><h2>⚙️ Hesaplar ve düzenli ödemeler</h2><div class="fin-note">Kasan, bankaların ve kartların; her ay tekrar eden ödemeler ve gelirler. Bakiye: açılış bakiyesi + sonraki giriş–çıkışlar (kendiliğinden hesaplanır).</div><div id="fin-accounts-body"></div></div></div>
</section>""")

# ── 6) switchPage('reports') → Finans › Raporlar
rep("""function switchPage(page) {
  try { renderUndoBtn(); } catch(e) {} // v165""", """function switchPage(page) {
  if (page === 'reports') { page = 'payments'; try { __finTab196 = 'rapor'; localStorage.setItem('pilateria_fin_tab', 'rapor'); } catch(e) {} } // v209: Raporlar Finans'ın içinde
  try { renderUndoBtn(); } catch(e) {} // v165""")

# ── 7) Sade adlar
rep("""var FIN_MOVE_OPS196 = { transfer:'Virman', cardpay:'Kart borcu ödemesi', income:'Gelir (maaş / iade / diğer)', draw:'Ortak çekimi', capital:'Sermaye', reconcile:'Mutabakat' }; // v200: income""",
    """var FIN_MOVE_OPS196 = { transfer:'Hesaplar arası aktarma', cardpay:'Kredi kartı borcu ödeme', income:'Gelir (maaş vb.)', draw:'Kişisel çekim', capital:'Hesaba para koyma', reconcile:'Bakiye düzeltme' }; // v200: income · v209 (Kerem "muhasebeci değilim"): sade adlar""")
rep("""  const typeLbl = { tahsilat: '💳 Üye tahsilatı', iade: '↩️ İade', gider: '💸 Gider', hoca: '🧑‍🏫 Hoca ödemesi', virman: '🔁 Virman', cekim: '👤 Ortak çekimi', sermaye: '🏷️ Sermaye', mutabakat: '🧮 Mutabakat', kart: '💳 Kart borcu ödemesi', gelir: '💰 Gelir' }; // v200""",
    """  const typeLbl = { tahsilat: '💳 Üye ödemesi', iade: '↩️ İade', gider: '💸 Gider', hoca: '🧑‍🏫 Hoca ödemesi', virman: '⇄ Hesaplar arası', cekim: '👤 Kişisel çekim', sermaye: '➕ Hesaba para', mutabakat: '🧮 Bakiye düzeltme', kart: '💳 Kart borcu ödeme', gelir: '💰 Gelir' }; // v200 · v209 sade adlar""")
rep("""  mdl.innerHTML = '<div class="modal" style="max-width:460px;"><h3>🔁 Nakit Hareketi</h3>' +""",
    """  mdl.innerHTML = '<div class="modal" style="max-width:460px;"><h3>⇄ Para aktar / düzelt</h3>' +""")
rep("""    '<div class="field" id="fm-actual-wrap" style="display:none;"><label>Gerçek bakiye (sayım / ekstre) (₺)</label>""",
    """    '<div class="field" id="fm-actual-wrap" style="display:none;"><label>Hesapta şu an gerçekte olan tutar (₺)</label>""")
rep("""    '<div class="field" id="fm-partner-wrap" style="display:none;"><label>Ortak</label>' + (partners.length ? '<select id="fm-partner">' + partners.map(function(p){ return '<option>' + escapeHtml(p) + '</option>'; }).join('') + '</select>' : '<input id="fm-partner" placeholder="Ortak adı (Hesaplar sekmesinde tanımlanabilir)">') + '</div>' +""",
    """    '<div class="field" id="fm-partner-wrap" style="display:none;"><label>Kim</label>' + (partners.length ? '<select id="fm-partner">' + partners.map(function(p){ return '<option>' + escapeHtml(p) + '</option>'; }).join('') + '</select>' : '<input id="fm-partner" placeholder="Ad (isteğe bağlı)">') + '</div>' +""")
rep("""    __undoSnapshot('Mutabakat: ' + (a.name || acc) + ' ' + fmtDate(date));
    finReconcile196(acc, date, +actualRaw, note);
    if (window.plToast) plToast('🧮 Mutabakat: fark ' + (diff > 0 ? '+' : '−') + money(Math.abs(diff)) + ' ₺ kaydedildi');""",
    """    __undoSnapshot('Bakiye düzeltme: ' + (a.name || acc) + ' ' + fmtDate(date));
    finReconcile196(acc, date, +actualRaw, note);
    if (window.plToast) plToast('🧮 Bakiye düzeltildi: fark ' + (diff > 0 ? '+' : '−') + money(Math.abs(diff)) + ' ₺');""")
rep("""push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.accountId, dir: amt > 0 ? 1 : -1, amount: Math.abs(amt), type: 'mutabakat', who: 'Mutabakat düzeltmesi', note: nt || ('sayım ' + money(+mv.actual || 0) + ' / uygulama ' + money(+mv.computed || 0)) }); }""",
    """push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.accountId, dir: amt > 0 ? 1 : -1, amount: Math.abs(amt), type: 'mutabakat', who: 'Bakiye düzeltme', note: nt || ('gerçek ' + money(+mv.actual || 0) + ' / uygulama ' + money(+mv.computed || 0)) }); }""")
rep("""push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.fromAccountId || mv.accountId, dir: -1, amount: Math.abs(amt), type: 'cekim', who: 'Ortak çekimi' + (mv.partner ? ' · ' + mv.partner : ''), note: nt }); }""",
    """push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.fromAccountId || mv.accountId, dir: -1, amount: Math.abs(amt), type: 'cekim', who: 'Kişisel çekim' + (mv.partner ? ' · ' + mv.partner : ''), note: nt }); }""")
rep("""push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.toAccountId || mv.accountId, dir: 1, amount: Math.abs(amt), type: 'sermaye', who: 'Sermaye' + (mv.partner ? ' · ' + mv.partner : ''), note: nt }); }""",
    """push({ id: 'mv:' + mv.id, src: 'move', srcId: mv.id, date: d, accountId: mv.toAccountId || mv.accountId, dir: 1, amount: Math.abs(amt), type: 'sermaye', who: 'Hesaba para koyma' + (mv.partner ? ' · ' + mv.partner : ''), note: nt }); }""")

# ── 8) Sekme mantığı: 'rapor' sekmesi, eski sekmeler bir kez taşınır, personel izni (ödemeler / raporlar)
rep("""let __finTab196 = (function(){ try { let t = localStorage.getItem('pilateria_fin_tab') || ''; if (!localStorage.getItem('pilateria_fin_ozet208')) { localStorage.setItem('pilateria_fin_ozet208', '1'); if (t === 'cash') { t = 'ozet'; localStorage.setItem('pilateria_fin_tab', t); } } return t; } catch(e) { return ''; } })();""",
    """let __finTab196 = (function(){ try { let t = localStorage.getItem('pilateria_fin_tab') || ''; if (!localStorage.getItem('pilateria_fin_ozet208')) { localStorage.setItem('pilateria_fin_ozet208', '1'); if (t === 'cash') { t = 'ozet'; localStorage.setItem('pilateria_fin_tab', t); } } if (!localStorage.getItem('pilateria_fin_v209')) { localStorage.setItem('pilateria_fin_v209', '1'); const m209 = { cash: 'ozet', dues: 'ozet', cari: 'ozet', reports: 'rapor' }; if (m209[t]) { t = m209[t]; localStorage.setItem('pilateria_fin_tab', t); } } return t; } catch(e) { return ''; } })(); // v209: arayüzden kalkan sekmeler bir kez Özet'e (Tablolar → Raporlar)""")
rep("""function finSwitchTab196(tab) {
  const staff = !!(typeof SUPABASE_MODE !== 'undefined' && SUPABASE_MODE && typeof __sbRole !== 'undefined' && __sbRole === 'staff');
  if (staff) tab = 'moves';""", """function finStaffTabs209() { try { const pp = getStaffPerms(); const a = []; if (pp.payments) a.push('moves'); if (pp.reports) a.push('rapor'); return a.length ? a : ['moves']; } catch(e) { return ['moves']; } } // v209: personel yalnız izinli sekmeler
function finSwitchTab196(tab) {
  const staff = !!(typeof SUPABASE_MODE !== 'undefined' && SUPABASE_MODE && typeof __sbRole !== 'undefined' && __sbRole === 'staff');
  if (staff) { const al = finStaffTabs209(); if (al.indexOf(tab) === -1) tab = al[0]; }""")
rep("""  if (staff && __finTab196 !== 'moves') { __finTab196 = 'moves'; }""",
    """  if (staff) { const al = finStaffTabs209(); if (al.indexOf(__finTab196) === -1) __finTab196 = al[0]; } // v209
  if (!staff) { try { if (finAutoPayDues209()) save(); } catch(e) {} } // v209: vadesi gelen banka/kasa düzenli kalemleri""")
rep("""  const fn = { ozet: (typeof renderFinOzet208 === 'function' ? renderFinOzet208 : null), moves: renderFinMoves196, accounts: renderFinAccounts196,""",
    """  const fn = { ozet: (typeof renderFinOzet208 === 'function' ? renderFinOzet208 : null), rapor: (typeof renderReports === 'function' ? renderReports : null), moves: renderFinMoves196, accounts: renderFinAccounts196,""")
# personel arayüzü: Finans sekmesi ödemeler YA DA raporlar izniyle görünür; iç sekmeler izne göre
rep("""  const more = document.getElementById('more-sheet-bg');
  if (more) more.querySelectorAll('button').forEach(b => {""", """  if (perms.reports && !perms.payments) document.querySelectorAll('[data-page="payments"], [data-bnav="payments"]').forEach(el => { el.style.display = ''; }); // v209: Raporlar Finans'ın içinde
  document.querySelectorAll('#fin-tabs [data-fin="moves"]').forEach(b => { b.style.display = perms.payments ? '' : 'none'; });
  document.querySelectorAll('#fin-tabs [data-fin="rapor"]').forEach(b => { b.style.display = perms.reports ? '' : 'none'; });
  const more = document.getElementById('more-sheet-bg');
  if (more) more.querySelectorAll('button').forEach(b => {""")

# ── 9) Panel açılınca da otomatik ödeme (yalnız hazırsa)
rep("""function renderDashboard() {
  try { renderNextWeekMissing(); } catch(e){}""", """function renderDashboard() {
  try { if (typeof finAutoPayDues209 === 'function' && finAutoPayDues209()) save(); } catch(e){} // v209
  try { renderNextWeekMissing(); } catch(e){}""")
# bulut çekimi tamam → otomatik ödeme serbest
rep("""  sbSubscribeAll();
  setCloudDot && setCloudDot('ok');
  try { __sbVerifyCounts192('açılış'); } catch(e) {} // v192""", """  sbSubscribeAll();
  setCloudDot && setCloudDot('ok');
  window.__sbPulledOk209 = true; // v209: bu oturumda buluttan tam çekim yapıldı → otomatik ödeme bayat veriyle çalışmaz
  try { if (__sbRole === 'owner') setTimeout(function(){ try { if (finAutoPayDues209()) { save(); __refreshUIInPlace(); } } catch(e) {} }, 4500); } catch(e) {} // v209
  try { __sbVerifyCounts192('açılış'); } catch(e) {} // v192""")

# ── 10) Otomatik kayıt silinirse kalem bir daha otomatik ödenmez
rep("""  if (e.dueId) { const __d = (state.finDues||[]).find(x => x && x.id === e.dueId); if (__d && __d.paidRef && __d.paidRef.id === e.id) { __d.status = 'open'; delete __d.paidRef; delete __d.paidDate; delete __d.paidAmount; } } // v196 ADIM 2: bağlı vade kalemi yeniden açılır""",
    """  if (e.dueId) { const __d = (state.finDues||[]).find(x => x && x.id === e.dueId); if (__d && __d.paidRef && __d.paidRef.id === e.id) { __d.status = 'open'; delete __d.paidRef; delete __d.paidDate; delete __d.paidAmount; if (__d.templateId) __d.noAuto = true; } } // v196 ADIM 2: bağlı vade kalemi yeniden açılır · v209: silinen ödeme kendiliğinden geri gelmez (düzenli kalem bir daha otomatik ödenmez; "✓ Ödendi" ile elle)""")
rep("""  (state.finDues || []).forEach(function(d){ if (d && d.paidRef && d.paidRef.type === 'move' && d.paidRef.id === id) { d.status = 'open'; delete d.paidRef; delete d.paidDate; delete d.paidAmount; } }); // v196 adım 4""",
    """  (state.finDues || []).forEach(function(d){ if (d && d.paidRef && d.paidRef.type === 'move' && d.paidRef.id === id) { d.status = 'open'; delete d.paidRef; delete d.paidDate; delete d.paidAmount; if (d.templateId) d.noAuto = true; } }); // v196 adım 4 · v209: silinen gelir kendiliğinden geri gelmez""")

# ── 11) Şablon penceresi: cari alanı gizli, hesap adı sade, otomatik kutusu; yeni şablona otomatik başlangıç günü
rep("""    '<div class="field"><label>Cari</label>' + cpSel(tp ? tp.counterpartyId : '') + '</div>' +
    '<div class="field"><label>Varsayılan hesap</label>' + accSel(tp ? tp.accountId : FIN_ACC_BANK) + '</div>' +""",
    """    '<div class="field" style="display:none;"><label>Cari</label>' + cpSel(tp ? tp.counterpartyId : '') + '</div>' +
    '<div class="field"><label>Hangi hesaptan ödenir (gelirse: hangi hesaba girer)</label>' + accSel(tp ? tp.accountId : FIN_ACC_BANK) + '</div>' +
    '<label style="display:flex;align-items:center;gap:6px;font-size:13px;margin:4px 0 8px;" title="Banka/kasa hesabında: vade günü gelince kendiliğinden ödendi (gelirse: alındı) yazılır. Kartla ödenenler kart ekstresi yüklenince kendiliğinden kapanır."><input type="checkbox" id="ft-auto"' + (!tp || tp.auto !== false ? ' checked' : '') + '> 🤖 Vade gününde kendiliğinden ödendi say (banka/kasa)</label>' +""")
rep("""  rec.resmi = !!((document.getElementById('ft-resmi') || {}).checked); rec.kdvRate = rec.resmi ? (+((document.getElementById('ft-kdv') || {}).value) || 0) : 0;
  const ac = document.getElementById('ft-active'); if (ac) rec.active = !!ac.checked;""",
    """  rec.resmi = !!((document.getElementById('ft-resmi') || {}).checked); rec.kdvRate = rec.resmi ? (+((document.getElementById('ft-kdv') || {}).value) || 0) : 0;
  const ac = document.getElementById('ft-active'); if (ac) rec.active = !!ac.checked;
  { const au = document.getElementById('ft-auto'); if (au) rec.auto = !!au.checked; if (!tp && rec.auto !== false) rec.autoFrom = todayISO(); } // v209: yeni şablon geçmişe dönük otomatik ödenmez
  try { (state.finDues || []).forEach(function(d){ if (d && d.templateId === rec.id && d.status === 'open') d.accountId = rec.accountId || ''; }); } catch(e) {} // v209: açık kalemler şablonun hesabını izler""")
rep("""    '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Yön</label><select id="ft-flow"><option value="out"' + (!tp || tp.flow !== 'in' ? ' selected' : '') + '>Ödeme (gider)</option><option value="in"' + (tp && tp.flow === 'in' ? ' selected' : '') + '>Tahsilat (gelir: maaş vb.)</option></select></div><div class="field" style="flex:1"><label>Kapsam</label><select id="ft-scope"><option value="studio"' + (!tp || tp.scope !== 'hane' ? ' selected' : '') + '>Stüdyo</option><option value="hane"' + (tp && tp.scope === 'hane' ? ' selected' : '') + '>Hane (ev/aile)</option></select></div></div>' +""",
    """    '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>Ödeme mi, gelir mi</label><select id="ft-flow"><option value="out"' + (!tp || tp.flow !== 'in' ? ' selected' : '') + '>Ödeme (gider)</option><option value="in"' + (tp && tp.flow === 'in' ? ' selected' : '') + '>Gelir (maaş vb.)</option></select></div><div class="field" style="flex:1"><label>Stüdyo mu, ev mi</label><select id="ft-scope"><option value="studio"' + (!tp || tp.scope !== 'hane' ? ' selected' : '') + '>Stüdyo</option><option value="hane"' + (tp && tp.scope === 'hane' ? ' selected' : '') + '>🏠 Ev</option></select></div></div>' +""")
rep("""  mdl.innerHTML = '<div class="modal" style="max-width:480px;"><h3>' + (tp ? '🔁 ' + escapeHtml(tp.title) : '🔁 Yeni tekrar eden kalem') + '</h3><div class="fin-note">Her ay vade listesine kendiliğinden düşer; o ayın tutarını kalemde değiştirebilirsin.</div>' +""",
    """  mdl.innerHTML = '<div class="modal" style="max-width:480px;"><h3>' + (tp ? '🔁 ' + escapeHtml(tp.title) : '🔁 Yeni düzenli ödeme / gelir') + '</h3><div class="fin-note">Her ay kendiliğinden listeye düşer (Özet › Düzenli gelir & gider).</div>' +""")

# ── 12) Özet: kart son ödemeleri, satır düğmeleri, 30 gün tahmini; Raporlar'a ayrıntılı tablo
rep("""  if (M.missing.length) h += '<div class="fin-warn">⚠️ ' + M.missing.map(function(a){ return escapeHtml(a.label); }).join(', ') + ' için açılış bakiyesi girilmedi — toplamda yok. <a href="#" onclick="finSwitchTab196(\\'accounts\\'); return false;">🏦 Hesaplar\\'da gir →</a></div>';
  return h;
}""", """  if (M.missing.length) h += '<div class="fin-warn">⚠️ ' + M.missing.map(function(a){ return escapeHtml(a.label); }).join(', ') + ' için açılış bakiyesi girilmedi — toplamda yok. <a href="#" onclick="finSwitchTab196(\\'accounts\\'); return false;">⚙️ Hesaplar\\'da gir →</a></div>';
  try { h += finCardDuesHtml209() + finForecastHtml209(); } catch(e) {} // v209
  return h;
}""")
rep("""  const cand = x.cand ? '<span class="cand">↔ olası ödeme: '""", """  const act = __finRegActHtml209(x);
  const cand = x.cand ? '<span class="cand">↔ olası ödeme: '""")
rep("""'</span><span class="a">' + money(x.amount) + ' ₺</span>' + cand + '</div>';""",
    """'</span><span class="a">' + money(x.amount) + ' ₺</span>' + cand + act + '</div>';""")
rep("""  const ico = x.status === 'paid' ? '✓' : (x.status === 'overdue' ? '⚠️' : (x.status === 'skipped' ? '—' : '⏳'));
  const cls = x.status === 'paid' ? 'ok' : (x.status === 'overdue' ? 'bad' : (x.status === 'skipped' ? '' : 'wait'));""",
    """  const ico = x.status === 'paid' ? '✓' : (x.status === 'overdue' ? '⚠️' : (x.status === 'skipped' ? '—' : (x.status === 'card' ? '💳' : '⏳')));
  const cls = x.status === 'paid' ? 'ok' : (x.status === 'overdue' ? 'bad' : (x.status === 'skipped' ? '' : 'wait'));""")
rep("""  if (x.status === 'skipped') sub.push('atlandı');""", """  if (x.status === 'skipped') sub.push('atlandı');
  if (x.status === 'card') sub.push('kartla — ekstre yüklenince kapanır');
  if (x.status === 'paid' && x.auto) sub.push('🤖 otomatik');""")
rep("""    const st = d.status === 'paid' ? 'paid' : (d.status === 'skipped' ? 'skipped' : (String(d.dueDate || '') < today ? 'overdue' : 'open'));
    let amount = +d.amount || 0, paidDate = '', accountId = d.accountId || '';""", """    const __acc209 = finAccount196(d.accountId || '');
    let st = d.status === 'paid' ? 'paid' : (d.status === 'skipped' ? 'skipped' : (String(d.dueDate || '') < today ? 'overdue' : 'open'));
    if ((st === 'open' || st === 'overdue') && __acc209 && __acc209.type === 'card' && d.dtype !== 'income') st = 'card'; // v209: kartla ödenen ekstreyle kapanır
    let amount = +d.amount || 0, paidDate = '', accountId = d.accountId || '', __auto209 = false;""")
rep("""      if (e) { amount = +e.amount || 0; paidDate = __finExpDate208(e); accountId = e.accountId || ''; }
      else if (mv) { amount = +mv.amount || 0; paidDate = String(mv.date || '').slice(0, 10); accountId = mv.toAccountId || mv.fromAccountId || mv.accountId || ''; }""",
    """      if (e) { amount = +e.amount || 0; paidDate = __finExpDate208(e); accountId = e.accountId || ''; __auto209 = e.source === 'auto'; }
      else if (mv) { amount = +mv.amount || 0; paidDate = String(mv.date || '').slice(0, 10); accountId = mv.toAccountId || mv.fromAccountId || mv.accountId || ''; __auto209 = !!mv.auto; }""")
rep("""amount: r2(amount), dueDate: d.dueDate || '', paidDate: paidDate, status: st, accountId: accountId, other: d.period !== ay, inMonth: st === 'paid' && inM(paidDate) };
    if (st === 'open' || st === 'overdue') { const c = finDueCandidate208(d);""",
    """amount: r2(amount), dueDate: d.dueDate || '', paidDate: paidDate, status: st, accountId: accountId, other: d.period !== ay, inMonth: st === 'paid' && inM(paidDate), auto: __auto209, dtype: d.dtype || '' };
    if (st === 'open' || st === 'overdue' || st === 'card') { const c = finDueCandidate208(d);""")
rep("""  const tot = function(arr){ let paid = 0, open = 0; arr.forEach(function(x){ if (x.status === 'paid') { if (x.inMonth) paid += x.amount; } else if (x.status === 'open' || x.status === 'overdue') open += x.amount; }); return { paid: r2(paid), open: r2(open) }; };""",
    """  const tot = function(arr){ let paid = 0, open = 0; arr.forEach(function(x){ if (x.status === 'paid') { if (x.inMonth) paid += x.amount; } else if (x.status === 'open' || x.status === 'overdue' || x.status === 'card') open += x.amount; }); return { paid: r2(paid), open: r2(open) }; };""")
rep("""Karttan ödenen vergi ve faturalar ekstre yüklenince buraya kendiliğinden düşer. <a href="#" onclick="finSwitchTab196(\\'dues\\'); return false;">Şablonlar →</a></div>';""",
    """Bankadan ödenenler vade gününde kendiliğinden ödendi sayılır; karttan ödenen vergi ve faturalar ekstre yüklenince düşer. <a href="#" onclick="finSwitchTab196(\\'accounts\\'); return false;">Düzenli ödemeleri düzenle →</a></div>';""")
rep("""  return '<div class="fin-sec">📈 Son ' + months.length + ' ay <small class="fin-note">para esası · ₺ · ayrıntı: ⋯ Diğer › Tablolar</small></div>""",
    """  return '<div class="fin-sec">📈 Son ' + months.length + ' ay <small class="fin-note">para esası · ₺ · ayrıntı: 📈 Raporlar</small></div>""")
rep("""<button class="btn small secondary" onclick="finSwitchTab196(\\'dues\\')">⏰ Düzenli kalemler</button></div>';""",
    """<button class="btn small secondary" onclick="finSwitchTab196(\\'accounts\\')">⚙️ Düzenli ödemeler</button></div>';""")
rep("""      (opt.link ? '<button class="btn small secondary no-print" onclick="switchPage(\\'payments\\'); finSwitchTab196(\\'ozet\\'); finOzetSet208(\\'' + S.ay + '\\')">Finans › Özet →</button>' : '')) + '</div>';""",
    """      (opt.link ? '<button class="btn small secondary no-print" onclick="switchPage(\\'payments\\'); finSwitchTab196(\\'ozet\\'); finOzetSet208(\\'' + S.ay + '\\')">📊 Özet →</button>' : '')) + '</div>';""")
# v208 "⋯ Diğer" aç/kapa artık yok
rep("""function finToggleMore208() { const t = document.getElementById('fin-tabs'); if (!t) return; const on = !t.classList.contains('more'); t.classList.toggle('more', on); const b = t.querySelector('.fin-more-btn'); if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false'); }
""", "")
# Raporlar: yöntem tablosundan sonra ayrıntılı tablo (kapalı) + CSV
rep("""        <tr style="font-weight:700;"><td><b>TOPLAM</b></td><td><b>${payments.length}</b></td><td><b>${money(ibanGross+cashGross+cardGross+otherGross)} ₺</b></td></tr>
      </tbody>
    </table></div>
  `;
}""", """        <tr style="font-weight:700;"><td><b>TOPLAM</b></td><td><b>${payments.length}</b></td><td><b>${money(ibanGross+cashGross+cardGross+otherGross)} ₺</b></td></tr>
      </tbody>
    </table></div>
  ` + finDetailTableHtml209(m); // v209: eski "Tablolar" sekmesi yerine
}""")

# ── 13) Hesaplar sekmesi: hesaplarım · düzenli ödemeler ve gelirler · kur · diğer ayarlar (kapalı)
rep("""  el.innerHTML = rows + '<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap;"><button class="btn small" onclick="openFinAccountModal196(\\'\\')">+ Kart hesabı ekle</button></div>' +
    '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);"><b>Ortaklar</b> <span class="fin-note">(çekim/sermaye kayıtlarında ve kart sahipliğinde kullanılır)</span>' +""",
    """  el.innerHTML = '<div class="fin-sec" style="border-top:none;margin-top:0;">🏦 Hesaplarım</div>' + rows + '<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap;"><button class="btn small" onclick="openFinAccountModal196(\\'\\')">+ Hesap / kart ekle</button></div>' +
    finTemplatesHtml209() + finFxSettingsHtml209() +
    '<details style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);"><summary style="cursor:pointer;font-weight:700;">Diğer ayarlar</summary><div style="margin-top:8px;"><b>Kişiler</b> <span class="fin-note">(kart sahipliği ve kişisel çekim kayıtlarında)</span>' +""")
rep("""    '<div class="row" style="gap:8px;flex-wrap:wrap;margin:6px 0;"><input type="number" id="fin-safety" style="width:160px;" min="0" step="100" value="' + (+fs.safetyMin || 0) + '"><span class="fin-note">₺</span><button class="btn small secondary" onclick="saveFinSettings196()">Kaydet</button></div></div>';
}""", """    '<div class="row" style="gap:8px;flex-wrap:wrap;margin:6px 0;"><input type="number" id="fin-safety" style="width:160px;" min="0" step="100" value="' + (+fs.safetyMin || 0) + '"><span class="fin-note">₺</span><button class="btn small secondary" onclick="saveFinSettings196()">Kaydet</button></div></div></details>';
}""")
rep("""    '<b>Finans başlangıç ayı</b> <span class="fin-note">(bu aydan önceki aylar hesaba girmez: üye borcu — Panel "Geciken Ödemeler" dahil —, hoca hakedişi, vade kalemleri, ekstre ve rapor sütunları; boş = sınır yok. Hesap bakiyeleri hesabın açılış tarihine bağlıdır, etkilenmez.)</span>' +""",
    """    '<b>Hesaplamaya başlangıç ayı</b> <span class="fin-note">(bu aydan önceki aylar hesaba girmez: üye borcu, hoca hakedişi, düzenli kalemler, raporlar; boş = sınır yok)</span>' +""")
rep("""    '<b>Güvenlik payı</b> <span class="fin-note">(nakit akışı projeksiyonunda bu tutarın altına düşen gün uyarılır)</span>' +""",
    """    '<b>Alt sınır uyarısı</b> <span class="fin-note">(30 günlük tahminde paranın bu tutarın altına düştüğü gün Özet\\'te uyarılır)</span>' +""")

# ── 14) v209 çekirdeği: otomatik ödeme, ödendi düzeltme, kart son ödemeleri, tahmin, şablon listesi, kur, ayrıntılı tablo
CORE = r"""// ═══════════════════════ v209 SADE FİNANS — OTOMATİK DÜZENLİ ÖDEME (Kerem 20.10) ═══════════════════════
// Banka/kasa hesaplı düzenli kalem vade günü gelince kendiliğinden ödendi (gelirse alındı) yazılır; kart hesaplı kalem ekstreyle kapanır.
// Güvenceler: yalnız sahip; bulut açıksa yalnız bu oturumda buluttan tam çekimden SONRA (bayat yerel veriyle asla); şablon pasif ya da
// "otomatik değil" ise yok; kalem 20.10.2026'dan (ya da yeni şablonun eklendiği günden) önceyse yok; otomatik kayıt silindiyse (noAuto) yok;
// olası ödeme (aynı tutar, ±10 gün, bağsız gider) varsa yeni gider YAZILMAZ, ona bağlanır; kimlik 'ap-' + kalem (iki cihaz aynı kaydı yazar).
var FIN_AUTO_FROM209 = '2026-10-20';
function __finAutoReady209() {
  try {
    if (!window.__sbPulledOk209) return false; // bu oturumda buluttan tam çekim yapılmadan (bayat yerel veriyle) ASLA
    if (typeof sbClient !== 'undefined' && sbClient && typeof __sbRole !== 'undefined' && __sbRole !== 'owner') return false; // yalnız sahip
    return finCloudReady196();
  } catch(e) { return false; }
}
function finTplMode209(tp) { if (!tp) return 'manual'; const a = finAccount196(tp.accountId || ''); if (a && a.type === 'card') return 'card'; if (!a || tp.auto === false) return 'manual'; return 'auto'; }
function finAutoPayDues209() {
  if (!__finAutoReady209()) return 0;
  const today = todayISO(); let n = 0;
  const tpls = {}; (state.finTemplates || []).forEach(function(t){ if (t && t.id) tpls[t.id] = t; });
  (state.finDues || []).slice().forEach(function(d){
    if (!d || d.status !== 'open' || !d.templateId || d.noAuto || (d.dtype !== 'expense' && d.dtype !== 'income')) return;
    const due = String(d.dueDate || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || due > today) return;
    const tp = tpls[d.templateId]; if (!tp || tp.active === false || finTplMode209(tp) !== 'auto') return;
    if (due < (tp.autoFrom && tp.autoFrom > FIN_AUTO_FROM209 ? tp.autoFrom : FIN_AUTO_FROM209)) return;
    const acc = finAccount196(tp.accountId); if (!acc || acc.type === 'card') return;
    const amt = finR2_196(d.amount); if (!(amt > 0)) return;
    const id = 'ap-' + d.id;
    if (d.dtype === 'income') {
      let mv = (state.finMoves || []).find(function(x){ return x && x.id === id; });
      if (!mv) { mv = { id: id, kind: 'move', op: 'income', date: due, amount: amt, toAccountId: acc.id, scope: d.scope === 'hane' ? 'hane' : 'studio', title: d.title || 'Gelir', note: 'otomatik (düzenli gelir)', dueId: d.id, auto: true, at: new Date().toISOString() }; state.finMoves = state.finMoves || []; state.finMoves.push(mv); }
      d.status = 'paid'; d.paidRef = { type: 'move', id: mv.id }; d.paidDate = mv.date; d.paidAmount = finR2_196(mv.amount); n++;
      return;
    }
    const c = (typeof finDueCandidate208 === 'function') ? finDueCandidate208(d) : null;
    let e = c || (state.expenses || []).find(function(x){ return x && x.id === id; });
    if (!e) { e = { id: id, date: due, paidDate: due, category: d.category || 'Diğer', amount: amt, note: (d.title || 'Düzenli ödeme') + ' (otomatik)', resmi: !!d.resmi, kdvRate: d.resmi ? (+d.kdvRate || 0) : 0, accountId: acc.id, counterpartyId: d.counterpartyId || '', scope: d.scope === 'hane' ? 'hane' : 'studio', dueId: d.id, source: 'auto' }; state.expenses = state.expenses || []; state.expenses.push(e); }
    else e.dueId = d.id;
    d.status = 'paid'; d.paidRef = { type: 'expense', id: e.id }; d.paidDate = __finExpDate208(e); d.paidAmount = finR2_196(e.amount); n++;
  });
  return n;
}
// ✎ Ödenen düzenli kalemi düzelt (tutar / gün / hesap) ya da "ödenmedi" — yeni kayıt YAZILMAZ, bağlı kayıt güncellenir
function openFinEditPaid209(dueId) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === dueId; }); if (!d || d.status !== 'paid' || !d.paidRef) return;
  const isMv = d.paidRef.type === 'move'; const rec = isMv ? (state.finMoves || []).find(function(x){ return x && x.id === d.paidRef.id; }) : (state.expenses || []).find(function(x){ return x && x.id === d.paidRef.id; });
  if (!rec) { alert('Bu kalemin ödeme kaydı bulunamadı.'); return; }
  const old = document.getElementById('modal-fin-edp'); if (old) old.remove();
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-edp'; mdl.className = 'modal-bg open';
  const accNow = isMv ? (rec.toAccountId || '') : (rec.accountId || '');
  mdl.innerHTML = '<div class="modal" style="max-width:420px;"><h3>✎ ' + escapeHtml(d.title || '') + '</h3><div class="fin-note">' + escapeHtml(pkgMonthLabel(d.period || String(d.dueDate || '').slice(0, 7))) + ' · ' + (isMv ? 'gelir' : 'ödeme') + (rec.source === 'auto' || rec.auto ? ' · 🤖 otomatik yazıldı' : '') + '</div>' +
    '<div class="field"><label>Tutar (₺)</label><input type="number" id="edp-amount" step="0.01" min="0" value="' + finR2_196(rec.amount) + '"></div>' +
    '<div class="field"><label>' + (isMv ? 'Alındığı gün' : 'Ödendiği gün') + '</label><input type="date" id="edp-date" value="' + escapeHtml(String((isMv ? rec.date : (rec.paidDate || rec.date)) || '').slice(0, 10)) + '"></div>' +
    '<div class="field"><label>Hesap</label><select id="edp-acc"></select></div>' +
    '<div class="row" style="justify-content:flex-end;gap:8px;flex-wrap:wrap;"><button class="btn danger" style="margin-right:auto;" onclick="finUnpayDue209(\'' + d.id + '\')" title="Ödeme kaydı silinir, kalem yeniden açılır (bir daha otomatik ödenmez)">Ödenmedi</button><button class="btn secondary" onclick="document.getElementById(\'modal-fin-edp\').remove()">Vazgeç</button><button class="btn" onclick="saveFinEditPaid209(\'' + d.id + '\')">Kaydet</button></div></div>';
  document.body.appendChild(mdl);
  finFillAccountSelect196(document.getElementById('edp-acc'), '', accNow);
}
function saveFinEditPaid209(dueId, vals) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === dueId; }); if (!d || d.status !== 'paid' || !d.paidRef) return false;
  const isMv = d.paidRef.type === 'move'; const rec = isMv ? (state.finMoves || []).find(function(x){ return x && x.id === d.paidRef.id; }) : (state.expenses || []).find(function(x){ return x && x.id === d.paidRef.id; });
  if (!rec) return false;
  const v = vals || { amount: (document.getElementById('edp-amount') || {}).value, date: (document.getElementById('edp-date') || {}).value, accountId: (document.getElementById('edp-acc') || {}).value };
  const amt = finR2_196(v.amount); const date = String(v.date || '').slice(0, 10); const acc = v.accountId || '';
  if (!(amt > 0)) { alert('Tutar 0\'dan büyük olmalı.'); return false; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('Gün seç.'); return false; }
  if (!finAccount196(acc)) { alert('Hesap seç.'); return false; }
  if (!isMv && (finAccount196(acc) || {}).type === 'card' && (finAccount196(rec.accountId) || {}).type !== 'card') { /* bankadan karta taşıma serbest */ }
  __undoSnapshot('Düzenli kalem düzelt: ' + (d.title || ''));
  if (isMv) { rec.amount = amt; rec.date = date; rec.toAccountId = acc; }
  else { rec.amount = amt; rec.date = date; rec.paidDate = date; rec.accountId = acc; }
  d.paidDate = date; d.paidAmount = amt;
  const m = document.getElementById('modal-fin-edp'); if (m) m.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast('✓ ' + (d.title || '') + ' düzeltildi');
  return true;
}
async function finUnpayDue209(dueId, skipConfirm) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === dueId; }); if (!d || d.status !== 'paid' || !d.paidRef) return false;
  if (!skipConfirm) { const ok = await plConfirm('«' + (d.title || '') + '» ödenmedi sayılacak: ödeme kaydı silinir, kalem yeniden açılır (bir daha otomatik ödenmez). Emin misin?', 'Evet, ödenmedi'); if (!ok) return false; }
  __undoSnapshot('Ödenmedi: ' + (d.title || ''));
  const ref = d.paidRef;
  if (ref.type === 'move') state.finMoves = (state.finMoves || []).filter(function(x){ return !(x && x.id === ref.id); });
  else state.expenses = (state.expenses || []).filter(function(x){ return !(x && x.id === ref.id); });
  d.status = 'open'; delete d.paidRef; delete d.paidDate; delete d.paidAmount; d.noAuto = true;
  const m = document.getElementById('modal-fin-edp'); if (m) m.remove();
  save(); try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast('↩️ ' + (d.title || '') + ' yeniden açık');
  return true;
}
// Özet satır düğmeleri
function __finRegActHtml209(x) {
  if (!x) return '';
  const b = function(lbl, js, title){ return '<button class="btn small secondary" onclick="' + js + '"' + (title ? ' title="' + escapeHtml(title) + '"' : '') + '>' + lbl + '</button>'; };
  let h = '';
  if (x.kind === 'tpl') {
    if (x.status === 'paid') h = b('✎', "openFinEditPaid209('" + x.id + "')", 'Tutar / gün / hesap düzelt ya da ödenmedi');
    else if (x.status === 'open' || x.status === 'overdue' || x.status === 'card') h = (x.cand ? '' : b(x.dtype === 'income' ? '✓ Alındı' : '✓ Ödendi', "finPayDueModal196('" + x.id + "')", x.dtype === 'income' ? 'Alındı — hesap ve gün sorulur' : 'Ödendi — hesap ve gün sorulur'));
  } else if (x.kind === 'hoca' && x.status !== 'paid') h = b('Hocalar →', "switchPage('instructors')", 'Hoca ödemeleri Hocalar sayfasından yapılır');
  else if (x.kind === 'uye-open') h = b('Kim? →', "switchPage('dashboard')", 'Geciken ödemeler Panel\'de');
  return h ? '<span class="cand fo-act">' + h + '</span>' : '';
}
// Kart son ödemeleri (ekstre kalemi + tahmini kart borcu) — "🏦 Öde" bankadan karta (gider yazmaz)
function finCardDuesHtml209() {
  const today = todayISO();
  const st = (state.finDues || []).filter(function(d){ return d && d.dtype === 'card' && d.status === 'open'; }).map(function(d){ return { id: d.id, title: d.title || finAccountLabel196(d.accountId), amount: +d.amount || 0, dueDate: d.dueDate || '', est: false }; });
  let der = []; try { der = finCardReminders196().map(function(x){ return { id: x.id, title: x.title, amount: x.amount, dueDate: x.dueDate, est: true }; }); } catch(e) {}
  const all = st.concat(der).sort(function(a, b){ return String(a.dueDate).localeCompare(String(b.dueDate)); });
  if (!all.length) return '';
  return '<div class="fin-sec">💳 Kart son ödemeleri</div>' + all.map(function(x){ const late = x.dueDate && x.dueDate < today; return '<div class="fo-row' + (late ? ' overdue' : '') + '"><span class="st ' + (late ? 'bad' : 'wait') + '">' + (late ? '⚠️ ' : '⏳ ') + escapeHtml(x.dueDate ? fmtShort(x.dueDate) : '') + '</span><span class="t">' + escapeHtml(x.title) + (x.est ? '<small style="color:var(--muted)"> · tahmini (ekstre yüklenmedi)</small>' : '') + '</span><span class="a">' + money(x.amount) + ' ₺</span><span class="cand fo-act"><button class="btn small secondary" onclick="finPayItem196(\'' + x.id + '\')" title="Bankadan karta ödeme — gider yazmaz">🏦 Öde</button></span></div>'; }).join('');
}
// 30 günlük tahmin (tek satır)
function finForecastHtml209() {
  if (!finActive196()) return '';
  let pr = null; try { pr = finProjection196(30); } catch(e) { pr = null; }
  if (!pr) return '';
  const end = pr.end ? pr.end.a : pr.start;
  let h = '<div class="fin-note" style="margin-top:8px;">📅 30 gün sonra tahmini param (kasa + banka): <b>' + money(end) + ' ₺</b> · beklenen giriş <span class="fin-in">+' + money(pr.totIn) + '</span> · çıkış <span class="fin-out">−' + money(pr.totOut) + '</span></div>';
  if (pr.warnA) h += '<div class="fin-warn">⚠️ <b>' + fmtDate(pr.warnA.d) + '</b> günü param ' + money(pr.warnA.a) + ' ₺\'ye düşüyor' + (pr.safety > 0 ? ' (alt sınır ' + money(pr.safety) + ' ₺)' : '') + '.</div>';
  return h;
}
// Hesaplar › düzenli ödemeler ve gelirler
function finTemplatesHtml209() {
  const tpls = (state.finTemplates || []).filter(Boolean).slice().sort(function(a, b){ return (a.flow === 'in' ? 0 : 1) - (b.flow === 'in' ? 0 : 1) || (+a.dayOfMonth || 0) - (+b.dayOfMonth || 0) || String(a.title).localeCompare(String(b.title), 'tr'); });
  const badge = function(tp){ const m = finTplMode209(tp); if (tp.active === false) return '<span class="badge">pasif</span>'; if (m === 'auto') return '<span class="badge ok" title="Vade günü kendiliğinden ödendi sayılır">🤖 otomatik</span>'; if (m === 'card') return '<span class="badge" title="Kart ekstresi yüklenince kendiliğinden kapanır">💳 ekstreyle</span>'; return '<span class="badge" title="Özet\'te ✓ Ödendi ile işaretlenir">✋ elle</span>'; };
  return '<div class="fin-sec">🔁 Düzenli ödemeler ve gelirler <small class="fin-note">her ay kendiliğinden listeye düşer</small></div>' +
    (tpls.length ? tpls.map(function(tp){ return '<div class="fo-row' + (tp.active === false ? ' est' : '') + '"><span class="st">' + (tp.flow === 'in' ? '📥' : '📤') + ' ayın ' + (+tp.dayOfMonth || 1) + '\'i</span><span class="t"><b>' + escapeHtml(tp.title || '') + '</b> ' + badge(tp) + '<small style="color:var(--muted)"> · ' + escapeHtml(tp.accountId ? finAccountLabel196(tp.accountId) : 'hesap seçilmedi') + (tp.scope === 'hane' ? ' · 🏠 ev' : '') + (tp.endMonth ? ' · bitiş ' + escapeHtml(tp.endMonth) : '') + '</small></span><span class="a">' + money(tp.amount) + ' ₺</span><span class="cand fo-act"><button class="btn small secondary" onclick="openFinTemplateModal196(\'' + tp.id + '\')">✎ Düzenle</button></span></div>'; }).join('') : '<div class="fin-note">Henüz yok — kira, aidat, muhasebe, Bağ-Kur, maaş gibi her ay tekrar edenleri bir kez ekle.</div>') +
    '<div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap;"><button class="btn small" onclick="openFinTemplateModal196(\'\')">+ Yeni düzenli ödeme / gelir</button></div>' +
    '<div class="fin-note">🤖 otomatik: bankadan/kasadan — vade günü kendiliğinden ödendi sayılır (tutar farklıysa Özet\'te ✎ ile düzelt) · 💳 ekstreyle: kartla — ekstre yüklenince kapanır · ✋ elle: Özet\'te ✓ Ödendi.</div>';
}
function finFxSettingsHtml209() {
  const fx = finFx208();
  return '<div class="fin-sec">💱 Döviz kuru <small class="fin-note">toplam paranın ≈ $ / ≈ € karşılığı için</small></div><div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;"><span>' + (fx ? (fx.usd ? '1 $ = ' + money(fx.usd) + ' ₺' : '') + (fx.usd && fx.eur ? ' · ' : '') + (fx.eur ? '1 € = ' + money(fx.eur) + ' ₺' : '') + (fx.date ? ' <small class="fin-note">(' + fmtDate(fx.date) + ')</small>' : '') : '<span class="fin-note">kur girilmedi</span>') + '</span><button class="btn small secondary" onclick="openFinFxModal208()">💱 Kur gir</button></div>';
}
// Raporlar › ayrıntılı gelir–gider tablosu (kategori bazında, para esası) — kapalı gelir
function finDetailTableHtml209(anchorAy) {
  const fs = finStartMonth196(); const months = [];
  for (let i = 5; i >= 0; i--) { const m = finMonthAdd196(String(anchorAy || currentMonth()).slice(0, 7), -i); if (fs && m < fs) continue; months.push(m); }
  if (!months.length) return '';
  const rows = finPlRows208(months); const fm = function(v){ return v === null || v === undefined ? '—' : money(v); };
  return '<details style="margin-top:12px;"><summary style="cursor:pointer;font-weight:700;">📋 Ayrıntılı tablo — kategori kategori, son ' + months.length + ' ay</summary>' +
    '<div class="row" style="gap:8px;margin:8px 0;flex-wrap:wrap;"><button class="btn small secondary no-print" onclick="__finRep196.kind=\'pl\'; __finRep196.months=' + (months.length >= 6 ? 6 : 3) + '; finExportReportCsv196()">⬇️ Tabloyu indir (CSV, muhasebeci için)</button></div>' +
    '<div class="table-wrap"><table class="fin-rep-table"><thead><tr><th></th>' + months.map(function(ay){ return '<th class="n">' + escapeHtml(__shortMonth(ay) + ' ' + ay.slice(2, 4)) + '</th>'; }).join('') + '<th class="n">Toplam</th></tr></thead><tbody>' +
    rows.map(function(r){ const tot = finR2_196(r.vals.reduce(function(a, v){ return a + (v || 0); }, 0)); return '<tr class="' + r.cls + '"><td>' + escapeHtml(r.label) + '</td>' + r.vals.map(function(v){ return '<td class="n"' + (v < 0 ? ' style="color:var(--bad)"' : '') + '>' + fm(v) + '</td>'; }).join('') + '<td class="n">' + fm(tot) + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
}
// Gelir & Gider › "+ Gider": gider formunu açar
function finOpenExpenseForm209() {
  const d = document.getElementById('expenses-card'); if (!d) return;
  d.open = true; try { d.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch(e) {}
  setTimeout(function(){ const a = document.getElementById('exp-amount'); if (a) try { a.focus(); } catch(e) {} }, 120);
}
"""
rep("""// ═══════════════════════ v196 ADIM 4 — KART EKSTRESİ OKUYUCU ═══════════════════════""",
    CORE + """// ═══════════════════════ v196 ADIM 4 — KART EKSTRESİ OKUYUCU ═══════════════════════""")

# ── 15) Küçük sadeleştirmeler: hesap satırında "ortak: —" yok, "ekstre: hane" → "harcamalar: ev"; bakiye şeridinde "Σ nakit" → "Toplam para";
#        yazdırmada Finans sekme kartı gizli
rep("""'<span style="min-width:110px;">' + (a.owner ? '👤 ' + escapeHtml(a.owner) : '<span class="fin-note">ortak: —</span>') + '</span>' +""",
    """'<span style="min-width:110px;">' + (a.owner ? '👤 ' + escapeHtml(a.owner) : '') + '</span>' +""")
rep("""(a.type === 'card' ? '<span class="fin-note">· ekstre: ' + (a.scopeDefault === 'hane' ? 'hane' : 'stüdyo') + (a.employerSkip ? ' · işveren satırları atlanır' : '') + '</span>' : '')""",
    """(a.type === 'card' ? '<span class="fin-note">· harcamalar: ' + (a.scopeDefault === 'hane' ? '🏠 ev' : 'stüdyo') + (a.employerSkip ? ' · işveren harcamaları atlanır' : '') + '</span>' : '')""")
rep("""chips.push('<span class="chip" style="border-style:dashed;">Σ nakit: <b>' + finMoneyS196(cash) + '</b>'""",
    """chips.push('<span class="chip" style="border-style:dashed;">Toplam para: <b>' + finMoneyS196(cash) + '</b>'""")
rep("""    #tabs, .bnav, .bnav-item, .toolbar, .btn, .no-print, #cloud-dot, .modal-bg, nav, #fin-tabs { display:none !important; }""",
    """    #tabs, .bnav, .bnav-item, .toolbar, .btn, .no-print, #cloud-dot, .modal-bg, nav, #fin-tabs, #page-payments > .card:first-child { display:none !important; }""")

# ── 16) Ekstre: otomatik banka kaydı karta taşınır (kart kanıtı otomatik varsayımı yener)
rep("""    if (!best) return null; used[best.id] = 1;
    return best.status === 'open' ? { regDueId: best.id } : { regPaidId: best.id };""",
    """    if (!best) return null; used[best.id] = 1;
    if (best.status === 'open') return { regDueId: best.id };
    const bpe = best.paidRef && best.paidRef.type === 'expense' ? expById[best.paidRef.id] : null;
    return (bpe && bpe.source === 'auto') ? { regMoveId: best.id } : { regPaidId: best.id }; // v209: bankadan OTOMATİK ödendi sayılan kalem kartta çıktı → kayıt karta taşınır""")
rep("""if (g.regDueId) r.regDueId = g.regDueId; if (g.regPaidId) { r.regPaidId = g.regPaidId; r.checked = false; } }); } catch(e) {} // v208: düzenli (şablon) kalem eşleşmesi""",
    """if (g.regDueId) r.regDueId = g.regDueId; if (g.regMoveId) r.regMoveId = g.regMoveId; if (g.regPaidId) { r.regPaidId = g.regPaidId; r.checked = false; } }); } catch(e) {} // v208: düzenli (şablon) kalem eşleşmesi · v209: otomatik kayıt karta taşınır""")
rep("""const a = I.rows.filter(function(r){ return r.regDueId && r.checked && !r.regOff; }).length""",
    """const a = I.rows.filter(function(r){ return (r.regDueId || r.regMoveId) && r.checked && !r.regOff; }).length""")
rep("""function finImportRegBadge208(r, i) {
  if (!r) return '';""", """function finImportRegBadge208(r, i) {
  if (!r) return '';
  if (r.regMoveId) { const d = (state.finDues || []).find(function(x){ return x && x.id === r.regMoveId; }); if (!d) return ''; return ' <label class="fin-note" style="display:inline-flex;gap:4px;align-items:center;margin:0;" title="Bu düzenli kalem bankadan otomatik ödendi sayılmıştı; ekstrede kartla ödendiği görünüyor — otomatik banka kaydı silinir, ödeme bu satıra (karta) bağlanır, çift sayılmaz"><input type="checkbox" ' + (r.regOff ? '' : 'checked') + ' onchange="__finImp196.rows[' + i + '].regOff=!this.checked; finImportRenderPreview196()"> ↔ düzenli: ' + escapeHtml(d.title) + ' — otomatik banka kaydı karta taşınır</label>'; } // v209""")
rep("""  let nExp = 0, nDraw = 0, nCredit = 0, nSkip = 0, nHane = 0; const fps = []; let nReg208 = 0; // v208: kapanan düzenli kalem""",
    """  let nExp = 0, nDraw = 0, nCredit = 0, nSkip = 0, nHane = 0; const fps = []; let nReg208 = 0; // v208: kapanan düzenli kalem
  let nMove209 = 0; // v209: karta taşınan otomatik banka kaydı""")
rep("""    const __reg208 = (r.regDueId && !r.regOff && !r.credit) ? (state.finDues || []).find(function(x){ return x && x.id === r.regDueId && x.status === 'open'; }) : null; // v208: düzenli kalemin ödemesi → vadesi kapanır
    const __sc208 = __reg208 ? (__reg208.scope === 'hane' ? 'hane' : 'studio') : scope;
    const __e208 = { id: uid(), date: dateOk, paidDate: dateOk, category: (__reg208 && __reg208.category) || r.category || 'Diğer', amount: r.credit ? -amt : amt, note: r.desc + (__reg208 ? ' · düzenli: ' + __reg208.title : ''), resmi: __reg208 ? !!__reg208.resmi : false, kdvRate: (__reg208 && __reg208.resmi) ? (+__reg208.kdvRate || 0) : 0, accountId: card.id, counterpartyId: r.counterpartyId || (__reg208 && __reg208.counterpartyId) || '', scope: __sc208, source: 'card-import', fingerprint: r.fp };
    if (__reg208) { __e208.dueId = __reg208.id; __reg208.status = 'paid'; __reg208.paidRef = { type: 'expense', id: __e208.id }; __reg208.paidDate = dateOk; __reg208.paidAmount = amt; nReg208++; }""",
    """    const __reg208 = (r.regDueId && !r.regOff && !r.credit) ? (state.finDues || []).find(function(x){ return x && x.id === r.regDueId && x.status === 'open'; }) : null; // v208: düzenli kalemin ödemesi → vadesi kapanır
    const __mv209 = (!__reg208 && r.regMoveId && !r.regOff && !r.credit) ? (function(){ const dd = (state.finDues || []).find(function(x){ return x && x.id === r.regMoveId && x.status === 'paid' && x.paidRef && x.paidRef.type === 'expense'; }); const pe = dd ? (state.expenses || []).find(function(x){ return x && x.id === dd.paidRef.id && x.source === 'auto'; }) : null; return (dd && pe) ? { d: dd, pe: pe } : null; })() : null; // v209: otomatik banka kaydı → karta
    const __rd209 = __reg208 || (__mv209 ? __mv209.d : null);
    const __sc208 = __rd209 ? (__rd209.scope === 'hane' ? 'hane' : 'studio') : scope;
    const __e208 = { id: uid(), date: dateOk, paidDate: dateOk, category: (__rd209 && __rd209.category) || r.category || 'Diğer', amount: r.credit ? -amt : amt, note: r.desc + (__rd209 ? ' · düzenli: ' + __rd209.title : ''), resmi: __rd209 ? !!__rd209.resmi : false, kdvRate: (__rd209 && __rd209.resmi) ? (+__rd209.kdvRate || 0) : 0, accountId: card.id, counterpartyId: r.counterpartyId || (__rd209 && __rd209.counterpartyId) || '', scope: __sc208, source: 'card-import', fingerprint: r.fp };
    if (__reg208) { __e208.dueId = __reg208.id; __reg208.status = 'paid'; __reg208.paidRef = { type: 'expense', id: __e208.id }; __reg208.paidDate = dateOk; __reg208.paidAmount = amt; nReg208++; }
    else if (__mv209) { state.expenses = state.expenses.filter(function(x){ return !(x && x.id === __mv209.pe.id); }); __e208.dueId = __mv209.d.id; __mv209.d.paidRef = { type: 'expense', id: __e208.id }; __mv209.d.paidDate = dateOk; __mv209.d.paidAmount = amt; nMove209++; }""")
rep("""clamp: clamp201, aligned: nAlign, regular: nReg208, total: total || null,""", """clamp: clamp201, aligned: nAlign, regular: nReg208, moved: nMove209, total: total || null,""")
rep("""(nReg208 ? ', ' + nReg208 + ' düzenli kalem kapandı' : '') + (dueMade ? ' · son ödeme kalemi eklendi' : ''));
  return { expenses: nExp, credits: nCredit, draws: nDraw, skipped: nSkip, hane: nHane, aligned: nAlign, regular: nReg208, due: dueMade };""",
    """(nReg208 ? ', ' + nReg208 + ' düzenli kalem kapandı' : '') + (nMove209 ? ', ' + nMove209 + ' otomatik banka kaydı karta taşındı' : '') + (dueMade ? ' · son ödeme kalemi eklendi' : ''));
  return { expenses: nExp, credits: nCredit, draws: nDraw, skipped: nSkip, hane: nHane, aligned: nAlign, regular: nReg208, moved: nMove209, due: dueMade };""")

io.open(P, 'w', encoding='utf-8').write(s)

W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v208-2026-10-20-131';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v208-2026-10-20-131';", "const CACHE_NAME = 'pilateria-v209-2026-10-20-132';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v209 OK')
