// v199 (Kerem 18.10 "olur"): vade kalemi, hesabın AÇILIŞ TARİHİNDEN ÖNCEKİ bir günle (ya da hesap henüz açılmamışken) de "ödendi"
// yapılabilir — gider kaydı tutulur, cari ekstresine ve raporlara girer, BAKİYEYE GİRMEZ (açılış penceresi dışı). Eylül geriye dönük
// girişi için gerekli (açılış 1 Ekim). Kerem'in uyarısı: üye paket ödemesi sarkabilir (Eylül paketi Ekim'de ödenir) → bakiye ÖDEME
// GÜNÜNE, gelir PAKET AYINA bağlıdır; bu değişmez ([5]). Yamasız (v198) yapıda [1], [2], [4] BAŞARISIZ olmalı.
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
  const CUR=w0.eval('currentMonth()'), PREV=w0.eval("finMonthAdd196(currentMonth(),-1)");
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.packageTypes=[{id:'p1',name:'BIREYSEL',sessions:8,price:4500}]; state.instructors=[{id:'G',name:'GIZEM',shareRate:30}];
    state.members=[{id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p1',totalPrice:4500,packages:[],monthly:{'${PREV}':{enrolled:true},'${CUR}':{enrolled:true}}}];
    state.groups=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.lessons=[];
    state.finCounterparties=[{id:'CP1',kind:'counterparty',name:'KIRALAYAN',type:'landlord',active:true}];
    state.finDues.push({id:'D-eyl',kind:'due',dtype:'expense',title:'Kira',amount:33000,dueDate:'${PREV}-13',period:'${PREV}',category:'Kira',counterpartyId:'CP1',accountId:'acc-bank',resmi:true,kdvRate:0,status:'open',note:''});
    state.finDues.push({id:'D-eki',kind:'due',dtype:'expense',title:'Kira',amount:33000,dueDate:'${CUR}-13',period:'${CUR}',category:'Kira',counterpartyId:'CP1',accountId:'acc-bank',resmi:true,kdvRate:0,status:'open',note:''});
    document.getElementById('member-month').innerHTML='<option value="${CUR}">${CUR}</option>'; document.getElementById('member-month').value='${CUR}';`;

  console.log('[1] Hesaplar HENÜZ AÇILMAMIŞKEN vade ödenebilir (gider kaydı, bakiye yok)');
  { const w=boot(); await tick(1200); w.eval(FX);
    const e=JSON.parse(J(w,"finPayDue196('D-eyl',{amount:33000,date:'"+PREV+"-13',accountId:'acc-bank',note:'eylül'})||null"));
    t('ödeme kabul edildi (uyarı yok), gider kaydı oluştu', e && e.amount===33000 && e.accountId==='acc-bank' && e.dueId==='D-eyl' && !w.__msgs.some(m=>/açılış/.test(m)), JSON.stringify(e)+' '+JSON.stringify(w.__msgs));
    t('kalem ödendi', w.eval("state.finDues.find(d=>d.id==='D-eyl').status")==='paid');
    t('Banka bakiyesi hâlâ tanımsız (hesap açılmadı)', w.eval("finBalance196('acc-bank')")===null);
    const st=JSON.parse(J(w,"finStatementRows196('cp','CP1')"));
    t('cari ekstresinde Eylül kalemi (ödendi) + ödeme + Ekim kalemi (açık), bakiye 33.000', st.rows.length===3 && st.balance===33000 && st.rows.some(r=>/ödendi/.test(r.t)), JSON.stringify(st.rows));
  }

  console.log('[2] Açılış 1 '+CUR+' iken Eylül tarihli ödeme: kabul, BAKİYEYE GİRMEZ, rapora/cariye girer; Ekim tarihli ödeme bakiyeden düşer');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("const b=finAccount196('acc-bank'); b.openingDate='"+CUR+"-01'; b.openingBalance=50000; const c=finAccount196('acc-cash'); c.openingDate='"+CUR+"-01'; c.openingBalance=1000;");
    const e=JSON.parse(J(w,"finPayDue196('D-eyl',{amount:33000,date:'"+PREV+"-13',accountId:'acc-bank',note:''})||null"));
    t('açılıştan önceki günle ödeme kabul edildi', !!e && w.eval("state.finDues.find(d=>d.id==='D-eyl').status")==='paid', JSON.stringify(w.__msgs));
    t('Banka 50.000 (açılış öncesi gider bakiyeye girmedi)', w.eval("finBalance196('acc-bank')")===50000, w.eval("finBalance196('acc-bank')"));
    t('Hareketler listesinde yok (pencere dışı)', !w.eval("finMovements196().some(m=>m.srcId==='"+(e&&e.id)+"' || (m.src==='expense' && m.amount===33000))"));
    const pl=JSON.parse(J(w,"finPlRows196(['"+PREV+"','"+CUR+"'])"));
    const kira=pl.find(r=>r.label==='Gider · Kira');
    t('Gelir–Gider raporu: Eylül sütununda Kira −33.000', kira && kira.vals[0]===-33000 && kira.vals[1]===0, JSON.stringify(kira));
    t('cari ekstresi: ödeme görünür, bakiye 33.000 (yalnız Ekim açık)', JSON.parse(J(w,"finStatementRows196('cp','CP1')")).balance===33000);
    const e2=JSON.parse(J(w,"finPayDue196('D-eki',{amount:33000,date:'"+CUR+"-13',accountId:'acc-bank',note:''})||null"));
    t('Ekim ödemesi bakiyeden düştü: 17.000', !!e2 && w.eval("finBalance196('acc-bank')")===17000, w.eval("finBalance196('acc-bank')"));
  }

  console.log('[3] Yanlış girişler hâlâ engellenir');
  { const w=boot(); await tick(1200); w.eval(FX);
    t('hesapsız ödeme reddedilir', w.eval("finPayDue196('D-eyl',{amount:33000,date:'"+PREV+"-13',accountId:'',note:''})")===null && w.__msgs.some(m=>/Hesap seç/.test(m)));
    t('0 tutar reddedilir', w.eval("finPayDue196('D-eyl',{amount:0,date:'"+PREV+"-13',accountId:'acc-bank',note:''})")===null);
    t('kalem hâlâ açık', w.eval("state.finDues.find(d=>d.id==='D-eyl').status")==='open');
  }

  console.log('[4] Pencere: hesaplar açılmamışken de açılır; açılıştan önceki gün seçilince uyarı notu görünür');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("finPayDueModal196('D-eyl')"); await tick(60);
    t('pencere açıldı (hesap açılmamış olsa da), engel uyarısı yok', !!w.document.getElementById('modal-fin-pay') && !w.__msgs.some(m=>/Hesaplar sekmesinden/.test(m)), JSON.stringify(w.__msgs));
    const note=w.document.getElementById('fp-pre-note');
    t('açılış-öncesi notu var ve GÖRÜNÜR (hesap açılmamış)', !!note && note.style.display!=='none', note&&note.outerHTML.slice(0,160));
    w.document.getElementById('modal-fin-pay').remove();
    w.eval("const b=finAccount196('acc-bank'); b.openingDate='"+CUR+"-01'; b.openingBalance=50000;");
    w.eval("finPayDueModal196('D-eyl')"); await tick(60);
    const dateEl=w.document.getElementById('fp-date'); const accEl=w.document.getElementById('fp-acc'); accEl.value='acc-bank';
    dateEl.value=CUR+'-13'; dateEl.dispatchEvent(new w.Event('change',{bubbles:true})); await tick(30);
    t('açılıştan sonraki günde not GİZLİ', w.document.getElementById('fp-pre-note').style.display==='none');
    dateEl.value=PREV+'-13'; dateEl.dispatchEvent(new w.Event('change',{bubbles:true})); await tick(30);
    t('açılıştan önceki günde not GÖRÜNÜR', w.document.getElementById('fp-pre-note').style.display!=='none');
    w.eval("finPayDue196('D-eyl')"); await tick(60);
    t('pencereden kayıt: kalem ödendi, pencere kapandı, Banka 50.000', w.eval("state.finDues.find(d=>d.id==='D-eyl').status")==='paid' && !w.document.getElementById('modal-fin-pay') && w.eval("finBalance196('acc-bank')")===50000);
  }

  console.log('[5] Kerem: sarkan üye ödemesi — bakiye ÖDEME GÜNÜNE, gelir PAKET AYINA (değişmedi)');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("const b=finAccount196('acc-bank'); b.openingDate='"+CUR+"-01'; b.openingBalance=50000; const c=finAccount196('acc-cash'); c.openingDate='"+CUR+"-01'; c.openingBalance=0;");
    w.eval("state.payments.push({id:'PA',memberId:'A',groupId:'',date:'"+CUR+"-05',packageMonth:'"+PREV+"',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'IBAN',note:'eylül paketi ekimde'});");
    t('Banka 54.500 (Ekim\'deki tahsilat bakiyede)', w.eval("finBalance196('acc-bank')")===54500, w.eval("finBalance196('acc-bank')"));
    const pl=JSON.parse(J(w,"finPlRows196(['"+PREV+"','"+CUR+"'])"));
    const inc=pl.find(r=>/Üye tahsilatları/.test(r.label));
    t('Gelir–Gider: 4.500 EYLÜL sütununda (paket ayı), Ekim 0', inc && inc.vals[0]===4500 && inc.vals[1]===0, JSON.stringify(inc));
    const cf=JSON.parse(J(w,"finCashflowRows196(['"+PREV+"','"+CUR+"'])"));
    t('Nakit akış tablosu: giriş EKİM\'de (gerçekleşen)', cf[1].by['in:tahsilat']===4500 && !cf[0].by['in:tahsilat'], JSON.stringify(cf.map(r=>r.by)));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
