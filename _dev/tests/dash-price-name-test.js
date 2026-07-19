// v.40 — 3 duzeltme: (A) dashboard AKTIF UYE ay-bazli enrolled, (B) grup uyesi KENDI fiyati (ownPrice),
// (C) uyelik degisince grup adi HER ZAMAN uye-adlarina doner (bayat adlar iyilesir).
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

setTimeout(function(){ try {
  w.eval("['renderMembers','renderGroups','renderCalendar','renderArchive','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen'].forEach(fn=>window[fn]=function(){});");

  console.log('[A] Dashboard AKTIF UYE = secili aya ENROLLED (ay-bazli)');
  w.eval(`state.members=[
    {id:'a1',name:'AKTIF TEMMUZ',joinDate:'2026-01-01',monthly:{'2026-07':{enrolled:true},'2026-06':{enrolled:true}}},
    {id:'a2',name:'PASIF TEMMUZ',joinDate:'2026-01-01',monthly:{'2026-06':{enrolled:true},'2026-07':{enrolled:false}}},
    {id:'a3',name:'HENUZ KATILMADI',joinDate:'2026-08-01',monthly:{}}
  ]; state.groups=[]; state.payments=[]; state.lessons=[];`);
  w.eval("window.__dashMonthUserSet=true; document.getElementById('dash-month').value='2026-07'; renderDashboard();");
  t("Temmuz aktif = 1 (yalniz a1; a2 pasif, a3 katilmadi)", d.getElementById('s-members').textContent==='1', d.getElementById('s-members').textContent);
  w.eval("document.getElementById('dash-month').value='2026-06'; renderDashboard();");
  t("Haziran aktif = 2 (a1+a2)", d.getElementById('s-members').textContent==='2', d.getElementById('s-members').textContent);

  console.log('[B] Grup uyesi KENDI ay-fiyatini gosterir (ownPrice), grup toplami sadece ilk satirda');
  w.eval(`state.members=[
    {id:'m1',name:'CEMAL',joinDate:'2026-01-01',totalPrice:6500,monthly:{'2026-07':{enrolled:true}}},
    {id:'m2',name:'ZEHRA',joinDate:'2026-01-01',totalPrice:6500,monthly:{'2026-07':{enrolled:true}}}
  ]; state.groups=[{id:'gP',name:'CEMAL - ZEHRA',size:2,memberIds:['m1','m2'],monthlyNotes:{}}]; state.payments=[]; state.lessons=[];`);
  const rows = w.buildMemberRows('2026-07').filter(r=>r.groupId==='gP' && r.memberId);
  t("grup 2 uye satiri", rows.length===2, rows.length);
  t("her uye ownPrice=6500 (KENDI fiyati)", rows.every(r=>+r.ownPrice===6500), JSON.stringify(rows.map(r=>r.ownPrice)));
  t("grup toplami (totalPrice) yalniz ILK satirda (13000), otekinde bos", (+rows[0].totalPrice===13000) && rows[1].totalPrice==='', JSON.stringify(rows.map(r=>r.totalPrice)));
  // farkli fiyat: CEMAL 8000, ZEHRA 5000
  w.eval("state.members.find(x=>x.id==='m1').totalPrice=8000; state.members.find(x=>x.id==='m2').totalPrice=5000;");
  const rows2 = w.buildMemberRows('2026-07').filter(r=>r.groupId==='gP' && r.memberId);
  t("CEMAL ownPrice=8000, ZEHRA ownPrice=5000 (herkes kendi)", (+rows2.find(r=>r.memberId==='m1').ownPrice===8000)&&(+rows2.find(r=>r.memberId==='m2').ownPrice===5000));
  t("grup toplami ilk satirda 13000 (8000+5000)", +rows2[0].totalPrice===13000, rows2[0].totalPrice);

  console.log('[C] Uyelik degisince grup adi HER ZAMAN uye-adlarina doner (bayat ad iyilesir)');
  w.eval("window.__groupOpsCtxMonth=function(){return '2026-07';};");
  w.eval(`state.members=[
    {id:'h1',name:'HULYA KURT AKTAS',joinDate:'2026-01-01',monthly:{'2026-07':{enrolled:true}}},
    {id:'t1',name:'TANSU BAYDAS',joinDate:'2026-01-01',monthly:{'2026-07':{enrolled:true}}},
    {id:'y1',name:'YENI UYE',joinDate:'2026-01-01',monthly:{}}
  ];`);
  // BAYAT ad: uyelerle uyusmuyor (icinde olmayan isim var)
  w.eval("state.groups=[{id:'gStale',name:'HULYA KURT AKTAS - YUKSEL KARATAS - TANSU BAYDAS',size:3,memberIds:['h1','t1'],monthlyNotes:{}}];");
  w.eval("currentGroupDetailId='gStale'; currentGroupDetailMonth='2026-07'; assignMemberToSlot('y1','gStale',2);");
  // v41: iyilesme AY BAZLI — Temmuz gorunumu guncel uye adlari, Haziran ESKI adi korur
  const gNameJul = w.eval("groupDisplayName(state.groups.find(g=>g.id==='gStale'),'2026-07')");
  t("bayat ad Temmuz'da iyilesti -> guncel uye adlari", gNameJul==='HULYA KURT AKTAS - TANSU BAYDAS - YENI UYE', gNameJul);
  const gNameJun = w.eval("groupDisplayName(state.groups.find(g=>g.id==='gStale'),'2026-06')");
  t("Haziran ESKI adi koruyor (ay izolasyonu)", gNameJun==='HULYA KURT AKTAS - YUKSEL KARATAS - TANSU BAYDAS', gNameJun);

  console.log("\n=== dash-price-name: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
} catch(e){ console.error('HATA', e); process.exit(1); } }, 800);
