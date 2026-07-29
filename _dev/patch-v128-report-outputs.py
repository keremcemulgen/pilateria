# -*- coding: utf-8 -*-
# v128 — RAPOR CIKTILARI: CSV disa aktarim + yazdirilabilir aylik rapor + odeme makbuzu + 12 aylik trend grafigi
#  6) CSV (TR Excel uyumlu: sep=; + BOM + CRLF) — tahsilat / uye / gider
#     Yazdir/PDF: @media print (yalniz aktif sayfa, nav/butonlar gizli) + rapor sayfasinda dugme
# 10) Makbuz: odeme satirindan yazdirilabilir tahsilat/iade makbuzu (TC + adres alanlari NIHAYET kullaniliyor)
#  8) Trend: son 12 ay tahsilat + net kar cubuk grafigi (inline SVG, tek eksen, hover tooltip,
#     palet dataviz dogrulayicisindan gecti: acik #1565C0/#2E7D32, koyu #4A90D9/#43A047)
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) print CSS + grafik renk degiskenleri ----------
rep("""</head>""",
"""<style id="pl-print-css">
  :root { --tc-rev:#1565C0; --tc-net:#2E7D32; }
  [data-theme="dark"] { --tc-rev:#4A90D9; --tc-net:#43A047; }
  @media (prefers-color-scheme:dark){ :root:not([data-theme="light"]) { --tc-rev:#4A90D9; --tc-net:#43A047; } }
  #print-receipt { display:none; }
  @media print {
    #tabs, .bnav, .bnav-item, .toolbar, .btn, .no-print, #cloud-dot, .modal-bg, nav { display:none !important; }
    body { background:#fff !important; }
    .page { display:none !important; }
    .page.active { display:block !important; }
    .card { box-shadow:none !important; border:1px solid #ddd !important; }
    body.pl-print-receipt > *:not(#print-receipt) { display:none !important; }
    body.pl-print-receipt #print-receipt { display:block !important; }
  }
</style>
</head>""")

# ---------- 2) rapor sayfasi dugmeleri ----------
rep("""<input type="month" id="rep-month">""",
"""<input type="month" id="rep-month">
      <button class="btn small secondary no-print" onclick="try{window.print()}catch(e){}" title="Aylık raporu yazdır ya da PDF olarak kaydet">🖨️ Yazdır / PDF</button>
      <button class="btn small secondary no-print" onclick="exportPaymentsCsv()">⬇️ Tahsilat CSV</button>
      <button class="btn small secondary no-print" onclick="exportMembersCsv()">⬇️ Üye CSV</button>
      <button class="btn small secondary no-print" onclick="exportExpensesCsv()">⬇️ Gider CSV</button>""")

# ---------- 3) trend kutusu ----------
rep("""    <div id="net-profit-panel" style="margin:10px 0;"></div>
""",
"""    <div id="net-profit-panel" style="margin:10px 0;"></div>
    <div id="trend-chart" style="margin:10px 0;"></div>
""")

rep("""  })();
  document.getElementById('tax-panel').innerHTML = `""",
"""  })();
  try { renderTrendChart(m); } catch(e) {} // v128
  document.getElementById('tax-panel').innerHTML = `""")

# ---------- 4) odeme satirina makbuz dugmesi ----------
rep("""      <td class="card-actions"><button class="btn small secondary" onclick="openPaymentModal('${p.memberId}','${p.id}')">Düzenle</button></td>
""",
"""      <td class="card-actions"><button class="btn small secondary no-print" onclick="printReceipt('${p.id}')" title="Yazdırılabilir makbuz">🧾</button> <button class="btn small secondary" onclick="openPaymentModal('${p.memberId}','${p.id}')">Düzenle</button></td>
""")

# ---------- 5) JS: CSV + makbuz + trend ----------
rep("""// ===== v127: GIDER TAKIBI =====""",
"""// ===== v128: RAPOR CIKTILARI (CSV + yazdir + makbuz + trend) =====
function __csvText(rows) {
  const esc = function(v) { const t = String(v == null ? '' : v); return /[;"\\n\\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  return 'sep=;\\r\\n' + rows.map(function(r) { return r.map(esc).join(';'); }).join('\\r\\n');
}
function __dlCsv(filename, rows) {
  try {
    const blob = new Blob(['\\ufeff' + __csvText(rows)], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function() { try { URL.revokeObjectURL(a.href); a.remove(); } catch(e) {} }, 800);
    if (window.plToast) plToast('⬇️ ' + filename);
  } catch(e) { alert('CSV indirilemedi: ' + (e && e.message || e)); }
}
function __csvNum(n) { return String(+n || 0).replace('.', ','); }
function buildPaymentsCsvRows(ay) {
  const rows = [['Tarih','Üye','Grup','Paket Ayı','Tutar (₺)','Yöntem','Kampanya','Tür','Not']];
  (state.payments||[]).filter(function(p) { return (p.packageMonth || (p.date ? String(p.date).slice(0,7) : '')) === ay; })
    .slice().sort(function(a,b) { return String(a.date).localeCompare(String(b.date)); })
    .forEach(function(p) {
      const g = p.groupId ? ((state.groups.find(function(x){return x.id===p.groupId;})||{}).name || '') : '';
      rows.push([p.date, memberName(p.memberId), g, p.packageMonth || '', __csvNum(p.amount), p.method||'', p.campaignName||'', ((+p.amount < 0) || p.refund) ? 'İADE' : 'Tahsilat', p.note||'']);
    });
  return rows;
}
function buildMembersCsvRows(ay) {
  const rows = [['Ad Soyad','Telefon','Kayıt','Doğum Günü','Aylık Fiyat (₺)','Ödenen (₺)','Kalan (₺)','Grup']];
  (state.members||[]).filter(function(m) { return m && !m.archived; })
    .slice().sort(function(a,b) { return (a.name||'').localeCompare(b.name||'','tr'); })
    .forEach(function(m) {
      const g = memberActiveGroupForMonth(m.id, ay);
      const defined = +memberMonthlyTotalPrice(m.id, ay) || 0;
      const paid = memberPaidTowardsMonth(m.id, g ? g.id : '', ay);
      rows.push([m.name, m.phone||'', m.joinDate||'', m.birthday||'', __csvNum(defined), __csvNum(paid), __csvNum(Math.max(0, Math.round((defined - paid) * 100) / 100)), g ? (g.name||'') : '']);
    });
  return rows;
}
function buildExpensesCsvRows(ay) {
  const rows = [['Tarih','Kategori','Tutar (₺)','Not']];
  expensesForMonth(ay).slice().sort(function(a,b) { return String(a.date).localeCompare(String(b.date)); })
    .forEach(function(e) { rows.push([e.date, e.category||'', __csvNum(e.amount), e.note||'']); });
  return rows;
}
function exportPaymentsCsv() { const ay = document.getElementById('rep-month').value || currentMonth(); __dlCsv('pilateria-tahsilat-' + ay + '.csv', buildPaymentsCsvRows(ay)); }
function exportMembersCsv() { const ay = document.getElementById('rep-month').value || currentMonth(); __dlCsv('pilateria-uyeler-' + ay + '.csv', buildMembersCsvRows(ay)); }
function exportExpensesCsv() { const ay = document.getElementById('rep-month').value || currentMonth(); __dlCsv('pilateria-giderler-' + ay + '.csv', buildExpensesCsvRows(ay)); }
// ---- makbuz (TC + adres burada kullanilir; makbuz resmi fatura DEGILDIR) ----
function printReceipt(payId) {
  const p = (state.payments||[]).find(function(x) { return x.id === payId; });
  if (!p) { alert('Ödeme bulunamadı.'); return; }
  const m = state.members.find(function(x) { return x.id === p.memberId; }) || {};
  const isIade = (+p.amount < 0) || p.refund;
  let el = document.getElementById('print-receipt');
  if (!el) { el = document.createElement('div'); el.id = 'print-receipt'; document.body.appendChild(el); }
  el.innerHTML = `
    <div style="max-width:640px;margin:0 auto;padding:24px;color:#111;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #111;padding-bottom:8px;">
        <div style="font-size:22px;font-weight:800;">PİLATERİA</div>
        <div style="font-size:15px;font-weight:700;">${isIade ? 'İADE MAKBUZU' : 'TAHSİLAT MAKBUZU'}</div>
      </div>
      <table style="width:100%;margin-top:14px;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:5px 0;color:#555;width:160px;">Tarih</td><td><b>${fmtDate(p.date)}</b></td></tr>
        <tr><td style="padding:5px 0;color:#555;">Üye</td><td><b>${escapeHtml(m.name || '')}</b></td></tr>
        ${m.tcno ? `<tr><td style="padding:5px 0;color:#555;">TC Kimlik No</td><td>${escapeHtml(m.tcno)}</td></tr>` : ''}
        ${m.adres ? `<tr><td style="padding:5px 0;color:#555;">Adres</td><td>${escapeHtml(m.adres)}</td></tr>` : ''}
        <tr><td style="padding:5px 0;color:#555;">Paket Ayı</td><td>${escapeHtml(p.packageMonth || String(p.date||'').slice(0,7))}</td></tr>
        <tr><td style="padding:5px 0;color:#555;">Açıklama</td><td>${escapeHtml(paymentPkgLabel(p))}${p.note ? ' — ' + escapeHtml(p.note) : ''}</td></tr>
        <tr><td style="padding:5px 0;color:#555;">Yöntem</td><td>${escapeHtml(p.method || '')}</td></tr>
        <tr><td style="padding:8px 0;color:#555;font-size:16px;">Tutar</td><td style="font-size:20px;font-weight:800;">${money(Math.abs(+p.amount || 0))} ₺${isIade ? ' (İADE)' : ''}</td></tr>
      </table>
      <div style="display:flex;justify-content:space-between;margin-top:48px;font-size:13px;color:#333;">
        <div>Teslim Eden<br><br>____________________</div>
        <div>Teslim Alan<br><br>____________________</div>
      </div>
      <div style="margin-top:18px;font-size:11px;color:#777;">Bu makbuz PİLATERİA stüdyo yönetim uygulamasından ${fmtDate(todayISO())} tarihinde oluşturulmuştur; resmî fatura yerine geçmez.</div>
    </div>`;
  document.body.classList.add('pl-print-receipt');
  const done = function() { document.body.classList.remove('pl-print-receipt'); try { window.removeEventListener('afterprint', done); } catch(e) {} };
  try { window.addEventListener('afterprint', done); } catch(e) {}
  try { window.print(); } catch(e) {}
  setTimeout(done, 4000);
}
// ---- son 12 ay trend (tek eksen; palet acik/koyu ayri dogrulandi — dataviz validate_palette PASS) ----
function renderTrendChart(anchorAy) {
  const el = document.getElementById('trend-chart');
  if (!el) return;
  const pr = String(anchorAy || currentMonth()).split('-').map(Number);
  const months = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(pr[0], pr[1] - 1 - i, 1); months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); }
  const data = months.map(function(ay) { const n = netProfitForMonth(ay); return { ay: ay, rev: n.rev, net: n.net }; });
  if (!data.some(function(d) { return d.rev || d.net; })) { el.innerHTML = ''; return; }
  const W = 660, H = 190, padL = 8, padR = 8, padT = 14, padB = 22;
  const maxV = Math.max(1, ...data.map(function(d) { return Math.max(d.rev, d.net, 0); }));
  const minV = Math.min(0, ...data.map(function(d) { return Math.min(d.net, 0); }));
  const span = (maxV - minV) || 1;
  const y = function(v) { return padT + (maxV - v) / span * (H - padT - padB); };
  const y0 = y(0);
  const gw = (W - padL - padR) / 12;
  const bw = Math.min(14, (gw - 8) / 2);
  const TR_AY = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  let bars = '';
  data.forEach(function(d2, i) {
    const x0 = padL + i * gw + (gw - 2 * bw - 2) / 2;
    const hR = Math.abs(y(d2.rev) - y0), hN = Math.abs(y(d2.net) - y0);
    const yR = d2.rev >= 0 ? y(d2.rev) : y0, yN = d2.net >= 0 ? y(d2.net) : y0;
    const mL = TR_AY[+d2.ay.slice(5) - 1] || d2.ay.slice(5);
    bars += `<g><title>${d2.ay} — Tahsilat: ${money(d2.rev)} ₺ · Net kâr: ${money(d2.net)} ₺</title>
      <rect x="${x0}" y="${yR}" width="${bw}" height="${Math.max(1, hR)}" rx="2" fill="var(--tc-rev)"></rect>
      <rect x="${x0 + bw + 2}" y="${yN}" width="${bw}" height="${Math.max(1, hN)}" rx="2" fill="var(--tc-net)"></rect>
      <text x="${x0 + bw + 1}" y="${H - 6}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${mL}</text></g>`;
  });
  el.innerHTML = `<h3 style="margin:4px 0 6px;">📈 Son 12 Ay</h3>
    <div style="display:flex;gap:14px;font-size:12px;margin-bottom:4px;">
      <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--tc-rev);margin-right:4px;"></span>Tahsilat</span>
      <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--tc-net);margin-right:4px;"></span>Net Kâr</span>
    </div>
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;" role="img" aria-label="Son 12 ay tahsilat ve net kâr grafiği">
      <line x1="${padL}" y1="${y0}" x2="${W - padR}" y2="${y0}" stroke="var(--border)" stroke-width="1"></line>
      ${bars}
    </svg>`;
}
// ===== v127: GIDER TAKIBI =====""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.29.50">', '<meta name="app-version" content="2026.07.29.51">')
rep("const APP_VERSION = '2026.07.29.50';", "const APP_VERSION = '2026.07.29.51';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v127-2026-07-29-50';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v128-2026-07-29-51';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
