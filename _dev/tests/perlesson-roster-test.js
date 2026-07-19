// v54 — DERS-BAZLI HOCA UCRETI: taban = o derste bulunan kadro uyelerinin (ay-fiyati / kendi ders sayisi) toplami
// Kerem senaryosu: 3 kisilik grup, 4. uye (2.paket) 5 derse 2815.5 odeyerek katiliyor.
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
const R=x=>Math.round((+x)*100)/100;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  const ay='2026-07';
  // 3 kisi 8-derslik 4500 (1 ders=562.5); m4 = 5-derslik 2815.5 (1 ders=563.1)
  w.eval(`
    state.settings=state.settings||{}; state.settings.instructorShareRate=30;
    const M=(id,price,q)=>({id,name:id,joinDate:'2026-01-01',archived:false,totalPrice:price,packages:[],
       monthly:{'2026-07':Object.assign({enrolled:true}, q?{sessionsOverride:q}:{})}});
    state.members=[M('m1',4500),M('m2',4500),M('m3',4500),M('m4',2815.5,5),M('mOut',9999)];
    state.members[3].secondOfMember='m1';
    state.groups=[{id:'G',name:'Grup',size:4,memberIds:['m1','m2','m3','m4'],
       monthlyMembers:{'2026-07':['m1','m2','m3','m4']}, packages:[{month:'2026-07',sessions:8,status:'active'}]}];
    const L=(id,day,mids)=>({id,date:'2026-07-'+day,time:'10:00',status:'completed',instructorId:'h',
       instructorRateOverride:30,groupId:'G',memberIds:mids,packageMonth:'2026-07',
       packageOwnerType:'group',packageOwnerId:'G',size:4});
    state.lessons=[ L('L3','05',['m1','m2','m3']), L('L4','12',['m1','m2','m3','m4']),
                    L('LX','19',['m1','m2','m3','mOut']) ];
  `);
  const S=w.S(), L=id=>S.lessons.find(x=>x.id===id);

  console.log('[1] kisi basi 1-ders payi');
  t("8-derslik uye: 4500/8 = 562.5", R(w.memberPerLessonPrice('m1',ay))===562.5, w.memberPerLessonPrice('m1',ay));
  t("5-derslik uye (2.paket): 2815.5/5 = 563.1", R(w.memberPerLessonPrice('m4',ay))===563.1, w.memberPerLessonPrice('m4',ay));

  console.log('[2] GRUP dersi tabani = o derste bulunan kadronun paylari toplami (Kerem sayilari)');
  t("3 kisilik ders (L3) = 3x562.5 = 1687.5", R(w.perLessonPriceForLesson(L('L3')))===1687.5, w.perLessonPriceForLesson(L('L3')));
  t("4 kisilik ders (L4) = 3x562.5 + 563.1 = 2250.6", R(w.perLessonPriceForLesson(L('L4')))===2250.6, w.perLessonPriceForLesson(L('L4')));
  t("taban DERSE gore degisir (L3 != L4)", w.perLessonPriceForLesson(L('L3'))!==w.perLessonPriceForLesson(L('L4')));

  console.log('[3] HOCA payi = taban x %30 (Kerem: 506.25 ve 675.18)');
  t("L3 hoca payi = 1687.5 x .30 = 506.25", R(w.instructorEarningForLesson(L('L3')))===506.25, w.instructorEarningForLesson(L('L3')));
  t("L4 hoca payi = 2250.6 x .30 = 675.18", R(w.instructorEarningForLesson(L('L4')))===675.18, w.instructorEarningForLesson(L('L4')));

  console.log('[4] v49 EMNIYETI: grup-disi sizan uye (mOut) TOPLAMA katilmaz');
  t("LX (m1,m2,m3 + sizan mOut) = 1687.5 (mOut yok sayilir)", R(w.perLessonPriceForLesson(L('LX')))===1687.5, w.perLessonPriceForLesson(L('LX')));
  t("LX == L3 (dis uye ucreti sismez)", w.perLessonPriceForLesson(L('LX'))===w.perLessonPriceForLesson(L('L3')));

  console.log('[5] GERIYE UYUM: tek-tip 8-derslik grupta yeni formul = eski (grup toplami / 8)');
  w.eval(`
    const M=(id,price)=>({id,name:id,joinDate:'2026-01-01',archived:false,totalPrice:price,packages:[],monthly:{'2026-07':{enrolled:true}}});
    state.members=[M('u1',2000),M('u2',2000),M('u3',2000),M('u4',2000)];
    state.groups=[{id:'G8',name:'G8',size:4,memberIds:['u1','u2','u3','u4'],monthlyMembers:{'2026-07':['u1','u2','u3','u4']},packages:[{month:'2026-07',sessions:8,status:'active'}]}];
    state.lessons=[{id:'L8',date:'2026-07-05',time:'10:00',status:'completed',instructorId:'h',instructorRateOverride:30,groupId:'G8',memberIds:['u1','u2','u3','u4'],packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'G8',size:4}];
  `);
  const L8=w.S().lessons.find(x=>x.id==='L8'), G8=w.S().groups.find(g=>g.id==='G8');
  t("4x(2000/8)=1000 = groupExpectedTotal/8", w.perLessonPriceForLesson(L8)===w.groupExpectedTotal(G8,ay)/8 && R(w.perLessonPriceForLesson(L8))===1000, w.perLessonPriceForLesson(L8));

  console.log('[6] BIREYSEL ders = uye ay-fiyati / KENDI ders sayisi');
  w.eval(`
    state.members=[{id:'i5',name:'i5',joinDate:'2026-01-01',archived:false,totalPrice:2815.5,packages:[],monthly:{'2026-07':{enrolled:true,sessionsOverride:5}}},
                   {id:'i8',name:'i8',joinDate:'2026-01-01',archived:false,totalPrice:4500,packages:[],monthly:{'2026-07':{enrolled:true}}}];
    state.groups=[];
    state.lessons=[{id:'LI5',date:'2026-07-05',time:'10:00',status:'completed',instructorId:'h',instructorRateOverride:30,memberIds:['i5'],packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'i5',size:1},
                   {id:'LI8',date:'2026-07-06',time:'10:00',status:'completed',instructorId:'h',instructorRateOverride:30,memberIds:['i8'],packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'i8',size:1}];
  `);
  const LI5=w.S().lessons.find(x=>x.id==='LI5'), LI8=w.S().lessons.find(x=>x.id==='LI8');
  t("5-derslik bireysel: 2815.5/5 = 563.1", R(w.perLessonPriceForLesson(LI5))===563.1, w.perLessonPriceForLesson(LI5));
  t("8-derslik bireysel: 4500/8 = 562.5 (geriye uyum)", R(w.perLessonPriceForLesson(LI8))===562.5, w.perLessonPriceForLesson(LI8));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
