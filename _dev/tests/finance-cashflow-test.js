// v196 ADIM 3 — NAKİT AKIŞI PROJEKSİYONU + FİNANS RAPORLARI
// Projeksiyon: bugünkü nakit (Kasa+Banka) + vadeli tahsilatlar − vadeli ödemeler gün gün (A), yalnız ödemeler (B);
// gecikmişler bugüne; yenilemeler tahmin (çizgiye girmez); güvenlik payı uyarısı. Raporlar: gelir–gider aylar yan yana,
// hesap ekstresi (yürüyen bakiye), cari ekstre, gerçekleşen nakit akış tablosu, CSV.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__msgs=[]; w.__csv=null;
  w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); if(o&&o.input) return String(o.input.value); return true; };
  w.alert=(m)=>{ w.__msgs.push('ALERT:'+m); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
  w.URL.createObjectURL=()=>'blob:x'; w.URL.revokeObjectURL=()=>{};
}}).window; }
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
const J=(w,e)=>w.eval('JSON.stringify('+e+')');
setTimeout(async function(){try{
  const w0=boot(); await tick(1200);
  const TODAY=w0.eval('todayISO()'), CUR=w0.eval('currentMonth()'), NEXT=w0.eval("finMonthAdd196(currentMonth(),1)"), PREV=w0.eval("finMonthAdd196(currentMonth(),-1)");
  const addD=(iso,k)=>w0.eval("addDaysISO('"+iso+"',"+k+")");
  const D2=addD(TODAY,2), D5=addD(TODAY,5), D9=addD(TODAY,9), DM3=addD(TODAY,-3);
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.settings.reformers=5; state.settings.instructorShareRate=30; state.packageTypes=[{id:'p1',name:'BIREYSEL',sessions:8,price:4500}];
    state.instructors=[{id:'G',name:'GIZEM',shareRate:30,partner:true}]; // ortak: hakediş vadesi üretmez (projeksiyon sayıları sade kalsın)
    const en={'${PREV}':{enrolled:true},'${CUR}':{enrolled:true},'${NEXT}':{enrolled:true}};
    const mk=(id,name)=>({id,name,joinDate:'2026-01-01',defaultPackageId:'p1',totalPrice:4500,packages:[],monthly:JSON.parse(JSON.stringify(en))});
    state.members=[mk('A','AYSE'),mk('B','BERNA')];
    state.groups=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.finCounterparties=[]; state.lessons=[];
    const L=(id,mid,date,st)=>state.lessons.push({id,groupId:'',instructorId:'G',date,time:'10:00',durationMin:45,status:st,memberIds:[mid],packageMonth:date.slice(0,7),packageOwnerType:'member',packageOwnerId:mid,size:1});
    L('LA','A','${D5}','planned');  // AYSE 4.500 alacak, +5 gün
    L('LB','B','${DM3}','completed'); state.payments.push({id:'PB',memberId:'B',groupId:'',date:'${DM3}',packageMonth:'${DM3.slice(0,7)}',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'IBAN',note:''}); // BERNA ödedi
    const c=finAccount196('acc-cash'); c.openingDate='${PREV}-01'; c.openingBalance=4000; const b=finAccount196('acc-bank'); b.openingDate='${PREV}-01'; b.openingBalance=1500;
    state.finCounterparties.push({id:'CP1',kind:'counterparty',name:'KIRALAYAN',type:'landlord',active:true});
    state.finDues.push({id:'DU1',kind:'due',dtype:'manual',title:'Kira',amount:3000,dueDate:'${D2}',period:'${D2.slice(0,7)}',category:'Kira',counterpartyId:'CP1',accountId:'acc-bank',status:'open'});
    state.settings.finance.safetyMin=0;
    document.getElementById('member-month').innerHTML='<option value="${CUR}">${CUR}</option>'; document.getElementById('member-month').value='${CUR}'; document.getElementById('pay-month').value='${CUR}';`;
  // nakit: 4000 + 1500 + 4500 (BERNA IBAN) = 10.000

  console.log('[1] Projeksiyon: A (tahsilat+ödeme) ve B (yalnız ödeme) serileri, pencere, gecikmiş bugüne');
  { const w=boot(); await tick(1200); w.eval(FX);
    t('bugünkü nakit 10.000', w.eval('finCash196()')===10000, w.eval('finCash196()'));
    const pr=JSON.parse(J(w,'finProjection196(30)'));
    t('başlangıç 10.000, 31 nokta, aktif', pr.active && pr.start===10000 && pr.points.length===31);
    t('gün 2: kira −3.000 → A 7.000, B 7.000', pr.points[2].a===7000 && pr.points[2].b===7000, JSON.stringify(pr.points[2]));
    t('gün 5: AYSE +4.500 → A 11.500, B 7.000', pr.points[5].a===11500 && pr.points[5].b===7000, JSON.stringify(pr.points[5]));
    t('dönem sonu A 11.500, giriş 4.500 / çıkış 3.000', pr.end.a===11500 && pr.totIn===4500 && pr.totOut===3000);
    t('güvenlik payı 0 → uyarı yok (A hiç eksi olmuyor)', pr.warnA===null && pr.warnB===null);
    w.eval("state.settings.finance.safetyMin=8000");
    const pr2=JSON.parse(J(w,'finProjection196(30)'));
    t('güvenlik payı 8.000 → ilk ihlal gün 2 (7.000), kira kalemi gerekçe', pr2.warnA && pr2.warnA.i===2 && pr2.warnA.a===7000 && pr2.warnA.events.some(e=>/Kira/.test(e.title)), JSON.stringify(pr2.warnA));
    w.eval("state.finDues.push({id:'DU2',kind:'due',dtype:'manual',title:'Eski fatura',amount:9000,dueDate:'"+DM3+"',period:'"+DM3.slice(0,7)+"',category:'Diğer',status:'open'}); state.settings.finance.safetyMin=0;");
    const pr3=JSON.parse(J(w,'finProjection196(30)'));
    t('gecikmiş ödeme bugüne yazılır: gün 0 A 1.000; gün 2 A −2.000 → warnA gün 2; B gün 2 −2.000 → warnB', pr3.points[0].a===1000 && pr3.points[2].a===-2000 && pr3.warnA.i===2 && pr3.warnB.i===2 && pr3.overdueOut===9000, JSON.stringify([pr3.points[0].a,pr3.points[2].a,pr3.warnA&&pr3.warnA.i]));
    w.eval("state.finDues=state.finDues.filter(d=>d.id!=='DU2'); state.finDues.push({id:'DU3',kind:'due',dtype:'manual',title:'Uzak',amount:100,dueDate:'"+addD(TODAY,45)+"',period:'"+addD(TODAY,45).slice(0,7)+"',category:'Diğer',status:'open'});");
    const pr4=JSON.parse(J(w,'finProjection196(30)')), pr5=JSON.parse(J(w,'finProjection196(60)'));
    t('45 gün sonraki kalem 30 günlük pencerede YOK, 60 günlükte VAR', pr4.totOut===3000 && pr5.totOut===3100);
    // yenileme tahmini çizgiye girmez
    w.eval("['01','02','03','04','05','06','07'].forEach(d=>state.lessons.push({id:'LR'+d,groupId:'',instructorId:'G',date:'"+CUR+"-'+d,time:'11:00',durationMin:45,status:'completed',memberIds:['B'],packageMonth:'"+CUR+"',packageOwnerType:'member',packageOwnerId:'B',size:1}));");
    const pr6=JSON.parse(J(w,'finProjection196(90)'));
    t('BERNA 7/8 → yenileme tahmini listede (toplamda), seride DEĞİL', pr6.renewals.length===1 && pr6.totRen===4500 && pr6.end.a===pr6.start+4500-3000-100, JSON.stringify({ren:pr6.renewals.length,end:pr6.end.a}));
  }

  console.log('[2] Nakit Akışı ekranı: kutular, grafik, uyarı cümlesi, günlük akış; pasifken yönlendirme');
  { const w=boot(); await tick(1200); w.eval(FX); w.eval("state.settings.finance.safetyMin=8000; localStorage.removeItem('pilateria_fin_tab'); __finTab196='';");
    w.eval("switchPage('payments')"); await tick(200);
    t('finans etkin + ilk açılış → varsayılan sekme Nakit Akışı', w.document.getElementById('fin-panel-cash').classList.contains('active'));
    const body=w.document.getElementById('fin-cash-body'); const txt=body.textContent;
    t('kutular: Kasa 4.000 · Banka 6.000 · Σ 10.000 · bize borçlu 4.500 · biz borçluyuz 3.000', /Kasa[\s\S]*?4\.000/.test(txt) && /Banka[\s\S]*?6\.000/.test(txt) && /Σ Nakit[\s\S]*?10\.000/.test(txt) && /Bize borçlu[\s\S]*?4\.500/.test(txt) && /Biz borçluyuz[\s\S]*?3\.000/.test(txt), txt.slice(0,400));
    t('SVG grafik var (iki çizgi + güvenlik çizgisi)', body.querySelectorAll('svg.fin-chart path').length===2 && /güvenlik payı 8\.000/.test(body.querySelector('svg').textContent));
    t('uyarı cümlesi: tarih + 7.000 + güvenlik payı altı + Kira', new RegExp(w.eval("fmtDate('"+D2+"')")+'[\\s\\S]*?7\\.000[\\s\\S]*?güvenlik payının[\\s\\S]*?Kira').test(txt), txt.slice(txt.indexOf('⚠️'), txt.indexOf('⚠️')+160));
    t('günlük akış: Kira −3.000 (bakiye 7.000), AYSE +4.500 (11.500)', /Kira[\s\S]*?−3\.000[\s\S]*?7\.000/.test(txt) && /AYSE[\s\S]*?\+4\.500[\s\S]*?11\.500/.test(txt));
    w.eval("finSetCashWin196(90)");
    t('pencere 90 güne geçti', w.eval('__finCashWin196')===90 && /90 günlük projeksiyon/.test(w.document.getElementById('fin-cash-body').textContent));
    const w2=boot(); await tick(1200); w2.eval(FX); w2.eval("finAccount196('acc-cash').openingDate=''; finAccount196('acc-bank').openingDate=''; __finTab196='cash';");
    w2.eval("switchPage('payments')"); await tick(150);
    t('hesaplar açılmamışsa yönlendirme metni', /Hesaplar henüz açılmadı/.test(w2.document.getElementById('fin-cash-body').textContent));
  }

  console.log('[3] Raporlar: gelir–gider aylar yan yana, hesap ekstresi, cari ekstre, nakit akış tablosu, CSV');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval(`state.payments.push({id:'PA',memberId:'A',groupId:'',date:'${CUR}-03',packageMonth:'${CUR}',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'Nakit',note:''});
      state.expenses.push({id:'E1',date:'${CUR}-04',category:'Kira',amount:3000,note:'',accountId:'acc-bank'},{id:'E2',date:'${CUR}-06',category:'Temizlik',amount:200,note:'',accountId:'acc-cash'},{id:'E3',date:'${PREV}-10',category:'Kira',amount:3000,note:'',accountId:'acc-bank'});
      state.instructorPayouts.push({id:'PO',instructorId:'G',year:+'${CUR}'.slice(0,4),month:+'${CUR}'.slice(5,7),amount:1000,paidDate:'${CUR}-08',method:'Nakit',note:''});
      state.finMoves.push({id:'M1',kind:'move',op:'transfer',date:'${CUR}-09',amount:2000,fromAccountId:'acc-cash',toAccountId:'acc-bank',note:''});`);
    const rows=JSON.parse(J(w,"finPlRows196(['"+PREV+"','"+CUR+"'])"));
    const get=l=>rows.find(r=>r.label===l);
    const revCur = (DM3.slice(0,7)===CUR) ? 9000 : 4500; // BERNA'nın paket ayı bugüne göre
    t('gelir–gider: tahsilat (paket ayı), hoca −1.000, Kira −3.000/−3.000, Temizlik −200', get('Üye tahsilatları (paket ayı)').vals[1]===revCur && get('Hoca ödemeleri').vals[1]===-1000 && get('Gider · Kira').vals[0]===-3000 && get('Gider · Kira').vals[1]===-3000 && get('Gider · Temizlik').vals[1]===-200, JSON.stringify(rows));
    t('net = toplam', get('Net').vals[1]===revCur-1000-3000-200);
    const cd=get('Nakit değişimi (Kasa+Banka, gerçekleşen)').vals[1];
    const expectCd = (DM3.slice(0,7)===CUR ? 4500 : 0) + 4500 - 3000 - 200 - 1000; // BERNA (bu ay ise) + AYSE − giderler − hoca (virman hariç)
    t('gerçekleşen nakit değişimi (virman hariç)', cd===expectCd, cd+' vs '+expectCd);
    const st=JSON.parse(J(w,"finAccountStatement196('acc-bank',['"+CUR+"'])"));
    const openBank = 1500 - 3000 + (DM3.slice(0,7)===PREV ? 4500 : 0); // PREV ayı: açılış 1.500 − kira(E3) + BERNA (önceki ayda ise)
    t('Banka ekstresi: açılış = önceki ay kapanışı, yürüyen bakiye, kapanış = finBalance', st.opening===openBank && st.closing===w.eval("finBalance196('acc-bank')") && st.rows.every((r,i)=>i===0||r.date>=st.rows[i-1].date), JSON.stringify({o:st.opening,c:st.closing,n:st.rows.length}));
    t('ekstre satırında giriş/çıkış ayrı sütun ve bakiye', st.rows.some(r=>r.outA===3000 && r.type==='gider') && st.rows.some(r=>r.inA===2000 && r.type==='virman'));
    const cf=JSON.parse(J(w,"finCashflowRows196(['"+CUR+"'])"))[0];
    t('nakit akış tablosu: ay başı = önceki gün nakdi, ay sonu = finCash, türler (virman yok)', cf.open===w.eval("finCash196(addDaysISO('"+CUR+"-01',-1))") && cf.close===w.eval("finCash196(finMonthEnd196('"+CUR+"'))") && cf.by['out:gider']===3200 && cf.by['out:hoca']===1000 && !Object.keys(cf.by).some(k=>/virman/.test(k)), JSON.stringify(cf));
    const cp=JSON.parse(J(w,"finStatementRows196('cp','CP1')"));
    t('cari ekstre: Kira (açık) 3.000 → bakiye 3.000', cp.rows.length===1 && cp.balance===3000);
    w.eval("switchPage('payments'); finSwitchTab196('reports')"); await tick(150);
    const body=w.document.getElementById('fin-reports-body');
    t('rapor ekranı: gelir–gider tablosu, ay başlıkları, Net satırı', /Gelir–Gider/.test(body.textContent) && body.querySelectorAll('table.fin-rep-table th').length>=3 && /Net/.test(body.textContent) && new RegExp(CUR).test(body.textContent));
    w.eval("finRepSet196('kind','acc')"); await tick(50);
    t('hesap ekstresi görünümü: Banka seçili, kapanış', w.document.getElementById('fin-rep-acc').value==='acc-bank' && /kapanış/.test(w.document.getElementById('fin-reports-body').textContent));
    w.eval("finRepSet196('kind','cf')"); await tick(50);
    t('nakit akış tablosu görünümü: Ay başı / Ay sonu', /Ay başı nakit/.test(w.document.getElementById('fin-reports-body').textContent) && /Ay sonu nakit/.test(w.document.getElementById('fin-reports-body').textContent));
    w.eval("finRepSet196('kind','cp'); finRepSet196('cpId','CP1')"); await tick(50);
    t('cari ekstre görünümü: KIRALAYAN bakiye 3.000', /KIRALAYAN[\s\S]*?3\.000/.test(w.document.getElementById('fin-reports-body').textContent));
    w.eval("window.__dlCsv=function(n,rows){ window.__csv={n:n,rows:rows}; };");
    w.eval("finRepSet196('kind','pl'); finExportReportCsv196()");
    const csv=JSON.parse(J(w,'window.__csv'));
    t('CSV: gelir-gider dosyası, başlık + satırlar', /gelir-gider/.test(csv.n) && csv.rows.length>=4 && csv.rows[0][0]==='Kalem', JSON.stringify(csv.rows[0]));
  }

  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST COKTU',e);process.exit(2);}},50);
