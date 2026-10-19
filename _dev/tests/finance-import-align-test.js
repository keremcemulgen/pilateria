// v207 (Kerem 19.10 "yap"): kartla ödenip ELLE işaretlenen kalem (ör. Bağ-Kur 31.10 Kerem kartıyla) ekstre içe alımında "zaten işlendi" olunca
// ekstre ayına (Kasım) taşınır — kural "ekstre hangi aya aitse o". Mükerrer eşleşmesi BİRE BİR: aynı tutarlı iki gerçek satır tek elle kayda düşmez.
// Yamasız (v206) yapıda [1], [2], [5] BAŞARISIZ olmalı.
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
const NOV=`VAKIFBANK WORLDCARD HESAP ÖZETİ
Hesap Kesim Tarihi : 25.11.2026     Son Ödeme Tarihi : 05.12.2026
Dönem Borcunuz : 11,156.73 TL
31.10.2026 SGK Ödem/12345678901/3061131984 10,156.73
03.11.2026 MARKET A/ANKARA 500.00
04.11.2026 MARKET A/ANKARA 500.00
Dönem Borcunuz 11,156.73`;
const ONLY=`VAKIFBANK WORLDCARD HESAP ÖZETİ
Hesap Kesim Tarihi : 25.11.2026     Son Ödeme Tarihi : 05.12.2026
Dönem Borcunuz : 10,156.73 TL
31.10.2026 SGK Ödem/12345678901/3061131984 10,156.73
Dönem Borcunuz 10,156.73`;
setTimeout(async function(){try{
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.packageTypes=[]; state.instructors=[]; state.members=[]; state.groups=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.finCounterparties=[]; state.finRules=[]; state.finImports=[];
    state.finAccounts.push({id:'cardK',kind:'account',type:'card',name:'Vakıf (Kerem)',bank:'VakıfBank',owner:'Kerem ÖZTEPE',openingDate:'2026-09-26',openingBalance:0,cutoffDay:25,dueDay:5,active:true,scopeDefault:'hane',employerSkip:true});
    state.finDues.push({id:'bk-10',kind:'due',dtype:'expense',title:'Bağ-Kur primi',amount:10156.73,dueDate:'2026-10-31',period:'2026-10',category:'Bağkur',accountId:'cardK',status:'paid',paidRef:{type:'expense',id:'EBK'},paidDate:'2026-10-31',paidAmount:10156.73});
    state.expenses.push({id:'EBK',date:'2026-10-31',paidDate:'2026-10-31',category:'Bağkur',amount:10156.73,note:'Bağ-Kur primi',accountId:'cardK',scope:'studio',dueId:'bk-10',source:'due'});
    state.expenses.push({id:'EM5',date:'2026-11-05',paidDate:'2026-11-05',category:'Market/Yemek',amount:500,note:'market elle',accountId:'cardK',scope:'hane'});
    switchPage('payments'); finSwitchTab196('moves');`;
  const open=async(w,text)=>{ w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(text)+",'cardK','2026-11')"); await tick(60); return JSON.parse(J(w,'__finImp196.rows')); };

  console.log('[1] Bire bir eşleşme: aynı tutarlı iki MARKET satırı, tek elle kayıt (05.11, 500) → yalnız biri "zaten işlendi"');
  { const w=boot(); await tick(1200); w.eval(FX);
    const rows=await open(w,NOV);
    const mk=rows.filter(r=>/MARKET/.test(r.desc));
    t('iki MARKET satırı: biri dup (elle kayda eşleşti), diğeri yeni ve işaretli', mk.length===2 && mk.filter(r=>r.dup).length===1 && mk.filter(r=>!r.dup && r.checked).length===1, JSON.stringify(mk.map(r=>[r.date,r.dup,r.checked,r.dupMatchId])));
    t('dup MARKET satırı en yakın güne (03.11 → 05.11, 2 gün) eşleşti', mk.find(r=>r.dup).date==='2026-11-03' && mk.find(r=>r.dup).dupMatchId==='EM5' && mk.find(r=>r.dup).dupManual===true);
    const sgk=rows.find(r=>/SGK/.test(r.desc));
    t('SGK satırı (31.10, 10.156,73) elle Bağ-Kur kaydına eşleşti (aynı gün)', sgk.dup===true && sgk.dupMatchId==='EBK' && sgk.dupManual===true && sgk.checked===false, JSON.stringify(sgk));
  }

  console.log('[2] Taşıma: işaretsiz mükerrer SGK satırının elle kaydı 31.10 → 01.11 (Kasım ekstresi); not + vade ödeme günü; Gelir–Gider ayı değişir');
  { const w=boot(); await tick(1200); w.eval(FX);
    await open(w,NOV);
    const pv=w.document.getElementById('fi-preview');
    t('başlık: "1 elle kayıt ekstre ayına taşınacak"; satırda "→ ekstre ayına: 01.11.2026"', /1 elle kayıt ekstre ayına taşınacak/.test(pv.textContent) && /→ ekstre ayına: 01\.11\.2026/.test(pv.textContent), pv.querySelector('.fin-tot') && pv.querySelector('.fin-tot').textContent);
    t('İşle düğmesi: "İşle (1 satır + 1 taşıma)"', /İşle \(1 satır \+ 1 taşıma\)/.test(w.document.getElementById('fi-process').textContent), w.document.getElementById('fi-process').textContent);
    const res=JSON.parse(J(w,"finImportProcess196({total:1000,dueDate:'2026-12-05'})"));
    t('sonuç: 1 gider (yeni MARKET), 1 taşıma', res && res.expenses===1 && res.aligned===1, JSON.stringify(res));
    const e=JSON.parse(J(w,"state.expenses.find(x=>x.id==='EBK')"));
    t('elle Bağ-Kur: tarih + ödeme günü 01.11, not "kart ödeme günü 31.10.2026 (2026-11 ekstresi → 2026-11)"', e.date==='2026-11-01' && e.paidDate==='2026-11-01' && /kart ödeme günü 31\.10\.2026 \(2026-11 ekstresi → 2026-11\)/.test(e.note), JSON.stringify(e));
    t('bağlı vade kaleminin ödeme günü 01.11', w.eval("state.finDues.find(d=>d.id==='bk-10').paidDate")==='2026-11-01');
    t('SGK satırı ikinci kez yazılmadı (Bağkur kaydı tek)', w.eval("state.expenses.filter(x=>x.category==='Bağkur').length")===1);
    const pl=JSON.parse(J(w,"finPlRows196(['2026-10','2026-11'])")); const bk=pl.find(r=>r.label==='Gider · Bağkur');
    t('Gelir–Gider: Bağkur Ekim 0, Kasım −10.157', bk && Math.round(bk.vals[0])===0 && Math.round(bk.vals[1])===-10157, JSON.stringify(bk));
    t('içe alma kaydı aligned 1', w.eval("state.finImports[0].aligned")===1);
    t('kart bakiyesi değişmedi (−10.156,73 − 500 − 500)', Math.round(w.eval("finBalance196('cardK')")*100)/100===-11156.73, w.eval("finBalance196('cardK')"));
  }

  console.log('[3] "Satırları ekstre ayına yaz" kapalı → taşıma YOK');
  { const w=boot(); await tick(1200); w.eval(FX);
    await open(w,NOV); w.document.getElementById('fi-clamp').checked=false; w.eval("finImportRenderPreview196()"); await tick(40);
    t('başlıkta taşıma sayımı yok', !/ekstre ayına taşınacak/.test(w.document.getElementById('fi-preview').textContent));
    const res=JSON.parse(J(w,"finImportProcess196({total:1000,dueDate:'2026-12-05'})"));
    t('aligned 0, elle Bağ-Kur 31.10 kaldı', res.aligned===0 && w.eval("state.expenses.find(x=>x.id==='EBK').date")==='2026-10-31', JSON.stringify(res));
  }

  console.log('[4] Kullanıcı mükerrer SGK satırını işaretlerse: yeni gider yazılır, elle kayıt TAŞINMAZ');
  { const w=boot(); await tick(1200); w.eval(FX);
    await open(w,NOV); w.eval("__finImp196.rows.forEach(r=>{ if(/SGK/.test(r.desc)) r.checked=true; }); finImportRenderPreview196();"); await tick(40);
    const res=JSON.parse(J(w,"finImportProcess196({total:1000,dueDate:'2026-12-05'})"));
    t('2 gider (SGK + MARKET), taşıma 0, elle Bağ-Kur 31.10', res.expenses===2 && res.aligned===0 && w.eval("state.expenses.find(x=>x.id==='EBK').date")==='2026-10-31', JSON.stringify(res));
  }

  console.log('[5] Ekstrede yalnız mükerrer satır: "İşle (0 satır + 1 taşıma)" etkin; işleme uyarısız, taşıma yapılır');
  { const w=boot(); await tick(1200); w.eval(FX);
    await open(w,ONLY);
    const b=w.document.getElementById('fi-process');
    t('düğme etkin ve "0 satır + 1 taşıma"', b && !b.disabled && /İşle \(0 satır \+ 1 taşıma\)/.test(b.textContent), b && (b.textContent+' disabled:'+b.disabled));
    const res=JSON.parse(J(w,"finImportProcess196({total:10156.73,dueDate:'2026-12-05'})"));
    t('uyarı yok, aligned 1, elle Bağ-Kur 01.11', res && res.aligned===1 && !w.__msgs.some(m=>/İşlenecek satır seçilmedi/.test(m)) && w.eval("state.expenses.find(x=>x.id==='EBK').date")==='2026-11-01', JSON.stringify(res)+' '+JSON.stringify(w.__msgs));
  }

  console.log('[6] Elle kayıt zaten ekstre ayındaysa (MARKET 05.11) dokunulmaz; [7] aynı ekstre tekrar (parmak izi) → taşıma yok');
  { const w=boot(); await tick(1200); w.eval(FX);
    await open(w,NOV);
    t('MARKET eşleşmesi için taşıma listesi boş (05.11 Kasım içinde)', w.eval("finImportAligns207(__finImp196,true).filter(a=>a.e.id==='EM5').length")===0);
    JSON.parse(J(w,"finImportProcess196({total:1000,dueDate:'2026-12-05'})"));
    t('EM5 05.11 kaldı', w.eval("state.expenses.find(x=>x.id==='EM5').date")==='2026-11-05');
    const rows2=await open(w,NOV);
    t('[7] tekrar: tüm satırlar dup (parmak izi/eşleşme), taşıma 0', rows2.every(r=>r.dup) && w.eval("finImportAligns207(__finImp196,true).length")===0, JSON.stringify(rows2.map(r=>[r.desc.slice(0,8),r.dup,r.dupManual])));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
