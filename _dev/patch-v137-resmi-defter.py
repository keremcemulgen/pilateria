# -*- coding: utf-8 -*-
# v137 — RESMI DEFTER (Kerem 2026-07-31): devlet nazarindaki durum + reel durum.
# KARARLAR (Kerem onayli): resmi tahsilat = IBAN + Kredi Karti; sahis isletmesi (GV tarifesi,
# GIB 2026 Teblig 332 varsayilan, Ayarlar'dan degistirilebilir); KDV %20 (mevcut kdvRate ayari).
# FELSEFE: uygulama beyanname HAZIRLAMAZ — muhasebeci rakami girilirse O esas alinir (override),
# girilmezse kayitlardan SEFFAF aritmetik. Hicbir oran/dilim gomulu sabit degil (mevzuat degisir).
# VERI GUVENLIGI: yeni tablo YOK (taxLedger settings'te tasinir — holidays emsali); odeme/gider
# kayitlarinin mevcut alanlari DEGISMEZ (yalniz yeni opsiyonel alan: resmi, kdvRate).
# netProfitForMonth (reel) SEMANTIGI DEGISMEZ.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) kategoriler ----------
rep("const EXPENSE_CATS = ['Kira','Elektrik/Su/Doğalgaz','Malzeme/Ekipman','Temizlik','Pazarlama','Vergi/SGK','Hoca Maaşı','Diğer'];",
"const EXPENSE_CATS = ['Kira','Elektrik/Su/Doğalgaz','Malzeme/Ekipman','Temizlik','Pazarlama','Vergi/SGK','Stopaj','Bağkur','KDV Ödemesi','Hoca Maaşı','Diğer'];")

# ---------- 2) gider formu: resmi (faturali) isareti + KDV orani ----------
rep("""        <input id="exp-note" placeholder="Not (örn. Temmuz kirası)" style="flex:1;min-width:140px;">
        <button class="btn small pl-owner-only" onclick="addExpense()">Ekle</button>""",
"""        <input id="exp-note" placeholder="Not (örn. Temmuz kirası)" style="flex:1;min-width:140px;">
        <label style="display:flex;align-items:center;gap:4px;font-size:12.5px;white-space:nowrap;" title="Faturası/fişi muhasebeciye verilen resmi gider — KDV indirimi ve matrah bunlardan hesaplanır"><input type="checkbox" id="exp-resmi" checked> 🧾 Faturalı</label>
        <select id="exp-kdv" title="Faturadaki KDV oranı (kira ve vergi ödemelerinde %0 seç)"><option value="20">KDV %20</option><option value="10">KDV %10</option><option value="1">KDV %1</option><option value="0">KDV %0</option></select>
        <button class="btn small pl-owner-only" onclick="addExpense()">Ekle</button>""")

rep("""      <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px;">Hoca maaşları buraya YAZILMAZ — Hocalar sayfasındaki maaş ödemeleri net kâra otomatik girer (çift sayım olmaz).</div>""",
"""      <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px;">Hoca maaşları buraya elle YAZILMAZ (Hocalar sayfasından gelir, çift sayım olmaz). 🧾 Faturalı işareti: KDV indirimi ve devlet nazarındaki gider bu kayıtlardan hesaplanır — Stopaj/Bağkur/KDV Ödemesi kategorilerinde KDV %0 seç.</div>""")

# ---------- 3) Odemeler sayfasina Resmi Defter paneli ----------
rep("""      <div id="expenses-list"></div>
    </details>""",
"""      <div id="expenses-list"></div>
    </details>
    <details id="tax-ledger-card" style="margin:10px 0;padding:10px 12px;background:#F4F8FF;border:1px solid #CBDCF2;border-radius:10px;">
      <summary style="cursor:pointer;font-weight:700;">🏛️ Resmi Defter <span id="tax-ledger-sub" style="font-weight:400;color:var(--muted);margin-left:6px;"></span></summary>
      <div id="tax-ledger-body" style="margin-top:8px;"></div>
    </details>""")

# ---------- 4) addExpense: yeni alanlar ----------
rep("""  state.expenses.push({ id: uid(), date: date, category: cat, amount: Math.round(amount*100)/100, note: note });""",
"""  const resmi = !!((document.getElementById('exp-resmi')||{}).checked); // v137
  const ekdv = +((document.getElementById('exp-kdv')||{}).value) || 0;
  state.expenses.push({ id: uid(), date: date, category: cat, amount: Math.round(amount*100)/100, note: note, resmi: resmi, kdvRate: resmi ? ekdv : 0 });""")

# ---------- 5) gider satirinda resmi rozeti ----------
rep("""    <span class="badge" style="background:#ECEFF1;color:#37474F;">${escapeHtml(e.category||'Diğer')}</span>""",
"""    <span class="badge" style="background:#ECEFF1;color:#37474F;">${escapeHtml(e.category||'Diğer')}</span>${e.resmi ? `<span title="Faturalı/resmi${(+e.kdvRate||0) > 0 ? ' — KDV %' + (+e.kdvRate) : ''}">🧾</span>` : ''}""")

# ---------- 6) renderPayments kancasi ----------
rep("""  try { renderExpenses(mm || currentMonth()); } catch(e) {} // v127""",
"""  try { renderExpenses(mm || currentMonth()); } catch(e) {} // v127
  try { renderTaxLedger(mm || currentMonth()); } catch(e) {} // v137""")

# ---------- 7) MOTOR: netProfitForMonth'un ardina ----------
rep("""  return { rev: Math.round(rev*100)/100, pay: pay, exp: exp, expMaas: expMaas, net: Math.round((rev - pay - exp)*100)/100 };
}""",
"""  return { rev: Math.round(rev*100)/100, pay: pay, exp: exp, expMaas: expMaas, net: Math.round((rev - pay - exp)*100)/100 };
}
// ===== v137: RESMI DEFTER — devlet nazarindaki durum =====
// Uygulama beyanname HAZIRLAMAZ; bos birakilan alanlar kayitlardan otomatik tahmin edilir,
// muhasebeci rakami girilirse (taxLedger override) O esas alinir. Belge/tahsilat AYI esasi (p.date/e.date).
const TAX_PAY_CATS = ['Stopaj','Bağkur','KDV Ödemesi','Vergi/SGK']; // devlete odenenler — KDV indirimi olmaz
const TAX_BRACKETS_DEFAULT = '190000:15,400000:20,1000000:27,5300000:35,0:40'; // GIB 2026 (Teblig 332, ucret disi) — Ayarlar'dan guncellenir
function __taxCfg() {
  const s = state.settings || {};
  return {
    rate: +s.kdvRate || 20,
    regime: s.taxRegime || 'sahis',
    official: s.taxOfficialMode || 'iban_kk',
    kurumRate: +s.taxKurumRate || 25,
    start: s.taxStartMonth || currentMonth(),
    openKdv: +s.taxOpeningKdv || 0,
    openLoss: +s.taxOpeningLoss || 0,
    rentNet: +s.taxRentNet || 0
  };
}
function __taxBrackets() {
  const src = String((state.settings||{}).taxBrackets || TAX_BRACKETS_DEFAULT);
  const out = [];
  src.split(',').forEach(function(p){ const kv = p.split(':'); if (kv.length === 2) out.push({ upTo: +kv[0] || 0, rate: +kv[1] || 0 }); });
  return out.length ? out : [{ upTo: 0, rate: 15 }];
}
function __taxBracketCalc(matrah) {
  if (!(matrah > 0)) return 0;
  let tax = 0, prev = 0;
  const bs = __taxBrackets();
  for (let i = 0; i < bs.length; i++) {
    const top = bs[i].upTo > 0 ? bs[i].upTo : Infinity;
    const band = Math.min(matrah, top) - prev;
    if (band > 0) tax += band * bs[i].rate / 100;
    if (matrah <= top) break;
    prev = top;
  }
  return Math.round(tax * 100) / 100;
}
function __taxOfficialMethods() {
  const m = __taxCfg().official;
  if (m === 'iban') return ['IBAN'];
  if (m === 'manual') return [];
  return ['IBAN', 'Kredi Kartı'];
}
function __taxMonthRaw(ay) {
  const cfg = __taxCfg();
  const led = ((state.settings||{}).taxLedger || {})[ay] || {};
  const methods = __taxOfficialMethods();
  const autoGelir = Math.round((state.payments||[]).filter(function(p){ return p && String(p.date||'').slice(0,7) === ay && methods.indexOf(p.method) !== -1; }).reduce(function(a,p){ return a + (+p.amount||0); }, 0) * 100) / 100;
  const gelir = (led.gelir != null && led.gelir !== '') ? Math.round((+led.gelir) * 100) / 100 : autoGelir;
  const hesapKdv = Math.round(gelir * cfg.rate / (100 + cfg.rate) * 100) / 100;
  let autoIndKdv = 0, autoFaturaNet = 0;
  const vergiOde = { toplam: 0 };
  TAX_PAY_CATS.forEach(function(c){ vergiOde[c] = 0; });
  (state.expenses||[]).forEach(function(e){
    if (!e || String(e.date||'').slice(0,7) !== ay) return;
    const cat = e.category || 'Diğer';
    if (TAX_PAY_CATS.indexOf(cat) !== -1) { vergiOde[cat] += (+e.amount||0); vergiOde.toplam += (+e.amount||0); return; }
    if (cat === 'Hoca Maaşı') return; // bordro IBAN kismi payout kayitlarindan gelir — cift sayilmaz
    if (!e.resmi) return; // faturasiz — devlete yansimaz
    const kr = +e.kdvRate || 0;
    const kdvPart = Math.round((+e.amount||0) * kr / (100 + kr) * 100) / 100;
    autoIndKdv += kdvPart;
    autoFaturaNet += (+e.amount||0) - kdvPart;
  });
  autoIndKdv = Math.round(autoIndKdv * 100) / 100;
  autoFaturaNet = Math.round(autoFaturaNet * 100) / 100;
  const indKdv = (led.indKdv != null && led.indKdv !== '') ? Math.round((+led.indKdv) * 100) / 100 : autoIndKdv;
  const pr = String(ay).split('-').map(Number);
  const bordroIban = Math.round((state.instructorPayouts||[]).filter(function(p){ return p && p.year === pr[0] && p.month === pr[1] && p.method === 'IBAN'; }).reduce(function(a,p){ return a + (+p.amount||0); }, 0) * 100) / 100;
  const bagkurInd = cfg.regime === 'sahis' ? vergiOde['Bağkur'] : 0; // sahis: Bagkur matrahtan indirilir (GVK 89); kurumda ortagin sahsi primi indirilemez
  const autoGider = Math.round((autoFaturaNet + bordroIban + vergiOde['Stopaj'] + vergiOde['Vergi/SGK'] + bagkurInd) * 100) / 100; // KDV Odemesi matrahtan INDIRILEMEZ
  const gider = (led.gider != null && led.gider !== '') ? Math.round((+led.gider) * 100) / 100 : autoGider;
  const netGelir = Math.round((gelir - hesapKdv) * 100) / 100;
  const kar = Math.round((netGelir - gider) * 100) / 100;
  return { ay: ay, gelir: gelir, autoGelir: autoGelir, hesapKdv: hesapKdv, indKdv: indKdv, autoIndKdv: autoIndKdv,
           netGelir: netGelir, gider: gider, autoGider: autoGider, faturaNet: autoFaturaNet, bordroIban: bordroIban,
           vergiOde: vergiOde, kar: kar, led: led };
}
function __taxNextMonth(ay) { const p = String(ay).split('-').map(Number); const d = new Date(p[0], p[1], 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
// Zincirli model: baslangic ayindan hedefe ay ay — KDV devri + yil ici kumulatif kar/zarar + zarar devri.
function taxMonthModel(ay) {
  const cfg = __taxCfg();
  let m = cfg.start;
  if (String(ay) < String(m)) m = ay; // baslangictan onceki ay istenirse zincirsiz tek ay
  let devKdv = cfg.openKdv, zararDevir = cfg.openLoss, ytd = 0, yil = +String(m).split('-')[0];
  let raw = null, odenecek = 0, devOnceki = devKdv;
  for (let g = 0; g < 240; g++) { // 20 yil emniyet siniri
    raw = __taxMonthRaw(m);
    const y = +String(m).split('-')[0];
    if (y !== yil) { if (ytd < 0) zararDevir = Math.round((zararDevir - ytd) * 100) / 100; ytd = 0; yil = y; } // gecmis yil zarari devreder (5 yil kurali muhasebecide)
    devOnceki = devKdv;
    odenecek = Math.max(0, Math.round((raw.hesapKdv - raw.indKdv - devKdv) * 100) / 100);
    devKdv = Math.max(0, Math.round((devKdv + raw.indKdv - raw.hesapKdv) * 100) / 100);
    ytd = Math.round((ytd + raw.kar) * 100) / 100;
    if (m === String(ay)) break;
    m = __taxNextMonth(m);
  }
  const kalan = Math.round((ytd - zararDevir) * 100) / 100;
  const vergi = kalan > 0 ? (cfg.regime === 'kurum' ? Math.round(kalan * cfg.kurumRate / 100 * 100) / 100 : __taxBracketCalc(kalan)) : 0;
  const reel = netProfitForMonth(String(ay));
  return Object.assign({}, raw, {
    odenecekKdv: odenecek, devredenKdvOnceki: devOnceki, devredenKdvYeni: devKdv,
    ytdKar: ytd, kalanMatrah: kalan, devredenZarar: kalan < 0 ? -kalan : 0, tahminiVergi: vergi,
    reelNet: reel.net, kayitDisiFark: Math.round((reel.net - raw.kar) * 100) / 100
  });
}
function saveTaxOverrides(ay) {
  state.settings.taxLedger = state.settings.taxLedger || {};
  const g = (document.getElementById('tl-gelir')||{}).value;
  const ik = (document.getElementById('tl-indkdv')||{}).value;
  const gd = (document.getElementById('tl-gider')||{}).value;
  const nt = ((document.getElementById('tl-not')||{}).value || '').trim();
  const entry = {};
  if (g !== '' && g != null) entry.gelir = +g;
  if (ik !== '' && ik != null) entry.indKdv = +ik;
  if (gd !== '' && gd != null) entry.gider = +gd;
  if (nt) entry.not = nt;
  if (Object.keys(entry).length) state.settings.taxLedger[ay] = entry; else delete state.settings.taxLedger[ay];
  save(); renderTaxLedger(ay);
  if (window.plToast) plToast('Resmi defter kaydedildi — ' + ay);
}
// Kira + stopaj tek tus: net kiradan brut = net/0.80, stopaj %20 (GVK 94/5, gercek kisiden isyeri)
function addRentWithStopaj() {
  const cfg = __taxCfg();
  const ay = (document.getElementById('pay-month')||{}).value || currentMonth();
  const net = cfg.rentNet;
  if (!(net > 0)) { alert('Önce Ayarlar > Resmi Defter bölümüne aylık NET kira tutarını girip kaydet.'); return; }
  const brut = Math.round(net / 0.8 * 100) / 100;
  const stopaj = Math.round((brut - net) * 100) / 100;
  state.expenses = state.expenses || [];
  const isaret = 'KIRA-OTO-' + ay;
  if (state.expenses.find(function(e){ return e && e.note && String(e.note).indexOf('[' + isaret + ']') !== -1; })) { alert('Bu ayın kira + stopajı zaten yazılmış (Giderler).'); return; }
  if (!confirm(ay + ' kirası: net ' + money(net) + ' ₺ (Kira) + stopaj ' + money(stopaj) + ' ₺ (%20, brüt ' + money(brut) + ' ₺ üzerinden) — iki gider kaydı eklenecek. Onaylıyor musun?')) return;
  state.expenses.push({ id: uid(), date: ay + '-01', category: 'Kira', amount: net, resmi: true, kdvRate: 0, note: 'işyeri kirası [' + isaret + ']' });
  state.expenses.push({ id: uid(), date: ay + '-01', category: 'Stopaj', amount: stopaj, resmi: true, kdvRate: 0, note: 'kira stopajı (muhtasar) [' + isaret + ']' });
  save(); renderExpenses(ay); renderTaxLedger(ay);
  try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast('Kira + stopaj gidere yazıldı');
}
function renderTaxLedger(ay) {
  const body = document.getElementById('tax-ledger-body');
  if (!body) return;
  ay = ay || (document.getElementById('pay-month')||{}).value || currentMonth();
  const M = taxMonthModel(ay);
  const sub = document.getElementById('tax-ledger-sub');
  if (sub) sub.textContent = ay + ': resmi ' + (M.kar >= 0 ? 'kâr' : 'zarar') + ' ' + money(Math.abs(M.kar)) + ' ₺ · devreden KDV ' + money(M.devredenKdvYeni) + ' ₺';
  const led = M.led || {};
  body.innerHTML = `
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px;">TAHMİNİDİR — beyanname muhasebecinindir. Boş bırakılan alanlar kayıtlardan otomatik hesaplanır; muhasebeci rakamı girersen o esas alınır. Belge/tahsilat AYI esas alınır (paket ayı değil).</div>
    <div class="grid-stats">
      <div class="stat blue"><div class="label">Resmi Gelir (KDV dahil)</div><div class="value">${money(M.gelir)} ₺</div><div style="font-size:10px;color:var(--muted);">oto: ${money(M.autoGelir)} ₺ (İBAN+POS)</div></div>
      <div class="stat"><div class="label">Hesaplanan KDV</div><div class="value">${money(M.hesapKdv)} ₺</div><div style="font-size:10px;color:var(--muted);">%${__taxCfg().rate} iç yüzde</div></div>
      <div class="stat"><div class="label">İndirilecek KDV</div><div class="value">${money(M.indKdv)} ₺</div><div style="font-size:10px;color:var(--muted);">oto: ${money(M.autoIndKdv)} ₺ (🧾 faturalı)</div></div>
      <div class="stat ${M.odenecekKdv > 0 ? 'warn' : 'ok'}"><div class="label">Ödenecek KDV</div><div class="value">${money(M.odenecekKdv)} ₺</div><div style="font-size:10px;color:var(--muted);">devir: ${money(M.devredenKdvOnceki)} → ${money(M.devredenKdvYeni)} ₺</div></div>
    </div>
    <div class="grid-stats" style="margin-top:6px;">
      <div class="stat"><div class="label">Matrah Gideri</div><div class="value">${money(M.gider)} ₺</div><div style="font-size:10px;color:var(--muted);">🧾 ${money(M.faturaNet)} + bordro ${money(M.bordroIban)} + vergi öd.</div></div>
      <div class="stat ${M.kar >= 0 ? 'ok' : 'bad'}"><div class="label">Resmi ${M.kar >= 0 ? 'Kâr' : 'Zarar'} (ay)</div><div class="value">${money(M.kar)} ₺</div></div>
      <div class="stat ${M.kalanMatrah >= 0 ? 'ok' : 'warn'}"><div class="label">Yıl İçi Durum</div><div class="value">${money(M.kalanMatrah)} ₺</div><div style="font-size:10px;color:var(--muted);">${M.devredenZarar > 0 ? 'devreden zarar ' + money(M.devredenZarar) + ' ₺ — vergi çıkmaz' : 'tahmini gelir vergisi ' + money(M.tahminiVergi) + ' ₺'}</div></div>
      <div class="stat"><div class="label">Reel Net (kayıt dışı dahil)</div><div class="value">${money(M.reelNet)} ₺</div><div style="font-size:10px;color:var(--muted);">resmi ile fark: ${money(M.kayitDisiFark)} ₺</div></div>
    </div>
    <div style="font-size:12px;margin:8px 0 4px;">Bu ay devlete ödenenler: Stopaj ${money(M.vergiOde['Stopaj'])} · Bağkur ${money(M.vergiOde['Bağkur'])} · SGK ${money(M.vergiOde['Vergi/SGK'])} · KDV ${money(M.vergiOde['KDV Ödemesi'])} ₺
      <button class="btn small secondary pl-owner-only" onclick="addRentWithStopaj()" style="margin-left:8px;">🏠 Kira + Stopaj Yaz</button></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px;">
      <input type="number" id="tl-gelir" placeholder="Resmi ciro düzeltme ₺" value="${led.gelir != null ? led.gelir : ''}" style="width:150px;">
      <input type="number" id="tl-indkdv" placeholder="İnd. KDV düzeltme ₺" value="${led.indKdv != null ? led.indKdv : ''}" style="width:150px;">
      <input type="number" id="tl-gider" placeholder="Matrah gideri düzeltme ₺" value="${led.gider != null ? led.gider : ''}" style="width:170px;">
      <input id="tl-not" placeholder="Not" value="${escapeHtml(led.not || '')}" style="flex:1;min-width:120px;">
      <button class="btn small pl-owner-only" onclick="saveTaxOverrides('${ay}')">💾 Muhasebeci Rakamlarını Kaydet</button>
    </div>`;
}""")

# ---------- 8) Raporlar vergi paneli: model tabanli kutular ----------
rep("""      <div class="stat blue"><div class="label">IBAN Tahsilat (KDV dahil)</div><div class="value">${money(ibanGross)} ₺</div></div>
      <div class="stat"><div class="label">IBAN Net (KDV hariç)</div><div class="value">${money(ibanNet)} ₺</div></div>
      <div class="stat warn"><div class="label">Ödenecek KDV (%${kdvRate})</div><div class="value">${money(ibanKdv)} ₺</div></div>
      <div class="stat bad"><div class="label">Gelir Vergisi (%${gvRate})</div><div class="value">${money(ibanGv)} ₺</div></div>
      <div class="stat ok"><div class="label">IBAN'dan Cebe Kalan</div><div class="value">${money(ibanPocket)} ₺</div></div>""",
"""      ${(function(){ const T = taxMonthModel(m); return `
      <div class="stat blue"><div class="label">Resmi Gelir (İBAN+POS)</div><div class="value">${money(T.gelir)} ₺</div></div>
      <div class="stat ${T.odenecekKdv > 0 ? 'warn' : 'ok'}"><div class="label">Ödenecek KDV</div><div class="value">${money(T.odenecekKdv)} ₺</div><div style="font-size:10px;color:var(--muted);">devreden ${money(T.devredenKdvYeni)} ₺</div></div>
      <div class="stat ${T.kar >= 0 ? 'ok' : 'bad'}"><div class="label">Resmi ${T.kar >= 0 ? 'Kâr' : 'Zarar'} (ay)</div><div class="value">${money(T.kar)} ₺</div></div>
      <div class="stat ${T.kalanMatrah >= 0 ? 'ok' : 'warn'}"><div class="label">Yıl İçi ${T.kalanMatrah >= 0 ? 'Matrah' : 'Zarar'}</div><div class="value">${money(T.kalanMatrah)} ₺</div><div style="font-size:10px;color:var(--muted);">${T.devredenZarar > 0 ? 'devreden zarar — vergi çıkmaz' : 'tahmini gelir vergisi ' + money(T.tahminiVergi) + ' ₺'}</div></div>
      <div class="stat"><div class="label">Reel Net (kayıt dışı dahil)</div><div class="value">${money(T.reelNet)} ₺</div><div style="font-size:10px;color:var(--muted);">detay: Ödemeler › 🏛️ Resmi Defter</div></div>`; })()}""")

# ---------- 9) Ayarlar HTML ----------
rep("""      <div class="field">
        <label>Efektif Gelir Vergisi Oranı (%) — şahıs şirketi tahmini</label>
        <input type="number" id="set-gv" min="0" max="100" step="0.1">
      </div>
    </div>
    <h3>Grup ve Hoca Ayarları</h3>""",
"""      <div class="field">
        <label>Efektif Gelir Vergisi Oranı (%) — şahıs şirketi tahmini</label>
        <input type="number" id="set-gv" min="0" max="100" step="0.1">
      </div>
    </div>
    <h3>🏛️ Resmi Defter</h3>
    <div class="fields-grid">
      <div class="field"><label>İşletme türü</label><select id="set-tax-regime"><option value="sahis">Şahıs işletmesi (gelir vergisi tarifesi)</option><option value="kurum">Limited/A.Ş. (kurumlar vergisi)</option></select></div>
      <div class="field"><label>Resmi tahsilat sayımı</label><select id="set-tax-official"><option value="iban_kk">İBAN + Kredi Kartı</option><option value="iban">Sadece İBAN</option><option value="manual">Otomatik sayma — elle gireceğim</option></select></div>
      <div class="field"><label>Gelir vergisi tarifesi <small style="color:var(--muted);font-weight:400;">— "sınır:oran" listesi, son dilim 0:oran; her yıl GİB tebliğinden güncelle</small></label><input id="set-tax-brackets"></div>
      <div class="field"><label>Kurumlar vergisi oranı (%)</label><input type="number" id="set-tax-kurum" min="0" max="100" step="0.1"></div>
      <div class="field"><label>Defter başlangıç ayı <small style="color:var(--muted);font-weight:400;">— KDV devri ve kâr/zarar zinciri bu aydan başlar</small></label><input type="month" id="set-tax-start"></div>
      <div class="field"><label>Başlangıç devreden KDV (₺) <small style="color:var(--muted);font-weight:400;">— muhasebeciden</small></label><input type="number" id="set-tax-openkdv" min="0" step="0.01"></div>
      <div class="field"><label>Başlangıç devreden zarar (₺) <small style="color:var(--muted);font-weight:400;">— muhasebeciden</small></label><input type="number" id="set-tax-openloss" min="0" step="0.01"></div>
      <div class="field"><label>Aylık NET kira (₺) <small style="color:var(--muted);font-weight:400;">— 🏠 Kira+Stopaj düğmesi bundan brüt/stopaj hesaplar (%20)</small></label><input type="number" id="set-tax-rent" min="0" step="0.01"></div>
    </div>
    <h3>Grup ve Hoca Ayarları</h3>""")

# ---------- 10) renderSettings doldurma ----------
rep("""  document.getElementById('set-kdv').value = s.kdvRate ?? 20;
  document.getElementById('set-gv').value = s.gvRate ?? 15;""",
"""  document.getElementById('set-kdv').value = s.kdvRate ?? 20;
  document.getElementById('set-gv').value = s.gvRate ?? 15;
  const __t137 = function(id, v){ const el = document.getElementById(id); if (el) el.value = v; }; // v137
  __t137('set-tax-regime', s.taxRegime || 'sahis');
  __t137('set-tax-official', s.taxOfficialMode || 'iban_kk');
  __t137('set-tax-brackets', s.taxBrackets || TAX_BRACKETS_DEFAULT);
  __t137('set-tax-kurum', s.taxKurumRate ?? 25);
  __t137('set-tax-start', s.taxStartMonth || currentMonth());
  __t137('set-tax-openkdv', s.taxOpeningKdv ?? 0);
  __t137('set-tax-openloss', s.taxOpeningLoss ?? 0);
  __t137('set-tax-rent', s.taxRentNet ?? 33000);""")

# ---------- 11) saveSettings kalicilik ----------
rep("""  state.settings.kdvRate = +document.getElementById('set-kdv').value || 0;
  state.settings.gvRate = +document.getElementById('set-gv').value || 0;""",
"""  state.settings.kdvRate = +document.getElementById('set-kdv').value || 0;
  state.settings.gvRate = +document.getElementById('set-gv').value || 0;
  const __g137 = function(id){ const el = document.getElementById(id); return el ? el.value : ''; }; // v137
  state.settings.taxRegime = __g137('set-tax-regime') || 'sahis';
  state.settings.taxOfficialMode = __g137('set-tax-official') || 'iban_kk';
  state.settings.taxBrackets = String(__g137('set-tax-brackets') || '').trim() || TAX_BRACKETS_DEFAULT;
  state.settings.taxKurumRate = +__g137('set-tax-kurum') || 25;
  state.settings.taxStartMonth = __g137('set-tax-start') || currentMonth();
  state.settings.taxOpeningKdv = +__g137('set-tax-openkdv') || 0;
  state.settings.taxOpeningLoss = +__g137('set-tax-openloss') || 0;
  state.settings.taxRentNet = +__g137('set-tax-rent') || 0;""")

# ---------- 12) yeni kurulum varsayilanlari ----------
rep("""    kdvRate: 20,             // KDV yüzdesi (fiyatlar KDV dahildir; IBAN ödemesinde ayrıştırılır)
    gvRate: 15,              // Efektif gelir vergisi yüzdesi (şahıs şirketi için yaklaşık)""",
"""    kdvRate: 20,             // KDV yüzdesi (fiyatlar KDV dahildir; IBAN ödemesinde ayrıştırılır)
    gvRate: 15,              // Efektif gelir vergisi yüzdesi (şahıs şirketi için yaklaşık)
    taxRegime: 'sahis',      // v137: sahis=GV tarifesi, kurum=%25
    taxOfficialMode: 'iban_kk', // v137: resmi tahsilat sayimi (IBAN+KK)""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.31.59">', '<meta name="app-version" content="2026.07.31.60">')
rep("const APP_VERSION = '2026.07.31.59';", "const APP_VERSION = '2026.07.31.60';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v136-2026-07-31-59';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v137-2026-07-31-60';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
