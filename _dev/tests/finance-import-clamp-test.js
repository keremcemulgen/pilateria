// v201 (Kerem 18.10 "Ekstre hangi aya aitse o"): kart ekstresi içe alınırken ay dışı tarihli satırlar (önceki ayın sonu, taksit kökeni,
// kesim sonrası) ekstre döneminin ilk/son gününe yazılır; önizlemede "→ gg.aa.yyyy" işareti ve "N satır ekstre ayına çekilir" sayımı;
// pencerede "Satırları ekstre ayına yaz" kutusu varsayılan AÇIK; kutu kapalıysa işlem tarihi korunur. Mükerrer denetimi (aynı hesap+
// tarih+tutar) ORİJİNAL işlem tarihiyle yapılır. Yamasız (v200) yapıda [1], [2], [3], [5], [6], [7], [8] BAŞARISIZ olmalı.
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
// Vakıf tarzı Eylül ekstresi (kesim 25.09): Ağustos sonu satırları (23–31.08), Eylül satırları, tarihsiz ücret satırı (kesim günü)
const VAKIF=`VAKIFBANK WORLDCARD HESAP ÖZETİ
Hesap Kesim Tarihi : 25.09.2026     Son Ödeme Tarihi : 05.10.2026
Dönem Borcunuz : 7,000.00 TL
İŞLEM TARİHİ   AÇIKLAMA   TUTAR (TL)   KALAN TAKSİT   WORLDPUAN
23.08.2026 HOSTING FIRMASI/İSTANBUL 1,000.00
25.08.2026 Vergi Th/12345678901/0015 2,000.00
31.08.2026 MARKET A/ANKARA 500.00
02.09.2026 ÖDEMENİZ İÇİN TEŞEKKÜRLER 5,000.00+
10.09.2026 MARKET B/ANKARA 1,500.00
24.09.2026 MARKET C/ANKARA 300.00
KART ÜCRETİ 1,700.00
Dönem Borcunuz 7,000.00`;
setTimeout(async function(){try{
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.packageTypes=[]; state.instructors=[]; state.members=[]; state.groups=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.finCounterparties=[]; state.finRules=[]; state.finImports=[];
    const c=finAccount196('acc-cash'); c.openingDate='2026-10-01'; c.openingBalance=1000; const b=finAccount196('acc-bank'); b.openingDate='2026-10-01'; b.openingBalance=50000;
    state.finAccounts.push({id:'cardK',kind:'account',type:'card',name:'Vakıf',bank:'VakıfBank',owner:'Kerem',openingDate:'2026-09-26',openingBalance:-7000,cutoffDay:25,dueDay:5,active:true,scopeDefault:'hane',employerSkip:true});
    switchPage('payments'); finSwitchTab196('moves');`;

  console.log('[1] Pencere: "Satırları ekstre ayına yaz" kutusu var ve varsayılan AÇIK; önizlemede ay dışı satırlara → işareti ve sayım');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("openFinImportModal196()"); await tick(60);
    const cb=w.document.getElementById('fi-clamp');
    t('kutu var, işaretli', !!cb && cb.checked);
    w.eval("finImportPreview196("+JSON.stringify(VAKIF)+",'cardK','2026-09')"); await tick(60);
    const pv=w.document.getElementById('fi-preview');
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    t('7 satır okundu: 3 Ağustos, 3 Eylül, 1 tarihsiz ücret (kesim günü 25.09), 1 ödeme', rows.length===7 && rows.filter(r=>r.date<'2026-09-01').length===3 && rows.filter(r=>r.date>='2026-09-01' && r.kind!=='payment').length===3 && rows.find(r=>/KART ÜCRETİ/.test(r.desc)).date==='2026-09-25' && rows.filter(r=>r.kind==='payment').length===1, JSON.stringify(rows.map(r=>[r.date,r.desc,r.kind])));
    t('başlık: "3 satır ekstre ayına çekilir" (3 Ağustos satırı; ödeme ve Eylül satırları sayılmaz)', /3 satır ekstre ayına çekilir/.test(pv.textContent), pv.querySelector('.fin-tot')&&pv.querySelector('.fin-tot').textContent);
    const cells=[...pv.querySelectorAll('tbody tr td[data-label="Tarih"]')].map(td=>td.textContent.replace(/\s+/g,' ').trim());
    t('tarih hücreleri: 23.08.2026 → 01.09.2026, 31.08.2026 → 01.09.2026; Eylül satırlarında ve ödeme satırında ok yok', cells.some(c=>/23\.08\.2026.*→.*01\.09\.2026/.test(c)) && cells.some(c=>/31\.08\.2026.*→.*01\.09\.2026/.test(c)) && cells.some(c=>c==='10.09.2026') && cells.some(c=>c==='24.09.2026') && !cells.some(c=>/02\.09\.2026.*→/.test(c)) && cells.filter(c=>/→/.test(c)).length===3, JSON.stringify(cells));
    cb.checked=false; cb.dispatchEvent(new w.Event('change',{bubbles:true})); await tick(60);
    const cells2=[...w.document.querySelectorAll('#fi-preview tbody tr td[data-label="Tarih"]')].map(td=>td.textContent);
    t('kutu kapatılınca oklar ve sayım kalkar', !cells2.some(c=>/→/.test(c)) && !/ekstre ayına çekilir/.test(w.document.getElementById('fi-preview').textContent), JSON.stringify(cells2));
  }

  console.log('[2] İşleme (kutu açık): Ağustos satırları 01.09, Eylül satırları aynı; ücret satırı 25.09 kalır; kayıt clamp:true; bakiye yalnız açılış');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("openFinImportModal196()"); await tick(60);
    w.eval("finImportPreview196("+JSON.stringify(VAKIF)+",'cardK','2026-09')"); await tick(60);
    const res=JSON.parse(J(w,"finImportProcess196({total:7000,dueDate:'2026-10-05'})"));
    t('6 satır işlendi (ödeme hariç), vade kalemi eklendi', res && res.expenses===6 && res.credits===0 && res.due===true, JSON.stringify(res));
    const E=JSON.parse(J(w,"state.expenses.map(e=>[e.note,e.date,e.paidDate,e.amount,e.scope])"));
    const by=n=>E.find(e=>new RegExp(n).test(e[0]));
    t('HOSTING 23.08 → 2026-09-01 (date ve paidDate)', by('HOSTING')[1]==='2026-09-01' && by('HOSTING')[2]==='2026-09-01', JSON.stringify(by('HOSTING')));
    t('Vergi Th 25.08 → 2026-09-01, stüdyo kapsamı korunur', by('Vergi Th')[1]==='2026-09-01' && by('Vergi Th')[4]==='studio', JSON.stringify(by('Vergi Th')));
    t('MARKET A 31.08 → 2026-09-01; MARKET B 10.09 ve MARKET C 24.09 aynı', by('MARKET A')[1]==='2026-09-01' && by('MARKET B')[1]==='2026-09-10' && by('MARKET C')[1]==='2026-09-24', JSON.stringify([by('MARKET A'),by('MARKET B'),by('MARKET C')]));
    t('KART ÜCRETİ (kesim günü 25.09) ay içinde → 2026-09-25', by('KART ÜCRETİ')[1]==='2026-09-25', JSON.stringify(by('KART ÜCRETİ')));
    t('içe alma kaydı clamp:true, dönem 2026-09, 6 parmak izi', w.eval("state.finImports[0].clamp")===true && w.eval("state.finImports[0].period")==='2026-09' && w.eval("state.finImports[0].fingerprints.length")===6);
    t('kart bakiyesi yalnız açılış (tüm satırlar açılış 26.09 öncesi): −7.000', w.eval("finBalance196('cardK')")===-7000, w.eval("finBalance196('cardK')"));
    const pl=JSON.parse(J(w,"finPlRows196(['2026-08','2026-09','2026-10'])"));
    const sumCol=i=>pl.filter(r=>/^Gider · |^Hane · /.test(r.label)).reduce((a,r)=>a+(r.vals[i]||0),0);
    t('Gelir–Gider: Ağustos 0, Eylül −7.000 (hepsi ekstre ayında), Ekim 0', Math.round(sumCol(0))===0 && Math.round(sumCol(1)*100)/100===-7000 && Math.round(sumCol(2))===0, JSON.stringify(pl.map(r=>[r.label,r.vals])));
  }

  console.log('[3] Mükerrer denetimi ORİJİNAL işlem tarihiyle: elle girilmiş 25.08 tarihli vergi ödemesi aynı kart+tutar → "zaten işlendi"');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("state.expenses.push({id:'E-vergi',date:'2026-08-25',paidDate:'2026-08-25',category:'KDV Ödemesi',amount:2000,note:'KDV elle',accountId:'cardK',scope:'studio',resmi:true,kdvRate:0})");
    w.eval("openFinImportModal196()"); await tick(60);
    w.eval("finImportPreview196("+JSON.stringify(VAKIF)+",'cardK','2026-09')"); await tick(60);
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    const v=rows.find(r=>/Vergi Th/.test(r.desc));
    t('Vergi Th satırı dup + işaretsiz; diğer satırlar işaretli', v.dup===true && v.checked===false && rows.filter(r=>r.checked).length===5, JSON.stringify(rows.map(r=>[r.desc,r.dup,r.checked])));
    const pv=w.document.getElementById('fi-preview');
    t('başlık: 1 zaten işlenmiş · 2 satır ekstre ayına çekilir (dup satır sayılmaz)', /1 zaten işlenmiş/.test(pv.textContent) && /2 satır ekstre ayına çekilir/.test(pv.textContent), pv.querySelector('.fin-tot').textContent);
    const res=JSON.parse(J(w,"finImportProcess196({total:7000,dueDate:'2026-10-05'})"));
    t('işleme: 5 gider; elle girilen kayıt tek kalır (toplam 6 gider)', res.expenses===5 && w.eval("state.expenses.length")===6 && w.eval("state.expenses.filter(e=>e.category==='KDV Ödemesi').length")===1, JSON.stringify(res));
  }

  console.log('[4] Kutu kapalı → işlem tarihleri korunur (v200 davranışı)');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("openFinImportModal196()"); await tick(60);
    w.eval("finImportPreview196("+JSON.stringify(VAKIF)+",'cardK','2026-09')"); await tick(60);
    w.document.getElementById('fi-clamp').checked=false;
    JSON.parse(J(w,"finImportProcess196({total:7000,dueDate:'2026-10-05'})"));
    const E=JSON.parse(J(w,"state.expenses.map(e=>[e.note,e.date])"));
    t('HOSTING 2026-08-23, MARKET A 2026-08-31 (değişmedi); kayıt clamp:false', E.find(e=>/HOSTING/.test(e[0]))[1]==='2026-08-23' && E.find(e=>/MARKET A/.test(e[0]))[1]==='2026-08-31' && w.eval("state.finImports[0].clamp")===false, JSON.stringify(E));
    const pl4=JSON.parse(J(w,"finPlRows196(['2026-08','2026-09'])"));
    const s4=i=>pl4.filter(r=>/^Gider · |^Hane · /.test(r.label)).reduce((a,r)=>a+(r.vals[i]||0),0);
    t('Gelir–Gider: Ağustos −3.500 (3 satır), Eylül −3.500 (tarihler korundu)', Math.round(s4(0))===-3500 && Math.round(s4(1))===-3500, JSON.stringify(pl4.map(r=>[r.label,r.vals])));
  }

  console.log('[5] Programatik: opt.clamp kutudan bağımsız; kutu yokken (pencere kapalı) varsayılan tarih korunur');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("finImportPreview196("+JSON.stringify(VAKIF)+",'cardK','2026-09')"); // pencere yok → #fi-clamp yok
    JSON.parse(J(w,"finImportProcess196({total:7000,dueDate:'2026-10-05'})"));
    t('kutu yokken tarih korunur (eski testlerle uyum)', w.eval("state.expenses.find(e=>/HOSTING/.test(e.note)).date")==='2026-08-23');
    w.eval("state.expenses=[]; state.finImports=[]; state.finDues=[];");
    w.eval("finImportPreview196("+JSON.stringify(VAKIF)+",'cardK','2026-09')");
    JSON.parse(J(w,"finImportProcess196({total:7000,dueDate:'2026-10-05',clamp:true})"));
    t('opt.clamp:true → 01.09', w.eval("state.expenses.find(e=>/HOSTING/.test(e.note)).date")==='2026-09-01');
    t('finImportClampDate201: sınırlar ve geçersiz girdi', w.eval("finImportClampDate201('2026-08-31','2026-09')")==='2026-09-01' && w.eval("finImportClampDate201('2026-10-01','2026-09')")==='2026-09-30' && w.eval("finImportClampDate201('2026-09-15','2026-09')")==='2026-09-15' && w.eval("finImportClampDate201('2026-02-29','2026-02')")==='2026-02-28' && w.eval("finImportClampDate201('2026-08-31','')")==='2026-08-31');
  }

  console.log('[6] Ekim ekstresi (Garanti tarzı, kesim 10.10): Eylül satırları 01.10\'a, kesim günü satırı aynı; açılış 11.10 → bakiye yalnız açılış');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("state.finAccounts.push({id:'cardG',kind:'account',type:'card',name:'Garanti Bonus Business',bank:'Garanti BBVA',owner:'Derya',openingDate:'2026-10-11',openingBalance:-18133.59,cutoffDay:10,dueDay:15,active:true,scopeDefault:'studio'})");
    const G=`BONUS BUSINESS HESAP ÖZETİ
Hesap Kesim Tarihi 10 Ekim 2026   Son Ödeme Tarihi 15 Ekim 2026
Toplam Borcunuz 18.133,59 TL
07 Eylül 2026 MOKA U /YANDEX GO 896,00
30 Eylül 2026 FAIZ IADESI 1,08+
10 Ekim 2026 Yurtiçi Diğer Banka Şubeleri %4,45 + 1,72
Toplam 896,64`;
    w.eval("openFinImportModal196()"); await tick(60);
    w.eval("finImportPreview196("+JSON.stringify(G)+",'cardG','2026-10')"); await tick(60);
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    t('3 satır: gider 07.09, iade 30.09, kesim günü 10.10', rows.length===3 && rows[0].date==='2026-09-07' && rows[1].kind==='credit' && rows[1].amount===1.08 && rows[2].date==='2026-10-10' && rows[2].amount===1.72, JSON.stringify(rows.map(r=>[r.date,r.desc,r.amount,r.kind])));
    const pv=w.document.getElementById('fi-preview');
    t('başlık: 2 satır ekstre ayına çekilir (iade dahil)', /2 satır ekstre ayına çekilir/.test(pv.textContent), pv.querySelector('.fin-tot').textContent);
    JSON.parse(J(w,"finImportProcess196({total:18133.59,dueDate:'2026-10-15'})"));
    const E=JSON.parse(J(w,"state.expenses.map(e=>[e.note,e.date,e.amount])"));
    t('YANDEX 07.09 → 2026-10-01; FAIZ IADESI 30.09 → 2026-10-01 (−1,08); kesim günü satırı 2026-10-10', E.find(e=>/YANDEX/.test(e[0]))[1]==='2026-10-01' && E.find(e=>/IADESI/.test(e[0]))[1]==='2026-10-01' && E.find(e=>/IADESI/.test(e[0]))[2]===-1.08 && E.find(e=>/Yurtiçi/.test(e[0]))[1]==='2026-10-10', JSON.stringify(E));
    t('kart bakiyesi yalnız açılış (satırlar 11.10 öncesi): −18.133,59; vade kalemi 18.133,59 / 15.10', w.eval("finBalance196('cardG')")===-18133.59 && w.eval("state.finDues.find(d=>d.id==='cdue-cardG-2026-10').amount")===18133.59 && w.eval("state.finDues.find(d=>d.id==='cdue-cardG-2026-10').dueDate")==='2026-10-15', w.eval("finBalance196('cardG')"));
    const pl=JSON.parse(J(w,"finPlRows196(['2026-09','2026-10'])"));
    const gid=pl.filter(r=>/^Gider · /.test(r.label));
    t('Gelir–Gider: Eylül 0, Ekim −896,64 (stüdyo)', Math.round(gid.reduce((a,r)=>a+(r.vals[0]||0),0))===0 && Math.round(gid.reduce((a,r)=>a+(r.vals[1]||0),0)*100)/100===-896.64, JSON.stringify(gid.map(r=>[r.label,r.vals])));
  }

  console.log('[7] Aynı Garanti ekstresi "Eylül" etiketiyle: kesim günü (10.10) satırı 30.09\'a çekilir, Eylül satırları aynı; açılış 11.10 → bakiye yalnız açılış');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("state.finAccounts.push({id:'cardG',kind:'account',type:'card',name:'Garanti Bonus Business',bank:'Garanti BBVA',owner:'Derya',openingDate:'2026-10-11',openingBalance:-18133.59,cutoffDay:10,dueDay:15,active:true,scopeDefault:'studio'})");
    const G=`BONUS BUSINESS HESAP ÖZETİ
Hesap Kesim Tarihi 10 Ekim 2026   Son Ödeme Tarihi 15 Ekim 2026
Toplam Borcunuz 18.133,59 TL
07 Eylül 2026 MOKA U /YANDEX GO 896,00
30 Eylül 2026 FAIZ IADESI 1,08+
10 Ekim 2026 Yurtiçi Diğer Banka Şubeleri %4,45 + 1,72
Toplam 896,64`;
    w.eval("openFinImportModal196()"); await tick(60);
    w.eval("finImportPreview196("+JSON.stringify(G)+",'cardG','2026-09')"); await tick(60);
    const pv=w.document.getElementById('fi-preview');
    t('başlık: 1 satır ekstre ayına çekilir; hücre 10.10.2026 → 30.09.2026', /1 satır ekstre ayına çekilir/.test(pv.textContent) && [...pv.querySelectorAll('tbody td[data-label="Tarih"]')].some(td=>/10\.10\.2026.*→.*30\.09\.2026/.test(td.textContent)), pv.querySelector('.fin-tot').textContent);
    JSON.parse(J(w,"finImportProcess196({total:18133.59,dueDate:'2026-10-15'})"));
    const E=JSON.parse(J(w,"state.expenses.map(e=>[e.note,e.date])"));
    t('YANDEX 07.09 aynı; IADESI 30.09 aynı; kesim günü satırı → 2026-09-30', E.find(e=>/YANDEX/.test(e[0]))[1]==='2026-09-07' && E.find(e=>/IADESI/.test(e[0]))[1]==='2026-09-30' && E.find(e=>/Yurtiçi/.test(e[0]))[1]==='2026-09-30', JSON.stringify(E));
    t('kart bakiyesi yalnız açılış −18.133,59; vade kalemi cdue-cardG-2026-09', w.eval("finBalance196('cardG')")===-18133.59 && w.eval("state.finDues.find(d=>d.id==='cdue-cardG-2026-09').amount")===18133.59, w.eval("finBalance196('cardG')"));
  }

  console.log('[8] Mükerrer ±7 gün (v201): elle girilen vergi (28.08, kaynaksız) ↔ ekstre satırı 25.08 aynı tutar → dup; ekstreden gelen kayıt yalnız aynı gün; 8+ gün → dup değil');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("state.expenses.push({id:'E-kdv',date:'2026-08-28',paidDate:'2026-08-28',category:'KDV Ödemesi',amount:2000,note:'KDV elle (vade günü)',accountId:'cardK',scope:'studio',resmi:true,kdvRate:0})");
    w.eval("state.expenses.push({id:'E-imp',date:'2026-08-28',category:'Diğer',amount:1000,note:'HOSTING önceki içe alma',accountId:'cardK',scope:'hane',source:'card-import',fingerprint:'x'})");
    w.eval("state.expenses.push({id:'E-far',date:'2026-09-19',category:'Market/Yemek',amount:1500,note:'market elle 9 gün sonra',accountId:'cardK',scope:'hane'})");
    w.eval("state.expenses.push({id:'E-oth',date:'2026-08-31',category:'Market/Yemek',amount:500,note:'başka hesapta',accountId:'acc-bank',scope:'hane'})");
    t('finDupExpense200: 25.08/2000 → dup (3 gün, elle); 23.08/1000 → değil (ekstre kaynaklı, farklı gün); 10.09/1500 → değil (9 gün); 31.08/500 → değil (başka hesap); 28.08/1000 → dup (aynı gün, ekstre kaynaklı)', w.eval("finDupExpense200('cardK','2026-08-25',2000,false)")===true && w.eval("finDupExpense200('cardK','2026-08-23',1000,false)")===false && w.eval("finDupExpense200('cardK','2026-09-10',1500,false)")===false && w.eval("finDupExpense200('cardK','2026-08-31',500,false)")===false && w.eval("finDupExpense200('cardK','2026-08-28',1000,false)")===true);
    t('iade işareti: −2000 alacak satırı 2000 gidere mükerrer değil', w.eval("finDupExpense200('cardK','2026-08-28',2000,true)")===false);
    w.eval("openFinImportModal196()"); await tick(60);
    w.eval("finImportPreview196("+JSON.stringify(VAKIF)+",'cardK','2026-09')"); await tick(60);
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    t('önizleme: Vergi Th (25.08, 2000) "zaten işlendi"; HOSTING (23.08, 1000) yeni; MARKET B (10.09, 1500) yeni', rows.find(r=>/Vergi Th/.test(r.desc)).dup===true && rows.find(r=>/HOSTING/.test(r.desc)).dup===false && rows.find(r=>/MARKET B/.test(r.desc)).dup===false, JSON.stringify(rows.map(r=>[r.desc,r.dup])));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
