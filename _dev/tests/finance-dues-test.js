// v196 ADIM 2 — CARİ + VADELER + ŞABLONLAR
// Şablondan vade kalemleri (tembel, idempotent, deterministik id → iki cihaz aynı kalemi üretir), vadeli gider, ödeme tiki
// (hesap sorar → gider yazar → kalem kapanır; kısmi → kalan kalem), bağlı gider silinince kalem yeniden açılır, atlama,
// hoca hakediş vadeleri ("Ortak" hariç), kart son ödeme hatırlatıcısı, üye alacakları (ilk ders tarihi) + beklenen yenileme (tahmin),
// Cari ekranı (üç blok) + ekstreler + dış cari CRUD.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__msgs=[]; w.__ans=true;
  w.__PL_DLG_AUTO__=(o)=>{ const m=String((o&&o.msg)||''); w.__msgs.push(m); if(o&&o.input) return String(o.input.value); return w.__ans; };
  w.alert=(m)=>{ w.__msgs.push('ALERT:'+m); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
}}).window; }
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
const J=(w,e)=>w.eval('JSON.stringify('+e+')');
setTimeout(async function(){try{
  const w0=boot(); await tick(1200);
  const TODAY=w0.eval('todayISO()'), CUR=w0.eval('currentMonth()'), NEXT=w0.eval("finMonthAdd196(currentMonth(),1)"), PREV=w0.eval("finMonthAdd196(currentMonth(),-1)");
  const addD=(iso,k)=>w0.eval("addDaysISO('"+iso+"',"+k+")");
  const D3=addD(TODAY,3), DM5=addD(TODAY,-5), D40=addD(TODAY,40);
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.settings.reformers=5; state.settings.instructorShareRate=30; state.packageTypes=[{id:'p1',name:'BIREYSEL',sessions:8,price:4500}];
    state.instructors=[{id:'G',name:'GIZEM',shareRate:30},{id:'D',name:'DERYA',shareRate:30,partner:true}];
    const en={'${PREV}':{enrolled:true},'${CUR}':{enrolled:true},'${NEXT}':{enrolled:true}};
    const mk=(id,name)=>({id,name,joinDate:'2026-01-01',defaultPackageId:'p1',totalPrice:4500,packages:[],monthly:JSON.parse(JSON.stringify(en))});
    state.members=[mk('A','AYSE'),mk('B','BERNA'),mk('C','CEYDA'),mk('R','RANA')];
    state.groups=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.finCounterparties=[];
    state.lessons=[]; let n=0; const L=(mid,ins,date,st)=>state.lessons.push({id:'L'+(n++),groupId:'',instructorId:ins,date,time:'10:00',durationMin:45,status:st,memberIds:[mid],packageMonth:date.slice(0,7),packageOwnerType:'member',packageOwnerId:mid,size:1});
    L('A','G','${D3}','planned');            // AYSE: ilk ders 3 gün sonra → yaklaşan tahsilat 4.500
    L('B','G','${DM5}','completed');         // BERNA: ilk ders 5 gün önce, ödeme yok → gecikmiş 4.500
    L('C','D','${DM5}','completed');         // CEYDA: ödedi; hocası DERYA (ortak)
    state.payments.push({id:'PC',memberId:'C',groupId:'',date:'${DM5}',packageMonth:'${DM5.slice(0,7)}',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'IBAN',note:''});
    ['01','02','03','04','05','06','07'].forEach(d=>L('R','G','${CUR}-'+d,'completed')); L('R','G','${CUR}-28','planned'); // RANA: 7/8 → yenileme beklenir
    state.payments.push({id:'PR',memberId:'R',groupId:'',date:'${CUR}-01',packageMonth:'${CUR}',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'Nakit',note:''});
    const c=finAccount196('acc-cash'); c.openingDate='${PREV}-01'; c.openingBalance=1000; const b=finAccount196('acc-bank'); b.openingDate='${PREV}-01'; b.openingBalance=50000;
    state.finAccounts.push({id:'card1',kind:'account',type:'card',name:'Garanti (Kerem)',bank:'Garanti BBVA',owner:'Kerem',openingDate:'${PREV}-01',openingBalance:-2800,cutoffDay:15,dueDay:25,active:true});
    state.finCounterparties.push({id:'CP1',kind:'counterparty',name:'KIRALAYAN',type:'landlord',active:true});
    state.finTemplates.push({id:'T1',kind:'template',title:'Kira',amount:30000,dayOfMonth:5,category:'Kira',counterpartyId:'CP1',accountId:'acc-bank',resmi:false,kdvRate:0,startMonth:'${CUR}',endMonth:'',active:true});
    document.getElementById('member-month').innerHTML='<option value="${CUR}">${CUR}</option>'; document.getElementById('member-month').value='${CUR}'; document.getElementById('pay-month').value='${CUR}';`;

  console.log('[1] Şablon → vade kalemleri: tembel, idempotent, deterministik id (iki cihaz aynı kalemi üretir)');
  { const w=boot(); await tick(1200); w.eval(FX);
    const n1=w.eval('finEnsureTemplateDues196()');
    t('ilk üretim: 2 kalem (bu ay + gelecek ay)', n1===2 && w.eval('state.finDues.length')===2, n1+'/'+w.eval('state.finDues.length'));
    t('id deterministik: due-T1-'+CUR+' ve due-T1-'+NEXT, w.eval("state.finDues.some(d=>d.id==='due-T1-"+CUR+"') && state.finDues.some(d=>d.id==='due-T1-"+NEXT+"')"), J(w,'state.finDues.map(d=>d.id)'));
    t('vade = ayın 5\'i, tutar 30.000, cari KIRALAYAN, hesap Banka, açık', w.eval("state.finDues.find(d=>d.id==='due-T1-"+CUR+"').dueDate")===CUR+'-05' && w.eval("state.finDues[0].amount")===30000 && w.eval("state.finDues[0].counterpartyId")==='CP1' && w.eval("state.finDues[0].accountId")==='acc-bank' && w.eval("state.finDues[0].status")==='open');
    t('ikinci çağrı: 0 yeni (idempotent)', w.eval('finEnsureTemplateDues196()')===0 && w.eval('state.finDues.length')===2);
    const w2=boot(); await tick(1200); w2.eval(FX); w2.eval('finEnsureTemplateDues196()');
    t('başka cihaz aynı id\'leri üretir (çakışmasız upsert)', J(w2,'state.finDues.map(d=>d.id).sort()')===J(w,'state.finDues.map(d=>d.id).sort()'));
    t('şablon pasifse üretmez', (function(){ w.eval("state.finTemplates[0].active=false; state.finDues=[];"); return w.eval('finEnsureTemplateDues196()')===0; })());
    t('bitiş ayı: gelecek aya üretmez', (function(){ w.eval("state.finTemplates[0].active=true; state.finTemplates[0].endMonth='"+CUR+"'; state.finDues=[];"); return w.eval('finEnsureTemplateDues196()')===1; })());
  }

  console.log('[2] Vade ödeme tiki: hesap → gider (cari, vade bağı) → kalem kapanır; kısmi → kalan kalem; gider silinince kalem yeniden açılır; atlama');
  { const w=boot(); await tick(1200); w.eval(FX); w.eval('finEnsureTemplateDues196()');
    w.eval("finPayDueModal196('due-T1-"+CUR+"')"); await tick();
    t('ödeme penceresi: tutar 30.000, hesap Banka seçili', !!w.document.getElementById('modal-fin-pay') && w.document.getElementById('fp-amount').value==='30000' && w.document.getElementById('fp-acc').value==='acc-bank');
    w.document.getElementById('fp-date').value=CUR+'-05'; w.eval("finPayDue196('due-T1-"+CUR+"')"); await tick(100);
    const e=JSON.parse(J(w,"state.expenses[0]||null"));
    t('gider oluştu: Kira 30.000, Banka, cari, dueId, source due', e && e.category==='Kira' && e.amount===30000 && e.accountId==='acc-bank' && e.counterpartyId==='CP1' && e.dueId==='due-T1-'+CUR && e.source==='due', JSON.stringify(e));
    t('kalem kapandı (paid, paidRef → gider)', w.eval("state.finDues.find(d=>d.id==='due-T1-"+CUR+"').status")==='paid' && w.eval("state.finDues.find(d=>d.id==='due-T1-"+CUR+"').paidRef.id")===e.id);
    t('Banka 50.000 + 4.500 (CEYDA IBAN) − 30.000 = 24.500', w.eval("finBalance196('acc-bank')")===24500, w.eval("finBalance196('acc-bank')"));
    t('Geri Al yedeği', w.eval("(__undoStack||[]).some(s=>/Vade ödendi/.test(s.label))"));
    // kısmi: gelecek ayın kirasının 20.000'i
    w.eval("finPayDue196('due-T1-"+NEXT+"', {amount:20000, date:'"+TODAY+"', accountId:'acc-bank', note:'kismi'})"); await tick(50);
    t('kısmi ödeme: kalem paid (20.000), kalan 10.000 yeni açık kalem', w.eval("state.finDues.find(d=>d.id==='due-T1-"+NEXT+"').paidAmount")===20000 && w.eval("state.finDues.filter(d=>d.status==='open').length")===1 && w.eval("state.finDues.find(d=>d.status==='open').amount")===10000 && w.eval("state.finDues.find(d=>d.status==='open').id")==='due-T1-'+NEXT+'-k1', J(w,'state.finDues.map(d=>d.id+":"+d.status+":"+d.amount)'));
    t('Banka 4.500', w.eval("finBalance196('acc-bank')")===4500, w.eval("finBalance196('acc-bank')"));
    // bağlı gider silinince kalem yeniden açılır
    w.eval("removeExpense('"+e.id+"')"); await tick(50);
    t('gider silindi → kalem yeniden AÇIK, Banka 30.000', w.eval("state.finDues.find(d=>d.id==='due-T1-"+CUR+"').status")==='open' && !w.eval("state.finDues.find(d=>d.id==='due-T1-"+CUR+"').paidRef") && w.eval("finBalance196('acc-bank')")===34500, w.eval("finBalance196('acc-bank')"));
    await w.eval("finSkipDue196('due-T1-"+CUR+"')"); await tick(50);
    t('atla → skipped, listede değil', w.eval("state.finDues.find(d=>d.id==='due-T1-"+CUR+"').status")==='skipped' && !J(w,'finDueItems196().map(x=>x.id)').includes('due-T1-'+CUR));
    w.__msgs=[]; w.eval("finPayDue196('due-T1-"+NEXT+"-k1', {amount:10000, date:'"+addD(PREV+'-01',-1)+"', accountId:'card1'})");
    t('v199: karttan açılış ÖNCESİ tarihle ödeme KABUL (kayıt tutulur), kart borcu değişmez (−2.800)', w.eval("state.finDues.find(d=>d.id==='due-T1-"+NEXT+"-k1').status")==='paid' && w.eval("finBalance196('card1')")===-2800 && !w.__msgs.some(m=>/açılış tarihi yok/.test(m)), J(w,'window.__msgs')+' '+w.eval("finBalance196('card1')"));
    w.eval("state.finDues.push({id:'D-kart',kind:'due',dtype:'expense',title:'Malzeme',amount:10000,dueDate:'"+TODAY+"',period:'"+CUR+"',category:'Malzeme/Ekipman',counterpartyId:'',accountId:'card1',resmi:false,kdvRate:0,status:'open',note:''}); finPayDue196('D-kart', {amount:10000, date:'"+TODAY+"', accountId:'card1'})");
    t('karttan (açılış sonrası) ödenince kart borcu 2.800 → 12.800', w.eval("finBalance196('card1')")===-12800, w.eval("finBalance196('card1')"));
  }

  console.log('[3] Türetilmiş vadeler: hoca hakedişi (Ortak hariç), kart son ödeme, üye alacakları, yenileme tahmini');
  { const w=boot(); await tick(1200); w.eval(FX); w.eval('finEnsureTemplateDues196()');
    const hak=w.eval("instructorEarningsForMonth('G','"+CUR+"').total");
    const ins=JSON.parse(J(w,'finInstructorDues196()'));
    t('GIZEM hakedişi vade (ay sonu), DERYA (ortak) YOK', ins.length>=1 && ins.every(i=>i.instructorId==='G') && ins.some(i=>i.ay===CUR && Math.abs(i.amount-hak)<0.01 && i.dueDate===w.eval("finMonthEnd196('"+CUR+"')")), JSON.stringify(ins));
    w.eval("state.instructorPayouts.push({id:'PO',instructorId:'G',year:+'"+CUR+"'.slice(0,4),month:+'"+CUR+"'.slice(5,7),amount:"+(hak/2)+",paidDate:'"+TODAY+"',method:'IBAN',note:''})");
    const ins2=JSON.parse(J(w,'finInstructorDues196()')).find(i=>i.ay===CUR);
    t('yarısı ödenince kalan = hak/2', ins2 && Math.abs(ins2.amount-hak/2)<0.01, JSON.stringify(ins2));
    const cards=JSON.parse(J(w,'finCardReminders196()'));
    t('kart hatırlatıcı: borç 2.800, son ödeme günü 25', cards.length===1 && cards[0].amount===2800 && /-25$/.test(cards[0].dueDate) && cards[0].dueDate>=TODAY, JSON.stringify(cards));
    const rcv=JSON.parse(J(w,'finReceivables196()'));
    const a=rcv.find(r=>r.memberId==='A'), b=rcv.find(r=>r.memberId==='B');
    t('AYSE: yaklaşan 4.500 (ilk ders +3 gün), gecikmemiş', a && a.amount===4500 && a.dueDate===D3 && a.overdue===false, JSON.stringify(a));
    t('BERNA: gecikmiş 4.500 (ilk ders −5 gün)', b && b.amount===4500 && b.dueDate===DM5 && b.overdue===true, JSON.stringify(b));
    t('CEYDA (ödedi) ve RANA (ödedi) alacak listesinde YOK', !rcv.some(r=>r.memberId==='C'||r.memberId==='R'));
    const ren=JSON.parse(J(w,'finRenewals196()'));
    t('RANA 7/8 → gelecek ay yenileme tahmini 4.500, vade '+NEXT+'-01', ren.length===1 && ren[0].memberId==='R' && ren[0].amount===4500 && ren[0].estimate===true && ren[0].dueDate===NEXT+'-01', JSON.stringify(ren));
    w.eval("state.payments.push({id:'PRN',memberId:'R',groupId:'',date:'"+TODAY+"',packageMonth:'"+NEXT+"',pkgName:'BIREYSEL',sessions:8,amount:4500,listPrice:4500,method:'Nakit',note:''})");
    t('gelecek ay ödendiyse yenileme tahmini düşer', w.eval('finRenewals196().length')===0);
    const items=JSON.parse(J(w,'finDueItems196()'));
    t('vade listesi: kira ×2 + hoca + kart, tarih sıralı', items.length===4 && items.every((x,i)=>i===0||x.dueDate>=items[i-1].dueDate), JSON.stringify(items.map(x=>x.dtype+':'+x.dueDate)));
  }

  console.log('[4] Vadeler ekranı + gider formundan vadeli kalem + manuel kalem penceresi');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("switchPage('payments')"); await tick(100); w.eval("finSetDueWin196(90)"); w.eval("finSwitchTab196('dues')"); await tick(150);
    const body=w.document.getElementById('fin-dues-body');
    t('Vadeler paneli: iki sütun, kira kalemleri, hoca, kart, BERNA gecikti, AYSE yaklaşan, RANA tahmin', body.querySelectorAll('.fin-col').length===2 && /Kira/.test(body.textContent) && /GIZEM/.test(body.textContent) && /kart borcu/.test(body.textContent) && /BERNA/.test(body.textContent) && /AYSE/.test(body.textContent) && /RANA.*yenileme \(tahmin\)/.test(body.textContent));
    t('gecikmiş satır kırmızı sınıf', [...body.querySelectorAll('.fin-row.overdue')].some(r=>/BERNA/.test(r.textContent)));
    t('tahmin satırı soluk', [...body.querySelectorAll('.fin-row.est')].some(r=>/RANA/.test(r.textContent)));
    t('şablon listesi: Kira · ayın 5\'i', /Kira.*ayın 5/.test(body.textContent));
    // gider formu: vadeli
    w.document.getElementById('exp-date').value=TODAY; w.document.getElementById('exp-amount').value='1500'; w.document.getElementById('exp-note').value='Reformer bakım'; w.document.getElementById('exp-vadeli').checked=true; w.document.getElementById('exp-due').value=D40; w.document.getElementById('exp-cp').value='CP1';
    const n0=w.eval('state.expenses.length'); w.eval('addExpense()'); await tick(50);
    t('vadeli gider → gider DEĞİL, vade kalemi (1.500, vade +40 gün, cari)', w.eval('state.expenses.length')===n0 && w.eval("state.finDues.some(d=>d.dtype==='expense' && d.title==='Reformer bakım' && d.amount===1500 && d.dueDate==='"+D40+"' && d.counterpartyId==='CP1' && d.status==='open')"), J(w,"state.finDues.filter(d=>!d.templateId)"));
    t('vadeli kutusu sıfırlandı', w.document.getElementById('exp-vadeli').checked===false);
    w.eval("openFinDueModal196('')"); await tick();
    w.document.getElementById('fd-title').value='Muhasebeci Ekim'; w.document.getElementById('fd-amount').value='2500'; w.document.getElementById('fd-due').value=D3; w.document.getElementById('fd-acc').value='acc-cash';
    w.eval("saveFinDue196('')"); await tick(50);
    t('manuel kalem kaydedildi (dtype manual, hesap Kasa)', w.eval("state.finDues.some(d=>d.dtype==='manual' && d.title==='Muhasebeci Ekim' && d.amount===2500 && d.accountId==='acc-cash')"));
    const mid=w.eval("state.finDues.find(d=>d.title==='Muhasebeci Ekim').id");
    await w.eval("removeFinDue196('"+mid+"')"); await tick(50);
    t('manuel kalem silindi', !w.eval("state.finDues.some(d=>d.title==='Muhasebeci Ekim')"));
    w.eval("finPayItem196('ins:G:"+CUR+"')"); await tick();
    t('hoca kalemi "Öde" → Hocalar maaş penceresi', !!w.document.getElementById('modal-inst-pay'));
    w.document.getElementById('modal-inst-pay').remove();
    const cid=w.eval("finDueItems196().find(x=>x.dtype==='card').id"); w.eval("finPayItem196('"+cid+"')"); await tick();
    t('kart kalemi "Öde" → kart borcu ödemesi penceresi (kart + tutar hazır)', !!w.document.getElementById('modal-fin-move') && w.document.getElementById('fm-op').value==='cardpay' && w.document.getElementById('fm-to').value==='card1' && w.document.getElementById('fm-amount').value==='2800');
  }

  console.log('[5] Cari ekranı: üç blok, ekstreler, dış cari CRUD, hoca "Ortak" bayrağı');
  { const w=boot(); await tick(1200); w.eval(FX); w.eval('finEnsureTemplateDues196()');
    w.eval("switchPage('payments')"); await tick(100); w.eval("finSwitchTab196('cari')"); await tick(150);
    const body=w.document.getElementById('fin-cari-body'); const txt=body.textContent;
    t('bize borçlu: AYSE + BERNA = 9.000', /Bize borçlu \(üyeler\): 9\.000/.test(txt), txt.slice(0,200));
    const hak=w.eval("instructorEarningsForMonth('G','"+CUR+"').total");
    t('biz borçluyuz: hoca + dış cari (kira 60.000) + kart (2.800)', new RegExp('Biz borçluyuz: '+w.eval("money("+hak+"+60000+2800)").replace(/\./g,'\\.')).test(txt), txt.slice(0,300));
    t('üye satırında Ekstre + Ödeme; BERNA gecikmiş', /BERNA/.test(txt) && [...body.querySelectorAll('.fin-row.overdue')].some(r=>/BERNA/.test(r.textContent)) && /Ekstre/.test(txt));
    t('DERYA (ortak) hoca listesinde YOK, GIZEM var', !/DERYA/.test(txt) && /GIZEM/.test(txt));
    t('dış cari KIRALAYAN: açık 60.000', /KIRALAYAN[\s\S]*?60\.000 ₺/.test(txt));
    w.eval("openFinStatement196('member','B')"); await tick();
    const stm=w.document.getElementById('modal-fin-stm');
    t('üye ekstresi: paket ücreti satırı 4.500, bakiye 4.500', !!stm && /paket ücreti/.test(stm.textContent) && /4\.500/.test(stm.textContent)); stm.remove();
    w.eval("openFinStatement196('instructor','G')"); await tick();
    const stm2=w.document.getElementById('modal-fin-stm'); t('hoca ekstresi: hakediş satırı', !!stm2 && /hakedişi/.test(stm2.textContent)); stm2.remove();
    w.eval("openFinStatement196('cp','CP1')"); await tick();
    const stm3=w.document.getElementById('modal-fin-stm'); t('cari ekstresi: Kira (açık) ×2', !!stm3 && (stm3.textContent.match(/Kira \(açık\)/g)||[]).length===2); stm3.remove();
    // CRUD
    w.eval("openFinCpModal196('')"); await tick(); w.document.getElementById('fc-name').value='MUHASEBECİ'; w.document.getElementById('fc-type').value='accountant'; w.eval("saveFinCp196('')"); await tick(50);
    t('yeni dış cari eklendi', w.eval("state.finCounterparties.some(c=>c.name==='MUHASEBECİ' && c.type==='accountant' && c.kind==='counterparty')"));
    w.__msgs=[]; await w.eval("removeFinCp196('CP1')");
    t('bağlı kaydı olan cari silinemez (uyarı)', w.eval("state.finCounterparties.some(c=>c.id==='CP1')") && w.__msgs.some(m=>/silinemez/.test(m)));
    const mid=w.eval("state.finCounterparties.find(c=>c.name==='MUHASEBECİ').id"); await w.eval("removeFinCp196('"+mid+"')"); await tick(50);
    t('bağsız cari silinir', !w.eval("state.finCounterparties.some(c=>c.name==='MUHASEBECİ')"));
    // hoca ortak bayrağı (modal)
    w.eval("openInstructorModal('G')"); await tick(); w.document.getElementById('mi-partner').checked=true; w.eval('saveInstructor()'); await tick(50);
    t('hoca penceresinde "Ortak" işaretlenince hakedişi vadeye düşmez', w.eval("state.instructors.find(i=>i.id==='G').partner===true") && w.eval('finInstructorDues196().length')===0);
    w.eval("openInstructorModal('D')"); await tick();
    t('DERYA kaydı açılınca kutu işaretli', w.document.getElementById('mi-partner').checked===true);
  }

  console.log('[6] Hareketlerde hoca maaşı gider kaydı (Hocalar sayfasından yazılan) çift sayılmaz');
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("state.expenses.push({id:'EM',date:'"+CUR+"-28',category:'Hoca Maaşı',amount:5000,note:'GIZEM maaşı [MAAS-OTO-"+CUR+"]',accountId:'acc-bank'})");
    t('Hoca Maaşı gideri harekete GİRMEZ (ödeme instructorPayouts ile)', !J(w,'finMovements196().map(m=>m.id)').includes('exp:EM') && w.eval("finBalance196('acc-bank')")===54500, w.eval("finBalance196('acc-bank')"));
  }

  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST COKTU',e);process.exit(2);}},50);
