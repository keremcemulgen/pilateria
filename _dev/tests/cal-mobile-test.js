// v132 — telefonda Google Takvim duzeni. Yamasiz build'de FAIL etmeli; masaustu yolu DEGISMEMELI.
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
setTimeout(()=>{ try {
  const today = w.eval('todayISO()');
  const cm = today.slice(0,7);
  w.eval(`
    state.settings.holidays=[];
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.campaigns=[];
    state.members=[
      {id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:1500,packages:[],monthly:{'${cm}':{enrolled:true}}},
      {id:'m2',name:'BANU',joinDate:'2026-01-01',totalPrice:1500,packages:[],monthly:{'${cm}':{enrolled:true}}}
    ];
    state.groups=[{id:'g1',name:'AYSE - BANU',size:2,memberIds:['m1','m2'],defaultInstructorId:'h1',packages:[],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[
      {id:'L1',date:'${today}',time:'10:00',durationMin:60,instructorId:'h1',size:2,memberIds:['m1','m2'],groupId:'g1',packageMonth:'${cm}',status:'planned'},
      {id:'L2',date:'${today}',time:'12:15',durationMin:60,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',status:'cancelled'},
      {id:'L3',date:'${today}',time:'13:00',durationMin:60,instructorId:'h1',size:1,memberIds:['m2'],groupId:'',packageMonth:'${cm}',status:'completed'}
    ];
    state.payments=[]; state.expenses=[];`);

  console.log('[1] MOBIL AY: noktali izgara + secili gunun listesi');
  w.eval("window.__forceCalMobile = true; calAnchor = parseISO(todayISO());");
  w.setCalView('month');
  const calHtml = d.getElementById('calendar').innerHTML;
  t('gcal izgarasi cizildi', /pcal-grid/.test(calHtml));
  t('bugun SECILI (dolu daire)', /pcal-cell[^"]*today[^"]*sel|pcal-cell[^"]*sel[^"]*today/.test(calHtml));
  const cellM = calHtml.match(new RegExp('<button class="pcal-cell[^"]*"[^>]*onclick="pcalSelectDay\\(\'' + today + '\'\\)"[^>]*>[\\s\\S]*?</button>'));
  t('bugunun hucresinde 2 nokta (iptal sayilmaz)', !!cellM && /••/.test(cellM[0]) && !/•••/.test(cellM[0]), cellM ? cellM[0].replace(/</g,' ').slice(0,80) : 'hucre yok');
  const ag = d.getElementById('pcal-agenda').innerHTML;
  t('kart: 10:00 · AYSE, BANU (parantez/arti YOK)', /10:00 · AYSE, BANU/.test(ag), ag.replace(/</g,' ').slice(0,120));
  t('"HOCA+" kaligrafisi YOK (v133 Kerem)', !/\+\)/.test(ag) && !/HOCA\+/.test(ag));
  t('hoca alt satirda duz yazi', /2\/2 · HOCA · Planlandı/.test(ag), ag.replace(/</g,' ').slice(0,160));
  t('iptal karti gri+iptal', /pcst-cancelled/.test(ag) && /iptal/.test(ag));
  t('yapildi karti ayri sinif', /pcst-completed/.test(ag));
  t('kart dokununca ders modali', ag.includes("openLessonModal('L1')"));
  t('saat araligi yazili (10:00–11:00)', /10:00–11:00/.test(ag));

  console.log('[2] gun secimi degisince liste degisir');
  const bos = w.eval("(function(){ const t0=todayISO().split('-').map(Number); const d2=new Date(t0[0],t0[1]-1,t0[2]); d2.setDate(d2.getDate()+ (d2.getDate()>15?-1:1)); return isoDate(d2); })()");
  w.pcalSelectDay(bos);
  t('bos gunde "Bu gün ders yok"', /Bu gün ders yok/.test(d.getElementById('pcal-agenda').innerHTML));
  t('secim isareti tasindi', new RegExp('pcalSelectDay\\(\'' + bos + '\'\\)"').test(d.getElementById('calendar').innerHTML));

  console.log('[3] MOBIL GUN gorunumu de kart listesi');
  w.eval("calAnchor = parseISO(todayISO());");
  w.setCalView('day');
  t('gun gorunumu gcal kartlari', /pcal-card/.test(d.getElementById('calendar').innerHTML));

  console.log('[4] MASAUSTU DEGISMEDI');
  w.eval("window.__forceCalMobile = false;");
  w.setCalView('month');
  const desk = d.getElementById('calendar').innerHTML;
  t('masaustu ay hala gm-cell', /gm-cell/.test(desk));
  t('masaustunde gcal izgarasi YOK', !/pcal-grid/.test(desk));
  w.setCalView('week');
  const wk = d.getElementById('calendar').innerHTML;
  t('masaustu hafta hala mevcut gcal izgarasi', /gcal-dayhead/.test(wk) && !/pcal-wrap/.test(wk));

  console.log('[5] STATIK');
  t('mobil CSS blogu var', html.includes('pl-cal-mobile-css'));
  t('haftada mobil sadelestirme kurali', html.includes('.cal-lesson .l-top, .cal-lesson .l-members, .cal-lesson .l-inst { display:none; }'));
  t('planli kart ACIK yesil (v133)', html.includes('.pcal-card { background:#9fd8c0; color:#0e3b2e;'));
  t('yapilan kart orta yesil', html.includes('.pcal-card.pcst-completed { background:var(--acc); color:var(--acc-contrast,#fff); }'));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
