// PİLATERİA — v121 GİZLİLİK / VERİ SIZINTISI REGRESYON TESTİ
// -----------------------------------------------------------------------------
// Bu test ONCE acigi KANITLAR. Metin denetimi degil DAVRANIS denetimi yapar:
// ilgili fonksiyonlari kaynaktan sokup SAHTE bir fetch ile GERCEKTEN calistirir
// ve disariya hangi adrese cikildigini KAYDEDER.
//   * Yamasiz surumde  -> FAIL (acik duruyor, jsonbin.io cagriliyor)
//   * Yamali  surumde  -> 0 FAIL
// Kapsam:
//   O-5  JSONBin yolunun tamamen kapatilmasi (duz metin master key + tam veri disari)
//   D-1  target="_blank" baglantilarinda eksik rel="noopener" (v120 artigi)
//   D-2  wa.me sorgu dizesindeki kisisel veri + window.open noopener
//   O-1  SAHIP KARARI: TC / saglik notu / adres uygulamada KALIR.
//        Ancak bu ozel nitelikli veri UCUNCU TARAFA gitmemeli -> sablon kilidi.
//   Y-4  .git/config icindeki gomulu PAT
//   Y-5  depoda sir bulunmamasi
// -----------------------------------------------------------------------------
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || 'pilateria-dev.html';
const html = fs.readFileSync(file, 'utf-8');
let ok = 0, fail = 0;
function T(name, cond) { if (cond) { ok++; console.log('  OK  ' + name); } else { fail++; console.log('  FAIL ' + name); } }

// Kaynaktan bir fonksiyonu (async dahil) sokup GERCEKTEN calistirmak icin.
function grab(name) {
  const m = html.match(new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\([\\s\\S]*?\\n\\}', 'm'));
  return m ? m[0] : null;
}

// Sahte tarayici cevresi: fetch cagrilarini KAYDEDER, disari gercekten cikmaz.
function makeEnv(extra) {
  const calls = [];
  const store = {};
  const env = {
    calls: calls,
    fetch: async function (url, opts) {
      calls.push(String(url));
      return { ok: false, status: 599, json: async () => ({}) };
    },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    __trace: function () {},
    console: { error: function () {}, log: function () {} },
  };
  Object.assign(env, extra || {});
  return env;
}

// Fonksiyonu enjekte edilen global'lerle calistir.
async function runFn(name, env) {
  const src = grab(name);
  if (!src) return { missing: true, calls: env.calls };
  const keys = Object.keys(env).filter(k => k !== 'calls');
  const vals = keys.map(k => env[k]);
  // JSONBIN_ENABLED kaynaktaki GERCEK degeriyle enjekte edilir (asagida okunur).
  const factory = new Function(...keys, '"use strict"; ' + src + '; return ' + name + ';');
  const fn = factory(...vals);
  try { await fn(); } catch (e) { /* guard sonrasi cokme de gecerli, onemli olan cagri listesi */ }
  return { missing: false, calls: env.calls, err: null };
}

// Kaynaktaki JSONBIN_ENABLED degerini oku (yoksa true varsay = yamasiz hal).
const jbFlagMatch = html.match(/const\s+JSONBIN_ENABLED\s*=\s*(true|false)\s*;/);
const JSONBIN_ENABLED = jbFlagMatch ? (jbFlagMatch[1] === 'true') : true;

(async function () {

// ============================================================================
// O-5/1 — YAPISAL KILIT: CSP artik jsonbin.io'ya baglanti izni vermemeli.
// Bu tek satir, gozden kacan HERHANGI bir kod yolunu tarayici seviyesinde
// oldurur; JS icindeki korumalardan bagimsiz ikinci savunma hattidir.
// ============================================================================
const cspLine = (html.match(/<meta http-equiv="Content-Security-Policy"[^>]*>/) || [''])[0];
const connectSrc = (cspLine.match(/connect-src([^;"]*)/) || ['', ''])[1];
T('O-5 CSP: connect-src icinde api.jsonbin.io YOK (yapisal kill-switch)',
  cspLine.length > 0 && !/jsonbin/i.test(connectSrc));
T('O-5 CSP: Supabase baglantilari KORUNDU (uygulama calismaya devam etmeli)',
  /nvbnmhaxumrfsxdzrzzj\.supabase\.co/.test(connectSrc) && /wss:\/\//.test(connectSrc));

// ============================================================================
// O-5/2 — BAYRAK: tek bir yerden kapatma anahtari.
// ============================================================================
T('O-5: const JSONBIN_ENABLED = false; tanimli', jbFlagMatch !== null && JSONBIN_ENABLED === false);

// ============================================================================
// O-5/3 — DAVRANIS KANITI (asil test).
// __pilOffsiteDaily: her gun TUM state'i (uye adlari, telefon, TC, saglik notu,
// adres, odemeler) duz metin master key ile ucuncu tarafa YOLLAR.
// Kosullar bilerek "sizinti olacak" sekilde kuruluyor.
// ============================================================================
const envOffsite = makeEnv({
  JSONBIN_ENABLED: JSONBIN_ENABLED,
  __sbRole: 'owner',
  syncCfg: { enabled: true, bin: 'TESTBIN', key: 'TESTMASTERKEY' },
  state: { members: [{ id: 'm1', name: 'Test', tc: '11111111111', adres: 'X', saglik: 'Y' }] },
});
const rOffsite = await runFn('__pilOffsiteDaily', envOffsite);
T('O-5 DAVRANIS: __pilOffsiteDaily calistirildi ve jsonbin.io\'ya HIC cikmadi',
  !rOffsite.missing && !envOffsite.calls.some(u => /jsonbin/i.test(u)));

// __sbFreshenFromJsonbin: sadece sizinti degil, AYNI ZAMANDA veri butunlugu
// tehlikesi — bayat bir JSONBin kopyasi canli state'in uzerine yazabilir.
const envFresh = makeEnv({
  JSONBIN_ENABLED: JSONBIN_ENABLED,
  syncCfg: { enabled: true, bin: 'TESTBIN', key: 'TESTMASTERKEY' },
  state: { members: [] },
  DEFAULT_STATE: { members: [] },
  window: {},
  structuredClone: (x) => JSON.parse(JSON.stringify(x)),
  applyV10MigrationToState: function () {},
  sanitizeStateText: function () {},
  save: function () {},
});
const rFresh = await runFn('__sbFreshenFromJsonbin', envFresh);
T('O-5 DAVRANIS: __sbFreshenFromJsonbin calistirildi ve jsonbin.io\'ya HIC cikmadi',
  !rFresh.missing && !envFresh.calls.some(u => /jsonbin/i.test(u)));

// Eski senkron fonksiyonlari da ayni kapiya tabi olmali.
for (const fname of ['pushToCloud', 'pullFromCloud', 'autoPush', 'autoPullIfNeeded']) {
  const env = makeEnv({
    JSONBIN_ENABLED: JSONBIN_ENABLED,
    syncCfg: { enabled: true, bin: 'TESTBIN', key: 'TESTMASTERKEY', baseRev: 0 },
    state: { members: [{ id: 'm1' }] },
    isSyncing: false,
    syncConfigured: () => true,
    // autoPush "kirli" veri ister; autoPullIfNeeded ise "temiz" olmadan ilerlemez.
    isDirty: () => (fname !== 'autoPullIfNeeded'),
    navigator: { onLine: true },
    renderSyncStatus: function () {},
    setCloudDot: function () {},
    schedulePush: function () {},
    saveSyncCfgRaw: function () {},
    __uiBusyForPull: () => false,
    lastAutoPullTs: 0,
    AUTO_PULL_MIN_GAP_MS: 0,
    DIRTY_KEY: 'd', CONFLICT_BACKUP_KEY: 'c',
    window: {},
  });
  const r = await runFn(fname, env);
  T('O-5 DAVRANIS: ' + fname + ' jsonbin.io\'ya HIC cikmadi',
    !r.missing && !env.calls.some(u => /jsonbin/i.test(u)));
}

// ============================================================================
// O-5/4 — DURUSTLUK: kullaniciya artik var olmayan bir yedek vaat edilmemeli.
// ============================================================================
const promiseLine = (html.match(/Gece 00:00'da bulut yedeği[^<]*/) || [''])[0];
T('O-5 UI: acilis/ayarlar metni artik "JSONBin" ikinci bulut vaadi vermiyor',
  promiseLine.length > 0 && !/JSONBin/i.test(promiseLine));
T('O-5 UI: yedek panelinde "İkinci bulut (JSONBin) son gönderim" satiri kaldirildi',
  !/İkinci bulut \(JSONBin\) son gönderim/.test(html));
T('O-5 UI: yedek paneli artik SON ELLE YEDEK tarihini gosteriyor',
  /pilateria_last_export_day/.test(html) && /backup-status|rows\.push|rows = \[/.test(html));
T('O-5: elle disa aktarim tarihi damgalaniyor (__exportDataNow)',
  /function __exportDataNow[\s\S]{0,700}pilateria_last_export_day/.test(html));

// Kod icinde kalan her jsonbin.io adresi bir kapiya bagli olmali.
const jbHits = (html.match(/api\.jsonbin\.io/g) || []).length;
T('O-5: kaynakta kalan api.jsonbin.io sayisi CSP disinda ve kapiya bagli (<=7 fetch)', jbHits <= 7);

// ============================================================================
// D-1 — v120 ARTIGI: target="_blank" olan HER baglantida rel="noopener" olmali.
// rel yoksa acilan sekme window.opener uzerinden bu sayfayi yonlendirebilir.
// ============================================================================
let relMissing = [];
const blankRe = /target="_blank"/g;
let bm;
while ((bm = blankRe.exec(html)) !== null) {
  const from = Math.max(0, bm.index - 260);
  const slice = html.slice(from, bm.index + 200);
  if (!/rel="noopener/.test(slice)) {
    relMissing.push(html.slice(0, bm.index).split('\n').length);
  }
}
T('D-1: target="_blank" olan TUM baglantilarda rel="noopener" var' +
  (relMissing.length ? ' (eksik satirlar: ' + relMissing.join(', ') + ')' : ''),
  relMissing.length === 0);

// ============================================================================
// D-2 — wa.me akisi.
// Kisisel veri (isim, borc, saat) artik statik href icinde DURMUYOR; baglanti
// TIKLAMA ANINDA kuruluyor ve noopener,noreferrer ile aciliyor.
// ============================================================================
T('D-2: kaynakta href="${buildWaLink(...)}" kalmadi (kisisel veri statik href\'te degil)',
  !/href="\$\{buildWaLink\(/.test(html));
T('D-2: toplu gonderim baglantisi da href="${link}" olarak kalmadi',
  !/href="\$\{link\}"\s+target="_blank"/.test(html));
T('D-2: waOpenFrom yardimcisi tanimli (URL tiklama aninda kurulur)',
  /function waOpenFrom\s*\(/.test(html));

// Not: ic ice parantez olabilir (window.open(buildWaLink(...), ...)) — bir seviye tolere edilir.
const opens = html.match(/window\.open\((?:[^()]|\([^()]*\))*\)/g) || [];
T('D-2: TUM window.open cagrilari noopener,noreferrer ile',
  opens.length > 0 && opens.every(o => /noopener/.test(o) && /noreferrer/.test(o)));

// data-* ozniteliklerine yazilan uye adi/mesaji MUTLAKA escapeHtml'den gecmeli
// (v120 K-2 sinifi hatanin geri gelmemesi icin).
const dataAttrs = html.match(/data-wa-[pm]="[^"]*"/g) || [];
T('D-2 GUVENLIK: data-wa-* oznitelikleri escapeHtml ile yaziliyor (oznitelik enjeksiyonu yok)',
  dataAttrs.length === 0 || dataAttrs.every(a => /escapeHtml\(/.test(a)));

// waOpenFrom davranisi: gercekten cagrilinca dogru bayraklarla acmali.
if (/function waOpenFrom\s*\(/.test(html)) {
  const openCalls = [];
  const envWa = makeEnv({
    window: { open: (u, t, f) => { openCalls.push({ u: u, t: t, f: f }); return null; } },
    buildWaLink: (p, m) => 'https://wa.me/' + p + '?text=' + encodeURIComponent(m),
  });
  const src = grab('waOpenFrom');
  const keys = Object.keys(envWa).filter(k => k !== 'calls');
  const fn = new Function(...keys, '"use strict"; ' + src + '; return waOpenFrom;')(...keys.map(k => envWa[k]));
  const fakeBtn = { getAttribute: (k) => (k === 'data-wa-p' ? '905551112233' : 'Merhaba Ayşe') };
  try { fn(fakeBtn); } catch (e) {}
  T('D-2 DAVRANIS: waOpenFrom noopener,noreferrer ile aciyor',
    openCalls.length === 1 && /noopener/.test(openCalls[0].f || '') && /noreferrer/.test(openCalls[0].f || ''));
  T('D-2 DAVRANIS: waOpenFrom dogru wa.me adresini kuruyor',
    openCalls.length === 1 && /^https:\/\/wa\.me\/905551112233\?text=/.test(openCalls[0].u || ''));
}

// ============================================================================
// O-1 — SAHIP KARARI: TC / saglik notu / adres UYGULAMADA KALIR.
// Bu yuzden asil koruma: bu ozel nitelikli veri bir WhatsApp sablonuna
// OTOMATIK enjekte EDILEMEZ. Sablon yer tutucu listesi KILITLI.
// ============================================================================
{
  const src = grab('fillWaTemplate');
  const fn = new Function('money', 'fmtDate', '"use strict"; ' + src + '; return fillWaTemplate;')(
    (x) => String(x), (d) => String(d));
  const out = fn('{ad} {tc} {adres} {saglik} {tcKimlik} {kalan} ₺', {
    ad: 'Ayşe', kalan: 100,
    tc: '11111111111', adres: 'Gizli Mah.', saglik: 'Bel fitigi', tcKimlik: '11111111111',
  });
  T('O-1 KILIT: {tc} sablonda DEGISMEDEN kaliyor (TC kimlik wa.me\'ye enjekte edilemez)',
    out.includes('{tc}') && !out.includes('11111111111'));
  T('O-1 KILIT: {adres} sablonda DEGISMEDEN kaliyor', out.includes('{adres}') && !out.includes('Gizli Mah.'));
  T('O-1 KILIT: {saglik} sablonda DEGISMEDEN kaliyor', out.includes('{saglik}') && !out.includes('Bel fitigi'));
  T('O-1: normal yer tutucular calismaya devam ediyor (regresyon yok)',
    out.includes('Ayşe') && out.includes('100'));
}

// ============================================================================
// Y-4 / Y-5 — depoda ve git yapilandirmasinda sir bulunmamali.
// ============================================================================
const repoRoot = path.resolve(__dirname, '..', '..');
function walk(dir, acc) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return acc; }
  for (const e of ents) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(html|js|py|sh|sql|json|md|txt|yml|yaml)$/i.test(e.name)) acc.push(p);
  }
  return acc;
}
const files = walk(repoRoot, []);
const SECRET_RE = [
  { name: 'GitHub PAT (github_pat_)', re: /github_pat_[A-Za-z0-9_]{20,}/ },
  { name: 'GitHub klasik token (ghp_)', re: /ghp_[A-Za-z0-9]{30,}/ },
  { name: 'Supabase service_role JWT', re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]*service_role/ },
  { name: 'JSONBin master key ($2a$/$2b$)', re: /\$2[aby]\$\d{2}\$[A-Za-z0-9./]{40,}/ },
  { name: 'izleme sirri (duz metin)', re: /2205c0724a6e73dc33dd2a44fb7d/ },
];
for (const s of SECRET_RE) {
  const hits = files.filter(f => {
    if (path.basename(f) === path.basename(__filename)) return false; // testin kendi deseni
    try { return s.re.test(fs.readFileSync(f, 'utf-8')); } catch (e) { return false; }
  });
  T('Y-5 SIR TARAMASI: ' + s.name + ' depoda YOK' +
    (hits.length ? ' (bulundu: ' + hits.map(h => path.relative(repoRoot, h)).join(', ') + ')' : ''),
    hits.length === 0);
}

// Y-4: .git/config icindeki origin URL'sinde gomulu kimlik bilgisi olmamali.
{
  const cfgPath = path.join(repoRoot, '.git', 'config');
  let cfg = '';
  try { cfg = fs.readFileSync(cfgPath, 'utf-8'); } catch (e) {}
  const embedded = /url\s*=\s*https:\/\/[^@\s\/]+@github\.com/.test(cfg);
  T('Y-4: .git/config origin URL\'sinde gomulu token YOK', cfg.length > 0 && !embedded);
}

// Bicim, _dev/run-tests.sh'in ayristirdigi kanonik bicim olmali ("N gecti, N kaldi"),
// yoksa paket ozetinde bu dosya SAYILMAZ ve sahte-yesil gecer.
console.log('\nSONUC: ' + ok + ' gecti, ' + fail + ' kaldi');
process.exit(fail ? 1 : 0);

})();
