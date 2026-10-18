// v202 (Kerem 18.10 "Bunlar benim kartımdaysa hane, Derya ÖZTEPE'nin kartından geliyorsa stüdyo gideri"): ekstre içe alımında öğrenilen
// kapsam (merchant → stüdyo/hane/atla) KARTA BAĞLIDIR. Kural kapsamı yalnız (a) 'skip' ise ve kart employerSkip ise, (b) o kart için
// öğrenilmiş sapma ise (rule.scopeAcc === card.id) uygulanır; kartın varsayılanıyla aynı kapsam öğrenilmez (scope ''). Kategori/cari
// öğrenimi değişmez. Yamasız (v201) yapıda [1] ve [2] BAŞARISIZ olmalı (Kerem'in kartında 'hane' öğrenilen Getir, Derya'nın kartında da hane geliyordu).
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); if(o&&o.input) return String(o.input.value); return true; };
  w.alert=(m)=>{ w.__msgs.push('ALERT:'+m); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
}}).window; }
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
const J=(w,e)=>w.eval('JSON.stringify('+e+')');
// Kerem'in kartı (hane varsayılan, işveren atla): Getir hane, AHSAP ATOLYE elle stüdyo yapılır, otel atla, NATRO ipucuyla stüdyo
const KEREM=`VAKIFBANK WORLDCARD HESAP ÖZETİ
Hesap Kesim Tarihi : 25.09.2026     Son Ödeme Tarihi : 05.10.2026
Dönem Borcunuz : 9,000.00 TL
02.09.2026 Getir Perakende/İSTANBUL 500.00
05.09.2026 AHSAP ATOLYE LTD/ANKARA 3,000.00
10.09.2026 WAXWING HOTEL/HATAY 4,000.00
12.09.2026 NATRO.COM/İSTANBUL 1,500.00
Dönem Borcunuz 9,000.00`;
// Derya'nın kartı (stüdyo varsayılan, işveren yok): aynı merchantlar
const DERYA=`VAKIFBANK WORLDCARD HESAP ÖZETİ
Hesap Kesim Tarihi : 30.09.2026     Son Ödeme Tarihi : 05.10.2026
Dönem Borcunuz : 6,700.00 TL
03.09.2026 Getir Perakende/İSTANBUL 700.00
06.09.2026 AHSAP ATOLYE LTD/ANKARA 2,000.00
11.09.2026 WAXWING HOTEL/HATAY 4,000.00
Dönem Borcunuz 6,700.00`;
setTimeout(async function(){try{
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.packageTypes=[]; state.instructors=[]; state.members=[]; state.groups=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.finCounterparties=[]; state.finRules=[]; state.finImports=[];
    const c=finAccount196('acc-cash'); c.openingDate='2026-10-01'; c.openingBalance=0; const b=finAccount196('acc-bank'); b.openingDate='2026-10-01'; b.openingBalance=0;
    state.finAccounts.push({id:'cardK',kind:'account',type:'card',name:'Vakıf (Kerem)',bank:'VakıfBank',owner:'Kerem',openingDate:'2026-09-26',openingBalance:0,cutoffDay:25,dueDay:5,active:true,scopeDefault:'hane',employerSkip:true});
    state.finAccounts.push({id:'cardK2',kind:'account',type:'card',name:'Garanti (Kerem)',bank:'Garanti BBVA',owner:'Kerem',openingDate:'2026-09-26',openingBalance:0,cutoffDay:15,dueDay:25,active:true,scopeDefault:'hane',employerSkip:true});
    state.finAccounts.push({id:'cardD',kind:'account',type:'card',name:'Vakıf (Derya)',bank:'VakıfBank',owner:'Derya',openingDate:'2026-10-01',openingBalance:0,cutoffDay:30,dueDay:5,active:true,scopeDefault:'studio'});
    switchPage('payments'); finSwitchTab196('moves');`;
  const importKerem = async (w) => { w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(KEREM)+",'cardK','2026-09')"); await tick(60);
    w.eval("__finImp196.rows.forEach(function(r){ if (/AHSAP ATOLYE/.test(r.desc)) { r.scope='studio'; r.business=true; } }); finImportRenderPreview196();"); await tick(40);
    return JSON.parse(J(w,"finImportProcess196({total:9000,dueDate:'2026-10-05'})")); };

  console.log('[1] Kerem\'in kartından öğrenme: varsayılanla aynı kapsam (hane) saklanmaz; stüdyo sapması karta bağlı; otel → atla (kartsız); NATRO ipucu stüdyo → sapma olarak karta bağlı');
  { const w=boot(); await tick(1200); w.eval(FX);
    const pre=JSON.parse(J(w,"__finImp196===undefined?null:1"));
    w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(KEREM)+",'cardK','2026-09')"); await tick(60);
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    t('önizleme (kural yok): Getir hane, AHSAP ATOLYE hane (ipucu yok), otel atla, NATRO stüdyo (ipucu)', rows.find(r=>/Getir/.test(r.desc)).scope==='hane' && rows.find(r=>/AHSAP/.test(r.desc)).scope==='hane' && rows.find(r=>/WAXWING/.test(r.desc)).scope==='skip' && rows.find(r=>/NATRO/.test(r.desc)).scope==='studio', JSON.stringify(rows.map(r=>[r.desc,r.scope])));
    w.eval("document.getElementById('modal-fin-imp').remove()");
    const res=await importKerem(w);
    t('işlendi: 2 gider (1 hane: Getir; NATRO + AHSAP stüdyo → 3 gider toplam), 1 atlandı', res && res.expenses===3 && res.skipped===1 && res.hane===1, JSON.stringify(res));
    const R=JSON.parse(J(w,"state.finRules.map(r=>({p:r.pattern,s:r.scope||'',a:r.scopeAcc||'',c:r.category}))"));
    const rule=p=>R.find(r=>r.p.indexOf(p)===0);
    t('kurallar: GETİR scope boş (varsayılan), AHSAP → studio@cardK, WAXWING → skip (kartsız), NATRO → studio@cardK', rule('GETİR').s==='' && rule('GETİR').a==='' && rule("AHSAP").s==='studio' && rule("AHSAP").a==='cardK' && rule('WAXWING').s==='skip' && rule('WAXWING').a==='' && rule('NATRO').s==='studio' && rule('NATRO').a==='cardK', JSON.stringify(R));
    t('kategori/cari öğrenimi değişmedi (GETİR Market/Yemek, hits 1)', rule('GETİR').c==='Market/Yemek' && w.eval("state.finRules.find(r=>r.pattern.indexOf('GETİR')===0).hits")===1);
  }

  console.log('[2] Derya\'nın kartında aynı merchantlar: HEPSİ stüdyo (Getir hane kuralı uygulanmaz, otel atlanmaz — işveren kartı değil)');
  { const w=boot(); await tick(1200); w.eval(FX);
    await importKerem(w);
    w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(DERYA)+",'cardD','2026-09')"); await tick(60);
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    t('Getir → studio, AHSAP → studio, WAXWING → studio (atla değil)', rows.find(r=>/Getir/.test(r.desc)).scope==='studio' && rows.find(r=>/AHSAP/.test(r.desc)).scope==='studio' && rows.find(r=>/WAXWING/.test(r.desc)).scope==='studio', JSON.stringify(rows.map(r=>[r.desc,r.scope,r.fromRule])));
    t('kategori kuraldan geldi (Getir Market/Yemek, fromRule)', rows.find(r=>/Getir/.test(r.desc)).category==='Market/Yemek' && rows.find(r=>/Getir/.test(r.desc)).fromRule===true);
    const res=JSON.parse(J(w,"finImportProcess196({total:6700,dueDate:'2026-10-05'})"));
    t('işlendi: 3 stüdyo gideri, atlanan yok', res.expenses===3 && res.skipped===0 && res.hane===0, JSON.stringify(res));
    const R=JSON.parse(J(w,"state.finRules.map(r=>({p:r.pattern,s:r.scope||'',a:r.scopeAcc||''}))"));
    const rule=p=>R.find(r=>r.p.indexOf(p)===0);
    t('Derya işlemesi kuralları BOZMADI: GETİR boş kalır, AHSAP studio@cardK kalır (stüdyo kartında varsayılan → yazılmaz), WAXWING skip korunur', rule('GETİR').s==='' && rule("AHSAP").s==='studio' && rule("AHSAP").a==='cardK' && rule('WAXWING').s==='skip', JSON.stringify(R));
    // şimdi Kerem'in kartında tekrar: Getir hane, AHSAP stüdyo (sapma hatırlandı), otel atla
    w.eval("state.finImports=[]; state.finDues=[];");
    w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(KEREM.replace('02.09.2026','22.09.2026'))+",'cardK','2026-09')"); await tick(60);
    const rows2=JSON.parse(J(w,'__finImp196.rows'));
    t('Kerem\'in kartında yeniden: Getir hane, AHSAP stüdyo (hatırlandı), otel atla, NATRO stüdyo', rows2.find(r=>/Getir/.test(r.desc)).scope==='hane' && rows2.find(r=>/AHSAP/.test(r.desc)).scope==='studio' && rows2.find(r=>/WAXWING/.test(r.desc)).scope==='skip' && rows2.find(r=>/NATRO/.test(r.desc)).scope==='studio', JSON.stringify(rows2.map(r=>[r.desc,r.scope])));
  }

  console.log('[3] Kerem\'in İKİNCİ kartı (hane + işveren): otel atla uygulanır (kartsız skip), AHSAP sapması uygulanMAZ (başka kart) → hane; NATRO ipucuyla stüdyo');
  { const w=boot(); await tick(1200); w.eval(FX);
    await importKerem(w);
    w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(KEREM)+",'cardK2','2026-09')"); await tick(60);
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    t('cardK2: Getir hane, AHSAP hane, WAXWING skip, NATRO studio', rows.find(r=>/Getir/.test(r.desc)).scope==='hane' && rows.find(r=>/AHSAP/.test(r.desc)).scope==='hane' && rows.find(r=>/WAXWING/.test(r.desc)).scope==='skip' && rows.find(r=>/NATRO/.test(r.desc)).scope==='studio', JSON.stringify(rows.map(r=>[r.desc,r.scope])));
  }

  console.log('[4] Eski kurallar (v200/v201: scope hane/studio, scopeAcc yok) kartın varsayılanını EZMEZ; skip eskisi gibi yalnız işveren kartında');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("state.finRules.push({id:'r1',kind:'rule',pattern:'GETİR PERAKENDE',category:'Market/Yemek',counterpartyId:'',business:false,scope:'hane',hits:3});");
    w.eval("state.finRules.push({id:'r2',kind:'rule',pattern:'AHSAP ATOLYE',category:'Malzeme/Ekipman',counterpartyId:'',business:true,scope:'studio',hits:1});");
    w.eval("state.finRules.push({id:'r3',kind:'rule',pattern:'WAXWING HOTEL',category:'Diğer',counterpartyId:'',business:true,scope:'skip',hits:1});");
    t('finRuleScope202: hane@-/cardD → boş; studio@-/cardK → boş; skip/cardK → skip; skip/cardD → boş; studio@cardK/cardK → studio; studio@cardK/cardK2 → boş', w.eval("finRuleScope202(state.finRules[0], finAccount196('cardD'))")==='' && w.eval("finRuleScope202(state.finRules[1], finAccount196('cardK'))")==='' && w.eval("finRuleScope202(state.finRules[2], finAccount196('cardK'))")==='skip' && w.eval("finRuleScope202(state.finRules[2], finAccount196('cardD'))")==='' && w.eval("finRuleScope202({scope:'studio',scopeAcc:'cardK'}, finAccount196('cardK'))")==='studio' && w.eval("finRuleScope202({scope:'studio',scopeAcc:'cardK'}, finAccount196('cardK2'))")==='');
    w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(DERYA)+",'cardD','2026-09')"); await tick(60);
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    t('Derya kartı önizleme: eski hane/studio kuralları etkisiz → hepsi stüdyo; kategori kuraldan (Malzeme/Ekipman)', rows.every(r=>r.scope==='studio') && rows.find(r=>/AHSAP/.test(r.desc)).category==='Malzeme/Ekipman', JSON.stringify(rows.map(r=>[r.desc,r.scope,r.category])));
    w.eval("document.getElementById('modal-fin-imp').remove()");
    w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(KEREM)+",'cardK','2026-09')"); await tick(60);
    const rows2=JSON.parse(J(w,'__finImp196.rows'));
    t('Kerem kartı önizleme: Getir hane (varsayılan), AHSAP hane (eski studio kuralı kartsız → etkisiz), otel skip, NATRO studio (ipucu)', rows2.find(r=>/Getir/.test(r.desc)).scope==='hane' && rows2.find(r=>/AHSAP/.test(r.desc)).scope==='hane' && rows2.find(r=>/WAXWING/.test(r.desc)).scope==='skip' && rows2.find(r=>/NATRO/.test(r.desc)).scope==='studio', JSON.stringify(rows2.map(r=>[r.desc,r.scope])));
  }

  console.log('[5] Kartsız çağrı (eski imza) eski davranış: scope verildiği gibi saklanır');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("finLearnRule196('STARBUCKS MODA','Market/Yemek','',false,'hane'); finLearnRule196('DECATHLON ATAŞEHİR','Malzeme/Ekipman','CP1',true);");
    t('STARBUCKS → hane, DECATHLON → studio (varsayılan), scopeAcc yok', w.eval("state.finRules.find(r=>r.pattern==='STARBUCKS MODA').scope")==='hane' && w.eval("state.finRules.find(r=>r.pattern==='DECATHLON ATAŞEHİR').scope")==='studio' && !w.eval("state.finRules.find(r=>r.pattern==='STARBUCKS MODA').scopeAcc"));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
