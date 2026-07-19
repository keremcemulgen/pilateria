// v2026.07.18.01 — Kerem'in 2026-07-18 sorun seti REGRESYON testleri:
// 5.slot / ay-bazli grup adi / Grubu Duzenle ay-farkindaligi / aydan cikarma-ekleme kaskadi /
// hoca ucreti /8 kanonu / yanan ders beyaz-siyah / hoca ders-bazli dokum / kadro normalizasyonu
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
  w.eval('window.S=()=>state;');
  w.eval("['renderMembers','renderGroups','renderDashboard','renderCalendar','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen'].forEach(fn=>window[fn]=window[fn]||function(){}); ['renderMembers','renderGroups','renderDashboard','renderCalendar','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen'].forEach(fn=>window[fn]=function(){});");

  console.log('[1] 5. SLOT BUG: bos slotlar grup boyutunu ASAMAZ');
  w.eval(`state.members=[
    {id:'a',name:'AYSE YILMAZ',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4000}}},
    {id:'b',name:'BANU DEMIR',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4500}}},
    {id:'c',name:'CEREN AK',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}}},
    {id:'e',name:'ELIF SU',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}}},
    {id:'f',name:'FUNDA KAR',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}}}
  ]; state.lessons=[]; state.payments=[];
  state.groups=[{id:'g1',name:autoGroupName(['a','b','c','e']),size:4,memberIds:['a','b','c','e','',''],defaultInstructorId:'',defaultPackageId:'',defaultTime:'10:00',defaultDays:[2],packages:[],rescheduleUsed:0,cancelUsed:0,monthlyNotes:{}}];`);
  {
    const rows = w.buildMemberRows('2026-07').filter(r=>r.groupId==='g1');
    t('4 kisilik grupta TAM 4 slot gorunur (5.-6. bos slot YOK)', rows.length===4, rows.length);
    w.eval('applyV10MigrationToState(state);');
    t('normalizasyon: memberIds boyut-ustu bos slotlari temizledi', w.S().groups[0].memberIds.length===4, JSON.stringify(w.S().groups[0].memberIds));
    // cift kayit temizligi
    w.eval("state.groups[0].memberIds=['a','b','a','c']; applyV10MigrationToState(state);");
    const mm = w.S().groups[0].memberIds;
    t('cift kayit -> tek (ikincisi bos slota doner)', mm.filter(x=>x==='a').length===1, JSON.stringify(mm));
    w.eval("state.groups[0].memberIds=['a','b','c','e'];");
  }

  console.log('[2] DOLU SLOTA EKLEME once BOS slota oturur (tasma yok)');
  {
    w.eval("state.groups[0].memberIds=['a','b','','e'];");
    w.eval("window.__groupOpsCtxMonth=function(){return '2026-07';};");
    w.assignMemberToSlot('f','g1',0); // slot 0 DOLU (a) -> f bos slota (index 2) oturmali
    const ids = w.S().groups[0].memberIds;
    t('f bos slota yerlesti, boyut asilmadi', ids.length===4 && ids.includes('f') && ids[0]==='a', JSON.stringify(ids));
  }

  console.log('[3] GRUP ADI AY BAZLI');
  {
    w.eval("state.groups[0].memberIds=['a','b']; state.groups[0].size=2; delete state.groups[0].monthlyNames; state.groups[0].monthlyMembers={'2026-06':['a','c']}; state.groups[0].name=autoGroupName(['a','c']);");
    const g = w.S().groups[0];
    t('Haziran gorunumu Haziran kadrosunun adi', w.groupDisplayName(g,'2026-06')===w.autoGroupName(['a','c']), w.groupDisplayName(g,'2026-06'));
    t('Temmuz gorunumu Temmuz kadrosunun adi (otomatik turetme)', w.groupDisplayName(g,'2026-07')===w.autoGroupName(['a','b']), w.groupDisplayName(g,'2026-07'));
    w.eval("__setGroupMonthlyName(state.groups[0],'2026-07','OZEL TEMMUZ ADI');");
    t('Temmuzda elle ad -> Temmuz/Agustos OZEL', w.groupDisplayName(g,'2026-07')==='OZEL TEMMUZ ADI' && w.groupDisplayName(g,'2026-08')==='OZEL TEMMUZ ADI');
    t('elle Temmuz adi HAZIRANI DEGISTIRMEDI', w.groupDisplayName(g,'2026-06')===w.autoGroupName(['a','c']), w.groupDisplayName(g,'2026-06'));
    w.eval("__autoNameAfterRosterChange(state.groups[0],'2026-07');");
    t('uyelik degisiminde Temmuz adi uye adlarina doner', w.groupDisplayName(g,'2026-07')===w.autoGroupName(['a','b']));
    t('Haziran yine korunur', w.groupDisplayName(g,'2026-06')===w.autoGroupName(['a','c']));
  }

  console.log('[4] AYDAN CIKARMA: dersler temizlenir, senkron GERI GETIRMEZ, aya-ekleme GERI GETIRIR');
  {
    w.eval(`state.groups[0].memberIds=['a','b']; state.groups[0].monthlyMembers={}; state.groups[0].size=2;
    state.lessons=[
      {id:'LJ1',date:'2026-07-21',time:'10:00',durationMin:45,instructorId:'',size:2,memberIds:['a','b'],groupId:'g1',packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'g1',status:'planned',note:''},
      {id:'LJ2',date:'2026-07-08',time:'10:00',durationMin:45,instructorId:'',size:2,memberIds:['a','b'],groupId:'g1',packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'g1',status:'completed',note:''},
      {id:'LH1',date:'2026-07-02',time:'10:00',durationMin:45,instructorId:'',size:2,memberIds:['a','b'],groupId:'g1',packageMonth:'2026-06',packageOwnerType:'group',packageOwnerId:'g1',status:'planned',note:''}
    ];`);
    const ok = w.removeMemberFromMonth('b','2026-07');
    t('cikarma tamam', ok===true);
    t('Temmuz PLANLI dersten cikti', !w.S().lessons.find(l=>l.id==='LJ1').memberIds.includes('b'));
    t('YAPILMIS ders TARIHSEL korunur', w.S().lessons.find(l=>l.id==='LJ2').memberIds.includes('b'));
    t('HAZIRAN paketinin dersi korunur (ay izolasyonu)', w.S().lessons.find(l=>l.id==='LH1').memberIds.includes('b'));
    w.eval("syncGroupLessonsToRoster('g1','2026-07');");
    t('kadro senkronu cikarilan uyeyi GERI GETIRMEZ (v41 kok fix)', !w.S().lessons.find(l=>l.id==='LJ1').memberIds.includes('b'), JSON.stringify(w.S().lessons.find(l=>l.id==='LJ1').memberIds));
    w.addMemberToMonth('b','2026-07');
    t('aya geri ekleme dersi OTOMATIK gunceller (kaskad)', w.S().lessons.find(l=>l.id==='LJ1').memberIds.includes('b'), JSON.stringify(w.S().lessons.find(l=>l.id==='LJ1').memberIds));
  }

  console.log('[5] GRUBU DUZENLE ay-farkindaligi (isaretler + baseline)');
  {
    w.removeMemberFromMonth('b','2026-07'); // b yine Temmuzdan cikti
    w.eval("currentGroupDetailId=null;currentGroupDetailMonth='';");
    const mmSel = d.getElementById('member-month'); if (mmSel) mmSel.value='2026-07';
    w.openGroupModal('g1');
    t('baslikta ay var', (d.getElementById('mg-title').textContent||'').includes('2026-07'), d.getElementById('mg-title').textContent);
    const checkedIds=[...d.querySelectorAll('#mg-members input.gm-mc:checked')].map(x=>x.value);
    t('cikarilan uye ISARETLI DEGIL', !checkedIds.includes('b'), JSON.stringify(checkedIds));
    t('aktif uye isaretli', checkedIds.includes('a'));
    t('baseline o ayin kadrosu', JSON.stringify(w.eval('window.__groupEditBaselineIds'))===JSON.stringify(['a']), JSON.stringify(w.eval('window.__groupEditBaselineIds')));
  }

  console.log('[6] SAVEGROUP DELTA: isaret degisikligi yalniz DELTA uygular, gizli uyeyi EZMEZ');
  {
    // modal acik: a isaretli, b yok (ayda pasif). f'yi de isaretleyip kaydet -> a,f aktif; b kadroda ('' gizli) DURUR, Haziran etkilenmez
    w.eval("state.groups[0].monthlyMembers={'2026-06':['a','c']};");
    const box = d.getElementById('mg-members');
    box.insertAdjacentHTML('beforeend', '<input type="checkbox" class="gm-mc" value="f" checked>');
    d.getElementById('mg-size').value='3';
    w.saveGroup();
    const g=w.S().groups[0];
    t('f kadroya eklendi + enrolled', g.memberIds.includes('f') && w.isMemberEnrolledInMonth('f','2026-07'));
    t('b kadrodan SILINMEDI (ayda gizliydi)', g.memberIds.includes('b'), JSON.stringify(g.memberIds));
    t('Haziran kadrosu AYNEN', JSON.stringify(g.monthlyMembers['2026-06'])===JSON.stringify(['a','c']), JSON.stringify(g.monthlyMembers['2026-06']));
    t('b Temmuzda hala pasif (delta onu ellemez)', !w.isMemberEnrolledInMonth('b','2026-07'));
  }

  console.log('[7] DERS MODALI: grup dersinde aydan cikarilan uye LISTELENMEZ');
  {
    const sel = d.getElementById('ml-group');
    sel.innerHTML = '<option value="g1" selected>g1</option>'; sel.value='g1';
    d.getElementById('ml-id').value=''; const mld=d.getElementById('ml-date'); if(mld) mld.value='2026-07-21';
    w.eval("window.__lessonCtxMonth='2026-07';");
    w.renderLessonMembersCheckboxes([]);
    const namesHtml = d.getElementById('ml-members').innerHTML;
    t('aktif uye (AYSE) listede', namesHtml.includes('AYSE YILMAZ'));
    t('aydan cikarilan (BANU) listede DEGIL', !namesHtml.includes('BANU DEMIR'), 'BANU listede olmamali');
  }

  console.log('[8] HOCA UCRETI /8 KANONU');
  {
    w.eval(`state.instructors=[{id:'h1',name:'HOCA BIR',shareRate:30}]; state.settings.instructorShareRate=30;
    state.members.find(x=>x.id==='a').packages=[{month:'2026-07',startDate:'2026-07-01',sessions:4,price:9999,status:'active'}];
    state.members.find(x=>x.id==='a').monthly['2026-07'].totalPrice=8500;
    state.groups[0].packages=[{month:'2026-07',startDate:'2026-07-01',sessions:4,price:77777,status:'active'}];
    state.lessons=[
      {id:'LI',date:'2026-07-10',time:'11:00',durationMin:45,instructorId:'h1',size:1,memberIds:['a'],groupId:'',packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'a',status:'completed',note:''},
      {id:'LG',date:'2026-07-11',time:'12:00',durationMin:45,instructorId:'h1',size:3,memberIds:['a','f'],groupId:'g1',packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'g1',status:'completed',note:''}
    ];`);
    const LI=w.S().lessons.find(l=>l.id==='LI'), LG=w.S().lessons.find(l=>l.id==='LG');
    t('bireysel: 8500/8=1062.5 (sessions=4 olsa bile /8)', Math.abs(w.perLessonPriceForLesson(LI)-1062.5)<0.01, w.perLessonPriceForLesson(LI));
    t('bireysel hoca payi 1062.5x0.30=318.75', Math.abs(w.instructorEarningForLesson(LI)-318.75)<0.01, w.instructorEarningForLesson(LI));
    const gBase = w.groupExpectedTotal(w.S().groups[0],'2026-07');
    t('grup ders ucreti = uye toplami('+gBase+')/8 (stale 77777 paket fiyati DEGIL)', Math.abs(w.perLessonPriceForLesson(LG)-gBase/8)<0.01, w.perLessonPriceForLesson(LG));
    t('grup hoca payi = /8 x %30', Math.abs(w.instructorEarningForLesson(LG)-gBase/8*0.30)<0.01, w.instructorEarningForLesson(LG));
  }

  console.log('[9] HOCALAR SAYFASI: ders bazli dokum');
  {
    w.eval("__instructorMonth='2026-07';");
    let el=d.getElementById('instructor-list');
    if(!el){ el=d.createElement('div'); el.id='instructor-list'; d.body.appendChild(el); }
    w.renderInstructors();
    const ih = el.innerHTML;
    t('"Ders Bazlı Hakediş" bolumu var', ih.includes('Ders Bazlı Hakediş'), 'yok');
    t('dokumde grup adi + tutar satiri var', ih.includes('👯') && ih.includes('÷8'), 'yok');
  }

  console.log('[10] YANAN DERS BEYAZ/SIYAH stili');
  {
    t('.gst-missed beyaz zemin', html.includes('.gst-missed { background:#ffffff; color:#000000;'));
    t('ay-chip missed beyaz', html.includes('.gm-chip.gst-missed'));
    t('koyu temada da beyaz kalir', html.includes('[data-theme="dark"] .gst-missed'));
  }

  console.log('[11] OTOMATIK DERS-DURUMU YOK (guvence)');
  {
    w.eval("state.lessons.push({id:'LP',date:'2026-07-01',time:'09:00',durationMin:45,instructorId:'h1',size:1,memberIds:['a'],groupId:'',packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'a',status:'planned',note:''});");
    w.eval("autoCompletePackages(); save();");
    t('gecmis tarihli PLANLI ders kendiliginden yapildi OLMAZ', w.S().lessons.find(l=>l.id==='LP').status==='planned', w.S().lessons.find(l=>l.id==='LP').status);
  }

  console.log('[12] v42: GRUP ADI aydan cikarilan uyeyi ICERMEZ');
  {
    w.eval("state.groups[0].memberIds=['a','b']; state.groups[0].size=2; delete state.groups[0].monthlyNames; state.groups[0].monthlyMembers={}; state.groups[0].name=autoGroupName(['a','b']);");
    w.removeMemberFromMonth('b','2026-07');
    const g=w.S().groups[0];
    t('Temmuz adi sadece aktif uye', w.groupDisplayName(g,'2026-07')===w.autoGroupName(['a']), w.groupDisplayName(g,'2026-07'));
    w.addMemberToMonth('b','2026-07');
    t('geri ekleyince ad iki uyeli', w.groupDisplayName(g,'2026-07')===w.autoGroupName(['a','b']), w.groupDisplayName(g,'2026-07'));
  }

  console.log('[13] v42: ONARIM — eski surumden kalan kirli PLANLI dersler temizlenir');
  {
    w.removeMemberFromMonth('b','2026-07');
    w.eval(`state.lessons.push(
      {id:'DL1',date:'2026-07-22',time:'10:00',durationMin:45,instructorId:'',size:2,memberIds:['a','b'],groupId:'g1',packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'g1',status:'planned',note:''},
      {id:'DL2',date:'2026-07-09',time:'10:00',durationMin:45,instructorId:'',size:2,memberIds:['a','b'],groupId:'g1',packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'g1',status:'completed',note:''},
      {id:'DL3',date:'2026-07-23',time:'11:00',durationMin:45,instructorId:'',size:1,memberIds:['b'],groupId:'',packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'b',status:'planned',note:''}
    );`);
    w.eval('applyV10MigrationToState(state);');
    t('kirli planli GRUP dersinden dustu', !w.S().lessons.find(l=>l.id==='DL1').memberIds.includes('b'), JSON.stringify(w.S().lessons.find(l=>l.id==='DL1').memberIds));
    t('YAPILMIS ders tarihsel korunur', w.S().lessons.find(l=>l.id==='DL2').memberIds.includes('b'));
    const dl3=w.S().lessons.find(l=>l.id==='DL3');
    t('bos kalan bireysel planli ders IPTAL oldu', dl3.status==='cancelled' && dl3.memberIds.length===0, dl3.status);
  }

  console.log('[14] v42: BOS slot satirinda tarih yok');
  {
    w.eval("state.groups[0].packageStartDate='2026-07-10';");
    const er = w.buildMemberRows('2026-07').find(r=>r.groupId==='g1' && r.isEmpty);
    t('bos slotta pkgStart/pkgEnd BOS', !!er && er.pkgStart==='' && er.pkgEnd==='', er && (er.pkgStart+'/'+er.pkgEnd));
  }

  console.log('[15] v42: PLANLI ders GRI/SIYAH stili');
  {
    t('.gst-planned gri zemin siyah yazi', html.includes('.gst-planned   { background:#e9e9e9; color:#000000;'));
    t('ay-chip planned gri', html.includes('.gm-chip.gst-planned'));
    t('koyu temada da gri/siyah', html.includes('[data-theme="dark"] .gst-planned'));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('HATA', e); process.exit(1); } }, 1500);
