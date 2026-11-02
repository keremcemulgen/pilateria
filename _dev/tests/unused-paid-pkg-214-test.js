// v214 (B) (Kerem 02.11: "Bahar topcuya neden ders yazılmamış gözüküyor Eylül ayinda" → karar "O pakete yazsın, bana sorsun").
// CANLI DESEN: Eylül paketi ÖDENMİŞ (27.09) ama hiç dersi yok; Ekim'de yazılan dersler tarihine göre EKİM paketine gidiyordu.
// [1] Toplu Ders Gir (Ekim) açılınca SORULUR → "Eylül paketine yaz" → toplu giriş Eylül paketine kilitlenir; "Ekim" → Ekim.
// [2] Tek ders (paket ayı dersin ayında) → SORULUR → Eylül → ders Eylül paketinde; aynı oturumda sonraki ders sormadan Eylül'e
//     (hak dolana kadar); "Ekim" denirse bir daha sorulmaz.
// [3] Önceki paket ödenmemişse / dersi varsa / hedef paketin zaten dersi varsa SORULMAZ. Yamasız v213'te FAIL etmeli.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const tick = ms => new Promise(r => setTimeout(r, ms || 120));
function boot(ans) {
  return new JSDOM(html, { runScripts: 'dangerously', url: 'https://localhost/p.html', pretendToBeVisual: true, beforeParse(w) {
    w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }); if (!w.structuredClone) w.structuredClone = o => JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: () => Promise.resolve({}), getRegistrations: () => Promise.resolve([]) }, configurable: true });
    w.__msgs = []; w.__ANS = ans;
    w.__PL_DLG_AUTO__ = (o) => { const m = String((o && o.msg) || ''); w.__msgs.push(m); if (o && o.buttons && /ÖDENMİŞ ama hiç dersi yok/.test(m)) return w.__ANS; if (o && o.input) return null; return true; };
    w.alert = (m) => w.__msgs.push('ALERT:' + m); w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
  } }).window;
}
const S = '2026-09', T = '2026-10';
const FX = `['renderCalendar','renderArchive'].forEach(f=>window[f]=function(){}); window.plToast=function(){};
  state.settings.reformers=10; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500}]; state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
  state.members=[{id:'B',name:'BAHAR DENEME',joinDate:'2026-06-01',defaultPackageId:'p8',totalPrice:8500,instructorId:'h1',packages:[],monthly:{'2026-08':{enrolled:true},'${S}':{enrolled:true},'${T}':{enrolled:true}}}];
  state.groups=[]; state.lessons=[];
  ['25','28'].forEach((d,i)=>state.lessons.push({id:'a'+i,groupId:'',memberIds:['B'],date:'2026-08-'+d,time:'10:00',status:'completed',packageMonth:'2026-08',instructorId:'h1',size:1}));
  ['01','04','11','18','22','25'].forEach((d,i)=>state.lessons.push({id:'b'+i,groupId:'',memberIds:['B'],date:'${S}-'+d,time:'10:00',status:'completed',packageMonth:'2026-08',instructorId:'h1',size:1}));
  state.payments=[{id:'p8',memberId:'B',groupId:'',date:'2026-08-25',packageMonth:'2026-08',amount:8500},{id:'p9',memberId:'B',groupId:'',date:'${S}-27',packageMonth:'${S}',amount:8500}];`;
const askN = (w) => w.__msgs.filter(m => /ÖDENMİŞ ama hiç dersi yok/.test(m)).length;
async function addLesson(w, date) {
  w.eval(`openLessonModal(null,'${date}','10:00')`); await tick();
  w.eval(`document.getElementById('ml-instructor').value='h1';`);
  w.eval(`(function(){ const cb=[...document.querySelectorAll('#ml-members input[type=checkbox]')].find(x=>x.value==='B'); if(cb){ cb.checked=true; } else { __lessonMemberSearch='BAHAR'; renderLessonMembersCheckboxes(); const c2=[...document.querySelectorAll('#ml-members input[type=checkbox]')].find(x=>x.value==='B'); if(c2) c2.checked=true; } })()`);
  w.eval(`populateLessonPkgMonth()`);
  w.eval('saveLesson()'); await tick(300);
  try { w.eval("closeModal('modal-lesson')"); } catch (e) {}
  return w.eval(`(state.lessons.find(l=>l.date==='${date}')||{}).packageMonth||''`);
}
setTimeout(async () => { try {
  console.log('[1] Toplu Ders Gir (Ekim) — Eylül ödenmiş, dersi yok → SORULUR');
  { const w = boot('S'); await tick(1200); w.eval(FX);
    w.eval(`openBatchDatesMember('B','${T}')`); await tick(300);
    t('soru soruldu (1 kez), adı ve aylar yazıyor', askN(w) === 1 && /BAHAR DENEME/.test(w.__msgs.find(m => /ÖDENMİŞ/.test(m)) || ''), JSON.stringify(w.__msgs.map(m => m.slice(0, 80))));
    t('"Eylül paketine yaz" → toplu giriş EYLÜL paketine kilitli', w.eval('__batchDatesTarget && __batchDatesTarget.packageMonth') === S, w.eval('JSON.stringify(__batchDatesTarget)')); }
  { const w = boot('T'); await tick(1200); w.eval(FX);
    w.eval(`openBatchDatesMember('B','${T}')`); await tick(300);
    t('"Ekim paketine yaz" → toplu giriş EKİM paketine', w.eval('__batchDatesTarget && __batchDatesTarget.packageMonth') === T, w.eval('JSON.stringify(__batchDatesTarget)')); }

  console.log('[2] Tek ders — SORULUR; Eylül seçilince sonraki dersler de (hak dolana kadar) Eylül');
  { const w = boot('S'); await tick(1200); w.eval(FX);
    const pm1 = await addLesson(w, `${T}-02`);
    t('soru soruldu, ders EYLÜL paketinde', askN(w) === 1 && pm1 === S, askN(w) + ' / ' + pm1);
    const pm2 = await addLesson(w, `${T}-06`);
    t('ikinci ders SORMADAN Eylül paketinde', askN(w) === 1 && pm2 === S, askN(w) + ' / ' + pm2);
    for (const d of ['09', '13', '16', '20', '23', '27']) await addLesson(w, `${T}-${d}`);
    t('Eylül 8 derse ulaştı', w.eval(`state.lessons.filter(l=>l.packageMonth==='${S}'&&l.status!=='cancelled').length`) === 8, w.eval(`state.lessons.filter(l=>l.packageMonth==='${S}').length`));
    const pm9 = await addLesson(w, `${T}-30`);
    t('hak doldu → 9. ders Ekim paketinde, yeniden SORULMADI', pm9 === T && askN(w) === 1, pm9 + ' / ' + askN(w)); }
  { const w = boot('T'); await tick(1200); w.eval(FX);
    const pm1 = await addLesson(w, `${T}-02`);
    t('"Ekim" → ders Ekim paketinde', pm1 === T, pm1);
    t('hedef paketin artık dersi var → ikinci derste SORULMAZ', (await addLesson(w, `${T}-06`)) === T && askN(w) === 1, askN(w)); }

  console.log('[3] Sorulmayan durumlar');
  { const w = boot('S'); await tick(1200); w.eval(FX); w.eval("state.payments=state.payments.filter(p=>p.id!=='p9')");
    const pm = await addLesson(w, `${T}-02`);
    t('Eylül ÖDENMEMİŞ → sorulmaz, ders Ekim', askN(w) === 0 && pm === T, askN(w) + ' / ' + pm); }
  { const w = boot('S'); await tick(1200); w.eval(FX); w.eval(`state.lessons.push({id:'s1',groupId:'',memberIds:['B'],date:'${S}-29',time:'10:00',status:'completed',packageMonth:'${S}',instructorId:'h1',size:1})`);
    const pm = await addLesson(w, `${T}-02`);
    t('Eylül paketinin dersi VAR → sorulmaz, ders Ekim', askN(w) === 0 && pm === T, askN(w) + ' / ' + pm); }
  { const w = boot('S'); await tick(1200); w.eval(FX);
    w.eval(`openLessonModal(null,'${T}-02','10:00')`); await tick(); w.eval(`document.getElementById('ml-instructor').value='h1'`);
    w.eval(`(function(){ __lessonMemberSearch='BAHAR'; renderLessonMembersCheckboxes(); const c=[...document.querySelectorAll('#ml-members input[type=checkbox]')].find(x=>x.value==='B'); if(c) c.checked=true; })()`);
    w.eval(`populateLessonPkgMonth('2026-08')`); w.eval('saveLesson()'); await tick(300);
    t('kullanıcı paket ayını ELLE başka aya seçtiyse sorulmaz', askN(w) === 0); }

  console.log('\nSONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.log('TEST COKTU', e && e.stack || e); process.exit(2); } }, 50);
