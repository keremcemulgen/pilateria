// v178 — UYE DETAYI: BASKA BIRIMDEKI DERSLER AYRI LISTELENIR (Kerem 2026-09-28: "bireysele almama ragmen eski grubun
// 4 dersi listede — bu dersler onceki grubunda vb gibi listelenmeli; ona 8 derslik bireysel paket tanimlayacagim").
// Uye detayi o ayin derslerini ikiye ayirir: bu birimin (bireysel / su anki grup) dersleri ana listede; onceki/diger
// gruplardaki dersleri ayri "Diger birimlerdeki dersleri" bolumunde GRUP ADIYLA. "Yapilan Ders" sayaci bu birimin
// derslerini sayar (+N onceki grupta notu). Odeme satirinda baska gruba yazilmis odeme grup adiyla etiketlenir.
// Yamasiz (v177) build'de FAIL eder.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return (o&&o.input)?String(o.input.value):true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{}; w.print=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
const statVal = (sel, label) => { const e = [...d.querySelectorAll(sel)].find(x => ((x.querySelector('.label')||{}).textContent||'').trim().indexOf(label) === 0); return e ? ((e.querySelector('.value')||{}).textContent||'').trim() : null; };
const statBox = (sel, label) => [...d.querySelectorAll(sel)].find(x => ((x.querySelector('.label')||{}).textContent||'').trim().indexOf(label) === 0);
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  function fixture(){
    w.eval(`
      state.settings.reformers=12; state.settings.instructorShareRate=30;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500},{id:'pb',name:'GÜNCEL BİREYSEL',sessions:8,price:8000}];
      state.instructors=[{id:'h1',name:'ESRA',shareRate:30}];
      state.campaigns=[]; state.expenses=[]; state.instructorPayouts=[];
      const mk = (id,name,price,pid) => ({id:id,name:name,phone:'',joinDate:'2026-01-01',defaultPackageId:pid||'p8',totalPrice:price,packages:[],monthly:{'${CM}':{enrolled:true}}});
      state.members=[mk('F','FERESTE',8000,'pb'),mk('O','OZGE',4500),mk('S','SAADET',4500),mk('H','HILAL',4500),mk('K','KEREMCAN',4500)];
      state.groups=[
        {id:'GA',name:'OZGE - SAADET - HILAL',size:4,memberIds:['O','S','H'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'12:15',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:18000,status:'active'}],monthlyMembers:{'${CM}':['O','S','H']},monthlyPartials:{'${CM}':[{memberId:'F',sessions:4,price:2250,note:'taşındı → bireysel',at:'${CM}-27'}]},monthlyNotes:{}},
        {id:'GB',name:'KEREMCAN',size:2,memberIds:['K'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1],defaultTime:'09:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${CM}':['K']},monthlyNotes:{}}
      ];
      state.lessons=[];
      [15,17,22,24].forEach((day,i)=> state.lessons.push({id:'ga'+i,groupId:'GA',memberIds:['O','S','H','F'],date:'${CM}-'+String(day).padStart(2,'0'),time:'12:15',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'GA',instructorId:'h1',size:4}));
      state.lessons.push({id:'gb0',groupId:'GB',memberIds:['K','F'],date:'${CM}-26',time:'09:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'GB',instructorId:'h1',size:2});
      state.lessons.push({id:'fi0',memberIds:['F'],date:'${CM}-27',time:'10:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'F',instructorId:'h1',size:1});
      state.lessons.push({id:'fi1',memberIds:['F'],date:'${CM}-28',time:'10:00',status:'planned',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'F',instructorId:'h1',size:1});
      state.payments=[
        {id:'pf1',memberId:'F',groupId:'GA',date:'${CM}-16',packageMonth:'${CM}',sessions:8,amount:2250,listPrice:2250,discount:0,method:'IBAN',pkgName:'8 Ders'},
        {id:'pf2',memberId:'F',groupId:'',date:'${CM}-16',packageMonth:'${CM}',sessions:8,amount:2250,listPrice:2250,discount:0,method:'IBAN',pkgName:'8 Ders',note:'↔ taşındı'}
      ];
      document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
      __undoStack=[];
      while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }
    `);
    w.__msgs.length=0;
  }

  console.log('[1] BIREYSEL uye (FERESTE): eski grup GA (4 ders) + baska grup GB (1 ders) + bireysel (1 yapildi, 1 planli)');
  fixture();
  w.eval(`openMemberDetail('F','${CM}')`); await tick();
  const md = d.getElementById('md-content');
  const txt = md.textContent.replace(/\s+/g,' ');
  t('on kosul: uye o ay bireysel (grupta degil), bireysel kalan 6 (8 − 2 iptal disi bireysel ders; grup dersleri sayilmaz)', !w.eval(`memberActiveGroupForMonth('F','${CM}')`) && w.eval(`memberRemainingForMonth('F','${CM}')`)===6, w.eval(`memberRemainingForMonth('F','${CM}')`));
  const secRows = (sumRe) => { const det = [...md.querySelectorAll('details')].find(x => sumRe.test((x.querySelector('summary')||{}).textContent||'')); return det ? [...det.querySelectorAll('table tbody tr')].map(r => r.textContent.replace(/\s+/g,' ')) : null; };
  { const m = txt.match(new RegExp(CM + ' Dersleri \\((\\d+)\\)')); t('ana liste basligi: bu birimin dersleri (1) — grup dersleri sayilmaz', !!m && +m[1]===1, m && m[0]); }
  t('"Diğer birimlerdeki dersleri (5)" bolumu var', /Diğer birim[^(]*\(5\)/.test(txt), (txt.match(/Diğer birim[^)]*\)/)||[''])[0]);
  t('bolumde eski grubun adi ve "önceki grup" etiketi', /OZGE - SAADET - HILAL/.test(txt) && /önceki grup/.test(txt));
  t('bolumde GB grubu da adiyla', /KEREMCAN/.test(txt));
  { const v = statVal('#md-content .stat', 'Yapılan Ders'); t('"Yapılan Ders" = 1 (bu birim) ve "+5 diğer birimde" notu', v === '1' && /\+5/.test((statBox('#md-content .stat','Yapılan Ders')||{}).textContent||''), v + ' | ' + ((statBox('#md-content .stat','Yapılan Ders')||{}).textContent||'').replace(/\s+/g,' ')); }
  { const own = secRows(new RegExp('^' + CM + ' Dersleri')) || []; const other = secRows(/Diğer birim/) || [];
    t('bireysel dersler ana listede (2 satir, 10:00), GA+GB dersleri ayri bolumde (5 satir)', own.length===2 && own.every(r => /10:00/.test(r)) && other.length===5 && other.filter(r => /12:15/.test(r)).length===4, own.length + '/' + other.length); }
  { const payRows = (secRows(new RegExp('^' + CM + ' Ödemeleri')) || []).filter(r => /2\.250/.test(r));
    t('odeme satirlari: GA ya yazilan odeme grup adiyla + "önceki grup" etiketli, bireysel olan degil', payRows.length===2 && payRows.filter(r => /OZGE - SAADET - HILAL/.test(r) && /önceki grup/.test(r)).length===1, JSON.stringify(payRows.map(r=>r.slice(0,90)))); }
  w.eval("closeModal('modal-member-detail')");

  console.log('[2] GRUP uyesi (OZGE, GA): tum dersleri kendi grubunda → ayri bolum YOK, baslik (4)');
  w.eval(`openMemberDetail('O','${CM}')`); await tick();
  { const txt2 = d.getElementById('md-content').textContent.replace(/\s+/g,' '); const m = txt2.match(new RegExp(CM + ' Dersleri \\((\\d+)\\)')); t('baslik (4), "Diğer birim" bolumu yok', !!m && +m[1]===4 && !/Diğer birim/.test(txt2), m && m[0]); }
  w.eval("closeModal('modal-member-detail')");

  console.log('[3] Tum Gecmis sayaci degismedi (6 yapilmis ders)');
  w.eval(`openMemberDetail('F','${CM}')`); await tick();
  t('Tüm Geçmiş (2 ödeme · 6 ders)', /Tüm Geçmiş \(2 ödeme · 6 ders\)/.test(d.getElementById('md-content').textContent.replace(/\s+/g,' ')));
  w.eval("closeModal('modal-member-detail')");

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
