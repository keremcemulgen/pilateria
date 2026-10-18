// v196 ADIM 4 — KART EKSTRESİ OKUYUCU: genel satır çözümleyici (3 banka tarzı sahte ekstre), dönem borcu / son ödeme yakalama,
// kategori ipuçları + öğrenen kurallar, çift kayıt koruması (parmak izi), işleme (gider / iade / şahsi → ortak çekimi / kart ödemesi
// atlanır), kart vade kalemi, kart borcu ödemesinin kalemi kapatması, önizleme ekranı. (PDF metin çıkarımı Chromium denetiminde.)
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
const GARANTI=`GARANTİ BBVA BONUS KART HESAP ÖZETİ
Hesap Kesim Tarihi: 15/10/2026   Son Ödeme Tarihi: 25/10/2026
Dönem Borcu: 3.245,40 TL   Asgari Ödeme Tutarı: 1.298,16 TL
İşlem Tarihi  Açıklama  Tutar
02/10/2026  MİGROS KADIKÖY İSTANBUL  1.240,50 TL
05/10/2026  DECATHLON ATAŞEHİR  899,90 TL
07/10/2026  İSKİ SU FATURASI OTOMATİK ÖDEME  305,00 TL
09/10/2026  STARBUCKS MODA  120,00 TL
10/10/2026  TRENDYOL İADE  -120,00 TL
12/10/2026  ÖDEME - TEŞEKKÜR EDERİZ  -2.500,00 TL
02/10/2026  MİGROS KADIKÖY İSTANBUL  1.240,50 TL
Toplam: 3.245,40`;
const VAKIF=`VAKIFBANK WORLD KART EKSTRESİ
Son Ödeme Tarihi 20.10.2026
Toplam Borç 2.000,00
03.10.26 AMAZON TR TAKSİT 2/6 500,00
06.10.26 KOÇTAŞ 1.500,00`;
const TF=`TÜRKİYE FİNANS HAPPY KART
Ekstre Borcu: 700,00  Son Ödeme Günü: 28/10/2026
01/10 BİM MAĞAZA 200,00
03/10 CANVA PTY LTD 500,00
04/10 BİM MAĞAZA (200,00)`;
setTimeout(async function(){try{
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.packageTypes=[{id:'p1',name:'BIREYSEL',sessions:8,price:4500}]; state.instructors=[]; state.members=[]; state.groups=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.finCounterparties=[{id:'CP1',kind:'counterparty',name:'KIRALAYAN',type:'landlord',active:true}]; state.finRules=[]; state.finImports=[];
    const c=finAccount196('acc-cash'); c.openingDate='2026-09-01'; c.openingBalance=1000; const b=finAccount196('acc-bank'); b.openingDate='2026-09-01'; b.openingBalance=50000;
    state.finAccounts.push({id:'card1',kind:'account',type:'card',name:'Garanti Bonus',bank:'Garanti BBVA',owner:'Kerem',openingDate:'2026-09-01',openingBalance:-1000,cutoffDay:15,dueDay:25,active:true});
    document.getElementById('pay-month').value='2026-10';`;

  console.log('[1] Garanti tarzı metin: üst bilgi + satırlar + türler + parmak izi');
  { const w=boot(); await tick(1200); w.eval(FX);
    const r=JSON.parse(J(w,"finParseStatementText196("+JSON.stringify(GARANTI)+",{period:'2026-10'})"));
    t('banka, son ödeme 2026-10-25, kesim 2026-10-15, dönem borcu 3.245,40, asgari 1.298,16', r.meta.bank==='Garanti BBVA' && r.meta.sonOdeme==='2026-10-25' && r.meta.kesim==='2026-10-15' && r.meta.toplam===3245.4 && r.meta.asgari===1298.16, JSON.stringify(r.meta));
    t('7 satır (başlık ve Toplam satırı atlandı)', r.rows.length===7, r.rows.length+' '+JSON.stringify(r.rows.map(x=>x.desc)));
    const mig=r.rows.filter(x=>/MİGROS/.test(x.desc));
    t('MİGROS: tarih ISO, tutar 1.240,50, açıklama temiz, iki satır farklı parmak izi (…|0, …|1)', mig.length===2 && mig[0].date==='2026-10-02' && mig[1].date==='2026-10-02' && mig[0].amount===1240.5 && mig[0].desc==='MİGROS KADIKÖY İSTANBUL' && mig[0].fp!==mig[1].fp && /\|0$/.test(mig[0].fp) && /\|1$/.test(mig[1].fp), JSON.stringify(mig));
    t('TRENDYOL İADE → iade (credit), ÖDEME-TEŞEKKÜR → kart ödemesi (payment)', r.rows.find(x=>/TRENDYOL/.test(x.desc)).kind==='credit' && r.rows.find(x=>/TEŞEKKÜR/.test(x.desc)).kind==='payment' && r.rows.find(x=>/TEŞEKKÜR/.test(x.desc)).amount===2500);
    t('İSKİ otomatik ödeme → gider (ÖDEME kelimesi iade değilse kart ödemesi sayılmaz)', r.rows.find(x=>/İSKİ/.test(x.desc)).kind==='expense' && r.rows.find(x=>/İSKİ/.test(x.desc)).amount===305);
    t('merchant anahtarı: sayılar/noktalama temiz', w.eval("finMerchantKey196('MİGROS KADIKÖY İSTANBUL 123')")==='MİGROS KADIKÖY' && w.eval("finMerchantKey196('AMAZON TR TAKSİT 2/6')")==='AMAZON');
  }

  console.log('[2] Vakıf tarzı (gg.aa.yy, TL yok, taksit) ve Türkiye Finans tarzı (yılsız tarih, parantezli iade)');
  { const w=boot(); await tick(1200); w.eval(FX);
    const v=JSON.parse(J(w,"finParseStatementText196("+JSON.stringify(VAKIF)+",{period:'2026-10'})"));
    t('Vakıf: banka, son ödeme 2026-10-20, toplam 2.000, 2 satır, yıl 2026, taksit açıklamada', v.meta.bank==='VakıfBank' && v.meta.sonOdeme==='2026-10-20' && v.meta.toplam===2000 && v.rows.length===2 && v.rows[0].date==='2026-10-03' && /TAKSİT 2\/6/.test(v.rows[0].desc) && v.rows[0].amount===500 && v.rows[1].amount===1500, JSON.stringify(v));
    const f=JSON.parse(J(w,"finParseStatementText196("+JSON.stringify(TF)+",{period:'2026-10'})"));
    t('TF: banka, son ödeme 2026-10-28, ekstre borcu 700, yılsız tarih → 2026, parantez → iade', f.meta.bank==='Türkiye Finans' && f.meta.sonOdeme==='2026-10-28' && f.meta.toplam===700 && f.rows.length===3 && f.rows[0].date==='2026-10-01' && f.rows[2].kind==='credit' && f.rows[2].amount===200, JSON.stringify(f));
    const y=JSON.parse(J(w,"finParseStatementText196('28/12 MARKET 100,00\\n02/01 MARKET 50,00',{period:'2026-01'})"));
    t('yılsız Aralık satırı Ocak dönemi için önceki yıla düşer', y.rows[0].date==='2025-12-28' && y.rows[1].date==='2026-01-02', JSON.stringify(y.rows.map(x=>x.date)));
    t('tutar çözümleme: 1.234,56 / -500,00 / 12,5 TL / ₺ 3.000,00', w.eval("finParseAmountTR196('1.234,56')")===1234.56 && w.eval("finParseAmountTR196('-500,00')")===-500 && w.eval("finParseAmountTR196('12,5 TL')")===12.5 && w.eval("finParseAmountTR196('₺ 3.000,00')")===3000);
  }

  console.log('[3] Kategori ipuçları + öğrenen kurallar');
  { const w=boot(); await tick(1200); w.eval(FX);
    t('MİGROS → Market/Yemek (v200), DECATHLON → Malzeme/Ekipman, İSKİ → Elektrik/Su/Doğalgaz, STARBUCKS → Market/Yemek (v200)', w.eval("finGuessCategory196('MİGROS KADIKÖY').category")==='Market/Yemek' && w.eval("finGuessCategory196('DECATHLON ATAŞEHİR').category")==='Malzeme/Ekipman' && w.eval("finGuessCategory196('İSKİ SU FATURASI').category")==='Elektrik/Su/Doğalgaz' && w.eval("finGuessCategory196('STARBUCKS MODA').category")==='Market/Yemek', w.eval("finGuessCategory196('MİGROS KADIKÖY').category")+' '+w.eval("finGuessCategory196('STARBUCKS MODA').category"));
    w.eval("finLearnRule196('STARBUCKS MODA','Pazarlama','',false); finLearnRule196('MİGROS KADIKÖY İSTANBUL','Malzeme/Ekipman','CP1',true);");
    const g=JSON.parse(J(w,"finGuessCategory196('STARBUCKS MODA KADIKÖY')"));
    t('kural öğrenildi: STARBUCKS → Pazarlama, işletme dışı, kuraldan', g.category==='Pazarlama' && g.business===false && g.fromRule===true, JSON.stringify(g));
    t('MİGROS kuralı ipucunu geçer (Malzeme/Ekipman + cari)', w.eval("finGuessCategory196('MİGROS KADIKÖY İSTANBUL 77').category")==='Malzeme/Ekipman' && w.eval("finGuessCategory196('MİGROS KADIKÖY İSTANBUL 77').counterpartyId")==='CP1');
    w.eval("finLearnRule196('STARBUCKS MODA','Diğer','',true)");
    t('aynı anahtar güncellenir (tek kural, hits 2)', w.eval("state.finRules.filter(r=>r.pattern==='STARBUCKS MODA').length")===1 && w.eval("state.finRules.find(r=>r.pattern==='STARBUCKS MODA').hits")===2 && w.eval("state.finRules.find(r=>r.pattern==='STARBUCKS MODA').business")===true);
  }

  console.log('[4] İşleme: gider / iade / şahsi → v200: HANE GİDERİ (ortak çekimi değil) / kart ödemesi atlanır; parmak izi; kart vade kalemi; Geri Al');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("finImportPreview196("+JSON.stringify(GARANTI)+",'card1','2026-10')");
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    t('önizleme: 7 satır; kart ödemesi işaretsiz, diğerleri işaretli; hiçbiri çift değil', rows.length===7 && rows.filter(r=>r.checked).length===6 && !rows.find(r=>r.kind==='payment').checked && rows.every(r=>!r.dup), JSON.stringify(rows.map(r=>r.checked)));
    w.eval("__finImp196.rows.forEach(function(r){ if (/STARBUCKS/.test(r.desc)) { r.business=false; } if (/DECATHLON/.test(r.desc)) { r.counterpartyId='CP1'; } });");
    const res=JSON.parse(J(w,"finImportProcess196({total:3245.4, dueDate:'2026-10-25'})"));
    t('sonuç (v200): 5 gider (1 hane) + 1 iade, çekim YOK, kalem eklendi', res && res.expenses===5 && res.credits===1 && res.draws===0 && res.hane===1 && res.skipped===0 && res.due===true, JSON.stringify(res));
    t('giderler: kart hesabı, parmak izi, kaynak card-import, DECATHLON cari CP1', w.eval("state.expenses.length")===6 && w.eval("state.expenses.every(e=>e.accountId==='card1' && e.fingerprint && e.source==='card-import')") && w.eval("state.expenses.find(e=>/DECATHLON/.test(e.note)).counterpartyId")==='CP1');
    t('iade negatif gider', w.eval("state.expenses.find(e=>/TRENDYOL/.test(e.note)).amount")===-120);
    t('STARBUCKS → v200: HANE kapsamlı gider (karttan), ortak çekimi hareketi yok', w.eval("state.finMoves.length")===0 && w.eval("state.expenses.filter(e=>finExpScope200(e)==='hane').length")===1 && w.eval("state.expenses.find(e=>/STARBUCKS/.test(e.note)).scope")==='hane' && w.eval("state.expenses.find(e=>/STARBUCKS/.test(e.note)).amount")===120 && w.eval("state.expenses.filter(e=>finExpScope200(e)==='studio').length")===5, J(w,'state.expenses.map(e=>[e.note,e.amount,e.scope])'));
    t('kart bakiyesi: −1.000 − 3.805,90 + 120 = −4.685,90', w.eval("finBalance196('card1')")===-4685.9, w.eval("finBalance196('card1')"));
    t('kart vade kalemi: cdue-card1-2026-10, 3.245,40, 25.10, açık; türetilmiş hatırlatıcı YOK', w.eval("state.finDues.find(d=>d.id==='cdue-card1-2026-10').amount")===3245.4 && w.eval("state.finDues[0].dueDate")==='2026-10-25' && w.eval("state.finDues[0].status")==='open' && w.eval('finCardReminders196().length')===0 && w.eval("finDueItems196().some(d=>d.dtype==='card' && d.amount===3245.4)"));
    t('ekstre kaydı: 6 parmak izi, banka, dönem', w.eval("state.finImports.length")===1 && w.eval("state.finImports[0].fingerprints.length")===6 && w.eval("state.finImports[0].bank")==='Garanti BBVA' && w.eval("state.finImports[0].period")==='2026-10');
    t('kurallar öğrenildi (MİGROS, DECATHLON, İSKİ, STARBUCKS, TRENDYOL)', w.eval("state.finRules.length")>=5 && w.eval("state.finRules.find(r=>r.pattern==='STARBUCKS MODA').business")===false);
    t('Geri Al yedeği', w.eval("(__undoStack||[]).some(s=>/Kart ekstresi/.test(s.label))"));
    // çift kayıt koruması
    w.eval("finImportPreview196("+JSON.stringify(GARANTI)+",'card1','2026-10')");
    const rows2=JSON.parse(J(w,'__finImp196.rows'));
    t('aynı ekstre tekrar: 6 satır "zaten işlendi" + işaretsiz; işle → seçim yok', rows2.filter(r=>r.dup).length===6 && rows2.every(r=>!r.checked) && w.eval("finImportProcess196({total:3245.4,dueDate:'2026-10-25'})")===null && w.eval("state.expenses.length")===6, JSON.stringify(rows2.map(r=>[r.dup,r.checked]))+' '+w.eval("state.expenses.length"));
    // üst üste binen ekstre: yalnız yeni satır işlenir
    w.eval("finImportPreview196("+JSON.stringify(GARANTI+'\n16/10/2026  YENİ MAĞAZA  50,00 TL')+",'card1','2026-10')");
    t('binişen ekstre: yalnız 1 yeni satır işaretli', w.eval("__finImp196.rows.filter(r=>r.checked).length")===1 && w.eval("__finImp196.rows.find(r=>r.checked).desc")==='YENİ MAĞAZA');
    const r3=JSON.parse(J(w,"finImportProcess196({total:3245.4,dueDate:'2026-10-25'})"));
    t('ikinci işleme: 1 gider, kalem güncellendi (tek kalem)', r3.expenses===1 && w.eval("state.expenses.length")===7 && w.eval("state.finDues.filter(d=>d.dtype==='card').length")===1, JSON.stringify(r3)+' '+w.eval("state.expenses.length"));
  }

  console.log('[5] Kart borcu ödemesi ekstre kalemini kapatır; kısmi azaltır; hareket silinince yeniden açılır');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("state.finDues.push({id:'cdue-card1-2026-10',kind:'due',dtype:'card',title:'ekstre',amount:3245.4,dueDate:'2026-10-25',period:'2026-10',accountId:'card1',status:'open'})");
    w.eval("openFinMoveModal196('cardpay')"); await tick();
    w.document.getElementById('fm-amount').value='1000'; w.document.getElementById('fm-date').value='2026-10-20'; w.eval('saveFinMove196()'); await tick(50);
    t('kısmi ödeme 1.000 → kalem 2.245,40 açık', w.eval("state.finDues[0].status")==='open' && w.eval("state.finDues[0].amount")===2245.4, J(w,'state.finDues[0]'));
    w.eval("openFinMoveModal196('cardpay')"); await tick();
    w.document.getElementById('fm-amount').value='2245.4'; w.document.getElementById('fm-date').value='2026-10-24'; w.eval('saveFinMove196()'); await tick(50);
    t('kalan ödenince kalem kapandı (paidRef → hareket)', w.eval("state.finDues[0].status")==='paid' && w.eval("state.finDues[0].paidRef.type")==='move');
    const mid=w.eval("state.finDues[0].paidRef.id"); await w.eval("removeFinMove196('"+mid+"')"); await tick(50);
    t('hareket silinince kalem yeniden açık', w.eval("state.finDues[0].status")==='open' && !w.eval("state.finDues[0].paidRef"));
  }

  console.log('[6] Pencere: kart seçimi, metin yapıştır → önizleme tablosu → İşle');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("openFinImportModal196()"); await tick();
    t('pencere açıldı, kart listesi Garanti Bonus · Kerem', !!w.document.getElementById('modal-fin-imp') && /Garanti Bonus.*Kerem/.test(w.document.getElementById('fi-acc').textContent));
    w.document.getElementById('fi-text').value=TF; w.document.getElementById('fi-period').value='2026-10';
    await w.eval('finImportRead196()'); await tick(100);
    const pv=w.document.getElementById('fi-preview');
    t('önizleme: 3 satır, Türkiye Finans, dönem borcu 700 ve son ödeme dolu, İşle (3 satır)', pv.querySelectorAll('tbody tr').length===3 && /Türkiye Finans/.test(pv.textContent) && w.document.getElementById('fi-total').value==='700' && w.document.getElementById('fi-due').value==='2026-10-28' && /İşle \(3 satır\)/.test(w.document.getElementById('fi-process').textContent));
    t('iade satırı rozeti, kategori + cari + kapsam seçicileri (v200: 3×3)', /iade/.test(pv.textContent) && pv.querySelectorAll('tbody select').length===9 && /Kapsam/.test(pv.textContent), pv.querySelectorAll('tbody select').length);
    w.eval('finImportProcess196()'); await tick(50);
    t('İşle → pencere kapandı, 3 gider (biri iade), kart kalemi 700 / 28.10', !w.document.getElementById('modal-fin-imp') && w.eval("state.expenses.length")===3 && w.eval("state.expenses.filter(e=>e.amount<0).length")===1 && w.eval("state.finDues.find(d=>d.dtype==='card').amount")===700);
    w.eval("state.finAccounts=state.finAccounts.filter(a=>a.type!=='card'); __msgs=[];"); w.eval("openFinImportModal196()");
    t('kart hesabı yoksa yönlendirme', !w.document.getElementById('modal-fin-imp') && w.__msgs.some(m=>/kart hesabı ekle/.test(m)));
  }

  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST COKTU',e);process.exit(2);}},50);
