// v195 (Kerem 15.10, canli AYŞE KAYA): "Ekim'e uye ekliyorum, Eylul'e de ekliyor. Bu olmamali; kokten cozulmeli."
// KOK: v186 "yerine gelen uye devam eden pakete girer" OTOMATIKTI — Ekim'de gruba eklenen HER uye, grubun Eylul paketi
// Ekim'e sarkiyorsa Eylul kadrosuna da yaziliyordu. Kumis (ayrilanin yerine) ile Ayse (yeni paket) ayni islem, farkli niyet.
// ILKE: T ayinda yapilan kadro degisikligi yalniz T ve sonrasina yazilir; sarkan paketin (S) kadrosuna yalniz kullanicinin
// ACIK cevabiyla girilir (bos yer varsa SORULUR; kadro doluysa / v191 engeli varsa sorulmaz). Karar g.spillJoin195'e yazilir.
// ONARIM: eski otomatik yazimlar (S kadrosunda, katilis T'de, karar yok, S paketinden hic ders yapmamis) acilista tek tek sorulur.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__msgs=[]; w.__ans=true; w.__spillAns='no'; w.__repairAns=null; w.__atQuestion=null;
  w.__PL_DLG_AUTO__=(o)=>{ const msg=String((o&&o.msg)||''); w.__msgs.push(msg);
    if(o&&o.input) return w.__ans ? String(o.input.value) : null;
    if(/sarkıyor/.test(msg) && /girsin mi\?/.test(msg)) { // v195 sarkan paket sorusu — soru ANINDA S'ye yazilmamis olmali
      try { w.__atQuestion = { S: w.eval("JSON.stringify((state.groups.find(g=>g.id==='NG')||{}).monthlyMembers)"), L: w.eval("JSON.stringify(state.lessons.filter(l=>l.groupId==='NG'&&l.status==='planned').map(l=>l.memberIds.slice().sort().join(',')))") }; } catch(e) { w.__atQuestion = { err: String(e) }; }
      return w.__spillAns; }
    if(/listesinden çıkarılsın mı\?/.test(msg)) return w.__repairAns; // v195 onarim sorusu
    return w.__ans; };
  w.alert=(m)=>{ w.__msgs.push('ALERT:'+m); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
}}).window; }
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
setTimeout(async function(){try{
  const w0=boot(); await tick(1200);
  const T=w0.eval('currentMonth()'); const TODAY=w0.eval('todayISO()');
  const sh=(ay,k)=>{const [y,m]=ay.split('-').map(Number);const dt=new Date(y,m-1+k,1);return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');};
  const S=sh(T,-1);
  const addD=(iso,k)=>{const [y,m,d]=iso.split('-').map(Number);const dt=new Date(y,m-1,d+k);return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');};
  const D1=addD(TODAY,1), D2=addD(TODAY,3), D3=addD(TODAY,5); // sarkan paketin planli dersleri GELECEKTE (katilis tarihi = bugun; v106 onceki derse yazilmaz)
  // NG: Eylul paketi 16.09'da basladi, 3/4 kisi (bos yer var), 3 planli ders Ekim'e sarkiyor. FG: Eylul 4/4 DOLU, F4 Ekim'de ayrildi.
  // B = BERNA: Eylul'de bireysel kayitli (v191 engeli 'bireysel'); OG: BURCU'nun grubu (v191 engeli 'baska-grup'). A = AYSE KAYA: yeni uye, yalniz Ekim.
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.settings.reformers=5; state.settings.lessonDuration=45; state.payments=[];
    state.packageTypes=[{id:'p4',name:'4 KİŞİLİK',sessions:8,price:4500}];
    state.instructors=[{id:'G',name:'GIZEM',shareRate:30},{id:'I',name:'ICLAL',shareRate:30}];
    const mk=(id,name,mo,o)=>Object.assign({id,name,joinDate:'2026-01-01',defaultPackageId:'p4',totalPrice:4500,packages:[],monthly:mo},o||{});
    const both={'${S}':{enrolled:true},'${T}':{enrolled:true}};
    state.members=[
      mk('N1','NURAY',JSON.parse(JSON.stringify(both))), mk('N2','NESLI',JSON.parse(JSON.stringify(both))), mk('N3','NILGUN',JSON.parse(JSON.stringify(both))),
      mk('F1','FATMA',JSON.parse(JSON.stringify(both))), mk('F2','FERIDE',JSON.parse(JSON.stringify(both))), mk('F3','FILIZ',JSON.parse(JSON.stringify(both))),
      mk('F4','FUNDA',{'${S}':{enrolled:true},'${T}':{enrolled:false}},{archivePeriods:[{from:'${T}',to:null}]}),
      mk('B','BERNA',JSON.parse(JSON.stringify(both))), mk('B2','BURCU',JSON.parse(JSON.stringify(both))), mk('O1','OYA',JSON.parse(JSON.stringify(both))), mk('O2','OZGE',JSON.parse(JSON.stringify(both))),
      mk('K','KUMIS',{'${T}':{enrolled:true}},{joinDate:'${T}-05'}),
      mk('A','AYSE KAYA',{'${T}':{enrolled:true}},{joinDate:'${T}-10'})];
    state.groups=[
      {id:'NG',name:'NURAY GRUBU',size:4,memberIds:['N1','N2','N3'],defaultInstructorId:'G',defaultPackageId:'p4',packages:[{month:'${S}',startDate:'${S}-16',sessions:8,price:13500,status:'active'}],monthlyMembers:{'${S}':['N1','N2','N3']},monthlyNotes:{},memberJoinDates:{}},
      {id:'FG',name:'FATMA GRUBU',size:4,memberIds:['F1','F2','F3'],defaultInstructorId:'I',defaultPackageId:'p4',packages:[{month:'${S}',startDate:'${S}-16',sessions:8,price:18000,status:'active'}],monthlyMembers:{'${S}':['F1','F2','F3','F4']},monthlyNotes:{},memberJoinDates:{}},
      {id:'OG',name:'OYA GRUBU',size:4,memberIds:['B2','O1','O2'],defaultInstructorId:'I',defaultPackageId:'p4',packages:[{month:'${S}',startDate:'${S}-01',sessions:8,price:13500,status:'completed'}],monthlyMembers:{'${S}':['B2','O1','O2']},monthlyNotes:{},memberJoinDates:{}}];
    state.lessons=[]; let n=0; const L=(g,ins,date,time,st,mids,pm)=>state.lessons.push({id:'L'+(n++),groupId:g,instructorId:ins,date:date,time:time,durationMin:45,status:st,memberIds:mids.slice(),packageMonth:pm,packageOwnerType:'group',packageOwnerId:g,size:4});
    ['16','18','23','25','30'].forEach(d=>L('NG','G','${S}-'+d,'10:00','completed',['N1','N2','N3'],'${S}'));
    ['${D1}','${D2}','${D3}'].forEach(d=>L('NG','G',d,'10:00','planned',['N1','N2','N3'],'${S}'));
    ['16','18','23','25','30'].forEach(d=>L('FG','I','${S}-'+d,'11:00','completed',['F1','F2','F3','F4'],'${S}'));
    ['${D1}','${D2}','${D3}'].forEach(d=>L('FG','I',d,'11:00','planned',['F1','F2','F3','F4'],'${S}'));
    ['01','03','08','10','15','17','22','24'].forEach(d=>L('OG','I','${S}-'+d,'12:00','completed',['B2','O1','O2'],'${S}'));
    document.getElementById('member-month').innerHTML='<option value="${T}">${T}</option><option value="${S}">${S}</option>'; document.getElementById('member-month').value='${T}';`;
  const J=(w,e)=>w.eval('JSON.stringify('+e+')');
  const rosterS=(w,g)=>J(w,`(state.groups.find(x=>x.id==='${g}').monthlyMembers['${S}']||[]).slice().sort()`);
  const activeS=(w,g)=>J(w,`activeGroupRosterForMonth(state.groups.find(x=>x.id==='${g}'),'${S}').filter(Boolean).slice().sort()`);
  const activeT=(w,g)=>J(w,`activeGroupRosterForMonth(state.groups.find(x=>x.id==='${g}'),'${T}').filter(Boolean).slice().sort()`);
  const plannedS=(w,g)=>J(w,`state.lessons.filter(l=>l.groupId==='${g}'&&l.status==='planned'&&(l.packageMonth||l.date.slice(0,7))==='${S}').map(l=>l.memberIds.slice().sort().join(','))`);
  const decision=(w,g,mid)=>w.eval(`(state.groups.find(x=>x.id==='${g}').spillJoin195||{})['${mid}|${S}']||''`);
  const spillQs=(w)=>w.__msgs.filter(m=>/sarkıyor/.test(m)&&/girsin mi\?/.test(m));
  const addViaModal=async (w,gid,mid)=>{ w.eval(`openGroupDetail('${gid}','${T}')`); await tick(); w.eval(`openGroupModal('${gid}')`); await tick();
    const cb=w.document.querySelector(`#mg-members input.gm-mc[value="${mid}"]`); if(!cb) return false; cb.checked=true; w.eval('saveGroup()'); await tick(500); return true; };

  console.log('[1] saveGroup — Ekim sayfasinda AYSE KAYA gruba eklenir, sarkan Eylul paketi icin SORULUR; "Hayir" → Eylul\'e dokunulmaz');
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns='no';
    t('grup penceresinde AYSE secilebildi', await addViaModal(w,'NG','A'));
    const qs=spillQs(w);
    t('sarkan paket sorusu TAM 1 kez soruldu', qs.length===1, JSON.stringify(w.__msgs).slice(0,400));
    t('soru: grup adi, Eylul→Ekim, 3 planli ders, kalan derslerde kadro 3/4, uyenin adi', qs.length===1 && /NURAY GRUBU/.test(qs[0]) && /3 planlı ders/.test(qs[0]) && /Kalan derslerde kadro 3\/4/.test(qs[0]) && /AYSE KAYA bu derslere de girsin mi/.test(qs[0]), qs[0]);
    t('soru ANINDA Eylul kadrosuna henuz YAZILMAMIS', !!w.__atQuestion && !String(w.__atQuestion.S).includes('"A"'), JSON.stringify(w.__atQuestion));
    t('soru ANINDA Eylul paketinin planli derslerine YAZILMAMIS', !!w.__atQuestion && !String(w.__atQuestion.L).includes('A'), JSON.stringify(w.__atQuestion));
    t('Hayir → Eylul ham kadro N1,N2,N3 (A YOK)', rosterS(w,'NG')===JSON.stringify(['N1','N2','N3']), rosterS(w,'NG'));
    t('Hayir → Eylul aktif kadro N1,N2,N3', activeS(w,'NG')===JSON.stringify(['N1','N2','N3']), activeS(w,'NG'));
    t('Hayir → Ekim tarihli (gelecek) EYLUL-paketi derslerinde A YOK', plannedS(w,'NG')===JSON.stringify(['N1,N2,N3','N1,N2,N3','N1,N2,N3']), plannedS(w,'NG'));
    t('Hayir → A.monthly[Eylul] acilmadi', w.eval(`state.members.find(m=>m.id==='A').monthly['${S}']===undefined`), J(w,`state.members.find(m=>m.id==='A').monthly`));
    t('Ekim kadrosunda A VAR', activeT(w,'NG')===JSON.stringify(['A','N1','N2','N3']), activeT(w,'NG'));
    t('A Ekim kayitli (enrolled)', w.eval(`state.members.find(m=>m.id==='A').monthly['${T}'].enrolled===true`));
    t('karar kaydedildi: spillJoin195["A|Eylul"] = no', decision(w,'NG','A')==='no', decision(w,'NG','A'));
    t('Eylul icin "kalan derse gore ucret" SORULMADI', !w.__msgs.some(m=>/AYSE KAYA/.test(m) && /paketinde/.test(m) && /kaldı/.test(m)), JSON.stringify(w.__msgs.filter(m=>/paketinde/.test(m))));
  }

  console.log('[2] "Evet" → Eylul paketine de girer (kadro, kayit, sarkan dersler, katilis tarihi, kalan derse gore ucret sorusu)');
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns='yes';
    await addViaModal(w,'NG','A');
    t('soru soruldu', spillQs(w).length===1);
    t('Evet → Eylul ham kadroda A', rosterS(w,'NG').includes('"A"'), rosterS(w,'NG'));
    t('Evet → Eylul aktif kadro A,N1,N2,N3', activeS(w,'NG')===JSON.stringify(['A','N1','N2','N3']), activeS(w,'NG'));
    t('Evet → Ekim tarihli (gelecek) Eylul-paketi derslerine A yazildi', plannedS(w,'NG')===JSON.stringify(['A,N1,N2,N3','A,N1,N2,N3','A,N1,N2,N3']), plannedS(w,'NG'));
    t('Evet → A.monthly[Eylul].enrolled = true', w.eval(`!!(state.members.find(m=>m.id==='A').monthly['${S}']||{}).enrolled`));
    t('Evet → katilis tarihi bugun (onceki dersler tiksiz)', w.eval(`state.groups.find(x=>x.id==='NG').memberJoinDates.A`)===TODAY, w.eval(`state.groups.find(x=>x.id==='NG').memberJoinDates.A`));
    t('Evet → kalan derse gore ucret/hak onerisi soruldu (v171)', w.__msgs.some(m=>/paketinde 5 ders yapıldı, 3 ders kaldı/.test(m) && /AYSE KAYA/.test(m)), JSON.stringify(w.__msgs.filter(m=>/kaldı/.test(m))).slice(0,300));
    t('karar kaydedildi: yes', decision(w,'NG','A')==='yes', decision(w,'NG','A'));
    t('Ekim kadrosunda da A', activeT(w,'NG').includes('"A"'));
    t('Geri Al yedegi alindi', w.eval("(__undoStack||[]).some(s=>/paketine katıl/.test(s.label))"), J(w,'(__undoStack||[]).map(s=>s.label)'));
  }

  console.log('[3] Eski kanca (true) = Evet; Esc/null = Hayir');
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns=true; await addViaModal(w,'NG','A');
    t('true → Eylul kadrosunda A', rosterS(w,'NG').includes('"A"') && decision(w,'NG','A')==='yes'); }
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns=null; await addViaModal(w,'NG','A');
    t('Esc → Eylul kadrosunda A YOK, karar no', !rosterS(w,'NG').includes('"A"') && decision(w,'NG','A')==='no', rosterS(w,'NG')+' '+decision(w,'NG','A'));
    t('Esc → Ekim kadrosunda A VAR', activeT(w,'NG').includes('"A"')); }

  console.log('[4] Kadro DOLU (4/4) → SORULMAZ, yalniz Ekim');
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns='yes';
    t('on kosul: FG Eylul aktif kadro 4/4 (F4 Eylul\'de var), Ekim 3 kisi', activeS(w,'FG')===JSON.stringify(['F1','F2','F3','F4']) && activeT(w,'FG')===JSON.stringify(['F1','F2','F3']), activeS(w,'FG')+' '+activeT(w,'FG'));
    t('grup penceresinde AYSE secilebildi', await addViaModal(w,'FG','A'));
    t('sarkan paket sorusu YOK', spillQs(w).length===0, JSON.stringify(spillQs(w)));
    t('Eylul kadrosu F1..F4 aynen (5. kisi YOK)', rosterS(w,'FG')===JSON.stringify(['F1','F2','F3','F4']), rosterS(w,'FG'));
    t('Eylul-paketi planli derslerinde A YOK', !plannedS(w,'FG').includes('A'), plannedS(w,'FG'));
    t('Ekim kadrosunda A VAR', activeT(w,'FG').includes('"A"'), activeT(w,'FG'));
    t('A.monthly[Eylul] acilmadi', w.eval(`state.members.find(m=>m.id==='A').monthly['${S}']===undefined`));
  }

  console.log('[5] v191 engeli → SORULMAZ: (a) uye Eylul\'de bireysel kayitli, (b) uyenin Eylul\'de baska grubu var');
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns='yes';
    t('BERNA grup penceresinde secilebildi (Ekim\'de grupsuz)', await addViaModal(w,'NG','B'));
    t('(a) sarkan paket sorusu YOK', spillQs(w).length===0, JSON.stringify(spillQs(w)));
    t('(a) NG Eylul kadrosunda B YOK', !rosterS(w,'NG').includes('"B"'), rosterS(w,'NG'));
    t('(a) NG Ekim kadrosunda B VAR', activeT(w,'NG').includes('"B"'), activeT(w,'NG'));
    t('(a) B Eylul kaydi aynen (bireysel)', J(w,`state.members.find(m=>m.id==='B').monthly['${S}']`)===JSON.stringify({enrolled:true}));
  }
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns='yes';
    w.eval(`openGroupDetail('NG','${T}')`); await tick(); w.eval(`assignMemberToSlot('B2','NG',3)`); await tick(500);
    t('(b) sarkan paket sorusu YOK', spillQs(w).length===0, JSON.stringify(spillQs(w)));
    t('(b) NG Eylul kadrosunda BURCU YOK', !rosterS(w,'NG').includes('"B2"'), rosterS(w,'NG'));
    t('(b) NG Ekim kadrosunda BURCU VAR', activeT(w,'NG').includes('"B2"'), activeT(w,'NG'));
    t('(b) OG Eylul kadrosunda BURCU kaldi', rosterS(w,'OG').includes('"B2"'), rosterS(w,'OG'));
  }

  console.log('[6] assignMemberToSlot (grup detay slotu) — ayni ilke');
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns='no';
    w.eval(`openGroupDetail('NG','${T}')`); await tick(); w.eval(`assignMemberToSlot('A','NG',3)`); await tick(500);
    t('soru soruldu (1 kez)', spillQs(w).length===1, JSON.stringify(w.__msgs).slice(0,300));
    t('soru aninda Eylul\'e yazilmamis', !!w.__atQuestion && !String(w.__atQuestion.S).includes('"A"') && !String(w.__atQuestion.L).includes('A'), JSON.stringify(w.__atQuestion));
    t('Hayir → Eylul kadrosu aynen', rosterS(w,'NG')===JSON.stringify(['N1','N2','N3']), rosterS(w,'NG'));
    t('Hayir → Eylul-paketi dersleri aynen', plannedS(w,'NG')===JSON.stringify(['N1,N2,N3','N1,N2,N3','N1,N2,N3']), plannedS(w,'NG'));
    t('Ekim kadrosunda A (3. slot)', w.eval(`activeGroupRosterForMonth(state.groups.find(x=>x.id==='NG'),'${T}')[3]`)==='A', activeT(w,'NG'));
    t('katilis tarihi bugun', w.eval(`state.groups.find(x=>x.id==='NG').memberJoinDates.A`)===TODAY);
    t('karar no', decision(w,'NG','A')==='no');
  }
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns='yes';
    w.eval(`openGroupDetail('NG','${T}')`); await tick(); w.eval(`assignMemberToSlot('A','NG',3)`); await tick(500);
    t('slot + Evet → Eylul kadrosunda A, dersler yazildi', rosterS(w,'NG').includes('"A"') && plannedS(w,'NG')===JSON.stringify(['A,N1,N2,N3','A,N1,N2,N3','A,N1,N2,N3']), rosterS(w,'NG')+' '+plannedS(w,'NG'));
  }

  console.log('[7] ONARIM: v186\'nin OTOMATIK yazdigi uyeler acilista tek tek sorulur; ders yapmis (Kumis) / odemis (Pinar) sorulmaz');
  // Eylul kadrosunda, katilisi Ekim, karari yok: A (Ayse: yeni uye, oneriyle 1.687,5 ₺ + hak 3 yazilmis, ders yok) · R (Rana: donen uye,
  // pasif donemi Temmuz→Eylul'e KISALTILMIS) · E (Esra: Eylul'de bireysel dersi + elle fiyati var, v191 oncesi otomatik yazim) ·
  // K (Kumis: 02.10 Eylul-paketi dersini YAPMIS) · P (Pinar: Eylul paketine ODEME girilmis) → yalniz A, R, E sorulur.
  const BOZ=`(function(){ const g=state.groups.find(x=>x.id==='NG'); g.monthlyMembers['${S}']=['N1','N2','N3','A','K','R','E','P']; g.memberIds=['N1','N2','N3','A','K','R','E','P'];
      Object.assign(g.memberJoinDates,{A:'${T}-10',K:'${T}-01',R:'${T}-12',E:'${T}-08',P:'${T}-03'});
      const mk=(id,name,mo,o)=>Object.assign({id,name,joinDate:'2026-01-01',defaultPackageId:'p4',totalPrice:4500,packages:[],monthly:mo},o||{});
      state.members.push(mk('R','RANA',{'${S}':{enrolled:true},'${T}':{enrolled:true}},{archivePeriods:[{from:'2026-07',to:'${S}',reason:''}]}));
      state.members.push(mk('E','ESRA',{'${S}':{enrolled:true,totalPrice:4500},'${T}':{enrolled:true}}));
      state.members.push(mk('P','PINAR',{'${S}':{enrolled:true},'${T}':{enrolled:true}},{joinDate:'${T}-03'}));
      const a=state.members.find(m=>m.id==='A'); a.monthly['${S}']={enrolled:true,totalPrice:1687.5,__prorata:true,sessionsOverride:3};
      const k=state.members.find(m=>m.id==='K'); k.monthly['${S}']={enrolled:true,totalPrice:1687.5,__prorata:true,sessionsOverride:3};
      state.lessons.filter(l=>l.groupId==='NG'&&l.status==='planned').forEach(l=>l.memberIds=['N1','N2','N3','A','K']);
      state.lessons.push({id:'LK',groupId:'NG',instructorId:'G',date:'${T}-02',time:'10:00',durationMin:45,status:'completed',memberIds:['N1','N2','N3','K'],packageMonth:'${S}',packageOwnerType:'group',packageOwnerId:'NG',size:4});
      state.lessons.push({id:'LE',groupId:null,instructorId:'I',date:'${S}-20',time:'13:00',durationMin:45,status:'completed',memberIds:['E'],packageMonth:'${S}',packageOwnerType:'member',packageOwnerId:'E',size:1});
      state.payments.push({id:'PP',memberId:'P',groupId:'NG',packageMonth:'${S}',date:'${T}-04',amount:1000}); })()`;
  const scan=(w)=>(typeof w.__spillJoinUndecidedScan195==='function') ? w.__spillJoinUndecidedScan195() : null;
  { const w=boot(); await tick(1200); w.eval(FX); w.eval(BOZ);
    const hits=scan(w);
    t('tarama: A, R, E (karari yok + ders yapmamis + odememis); Kumis ve Pinar YOK', Array.isArray(hits) && hits.map(h=>h.mid).join(',')==='A,R,E' && hits.every(h=>h.S===S && h.gid==='NG'), JSON.stringify(hits));
    t('tarama: A ve R\'nin Eylul\'de baska kaydi yok, E\'nin var (bireysel ders + elle fiyat)', Array.isArray(hits) && hits.length===3 && hits[0].other===false && hits[1].other===false && hits[2].other===true, JSON.stringify(hits));
    w.__repairAns='remove'; w.__msgs=[];
    if (typeof w.__offerSpillJoinRepair191==='function') await w.__offerSpillJoinRepair191(); await tick(200);
    const rq=w.__msgs.filter(m=>/listesinden çıkarılsın mı\?/.test(m));
    t('onarim sorusu 3 kez (A, R, E sirasiyla)', rq.length===3 && /AYSE KAYA/.test(rq[0]) && /RANA/.test(rq[1]) && /ESRA/.test(rq[2]), JSON.stringify(rq).slice(0,500));
    t('A sorusu: grup adi, "3 planlı derste", "Eylül kaydı da kaldırılır"', /NURAY GRUBU/.test(rq[0]||'') && /3 planlı derste/.test(rq[0]||'') && /kaydı da kaldırılır/.test(rq[0]||''), rq[0]);
    t('E sorusu: "diğer kaydı korunur"', /diğer kaydı korunur/.test(rq[2]||''), rq[2]);
    t('Cikar → Eylul kadrosu K,N1,N2,N3,P (A,R,E cikti; Kumis ve Pinar kaldi)', rosterS(w,'NG')===JSON.stringify(['K','N1','N2','N3','P']), rosterS(w,'NG'));
    t('Cikar → gelecek Eylul-paketi derslerinden A cikti, K kaldi', plannedS(w,'NG')===JSON.stringify(['K,N1,N2,N3','K,N1,N2,N3','K,N1,N2,N3']), plannedS(w,'NG'));
    t('Cikar → yapilmis 02.10 dersine dokunulmadi', J(w,`state.lessons.find(l=>l.id==='LK').memberIds`)===JSON.stringify(['N1','N2','N3','K']));
    t('Cikar → AYSE: Eylul kaydi TAMAMEN kalkti (oneri fiyati 1.687,5 + hak 3 dahil) — Eylul listesinde hayalet borc YOK', w.eval(`state.members.find(m=>m.id==='A').monthly['${S}']===undefined`), J(w,`state.members.find(m=>m.id==='A').monthly`));
    t('Cikar → AYSE Eylul\'de hicbir birimde degil (aktif degil)', w.eval(`__memberActiveInMonth(state.members.find(m=>m.id==='A'),'${S}')`)===false);
    t('Cikar → AYSE Ekim kadrosunda ve Ekim kayitli KALDI', activeT(w,'NG').includes('"A"') && w.eval(`state.members.find(m=>m.id==='A').monthly['${T}'].enrolled===true`), activeT(w,'NG'));
    t('Cikar → RANA: Eylul kaydi kalkti, pasif donemi Temmuz→EKIM\'e geri uzadi (Eylul\'de pasif)', J(w,`state.members.find(m=>m.id==='R').archivePeriods`)===JSON.stringify([{from:'2026-07',to:T,reason:''}]) && w.eval(`state.members.find(m=>m.id==='R').monthly['${S}']===undefined`) && w.eval(`isMemberInactiveInMonth(state.members.find(m=>m.id==='R'),'${S}')`)===true && w.eval(`isMemberInactiveInMonth(state.members.find(m=>m.id==='R'),'${T}')`)===false, J(w,`state.members.find(m=>m.id==='R').archivePeriods`));
    t('Cikar → ESRA: kadrodan cikti ama Eylul bireysel kaydi + fiyati KORUNDU', J(w,`state.members.find(m=>m.id==='E').monthly['${S}']`)===JSON.stringify({enrolled:true,totalPrice:4500}) && w.eval(`__hasIndividualUnit179('E','${S}')`)===true, J(w,`state.members.find(m=>m.id==='E').monthly['${S}']`));
    t('Cikar → karar no kaydedildi (A, R, E)', decision(w,'NG','A')==='no' && decision(w,'NG','R')==='no' && decision(w,'NG','E')==='no');
    t('Kumis\'in Eylul kaydi ve Pinar\'in odemesi aynen', J(w,`state.members.find(m=>m.id==='K').monthly['${S}']`)===JSON.stringify({enrolled:true,totalPrice:1687.5,__prorata:true,sessionsOverride:3}) && w.eval("state.payments.length")===1);
    t('ikinci tarama 0 (idempotent)', scan(w).length===0, JSON.stringify(scan(w)));
    t('Geri Al yedegi alindi (Onarım)', w.eval("(__undoStack||[]).some(s=>/Onarım/.test(s.label))"));
    t('bir sonraki acilista tekrar sorulmaz', w.eval('__spillRepairAsked191')===true);
  }
  { const w=boot(); await tick(1200); w.eval(FX); w.eval(BOZ); w.__repairAns='keep';
    if (typeof w.__offerSpillJoinRepair191==='function') await w.__offerSpillJoinRepair191(); await tick(200);
    t('Kalsin → hicbir sey degismedi', rosterS(w,'NG')===JSON.stringify(['A','E','K','N1','N2','N3','P','R']) && plannedS(w,'NG')===JSON.stringify(['A,K,N1,N2,N3','A,K,N1,N2,N3','A,K,N1,N2,N3']) && w.eval(`state.members.find(m=>m.id==='A').monthly['${S}'].sessionsOverride`)===3 && J(w,`state.members.find(m=>m.id==='R').archivePeriods`)===JSON.stringify([{from:'2026-07',to:S,reason:''}]), rosterS(w,'NG'));
    t('Kalsin → karar yes kaydedildi (A,R,E), tarama 0', decision(w,'NG','A')==='yes' && decision(w,'NG','R')==='yes' && decision(w,'NG','E')==='yes' && scan(w).length===0);
  }
  { const w=boot(); await tick(1200); w.eval(FX); w.eval(BOZ); w.__repairAns=null;
    if (typeof w.__offerSpillJoinRepair191==='function') await w.__offerSpillJoinRepair191(); await tick(200);
    t('Sonra → degisiklik yok, karar yok, tarama hala 3', rosterS(w,'NG').includes('"A"') && decision(w,'NG','A')==='' && scan(w).length===3);
  }
  { const w=boot(); await tick(1200); w.eval(FX);
    t('saglam veride tarama 0', scan(w)!==null && scan(w).length===0, JSON.stringify(scan(w)));
    w.eval(`(function(){ const g=state.groups.find(x=>x.id==='OG'); g.monthlyMembers['2026-06']=['B2','O1','O2','K']; g.memberJoinDates.K='2026-07-10'; })()`);
    t('v186 oncesi aylar (Haziran) taranmaz — eski veri sorulmaz', scan(w).length===0, JSON.stringify(scan(w)));
  }
  console.log('[8] Yeni akista "Evet" denen uye onarimda SORULMAZ (karar kayitli)');
  { const w=boot(); await tick(1200); w.eval(FX); w.__spillAns='yes'; await addViaModal(w,'NG','A');
    t('Evet sonrasi tarama 0', scan(w).length===0, JSON.stringify(scan(w)));
    w.__msgs=[]; w.__repairAns='remove'; if (typeof w.__offerSpillJoinRepair191==='function') await w.__offerSpillJoinRepair191(); await tick(200);
    t('acilis onarimi soru sormadi, A Eylul kadrosunda kaldi', !w.__msgs.some(m=>/çıkarılsın mı/.test(m)) && rosterS(w,'NG').includes('"A"'), JSON.stringify(w.__msgs).slice(0,200));
  }

  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST COKTU',e);process.exit(2);}},50);
