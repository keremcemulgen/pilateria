// v179 — UYE-AY-BIRIM MODELI (Kerem 2026-09-28: "bu ve benzeri problemleri yama degil KOKTEN coz"; "sorsun ben seceyim").
// Kok: uygulama ayi "uye-ay" tek kayit sanirdi; gercek "uye-ay-BIRIM" (grup A → grup B → bireysel ayni ayda).
// Tek kaynak memberUnitsForMonth(uye, ay); Aktive Et birim sorar; tasinma/pasife alma sarkan paketi de bilir;
// bireysel→grup gecisinde bireysel birim payi; bireysel satir yalniz gercek bireysel birimi olana.
// Yamasiz (v178) build'de FAIL eder.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let CONFIRM = () => true;
let DLG = null; // (opts) => cevap; null → genel (input degeri / true)
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); if (DLG) { const r = DLG(o); if (r !== undefined) return r; } return (o&&o.input)?String(o.input.value):true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); };
    w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return CONFIRM(String(m||'')); };
    w.prompt=()=>null; w.scrollTo=()=>{}; w.print=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
const seen = (sub) => w.__msgs.some(m=>m.indexOf(sub)!==-1);
const J = (expr) => JSON.parse(w.eval('JSON.stringify(' + expr + ')'));
const eq = (a,b) => Math.abs((+a||0)-(+b||0)) < 0.011;
const has = (fn) => w.eval("typeof " + fn) === 'function';
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const sh = (k) => { const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-1+k,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); };
  const PREV1 = sh(-1);
  const dd = (ay, day) => ay + '-' + String(day).padStart(2,'0');
  function fixture(){
    w.eval(`
      state.settings.reformers=12; state.settings.instructorShareRate=30; delete state.settings.taxOfficialMode; state.settings.kdvRate=20; state.settings.gvRate=15;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500},{id:'pb',name:'BIREYSEL',sessions:8,price:8000}];
      state.instructors=[{id:'h1',name:'HOCA1',shareRate:30}];
      state.campaigns=[]; state.expenses=[]; state.instructorPayouts=[];
      const mk = (id,name,price,pid,months) => { const mo={}; (months||['${CM}']).forEach(a=>mo[a]={enrolled:true}); return {id:id,name:name,phone:'',joinDate:'2026-01-01',defaultPackageId:pid||'p8',totalPrice:price,packages:[],monthly:mo}; };
      state.members=[
        mk('S1','SEDA',4500,'p8',['${PREV1}','${CM}']), mk('S2','SELIN',4500,'p8',['${PREV1}','${CM}']), mk('S3','SILA',4500,'p8',['${PREV1}','${CM}']),
        mk('B1','BANU',4500), mk('B2','BERIL',4500),
        mk('I','IREM',8000,'pb'),
        mk('P','PINAR',4500), mk('A1','AYLA',4500), mk('A2','ASLI',4500)
      ];
      state.members.find(m=>m.id==='P').monthly['${CM}']={enrolled:false};
      state.groups=[
        {id:'GS',name:'SEDA - SELIN - SILA',size:4,memberIds:['S1','S2','S3'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'12:15',packages:[{month:'${PREV1}',startDate:'${PREV1}-20',sessions:8,price:13500,status:'active'}],monthlyMembers:{'${PREV1}':['S1','S2','S3'],'${CM}':['S1','S2','S3']},monthlyNotes:{}},
        {id:'GB',name:'BANU - BERIL',size:4,memberIds:['B1','B2'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1],defaultTime:'09:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${CM}':['B1','B2']},monthlyNotes:{}},
        {id:'GA',name:'AYLA - ASLI - PINAR',size:3,memberIds:['A1','A2','P'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[3],defaultTime:'18:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:13500,status:'active'}],monthlyMembers:{'${CM}':['A1','A2','P']},monthlyNotes:{}}
      ];
      state.lessons=[];
      // GS: ${PREV1} paketi — 5 yapildi (${PREV1} icinde), 3 PLANLI ${CM} tarihli (SARKAN, packageMonth ${PREV1})
      [20,22,24,26,28].forEach((day,i)=> state.lessons.push({id:'gsd'+i,groupId:'GS',memberIds:['S1','S2','S3'],date:'${PREV1}-'+day,time:'12:15',status:'completed',packageMonth:'${PREV1}',packageOwnerType:'group',packageOwnerId:'GS',instructorId:'h1',size:4}));
      [2,4,6].forEach((day,i)=> state.lessons.push({id:'gsp'+i,groupId:'GS',memberIds:['S1','S2','S3'],date:'${CM}-0'+day,time:'12:15',status:'planned',packageMonth:'${PREV1}',packageOwnerType:'group',packageOwnerId:'GS',instructorId:'h1',size:4}));
      // I: bireysel, 2 yapildi + 1 planli
      state.lessons.push({id:'i0',memberIds:['I'],date:'${CM}-01',time:'10:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'I',instructorId:'h1',size:1});
      state.lessons.push({id:'i1',memberIds:['I'],date:'${CM}-03',time:'10:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'I',instructorId:'h1',size:1});
      state.lessons.push({id:'i2',memberIds:['I'],date:'2099-01-05',time:'10:00',status:'planned',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'I',instructorId:'h1',size:1});
      state.members.find(m=>m.id==='I').packages=[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:8000,status:'active'}];
      state.payments=[
        {id:'ps1',memberId:'S1',groupId:'GS',date:'${PREV1}-20',packageMonth:'${PREV1}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'},
        {id:'ps2',memberId:'S2',groupId:'GS',date:'${PREV1}-20',packageMonth:'${PREV1}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'},
        {id:'ps3',memberId:'S3',groupId:'GS',date:'${PREV1}-20',packageMonth:'${PREV1}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'},
        {id:'pi',memberId:'I',groupId:'',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:8000,listPrice:8000,discount:0,method:'IBAN',pkgName:'BIREYSEL',net:6666.67,kdv:1333.33,gv:1000,pocket:5666.67,kdvRate:20,gvRate:15}
      ];
      document.getElementById('member-month').innerHTML='<option value="${PREV1}">${PREV1}</option><option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
      if (window.__partialOfferQueue) __partialOfferQueue.length=0; __undoStack=[];
      while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }
    `);
    w.__msgs.length=0; CONFIRM = () => true; DLG = null;
  }
  const units = (mid, ay) => has('memberUnitsForMonth') ? J(`memberUnitsForMonth('${mid}','${ay}')`) : null;
  const pays = (mid, gid, ay) => J(`state.payments.filter(p=>p.memberId==='${mid}'&&(p.groupId||'')==='${gid}'&&p.packageMonth==='${ay}')`);
  const inRoster = (gid, mid, ay) => J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='${gid}'),'${ay}')`).includes(mid);
  const rowsOf = (ay) => J(`buildMemberRows('${ay}')`);

  console.log('[A] memberUnitsForMonth — tek kaynak: acik birim + kapali birimler');
  fixture();
  { const u = units('S1', PREV1); t('S1 ' + PREV1 + ': tek acik grup birimi GS (5 ders yapildi, odenen 4500)', !!u && u.length===1 && u[0].kind==='group' && u[0].gid==='GS' && u[0].open===true && u[0].done===5 && eq(u[0].paid,4500), JSON.stringify(u)); }
  { const u = units('I', CM); t('I ' + CM + ': tek acik bireysel birim (2 yapildi, 1 planli, fiyat 8000, odenen 8000)', !!u && u.length===1 && u[0].kind==='individual' && u[0].open===true && u[0].done===2 && u[0].planned===1 && eq(u[0].price,8000) && eq(u[0].paid,8000), JSON.stringify(u)); }
  { const u = units('P', CM); t('P ' + CM + ' (pasif): birim yok', !!u && u.length===0, JSON.stringify(u)); }

  console.log('[B] AKTIVE ET birim sorar (Kerem: "sorsun ben seceyim"): eski grubu / bireysel / vazgec');
  fixture(); DLG = (o) => /hangi birimde/.test(o.msg||'') ? 'individual' : undefined;
  await w.eval(`reactivateMemberForMonthUI175('P','${CM}')`); await tick(120);
  t('birim sorusu soruldu ("hangi birimde")', seen('hangi birimde'), w.__msgs.slice(0,2).join(' | ').slice(0,160));
  t('Bireysel secildi: P kayitli, GA kadrosunda DEGIL, bireysel paketi var', w.eval(`isMemberEnrolledInMonth('P','${CM}')`)===true && !inRoster('GA','P',CM) && J(`(state.members.find(m=>m.id==='P').packages||[]).some(p=>p.month==='${CM}')`), inRoster('GA','P',CM));
  { const u = units('P', CM); t('P birimleri: acik bireysel', !!u && u.length>=1 && u[0].kind==='individual' && u[0].open, JSON.stringify(u)); }
  fixture(); DLG = (o) => /hangi birimde/.test(o.msg||'') ? 'group' : undefined;
  await w.eval(`reactivateMemberForMonthUI175('P','${CM}')`); await tick(120);
  t('Eski grubu secildi: P GA kadrosunda, kayitli', inRoster('GA','P',CM) && w.eval(`isMemberEnrolledInMonth('P','${CM}')`)===true);
  fixture(); DLG = (o) => /hangi birimde/.test(o.msg||'') ? null : undefined;
  await w.eval(`reactivateMemberForMonthUI175('P','${CM}')`); await tick(120);
  t('Vazgec: P pasif kaldi', w.eval(`isMemberEnrolledInMonth('P','${CM}')`)===false && !inRoster('GA','P',CM));
  fixture(); DLG = null; // genel otomatik cevap (true) → eski davranis (grup) — mevcut testlerle uyum
  await w.eval(`reactivateMemberForMonthUI175('P','${CM}')`); await tick(120);
  t('genel "true" cevabi = eski grubu (v58 uyumu)', inRoster('GA','P',CM));
  fixture(); w.eval("__sbRole='staff';"); w.__msgs.length=0;
  await w.eval(`reactivateMemberForMonthUI175('P','${CM}')`); await tick(120);
  t('personel: soru yok, v58 (grup)', !seen('hangi birimde') && inRoster('GA','P',CM));
  w.eval("__sbRole='owner';");
  fixture(); w.__msgs.length=0;
  w.eval(`reactivateMemberForMonth('P','${CM}')`); await tick(60);
  t('programatik aktive: soru yok (v58)', !seen('hangi birimde') && inRoster('GA','P',CM));

  console.log('[C] SARKAN PAKET — tasinma (' + CM + ' bagla­mi, GS ' + PREV1 + ' paketi ' + CM + "'e sarkiyor): pay " + PREV1 + " paketinden, odeme fazlasi " + CM + " devri");
  fixture();
  w.eval("assignMemberToSlot('S1','GB',2)"); await tick(150);
  t('S1 GB kadrosunda (' + CM + '), GS ' + CM + ' kadrosunda degil', inRoster('GB','S1',CM) && !inRoster('GS','S1',CM));
  t('GS ' + PREV1 + ' kadrosu S1 i birakti (paket yarida) — pay ' + PREV1 + ': 5 ders · 2812,5', !inRoster('GS','S1',PREV1) && (function(){ const ps = J(`partialShareFor('GS','S1','${PREV1}')`); return !!ps && +ps.sessions===5 && eq(ps.price,2812.5); })(), JSON.stringify(J(`partialShareFor('GS','S1','${PREV1}')`)));
  t('sarkan 3 planli derste S1 yok (S2,S3 kaldi)', J(`state.lessons.filter(l=>l.id.startsWith('gsp')).map(l=>l.memberIds.join('+'))`).every(x => x==='S2+S3'), JSON.stringify(J(`state.lessons.filter(l=>l.id.startsWith('gsp')).map(l=>l.memberIds)`)));
  { const a = pays('S1','GS',PREV1), b = pays('S1','GB',CM); t('odeme: GS ' + PREV1 + ' 2812,5 kaldi · 1687,5 GB ' + CM + ' paketine DEVIR', a.length===1 && eq(a[0].amount,2812.5) && b.length===1 && eq(b[0].amount,1687.5), JSON.stringify({a:a.map(p=>[p.amount,p.packageMonth]), b:b.map(p=>[p.amount,p.packageMonth])})); }
  t('S1 ' + PREV1 + ': bireysel satir YOK (yalniz kapali birim), GS altinda ayrildi satiri var', !rowsOf(PREV1).some(r=>r.type==='individual'&&r.memberId==='S1') && rowsOf(PREV1).some(r=>r.groupId==='GS'&&r.memberId==='S1'&&r.isPartial));
  t('S1 ' + PREV1 + ' bakiyesi 0 (pay 2812,5 odendi)', eq(w.eval(`memberBalanceForMonth('S1','${PREV1}')`), 0), w.eval(`memberBalanceForMonth('S1','${PREV1}')`));
  t('GS ' + PREV1 + ' beklenen 11812,5 (S2 4500 + S3 4500 + S1 payi 2812,5), toplanan 11812,5, kalan 0', eq(w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='GS'),'${PREV1}')`),11812.5) && eq(w.eval(`groupBalanceForMonth('GS','${PREV1}')`),0), w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='GS'),'${PREV1}')`) + '/' + w.eval(`groupBalanceForMonth('GS','${PREV1}')`));
  { const u = units('S1', PREV1); t('S1 ' + PREV1 + ' birimleri: yalniz kapali GS (pay)', !!u && u.length===1 && u[0].gid==='GS' && u[0].open===false && !!u[0].share, JSON.stringify(u)); }
  { const u = units('S1', CM); t('S1 ' + CM + ' birimleri: acik GB (odenen 1687,5)', !!u && u.length===1 && u[0].gid==='GB' && u[0].open===true && eq(u[0].paid,1687.5), JSON.stringify(u)); }
  t('hoca hakedisi: GS in 5 dersi degismedi (3 x 562,5 x %30)', eq(w.eval(`state.lessons.filter(l=>l.id.startsWith('gsd')).reduce((a,l)=>a+instructorEarningForLesson(l),0)`), 5*1687.5*0.3), w.eval(`state.lessons.filter(l=>l.id.startsWith('gsd')).reduce((a,l)=>a+instructorEarningForLesson(l),0)`));

  console.log('[D] SARKAN PAKET — pasife alma (' + CM + '): sarkan planli derslerden duser; ' + PREV1 + ' paketi (odeme) OLDUGU GIBI');
  fixture();
  w.eval(`removeMemberFromMonth('S1','${CM}')`); await tick(120);
  t('S1 ' + CM + ' pasif', w.eval(`isMemberEnrolledInMonth('S1','${CM}')`)===false);
  t('sarkan 3 planli derste S1 yok', J(`state.lessons.filter(l=>l.id.startsWith('gsp')).map(l=>l.memberIds.join('+'))`).every(x => x==='S2+S3'), JSON.stringify(J(`state.lessons.filter(l=>l.id.startsWith('gsp')).map(l=>l.memberIds)`)));
  t(PREV1 + ' kadrosu ve odemesi dokunulmadi (S1 kadroda, pay yok, GS kalan 0)', inRoster('GS','S1',PREV1) && !J(`partialShareFor('GS','S1','${PREV1}')`) && eq(w.eval(`groupBalanceForMonth('GS','${PREV1}')`),0));

  console.log('[E] BIREYSEL → GRUP (I: 2 bireysel ders, 8000 odemis → GB): bireysel birim payi 2 x 1000, 6000 gruba');
  fixture();
  const earnBefore = w.eval("instructorEarningForLesson(state.lessons.find(l=>l.id==='i0'))");
  w.eval("assignMemberToSlot('I','GB',2)"); await tick(150);
  t('I GB kadrosunda', inRoster('GB','I',CM));
  { const s = J(`((state.members.find(m=>m.id==='I').monthly||{})['${CM}']||{}).__soloShare179||null`); t('bireysel birim payi: 2 ders · 2000', !!s && +s.sessions===2 && eq(s.price,2000), JSON.stringify(s)); }
  { const a = pays('I','',CM), b = pays('I','GB',CM); t('odeme: bireysel 2000 kaldi · 6000 GB ye', a.length===1 && eq(a[0].amount,2000) && b.length===1 && eq(b[0].amount,6000), JSON.stringify({a:a.map(p=>p.amount), b:b.map(p=>p.amount)})); }
  t('ileri tarihli planli bireysel ders I den dustu', !J(`(state.lessons.find(l=>l.id==='i2')||{memberIds:[]}).memberIds`).includes('I'));
  { const u = units('I', CM); t('I birimleri: acik GB (odenen 6000) + kapali bireysel (pay 2/2000, odenen 2000)', !!u && u.length===2 && u[0].kind==='group' && u[0].gid==='GB' && eq(u[0].paid,6000) && u[1].kind==='individual' && u[1].open===false && eq(u[1].paid,2000) && !!u[1].share, JSON.stringify(u)); }
  t('hoca hakedisi: I nin yapilmis bireysel dersi degismedi (1000 x %30)', eq(w.eval("instructorEarningForLesson(state.lessons.find(l=>l.id==='i0'))"), earnBefore) && eq(earnBefore, 300), earnBefore + ' → ' + w.eval("instructorEarningForLesson(state.lessons.find(l=>l.id==='i0'))"));
  t('I bakiyesi: bireysel pay borcu 0 (2000 odendi) + GB kalani', eq(w.eval(`memberBalanceForMonth('I','${CM}')`), Math.max(0, w.eval(`memberPriceForGroupMonth('I','GB','${CM}')`) - 6000)), w.eval(`memberBalanceForMonth('I','${CM}')`));

  console.log('[F] v171 pasife alma pay onerisi = uyenin 1-ders fiyati x alinan (v54 bolen)');
  fixture();
  w.eval(`state.members.find(m=>m.id==='S2').monthly['${PREV1}'].sessionsOverride=4;`); // S2 nin kendi hakki 4 → 1 ders 1125
  w.eval(`removeMemberFromMonth('S2','${PREV1}')`); await tick(120);
  t('oneri metni 4.500 x 5/4 (uyenin hakki) = 5.625', seen('5/4'), w.__msgs.filter(m=>/pay/i.test(m)).join(' | ').slice(0,200));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
