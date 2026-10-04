// v189 (Kerem 04.10): "Yapildi olan dersleri tekrar bastan guncellemesin program, ben degistirmedikce toplu ders gir butonunda."
// CANLI: BAN*** BAS*** Eylul paketinin 28.09 17:00 dersi elle GIZEM'e verilmis (uyenin hocasi DERYA). Toplu Ders Gir'de 8. ders
// girilince on-kontrol MEVCUT TUM satirlari uyenin varsayilan hocasi (DERYA) ve varsayilan kadroyla yeniden simule ediyordu →
// DERYA 28.09 16:45'te baska derste → "DERYA ayni anda baska derste" ile kayit REDDEDILIYORDU.
// KURAL: tarihi/saati DEGISMEYEN mevcut ders olduğu gibi sabit (kontrol edilmez, ezilmez); degisen mevcut ders KENDI hocasi/
// kadrosu/suresiyle kontrol edilir; yalniz YENI satirlar varsayilan hoca/kadroyla.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
function boot() {
  const dom = new JSDOM(html, { runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
    beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
      w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})}); if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
      Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
      w.__alerts=[]; w.alert=(m)=>{ w.__alerts.push(String(m||'')); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
      w.__PL_DLG_AUTO__=(o)=>{ w.__alerts.push(String((o&&o.msg)||'')); return (o&&o.input?null:true); }; }});
  return dom.window;
}
const S = '2026-09';
function fixture(w) {
  w.eval(`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.settings.reformers=5; state.settings.lessonDuration=60;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:7000}]; state.payments=[];
    state.instructors=[{id:'D',name:'DERYA',shareRate:30},{id:'G',name:'GIZEM',shareRate:30}];
    const mk=(id,name,ins)=>({id,name,joinDate:'2026-01-01',totalPrice:7000,instructorId:ins,defaultPackageId:'p8',packages:[{month:'${S}',sessions:8,price:7000,status:'active',startDate:'${S}-12',instructorId:ins}],monthly:{'${S}':{enrolled:true},'2026-10':{enrolled:true}}});
    state.members=[mk('B','BANU','D'), mk('E','ESRA','D'), mk('k1','K1','D'), mk('k2','K2','D'), mk('k3','K3','D')];
    state.groups=[{id:'GR',name:'GRUP',size:3,memberIds:['k1','k2','k3'],defaultInstructorId:'D',packages:[{month:'${S}',sessions:8,price:21000,status:'active',startDate:'${S}-12'}],monthlyMembers:{'${S}':['k1','k2','k3']},monthlyNotes:{}}];
    const L=(id,mid,date,time,ins,st)=>({id,date,time,durationMin:60,instructorId:ins,size:1,memberIds:[mid],groupId:'',packageMonth:'${S}',packageOwnerType:'member',packageOwnerId:mid,status:st});
    state.lessons=[ L('b1','B','${S}-12','12:00','D','completed'), L('b2','B','${S}-15','12:15','D','completed'), L('b3','B','${S}-18','13:00','D','completed'),
      L('b4','B','${S}-22','12:15','D','completed'), L('b5','B','${S}-26','13:00','D','completed'),
      L('b6','B','${S}-28','17:00','G','completed'),                      // elle GIZEM'e verildi
      L('b7','B','2026-10-02','13:00','D','completed'),
      L('e1','E','${S}-28','16:45','D','completed'),                      // DERYA 28.09 16:45 baska derste
      L('e2','E','2026-10-06','10:00','D','planned') ];
    const GL=(id,date,time,ins,mids,st)=>({id,date,time,durationMin:60,instructorId:ins,size:3,memberIds:mids,groupId:'GR',packageMonth:'${S}',packageOwnerType:'group',packageOwnerId:'GR',status:st});
    state.lessons.push(GL('g1','${S}-28','17:00','G',['k1','k2'],'completed')); // elle: hoca GIZEM, k3 cikarildi
    state.lessons.push(GL('g2','${S}-30','10:00','D',['k1','k2','k3'],'completed'));`);
}
const tick = ms => new Promise(r => setTimeout(r, ms || 60));
const J = (w, e) => w.eval('JSON.stringify(' + e + ')');
const conflictOpen = w => !!w.document.getElementById('modal-batch-conflicts');
setTimeout(async () => { try {
  console.log('[1] CANLI SENARYO: 7 ders girilmis (28.09 GIZEM), 8. dersi ekle → KAYDEDILIR, mevcutlar AYNEN');
  { const w = boot(); await tick(1200); fixture(w);
    const before = J(w, `state.lessons.filter(l=>l.memberIds.includes('B')).map(l=>[l.id,l.date,l.time,l.instructorId,l.status,l.durationMin].join('|'))`);
    w.openBatchDatesMember('B', S); await tick();
    t('modal 7 mevcut satir + bos satir', w.eval('__batchDatesRows.filter(r=>r.lessonId).length') === 7);
    w.eval(`(function(){ const r=__batchDatesRows.find(x=>!x.lessonId); r.date='2026-10-06'; r.time='12:15'; r.status='planned'; })()`);
    w.saveBatchDates(); await tick();
    t('cakisma penceresi ACILMADI (DERYA 16:45 dersi 28.09 GIZEM dersini engellemez)', !conflictOpen(w), conflictOpen(w) ? w.document.getElementById('modal-batch-conflicts').textContent.slice(0, 200) : '');
    t('8. ders olustu (06.10 12:15, hoca DERYA)', w.eval(`state.lessons.some(l=>l.memberIds.includes('B')&&l.date==='2026-10-06'&&l.time==='12:15'&&l.instructorId==='D')`));
    const after = J(w, `state.lessons.filter(l=>l.memberIds.includes('B')&&l.id.length===2).map(l=>[l.id,l.date,l.time,l.instructorId,l.status,l.durationMin].join('|'))`);
    t('mevcut 7 ders (28.09 GIZEM dahil) HIC degismedi', after === before, after);
    t('mesaj: 1 yeni, 0 guncellendi', w.__alerts.some(a => /1 yeni ders, 0 güncellendi/.test(a)), JSON.stringify(w.__alerts)); }

  console.log('[2] mevcut ders DEGISIRSE kendi hocasiyla kontrol edilir');
  { const w = boot(); await tick(1200); fixture(w);
    w.eval(`state.lessons.push({id:'gx',date:'${S}-29',time:'17:00',durationMin:60,instructorId:'G',size:1,memberIds:['E'],groupId:'',packageMonth:'${S}',packageOwnerType:'member',packageOwnerId:'E',status:'completed'})`);
    w.openBatchDatesMember('B', S); await tick();
    w.eval(`__batchDatesRows.find(r=>r.lessonId==='b6').date='${S}-29';`); // GIZEM 29.09 17:00'de dolu
    w.saveBatchDates(); await tick();
    t('GIZEM ayni anda dolu → cakisma gosterildi, kayit YOK', conflictOpen(w) && /GIZEM/.test(w.document.getElementById('modal-batch-conflicts').textContent) && w.eval(`state.lessons.find(l=>l.id==='b6').date`) === S + '-28');
  }
  { const w = boot(); await tick(1200); fixture(w);
    w.eval(`state.lessons.push({id:'dx',date:'${S}-29',time:'17:00',durationMin:60,instructorId:'D',size:1,memberIds:['E'],groupId:'',packageMonth:'${S}',packageOwnerType:'member',packageOwnerId:'E',status:'completed'})`);
    w.openBatchDatesMember('B', S); await tick();
    w.eval(`__batchDatesRows.find(r=>r.lessonId==='b6').date='${S}-29';`); // DERYA dolu ama ders GIZEM'in
    w.saveBatchDates(); await tick();
    t('DERYA dolu ama ders GIZEM\'in → kaydedildi, hoca GIZEM kaldi', !conflictOpen(w) && w.eval(`(function(){const l=state.lessons.find(l=>l.id==='b6'); return l.date==='${S}-29' && l.instructorId==='G';})()`));
  }

  console.log('[3] YENI satir yine varsayilan hocayla kontrol edilir (emniyet aynen)');
  { const w = boot(); await tick(1200); fixture(w);
    w.openBatchDatesMember('B', S); await tick();
    w.eval(`(function(){ const r=__batchDatesRows.find(x=>!x.lessonId); r.date='2026-10-06'; r.time='10:00'; r.status='planned'; })()`); // DERYA 06.10 10:00 ESRA'da
    w.saveBatchDates(); await tick();
    t('yeni ders DERYA dolu saatte → cakisma, kayit YOK', conflictOpen(w) && !w.eval(`state.lessons.some(l=>l.memberIds.includes('B')&&l.date==='2026-10-06')`)); }

  console.log('[4] GRUP: elle degisen (hoca GIZEM, k3 cikarilmis) yapilmis ders sabit kalir');
  { const w = boot(); await tick(1200); fixture(w);
    w.eval(`state.lessons.push({id:'dy',date:'${S}-28',time:'17:30',durationMin:60,instructorId:'D',size:1,memberIds:['E'],groupId:'',packageMonth:'${S}',packageOwnerType:'member',packageOwnerId:'E',status:'completed'})`);
    w.openBatchDatesGroup('GR', S); await tick();
    w.eval(`(function(){ const r=__batchDatesRows.find(x=>!x.lessonId); r.date='2026-10-05'; r.time='10:00'; r.status='planned'; })()`);
    w.saveBatchDates(); await tick();
    t('cakisma YOK, yeni grup dersi olustu', !conflictOpen(w) && w.eval(`state.lessons.some(l=>l.groupId==='GR'&&l.date==='2026-10-05')`));
    t('elle degisen ders: hoca GIZEM, uyeler k1,k2 (k3 geri yazilmadi)', J(w, `(function(){const l=state.lessons.find(l=>l.id==='g1'); return [l.instructorId,l.memberIds.join(','),l.status];})()`) === JSON.stringify(['G','k1,k2','completed'])); }

  console.log('\nSONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.error('TEST COKTU:', e); process.exit(2); } }, 50);
