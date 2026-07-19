// v.28 KOK: bireysel uye ay-fiyati TEK KAYNAK (memberMonthlyTotalPrice); stale paket-kaydi fiyati (14000) kullanilmaz
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const cloud = process.env.PIL_STATE ? JSON.parse(fs.readFileSync(process.env.PIL_STATE,'utf-8')) : null;
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
}});
const w=dom.window;
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
setTimeout(function(){try{
  console.log('[1] DIVERGENT: kayit 14000 ama totalPrice/tip 8500 -> hakedis+fiyat 8500 kullanir');
  w.eval("state.packageTypes=[{id:'gb',name:'GB',price:8500,sessions:8}]; state.members=[{id:'M1',name:'X',totalPrice:8500,defaultPackageId:'gb',monthly:{'2026-07':{}},packages:[{month:'2026-07',price:14000,sessions:8,status:'active',startDate:'2026-07-01'}]}]; state.instructors=[{id:'H1',name:'H'}]; state.settings.instructorShareRate=30;");
  t("memberMonthlyTotalPrice = 8500 (tek kaynak)", w.eval("memberMonthlyTotalPrice('M1','2026-07')")===8500, w.eval("memberMonthlyTotalPrice('M1','2026-07')"));
  var per=w.eval("perLessonPriceForLesson({id:'L',packageOwnerType:'member',packageOwnerId:'M1',packageMonth:'2026-07',size:1})");
  t("per-lesson fiyat 8500/8=1062.5 (14000 DEGIL)", per===1062.5, per);
  var earn=w.eval("instructorEarningForLesson({id:'L',packageOwnerType:'member',packageOwnerId:'M1',packageMonth:'2026-07',size:1,instructorId:'H1',status:'completed',date:'2026-07-05',memberIds:['M1']})");
  t("hoca hakedisi = 1062.5*0.30 = 318.75 (14000 uzerinden 525 DEGIL)", earn===318.75, earn);

  console.log('[2] UZADI paket -> per-lesson 0');
  w.eval("state.members[0].packages=[{month:'2026-07',price:8500,sessions:8,status:'extended',startDate:'2026-07-01'}];");
  t("uzadi -> per-lesson 0", w.eval("perLessonPriceForLesson({id:'L',packageOwnerType:'member',packageOwnerId:'M1',packageMonth:'2026-07',size:1})")===0);

  console.log('[3] TUTARLI veri (kayit=totalPrice=tip): degismez (no-op)');
  w.eval("state.members=[{id:'M2',name:'Y',totalPrice:7000,defaultPackageId:'gb',monthly:{'2026-06':{}},packages:[{month:'2026-06',price:7000,sessions:8,status:'active',startDate:'2026-06-01'}]}];");
  t("tutarli -> per-lesson 7000/8=875 (degismez)", w.eval("perLessonPriceForLesson({id:'L',packageOwnerType:'member',packageOwnerId:'M2',packageMonth:'2026-06',size:1})")===875);

  if (cloud) {
    console.log('[4] GERCEK HAZIRAN: per-lesson fiyat TEK KAYNAGI (SOT=totalPrice) kullanir, stale kaydi DEGIL');
    w.eval("state = Object.assign(state, "+JSON.stringify({members:cloud.members||[],groups:cloud.groups||[],packageTypes:cloud.packageTypes||[],payments:cloud.payments||[]})+");");
    // stale-kayit ile SOT farkli olan bir bireysel uye bul; per-lesson SOT'u kullanmali
    var chk=w.eval("(function(){ for(var i=0;i<state.members.length;i++){ var m=state.members[i]; if(m.archived) continue; var pkg=memberPackageForMonth(m,'2026-06'); if(!pkg||!(pkg.sessions>0)) continue; var mmt=memberMonthlyTotalPrice(m.id,'2026-06'); var rec=+pkg.price||0; if(mmt!==rec && mmt>0){ var per=perLessonPriceForLesson({id:'L',packageOwnerType:'member',packageOwnerId:m.id,packageMonth:'2026-06',size:1}); return JSON.stringify({name:m.name.slice(0,16),mmt:mmt,rec:rec,per:per,expected:mmt/pkg.sessions}); } } return null; })()");
    if (chk) { var o=JSON.parse(chk);
      t("divergent uye ("+o.name+"): per-lesson SOT("+o.mmt+") kullanir, kayit("+o.rec+") DEGIL", Math.abs(o.per-o.expected)<0.001, "per="+o.per+" beklenen="+o.expected);
    } else { t("divergent uye bulundu", false, "yok"); }
  }

  console.log("\n=== price-consistency: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},700);
