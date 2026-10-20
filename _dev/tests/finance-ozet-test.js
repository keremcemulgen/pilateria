// v208 (Kerem 20.10): TEK ÖZET — Panel, Raporlar ve Finans aynı fonksiyondan aynı rakamı gösterir (PARA ESASI: o ay giren − çıkan).
// Reelde (stüdyo) ↔ Devlette (resmi) yan yana; ev + toplam; düzenli gelir & gider; toplam para ≈ $/€ (kur elle); para kontrolü;
// ekstre satırı açık düzenli kalemi kapatır, başka hesaptan ödenmiş düzenli kaleme benzeyen satır işaretsiz gelir.
// Yamasız (v207) yapıda finSummary208 yok → [1]…[9] BAŞARISIZ olmalı.
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
const addM=(ym,k)=>{ const p=ym.split('-').map(Number); const d=new Date(p[0],p[1]-1+k,1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); };
const now=new Date(); const CUR=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0'); const PREV=addM(CUR,-1), NEXT=addM(CUR,1);
const [CY,CMo]=CUR.split('-').map(Number), [PY,PM]=PREV.split('-').map(Number);
const dmy=(ym,d)=>String(d).padStart(2,'0')+'.'+ym.slice(5,7)+'.'+ym.slice(0,4);
const has=(v)=>typeof v!=='undefined';
const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
  state.packageTypes=[]; state.instructors=[{id:'I1',name:'HOCA BİR',shareRate:30}]; state.members=[]; state.groups=[]; state.lessons=[];
  state.payments=[
   {id:'p1',memberId:'m1',groupId:'',date:'${CUR}-03',packageMonth:'${CUR}',amount:4500,method:'Nakit',sessions:8,pkgName:'x'},
   {id:'p2',memberId:'m2',groupId:'',date:'${CUR}-20',packageMonth:'${NEXT}',amount:6000,method:'IBAN',sessions:8,pkgName:'x'},
   {id:'p3',memberId:'m3',groupId:'',date:'${PREV}-28',packageMonth:'${CUR}',amount:3000,method:'Nakit',sessions:8,pkgName:'x'},
   {id:'p4',memberId:'m1',groupId:'',date:'${CUR}-10',packageMonth:'${CUR}',amount:-500,method:'Nakit',sessions:0,pkgName:'x',refund:true}];
  state.instructorPayouts=[
   {id:'po1',instructorId:'I1',year:${PY},month:${PM},amount:2000,paidDate:'${CUR}-02',method:'Nakit'},
   {id:'po2',instructorId:'I1',year:${CY},month:${CMo},amount:1500,paidDate:'${CUR}-25',method:'IBAN'}];
  state.finAccounts=state.finAccounts.filter(a=>a.id==='acc-cash'||a.id==='acc-bank');
  const c=finAccount196('acc-cash'); c.openingDate='${PREV}-01'; c.openingBalance=5000;
  const b=finAccount196('acc-bank'); b.openingDate='${PREV}-01'; b.openingBalance=50000;
  state.finAccounts.push({id:'kb',kind:'account',type:'bank',name:'Kerem Banka',owner:'Kerem',openingDate:'${PREV}-01',openingBalance:10000,active:true});
  state.finAccounts.push({id:'cardD',kind:'account',type:'card',name:'Vakıf (Derya)',bank:'VakıfBank',owner:'Derya',openingDate:'${PREV}-01',openingBalance:-2000,cutoffDay:25,dueDay:5,active:true,scopeDefault:'studio'});
  state.finAccounts.push({id:'cardK',kind:'account',type:'card',name:'Vakıf (Kerem)',bank:'VakıfBank',owner:'Kerem',openingDate:'${PREV}-01',openingBalance:0,cutoffDay:25,dueDay:5,active:true,scopeDefault:'hane',employerSkip:true});
  state.finTemplates=[
   {id:'TK',kind:'template',title:'Kira',amount:33000,dayOfMonth:13,category:'Kira',accountId:'acc-bank',resmi:true,kdvRate:0,startMonth:'${CUR}',endMonth:'',active:true,flow:'out',scope:'studio'},
   {id:'TE',kind:'template',title:'Ev kirası',amount:22000,dayOfMonth:10,category:'Kira',accountId:'kb',resmi:false,kdvRate:0,startMonth:'${CUR}',endMonth:'',active:true,flow:'out',scope:'hane'},
   {id:'TM',kind:'template',title:'Maaş',amount:100000,dayOfMonth:5,category:'Diğer',accountId:'kb',resmi:false,kdvRate:0,startMonth:'${CUR}',endMonth:'',active:true,flow:'in',scope:'hane'}];
  state.finDues=[
   {id:'due-TK-${CUR}',kind:'due',dtype:'expense',templateId:'TK',period:'${CUR}',title:'Kira',amount:33000,dueDate:'${CUR}-13',category:'Kira',accountId:'acc-bank',resmi:true,kdvRate:0,scope:'studio',status:'paid',paidRef:{type:'expense',id:'eK'},paidDate:'${CUR}-13',paidAmount:33000},
   {id:'due-TE-${CUR}',kind:'due',dtype:'expense',templateId:'TE',period:'${CUR}',title:'Ev kirası',amount:22000,dueDate:'${CUR}-10',category:'Kira',accountId:'kb',resmi:false,kdvRate:0,scope:'hane',status:'open'},
   {id:'due-TM-${CUR}',kind:'due',dtype:'income',templateId:'TM',period:'${CUR}',title:'Maaş',amount:100000,dueDate:'${CUR}-05',category:'Diğer',accountId:'kb',resmi:false,kdvRate:0,scope:'hane',status:'paid',paidRef:{type:'move',id:'mvM'},paidDate:'${CUR}-05',paidAmount:100000}];
  state.expenses=[
   {id:'eK',date:'${CUR}-13',paidDate:'${CUR}-13',category:'Kira',amount:33000,note:'Kira',resmi:true,kdvRate:0,accountId:'acc-bank',scope:'studio',dueId:'due-TK-${CUR}',source:'due'},
   {id:'eM',date:'${CUR}-05',paidDate:'${CUR}-05',category:'Market/Yemek',amount:1200,note:'MIGROS',accountId:'cardK',scope:'hane',source:'card-import'},
   {id:'eE',date:'${CUR}-08',paidDate:'${CUR}-08',category:'Elektrik/Su/Doğalgaz',amount:800,note:'ENERJISA',accountId:'cardD',scope:'studio',source:'card-import'},
   {id:'eV',date:'${CUR}-01',category:'KDV Ödemesi',amount:2000,note:'KDV elle',accountId:'cardK',scope:'studio',source:'manual'},
   {id:'eH',date:'${CUR}-15',category:'Hoca Maaşı',amount:1500,note:'maaş elle',accountId:'acc-bank',scope:'studio'},
   {id:'eO',date:'${CUR}-16',category:'Diğer',amount:999,note:'açık eski',accountId:'acc-bank',scope:'studio',status:'open'}];
  state.finMoves=[
   {id:'mvM',kind:'move',op:'income',date:'${CUR}-05',amount:100000,toAccountId:'kb',scope:'hane',title:'Maaş',dueId:'due-TM-${CUR}'},
   {id:'mvC',kind:'move',op:'cardpay',date:'${CUR}-15',amount:2000,fromAccountId:'acc-bank',toAccountId:'cardD'}];
  state.finCounterparties=[]; state.finRules=[]; state.finImports=[];
  state.settings.taxStartMonth='${PREV}'; state.settings.taxOpeningLoss=0; state.settings.taxOpeningKdv=0; state.settings.taxLedger={}; state.settings.kdvRate=20;
  delete state.settings.finance.fx;`;
const STMT=`VAKIFBANK WORLDCARD HESAP ÖZETİ
Hesap Kesim Tarihi : ${dmy(CUR,25)}     Son Ödeme Tarihi : ${dmy(NEXT,5)}
Dönem Borcunuz : 43,406.73 TL
${dmy(CUR,19)} SGK Ödem/11111111111/2222222222 10,156.73
${dmy(CUR,13)} KIRA ODEMESI 33,000.00
${dmy(CUR,14)} MIGROS KADIKOY 250.00
Dönem Borcunuz 43,406.73`;
setTimeout(async function(){try{
  console.log('[1] finSummary208 — para esası: üye tahsilatı ödeme günü, hoca ödemesi ödendiği gün, Hoca Maaşı ve açık gider hariç; stüdyo/ev/toplam');
  { const w=boot(); await tick(1200); w.eval(FX);
    const S=JSON.parse(J(w,"finSummary208('"+CUR+"')"));
    t('fonksiyon var', S && S.studio, J(w,"typeof finSummary208"));
    if (S && S.studio) {
      t('stüdyo: tahsilat 10.000 (4.500 + 6.000 erken Kasım paketi − 500 iade; önceki ayın 3.000 erken ödemesi DEĞİL), 3 ödeme', S.studio.uye===10000 && S.studio.uyeN===3, JSON.stringify(S.studio));
      t('stüdyo: hoca 3.500 (önceki dönem 2.000 bu ay ödendi + bu dönem 1.500), gider 35.800 (Kira + Elektrik + KDV; Hoca Maaşı ve açık gider hariç)', S.studio.hoca===3500 && S.studio.gider===35800, JSON.stringify(S.studio));
      t('stüdyo net −29.300', S.studio.net===-29300, S.studio.net);
      t('Hoca Maaşı kaydı yalnız bilgi: 1.500 (hoca ödemesinde sayılır, gidere girmez)', S.studio.maas===1500, S.studio.maas);
      t('ev: maaş 100.000 − market 1.200 = 98.800', S.ev.gelir===100000 && S.ev.gider===1200 && S.ev.net===98800, JSON.stringify(S.ev));
      t('toplam net 69.500 (giren 110.000, çıkan 40.500)', S.toplam.net===69500 && S.toplam.gelir===110000 && S.toplam.gider===40500, JSON.stringify(S.toplam));
      const T=JSON.parse(J(w,"taxMonthModel('"+CUR+"')"));
      t('devlet = taxMonthModel (tek kaynak): kâr ' + T.kar, S.devlet && S.devlet.kar===T.kar && S.devlet.odenecekKdv===T.odenecekKdv && S.devlet.gelir===T.gelir, JSON.stringify(S.devlet));
      t('fark = stüdyo net − devlet kârı', Math.abs(S.fark-(S.studio.net-T.kar))<0.005, S.fark);
    }
    t('eski netProfitForMonth DEĞİŞMEDİ (paket ayı: 4.500 + 3.000 − 500 = 7.000)', w.eval("netProfitForMonth('"+CUR+"').rev")===7000, w.eval("netProfitForMonth('"+CUR+"').rev"));
  }

  console.log('[2] Panel ve Raporlar aynı rakamı gösterir (para esası)');
  { const w=boot(); await tick(1200); w.eval(FX); const d=w.document;
    w.eval("window.__dashMonthUserSet=true; document.getElementById('dash-month').value='"+CUR+"'; renderDashboard();");
    t('Panel tahsilatı 10.000, etiket "… Tahsilatı"', d.getElementById('s-revenue').textContent.replace(/\s/g,'')==='10.000' && /Tahsilatı/.test(d.getElementById('s-revenue-label').textContent), d.getElementById('s-revenue').textContent+' | '+d.getElementById('s-revenue-label').textContent);
    t('Panel net kâr (stüdyo) −29.300', /^[-−]29\.300$/.test(d.getElementById('s-netprofit').textContent.trim()), d.getElementById('s-netprofit').textContent);
    w.eval("document.getElementById('rep-month').value='"+CUR+"'; renderReports();");
    const st=[...d.querySelectorAll('#report-content .stat')].map(e=>(e.querySelector('.label')||{}).textContent+'='+(e.querySelector('.value')||{}).textContent);
    t('Aylık Rapor: tahsilat (ödeme günü) 10.000, ödeme sayısı 3', /tahsilat \(ödeme günü\)=10\.000/.test(st[0]||'') && st.some(x=>/^Ödeme Sayısı=3$/.test(x)), JSON.stringify(st));
    const np=d.getElementById('net-profit-panel').textContent;
    t('Para Özeti bloğu: NET KÂR, reel −29.300, ev +98.800, toplam +69.500', /NET KÂR/.test(np) && /[-−]29\.300/.test(np) && /\+98\.800/.test(np) && /\+69\.500/.test(np), np.replace(/\s+/g,' ').slice(0,300));
    t('maaş kaydı notu: "+1.500 ₺ maaş kaydı — Hoca Ödemeleri\'nde sayılır"', /\+1\.500 ₺ maaş kaydı — Hoca Ödemeleri'nde sayılır/.test(np), np.replace(/\s+/g,' ').slice(0,300));
    const tp=d.getElementById('tax-panel').textContent;
    t('eski vergi sütunları yok (Gelir Vergisi / Cebe Kalan)', !/Gelir Vergisi/.test(tp) && !/Cebe Kalan/.test(tp) && /TOPLAM/.test(tp), tp.replace(/\s+/g,' ').slice(0,200));
    const tc=d.getElementById('trend-chart').innerHTML; const titles=tc.match(/<title>[^<]*<\/title>/g)||[];
    t('12 ay grafiği aynı kaynaktan: son ay "Tahsilat: 10.000 · Net kâr (stüdyo): -29.300"', titles.length===12 && /Tahsilat: 10\.000 ₺ · Net kâr \(stüdyo\): [-−]29\.300/.test(titles[11]), titles[11]);
  }

  console.log('[3] Finans › 📊 Özet: varsayılan sekme, para (toplam/kart/net varlık), reel ↔ devlet, düzenli kalemler, para kontrolü, Resmi Defter');
  { const w=boot(); await tick(1200); w.eval(FX); const d=w.document;
    w.eval("localStorage.removeItem('pilateria_fin_tab'); __finTab196=''; switchPage('payments');"); await tick(120);
    t('finans etkin + ilk açılış → varsayılan sekme Özet', d.getElementById('fin-panel-ozet') && d.getElementById('fin-panel-ozet').classList.contains('active'), w.eval('__finTab196'));
    const tabs=[...d.querySelectorAll('#fin-tabs .fin-tab[data-fin]')].map(b=>b.dataset.fin).join(',');
    t('sekmeler (v209, Kerem "başlıkları azalt"): ozet,moves,rapor,accounts — Cari/Vadeler/Nakit Akışı/Tablolar/⋯ Diğer yok', tabs==='ozet,moves,rapor,accounts' && !d.querySelector('#fin-tabs .fin-more-btn'), tabs);
    w.eval("finSwitchTab196('ozet')"); await tick(80);
    const tx=(d.getElementById('fin-ozet-body')||{}).textContent||'';
    t('Param: toplam 139.500 (Kasa 10.000 + Banka 19.500 + Kerem Banka 110.000), kart borcu 4.000, net varlık 135.500', /Toplam param/.test(tx) && /139\.500/.test(tx) && /Kart borcu/.test(tx) && /4\.000/.test(tx) && /Net varlık/.test(tx) && /135\.500/.test(tx), tx.replace(/\s+/g,' ').slice(0,400));
    t('kur yokken "≈ $ / € için kur gir"', /kur gir/.test(tx));
    t('Reelde/Devlette: stüdyo −29.300, ev +98.800, toplam +69.500', /Reelde/.test(tx) && /Devlette/.test(tx) && /[-−]29\.300/.test(tx) && /\+98\.800/.test(tx) && /\+69\.500/.test(tx));
    t('para kontrolü: hesaplardaki değişim +69.500 = kâr/zarar', /✓ Para kontrolü/.test(tx) && /\+69\.500/.test(tx), (tx.match(/Para kontrolü[^.]*\./)||[''])[0]);
    const C=JSON.parse(J(w,"finCheck208('"+CUR+"')"));
    t('finCheck208: hazır, fark 0', C.ready===true && C.diff===0 && C.actual===69500, JSON.stringify(C));
    t('Resmi Defter Özet\'te (Hareketler\'de değil)', !!d.querySelector('#fin-panel-ozet #tax-ledger-card') && !d.querySelector('#fin-panel-moves #tax-ledger-card'));
    const tl=d.getElementById('tax-ledger-body').textContent;
    t('Resmi Defter "Reel — stüdyo (para esası)" −29.300 (eski karışık "Reel Net" yok)', /Reel — stüdyo/.test(tl) && /[-−]29\.300/.test(tl) && !/kayıt dışı dahil/.test(tl), tl.replace(/\s+/g,' ').slice(0,300));
    t('Kira + Stopaj düğmesi defterin ayını taşır', /addRentWithStopaj\('\d{4}-\d{2}'\)/.test(d.getElementById('tax-ledger-body').innerHTML));
  }

  console.log('[4] Düzenli gelir & gider: şablon kalemleri, karttan vergi/fatura grupları, hoca dönemleri, üye tahsilatı; toplamlar tutar');
  { const w=boot(); await tick(1200); w.eval(FX);
    const R=JSON.parse(J(w,"finRegular208('"+CUR+"')"));
    if (!R || !R.out) { t('finRegular208 var', false, J(w,'typeof finRegular208')); }
    else {
      const o=k=>R.out.find(x=>x.title===k)||R.out.find(x=>String(x.title).indexOf(k)===0);
      t('Kira ✓ 33.000 (Banka, bu ay)', o('Kira') && o('Kira').status==='paid' && o('Kira').amount===33000 && o('Kira').inMonth===true && o('Kira').accountId==='acc-bank', JSON.stringify(o('Kira')));
      t('Ev kirası ⏳ 22.000 (ev)', o('Ev kirası') && (o('Ev kirası').status==='open'||o('Ev kirası').status==='overdue') && o('Ev kirası').amount===22000 && o('Ev kirası').scope==='hane', JSON.stringify(o('Ev kirası')));
      const tax=R.out.find(x=>x.kind==='tax'), bill=R.out.find(x=>x.kind==='bill');
      t('vergi grubu: KDV Ödemesi 2.000 (karttan, şablonsuz)', tax && tax.title==='KDV Ödemesi' && tax.amount===2000 && tax.accountId==='cardK', JSON.stringify(tax));
      t('fatura grubu: Elektrik/Su/Doğalgaz 800', bill && bill.title==='Elektrik/Su/Doğalgaz' && bill.amount===800, JSON.stringify(bill));
      const ho=R.out.filter(x=>x.kind==='hoca');
      t('hoca: önceki dönem 2.000 (bu ay ödendi) + bu dönem 1.500', ho.length===2 && ho.some(x=>x.period===PREV && x.amount===2000 && x.other===true) && ho.some(x=>x.period===CUR && x.amount===1500), JSON.stringify(ho));
      t('gelir: üye tahsilatı 10.000 + maaş 100.000 = 110.000 alınan', R.incPaid===110000 && R.inc.some(x=>x.kind==='uye' && x.amount===10000) && R.inc.some(x=>x.title==='Maaş' && x.status==='paid'), JSON.stringify(R.inc));
      t('gider: ödenen 39.300 + diğer 1.200 = toplam 40.500; bekleyen 22.000', R.outPaid===39300 && R.otherOut===1200 && R.totalOut===40500 && R.outOpen===22000, JSON.stringify({p:R.outPaid,o:R.otherOut,t:R.totalOut,b:R.outOpen}));
    }
    w.eval("switchPage('payments'); finSwitchTab196('ozet')"); await tick(80);
    const tx=w.document.getElementById('fin-ozet-body').textContent;
    t('Özet düzenli bölümü: Kira, Ev kirası, Vergi · KDV, Fatura · Elektrik, Hoca ödemeleri, Üye tahsilatları', /Düzenli gelir & gider/.test(tx) && /Ev kirası/.test(tx) && /Vergi · KDV/.test(tx) && /Fatura · Elektrik/.test(tx) && /Hoca ödemeleri/.test(tx) && /Üye tahsilatları/.test(tx), tx.replace(/\s+/g,' ').slice(0,200));
  }

  console.log('[5] Döviz: kur elle (tarihiyle), toplam ≈ $ / ≈ €; virgüllü giriş; silinebilir');
  { const w=boot(); await tick(1200); w.eval(FX); const d=w.document;
    const ok=w.eval("saveFinFx208(false,{usd:'40',eur:'50,0',date:'2026-10-20'})");
    const fx=JSON.parse(J(w,'state.settings.finance.fx||null'));
    t('kur kaydedildi {usd:40, eur:50, date}', ok===true && fx && fx.usd===40 && fx.eur===50 && fx.date==='2026-10-20', JSON.stringify(fx));
    w.eval("switchPage('payments'); finSwitchTab196('ozet')"); await tick(80);
    const tx=d.getElementById('fin-ozet-body').textContent;
    t('≈ 3.488 $ · ≈ 2.790 € (139.500 ₺) ve net varlık ≈ 3.388 $ · ≈ 2.710 €', /≈ 3\.488 \$/.test(tx) && /≈ 2\.790 €/.test(tx) && /≈ 3\.388 \$/.test(tx) && /≈ 2\.710 €/.test(tx), (tx.match(/≈[^≈]{0,20}/g)||[]).join(' | '));
    w.eval("saveFinFx208(false,{usd:'41,85',eur:'48.7'})");
    t('virgüllü kur 41,85 → 41.85; noktalı 48.7', w.eval('state.settings.finance.fx.usd')===41.85 && w.eval('state.settings.finance.fx.eur')===48.7 && /^\d{4}-\d{2}-\d{2}$/.test(w.eval('state.settings.finance.fx.date')));
    w.eval("openFinFxModal208()"); t('kur penceresi açılır (iki alan)', !!d.getElementById('fx-usd') && !!d.getElementById('fx-eur')); w.eval("document.getElementById('modal-fin-fx').remove()");
    w.eval('saveFinFx208(true)'); t('kur silinir', !w.eval('state.settings.finance.fx'));
    t('geçersiz kur reddedilir', w.eval("saveFinFx208(false,{usd:'abc',eur:''})")===false && /En az bir kur/.test(w.__msgs.join('|')));
  }

  console.log('[6] Açılış bakiyesi olmayan hesap uyarılır; para kontrolü beklemeye geçer');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("state.finAccounts.push({id:'kx',kind:'account',type:'bank',name:'Eski Hesap',owner:'',openingDate:'',openingBalance:0,active:true}); switchPage('payments'); finSwitchTab196('ozet');"); await tick(80);
    const tx=w.document.getElementById('fin-ozet-body').textContent;
    t('uyarı: "Eski Hesap için açılış bakiyesi girilmedi"', /Eski Hesap için açılış bakiyesi girilmedi/.test(tx), tx.replace(/\s+/g,' ').slice(0,300));
    t('toplam yine 139.500 (açılışsız hesap toplama girmez)', /139\.500/.test(tx));
    t('para kontrolü hazır değil', w.eval("finCheck208('"+CUR+"').ready")===false);
  }

  console.log('[7] Tablolar › Gelir–Gider para esası (finPlRows208): Stüdyo net · Ev net · Toplam net · Devlet');
  { const w=boot(); await tick(1200); w.eval(FX); const d=w.document;
    const rows=JSON.parse(J(w,"finPlRows208(['"+PREV+"','"+CUR+"'])")); const g=l=>rows.find(r=>r.label===l);
    t('satırlar ve değerler', g('Stüdyo net') && g('Stüdyo net').vals[1]===-29300 && g('Ev net').vals[1]===98800 && g('Toplam net (stüdyo + ev)').vals[1]===69500 && g('Hoca ödemeleri (ödendiği gün)').vals[1]===-3500 && g('Üye tahsilatları (ödeme günü)').vals[0]===3000 && !!g('Devlet (resmi) kâr/zarar'), JSON.stringify(rows.map(r=>[r.label,r.vals])).slice(0,400));
    w.eval("switchPage('payments'); __finRep196.kind='pl'; finSwitchTab196('reports')"); await tick(80);
    const tx=d.getElementById('fin-reports-body').textContent;
    t('Tablolar ekranı: Para esası notu, Stüdyo net, Ev net, Toplam net', /Para esası/.test(tx) && /Stüdyo net/.test(tx) && /Ev net/.test(tx) && /Toplam net/.test(tx), tx.replace(/\s+/g,' ').slice(0,200));
  }

  console.log('[8] Ekstre: açık düzenli kalem (Bağ-Kur) satırla kapanır; başka hesaptan ödenmiş Kira\'ya benzeyen satır işaretsiz gelir');
  const FXB=FX+`
    state.finTemplates.push({id:'TB',kind:'template',title:'Bağ-Kur primi',amount:10156.73,dayOfMonth:20,category:'Bağkur',accountId:'cardD',resmi:false,kdvRate:0,startMonth:'${CUR}',endMonth:'',active:true,flow:'out',scope:'studio'});
    state.finDues.push({id:'due-TB-${CUR}',kind:'due',dtype:'expense',templateId:'TB',period:'${CUR}',title:'Bağ-Kur primi',amount:10156.73,dueDate:'${CUR}-20',category:'Bağkur',accountId:'cardD',resmi:false,kdvRate:0,scope:'studio',status:'open'});
    switchPage('payments'); finSwitchTab196('moves');`;
  { const w=boot(); await tick(1200); w.eval(FXB); const d=w.document;
    w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(STMT)+",'cardD','"+CUR+"')"); await tick(60);
    const rows=JSON.parse(J(w,'__finImp196.rows'));
    const sgk=rows.find(r=>/SGK/.test(r.desc)), kira=rows.find(r=>/KIRA/.test(r.desc)), mig=rows.find(r=>/MIGROS/.test(r.desc));
    t('SGK satırı (10.156,73) açık Bağ-Kur vadesine bağlandı, işaretli', sgk && sgk.regDueId==='due-TB-'+CUR && sgk.checked===true, JSON.stringify(sgk));
    t('KIRA satırı (33.000) Banka\'dan ödenmiş Kira\'ya benziyor → işaretsiz', kira && kira.regPaidId==='due-TK-'+CUR && kira.checked===false, JSON.stringify(kira));
    t('MIGROS satırı normal', mig && !mig.regDueId && !mig.regPaidId && mig.checked===true);
    const pv=d.getElementById('fi-preview').textContent;
    t('önizleme: "1 düzenli kalem kapanacak", "↔ düzenli: Bağ-Kur primi", "zaten ödendi: Kira"', /1 düzenli kalem kapanacak/.test(pv) && /↔ düzenli: Bağ-Kur primi/.test(pv) && /zaten ödendi: Kira/.test(pv), pv.replace(/\s+/g,' ').slice(0,300));
    const res=JSON.parse(J(w,"finImportProcess196({total:10406.73,dueDate:'"+NEXT+"-05'})"));
    t('sonuç: 2 gider, 1 düzenli kalem kapandı', res && res.expenses===2 && res.regular===1, JSON.stringify(res));
    const due=JSON.parse(J(w,"state.finDues.find(x=>x.id==='due-TB-"+CUR+"')")); const e=JSON.parse(J(w,"state.expenses.find(x=>x.dueId==='due-TB-"+CUR+"')||null"));
    t('Bağ-Kur vadesi ödendi, gidere bağlı; gider kategori Bağkur (şablondan), kart, not "düzenli: Bağ-Kur primi"', due.status==='paid' && e && due.paidRef && due.paidRef.id===e.id && e.category==='Bağkur' && e.accountId==='cardD' && /düzenli: Bağ-Kur primi/.test(e.note) && e.source==='card-import', JSON.stringify([due,e]));
    t('Kira ikinci kez yazılmadı', w.eval("state.expenses.filter(x=>x.category==='Kira' && x.scope!=='hane' && x.amount===33000).length")===1);
    t('içe alma kaydı regular 1', w.eval('state.finImports[0].regular')===1);
    const R=JSON.parse(J(w,"finRegular208('"+CUR+"')"));
    t('düzenli listede Bağ-Kur ✓ (şablon satırı; vergi grubunda tekrar yok)', R.out.some(x=>x.kind==='tpl' && x.title==='Bağ-Kur primi' && x.status==='paid' && x.inMonth) && !R.out.some(x=>x.kind==='tax' && x.title==='Bağkur'), JSON.stringify(R.out.map(x=>[x.kind,x.title,x.status])));
  }
  { const w=boot(); await tick(1200); w.eval(FXB);
    w.eval("openFinImportModal196()"); await tick(60); w.eval("finImportPreview196("+JSON.stringify(STMT)+",'cardD','"+CUR+"')"); await tick(60);
    w.eval("__finImp196.rows.forEach(r=>{ if (/SGK/.test(r.desc)) r.regOff=true; }); finImportRenderPreview196();"); await tick(40);
    const res=JSON.parse(J(w,"finImportProcess196({total:10406.73,dueDate:'"+NEXT+"-05'})"));
    t('bağlantı kapatılırsa: vade açık kalır, satır normal gider (tahmin kategorisi), regular 0', res.regular===0 && w.eval("state.finDues.find(x=>x.id==='due-TB-"+CUR+"').status")==='open' && w.eval("state.expenses.some(x=>/SGK/.test(x.note) && !x.dueId)")===true, JSON.stringify(res));
  }

  console.log('[9] Sekme göçü: eski varsayılan "Nakit Akışı" bir kez Özet olur; "Hareketler" korunur; sonra Nakit Akışı açılabilir');
  { const w=boot({pilateria_fin_tab:'cash'}); await tick(1200);
    t('cash → ozet (bayrak yazıldı)', w.eval('__finTab196')==='ozet' && w.localStorage.getItem('pilateria_fin_ozet208')==='1' && w.localStorage.getItem('pilateria_fin_tab')==='ozet', w.eval('__finTab196'));
    w.eval("finSwitchTab196('cash')"); t('sonra Nakit Akışı seçilebilir (göç tekrar etmez)', w.eval('__finTab196')==='cash');
  }
  { const w=boot({pilateria_fin_tab:'moves'}); await tick(1200);
    t('moves korunur', w.eval('__finTab196')==='moves');
  }
  { const w=boot({pilateria_fin_tab:'cash',pilateria_fin_ozet208:'1'}); await tick(1200);
    t('v209: Nakit Akışı sekmesi arayüzden kalktı → v208 bayrağı olsa da bir kez Özet', w.eval('__finTab196')==='ozet' && w.localStorage.getItem('pilateria_fin_v209')==='1');
  }

  console.log('[10] Açık düzenli kalem elle ödenmişse "olası ödeme" + Bağla: yeni gider yazılmaz, kalem kapanır; farklı kapsam önerilmez');
  { const w=boot(); await tick(1200); w.eval(FX+`
      state.finTemplates.push({id:'TA',kind:'template',title:'Aidat',amount:3750,dayOfMonth:15,category:'Diğer',accountId:'acc-bank',resmi:true,kdvRate:0,startMonth:'${CUR}',endMonth:'',active:true,flow:'out',scope:'studio'});
      state.finDues.push({id:'due-TA-${CUR}',kind:'due',dtype:'expense',templateId:'TA',period:'${CUR}',title:'Aidat',amount:3750,dueDate:'${CUR}-15',category:'Diğer',accountId:'acc-bank',resmi:true,kdvRate:0,scope:'studio',status:'open'});
      state.expenses.push({id:'eA',date:'${CUR}-14',category:'Diğer',amount:3750,note:'site aidatı',accountId:'acc-bank',scope:'studio',source:'manual'});
      state.expenses.push({id:'eX',date:'${CUR}-10',category:'Kira',amount:22000,note:'stüdyo ek kira',accountId:'acc-bank',scope:'studio',source:'manual'});`);
    const c=JSON.parse(J(w,"finDueCandidate208(state.finDues.find(d=>d.id==='due-TA-"+CUR+"'))"));
    t('olası ödeme: eA (aynı tutar, 1 gün, aynı kategori)', c && c.id==='eA', JSON.stringify(c));
    t('Ev kirası (ev) için stüdyo kapsamlı aynı tutar ÖNERİLMEZ', J(w,"finDueCandidate208(state.finDues.find(d=>d.id==='due-TE-"+CUR+"'))")==='null');
    const R=JSON.parse(J(w,"finRegular208('"+CUR+"')")); const a=R.out.find(x=>x.title==='Aidat');
    t('Özet satırında olası ödeme', a && a.cand && a.cand.id==='eA' && (a.status==='open'||a.status==='overdue'), JSON.stringify(a));
    w.eval("switchPage('payments'); finSwitchTab196('ozet')"); await tick(80);
    t('Özet ekranında "olası ödeme" ve Bağla düğmesi', /olası ödeme/.test(w.document.getElementById('fin-ozet-body').textContent) && /finLinkDue208\('due-TA-/.test(w.document.getElementById('fin-ozet-body').innerHTML));
    w.eval("finSwitchTab196('dues')"); await tick(80);
    t('Vadeler satırında olası ödeme + ↔ Bağla', /olası ödeme/.test(w.document.getElementById('fin-dues-body').textContent) && /finLinkDue208\('due-TA-/.test(w.document.getElementById('fin-dues-body').innerHTML));
    const n0=w.eval('state.expenses.length');
    t('Bağla çalışır', w.eval("finLinkDue208('due-TA-"+CUR+"','eA')")===true);
    t('kalem ödendi, gidere bağlı, YENİ GİDER YOK', w.eval("state.finDues.find(d=>d.id==='due-TA-"+CUR+"').status")==='paid' && w.eval("state.finDues.find(d=>d.id==='due-TA-"+CUR+"').paidRef.id")==='eA' && w.eval("state.expenses.find(e=>e.id==='eA').dueId")==='due-TA-'+CUR && w.eval('state.expenses.length')===n0);
    const R2=JSON.parse(J(w,"finRegular208('"+CUR+"')")); const a2=R2.out.find(x=>x.title==='Aidat');
    t('düzenli listede Aidat ✓, olası ödeme kalktı', a2 && a2.status==='paid' && a2.inMonth===true && !a2.cand, JSON.stringify(a2));
    t('ikinci kez bağlanamaz', w.eval("finLinkDue208('due-TA-"+CUR+"','eA')")===false);
  }

  console.log('SONUÇ: '+pass+' OK, '+fail+' FAIL'); process.exit(fail?1:0);
}catch(e){ console.log('TEST COKTU', e && e.stack || e); process.exit(2); }},50);
