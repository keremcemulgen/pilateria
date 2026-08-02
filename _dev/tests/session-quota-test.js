// v2026.07.18.03 — DERS HAKKI KANONU: odemeden bagimsiz 8-default, grup=tek birim, elle override
// 2026-08-02: tarih-dayaniklilik — aylar calisma aninda turetilir (CM/PM); ROSTER_START_MONTH
// kanonu geregi CM kadrolari fikstursel olarak ACIKCA enrolled yazilir (v58).
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
  const CM = w.eval('currentMonth()');
  const PM = w.eval("(function(){const p=currentMonth().split('-').map(Number);const d0=new Date(p[0],p[1]-2,1);return d0.getFullYear()+'-'+String(d0.getMonth()+1).padStart(2,'0');})()");
  w.eval('window.S=()=>state;');
  w.eval("['renderMembers','renderGroups','renderDashboard','renderCalendar','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen'].forEach(fn=>window[fn]=function(){});");

  console.log('[1] BIREYSEL: odeme YOKKEN bile 8 default kalan');
  w.eval(`state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:4500},{id:'p2',name:'12 Ders',sessions:12,price:6500}];
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true},'${PM}':{enrolled:true}}}];
    state.groups=[]; state.lessons=[]; state.payments=[];`);
  t('odeme yok ama kalan 8 (odemeden bagimsiz)', w.sessionsRemainingFor('member','m1',CM)===8, w.sessionsRemainingFor('member','m1',CM));
  t('memberRemainingForMonth de 8', w.memberRemainingForMonth('m1',CM)===8);

  console.log('[2] BIREYSEL: yazdikca azalir (planli da dusurur), iptal dusurmez');
  w.eval(`state.lessons=[
    {id:'l1',date:'${CM}-03',time:'10:00',memberIds:['m1'],groupId:'',packageMonth:'${CM}',status:'planned'},
    {id:'l2',date:'${CM}-05',time:'10:00',memberIds:['m1'],groupId:'',packageMonth:'${CM}',status:'completed'},
    {id:'l3',date:'${CM}-07',time:'10:00',memberIds:['m1'],groupId:'',packageMonth:'${CM}',status:'missed'},
    {id:'l4',date:'${CM}-09',time:'10:00',memberIds:['m1'],groupId:'',packageMonth:'${CM}',status:'cancelled'}
  ];`);
  t('planli+yapildi+yandi=3 dustu, iptal dusmedi -> 8-3=5', w.sessionsRemainingFor('member','m1',CM)===5, w.sessionsRemainingFor('member','m1',CM));

  console.log('[3] ELLE OVERRIDE: monthly.sessionsOverride kotayi belirler');
  w.eval("setMemberMonthly('m1','"+CM+"',{sessionsOverride:10});");
  t('override 10 -> kalan 10-3=7', w.sessionsRemainingFor('member','m1',CM)===7, w.sessionsRemainingFor('member','m1',CM));
  t("override '' -> otomatik 8'e doner", (w.eval("setMemberMonthly('m1','"+CM+"',{sessionsOverride:''})"), w.sessionsRemainingFor('member','m1',CM)===5));

  console.log('[4] PAKET TIPI kotayi belirler (12 Ders -> 12)');
  w.eval("state.members[0].defaultPackageId='p2';");
  t('12 Ders paketi -> kota 12, kalan 12-3=9', w.sessionsRemainingFor('member','m1',CM)===9, w.sessionsRemainingFor('member','m1',CM));
  w.eval("state.members[0].defaultPackageId='';");

  console.log('[5] AY IZOLASYONU: baska ayin dersi bu ayin hakkini dusurmez');
  w.eval("state.lessons.push({id:'l5',date:'"+PM+"-10',time:'10:00',memberIds:['m1'],groupId:'',packageMonth:'"+PM+"',status:'completed'});");
  t('bu ay kalan hala 5 (onceki ay dersi etkilemez)', w.sessionsRemainingFor('member','m1',CM)===5);
  t('onceki ay kalan 8-1=7', w.sessionsRemainingFor('member','m1',PM)===7);

  console.log('[6] GRUP = TEK BIRIM: grup dersi grubun hakkini dusurur, tum uyeler ayni kalan');
  w.eval(`state.members=[
    {id:'a',name:'CEREN',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
    {id:'b',name:'MERVE',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
    {id:'c',name:'PERI',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}}
  ];
  state.groups=[{id:'g1',name:autoGroupName(['a','b','c']),size:4,memberIds:['a','b','c'],defaultInstructorId:'',defaultPackageId:'',defaultTime:'10:00',defaultDays:[2],packages:[],monthlyMembers:{},monthlyNotes:{}}];
  state.payments=[];
  state.lessons=[
    {id:'gl1',date:'${CM}-02',time:'10:00',memberIds:['a','b','c'],groupId:'g1',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'g1',status:'completed'},
    {id:'gl2',date:'${CM}-04',time:'10:00',memberIds:['a','b','c'],groupId:'g1',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'g1',status:'planned'}
  ];`);
  t('grup kalani 8-2=6', w.sessionsRemainingFor('group','g1',CM)===6, w.sessionsRemainingFor('group','g1',CM));
  t('PERI odemesiz ama grup uyesi -> grubun kalani 6 (— DEGIL)', w.memberRemainingForMonth('c',CM)===6, w.memberRemainingForMonth('c',CM));
  t('tum grup uyeleri AYNI kalan', w.memberRemainingForMonth('a',CM)===6 && w.memberRemainingForMonth('b',CM)===6 && w.memberRemainingForMonth('c',CM)===6);
  t('grup ders SILININCE (iptal) hak geri gelir', (w.eval("state.lessons.find(l=>l.id==='gl2').status='cancelled';"), w.sessionsRemainingFor('group','g1',CM)===7));

  console.log('[7] GRUP kota override (editGroupSessions verisi)');
  w.eval("state.groups[0].monthlySessions={'"+CM+"':12};");
  t('grup override 12 -> kalan 12-1=11 (gl1 completed)', w.sessionsRemainingFor('group','g1',CM)===11, w.sessionsRemainingFor('group','g1',CM));
  w.eval("delete state.groups[0].monthlySessions['"+CM+"'];");

  console.log('[8] ODEME = AYRI gosterge (ders hakkini etkilemez)');
  t('m yok odemesi -> memberPaidInMonth false', w.memberPaidInMonth('a',CM)===false);
  w.eval("state.payments.push({id:'pp',memberId:'a',groupId:'g1',date:'"+CM+"-10',packageMonth:'"+CM+"',sessions:8,amount:4500});");
  t('odeme girilince paid true', w.memberPaidInMonth('a',CM)===true);
  t('odeme kalan dersi DEGISTIRMEDI (hala 7)', w.sessionsRemainingFor('group','g1',CM)===7, w.sessionsRemainingFor('group','g1',CM));

  console.log('[9] ders modali rozeti: kalan(8-bazli) + odeme etiketi ayri gosterilir');
  {
    const sel=d.getElementById('ml-group'); if(sel){ sel.innerHTML='<option value="g1" selected>g</option>'; sel.value='g1'; }
    d.getElementById('ml-id').value=''; const mld=d.getElementById('ml-date'); if(mld) mld.value=CM+'-20';
    w.eval("window.__lessonCtxMonth='"+CM+"';");
    w.renderLessonMembersCheckboxes(['a','b','c']);
    const ih=d.getElementById('ml-members').innerHTML;
    t('odeme etiketi (₺) rozet var', ih.includes('₺'), 'yok');
    t('tire (—) rozet YOK (artik kalan sayisi)', !ih.includes('background:#f5f0e0;color:#8a8573">—<'), 'hala tire var');
  }

  console.log('[10] uye modali: Ders Hakki alani var + override yazilir');
  {
    const mmSel=d.getElementById('member-month'); if(mmSel){ if(!Array.from(mmSel.options).some(o=>o.value===CM)) mmSel.innerHTML+='<option value="'+CM+'">'+CM+'</option>'; mmSel.value=CM; }
    w.openMemberModal('a');
    t('mm-sessions alani DOM da', !!d.getElementById('mm-sessions'));
    d.getElementById('mm-sessions').value='9';
    w.saveMember();
    t('kaydedince override 9 yazildi', w.memberSessionsOverride('a',CM)===9, w.memberSessionsOverride('a',CM));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('HATA', e && e.stack || e); process.exit(1); } }, 1500);
