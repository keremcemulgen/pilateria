// v196 ADIM 1 — FİNANS ÇEKİRDEĞİ (Kerem 17.10: "gerçek bakiye; Kasa + Banka + N kart; bakiye saklanmaz, hareketlerden hesaplanır")
// Hesaplar (acc-cash / acc-bank varsayılan, kart hesapları sınırsız), türetilmiş hareketler (üye ödemesi Nakit→Kasa / IBAN→Banka,
// gider accountId, hoca ödemesi yöntemi, nakit hareketleri: virman / kart borcu / çekim / sermaye / mutabakat), açılış tarihi süzgeci,
// hesapsız hareket uyarısı, Finans sekmesi (Ödemeler→Finans, alt sekmeler), tik ödemesinde "Nakit mi IBAN mı", Kredi Kartı gizli,
// gider girişinde hesap, bulut tablosu kapısı.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__msgs=[]; w.__dlgAns='Nakit'; w.__confirms=0;
  w.__PL_DLG_AUTO__=(o)=>{ const m=String((o&&o.msg)||''); w.__msgs.push(m); if(o&&o.input) return String(o.input.value); if(/Para nasıl geldi\?/.test(m)) return w.__dlgAns; return true; };
  w.alert=(m)=>{ w.__msgs.push('ALERT:'+m); }; w.confirm=()=>{ w.__confirms++; return true; }; w.prompt=()=>null; w.scrollTo=()=>{};
}}).window; }
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
const J=(w,e)=>w.eval('JSON.stringify('+e+')');
setTimeout(async function(){try{
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.settings.reformers=5; state.packageTypes=[{id:'p1',name:'BIREYSEL',sessions:8,price:4500}];
    state.instructors=[{id:'G',name:'GIZEM',shareRate:30}];
    state.members=[{id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p1',totalPrice:4500,packages:[],monthly:{'2026-10':{enrolled:true}}},
                   {id:'B',name:'BERNA',joinDate:'2026-01-01',defaultPackageId:'p1',totalPrice:4500,packages:[],monthly:{'2026-10':{enrolled:true}}}];
    state.groups=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[];
    document.getElementById('member-month').innerHTML='<option value="2026-10">2026-10</option>'; document.getElementById('member-month').value='2026-10';
    document.getElementById('pay-month').value='2026-10';`;
  const OPEN=`(function(){ const c=finAccount196('acc-cash'); c.openingDate='2026-10-01'; c.openingBalance=1000; const b=finAccount196('acc-bank'); b.openingDate='2026-10-01'; b.openingBalance=5000;
    state.finAccounts.push({id:'card1',kind:'account',type:'card',name:'Garanti (Kerem)',bank:'Garanti BBVA',owner:'Kerem',openingDate:'2026-10-01',openingBalance:-9000,cutoffDay:15,dueDay:25,active:true}); })()`;

  console.log('[1] Varsayılanlar: Kasa + Banka hesapları, finans ayarı, yöntem→hesap');
  { const w=boot(); await tick(1200); w.eval(FX);
    t('acc-cash ve acc-bank var (normalize)', w.eval("!!finAccount196('acc-cash') && !!finAccount196('acc-bank')"));
    t('Kasa type cash, Banka type bank', w.eval("finAccount196('acc-cash').type")==='cash' && w.eval("finAccount196('acc-bank').type")==='bank');
    t('settings.finance.partners [] / safetyMin 0', J(w,'state.settings.finance')===JSON.stringify({partners:[],safetyMin:0}), J(w,'state.settings.finance'));
    t('Nakit→Kasa, IBAN→Banka, Kredi Kartı→hesapsız', w.eval("finAccountForMethod196('Nakit')")==='acc-cash' && w.eval("finAccountForMethod196('IBAN')")==='acc-bank' && w.eval("finAccountForMethod196('Kredi Kartı')")==='');
    t('açılış girilmeden finans PASİF, bakiye null', w.eval('finActive196()')===false && w.eval("finBalance196('acc-cash')")===null);
    t('sekme adı 💰 Finans (üst + alt bar)', /💰 Finans/.test(w.document.querySelector('[data-page="payments"]').textContent) && /Finans/.test(w.document.querySelector('[data-bnav="payments"]').textContent));
    t('Finans alt sekmeleri var (6)', w.document.querySelectorAll('#fin-tabs .fin-tab').length===6);
    t('yeni ödeme penceresinde Kredi Kartı / Diğer YOK', [...w.document.querySelectorAll('#mp-method option')].map(o=>o.value).join(',')==='Nakit,IBAN', [...w.document.querySelectorAll('#mp-method option')].map(o=>o.value).join(','));
    w.eval("state.payments.push({id:'PK',memberId:'A',groupId:'',date:'2026-09-05',packageMonth:'2026-09',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'Kredi Kartı',note:''})");
    w.eval("openPaymentModal('A','PK')"); await tick();
    t('eski Kredi Kartı kaydı düzenlenirken yöntem seçili kalır', w.document.getElementById('mp-method').value==='Kredi Kartı', w.document.getElementById('mp-method').value);
  }

  console.log('[2] Türetilmiş hareketler + bakiye (açılış: Kasa 1.000 / Banka 5.000 / kart borç 9.000, 01.10)');
  { const w=boot(); await tick(1200); w.eval(FX); w.eval(OPEN);
    w.eval(`state.payments.push(
      {id:'P1',memberId:'A',groupId:'',date:'2026-10-05',packageMonth:'2026-10',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'Nakit',note:''},
      {id:'P2',memberId:'B',groupId:'',date:'2026-10-06',packageMonth:'2026-10',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'IBAN',note:''},
      {id:'P0',memberId:'A',groupId:'',date:'2026-09-28',packageMonth:'2026-10',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'Nakit',note:'acilistan once'},
      {id:'PR',memberId:'B',groupId:'',date:'2026-10-07',packageMonth:'2026-10',pkgName:'Iade',sessions:0,amount:-500,listPrice:0,method:'Nakit',refund:true,note:''},
      {id:'PX',memberId:'B',groupId:'',date:'2026-10-08',packageMonth:'2026-10',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'Kredi Kartı',note:'eski yontem'});
    state.expenses.push({id:'E1',date:'2026-10-03',category:'Kira',amount:1200,note:'',accountId:'acc-bank',source:'manual'},
                        {id:'E2',date:'2026-10-04',category:'Temizlik',amount:300,note:'hesapsiz'},
                        {id:'E3',date:'2026-10-09',category:'Malzeme',amount:800,note:'kartla',accountId:'card1'},
                        {id:'E4',date:'2026-10-10',category:'Diğer',amount:-150,note:'iade (negatif gider)',accountId:'acc-cash'});
    state.instructorPayouts.push({id:'PO1',instructorId:'G',year:2026,month:10,amount:3000,paidDate:'2026-10-12',method:'IBAN',note:'bordro'});
    state.finMoves.push({id:'M1',kind:'move',op:'transfer',date:'2026-10-13',amount:2000,fromAccountId:'acc-cash',toAccountId:'acc-bank',note:'yatirma'},
                        {id:'M2',kind:'move',op:'draw',date:'2026-10-14',amount:500,fromAccountId:'acc-cash',partner:'Kerem',note:''},
                        {id:'M3',kind:'move',op:'capital',date:'2026-10-15',amount:10000,toAccountId:'acc-bank',partner:'Ortak',note:''},
                        {id:'M4',kind:'move',op:'cardpay',date:'2026-10-16',amount:7000,fromAccountId:'acc-bank',toAccountId:'card1',note:'ekstre'});`);
    // Kasa: 1000 +4500 (P1) −500 (PR) +150 (E4) −2000 (M1) −500 (M2) = 2650
    // Banka: 5000 +4500 (P2) −1200 (E1) −3000 (PO1) +2000 (M1) +10000 (M3) −7000 (M4) = 10300
    // Kart: −9000 −800 (E3) +7000 (M4) = −2800
    t('Kasa bakiyesi 2.650', w.eval("finBalance196('acc-cash')")===2650, w.eval("finBalance196('acc-cash')"));
    t('Banka bakiyesi 10.300', w.eval("finBalance196('acc-bank')")===10300, w.eval("finBalance196('acc-bank')"));
    t('Kart borcu 2.800 (bakiye −2.800)', w.eval("finBalance196('card1')")===-2800 && w.eval('finCardDebt196()')===2800, w.eval("finBalance196('card1')"));
    t('Σ nakit 12.950 (kart hariç)', w.eval('finCash196()')===12950, w.eval('finCash196()'));
    t('açılış öncesi ödeme (28.09) bakiyeye GİRMEZ', !J(w,'finMovements196().map(m=>m.id)').includes('pay:P0'));
    t('tarihli bakiye: 05.10 itibarıyla Kasa 5.500, Banka 3.800', w.eval("finBalance196('acc-cash','2026-10-05')")===5500 && w.eval("finBalance196('acc-bank','2026-10-05')")===3800, w.eval("finBalance196('acc-bank','2026-10-05')"));
    const un = JSON.parse(J(w,'finUnassigned196().map(m=>m.id)'));
    t('hesapsız hareketler: eski yöntemli ödeme + hesapsız gider (2)', un.length===2 && un.includes('pay:PX') && un.includes('exp:E2'), JSON.stringify(un));
    t('virman iki hareket (çıkış + giriş), aynı kaynak', J(w,"finMovements196().filter(m=>m.srcId==='M1').map(m=>m.accountId+':'+m.dir).sort()")===JSON.stringify(['acc-bank:1','acc-cash:-1']));
    t('iade = Kasa çıkışı; negatif gider = giriş', w.eval("finMovements196().find(m=>m.id==='pay:PR').dir")===-1 && w.eval("finMovements196().find(m=>m.id==='exp:E4').dir")===1);
    t('hareketler tarih sırasına göre (yeni → eski)', (function(){ const d=JSON.parse(J(w,'finMovements196().map(m=>m.date)')); return d.every((x,i)=>i===0||x<=d[i-1]); })());
    w.eval("switchPage('payments'); finSwitchTab196('moves')"); await tick(200); // adım 3: finans etkinken varsayılan sekme Nakit Akışı → Hareketler'e geç
    const bl = w.document.getElementById('fin-balance-line').textContent;
    t('Hareketler sekmesi: bakiye şeridi Kasa 2.650 / Banka 10.300 / kart borç 2.800', /Kasa: 2\.650/.test(bl) && /Banka: 10\.300/.test(bl) && /borç 2\.800/.test(bl), bl);
    t('hareket tablosu Ekim: 13 satır (virman/kart ödemesi ikişer)', w.document.querySelectorAll('#fin-moves-tbody tr').length===13, w.document.querySelectorAll('#fin-moves-tbody tr').length);
    t('hesapsız uyarısı görünür (2)', /2 hesapsız hareket/.test(w.document.getElementById('fin-unassigned').textContent));
    w.document.getElementById('fin-move-acc').value='acc-cash'; w.eval('renderFinMoves196()');
    t('hesap süzgeci: Kasa 5 hareket', w.document.querySelectorAll('#fin-moves-tbody tr').length===5, w.document.querySelectorAll('#fin-moves-tbody tr').length);
    w.document.getElementById('fin-move-acc').value=''; w.document.getElementById('fin-move-type').value='gider'; w.eval('renderFinMoves196()');
    t('tür süzgeci: gider 3 (hesapsız E2 hariç)', w.document.querySelectorAll('#fin-moves-tbody tr').length===3, w.document.querySelectorAll('#fin-moves-tbody tr').length);
  }

  console.log('[3] Mutabakat: gerçek bakiye girilir, fark tek işaretli hareketle kapanır; silme + Geri Al');
  { const w=boot(); await tick(1200); w.eval(FX); w.eval(OPEN);
    w.eval("state.payments.push({id:'P1',memberId:'A',groupId:'',date:'2026-10-05',packageMonth:'2026-10',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'Nakit',note:''})");
    t('ön koşul Kasa 5.500', w.eval("finBalance196('acc-cash')")===5500);
    const mv = JSON.parse(J(w,"finReconcile196('acc-cash','2026-10-10',5200,'sayim')"));
    t('fark −300 kaydedildi (actual 5.200 / computed 5.500)', mv.op==='reconcile' && mv.amount===-300 && mv.actual===5200 && mv.computed===5500, JSON.stringify(mv));
    t('mutabakat sonrası Kasa = 5.200', w.eval("finBalance196('acc-cash')")===5200, w.eval("finBalance196('acc-cash')"));
    t('mutabakat hareketi listede çıkış 300', w.eval("finMovements196().find(m=>m.type==='mutabakat').dir")===-1 && w.eval("finMovements196().find(m=>m.type==='mutabakat').amount")===300);
    w.eval("openFinMoveModal196('transfer')"); await tick();
    t('nakit hareketi penceresi açıldı', !!w.document.getElementById('modal-fin-move'));
    w.document.getElementById('fm-op').value='draw'; w.eval('__finMoveFields196()');
    t('çekim: ortak alanı görünür, giren hesap gizli', w.document.getElementById('fm-partner-wrap').style.display==='' && w.document.getElementById('fm-to-wrap').style.display==='none');
    w.document.getElementById('fm-amount').value='250'; w.document.getElementById('fm-partner').value='Kerem'; w.document.getElementById('fm-date').value='2026-10-11';
    w.eval('saveFinMove196()'); await tick(100);
    t('çekim kaydedildi: Kasa 4.950, pencere kapandı', w.eval("finBalance196('acc-cash')")===4950 && !w.document.getElementById('modal-fin-move'), w.eval("finBalance196('acc-cash')"));
    t('Geri Al yedeği: "Ortak çekimi"', w.eval("(__undoStack||[]).some(s=>/Ortak çekimi/.test(s.label))"));
    const id = w.eval("state.finMoves.find(m=>m.op==='draw').id");
    await w.eval("removeFinMove196('"+id+"')"); await tick(100);
    t('çekim silindi: Kasa tekrar 5.200', w.eval("finBalance196('acc-cash')")===5200, w.eval("finBalance196('acc-cash')"));
    w.eval("openFinMoveModal196('cardpay')"); await tick();
    t('kart borcu ödemesi: giren hesap = kart, çıkan = Banka', w.document.getElementById('fm-to').value==='card1' && w.document.getElementById('fm-from').value==='acc-bank', w.document.getElementById('fm-to').value);
    w.document.getElementById('fm-amount').value='4000'; w.document.getElementById('fm-date').value='2026-10-20'; w.eval('saveFinMove196()'); await tick(100);
    t('kart borcu 9.000 → 5.000, Banka 5.000 → 1.000', w.eval("finBalance196('card1')")===-5000 && w.eval("finBalance196('acc-bank')")===1000, w.eval("finBalance196('card1')"));
    w.eval("openFinMoveModal196('transfer')"); await tick(); w.document.getElementById('fm-date').value='2026-09-20'; w.document.getElementById('fm-amount').value='100'; w.__msgs=[]; w.eval('saveFinMove196()');
    t('açılıştan önceki tarih reddedilir', w.__msgs.some(m=>/açılış/.test(m)) && w.eval("state.finMoves.filter(m=>m.op==='transfer').length")===0, JSON.stringify(w.__msgs)+' '+J(w,"state.finMoves.map(m=>m.op+':'+m.date)"));
  }

  console.log('[4] Tik ile ödeme: finans etkinken "Nakit mi IBAN mı" sorulur, yöntem ona göre; etkin değilken eski confirm');
  { const w=boot(); await tick(1200); w.eval(FX);
    await w.eval("togglePaidTick('A','', {stopPropagation(){},preventDefault(){}})"); await tick(200);
    t('finans PASİF: confirm yolu, yöntem Nakit', w.__confirms>=1 && w.eval("state.payments.length")===1 && w.eval("state.payments[0].method")==='Nakit' && !w.__msgs.some(m=>/Para nasıl geldi/.test(m)), J(w,'state.payments'));
  }
  { const w=boot(); await tick(1200); w.eval(FX); w.eval(OPEN); w.__dlgAns='IBAN';
    await w.eval("togglePaidTick('A','', {stopPropagation(){},preventDefault(){}})"); await tick(200);
    t('finans ETKİN: soru soruldu, IBAN → ödeme IBAN, Banka +4.500', w.__msgs.some(m=>/Para nasıl geldi/.test(m)) && w.eval("state.payments[0].method")==='IBAN' && w.eval("finBalance196('acc-bank')")===9500, J(w,'state.payments.map(p=>p.method)'));
    w.__dlgAns=null; await w.eval("togglePaidTick('B','', {stopPropagation(){},preventDefault(){}})"); await tick(200);
    t('Vazgeç → ödeme oluşmaz', w.eval("state.payments.length")===1);
    w.__dlgAns=true; await w.eval("togglePaidTick('B','', {stopPropagation(){},preventDefault(){}})"); await tick(200);
    t('eski kanca (true) → Nakit', w.eval("state.payments.length")===2 && w.eval("state.payments[1].method")==='Nakit');
    // kısmi → kalanı tahsil yolu da sorar
    w.eval("state.payments=[{id:'PP',memberId:'A',groupId:'',date:'2026-10-02',packageMonth:'2026-10',pkgName:'BIREYSEL',sessions:8,amount:2000,listPrice:4500,method:'IBAN',note:''}]");
    w.__msgs=[]; w.__dlgAns='Nakit'; await w.eval("togglePaidTick('A','', {stopPropagation(){},preventDefault(){}})"); await tick(200);
    t('kalanı tahsil: soruldu, Nakit → kalan 2.500 Kasa', w.__msgs.some(m=>/kalan 2\.500/.test(m) && /Para nasıl geldi/.test(m)) && w.eval("state.payments.length")===2 && w.eval("state.payments[1].method")==='Nakit' && w.eval("state.payments[1].amount")===2500, J(w,'state.payments'));
  }

  console.log('[5] Gider girişi: hesap seçimi (finans etkinken zorunlu), kayıt accountId taşır, listede hesap rozeti, Geri Al');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("switchPage('payments')"); await tick(150);
    const sel = w.document.getElementById('exp-acc');
    t('gider formunda hesap seçici var (Kasa, Banka)', !!sel && [...sel.options].map(o=>o.value).join(',')===',acc-cash,acc-bank', sel && [...sel.options].map(o=>o.value).join(','));
    w.document.getElementById('exp-date').value='2026-10-05'; w.document.getElementById('exp-amount').value='250'; w.document.getElementById('exp-note').value='temizlik';
    w.eval('addExpense()');
    t('finans pasifken hesapsız gider kabul (eski davranış)', w.eval('state.expenses.length')===1 && w.eval("state.expenses[0].accountId")==='', J(w,'state.expenses'));
    w.eval(OPEN); w.eval('renderPayments()'); await tick(100);
    w.document.getElementById('exp-date').value='2026-10-06'; w.document.getElementById('exp-amount').value='400'; w.document.getElementById('exp-acc').value=''; w.__msgs=[];
    w.eval('addExpense()');
    t('finans etkinken hesapsız gider REDDEDİLİR', w.eval('state.expenses.length')===1 && w.__msgs.some(m=>/Hangi hesaptan/.test(m)));
    w.document.getElementById('exp-acc').value='acc-bank'; w.eval('addExpense()');
    t('hesaplı gider kaydedildi: accountId acc-bank, Banka 4.600', w.eval('state.expenses.length')===2 && w.eval("state.expenses[1].accountId")==='acc-bank' && w.eval("finBalance196('acc-bank')")===4600, w.eval("finBalance196('acc-bank')"));
    t('gider listesinde hesap rozeti', /🏦 Banka/.test(w.document.getElementById('expenses-list').textContent));
    t('Geri Al yedeği (Gider)', w.eval("(__undoStack||[]).some(s=>/^Gider: /.test(s.label))"));
    const eid = w.eval("state.expenses[1].id"); w.eval("removeExpense('"+eid+"')");
    t('gider silindi, Banka 5.000, Geri Al yedeği (Gider sil)', w.eval('state.expenses.length')===1 && w.eval("finBalance196('acc-bank')")===5000 && w.eval("(__undoStack||[]).some(s=>/^Gider sil/.test(s.label))"));
  }

  console.log('[6] Hesaplar sekmesi: kart hesabı ekleme (banka + sahibi + açılış borcu), ortaklar, güvenlik payı');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("switchPage('payments')"); await tick(100); w.eval("finSwitchTab196('accounts')"); await tick(100);
    t('Hesaplar paneli aktif, Kasa/Banka "başlangıç girilmedi"', w.document.getElementById('fin-panel-accounts').classList.contains('active') && (w.document.getElementById('fin-accounts-body').textContent.match(/başlangıç girilmedi/g)||[]).length===2);
    w.document.getElementById('fin-partners').value='Kerem, Derya'; w.document.getElementById('fin-safety').value='20000'; w.eval('saveFinSettings196()');
    t('ortaklar + güvenlik payı kaydedildi', J(w,'state.settings.finance.partners')===JSON.stringify(['Kerem','Derya']) && w.eval('state.settings.finance.safetyMin')===20000);
    w.eval("openFinAccountModal196('')"); await tick();
    t('yeni kart penceresi: banka listesi + ortak seçimi', !!w.document.getElementById('fa-bank') && w.document.getElementById('fa-owner').tagName==='SELECT');
    w.document.getElementById('fa-name').value='Vakıf (Derya)'; w.document.getElementById('fa-bank').value='VakıfBank'; w.document.getElementById('fa-owner').value='Derya';
    w.document.getElementById('fa-open').value='2026-10-01'; w.document.getElementById('fa-bal').value='3500'; w.document.getElementById('fa-cut').value='10'; w.document.getElementById('fa-due').value='20';
    w.eval("saveFinAccount196('')"); await tick(100);
    const c = JSON.parse(J(w,"state.finAccounts.find(a=>a.type==='card')"));
    t('kart hesabı kaydedildi: borç eksi, banka, sahibi, kesim/son ödeme', c && c.openingBalance===-3500 && c.bank==='VakıfBank' && c.owner==='Derya' && c.cutoffDay===10 && c.dueDay===20 && c.kind==='account', JSON.stringify(c));
    w.eval("openFinAccountModal196('')"); await tick(); w.document.getElementById('fa-name').value='Vakıf (Kerem)'; w.document.getElementById('fa-bank').value='VakıfBank'; w.document.getElementById('fa-owner').value='Kerem'; w.document.getElementById('fa-open').value='2026-10-01'; w.document.getElementById('fa-bal').value='0'; w.eval("saveFinAccount196('')"); await tick(50);
    t('aynı bankadan ikinci kart (iki ortak) eklenebilir', w.eval("state.finAccounts.filter(a=>a.type==='card').length")===2);
    w.eval("openFinAccountModal196('acc-cash')"); await tick(); w.document.getElementById('fa-open').value='2026-10-01'; w.document.getElementById('fa-bal').value='1500'; w.eval("saveFinAccount196('acc-cash')"); await tick(50);
    t('Kasa açılışı girildi → finans etkin, Kasa 1.500', w.eval('finActive196()')===true && w.eval("finBalance196('acc-cash')")===1500);
    t('hesap listesi sıralı: Kasa, Banka, kartlar', J(w,'finAccounts196().map(a=>a.type)')===JSON.stringify(['cash','bank','card','card']));
    t('pasif kart listelenmez', (function(){ w.eval("state.finAccounts.find(a=>a.name==='Vakıf (Kerem)').active=false"); return w.eval('finAccounts196().length')===3 && w.eval('finAccounts196(true).length')===4; })());
  }

  console.log('[7] Bulut tablosu kapısı: tablo yokken finans yazımı kapalı (yerel-tek veri doğmaz), uyarı görünür');
  { const w=boot(); await tick(1200); w.eval(FX); w.eval(OPEN);
    w.eval("sbClient = { from: function(){ return {}; } }; __sbMissingTables.finance = true;");
    t('finCloudReady196 false', w.eval('finCloudReady196()')===false);
    w.eval("switchPage('payments')"); await tick(100);
    t('uyarı kutusu görünür (SQL)', w.document.getElementById('fin-cloud-warn').style.display!=='none' && /finance-setup\.sql/.test(w.document.getElementById('fin-cloud-warn').textContent));
    w.__msgs=[]; w.eval("openFinMoveModal196('transfer')");
    t('nakit hareketi açılmaz (uyarı)', !w.document.getElementById('modal-fin-move') && w.__msgs.some(m=>/tablosu henüz kurulmamış/.test(m)));
    w.eval("__sbMissingTables.finance = false;"); w.eval('renderFinance196()');
    t('tablo kurulunca uyarı kalkar', w.document.getElementById('fin-cloud-warn').style.display==='none');
    w.eval("sbClient = null;");
    t('istemci yokken (yerel mod) kapı açık', w.eval('finCloudReady196()')===true);
  }

  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST COKTU',e);process.exit(2);}},50);
