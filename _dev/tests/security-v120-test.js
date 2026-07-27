// PİLATERİA — v120 GÜVENLİK REGRESYON TESTİ
// -----------------------------------------------------------------------------
// Bu test ONCE acigi KANITLAR: savunmasiz kalibi GERCEK bir HTML ayristiricisina
// (jsdom) verip yukun kod baglamina dustugunu gosterir. SONRA uygulamanin o kalibi
// artik kullanmadigini dogrular.
//   * Yamasiz surumde  -> FAIL (acik duruyor)
//   * Yamali  surumde  -> 0 FAIL
// Kapsam: K-2a / K-2b / K-2c stored-XSS, K-3 yonetici kapisi, Y-1 kurtarma
//          konsollari, Y-2 acilis kimlik yarisi, Y-3 gevsek RLS politikasinin geri gelmesi.
// -----------------------------------------------------------------------------
const fs = require('fs');
const { JSDOM } = require('/tmp/piltest/node_modules/jsdom');
const file = process.argv[2] || 'pilateria-dev.html';
const html = fs.readFileSync(file, 'utf-8');
let ok = 0, fail = 0;
function T(name, cond) { if (cond) { ok++; console.log('  OK  ' + name); } else { fail++; console.log('  FAIL ' + name); } }

// Kaynaktan bir fonksiyonu sokup gercekten CALISTIRMAK icin (metin denetimi degil, davranis denetimi)
function grab(name) {
  const m = html.match(new RegExp('function\\s+' + name + '\\s*\\([\\s\\S]*?\\n\\}', 'm'));
  return m ? m[0] : null;
}

// ============================================================================
// K-2a — onclick icindeki JS string'inden KACIS
// HTML ozniteligi ONCE entity-cozulur, SONRA JS olarak calisir. Bu yuzden
// JSON.stringify(msg).replace(/"/g,'&quot;') YETMEZ: '&' kacirilmadigi icin
// metnin icindeki '&quot;' gercek tirnaga donusur ve string kirilir.
// ============================================================================
const payload = 'Ayşe&quot;-PWN()-&quot;';
const vulnAttr = JSON.stringify(payload).replace(/"/g, '&quot;');
const vulnEl = new JSDOM('<button id="b" onclick="copyTodayMessage(this, ' + vulnAttr + ')"></button>')
  .window.document.getElementById('b');
const vulnOnclick = vulnEl.getAttribute('onclick');
T('K-2a PoC: eski kalip GERCEKTEN kiriliyor (entity cozulup kod baglamina dusuyor)',
  /-PWN\(\)-/.test(vulnOnclick) && !/&quot;/.test(vulnOnclick));

T('K-2a: kirik JSON.stringify().replace(/"/g) kalibi KALDIRILDI',
  !/JSON\.stringify\(msg\)\.replace\(\/"\/g/.test(html));
T('K-2a: mesaj artik data-msg ozniteliginde (VERI, kod degil)',
  /data-msg="\$\{escapeHtml\(msg\)\}"/.test(html));
T('K-2a: copyTodayMessage data-msg okuyor',
  /function copyTodayMessage\(btn, msg\)[\s\S]{0,500}getAttribute\('data-msg'\)/.test(html));

const escSrc = grab('escapeHtml');
T('K-2a: escapeHtml kaynakta bulundu', !!escSrc);
if (escSrc) {
  const escapeHtml = new Function(escSrc + '; return escapeHtml;')();
  T('K-2a: escapeHtml & karakterini de kaciriyor', escapeHtml('a&b') === 'a&amp;b');
  const safeEl = new JSDOM('<button id="b" onclick="copyTodayMessage(this)" data-msg="' + escapeHtml(payload) + '"></button>')
    .window.document.getElementById('b');
  T('K-2a: yeni kalipta yuk KOD DEGIL VERI olarak kaliyor',
    safeEl.getAttribute('data-msg') === payload && !/PWN/.test(safeEl.getAttribute('onclick')));
}

// ============================================================================
// K-2b — waGroupLink: protokol beyaz listesi + oznitelik kacisi
// ============================================================================
const safeSrc = grab('safeUrl');
T('K-2b: safeUrl() yardimcisi VAR', !!safeSrc);
if (safeSrc) {
  let safeUrl = null;
  try { safeUrl = new Function(safeSrc + '; return safeUrl;')(); } catch (e) {}
  T('K-2b: safeUrl() calisiyor', typeof safeUrl === 'function');
  if (typeof safeUrl === 'function') {
    T('K-2b: javascript: ELENDI', safeUrl('javascript:alert(1)') === '');
    T('K-2b: JaVaScRiPt: (buyuk/kucuk harf) ELENDI', safeUrl('JaVaScRiPt:alert(1)') === '');
    T('K-2b: bosluk/yeni-satir kacamagi ELENDI', safeUrl('  java\nscript:alert(1)') === '');
    T('K-2b: data: ELENDI', safeUrl('data:text/html,<svg onload=alert(1)>') === '');
    T('K-2b: vbscript: ELENDI', safeUrl('vbscript:msgbox(1)') === '');
    T('K-2b: protokolsuz metin ELENDI', safeUrl('" onmouseover=alert(1) x="') === '');
    T('K-2b: gecerli https GECIYOR (islev bozulmadi)',
      safeUrl('https://chat.whatsapp.com/ABC123') === 'https://chat.whatsapp.com/ABC123');
    T('K-2b: gecerli http GECIYOR', safeUrl('http://ornek.com/x') === 'http://ornek.com/x');
    T('K-2b: bos/gecersiz girdi guvenli', safeUrl(null) === '' && safeUrl(undefined) === '' && safeUrl('   ') === '' && safeUrl(42) === '');
  }
}
T('K-2b: waLink artik safeUrl()den geciyor', /const waLink = safeUrl\(group\.waGroupLink\)/.test(html));
T('K-2b: href oznitelik-kacisli yaziliyor', /href="\$\{escapeHtml\(waLink\)\}"/.test(html));
T('K-2b: ham ${waLink} href KALMADI', !/href="\$\{waLink\}"/.test(html));
T('D-1: dis baglantiya rel="noopener noreferrer" eklendi', /rel="noopener noreferrer"/.test(html));

// ============================================================================
// K-2c — sanitizer alan listesi genisletildi
// ============================================================================
T('K-2c: waGroupLink sanitizeStateText FIELDS icinde', /groups:\s*\[[^\]]*'waGroupLink'/.test(html));

// ============================================================================
// K-3 — "yonetici" kapisi sadece PAROLA doguruyordu, ROL denetlemiyordu
// ============================================================================
const advSrc = (html.match(/async function confirmAdminVerify\(\)[\s\S]*?\n\}/) || [])[0] || '';
T('K-3: confirmAdminVerify bulundu', !!advSrc);
T('K-3: profiles.role SUNUCUDAN taze okunuyor', /from\('profiles'\)[\s\S]{0,100}select\('role'\)/.test(advSrc));
T('K-3: owner degilse kapi ACILMIYOR', /!==\s*'owner'/.test(advSrc));
T('K-3: owner degilse bekleyen tehlikeli islem DUSURULUYOR', /__advCb\s*=\s*null;[\s\S]{0,160}return;/.test(advSrc));
T('K-3: girilen e-posta acik oturumunkiyle eslesmeli (hesap degistirme kapali)',
  /toLowerCase\(\)\s*!==/.test(advSrc));
T('K-3: rol denetimi closeModal ONCESINDE calisiyor',
  advSrc.indexOf("!== 'owner'") > -1 &&
  advSrc.indexOf("!== 'owner'") < advSrc.indexOf("closeModal('modal-admin-verify')"));

// ============================================================================
// Y-2 — acilis kimlik yarisi: sbAuthGate await edilmiyordu
// ============================================================================
T('Y-2: init() async', /async function init\(\)/.test(html));
T('Y-2: sbAuthGate() await ediliyor', /await sbAuthGate\(\)/.test(html));
T('Y-2: kilit sinifi tanimli (govde perde arkasinda boyanmiyor)', /pl-authlock/.test(html));
T('Y-2: kilit CSS kurali var', /body\.pl-authlock\s*>\s*\*:not\(#sb-auth-overlay\)/.test(html));
T('Y-2: sbShowAuth kilidi ACIYOR, sbHideAuth KAPATIYOR',
  /function sbShowAuth[\s\S]{0,600}classList\.add\('pl-authlock'\)/.test(html) &&
  /function sbHideAuth[\s\S]{0,300}classList\.remove\('pl-authlock'\)/.test(html));

// ============================================================================
// Y-1 — kurtarma konsollari: "giris yapmis olmak" YETIYORDU
// ============================================================================
const rec = fs.readFileSync('recover.html', 'utf-8');
const kur = fs.readFileSync('kurtar.html', 'utf-8');
T('Y-1: recover.html sahip denetimi (profiles.role) var', /from\('profiles'\)[\s\S]{0,160}'owner'/.test(rec));
T('Y-1: kurtar.html sahip denetimi (profiles.role) var', /from\('profiles'\)[\s\S]{0,160}'owner'/.test(kur));
T('Y-1: recover.html doRestore sahip kapisini cagiriyor', /async function doRestore[\s\S]{0,700}await requireOwner\(/.test(rec));
T('Y-1: kurtar.html doMerge sahip kapisini cagiriyor', /async function doMerge[\s\S]{0,700}await requireOwner\(/.test(kur));

// ============================================================================
// Y-3 — kurulum betigi gevsek politikayi GERI GETIRMEMELI
// (adi farkli oldugu icin yenisinin YANINA eklenir; permissive politikalar OR'lanir
//  -> daily_backups tum personele yeniden acilirdi)
// ============================================================================
const sql = fs.readFileSync('_dev/daily-backup-setup.sql', 'utf-8');
T('Y-3: daily_backups icin using(true) with check(true) KALMADI',
  !/daily_backups[\s\S]{0,500}using\s*\(\s*true\s*\)\s*with\s+check\s*\(\s*true\s*\)/i.test(sql));
T('Y-3: politika sahip-kosullu (my_role() = owner)', /daily_backups[\s\S]{0,700}my_role\(\)\s*=\s*'owner'/.test(sql));
T('Y-3: eski gevsek politika adi acikca DUSURULUYOR',
  /drop policy if exists daily_backups_auth_all/i.test(sql));

// K-1 — yedek fonksiyonu anonim cagrilamamali. Uretimde yetki zaten kaldirilmis
// (2026-07-27: acl = postgres + service_role). Betikte de olmali ki yeniden
// calistirmak PostgreSQL'in varsayilan "herkese EXECUTE" davranisini geri getirmesin.
T('K-1: kurulum betigi take_backup EXECUTE yetkisini anon/authenticated/public dan ALIYOR',
  /revoke\s+execute\s+on\s+function\s+public\.pilateria_take_backup\(\)\s+from[^;]*anon[^;]*;/i.test(sql) &&
  /revoke[^;]*pilateria_take_backup[^;]*authenticated[^;]*;/i.test(sql));

console.log(`\nSONUC: ${ok} gecti, ${fail} kaldi`);
process.exit(fail ? 1 : 0);
