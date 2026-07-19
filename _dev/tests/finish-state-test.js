// v60 — "Bitmis" rozeti duruma duyarli: TUMU PLANLANDI != GERCEKTEN BITTI (hak hesabi degismedi)
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{}; }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  const ay='2026-07';
  // Kerem ekrani: 8 kota, 8 ders girilmis — 0 yapildi, 8 planli (paket 17.07-15.08 devam ediyor)
  w.eval(`
    const M=id=>({id,name:id.toUpperCase(),joinDate:'2026-01-01',archived:false,totalPrice:4500,packages:[],monthly:{'2026-07':{enrolled:true}}});
    state.members=[M('c1'),M('c2'),M('c3'),M('c4')];
    state.groups=[{id:'G',name:'G',size:4,memberIds:['c1','c2','c3','c4'],monthlyMembers:{'2026-07':['c1','c2','c3','c4']},
      packages:[{month:'2026-07',startDate:'2026-07-17',sessions:8,status:'active'}],defaultTime:'19:00'}];
    state.lessons=Array.from({length:8},(_,i)=>({id:'L'+i,date:'2026-07-'+String(17+i).padStart(2,'0'),time:'19:00',
      status:'planned',instructorId:'h',groupId:'G',memberIds:['c1','c2','c3','c4'],packageMonth:'2026-07',
      packageOwnerType:'group',packageOwnerId:'G',size:4}));
    state.payments=[];
  `);
  console.log('[1] sessionsFinishState kanonu');
  let fsx=w.sessionsFinishState('group','G',ay);
  t('kalan 0 (hak hesabi v43 aynen: 8 kota - 8 yazilan)', fsx.remaining===0, JSON.stringify(fsx));
  t('trulyFinished=FALSE (0 yapildi, 8 planli — paket BITMEDI)', fsx.trulyFinished===false && fsx.planned===8 && fsx.done===0);
  console.log('[2] Grup KARTI rozeti: "Paket bitmis" DEGIL "Dersler planlandi"');
  d.getElementById('group-month') && (d.getElementById('group-month').value='2026-07');
  w.renderGroups();
  const cards=d.getElementById('groups-list').innerHTML;
  t('kartta "Dersler planlandı" var', /Dersler planlandı/.test(cards));
  t('kartta "Paket bitmiş" YOK', !/Paket bitmiş/.test(cards));
  console.log('[3] Dersler YAPILDI isaretlenince GERCEKTEN bitmis');
  w.eval("state.lessons.forEach(l=>l.status='completed');");
  fsx=w.sessionsFinishState('group','G',ay);
  t('8/8 yapildi -> trulyFinished=TRUE', fsx.trulyFinished===true && fsx.done===8);
  w.renderGroups();
  t('kartta artik "Paket bitmiş"', /Paket bitmiş/.test(d.getElementById('groups-list').innerHTML));
  console.log('[4] Kalan>0 normal sayi (regresyon)');
  w.eval("state.lessons=state.lessons.slice(0,5);"); // 5 ders
  fsx=w.sessionsFinishState('group','G',ay);
  t('kalan 3', fsx.remaining===3, fsx.remaining);
  w.renderGroups();
  t('kartta "3 ders kaldı"', /3 ders kaldı/.test(d.getElementById('groups-list').innerHTML));
  console.log('[5] BIREYSEL owner tipi de calisir');
  w.eval(`state.lessons.push({id:'BI',date:'2026-07-20',time:'10:00',status:'planned',instructorId:'h',groupId:'',memberIds:['c1'],packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'c1',size:1});`);
  fsx=w.sessionsFinishState('member','c1',ay);
  t('bireysel: planned=1 (grup dersleri sayilmaz)', fsx.planned===1 && fsx.done===0, JSON.stringify(fsx));
  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
