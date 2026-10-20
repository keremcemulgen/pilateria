// v209 (Kerem 20.10): SADE FİNANS — "Raporlar Finans'ın altında olmalı; başlıklar karmaşık, muhasebeci değilim (cari vb.); başlıkları azalt,
// içeriği basitleştir ve otomatikleştir." Kararlar: banka/kasa düzenli kalemleri vade gününde KENDİLİĞİNDEN ödendi (maaş girişi dahil);
// kartla ödenen (Bağ-Kur) ekstreyle kapanır; Finans'ta 4 sekme.
// Yamasız (v208) yapıda finAutoPayDues209 yok, Raporlar üst menüde → [1]…[8] BAŞARISIZ olmalı.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(ls){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); if(o&&o.input) return String(o.input.value); return true; };
  w.alert=(m)=>{ w.__msgs.push('ALERT:'+m); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
  if (ls) Object.keys(ls).forEach(k=>{ try { w.localStorage.setItem(k, ls[k]); } catch(e) {} });
}}).window; }
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
const J=(w,e)=>w.eval('JSON.stringify('+e+')');
const pad=n=>String(n).padStart(2,'0'); const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const now=new Date(); const TODAY=iso(now); const YDAY=iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()-1)); const TMRW=iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1));
const CUR=TODAY.slice(0,7); const addM=(ym,k)=>{ const p=ym.split('-').map(Number); const d=new Date(p[0],p[1]-1+k,1); return d.getFullYear()+'-'+pad(d.getMonth()+1); }; const PREV=addM(CUR,-1), NEXT=addM(CUR,1);
const P=d=>d.slice(0,7);
const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
  state.packageTypes=[]; state.instructors=[]; state.members=[]; state.groups=[]; state.lessons=[]; state.payments=[]; state.instructorPayouts=[];
  state.finAccounts=state.finAccounts.filter(a=>a.id==='acc-cash'||a.id==='acc-bank');
  finAccount196('acc-cash').openingDate='${PREV}-01'; finAccount196('acc-cash').openingBalance=10000; finAccount196('acc-bank').openingDate='${PREV}-01'; finAccount196('acc-bank').openingBalance=100000;
  state.finAccounts.push({id:'kb',kind:'account',type:'bank',name:'Kerem Banka',owner:'Kerem',openingDate:'${PREV}-01',openingBalance:5000,active:true});
  state.finAccounts.push({id:'cardK',kind:'account',type:'card',name:'Vakıf (Kerem)',bank:'VakıfBank',owner:'Kerem',openingDate:'${PREV}-01',openingBalance:0,cutoffDay:25,dueDay:5,active:true,scopeDefault:'hane'});
  const T=(id,title,amount,acc,extra)=>Object.assign({id:id,kind:'template',title:title,amount:amount,dayOfMonth:28,category:'Diğer',accountId:acc,resmi:false,kdvRate:0,startMonth:'${CUR}',endMonth:'${PREV}',active:true,flow:'out',scope:'studio'},extra||{}); // bitiş < başlangıç: yeni kalem üretilmez (yalnız aşağıdaki açık kalemler)
  state.finTemplates=[T('TK','Kira',33000,'acc-bank',{category:'Kira',resmi:true}), T('TM','Maaş',100000,'kb',{flow:'in',scope:'hane'}), T('TB','Bağ-Kur primi',10156.73,'cardK',{category:'Bağkur'}), T('TX','Elle ödenen',500,'acc-bank',{auto:false}),
    T('TO','Eski kalem',700,'acc-bank',{startMonth:'2026-10',endMonth:'2026-10'}), T('TF','Yarınki',800,'acc-bank'), T('TA','Aidat',3750,'acc-bank'), T('TN','Yeni şablon',900,'acc-bank',{autoFrom:'${TMRW}'})];
  const D=(tp,due,dtype)=>({id:'due-'+tp+'-'+due.slice(0,7),kind:'due',dtype:dtype||'expense',templateId:tp,period:due.slice(0,7),title:state.finTemplates.find(x=>x.id===tp).title,amount:state.finTemplates.find(x=>x.id===tp).amount,dueDate:due,category:state.finTemplates.find(x=>x.id===tp).category,accountId:state.finTemplates.find(x=>x.id===tp).accountId,resmi:!!state.finTemplates.find(x=>x.id===tp).resmi,kdvRate:0,scope:state.finTemplates.find(x=>x.id===tp).scope,status:'open'});
  state.finDues=[D('TK','${TODAY}'),D('TM','${TODAY}','income'),D('TB','${TODAY}'),D('TX','${TODAY}'),D('TO','2026-10-19'),D('TF','${TMRW}'),D('TA','${TODAY}'),D('TN','${TODAY}'),
    {id:'cdue-cardK-${CUR}',kind:'due',dtype:'card',title:'💳 Vakıf (Kerem) — ${CUR} ekstresi',amount:5000,dueDate:'${NEXT}-05',period:'${CUR}',accountId:'cardK',status:'open'}];
  state.expenses=[{id:'eA',date:'${YDAY}',paidDate:'${YDAY}',category:'Diğer',amount:3750,note:'site aidatı',accountId:'acc-bank',scope:'studio',source:'manual'}];
  state.finMoves=[]; state.finCounterparties=[]; state.finRules=[]; state.finImports=[];`;
setTimeout(async function(){try{
  console.log('[1] Raporlar Finans\'ın altında: üst menü ve mobil "Diğer" menüsünde yok; switchPage(\'reports\') → Finans › Raporlar');
  { const w=boot(); await tick(1200); const d=w.document;
    t('üst menüde Raporlar sekmesi yok', !d.querySelector('#tabs [data-page="reports"]') && !d.getElementById('page-reports'));
    t('mobil "Diğer" menüsünde Raporlar yok', ![...d.querySelectorAll('#more-sheet-bg button')].some(b=>/Rapor/.test(b.textContent)));
    const tabs=[...d.querySelectorAll('#fin-tabs .fin-tab')].map(b=>b.dataset.fin+':'+b.textContent.trim());
    t('Finans sekmeleri: Özet · Gelir & Gider · Raporlar · Hesaplar (4)', tabs.length===4 && /^ozet:.*Özet$/.test(tabs[0]) && /^moves:.*Gelir & Gider$/.test(tabs[1]) && /^rapor:.*Raporlar$/.test(tabs[2]) && /^accounts:.*Hesaplar$/.test(tabs[3]), JSON.stringify(tabs));
    t('"Cari", "Vadeler", "Nakit Akışı", "Tablolar", "Diğer" sekmesi yok', !/Cari|Vadeler|Nakit Akışı|Tablolar|Diğer/.test(d.getElementById('fin-tabs').textContent), d.getElementById('fin-tabs').textContent);
    w.eval("switchPage('reports')"); await tick(150);
    t('switchPage(\'reports\') → Finans sayfası + Raporlar sekmesi', d.getElementById('page-payments').classList.contains('active') && d.getElementById('fin-panel-rapor').classList.contains('active') && w.eval('__finTab196')==='rapor', w.eval('__finTab196'));
    const rp=d.getElementById('fin-panel-rapor');
    t('Raporlar içeriği: Aylık Rapor + Para Özeti + Hoca Performansı, çizilmiş', /Aylık Rapor/.test(rp.textContent) && /Para Özeti/.test(rp.textContent) && /Hoca Performansı/.test(rp.textContent) && /tahsilat/i.test(d.getElementById('report-content').textContent) && /NET KÂR/.test(d.getElementById('net-profit-panel').textContent), rp.textContent.replace(/\s+/g,' ').slice(0,200));
    t('"Göster" düğmesi yok, ay seçilince kendiliğinden çizilir', !/Göster/.test(rp.textContent) && /renderReports\(\)/.test(d.getElementById('rep-month').getAttribute('onchange')||''));
    t('Raporlar\'da ayrıntılı tablo (kapalı, CSV)', /Ayrıntılı tablo/.test(rp.textContent) && /CSV/.test(rp.textContent));
  }

  console.log('[2] Otomatik ödeme: bankadan/kasadan olanlar vade günü kendiliğinden; kartla olan ekstreyi bekler; elle olan elle; geçmiş/yarın/yeni şablon dokunulmaz');
  { const w=boot(); await tick(1200); w.eval(FX);
    t('bulut çekimi yokken (bayat veri) HİÇBİR ŞEY ödenmez', w.eval('finAutoPayDues209()')===0 && w.eval("state.finDues.filter(d=>d.status==='paid').length")===0);
    w.eval('window.__sbPulledOk209=true;');
    const n=w.eval('finAutoPayDues209()');
    const st=JSON.parse(J(w,"Object.fromEntries(state.finDues.map(d=>[d.templateId||d.id,d.status]))"));
    t('Kira (banka) ödendi, Maaş (banka) alındı, Aidat (banka) ödendi', st.TK==='paid' && st.TM==='paid' && st.TA==='paid', JSON.stringify(st));
    t('Bağ-Kur (kart) açık — ekstreyi bekler', st.TB==='open');
    t('elle kalem (otomatik kapalı) açık', st.TX==='open');
    t('20.10.2026 öncesi kalem otomatik ödenmez', st.TO==='open');
    t('yarınki kalem açık', st.TF==='open');
    t('yeni şablon (eklendiği günden önceki kalem) açık', st.TN==='open');
    t('3 kalem işlendi', n===3, n);
    const e=JSON.parse(J(w,"state.expenses.find(x=>x.id==='ap-due-TK-"+CUR+"')||null"));
    t('Kira gideri: ap- kimlik, 33.000, Banka, Kira, stüdyo, faturalı, otomatik, vadeye bağlı', e && e.amount===33000 && e.accountId==='acc-bank' && e.category==='Kira' && e.scope==='studio' && e.resmi===true && e.source==='auto' && e.dueId==='due-TK-'+CUR && e.date===TODAY, JSON.stringify(e));
    const mv=JSON.parse(J(w,"state.finMoves.find(x=>x.id==='ap-due-TM-"+CUR+"')||null"));
    t('Maaş: gelir hareketi Kerem Banka, ev, 100.000', mv && mv.op==='income' && mv.toAccountId==='kb' && mv.scope==='hane' && mv.amount===100000 && mv.auto===true, JSON.stringify(mv));
    t('Aidat: elle girilmiş 3.750 gidere BAĞLANDI, yeni gider yazılmadı', w.eval("state.finDues.find(d=>d.templateId==='TA').paidRef.id")==='eA' && !w.eval("state.expenses.some(x=>x.id==='ap-due-TA-"+CUR+"')") && w.eval("state.expenses.find(x=>x.id==='eA').dueId")==='due-TA-'+CUR);
    t('bakiyeler: Banka 100.000 − 33.000 = 67.000 (Aidat zaten düşmüştü: 63.250); Kerem Banka +100.000', w.eval("finBalance196('acc-bank')")===63250 && w.eval("finBalance196('kb')")===105000, w.eval("finBalance196('acc-bank')")+' / '+w.eval("finBalance196('kb')"));
    const n2=w.eval('finAutoPayDues209()'); t('ikinci çağrı hiçbir şey yazmaz (tekrar yok)', n2===0 && w.eval('state.expenses.length')===2 && w.eval('state.finMoves.length')===1);
    const R=JSON.parse(J(w,"finRegular208('"+CUR+"')")); const b=R.out.find(x=>x.title==='Bağ-Kur primi'); const k=R.out.find(x=>x.title==='Kira');
    t('Özet listesi: Bağ-Kur 💳 "ekstreyle", Kira ✓ 🤖 otomatik', b && b.status==='card' && k && k.status==='paid' && k.auto===true, JSON.stringify([b,k]));
    w.eval("switchPage('payments'); finSwitchTab196('ozet')"); await tick(100);
    const tx=w.document.getElementById('fin-ozet-body').textContent; const hx=w.document.getElementById('fin-ozet-body').innerHTML;
    t('Özet: "kartla — ekstre yüklenince kapanır", "🤖 otomatik", Elle kalemde "✓ Ödendi", ödenen kalemde ✎', /kartla — ekstre yüklenince kapanır/.test(tx) && /🤖 otomatik/.test(tx) && /finPayDueModal196\('due-TX-/.test(hx) && /openFinEditPaid209\('due-TK-/.test(hx), tx.replace(/\s+/g,' ').slice(0,300));
    t('Özet: kart son ödemeleri (🏦 Öde) ve 30 gün tahmini', /Kart son ödemeleri/.test(tx) && /finPayItem196\('cdue-cardK-/.test(hx) && /30 gün sonra tahmini param/.test(tx));
  }

  console.log('[3] ✎ Düzelt (yeni kayıt yazmadan) · "Ödenmedi" geri alır ve bir daha otomatik ödenmez · otomatik gider silinirse de');
  { const w=boot(); await tick(1200); w.eval(FX); w.eval('window.__sbPulledOk209=true; finAutoPayDues209();');
    const n0=w.eval('state.expenses.length');
    t('düzelt: Kira 34.000, gün dün', w.eval("saveFinEditPaid209('due-TK-"+CUR+"',{amount:'34000',date:'"+YDAY+"',accountId:'acc-bank'})")===true && w.eval("state.expenses.find(x=>x.id==='ap-due-TK-"+CUR+"').amount")===34000 && w.eval("state.expenses.find(x=>x.id==='ap-due-TK-"+CUR+"').date")===YDAY && w.eval('state.expenses.length')===n0);
    t('kalemin ödeme günü/tutarı da güncellendi', w.eval("state.finDues.find(d=>d.id==='due-TK-"+CUR+"').paidAmount")===34000 && w.eval("state.finDues.find(d=>d.id==='due-TK-"+CUR+"').paidDate")===YDAY);
    t('maaş düzelt: 95.000', w.eval("saveFinEditPaid209('due-TM-"+CUR+"',{amount:'95000',date:'"+TODAY+"',accountId:'kb'})")===true && w.eval("state.finMoves.find(x=>x.id==='ap-due-TM-"+CUR+"').amount")===95000);
    await w.eval("finUnpayDue209('due-TK-"+CUR+"', true)");
    t('ödenmedi: gider silindi, kalem açık, noAuto', !w.eval("state.expenses.some(x=>x.id==='ap-due-TK-"+CUR+"')") && w.eval("state.finDues.find(d=>d.id==='due-TK-"+CUR+"').status")==='open' && w.eval("state.finDues.find(d=>d.id==='due-TK-"+CUR+"').noAuto")===true);
    t('bir daha otomatik ödenmez', w.eval('finAutoPayDues209()')===0 && w.eval("state.finDues.find(d=>d.id==='due-TK-"+CUR+"').status")==='open');
    w.eval("removeExpense('eA')"); await tick(80);
    t('bağlı Aidat gideri silinince: kalem açık + noAuto — silinen ödeme kendiliğinden GERİ GELMEZ', w.eval("state.finDues.find(d=>d.templateId==='TA').status")==='open' && w.eval("state.finDues.find(d=>d.templateId==='TA').noAuto")===true && !w.eval("state.expenses.some(x=>x.id==='ap-due-TA-"+CUR+"')") && w.eval('finAutoPayDues209()')===0);
    await w.eval("removeFinMove196('ap-due-TM-"+CUR+"')"); await tick(80);
    t('otomatik maaş girişi silinince: kalem açık + noAuto, tekrar yazılmaz', w.eval("state.finDues.find(d=>d.templateId==='TM').status")==='open' && w.eval("state.finDues.find(d=>d.templateId==='TM').noAuto")===true && w.eval('finAutoPayDues209()')===0 && !w.eval("state.finMoves.some(x=>x.id==='ap-due-TM-"+CUR+"')"));
    w.eval("finPayDue196('due-TA-"+CUR+"',{amount:3750,date:'"+TODAY+"',accountId:'acc-bank'})");
    t('elle "✓ Ödendi" yine çalışır (tek gider)', w.eval("state.finDues.find(d=>d.templateId==='TA').status")==='paid' && w.eval("state.expenses.filter(x=>x.dueId==='due-TA-"+CUR+"').length")===1);
  }

  console.log('[4] Gelir & Gider: sade düğmeler ve adlar; cari/vadeli alanı görünmez; hareket listesi kapalı');
  { const w=boot(); await tick(1200); w.eval(FX); const d=w.document;
    w.eval("switchPage('payments'); finSwitchTab196('moves')"); await tick(100);
    const tb=d.querySelector('#fin-panel-moves .toolbar').textContent;
    t('düğmeler: + Üye ödemesi · + Gider · 📄 Kart ekstresi yükle · ⇄ Para aktar', /\+ Üye ödemesi/.test(tb) && /\+ Gider/.test(tb) && /Kart ekstresi yükle/.test(tb) && /⇄ Para aktar/.test(tb) && !/Nakit Hareketi/.test(tb), tb.replace(/\s+/g,' '));
    t('cari ve vadeli alanları görünmez', d.getElementById('exp-cp').style.display==='none' && d.getElementById('exp-vadeli').parentElement.style.display==='none');
    t('kapsam: Stüdyo / 🏠 Ev', /🏠 Ev/.test(d.getElementById('exp-scope').textContent));
    t('hesap hareketleri kapalı gelir', !d.getElementById('fin-moves-card').open);
    const sel=d.getElementById('fin-move-type').textContent;
    t('tür süzgeci sade: Virman/Mutabakat/Sermaye/Ortak çekimi yok', !/Virman|Mutabakat|Sermaye|Ortak çekimi/.test(sel) && /Hesaplar arası aktarma/.test(sel) && /Bakiye düzeltme/.test(sel), sel);
    t('para aktar penceresi: sade türler', (w.eval('openFinMoveModal196()'), /Para aktar/.test(d.getElementById('modal-fin-move').textContent) && !/Virman|Mutabakat|Sermaye|Ortak çekimi/.test(d.getElementById('fm-op').textContent)), d.getElementById('fm-op') && d.getElementById('fm-op').textContent);
    w.eval("document.getElementById('modal-fin-move').remove()");
    w.eval('finOpenExpenseForm209()'); t('+ Gider gider formunu açar', d.getElementById('expenses-card').open===true);
  }

  console.log('[5] Hesaplar: hesaplarım · düzenli ödemeler ve gelirler (🤖 / 💳 / ✋) · döviz kuru · diğer ayarlar (kapalı)');
  { const w=boot(); await tick(1200); w.eval(FX); const d=w.document;
    w.eval("switchPage('payments'); finSwitchTab196('accounts')"); await tick(100);
    const tx=d.getElementById('fin-accounts-body').textContent; const hx=d.getElementById('fin-accounts-body').innerHTML;
    t('bölümler', /Hesaplarım/.test(tx) && /Düzenli ödemeler ve gelirler/.test(tx) && /Döviz kuru/.test(tx) && /Diğer ayarlar/.test(tx), tx.replace(/\s+/g,' ').slice(0,200));
    t('rozetler: Kira 🤖 otomatik, Bağ-Kur 💳 ekstreyle, Elle ödenen ✋ elle', /Kira[\s\S]*?🤖 otomatik/.test(tx) && /Bağ-Kur primi[\s\S]*?💳 ekstreyle/.test(tx) && /Elle ödenen[\s\S]*?✋ elle/.test(tx));
    t('düzenle ve yeni düzenli kalem düğmeleri', /openFinTemplateModal196\('TK'\)/.test(hx) && /Yeni düzenli ödeme \/ gelir/.test(tx));
    t('diğer ayarlar kapalı', !d.querySelector('#fin-accounts-body details').open);
    t('"Ortaklar", "Güvenlik payı", "Finans başlangıç ayı" kelimeleri yok (sade adlar)', !/Ortaklar|Güvenlik payı|Finans başlangıç ayı/.test(tx));
    w.eval("openFinTemplateModal196('')");
    t('şablon penceresi: 🤖 otomatik kutusu işaretli, cari alanı gizli', d.getElementById('ft-auto') && d.getElementById('ft-auto').checked && d.getElementById('ft-cp').closest('.field').style.display==='none');
    d.getElementById('ft-title').value='Yeni test'; d.getElementById('ft-amount').value='1234';
    w.eval("saveFinTemplate196('')");
    t('yeni şablon: otomatik + bugünden itibaren (geçmişe dönük ödemez)', w.eval("state.finTemplates.find(x=>x.title==='Yeni test').auto")===true && w.eval("state.finTemplates.find(x=>x.title==='Yeni test').autoFrom")===TODAY);
    w.eval("openFinTemplateModal196('TB')"); d.getElementById('ft-acc').value='acc-bank'; w.eval("saveFinTemplate196('TB')");
    t('şablonun hesabı değişince açık kalemi de değişir', w.eval("state.finDues.find(x=>x.id==='due-TB-"+CUR+"').accountId")==='acc-bank');
  }

  console.log('[6] Personel: yalnız izinli Finans sekmeleri (ödemeler → Gelir & Gider, raporlar → Raporlar)');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("__sbRole='staff'; state.settings.staffPerms={payments:false,reports:true}; finSwitchTab196('moves');");
    t('yalnız rapor izni: Gelir & Gider istense de Raporlar', w.eval('__finTab196')==='rapor');
    w.eval("sbApplyRoleUI()");
    t('Finans menüsü görünür, Gelir & Gider gizli, Raporlar görünür', w.document.querySelector('[data-page="payments"]').style.display==='' && w.document.querySelector('#fin-tabs [data-fin="moves"]').style.display==='none' && w.document.querySelector('#fin-tabs [data-fin="rapor"]').style.display==='');
    w.eval("state.settings.staffPerms={payments:true,reports:false}; finSwitchTab196('rapor');");
    t('yalnız ödeme izni: Raporlar istense de Gelir & Gider', w.eval('__finTab196')==='moves');
    w.eval("window.__sbPulledOk209=true; sbClient={auth:{}};"); // bulut istemcisi varmış gibi: rol denetimi devreye girer
    t('personel otomatik ödeme YAPMAZ (sahip değil → 0, kalemler açık)', w.eval('finAutoPayDues209()')===0 && w.eval("state.finDues.filter(d=>d.status==='paid').length")===0);
    w.eval("__sbRole='owner';");
    t('aynı veride sahip olunca otomatik ödeme çalışır (3 kalem)', w.eval('finAutoPayDues209()')===3);
    w.eval("sbClient=null;");
  }

  console.log('[7] Sekme göçü: arayüzden kalkan sekmeler bir kez Özet\'e, Tablolar → Raporlar, Gelir & Gider korunur');
  for (const [from,to] of [['cash','ozet'],['dues','ozet'],['cari','ozet'],['reports','rapor'],['moves','moves']]) {
    const w=boot({pilateria_fin_tab:from,pilateria_fin_ozet208:'1'}); await tick(1200);
    t(from+' → '+to, w.eval('__finTab196')===to && w.localStorage.getItem('pilateria_fin_v209')==='1', w.eval('__finTab196'));
  }

  console.log('[8] Eski adlar arayüzden kalktı (sade): para aktar türleri, hareket listesi');
  { const w=boot(); await tick(1200);
    const ops=JSON.parse(J(w,'FIN_MOVE_OPS196'));
    t('FIN_MOVE_OPS196 sade', ops.transfer==='Hesaplar arası aktarma' && ops.draw==='Kişisel çekim' && ops.capital==='Hesaba para koyma' && ops.reconcile==='Bakiye düzeltme' && ops.cardpay==='Kredi kartı borcu ödeme', JSON.stringify(ops));
  }

  console.log('[9] Güvenlik: bankadan OTOMATİK ödendi sayılan kalem kart ekstresinde çıkarsa kayıt karta taşınır (çift sayılmaz, banka düzelir)');
  { const w=boot(); await tick(1200); w.eval(FX); w.eval('window.__sbPulledOk209=true;'); w.eval('finAutoPayDues209()');
    t('başlangıç: Kira otomatik bankadan (ap-), Banka 63.250', w.eval("state.expenses.some(x=>x.id==='ap-due-TK-"+CUR+"' && x.accountId==='acc-bank')")===true && w.eval("finBalance196('acc-bank')")===63250, w.eval("finBalance196('acc-bank')"));
    const dmy=(ym,dd)=>String(dd).padStart(2,'0')+'.'+ym.slice(5,7)+'.'+ym.slice(0,4); const TD=TODAY.split('-').reverse().join('.');
    const STK='VAKIFBANK WORLDCARD HESAP ÖZETİ\nHesap Kesim Tarihi : '+dmy(CUR,25)+'     Son Ödeme Tarihi : '+dmy(NEXT,5)+'\nDönem Borcunuz : 33,250.00 TL\n'+TD+' KIRA ODEMESI 33,000.00\n'+TD+' MIGROS KADIKOY 250.00\nDönem Borcunuz 33,250.00';
    w.eval("switchPage('payments'); finSwitchTab196('moves'); openFinImportModal196()"); await tick(60);
    w.eval("finImportPreview196("+JSON.stringify(STK)+",'cardK','"+CUR+"')"); await tick(60);
    const rows=JSON.parse(J(w,'__finImp196.rows')); const kr=rows.find(r=>/KIRA/.test(r.desc));
    t('KIRA satırı otomatik Kira kaydına bağlandı (karta taşınacak), işaretli', !!kr && kr.regMoveId==='due-TK-'+CUR && kr.checked===true && !kr.regPaidId, JSON.stringify(kr));
    const pv=w.document.getElementById('fi-preview').textContent;
    t('önizleme: "otomatik banka kaydı karta taşınır" ve "1 düzenli kalem kapanacak"', /otomatik banka kaydı karta taşınır/.test(pv) && /1 düzenli kalem kapanacak/.test(pv), pv.replace(/\s+/g,' ').slice(0,240));
    const res=JSON.parse(J(w,"finImportProcess196({total:33250,dueDate:'"+NEXT+"-05'})"));
    t('sonuç: 2 gider, 1 otomatik kayıt karta taşındı', !!res && res.expenses===2 && res.moved===1, JSON.stringify(res));
    const due=JSON.parse(J(w,"state.finDues.find(x=>x.id==='due-TK-"+CUR+"')")); const ne=JSON.parse(J(w,"state.expenses.find(x=>x.dueId==='due-TK-"+CUR+"')||null"));
    t('otomatik banka kaydı silindi; kalem kart giderine bağlı (Kira, faturalı, stüdyo)', w.eval("state.expenses.some(x=>x.id==='ap-due-TK-"+CUR+"')")===false && !!ne && ne.accountId==='cardK' && due.status==='paid' && due.paidRef.id===ne.id && ne.category==='Kira' && ne.resmi===true && ne.scope==='studio', JSON.stringify([due,ne]));
    t('Banka düzeldi (96.250 = 100.000 − Aidat 3.750), kart borcu Kira + market (−33.250)', w.eval("finBalance196('acc-bank')")===96250 && w.eval("finBalance196('cardK')")===-33250, w.eval("finBalance196('acc-bank')")+' / '+w.eval("finBalance196('cardK')"));
    t('Kira tek kez sayılır (stüdyo Kira 33.000)', w.eval("finSummary208('"+CUR+"').studio.cats['Kira']")===33000, w.eval("finSummary208('"+CUR+"').studio.cats['Kira']"));
    t('kalem bir daha otomatik ödenmez', w.eval('finAutoPayDues209()')===0 && w.eval("state.expenses.filter(x=>x.dueId==='due-TK-"+CUR+"').length")===1);
  }

  console.log('SONUÇ: '+pass+' OK, '+fail+' FAIL'); process.exit(fail?1:0);
}catch(e){ console.log('TEST COKTU', e && e.stack || e); process.exit(2); }},50);
