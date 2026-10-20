# -*- coding: utf-8 -*-
# v208 — TEK ÖZET, PARA ESASI (Kerem 20.10): "Raporlar ve finans birbirini sağlamıyor; birleştir: devlette net kaç kâr/zarar, reelde kaç;
# düzenli gider ve gelir toplu; bankada ve nakitte toplam kaç param var ($ ve € olarak da); basitleştir, eksiksiz ve hatasız."
# Ölçülen sebepler: Net Kâr paket ayı, Reel Net ve Resmi ödeme günü esaslı; Reel Net hane giderini düşüp maaşı eklemiyordu; Net Kâr ayın
# hakedişini ödenene kadar düşmüyordu; eski yöntem tablosu her İBAN ödemesinden %15 vergi gösteriyordu.
# Kararlar (AskUserQuestion): para esası HER YERDE · döviz hesabı yok, toplam ≈ $ / ≈ € · kur ELLE · tek ekran Finans › 📊 Özet.
# (1) finSummary208 / finMoney208 / finRegular208 / finCheck208 / finPlRows208 — tek kaynak.
# (2) Finans › 📊 Özet sekmesi (varsayılan): param (≈ $/€), bu ay reel ↔ devlet, ev + toplam, gider dağılımı, para kontrolü, düzenli gelir &
#     gider, son 6 ay; Resmi Defter Özet'e taşındı. Sekmeler: Özet · Hareketler · Düzenli & Vadeler · Hesaplar · ⋯ Diğer (Nakit Akışı, Cari, Tablolar).
# (3) Panel: "<Ay> Tahsilatı" + "Net Kâr — stüdyo" (para esası). Raporlar: Aylık Rapor ödeme gününe göre; "Para Özeti" = Özet bloğu + 12 ay
#     grafiği + yöntem tablosu (vergi sütunları kalktı). Tablolar › Gelir–Gider para esası (finPlRows208).
# (4) Ekstre içe alımı: açık düzenli (şablon) vadesiyle eşleşen satır vadeyi kapatır; başka hesaptan "ödendi" görünen düzenli kalemle eşleşen
#     satır "zaten ödendi" uyarısıyla işaretsiz gelir.
# Eski fonksiyonlar (netProfitForMonth, finPlRows196, taxMonthModel.reelNet) DEĞİŞMEDİ — ekranlarda kullanılmaz.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:140])
    s = s.replace(old, new)

# ── 0) sürüm
rep('<meta name="app-version" content="2026.10.19.130">', '<meta name="app-version" content="2026.10.20.131">')
rep("const APP_VERSION = '2026.10.19.130';", "const APP_VERSION = '2026.10.20.131';")

# ── 1) CSS
rep("""  @media (max-width: 640px) { .fin-tabs { flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:2px; } .fin-tab { padding:7px 10px; font-size:12.5px; } }
""", """  @media (max-width: 640px) { .fin-tabs { flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:2px; } .fin-tab { padding:7px 10px; font-size:12.5px; } }
  /* v208 TEK ÖZET */
  #fin-tabs .fin-tab-more { display:none; }
  #fin-tabs.more .fin-tab-more, #fin-tabs .fin-tab-more.active { display:inline-block; }
  .fo-head { display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin:2px 0 6px; }
  .fo-head h2, .fo-head h3 { margin:0; }
  .fo-nav { display:flex; gap:6px; align-items:center; }
  .fo-nav input[type=month] { max-width:150px; padding:4px 6px; }
  .fo-tot { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; margin:8px 0; }
  .fo-tot > div { border:1px solid var(--border); border-radius:var(--radius, 12px); padding:10px 12px; background:var(--card); min-width:0; }
  .fo-tot > div.main { border-left:3px solid var(--acc); }
  .fo-tot .lbl { font-size:12px; color:var(--muted); }
  .fo-tot .big { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
  .fo-tot .big.neg { color:var(--bad); }
  .fo-tot .fx { font-size:12.5px; color:var(--muted); font-variant-numeric:tabular-nums; margin-top:2px; }
  @media (max-width: 640px) { .fo-tot { grid-template-columns:1fr 1fr; } .fo-tot > div.main { grid-column:1 / -1; } .fo-tot .big { font-size:18px; } }
  .fo-pl { margin:6px 0 4px; }
  .fo-pl-t { width:100%; border-collapse:collapse; margin:4px 0; table-layout:fixed; }
  .fo-pl-t th, .fo-pl-t td { padding:7px 6px; border-bottom:1px solid var(--border); text-align:right; font-variant-numeric:tabular-nums; font-size:13.5px; vertical-align:top; overflow-wrap:anywhere; }
  .fo-pl-t th { font-size:13px; font-weight:700; color:var(--text); }
  .fo-pl-t th:first-child, .fo-pl-t td:first-child { text-align:left; width:22%; color:var(--muted); font-weight:600; }
  .fo-pl-t small { display:block; font-weight:400; color:var(--muted); font-size:11px; }
  .fo-pl-t tr.net td { font-weight:700; font-size:16px; border-bottom:none; }
  .fo-pos { color:var(--ok); } .fo-neg { color:var(--bad); }
  .fo-ev { padding:8px 10px; border-radius:9px; background:var(--acc-soft, #e6f4f1); font-size:13px; margin:6px 0; }
  .fo-reg { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width: 820px) { .fo-reg { grid-template-columns:1fr; } }
  .fo-reg h3 { margin:0 0 4px; font-size:15px; }
  .fo-cats { margin:6px 0; } .fo-cats summary { cursor:pointer; font-size:13px; color:var(--muted); font-weight:600; }
  .fo-row { display:grid; grid-template-columns:auto minmax(0, 1fr) auto; gap:2px 8px; align-items:baseline; padding:7px 0; border-bottom:1px dashed var(--border); font-size:13px; }
  .fo-row .st { white-space:nowrap; font-variant-numeric:tabular-nums; min-width:58px; }
  .fo-row .st.ok { color:var(--ok); } .fo-row .st.bad { color:var(--bad); } .fo-row .st.wait { color:var(--warn); }
  .fo-row .t { min-width:0; overflow-wrap:anywhere; } .fo-row .a { text-align:right; font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .fo-row.overdue .a { color:var(--bad); } .fo-row.est { opacity:.62; }
  .fo-row .cand { grid-column:2 / -1; font-size:12px; color:var(--warn); display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
  @media (max-width: 640px) { .fo-6 .fo-s { display:none; } .fo-6 th, .fo-6 td { padding:6px 4px; font-size:11.5px; } .table-wrap table.fo-6, .table-wrap table.fo-mt { min-width:0; width:100%; } }
""")

# ── 2) Panel işaretlemesi
rep("""<span style="font-size:12px;color:var(--muted);">(gelir ve doluluk bu aya göre)</span>""",
    """<span style="font-size:12px;color:var(--muted);">(tahsilat, net kâr ve doluluk bu aya göre — para esası)</span>""")
rep("""<div class="stat blue"><div class="label">Net Kâr (₺)</div><div class="value" id="s-netprofit">—</div></div>""",
    """<div class="stat blue"><div class="label" id="s-netprofit-label" title="Para esası: o ay giren − çıkan (stüdyo) — Finans › Özet ile aynı">Net Kâr — stüdyo (₺)</div><div class="value" id="s-netprofit">—</div></div>""")

# ── 3) Finans sekmeleri + Özet paneli; Resmi Defter Hareketler'den Özet'e
rep("""    <div class="fin-tabs" id="fin-tabs">
      <button class="fin-tab pl-owner-only" data-fin="cash" onclick="finSwitchTab196('cash')">💰 Nakit Akışı</button>
      <button class="fin-tab active" data-fin="moves" onclick="finSwitchTab196('moves')">🔁 Hareketler</button>
      <button class="fin-tab pl-owner-only" data-fin="cari" onclick="finSwitchTab196('cari')">👥 Cari</button>
      <button class="fin-tab pl-owner-only" data-fin="dues" onclick="finSwitchTab196('dues')">⏰ Vadeler</button>
      <button class="fin-tab pl-owner-only" data-fin="reports" onclick="finSwitchTab196('reports')">📈 Raporlar</button>
      <button class="fin-tab pl-owner-only" data-fin="accounts" onclick="finSwitchTab196('accounts')">🏦 Hesaplar</button>
    </div>""", """    <div class="fin-tabs" id="fin-tabs">
      <button class="fin-tab pl-owner-only" data-fin="ozet" onclick="finSwitchTab196('ozet')">📊 Özet</button>
      <button class="fin-tab active" data-fin="moves" onclick="finSwitchTab196('moves')">🔁 Hareketler</button>
      <button class="fin-tab pl-owner-only" data-fin="dues" onclick="finSwitchTab196('dues')">⏰ Düzenli &amp; Vadeler</button>
      <button class="fin-tab pl-owner-only" data-fin="accounts" onclick="finSwitchTab196('accounts')">🏦 Hesaplar</button>
      <button class="fin-tab pl-owner-only fin-more-btn" type="button" aria-expanded="false" onclick="finToggleMore208()" title="Nakit akışı projeksiyonu, cari ekstreler, tablolar">⋯ Diğer</button>
      <button class="fin-tab pl-owner-only fin-tab-more" data-fin="cash" onclick="finSwitchTab196('cash')">💰 Nakit Akışı</button>
      <button class="fin-tab pl-owner-only fin-tab-more" data-fin="cari" onclick="finSwitchTab196('cari')">👥 Cari</button>
      <button class="fin-tab pl-owner-only fin-tab-more" data-fin="reports" onclick="finSwitchTab196('reports')">📈 Tablolar</button>
    </div>""")
rep("""  <div class="fin-panel" id="fin-panel-cash"><div class="card"><div id="fin-cash-body"></div></div></div>""",
    """  <div class="fin-panel" id="fin-panel-ozet"><div class="card"><div id="fin-ozet-body"></div>
    <details id="tax-ledger-card" style="margin:12px 0 0;padding:10px 12px;border:1px solid var(--border);border-radius:10px;">
      <summary style="cursor:pointer;font-weight:700;">🏛️ Resmi Defter — devlet ayrıntısı, muhasebeci rakamları <span id="tax-ledger-sub" style="font-weight:400;color:var(--muted);margin-left:6px;"></span></summary>
      <div id="tax-ledger-body" style="margin-top:8px;"></div>
    </details>
  </div></div>
  <div class="fin-panel" id="fin-panel-cash"><div class="card"><div id="fin-cash-body"></div></div></div>""")
rep("""    <details id="tax-ledger-card" style="margin:10px 0;padding:10px 12px;background:#F4F8FF;border:1px solid #CBDCF2;border-radius:10px;">
      <summary style="cursor:pointer;font-weight:700;">🏛️ Resmi Defter <span id="tax-ledger-sub" style="font-weight:400;color:var(--muted);margin-left:6px;"></span></summary>
      <div id="tax-ledger-body" style="margin-top:8px;"></div>
    </details>
""", "")

# ── 4) Raporlar sayfası kartı
rep("""    <h2>💰 Vergi Paneli (IBAN tahsilatları için)</h2>""", """    <h2>💰 Para Özeti — reelde ve devlette</h2>""")
rep("""      Vergi hesabı sadece <b>IBAN</b> olarak işaretlenen ödemeleri dikkate alır. Nakit ve kredi kartı bu panelde gösterilmez. KDV ve gelir vergisi oranlarını Ayarlar → Vergi Ayarları'ndan güncelleyebilirsin.""",
    """      Rakamlar <b>Finans › 📊 Özet</b> ile aynı kaynaktan gelir — <b>para esası</b>: o ay kasaya/bankaya giren − çıkan (üye tahsilatı ödeme günü, hoca ödemesi ödendiği gün, kart gideri ekstre ayı). Devlet sütunu resmi defterin tahminidir; muhasebecinin rakamı Özet › 🏛️ Resmi Defter'e girilirse o esas alınır. KDV ve vergi ayarları: Ayarlar → Vergi.""")

# ── 5) Panel JS (para esası)
rep("""    const __pm = (state.payments||[]).map(function(p){return p.packageMonth||(p.date?String(p.date).slice(0,7):'');}).filter(function(mm){return mm && mm <= __cm0;}).sort();""",
    """    const __pm = (state.payments||[]).map(function(p){return p.date?String(p.date).slice(0,7):'';}).filter(function(mm){return mm && mm <= __cm0;}).sort(); // v208 para esası: ödeme günü""")
rep("""  { const e1=document.getElementById('s-revenue-label'); if(e1) e1.textContent = __mLbl+' Geliri (₺)';""",
    """  { const e1=document.getElementById('s-revenue-label'); if(e1) e1.textContent = __mLbl+' Tahsilatı (₺)';""")
rep("""  const rev = state.payments.filter(p => (p.packageMonth || (p.date ? String(p.date).slice(0,7) : '')) === m).reduce((a,b)=>a+(+b.amount||0),0);
  document.getElementById('s-revenue').textContent = money(rev);
  try { const __np = netProfitForMonth(m); const __npe = document.getElementById('s-netprofit'); if (__npe) __npe.textContent = money(__np.net); } catch(e) {} // v127""",
    """  const __S208 = finSummary208(m); // v208 TEK ÖZET (Kerem 20.10, para esası): Panel = Raporlar = Finans › Özet — aynı fonksiyon, aynı rakam
  document.getElementById('s-revenue').textContent = money(__S208.studio.uye);
  try { const __npe = document.getElementById('s-netprofit'); if (__npe) __npe.textContent = money(__S208.studio.net); } catch(e) {} // v127 · v208""")

# ── 6) Trend grafiği tek kaynaktan
rep("""  const data = months.map(function(ay) { const n = netProfitForMonth(ay); return { ay: ay, rev: n.rev, net: n.net }; });""",
    """  const data = months.map(function(ay) { const n = finSummary208(ay); return { ay: ay, rev: n.studio.uye, net: n.studio.net }; }); // v208 para esası (tek kaynak)""")
rep("""    bars += `<g><title>${d2.ay} — Tahsilat: ${money(d2.rev)} ₺ · Net kâr: ${money(d2.net)} ₺</title>""",
    """    bars += `<g><title>${d2.ay} — Tahsilat: ${money(d2.rev)} ₺ · Net kâr (stüdyo): ${money(d2.net)} ₺</title>""")

# ── 7) Resmi Defter: reel kartı tek kaynaktan; kira+stopaj defterin ayına; kayıt sonrası Özet tazelenir
rep("""  const M = taxMonthModel(ay);
  const sub = document.getElementById('tax-ledger-sub');""", """  const M = taxMonthModel(ay);
  const __S208 = finSummary208(ay); // v208: reel = stüdyo net, para esası (eski "Reel Net" hane giderini düşüp maaşı eklemiyordu)
  const sub = document.getElementById('tax-ledger-sub');""")
rep("""      <div class="stat"><div class="label">Reel Net (kayıt dışı dahil)</div><div class="value">${money(M.reelNet)} ₺</div><div style="font-size:10px;color:var(--muted);">resmi ile fark: ${money(M.kayitDisiFark)} ₺</div></div>""",
    """      <div class="stat"><div class="label">Reel — stüdyo (para esası)</div><div class="value">${money(__S208.studio.net)} ₺</div><div style="font-size:10px;color:var(--muted);">resmi ile fark (kayıt dışı): ${money(__S208.fark)} ₺</div></div>""")
rep("""      <button class="btn small secondary pl-owner-only" onclick="addRentWithStopaj()" style="margin-left:8px;">🏠 Kira + Stopaj Yaz</button></div>""",
    """      <button class="btn small secondary pl-owner-only" onclick="addRentWithStopaj('${ay}')" style="margin-left:8px;">🏠 Kira + Stopaj Yaz</button></div>""")
rep("""function addRentWithStopaj() {
  const cfg = __taxCfg();
  const ay = (document.getElementById('pay-month')||{}).value || currentMonth();""", """function addRentWithStopaj(ayArg) {
  const cfg = __taxCfg();
  const ay = (/^\\d{4}-\\d{2}$/.test(String(ayArg || '')) ? String(ayArg) : '') || (document.getElementById('pay-month')||{}).value || currentMonth(); // v208: defter Özet'te — o defterin ayı""")
rep("""  if (Object.keys(entry).length) state.settings.taxLedger[ay] = entry; else delete state.settings.taxLedger[ay];
  save(); renderTaxLedger(ay);""", """  if (Object.keys(entry).length) state.settings.taxLedger[ay] = entry; else delete state.settings.taxLedger[ay];
  save(); renderTaxLedger(ay);
  try { const __po = document.getElementById('fin-panel-ozet'); if (__po && __po.classList.contains('active')) renderFinOzet208(); } catch(e) {} // v208: devlet sütunu tazelenir""")

# ── 8) Ödemeler listesi özeti: hangi ayın paketi olduğu açık yazılır (liste paket ayı kanonunda kalır)
rep("""    <div class="stat ok"><div class="label">Toplam Tutar</div><div class="value">${money(total)} ₺</div></div>""",
    """    <div class="stat ok"><div class="label">Toplam Tutar</div><div class="value">${money(total)} ₺</div>${mm ? `<div style="font-size:10px;color:var(--muted);">📦 ${escapeHtml(pkgMonthLabel(mm))} paketleri için alınan (liste paket ayına göre)</div>` : ''}</div>""")

# ── 9) Sekme: Özet varsayılan; eski varsayılan Nakit Akışı bir kez Özet'e
rep("""let __finTab196 = (function(){ try { return localStorage.getItem('pilateria_fin_tab') || ''; } catch(e) { return ''; } })(); // '' = henüz seçilmedi → finans etkinse Nakit Akışı, değilse Hareketler""",
    """let __finTab196 = (function(){ try { let t = localStorage.getItem('pilateria_fin_tab') || ''; if (!localStorage.getItem('pilateria_fin_ozet208')) { localStorage.setItem('pilateria_fin_ozet208', '1'); if (t === 'cash') { t = 'ozet'; localStorage.setItem('pilateria_fin_tab', t); } } return t; } catch(e) { return ''; } })(); // '' = henüz seçilmedi → finans etkinse Özet (v208), değilse Hareketler · v208: eski varsayılan Nakit Akışı bir kez Özet'e""")
rep("""  if (!__finTab196) __finTab196 = (!staff && finActive196()) ? 'cash' : 'moves'; // v196 adım 3""",
    """  if (!__finTab196) __finTab196 = (!staff && finActive196()) ? 'ozet' : 'moves'; // v196 adım 3 · v208: varsayılan Özet""")
rep("""  const fn = { moves: renderFinMoves196, accounts: renderFinAccounts196,""",
    """  const fn = { ozet: (typeof renderFinOzet208 === 'function' ? renderFinOzet208 : null), moves: renderFinMoves196, accounts: renderFinAccounts196,""")

# ── 10) Raporlar sayfası JS
rep("""  const payments = state.payments.filter(p=>((p.packageMonth||(p.date?String(p.date).slice(0,7):''))===m)); // v39: gelir PAKET AYINA gore (odeme tarihi degil) — her yerle tutarli""",
    """  const payments = state.payments.filter(p => String(p.date || '').slice(0,7) === m); // v208 para esası (Kerem 20.10): ödeme gününe göre — Panel = Raporlar = Finans › Özet (paket ayı yalnız Üyeler/Ödemeler listesinde)""")
rep("""      <div class="stat ok"><div class="label">Gelir</div><div class="value">${money(revenue)} ₺</div></div>
      <div class="stat blue"><div class="label">Toplam Ders</div>""", """      <div class="stat ok"><div class="label">Gelir — tahsilat (ödeme günü)</div><div class="value">${money(revenue)} ₺</div></div>
      <div class="stat blue"><div class="label">Toplam Ders</div>""")
_i0 = s.index("  // ======= TAX PANEL =======\n")
_tail = """    ${ibanPayments.length===0 ? '<div class="empty" style="padding:16px;">Bu ay IBAN ödemesi yok.</div>' : ''}
  `;
}
"""
assert s.count(_tail) == 1, 'tax panel sonu'
_i1 = s.index(_tail) + len(_tail)
assert _i0 < _i1 and s[_i0:_i1].count('function ') == 0, 'tax panel bloğu'
s = s[:_i0] + """  // ======= v208 PARA ÖZETİ (eski "Vergi Paneli") — Finans › Özet ile AYNI blok; yöntem tablosu yalnız sayım/tutar (vergi sütunları kalktı:
  // her İBAN ödemesinden %15 gelir vergisi gösteriyordu, devlet modeli ise yıllık matrah/zarar devriyle hesaplar) =======
  const ibanPayments = payments.filter(p=>p.method==='IBAN');
  const cashPayments = payments.filter(p=>p.method==='Nakit');
  const cardPayments = payments.filter(p=>p.method==='Kredi Kartı');
  const otherPayments = payments.filter(p=>!['IBAN','Nakit','Kredi Kartı'].includes(p.method));
  const __sum208 = function(arr){ return arr.reduce(function(a,b){ return a + (+b.amount||0); }, 0); };
  const ibanGross = __sum208(ibanPayments), cashGross = __sum208(cashPayments), cardGross = __sum208(cardPayments), otherGross = __sum208(otherPayments);
  (function(){
    const np = document.getElementById('net-profit-panel');
    if (!np) return;
    np.innerHTML = finOzetPlHtml208(finSummary208(m), { link: true });
  })();
  try { renderTrendChart(m); } catch(e) {} // v128
  document.getElementById('tax-panel').innerHTML = `
    <h3>Ödeme yöntemi (${m} · ödeme gününe göre)</h3>
    <div class="table-wrap"><table class="fo-mt">
      <thead><tr><th>Yöntem</th><th>Adet</th><th>Tutar</th></tr></thead>
      <tbody>
        <tr><td><b>IBAN</b></td><td>${ibanPayments.length}</td><td>${money(ibanGross)} ₺</td></tr>
        <tr><td>Nakit</td><td>${cashPayments.length}</td><td>${money(cashGross)} ₺</td></tr>
        ${cardPayments.length>0 ? `<tr><td>Kredi Kartı</td><td>${cardPayments.length}</td><td>${money(cardGross)} ₺</td></tr>` : ''}
        ${otherPayments.length>0 ? `<tr><td>Diğer</td><td>${otherPayments.length}</td><td>${money(otherGross)} ₺</td></tr>` : ''}
        <tr style="font-weight:700;"><td><b>TOPLAM</b></td><td><b>${payments.length}</b></td><td><b>${money(ibanGross+cashGross+cardGross+otherGross)} ₺</b></td></tr>
      </tbody>
    </table></div>
  `;
}
""" + s[_i1:]

# ── 11) Finans › Tablolar › Gelir–Gider para esası
rep("""  if (R.kind === 'pl') {
    const rows = finPlRows196(months);
    body = '<div class="fin-note">Tahsilat paket ayına, gider işlem tarihine, hoca ödemesi ödendiği aya göre. <b>Stüdyo net</b>: üye tahsilatı − stüdyo giderleri (Derya\\'nın kartları dahil). <b>Hane net</b>: + maaş/diğer gelir − hane giderleri (ev kirası, aile harcamaları). Vergi paneli yalnız faturalı/resmi stüdyo giderlerini görür. Son satır: tüm nakit/banka hesaplarında gerçekleşen değişim (virman hariç).</div>""",
    """  if (R.kind === 'pl') {
    const rows = finPlRows208(months); // v208 para esası (Özet ile aynı)
    body = '<div class="fin-note"><b>Para esası</b> (Özet ile aynı): üye tahsilatı ödeme gününe, hoca ödemesi ödendiği güne, gider işlem/ekstre tarihine göre. <b>Stüdyo net</b>: üye tahsilatı − hoca − stüdyo giderleri (Derya\\'nın kartları dahil). <b>Ev net</b>: maaş/diğer ev geliri − ev giderleri. <b>Toplam</b> = stüdyo + ev. <b>Devlet</b>: resmi defter tahmini. Son satır: tüm nakit/banka hesaplarında gerçekleşen değişim (virman hariç).</div>""")
rep("""  if (R.kind === 'pl') { rows.push(['Kalem'].concat(months)); finPlRows196(months).forEach(function(r){""",
    """  if (R.kind === 'pl') { rows.push(['Kalem'].concat(months)); finPlRows208(months).forEach(function(r){""")

# ── 12) Ekstre içe alımı: düzenli kalem eşleşmesi
rep("""  const rows = parsed.rows.map(function(r, i){ const g = finGuessCategory196(r.desc, { amount: r.amount }); const mm = m207[i]; const dup = !!(mm && mm.dup); const scope = r.kind === 'payment' ? 'skip' : finDefaultScope200(r.desc, card, g); return Object.assign({}, r, { category: g.category, counterpartyId: g.counterpartyId, business: scope !== 'hane', scope: scope, fromRule: g.fromRule, dup: dup, dupMatchId: (mm && mm.matchId) || '', dupManual: !!(mm && mm.manual), checked: !dup && r.kind !== 'payment' }); }); // v200: kapsam + mükerrer gider · v207: bire bir eşleşme
""", """  const rows = parsed.rows.map(function(r, i){ const g = finGuessCategory196(r.desc, { amount: r.amount }); const mm = m207[i]; const dup = !!(mm && mm.dup); const scope = r.kind === 'payment' ? 'skip' : finDefaultScope200(r.desc, card, g); return Object.assign({}, r, { category: g.category, counterpartyId: g.counterpartyId, business: scope !== 'hane', scope: scope, fromRule: g.fromRule, dup: dup, dupMatchId: (mm && mm.matchId) || '', dupManual: !!(mm && mm.manual), checked: !dup && r.kind !== 'payment' }); }); // v200: kapsam + mükerrer gider · v207: bire bir eşleşme
  try { const reg208 = finImportMatchRegular208(accountId, rows); rows.forEach(function(r, i){ const g = reg208[i]; if (!g) return; if (g.regDueId) r.regDueId = g.regDueId; if (g.regPaidId) { r.regPaidId = g.regPaidId; r.checked = false; } }); } catch(e) {} // v208: düzenli (şablon) kalem eşleşmesi
""")
rep("""(nPay ? ' · ' + nPay + ' kart ödemesi (atlanır)' : '')""",
    """(nPay ? ' · ' + nPay + ' kart ödemesi (atlanır)' : '') + (function(){ const a = I.rows.filter(function(r){ return r.regDueId && r.checked && !r.regOff; }).length, b = I.rows.filter(function(r){ return r.regPaidId; }).length; return (a ? ' · <b>' + a + ' düzenli kalem kapanacak</b>' : '') + (b ? ' · ' + b + ' satır zaten ödenmiş düzenli kaleme benziyor (işaretsiz)' : ''); })()""")
rep("""<td data-label="Açıklama" style="white-space:normal;max-width:260px;">' + escapeHtml(r.desc) + ' ' + st + '</td>""",
    """<td data-label="Açıklama" style="white-space:normal;max-width:260px;">' + escapeHtml(r.desc) + ' ' + st + finImportRegBadge208(r, i) + '</td>""")
rep("""  let nExp = 0, nDraw = 0, nCredit = 0, nSkip = 0, nHane = 0; const fps = [];""",
    """  let nExp = 0, nDraw = 0, nCredit = 0, nSkip = 0, nHane = 0; const fps = []; let nReg208 = 0; // v208: kapanan düzenli kalem""")
rep("""    state.expenses.push({ id: uid(), date: dateOk, paidDate: dateOk, category: r.category || 'Diğer', amount: r.credit ? -amt : amt, note: r.desc, resmi: false, kdvRate: 0, accountId: card.id, counterpartyId: r.counterpartyId || '', scope: scope, source: 'card-import', fingerprint: r.fp });
    if (r.credit) nCredit++; else nExp++; if (scope === 'hane') nHane++;""",
    """    const __reg208 = (r.regDueId && !r.regOff && !r.credit) ? (state.finDues || []).find(function(x){ return x && x.id === r.regDueId && x.status === 'open'; }) : null; // v208: düzenli kalemin ödemesi → vadesi kapanır
    const __sc208 = __reg208 ? (__reg208.scope === 'hane' ? 'hane' : 'studio') : scope;
    const __e208 = { id: uid(), date: dateOk, paidDate: dateOk, category: (__reg208 && __reg208.category) || r.category || 'Diğer', amount: r.credit ? -amt : amt, note: r.desc + (__reg208 ? ' · düzenli: ' + __reg208.title : ''), resmi: __reg208 ? !!__reg208.resmi : false, kdvRate: (__reg208 && __reg208.resmi) ? (+__reg208.kdvRate || 0) : 0, accountId: card.id, counterpartyId: r.counterpartyId || (__reg208 && __reg208.counterpartyId) || '', scope: __sc208, source: 'card-import', fingerprint: r.fp };
    if (__reg208) { __e208.dueId = __reg208.id; __reg208.status = 'paid'; __reg208.paidRef = { type: 'expense', id: __e208.id }; __reg208.paidDate = dateOk; __reg208.paidAmount = amt; nReg208++; }
    state.expenses.push(__e208);
    if (r.credit) nCredit++; else nExp++; if (__sc208 === 'hane') nHane++;""")
rep("""clamp: clamp201, aligned: nAlign, total: total || null,""", """clamp: clamp201, aligned: nAlign, regular: nReg208, total: total || null,""")
rep("""(nAlign ? ', ' + nAlign + ' elle kayıt ekstre ayına taşındı' : '') + (dueMade ? ' · son ödeme kalemi eklendi' : ''));
  return { expenses: nExp, credits: nCredit, draws: nDraw, skipped: nSkip, hane: nHane, aligned: nAlign, due: dueMade };""",
    """(nAlign ? ', ' + nAlign + ' elle kayıt ekstre ayına taşındı' : '') + (nReg208 ? ', ' + nReg208 + ' düzenli kalem kapandı' : '') + (dueMade ? ' · son ödeme kalemi eklendi' : ''));
  return { expenses: nExp, credits: nCredit, draws: nDraw, skipped: nSkip, hane: nHane, aligned: nAlign, regular: nReg208, due: dueMade };""")

# ── 12b) Vadeler satırı: açık düzenli kalemin olası ödemesi → "↔ Bağla" (Öde ikinci gider yazmasın)
rep("""  const who = it.counterpartyId ? '<small style="color:var(--muted)"> · ' + escapeHtml(finCounterpartyName196(it.counterpartyId)) + '</small>' : '';""",
    """  const who = it.counterpartyId ? '<small style="color:var(--muted)"> · ' + escapeHtml(finCounterpartyName196(it.counterpartyId)) + '</small>' : '';
  let __cand208 = ''; // v208: olası ödeme""")
rep("""    else act = '<button class="btn small ok" onclick="finPayItem196(\\'' + it.id + '\\')" title="Ödendi — hesap sorar, gider yazar">✓ Öde</button> <button class="btn small secondary" onclick="openFinDueModal196(\\'' + it.id + '\\')" title="Düzenle">✎</button> <button class="btn small secondary" onclick="finSkipDue196(\\'' + it.id + '\\')" title="Bu dönem atla">Atla</button>';""",
    """    else act = '<button class="btn small ok" onclick="finPayItem196(\\'' + it.id + '\\')" title="Ödendi — hesap sorar, gider yazar">✓ Öde</button> <button class="btn small secondary" onclick="openFinDueModal196(\\'' + it.id + '\\')" title="Düzenle">✎</button> <button class="btn small secondary" onclick="finSkipDue196(\\'' + it.id + '\\')" title="Bu dönem atla">Atla</button>';
    if (it.templateId && !it.derived) { const __c = finDueCandidate208(it); if (__c) { act = '<button class="btn small" onclick="finLinkDue208(\\'' + it.id + '\\', \\'' + __c.id + '\\')" title="Bu kalem zaten ödenmiş görünüyor — o ödemeye bağla (yeni gider yazılmaz)">↔ Bağla</button> ' + act; __cand208 = '<small style="color:var(--warn)"> · olası ödeme ' + fmtDate(__finExpDate208(__c)) + (__c.accountId ? ' · ' + escapeHtml(finAccountLabel196(__c.accountId)) : '') + '</small>'; } } // v208""")
rep("""'</span><span class="t">' + escapeHtml(it.title) + who + (it.accountId && side === 'pay' && it.dtype !== 'card'""",
    """'</span><span class="t">' + escapeHtml(it.title) + who + __cand208 + (it.accountId && side === 'pay' && it.dtype !== 'card'""")

# ── 13) TEK ÖZET çekirdeği + ekran (KART EKSTRESİ OKUYUCU bölümünden hemen önce)
CORE = r"""// ═══════════════════════ v208 TEK ÖZET — PARA ESASI (Kerem 20.10) ═══════════════════════
// "Raporlar ve finans birbirini sağlamıyor" → Panel, Raporlar ve Finans AYNI fonksiyondan AYNI rakamı gösterir. Para esası: o ay GERÇEKTEN
// giren − çıkan. Üye tahsilatı ödeme günü; hoca ödemesi ödendiği gün (paidDate; yoksa hakediş ayı sonu); gider paidDate||date (kart gideri
// ekstre ayı — v201/v207); açık (status:'open') ve Hoca Maaşı/MAAS-OTO gideri hariç (hoca ödemesinde sayılır). Stüdyo = üye tahsilatı + diğer
// stüdyo geliri − hoca − stüdyo giderleri; Ev = maaş/diğer ev geliri − ev giderleri; Toplam = ikisi. Devlet = taxMonthModel (resmi defter).
function __finIsMaas208(e) { return !!(e && ((e.note && String(e.note).indexOf('MAAS-OTO-') !== -1) || e.category === 'Hoca Maaşı')); }
function __finExpDate208(e) { return String((e && (e.paidDate || e.date)) || '').slice(0, 10); }
function __finPayoutDate208(po) { if (!po) return ''; if (po.paidDate) return String(po.paidDate).slice(0, 10); if (po.year && po.month) return finMonthEnd196(po.year + '-' + String(po.month).padStart(2, '0')); return ''; }
function __finAyLbl208(ay) { try { return parseISO(String(ay).slice(0, 7) + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }); } catch(e) { return String(ay); } }
function __finSg208(v) { v = finR2_196(v); return (v > 0 ? '+' : (v < 0 ? '−' : '')) + money(Math.abs(v)); }
function __finCls208(v) { return v > 0.004 ? 'fo-pos' : (v < -0.004 ? 'fo-neg' : ''); }
function finSummary208(ay) {
  ay = String(ay || currentMonth()).slice(0, 7);
  const r2 = finR2_196; const inM = function(d){ return String(d || '').slice(0, 7) === ay; };
  const S = { uye: 0, uyeN: 0, diger: 0, hoca: 0, gider: 0, maas: 0, cats: {} };
  const E = { gelir: 0, gelirler: {}, gider: 0, cats: {} };
  (state.payments || []).forEach(function(p){ if (!p || !inM(p.date)) return; S.uye += (+p.amount || 0); S.uyeN++; });
  (state.finMoves || []).forEach(function(mv){ if (!mv || mv.op !== 'income' || !inM(mv.date)) return; const a = +mv.amount || 0; if (!a) return; if (mv.scope === 'hane') { E.gelir += a; const k = String(mv.title || 'Gelir'); E.gelirler[k] = r2((E.gelirler[k] || 0) + a); } else S.diger += a; });
  (state.instructorPayouts || []).forEach(function(po){ if (!po || !inM(__finPayoutDate208(po))) return; S.hoca += (+po.amount || 0); });
  (state.expenses || []).forEach(function(e){
    if (!e || e.status === 'open' || !inM(__finExpDate208(e))) return;
    if (__finIsMaas208(e)) { S.maas += (+e.amount || 0); return; } // maaş kaydı hoca ödemesinde sayılır (çift sayılmaz) — yalnız bilgi
    const a = +e.amount || 0; const c = e.category || 'Diğer';
    if (finExpScope200(e) === 'hane') { E.gider += a; E.cats[c] = r2((E.cats[c] || 0) + a); } else { S.gider += a; S.cats[c] = r2((S.cats[c] || 0) + a); }
  });
  S.maas = r2(S.maas); S.uye = r2(S.uye); S.diger = r2(S.diger); S.hoca = r2(S.hoca); S.gider = r2(S.gider); E.gelir = r2(E.gelir); E.gider = r2(E.gider);
  S.gelir = r2(S.uye + S.diger); S.cikan = r2(S.hoca + S.gider); S.net = r2(S.gelir - S.cikan); E.net = r2(E.gelir - E.gider);
  const T = { gelir: r2(S.gelir + E.gelir), gider: r2(S.cikan + E.gider) }; T.net = r2(T.gelir - T.gider);
  let D = null;
  try { const M = taxMonthModel(ay); D = { gelir: M.gelir, netGelir: M.netGelir, kdv: M.hesapKdv, indKdv: M.indKdv, gider: M.gider, kar: M.kar, odenecekKdv: M.odenecekKdv, devredenKdv: M.devredenKdvYeni, yilIci: M.kalanMatrah, devredenZarar: M.devredenZarar, vergi: M.tahminiVergi, vergiOde: M.vergiOde, elle: !!(M.led && ['gelir', 'indKdv', 'gider'].some(function(k){ return M.led[k] != null && M.led[k] !== ''; })) }; } catch(e) { D = null; }
  return { ay: ay, studio: S, ev: E, toplam: T, devlet: D, fark: D ? r2(S.net - D.kar) : null };
}
// PARA: hesap bakiyeleri (saklanmaz, türetilir) · toplam para = kasa + banka · kart borcu · net varlık · ≈ $/€ (kur ELLE — Kerem 20.10)
function finFx208() { const f = (((state || {}).settings || {}).finance || {}).fx; if (!f || typeof f !== 'object') return null; const usd = +f.usd || 0, eur = +f.eur || 0; if (!(usd > 0) && !(eur > 0)) return null; return { usd: usd > 0 ? usd : 0, eur: eur > 0 ? eur : 0, date: String(f.date || '') }; }
function finMoney208(asOf) {
  const r2 = finR2_196; const out = { accounts: [], cards: [], cash: 0, debt: 0, credit: 0, missing: [], any: false };
  finAccounts196().forEach(function(a){
    const b = finBalance196(a.id, asOf);
    if (a.type === 'card') { if (b === null) return; out.cards.push({ id: a.id, label: finAccountLabel196(a.id), owner: a.owner || '', bal: b }); if (b < 0) out.debt += -b; else out.credit += b; return; }
    out.accounts.push({ id: a.id, type: a.type, label: finAccountLabel196(a.id), owner: a.owner || '', bal: b, openingDate: a.openingDate || '' });
    if (b === null) { out.missing.push({ id: a.id, label: finAccountLabel196(a.id) }); return; }
    out.cash += b; out.any = true;
  });
  out.cash = r2(out.cash); out.debt = r2(out.debt); out.credit = r2(out.credit); out.net = r2(out.cash - out.debt + out.credit);
  const fx = finFx208(); out.fx = fx;
  const cv = function(v, rate){ return rate > 0 ? Math.round(v / rate) : null; };
  out.usd = fx ? cv(out.cash, fx.usd) : null; out.eur = fx ? cv(out.cash, fx.eur) : null;
  out.netUsd = fx ? cv(out.net, fx.usd) : null; out.netEur = fx ? cv(out.net, fx.eur) : null;
  return out;
}
function __finParseRate208(x) { let t = String(x == null ? '' : x).trim().replace(/\s/g, ''); if (!t) return 0; if (t.indexOf(',') !== -1) t = t.replace(/\./g, '').replace(',', '.'); const n = parseFloat(t); return isFinite(n) && n > 0 ? Math.round(n * 10000) / 10000 : 0; }
function openFinFxModal208() {
  const f = finFx208() || {};
  const old = document.getElementById('modal-fin-fx'); if (old) old.remove();
  const v = function(x){ return x ? String(x).replace('.', ',') : ''; };
  const mdl = document.createElement('div'); mdl.id = 'modal-fin-fx'; mdl.className = 'modal-bg open';
  mdl.innerHTML = '<div class="modal" style="max-width:380px;"><h3>💱 Döviz kuru</h3><div class="fin-note">Toplam paranın ≈ $ ve ≈ € karşılığı için bugünkü kuru yaz (banka ya da TCMB). Uygulama internetten kur çekmez; kur tarihiyle saklanır.</div>' +
    '<div class="row" style="gap:8px;"><div class="field" style="flex:1"><label>1 $ = ₺</label><input id="fx-usd" inputmode="decimal" autocomplete="off" placeholder="örn. 41,85" value="' + escapeHtml(v(f.usd)) + '"></div><div class="field" style="flex:1"><label>1 € = ₺</label><input id="fx-eur" inputmode="decimal" autocomplete="off" placeholder="örn. 48,70" value="' + escapeHtml(v(f.eur)) + '"></div></div>' +
    (f.date ? '<div class="fin-note">Kayıtlı kur: ' + fmtDate(f.date) + '</div>' : '') +
    '<div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px;flex-wrap:wrap;">' + (f.usd || f.eur ? '<button class="btn secondary" style="margin-right:auto;" onclick="saveFinFx208(true)">Kuru sil</button>' : '') + '<button class="btn secondary" onclick="document.getElementById(\'modal-fin-fx\').remove()">Vazgeç</button><button class="btn" onclick="saveFinFx208()">Kaydet</button></div></div>';
  document.body.appendChild(mdl);
}
function saveFinFx208(clear, vals) {
  __finNormalize196(state);
  if (clear) { __undoSnapshot('Döviz kuru sil'); delete state.settings.finance.fx; }
  else {
    const src = vals || { usd: (document.getElementById('fx-usd') || {}).value, eur: (document.getElementById('fx-eur') || {}).value };
    const usd = __finParseRate208(src.usd), eur = __finParseRate208(src.eur);
    if (!usd && !eur) { alert('En az bir kur gir (örn. 1 $ = 41,85).'); return false; }
    __undoSnapshot('Döviz kuru');
    state.settings.finance.fx = { usd: usd, eur: eur, date: (src.date && /^\d{4}-\d{2}-\d{2}$/.test(String(src.date))) ? String(src.date) : todayISO() };
  }
  save();
  const mdl = document.getElementById('modal-fin-fx'); if (mdl) mdl.remove();
  try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast(clear ? 'Kur silindi' : '💱 Kur kaydedildi');
  return true;
}
// PARA KONTROLÜ: bütün etkin hesaplar (kasa/banka/kart) ayın 1'inde ya da önce açıksa → hesaplardaki değişim = toplam net + sermaye − çekim + mutabakat
function finCheck208(ay) {
  ay = String(ay || currentMonth()).slice(0, 7);
  const s0 = ay + '-01', prevEnd = addDaysISO(s0, -1), e0 = finMonthEnd196(ay);
  const accs = finAccounts196(); if (!accs.length) return { ready: false, missing: 0, from: '' };
  const late = accs.filter(function(a){ return !a.openingDate || a.openingDate > s0; });
  if (late.length) { let mx = ''; late.forEach(function(a){ if (a.openingDate && a.openingDate > mx) mx = a.openingDate; }); return { ready: false, missing: late.filter(function(a){ return !a.openingDate; }).length, from: mx }; }
  let actual = 0; accs.forEach(function(a){ actual += (finBalance196(a.id, e0) || 0) - (finBalance196(a.id, prevEnd) || 0); });
  const S = finSummary208(ay); let other = 0;
  (state.finMoves || []).forEach(function(mv){ if (!mv || String(mv.date || '').slice(0, 7) !== ay) return; const a = +mv.amount || 0; if (mv.op === 'capital') other += Math.abs(a); else if (mv.op === 'draw') other -= Math.abs(a); else if (mv.op === 'reconcile') other += a; });
  const un = finUnassigned196().filter(function(m){ return String(m.date).slice(0, 7) === ay; }).length;
  actual = finR2_196(actual); const expected = finR2_196(S.toplam.net + other);
  return { ready: true, actual: actual, expected: expected, diff: finR2_196(actual - expected), other: finR2_196(other), unassigned: un };
}
// DÜZENLİ GELİR & GİDER (Kerem: "muhasebe, kiralar, aidat, vergiler, faturalar — kartlardan ödüyoruz; hepsi toplu olmalı")
function finRegular208(ay, S) {
  ay = String(ay || currentMonth()).slice(0, 7);
  try { finEnsureTemplateDues196(); } catch(e) {}
  const r2 = finR2_196, today = todayISO(); const inM = function(d){ return String(d || '').slice(0, 7) === ay; };
  const dueById = {}, expById = {}, mvById = {};
  (state.finDues || []).forEach(function(d){ if (d && d.id) dueById[d.id] = d; });
  (state.expenses || []).forEach(function(e){ if (e && e.id) expById[e.id] = e; });
  (state.finMoves || []).forEach(function(m){ if (m && m.id) mvById[m.id] = m; });
  const inc = [], out = [];
  const tplRow = function(d){
    const st = d.status === 'paid' ? 'paid' : (d.status === 'skipped' ? 'skipped' : (String(d.dueDate || '') < today ? 'overdue' : 'open'));
    let amount = +d.amount || 0, paidDate = '', accountId = d.accountId || '';
    if (st === 'paid') {
      const pr = d.paidRef || {}; const e = pr.type === 'expense' ? expById[pr.id] : null; const mv = pr.type === 'move' ? mvById[pr.id] : null;
      if (e) { amount = +e.amount || 0; paidDate = __finExpDate208(e); accountId = e.accountId || ''; }
      else if (mv) { amount = +mv.amount || 0; paidDate = String(mv.date || '').slice(0, 10); accountId = mv.toAccountId || mv.fromAccountId || mv.accountId || ''; }
      else { amount = d.paidAmount != null ? +d.paidAmount : amount; paidDate = String(d.paidDate || '').slice(0, 10); accountId = ''; }
    }
    const row = { id: d.id, kind: 'tpl', title: d.title || '', scope: d.scope === 'hane' ? 'hane' : 'studio', category: d.category || '', period: d.period || '', amount: r2(amount), dueDate: d.dueDate || '', paidDate: paidDate, status: st, accountId: accountId, other: d.period !== ay, inMonth: st === 'paid' && inM(paidDate) };
    if (st === 'open' || st === 'overdue') { const c = finDueCandidate208(d); if (c) row.cand = { id: c.id, date: __finExpDate208(c), accountId: c.accountId || '' }; }
    return row;
  };
  (state.finDues || []).forEach(function(d){
    if (!d || !d.templateId) return;
    const r = tplRow(d); if (d.period !== ay && !r.inMonth) return;
    (d.dtype === 'income' ? inc : out).push(r);
  });
  // şablona bağlı OLMAYAN, bu ay ödenmiş vergi/prim ve faturalar (karttan ya da elle) — kategori + kapsam bazında
  const linked = function(e){ return !!(e.dueId && dueById[e.dueId] && dueById[e.dueId].templateId); };
  const BILL = ['Elektrik/Su/Doğalgaz', 'Abonelik/İletişim']; const grp = {};
  (state.expenses || []).forEach(function(e){
    if (!e || e.status === 'open' || __finIsMaas208(e) || !inM(__finExpDate208(e)) || linked(e)) return;
    const c = e.category || 'Diğer'; const kind = TAX_PAY_CATS.indexOf(c) !== -1 ? 'tax' : (BILL.indexOf(c) !== -1 ? 'bill' : ''); if (!kind) return;
    const sc = finExpScope200(e); const k = kind + '|' + c + '|' + sc;
    const g = grp[k] || (grp[k] = { id: 'grp:' + k, kind: kind, title: c, scope: sc, amount: 0, n: 0, status: 'paid', paidDate: '', accs: {}, inMonth: true });
    g.amount = r2(g.amount + (+e.amount || 0)); g.n++; const pd = __finExpDate208(e); if (pd > g.paidDate) g.paidDate = pd; if (e.accountId) g.accs[e.accountId] = 1;
  });
  Object.keys(grp).sort(function(a, b){ return a.localeCompare(b, 'tr'); }).forEach(function(k){ const g = grp[k]; const ks = Object.keys(g.accs); g.accountId = ks.length === 1 ? ks[0] : ''; g.multiAcc = ks.length > 1; delete g.accs; out.push(g); });
  // hoca ödemeleri: bu ay ödenenler dönem bazında (✓) + bu dönemin kalan hakedişi (⏳)
  const byP = {};
  (state.instructorPayouts || []).forEach(function(po){
    if (!po) return; const pd = __finPayoutDate208(po); if (!inM(pd)) return;
    const P = (po.year && po.month) ? po.year + '-' + String(po.month).padStart(2, '0') : String(pd).slice(0, 7);
    const g = byP[P] || (byP[P] = { id: 'hoca:' + P, kind: 'hoca', title: 'Hoca ödemeleri — ' + pkgMonthLabel(P) + ' dönemi', period: P, scope: 'studio', amount: 0, n: 0, status: 'paid', paidDate: '', other: P !== ay, inMonth: true });
    g.amount = r2(g.amount + (+po.amount || 0)); g.n++; if (pd > g.paidDate) g.paidDate = pd;
  });
  Object.keys(byP).sort().forEach(function(P){ out.push(byP[P]); });
  try {
    const open = finInstructorDues196().filter(function(x){ return x.ay === ay; });
    if (open.length) { const due = finMonthEnd196(ay); out.push({ id: 'hoca-open:' + ay, kind: 'hoca', title: 'Hoca hakedişleri — ' + pkgMonthLabel(ay) + ' (kalan, ' + open.length + ' hoca)', period: ay, scope: 'studio', amount: r2(open.reduce(function(a, x){ return a + (+x.amount || 0); }, 0)), n: open.length, status: due < today ? 'overdue' : 'open', dueDate: due, paidDate: '', other: false, inMonth: false }); }
  } catch(e) {}
  // üye tahsilatları (bu ay alınan) + bekleyen (bu ay ve öncesinin paketleri)
  S = S || finSummary208(ay);
  inc.push({ id: 'uye:' + ay, kind: 'uye', title: 'Üye tahsilatları (' + S.studio.uyeN + ' ödeme)', scope: 'studio', amount: S.studio.uye, status: 'paid', paidDate: '', dueDate: '', inMonth: true });
  try {
    const rc = finReceivables196().filter(function(r){ return String(r.ay) <= ay; });
    if (rc.length) inc.push({ id: 'uye-open:' + ay, kind: 'uye-open', title: 'Üyelerden bekleyen (' + rc.length + ' kalem)', scope: 'studio', amount: r2(rc.reduce(function(a, r){ return a + (+r.amount || 0); }, 0)), status: rc.some(function(r){ return r.overdue; }) ? 'overdue' : 'open', dueDate: '', paidDate: '', inMonth: false });
  } catch(e) {}
  const ord = function(x){ return x.kind === 'uye' ? 0 : (x.kind === 'uye-open' ? 1 : (x.kind === 'tpl' ? 2 : (x.kind === 'tax' ? 3 : (x.kind === 'bill' ? 4 : 5)))); };
  const srt = function(a, b){ return ord(a) - ord(b) || String(a.dueDate || a.paidDate || '').localeCompare(String(b.dueDate || b.paidDate || '')) || String(a.title).localeCompare(String(b.title), 'tr'); };
  inc.sort(srt); out.sort(srt);
  const tot = function(arr){ let paid = 0, open = 0; arr.forEach(function(x){ if (x.status === 'paid') { if (x.inMonth) paid += x.amount; } else if (x.status === 'open' || x.status === 'overdue') open += x.amount; }); return { paid: r2(paid), open: r2(open) }; };
  const ti = tot(inc), to = tot(out);
  return { ay: ay, inc: inc, out: out, incPaid: ti.paid, incOpen: ti.open, outPaid: to.paid, outOpen: to.open, otherOut: r2(S.toplam.gider - to.paid), totalOut: S.toplam.gider };
}
// Tablolar › Gelir–Gider — para esası (Özet ile aynı)
function finPlRows208(months) {
  const sums = months.map(function(ay){ return finSummary208(ay); }); const r2 = finR2_196; const tr = function(a, b){ return a.localeCompare(b, 'tr'); };
  const catsS = {}, catsE = {}, evInc = {};
  sums.forEach(function(x){ Object.keys(x.studio.cats).forEach(function(c){ catsS[c] = 1; }); Object.keys(x.ev.cats).forEach(function(c){ catsE[c] = 1; }); Object.keys(x.ev.gelirler).forEach(function(k){ evInc[k] = 1; }); });
  const rows = [];
  rows.push({ label: 'Üye tahsilatları (ödeme günü)', vals: sums.map(function(x){ return x.studio.uye; }), cls: '' });
  if (sums.some(function(x){ return x.studio.diger; })) rows.push({ label: 'Diğer gelir (stüdyo)', vals: sums.map(function(x){ return x.studio.diger; }), cls: '' });
  rows.push({ label: 'Hoca ödemeleri (ödendiği gün)', vals: sums.map(function(x){ return -x.studio.hoca; }), cls: '' });
  Object.keys(catsS).sort(tr).forEach(function(c){ rows.push({ label: 'Gider · ' + c, vals: sums.map(function(x){ return -(x.studio.cats[c] || 0); }), cls: '' }); });
  rows.push({ label: 'Stüdyo net', vals: sums.map(function(x){ return x.studio.net; }), cls: 'net' });
  Object.keys(evInc).sort(tr).forEach(function(k){ rows.push({ label: 'Ev geliri · ' + k, vals: sums.map(function(x){ return x.ev.gelirler[k] || 0; }), cls: '' }); });
  Object.keys(catsE).sort(tr).forEach(function(c){ rows.push({ label: 'Ev · ' + c, vals: sums.map(function(x){ return -(x.ev.cats[c] || 0); }), cls: '' }); });
  rows.push({ label: 'Ev net', vals: sums.map(function(x){ return x.ev.net; }), cls: 'net' });
  rows.push({ label: 'Toplam net (stüdyo + ev)', vals: sums.map(function(x){ return x.toplam.net; }), cls: 'net' });
  rows.push({ label: 'Devlet (resmi) kâr/zarar', vals: sums.map(function(x){ return x.devlet ? x.devlet.kar : null; }), cls: '' });
  rows.push({ label: 'Nakit değişimi (tüm nakit/banka hesapları, gerçekleşen)', vals: months.map(function(ay){ let d = 0; finMovements196().forEach(function(m){ if (String(m.date).slice(0, 7) !== ay) return; const a = finAccount196(m.accountId); if (!a || a.type === 'card') return; if (m.type === 'virman') return; d += m.dir * m.amount; }); return r2(d); }), cls: 'tot' });
  return rows;
}
// EKSTRE ↔ DÜZENLİ KALEM: aynı tutar (kuruşuna), vadeye ±10 gün, aynı kategori (vergi/prim kategorileri tek aile) ya da başlık sözcüğü; bire bir, en yakın
function __finNorm208(x) { return finTrUpper196(x).replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C').replace(/[^A-Z0-9]+/g, ' ').trim(); }
function finImportMatchRegular208(accountId, rows) {
  const r2 = finR2_196; const WIN = 10 * 86400000;
  const ms = function(d){ return /^\d{4}-\d{2}-\d{2}$/.test(String(d || '').slice(0, 10)) ? new Date(String(d).slice(0, 10) + 'T00:00:00').getTime() : NaN; };
  const fam = function(c){ return TAX_PAY_CATS.indexOf(c) !== -1 ? '#vergi' : String(c || ''); };
  const words = function(x){ return __finNorm208(x).split(' ').filter(function(w){ return w.length >= 4; }); };
  const expById = {}; (state.expenses || []).forEach(function(e){ if (e && e.id) expById[e.id] = e; });
  const tpl = (state.finDues || []).filter(function(d){ return d && d.templateId && d.dtype !== 'income' && (d.status === 'open' || d.status === 'paid'); });
  const used = {};
  return (rows || []).map(function(r){
    if (!r || r.dup || r.kind === 'payment' || r.credit) return null;
    const t0 = ms(r.date); if (!isFinite(t0)) return null;
    const amt = r2(r.amount); const rw = words(r.desc);
    let best = null, bestDiff = Infinity;
    tpl.forEach(function(d){
      if (used[d.id]) return;
      let pe = null;
      if (d.status === 'paid') { pe = d.paidRef && d.paidRef.type === 'expense' ? expById[d.paidRef.id] : null; if (!pe || pe.accountId === accountId) return; } // aynı kart: v207 mükerrer denetimi yakalar
      const dAmt = r2(d.status === 'paid' ? pe.amount : d.amount); if (Math.abs(dAmt - amt) >= 0.01) return;
      const ref = d.status === 'paid' ? __finExpDate208(pe) : String(d.dueDate || ''); const diff = Math.abs(ms(ref) - t0); if (!isFinite(diff) || diff > WIN) return;
      const catOk = fam(d.category) === fam(r.category);
      const wordOk = words(d.title).some(function(w){ return rw.some(function(x){ return x.indexOf(w.slice(0, 5)) === 0 || w.indexOf(x.slice(0, 5)) === 0; }); });
      if (!catOk && !wordOk) return;
      if (diff < bestDiff) { best = d; bestDiff = diff; }
    });
    if (!best) return null; used[best.id] = 1;
    return best.status === 'open' ? { regDueId: best.id } : { regPaidId: best.id };
  });
}
// AÇIK DÜZENLİ KALEM ↔ BAĞSIZ ÖDENMİŞ GİDER: kalem elle (Giderler formundan) ya da eski bir ekstreyle ödenmişse vade açık kalır, "Öde" ikinci
// gider yazardı → "olası ödeme" gösterilir, Bağla ile o gidere bağlanır (yeni gider YAZILMAZ). Aynı tutar, vadeye ±10 gün, aynı kapsam,
// aynı kategori (vergi/prim kategorileri tek aile) ya da başlık sözcüğü; en yakın gün.
function finDueCandidate208(d) {
  if (!d || d.status !== 'open' || !d.templateId || d.dtype === 'income' || d.dtype === 'card') return null;
  const ms = function(x){ return /^\d{4}-\d{2}-\d{2}$/.test(String(x || '').slice(0, 10)) ? new Date(String(x).slice(0, 10) + 'T00:00:00').getTime() : NaN; };
  const t0 = ms(d.dueDate); if (!isFinite(t0)) return null;
  const fam = function(c){ return TAX_PAY_CATS.indexOf(c) !== -1 ? '#vergi' : String(c || ''); };
  const words = function(x){ return __finNorm208(x).split(' ').filter(function(w){ return w.length >= 4; }); };
  const linked = {}; (state.finDues || []).forEach(function(x){ if (x && x.paidRef && x.paidRef.type === 'expense') linked[x.paidRef.id] = 1; });
  const sc = d.scope === 'hane' ? 'hane' : 'studio'; const tw = words(d.title); const amt = finR2_196(d.amount);
  let best = null, bestDiff = Infinity;
  (state.expenses || []).forEach(function(e){
    if (!e || e.dueId || linked[e.id] || e.status === 'open' || __finIsMaas208(e)) return;
    if (Math.abs(finR2_196(e.amount) - amt) >= 0.01 || finExpScope200(e) !== sc) return;
    const diff = Math.abs(ms(__finExpDate208(e)) - t0); if (!isFinite(diff) || diff > 10 * 86400000) return;
    const ew = words((e.note || '') + ' ' + (e.category || ''));
    if (fam(e.category) !== fam(d.category) && !tw.some(function(w){ return ew.some(function(x){ return x.indexOf(w.slice(0, 5)) === 0 || w.indexOf(x.slice(0, 5)) === 0; }); })) return;
    if (diff < bestDiff) { best = e; bestDiff = diff; }
  });
  return best;
}
function finLinkDue208(dueId, expId) {
  const d = (state.finDues || []).find(function(x){ return x && x.id === dueId; }); const e = (state.expenses || []).find(function(x){ return x && x.id === expId; });
  if (!d || d.status !== 'open' || !e || e.dueId) return false;
  __undoSnapshot('Düzenli kalem bağla: ' + (d.title || ''));
  e.dueId = d.id; d.status = 'paid'; d.paidRef = { type: 'expense', id: e.id }; d.paidDate = __finExpDate208(e); d.paidAmount = finR2_196(e.amount);
  save(); try { __refreshUIInPlace(); } catch(err) {}
  if (window.plToast) plToast('↔ ' + (d.title || '') + ' ödemesine bağlandı — yeni gider yazılmadı');
  return true;
}
function finImportRegBadge208(r, i) {
  if (!r) return '';
  if (r.regDueId) { const d = (state.finDues || []).find(function(x){ return x && x.id === r.regDueId; }); if (!d) return ''; return ' <label class="fin-note" style="display:inline-flex;gap:4px;align-items:center;margin:0;" title="Bu satır düzenli kalemin ödemesi: vadesi kapanır, kategori/kapsam/faturalı bilgisi şablondan"><input type="checkbox" ' + (r.regOff ? '' : 'checked') + ' onchange="__finImp196.rows[' + i + '].regOff=!this.checked; finImportRenderPreview196()"> ↔ düzenli: ' + escapeHtml(d.title) + ' (' + fmtDate(d.dueDate) + ')</label>'; }
  if (r.regPaidId) { const d = (state.finDues || []).find(function(x){ return x && x.id === r.regPaidId; }); if (!d) return ''; const e = d.paidRef && d.paidRef.type === 'expense' ? (state.expenses || []).find(function(x){ return x && x.id === d.paidRef.id; }) : null; return ' <span class="badge" style="background:#FFF3E0;color:#7a4a00;" title="Bu düzenli kalem başka hesaptan ödendi olarak kayıtlı — aynı ödemeyse işaretsiz bırak (çift sayılmaz)">⚠️ zaten ödendi: ' + escapeHtml(d.title) + (d.paidDate ? ' · ' + fmtDate(d.paidDate) : '') + (e && e.accountId ? ' · ' + escapeHtml(finAccountLabel196(e.accountId)) : '') + '</span>'; }
  return '';
}
// ─────────── EKRAN: 📊 ÖZET ───────────
let __finOzetAy208 = '';
function finOzetMonth208() { const cur = currentMonth(); const max = finMonthAdd196(cur, 1); let m = /^\d{4}-\d{2}$/.test(__finOzetAy208) ? __finOzetAy208 : cur; const fs = finStartMonth196(); if (fs && m < fs) m = fs; if (m > max) m = max; return m; }
function finOzetSet208(v) { if (/^\d{4}-\d{2}$/.test(String(v || ''))) { __finOzetAy208 = String(v); renderFinOzet208(); } }
function finOzetShift208(k) { __finOzetAy208 = finMonthAdd196(finOzetMonth208(), +k || 0); renderFinOzet208(); }
function finToggleMore208() { const t = document.getElementById('fin-tabs'); if (!t) return; const on = !t.classList.contains('more'); t.classList.toggle('more', on); const b = t.querySelector('.fin-more-btn'); if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false'); }
function finMoneyHtml208(M) {
  const fx = M.fx; const fxTxt = function(u, e){ const p = []; if (u !== null && u !== undefined) p.push('≈ ' + money(u) + ' $'); if (e !== null && e !== undefined) p.push('≈ ' + money(e) + ' €'); return p.join(' · '); };
  let h = '<div class="fo-head"><h2>💰 Param <small class="fin-note">bugün</small></h2><button class="btn small secondary" onclick="openFinFxModal208()" title="≈ $ / ≈ € karşılığı için kur">💱 Kur</button></div>';
  if (!finActive196()) return h + '<div class="fin-warn">Hesaplar henüz açılmadı — 🏦 Hesaplar sekmesinden Kasa ve Banka için başlangıç tarihi ve bakiyesini gir; toplam param burada görünür.</div>';
  h += '<div class="fin-bal">' + M.accounts.map(function(a){ return '<span class="chip' + (a.bal !== null && a.bal < 0 ? ' neg' : '') + '">' + escapeHtml(a.label) + ': <b>' + (a.bal === null ? 'açılış yok' : money(a.bal) + ' ₺') + '</b></span>'; }).join('') +
    M.cards.map(function(c){ return '<span class="chip' + (c.bal < 0 ? ' neg' : '') + '">' + escapeHtml(c.label) + ': <b>' + (c.bal < 0 ? 'borç ' + money(-c.bal) : money(c.bal)) + ' ₺</b></span>'; }).join('') + '</div>';
  h += '<div class="fo-tot"><div class="main"><div class="lbl">Toplam param (kasa + banka)</div><div class="big">' + money(M.cash) + ' ₺</div><div class="fx">' + (fx ? fxTxt(M.usd, M.eur) : '<a href="#" onclick="openFinFxModal208(); return false;">≈ $ / € için kur gir</a>') + '</div></div>' +
    '<div><div class="lbl">💳 Kart borcu</div><div class="big' + (M.debt > 0 ? ' neg' : '') + '">' + (M.debt > 0 ? '−' : '') + money(M.debt) + ' ₺</div>' + (M.credit > 0 ? '<div class="fx">kartta artı ' + money(M.credit) + ' ₺</div>' : '') + '</div>' +
    '<div><div class="lbl">Net varlık (para − kart borcu)</div><div class="big' + (M.net < 0 ? ' neg' : '') + '">' + money(M.net) + ' ₺</div><div class="fx">' + (fx ? fxTxt(M.netUsd, M.netEur) : '') + '</div></div></div>';
  if (fx) { const age = /^\d{4}-\d{2}-\d{2}$/.test(fx.date) ? Math.round((parseISO(todayISO()) - parseISO(fx.date)) / 86400000) : null; h += '<div class="fin-note">Kur' + (fx.date ? ' (' + fmtDate(fx.date) + ')' : '') + ': ' + (fx.usd ? '1 $ = ' + money(fx.usd) + ' ₺' : '') + (fx.usd && fx.eur ? ' · ' : '') + (fx.eur ? '1 € = ' + money(fx.eur) + ' ₺' : '') + (age !== null && age > 7 ? ' · <b style="color:var(--warn)">' + age + ' günlük — 💱 Kur ile güncelle</b>' : '') + '</div>'; }
  if (M.missing.length) h += '<div class="fin-warn">⚠️ ' + M.missing.map(function(a){ return escapeHtml(a.label); }).join(', ') + ' için açılış bakiyesi girilmedi — toplamda yok. <a href="#" onclick="finSwitchTab196(\'accounts\'); return false;">🏦 Hesaplar\'da gir →</a></div>';
  return h;
}
function finOzetPlHtml208(S, opt) {
  opt = opt || {}; const D = S.devlet, st = S.studio, ev = S.ev;
  let h = '<div class="fo-pl"><div class="fo-head"><h3>📅 ' + escapeHtml(__finAyLbl208(S.ay)) + ' — NET KÂR / ZARAR</h3>' +
    (opt.nav ? '<div class="fo-nav"><button class="btn small secondary" onclick="finOzetShift208(-1)" title="Önceki ay">◀</button><input type="month" id="fo-month" value="' + S.ay + '" onchange="finOzetSet208(this.value)"><button class="btn small secondary" onclick="finOzetShift208(1)" title="Sonraki ay">▶</button></div>' :
      (opt.link ? '<button class="btn small secondary no-print" onclick="switchPage(\'payments\'); finSwitchTab196(\'ozet\'); finOzetSet208(\'' + S.ay + '\')">Finans › Özet →</button>' : '')) + '</div>';
  h += '<table class="fo-pl-t"><thead><tr><th></th><th>💰 Reelde<small>stüdyo · para esası</small></th><th>🏛️ Devlette<small>resmi defter · ' + (D && D.elle ? 'muhasebeci' : 'tahmini') + '</small></th></tr></thead><tbody>' +
    '<tr><td>Gelir</td><td>' + money(st.gelir) + ' ₺<small>' + st.uyeN + ' üye ödemesi' + (st.diger ? ' + diğer ' + money(st.diger) : '') + '</small></td><td>' + (D ? money(D.netGelir) + ' ₺<small>İBAN+POS ' + money(D.gelir) + ' − KDV ' + money(D.kdv) + '</small>' : '—') + '</td></tr>' +
    '<tr><td>Gider</td><td>−' + money(st.cikan) + ' ₺<small>hoca ' + money(st.hoca) + ' · gider ' + money(st.gider) + (st.maas ? " · +" + money(st.maas) + " ₺ maaş kaydı — Hoca Ödemeleri'nde sayılır" : '') + '</small></td><td>' + (D ? '−' + money(D.gider) + ' ₺<small>faturalı + bordro + vergi</small>' : '—') + '</td></tr>' +
    '<tr class="net"><td>Net</td><td class="' + __finCls208(st.net) + '">' + __finSg208(st.net) + ' ₺</td><td class="' + (D ? __finCls208(D.kar) : '') + '">' + (D ? __finSg208(D.kar) + ' ₺' : '—') + '</td></tr></tbody></table>';
  h += '<div class="fo-ev">🏠 Ev: gelir ' + money(ev.gelir) + ' − ev giderleri ' + money(ev.gider) + ' = <b class="' + __finCls208(ev.net) + '">' + __finSg208(ev.net) + ' ₺</b> · <b>Toplam (stüdyo + ev): <span class="' + __finCls208(S.toplam.net) + '">' + __finSg208(S.toplam.net) + ' ₺</span></b></div>';
  if (D) h += '<div class="fin-note">🏛️ Ödenecek KDV <b>' + money(D.odenecekKdv) + ' ₺</b>' + (D.devredenKdv ? ' (devreden ' + money(D.devredenKdv) + ')' : '') + ' · yıl içi ' + (D.devredenZarar > 0 ? 'devreden zarar <b>' + money(D.devredenZarar) + ' ₺</b> → gelir vergisi çıkmaz' : 'matrah <b>' + money(D.yilIci) + ' ₺</b> → tahmini gelir vergisi <b>' + money(D.vergi) + ' ₺</b>') + ' · reel − devlet farkı <b>' + __finSg208(S.fark) + ' ₺</b></div>';
  return h + '</div>';
}
function __finCatsHtml208(S) {
  const rows = function(cats){ return Object.keys(cats).filter(function(c){ return Math.abs(cats[c]) >= 0.005; }).sort(function(a, b){ return cats[b] - cats[a]; }).map(function(c){ return '<div class="fin-row"><span class="t">' + escapeHtml(c) + '</span><span class="a">' + money(cats[c]) + ' ₺</span></div>'; }).join(''); };
  const sh = rows(S.studio.cats), eh = rows(S.ev.cats);
  if (!sh && !eh && !S.studio.hoca) return '';
  return '<details class="fo-cats"><summary>Gider dağılımı (kategori)</summary><div class="fo-reg" style="margin-top:6px;"><div><h3>Stüdyo</h3>' + (S.studio.hoca ? '<div class="fin-row"><span class="t">Hoca ödemeleri</span><span class="a">' + money(S.studio.hoca) + ' ₺</span></div>' : '') + (sh || (S.studio.hoca ? '' : '<div class="fin-note">—</div>')) + '</div><div><h3>🏠 Ev</h3>' + (eh || '<div class="fin-note">—</div>') + '</div></div></details>';
}
function finCheckHtml208(ay) {
  let C = null; try { C = finCheck208(ay); } catch(e) { C = null; }
  if (!C) return '';
  if (!C.ready) { const nx = C.from ? (String(C.from).slice(8, 10) === '01' ? String(C.from).slice(0, 7) : finMonthAdd196(String(C.from).slice(0, 7), 1)) : ''; return '<div class="fin-note">🔎 Para kontrolü (hesaplardaki değişim = kâr/zarar) ' + (C.missing ? 'açılış bakiyesi eksik hesap girilince' : (nx ? escapeHtml(__finAyLbl208(nx)) + ' ayından itibaren' : 'hesaplar açılınca')) + ' çalışır.</div>'; }
  if (Math.abs(C.diff) < 1) return '<div class="fin-note">✓ Para kontrolü: hesaplardaki değişim <b>' + __finSg208(C.actual) + ' ₺</b> = kâr/zarar' + (C.other ? ' + sermaye/çekim/düzeltme' : '') + ' — kayıtlar tam.</div>';
  return '<div class="fin-warn">🔎 Para kontrolü: hesaplardaki değişim ' + __finSg208(C.actual) + ' ₺, kâr/zarar' + (C.other ? ' + sermaye/çekim/düzeltme' : '') + ' ' + __finSg208(C.expected) + ' ₺ — fark <b>' + __finSg208(C.diff) + ' ₺</b>' + (C.unassigned ? ' (' + C.unassigned + ' hesapsız hareket — Hareketler sekmesinde)' : ' — eksik ya da hesapsız kayıt olabilir') + '.</div>';
}
function __finRegTitle208(x) { const T = { 'Stopaj': 'Muhtasar (stopaj)', 'Bağkur': 'Bağ-Kur', 'KDV Ödemesi': 'KDV', 'Vergi/SGK': 'SGK / vergi', 'Elektrik/Su/Doğalgaz': 'Elektrik / su / doğalgaz', 'Abonelik/İletişim': 'Telefon / internet / abonelik' }; if (x.kind === 'tax') return 'Vergi · ' + (T[x.title] || x.title); if (x.kind === 'bill') return 'Fatura · ' + (T[x.title] || x.title); return x.title; }
function __finRegRowHtml208(x) {
  const ico = x.status === 'paid' ? '✓' : (x.status === 'overdue' ? '⚠️' : (x.status === 'skipped' ? '—' : '⏳'));
  const cls = x.status === 'paid' ? 'ok' : (x.status === 'overdue' ? 'bad' : (x.status === 'skipped' ? '' : 'wait'));
  const dt = x.status === 'paid' ? (x.paidDate ? fmtShort(x.paidDate) : '') : (x.dueDate ? fmtShort(x.dueDate) : '');
  const sub = [];
  if (x.scope === 'hane') sub.push('🏠 ev');
  if (x.kind === 'tax' || x.kind === 'bill') sub.push(x.n + ' ödeme' + (x.accountId ? ' · ' + finAccountLabel196(x.accountId) : (x.multiAcc ? ' · birden çok hesap' : '')));
  else if (x.accountId) sub.push(finAccountLabel196(x.accountId));
  if (x.kind === 'tpl' && x.other) sub.push(pkgMonthLabel(x.period) + ' dönemi');
  if (x.status === 'paid' && x.inMonth === false) sub.push('başka ayda ödendi');
  if (x.status === 'skipped') sub.push('atlandı');
  const cand = x.cand ? '<span class="cand">↔ olası ödeme: ' + escapeHtml(fmtShort(x.cand.date)) + (x.cand.accountId ? ' · ' + escapeHtml(finAccountLabel196(x.cand.accountId)) : '') + ' <button class="btn small secondary" onclick="finLinkDue208(\'' + x.id + '\', \'' + x.cand.id + '\')" title="Bu kalem zaten ödenmiş görünüyor — o ödemeye bağla (yeni gider yazılmaz)">Bağla</button></span>' : '';
  return '<div class="fo-row' + (x.status === 'overdue' ? ' overdue' : '') + (x.status === 'skipped' ? ' est' : '') + '"><span class="st ' + cls + '">' + ico + ' ' + escapeHtml(dt) + '</span><span class="t">' + escapeHtml(__finRegTitle208(x)) + (sub.length ? '<small style="color:var(--muted)"> · ' + escapeHtml(sub.join(' · ')) + '</small>' : '') + '</span><span class="a">' + money(x.amount) + ' ₺</span>' + cand + '</div>';
}
function finRegularHtml208(R) {
  const col = function(title, arr, paid, open, lp, lo){ return '<div><h3>' + title + '</h3>' + (arr.length ? arr.map(__finRegRowHtml208).join('') : '<div class="fin-note">Kalem yok.</div>') + '<div class="fin-tot">' + lp + ' <b>' + money(paid) + ' ₺</b>' + (open ? ' · ' + lo + ' <b>' + money(open) + ' ₺</b>' : '') + '</div></div>'; };
  return '<div class="fin-sec">🔁 Düzenli gelir &amp; gider — ' + escapeHtml(__finAyLbl208(R.ay)) + ' <small class="fin-note">✓ ödendi · ⏳ bekliyor · ⚠️ gecikti</small></div>' +
    '<div class="fo-reg">' + col('📥 Gelir', R.inc, R.incPaid, R.incOpen, 'bu ay alınan', 'bekleyen') + col('📤 Gider', R.out, R.outPaid, R.outOpen, 'bu ay ödenen', 'bekleyen') + '</div>' +
    '<div class="fin-note">Bu ay çıkan toplam <b>' + money(R.totalOut) + ' ₺</b> = düzenli ' + money(R.outPaid) + ' + diğer (market, giyim, malzeme, ulaşım…) ' + money(R.otherOut) + ' ₺. Karttan ödenen vergi ve faturalar ekstre yüklenince buraya kendiliğinden düşer. <a href="#" onclick="finSwitchTab196(\'dues\'); return false;">Şablonlar →</a></div>';
}
function finOzetTableHtml208(ay) {
  const fs = finStartMonth196(); const months = [];
  for (let i = 5; i >= 0; i--) { const m = finMonthAdd196(ay, -i); if (fs && m < fs) continue; months.push(m); }
  if (!months.length) return '';
  const body = months.map(function(m){ const x = finSummary208(m); return '<tr' + (m === ay ? ' class="net"' : '') + '><td>' + escapeHtml(__shortMonth(m) + ' ' + m.slice(2, 4)) + '</td><td class="n fo-s">' + money(x.toplam.gelir) + '</td><td class="n fo-s">' + money(x.toplam.gider) + '</td><td class="n ' + __finCls208(x.studio.net) + '">' + __finSg208(x.studio.net) + '</td><td class="n ' + __finCls208(x.ev.net) + '">' + __finSg208(x.ev.net) + '</td><td class="n ' + __finCls208(x.toplam.net) + '"><b>' + __finSg208(x.toplam.net) + '</b></td><td class="n">' + (x.devlet ? __finSg208(x.devlet.kar) : '—') + '</td></tr>'; }).join('');
  return '<div class="fin-sec">📈 Son ' + months.length + ' ay <small class="fin-note">para esası · ₺ · ayrıntı: ⋯ Diğer › Tablolar</small></div><div class="table-wrap"><table class="fin-rep-table fo-6"><thead><tr><th>Ay</th><th class="n fo-s">Giren</th><th class="n fo-s">Çıkan</th><th class="n">Stüdyo</th><th class="n">Ev</th><th class="n">Toplam</th><th class="n">Devlet</th></tr></thead><tbody>' + body + '</tbody></table></div>';
}
function renderFinOzet208() {
  const el = document.getElementById('fin-ozet-body'); if (!el) return;
  try { finEnsureTemplateDues196(); } catch(e) {}
  const ay = finOzetMonth208(); __finOzetAy208 = ay;
  const S = finSummary208(ay), M = finMoney208(), R = finRegular208(ay, S);
  el.innerHTML = finMoneyHtml208(M) +
    '<div class="fin-sec"></div>' + finOzetPlHtml208(S, { nav: true }) + __finCatsHtml208(S) + finCheckHtml208(ay) +
    finRegularHtml208(R) + finOzetTableHtml208(ay) +
    '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px;"><button class="btn small" onclick="openFinImportModal196()">📄 Kart ekstresi yükle</button><button class="btn small secondary" onclick="openPaymentModal()">+ Ödeme kaydet</button><button class="btn small secondary" onclick="finSwitchTab196(\'moves\'); setTimeout(function(){ const d = document.getElementById(\'expenses-card\'); if (d) { d.open = true; try { d.scrollIntoView({ block: \'start\' }); } catch(e) {} } }, 60);">💸 Gider ekle</button><button class="btn small secondary" onclick="finSwitchTab196(\'dues\')">⏰ Düzenli kalemler</button></div>';
  try { renderTaxLedger(ay); } catch(e) {}
}
"""
rep("""// ═══════════════════════ v196 ADIM 4 — KART EKSTRESİ OKUYUCU ═══════════════════════""",
    CORE + """// ═══════════════════════ v196 ADIM 4 — KART EKSTRESİ OKUYUCU ═══════════════════════""")

io.open(P, 'w', encoding='utf-8').write(s)

# ── sw.js
W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v207-2026-10-19-130';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v207-2026-10-19-130';", "const CACHE_NAME = 'pilateria-v208-2026-10-20-131';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v208 OK')
