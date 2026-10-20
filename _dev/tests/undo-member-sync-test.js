// v210 (Kerem): "Üye ekledim sonra geri al dedim üye olduğu yerde kaldı, üye sildim geri al dedim üye silinmiş kaldı"
// KÖK NEDENLER (yamasız build'de bu test FAIL etmeli):
//  R1 saveMember (yeni üye / düzenle) ve addMemberToMonth Geri Al yedeği ALMIYORDU → düğme ESKİ bir işlemi
//     geri alıyordu (araya giren başka değişiklikleri de geri sarıyordu), eklenen üye yerinde kalıyordu.
//  R2 bölünmüş kayıtta (üye = members + member_finance) tek yarının korunması, Geri Al'da ÜYENİN TAMAMINI
//     şimdiki haliyle geri yazıyordu (pasife alınan üye pasif kalıyordu); realtime'da da gelen yarı, diğer
//     yarıyı BAYAT gölgeden alıyordu → yoldaki (gönderilmekte olan) yerel fiyat değişikliği kaybolabiliyordu.
//  R3 kendi gönderimimizin yankısı (sunucu jsonb anahtar sırasını değiştirdiği için) "uzaktan değişiklik"
//     sanılıp yeniden uygulanıyordu → Geri Al'da "başka cihazdan geldi" diye korunuyor, daha yeni yerel
//     düzenlemeyi geri sarabiliyordu.
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
    w.__msgs = []; w.__DLG = null; w.__PL_DLG_AUTO__ = (o) => { w.__msgs.push(String((o && o.msg) || '')); if (w.__DLG) return w.__DLG(o); return o && o.input ? null : true; };
    w.alert = (m) => { w.__msgs.push(String(m || '')); }; w.confirm = (m) => { w.__msgs.push(String(m || '')); return true; }; w.prompt = () => null; w.scrollTo = () => {};
  }
});
const w = dom.window, d = w.document;
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 0));
function shiftM(ym, dd) { const p = ym.split('-').map(Number); const dt = new Date(p[0], p[1] - 1 + dd, 1); return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); }

// --- sahte Supabase: gönderimler ELLE sonuçlandırılır, realtime yankıları ELLE (istenen anda) teslim edilir ---
// Sunucu jsonb'yi anahtar sırası DEĞİŞMİŞ geri yollar (gerçekte de öyle: yerel ekleme sırası korunmaz).
const FAKE = `
  window.__SRV = {}; window.__PEND = []; window.__RTQ = []; window.__RTH = null; window.__applyN = 0;
  window.__reorder = function r(v){ if (Array.isArray(v)) return v.map(r); if (v && typeof v === 'object') { var o = {}; Object.keys(v).sort().reverse().forEach(function(k){ o[k] = r(v[k]); }); return o; } return v; };
  window.__commit = function(p){
    __SRV[p.t] = __SRV[p.t] || {};
    if (p.kind === 'up') p.ups.forEach(function(u){ var ex = !!__SRV[p.t][u.id]; __SRV[p.t][u.id] = JSON.parse(JSON.stringify(u.data)); __RTQ.push({ table: p.t, eventType: ex ? 'UPDATE' : 'INSERT', new: { id: u.id, data: __reorder(JSON.parse(JSON.stringify(u.data))) }, old: {} }); });
    else p.ids.forEach(function(id){ delete __SRV[p.t][id]; __RTQ.push({ table: p.t, eventType: 'DELETE', new: {}, old: { id: id } }); });
    p.committed = true;
  };
  window.__resolve = function(p){ p.resolved = true; p.res({ error: null }); };
  window.__deliver = function(pred){ var keep = [], n = 0, q = __RTQ; __RTQ = []; q.forEach(function(ev){ if (!pred || pred(ev)) { __RTH(ev); n++; } else keep.push(ev); }); __RTQ = keep.concat(__RTQ); return n; };
  window.__remote = function(tab, id, data){ var dd = Object.assign({}, JSON.parse(JSON.stringify(data)), { _v: Date.now() + 500000 }); __SRV[tab] = __SRV[tab] || {}; var ex = !!__SRV[tab][id]; __SRV[tab][id] = dd; __RTH({ table: tab, eventType: ex ? 'UPDATE' : 'INSERT', new: { id: id, data: __reorder(dd) }, old: {} }); };
  sbClient = { from: function(tab){ return {
      upsert: function(ups){ return new Promise(function(res){ __PEND.push({ t: tab, kind: 'up', ups: ups, res: res }); }); },
      delete: function(){ return { in: function(col, ids){ return new Promise(function(res){ __PEND.push({ t: tab, kind: 'del', ids: ids, res: res }); }); } }; },
      select: function(){ var q = { order: function(){ return q; }, range: function(){ return q; }, limit: function(){ return q; }, eq: function(){ return q; }, in: function(){ return q; }, then: function(ok, ko){ return Promise.resolve({ data: [], error: null }).then(ok, ko); } }; return q; }
    }; },
    channel: function(){ var ch = { state: 'joined', on: function(type, f, h){ window.__RTH = h; return ch; }, subscribe: function(){ return ch; } }; return ch; },
    removeChannel: function(){}
  };
  (function(){ var orig = sbApplyOne; sbApplyOne = function(){ window.__applyN++; return orig.apply(this, arguments); }; })();
`;
async function waitPend(tab, kind) {
  for (let i = 0; i < 300; i++) {
    const ix = w.eval(`__PEND.findIndex(function(p){ return !p.resolved && p.t === '${tab}' && p.kind === '${kind || 'up'}'; })`);
    if (ix >= 0) return ix;
    await tick(2);
  }
  return -1;
}
// tüm bekleyen gönderimleri sırayla işle (sunucuya yaz → HTTP yanıtı), en sonda tüm yankıları teslim et
async function drain(deliverEchoes) {
  for (let g = 0; g < 600; g++) {
    const open = w.eval("__PEND.filter(function(p){ return !p.resolved; }).length");
    const busy = w.eval("!!(__sbPushInFlight || __sbPushQueued)");
    if (!open && !busy) { await tick(4); if (!w.eval("__PEND.filter(function(p){ return !p.resolved; }).length") && !w.eval("!!(__sbPushInFlight || __sbPushQueued)")) break; else continue; }
    if (open) w.eval("(function(){ var p = __PEND.find(function(p){ return !p.resolved; }); if (!p.committed) __commit(p); __resolve(p); })()");
    await tick(2);
  }
  if (deliverEchoes !== false) { w.eval("__deliver()"); await tick(4); }
}
const canonRows = (expr) => w.eval(`(function(){ var R = ${expr}, o = {}; for (var t in R) { o[t] = {}; for (var id in R[t]) { var x = JSON.parse(JSON.stringify(R[t][id])); delete x._v; o[t][id] = __undoStable(x); } } return JSON.stringify(o); })()`);

setTimeout(async () => { try {
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','openGroupDetail','openMemberDetail','renderArchive','__refreshUIInPlace','setCloudDot'].forEach(function(fn){ window[fn] = function(){}; }); window.plToast = function(){};");
  const CM = w.eval('currentMonth()');
  const NM = shiftM(CM, +1);
  w.eval(`
    state.settings.reformers = 10;
    state.packageTypes = [{ id: 'p8', name: '8 Ders', sessions: 8, price: 8000 }];
    state.instructors = [{ id: 'h1', name: 'HOCA BIR', shareRate: 30 }];
    state.members = [
      { id: 'u1', name: 'DERYA DENEME', joinDate: '2026-01-01', totalPrice: 4500, defaultPackageId: 'p8', packages: [], monthly: { '${CM}': { enrolled: true }, '${NM}': { enrolled: true } } },
      { id: 'u2', name: 'KEREM DENEME', joinDate: '2026-01-01', totalPrice: 4500, defaultPackageId: 'p8', packages: [], monthly: { '${CM}': { enrolled: true }, '${NM}': { enrolled: true } } },
      { id: 'u3', name: 'ESKI UYE', joinDate: '2025-01-01', totalPrice: 3000, packages: [], archived: true, archivedAt: '2026-02-01', monthly: {} }
    ];
    state.groups = [{ id: 'g1', name: 'DERYA DENEME - KEREM DENEME', size: 2, memberIds: ['u1', 'u2'], defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [], monthlyMembers: { '${CM}': ['u1', 'u2'], '${NM}': ['u1', 'u2'] }, monthlyNotes: {} }];
    state.lessons = [
      { id: 'L1', date: '${CM}-05', time: '10:00', status: 'completed', groupId: 'g1', memberIds: ['u1', 'u2'], instructorId: 'h1', packageMonth: '${CM}' },
      { id: 'L2', date: '${CM}-12', time: '10:00', status: 'planned', groupId: 'g1', memberIds: ['u1', 'u2'], instructorId: 'h1', packageMonth: '${CM}' }
    ];
    state.payments = [{ id: 'p1', memberId: 'u1', groupId: 'g1', amount: 4500, date: '${CM}-03', packageMonth: '${CM}', sessions: 8, method: 'Nakit' }, { id: 'p3', memberId: 'u3', amount: 3000, date: '2026-01-10', packageMonth: '2026-01', sessions: 8, method: 'Nakit' }];
    try { localStorage.removeItem('pilateria_undo'); localStorage.removeItem('pilateria_undo_meta'); } catch(e) {}
    __undoStack = []; __undoExt = {}; __undoPrevRows = null;
  `);
  w.eval(FAKE);
  // açılış çekimi tamamlanmış gibi: sunucu = yerel, gölge güvenilir temel
  w.eval(`(function(){ var R = sbStateToRows(), v = Date.now() - 100000; for (var t in R) { __SRV[t] = {}; for (var id in R[t]) __SRV[t][id] = Object.assign({}, JSON.parse(JSON.stringify(R[t][id])), { _v: v }); } __sbVer = {}; sbSnapshotShadow(R); save(); })()`);
  w.eval("window.__sbHeartbeatMs = 1e9; __sbChannel = null; sbSubscribeAll();");
  t('sahte realtime kanalı bağlandı', w.eval("typeof __RTH") === 'function');
  await drain();
  w.eval("window.__applyN = 0;");

  console.log('[1] R1: YENİ ÜYE → Geri Al yalnız eklemeyi geri alır (araya giren eski işlem/başka değişiklik geri sarılmaz)');
  w.eval("__undoSnapshot('ESKI ISLEM (finans)');");
  w.eval("state.members.find(function(m){ return m.id === 'u2'; }).phone = '0532 000 00 00'; save();");
  await drain();
  w.eval("openMemberModal(); document.getElementById('mm-name').value = 'YENI KISI'; document.getElementById('mm-total-price').value = '4800'; saveMember();");
  const newId = w.eval("(state.members.find(function(m){ return m.name === 'YENI KISI'; }) || {}).id || ''");
  t('yeni üye eklendi', !!newId);
  const lbl1 = w.eval("(__undoStack[__undoStack.length - 1] || {}).label || ''");
  t("Geri Al düğmesi YENİ ÜYEYİ hedefler ('Yeni üye: YENI KISI')", /Yeni üye: YENI KISI/.test(lbl1), lbl1);
  t('düğme etiketi görünür', [...d.querySelectorAll('.undo-btn')].some(b => b.style.display !== 'none' && b.textContent.indexOf('YENI KISI') !== -1), [...d.querySelectorAll('.undo-btn')].map(b => b.textContent + '/' + b.style.display).join('|'));
  // gönderim: members → (HTTP yanıtı) → member_finance yolda iken members yankısı gelir (gerçek yarış)
  let ix = await waitPend('members');
  t('members gönderimi başladı', ix >= 0);
  w.eval(`(function(){ var p = __PEND[${ix}]; __commit(p); __resolve(p); })()`);
  ix = await waitPend('member_finance');
  t('member_finance gönderimi yolda', ix >= 0);
  w.eval("__deliver(function(ev){ return ev.table === 'members'; })");
  t('R2/R3: members yankısı yoldaki fiyatı SİLMEDİ (yerel 4800 kaldı)', w.eval(`String((state.members.find(function(m){ return m.id === '${newId}'; }) || {}).totalPrice)`) === '4800', w.eval(`JSON.stringify(state.members.find(function(m){ return m.id === '${newId}'; }) || null)`).slice(0, 200));
  await drain();
  t('R3: kendi yankılarımız "başka cihaz" damgası ALMADI', !w.eval(`__undoExt['members/${newId}'] || __undoExt['member_finance/${newId}']`), w.eval("JSON.stringify(__undoExt)"));
  t('R3: kendi yankılarımız yeniden UYGULANMADI (sbApplyOne çağrılmadı)', w.eval("window.__applyN") === 0, w.eval("window.__applyN"));
  t('sunucuda yeni üye var (her iki tablo)', w.eval(`!!(__SRV.members['${newId}'] && __SRV.member_finance['${newId}'])`));
  w.__msgs.length = 0;
  w.undoLast();
  const cm1 = w.__msgs.find(m => m.indexOf('geri alınacak') !== -1) || '';
  t("onay metni 'Yeni üye' işlemini söyler, 'BAŞKA CİHAZDAN' koruma listesi YOK", cm1.indexOf('Yeni üye: YENI KISI') !== -1 && cm1.indexOf('BAŞKA CİHAZDAN') === -1, cm1.slice(0, 300));
  t('Geri Al: yeni üye KALKTI', !w.eval(`state.members.some(function(m){ return m.id === '${newId}'; })`));
  t('araya giren başka değişiklik (KEREM telefonu) KORUNDU', w.eval("state.members.find(function(m){ return m.id === 'u2'; }).phone") === '0532 000 00 00');
  t('düğme bir önceki işlemi gösteriyor (ESKI ISLEM)', /ESKI ISLEM/.test(w.eval("(__undoStack[__undoStack.length - 1] || {}).label || ''")));
  await drain();
  t('buluttan da silindi (members + member_finance)', !w.eval(`!!(__SRV.members['${newId}'] || __SRV.member_finance['${newId}'])`), w.eval(`JSON.stringify([!!__SRV.members['${newId}'], !!__SRV.member_finance['${newId}']])`));

  console.log('[2] R1: üye DÜZENLE ve AYA EKLE de geri alınır');
  w.eval("__undoStack = []; __undoExt = {}; __undoPrevRows = null;");
  w.eval("openMemberModal('u2'); document.getElementById('mm-phone').value = '0533 111 11 11'; saveMember();");
  t("düzenleme yedeği ('Üye düzenle: KEREM DENEME')", /Üye düzenle: KEREM DENEME/.test(w.eval("(__undoStack[__undoStack.length - 1] || {}).label || ''")), w.eval("(__undoStack[__undoStack.length - 1] || {}).label || ''"));
  await drain();
  w.undoLast();
  t('düzenleme geri alındı (telefon eski haline döndü)', w.eval("state.members.find(function(m){ return m.id === 'u2'; }).phone") === '0532 000 00 00', w.eval("state.members.find(function(m){ return m.id === 'u2'; }).phone"));
  await drain();
  const M3 = shiftM(CM, +2);
  w.eval(`addMemberToMonth('u2', '${M3}');`);
  t("aya ekleme yedeği ('Aya ekle: KEREM DENEME')", /Aya ekle: KEREM DENEME/.test(w.eval("(__undoStack[__undoStack.length - 1] || {}).label || ''")), w.eval("(__undoStack[__undoStack.length - 1] || {}).label || ''"));
  t('aya eklendi', w.eval(`isMemberEnrolledInMonth('u2', '${M3}')`) === true);
  await drain();
  w.undoLast();
  t('aya ekleme geri alındı', w.eval(`isMemberEnrolledInMonth('u2', '${M3}')`) === false);
  await drain();

  console.log('[3] R2: PASİFE AL → Geri Al; o arada başka cihaz yalnız FİYATI değiştirdi → üye geri aktif, yeni fiyat korunur');
  w.eval("__undoStack = []; __undoExt = {}; __undoPrevRows = null;");
  w.eval(`removeMemberFromMonth('u1', '${NM}');`);
  t('pasife alındı', w.eval(`isMemberEnrolledInMonth('u1', '${NM}')`) === false);
  await drain();
  w.eval("window.__applyN = 0;");
  w.eval("(function(){ var cur = JSON.parse(JSON.stringify(__SRV.member_finance.u1)); delete cur._v; cur.totalPrice = 9999; __remote('member_finance', 'u1', cur); })()");
  t('başka cihazın fiyatı geldi (9999)', w.eval("state.members.find(function(m){ return m.id === 'u1'; }).totalPrice") === 9999);
  t('başka cihaz değişikliği damgalandı (member_finance/u1)', !!w.eval("__undoExt['member_finance/u1']"));
  t('yalnız fiyat yarısı damgalı (members/u1 değil)', !w.eval("__undoExt['members/u1']"), w.eval("JSON.stringify(__undoExt)"));
  w.__msgs.length = 0;
  w.undoLast();
  t('Geri Al: üye '+NM+' ayında yeniden AKTİF', w.eval(`isMemberEnrolledInMonth('u1', '${NM}')`) === true);
  t('başka cihazın fiyatı (9999) KORUNDU', w.eval("state.members.find(function(m){ return m.id === 'u1'; }).totalPrice") === 9999);
  t('arşiv dönemi kalktı', w.eval("JSON.stringify(state.members.find(function(m){ return m.id === 'u1'; }).archivePeriods || [])") === '[]');
  await drain();
  t('bulutta da aktif (sunucu kaydı)', w.eval(`JSON.stringify(((__SRV.members.u1 || {}).monthly || {})['${NM}'] || {})`).indexOf('"enrolled":true') !== -1, w.eval(`JSON.stringify(((__SRV.members.u1 || {}).monthly || {})['${NM}'] || {})`));

  console.log('[4] R2: kendi fiyat gönderimimiz yoldayken başka cihaz ADI değiştirdi → ikisi de korunur (veri kaybı yok)');
  w.eval("state.members.find(function(m){ return m.id === 'u2'; }).totalPrice = 5100; save();");
  ix = await waitPend('member_finance');
  t('fiyat gönderimi yolda', ix >= 0);
  w.eval("(function(){ var b = JSON.parse(JSON.stringify(__SRV.members.u2)); delete b._v; b.name = 'KEREM YENI AD'; __remote('members', 'u2', b); })()");
  t('uzaktan ad geldi', w.eval("state.members.find(function(m){ return m.id === 'u2'; }).name") === 'KEREM YENI AD');
  t('yoldaki yerel fiyat (5100) BOZULMADI', w.eval("state.members.find(function(m){ return m.id === 'u2'; }).totalPrice") === 5100, w.eval("state.members.find(function(m){ return m.id === 'u2'; }).totalPrice"));
  w.eval("state.members.find(function(m){ return m.id === 'u2'; }).health = 'not'; save();"); // ikinci gönderim kuyruğa girer
  await drain();
  t('SON HAL yerelde: ad + fiyat ikisi de', w.eval("(function(){ var m = state.members.find(function(m){ return m.id === 'u2'; }); return m.name + '|' + m.totalPrice; })()") === 'KEREM YENI AD|5100', w.eval("(function(){ var m = state.members.find(function(m){ return m.id === 'u2'; }); return m.name + '|' + m.totalPrice; })()"));
  t('SON HAL bulutta: fiyat 5100 (kaybolmadı)', w.eval("(__SRV.member_finance.u2 || {}).totalPrice") === 5100, w.eval("(__SRV.member_finance.u2 || {}).totalPrice"));

  console.log('[5] R3: kendi yankımız, daha YENİ yerel düzenlemeyi geri sarmaz');
  w.eval("state.lessons.find(function(l){ return l.id === 'L2'; }).time = '11:00'; save();");
  ix = await waitPend('lessons');
  w.eval(`__commit(__PEND[${ix}]);`);                         // sunucu yazdı, HTTP yanıtı henüz gelmedi
  w.eval("state.lessons.find(function(l){ return l.id === 'L2'; }).time = '12:00'; save();"); // yeni yerel düzenleme
  w.eval("__deliver(function(ev){ return ev.table === 'lessons'; })"); // eski yazımın yankısı ERKEN geldi
  t('yerel yeni saat (12:00) korundu', w.eval("state.lessons.find(function(l){ return l.id === 'L2'; }).time") === '12:00', w.eval("state.lessons.find(function(l){ return l.id === 'L2'; }).time"));
  w.eval(`__resolve(__PEND[${ix}]);`);
  await drain();
  t('bulutta da 12:00', w.eval("(__SRV.lessons.L2 || {}).time") === '12:00', w.eval("(__SRV.lessons.L2 || {}).time"));
  t('yerelde de 12:00', w.eval("state.lessons.find(function(l){ return l.id === 'L2'; }).time") === '12:00');

  console.log('[6] R3: kaydedilmemiş yerel değişiklik, BAŞKA kaydın uzaktan gelişinde "başka cihaz" sayılmaz');
  w.eval("__undoStack = []; __undoExt = {}; __undoPrevRows = null; __undoSnapshot('KAPSAM DENEME');");
  w.eval("state.members.find(function(m){ return m.id === 'u2'; }).health = 'kaydedilmedi';"); // save YOK
  w.eval("(function(){ var l = JSON.parse(JSON.stringify(__SRV.lessons.L1)); delete l._v; l.time = '09:30'; __remote('lessons', 'L1', l); })()");
  t('uzaktan gelen ders uygulandı', w.eval("state.lessons.find(function(l){ return l.id === 'L1'; }).time") === '09:30');
  t('uzaktan gelen ders damgalandı', !!w.eval("__undoExt['lessons/L1']"));
  t('yerel (kaydedilmemiş) üye değişikliği "başka cihaz" damgası ALMADI', !w.eval("__undoExt['members/u2']"), w.eval("JSON.stringify(__undoExt)"));
  w.eval("__undoStack = []; __undoExt = {}; __undoPrevRows = null; renderUndoBtn();");
  await drain();

  console.log('[7] Kalıcı sil → Geri Al: üye + ödemesi geri gelir, buluta da yazılır');
  w.eval("permanentDeleteMember('u3');");
  t('kalıcı silindi', !w.eval("state.members.some(function(m){ return m.id === 'u3'; })") && !w.eval("state.payments.some(function(p){ return p.id === 'p3'; })"));
  await drain();
  t('buluttan silindi', !w.eval("!!__SRV.members.u3"));
  w.undoLast();
  t('Geri Al: üye ve ödemesi geri geldi', w.eval("state.members.some(function(m){ return m.id === 'u3'; })") && w.eval("state.payments.some(function(p){ return p.id === 'p3'; })"));
  await drain();
  t('bulutta geri var (üye + fiyat + ödeme)', w.eval("!!(__SRV.members.u3 && __SRV.member_finance.u3 && __SRV.payments.p3)"));

  console.log('[8] TEK ADIM: pasife al → "pay kaydı" sorusuna cevap → TEK Geri Al üyeyi geri getirir (pay da kalkar)');
  w.eval("__undoStack = []; __undoExt = {}; __undoPrevRows = null; renderUndoBtn();");
  w.__DLG = (o) => (o && o.input) ? String(o.input.value) : true; // önerilen tutarı kabul et
  w.eval(`removeMemberFromMonth('u1', '${CM}');`);
  await tick(60);
  t('pay kaydı sorusu soruldu ve kaydedildi', !!w.eval(`partialShareFor('g1', 'u1', '${CM}')`), w.__msgs.filter(m => /payı olarak/.test(m)).length);
  t('Geri Al adımı TEK (yığın 1)', w.eval("__undoStack.length") === 1, w.eval("JSON.stringify(__undoStack.map(function(s){ return s.label; }))"));
  t("etiket işlemi ve cevabı birlikte söyler ('ayından çıkar + Pay kaydı')", /ayından çıkar \+ Pay kaydı/.test(w.eval("(__undoStack[__undoStack.length - 1] || {}).label || ''")), w.eval("(__undoStack[__undoStack.length - 1] || {}).label || ''"));
  await drain();
  w.undoLast();
  t('tek Geri Al: üye '+CM+' ayında yeniden AKTİF', w.eval(`isMemberEnrolledInMonth('u1', '${CM}')`) === true);
  t('tek Geri Al: pay kaydı da kalktı', !w.eval(`partialShareFor('g1', 'u1', '${CM}')`));
  t('üye planlı derse geri döndü (L2)', w.eval("state.lessons.find(function(l){ return l.id === 'L2'; }).memberIds.indexOf('u1') !== -1"));
  await drain();

  console.log('[9] TEK ADIM: boş slota mevcut üyeyi ekle → "kalan derse göre ücret" cevabı → TEK Geri Al üyeyi gruptan çıkarır');
  w.eval(`
    state.members.push({ id: 'u4', name: 'AYSE DENEME', joinDate: '2026-01-01', totalPrice: 4000, packages: [], monthly: { '${CM}': { enrolled: true } } });
    state.groups.push({ id: 'g2', name: 'KEREM DENEME', size: 3, memberIds: ['u2'], defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [], monthlyMembers: { '${CM}': ['u2'] }, monthlyNotes: {} });
    state.lessons.push({ id: 'L3', date: '${CM}-02', time: '18:00', status: 'completed', groupId: 'g2', memberIds: ['u2'], instructorId: 'h1', packageMonth: '${CM}' });
    save();
  `);
  await drain();
  w.eval("__undoStack = []; __undoExt = {}; __undoPrevRows = null; renderUndoBtn();");
  w.eval("assignMemberToSlot('u4', 'g2', 1);");
  await tick(60);
  t('AYSE g2 kadrosunda', w.eval(`activeGroupRosterForMonth(state.groups.find(function(g){ return g.id === 'g2'; }), '${CM}').indexOf('u4') !== -1`));
  t('kalan derse göre ücret sorusu cevaplandı (fiyat yazıldı)', w.eval(`((state.members.find(function(m){ return m.id === 'u4'; }).monthly || {})['${CM}'] || {}).totalPrice`) === 3500, w.eval(`JSON.stringify((state.members.find(function(m){ return m.id === 'u4'; }).monthly || {})['${CM}'])`));
  t("Geri Al adımı TEK ve 'Gruba ekle' ile başlar", w.eval("__undoStack.length") === 1 && /^Gruba ekle: AYSE DENEME/.test(w.eval("(__undoStack[0] || {}).label || ''")), w.eval("JSON.stringify(__undoStack.map(function(s){ return s.label; }))"));
  await drain();
  w.undoLast();
  t('tek Geri Al: AYSE gruptan çıktı', w.eval(`activeGroupRosterForMonth(state.groups.find(function(g){ return g.id === 'g2'; }), '${CM}').indexOf('u4') === -1`));
  t('tek Geri Al: orantılı ücret de kalktı', w.eval(`((state.members.find(function(m){ return m.id === 'u4'; }).monthly || {})['${CM}'] || {}).totalPrice`) === undefined);
  await drain();

  console.log('[10] TEK ADIM: gruptaki boş slottan YENİ ÜYE → ücret cevabı → TEK Geri Al üyeyi ve slotu geri alır');
  w.eval("__undoStack = []; __undoExt = {}; __undoPrevRows = null; renderUndoBtn();");
  w.eval("startNewMemberForSlot('g2', 1); document.getElementById('mm-name').value = 'SLOT YENI'; document.getElementById('mm-total-price').value = '4000'; saveMember();");
  await tick(60);
  const slotId = w.eval("(state.members.find(function(m){ return m.name === 'SLOT YENI'; }) || {}).id || ''");
  t('yeni üye g2 kadrosunda', !!slotId && w.eval(`activeGroupRosterForMonth(state.groups.find(function(g){ return g.id === 'g2'; }), '${CM}').indexOf('${slotId}') !== -1`));
  t("Geri Al adımı TEK ('Yeni üye: SLOT YENI' ...)", w.eval("__undoStack.length") === 1 && /^Yeni üye: SLOT YENI/.test(w.eval("(__undoStack[0] || {}).label || ''")), w.eval("JSON.stringify(__undoStack.map(function(s){ return s.label; }))"));
  await drain();
  w.undoLast();
  t('tek Geri Al: yeni üye kalktı', !w.eval(`state.members.some(function(m){ return m.id === '${slotId}'; })`));
  t('tek Geri Al: g2 kadrosu eski hali (yalnız KEREM)', w.eval(`JSON.stringify(activeGroupRosterForMonth(state.groups.find(function(g){ return g.id === 'g2'; }), '${CM}'))`) === '["u2"]', w.eval(`JSON.stringify(activeGroupRosterForMonth(state.groups.find(function(g){ return g.id === 'g2'; }), '${CM}'))`));
  w.__DLG = null;
  await drain();

  console.log('[11] TUTARLILIK: yerel satırlar = sunucu satırları');
  await drain();
  const L = canonRows('sbStateToRows()'), S = canonRows('__SRV');
  const Lo = JSON.parse(L), So = JSON.parse(S); let diffs = [];
  for (const tb of Object.keys(Lo)) { const a = Lo[tb] || {}, b = So[tb] || {}; for (const id of new Set(Object.keys(a).concat(Object.keys(b)))) if (a[id] !== b[id]) diffs.push(tb + '/' + id); }
  t('yerel = bulut (fark yok)', diffs.length === 0, diffs.slice(0, 8).join(', '));

  console.log('');
  console.log('SONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.log('TEST COKTU', e && e.stack || e); process.exit(1); } }, 1500);
