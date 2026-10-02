// v185 — YENI AY HAZIRLIGI: EKSIKLERI TAMAMLA, HEDEF AYDAKI HER SEY KORUNUR (Kerem 2026-10-02: "Ekim listesini Eylul'den
// erken aldim, Eylul'e uye eklendi. Ekim'deki uyelere ders ve odeme aldim; Eylul'den TOPLU tekrar tasimak istiyorum,
// Ekim'de girdigim bilgiler — ders, odeme vb. — korunarak").
// Kok: (1) toplu "Bekleyenlerin hepsi devam etsin" KISMEN durumundaki gruplari (Eylul'de sonradan eklenen uye) atliyordu;
// (2) grup "Devam" Ekim kadrosunu Eylul kadrosuyla DEGISTIRIYORDU — Ekim'de eklenen uye kadrodan dusuyordu, Ekim'de
// ACIKCA cikarilan uye geri yaziliyordu, zaten kayitli uyenin "paket uzadi"si geri aliniyordu.
// v185: Devam = BIRLESIM (hedef ay kadrosu + kaynak ayin karar verilmemis uyeleri); acikca cikarilan uye ancak grubun
// TAMAMI cikarilmissa (Pasif → Devam) geri yazilir; zaten kayitli uyeye dokunulmaz; toplu islem Kismen gruplari da tamamlar.
// Yamasiz (v184) build'de FAIL eder.
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
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return true; }; w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const J = (expr) => JSON.parse(w.eval('JSON.stringify(' + expr + ')') || 'null');
const st = (kind,id) => { const r=d.querySelector('#month-prep-body .prep-row[data-kind="'+kind+'"][data-id="'+id+'"]'); return r ? r.getAttribute('data-status') : null; };
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','renderArchive'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const sh = (k) => { const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-1+k,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); };
  const S = CM, T = sh(1);  // S = "Eylul", T = "Ekim"
  function fixture(){
    w.eval(`
      state.settings.reformers=12; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      const mk = (id,name,mo) => ({id:id,name:name,joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:mo});
      state.members=[
        mk('A','AYSE',{'${S}':{enrolled:true},'${T}':{enrolled:true,totalPrice:5000}}),   // Ekim'e ozel fiyat
        mk('B','BERNA',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),
        mk('C','CEREN',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),
        mk('N','NESE',{'${S}':{enrolled:true,totalPrice:4200}}),                         // Eylul'de SONRADAN eklendi
        mk('X','XENA',{'${S}':{enrolled:true},'${T}':{enrolled:false}}),                  // Ekim'den ACIKCA cikarildi
        mk('O','OYA',{'${T}':{enrolled:true}}),                                           // yalniz Ekim'de eklendi
        mk('E1','EDA',{'${S}':{enrolled:true},'${T}':{enrolled:true,totalPrice:0,__extZero:true}}),
        mk('E2','EMEL',{'${S}':{enrolled:true}}),                                         // GE'ye Eylul'de eklendi
        mk('Y1','YAREN',{'${S}':{enrolled:true}}), mk('Y2','YELIZ',{'${S}':{enrolled:true}}), // Eylul'de acilan YENI grup
        mk('I','IREM',{'${S}':{enrolled:true}})                                           // Eylul'de yeni bireysel
      ];
      state.groups=[
        {id:'GP',name:'AYSE - BERNA - CEREN',size:6,memberIds:['A','B','C','N','X','O'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'10:00',
          packages:[{month:'${S}',startDate:'${S}-01',sessions:8,price:18000,status:'active'},{month:'${T}',startDate:'${T}-01',sessions:8,price:18000,status:'active'}],
          monthlyMembers:{'${S}':['A','B','C','N','X'],'${T}':['A','B','C','X','O']},monthlyNotes:{}},
        {id:'GE',name:'EDA',size:4,memberIds:['E1','E2'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[3],defaultTime:'12:00',
          packages:[{month:'${T}',startDate:'${T}-01',sessions:8,price:0,status:'extended',extendedNote:'sarkti'}],monthlyMembers:{'${S}':['E1','E2'],'${T}':['E1']},monthlyNotes:{}},
        {id:'GY',name:'YAREN - YELIZ',size:2,memberIds:['Y1','Y2'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1],defaultTime:'09:00',packages:[],monthlyMembers:{'${S}':['Y1','Y2']},monthlyNotes:{}}
      ];
      state.lessons=[];
      ['05','07','12'].forEach((dd,i)=> state.lessons.push({id:'TL'+i,groupId:'GP',memberIds:['A','B','C','O'],date:'${T}-'+dd,time:'10:00',status:i===0?'completed':'planned',packageMonth:'${T}',packageOwnerType:'group',packageOwnerId:'GP',instructorId:'h1',size:6}));
      state.payments=[{id:'PA',memberId:'A',groupId:'GP',date:'${T}-02',packageMonth:'${T}',sessions:8,amount:5000,listPrice:5000,discount:0,method:'Nakit',pkgName:'8 Ders'},
                      {id:'PO',memberId:'O',groupId:'GP',date:'${T}-02',packageMonth:'${T}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'}];
      state.monthInit={'${T}':true};
      __undoStack=[];
    `);
    w.__msgs.length=0;
  }
  const snapT = () => J(`({
    pay: state.payments.map(p=>p.id+':'+p.amount).sort(),
    lessons: state.lessons.filter(l=>(l.packageMonth||'')==='${T}').map(l=>l.id+':'+l.status).sort(),
    Aprice: state.members.find(m=>m.id==='A').monthly['${T}'].totalPrice,
    Eext: (state.groups.find(g=>g.id==='GE').packages.find(p=>p.month==='${T}')||{}).status,
    E1zero: state.members.find(m=>m.id==='E1').monthly['${T}'].totalPrice
  })`);

  console.log('[1] durumlar (Ekim hedef): GP kismen (NESE karar bekliyor), GE uzadi (ama EMEL karar bekliyor), GY + IREM bekliyor');
  fixture();
  w.eval(`openMonthPrep('${T}')`);
  t('GP = partial, GE = extended, GY = pending, I = pending', st('group','GP')==='partial' && st('group','GE')==='extended' && st('group','GY')==='pending' && st('member','I')==='pending', [st('group','GP'),st('group','GE'),st('group','GY'),st('member','I')].join(','));
  const before = snapT();

  console.log('[2] TOPLU: "Eksikleri tamamla" — bekleyen + kismen hepsi; Ekim verisi korunur');
  t('toplu dugme karar bekleyen uyesi olan TUM birimleri sayar (4: GP, GE, GY, IREM)', /\(4\)/.test(((d.querySelector('#month-prep-body button[onclick="prepAllContinue()"]')||{}).textContent)||''), ((d.querySelector('#month-prep-body button[onclick="prepAllContinue()"]')||{}).textContent));
  w.prepAllContinue();
  t('NESE Ekim\'e kayitli ve GP Ekim kadrosunda', w.eval(`isMemberEnrolledInMonth('N','${T}')`)===true && J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GP'),'${T}')`).includes('N'), JSON.stringify(J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GP'),'${T}')`)));
  t('NESE Eylul fiyati (4200) Ekim\'e tasindi', J(`state.members.find(m=>m.id==='N').monthly['${T}'].totalPrice`)===4200);
  t('OYA (yalniz Ekim\'de eklenen) GP Ekim kadrosunda KALDI', J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GP'),'${T}')`).includes('O'));
  t('XENA (Ekim\'den acikca cikarilan) cikarilmis KALDI', w.eval(`isMemberEnrolledInMonth('X','${T}')`)===false);
  t('NESE Ekim\'in PLANLI derslerine eklendi; yapilmis ders degismedi', J(`state.lessons.filter(l=>l.id==='TL1'||l.id==='TL2').every(l=>l.memberIds.includes('N')&&l.memberIds.includes('O'))`)===true && J(`state.lessons.find(l=>l.id==='TL0').memberIds`).join()==='A,B,C,O', JSON.stringify(J(`state.lessons.map(l=>l.id+':'+l.memberIds.join(''))`)));
  { const after = snapT(); t('Ekim odemeleri, dersleri, AYSE Ekim fiyati (5000), GE "paket uzadi" ve EDA 0 ₺ AYNEN', JSON.stringify(after)===JSON.stringify(before), JSON.stringify(before) + ' vs ' + JSON.stringify(after)); }
  t('EMEL GE Ekim kadrosuna eklendi; EDA dokunulmadi', J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GE'),'${T}')`).join()==='E1,E2', JSON.stringify(J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GE'),'${T}')`)));
  t('EMEL (uzadi grubuna eklendi) Ekim fiyati 0 ₺ (grubun uzama kurali), borc dogmaz', J(`state.members.find(m=>m.id==='E2').monthly['${T}'].totalPrice`)===0 && w.eval(`memberBalanceForMonth('E2','${T}')`)===0, JSON.stringify(J(`state.members.find(m=>m.id==='E2').monthly['${T}']`)));
  t('GY (yeni grup) ve IREM Ekim\'de', J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GY'),'${T}')`).length===2 && w.eval(`isMemberEnrolledInMonth('I','${T}')`)===true);
  t('sonra: bekleyen/kismen kalmadi', ['GP','GE','GY'].every(g => st('group',g)==='active' || st('group',g)==='extended') && st('member','I')==='active', [st('group','GP'),st('group','GE'),st('group','GY'),st('member','I')].join(','));
  t('tek Geri Al adimi', J('__undoStack.length')===1);

  console.log('[3] TEK TIK "Devam" (kismen grup) ayni kural: OYA dusmez, XENA geri gelmez');
  fixture(); w.eval(`openMonthPrep('${T}')`);
  await w.prepAction('group','GP','continue');
  const ros = J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GP'),'${T}')`);
  t('GP Ekim: A,B,C,N,O — X yok', ['A','B','C','N','O'].every(x=>ros.includes(x)) && !ros.includes('X'), JSON.stringify(ros));
  t('AYSE Ekim fiyati 5000 korundu, odemeler aynen', J(`state.members.find(m=>m.id==='A').monthly['${T}'].totalPrice`)===5000 && J('state.payments.length')===2);

  console.log('[4] Pasif grup (hepsi cikarilmis) → Devam: hepsi geri (eski davranis)');
  fixture();
  w.eval(`['A','B','C','X'].forEach(id=>{ state.members.find(m=>m.id===id).monthly['${T}']={enrolled:false}; }); state.members.find(m=>m.id==='N').monthly['${T}']={enrolled:false}; state.groups.find(g=>g.id==='GP').monthlyMembers['${T}']=['A','B','C','X']; openMonthPrep('${T}');`);
  t('GP = passive', st('group','GP')==='passive', st('group','GP'));
  await w.prepAction('group','GP','continue');
  t('Devam → Eylul kadrosunun hepsi Ekim\'de (A,B,C,N,X)', ['A','B','C','N','X'].every(x=>w.eval(`isMemberEnrolledInMonth('${x}','${T}')`)===true), ['A','B','C','N','X'].map(x=>x+':'+w.eval(`isMemberEnrolledInMonth('${x}','${T}')`)).join(' '));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
