// v.20 EŞZAMANLILIK: zaman-damgalı LWW + resync altyapısı birim testleri
// 2 sahip + personel aynı anda çalışırken eski yazım yeniyi ezmesin, kaçırılan olaylar tazelensin.
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
  console.log('[1] sbPickWinner — yüksek _v kazanır, eşitlikte uzak (b) gelir');
  t("a yeni (a5>b3) -> a kazanır", w.eval("sbPickWinner({_v:5,x:'a'},{_v:3,x:'b'}).x")==='a');
  t("b yeni (a3<b5) -> b kazanır", w.eval("sbPickWinner({_v:3,x:'a'},{_v:5,x:'b'}).x")==='b');
  t("eşitlik -> b (uzak/son gelen)", w.eval("sbPickWinner({_v:5,x:'a'},{_v:5,x:'b'}).x")==='b');
  t("_v yoksa 0 sayılır -> b(5) kazanır", w.eval("sbPickWinner({x:'a'},{_v:5,x:'b'}).x")==='b');

  console.log('[2] __sbHarvestVer — _v damgası __sbVer\'e alınır, veriden silinir');
  w.eval("__sbVer={}; var all={members:{m1:{name:'A',_v:100},m2:{name:'B',_v:50}},payments:{}}; __sbHarvestVer(all); window.__hv=all;");
  t("__sbVer.members.m1 = 100", w.eval("__sbVer.members.m1")===100, w.eval("__sbVer.members.m1"));
  t("__sbVer.members.m2 = 50", w.eval("__sbVer.members.m2")===50, w.eval("__sbVer.members.m2"));
  t("veri _v temizlendi (m1)", w.eval("('_v' in window.__hv.members.m1)")===false);
  t("domain nesnesi bozulmadı (name kaldı)", w.eval("window.__hv.members.m1.name")==='A');
  w.eval("var all2={members:{m1:{name:'A2',_v:60}},payments:{}}; __sbHarvestVer(all2);");
  t("__sbVer yalnız ARTAR (max: 100 vs 60 = 100)", w.eval("__sbVer.members.m1")===100, w.eval("__sbVer.members.m1"));
  w.eval("var all3={members:{m1:{name:'A3',_v:250}},payments:{}}; __sbHarvestVer(all3);");
  t("daha yeni _v gelince güncellenir (250)", w.eval("__sbVer.members.m1")===250, w.eval("__sbVer.members.m1"));

  console.log('[3] Altyapı mevcut (resync + reconnect + dinleyici kancaları)');
  t("sbResync fonksiyonu var", w.eval("typeof sbResync")==='function');
  t("sbPickWinner fonksiyonu var", w.eval("typeof sbPickWinner")==='function');
  t("__sbHarvestVer fonksiyonu var", w.eval("typeof __sbHarvestVer")==='function');
  t("__sbWasDropped tanımlı", w.eval("typeof __sbWasDropped")!=='undefined');
  t("subscribe status callback (SUBSCRIBED/rt-recover) kodda", /rt-recover/.test(html) && /'SUBSCRIBED'/.test(html));
  t("online dinleyicisi kodda", /addEventListener\('online'/.test(html));
  t("visibilitychange dinleyicisi kodda", /visibilitychange/.test(html) && /sbResync\('visible'\)/.test(html));
  t("resync kirliyken state EZMEZ (sadece push+return) — v46 veri güvenliği", /isDirty\(\)\) \{[\s\S]{0,90}?await sbFlushPush\(\); \} catch\(e\)\{\} return; \}/.test(html));
  t("resync öncesi kirliyse önce push (sbDiffPush)", /await sbDiffPush\(\)/.test(html));

  console.log('[4] LWW koruması kod düzeyinde (eski uzaktaki yazım yerel yeniyi ezmez)');
  t("realtime'da __inV < __knownV ise return (koru)", /__inV && __inV < __knownV\) return/.test(html));
  t("push'ta _v damgalanır (Math.max(Date.now()...))", /Math\.max\(Date\.now\(\), \(__sbVer\[t\]\[id\] \|\| 0\) \+ 1\)/.test(html));
  t("shadow meta-free (upJson map; meta KOLON DEGIL)", /__sbShadow\[t\]\[u\.id\] = upJson\[u\.id\]/.test(html) && !/,\s*meta:\s*j\s*\}/.test(html));

  console.log("\n=== concurrency-lww: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
} catch(e){ console.error('HATA', e); process.exit(1); } }, 800);
