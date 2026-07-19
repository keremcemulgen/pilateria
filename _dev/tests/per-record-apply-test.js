// v.32 PER-RECORD APPLY: uzaktan gelen bir kayit degisikligi, yerel/in-flight BASKA kaydi EZMEZ (revert kok fix)
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
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
  console.log('[1] REVERT SENARYOSU: yerel X(9999) + uzaktan Y finance degisir -> X KORUNUR, Y guncellenir');
  w.eval("state.members=[{id:'X',name:'X',totalPrice:9999,monthly:{}},{id:'Y',name:'Y',totalPrice:100,monthly:{}}]; state.groups=[]; state.payments=[];");
  w.eval("__sbShadow={ members:{ X:JSON.stringify({id:'X',name:'X',monthly:{}}), Y:JSON.stringify({id:'Y',name:'Y',monthly:{}}) }, member_finance:{ X:JSON.stringify({totalPrice:9999,packages:[]}), Y:JSON.stringify({totalPrice:500,packages:[]}) } };");
  w.eval("sbApplyOne('member_finance','Y');");
  t("Y uzaktan guncellendi (totalPrice 500)", w.eval("state.members.find(m=>m.id==='Y').totalPrice")===500, w.eval("state.members.find(m=>m.id==='Y').totalPrice"));
  t("X EZILMEDI (yerel 9999 KORUNDU)", w.eval("state.members.find(m=>m.id==='X').totalPrice")===9999, w.eval("state.members.find(m=>m.id==='X').totalPrice"));
  t("uye SAYISI degismedi (2)", w.eval("state.members.length")===2);

  console.log('[2] member base degisikligi (isim) yalniz o uyeyi gunceller');
  w.eval("__sbShadow.members.Y=JSON.stringify({id:'Y',name:'YENI-AD',monthly:{}}); sbApplyOne('members','Y');");
  t("Y ismi guncellendi (YENI-AD)", w.eval("state.members.find(m=>m.id==='Y').name")==='YENI-AD');
  t("Y finance korundu (500)", w.eval("state.members.find(m=>m.id==='Y').totalPrice")===500);
  t("X hala 9999", w.eval("state.members.find(m=>m.id==='X').totalPrice")===9999);

  console.log('[3] lessons/payments dogrudan; yeni kayit eklenir');
  w.eval("state.lessons=[{id:'L1',date:'2026-07-01'}]; __sbShadow.lessons={L1:JSON.stringify({id:'L1',date:'2026-07-01'}),L2:JSON.stringify({id:'L2',date:'2026-07-05'})}; sbApplyOne('lessons','L2');");
  t("yeni ders L2 eklendi", w.eval("state.lessons.some(l=>l.id==='L2')"));
  t("L1 korundu", w.eval("state.lessons.some(l=>l.id==='L1')"));

  console.log('[4] DELETE: shadow kaydi silinince state\'ten cikar');
  w.eval("delete __sbShadow.members.X; sbApplyOne('members','X');");
  t("X silindi (shadow yok -> state\\'ten cikti)", !w.eval("state.members.some(m=>m.id==='X')"));
  t("Y hala duruyor", w.eval("state.members.some(m=>m.id==='Y')"));

  console.log('[5] Kod: realtime per-record (tum-state rebuild YOK)');
  t("sbApplyOne fonksiyonu var", w.eval("typeof sbApplyOne")==='function');
  t("realtime handler sbApplyOne cagirir", /try \{ sbApplyOne\(t, __applyId\); save\(\); \}/.test(html));
  t("realtime'da 'state = sbRowsToState(all)' KALDIRILDI", !/__sbRtTimer = setTimeout\(async[\s\S]*?state = sbRowsToState\(all\)/.test(html));

  console.log("\n=== per-record-apply: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},600);
