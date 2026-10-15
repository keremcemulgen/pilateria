// v191 (Kerem 14.10, canli IŞIL TİPİOĞLU): ayni kisi ayni ay iki kez. Eylul'de kok kayit Gizem'in grubunda (Eylul
// paketi 01–30.09, odendi), 2. paket klonu Iclal'in grubunda (Eylul paketi 16.09'da basladi, Ekim'e sarkiyor).
// 10.10'da (Ekim) kok kayit Iclal'in grubuna alininca v186 "sarkan pakete katil" kuralı kok kaydi EYLUL kadrosuna da
// yazdi (5. kisi), Eylul hakkini 2 / orantili yapti (Gizem'in Eylul hakedisi siskinlesti), 15/17.10 derslerine klonla
// birlikte iki kez yazdi; Eylul listesinde 4.500 ₺ hayalet borc. KURAL: ayni KISI o pakette zaten varsa, uyenin o ayda
// BASKA birimi varsa ya da paketin kadrosu doluysa sarkan pakete EKLENMEZ — uye yalniz baglam ayindan itibaren grupta.
// + ONARIM: bozuk kayit acilista yoneticiye sorulur (Evet → duzeltilir, Hayir → dokunulmaz).
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__msgs=[]; w.__ans=true;
  w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); if(o&&o.input) return w.__ans ? String(o.input.value) : null; return w.__ans; };
  w.alert=(m)=>{ w.__msgs.push('ALERT:'+m); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
}}).window; }
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
setTimeout(async function(){try{
  const w0=boot(); await tick(1200);
  const T=w0.eval('currentMonth()');
  const sh=(ay,k)=>{const [y,m]=ay.split('-').map(Number);const dt=new Date(y,m-1+k,1);return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');};
  const S=sh(T,-1);
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.settings.reformers=5; state.settings.lessonDuration=45; state.payments=[];
    state.packageTypes=[{id:'p4',name:'4 KİŞİLİK',sessions:8,price:4500}];
    state.instructors=[{id:'G',name:'GIZEM',shareRate:30},{id:'I',name:'ICLAL',shareRate:30}];
    const mk=(id,name,mo,o)=>Object.assign({id,name,joinDate:'2026-01-01',defaultPackageId:'p4',totalPrice:4500,packages:[],monthly:mo},o||{});
    state.members=[
      mk('R','ISIL',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),
      mk('C2','ISIL (2. Paket)',{'${S}':{enrolled:true},'${T}':{enrolled:false}},{secondOfMember:'R',archivePeriods:[{from:'${T}',to:null}]}),
      mk('A','AYSE',{'${S}':{enrolled:true},'${T}':{enrolled:true}}), mk('B','BERNA',{'${S}':{enrolled:true},'${T}':{enrolled:true}}), mk('D','DILA',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),
      mk('GU','GULENAY',{'${T}':{enrolled:true}}),
      mk('N','OZNUR',{'${S}':{enrolled:true},'${T}':{enrolled:true}}), mk('Z','OZLEM',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),
      mk('BU','BUSE',{'${S}':{enrolled:false},'${T}':{enrolled:false}}),
      mk('YE','YENI UYE',{'${T}':{enrolled:true}})];
    state.groups=[
      {id:'GZ',name:'GIZEM GRUBU',size:4,memberIds:['A','B','D','GU'],defaultInstructorId:'G',defaultPackageId:'p4',packages:[{month:'${S}',startDate:'${S}-01',sessions:8,price:18000,status:'completed'}],monthlyMembers:{'${S}':['R','A','B','D']},monthlyNotes:{},memberJoinDates:{GU:'${T}-10'}},
      {id:'IC',name:'ICLAL GRUBU',size:4,memberIds:['BU','N','Z','C2'],defaultInstructorId:'I',defaultPackageId:'p4',packages:[{month:'${S}',startDate:'${S}-16',sessions:8,price:18000,status:'active'}],monthlyMembers:{'${S}':['BU','N','Z','C2']},monthlyNotes:{},memberJoinDates:{Z:'${S}-23',C2:'${S}-23'},monthlyPartials:{'${S}':[{at:'${T}-02',note:'',memberId:'BU',sessions:3,price:1687.5}]}}];
    state.lessons=[]; let n=0; const L=(g,ins,date,st,mids,pm)=>state.lessons.push({id:'L'+(n++),groupId:g,instructorId:ins,date:date,time:'11:00',durationMin:45,status:st,memberIds:mids.slice(),packageMonth:pm,packageOwnerType:'group',packageOwnerId:g,size:4});
    ['01','03','08','11','15','18','22','25'].forEach(d=>L('GZ','G','${S}-'+d,'completed',['R','A','B','D'],'${S}'));
    ['16','18','23'].forEach(d=>L('IC','I','${S}-'+d,'completed',['BU','N','Z','C2'],'${S}'));
    L('IC','I','${S}-26','completed',['N','Z','C2'],'${S}'); L('IC','I','${T}-01','completed',['N','Z','C2'],'${S}'); L('IC','I','${T}-03','completed',['N','Z','C2'],'${S}');
    L('IC','I','${T}-15','planned',['N','Z','C2'],'${S}'); L('IC','I','${T}-17','planned',['N','Z','C2'],'${S}');
    document.getElementById('member-month').innerHTML='<option value="${T}">${T}</option><option value="${S}">${S}</option>'; document.getElementById('member-month').value='${T}';`;
  const J=(w,e)=>w.eval('JSON.stringify('+e+')');
  const plannedS=(w)=>J(w,"state.lessons.filter(l=>l.groupId==='IC'&&l.status==='planned').map(l=>l.memberIds.slice().sort().join(','))");

  console.log('[1] CANLI SENARYO: Ekim'+"'"+'de kok kayit ISIL, Iclal grubuna eklenir (Eylul paketi sarkiyor, klonu zaten icinde)');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval(`openGroupDetail('IC','${T}')`); await tick(); w.eval(`openGroupModal('IC')`); await tick();
    const cb=w.document.querySelector('#mg-members input.gm-mc[value="R"]'); t('grup penceresinde ISIL (kok) secilebilir', !!cb);
    if (cb) cb.checked=true;
    w.eval('saveGroup()'); await tick(400);
    t('Ekim kadrosunda ISIL (kok) VAR', w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='IC'),'${T}').includes('R')`)===true, J(w,`activeGroupRosterForMonth(state.groups.find(g=>g.id==='IC'),'${T}')`));
    t('Eylul (sarkan paket) kadrosuna ISIL kok YAZILMADI — klonu zaten orada', !J(w,`(state.groups.find(g=>g.id==='IC').monthlyMembers['${S}']||[])`).includes('"R"'), J(w,`state.groups.find(g=>g.id==='IC').monthlyMembers`));
    t('Eylul aktif kadro N,Z,C2 (3 kisi + Buse payi)', J(w,`activeGroupRosterForMonth(state.groups.find(g=>g.id==='IC'),'${S}').slice().sort()`)===JSON.stringify(['C2','N','Z']), J(w,`activeGroupRosterForMonth(state.groups.find(g=>g.id==='IC'),'${S}')`));
    t('ISIL kokun EYLUL kaydina hak/orantili YAZILMADI (Gizem paketi bozulmaz)', J(w,`state.members.find(m=>m.id==='R').monthly['${S}']`)===JSON.stringify({enrolled:true}), J(w,`state.members.find(m=>m.id==='R').monthly['${S}']`));
    t('Eylul paketi icin "kalan derse gore ucret" SORULMADI', !w.__msgs.some(m=>/ISIL/.test(m) && /paketinde/.test(m) && /kald/.test(m)), JSON.stringify(w.__msgs.filter(m=>/paketinde/.test(m))));
    t('15/17 planli Eylul-paketi derslerinde ISIL iki kez YOK (yalniz klon)', plannedS(w)===JSON.stringify(['C2,N,Z','C2,N,Z']), plannedS(w));
    const base=w.eval("perLessonPriceForLesson(state.lessons.find(l=>l.groupId==='GZ'))");
    t('Gizem Eylul dersi taban 2.250 (4×562,5) — sisme YOK', Math.round(base)===2250, base);
  }

  console.log('[2] ONARIM: canlidaki bozuk durum acilista yoneticiye sorulur; Evet → duzeltilir');
  const BOZ=`(function(){ const g=state.groups.find(x=>x.id==='IC'); g.monthlyMembers['${S}']=['BU','N','Z','C2','R']; g.memberIds=['BU','N','Z','C2','R']; g.memberJoinDates.R='${T}-10';
      const r=state.members.find(m=>m.id==='R'); r.monthly['${S}']={enrolled:true,__prorata:true,sessionsOverride:2,totalPrice:4500};
      state.lessons.filter(l=>l.groupId==='IC'&&l.status==='planned').forEach(l=>l.memberIds=['N','Z','C2','R']); })()`;
  { const w=boot(); await tick(1200); w.eval(FX); w.eval(BOZ);
    const b0=w.eval("perLessonPriceForLesson(state.lessons.find(l=>l.groupId==='GZ'))");
    t('on kosul: bozuk halde Gizem tabani sismis (3.938)', Math.round(b0)===3938, b0);
    const hits = (typeof w.__spillJoinRepairScan191 === 'function') ? w.__spillJoinRepairScan191() : null;
    t('tarayici 1 bozuk kayit buldu', Array.isArray(hits) && hits.length===1, JSON.stringify(hits));
    w.__ans=true; w.__msgs=[];
    if (typeof w.__offerSpillJoinRepair191 === 'function') { await w.__offerSpillJoinRepair191(); } await tick(200);
    t('soru metni kisiyi, grubu ve yapilacaklari soyluyor', w.__msgs.some(m=>/ISIL/.test(m) && /ICLAL GRUBU|ICLAL/.test(m) && /çıkar/i.test(m)), JSON.stringify(w.__msgs).slice(0,300));
    t('Eylul kadrosundan ISIL kok cikti', !J(w,`state.groups.find(g=>g.id==='IC').monthlyMembers['${S}']`).includes('"R"'), J(w,`state.groups.find(g=>g.id==='IC').monthlyMembers['${S}']`));
    t('Ekim kadrosunda ISIL kok KALDI', w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='IC'),'${T}').includes('R')`)===true);
    t('15/17 planli derslerden ISIL kok cikti (klon kaldi)', plannedS(w)===JSON.stringify(['C2,N,Z','C2,N,Z']), plannedS(w));
    t('Eylul hak 2 / orantili (oneriyle yazilan ucret dahil) kaldirildi — Eylul kaydi (Gizem grubu) korundu, fiyat varsayilan 4.500', J(w,`state.members.find(m=>m.id==='R').monthly['${S}']`)===JSON.stringify({enrolled:true}) && Math.round(w.eval(`memberMonthlyTotalPrice('R','${S}')`))===4500, J(w,`state.members.find(m=>m.id==='R').monthly['${S}']`)); // v195: oneriyle yazilan ucret de geri alinir
    const b1=w.eval("perLessonPriceForLesson(state.lessons.find(l=>l.groupId==='GZ'))");
    t('Gizem Eylul dersi taban tekrar 2.250', Math.round(b1)===2250, b1);
    t('ikinci tarama 0 (idempotent)', w.__spillJoinRepairScan191().length===0);
    t('Geri Al icin yedek alindi', w.eval("(__undoStack||[]).some(s=>/Onarım|onarım/.test(s.label))"));
  }
  { const w=boot(); await tick(1200); w.eval(FX); w.eval(BOZ);
    w.__ans=false; if (typeof w.__offerSpillJoinRepair191 === 'function') { await w.__offerSpillJoinRepair191(); } await tick(200);
    t('Hayir → hicbir sey degismedi', J(w,`state.groups.find(g=>g.id==='IC').monthlyMembers['${S}']`).includes('"R"') && w.eval(`state.members.find(m=>m.id==='R').monthly['${S}'].sessionsOverride`)===2);
  }
  { const w=boot(); await tick(1200); w.eval(FX);
    t('saglam veride tarama 0 (Kumis tipi mesru katilim isaretlenmez)', (typeof w.__spillJoinRepairScan191==='function') && w.__spillJoinRepairScan191().length===0); }

  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST COKTU',e);process.exit(2);}},50);
