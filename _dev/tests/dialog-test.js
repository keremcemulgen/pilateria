// Faz 1b — SIK DIYALOGLAR: plAlert/plConfirm/plPrompt gercek DOM davranisi + cevrilen akislar
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.scrollTo=()=>{}; /* DIKKAT: alert/confirm/prompt stub YOK — gercek plDialog test edilir */
  }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const dlgVisible=()=>{const bg=d.getElementById('pl-dlg-bg');return !!bg && bg.classList.contains('on');};
const btnByText=(txt)=>[...d.querySelectorAll('#pl-dlg-btns button')].find(b=>b.textContent===txt);

setTimeout(async ()=>{ try {
  console.log('[1] plConfirm — Evet/Vazgec/Escape');
  let p1 = w.plConfirm('Silinsin mi?');
  await sleep(20);
  t('dialog acildi + mesaj dogru', dlgVisible() && d.getElementById('pl-dlg-msg').textContent==='Silinsin mi?');
  btnByText('Evet').click();
  t('Evet → true', (await p1)===true);
  t('dialog kapandi', !dlgVisible());
  p1 = w.plConfirm('Emin misin?','Sil','Kalsin');
  await sleep(20);
  t('ozel etiketler', !!btnByText('Sil') && !!btnByText('Kalsin'));
  btnByText('Kalsin').click();
  t('Vazgec → false', (await p1)===false);
  p1 = w.plConfirm('Escape testi');
  await sleep(20);
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  t('Escape → false (onay istemez)', (await p1)===false);

  console.log('[2] plPrompt — deger/vazgec/Enter');
  let p2 = w.plPrompt('Tarih gir:', '2026-07-14');
  await sleep(20);
  const inp = d.getElementById('pl-dlg-input');
  t('input gorunur + varsayilan deger', inp.style.display!=='none' && inp.value==='2026-07-14');
  inp.value = '2026-08-01';
  btnByText('Tamam').click();
  t('Tamam → girilen deger', (await p2)==='2026-08-01');
  p2 = w.plPrompt('Bos birak:');
  await sleep(20);
  btnByText('Vazgeç').click();
  t('Vazgec → null', (await p2)===null);
  p2 = w.plPrompt('Enter testi:', 'X');
  await sleep(20);
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  t('Enter → deger', (await p2)==='X');

  console.log('[3] alert override — sik pencere');
  w.alert('Bilgi mesaji');
  await sleep(20);
  t('alert sik pencerede', dlgVisible() && d.getElementById('pl-dlg-msg').textContent==='Bilgi mesaji');
  btnByText('Tamam').click(); await sleep(10);
  t('kapandi', !dlgVisible());

  console.log('[4] quickAddMemberFromGroup — v44: tam uye formu acar (plPrompt DEGIL)');
  const before = w.eval('state.members.length');
  w.eval(`renderGroupMembersCheckboxes([], '');`);
  w.quickAddMemberFromGroup(''); // artik member modalini acar
  await sleep(20);
  t('member modali acildi (plPrompt yok)', d.getElementById('mm-title').textContent.includes('Yeni Üye') && !dlgVisible());
  d.getElementById('mm-name').value = 'TEST UYE DLG';
  w.saveMember();
  await sleep(10);
  t('uye eklendi', w.eval('state.members.length')===before+1 && w.eval(`state.members.some(m=>m.name==='TEST UYE DLG')`));

  console.log('[5] editGroupPkgStart — plPrompt ile ay paketi tarihi');
  w.eval(`
    state.groups.push({id:'gDLG',name:'DLG GRUP',size:2,memberIds:[],packages:[{month:'2026-07',startDate:'2026-07-01',price:8000}]});
  `);
  let p5 = w.editGroupPkgStart('gDLG','2026-07');
  await sleep(20);
  d.getElementById('pl-dlg-input').value = '2026-07-05';
  btnByText('Tamam').click();
  await p5; await sleep(10);
  t('paket baslangici degisti', w.eval(`state.groups.find(g=>g.id==='gDLG').packages[0].startDate`)==='2026-07-05');

  console.log('[6] resetAllData — Vazgec veri silmez');
  w.localStorage.setItem('pilateria','{"x":1}');
  let p6 = w.resetAllData();
  await sleep(20);
  btnByText('Vazgeç').click();
  await p6;
  t('vazgecince veri durur', w.localStorage.getItem('pilateria')==='{"x":1}');

  console.log('[7] AUTO kancasi (test uyumlulugu)');
  w.__PL_DLG_AUTO__ = (o)=>o&&o.input?null:true;
  t('confirm auto=true', (await w.plConfirm('x'))===true);
  t('prompt auto=null', (await w.plPrompt('x'))===null);
  delete w.__PL_DLG_AUTO__;

  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi`);
  process.exit(fail?1:0);
} catch(err) { console.error('TEST HATASI:', err); process.exit(1); } }, 700);
