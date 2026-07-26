#!/usr/bin/env python3
# v117 — BAYAT CIHAZIN BULUTU GERI SARMASI (VERI KAYBI)
# Kerem (26 Tem): "ben PC den bir suru odeme ve ders girdim telefonumda guncellendi ortagim girdi
# ve VERILER DEGISTI ... bende suan tekrar girdim telefondan veriler degisti iphonedeki gibi oldu"
#
# KOK SEBEP — sbDiffPush "golgemden farkli" ile "BEN degistirdim"i AYNI SEY saniyor:
#   __sbShadow YALNIZ BELLEKTEDIR ve acilis cekimi (sbLoadAll) BASARIYLA bitene kadar BOSTUR.
#   Bos golge = "her kayit degismis". O pencerede yapilan HERHANGI bir save() -> sbSchedulePush ->
#   sbDiffPush, cihazin BAYAT yerel kopyasinin TAMAMINI _v = Date.now() (daima en yeni) damgasiyla
#   buluta basar. Baska cihazlarin yazdigi her kayit GERI SARILIR.
#   IKINCI YOL: sbLoadAll'in "kirli" dalinda golge SUNUCU halinden alinip hemen ardindan state
#   bayat yerel hale geri konur; sbDiffPush o zaman sunucuda olup yerelde olmayan id'leri SILME
#   olarak gorur. v104 toplu-silme sigortasi ancak >15 kayitta calistigi icin birkac kayit sessizce
#   silinir. (Ortagin bulutta hic gorunmeyen odemeleri tam bu iz.)
#   iPhone mukemmel kurban: persistSession:false her acilista giris zorunlu kiliyor, ardindan 13
#   SELECT sirayla donmeli; biri bile duserse retry 8 sn'de bir donerken uygulama TAM CALISIR
#   durumda ve golge BOS kaliyor.
#
# COZUM IKI PARCALI (hicbir mevcut davranisi bozmadan):
#  A) __sbBaseReady — golge GUVENILIR bir temelden alinmadan HICBIR diff-push yapilmaz. Gonderim
#     ertelenir, yerel degisiklik kirli bayrakta korunur, temel gelince gercek diff ile gonderilir.
#  B) __sbBootFp + __sbMergeUnsentLocal — acilisin kirli dalinda bayat state SUNUCUNUN UZERINE
#     KONMAZ. Temel SUNUCU halidir; yalnizca BU OTURUMDA gercekten degismis/olusmus kayitlar
#     yerelden alinir. Sunucuda olup yerelde olmayan kayit (baska cihazin yenisi) ASLA silinmez.
#
# TAKAS (bilincli, belgelendi): ONCEKI oturumdan kalmis gonderilememis DUZENLEME buluta yenilir
# (pilateria_pre_cloud_backup / recover.html ile kurtarilabilir). OLUSTURMA her oturumda korunur.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()

# ---------------------------------------------------------------- 1) __sbBaseReady BAYRAGI
a1 = "let __sbShadow = {};   // tablo → { id → JSON.stringify(data) }  (diff + echo-önleme)\n"
n1 = """let __sbShadow = {};   // tablo → { id → JSON.stringify(data) }  (diff + echo-önleme)
// v117 HAYATI: __sbShadow YALNIZ BELLEKTEDIR ve acilis cekimi bitene kadar BOSTUR. Bos golge
// "her kayit degismis" demektir; o halde yapilan bir push, cihazin BAYAT kopyasini buluta basip
// diger cihazlarin yazdiklarini geri sarar. Bu bayrak "golge GUVENILIR bir temelden alindi mi?"
// sorusunu tutar; yalniz sbSnapshotShadow icinde true olur.
let __sbBaseReady = false;
"""
assert s.count(a1) == 1, 'ANCHOR FAIL 1: __sbShadow bildirimi (%d)' % s.count(a1)
s = s.replace(a1, n1, 1)

# ---------------------------------------------------------------- 2) PARMAK IZI + BIRLESTIRME YARDIMCILARI
a2 = "// Sunucudan gelen satirlarin _v damgasini __sbVer'e al, veriden temizle (domain nesnesi temiz kalsin)\nfunction __sbHarvestVer(all) {"
n2 = """// ───────── v117: BAYAT CIHAZIN BULUTU GERİ SARMASI ─────────
// Kerem (26 Tem): "PC'den bir sürü ödeme ve ders girdim, telefonumda güncellendi; ortağım girdi ve
// VERİLER DEĞİŞTİ (eski hâline döndü); ben de telefondan girdim, aynısı oldu."
// Bu blok "bu kaydı BU OTURUMDA ben mi değiştirdim?" sorusunu KAYIT BAZINDA cevaplar. Önceki kanon
// (state genelinde _lastLocalEditAt karşılaştırması) YANLIŞTI: cihaz 10:00'da çekip 11:00'de ALAKASIZ
// bir kaydı düzenlerse, PC'nin 10:30'da yazdığı kaydı da "yerel daha yeni" sayarak geri sarıyordu.
function __sbHash(o) {           // djb2 — hızlı; yalnız "değişti mi?" sorusu için, kriptografik değil
  let s0; try { s0 = JSON.stringify(o); } catch(e) { return 'x'; }
  if (s0 == null) return 'n';
  let h = 5381;
  for (let i = 0; i < s0.length; i++) h = (((h << 5) + h) ^ s0.charCodeAt(i)) >>> 0;
  return h.toString(36) + ':' + s0.length;
}
function __sbMergeColls() { return ['members','groups','lessons','instructors','payments','packageTypes','campaigns']; }
// AÇILIŞ PARMAK İZİ: uygulama açıldığında yerel veri NEYDİ. `let state = load()` hemen ardından alınır.
function __sbFingerprint(st) {
  if (!st) return null;
  const fp = {};
  __sbMergeColls().forEach(function(k) {
    const m = {};
    (Array.isArray(st[k]) ? st[k] : []).forEach(function(r) { if (r && r.id != null) m[r.id] = __sbHash(r); });
    fp[k] = m;
  });
  fp._misc = __sbHash([st.settings || null, st.monthInit || null, st.instructorPayouts || [], st.waTemplates || [], st._pinHash || null]);
  return fp;
}
function __sbMiscHash(st) { return __sbHash([st.settings || null, st.monthInit || null, st.instructorPayouts || [], st.waTemplates || [], st._pinHash || null]); }
// AÇILIŞ BİRLEŞTİRME: temel SUNUCU halidir. Yalnızca BU OTURUMDA gerçekten değişmiş/oluşmuş
// kayıtlar yerelden alınır; dokunulmamış kayıtlar SUNUCUDAN gelir. Sunucuda olup yerelde olmayan
// kayıt (başka cihazın yeni kaydı) ASLA silinmez — yalnız bu oturumda gerçekten silinenler silinir.
// Parmak izi yoksa GÜVENLİ tarafa düşer: sunucu esas alınır (yerel kopya zaten pre_cloud_backup'ta).
function __sbMergeUnsentLocal(serverSt, localSt) {
  if (!serverSt) return localSt;
  if (!localSt) return serverSt;
  let fp = null; try { fp = __sbBootFp; } catch(e) { fp = null; }
  let kept = 0, fromServer = 0, rescued = 0, honoured = 0;
  __sbMergeColls().forEach(function(key) {
    const sv = Array.isArray(serverSt[key]) ? serverSt[key] : [];
    const lc = Array.isArray(localSt[key]) ? localSt[key] : [];
    const boot = (fp && fp[key]) || null;
    const svById = {}; sv.forEach(function(r) { if (r && r.id != null) svById[r.id] = r; });
    const out = [], seen = {};
    lc.forEach(function(r) {
      if (!r || r.id == null) { out.push(r); return; }                      // id'siz kayıt → dokunma, koru
      seen[r.id] = 1;
      if (!(r.id in svById)) { out.push(r); rescued++; return; }            // yerel-özgü OLUŞTURMA → KORU
      if (!boot) { out.push(svById[r.id]); fromServer++; return; }          // parmak izi yok → SUNUCU
      const b = boot[r.id];
      if (b === undefined || b !== __sbHash(r)) { out.push(r); kept++; return; } // bu oturumda dokunuldu → YEREL
      out.push(svById[r.id]); fromServer++;                                 // dokunulmadı → SUNUCU kazanır
    });
    sv.forEach(function(r) {
      if (!r || r.id == null) return;
      if (seen[r.id]) return;
      if (boot && boot[r.id] !== undefined) { honoured++; return; }         // açılışta BENDE vardı, artık yok → bu oturumda SİLİNDİ
      out.push(r); rescued++;                                               // hiç görmediğim kayıt → başka cihazın yenisi → KORU
    });
    serverSt[key] = out;
  });
  // ayar / şablon / hakediş bloğu: bu oturumda değiştiyse YEREL, değişmediyse SUNUCU
  try {
    if (fp && fp._misc !== undefined && fp._misc !== __sbMiscHash(localSt)) {
      serverSt.settings = localSt.settings; serverSt.monthInit = localSt.monthInit;
      serverSt.instructorPayouts = localSt.instructorPayouts; serverSt.waTemplates = localSt.waTemplates;
      if (localSt._pinHash) serverSt._pinHash = localSt._pinHash;
    }
  } catch(e) {}
  serverSt._lastLocalEditAt = Math.max(+serverSt._lastLocalEditAt || 0, +localSt._lastLocalEditAt || 0);
  try { __trace('AÇILIŞ BİRLEŞTİRME: yerel değişiklik ' + kept + ' · sunucudan ' + fromServer + ' · kurtarılan ' + rescued + ' · silme onaylanan ' + honoured + (fp ? '' : ' (parmak izi YOK → sunucu esas)')); } catch(e) {}
  return serverSt;
}
// Sunucudan gelen satirlarin _v damgasini __sbVer'e al, veriden temizle (domain nesnesi temiz kalsin)
function __sbHarvestVer(all) {"""
assert s.count(a2) == 1, 'ANCHOR FAIL 2: __sbHarvestVer basligi (%d)' % s.count(a2)
s = s.replace(a2, n2, 1)

# ---------------------------------------------------------------- 3) sbDiffPush TEMEL KALKANI
a3 = """async function sbDiffPush() {
  if (!sbClient) return;
  if (navigator.onLine === false) { setCloudDot && setCloudDot('offline'); return; }
"""
n3 = """async function sbDiffPush() {
  if (!sbClient) return;
  // v117 BAYAT-EZME KALKANI: golge GUVENILIR bir temelden alinmadan diff YAPILAMAZ. Bos/eksik
  // golge "her kayit degismis" demektir; bu halde push, bayat yerel kopyayi _v=Date.now() ile
  // buluta basip diger cihazlarin yazdiklarini geri sarar. Gonderim ERTELENIR (veri kaybolmaz:
  // kirli bayrak takili kalir), acilis cekimi bitince gercek diff ile gonderilir.
  if (!__sbBaseReady) {
    try { localStorage.setItem(DIRTY_KEY, '1'); } catch(e) {}
    __trace('⏸ TEMEL HAZIR DEĞİL (açılış çekimi tamamlanmadı) → gönderim ERTELENDİ, yerel değişiklik korunuyor');
    setCloudDot && setCloudDot('pending');
    clearTimeout(sbDiffPush._baseT);
    sbDiffPush._baseT = setTimeout(function(){ try { if (!__sbBaseReady && sbClient) sbLoadAll(); } catch(e) {} }, 5000);
    return;
  }
  if (navigator.onLine === false) { setCloudDot && setCloudDot('offline'); return; }
"""
assert s.count(a3) == 1, 'ANCHOR FAIL 3: sbDiffPush basi (%d)' % s.count(a3)
s = s.replace(a3, n3, 1)

# ---------------------------------------------------------------- 4) TEMEL HAZIR ISARETI
a4 = """function sbSnapshotShadow(rows) {
  __sbShadow = {};
"""
n4 = """function sbSnapshotShadow(rows) {
  __sbShadow = {};
  __sbBaseReady = true;   // v117: golge artik GUVENILIR bir temelden (sunucu cekimi / tasima / resync) alindi
"""
assert s.count(a4) == 1, 'ANCHOR FAIL 4: sbSnapshotShadow (%d)' % s.count(a4)
s = s.replace(a4, n4, 1)

# ---------------------------------------------------------------- 5) ACILIS KIRLI DALI -> BIRLESTIRME
a5 = """  if (__wasDirty && __localState) {
    // yerel hali geri koy → sbDiffPush yalniz YERELIN DEGISTIRDIGI kayitlari gonderir (sunucu-shadow ile diff)
    state = __localState;
"""
n5 = """  if (__wasDirty && __localState) {
    // v117: yerel hali OLDUGU GIBI geri koymak = bayat cihazin bulutu geri sarmasi (Kerem, 26 Tem).
    // Artik SUNUCU temel alinir; yalniz BU OTURUMDA gercekten degismis/olusmus kayitlar yerelden
    // gelir; sunucuda olup yerelde olmayan kayit (baska cihazin yenisi) ASLA silinmez.
    state = __sbMergeUnsentLocal(state, __localState);
"""
assert s.count(a5) == 1, 'ANCHOR FAIL 5: sbLoadAll kirli dali (%d)' % s.count(a5)
s = s.replace(a5, n5, 1)

# ---------------------------------------------------------------- 6) ACILIS PARMAK IZI
a6 = "let state = load();\nlet weekOffset = 0;\n"
n6 = """let state = load();
// v117 AÇILIŞ PARMAK İZİ: "bu kaydı BU OTURUMDA ben mi değiştirdim?" sorusunun tek kaynağı.
// Açılış çekimi (sbLoadAll) bayat yerel veriyi sunucunun üzerine KOYMASIN diye kullanılır.
let __sbBootFp = null;
try { __sbBootFp = __sbFingerprint(state); } catch(e) { __sbBootFp = null; }
let weekOffset = 0;
"""
assert s.count(a6) == 1, 'ANCHOR FAIL 6: let state = load() (%d)' % s.count(a6)
s = s.replace(a6, n6, 1)

io.open(P, 'w', encoding='utf-8').write(s)
print('OK v117: bayat cihaz artik bulutu geri saramiyor (temel kalkani + acilis birlestirme)')
