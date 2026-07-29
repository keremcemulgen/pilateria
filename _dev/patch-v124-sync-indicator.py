# -*- coding: utf-8 -*-
# v124 — SENKRON GOSTERGESINI DIRILT + hata gorunurlugu + switchPage zirhi
# Kok neden: syncConfigured() SUPABASE_MODE'da daima false -> setCloudDot her cagrida noktayi GIZLIYORDU.
# Bulut kesintisi ile saglikli senkron gorsel olarak ayirt edilemiyordu (v103/v122 kazalarini yasamis uygulamada).
# NOT: syncConfigured'in kendisine DOKUNULMAZ — legacy JSONBin yollari (schedulePush/autoPush) false'a guveniyor.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) setCloudDot + cloudDotClick: Supabase-bilincli ----------
rep("""function setCloudDot(mode) {
  const el = document.getElementById('cloud-dot');
  if (!el) return;
  if (!syncConfigured()) { el.style.display = 'none'; return; }
  el.style.display = 'inline-block';
  const last = syncCfg.lastSync ? new Date(syncCfg.lastSync).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) : '';
  const m = {
    ok:      ['☁️✓', 'Bulutla eşitlendi' + (last ? ' · ' + last : '')],
    syncing: ['☁️…', 'Buluta yazılıyor...'],
    pending: ['☁️●', 'Kaydedildi — buluta gönderilmeyi bekliyor'],
    offline: ['☁️⚠', 'Gönderilemedi — bağlantı gelince otomatik gönderilir'],
  }[mode] || ['☁️', 'Bulut senkron'];
  el.textContent = m[0];
  el.title = m[1] + ' — dokun: şimdi senkronize et';
}
function cloudDotClick() { if (isDirty()) schedulePush(0); else { lastAutoPullTs = 0; autoPullIfNeeded('manual'); } }
""",
"""function setCloudDot(mode) {
  const el = document.getElementById('cloud-dot');
  if (!el) return;
  // v124: SUPABASE modunda gosterge CANLI — eski kod burada her zaman gizliyordu (kok neden: syncConfigured=false)
  if (SUPABASE_MODE ? !sbClient : !syncConfigured()) { el.style.display = 'none'; return; }
  el.style.display = 'inline-block';
  const lastMs = SUPABASE_MODE ? (__sbLastPushAt || 0) : (syncCfg.lastSync || 0);
  const last = lastMs ? new Date(lastMs).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) : '';
  const m = {
    ok:      ['☁️✓', '#2E7D32', 'Bulutla eşitlendi' + (last ? ' · ' + last : '')],
    syncing: ['☁️…', '#e6a100', 'Buluta yazılıyor...'],
    pending: ['☁️●', '#e6a100', 'Kaydedildi — buluta gönderilmeyi bekliyor'],
    offline: ['☁️⚠', '#c62828', 'Gönderilemedi — bağlantı gelince otomatik gönderilir'],
  }[mode] || ['☁️', '', 'Bulut senkron'];
  el.textContent = m[0];
  el.style.color = m[1];
  el.style.fontWeight = '700';
  el.title = m[2] + ' — dokun: şimdi senkronize et';
  __renderSyncStatusLine(mode, last);
}
// v124: paneldeki yazili senkron durumu — nokta ile AYNI kaynaktan beslenir, ayri gercek uretmez
function __renderSyncStatusLine(mode, last) {
  const el = document.getElementById('dash-sync-status');
  if (!el) return;
  if (SUPABASE_MODE && !sbClient) { el.textContent = ''; return; }
  if (mode === 'offline') {
    el.innerHTML = '⚠️ <b style="color:#c62828;">Buluta GÖNDERİLEMİYOR</b> — değişiklikler bu cihazda bekliyor' + (last ? ' · son başarılı gönderim: ' + last : '') + ' · <a href="#" onclick="cloudDotClick();return false;">şimdi dene</a>';
  } else if (mode === 'syncing' || mode === 'pending') {
    el.textContent = '☁️ Buluta yazılıyor…';
  } else {
    el.textContent = '☁️ Bulut senkron aktif' + (last ? ' · son gönderim: ' + last : '');
  }
}
function cloudDotClick() {
  if (SUPABASE_MODE) { if (window.plToast) plToast('☁️ Eşitleniyor…'); try { sbResync('manual'); } catch(e) {} return; }
  if (isDirty()) schedulePush(0); else { lastAutoPullTs = 0; autoPullIfNeeded('manual'); }
}
// v124: kalp atisi — gosterge 45 sn'de bir GERCEK durumdan tazelenir (takilip kalmis "ok" olamaz)
try { setInterval(function(){ try { if (SUPABASE_MODE && !sbClient) return; setCloudDot(navigator.onLine === false ? 'offline' : (isDirty() ? 'pending' : 'ok')); } catch(e){} }, 45000); } catch(e) {}
""")

# ---------- 2) yakalanmamis hata kaydi ----------
rep("""function save() {
""",
"""// v124: SESSIZ COKME OLMASIN — her yakalanmamis hata kayda gecer + kullanici uyarilir (dk'da 1 kez)
window.__pilErrors = window.__pilErrors || [];
function __pilLogErr(kind, msg) {
  try {
    window.__pilErrors.push({ t: new Date().toISOString(), kind: String(kind), msg: String(msg).slice(0, 500) });
    if (window.__pilErrors.length > 30) window.__pilErrors.shift();
    const now = Date.now();
    if (!window.__pilErrToastAt || now - window.__pilErrToastAt > 60000) {
      window.__pilErrToastAt = now;
      if (window.plToast) plToast('⚠️ Beklenmedik bir hata oluştu — verin güvende, gerekirse sayfayı yenile');
    }
    try { if (typeof __trace === 'function') __trace('⚠️ HATA(' + kind + '): ' + String(msg).slice(0, 120)); } catch(_) {}
  } catch(_) {}
}
window.addEventListener('error', function(ev){ __pilLogErr('error', (ev && ev.message) || 'bilinmeyen'); });
window.addEventListener('unhandledrejection', function(ev){ var r = ev && ev.reason; __pilLogErr('promise', (r && (r.stack || r.message)) || r || 'promise'); });
function save() {
""")

# ---------- 3) switchPage zirhi ----------
rep("""  if (page==='dashboard') renderDashboard();
  if (page==='calendar') renderCalendar();
  if (page==='groups') renderGroups();
  if (page==='members') renderMembers();
  if (page==='archive') { const __am=document.getElementById('archive-month'); if(__am){ __am.value = ((document.getElementById('member-month')||{}).value) || currentMonth(); } renderArchive(); }
  if (page==='instructors') { renderInstructors(); renderSalaries(); }
  if (page==='payments') renderPayments();
  if (page==='reports') renderReports();
  if (page==='settings') renderSettings();
  window.scrollTo(0,0);
""",
"""  // v124: bir sayfanin render hatasi GECISI COKERTMEZ — kaydet, devam et
  const __sg = (f) => { try { f(); } catch(e) { if (typeof __pilLogErr === 'function') __pilLogErr('render:' + page, (e && e.stack) || e); } };
  if (page==='dashboard') __sg(renderDashboard);
  if (page==='calendar') __sg(renderCalendar);
  if (page==='groups') __sg(renderGroups);
  if (page==='members') __sg(renderMembers);
  if (page==='archive') { const __am=document.getElementById('archive-month'); if(__am){ __am.value = ((document.getElementById('member-month')||{}).value) || currentMonth(); } __sg(renderArchive); }
  if (page==='instructors') { __sg(renderInstructors); __sg(renderSalaries); }
  if (page==='payments') __sg(renderPayments);
  if (page==='reports') __sg(renderReports);
  if (page==='settings') __sg(renderSettings);
  window.scrollTo(0,0);
""")

# ---------- 4) surum ----------
rep('<meta name="app-version" content="2026.07.29.46">', '<meta name="app-version" content="2026.07.29.47">')
rep("const APP_VERSION = '2026.07.29.46';", "const APP_VERSION = '2026.07.29.47';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v123-2026-07-29-46';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v124-2026-07-29-47';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
