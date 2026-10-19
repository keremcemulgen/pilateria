// v206 (Kerem 19.10 "Buradaki Ekim giderleri tamamen ödendi; bir yanlışlık var, çözemedim"): kart ekstresi kalemi (içe aktarmadan gelen SAKLI
// kalem, dtype 'card') "🏦 Öde" ile ödenince GİDER yazılmamalı — bankadan karta geçiş (finMoves 'cardpay') olmalı. Canlıda saklı kalem genel gider
// yoluna düşüyordu, hesap varsayılanı kartın kendisiydi: 207.771,53 ₺ sahte gider + kart borçları ikiye katlandı. Ayrıca gecikmiş kalemde ödeme
// günü bugün geliyordu (tikler sonradan atıldığı için tarihler yanlış). Yamasız (v205) yapıda [1], [2], [4], [5], [6], [8] BAŞARISIZ olmalı.
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
setTimeout(async function(){try{
  const w0=boot(); await tick(1200);
  const T=w0.eval('todayISO()'); const D=k=>w0.eval("addDaysISO(todayISO(),"+k+")");
  const P30=D(-30), P25=D(-25), P20=D(-20), P14=D(-14), P10=D(-10), F20=D(20);
  const FX=(opened)=>`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.packageTypes=[]; state.instructors=[]; state.members=[]; state.groups=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.finCounterparties=[]; state.finRules=[]; state.finImports=[];
    const c=finAccount196('acc-cash'); const b=finAccount196('acc-bank');
    ${opened ? "c.openingDate='"+P30+"'; c.openingBalance=1000; b.openingDate='"+P30+"'; b.openingBalance=50000;" : "c.openingDate=''; c.openingBalance=0; b.openingDate=''; b.openingBalance=0;"}
    state.finAccounts.push({id:'kbank',kind:'account',type:'bank',name:'Kerem Banka',owner:'Kerem ÖZTEPE',openingDate:'',openingBalance:0,active:true});
    state.finAccounts.push({id:'cardK',kind:'account',type:'card',name:'Vakıf (Kerem)',bank:'VakıfBank',owner:'Kerem ÖZTEPE',openingDate:'${P25}',openingBalance:-1000,cutoffDay:25,dueDay:5,active:true,scopeDefault:'hane'});
    state.finAccounts.push({id:'cardD',kind:'account',type:'card',name:'Vakıf (Derya)',bank:'VakıfBank',owner:'Derya ÖZTEPE',openingDate:'${P20}',openingBalance:-2000,cutoffDay:30,dueDay:5,active:true,scopeDefault:'studio'});
    state.finDues.push({id:'cK',kind:'due',dtype:'card',title:'💳 Vakıf (Kerem) — ekstre',amount:1000,dueDate:'${P14}',period:'${P14.slice(0,7)}',accountId:'cardK',status:'open'});
    state.finDues.push({id:'cD',kind:'due',dtype:'card',title:'💳 Vakıf (Derya) — ekstre',amount:2000,dueDate:'${P14}',period:'${P14.slice(0,7)}',accountId:'cardD',status:'open'});
    state.finDues.push({id:'kira',kind:'due',dtype:'expense',title:'Kira',amount:3000,dueDate:'${P10}',period:'${P10.slice(0,7)}',category:'Kira',accountId:'acc-bank',resmi:true,kdvRate:0,status:'open'});
    state.finDues.push({id:'kiraF',kind:'due',dtype:'expense',title:'Kira',amount:3000,dueDate:'${F20}',period:'${F20.slice(0,7)}',category:'Kira',accountId:'acc-bank',resmi:true,kdvRate:0,status:'open'});
    state.finDues.push({id:'maas',kind:'due',dtype:'income',title:'Kerem maaşı',amount:100000,dueDate:'${P14}',period:'${P14.slice(0,7)}',category:'Diğer',accountId:'kbank',scope:'hane',status:'open'});
    switchPage('payments'); finSwitchTab196('dues');`;

  console.log('[1] Saklı ekstre kalemi "🏦 Öde" → KART ÖDEMESİ penceresi (gider penceresi değil); kaynak yalnız banka/kasa; varsayılanlar');
  { const w=boot(); await tick(1200); w.eval(FX(true));
    w.eval("finPayItem196('cK')"); await tick(60);
    const m=w.document.getElementById('modal-fin-cardpay');
    t('kart ödemesi penceresi açıldı, gider penceresi açılmadı', !!m && !w.document.getElementById('modal-fin-pay'), !!m+' '+!!w.document.getElementById('modal-fin-pay'));
    const opts=m?[...w.document.querySelectorAll('#fcp-from option')].map(o=>o.value):[];
    t('kaynak listesinde kart YOK (Kasa, Banka, Kerem Banka)', opts.length===3 && !opts.includes('cardK') && !opts.includes('cardD') && opts.includes('kbank'), JSON.stringify(opts));
    t('varsayılan kaynak: kart sahibinin bankası (Kerem Banka); tutar 1.000; gün = vade (gecikmiş)', m && w.document.getElementById('fcp-from').value==='kbank' && w.document.getElementById('fcp-amount').value==='1000' && w.document.getElementById('fcp-date').value===P14, m && [w.document.getElementById('fcp-from').value,w.document.getElementById('fcp-amount').value,w.document.getElementById('fcp-date').value].join(','));
    t('açılmamış hesap notu görünür; "gider değildir" açıklaması var', m && w.document.getElementById('fcp-pre-note').style.display!=='none' && /gider değildir/.test(m.textContent));
    if (m) m.remove();
    w.eval("finPayItem196('cD')"); await tick(60);
    t('Derya kartı: sahibinin bankası yok → varsayılan Banka', !!w.document.getElementById('modal-fin-cardpay') && w.document.getElementById('fcp-from').value==='acc-bank');
  }

  console.log('[2] Kaydet → cardpay hareketi (banka → kart), kalem kapanır, GİDER YOK; kart bakiyesi düşer; açılmamış banka bakiyesi yok');
  { const w=boot(); await tick(1200); w.eval(FX(true));
    w.eval("finPayItem196('cK')"); await tick(60);
    const sv=w.document.getElementById('fcp-save'); if (sv) sv.click(); await tick(80);
    const mv=JSON.parse(J(w,"(state.finMoves||[])[0]||null"));
    t('hareket: cardpay, Kerem Banka → Vakıf (Kerem), 1.000, gün = vade, dueId', mv && mv.op==='cardpay' && mv.fromAccountId==='kbank' && mv.toAccountId==='cardK' && mv.amount===1000 && mv.date===P14 && mv.dueId==='cK', JSON.stringify(mv));
    t('gider kaydı OLUŞMADI', w.eval("state.expenses.length")===0, w.eval("state.expenses.length"));
    t('kalem ödendi (paidRef hareket), pencere kapandı', w.eval("state.finDues.find(d=>d.id==='cK').status")==='paid' && w.eval("state.finDues.find(d=>d.id==='cK').paidRef.type")==='move' && !w.document.getElementById('modal-fin-cardpay'));
    t('kart bakiyesi −1.000 + 1.000 = 0; Kerem Banka açılmadı → bakiye yok', w.eval("finBalance196('cardK')")===0 && w.eval("finBalance196('kbank')")===null, w.eval("finBalance196('cardK')"));
    t('türetilmiş kart hatırlatıcısı YOK (borç kalmadı)', w.eval("finCardReminders196().filter(r=>r.accountId==='cardK').length")===0);
    const pl=JSON.parse(J(w,"finPlRows196(['"+P14.slice(0,7)+"'])"));
    t('Gelir–Gider: gider satırı yok (kart ödemesi gider değil)', !pl.some(r=>/^Gider · |^Hane · /.test(r.label) && r.vals[0]!==0), JSON.stringify(pl.map(r=>[r.label,r.vals])));
    t('toast: açılış öncesi notu', w.__msgs.length>=0); // plToast jsdom'da DOM'a yazar; kontrol hareket/bakiye ile yapıldı
  }

  console.log('[3] Açık bankadan ödeme: Banka bakiyesi düşer; nakit akış tablosunda "kart" çıkışı; Hareketler listesinde iki bacak');
  { const w=boot(); await tick(1200); w.eval(FX(true));
    const mv=JSON.parse(J(w,"finPayCardDue206('cD',{amount:2000,date:'"+P14+"',fromAccountId:'acc-bank'})"));
    t('Banka 50.000 − 2.000 = 48.000; kart 0', w.eval("finBalance196('acc-bank')")===48000 && w.eval("finBalance196('cardD')")===0, w.eval("finBalance196('acc-bank')")+' '+w.eval("finBalance196('cardD')"));
    const cf=JSON.parse(J(w,"finCashflowRows196(['"+P14.slice(0,7)+"'])"))[0];
    t('nakit akış: out:kart 2.000', cf && cf.by && cf.by['out:kart']===2000, JSON.stringify(cf&&cf.by));
    t('Hareketler: aynı hareketin iki bacağı (banka çıkış, kart giriş)', w.eval("finMovements196().filter(m=>m.srcId==='"+mv.id+"').length")===2);
  }

  console.log('[4] Programatik finPayDue196 kart kalemine: kaynak kart → RED; banka → hareket (gider yok)');
  { const w=boot(); await tick(1200); w.eval(FX(true));
    const r1=w.eval("finPayDue196('cK',{amount:1000,date:'"+P14+"',accountId:'cardK'})");
    t('kaynak kart → null + uyarı, kalem açık, gider yok', r1===null && w.__msgs.some(m=>/kart hesabından ödenemez/.test(m)) && w.eval("state.finDues.find(d=>d.id==='cK').status")==='open' && w.eval("state.expenses.length")===0, JSON.stringify(w.__msgs));
    const r2=JSON.parse(J(w,"finPayDue196('cK',{amount:1000,date:'"+P14+"',accountId:'acc-bank'})"));
    t('kaynak Banka → cardpay hareketi döner, kalem ödendi, gider yok', r2 && r2.op==='cardpay' && w.eval("state.finDues.find(d=>d.id==='cK').status")==='paid' && w.eval("state.expenses.length")===0, JSON.stringify(r2));
    w.eval("finPayDueModal196('cD')"); await tick(60);
    t('finPayDueModal196 kart kalemi → kart ödemesi penceresi (gider penceresi açılmaz)', !!w.document.getElementById('modal-fin-cardpay') && !w.document.getElementById('modal-fin-pay'));
  }

  console.log('[5] Kısmi ödeme: kalem tutarı azalır; hareket silinince geri gelir; tam ödeme silinince kalem yeniden açılır');
  { const w=boot(); await tick(1200); w.eval(FX(true)); w.eval("window.plConfirm=async function(){return true;}");
    const p=JSON.parse(J(w,"finPayCardDue206('cD',{amount:500,date:'"+P14+"',fromAccountId:'acc-bank'})"));
    t('kısmi: kalem açık 1.500, not eklendi, hareket dueReduced 500', w.eval("state.finDues.find(d=>d.id==='cD').status")==='open' && w.eval("state.finDues.find(d=>d.id==='cD').amount")===1500 && /ödendi/.test(w.eval("state.finDues.find(d=>d.id==='cD').note")) && p.dueReduced===500, J(w,"state.finDues.find(d=>d.id==='cD')"));
    await w.eval("removeFinMove196('"+p.id+"')"); await tick(60);
    t('kısmi hareket silindi → kalem 2.000, not temizlendi', w.eval("state.finDues.find(d=>d.id==='cD').amount")===2000 && !/ödendi/.test(w.eval("state.finDues.find(d=>d.id==='cD').note")||''), J(w,"state.finDues.find(d=>d.id==='cD')"));
    const f=JSON.parse(J(w,"finPayCardDue206('cD',{amount:2000,date:'"+P14+"',fromAccountId:'acc-bank'})"));
    t('tam ödeme → kalem ödendi', w.eval("state.finDues.find(d=>d.id==='cD').status")==='paid');
    await w.eval("removeFinMove196('"+f.id+"')"); await tick(60);
    t('tam ödeme silindi → kalem yeniden açık 2.000; Banka 50.000', w.eval("state.finDues.find(d=>d.id==='cD').status")==='open' && w.eval("state.finDues.find(d=>d.id==='cD').amount")===2000 && w.eval("finBalance196('acc-bank')")===50000);
    const a=JSON.parse(J(w,"finPayCardDue206('cD',{amount:500,date:'"+P14+"',fromAccountId:'acc-bank'})")); const b=JSON.parse(J(w,"finPayCardDue206('cD',{amount:1500,date:'"+P10+"',fromAccountId:'acc-bank'})"));
    t('500 + 1.500 → kalem kapandı', w.eval("state.finDues.find(d=>d.id==='cD').status")==='paid');
    await w.eval("removeFinMove196('"+a.id+"')"); await tick(60);
    t('kapanmış kalemin ilk kısmi ödemesi silindi → 500 ₺ yeni açık kalem (-r1)', w.eval("state.finDues.some(d=>d.id==='cD-r1' && d.status==='open' && d.amount===500)"), J(w,"state.finDues.filter(d=>/^cD/.test(d.id))"));
  }

  console.log('[6] Gider/gelir penceresinde gecikmiş kalemin tarihi VADE GÜNÜ; ileri tarihli kalemde bugün');
  { const w=boot(); await tick(1200); w.eval(FX(true));
    w.eval("finPayDueModal196('kira')"); await tick(60);
    t('gecikmiş Kira: fp-date = vade günü + uyarı notu', w.document.getElementById('fp-date').value===P10 && /vade günüyle geldi/.test(w.document.getElementById('modal-fin-pay').textContent), w.document.getElementById('fp-date').value);
    w.document.getElementById('modal-fin-pay').remove();
    w.eval("finPayDueModal196('kiraF')"); await tick(60);
    t('ileri tarihli Kira: fp-date = bugün, not yok', w.document.getElementById('fp-date').value===T && !/vade günüyle geldi/.test(w.document.getElementById('modal-fin-pay').textContent));
    w.document.getElementById('modal-fin-pay').remove();
    w.eval("finPayDueModal196('maas')"); await tick(60);
    t('gecikmiş maaş (gelir): alındığı gün = vade günü', w.document.getElementById('fp-date').value===P14);
    w.eval("finPayDue196('maas')"); await tick(60);
    t('pencereden kayıt: gelir hareketi vade günüyle', w.eval("(state.finMoves.find(m=>m.op==='income')||{}).date")===P14);
  }

  console.log('[7] Hareket penceresinden kart ödemesi (eski yol): kalem kayda bağlanır; kısmi ödeme silinince tutar geri gelir');
  { const w=boot(); await tick(1200); w.eval(FX(true)); w.eval("window.plConfirm=async function(){return true;}");
    w.eval("const kb=finAccount196('kbank'); kb.openingDate='"+P30+"'; kb.openingBalance=10000;");
    w.eval("openFinMoveModal196('cardpay')"); await tick(60);
    w.document.getElementById('fm-from').value='acc-bank'; w.document.getElementById('fm-to').value='cardD'; w.document.getElementById('fm-amount').value='800'; w.document.getElementById('fm-date').value=P10;
    w.eval('saveFinMove196()'); await tick(60);
    const mv=JSON.parse(J(w,"state.finMoves[0]"));
    t('kısmi: kalem 1.200 açık, hareket dueId + dueReduced 800', w.eval("state.finDues.find(d=>d.id==='cD').amount")===1200 && mv.dueId==='cD' && mv.dueReduced===800, JSON.stringify(mv));
    await w.eval("removeFinMove196('"+mv.id+"')"); await tick(60);
    t('silindi → kalem 2.000', w.eval("state.finDues.find(d=>d.id==='cD').amount")===2000 && w.eval("state.finDues.find(d=>d.id==='cD').status")==='open');
  }

  console.log('[8] Türetilmiş kart borcu (saklı kalem yok) + Kasa/Banka AÇILMAMIŞ: "Öde" engellenmez, kart ödemesi penceresi açılır, hareket yazılır');
  { const w=boot(); await tick(1200); w.eval(FX(false));
    w.eval("state.finDues=state.finDues.filter(d=>d.dtype!=='card'); state.expenses.push({id:'X1',date:'"+P10+"',paidDate:'"+P10+"',category:'Market/Yemek',amount:700,note:'market',accountId:'cardK',scope:'hane',source:'card-import'});");
    const rem=JSON.parse(J(w,"finCardReminders196().find(r=>r.accountId==='cardK')||null"));
    t('türetilmiş hatırlatıcı: kart borcu 1.700', rem && rem.amount===1700 && rem.derived===true, JSON.stringify(rem));
    w.eval("finPayItem196('"+rem.id+"')"); await tick(60);
    t('kart ödemesi penceresi açıldı (Hesaplar açılmamış uyarısı YOK; hareket penceresi açılmadı)', !!w.document.getElementById('modal-fin-cardpay') && !w.document.getElementById('modal-fin-move') && !w.__msgs.some(m=>/Önce 🏦 Hesaplar/.test(m)), JSON.stringify(w.__msgs));
    const sv=w.document.getElementById('fcp-save'); if (sv) sv.click(); await tick(80);
    t('hareket yazıldı (Kerem Banka → kart 1.700), kart bakiyesi 0, gider 1 (yalnız market)', w.eval("state.finMoves.length")===1 && w.eval("state.finMoves[0].amount")===1700 && w.eval("finBalance196('cardK')")===0 && w.eval("state.expenses.length")===1, J(w,"state.finMoves"));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
