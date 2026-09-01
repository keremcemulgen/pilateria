// v165 — GERI AL (Kerem secenegi 3): yikici/toplu islemlerden once anlik yedek; "↩️ Geri Al" dugmesi
// (Uyeler + Gruplar + Pasif Uyeler araclari) son islemi geri alir. Son yedek localStorage'da da
// tutulur (sayfa yenilense de 1 geri alma hakki kalir). Kapsanan islemler: uyeyi aydan cikar
// (removeMemberFromMonth / deleteMember), grup pasife al (archiveGroupMonthly), kalici uye/grup silme,
// grup kaydet (saveGroup), toplu ders gir (saveBatchDates), +N. Paket (uye/grup), Aktive Et,
// Paket Uzadi isaretleme, odeme/ders silme. Yamasiz build'de FAIL etmeli.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return o&&o.input?'not':true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return true; }; w.prompt=()=>'not'; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','openGroupDetail','openMemberDetail','renderArchive'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const NM = shiftM(CM,+1);
  w.eval(`
    state.settings.reformers=10;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'u1',name:'ISIL GERI',joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}},
      {id:'u2',name:'OZGE GERI',joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}}
    ];
    state.groups=[{id:'g1',name:'ISIL GERI - OZGE GERI',size:2,memberIds:['u1','u2'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['u1','u2'],'${NM}':['u1','u2']},monthlyNotes:{}}];
    state.lessons=[]; state.payments=[{id:'p1',memberId:'u1',groupId:'g1',amount:4500,date:'${CM}-03',packageMonth:'${CM}',sessions:8,method:'Nakit'}];
    try { localStorage.removeItem('pilateria_undo'); } catch(e){}
  `);

  console.log('[1] altyapi');
  t('undoLast var', w.eval("typeof undoLast")==='function', w.eval("typeof undoLast"));
  t('__undoSnapshot var', w.eval("typeof __undoSnapshot")==='function');
  if (w.eval("typeof undoLast")!=='function') { console.log('\nSONUC: '+pass+' gecti, '+(fail+12)+' kaldi'); process.exit(1); }
  t('Uyeler aracinda Geri Al dugmesi var (gizli)', d.querySelectorAll('#page-members .undo-btn').length>=1);
  t('Gruplar ve Pasif araclarinda da var', d.querySelectorAll('#page-groups .undo-btn').length>=1 && d.querySelectorAll('#page-archive .undo-btn').length>=1);

  console.log('[2] uyeyi aydan cikar -> geri al');
  w.removeMemberFromMonth('u1', NM);
  t('cikarildi ('+NM+' pasif)', w.eval(`isMemberEnrolledInMonth('u1','${NM}')`)===false);
  t('dugme gorunur ve etiketli', [...d.querySelectorAll('.undo-btn')].some(b=>b.style.display!=='none' && b.textContent.indexOf('ISIL')!==-1), [...d.querySelectorAll('.undo-btn')].map(b=>b.textContent+'/'+b.style.display).join('|'));
  t('son yedek localStorage icinde', !!w.localStorage.getItem('pilateria_undo'));
  w.undoLast();
  t('geri alindi: '+NM+' tekrar aktif', w.eval(`isMemberEnrolledInMonth('u1','${NM}')`)===true);
  t('arsiv donemi de geri geldi (yok)', w.eval("JSON.stringify(state.members.find(m=>m.id==='u1').archivePeriods||[])")==='[]');
  t('yigin bosaldi -> dugme gizli', [...d.querySelectorAll('.undo-btn')].every(b=>b.style.display==='none'));

  console.log('[3] odeme sil -> geri al; grup pasife al -> geri al');
  w.eval("window.event={stopPropagation:function(){}};");
  w.quickDeletePayment('p1','u1');
  t('odeme silindi', w.eval("state.payments.length")===0);
  w.undoLast();
  t('odeme geri geldi', w.eval("state.payments.length")===1 && w.eval("state.payments[0].id")==='p1');
  w.archiveGroupMonthly('g1');
  t('grup pasif', w.eval("state.groups.find(g=>g.id==='g1').archived")===true);
  w.undoLast();
  t('grup geri aktif', w.eval("state.groups.find(g=>g.id==='g1').archived")===false);

  console.log('[4] yigin siniri + toplu ders gir');
  w.eval(`__batchDatesTarget={type:'group',id:'g1',packageMonth:'${CM}'}; __batchDatesRows=[{lessonId:null,date:'${CM}-10',time:'10:00',status:'planned'}];`);
  w.saveBatchDates();
  t('toplu giris dersi yazdi', w.eval("state.lessons.length")===1);
  w.undoLast();
  t('toplu giris geri alindi (ders yok, paket yok)', w.eval("state.lessons.length")===0 && w.eval("(state.groups.find(g=>g.id==='g1').packages||[]).length")===0);
  for (let i=0;i<12;i++) w.eval("__undoSnapshot('deneme '+"+i+")");
  t('yigin en fazla 8', w.eval("__undoStack.length")<=8, w.eval("__undoStack.length"));

  console.log('[5] BULUT GUVENLIGI: yedekten sonra BASKA CIHAZDAN gelen degisiklik geri almada KORUNUR');
  w.eval("__undoStack=[]; __undoExt={}; __undoPrevRows=null; try{localStorage.removeItem('pilateria_undo');localStorage.removeItem('pilateria_undo_meta');}catch(e){}");
  w.removeMemberFromMonth('u1', NM);                       // yedek + u1 cikarildi (bu cihaz)
  // baska cihazdan gelen degisiklik simulasyonu: senkron-uygulama bayraklariyla save()
  w.eval("__sbApplying=true; window.__pilSuppressDirty=true; state.members.find(m=>m.id==='u2').name='OZGE DIS'; state.members.find(m=>m.id==='u1').phone='0555'; save(); window.__pilSuppressDirty=false; __sbApplying=false;");
  t('dis degisiklik damgalandi (members/u2, members/u1)', w.eval("!!__undoExt['members/u2'] && !!__undoExt['members/u1']"), w.eval("JSON.stringify(Object.keys(__undoExt))"));
  w.__msgs.length=0;
  w.undoLast();
  const cmsg = w.__msgs.find(m=>m.indexOf('geri alınacak')!==-1) || '';
  t('onay metni korunacak kayitlari listeler', cmsg.indexOf('BAŞKA CİHAZDAN')!==-1 && cmsg.indexOf('OZGE DIS')!==-1 && cmsg.indexOf('ISIL GERI')!==-1, cmsg.slice(0,300));
  t('u2 adi KORUNDU (dis degisiklik geri sarilmadi)', w.eval("state.members.find(m=>m.id==='u2').name")==='OZGE DIS');
  t('u1 de dis degisiklik gordugu icin KORUNDU (cikarilmis kaldi, telefon duruyor)', w.eval(`isMemberEnrolledInMonth('u1','${NM}')`)===false && w.eval("state.members.find(m=>m.id==='u1').phone")==='0555');
  // ayni senaryo, dis degisiklik BASKA kayitta: geri alma tam calisir
  w.eval("__undoStack=[]; __undoExt={}; __undoPrevRows=null; state.members.find(m=>m.id==='u1').phone=''; setMemberMonthly('u1','"+NM+"',{enrolled:true}); state.members.find(m=>m.id==='u1').archivePeriods=[]; save();");
  w.removeMemberFromMonth('u1', NM);
  w.eval("__sbApplying=true; window.__pilSuppressDirty=true; state.members.find(m=>m.id==='u2').name='OZGE DIS 2'; save(); window.__pilSuppressDirty=false; __sbApplying=false;");
  w.undoLast();
  t('u1 geri alindi (kendi degisikligimiz), u2 dis hali korundu', w.eval(`isMemberEnrolledInMonth('u1','${NM}')`)===true && w.eval("state.members.find(m=>m.id==='u2').name")==='OZGE DIS 2');
  t('kendi (senkron olmayan) save\'leri dis damga uretmez', w.eval("Object.keys(__undoExt).length")===0 || w.eval("__undoStack.length")===0);

  console.log('[6] SAYFA YENILENSE DE son yedek kalir (localStorage) ve calisir');
  w.eval("__undoStack=[]; __undoExt={}; __undoPrevRows=null;");
  w.removeMemberFromMonth('u2', NM);
  const persisted = w.localStorage.getItem('pilateria_undo'), stateNow = w.localStorage.getItem('pilateria');
  t('yedek + veri localStorage\'da', !!persisted && !!stateNow);
  const dom2 = new JSDOM(html, { runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
    beforeParse(w2){
      w2.matchMedia=w2.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
      w2.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
      if(!w2.structuredClone)w2.structuredClone=o=>JSON.parse(JSON.stringify(o));
      Object.defineProperty(w2.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
      w2.__PL_DLG_AUTO__=(o)=>o&&o.input?'not':true; w2.alert=()=>{}; w2.confirm=()=>true; w2.prompt=()=>'not'; w2.scrollTo=()=>{};
      try { w2.localStorage.setItem('pilateria', stateNow); w2.localStorage.setItem('pilateria_undo', persisted); } catch(e) {}
    }});
  await new Promise(r=>setTimeout(r,1500));
  const w2 = dom2.window;
  w2.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','renderArchive'].forEach(fn=>window[fn]=function(){});");
  t('yeni oturumda yigin 1 (son yedek yuklendi)', w2.eval("__undoStack.length")===1, w2.eval("__undoStack.length"));
  t('dugme etiketli', [...w2.document.querySelectorAll('.undo-btn')].some(b=>b.style.display!=='none' && b.textContent.indexOf('OZGE')!==-1));
  t('acilista u2 cikarilmis', w2.eval(`isMemberEnrolledInMonth('u2','${NM}')`)===false);
  w2.undoLast();
  t('yeni oturumda geri alma calisti: u2 yeniden kayitli', w2.eval(`isMemberEnrolledInMonth('u2','${NM}')`)===true);
  t('yigin bos, yedek silindi', w2.eval("__undoStack.length")===0 && !w2.localStorage.getItem('pilateria_undo'));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
