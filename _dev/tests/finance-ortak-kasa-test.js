// v200 — ORTAK KASA (Kerem 18.10): işletme + hane tek kasa. (A) Ekstre okuyucu GERÇEK Garanti/VakıfBank biçimleri (anonim örnekler:
// "03 Ekim 2026" tarih, "1,924.50" sayı biçimi, "x6=" taksit ve puan sütunları, +tutar / tutar+ alacak, özet satırları, dönem borcu/asgari,
// tarihsiz faiz/ücret satırı). (B) Kapsam: stüdyo / hane / atla(işveren); kartın varsayılan kapsamı; stüdyo ipuçları (vergi kodu, SGK,
// Bağ-Kur taban tutarı, reklam, site, fatura); işveren ipuçları (otel/uçuş/otobüs/araç kiralama/otopark); mevcut giderle mükerrer; hane
// satırları ÇEKİM değil GİDER; atlanan satır yazılmaz. (C) Gelir: hareket op 'income', gelir şablonu → gelir vadesi → "Alındı" → gelir
// hareketi; projeksiyon. (D) Banka/kasa türünde yeni hesap; raporda Stüdyo net / Hane net; netProfitForMonth hane giderini saymaz.
// Yamasız (v199) yapıda bu test BAŞARISIZ olmalı.
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
// ---- ANONİM ÖRNEK EKSTRELER (gerçek yapı, uydurma kişi/işyeri/tutar) ----
const GARANTI = [
 'BONUS BUSINESS TROY Card Bilgileriniz Son Ödeme Tarihi: 15 Ekim 2026',
 'Müşteri Numarası 12345678 Sayın AYŞE YILMAZ',
 'Kart Limiti 60.000,00 TL',
 'Hesap Kesim Tarihi 10/10/2026',
 'Ödeme Bilgileri',
 'Son Ödeme Tarihi 15/10/2026',
 'Toplam Borcunuz 18.133,59 TL',
 'Minimum Ödeme Tutarı 7.254,00 TL',
 'İşlem Tarihi Dönem İçi İşlemler Kalan Borç / Taksit Bonus (TL) Tutar (TL)',
 'ÖNCEKİ DÖNEMDEN DEVİR EDİLEN TUTAR 11.413,89',
 'GEÇ ÖDEME FAİZİ 153,77',
 '15 Eylül 2026 ÖDEMENİZ İÇİN TEŞEKKÜR EDERİZ 11.413,89+',
 '30 Eylül 2026 FAIZ IADESI 1,08+',
 "BONUS PROGRAM ORTAKLARI'NDA YAPTIĞINIZ HARCAMALAR",
 '03 Ekim 2026 GÖZLÜKÇÜ AVM 1.260,00x6=7.560,00 5.Taksit 1.260,00',
 '22 Eylül 2026 TRKCLL***********661 377,00',
 '08 Eylül 2026 TRENDYOL.COM 992,00x3=2.976,00 1.Taksit 0,60 992,00',
 'MAIL / TELEFON ORDER',
 '11 Eylül 2026 SUPERONLİNE İLETİŞİM HİZM 950,00',
 'DİĞER',
 '07 Eylül 2026 MOKA U /YANDEX GO 896,00',
 '14 Eylül 2026 BSKNTDOG1234567890126 117,00',
 '14 Eylül 2026 OTOM. FATURA İŞLEM FAİZİ 5,57',
 'Toplam 0,60 18.125,90',
 'EKSTRE ÖZETİ Bonus Business Card\'ı tercih ettiğiniz için teşekkürler. Bir sonraki hesap kesiminiz 13 Kasım 2026 Cuma ve son ödemeniz 18 Kasım 2026',
 'Önceki Bakiye Dönem Harcamaları Faiz ve Ücretler Ödemeleriniz Dönem Borcunuz Min. Ödeme Tutarınız',
 '11.413,89 TL + 17.973,21 TL + 161,46 TL - 11.414,97 TL = 18.133,59 TL 7.254,00 TL',
 'Yurtiçi Diğer Banka Şubeleri %4,45 + 1,72 TL Kartınızla yaptığınız her bir nakit',
 'Düzenli Ödeme Ücret ve Faizi uygulanır. Buna ek olarak, EFT işlemleri için 0-8.300 TL arasına 7,97 TL, 8.300-399.000 TL arasına 15,96 TL,',
 'SGK Borç Ödeme Ücreti 100 TL ve altındaki SGK borç ödemeleri için 3,50 TL, 100 TL ve üzeri SGK borç ödemeleri için ödeme tutarının'
].join('\n');
const VAKIF = [
 'Kredi Kartı Hesap Özeti (TL)',
 'HESAP BİLGİLERİNİZ',
 'Dönem Borcunuz : 74,875.40 TL 4321 **** **** 6704',
 'Asgari Ödeme Tutarı : 29,951.00 TL',
 'Son Ödeme Tarihi : 05.10.2026 Son Ödeme Tarihi: 05.10.2026',
 'VB Müşteri No : 12345 Sayın AYŞE YILMAZ',
 'Limitiniz : 120,000.00 TL',
 'Hesap Kesim Tarihi : 30.09.2026',
 'Bir Sonraki Hesap Kesim Tarihi : 28.10.2026',
 'VakıfBank BusinessCard ile www.sgk.gov.tr üzerinden yapacağınız SGK ödemelerinizden işlem anında %2,84',
 'İŞLEM TARİHİ AÇIKLAMA TUTAR (TL) KALAN TAKSİT WORLDPUAN',
 '28.08.2026 ÖNCEKİ DÖNEM HESAP ÖZETİ BAKİYENİZ 110,876.40',
 '02.09.2026 ÖDEMENİZ İÇİN TEŞEKKÜRLER +110,876.40',
 '6509***6704 AYŞE YILMAZ',
 '30.07.2026 SPOR OUTLET 2. Taksit 1,924.50 1x1,924.50',
 '28.08.2026 BEBEK MAĞAZASI 599.94 300',
 '29.08.2026 ECZANE MERKEZ 152.62',
 '02.09.2026 Getir Perakende İSTANBULTRTR 1,309.21',
 '25.08.2026 SGK Ödem/12345678901234/3061128321 15,319.42',
 '25.08.2026 SGK Ödem 12345678901234 İŞLEM BEDELİ 435.07',
 '25.08.2026 SGK Ödem/12345678901/3061131984 10,156.73',
 '25.08.2026 Vergi Th/12345678901/0015 11,852.68',
 '25.08.2026 Vergi Th/12345678901/0003 9,189.70',
 '01.09.2026 GOOGLE *ADS1234567890/DUBLIN 4 4,657.81',
 '02.09.2026 FACEBK *2T4W85NLM4/Dublin 3,000.00',
 '05.09.2026 UBER EATS YEMEK 365.00 8',
 '16.09.2026 İADE/ UBER EATS YEMEK +69.70',
 '17.09.2026 Iade Puan-20260915 UBER EATS YEMEK +0.00 2',
 '18.09.2026 KUŞ OTEL/HATAY 8,600.00',
 '21.09.2026 TKPAY/AJET HAVA YOLL 4,003.71',
 '24.09.2026 ARAÇ KİRALAMA/HATAY 4,500.00',
 '20.09.2026 ESBPARK 1,350.00',
 '29.08.2026 OBILET BILISIM SISTE 53,547.30 1072',
 '6509***6704 Toplam Harcama Tutarı 74,875.40',
 'HESAP ÖZETİ',
 'Önceki Hesap Bakiyesi 110,876.40',
 'Dönem Içi Islemler 74,875.40',
 'Ödemeler +110,876.40',
 'Dönem Borcunuz 74,875.40'
].join('\n');
setTimeout(async function(){try{
  const w0=boot(); await tick(1200);
  const CUR=w0.eval('currentMonth()'), PREV=w0.eval("finMonthAdd196(currentMonth(),-1)"), NEXT=w0.eval("finMonthAdd196(currentMonth(),1)"), TODAY=w0.eval('todayISO()');
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.packageTypes=[{id:'p1',name:'BIREYSEL',sessions:8,price:4500}]; state.instructors=[{id:'G',name:'GIZEM',shareRate:30}];
    state.members=[{id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p1',totalPrice:4500,packages:[],monthly:{'${PREV}':{enrolled:true},'${CUR}':{enrolled:true}}}];
    state.groups=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.lessons=[]; state.finRules=[]; state.finImports=[]; state.finCounterparties=[];
    const c=finAccount196('acc-cash'); c.openingDate='${CUR}-01'; c.openingBalance=1000; const b=finAccount196('acc-bank'); b.openingDate='${CUR}-01'; b.openingBalance=50000;
    state.finAccounts=state.finAccounts.filter(a=>a.type!=='card');
    state.finAccounts.push({id:'cardK',kind:'account',type:'card',name:'Vakıf (Kerem)',bank:'VakıfBank',owner:'Kerem',openingDate:'2026-09-25',openingBalance:-100000,cutoffDay:25,dueDay:5,active:true,scopeDefault:'hane',employerSkip:true});
    state.finAccounts.push({id:'cardD',kind:'account',type:'card',name:'Garanti (Derya)',bank:'Garanti BBVA',owner:'Derya',openingDate:'2026-10-10',openingBalance:-18133.59,cutoffDay:10,dueDay:15,active:true,scopeDefault:'studio'});
    state.settings.finance.partners=['Kerem','Derya'];
    document.getElementById('member-month').innerHTML='<option value="${CUR}">${CUR}</option>'; document.getElementById('member-month').value='${CUR}';`;
  const rowsOf=(w,txt,per)=>JSON.parse(J(w,"(function(){ const r=finParseStatementText196("+JSON.stringify(txt)+",{period:'"+per+"'}); return {meta:r.meta, rows:r.rows.map(x=>[x.date,x.desc,x.amount,x.kind])}; })()"));

  console.log('[A1] Garanti biçimi: "03 Ekim 2026" tarih, taksit/bonus sütunları, +alacak, özet satırları, dönem borcu/asgari');
  { const w=boot(); await tick(1200); w.eval(FX);
    const r=rowsOf(w,GARANTI,'2026-10'); const by=d=>r.rows.find(x=>x[1].indexOf(d)!==-1);
    t('banka Garanti, kesim 10.10, son ödeme 15.10, toplam 18.133,59, asgari 7.254', r.meta.bank==='Garanti BBVA' && r.meta.kesim==='2026-10-10' && r.meta.sonOdeme==='2026-10-15' && r.meta.toplam===18133.59 && r.meta.asgari===7254, JSON.stringify(r.meta));
    t('GÖZLÜKÇÜ taksit satırı → 03.10, 1.260,00 (x6=7.560 değil)', by('GÖZLÜKÇÜ') && by('GÖZLÜKÇÜ')[0]==='2026-10-03' && by('GÖZLÜKÇÜ')[2]===1260 && by('GÖZLÜKÇÜ')[3]==='expense', JSON.stringify(by('GÖZLÜKÇÜ')));
    t('TRENDYOL taksit + bonus 0,60 → 992,00', by('TRENDYOL') && by('TRENDYOL')[2]===992 && by('TRENDYOL')[0]==='2026-09-08', JSON.stringify(by('TRENDYOL')));
    t('TRKCLL 377 · SUPERONLİNE 950 · YANDEX 896 · BSKNTDOG 117', by('TRKCLL')[2]===377 && by('SUPERONLİNE')[2]===950 && by('YANDEX')[2]===896 && by('BSKNTDOG')[2]===117);
    t('ödeme satırı 11.413,89+ → payment (atlanır)', by('TEŞEKKÜR') && by('TEŞEKKÜR')[3]==='payment' && by('TEŞEKKÜR')[2]===11413.89, JSON.stringify(by('TEŞEKKÜR')));
    t('FAIZ IADESI 1,08+ → credit', by('FAIZ IADESI') && by('FAIZ IADESI')[3]==='credit' && by('FAIZ IADESI')[2]===1.08);
    t('tarihsiz GEÇ ÖDEME FAİZİ 153,77 → kesim tarihli gider; OTOM. FATURA İŞLEM FAİZİ 5,57 gider', by('GEÇ ÖDEME') && by('GEÇ ÖDEME')[0]==='2026-10-10' && by('GEÇ ÖDEME')[2]===153.77 && by('OTOM.')[2]===5.57, JSON.stringify(by('GEÇ ÖDEME')));
    t('özet satırları yok (DEVİR, Toplam, Önceki Bakiye, Son Ödeme, Limit) ve açıklama tabloları (ücret oranları) satır değil', !r.rows.some(x=>/DEVİR|^Toplam|Önceki Bakiye|Limit|Minimum|EKSTRE ÖZETİ|Yurtiçi|EFT|Borç Ödeme Ücreti/.test(x[1])), JSON.stringify(r.rows.map(x=>x[1])));
    t('toplam satır sayısı 10 (8 gider + 1 ödeme + 1 iade)', r.rows.length===10, r.rows.length+' '+JSON.stringify(r.rows.map(x=>x[1])));
  }

  console.log('[A2] VakıfBank biçimi: "1,924.50" sayı, taksit "1x", puan sütunu, +alacak, özet satırları, vergi kodu kategorileri');
  { const w=boot(); await tick(1200); w.eval(FX);
    const r=rowsOf(w,VAKIF,'2026-09'); const by=d=>r.rows.find(x=>x[1].indexOf(d)!==-1);
    t('banka Vakıf, kesim 30.09, son ödeme 05.10, toplam 74.875,40, asgari 29.951', r.meta.bank==='VakıfBank' && r.meta.kesim==='2026-09-30' && r.meta.sonOdeme==='2026-10-05' && r.meta.toplam===74875.4 && r.meta.asgari===29951, JSON.stringify(r.meta));
    t('SPOR OUTLET taksit → 1.924,50 (1x1,924.50 değil)', by('SPOR OUTLET') && by('SPOR OUTLET')[2]===1924.5 && by('SPOR OUTLET')[0]==='2026-07-30', JSON.stringify(by('SPOR OUTLET')));
    t('BEBEK 599,94 (puan 300 değil) · ECZANE 152,62 · Getir 1.309,21 · OBILET 53.547,30', by('BEBEK')[2]===599.94 && by('ECZANE')[2]===152.62 && by('Getir')[2]===1309.21 && by('OBILET')[2]===53547.3, JSON.stringify([by('BEBEK'),by('OBILET')]));
    t('ÖDEMENİZ İÇİN TEŞEKKÜRLER +110,876.40 → payment', by('TEŞEKKÜRLER') && by('TEŞEKKÜRLER')[3]==='payment' && by('TEŞEKKÜRLER')[2]===110876.4, JSON.stringify(by('TEŞEKKÜRLER')));
    t('İADE/ UBER EATS +69.70 → credit; +0.00 puan iadesi satırı yok', by('İADE/') && by('İADE/')[3]==='credit' && by('İADE/')[2]===69.7 && !by('Iade Puan'));
    t('ÖNCEKİ DÖNEM / Toplam Harcama / HESAP ÖZETİ satırları yok', !r.rows.some(x=>/ÖNCEKİ DÖNEM|Toplam Harcama|Önceki Hesap|Dönem Içi|Ödemeler/.test(x[1])), JSON.stringify(r.rows.map(x=>x[1])));
    const g=d=>JSON.parse(J(w,"finGuessCategory196("+JSON.stringify(d)+",{amount:"+(by(d)?by(d)[2]:0)+"})"));
    t('kategori: Vergi Th …/0015 → KDV Ödemesi, …/0003 → Stopaj', g('Vergi Th/12345678901/0015').category==='KDV Ödemesi' && g('Vergi Th/12345678901/0003').category==='Stopaj', JSON.stringify([g('Vergi Th/12345678901/0015'),g('Vergi Th/12345678901/0003')]));
    t('kategori: SGK Ödem 15.319 → Vergi/SGK; işlem bedeli → Vergi/SGK; 10.156,73 (Bağ-Kur taban) → Bağkur', g('SGK Ödem/12345678901234/3061128321').category==='Vergi/SGK' && g('SGK Ödem 12345678901234 İŞLEM BEDELİ').category==='Vergi/SGK' && g('SGK Ödem/12345678901/3061131984').category==='Bağkur', JSON.stringify(g('SGK Ödem/12345678901/3061131984')));
    t('kategori: GOOGLE ADS / FACEBK → Pazarlama; UBER EATS → Market/Yemek; ECZANE → Sağlık', g('GOOGLE *ADS1234567890/DUBLIN 4').category==='Pazarlama' && g('FACEBK *2T4W85NLM4/Dublin').category==='Pazarlama' && g('UBER EATS YEMEK').category==='Market/Yemek' && g('ECZANE MERKEZ').category==='Sağlık', JSON.stringify([g('UBER EATS YEMEK'),g('ECZANE MERKEZ')]));
    t('"2. Taksit" ulaşım (TAKSİ) sanılmaz', g('SPOR OUTLET 2. Taksit').category!=='Ulaşım/Yakıt', JSON.stringify(g('SPOR OUTLET 2. Taksit')));
    t('hane kategorileri listede', w.eval("EXPENSE_CATS.includes('Market/Yemek') && EXPENSE_CATS.includes('Sağlık') && EXPENSE_CATS.includes('Giyim') && EXPENSE_CATS.includes('Ulaşım/Yakıt') && EXPENSE_CATS.includes('Abonelik/İletişim')"));
  }

  console.log('[B] Kapsam: kartın varsayılanı, stüdyo/işveren ipuçları, mükerrer, işleme (hane = gider, atla = yazılmaz), dönem borcu ön-dolum');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("switchPage('payments'); finSwitchTab196('moves'); openFinImportModal196();"); await tick(60);
    w.eval("state.expenses.push({id:'EX1',date:'2026-09-01',category:'Pazarlama',amount:4657.81,note:'elle girilmiş Google',accountId:'cardK',scope:'studio',source:'manual'});"); // mükerrer adayı
    w.eval("finImportPreview196("+JSON.stringify(VAKIF)+",'cardK','2026-09')"); await tick(60);
    const rows=JSON.parse(J(w,"__finImp196.rows.map(r=>({d:r.desc.slice(0,22),a:r.amount,s:r.scope,c:r.category,dup:!!r.dup,chk:!!r.checked,k:r.kind}))"));
    const f=d=>rows.find(r=>r.d.indexOf(d)!==-1);
    t('Kerem kartı: UBER EATS → hane; Getir → hane; BEBEK → hane', f('UBER EATS').s==='hane' && f('Getir').s==='hane' && f('BEBEK').s==='hane', JSON.stringify([f('UBER EATS'),f('Getir')]));
    t('stüdyo ipuçları: SGK/Vergi/GOOGLE/FACEBK → stüdyo', f('SGK Ödem/').s==='studio' && f('Vergi Th/12345678901/0').s==='studio' && f('GOOGLE').s==='studio' && f('FACEBK').s==='studio', JSON.stringify([f('SGK Ödem/'),f('GOOGLE')]));
    t('işveren ipuçları: OTEL/AJET/ARAÇ KİRALAMA/ESBPARK/OBILET → atla', f('KUŞ OTEL').s==='skip' && f('TKPAY/AJET').s==='skip' && f('ARAÇ KİRALAMA').s==='skip' && f('ESBPARK').s==='skip' && f('OBILET').s==='skip', JSON.stringify([f('KUŞ OTEL'),f('OBILET')]));
    t('mükerrer: 01.09 GOOGLE 4.657,81 mevcut giderle eşleşti → dup, işaretsiz', f('GOOGLE').dup===true && f('GOOGLE').chk===false, JSON.stringify(f('GOOGLE')));
    t('ödeme satırı işaretsiz, iade satırı işaretli (hane)', f('ÖDEMENİZ').chk===false && f('İADE/').chk===true && f('İADE/').s==='hane');
    const tot=w.document.getElementById('fi-total').value;
    t('dönem borcu ön-dolumu = ekstre toplamı − atlanan işveren satırları (74.875,40 − 72.001,01 = 2.874,39)', Math.abs(+tot-2874.39)<0.01, tot);
    const n0=w.eval('state.expenses.length'), m0=w.eval('state.finMoves.length');
    const res=JSON.parse(J(w,"finImportProcess196({total:"+tot+", dueDate:'2026-10-05'})")); await tick(60);
    t('işleme: hane satırları GİDER (çekim yok), atlananlar yazılmadı, mükerrer yazılmadı', res && res.skipped===5 && w.eval('state.finMoves.length')===m0 && w.eval("state.expenses.filter(e=>e.source==='card-import').length")===rows.filter(r=>r.chk && r.s!=='skip').length, JSON.stringify(res)+' moves='+w.eval('state.finMoves.length'));
    t('hane gideri scope=hane, resmi değil; stüdyo gideri scope=studio', w.eval("state.expenses.find(e=>/UBER EATS/.test(e.note)&&e.amount>0).scope")==='hane' && w.eval("state.expenses.find(e=>/UBER EATS/.test(e.note)&&e.amount>0).resmi")===false && w.eval("state.expenses.find(e=>/0015/.test(e.note)).scope")==='studio');
    t('kart kalemi (cdue) = 2.874,39, vade 05.10', w.eval("(state.finDues.find(d=>d.dtype==='card')||{}).amount")===2874.39 && w.eval("(state.finDues.find(d=>d.dtype==='card')||{}).dueDate")==='2026-10-05');
    t('kural öğrenildi: UBER EATS → Market/Yemek, kapsam BOŞ (v202: kartın varsayılanı hane öğrenilmez); KUŞ OTEL → atla', w.eval("(state.finRules.find(r=>/UBER EATS/.test(r.pattern))||{}).category")==='Market/Yemek' && w.eval("(state.finRules.find(r=>/UBER EATS/.test(r.pattern))||{}).scope")==='' && w.eval("(state.finRules.find(r=>/KUŞ OTEL/.test(r.pattern))||{}).scope")==='skip', JSON.parse(J(w,"state.finRules.map(r=>[r.pattern,r.scope||'',r.scopeAcc||''])")).join(' ; '));
    t('atlanan satırlar parmak izinde (yeniden yüklemede "zaten işlendi")', w.eval("Object.keys(finKnownFingerprints196('cardK')).length")>=rows.length-2);
    // Derya kartı: her şey stüdyo
    w.eval("openFinImportModal196(); finImportPreview196("+JSON.stringify(GARANTI)+",'cardD','2026-10')"); await tick(60);
    const r2=JSON.parse(J(w,"__finImp196.rows.map(r=>({d:r.desc.slice(0,16),s:r.scope,c:r.category}))"));
    t('Derya kartı: YANDEX/GÖZLÜKÇÜ/TRENDYOL dahil hepsi stüdyo', r2.filter(r=>/YANDEX|GÖZLÜKÇÜ|TRENDYOL|TRKCLL|SUPER/.test(r.d)).every(r=>r.s==='studio'), JSON.stringify(r2));
    t('kategori ipuçları: TRKCLL/SUPERONLİNE → Abonelik/İletişim; BSKNTDOG → Elektrik/Su/Doğalgaz; YANDEX → Ulaşım/Yakıt', r2.find(r=>/TRKCLL/.test(r.d)).c==='Abonelik/İletişim' && r2.find(r=>/SUPER/.test(r.d)).c==='Abonelik/İletişim' && r2.find(r=>/BSKNTDOG/.test(r.d)).c==='Elektrik/Su/Doğalgaz' && r2.find(r=>/YANDEX/.test(r.d)).c==='Ulaşım/Yakıt', JSON.stringify(r2));
  }

  console.log('[C] Gelir: hareket op income, gelir şablonu → vade → Alındı → hareket; projeksiyon; rapor');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("state.finAccounts.push({id:'kbank',kind:'account',type:'bank',name:'Kerem Banka',bank:'',owner:'Kerem',openingDate:'"+CUR+"-01',openingBalance:10000,active:true});");
    w.eval("state.finMoves.push({id:'INC1',kind:'move',op:'income',date:'"+CUR+"-05',amount:100000,toAccountId:'kbank',scope:'hane',title:'Kerem maaş',note:''});");
    t('gelir hareketi bakiyeye girer: Kerem Banka 110.000', w.eval("finBalance196('kbank')")===110000, w.eval("finBalance196('kbank')"));
    t('finCash196 Kerem Banka\'yı da toplar (1.000 + 50.000 + 110.000)', w.eval('finCash196()')===161000, w.eval('finCash196()'));
    t('hareket türü gelir', w.eval("finMovements196().find(m=>m.srcId==='INC1').type")==='gelir');
    w.eval("state.finCounterparties.push({id:'CPW',kind:'counterparty',name:'İŞVEREN',type:'other',active:true}); state.finTemplates.push({id:'TM',kind:'template',title:'Kerem maaş',amount:100000,dayOfMonth:5,category:'Diğer',counterpartyId:'CPW',accountId:'kbank',resmi:false,kdvRate:0,startMonth:'"+NEXT+"',endMonth:'',active:true,flow:'in',scope:'hane'});");
    const n=w.eval('finEnsureTemplateDues196()');
    t('gelir şablonu → gelir vadesi (dtype income, '+NEXT+'-05)', n===1 && w.eval("state.finDues.find(d=>d.templateId==='TM').dtype")==='income' && w.eval("state.finDues.find(d=>d.templateId==='TM').dueDate")===NEXT+'-05', J(w,'state.finDues'));
    t('ödeme listesinde değil, tahsilat listesinde', !w.eval("finDueItems196().some(d=>d.dtype==='income')") && w.eval("typeof finIncomeDues200==='function' && finIncomeDues200().length===1"));
    const pr=JSON.parse(J(w,"(function(){ const p=finProjection196(60); return {inn:p.totIn, ev:p.events.filter(e=>e.kind==='income').length}; })()"));
    t('projeksiyon: +100.000 giriş olayı', pr.ev===1 && pr.inn>=100000, JSON.stringify(pr));
    w.eval("finSwitchTab196('dues')"); await tick(60);
    const dues=w.document.getElementById('fin-dues-body').textContent;
    t('Vadeler: Yaklaşan Tahsilatlar altında "Kerem maaş" ve Alındı düğmesi', /Yaklaşan Tahsilatlar[\s\S]*Kerem maaş/.test(dues) && /Alındı/.test(dues), dues.slice(0,300));
    const id=w.eval("state.finDues.find(d=>d.templateId==='TM').id");
    const mv=JSON.parse(J(w,"finPayDue196('"+id+"',{amount:100000,date:'"+NEXT+"-05',accountId:'kbank',note:''})||null"));
    t('Alındı → gelir hareketi (income, kbank, hane), vade ödendi, Kerem Banka 210.000', mv && mv.op==='income' && mv.toAccountId==='kbank' && mv.scope==='hane' && w.eval("state.finDues.find(d=>d.templateId==='TM').status")==='paid' && w.eval("finBalance196('kbank')")===210000, JSON.stringify(mv)+' '+w.eval("finBalance196('kbank')"));
    w.eval("state.finDues.find(d=>d.templateId==='TM').status='open'; finSwitchTab196('cari')"); await tick(60);
    { const c=w.document.getElementById('fin-cari-body').textContent; const seg=c.slice(c.indexOf('İŞVEREN'), c.indexOf('İŞVEREN')+90); t('Cari: gelir vadesi "biz borçluyuz"a girmez (İŞVEREN satırı 100.000 göstermez)', c.indexOf('İŞVEREN')!==-1 && !/100\.000/.test(seg) && !/Biz borçluyuz: <b>100/.test(c), seg); }
    w.eval("state.finDues.find(d=>d.templateId==='TM').status='paid'");
    w.eval("removeFinMove196('"+mv.id+"')"); await tick(80);
    t('gelir hareketi silinince vade yeniden açık', w.eval("state.finDues.find(d=>d.templateId==='TM').status")==='open');
  }

  console.log('[D] Hesap türleri (banka/kasa ekleme), raporda Stüdyo net / Hane net, netProfitForMonth hane dışı');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("openFinAccountModal196('')"); await tick(40);
    t('yeni hesap penceresinde tür seçici var', !!w.document.getElementById('fa-type'));
    w.document.getElementById('fa-type').value='bank'; w.document.getElementById('fa-name').value='Kerem Banka'; w.document.getElementById('fa-open').value=CUR+'-01'; w.document.getElementById('fa-bal').value='10000'; w.document.getElementById('fa-owner').value='Kerem';
    w.eval("saveFinAccount196('')"); await tick(40);
    const kb=JSON.parse(J(w,"state.finAccounts.find(a=>a.name==='Kerem Banka')||null"));
    t('banka türünde hesap açıldı, açılış +10.000', kb && kb.type==='bank' && kb.openingBalance===10000 && kb.openingDate===CUR+'-01', JSON.stringify(kb));
    w.eval("state.payments.push({id:'PA',memberId:'A',groupId:'',date:'"+CUR+"-05',packageMonth:'"+CUR+"',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'IBAN',note:''});"
      +"state.expenses.push({id:'E1',date:'"+CUR+"-06',category:'Kira',amount:33000,note:'stüdyo kirası',accountId:'acc-bank',scope:'studio',resmi:true,kdvRate:0});"
      +"state.expenses.push({id:'E2',date:'"+CUR+"-10',category:'Kira',amount:22000,note:'ev kirası',accountId:'"+kb.id+"',scope:'hane',resmi:false,kdvRate:0});"
      +"state.expenses.push({id:'E3',date:'"+CUR+"-12',category:'Market/Yemek',amount:1500,note:'market',accountId:'"+kb.id+"',scope:'hane',resmi:false,kdvRate:0});"
      +"state.finMoves.push({id:'INC1',kind:'move',op:'income',date:'"+CUR+"-05',amount:100000,toAccountId:'"+kb.id+"',scope:'hane',title:'Kerem maaş',note:''});");
    const np=JSON.parse(J(w,"netProfitForMonth('"+CUR+"')"));
    t('netProfitForMonth: stüdyo gider 33.000 (hane 23.500 hariç), hane ayrı alanda, net 4.500−33.000', np.exp===33000 && np.hane===23500 && np.net===-28500, JSON.stringify(np));
    const pl=JSON.parse(J(w,"finPlRows196(['"+CUR+"'])"));
    const row=l=>pl.find(r=>r.label===l);
    t('rapor: Stüdyo net satırı −28.500', row('Stüdyo net') && row('Stüdyo net').vals[0]===-28500, JSON.stringify(pl.map(r=>[r.label,r.vals[0]])));
    t('rapor: Diğer gelir (hane) +100.000, Hane · Kira −22.000, Hane · Market/Yemek −1.500', row('Diğer gelir (hane)') && row('Diğer gelir (hane)').vals[0]===100000 && row('Hane · Kira').vals[0]===-22000 && row('Hane · Market/Yemek').vals[0]===-1500);
    t('rapor: Hane net = −28.500 + 100.000 − 23.500 = 48.000', row('Hane net') && row('Hane net').vals[0]===48000, JSON.stringify(row('Hane net')));
    t('stüdyo giderinde hane satırı yok ("Gider · Kira" yalnız 33.000)', row('Gider · Kira') && row('Gider · Kira').vals[0]===-33000);
    t('Kerem Banka bakiyesi 10.000 + 100.000 − 22.000 − 1.500 = 86.500', w.eval("finBalance196('"+kb.id+"')")===86500, w.eval("finBalance196('"+kb.id+"')"));
    w.eval("finSwitchTab196('reports')"); await tick(60);
    const rep=w.document.getElementById('fin-reports-body').textContent;
    t('rapor ekranında Stüdyo net ve Hane net görünür', /Stüdyo net/.test(rep) && /Hane net/.test(rep));
    w.eval("switchPage('payments'); renderExpenses('"+CUR+"')"); await tick(40);
    const ex=w.document.getElementById('expenses-list').textContent;
    t('Giderler listesinde hane rozeti', /hane/i.test(ex), ex.slice(0,200));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
