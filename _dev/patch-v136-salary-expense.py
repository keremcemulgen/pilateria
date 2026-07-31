# -*- coding: utf-8 -*-
# v136 — HOCA MAASINI GIDERE YAZ (Kerem 2026-07-31): kisi bazli, istege bagli, SGK dugmesi gibi.
# KRITIK MUHASEBE KARARI: netProfitForMonth ZATEN Hoca Odemeleri'ni (payout kayitlari) ayrica
# dusuyor. Maas gidere de yazilinca CIFT SAYIM olmamasi icin [MAAS-OTO-...] isaretli gider
# kayitlari net kar formulunun 'exp' bileseninden HARIC tutulur; gider LISTESI ve CSV tam kalir.
# Net Kar panelinde bu aciklanir (kucuk alt satir). Hakedis/v41 motoru DEGISMEZ.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) kategori ----------
rep("const EXPENSE_CATS = ['Kira','Elektrik/Su/Doğalgaz','Malzeme/Ekipman','Temizlik','Pazarlama','Vergi/SGK','Diğer'];",
"const EXPENSE_CATS = ['Kira','Elektrik/Su/Doğalgaz','Malzeme/Ekipman','Temizlik','Pazarlama','Vergi/SGK','Hoca Maaşı','Diğer'];")

# ---------- 2) maasi gidere yazan fonksiyon (SGK'nin ikizi, kisi bazli) ----------
rep("""  if (window.plToast) plToast('SGK gidere yazıldı — net kâra işlendi');
}""",
"""  if (window.plToast) plToast('SGK gidere yazıldı — net kâra işlendi');
}
// v136: hoca MAASINI gidere yaz — kisi bazli, istege bagli. Tutar = o ayin HAKEDISI (v41 motoru).
// Not [MAAS-OTO-AY-hocaId] isareti tasir: mukerrer korumasi + net karda cift sayim onleme (asagida).
function addInstructorSalaryExpense(instructorId, yyyymm) {
  const inst = state.instructors.find(function(i){ return i.id === instructorId; });
  if (!inst) return;
  const hak = Math.round((((instructorEarningsForMonth(instructorId, yyyymm) || {}).total) || 0) * 100) / 100;
  if (hak <= 0) { alert('Bu ay için hakediş yok — gidere yazılacak maaş bulunamadı.'); return; }
  state.expenses = state.expenses || [];
  const isaret = 'MAAS-OTO-' + yyyymm + '-' + instructorId;
  if (state.expenses.find(function(e){ return e && e.note && String(e.note).indexOf('[' + isaret + ']') !== -1; })) { alert('Bu hocanın bu ayki maaşı zaten gidere yazılmış (Ödemeler > Giderler).'); return; }
  if (!confirm(`${yyyymm} ${inst.name} maaşı (hakediş) ${money(hak)} ₺ gider olarak kaydedilecek (Hoca Maaşı). Net kârda mükerrer sayılmaz — maaşlar zaten Hoca Ödemeleri satırında düşülüyor. Onaylıyor musun?`)) return;
  state.expenses.push({ id: uid(), date: yyyymm + '-28', category: 'Hoca Maaşı', amount: hak, note: inst.name + ' maaşı [' + isaret + ']' });
  save(); renderSalaries();
  try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast(inst.name + ' maaşı gidere yazıldı');
}""")

# ---------- 3) net kar: MAAS-OTO isaretli giderler formulden haric (cift sayim onleme) ----------
rep("""  const exp = expensesTotalForMonth(monthISO);""",
"""  // v136: [MAAS-OTO-...] isaretli maas giderleri net kar formulunden HARIC —
  // maaslar zaten 'pay' (Hoca Odemeleri) bileseninde dusuluyor; gider defteri/CSV tam kalir.
  const expMaas = Math.round(expensesForMonth(monthISO).filter(function(e){ return e && e.note && String(e.note).indexOf('MAAS-OTO-') !== -1; }).reduce(function(a,e){ return a + (+e.amount||0); }, 0) * 100) / 100;
  const exp = Math.round((expensesTotalForMonth(monthISO) - expMaas) * 100) / 100;""")

rep("""  return { rev: Math.round(rev*100)/100, pay: pay, exp: exp, net: Math.round((rev - pay - exp)*100)/100 };""",
"""  return { rev: Math.round(rev*100)/100, pay: pay, exp: exp, expMaas: expMaas, net: Math.round((rev - pay - exp)*100)/100 };""")

# ---------- 4) net kar panelinde aciklama ----------
rep("""<div class="stat warn"><div class="label">Giderler</div><div class="value">−${money(N.exp)} ₺</div></div>""",
"""<div class="stat warn"><div class="label">Giderler</div><div class="value">−${money(N.exp)} ₺</div>${N.expMaas > 0 ? `<div style="font-size:10px;color:var(--muted);">+${money(N.expMaas)} ₺ maaş kaydı — Hoca Ödemeleri'nde sayılır</div>` : ''}</div>""")

# ---------- 5) hoca satirina dugme / isaret ----------
rep("""      <td>${paidBadge}</td>
      <td>${actionBtn}</td>""",
"""      <td>${paidBadge}</td>
      <td>${actionBtn}${(function(){ if (total <= 0) return ''; const yazildi = (state.expenses||[]).some(function(e){ return e && e.note && String(e.note).indexOf('[MAAS-OTO-' + m + '-' + inst.id + ']') !== -1; }); return yazildi ? ` <span class="badge" style="background:#ECEFF1;color:#37474F;" title="Bu ayın maaşı gider listesinde">🧾 Giderde</span>` : ` <button class="btn small secondary" onclick="addInstructorSalaryExpense('${inst.id}','${m}')" title="Bu ayın hakedişini Hoca Maaşı gideri olarak kaydet (net kârda mükerrer sayılmaz)">🧾 Gidere Yaz</button>`; })()}</td>""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.31.58">', '<meta name="app-version" content="2026.07.31.59">')
rep("const APP_VERSION = '2026.07.31.58';", "const APP_VERSION = '2026.07.31.59';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v135-2026-07-31-58';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v136-2026-07-31-59';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
