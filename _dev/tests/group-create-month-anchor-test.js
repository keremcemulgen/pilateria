// v162 — YENI GRUP SAYFANIN AYINA CAPALANIR + TASIMA AY-BILINCLI + DOGUM SINIRI ONARIMI
// (Kerem, 2026-09-01, ekran goruntuleri): Temmuz paketi Agustos'a sarkan grubun uyelerini Agustos
// listesinden sildi; Eylul'de ayni kisilerle YENI grup acinca (a) "4 uye baska yerden bu gruba
// tasindi: GULENAY YILMAZ - ..." uyarisi (eski kaydin BAYAT adi), (b) yeni grup TEMMUZ listesinde
// mukerrer gorundu, (c) yeni grubun Eylul kadrosu BOS kaldi (uyeler Agustos'tan pasifti).
// KOK NEDEN: saveGroup yeni-grup yolunda kadro yalniz temel memberIds'e yazildi (dogum siniri yok
// -> tum gecmis aylara sizdi), uyeler baglam ayina kaydedilmedi, paket/dersler bugune capalandi;
// removeMemberFromOtherContexts ay'da pasif grubu da "sahip" saydi ve bayat g.name'i yazdi.
// KURALLAR:
//  1) Yeni grup: monthlyMembers[baglam-1] = [] (dogum siniri), uyeler baglam ayina kaydedilir
//     (arsiv donemi o ayda kapanir), paket + otomatik dersler baglam ayina capalanir.
//  2) Tasima: ay'da pasif (arsiv/donem) grup uye tutamaz — dokunulmaz, uyari yazilmaz; not metni
//     kaydin o ayki GORUNEN adi + "(son paket: Ay Yil)" — bayat g.name degil.
//  3) __migV162Repair: kanon (2026-08) sonrasi dogmus ve dogum siniri olmayan gruplara sinir
//     eklenir; hic anahtari olmayan + dogdugu ayda hic uyesi kayitli olmayan YETIM gruba uyeleri
//     o aya kaydedilir. Idempotent; kanon oncesi gruplara dokunulmaz.
// Yamasiz build'de FAIL etmeli.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return o&&o.input?null:true; };
    // v166: ayni kadroyla grup varsa "o grubu aya tasiyayim mi?" sorulur — bu test YENI KAYIT yolunu sinar → Hayir
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ m=String(m||''); w.__msgs.push(m); return m.indexOf('ayına taşıyayım mı')===-1; };
    w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
setTimeout(()=>{ try {
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','openGroupDetail','updateGroupPricePreview'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const PM = shiftM(CM,-1), NM = shiftM(CM,+1);
  w.eval(`
    state.settings.reformers=10;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const M=function(id,ad,mo,ek){ return Object.assign({id:id,name:ad,joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:mo||{}},ek||{}); };
    state.members=[
      M('m0','GULENAY G',{'${PM}':{enrolled:true},'${CM}':{enrolled:true}}),
      // IŞIL tipi: gecen ay aktif, BU AYDAN silinmis (acik donem) -> baglam ayinda pasif
      M('m1','ISIL T',{'${PM}':{enrolled:true},'${CM}':{enrolled:false}},{archivePeriods:[{from:'${CM}',to:null}]}),
      M('m2','OZGE O',{'${PM}':{enrolled:true},'${CM}':{enrolled:false}},{archivePeriods:[{from:'${CM}',to:null}]})
    ];
    state.groups=[
      // eski kayit: BAYAT otomatik ad (GULENAY artik kadroda degil), gecen ay paketi + dersleri
      {id:'gOld',name:'GULENAY G - ISIL T - OZGE O',size:3,memberIds:['m1','m2'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
      // ay'da PASIF grup (donem): uye tutamaz, dokunulmamali
      {id:'gDead','name':'OLU GRUP - ISIL T',size:2,memberIds:['m1'],defaultPackageId:'p8',packages:[{month:'2026-06',startDate:'2026-06-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{},monthlyNotes:{},archivePeriods:[{from:'${PM}',to:null}]}
    ];
    state.lessons=[]; state.payments=[];
    for(let i=0;i<8;i++) state.lessons.push({id:'o'+i,date:'${PM}-'+String(i+2).padStart(2,'0'),time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['m1','m2'],groupId:'gOld',packageMonth:'${PM}',status:'completed'});
  `);
  const lblPM = w.eval(`pkgMonthLabel('${PM}')`);

  console.log('[1] YENI GRUP ('+NM+' sayfasinda): dogum siniri + uye kaydi + paket ayi');
  { const __sel=d.getElementById('member-month'); if (__sel && __sel.tagName==='SELECT' && ![...__sel.options].some(o=>o.value===NM)) __sel.insertAdjacentHTML('beforeend','<option value="'+NM+'">'+NM+'</option>'); __sel.value = NM; }
  w.openGroupModal();
  t('modal baglam ayi = sayfanin ayi ('+NM+')', w.eval('window.__groupEditCtxMonth')===NM, w.eval('window.__groupEditCtxMonth'));
  d.getElementById('mg-members').insertAdjacentHTML('beforeend','<label><input type="checkbox" class="gm-mc" value="m1" checked> ISIL T</label><label><input type="checkbox" class="gm-mc" value="m2" checked> OZGE O</label>');
  d.getElementById('mg-size').value='2'; d.getElementById('mg-instructor').value='h1'; d.getElementById('mg-package').value='p8'; d.getElementById('mg-time').value='';
  const onceG = w.eval('state.groups.length');
  w.__msgs.length=0;
  w.saveGroup();
  t('yeni grup olustu', w.eval('state.groups.length')===onceG+1, w.eval('state.groups.length'));
  const ng = w.eval("JSON.stringify(state.groups[state.groups.length-1])");
  const G = JSON.parse(ng);
  t('dogum siniri: monthlyMembers['+CM+'] = [] (grup bundan once yoktu)', Array.isArray((G.monthlyMembers||{})[CM]) && G.monthlyMembers[CM].length===0, JSON.stringify(G.monthlyMembers));
  t('gecen aya SIZMADI: '+PM+' kadrosu bos', w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='${G.id}'),'${PM}').length`)===0, w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='${G.id}'),'${PM}').length`));
  t('gecen ayin grup listesinde YOK', !w.eval(`groupNavListForMonth('${PM}').some(g=>g.id==='${G.id}')`));
  t('uyeler baglam ayina kaydedildi (pasif donem kapandi): '+NM+' kadrosu 2', w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='${G.id}'),'${NM}').length`)===2, w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='${G.id}'),'${NM}').length`));
  t('ISIL '+NM+' icin aktif (arsiv donemi o ayda kapandi)', w.eval(`isMemberEnrolledInMonth('m1','${NM}')`)===true);
  t('paket baglam ayina yazildi ('+NM+')', (G.packages||[]).length===1 && G.packages[0].month===NM, JSON.stringify(G.packages));
  t('paket baslangici baglam ayinda', String(G.packageStartDate||'').startsWith(NM), G.packageStartDate);

  console.log('[2] TASIMA: ay-bilincli + dogru ad');
  const msg = w.__msgs.join(' | ');
  t('tasima notu eski kaydin BAYAT adini (GULENAY) yazmaz', msg.indexOf('GULENAY')===-1, msg.slice(0,200));
  t('tasima notu gorunen ad + "(son paket: '+lblPM+')" tasir', msg.indexOf('son paket: '+lblPM)!==-1 && msg.indexOf('ISIL T')!==-1, msg.slice(0,200));
  t('eski kayit '+NM+' icin uyeyi birakti (mukerrer grup yok)', w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='gOld'),'${NM}').length`)===0);
  t('eski kaydin GECMISI korundu ('+PM+' kadrosu 2)', w.eval(`resolveGroupMembersForMonth(state.groups.find(g=>g.id==='gOld'),'${PM}').filter(Boolean).length`)===2);
  t('ay-da PASIF gruba DOKUNULMADI (gDead.memberIds ayni)', w.eval("JSON.stringify(state.groups.find(g=>g.id==='gDead').memberIds)")==='["m1"]', w.eval("JSON.stringify(state.groups.find(g=>g.id==='gDead').memberIds)"));
  t('pasif grup tasima notunda anilmaz', msg.indexOf('OLU GRUP')===-1);

  console.log('[3] MIGRATION __migV162Repair: sinir + yetim onarimi, kanon oncesi dokunulmaz');
  t('fonksiyon var', w.eval("typeof __migV162Repair")==='function', w.eval("typeof __migV162Repair"));
  if (w.eval("typeof __migV162Repair")==='function') {
    w.eval(`
      state.members.push(
        {id:'m3',name:'YETIM A',joinDate:'2026-01-01',packages:[],monthly:{'${PM}':{enrolled:true},'${CM}':{enrolled:false}},archivePeriods:[{from:'${CM}',to:null}]},
        {id:'m4',name:'YETIM B',joinDate:'2026-01-01',packages:[],monthly:{'${PM}':{enrolled:true},'${CM}':{enrolled:false}},archivePeriods:[{from:'${CM}',to:null}]},
        {id:'m5',name:'SIZAN C',joinDate:'2026-01-01',packages:[],monthly:{'${PM}':{enrolled:true},'${CM}':{enrolled:true}}}
      );
      state.groups.push(
        {id:'gO',name:'YETIM A - YETIM B',size:2,memberIds:['m3','m4'],packages:[{month:'${NM}',startDate:'${NM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
        {id:'gL',name:'SIZAN C',size:1,memberIds:['m5'],packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
        {id:'gG',name:'ESKI GRUP',size:1,memberIds:['m5'],packages:[{month:'2026-06',startDate:'2026-06-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{},monthlyNotes:{}}
      );
      __migV162Repair(state); __migV162Repair(state); // idempotent
    `);
    t('yetim gO: sinir '+CM+'=[] eklendi', w.eval(`JSON.stringify((state.groups.find(g=>g.id==='gO').monthlyMembers||{})['${CM}'])`)==='[]', w.eval("JSON.stringify(state.groups.find(g=>g.id==='gO').monthlyMembers)"));
    t('yetim gO: uyeleri dogdugu aya ('+NM+') kaydedildi', w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='gO'),'${NM}').length`)===2, w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='gO'),'${NM}').length`));
    t('sizan gL: sinir '+PM+'=[] eklendi (gecen aya sizmaz)', w.eval(`JSON.stringify((state.groups.find(g=>g.id==='gL').monthlyMembers||{})['${PM}'])`)==='[]');
    t('kanon oncesi gG: dokunulmadi', w.eval("Object.keys(state.groups.find(g=>g.id==='gG').monthlyMembers||{}).length")===0);
    t('idempotent: gO tek sinir anahtari + '+NM+' kadro', w.eval("Object.keys(state.groups.find(g=>g.id==='gO').monthlyMembers||{}).length")<=2);

    console.log('[4] MIGRATION: kanon-ONCESI ayda odemesi+dersi olan uyenin celiskili "cikarildi" kaydi onarilir (ISIL Temmuz vakasi)');
    w.eval(`
      state.members.push(
        {id:'m9',name:'ISIL TEMMUZ',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:false},'2026-08':{enrolled:false}},archivePeriods:[{from:'2026-07',to:null}]},
        {id:'m10',name:'GERCEK AYRILAN',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:false}},archivePeriods:[{from:'2026-07',to:null}]}
      );
      state.payments.push({id:'p9',memberId:'m9',groupId:'',amount:4500,date:'2026-08-01',packageMonth:'2026-07',sessions:8,method:'Nakit'});
      for(let i=0;i<3;i++) state.lessons.push({id:'i9'+i,date:'2026-07-'+String(10+i).padStart(2,'0'),time:'10:00',durationMin:45,instructorId:'h1',size:1,memberIds:['m9'],groupId:'',packageMonth:'2026-07',status:'completed'});
      __migV162Repair(state); __migV162Repair(state);
    `);
    t('ISIL: Temmuz kaydi geri geldi (enrolled:true)', w.eval("state.members.find(m=>m.id==='m9').monthly['2026-07'].enrolled")===true);
    t('ISIL: pasif donem Agustos\'tan baslar (Temmuz\'dan degil)', w.eval("JSON.stringify(state.members.find(m=>m.id==='m9').archivePeriods)")==='[{"from":"2026-08","to":null}]', w.eval("JSON.stringify(state.members.find(m=>m.id==='m9').archivePeriods)"));
    t('ISIL: Agustos cikarma kaydi korundu (enrolled:false)', w.eval("state.members.find(m=>m.id==='m9').monthly['2026-08'].enrolled")===false);
    t('ISIL Temmuz\'da aktif', w.eval("isMemberEnrolledInMonth('m9','2026-07')")===true);
    t('odemesi/dersi olmayan gercek ayrilan DOKUNULMADI', w.eval("state.members.find(m=>m.id==='m10').monthly['2026-07'].enrolled")===false && w.eval("JSON.stringify(state.members.find(m=>m.id==='m10').archivePeriods)")==='[{"from":"2026-07","to":null}]');
  }

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
