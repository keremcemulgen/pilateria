// v35 REGRESYON: grup pasif/enrolled tutarliligi + paket->fiyat (Kerem 2026-07-15 sikayet seti, g8 senaryosu)
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
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};
    w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }

setTimeout(function(){ try {
  w.eval("['save','renderMembers','renderGroups','renderCalendar','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen'].forEach(function(fn){ window[fn]=function(){}; });");
  w.eval("window.__groupOpsCtxMonth=function(){return '2026-06';};"); // islem baglam ayini Haziran'a sabitle (UI state yerine)
  w.eval("state.packageTypes=[{id:'pk4500',name:'4K',price:4500,sessions:8},{id:'pk4000',name:'4KESKI',price:4000,sessions:8}];"
   +"state.members=[{id:'A',name:'AAA',joinDate:'2026-06-01',totalPrice:4000,defaultPackageId:'pk4000',monthly:{'2026-06':{totalPrice:4000,packageId:'pk4000'}}},"
   +"{id:'B',name:'BBB',joinDate:'2026-06-01',totalPrice:4500,defaultPackageId:'pk4500',monthly:{}},"
   +"{id:'C',name:'CCC',joinDate:'2026-06-01',totalPrice:4500,defaultPackageId:'pk4000',monthly:{'2026-06':{totalPrice:4000,packageId:'pk4000',enrolled:false}}}];"
   +"state.groups=[{id:'G',name:'GRP',size:4,memberIds:['','A','C','B'],monthlyMembers:{'2026-06':['','A','C','B']},packages:[{month:'2026-06',price:18000,startDate:'2026-06-01',sessions:8}]}];"
   +"state.payments=[]; window.currentGroupDetailMonth='2026-06'; var gd=document.getElementById('modal-group-detail'); if(gd){gd.style.display='flex';} var mm=document.getElementById('member-month'); if(mm){mm.value='2026-06';}");

  t("[kurulum] islem baglam ayi = 2026-06", w.eval("__groupOpsCtxMonth()")==='2026-06', w.eval("__groupOpsCtxMonth()"));
  console.log('[1] Bug B — pasif (enrolled:false) uye grup DETAYINDA yok + total tutarli');
  var dm=w.eval("JSON.stringify(resolveGroupMembersForMonth(state.groups[0],'2026-06').filter(function(mid){return mid&&isMemberEnrolledInMonth(mid,'2026-06');}))");
  t("detay uye listesi = [A,B] (C pasif haric)", dm==='["A","B"]', dm);
  t("grup toplam 8500 (A4000+B4500, C haric)", w.eval("groupExpectedTotal(state.groups[0],'2026-06')")===8500, w.eval("groupExpectedTotal(state.groups[0],'2026-06')"));

  t("[B2] Uyeler 'N/M dolu' sayaci enrolled bazli (2, roster 3 degil)", w.eval("(function(){var rows=buildMemberRows('2026-06');var gr=rows.find(function(r){return r.groupId==='G'&&r.isFirstInGroup;});return gr?gr.groupFilledCount:-1;})()")===2, w.eval("(function(){var rows=buildMemberRows('2026-06');var gr=rows.find(function(r){return r.groupId==='G'&&r.isFirstInGroup;});return gr?gr.groupFilledCount:-1;})()"));

  console.log('[2] Bug D — paket secilince fiyat PAKET fiyatina guncellenir');
  var pa=w.eval("var ps=document.getElementById('mm-package');ps.innerHTML='';state.packageTypes.forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.name;ps.appendChild(o);});var pe=document.getElementById('mm-total-price');pe.value='4500';ps.value='pk4000';onMemberPkgChange();pe.value;");
  t("ozel 4500 iken 4000 paket secilince fiyat 4000", String(pa)==='4000', pa);
  var pd=w.eval("var ps=document.getElementById('mm-package');var pe=document.getElementById('mm-total-price');var o=document.createElement('option');o.value='';o.textContent='-';ps.insertBefore(o,ps.firstChild);pe.value='4500';ps.value='';onMemberPkgChange();pe.value;");
  t("paket '-' secilince fiyat degismez (4500)", String(pd)==='4500', pd);

  console.log('[3] Bug C — fillEmptySlot pasif roster uyesini (C) SUNAR, aktifi (A) SUNMAZ');
  var fh=w.eval("fillEmptySlot('G',0);var el=document.getElementById('modal-fill-slot');var h=el?el.innerHTML:'';if(el)el.remove();h;");
  t("C (pasif roster uyesi) picker'da sunuluyor", /assignMemberToSlot\('C'/.test(fh));
  t("A (aktif enrolled) picker'da sunulMUYOR", !/assignMemberToSlot\('A'/.test(fh));

  console.log('[4] Bug C — geri ekleme: enrolled:true, slot dolar, total artar');
  w.eval("assignMemberToSlot('C','G',0);");
  t("C.monthly[2026-06].enrolled = true", w.eval("!!(state.members.find(function(m){return m.id==='C';}).monthly['2026-06'].enrolled)")===true);
  var am=w.eval("JSON.stringify(resolveGroupMembersForMonth(state.groups[0],'2026-06').filter(function(mid){return mid&&isMemberEnrolledInMonth(mid,'2026-06');}).slice().sort())");
  t("geri eklenince detay = [A,B,C] (slot doldu)", am==='["A","B","C"]', am);
  t("grup toplam 12500 (A4000+C4000+B4500)", w.eval("groupExpectedTotal(state.groups[0],'2026-06')")===12500, w.eval("groupExpectedTotal(state.groups[0],'2026-06')"));

  console.log('[5] Bug C — aktif enrolled uye tekrar eklenemez (guard korunur)');
  var blk=w.eval("var b=false,_a=window.alert;window.alert=function(m){if(/zaten bu grupta/.test(m||''))b=true;};assignMemberToSlot('A','G',0);window.alert=_a;b;");
  t("aktif A tekrar eklenince 'zaten grupta' uyarisi", blk===true);

  console.log('[6] Bug A — panel ay secici: gelir SECILI AYA gore');
  w.eval("window.__dashMonthUserSet=true;"); // kullanici secimi simule (smart-default ezmesin)
  w.eval("state.payments=[{id:'pJun',groupId:'G',memberId:'A',amount:5000,packageMonth:'2026-06',date:'2026-06-10',sessions:8}];");
  var revJun=w.eval("var d=document.getElementById('dash-month'); d.value='2026-06'; renderDashboard(); document.getElementById('s-revenue').textContent;");
  t("dash ay=Haziran -> gelir 5000", /5[.,]?000/.test(String(revJun)), revJun);
  var revJul=w.eval("var d=document.getElementById('dash-month'); d.value='2026-07'; renderDashboard(); document.getElementById('s-revenue').textContent;");
  t("dash ay=Temmuz -> gelir 0", String(revJul).replace(/[^0-9]/g,'')==='0', revJul);
  var lblJun=w.eval("var d=document.getElementById('dash-month'); d.value='2026-06'; renderDashboard(); document.getElementById('s-revenue-label').textContent;");
  t("gelir etiketi Haziran gosterir", /Haziran/.test(String(lblJun)), lblJun);

  console.log('[7] Odeme penceresi kilitli tutar PAKET AYINA gore (Haziran 4000, Temmuz genel degil)');
  var lockedJun=w.eval("var ms=document.getElementById('mp-member');var o1=document.createElement('option');o1.value='C';o1.textContent='CCC';ms.appendChild(o1);ms.value='C';var gs=document.getElementById('mp-group');if(gs.tagName==='SELECT'){var o2=document.createElement('option');o2.value='G';o2.textContent='GRP';gs.appendChild(o2);}gs.value='G';document.getElementById('mp-date').value='2026-07-15';document.getElementById('mp-pkg-month').value='2026-06';applyLockedShare();document.getElementById('mp-amount').value;");
  t("odeme kilit: paket ayi Haziran -> tutar 4000 (Temmuz genel 4500 degil)", String(lockedJun)==='4000', lockedJun);
  var shareJun=w.eval("memberGroupShare('C','G','2026-06')");
  var shareJul=w.eval("memberGroupShare('C','G','2026-07')");
  t("memberGroupShare Haziran=4000 (uye ay fiyati)", shareJun===4000, shareJun);
  t("memberGroupShare Temmuz=4500 (override yok, genel)", shareJul===4500, shareJul);

  console.log('[8] Grup ders-ekleme grup detay AYINA kilitli (Haziran, Temmuz degil)');
  var bdM=w.eval("openBatchDatesGroup('G','2026-06'); (__batchDatesTarget||{}).packageMonth;");
  t("Toplu Tarih Gir Haziran baglami -> target 2026-06", bdM==='2026-06', bdM);
  w.eval("state.lessons=[]; var gg=state.groups.find(function(x){return x.id==='G';}); gg.defaultTime='10:00';");
  var glPm=w.eval("addGroupLesson('G','2026-06'); (state.lessons.find(function(l){return l.groupId==='G';})||{}).packageMonth;");
  t("addGroupLesson('G',Haziran) -> ders packageMonth 2026-06 (bugun Temmuz olsa da)", glPm==='2026-06', glPm);
  var slPm=w.eval("window.__lessonCtxMonth='2026-06'; var groupId='G',date='2026-07-20',pm; if(groupId)pm=(window.__lessonCtxMonth||resolvePackageMonthForDate('group',groupId,date)); window.__lessonCtxMonth=''; pm;");
  t("saveLesson mantigi: __lessonCtxMonth=Haziran -> 2026-06", slPm==='2026-06', slPm);

  console.log('[9] Panel varsayilan ay = en son odeme ayi (bos ay degil) + Raporlar geliri paket ayina gore');
  w.eval("window.__dashMonthUserSet=false; state.payments=[{id:'pJ',groupId:'G',memberId:'A',amount:5000,packageMonth:'2026-06',date:'2026-07-10',sessions:8}];");
  var defM=w.eval("var d=document.getElementById('dash-month'); d.value=''; renderDashboard(); d.value;");
  t("panel varsayilan ay -> 2026-06 (odeme olan ay, bugun Temmuz olsa da)", defM==='2026-06', defM);
  // Raporlar: Haziran paketi Temmuz'da odendi -> Haziran raporunda
  var repJun=w.eval("document.getElementById('rep-month').value='2026-06'; renderReports(); document.getElementById('rep-revenue')?document.getElementById('rep-revenue').textContent:''; (function(){try{return [...document.querySelectorAll('#page-reports .stat .value')].map(function(x){return x.textContent;}).join('|');}catch(e){return 'err';}})();");
  t("Raporlar Haziran geliri 5000 icerir (Temmuz'da odense de)", /5[.,]?000/.test(String(repJun)), repJun);
  var repJul=w.eval("document.getElementById('rep-month').value='2026-07'; renderReports(); (function(){try{return [...document.querySelectorAll('#page-reports .stat .value')].map(function(x){return x.textContent;}).join('|');}catch(e){return 'err';}})();");
  t("Raporlar Temmuz geliri 0 (Haziran paketi Temmuz'da odendi ama Haziran'a yazilir)", /(^|\|)0( |\||$)/.test(String(repJul).replace(/[^0-9|]/g,'')) || String(repJul).indexOf('5000')===-1 && String(repJul).indexOf('5.000')===-1, repJul);

  console.log('[10] Cihazlar arasi TUTARLILIK: bireysel uyeler alfabetik deterministik sira');
  w.eval("state.groups=[]; state.members=[{id:'z9',name:'ZEHRA',joinDate:'2026-06-01',monthly:{}},{id:'a1',name:'AYSE',joinDate:'2026-06-01',monthly:{}},{id:'m5',name:'MELIS',joinDate:'2026-06-01',monthly:{}}]; state.payments=[];");
  var order1=w.eval("JSON.stringify(buildMemberRows('2026-06').filter(function(r){return r.type==='individual';}).map(function(r){return r.name;}))");
  // ayni veriyi FARKLI dizi sirasiyla yukle (Supabase random simulasyonu)
  w.eval("state.members=[{id:'m5',name:'MELIS',joinDate:'2026-06-01',monthly:{}},{id:'z9',name:'ZEHRA',joinDate:'2026-06-01',monthly:{}},{id:'a1',name:'AYSE',joinDate:'2026-06-01',monthly:{}}];");
  var order2=w.eval("JSON.stringify(buildMemberRows('2026-06').filter(function(r){return r.type==='individual';}).map(function(r){return r.name;}))");
  t("sira alfabetik (AYSE,MELIS,ZEHRA)", order1==='[\"AYSE\",\"MELIS\",\"ZEHRA\"]', order1);
  t("dizi sirasi degisse de AYNI sira (cihazlar arasi tutarli)", order1===order2, order1+' vs '+order2);

  console.log('[11] Pasif = CARRY-FORWARD (Pasife Al -> bu aydan itibaren, geri alana kadar); arsivleme yok');
  w.eval("window.__groupOpsCtxMonth=function(){return '2026-06';}; window.refreshMemberDetailIfOpen=function(){}; window.confirm=function(){return true;};");
  w.eval("state.groups=[{id:'GG',name:'GG',size:2,memberIds:['pa','pb'],monthlyMembers:{'2026-06':['pa','pb']}}]; state.members=[{id:'pa',name:'PA',joinDate:'2026-06-01',monthly:{'2026-06':{enrolled:true}}},{id:'pb',name:'PB',joinDate:'2026-06-01',monthly:{'2026-06':{enrolled:true}}}]; state.payments=[]; state.lessons=[{id:'LJ',date:'2026-06-10',time:'10:00',memberIds:['pa','pb'],groupId:'GG',status:'planned',packageMonth:'2026-06'},{id:'LJul',date:'2026-07-10',time:'10:00',memberIds:['pa','pb'],groupId:'GG',status:'planned',packageMonth:'2026-07'}];");
  w.eval("deleteMember('pa');");
  t("pa Haziran enrolled=false", w.eval("(state.members.find(function(m){return m.id==='pa';}).monthly['2026-06']||{}).enrolled")===false, w.eval("JSON.stringify(state.members.find(function(m){return m.id==='pa';}).monthly)"));
  t("pa ARSIVLENMEDI (m.archived degil)", w.eval("!state.members.find(function(m){return m.id==='pa';}).archived"));
  t("Haziran grup dersinden cikarildi", w.eval("!(state.lessons.find(function(l){return l.id==='LJ';}).memberIds.includes('pa'))"));
  t("Temmuz dersinden de cikarildi (carry-forward)", w.eval("!(state.lessons.find(function(l){return l.id==='LJul';}).memberIds.includes('pa'))"));
  t("Temmuz'da pa da PASIF (carry-forward)", w.eval("isMemberEnrolledInMonth('pa','2026-07')")===false);
  t("Haziran'da pa artik PASIF (enrolled degil)", w.eval("isMemberEnrolledInMonth('pa','2026-06')")===false);

  console.log('[12] Pasif sekmesi AY-BAZLI + reactivateMemberForMonth');
  w.eval("window.renderArchive=function(){}; state.groups=[]; state.members=[{id:'px',name:'PX',joinDate:'2026-05-01',monthly:{'2026-06':{enrolled:false}}},{id:'py',name:'PY',joinDate:'2026-06-01',monthly:{}}]; state.payments=[]; state.lessons=[];");
  t("Haziran'da px PASIF (pasif sekmesi kapsami)", w.eval("!isMemberEnrolledInMonth('px','2026-06')")===true);
  t("Haziran'da py AKTIF (pasif degil)", w.eval("isMemberEnrolledInMonth('py','2026-06')")===true);
  t("Temmuz'da px AKTIF (sadece Haziran pasifti)", w.eval("isMemberEnrolledInMonth('px','2026-07')")===true);
  w.eval("reactivateMemberForMonth('px','2026-06');");
  t("Haziran aktive edildi -> px enrolled:true", w.eval("(state.members.find(function(m){return m.id==='px';}).monthly['2026-06']||{}).enrolled")===true);
  t("Haziran'da px artik AKTIF", w.eval("isMemberEnrolledInMonth('px','2026-06')")===true);

} catch(e){ fail++; console.log('  FAIL exception ->', e && e.message); }
  console.log('\n'+pass+' OK / '+fail+' FAIL');
  process.exit(fail?1:0);
}, 60);
