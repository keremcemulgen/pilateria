// v212 (Kerem 24.10, telefon ekran görüntüsü): "☁️ Bulut senkron aktif · son gönderim: 14:06 · ⚠️ EKSİK: bulut 1.169 ders,
// uygulama 1.168" — "Bu uyarı niye sebebini bul". KÖK (yamasız v211'de bu test FAIL etmeli):
//  K1 bulut sayısı yalnız TAM ÇEKİMDE alınıyordu → buluta da giden bir ders silme/eklemeden sonra sayaç bayat kalıp "EKSİK" diyordu.
//  K2 v106 ölü ders süpürmesi (üyesiz iptal / üyesiz planlı) yalnız yerelde düşer, buluttan silinmez → her açılışta sahte "EKSİK".
// Ayrıca: GERÇEKTEN eksik ders (bulutta var, uygulamaya gelmemiş) tarih-saat-adıyla KIRMIZI gösterilmeli; geçici fark kırmızı yakmamalı.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously', url: 'https://localhost/p.html', pretendToBeVisual: true,
  beforeParse(w) {
    w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    if (!w.structuredClone) w.structuredClone = o => JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: () => Promise.resolve({}), getRegistrations: () => Promise.resolve([]) }, configurable: true });
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {}; w.__PL_DLG_AUTO__ = (o) => o && o.input ? null : true;
  }
});
const w = dom.window, d = w.document;
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 0));
const line = () => { w.eval("__renderSyncStatusLine('ok','')"); return (d.getElementById('dash-sync-status') || {}).textContent || ''; };
const until = async (fn, ms) => { for (let i = 0; i < (ms || 3000) / 20; i++) { if (fn()) return true; await tick(20); } return false; };

setTimeout(async () => { try {
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','__refreshUIWhenIdle','__sbFreshenFromJsonbin','__pilOffsiteDaily','__offerSpillJoinRepair191','finEnsureTemplateDues196','finAutoPayDues209'].forEach(function(fn){ if (typeof window[fn] === 'function') window[fn] = function(){ return false; }; }); window.__TOASTS = []; window.plToast = function(m){ window.__TOASTS.push(String(m)); }; window.plConfirm = function(){ return Promise.resolve(false); };");
  w.eval(`__sbRole = 'owner';
    const L = function(id, extra){ return Object.assign({ id: id, date: '2026-10-06', time: '10:00', status: 'planned', memberIds: ['M1'], groupId: '', size: 1, packageMonth: '2026-10', instructorId: '' }, extra || {}); };
    window.__L = L;
    window.__SRV = {
      members: { M1: { id: 'M1', name: 'AYSE DENEME', joinDate: '2026-01-01', monthly: { '2026-10': { enrolled: true } } } },
      member_finance: { M1: { totalPrice: 4500, packages: [] } },
      lessons: {
        L1: L('L1'), L2: L('L2', { date: '2026-10-02', status: 'completed' }), L3: L('L3', { date: '2026-10-09' }),
        G1: L('G1', { date: '2026-10-03', status: 'cancelled', memberIds: [] }),   // üyesiz iptal → v106 süpürmesi (yerelde düşer)
        G2: L('G2', { date: '2026-10-04', memberIds: [] })                          // üyesiz planlı bireysel → v106 süpürmesi
      }
    };
    const __rows = function(tab){ const T = window.__SRV[tab] || {}; return Object.keys(T).sort().map(function(id){ return { id: id, data: JSON.parse(JSON.stringify(T[id])) }; }); };
    const __mkQ = function(tab, opts){ const rows = __rows(tab); let lo = 0, hi = null; const q = { order: function(){ return q; }, range: function(a, b){ lo = a; hi = b; return q; },
      then: function(ok, ko){ const end = hi === null ? rows.length : Math.min(rows.length, hi + 1); const res = { data: rows.slice(lo, end), error: null }; if (opts && opts.count === 'exact') res.count = rows.length; return Promise.resolve(res).then(ok, ko); } }; return q; };
    sbClient = { from: function(tab){ return {
        select: function(cols, opts){ return __mkQ(tab, opts); },
        upsert: function(ups){ window.__SRV[tab] = window.__SRV[tab] || {}; ups.forEach(function(u){ window.__SRV[tab][u.id] = JSON.parse(JSON.stringify(u.data)); }); return Promise.resolve({ error: null }); },
        delete: function(){ return { in: function(col, ids){ ids.forEach(function(id){ if (window.__SRV[tab]) delete window.__SRV[tab][id]; }); return Promise.resolve({ error: null }); } }; }
      }; },
      channel: function(){ const ch = { state: 'joined', on: function(type, f, h){ window.__RTH = h; return ch; }, subscribe: function(){ return ch; } }; return ch; },
      removeChannel: function(){} };
    state.members = []; state.lessons = []; state.groups = []; state.payments = []; __sbShadow = {}; __sbVer = {}; localStorage.removeItem('pilateria_dirty');
    window.__sbRecountMs212 = 40; window.__sbRecountQuietMs212 = 0;`);
  const rt = (ev, id, data) => w.eval(`__RTH({ table: 'lessons', eventType: '${ev}', new: ${data ? "{ id: '" + id + "', data: Object.assign(" + data + ", { _v: Date.now() + 100000 }) }" : '{}'}, old: ${ev === 'DELETE' ? "{ id: '" + id + "' }" : '{}'} })`);

  console.log('[1] Açılış: bulutta 3 gerçek + 2 üyesiz boş ders → uygulama 3; sahte "EKSİK" YOK (K2)');
  await w.eval('sbLoadAll()'); await tick(300);
  w.eval('__sbBaseReady = true;');
  t('uygulamada 3 ders (boş kayıtlar v106 ile düştü)', w.eval('state.lessons.length') === 3, w.eval('state.lessons.length'));
  let L1 = line();
  t('panel: "bulut 3 ders = uygulama 3"', /bulut 3 ders = uygulama 3/.test(L1), L1);
  t('panel: boş kayıtlar ayrı ve eksik sayılmıyor ("2 üyesiz boş ders kaydı")', /2 üyesiz boş ders kaydı/.test(L1) && !/EKSİK/.test(L1), L1);
  t('açılışta "sayım tutmuyor" uyarısı ÇIKMADI', !w.eval('__TOASTS').some(m => /tutmuyor|görünmeyen/.test(m)), JSON.stringify(w.eval('__TOASTS')));

  console.log('[2] Bu cihazda ders silindi → silme buluta gitti → bulut SUNUCUDAN yeniden sayılır; "EKSİK" YOK (K1)');
  w.eval("state.lessons = state.lessons.filter(function(l){ return l.id !== 'L3'; }); save();");
  await until(() => w.eval("!window.__SRV.lessons.L3 && !isDirty()"), 2000);
  t('silme buluta gitti (sunucuda L3 yok)', w.eval('!window.__SRV.lessons.L3'));
  await until(() => /bulut 2 ders = uygulama 2/.test(line()), 3000);
  L1 = line();
  t('panel: "bulut 2 ders = uygulama 2" (bayat 1.169/1.168 tipi uyarı yok)', /bulut 2 ders = uygulama 2/.test(L1) && !/EKSİK/.test(L1), L1);

  console.log('[3] Başka cihazdan gerçek zamanlı yeni ders → yeniden sayım → eşit');
  w.eval("window.__SRV.lessons.L4 = __L('L4', { date: '2026-10-16' });");
  rt('INSERT', 'L4', "__L('L4', { date: '2026-10-16' })");
  t('L4 uygulamaya geldi', w.eval("!!state.lessons.find(function(l){ return l.id === 'L4'; })"));
  await until(() => /bulut 3 ders = uygulama 3/.test(line()), 3000);
  L1 = line();
  t('panel: "bulut 3 ders = uygulama 3"', /bulut 3 ders = uygulama 3/.test(L1) && !/EKSİK/.test(L1), L1);

  console.log('[4] GERÇEK eksik: bulutta olan ders uygulamaya hiç gelmedi → iki kontrolde de sürünce KIRMIZI, tarih-saat-adıyla');
  w.eval("window.__SRV.lessons.L5 = __L('L5', { date: '2026-10-13', time: '11:00' });"); // olay GELMEDİ (kaçırılmış realtime)
  w.eval("window.__sbRecountMs212 = 250;");
  rt('UPDATE', 'L1', "__L('L1', { status: 'completed' })"); // herhangi bir ders olayı yeniden saydırır
  await until(() => w.eval('!!(__sbLessonProof212 && __sbLessonProof212.pending)'), 2000);
  L1 = line();
  t('ilk kontrolde fark görüldü ama HENÜZ kırmızı değil ("kontrol ediliyor")', /kontrol ediliyor/.test(L1) && !/EKSİK/.test(L1), L1);
  await until(() => /EKSİK/.test(line()), 3000);
  L1 = line();
  t('ikinci kontrolde de sürüyor → KIRMIZI "EKSİK: buluttaki 1 ders uygulamada yok"', /EKSİK: buluttaki 1 ders uygulamada yok/.test(L1), L1);
  t('eksik dersin tarih-saat-adı yazıyor (13 · 11:00 · AYSE DENEME)', /13/.test(L1) && /11:00/.test(L1) && /AYSE DENEME/.test(L1), L1);
  t('"yenile" bağlantısı var', /yenile/.test(L1) && /sbResync/.test(d.getElementById('dash-sync-status').innerHTML));
  t('uyarı bildirimi verildi', w.eval('__TOASTS').some(m => /tutmuyor/.test(m) && /1 ders/.test(m)), JSON.stringify(w.eval('__TOASTS')));

  console.log('[5] "yenile" (tam tazeleme) → ders geldi → kanıt eşit');
  w.eval("__sbLastPushAt = 0; __sbLastResync = 0; __sbResyncBusy = false; localStorage.removeItem('pilateria_dirty');");
  await w.eval("sbResync('manual')"); await tick(200);
  t('L5 uygulamada', w.eval("!!state.lessons.find(function(l){ return l.id === 'L5'; })"));
  L1 = line();
  t('panel: "bulut 4 ders = uygulama 4", kırmızı kalktı', /bulut 4 ders = uygulama 4/.test(L1) && !/EKSİK/.test(L1), L1);

  console.log('[6] GEÇİCİ fark (olay biraz gecikti) kırmızı YAKMAZ');
  const cntToasts = () => w.eval('__TOASTS').filter(m => /tutmuyor|görünmeyen/.test(m)).length;
  const toastsBefore = cntToasts();
  w.eval("window.__SRV.lessons.L6 = __L('L6', { date: '2026-10-20' });");
  rt('UPDATE', 'L2', "__L('L2', { date: '2026-10-02', status: 'completed', time: '10:30' })");
  await until(() => w.eval('!!(__sbLessonProof212 && __sbLessonProof212.pending)'), 2000);
  t('ilk kontrol: bekliyor (kırmızı yok)', !/EKSİK/.test(line()), line());
  rt('INSERT', 'L6', "__L('L6', { date: '2026-10-20' })"); // olay geldi
  await until(() => /bulut 5 ders = uygulama 5/.test(line()), 3000);
  L1 = line();
  t('ikinci kontrol eşit: "bulut 5 ders = uygulama 5", kırmızı hiç yanmadı', /bulut 5 ders = uygulama 5/.test(L1) && !/EKSİK/.test(L1), L1);
  t('geçici fark için sayım uyarısı bildirimi YOK', cntToasts() === toastsBefore, JSON.stringify(w.eval('__TOASTS')));

  console.log('[7] Kanıt okuması state\'e YAZMAZ (yalnız okur)');
  w.eval("window.__SRV.lessons.L7 = __L('L7', { date: '2026-10-21' }); window.__sbRecountMs212 = 40;");
  const nBefore = w.eval('state.lessons.length');
  rt('UPDATE', 'L4', "__L('L4', { date: '2026-10-16', time: '12:00' })");
  await until(() => /EKSİK/.test(line()), 3000);
  t('kanıt eksik dersi buldu ama state değişmedi (L7 uygulamaya kendiliğinden yazılmadı)', w.eval('state.lessons.length') === nBefore && !w.eval("state.lessons.some(function(l){ return l.id === 'L7'; })"), w.eval('state.lessons.length') + ' vs ' + nBefore);

  console.log('');
  console.log('SONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.log('TEST COKTU', e && e.stack || e); process.exit(2); } }, 1200);
