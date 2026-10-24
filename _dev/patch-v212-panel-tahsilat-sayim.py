# -*- coding: utf-8 -*-
# v212 — (A) PANEL TAHSİLATI = ÜYELER › ÖDENMİŞ · (B) BULUT DERS SAYIMI KANITI (Kerem 24.10)
#
# (A) Kerem: "Panelde Ekim 2026 tahsilatı yazan miktar nasıl hesaplanıyor. Üyeler kısmında yazan miktarla birbirine uymuyor."
#     ÖLÇÜLDÜ (PC Chrome'daki son kayıtlı kopya, salt okunur): Panel 339.287,50 (64 ödeme, ÖDEME GÜNÜ — v208 para esası) · Üyeler › Ödenmiş
#     241.475 (42 ödeme, PAKET AYI) · fark 97.812,50 = Ekim'de alınan 22 EYLÜL paketi ödemesi. Hesap hatası değil, iki ekran farklı soruyu
#     cevaplıyordu. KEREM KARARI (AskUserQuestion): "Panel paket ayına dönsün".
#     ÇÖZÜM: Üyeler sayfası istatistikleri tek fonksiyona (`membersMonthStats212`) alındı; Panel tahsilat kartı da AYNI fonksiyondan →
#     iki ekran her zaman aynı rakam. Net Kâr kartı para esasında kalır (Finans › Özet ile aynı) — kartların altına esasları yazıldı.
#     Hesap üye satırlarını kurar (PC'de ~19 ms) → yalnız Panel görünürken yapılır (Panel'e geçişte switchPage zaten yeniden çizer).
#
# (B) Kerem (telefon ekran görüntüsü 24.10 14:07): "☁️ Bulut senkron aktif · son gönderim: 14:06 · ⚠️ EKSİK: bulut 1.169 ders,
#     uygulama 1.168" — "Bu uyarı niye sebebini bul".
#     KÖK: v192 kanıtı bulut sayısını (`__sbCloudCounts.lessons`) YALNIZ TAM ÇEKİMDE alıyordu. Sonra yapılan her ders silme/ekleme (bu
#     cihazda — buluta da gider — ya da başka cihazdan gerçek zamanlı) uygulama sayısını değiştirir, bulut sayısı BAYAT kalır → silme
#     buluta gittiği halde "EKSİK". İkinci kök: v106 ölü ders süpürmesi (üyesiz iptal / üyesiz planlı ders) açılışta ve tazelemede yalnız
#     YEREL'de düşer, mezar taşı yazılmadığı için buluttan hiç silinmez → bulutta öyle bir kayıt varsa fark KALICI (her açılışta uyarı).
#     ÇÖZÜM: (1) tam çekimde KİMLİK düzeyinde kanıt: bulutta olup yerelde olmayan dersler sınıflanır — üyesiz boş kayıt ("gösterilmez",
#     eksik sayılmaz) ya da gerçek eksik (tarih-saat-ad ile KIRMIZI + "yenile"). (2) Ders eklenip silinince (gönderim / gerçek zamanlı)
#     bulut sayısı SUNUCUDAN yeniden sayılır (tek satırlık sayım isteği); tutmazsa dersler kimlik düzeyinde yeniden okunur (state'e
#     YAZILMAZ) ve kırmızı uyarı ancak iki ayrı kontrolde de süren farkta gösterilir; arada "ders sayımı kontrol ediliyor…".
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:160])
    s = s.replace(old, new)

# ── 0) sürüm
rep('<meta name="app-version" content="2026.10.21.134">', '<meta name="app-version" content="2026.10.24.135">')
rep("const APP_VERSION = '2026.10.21.134';", "const APP_VERSION = '2026.10.24.135';")

# ── 1) CSS: kart altı açıklama satırı
rep("""  .stat .value { font-size: 24px; font-weight: 700; color: var(--text); }""",
    """  .stat .value { font-size: 24px; font-weight: 700; color: var(--text); }
  .stat .stat-sub212 { font-size: 11px; color: var(--muted); margin-top: 3px; line-height: 1.3; } /* v212 */""")

# ── 2) Panel: başlık notu + kart altı esaslar
rep("""    <span style="font-size:12px;color:var(--muted);">(tahsilat, net kâr ve doluluk bu aya göre — para esası)</span>""",
    """    <span style="font-size:12px;color:var(--muted);">(tahsilat = bu ayın paketleri, Üyeler › Ödenmiş ile aynı · net kâr = para esası, Finans › Özet ile aynı)</span>""")
rep("""    <div class="stat ok"><div class="label" id="s-revenue-label">Bu Ay Gelir (₺)</div><div class="value" id="s-revenue">0</div></div>""",
    """    <div class="stat ok"><div class="label" id="s-revenue-label" title="Bu ayın paketleri için alınan ödemeler (ödeme günü fark etmez) — Üyeler › Ödenmiş ile aynı. O ay kasaya giren para: Finans › Özet">Bu Ay Gelir (₺)</div><div class="value" id="s-revenue">0</div><div class="stat-sub212" id="s-revenue-sub">bu ayın paketleri · Üyeler › Ödenmiş ile aynı</div></div>""")
rep("""<div class="value" id="s-netprofit">—</div></div>""",
    """<div class="value" id="s-netprofit">—</div><div class="stat-sub212" id="s-netprofit-sub">para esası · o ay giren − çıkan</div></div>""")

# ── 3) Panel tahsilat kartı: Üyeler › Ödenmiş (tek kaynak)
rep("""  // this month revenue — v21: PAKET AYI kanonu (Üyeler sayfasındaki "Ödenmiş" ile birebir aynı tanım;
  // 31 Mayıs'ta alınan Haziran paketi ödemesi HAZİRAN gelirinde görünür — her yerde tek rakam)
  // v35: PANEL AY SEÇİCİ — gelir+doluluk SEÇİLİ AYA göre (varsayılan içinde bulunulan ay)""",
    """  // v212 (Kerem 24.10): Panel tahsilatı = Üyeler › Ödenmiş — o ayın PAKETLERİ için alınan (31 Eylül'de alınan Ekim paketi Ekim'de;
  // Ekim'de alınan Eylül paketi Eylül'de). Net Kâr kartı para esası (Finans › Özet). v35: PANEL AY SEÇİCİ — seçili aya göre.""")
rep("""  const __S208 = finSummary208(m); // v208 TEK ÖZET (Kerem 20.10, para esası): Panel = Raporlar = Finans › Özet — aynı fonksiyon, aynı rakam
  document.getElementById('s-revenue').textContent = money(__S208.studio.uye);""",
    """  const __S208 = finSummary208(m); // v208 TEK ÖZET (para esası): Net Kâr kartı = Finans › Özet
  // v212 (Kerem 24.10: "Panelde Ekim 2026 tahsilatı yazan miktar … Üyeler kısmında yazan miktarla birbirine uymuyor" → karar "Panel paket
  // ayına dönsün"): TEK KAYNAK membersMonthStats212 — Üyeler sayfasındaki "Ödenmiş" ile aynı fonksiyon, aynı rakam. Hesap üye satırlarını
  // kurar (ağır) → yalnız Panel görünürken; başka sayfadayken atlanır (Panel'e geçişte switchPage zaten yeniden çizer).
  { const __pg212 = document.getElementById('page-dashboard');
    if (!__pg212 || __pg212.classList.contains('active')) document.getElementById('s-revenue').textContent = money(membersMonthStats212(m).paid); }""")

# ── 4) Üyeler sayfası istatistikleri: tek fonksiyon
rep("""function renderMembers() {
  ensureMemberMonthSelect();""",
    """// v212 (Kerem 24.10): Üyeler sayfası istatistikleri TEK KAYNAK — Üyeler kartları VE Panel tahsilat kartı buradan (her zaman aynı rakam).
// Ödenmiş = o ayın listesindeki satırların ödemeleri (paket ayı: p.packageMonth || ödeme ayı — ödeme günü fark etmez).
function membersMonthStats212(monthISO) {
  let expected = 0, paid = 0, pending = 0;
  const __uniq = new Set(); // v18: bos grup slotlari ve olasi cift satirlar SAYILMAZ
  buildMemberRows(monthISO).forEach(r => {
    if (r.type === 'individual' || r.isFirstInGroup) {
      expected += +r.totalPrice || 0;
      pending += +r.remaining || 0;  // Sadece grup başına 1 kez, bireyler tek başına sayılır
    }
    paid += +r.paid || 0;
    if (r.memberId && !r.isPartial) __uniq.add(personIdOf(r.memberId)); // v59: klon ayni KISI — cift sayilmaz · v171: ayrilan payi sayilmaz (F10)
  });
  return { expected: expected, paid: paid, pending: pending, memberCount: __uniq.size };
}
function renderMembers() {
  ensureMemberMonthSelect();""")
rep("""  // Stats: expected (toplam paket ücretleri) / paid / pending
  // Expected = sum of totalPrice for first-in-group rows + individual totalPrices
  let expected = 0, paid = 0, pending = 0;
  const __uniqMemberIds = new Set(); // v18: bos grup slotlari ve olasi cift satirlar SAYILMAZ
  buildMemberRows(monthISO).forEach(r => {
    if (r.type==='individual' || r.isFirstInGroup) {
      expected += +r.totalPrice || 0;
      pending += +r.remaining || 0;  // Sadece grup başına 1 kez, bireyler tek başına sayılır
    }
    paid += +r.paid || 0;
    if (r.memberId && !r.isPartial) __uniqMemberIds.add(personIdOf(r.memberId)); // v59: klon ayni KISI — cift sayilmaz · v171: ayrilan payi sayilmaz (F10)
  });
  const memberCount = __uniqMemberIds.size;""",
    """  // Stats: expected (toplam paket ücretleri) / paid / pending — v212: TEK KAYNAK membersMonthStats212 (Panel tahsilatı da buradan)
  const __st212 = membersMonthStats212(monthISO);
  const expected = __st212.expected, paid = __st212.paid, pending = __st212.pending, memberCount = __st212.memberCount;""")
rep("""    <div class="stat ok"><div class="label">Ödenmiş</div>""",
    """    <div class="stat ok"><div class="label" title="Bu ayın paketleri için alınan ödemeler (ödeme günü fark etmez) — Panel tahsilatı ile aynı">Ödenmiş</div>""")

# ── 5) BULUT DERS SAYIMI KANITI (tek kaynak)
rep("""var __sbCloudCounts = {}; // v192: son TAM cekimde sunucudan gelen satir sayilari (panelde kanit)""",
    """var __sbCloudCounts = {}; // v192: son TAM cekimde sunucudan gelen satir sayilari (panelde kanit)
// ===== v212 BULUT DERS SAYIMI KANITI (Kerem 24.10: "⚠️ EKSİK: bulut 1.169 ders, uygulama 1.168 — bu uyarı niye sebebini bul") =====
// KÖK: bulut sayısı yalnız TAM ÇEKİMDE alınıyordu → sonraki her ders silme/ekleme (buluta da gitse) sayacı bayat bırakıp "EKSİK"
// dedirtiyordu; v106 ölü ders süpürmesi (üyesiz iptal / üyesiz planlı) yalnız yerelde düştüğü için bulutta kalan boş kayıt kalıcı fark
// yapıyordu. Kanıt artık KİMLİK düzeyinde: boş kayıt "gösterilmez" (eksik değil), gerçek eksik adı-tarihiyle; silme/eklemeden sonra
// bulut sayısı SUNUCUDAN yeniden sayılır; kırmızı uyarı ancak iki ayrı kontrolde de süren farkta.
var __sbLessonProof212 = null;   // { at, cloud, empty:[id], bad, other:[{id,date,time,groupId,memberIds,packageMonth}], localOnly:[id], checking, pending, sig }
var __sbRecountT212 = null;
function __sbLessonProofFromRows212(rows, cloudCount, fromPull) {
  const local = new Set(); (state.lessons || []).forEach(function(l){ if (l && l.id != null) local.add(String(l.id)); });
  const cloud = new Set(); const empty = [], other = []; let bad = 0;
  (rows || []).forEach(function(row){
    if (!row || row.id == null || __sbBadKey(String(row.id)) || !row.data || typeof row.data !== 'object') { bad++; return; }
    const id = String(row.id); cloud.add(id);
    if (local.has(id)) return;
    const d = row.data;
    if (!Array.isArray(d.memberIds) || d.memberIds.length === 0) { empty.push(id); return; } // v106 süpürmesi: üyesiz boş kayıt (yerelde düşer)
    other.push({ id: id, date: String(d.date || ''), time: String(d.time || ''), groupId: d.groupId || '', memberIds: d.memberIds.slice(0, 6), packageMonth: d.packageMonth || '' });
  });
  const localOnly = []; local.forEach(function(id){ if (!cloud.has(id)) localOnly.push(id); });
  const prev = __sbLessonProof212;
  const sig = JSON.stringify([other.map(function(x){ return x.id; }).sort(), localOnly.slice().sort()]);
  const mismatch = other.length > 0 || localOnly.length > 0;
  // tam çekimde bulunan fark hemen gösterilir (state buluttan yeni kuruldu); sonraki kontrolde AYNI fark ikinci kez görülünce gösterilir
  const pending = mismatch && !fromPull && !(prev && prev.pending && prev.sig === sig);
  __sbLessonProof212 = { at: Date.now(), cloud: (typeof cloudCount === 'number') ? cloudCount : (rows || []).length, empty: empty, bad: bad, other: other, localOnly: localOnly, checking: pending, pending: pending, sig: sig };
  try {
    if (mismatch && !pending) __trace('⚠️ SAYIM KANITI: bulutta olup uygulamada olmayan ' + other.length + ' ders' + (other.length ? ' [' + other.slice(0, 5).map(function(x){ return x.id + ' ' + x.date + ' ' + x.time; }).join(', ') + ']' : '') + (localOnly.length ? ' · buluta gitmemiş ' + localOnly.length + ' ders [' + localOnly.slice(0, 5).join(', ') + ']' : ''));
    else if ((empty.length || bad) && fromPull) __trace('ℹ️ SAYIM KANITI: bulutta ' + (empty.length + bad) + ' üyesiz boş ders kaydı uygulamada gösterilmiyor (v106 süpürmesi) — eksik değil');
  } catch(e) {}
  return __sbLessonProof212;
}
function __sbScheduleLessonRecount212(delayMs, attempt) {
  if (!SUPABASE_MODE || !sbClient) return;
  if (__sbRecountT212) return; // zaten planlı — art arda tetikler tek kontrol
  if (__sbLessonProof212) __sbLessonProof212.checking = true;
  const ms = (delayMs != null) ? delayMs : ((window.__sbRecountMs212 != null) ? window.__sbRecountMs212 : 8000);
  __sbRecountT212 = setTimeout(function(){ __sbRecountT212 = null; try { __sbRecountLessons212(attempt || 0); } catch(e) {} }, ms);
}
async function __sbRecountLessons212(attempt) {
  attempt = +attempt || 0;
  if (!SUPABASE_MODE || !sbClient) return;
  const quiet = (window.__sbRecountQuietMs212 != null) ? window.__sbRecountQuietMs212 : 6000; // gönderimden hemen sonra sayma (replika gecikmesi)
  const busy = function(){ return (typeof isDirty === 'function' && isDirty()) || __sbPushInFlight || __sbResyncBusy || (__sbLastPushAt && (Date.now() - __sbLastPushAt) < quiet); };
  const redraw = function(){ try { if (typeof setCloudDot === 'function') setCloudDot(navigator.onLine === false ? 'offline' : ((typeof isDirty === 'function' && isDirty()) ? 'pending' : 'ok')); } catch(e) {} };
  if (busy()) { if (attempt < 40) __sbScheduleLessonRecount212(4000, attempt + 1); return; }
  const P = __sbLessonProof212 || (__sbLessonProof212 = { at: 0, cloud: null, empty: [], bad: 0, other: [], localOnly: [], checking: false, pending: false, sig: '' });
  let n = null;
  try { let q = sbClient.from('lessons').select('id', { count: 'exact' }); if (q && typeof q.range === 'function') q = q.range(0, 0); const r = await q; if (r && !r.error && typeof r.count === 'number') n = r.count; } catch(e) {}
  if (n === null) { P.checking = false; redraw(); return; } // sayılamadı (çevrimdışı vb.) → eski kanıt kalır
  if (busy()) { if (attempt < 40) __sbScheduleLessonRecount212(4000, attempt + 1); return; }
  const a = (state.lessons || []).length;
  const k = (P.empty || []).length + (+P.bad || 0);
  if (n - k === a && !(P.other || []).length && !(P.localOnly || []).length && !P.pending) {
    P.cloud = n; P.at = Date.now(); P.checking = false; __sbCloudCounts.lessons = n; redraw(); return;
  }
  // sayı tutmuyor (ya da önceki kontrolde fark vardı) → KİMLİK düzeyinde kanıt: dersler sunucudan okunur, state'e YAZILMAZ
  let r2 = null; try { r2 = await __sbSelectAll191('lessons'); } catch(e) {}
  if (!r2 || r2.error || !r2.data) { P.checking = false; redraw(); return; }
  if (busy()) { if (attempt < 40) __sbScheduleLessonRecount212(4000, attempt + 1); return; } // okuma sırasında yerel değişiklik → sonra yeniden
  const Q = __sbLessonProofFromRows212(r2.data, __sbCloudCounts.lessons, false);
  if (Q.pending) { if (attempt < 40) __sbScheduleLessonRecount212(null, attempt + 1); } // fark ilk kez görüldü → biraz sonra doğrula
  else if (Q.other.length || Q.localOnly.length) {
    try { if (typeof plToast === 'function') plToast('⚠️ Ders sayımı tutmuyor: ' + [Q.other.length ? 'bulutta olup uygulamada olmayan ' + Q.other.length + ' ders' : '', Q.localOnly.length ? 'buluta gitmemiş ' + Q.localOnly.length + ' ders' : ''].filter(Boolean).join(' · ') + ' — Panel’deki satırdan yenile', 9000); } catch(e) {}
  }
  redraw();
}
function __sbLessonLabel212(x) {
  let who = '';
  try {
    if (x.groupId) { const g = (state.groups || []).find(function(gg){ return gg && gg.id === x.groupId; }); who = g ? (groupDisplayName(g, x.packageMonth || String(x.date || '').slice(0, 7)) || g.name || '') : 'grup'; }
    else who = (x.memberIds || []).map(function(id){ try { return memberName(id); } catch(e) { return ''; } }).filter(Boolean).join(', ');
  } catch(e) {}
  return (x.date ? fmtShort(x.date) : '?') + (x.time ? ' ' + x.time : '') + (who ? ' ' + who : '');
}
function __sbLessonProofLine212() {
  const fmt = function(n){ return String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.'); };
  const P = __sbLessonProof212;
  const a = (state.lessons || []).length;
  let c = (P && typeof P.cloud === 'number') ? P.cloud : null;
  if (c === null && typeof __sbCloudCounts === 'object' && __sbCloudCounts && typeof __sbCloudCounts.lessons === 'number') c = __sbCloudCounts.lessons;
  if (c === null) return '';
  const k = P ? ((P.empty || []).length + (+P.bad || 0)) : 0;
  const exp = c - k;
  if (P && !P.pending && (P.other || []).length) {
    const lbl = P.other.slice(0, 3).map(__sbLessonLabel212).join(' · ') + (P.other.length > 3 ? ' …' : '');
    return ' · <b style="color:#c62828;">⚠️ EKSİK: buluttaki ' + fmt(P.other.length) + ' ders uygulamada yok</b> (' + escapeHtml(lbl) + ') · <a href="#" onclick="sbResync(\\'manual\\');return false;">yenile</a>';
  }
  if (P && !P.pending && (P.localOnly || []).length) return ' · <b style="color:#c62828;">⚠️ ' + fmt(P.localOnly.length) + ' ders buluta gitmemiş</b> · <a href="#" onclick="cloudDotClick();return false;">şimdi gönder</a>';
  if (a === exp && !(P && P.pending)) return ' · bulut ' + fmt(exp) + ' ders = uygulama ' + fmt(a) + (k ? ' · <span style="color:var(--muted);">bulutta ' + fmt(k) + ' üyesiz boş ders kaydı (gösterilmez)</span>' : '');
  try { __sbScheduleLessonRecount212((window.__sbRecountMs212 != null) ? window.__sbRecountMs212 : 1500); } catch(e) {} // fark var ama sunucudan doğrulanmadı (silme/ekleme sonrası sayaç bayat olabilir)
  return ' · <span style="color:var(--muted);">ders sayımı kontrol ediliyor…</span>';
}""")

# ── 6) Tam çekimler (açılış + tazeleme): ham bulut satırlarından kimlik kanıtı
rep("""  const all = {};
  let __loadOk = true;
  for (const t of SB_TABLES) {
    all[t] = {};
    try {
      const r = await __sbSelectAll191(t); // v40: deterministik yukleme sirasi (order id) · v191: SAYFALI (1000 satir siniri)
      if (r && r.error) __loadOk = false;""",
    """  const all = {};
  let __loadOk = true;
  let __rawLes212 = null; // v212: kanıt için ham bulut ders satırları
  for (const t of SB_TABLES) {
    all[t] = {};
    try {
      const r = await __sbSelectAll191(t); // v40: deterministik yukleme sirasi (order id) · v191: SAYFALI (1000 satir siniri)
      if (r && r.error) __loadOk = false;
      if (t === 'lessons' && r && !r.error) __rawLes212 = r.data || []; // v212""")
rep("""  state = sbRowsToState(all);
  applyV10MigrationToState(state);
  sanitizeStateText(state);
  sbSnapshotShadow(sbStateToRows()); // shadow = SUNUCU hali (diff temeli)""",
    """  state = sbRowsToState(all);
  applyV10MigrationToState(state);
  sanitizeStateText(state);
  try { if (__rawLes212) __sbLessonProofFromRows212(__rawLes212, __sbCloudCounts.lessons, true); } catch(e) {} // v212: kimlik düzeyinde sayım kanıtı
  sbSnapshotShadow(sbStateToRows()); // shadow = SUNUCU hali (diff temeli)""")
rep("""    const all = {};
    let __resyncOk = true;
    for (const t of SB_TABLES) {
      all[t] = {};
      try { const r = await __sbSelectAll191(t); /* v191: SAYFALI */ if (r && r.error) __resyncOk = false; (r.data || []).forEach(""",
    """    const all = {};
    let __resyncOk = true;
    let __rawLes212r = null; // v212
    for (const t of SB_TABLES) {
      all[t] = {};
      try { const r = await __sbSelectAll191(t); /* v191: SAYFALI */ if (r && r.error) __resyncOk = false; if (t === 'lessons' && r && !r.error) __rawLes212r = r.data || []; /* v212 */ (r.data || []).forEach(""")
rep("""    sbSnapshotShadow(sbStateToRows());
    try { __sbVerifyCounts192('tazeleme'); } catch(e) {} // v192""",
    """    sbSnapshotShadow(sbStateToRows());
    try { if (__rawLes212r) __sbLessonProofFromRows212(__rawLes212r, __sbCloudCounts.lessons, true); } catch(e) {} // v212
    try { __sbVerifyCounts192('tazeleme'); } catch(e) {} // v192""")

# ── 7) Gönderim: ders eklendi/silindiyse bulut sayısı sunucudan yeniden sayılır
rep("""  const __ghostAll = [];   // v118: mezar taşı olmadan "yok" görünen kayıtlar (SİLİNMEZ)""",
    """  const __ghostAll = [];   // v118: mezar taşı olmadan "yok" görünen kayıtlar (SİLİNMEZ)
  let __lesChanged212 = false; // v212: ders eklendi/silindi → bulut sayım kanıtı tazelenir""")
rep("""    const ups = [], dels = [], upJson = {}, __ghost = [];""",
    """    const ups = [], dels = [], upJson = {}, __ghost = []; let __lesNew212 = 0; // v212""")
rep("""      if (__sbShadow[t] && __sbShadow[t][id] === j) continue;""",
    """      if (__sbShadow[t] && __sbShadow[t][id] === j) continue;
      if (t === 'lessons' && !(__sbShadow[t] && (id in __sbShadow[t]))) __lesNew212++; // v212: buluta YENİ ders""")
rep("""    if (dels.length) __pushedSummary.push('SİL '+t+'['+dels.slice(0,5).join(',')+']');""",
    """    if (dels.length) __pushedSummary.push('SİL '+t+'['+dels.slice(0,5).join(',')+']');
    if (t === 'lessons' && (__lesNew212 || dels.length)) __lesChanged212 = true; // v212""")
rep("""  if (okAll) { __sbLastPushAt = Date.now(); try { localStorage.removeItem(DIRTY_KEY); } catch(e){} }""",
    """  if (okAll) { __sbLastPushAt = Date.now(); try { localStorage.removeItem(DIRTY_KEY); } catch(e){} }
  if (okAll && __lesChanged212) { try { __sbScheduleLessonRecount212(); } catch(e) {} } // v212: silme/eklemeden sonra bulut SUNUCUDAN yeniden sayılır (bayat sayaç "EKSİK" demesin)""")

# ── 8) Gerçek zamanlı: başka cihazdan ders geldi/silindi → yeniden say
rep("""        try { sbApplyOne(t, __applyId); save(); } catch(e) { console.error('[sb] applyOne', e); }""",
    """        try { sbApplyOne(t, __applyId); save(); } catch(e) { console.error('[sb] applyOne', e); }
        if (t === 'lessons') { try { __sbScheduleLessonRecount212(); } catch(e) {} } // v212: bulut sayım kanıtı tazelenir""")

# ── 9) Panel satırı: kanıttan
rep("""    // v192 (Kerem: "dersler gorunmeli KESINLIKLE"): bulut sayimi = uygulama sayimi kaniti; esit degilse kirmizi uyari
    let __cnt192 = '';
    try {
      const c = (typeof __sbCloudCounts === 'object' && __sbCloudCounts && typeof __sbCloudCounts.lessons === 'number') ? __sbCloudCounts.lessons : null;
      const a = (state.lessons || []).length;
      if (c !== null) {
        const fmt = n => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
        __cnt192 = (c === a) ? ' · bulut ' + fmt(c) + ' ders = uygulama ' + fmt(a) : ' · <b style="color:#c62828;">⚠️ EKSİK: bulut ' + fmt(c) + ' ders, uygulama ' + fmt(a) + '</b>';
      }
    } catch(e) { __cnt192 = ''; }""",
    """    // v192 (Kerem: "dersler gorunmeli KESINLIKLE"): bulut sayimi = uygulama sayimi kaniti
    // v212: kanıt kimlik düzeyinde (__sbLessonProofLine212) — üyesiz boş kayıt eksik sayılmaz, bayat sayaç sunucudan yeniden sayılır
    let __cnt192 = '';
    try { __cnt192 = __sbLessonProofLine212(); } catch(e) { __cnt192 = ''; }""")

# ── 10) Açılış/tazeleme uyarısı: kanıttan (boş kayıt için uyarı yok)
rep("""function __sbVerifyCounts192(where) {
  try {
    const c = __sbCloudCounts && __sbCloudCounts.lessons; const a = (state.lessons || []).length;""",
    """function __sbVerifyCounts192(where) {
  try {
    const P = __sbLessonProof212; // v212: kimlik düzeyinde kanıt varsa o esas — üyesiz boş kayıt "eksik" değildir
    if (P && typeof P.cloud === 'number') {
      if (!P.pending && (P.other || []).length) { __trace('⚠️ SAYIM FARKI (' + where + '): bulutta olup uygulamada olmayan ' + P.other.length + ' ders'); if (typeof plToast === 'function') plToast('⚠️ Bulutta olup uygulamada görünmeyen ' + P.other.length + ' ders var — Panel’deki satırdan yenile', 8000); return false; }
      return true;
    }
    const c = __sbCloudCounts && __sbCloudCounts.lessons; const a = (state.lessons || []).length;""")

io.open(P, 'w', encoding='utf-8').write(s)

W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v211-2026-10-21-134';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v211-2026-10-21-134';", "const CACHE_NAME = 'pilateria-v212-2026-10-24-135';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v212 OK')
