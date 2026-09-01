# -*- coding: utf-8 -*-
# v165 — GERI AL (Kerem, secenek 3): yikici/toplu islemlerden ONCE anlik yedek (JSON), "↩️ Geri Al"
# dugmesi (Uyeler + Gruplar + Pasif Uyeler araclari) son islemi geri alir; onay ister; islemden
# sonraki degisiklikler de geri alinir (uyari metninde soylenir). Yigin en fazla 8; son yedek
# localStorage'da (pilateria_undo) — sayfa yenilense de 1 geri alma hakki kalir. Geri alinca
# applyV10MigrationToState + save() (bulut senkronu) + arayuz tazeleme.
# Kapsanan islemler: removeMemberFromMonth (uyeyi aydan cikar / deleteMember), archiveGroupMonthly,
# permanentDeleteMember, deleteGroup (kalici), saveGroup (kaydet), saveBatchDates, createSecondPackage,
# createGroupSecondPackage, reactivateMemberForMonth (Aktive Et), markGroup/MemberPackageExtended,
# quickDeletePayment, deletePayment, deleteLesson.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) altyapi (getReformers'in hemen onune) ----------
rep("""// BUG FIX (v9): reformer sayısı her zaman geçerli pozitif sayı dönsün
function getReformers() {""",
"""// ===== v165 (Kerem): GERI AL — yikici/toplu islemlerden once anlik yedek =====
// BULUT GUVENLIGI KANONU: geri alma "eski hali oldugu gibi yaz" DEGILDIR. Yedek alindiktan sonra
// BASKA CIHAZDAN gelen (senkron-uygulama yazimi: realtime / tazeleme / acilis cekimi) kayitlar
// KORUNUR; yalniz bu cihazin kendi degisiklikleri geri sarilir. Bunun icin yigin doluyken her
// save() kayit-kayit (tablo/id, anahtar-sirasindan bagimsiz JSON) fark cikarir; senkron-uygulama
// yaziminda degisen kayitlar "dis" (ext) damgalanir. Geri alirken yedekten sonra dis damga almis
// kayitlar SIMDIKI haliyle kalir ve onay metninde listelenir. Yerel yigin en fazla 8; son yedek
// localStorage'da (sayfa yenilense de 1 geri alma hakki; 3 gunden eskisi dusurulur).
var __UNDO_MAX = 8, __UNDO_LS = 'pilateria_undo', __UNDO_META_LS = 'pilateria_undo_meta';
var __undoStack = [];
var __undoPrevRows = null;   // tablo/id → kanonik JSON (son save'deki hal) — yalniz yigin doluyken
var __undoExt = {};          // tablo/id → ms (yedekten sonra baska cihazdan gelen degisiklik damgasi)
function __undoStable(v) {   // anahtar sirasindan bagimsiz JSON (jsonb siralamasi fark uretmesin)
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(__undoStable).join(',') + ']';
  var ks = Object.keys(v).filter(function(k){ return v[k] !== undefined; }).sort();
  return '{' + ks.map(function(k){ return JSON.stringify(k) + ':' + __undoStable(v[k]); }).join(',') + '}';
}
function __undoFlat(rows) { var out = {}; for (var t in rows) for (var id in rows[t]) out[t + '/' + id] = __undoStable(rows[t][id]); return out; }
function __undoMetaSave() { try { localStorage.setItem(__UNDO_META_LS, JSON.stringify({ ext: __undoExt })); } catch(e) {} }
// save() icinden: yigin doluyken kayit-kayit fark; senkron-uygulama yazimindaki farklar "dis" damgalanir
function __undoTrack(rows) {
  try {
    if (!__undoStack || !__undoStack.length) return;
    var cur = __undoFlat(rows || sbStateToRows());
    if (__undoPrevRows) {
      var ext = !!(window.__pilSuppressDirty || (typeof __sbApplying !== 'undefined' && __sbApplying));
      if (ext) {
        var now = Date.now(), n = 0, k;
        for (k in cur) if (__undoPrevRows[k] !== cur[k]) { __undoExt[k] = now; n++; }
        for (k in __undoPrevRows) if (!(k in cur)) { __undoExt[k] = now; n++; }
        if (n) { __undoMetaSave(); try { __trace('↩️ Geri Al: ' + n + ' kayıt başka cihazdan değişti — geri almada korunacak'); } catch(e) {} }
      }
    }
    __undoPrevRows = cur;
  } catch(e) {}
}
function __undoSnapshot(label) {
  try {
    if (!__undoStack.length) { __undoExt = {}; __undoPrevRows = null; }
    if (!__undoPrevRows) __undoPrevRows = __undoFlat(sbStateToRows());   // izleme tabani = su anki hal
    var snap = { label: String(label || 'İşlem'), at: new Date().toISOString(), ms: Date.now(), state: JSON.stringify(state) };
    __undoStack.push(snap);
    while (__undoStack.length > __UNDO_MAX) __undoStack.shift();
    try { localStorage.setItem(__UNDO_LS, JSON.stringify(snap)); } catch(e) { try { localStorage.removeItem(__UNDO_LS); } catch(_) {} } // kota: bayat yedek kalmasin
    __undoMetaSave();
    renderUndoBtn();
  } catch(e) {}
}
function __undoLoad() {
  try {
    var raw = localStorage.getItem(__UNDO_LS); if (!raw) return;
    var snap = JSON.parse(raw); if (!(snap && snap.state && snap.label)) return;
    var ms = snap.ms || Date.parse(snap.at) || 0;
    if (!ms || (Date.now() - ms) > 3 * 24 * 3600 * 1000) { localStorage.removeItem(__UNDO_LS); localStorage.removeItem(__UNDO_META_LS); return; }
    __undoStack = [snap];
    try { var meta = JSON.parse(localStorage.getItem(__UNDO_META_LS) || 'null'); if (meta && meta.ext) __undoExt = meta.ext; } catch(e) {}
    __undoPrevRows = __undoFlat(sbStateToRows());   // taban = cihazin acilistaki yerel hali; bulut cekiminin farki "dis" damgalanir
  } catch(e) {}
}
function __undoKeyLabel(k, srcs) {
  var i = k.indexOf('/'), t = k.slice(0, i), id = k.slice(i + 1);
  var R = function(tab) { for (var j = 0; j < srcs.length; j++) { var s = srcs[j]; if (s && s[tab] && s[tab][id]) return s[tab][id]; } return null; };
  try {
    if (t === 'members' || t === 'member_finance') { var m = R('members'); return '👤 ' + ((m && m.name) || id); }
    if (t === 'groups' || t === 'group_finance') { var g = R('groups'); return '👥 ' + ((g && g.name) || id); }
    if (t === 'lessons') { var l = R('lessons'); return '📅 Ders ' + (l ? (fmtDate(l.date) + ' ' + (l.time || '')) : id); }
    if (t === 'payments') { var p = R('payments'); return '💳 Ödeme ' + (p ? (money(p.amount) + ' ₺ ' + memberName(p.memberId)) : id); }
    if (t === 'instructors' || t === 'instructor_finance') { var h = R('instructors'); return '🧑‍🏫 ' + ((h && h.name) || id); }
    if (t === 'settings') return '⚙️ Ayarlar';
    if (t === 'expenses') return '🧾 Gider';
  } catch(e) {}
  return t + '/' + id;
}
function renderUndoBtn() {
  var snap = __undoStack[__undoStack.length - 1];
  document.querySelectorAll('.undo-btn').forEach(function(b){
    if (!snap) { b.style.display = 'none'; return; }
    b.style.display = '';
    b.textContent = '↩️ Geri Al: ' + snap.label;
    b.title = 'Son işlemi geri al (' + String(snap.at || '').slice(0, 16).replace('T', ' ') + ') — o işlemden sonra bu cihazda yapılan değişiklikler de geri alınır; başka cihazdan gelenler korunur';
  });
}
function undoLast() {
  var snap = __undoStack[__undoStack.length - 1];
  if (!snap) { alert('Geri alınacak işlem yok.'); return; }
  var when = ''; try { when = new Date(snap.at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }); } catch(e) {}
  var restored;
  try { restored = JSON.parse(snap.state); applyV10MigrationToState(restored); } catch(e) { alert('Geri alma başarısız: ' + ((e && e.message) || e)); return; }
  // Yedekten sonra BASKA CIHAZDAN degismis kayitlar korunur (simdiki haliyle kalir)
  var snapMs = snap.ms || Date.parse(snap.at) || 0, keep = [], curObj = null, snapObj = null;
  try {
    curObj = sbStateToRows(); snapObj = sbStateToRows(restored);
    var curF = __undoFlat(curObj), snapF = __undoFlat(snapObj), keys = {}, k;
    for (k in snapF) keys[k] = 1; for (k in curF) keys[k] = 1;
    for (k in keys) {
      if (snapF[k] === curF[k]) continue;
      var e = __undoExt[k] || 0; if (!(e && e >= snapMs)) continue;
      var t = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1);
      if ((t === 'instructor_payouts' || t === 'wa_templates') && !(curObj[t][id] && String(curObj[t][id].id) === id)) continue; // yapay id: kayit-bazli koruma yok
      keep.push(k);
    }
  } catch(e) { keep = []; curObj = null; }
  var keepNames = []; keep.forEach(function(k){ var n = __undoKeyLabel(k, [curObj, snapObj]); if (keepNames.indexOf(n) === -1) keepNames.push(n); });
  var msg = '"' + snap.label + '" işlemi (' + when + ') geri alınacak.\\n\\n• O işlemden SONRA bu cihazda yaptığın değişiklikler de geri alınır.\\n• Bulut da aynı hale getirilir.';
  if (keepNames.length) msg += '\\n\\n⚠️ Şu kayıtlar o işlemden sonra BAŞKA CİHAZDAN değiştiği için KORUNACAK (geri alınmayacak):\\n' + keepNames.slice(0, 8).join('\\n') + (keepNames.length > 8 ? '\\n… (+' + (keepNames.length - 8) + ' kayıt)' : '');
  msg += '\\n\\nDevam?';
  if (!confirm(msg)) return;
  __undoStack.pop();
  state = restored;
  if (keep.length && curObj) keep.forEach(function(k){ var i = k.indexOf('/'); try { sbApplyOne(k.slice(0, i), k.slice(i + 1), curObj); } catch(e) {} });
  try { var last = __undoStack[__undoStack.length - 1]; if (last) localStorage.setItem(__UNDO_LS, JSON.stringify(last)); else { localStorage.removeItem(__UNDO_LS); localStorage.removeItem(__UNDO_META_LS); } } catch(e) {}
  if (!__undoStack.length) { __undoPrevRows = null; __undoExt = {}; }
  save();
  ['modal-member-detail','modal-group-detail','modal-group','modal-member','modal-payment','modal-lesson','modal-batch-dates'].forEach(function(id){ try { var el = document.getElementById(id); if (el && el.classList.contains('open')) closeModal(id); } catch(e) {} });
  try { if (typeof __refreshUIInPlace === 'function') __refreshUIInPlace(); } catch(e) {}
  try { renderMembers(); renderGroups(); renderDashboard(); renderCalendar(); if (typeof renderArchive === 'function') renderArchive(); } catch(e) {}
  renderUndoBtn();
  try { __trace('↩️ GERİ ALINDI: ' + snap.label + (keepNames.length ? ' (korunan: ' + keepNames.length + ')' : '')); } catch(e) {}
  if (typeof plToast === 'function') { try { plToast('↩️ Geri alındı: ' + snap.label + (keepNames.length ? ' — ' + keepNames.length + ' kayıt başka cihazdan geldiği için korundu' : '')); } catch(e) {} }
}
// BUG FIX (v9): reformer sayısı her zaman geçerli pozitif sayı dönsün
function getReformers() {""")

# ---------- 1b) senkron kancalari ----------
# sbStateToRows: istege bagli state parametresi (yedek halinin satirlarini cikarmak icin)
rep("""function sbStateToRows() {
  const rows = {}; SB_TABLES.forEach(t => rows[t] = {});
  (state.members || []).forEach(m => { const s = sbSplitMember(m); rows.members[m.id] = s.base; rows.member_finance[m.id] = s.fin; });
  (state.groups || []).forEach(g => { const s = sbSplitGroup(g); rows.groups[g.id] = s.base; rows.group_finance[g.id] = s.fin; });
  (state.lessons || []).forEach(l => { rows.lessons[l.id] = l; });
  (state.instructors || []).forEach(i => { const s = sbSplitInstructor(i); rows.instructors[i.id] = s.base; rows.instructor_finance[i.id] = s.fin; });
  (state.payments || []).forEach(pm => { rows.payments[pm.id] = pm; });
  (state.instructorPayouts || []).forEach((po, ix) => { const id = po.id || ('po-' + ix + '-' + (po.month || '')); rows.instructor_payouts[id] = po; });
  (state.packageTypes || []).forEach(pt => { rows.package_types[pt.id] = pt; });
  (state.campaigns || []).forEach(c => { rows.campaigns[c.id] = c; });
  (state.waTemplates || []).forEach((w, ix) => { const id = w.id || ('wt-' + ix); rows.wa_templates[id] = w; });
  (state.expenses || []).forEach(e => { if (e && e.id) rows.expenses[e.id] = e; }); // v127
  const st = JSON.parse(JSON.stringify(state.settings || {}));
  st._pinHash = state._pinHash; st.monthInit = state.monthInit || {};
  rows.settings['singleton'] = st;
  return rows;
}""",
"""function sbStateToRows(__st) {
  const S = __st || state; // v165: istege bagli state (geri alma yedeginin satirlari)
  const rows = {}; SB_TABLES.forEach(t => rows[t] = {});
  (S.members || []).forEach(m => { const s = sbSplitMember(m); rows.members[m.id] = s.base; rows.member_finance[m.id] = s.fin; });
  (S.groups || []).forEach(g => { const s = sbSplitGroup(g); rows.groups[g.id] = s.base; rows.group_finance[g.id] = s.fin; });
  (S.lessons || []).forEach(l => { rows.lessons[l.id] = l; });
  (S.instructors || []).forEach(i => { const s = sbSplitInstructor(i); rows.instructors[i.id] = s.base; rows.instructor_finance[i.id] = s.fin; });
  (S.payments || []).forEach(pm => { rows.payments[pm.id] = pm; });
  (S.instructorPayouts || []).forEach((po, ix) => { const id = po.id || ('po-' + ix + '-' + (po.month || '')); rows.instructor_payouts[id] = po; });
  (S.packageTypes || []).forEach(pt => { rows.package_types[pt.id] = pt; });
  (S.campaigns || []).forEach(c => { rows.campaigns[c.id] = c; });
  (S.waTemplates || []).forEach((w, ix) => { const id = w.id || ('wt-' + ix); rows.wa_templates[id] = w; });
  (S.expenses || []).forEach(e => { if (e && e.id) rows.expenses[e.id] = e; }); // v127
  const st = JSON.parse(JSON.stringify(S.settings || {}));
  st._pinHash = S._pinHash; st.monthInit = S.monthInit || {};
  rows.settings['singleton'] = st;
  return rows;
}""")

# sbApplyOne: istege bagli kaynak (golge yerine verilen satir haritasi) — geri almada korunan kayitlar icin
rep("""function sbApplyOne(t, id) {
  if (!state || id == null) return;
  const S = (tab) => (__sbShadow[tab] && __sbShadow[tab][id] != null) ? JSON.parse(__sbShadow[tab][id]) : null;""",
"""function sbApplyOne(t, id, __src) {
  if (!state || id == null) return;
  const S = (tab) => __src ? ((__src[tab] && __src[tab][id] != null) ? JSON.parse(JSON.stringify(__src[tab][id])) : null)
                           : ((__sbShadow[tab] && __sbShadow[tab][id] != null) ? JSON.parse(__sbShadow[tab][id]) : null); // v165: __src = geri almada korunan kayit kaynagi""")

# save(): mezar tasi satirlarini geri alma izlemesine de ver
rep("""var __pilPrevIds = null;                      // tablo → { id:1 } — bir önceki save anındaki kimlikler""",
"""var __pilPrevIds = null;                      // tablo → { id:1 } — bir önceki save anındaki kimlikler
var __pilLastRows = null;                     // v165: son save'de kurulan satirlar (geri alma izlemesi ayni satirlari kullanir)""")
rep("""    var rows = sbStateToRows(), now = {}, i, j, t, id;
    for (i = 0; i < SB_TABLES.length; i++) { t = SB_TABLES[i]; var m = {}; for (id in rows[t]) m[id] = 1; now[t] = m; }""",
"""    var rows = sbStateToRows(), now = {}, i, j, t, id;
    __pilLastRows = rows; // v165
    for (i = 0; i < SB_TABLES.length; i++) { t = SB_TABLES[i]; var m = {}; for (id in rows[t]) m[id] = 1; now[t] = m; }""")
rep("""    __pilTombRecord();        // v118: buluttan silme YALNIZ burada doğan açık niyetle yapılır
    localStorage.setItem('pilateria', JSON.stringify(state));""",
"""    __pilTombRecord();        // v118: buluttan silme YALNIZ burada doğan açık niyetle yapılır
    try { __undoTrack(__pilLastRows); __pilLastRows = null; } catch(e) {} // v165: geri alma — baska cihazdan gelen degisiklik damgasi
    localStorage.setItem('pilateria', JSON.stringify(state));""")

# kota budamasi: geri alma yedegi en once feda edilir
rep("""      ['pilateria_pre_pull_backup', 'pilateria_pre_overwrite_backup', 'pilateria_pre_cloud_backup'].forEach(function(k){ try { localStorage.removeItem(k); } catch(e) {} });""",
"""      ['pilateria_undo', 'pilateria_undo_meta', 'pilateria_pre_pull_backup', 'pilateria_pre_overwrite_backup', 'pilateria_pre_cloud_backup'].forEach(function(k){ try { localStorage.removeItem(k); } catch(e) {} }); // v165: geri alma yedegi de""")

# ---------- 2) dugmeler (Uyeler / Gruplar / Pasif) ----------
rep("""      <button class="btn secondary pl-owner-only" onclick="openWaBulkFromMembers()" title="Görünen aydaki tüm aktif üyelere WhatsApp mesajı hazırla">💬 Toplu WhatsApp</button>""",
"""      <button class="btn secondary pl-owner-only" onclick="openWaBulkFromMembers()" title="Görünen aydaki tüm aktif üyelere WhatsApp mesajı hazırla">💬 Toplu WhatsApp</button>
      <button class="btn small secondary undo-btn pl-owner-only" style="display:none;" onclick="undoLast()">↩️ Geri Al</button>""")

rep("""      <button class="btn small secondary" onclick="openGroupModal()" title="Boş grup oluştur — üyeleri sonradan ekleyebilirsin">📭 Boş Grup</button>""",
"""      <button class="btn small secondary" onclick="openGroupModal()" title="Boş grup oluştur — üyeleri sonradan ekleyebilirsin">📭 Boş Grup</button>
      <button class="btn small secondary undo-btn pl-owner-only" style="display:none;" onclick="undoLast()">↩️ Geri Al</button>""")

rep("""        <input type="search" id="archive-search" placeholder="Pasif üye ara..." oninput="renderArchive()" style="max-width:240px;">""",
"""        <input type="search" id="archive-search" placeholder="Pasif üye ara..." oninput="renderArchive()" style="max-width:240px;">
        <button class="btn small secondary undo-btn pl-owner-only" style="display:none;" onclick="undoLast()">↩️ Geri Al</button>""")

# switchPage: dugme durumu her sayfa gecisinde
rep("""function switchPage(page) {""",
"""function switchPage(page) {
  try { renderUndoBtn(); } catch(e) {} // v165""")

# init: son yedegi yukle
rep("""init().catch(function(e){ console.error('[init] acilis hatasi', e); });   // v120 Y-2: init artik async""",
"""try { __undoLoad(); renderUndoBtn(); } catch(e) {} // v165: sayfa yenilense de son geri alma hakki
init().catch(function(e){ console.error('[init] acilis hatasi', e); });   // v120 Y-2: init artik async""")

# ---------- 3) kancalar ----------
# removeMemberFromMonth (onaydan sonra)
rep("""  if (!confirm(`"${m.name}" üyesi ${monthISO} ayından itibaren pasife alınacak.\\n\\n• Geri alana kadar sonraki aylarda da pasif kalır (Pasif Üyeler listesinde birikir).\\n• Geçmiş aylar (önceki paket, ders, ödeme) korunur.\\n\\nDevam?`)) return false;""",
"""  if (!confirm(`"${m.name}" üyesi ${monthISO} ayından itibaren pasife alınacak.\\n\\n• Geri alana kadar sonraki aylarda da pasif kalır (Pasif Üyeler listesinde birikir).\\n• Geçmiş aylar (önceki paket, ders, ödeme) korunur.\\n\\nDevam?`)) return false;
  __undoSnapshot((m.name || 'Üye') + ' — ' + monthISO + ' ayından çıkar'); // v165""")

# archiveGroupMonthly
rep("""  g.archived = true;
  g.archivedAt = todayISO();
  let cancelled = 0;""",
"""  __undoSnapshot('Grup pasife al: ' + groupDisplayName(g, cm)); // v165
  g.archived = true;
  g.archivedAt = todayISO();
  let cancelled = 0;""")

# permanentDeleteMember
rep("""  if (!confirm(`UYARI: "${m.name}" KALICI silinecek!\\n\\nTüm ödemeleri, dersleri ve grup üyelikleri kaldırılacak. Bu işlem geri alınamaz.\\n\\nDevam mı?`)) return;""",
"""  if (!confirm(`UYARI: "${m.name}" KALICI silinecek!\\n\\nTüm ödemeleri, dersleri ve grup üyelikleri kaldırılacak.\\n\\nDevam mı?`)) return;
  __undoSnapshot('Kalıcı sil: ' + (m.name || 'Üye')); // v165""")

# deleteGroup kalici
rep("""  if (!confirm(`"${groupDisplayName(g)}" grubu KALICI olarak silinsin mi? (Grup zaten pasif; bu işlem grup kaydını tamamen kaldırır — geçmiş ay görünümlerinden de düşer.)`)) return;""",
"""  if (!confirm(`"${groupDisplayName(g)}" grubu KALICI olarak silinsin mi? (Grup zaten pasif; bu işlem grup kaydını tamamen kaldırır — geçmiş ay görünümlerinden de düşer.)`)) return;
  __undoSnapshot('Grup kalıcı sil: ' + groupDisplayName(g)); // v165""")

# saveGroup (dogrulama gecince)
rep("""  const isNew = !id;
  // Yeni eklenen üyeleri diğer gruplardan/bireysel derslerden çıkar (taşıma)""",
"""  const isNew = !id;
  __undoSnapshot((isNew ? 'Yeni grup' : 'Grup düzenle') + (name ? ': ' + name : '')); // v165
  // Yeni eklenen üyeleri diğer gruplardan/bireysel derslerden çıkar (taşıma)""")

# saveBatchDates (hak tavani gecince, yazmadan once)
rep("""  let g = null, m = null;
  if (__batchDatesTarget.type === 'group') {
    g = state.groups.find(x => x.id === __batchDatesTarget.id);
    if (!g) return;""",
"""  let g = null, m = null;
  __undoSnapshot('Toplu ders gir: ' + (__batchDatesTarget.type === 'group' ? groupNameForMonth(__batchDatesTarget.id, packageMonth) : memberName(__batchDatesTarget.id)) + ' — ' + packageMonth); // v165
  if (__batchDatesTarget.type === 'group') {
    g = state.groups.find(x => x.id === __batchDatesTarget.id);
    if (!g) return;""")

# createSecondPackage (uye): iki onaydan sonra
rep("""    if (!confirm(`"${r.name}" kaydı zaten var (geçmiş bir aydan). Bu kayıt ${ay} ayı için YENİDEN ETKİNLEŞTİRİLECEK — yeni kayıt açılmaz; ödeme/ders geçmişi aynı kayıtta birikir.\\n\\nDevam?`)) return;
    reactivateMemberForMonth(r.id, ay);""",
"""    if (!confirm(`"${r.name}" kaydı zaten var (geçmiş bir aydan). Bu kayıt ${ay} ayı için YENİDEN ETKİNLEŞTİRİLECEK — yeni kayıt açılmaz; ödeme/ders geçmişi aynı kayıtta birikir.\\n\\nDevam?`)) return;
    __undoSnapshot('Paket uyandır: ' + r.name + ' — ' + ay); // v165
    reactivateMemberForMonth(r.id, ay);""")
rep("""  if (!confirm(`"${name}" adında BAĞIMSIZ bir üye kaydı oluşturulacak.\\n\\n• ${rootName} ile AYNI kişi, ayrı paket: kendi ödemesi, dersleri ve ders hakkı ayrı tutulur.\\n• Aktif üye SAYISINI DEĞİŞTİRMEZ.\\n• İstersen bir gruba ekleyebilir veya bireysel paket olarak kullanabilirsin.\\n\\nDevam?`)) return;""",
"""  if (!confirm(`"${name}" adında BAĞIMSIZ bir üye kaydı oluşturulacak.\\n\\n• ${rootName} ile AYNI kişi, ayrı paket: kendi ödemesi, dersleri ve ders hakkı ayrı tutulur.\\n• Aktif üye SAYISINI DEĞİŞTİRMEZ.\\n• İstersen bir gruba ekleyebilir veya bireysel paket olarak kullanabilirsin.\\n\\nDevam?`)) return;
  __undoSnapshot(n + '. paket: ' + rootName + ' — ' + ay); // v165""")

# createGroupSecondPackage: iki onaydan sonra
rep("""    const ros = (r.memberIds || []).filter(Boolean);
    ros.forEach(function(mid){ reactivateMemberForMonth(mid, ay); });
    r.monthlyMembers = r.monthlyMembers || {}; r.monthlyMembers[ay] = ros.slice();""",
"""    const ros = (r.memberIds || []).filter(Boolean);
    __undoSnapshot('Grup paketi uyandır: ' + groupDisplayName(r, ay) + ' — ' + ay); // v165
    ros.forEach(function(mid){ reactivateMemberForMonth(mid, ay); });
    r.monthlyMembers = r.monthlyMembers || {}; r.monthlyMembers[ay] = ros.slice();""")
rep("""  const cloneIds = srcRos.map(function(mid){
    const mm = state.members.find(function(x){ return x.id === mid; }); if (!mm) return null;
    const rootId = mm.secondOfMember || mm.id;
    const ms = pkgSlotForMonth(rootId, ay);""",
"""  __undoSnapshot(n + '. paket grubu: ' + groupDisplayName(g, ay) + ' — ' + ay); // v165
  const cloneIds = srcRos.map(function(mid){
    const mm = state.members.find(function(x){ return x.id === mid; }); if (!mm) return null;
    const rootId = mm.secondOfMember || mm.id;
    const ms = pkgSlotForMonth(rootId, ay);""")

# reactivateMemberForMonth (Aktive Et)
rep("""  if (m.archived && typeof unarchiveMember==='function') unarchiveMember(id, month);
  __closeArchivePeriodAt(m, month); // v45: acik carry-forward pasif donemini month'ta KAPAT (gecmis korunur, month'tan itibaren aktif)""",
"""  __undoSnapshot('Aktive et: ' + (m.name || 'Üye') + ' — ' + month); // v165
  if (m.archived && typeof unarchiveMember==='function') unarchiveMember(id, month);
  __closeArchivePeriodAt(m, month); // v45: acik carry-forward pasif donemini month'ta KAPAT (gecmis korunur, month'tan itibaren aktif)""")

# markGroupPackageExtended / markMemberPackageExtended (not alindiktan sonra)
rep("""    const note = await plPrompt('Paket uzaması nedeni / notu (opsiyonel):', pkg.extendedNote || 'Paket geçen aydan sarktı, bu ay ücret alınmadı.');
    if (note === null) return;
    pkg.status = 'extended';
    pkg.price = 0;
    pkg.extendedNote = note;
    // v131 (v122 notu)""",
"""    const note = await plPrompt('Paket uzaması nedeni / notu (opsiyonel):', pkg.extendedNote || 'Paket geçen aydan sarktı, bu ay ücret alınmadı.');
    if (note === null) return;
    __undoSnapshot('Paket uzadı: ' + groupDisplayName(g, monthISO) + ' — ' + monthISO); // v165
    pkg.status = 'extended';
    pkg.price = 0;
    pkg.extendedNote = note;
    // v131 (v122 notu)""")
rep("""    const note = await plPrompt('Paket uzaması nedeni / notu (opsiyonel):', pkg.extendedNote || 'Paket geçen aydan sarktı, bu ay ücret alınmadı.');
    if (note === null) return;
    pkg.status = 'extended';
    pkg.price = 0;
    pkg.extendedNote = note;
    // Aylık fiyat override'ı da güncelle""",
"""    const note = await plPrompt('Paket uzaması nedeni / notu (opsiyonel):', pkg.extendedNote || 'Paket geçen aydan sarktı, bu ay ücret alınmadı.');
    if (note === null) return;
    __undoSnapshot('Paket uzadı: ' + (m.name || 'Üye') + ' — ' + monthISO); // v165
    pkg.status = 'extended';
    pkg.price = 0;
    pkg.extendedNote = note;
    // Aylık fiyat override'ı da güncelle""")

# odeme / ders silme
rep("""  if (!confirm(`${fmtDate(p.date)} tarihli ${money(p.amount)} ₺ ödeme silinecek. Emin misin?`)) return;
  state.payments = state.payments.filter(x=>x.id!==payId);""",
"""  if (!confirm(`${fmtDate(p.date)} tarihli ${money(p.amount)} ₺ ödeme silinecek. Emin misin?`)) return;
  __undoSnapshot('Ödeme sil: ' + money(p.amount) + ' ₺ — ' + memberName(p.memberId)); // v165
  state.payments = state.payments.filter(x=>x.id!==payId);""")
rep("""  if (!confirm('Bu ödeme silinecek. Emin misin?')) return;
  state.payments = state.payments.filter(p=>p.id!==id);""",
"""  if (!confirm('Bu ödeme silinecek. Emin misin?')) return;
  __undoSnapshot('Ödeme sil'); // v165
  state.payments = state.payments.filter(p=>p.id!==id);""")
rep("""  if (!confirm('Bu ders silinecek. Katılımcılar ders haklarını geri kazanacak. Emin misin?')) return;
  state.lessons = state.lessons.filter(l=>l.id!==id);""",
"""  if (!confirm('Bu ders silinecek. Katılımcılar ders haklarını geri kazanacak. Emin misin?')) return;
  { const __dl = state.lessons.find(l=>l.id===id); __undoSnapshot('Ders sil: ' + (__dl ? (fmtDate(__dl.date) + ' ' + (__dl.time||'')) : '')); } // v165
  state.lessons = state.lessons.filter(l=>l.id!==id);""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.01.87">', '<meta name="app-version" content="2026.09.01.88">')
rep("const APP_VERSION = '2026.09.01.87';", "const APP_VERSION = '2026.09.01.88';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v164-2026-09-01-87';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v165-2026-09-01-88';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
