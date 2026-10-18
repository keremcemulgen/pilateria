// v197 — FİNANS BAŞLANGIÇ AYI (Kerem 18.10: "6. ayın ödemeleri yapıldı, işaretlenmediği için borç gözüküyor.
// Hesaplamaya Temmuz ayı itibarıyla başlasın uygulama.")
// settings.finance.startMonth (varsayılan '2026-07'; '' = sınır yok; 🏦 Hesaplar'dan düzenlenir). Bu aydan ÖNCEKİ aylar:
// üye borcu (getOverduePayments → Panel "Geciken Ödemeler", Finans cari/vade/nakit akışı/ekstre, WhatsApp borç), hoca hakediş
// vadesi, şablon vade üretimi ve Finans rapor sütunları hesaba GİRMEZ. Hesap bakiyeleri (açılış tarihi) etkilenmez.
// Yamasız (v196) yapıda bu test BAŞARISIZ olmalı (Haziran satırları borç olarak listelenir).
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
const OLD='2026-06'; // Haziran — başlangıç ayından (2026-07) ÖNCE
setTimeout(async function(){try{
  const w0=boot(); await tick(1200);
  const TODAY=w0.eval('todayISO()'), CUR=w0.eval('currentMonth()'), NEXT=w0.eval("finMonthAdd196(currentMonth(),1)");
  const R=w0.eval("addDaysISO(todayISO(),-1)"), RM=R.slice(0,7); // dün (vadesi geçmiş yakın ay)
  const FX=`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.settings.reformers=5; state.settings.instructorShareRate=30; state.packageTypes=[{id:'p1',name:'BIREYSEL',sessions:8,price:4500}];
    state.instructors=[{id:'I',name:'ICLAL HOCA',shareRate:30},{id:'D',name:'DERYA ORTAK',shareRate:30,partner:true}];
    const mk=(id,name)=>({id,name,joinDate:'2026-01-01',defaultPackageId:'p1',totalPrice:4500,packages:[],monthly:{'${OLD}':{enrolled:true},'${RM}':{enrolled:true},'${CUR}':{enrolled:true},'${NEXT}':{enrolled:true}}});
    state.members=[mk('H','HAZIRAN HANIM'),mk('E','EKIM EKIN'),mk('A','AYLA GRUP'),mk('B','BETUL GRUP')];
    state.groups=[{id:'G1',name:'HAZIRAN GRUBU',size:2,memberIds:['A','B'],monthlyMembers:{'${OLD}':['A','B']},packages:[],customTotalPrice:0}];
    state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.finCounterparties=[];
    state.lessons=[]; let n=0; const L=(mid,gid,ins,date,st)=>state.lessons.push({id:'L'+(n++),groupId:gid,instructorId:ins,date,time:'10:00',durationMin:45,status:st,memberIds:gid?['A','B']:[mid],packageMonth:date.slice(0,7),packageOwnerType:gid?'group':'member',packageOwnerId:gid||mid,size:gid?2:1});
    L('H','','I','${OLD}-03','completed'); L('H','','I','${OLD}-05','completed');   // HAZIRAN HANIM: Haziran'da 2 ders, ödeme yok (Kerem: ödendi ama işaretlenmedi)
    L('E','','I','${R}','completed');                                             // EKIM EKIN: dün ders, ödeme yok → GERÇEK borç 4.500
    L('','G1','I','${OLD}-10','completed'); L('','G1','I','${OLD}-12','completed'); // HAZIRAN GRUBU: Haziran'da 2 ders, 1.000 ödenmiş
    state.payments.push({id:'PG',memberId:'A',groupId:'G1',date:'${OLD}-10',packageMonth:'${OLD}',pkgName:'BIREYSEL',sessions:8,amount:1000,listPrice:4500,method:'Nakit',note:''});
    const c=finAccount196('acc-cash'); c.openingDate='${OLD}-01'; c.openingBalance=1000; const b=finAccount196('acc-bank'); b.openingDate='${OLD}-01'; b.openingBalance=50000;
    state.finCounterparties.push({id:'CP1',kind:'counterparty',name:'KIRALAYAN',type:'landlord',active:true});
    state.finTemplates.push({id:'T1',kind:'template',title:'Kira',amount:30000,dayOfMonth:5,category:'Kira',counterpartyId:'CP1',accountId:'acc-bank',resmi:false,kdvRate:0,startMonth:'2026-05',endMonth:'',active:true});
    document.getElementById('member-month').innerHTML='<option value="${CUR}">${CUR}</option>'; document.getElementById('member-month').value='${CUR}';`;
  const hasOld=(w,expr)=>w.eval("(function(){ const a="+expr+"; return a.some(function(x){ return String(x.ay||x.period||x.d||'').slice(0,7)==='"+OLD+"'; }); })()");

  console.log('[0] Ayar: varsayılan 2026-07, normalize');
  { const w=boot(); await tick(1200);
    t('açılışta state.settings.finance.startMonth = 2026-07', w.eval("state.settings.finance.startMonth")==='2026-07', w.eval("JSON.stringify(state.settings.finance)"));
    t('finStartMonth196() = 2026-07', w.eval("typeof finStartMonth196==='function' && finStartMonth196()")==='2026-07');
    t("'' (boş) = sınır yok, korunur", w.eval("(function(){ const o={settings:{finance:{startMonth:''}}}; __finNormalize196(o); return o.settings.finance.startMonth==='' ; })()"));
    t('geçersiz değer → varsayılana döner', w.eval("(function(){ const o={settings:{finance:{startMonth:'2026-13'}}}; __finNormalize196(o); return o.settings.finance.startMonth; })()")==='2026-07');
    t('tanımsız → varsayılan', w.eval("(function(){ const o={settings:{finance:{partners:[]}}}; __finNormalize196(o); return o.settings.finance.startMonth; })()")==='2026-07');
  }

  console.log('[1] Üye borcu: Haziran satırları hesaba girmez (Panel + Finans aynı kaynaktan)');
  { const w=boot(); await tick(1200); w.eval(FX);
    const ov=JSON.parse(J(w,"getOverduePayments().map(o=>({l:o.label,m:o.months,mi:o.missing}))"));
    t('getOverduePayments: HAZIRAN HANIM ve HAZIRAN GRUBU YOK, EKIM EKIN 4.500 VAR', ov.length===1 && ov[0].l==='EKIM EKIN' && ov[0].mi===4500, JSON.stringify(ov));
    t('includeFuture ile de Haziran yok', !hasOld(w,"getOverduePayments({includeFuture:true}).flatMap(o=>o.monthsDetail)"));
    const rc=JSON.parse(J(w,"finReceivables196().map(r=>({l:r.label,ay:r.ay,a:r.amount}))"));
    t('finReceivables196: yalnız EKIM EKIN '+RM, rc.length===1 && rc[0].l==='EKIM EKIN' && rc[0].ay===RM && rc[0].a===4500, JSON.stringify(rc));
    w.eval('renderDashboard()'); await tick(50);
    const ol=w.document.getElementById('overdue-list').textContent;
    t('Panel Geciken Ödemeler: Haziran isimleri yok, EKIM EKIN var', ol.indexOf('HAZIRAN')===-1 && ol.indexOf('EKIM EKIN')!==-1, ol.slice(0,200));
    w.eval("finSwitchTab196('cari')"); await tick(50);
    const cari=w.document.getElementById('fin-cari-body').textContent;
    t('Cari: HAZIRAN yok, EKIM EKIN var, başlangıç notu (Temmuz) var', cari.indexOf('HAZIRAN')===-1 && cari.indexOf('EKIM EKIN')!==-1 && /Temmuz/.test(cari), cari.slice(0,300));
    const pr=JSON.parse(J(w,"(function(){ const p=finProjection196(30); return {inn:p.totIn,ov:p.overdueIn}; })()"));
    t('Nakit akışı: gecikmiş tahsilat yalnız 4.500 (Haziran girmez)', pr.ov===4500 && pr.inn===4500, JSON.stringify(pr));
    t('Hesap bakiyesi ETKİLENMEZ: Kasa 1.000 + Haziran 1.000 Nakit = 2.000', w.eval("finBalance196('acc-cash')")===2000, w.eval("finBalance196('acc-cash')"));
  }

  console.log('[2] Hoca hakedişi, şablon vadeleri, ekstre, rapor sütunları başlangıç ayından başlar');
  { const w=boot(); await tick(1200); w.eval(FX);
    const ins=JSON.parse(J(w,"finInstructorDues196().map(d=>({ay:d.ay,a:d.amount}))"));
    t('hoca vadesi: Haziran yok, '+RM+' var', ins.length===1 && ins[0].ay===RM && ins[0].a>0, JSON.stringify(ins));
    const n=w.eval('finEnsureTemplateDues196()');
    t('şablon (Mayıs başlangıçlı): Haziran ve öncesine kalem ÜRETİLMEZ, 2026-07 … '+NEXT+' üretilir', n>0 && !hasOld(w,'state.finDues') && w.eval("state.finDues.every(d=>d.period>='2026-07')") && w.eval("state.finDues.some(d=>d.period==='2026-07')") && w.eval("state.finDues.some(d=>d.period==='"+NEXT+"')"), J(w,'state.finDues.map(d=>d.period)'));
    const stH=JSON.parse(J(w,"finStatementRows196('member','H')"));
    t('HAZIRAN HANIM ekstresi boş (Haziran satırı yok, bakiye 0)', stH.rows.length===0 && stH.balance===0, JSON.stringify(stH.rows));
    const stE=JSON.parse(J(w,"finStatementRows196('member','E')"));
    t('EKIM EKIN ekstresi: paket ücreti 4.500, bakiye 4.500', stE.rows.length===1 && stE.balance===4500, JSON.stringify(stE.rows));
    const stI=JSON.parse(J(w,"finStatementRows196('instructor','I')"));
    t('hoca ekstresi: Haziran hakedişi yok', stI.rows.length===1 && String(stI.rows[0].d).slice(0,7)===RM, JSON.stringify(stI.rows));
    const months=JSON.parse(J(w,'finMonthsBack196(12)'));
    t('rapor sütunları: 12 ay istense de 2026-07 öncesi yok, son sütun bu ay', months.length>0 && months.every(m=>m>='2026-07') && months[months.length-1]===CUR, JSON.stringify(months));
    w.eval("finSwitchTab196('reports')"); await tick(50);
    const rep=w.document.getElementById('fin-reports-body').textContent;
    t('Gelir–Gider raporu 2026-06 sütunu göstermez', rep.indexOf('2026-06')===-1 && rep.indexOf(CUR)!==-1, rep.slice(0,200));
  }

  console.log("[3] Ayar düzenleme: Hesaplar'da ay alanı; '' = sınır yok (Haziran geri gelir); geçersiz reddedilir");
  { const w=boot(); await tick(1200); w.eval(FX);
    w.eval("finSwitchTab196('accounts')"); await tick(50);
    const inp=w.document.getElementById('fin-start');
    t('#fin-start alanı var, değeri 2026-07', !!inp && inp.value==='2026-07', inp&&inp.value);
    inp.type='text'; inp.value='2026-13'; w.eval('saveFinSettings196()'); await tick(30); // type=month tarayıcıda geçersizi boşa çevirir; metin alanı (Firefox) yolu
    t('geçersiz ay reddedilir, ayar değişmez', w.eval("state.settings.finance.startMonth")==='2026-07' && w.__msgs.some(m=>/ay/i.test(m)), J(w,'window.__msgs'));
    w.document.getElementById('fin-start').value=''; w.eval('saveFinSettings196()'); await tick(30);
    t("'' kaydedilir → sınır yok", w.eval("state.settings.finance.startMonth")==='' && w.eval("finStartMonth196()")==='');
    const ov=JSON.parse(J(w,"getOverduePayments().map(o=>o.label).sort()"));
    t('sınır yokken Haziran borçları GERİ GELİR (3 satır)', ov.length===3 && ov.indexOf('HAZIRAN HANIM')!==-1 && ov.indexOf('HAZIRAN GRUBU')!==-1, JSON.stringify(ov));
    t('hoca vadesinde Haziran geri gelir', hasOld(w,'finInstructorDues196()'));
    w.document.getElementById('fin-start').value=CUR; w.eval('saveFinSettings196()'); await tick(30);
    t('başlangıç = bu ay → '+RM+' borcu da düşer (bu ay dışı), kayıt '+CUR, w.eval("state.settings.finance.startMonth")===CUR && (RM===CUR ? true : w.eval("getOverduePayments().length")===0));
    t('Geri Al yedeği alındı', w.eval("(__undoStack||[]).some(s=>/Finans ayarları/.test(s.label))"));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
