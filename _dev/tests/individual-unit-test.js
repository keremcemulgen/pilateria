// v173 — (1) SARKAN PAKETIN BITISI PANELDE GORUNUR, (2) "1 KISILIK (BIREYSEL)" GERCEKTEN BIREYSEL.
// Kerem 2026-09-20: "temmuzdan sarkan paketin son dersi 19 eyluldeymis, panel uyarmadi" + "yeni paketi
// iki kisilik grupta geliyor, 1 kisilik yapinca da grup gorunumunde cikiyor, bireysel secmeme ragmen".
// KOK NEDEN 1 (celiskili iki kural): v158 "Biten satiri yalniz GUNCEL ayda kadrosu olan birim icin";
//   v157 __superseded* ise "sonraki ayda KADRODA/kayitli olmak"i da 'yeni paket acilmis' sayiyordu →
//   temmuz paketi eylulde bitince ikisi ayni anda saglanamiyor, uyari HIC dogmuyordu. v173: superseded
//   yalniz GERCEK yeni paket kaydi (packages[].month > ay / ikiz grubun paketi) ile olusur.
// KOK NEDEN 2: grup penceresindeki "1 kisilik (bireysel)" secenegi GRUP kaydi aciyordu (etiket yaniltici);
//   ayrica yeni grup boyutu her zaman 2 geliyordu. v173: 1 kisilik + tek uye → onay sorusu ile GERCEK
//   bireysel birim (grup kaydi yok, uye paketi + bireysel dersler, varsa eski gruptan cikarma);
//   yeni grupta boyut, kullanici elle degistirmedikce secili uye sayisini izler.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let CONFIRM = () => true;
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return (o&&o.input)?String(o.input.value):true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); };
    w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return CONFIRM(String(m||'')); };
    w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
function seen(sub){ return w.__msgs.some(m=>m.indexOf(sub)!==-1); }
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','closeFillSlotModal'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const PREV2 = (function(){ const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-3,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); })(); // CM-2 (ornek: Temmuz)
  const PREV1 = (function(){ const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-2,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); })();
  function fixtureSarkan(lastStatus){
    w.eval(`
      state.settings.reformers=12;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[{id:'DZ',name:'DUYGU',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${PREV2}':{enrolled:true},'${PREV1}':{enrolled:true},'${CM}':{enrolled:true}}},
                     {id:'BX',name:'BIREYSEL',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[{month:'${PREV2}',startDate:'${PREV2}-01',sessions:8,price:8500,status:'active'}],monthly:{'${PREV2}':{enrolled:true},'${PREV1}':{enrolled:true},'${CM}':{enrolled:true}}}];
      state.groups=[{id:'G1',name:'DUYGU',size:2,memberIds:['DZ'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'10:00',
        packages:[{month:'${PREV2}',startDate:'${PREV2}-01',sessions:8,price:8500,status:'active'}],
        monthlyMembers:{'${PREV2}':['DZ'],'${PREV1}':['DZ'],'${CM}':['DZ']},monthlyNotes:{}}];
      state.lessons=[];
      ['${PREV2}-07','${PREV2}-14','${PREV2}-21','${PREV1}-04','${PREV1}-18','${CM}-05','${CM}-12'].forEach((dt,i)=>state.lessons.push({id:'L'+i,groupId:'G1',memberIds:['DZ'],date:dt,time:'10:00',status:'completed',packageMonth:'${PREV2}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:1}));
      state.lessons.push({id:'LAST',groupId:'G1',memberIds:['DZ'],date:'${CM}-19',time:'10:00',status:'${lastStatus}',packageMonth:'${PREV2}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:1});
      ['${PREV2}-08','${PREV2}-15','${PREV2}-22','${PREV1}-05','${PREV1}-19','${CM}-06','${CM}-13'].forEach((dt,i)=>state.lessons.push({id:'B'+i,memberIds:['BX'],date:dt,time:'12:00',status:'completed',packageMonth:'${PREV2}',packageOwnerType:'member',packageOwnerId:'BX',instructorId:'h1',size:1}));
      state.lessons.push({id:'BLAST',memberIds:['BX'],date:'${CM}-19',time:'12:00',status:'${lastStatus}',packageMonth:'${PREV2}',packageOwnerType:'member',packageOwnerId:'BX',instructorId:'h1',size:1});
      state.payments=[];
      document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
      if (window.__partialOfferQueue) __partialOfferQueue.length=0; __undoStack=[];
    `);
    w.__msgs.length=0;
  }
  const lowHtml = () => { w.eval("renderDashboard()"); return d.getElementById('low-members').innerHTML; };

  console.log('[1] SARKAN PAKET — son ders PLANLI iken "1 ders kaldi" (davranis degismemeli)');
  fixtureSarkan('planned');
  t('grup: 7 yapildi / 8 hak', JSON.stringify(JSON.parse(w.eval(`JSON.stringify(sessionsFinishState('group','G1','${PREV2}'))`)).done)==='7');
  { const h = lowHtml(); t('panelde DUYGU (grup) var', /DUYGU/.test(h), h.slice(0,120)); t('panelde BIREYSEL uye var', /BIREYSEL/.test(h)); }

  console.log('[2] SARKAN PAKET — son ders YAPILDI: "paket bitti" uyarisi PANELDE GORUNMELI (asil hata)');
  fixtureSarkan('completed');
  t('grup: 8/8 tamamlandi', JSON.parse(w.eval(`JSON.stringify(sessionsFinishState('group','G1','${PREV2}'))`)).trulyFinished===true);
  { const h = lowHtml();
    t('grup birimi panelde (kadro sonraki aylarda diye DUSMEMELI)', /DUYGU/.test(h), h.replace(/<[^>]*>/g,' ').slice(0,160));
    t('bireysel birim panelde (enrolled kaydi DUSURMEMELI)', /BIREYSEL/.test(h));
    t('sayac 2', d.getElementById('s-low').textContent==='2', d.getElementById('s-low').textContent);
    t('superseded: grup false / uye false (kadro-kayit yeni paket DEGILDIR)', w.eval(`__supersededGroupFin('G1','${PREV2}')`)===false && w.eval(`__supersededMemberFin('BX','${PREV2}')`)===false);
  }

  console.log('[3] GERCEK yeni paket varsa eski paketin "bitti" satiri yine duser (regresyon)');
  fixtureSarkan('completed');
  w.eval(`state.groups[0].packages.push({month:'${CM}',startDate:'${CM}-01',sessions:8,price:8500,status:'active'}); state.members.find(m=>m.id==='BX').packages.push({month:'${CM}',startDate:'${CM}-01',sessions:8,price:8500,status:'active'});`);
  { const h = lowHtml();
    t('yeni paket kaydi varken grup DUSER', !/DUYGU/.test(h));
    t('yeni paket kaydi varken bireysel DUSER', !/BIREYSEL/.test(h));
    t('superseded true/true', w.eval(`__supersededGroupFin('G1','${PREV2}')`)===true && w.eval(`__supersededMemberFin('BX','${PREV2}')`)===true);
  }

  console.log('[3b] paket KENDI ayinda bitmis + sonraki ay kaydi varsa yine DUSER (v157 amaci korunur)');
  fixtureSarkan('completed');
  w.eval(`state.lessons.filter(l=>l.packageMonth==='${PREV2}').forEach(function(l,i){ l.date='${PREV2}-'+String(i+2).padStart(2,'0'); });`); // tum dersler PREV2 icinde → paket o ay bitti
  { const h = lowHtml();
    t('kendi ayinda bitmis grup (sonraki ay kaydi var) DUSER', !/DUYGU/.test(h), h.replace(/<[^>]*>/g,' ').slice(0,120));
    t('kendi ayinda bitmis bireysel DUSER', !/BIREYSEL/.test(h));
    t('paket bitis ayi = paket ayi', w.eval(`typeof __pkgEndMonth173==='function' ? (__pkgEndMonth173('group','G1','${PREV2}')+'|'+__pkgEndMonth173('member','BX','${PREV2}')) : 'YOK'`)===(PREV2+'|'+PREV2));
  }

  console.log('[4] guncel ayda kadrosu yok + paketi GECEN AY bitmis → listelenmez (v158 amaci korunur)');
  fixtureSarkan('completed');
  w.eval(`
    state.lessons.filter(l=>l.packageMonth==='${PREV2}').forEach(function(l,i){ l.date='${PREV1}-'+String((i%25)+2).padStart(2,'0'); });
    state.groups[0].monthlyMembers={'${PREV2}':['DZ']};
    state.members.find(m=>m.id==='DZ').monthly={'${PREV2}':{enrolled:true}};
    state.members.find(m=>m.id==='BX').monthly={'${PREV2}':{enrolled:true}};
  `);
  t('gecmiste kalmis (paketi gecen ay bitmis) grup listelenmez', !/DUYGU/.test(lowHtml()));
  // ama paketi BU AY devam ediyorsa (sarkan) kadro olmasa da gorunur — asil talep
  fixtureSarkan('completed');
  w.eval(`state.groups[0].monthlyMembers={'${PREV2}':['DZ']}; state.members.find(m=>m.id==='DZ').monthly={'${PREV2}':{enrolled:true}};`);
  t('paketi BU AY biten grup, guncel kadrosu olmasa da listelenir', /DUYGU/.test(lowHtml()));

  console.log('[4b] CANLI VAKA: uye PASIF (Agustos→acik) ama Temmuz paketinin son dersi 19 Eylul — uyari GORUNMELI');
  fixtureSarkan('planned');
  w.eval(`
    // Duygu vakasi: uye ${PREV1}'dan itibaren pasif, Eylul kaydi yok; paket dersleri Eylul'e sarkiyor
    const __bx = state.members.find(m=>m.id==='BX');
    __bx.monthly={'${PREV2}':{enrolled:true}}; __bx.archivePeriods=[{from:'${PREV1}',to:null}];
    const __dz = state.members.find(m=>m.id==='DZ');
    __dz.monthly={'${PREV2}':{enrolled:true}}; __dz.archivePeriods=[{from:'${PREV1}',to:null}];
    state.groups[0].monthlyMembers={'${PREV2}':['DZ']};
  `);
  { const h = lowHtml();
    t('pasif uyenin SARKAN paketi (7/8, son ders bu ay) panelde', /BIREYSEL/.test(h), h.replace(/<[^>]*>/g,' ').slice(0,160));
    t('pasif grubun sarkan paketi de panelde', /DUYGU/.test(h));
    t('__pkgEndMonth173 bu ayi verir', w.eval(`typeof __pkgEndMonth173==='function' ? __pkgEndMonth173('member','BX','${PREV2}') : 'YOK'`)===CM);
  }
  w.eval("state.lessons.find(l=>l.id==='BLAST').status='completed'; state.lessons.find(l=>l.id==='LAST').status='completed';");
  { const h = lowHtml(); t('son ders yapildi → "bitti" satiri da gorunur', /BIREYSEL/.test(h) && /DUYGU/.test(h)); }
  // regresyon: paketi GECEN AY bitmis pasif uye yine gizli (v153/v159 amaci korunur)
  fixtureSarkan('completed');
  w.eval(`
    state.lessons.filter(l=>l.packageMonth==='${PREV2}').forEach(function(l,i){ l.date='${PREV1}-'+String((i%25)+2).padStart(2,'0'); });
    const __bx = state.members.find(m=>m.id==='BX'); __bx.monthly={'${PREV2}':{enrolled:true}}; __bx.archivePeriods=[{from:'${PREV1}',to:null}];
    const __dz = state.members.find(m=>m.id==='DZ'); __dz.monthly={'${PREV2}':{enrolled:true}}; __dz.archivePeriods=[{from:'${PREV1}',to:null}];
    state.groups[0].monthlyMembers={'${PREV2}':['DZ']};
  `);
  { const h = lowHtml(); t('paketi GECEN AY bitmis pasif birim yine gizli', !/BIREYSEL/.test(h) && !/DUYGU/.test(h), h.replace(/<[^>]*>/g,' ').slice(0,120)); }

  console.log('[4c] CANLI VAKA (Duygu): ayni ay 2. paket ONCE bitmis, 1. paket sarkiyor → "bitti" GORUNUR');
  fixtureSarkan('completed');
  w.eval(`
    // BX'in Temmuz bireysel paketi Eylul 19'da bitti; ayni ay acilmis "(2. Paket)" klonu ise Agustos'ta bitmis
    const __bx = state.members.find(m=>m.id==='BX');
    __bx.monthly={'${PREV2}':{enrolled:true}}; __bx.archivePeriods=[{from:'${PREV1}',to:null}];
    state.members.push({id:'BX2',name:'BIREYSEL (2. Paket)',secondOfMember:'BX',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:6500,packages:[],monthly:{'${PREV2}':{enrolled:true}}});
    for (let i=0;i<8;i++) state.lessons.push({id:'K'+i,memberIds:['BX2'],date:'${PREV1}-'+String(i+3).padStart(2,'0'),time:'14:00',status:'completed',packageMonth:'${PREV2}',packageOwnerType:'member',packageOwnerId:'BX2',instructorId:'h1',size:1});
  `);
  t('klon (2. paket) Agustos\'ta bitti → 1. paketi DUSURMEZ', w.eval(`__supersededMemberFin('BX','${PREV2}')`)===false, String(w.eval(`__supersededMemberFin('BX','${PREV2}')`)));
  t('sarkan 1. paketin "bitti" satiri panelde', /BIREYSEL(?!.*2\. Paket)/.test(lowHtml().replace(/<[^>]*>/g,' ')), lowHtml().replace(/<[^>]*>/g,' ').slice(0,160));
  // regresyon: klon SONRA bitmisse (normal 2. paket akisi) 1. paket yine duser
  w.eval(`state.lessons.filter(l=>String(l.id).indexOf('K')===0).forEach(function(l,i){ l.date='${CM}-'+String(i+20).padStart(2,'0'); });`);
  t('klon SONRA bitiyorsa 1. paket yine duser (v157 amaci)', w.eval(`__supersededMemberFin('BX','${PREV2}')`)===true);

  console.log('[5] "1 kisilik (bireysel)" → GERCEK bireysel birim (grup kaydi YOK)');
  function fixtureYeni(){
    w.eval(`
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[{id:'DZ',name:'DUYGU',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}},
                     {id:'EX',name:'ESKI ARKADAS',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}}];
      state.groups=[{id:'GOLD',name:'DUYGU - ESKI ARKADAS',size:2,memberIds:['DZ','EX'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1],defaultTime:'09:00',
        packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:17000,status:'active'}],monthlyMembers:{},monthlyNotes:{}}];
      state.lessons=[{id:'OL1',groupId:'GOLD',memberIds:['DZ','EX'],date:'${CM}-01',time:'09:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'GOLD',instructorId:'h1',size:2}];
      state.payments=[];
      document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
      currentGroupDetailMonth='';
      if (window.__partialOfferQueue) __partialOfferQueue.length=0; __undoStack=[];
    `);
    w.__msgs.length=0;
  }
  function openYeniGrupVeSec(sizeVal){
    w.eval("openGroupModal()");
    w.eval(`
      document.getElementById('mg-size').value='${sizeVal}';
      document.getElementById('mg-name').value='';
      document.getElementById('mg-members').innerHTML='<input type="checkbox" class="gm-mc" value="DZ" checked>';
      document.getElementById('mg-time').value='11:00';
      document.getElementById('mg-package').value='p8';
      document.querySelectorAll('#mg-days input[data-gday]').forEach(function(cb){ if (cb.getAttribute('data-gday')==='3') cb.checked=true; });
    `);
  }
  fixtureYeni();
  const gCountBefore = w.eval("state.groups.length");
  CONFIRM = (m) => /BİREYSEL paket açayım mı/.test(m) ? true : true;
  openYeniGrupVeSec('1'); w.eval("saveGroup()"); await tick(60);
  t('onay sorusu soruldu', seen('BİREYSEL paket açayım mı'), w.__msgs.slice(0,3).join(' | ').slice(0,200));
  t('YENI GRUP KAYDI ACILMADI', w.eval("state.groups.length")===gCountBefore, w.eval("state.groups.length"));
  t('uye o ay hicbir grupta degil (bireysel)', w.eval(`!memberActiveGroupForMonth('DZ','${CM}')`));
  t('eski gruptan bu ay icin cikarildi', !w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GOLD'),'${CM}').includes('DZ')`));
  t('uye paketi acildi (8 ders)', w.eval(`(state.members.find(m=>m.id==='DZ').packages.find(p=>p.month==='${CM}')||{}).sessions`)===8);
  t('bireysel dersler olusturuldu (grupsuz, uye sahipli)', w.eval(`state.lessons.filter(l=>!l.groupId && (l.memberIds||[]).includes('DZ') && l.packageMonth==='${CM}').length`)===8, w.eval(`state.lessons.filter(l=>!l.groupId && (l.memberIds||[]).includes('DZ')).length`));
  t('Uyeler satirinda tip = bireysel', JSON.parse(w.eval(`JSON.stringify((buildMemberRows('${CM}').find(r=>r.memberId==='DZ')||{}).type)`))==='individual');
  t('Gruplar listesinde tek kisilik yeni grup yok', w.eval(`groupNavListForMonth('${CM}').map(g=>g.id).join(',')`)==='GOLD', w.eval(`groupNavListForMonth('${CM}').map(g=>g.id).join(',')`));
  t('yapilmis grup dersi TARIHSEL olarak duruyor', w.eval("(state.lessons.find(l=>l.id==='OL1')||{}).memberIds.length")===2);
  // not: v171 pay teklifi kabul edilince kendi yedegini de alir; yiginda ikisi de bulunur
  t('Geri Al kaydi acildi (Bireysel paket)', w.eval("__undoStack.some(function(x){return (x.label||'').indexOf('Bireysel paket')===0;})")===true, w.eval("JSON.stringify(__undoStack.map(function(x){return x.label;}))"));

  console.log('[6] onay sorusuna VAZGEC → eski davranis: 1 kisilik GRUP');
  fixtureYeni();
  CONFIRM = (m) => /BİREYSEL paket açayım mı/.test(m) ? false : true;
  openYeniGrupVeSec('1'); w.eval("saveGroup()"); await tick(60);
  t('grup kaydi acildi (1 kisilik)', w.eval("state.groups.length")===2 && w.eval("state.groups[1].size")===1, w.eval("state.groups.length")+'/'+w.eval("(state.groups[1]||{}).size"));
  t('uye o ay grupta', w.eval(`!!memberActiveGroupForMonth('DZ','${CM}')`));
  CONFIRM = () => true;

  console.log('[7] 2 kisilik secilince bireysel sorusu SORULMAZ (davranis degismedi)');
  fixtureYeni();
  openYeniGrupVeSec('2'); w.eval("saveGroup()"); await tick(60);
  t('bireysel sorusu yok, grup acildi', !seen('BİREYSEL paket açayım mı') && w.eval("state.groups.length")===2);

  console.log('[8] yeni grup boyutu secili uye sayisini izler (elle degistirilmedikce)');
  fixtureYeni();
  w.eval("openGroupModal()");
  t('acilista varsayilan 2', w.eval("document.getElementById('mg-size').value")==='2');
  w.eval("renderGroupMembersCheckboxes(['DZ'], '')");
  t('1 uye secilince boyut 1', w.eval("document.getElementById('mg-size').value")==='1', w.eval("document.getElementById('mg-size').value"));
  w.eval("renderGroupMembersCheckboxes(['DZ','EX'], '')");
  t('2 uye secilince boyut 2', w.eval("document.getElementById('mg-size').value")==='2');
  w.eval("document.getElementById('mg-size').value='4'; document.getElementById('mg-size').onchange();");
  w.eval("renderGroupMembersCheckboxes(['DZ'], '')");
  t('elle 4 yapildiysa otomatik DEGISMEZ', w.eval("document.getElementById('mg-size').value")==='4', w.eval("document.getElementById('mg-size').value"));
  w.eval("openGroupModal('GOLD')");
  w.eval("renderGroupMembersCheckboxes(['DZ'], 'GOLD')");
  t('mevcut grubu duzenlerken boyut otomatik degismez', w.eval("document.getElementById('mg-size').value")==='2', w.eval("document.getElementById('mg-size').value"));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
