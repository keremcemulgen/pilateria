#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v118 — BULUTTAN SİLME ARTIK "YOKLUK"TAN ÇIKARILMAZ (MEZAR TAŞI KAPISI)

Kerem (27 Tem): "bir daha böyle bir şey yaşanmamalı. Buluta veriler anında gidiyor zaten."

KÖK KUSUR (v104..v117 boyunca DURAN): sbDiffPush, "gölgede var ama yerelde yok" gördüğü HER
kaydı buluttan SİLİYOR. Bu bir ÇIKARIMDIR; kullanıcının silme NİYETİ değil. Bayat/eksik bir
yerel kopya (başka cihazın yazdığı, bu cihazın hiç görmediği kayıtlar) bu çıkarımla buluttan
SİLİNİYORDU. 26 Temmuz'da tam bu oldu: 25 ders + 2 ödeme yok oldu; v104 sigortası ATMADI çünkü
eşiği (delTotal > 15 && delTotal > shadowTotal*0.3) bu boyutta ~216 silme istiyor.

v118 KANONU:
  A) MEZAR TAŞI: bulutta bir kayıt YALNIZCA bu cihazda o kayıt gerçekten silindiğinde yazılan
     mezar taşı varsa silinir. Mezar taşı save() içinde, kimlik farkıyla, TEK noktada üretilir;
     senkron uygulaması (realtime/açılış çekimi/resync) sırasında ASLA yazılmaz. Mezar taşı yoksa
     kayıt SİLİNMEZ: gölgeden düşürülür, izlemeye yazılır, buluttan tazelenir.
     En kötü hâl "silme yayılmadı" (görünür, zararsız) olur; "veri kayboldu" DEĞİL.
  B) AÇILIŞ-ÖNCESİ YEDEK HALKASI: tek slot yerine 5 slot. Tek slot, aynı gün ikinci açılışta
     kurtarılacak hâli eziyordu — kurtarma penceresi bir açılış kadardı.
"""
import io, re, sys

SRC = 'pilateria.html'
s = io.open(SRC, encoding='utf-8').read()
orig_len = len(s)

def rep(old, new, n=1, tag=''):
    global s
    c = s.count(old)
    assert c == n, 'ANCHOR[%s]: beklenen %d, bulunan %d' % (tag, n, c)
    s = s.replace(old, new, n)

# ─────────────────────────────────────────────────────────────────────────────
# A1) MEZAR TAŞI MAKİNESİ + save() KANCASI
# ─────────────────────────────────────────────────────────────────────────────
OLD_SAVE = """function save() {
  try {
    // v113 TARIH KANONU: yalniz GERCEK kullanici duzenlemesi damgalanir (senkron-uygulama yazimi degil).
    if (!window.__pilSuppressDirty && !__sbApplying) state._lastLocalEditAt = Date.now();
    sanitizeStateText(state); // v21 GÜVENLİK: her kalici yazimdan once metinleri temizle
"""

NEW_SAVE = """// ═══════ v118 MEZAR TAŞI (TOMBSTONE): BULUTTAN SİLME ARTIK "YOKLUK"TAN ÇIKARILMAZ ═══════
// Kerem (27 Tem): "bir daha böyle bir şey yaşanmamalı."
// KÖK KUSUR: sbDiffPush "gölgede var, yerelde yok" gördüğü her kaydı buluttan SİLİYORDU. Bu bir
// ÇIKARIMDIR, kullanıcı NİYETİ değil: bayat/eksik bir yerel kopya, başka cihazın yazdığı kayıtları
// bu çıkarımla yok ediyordu (26 Tem: 25 ders + 2 ödeme). v117 gölgeyi güvenilir temele bağladı,
// ama çıkarımı KALDIRMADI. v118 kanonu: bir kayıt buluttan YALNIZCA bu cihazda gerçekten
// silindiğinde yazılan mezar taşıyla silinir. Mezar taşı yoksa SİLİNMEZ — gölgeden düşürülür ve
// buluttan tazelenir. En kötü hâl "silme yayılmadı" (görünür, zararsız); "veri kayboldu" DEĞİL.
var __PIL_TOMB_KEY = 'pilateria_tomb';
var __PIL_TOMB_TTL = 30 * 24 * 3600 * 1000;   // 30 gün: silme bu süre içinde kesin yayılmıştır
var __PIL_TOMB_MAX = 4000;                    // üst sınır (yerel depo kotası koruması)
var __pilPrevIds = null;                      // tablo → { id:1 } — bir önceki save anındaki kimlikler
var __pilTombCache = null;
function __pilTombLoad() {
  if (__pilTombCache) return __pilTombCache;
  var o = {};
  try { var r = localStorage.getItem(__PIL_TOMB_KEY); if (r) o = JSON.parse(r) || {}; } catch(e) { o = {}; }
  if (!o || typeof o !== 'object') o = {};
  var now = Date.now(), n = 0, t, id;
  for (t in o) {
    if (!o[t] || typeof o[t] !== 'object') { delete o[t]; continue; }
    for (id in o[t]) { if ((now - (+o[t][id] || 0)) > __PIL_TOMB_TTL) delete o[t][id]; else n++; }
  }
  if (n > __PIL_TOMB_MAX) {                   // taşarsa EN ESKİden kırp
    var all = [];
    for (t in o) for (id in o[t]) all.push([+o[t][id] || 0, t, id]);
    all.sort(function(a, b) { return a[0] - b[0]; });
    for (var i = 0; i < all.length - __PIL_TOMB_MAX; i++) delete o[all[i][1]][all[i][2]];
  }
  __pilTombCache = o;
  return o;
}
function __pilTombSave() { try { localStorage.setItem(__PIL_TOMB_KEY, JSON.stringify(__pilTombCache || {})); } catch(e) {} }
function __pilTombHas(t, id) { var o = __pilTombLoad(); return !!(o[t] && o[t][id]); }
// Bir önceki save ile şimdiki hâl arasındaki KİMLİK farkını mezar taşına yazar.
// SENKRON UYGULAMASI sırasında (realtime / açılış çekimi / resync) ASLA yazmaz: orada kaybolan
// kayıt "başka cihazın kararı"dır, BU cihazın niyeti değildir.
function __pilTombRecord() {
  try {
    var rows = sbStateToRows(), now = {}, i, j, t, id;
    for (i = 0; i < SB_TABLES.length; i++) { t = SB_TABLES[i]; var m = {}; for (id in rows[t]) m[id] = 1; now[t] = m; }
    if (__pilPrevIds && !(window.__pilSuppressDirty || __sbApplying)) {
      var o = __pilTombLoad(), ts = Date.now(), added = 0, list = [];
      for (j = 0; j < SB_TABLES.length; j++) {
        t = SB_TABLES[j];
        var prev = __pilPrevIds[t] || {};
        for (id in prev) {
          if (now[t][id]) continue;
          o[t] = o[t] || {};
          if (!o[t][id]) added++;
          o[t][id] = ts;
          if (list.length < 6) list.push(t + '/' + id);
        }
      }
      if (added) { __pilTombSave(); try { __trace('🪦 SİLME NİYETİ kaydedildi (' + added + '): ' + list.join(', ')); } catch(e) {} }
    }
    __pilPrevIds = now;
  } catch(e) { /* GÜVENLİ TARAF: mezar taşı yazılamadıysa silme de OLMAZ (kayıt korunur) */ }
}
function save() {
  try {
    // v113 TARIH KANONU: yalniz GERCEK kullanici duzenlemesi damgalanir (senkron-uygulama yazimi degil).
    if (!window.__pilSuppressDirty && !__sbApplying) state._lastLocalEditAt = Date.now();
    sanitizeStateText(state); // v21 GÜVENLİK: her kalici yazimdan once metinleri temizle
    __pilTombRecord();        // v118: buluttan silme YALNIZ burada doğan açık niyetle yapılır
"""
rep(OLD_SAVE, NEW_SAVE, 1, 'save-tombstone')

# ─────────────────────────────────────────────────────────────────────────────
# A2) sbDiffPush — SİLME ARTIK MEZAR TAŞI İSTER
# ─────────────────────────────────────────────────────────────────────────────
rep("""    try { if (window.plToast) plToast('⛔ Toplu silme engellendi — bulut verileri KORUNDU'); } catch(e) {}
  }
  for (const t of SB_TABLES) {
    const ups = [], dels = [], upJson = {};""",
"""    try { if (window.plToast) plToast('⛔ Toplu silme engellendi — bulut verileri KORUNDU'); } catch(e) {}
  }
  const __ghostAll = [];   // v118: mezar taşı olmadan "yok" görünen kayıtlar (SİLİNMEZ)
  for (const t of SB_TABLES) {
    const ups = [], dels = [], upJson = {}, __ghost = [];""", 1, 'ghost-decl')

rep("""    if (!__massDelete) { for (const id in (__sbShadow[t] || {})) if (!(id in rows[t])) dels.push(id); } // v104: sigorta attiysa SILME gonderme""",
"""    // v118 MEZAR TAŞI KAPISI: "gölgede var, yerelde yok" TEK BAŞINA silme gerekçesi DEĞİLDİR.
    // Buluttan yalnız BU CİHAZDA gerçekten silinmiş (mezar taşı yazılmış) kayıt silinir. Mezar taşı
    // olmayanlar HAYALET'tir: bayat/eksik yerel kopyanın hiç görmediği kayıtlar. Onlar silinmez;
    // gölgeden düşürülür (tekrar tekrar denenmesin) ve aşağıda buluttan tazelenir.
    if (!__massDelete) {
      for (const id in (__sbShadow[t] || {})) {
        if (id in rows[t]) continue;
        if (__pilTombHas(t, id)) dels.push(id); else __ghost.push(id);
      }
      __ghost.forEach(id => { if (__sbShadow[t]) delete __sbShadow[t][id]; if (__sbVer[t]) delete __sbVer[t][id]; __ghostAll.push(t + '/' + id); });
    }""", 1, 'tomb-gate')

rep("""  if (__massDelete) { try { localStorage.removeItem(DIRTY_KEY); } catch(e) {} clearTimeout(sbDiffPush._healT);""",
"""  if (__ghostAll.length) {
    // v118: burada VERİ KAYBI olurdu. Artık olmuyor — kayıtlar bulutta duruyor, yerel tazelenecek.
    __trace('👻 HAYALET SİLME ENGELLENDİ (' + __ghostAll.length + '): ' + __ghostAll.slice(0, 8).join(', ') + (__ghostAll.length > 8 ? ' …' : '') + ' — bu cihazda silinmediler, bulut KORUNDU, yerel buluttan tazelenecek');
    try { if (window.plToast) plToast('🛡️ ' + __ghostAll.length + ' kayıt silinmekten korundu — buluttan tazeleniyor'); } catch(e) {}
    clearTimeout(sbDiffPush._ghostT);
    sbDiffPush._ghostT = setTimeout(function() { try { sbResync('ghost-delete-guard'); } catch(e) {} }, (window.__pilGhostHealMs || 4000));
  }
  if (__massDelete) { try { localStorage.removeItem(DIRTY_KEY); } catch(e) {} clearTimeout(sbDiffPush._healT);""", 1, 'ghost-heal')

# ─────────────────────────────────────────────────────────────────────────────
# B) AÇILIŞ-ÖNCESİ YEDEK HALKASI (tek slot → 5 slot)
# ─────────────────────────────────────────────────────────────────────────────
rep("""// ===== v104 GARANTI KATMANLARI (Kerem): cihaz gunluk yedek halkasi + ikinci bulut (JSONBin) =====
function __pilDailySnapshot() {""",
"""// v118 AÇILIŞ-ÖNCESİ YEDEK HALKASI: v103'teki TEK slot, aynı gün ikinci kez uygulama açılınca
// kurtarılacak hâli EZİYORDU — kurtarma penceresi tek bir açılış kadardı. Artık 5 slotluk halka;
// eski tek-slot anahtarı (pilateria_pre_cloud_backup) uyumluluk için yazılmaya devam eder.
function __pilPreCloudRing(raw) {
  try {
    if (!raw) return;
    const h = __sbHash(raw);
    let ix = 0; try { ix = parseInt(localStorage.getItem('pilateria_pre_cloud_ix') || '0', 10) || 0; } catch(e) { ix = 0; }
    // AYNI İÇERİK ikinci kez slot tüketmesin (değişiklik yokken açılıp kapanmak halkayı boşaltmasın)
    try { const last = localStorage.getItem('pilateria_pre_cloud_' + (ix || 5)); if (last && JSON.parse(last).h === h) return; } catch(e) {}
    const next = (ix % 5) + 1;
    const pack = JSON.stringify({ at: new Date().toISOString(), h: h, state: raw });
    let ok = false;
    for (let tryN = 0; tryN < 7 && !ok; tryN++) {
      try { localStorage.setItem('pilateria_pre_cloud_' + next, pack); ok = true; }
      catch(e) {
        // KOTA: önce EN ESKİ halka slotunu (yazdığımız hariç), sonra en eski günlüğü düşür
        let freed = false;
        for (let k = 1; k <= 5 && !freed; k++) {
          const sN = ((next + k - 1) % 5) + 1;
          if (sN === next) continue;
          try { if (localStorage.getItem('pilateria_pre_cloud_' + sN)) { localStorage.removeItem('pilateria_pre_cloud_' + sN); freed = true; } } catch(e2) {}
        }
        if (!freed) {
          const d = [];
          for (let i = 0; i < localStorage.length; i++) { const k2 = localStorage.key(i); if (k2 && k2.indexOf('pilateria_daily_') === 0) d.push(k2); }
          d.sort();
          if (d.length) { try { localStorage.removeItem(d[0]); freed = true; } catch(e2) {} }
        }
        if (!freed) break;
      }
    }
    if (ok) { try { localStorage.setItem('pilateria_pre_cloud_ix', String(next)); } catch(e) {} }
    try { localStorage.setItem('pilateria_pre_cloud_backup', pack); } catch(e) {}   // eski kurtarma konsollarıyla uyum
  } catch(e) {}
}

// ===== v104 GARANTI KATMANLARI (Kerem): cihaz gunluk yedek halkasi + ikinci bulut (JSONBin) =====
function __pilDailySnapshot() {""", 1, 'ring-fn')

rep("""  try {
    if ((state.members || []).length) {
      const __curRaw = localStorage.getItem('pilateria');
      if (__curRaw) localStorage.setItem('pilateria_pre_cloud_backup', JSON.stringify({ at: new Date().toISOString(), state: __curRaw }));
    }
  } catch(e){}""",
"""  try { if ((state.members || []).length) __pilPreCloudRing(localStorage.getItem('pilateria')); } catch(e){}   // v118: 5 slotluk halka""", 1, 'ring-call')

# v103 yorumunu guncelle (tek slot -> halka)
rep("""  // (a) cihaz halini TEK SLOT yedekle (pilateria_pre_cloud_backup) -> recover.html'de gorunur/geri yuklenir.""",
"""  // (a) cihaz halini yedekle (v118: 5 slotluk halka + uyumluluk slotu) -> kurtarma konsollarinda gorunur.""", 1, 'ring-comment')

# ─────────────────────────────────────────────────────────────────────────────
# SÜRÜM
# ─────────────────────────────────────────────────────────────────────────────
rep("const APP_VERSION = '2026.07.26.40';", "const APP_VERSION = '2026.07.27.41';", 1, 'version')

io.open(SRC, 'w', encoding='utf-8').write(s)
print('v118 uygulandi: %d -> %d bayt (+%d)' % (orig_len, len(s), len(s) - orig_len))
