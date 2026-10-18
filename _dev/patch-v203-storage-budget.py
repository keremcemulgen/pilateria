# -*- coding: utf-8 -*-
# v203 — YEREL DEPO BÜTÇESİ (Kerem 18.10: "Ortağın iPhone'unda 'yerel depo doldu' uyarısı; hiçbir türlü veri eksiği olmamalı").
# KÖK: localStorage'da tam durum kopyaları çoğalıyor — 'pilateria' + açılış-öncesi halka (5 slot) + eski tek slot + 3 günlük + pre_pull/
# pre_overwrite/mass_delete/undo → 10+ kopya × ~700K karakter. Chrome kotası ~10 MB (5M karakter), WebKit (iPhone/iPad/Safari) ~5 MB (2,5M
# karakter): durum 691K karakter olunca iPhone'da 3 kopya bile sığmıyor → QuotaExceeded → budama → yine sığmazsa ALERT ve save() false:
# değişiklik bulut gönderimine de GİRMİYORDU (yeniden açılışta yerel bayat hâl + bulut → kaybolur). ÇÖZÜM: (1) platform bütçesi (WebKit 2,3M,
# diğer 4,6M karakter; test için window.__PIL_LS_BUDGET), (2) her yedek yazımından önce bütçeye göre yer açma (öncelik: bozuk-yedek → undo →
# mass_delete → pre_pull → eski günlükler → eski halka slotları → eski tek slot → pre_overwrite → son günlük → son halka slotu; 'pilateria' ve
# küçük ayar anahtarlarına dokunulmaz), (3) save(): yazımdan ÖNCE yer aç; yine olmazsa budayıp 2. deneme; yine olmazsa BULUT GÖNDERİMİ YİNE
# PLANLANIR (veri bulutta güvende), uyarı metni buna göre; (4) günlük yedek/halka/tek-slot/pre_pull/pre_overwrite/mass_delete yazımları bütçeli.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:120])
    s = s.replace(old, new)

# (1)+(2) yardımcılar — __pilStoragePrune'un önüne
rep("""function __pilStoragePrune(aggressive) {""",
"""// ═══════ v203 YEREL DEPO BÜTÇESİ ═══════
function __pilLsBudgetForUA203(ua, platform, maxTouch) { // WebKit (iPhone/iPad/Safari) ~5 MB → 2,3M karakter; diğerleri ~10 MB → 4,6M
  ua = String(ua || '');
  const ios = /iP(hone|ad|od)/.test(ua) || (platform === 'MacIntel' && (+maxTouch || 0) > 1);
  const webkitOnly = /AppleWebKit/.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Android|SamsungBrowser/.test(ua);
  return (ios || webkitOnly) ? 2300000 : 4600000;
}
function __pilLsBudget203() {
  try { if (window.__PIL_LS_BUDGET > 0) return +window.__PIL_LS_BUDGET; } catch(e) {}
  try { return __pilLsBudgetForUA203(navigator.userAgent, navigator.platform, navigator.maxTouchPoints); } catch(e) { return 2300000; }
}
function __pilLsUsed203() { let n = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += (k || '').length + (localStorage.getItem(k) || '').length; } } catch(e) {} return n; }
function __pilLsRingOrder203() { // halka slotları EN ESKİDEN en yeniye (ix = en son yazılan)
  let ix = 0; try { ix = parseInt(localStorage.getItem('pilateria_pre_cloud_ix') || '0', 10) || 0; } catch(e) {}
  const out = []; for (let k = 1; k <= 5; k++) { const sN = ((ix + k - 1) % 5) + 1; try { if (localStorage.getItem('pilateria_pre_cloud_' + sN) !== null) out.push('pilateria_pre_cloud_' + sN); } catch(e) {} }
  return out;
}
function __pilLsVictims203(protect) { // feda sırası: değeri en düşük yedekten en değerliye; 'pilateria' ve ayar anahtarları ASLA
  const has = function(k){ try { return localStorage.getItem(k) !== null; } catch(e) { return false; } };
  const v = [];
  __pilLsKeys('pilateria_corrupted_BACKUP_').forEach(function(k){ v.push(k); });
  ['pilateria_undo', 'pilateria_undo_meta', 'pilateria_mass_delete_backup', 'pilateria_pre_pull_backup', 'pilateria_pre_resync_backup'].forEach(function(k){ if (has(k)) v.push(k); });
  const d = __pilLsKeys('pilateria_daily_'); const ring = __pilLsRingOrder203().filter(function(k){ return k !== protect; });
  d.slice(0, Math.max(0, d.length - 1)).forEach(function(k){ v.push(k); });          // eski günlükler (sonuncu kalır)
  ring.slice(0, Math.max(0, ring.length - 1)).forEach(function(k){ v.push(k); });    // eski halka slotları (en yenisi kalır)
  if (has('pilateria_pre_cloud_backup') && protect !== 'pilateria_pre_cloud_backup') v.push('pilateria_pre_cloud_backup');
  if (has('pilateria_pre_overwrite_backup') && protect !== 'pilateria_pre_overwrite_backup') v.push('pilateria_pre_overwrite_backup');
  if (d.length) v.push(d[d.length - 1]);
  if (ring.length) v.push(ring[ring.length - 1]);
  return v.filter(function(k){ return k !== protect && k !== 'pilateria'; });
}
function __pilLsMakeRoom203(need, protect) { // 'need' karakter yazılabilsin diye bütçeye göre yer aç → sığıyorsa true
  try {
    const budget = __pilLsBudget203();
    if (__pilLsUsed203() + (+need || 0) <= budget) return true;
    const victims = __pilLsVictims203(protect); const gone = [];
    for (let i = 0; i < victims.length; i++) {
      try { localStorage.removeItem(victims[i]); gone.push(victims[i].replace('pilateria_', '')); } catch(e) {}
      if (__pilLsUsed203() + (+need || 0) <= budget) break;
    }
    if (gone.length) { try { __trace('🧹 Yerel depo bütçesi: ' + gone.length + ' yedek düşürüldü (' + gone.join(', ').slice(0, 160) + ')'); } catch(e) {} }
    return __pilLsUsed203() + (+need || 0) <= budget;
  } catch(e) { return false; }
}
function __pilStoragePrune(aggressive) {""")

# (3) save(): yazımdan önce yer aç; kota yolunda 2. deneme; yine olmazsa bulut gönderimi
rep("""    try { __undoTrack(__pilLastRows); __pilLastRows = null; } catch(e) {} // v165: geri alma — baska cihazdan gelen degisiklik damgasi
    localStorage.setItem('pilateria', JSON.stringify(state));""",
"""    try { __undoTrack(__pilLastRows); __pilLastRows = null; } catch(e) {} // v165: geri alma — baska cihazdan gelen degisiklik damgasi
    const __json203 = JSON.stringify(state);
    try { const __old203 = (localStorage.getItem('pilateria') || '').length; if (__json203.length > __old203) __pilLsMakeRoom203(__json203.length - __old203, 'pilateria'); } catch(e) {} // v203: yazımdan ÖNCE bütçeye göre yer aç (kota hatasına hiç düşmesin)
    localStorage.setItem('pilateria', __json203);""")
rep("""        try {
          __pilStoragePrune(true);
          localStorage.setItem('pilateria', JSON.stringify(state));
          window.__pilQuotaRetry = false;""",
"""        try {
          __pilStoragePrune(true);
          try { const __j = JSON.stringify(state); __pilLsMakeRoom203(__j.length, 'pilateria'); } catch(_) {} // v203: halka dahil her yedeği feda et — CANLI hâl her zaman yazılır
          localStorage.setItem('pilateria', JSON.stringify(state));
          window.__pilQuotaRetry = false;""")
rep("""        } catch(e2) { window.__pilQuotaRetry = false; }
      }
      alert(
        '⚠️ YEREL DEPO DOLU\\n\\n' +
        'Tarayıcı yerel deposu (~5MB) doldu, yeni değişiklik kaydedilemedi.\\n\\n' +
        'Yapılacaklar:\\n' +
        '1. Otomatik budama da yetmedi — sayfayı tam yenile (Ctrl+Shift+R), sorun sürerse Claude\\'a bildir\\n' +
        '2. Eski ödeme/ders kayıtlarını arşivle (gelecekte arşivleme özelliği gelecek)\\n' +
        '3. Verilerin bulutta güvende (otomatik senkron) — bu uyarı yalnız yerel depoyla ilgilidir'
      );
    } else {""",
"""        } catch(e2) { window.__pilQuotaRetry = false; }
      }
      // v203: yerel kopya yazılamadı ama değişiklik BELLEKTE ve BULUTA GİDİYOR — gönderim mutlaka planlanır (eski davranış: planlanmıyordu → yeniden açılışta kayıp)
      window.__pilLocalWriteFailed = Date.now();
      try { markDirtyAndSchedulePush(); } catch(_) {}
      try { if (SUPABASE_MODE) sbSchedulePush(); } catch(_) {}
      try { if (typeof __trace === 'function') __trace('⚠️ YEREL DEPO DOLU — yerel kopya yazılamadı; değişiklik buluta gönderiliyor'); } catch(_) {}
      alert(
        '⚠️ YEREL DEPO DOLU\\n\\n' +
        'Bu cihazın tarayıcı deposu (~5MB) doldu; değişikliğin yerel kopyası yazılamadı.\\n' +
        'Değişiklik BULUTA GÖNDERİLİYOR — veri kaybı yok. Bulut noktası yeşil olmadan sayfayı kapatma/yenileme.\\n\\n' +
        'Sonra sayfayı yenile (yerel yedekler budanır). Sorun sürerse Claude\\'a bildir.'
      );
    } else {""")

# (4a) halka: bütçeye göre yer aç; eski tek slot yalnız sığıyorsa
rep("""    const pack = JSON.stringify({ at: new Date().toISOString(), h: h, state: raw });
    let ok = false;
    for (let tryN = 0; tryN < 7 && !ok; tryN++) {
      try { localStorage.setItem('pilateria_pre_cloud_' + next, pack); ok = true; }""",
"""    const pack = JSON.stringify({ at: new Date().toISOString(), h: h, state: raw });
    let ok = false;
    try { const __cur = (localStorage.getItem('pilateria_pre_cloud_' + next) || '').length; __pilLsMakeRoom203(Math.max(0, pack.length - __cur) + 64, 'pilateria_pre_cloud_' + next); } catch(e) {} // v203: bütçe
    for (let tryN = 0; tryN < 7 && !ok; tryN++) {
      try { localStorage.setItem('pilateria_pre_cloud_' + next, pack); ok = true; }""")
rep("""    if (ok) { try { localStorage.setItem('pilateria_pre_cloud_ix', String(next)); } catch(e) {} }
    try { localStorage.setItem('pilateria_pre_cloud_backup', pack); } catch(e) {}   // eski kurtarma konsollarıyla uyum""",
"""    if (ok) { try { localStorage.setItem('pilateria_pre_cloud_ix', String(next)); } catch(e) {} }
    try { const __curB = (localStorage.getItem('pilateria_pre_cloud_backup') || '').length; if (__pilLsUsed203() - __curB + pack.length <= __pilLsBudget203()) localStorage.setItem('pilateria_pre_cloud_backup', pack); else { try { localStorage.removeItem('pilateria_pre_cloud_backup'); } catch(_) {} } } catch(e) {}   // eski kurtarma konsollarıyla uyum · v203: yalnız bütçeye sığıyorsa (halka zaten tutuyor)""")

# (4b) günlük yedek: bütçe
rep("""    while (mine.length >= 3) localStorage.removeItem(mine.shift()); // v125: en fazla 3 gun (sunucuda saatlik+gecelik+aybasi yedek var)
    try { localStorage.setItem(key, cur); }""",
"""    while (mine.length >= 3) localStorage.removeItem(mine.shift()); // v125: en fazla 3 gun (sunucuda saatlik+gecelik+aybasi yedek var)
    if (!__pilLsMakeRoom203(cur.length + key.length, key)) { try { __trace('📅 Cihaz günlük yedeği ATLANDI (yerel depo bütçesi)'); } catch(e) {} return; } // v203
    try { localStorage.setItem(key, cur); }""")

# (4c) pre_pull / pre_overwrite / mass_delete: bütçe
rep("""      const __cur = localStorage.getItem('pilateria');
      if (__cur) localStorage.setItem('pilateria_pre_pull_backup', JSON.stringify({ at: new Date().toISOString(), state: __cur }));""",
"""      const __cur = localStorage.getItem('pilateria');
      if (__cur) { const __pk = JSON.stringify({ at: new Date().toISOString(), state: __cur }); __pilLsMakeRoom203(__pk.length, 'pilateria_pre_pull_backup'); localStorage.setItem('pilateria_pre_pull_backup', __pk); } // v203: bütçe""")
rep("""          for (;;) {
            try { localStorage.setItem('pilateria_pre_overwrite_backup', __cur); __ok = true; break; }""",
"""          try { __pilLsMakeRoom203(__cur.length, 'pilateria_pre_overwrite_backup'); } catch(e) {} // v203: bütçe
          for (;;) {
            try { localStorage.setItem('pilateria_pre_overwrite_backup', __cur); __ok = true; break; }""")
rep("""    try { const __cur = localStorage.getItem('pilateria'); if (__cur) localStorage.setItem('pilateria_mass_delete_backup', JSON.stringify({ at: new Date().toISOString(), state: __cur })); } catch(e) {}
    __trace('⛔ SİLME SİGORTASI (push)""",
"""    try { const __cur = localStorage.getItem('pilateria'); if (__cur) { const __pk = JSON.stringify({ at: new Date().toISOString(), state: __cur }); __pilLsMakeRoom203(__pk.length, 'pilateria_mass_delete_backup'); localStorage.setItem('pilateria_mass_delete_backup', __pk); } } catch(e) {} // v203: bütçe
    __trace('⛔ SİLME SİGORTASI (push)""")
rep("""            try { const __cur = localStorage.getItem('pilateria'); if (__cur) localStorage.setItem('pilateria_mass_delete_backup', JSON.stringify({ at: new Date().toISOString(), state: __cur })); } catch(e) {}
            __trace('⛔ REALTIME SİLME SİGORTASI ATTI""",
"""            try { const __cur = localStorage.getItem('pilateria'); if (__cur) { const __pk = JSON.stringify({ at: new Date().toISOString(), state: __cur }); __pilLsMakeRoom203(__pk.length, 'pilateria_mass_delete_backup'); localStorage.setItem('pilateria_mass_delete_backup', __pk); } } catch(e) {} // v203: bütçe
            __trace('⛔ REALTIME SİLME SİGORTASI ATTI""")

rep('<meta name="app-version" content="2026.10.18.125">', '<meta name="app-version" content="2026.10.18.126">')
rep("const APP_VERSION = '2026.10.18.125';", "const APP_VERSION = '2026.10.18.126';")
io.open(P, 'w', encoding='utf-8').write(s)
SW = 'sw.js'; w = io.open(SW, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v202-2026-10-18-125';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v202-2026-10-18-125';", "const CACHE_NAME = 'pilateria-v203-2026-10-18-126';")
io.open(SW, 'w', encoding='utf-8').write(w)
print('v203 yama tamam')
