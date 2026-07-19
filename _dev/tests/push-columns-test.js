// v53 META-KOLON REGRESYONU: Supabase tablolarinda yalniz {id,data,updated_at} kolonu var.
// push (sbDiffPush) upsert payload'ina baska kolon (ornek 'meta') koyarsa PostgREST TUM upsert'i reddeder
// ("Could not find the 'meta' column ... in the schema cache") -> hicbir degisiklik buluta gitmez -> geri sarma.
// Bu test hem KOD hem DAVRANIS duzeyinde payload'in yalniz {id,data} icerdigini garanti eder.
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

setTimeout(async ()=>{ try {
  console.log('[1] KOD DUZEYI: upsert payload meta kolonu icermez');
  t("push'ta 'meta:' kolonu YOK", !/data:\s*Object\.assign\([^;]*?\),\s*meta:/.test(html));
  t("j paralel upJson map'e yazilir", /upJson\[id\]\s*=\s*j/.test(html));
  t("shadow upJson'dan guncellenir (u.meta degil)", /__sbShadow\[t\]\[u\.id\]\s*=\s*upJson\[u\.id\]/.test(html) && !/=\s*u\.meta/.test(html));

  console.log('[2] DAVRANIS: gercek sbDiffPush payload yakalama');
  w.eval(`
    __sbShadow={}; __sbVer={};
    state.members=[{id:'mX',name:'META TEST',phone:'5551112233',joinDate:'2026-07-01',totalPrice:8500,monthly:{'2026-07':{enrolled:true,totalPrice:8500,note:'n'}},packages:[{month:'2026-07',price:8500,sessions:8}]}];
    state.groups=[]; state.lessons=[{id:'lX',date:'2026-07-15',time:'09:00',memberIds:['mX'],status:'planned',packageMonth:'2026-07'}];
    state.payments=[{id:'pX',memberId:'mX',amount:8500,date:'2026-07-05',packageMonth:'2026-07'}];
    state.instructors=[]; state.instructorPayouts=[]; state.packageTypes=[]; state.campaigns=[]; state.waTemplates=[];
    window.__cap=[];
    __trace=function(){}; setCloudDot=function(){};
    sbClient={ from:function(tbl){ return {
      upsert:function(payload){ window.__cap.push({table:tbl,payload:payload}); return Promise.resolve({error:null}); },
      delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; }
    };}};
  `);
  await w.sbDiffPush();
  const cap = w.__cap;
  t('en az bir upsert yapildi', cap.length>0, cap.length);
  const allRows = [];
  cap.forEach(c => (Array.isArray(c.payload)?c.payload:[c.payload]).forEach(r=>allRows.push({table:c.table,row:r})));
  const bad = allRows.filter(x=>Object.keys(x.row).some(k=>k!=='id'&&k!=='data'));
  t('HICBIR satirda id/data disi kolon YOK', bad.length===0, JSON.stringify(bad.map(x=>x.table+':'+Object.keys(x.row).join('+'))));
  const memRow = allRows.find(x=>x.table==='members' && x.row.id==='mX');
  t('members[mX] gonderildi', !!memRow);
  t("members[mX] data icinde '_v' damgasi (LWW) var", !!memRow && typeof memRow.row.data._v==='number', memRow&&memRow.row.data._v);
  t("members[mX] 'meta' anahtari YOK", !!memRow && !('meta' in memRow.row));
  t("members[mX] data.totalPrice TASINMAZ (finance'de)", !!memRow && memRow.row.data.totalPrice===undefined);
  const finRow = allRows.find(x=>x.table==='member_finance' && x.row.id==='mX');
  t('member_finance[mX] gonderildi + yalniz id,data', !!finRow && Object.keys(finRow.row).every(k=>k==='id'||k==='data') && !('meta' in finRow.row));
  t('member_finance[mX] fiyat TASIR (8500)', !!finRow && finRow.row.data.totalPrice===8500, finRow&&finRow.row.data.totalPrice);
  const setRow = allRows.find(x=>x.table==='settings');
  t('settings singleton da yalniz id,data', !!setRow && Object.keys(setRow.row).every(k=>k==='id'||k==='data'));

  console.log('[3] Shadow, gonderim sonrasi _v-siz JSON ile guncellenir (echo dongusu olmaz)');
  const shadowMX = w.eval("__sbShadow.members && __sbShadow.members.mX");
  t('shadow.members.mX yazildi', !!shadowMX);
  t("shadow _v icermez (bir sonraki diff temiz)", !!shadowMX && shadowMX.indexOf('"_v"')===-1);

  console.log("\n=== push-columns (meta regresyon): "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
} catch(e){ console.error('HATA', e); process.exit(1); } }, 800);
