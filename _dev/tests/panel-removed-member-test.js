// v159 — SONRAKI AYDAN SILINEN UYE PANELDEN DUSER (Kerem, 2026-08-30 gece):
// "sonraki ay uye listesinden sildigim uyeler panelde bu kisimlardan da dusmeli"
// KOK NEDEN: removeMemberFromMonth 'ayindan itibaren' acik arsiv donemi + enrolled:false yazar;
// ama panel pasif denetimi YALNIZ icinde bulunulan aya bakiyordu (v153 isMemberInactiveInMonth
// __nowAy) — Eylul'den silinen uye Agustos'ta hala panel listelerindeydi.
// v159 KURALI: kisinin (klonlar dahil) izlenen paketten SONRAKI bir ay icin ACIK cikarma kaydi
// (enrolled:false ya da o aydan baslayan arsiv donemi) varsa VE sonrasinda yeniden yazilmamissa
// (daha yeni enrolled:true yok) — "1 Dersi Kalan / Biten" VE "Gelecek Hafta Ders Girilmemis"
// listelerinden duser (1-kaldi dahil: silinen uye takip edilmez). Gruplarda ayni: gelecekten
// baslayan acik arsiv donemi olan grup iki listeden de duser. Yamasiz build'de FAIL etmeli.
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
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
setTimeout(()=>{ try {
  const CM = w.eval('currentMonth()');
  const NM = shiftM(CM,+1), N2 = shiftM(CM,+2);
  w.eval(`
    state.settings.reformers=10; state.settings.open=8; state.settings.close=22;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const M=function(id,ad,mo,ekstra){ return Object.assign({id:id,name:ad,joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:mo||{}},ekstra||{}); };
    state.members=[
      // removeMemberFromMonth NM'de ne yaziyorsa o: enrolled:false + acik donem
      M('uR','RANA SILINEN',{'${CM}':{enrolled:true},'${NM}':{enrolled:false}},{archivePeriods:[{from:'${NM}',to:null}]}),
      M('uS','SELIN KALAN1',{'${CM}':{enrolled:true},'${NM}':{enrolled:false}},{archivePeriods:[{from:'${NM}',to:null}]}),
      M('uT','TULAY DURAN',{'${CM}':{enrolled:true}}),
      M('uV','VILDAN DONEN',{'${CM}':{enrolled:true},'${NM}':{enrolled:false},'${N2}':{enrolled:true}},{archivePeriods:[{from:'${NM}',to:'${N2}'}]}),
      M('g1','JULIDE G',{'${CM}':{enrolled:true}}),M('g2','KADRIYE G',{'${CM}':{enrolled:true}}),
      M('g3','LEMAN G',{'${CM}':{enrolled:true}}),M('g4','MUKADDES G',{'${CM}':{enrolled:true}})
    ];
    state.groups=[
      // gF: BU AY bitirdi (guncel) ama NM'den itibaren SILINMIS -> panelde OLMAMALI
      {id:'gF',name:'JULIDE G - KADRIYE G',size:2,memberIds:['g1','g2'],defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${CM}':['g1','g2']},monthlyNotes:{},archivePeriods:[{from:'${NM}',to:null}]},
      // gG: ayni durum, silinmemis -> KALIR
      {id:'gG',name:'LEMAN G - MUKADDES G',size:2,memberIds:['g3','g4'],defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${CM}':['g3','g4']},monthlyNotes:{}}
    ];
    state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
    window.__doldur=function(pref,gid,mids,adet){ for(let i=0;i<adet;i++) state.lessons.push({id:pref+i,date:'${CM}-'+String((i%25)+2).padStart(2,'0'),time:(9+(i%12))+':00',durationMin:45,instructorId:'h1',size:(mids||[]).length||1,memberIds:(mids||[]).slice(),groupId:gid||'',packageMonth:'${CM}',status:'completed'}); };
    __doldur('r','',['uR'],8);  // 8/8 Bitti ama NM'den silinmis
    __doldur('s','',['uS'],7);  // 7/8 1-kaldi ama NM'den silinmis — o da duser
    __doldur('t','',['uT'],8);  // 8/8 Bitti, silinmemis -> kalir
    __doldur('f','gF',['g1','g2'],8);
    __doldur('g','gG',['g3','g4'],8);
  `);

  console.log('[1] BITEN/1-KALDI: sonraki aydan SILINEN uye panelde gorunmez');
  w.renderDashboard();
  const lf = d.getElementById('low-members').innerHTML;
  t('RANA SILINEN (8/8 + NM silinmis) listede DEGIL', lf.indexOf('RANA SILINEN')===-1, (lf.match(/RANA[^<]{0,30}/)||[''])[0]);
  t('SELIN KALAN1 (7/8 + NM silinmis) listede DEGIL — silinen takip edilmez', lf.indexOf('SELIN KALAN1')===-1, (lf.match(/SELIN[^<]{0,30}/)||[''])[0]);
  t('TULAY DURAN (8/8, silinmemis) listede', lf.indexOf('TULAY DURAN')!==-1);
  t('gF grubu (bu ay bitirdi ama NM-den silinmis) listede DEGIL', lf.indexOf('JULIDE G - KADRIYE G')===-1, (lf.match(/JULIDE[^<]{0,40}/)||[''])[0]);
  t('gG grubu (bu ay bitirdi, silinmemis) listede', lf.indexOf('LEMAN G - MUKADDES G')!==-1);

  console.log('[2] GELECEK HAFTA: silinen uye/grup listelenmez; geri eklenen listelenir');
  const nwm = w.eval('(function(){const r=getNextWeekMissing();return {g:r.groups.map(x=>x.name||""),m:r.members.map(x=>x.name||"")};})()');
  t('RANA SILINEN gelecek haftada DEGIL', !nwm.m.includes('RANA SILINEN'), JSON.stringify(nwm.m));
  t('VILDAN DONEN (silinip '+N2+' icin geri eklendi) LISTEDE', nwm.m.includes('VILDAN DONEN'), JSON.stringify(nwm.m));
  t('TULAY DURAN listede', nwm.m.includes('TULAY DURAN'));
  t('gF grubu gelecek haftada DEGIL', !nwm.g.some(n=>n.indexOf('JULIDE')!==-1), JSON.stringify(nwm.g));
  t('gG grubu gelecek haftada LISTEDE', nwm.g.some(n=>n.indexOf('LEMAN')!==-1), JSON.stringify(nwm.g));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
