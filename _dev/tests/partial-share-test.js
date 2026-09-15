// v171 — AYRILAN UYE PAYI (Kerem, 2026-09-15, onayli tasarim): odeme/ders hakki GRUBA baglanir.
// Uye ay ortasinda gruptan ayrilinca (tasima / grup penceresinden cikarma / aydan cikar) o grupta
// aldigi dersler + ucreti "pay" olarak GRUPTA kalir: grup detayi + Uyeler satiri + grubun beklenen
// geliri + odeme penceresi. Katilan uyeye kalan-derse-gore ucret onerisi. Tam tarama bulgulari
// (F1 grup kalani, F2 odeme listesi, F4 uye bakiyesi, F7 cift sayim, F8 senkron, F9 rowspan,
// F10 uye sayaci, F11 prorata kopyalanmaz) burada olculur. Yamasiz build'de FAIL etmeli.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let DLG_INPUT = (o) => (o.input && o.input.value !== undefined) ? String(o.input.value) : 'not'; // varsayilan: onerilen tutari KABUL
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ const m=String((o&&o.msg)||''); w.__msgs.push(m); return (o&&o.input) ? DLG_INPUT(o) : true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return true; }; w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
function seen(sub){ return w.__msgs.some(m=>m.indexOf(sub)!==-1); }
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderGroups','renderDashboard','renderArchive','refreshMemberDetailIfOpen','closeFillSlotModal'].forEach(fn=>window[fn]=function(){});");
  w.eval("window.__realRenderMembers = renderMembers; renderMembers = function(){};");
  const CM = w.eval('currentMonth()'); const NM = shiftM(CM,+1); const TODAY = w.eval('todayISO()');
  function fixture(){
    w.eval(`
      state.settings.reformers=12;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[
        {id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'B',name:'BURCU',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'C',name:'CEREN',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'D',name:'DENIZ',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{}}
      ];
      state.groups=[
        {id:'G1',name:'AYSE - BURCU',size:2,memberIds:['A','B'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'10:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:17000,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
        {id:'G2',name:'CEREN',size:2,memberIds:['C'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'11:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:17000,status:'active'}],monthlyMembers:{},monthlyNotes:{}}
      ];
      state.lessons=[];
      ['${CM}-01','${CM}-03'].forEach((dt,i)=>state.lessons.push({id:'Y'+i,groupId:'G1',memberIds:['A','B'],date:dt,time:'10:00',status:'completed',packageMonth:'${CM}',instructorId:'h1',size:2}));
      ['${CM}-17','${CM}-22','${CM}-24','${CM}-29','2026-10-01','2026-10-06'].forEach((dt,i)=>state.lessons.push({id:'P'+i,groupId:'G1',memberIds:['A','B'],date:dt,time:'10:00',status:'planned',packageMonth:'${CM}',instructorId:'h1',size:2}));
      state.payments=[];
      document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option><option value="${NM}">${NM}</option>';
      document.getElementById('member-month').value='${CM}';
      currentGroupDetailMonth='${CM}';
      __partialOfferQueue.length=0; __undoStack=[]; try{localStorage.removeItem('pilateria_undo');}catch(e){}
    `);
    w.__msgs.length=0;
  }

  console.log('[1] motor');
  t('partialShareFor / setPartialShare / memberPriceForGroupMonth var', ['partialShareFor','setPartialShare','removePartialShare','memberPriceForGroupMonth','__queuePartialOffer','__queueJoinOffer','editPartialShare','deletePartialShare'].every(f=>w.eval("typeof "+f)==='function'), w.eval("typeof partialShareFor"));
  if (w.eval("typeof partialShareFor")!=='function') { console.log('\nSONUC: '+pass+' gecti, '+(fail+40)+' kaldi'); process.exit(1); }

  console.log('[2] AYSE baska gruba tasindi → eski grupta 2 dersin PAYI (tek soru, onerilen tutar)');
  fixture();
  w.eval("assignMemberToSlot('A','G2',1)");
  await tick();
  t('soru soruldu: "2 ders aldı"', seen('grubunda 2 ders aldı'), w.__msgs.join(' || ').slice(0,300));
  t('oneri metni 8.500 × 2/8 = 2.125', seen('2/8'), w.__msgs.join(' || ').slice(0,300));
  const ps = w.eval(`JSON.stringify(partialShareFor('G1','A','${CM}'))`);
  t('pay kaydi: 2 ders · 2.125 ₺', ps!=='null' && JSON.parse(ps).sessions===2 && JSON.parse(ps).price===2125, ps);
  t('AYSE G2 kadrosunda, G1 kadrosunda DEGIL', w.eval(`(memberActiveGroupForMonth('A','${CM}')||{}).id`)==='G2' && !w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='G1'),'${CM}').includes('A')`));
  t('yapilmis 2 ders AYNEN duruyor (AYSE icinde)', w.eval("state.lessons.filter(l=>l.status==='completed'&&(l.memberIds||[]).includes('A')).length")===2);

  console.log('[3] bos slota DENIZ → kalan derse gore ucret onerisi (6/8) + grup toplami TAM');
  w.__msgs.length=0;
  w.eval("assignMemberToSlot('D','G1',0)");
  await tick();
  t('soru: "2 ders yapıldı, 6 ders kaldı"', seen('6 ders kaldı'), w.__msgs.join(' || ').slice(0,300));
  t('DENIZ bu ay fiyati 6.375 (orantili, __prorata)', w.eval(`((state.members.find(m=>m.id==='D').monthly||{})['${CM}']||{}).totalPrice`)===6375 && w.eval(`((state.members.find(m=>m.id==='D').monthly||{})['${CM}']||{}).__prorata`)===true, w.eval(`JSON.stringify((state.members.find(m=>m.id==='D').monthly||{})['${CM}'])`));
  t('G1 beklenen = 6.375 + 8.500 + 2.125 = 17.000 (pay dahil — F1)', w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G1'),'${CM}')`)===17000, w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G1'),'${CM}')`));

  console.log('[4] F1: ayrilanin odemesi grubun kalanini BASKASININ borcu gibi dusurmez');
  w.eval(`state.payments.push({id:'pa',memberId:'A',groupId:'G1',amount:2125,date:'${CM}-03',packageMonth:'${CM}',sessions:2,method:'Nakit'});`);
  t('G1 kalan = 17.000 − 2.125 = 14.875', w.eval(`groupBalanceForMonth('G1','${CM}')`)===14875, w.eval(`groupBalanceForMonth('G1','${CM}')`));

  console.log('[5] fiyat TEK KAYNAK (tik/kapak/bakiye) + uye bakiyesi paylari icerir (F4)');
  t('paymentCapCheck(A,G1) tanimli = 2.125; (A,G2) = 8.500', w.eval(`paymentCapCheck('A','G1','${CM}',0,'').defined`)===2125 && w.eval(`paymentCapCheck('A','G2','${CM}',0,'').defined`)===8500);
  t('AYSE bakiye: G2 8.500 (G1 payi odendi)', w.eval(`memberBalanceForMonth('A','${CM}')`)===8500, w.eval(`memberBalanceForMonth('A','${CM}')`));
  w.eval("state.payments = state.payments.filter(p=>p.id!=='pa');");
  t('AYSE bakiye: G2 8.500 + G1 payi 2.125 = 10.625', w.eval(`memberBalanceForMonth('A','${CM}')`)===10625, w.eval(`memberBalanceForMonth('A','${CM}')`));
  await w.togglePaidTick('A','G1',null,CM);
  const tk = w.eval("JSON.stringify(state.payments.filter(p=>p.memberId==='A'&&p.groupId==='G1').map(p=>p.amount))");
  t('tik: pay tutariyla (2.125) odeme yaratti — 8.500 DEGIL', tk==='[2125]', tk);

  console.log('[6] Uyeler satirlari: grubun altinda "ayrildi" satiri, rowspan (F9), uye sayaci (F10)');
  const rows = JSON.parse(w.eval(`JSON.stringify(buildMemberRows('${CM}').map(r=>({g:r.groupId,n:r.name,p:!!r.isPartial,f:r.isFirstInGroup,c:r.groupMemberCount,rs:r.groupRowSpan,fc:r.groupFilledCount,own:r.ownPrice,note:r.note})))`));
  const g1 = rows.filter(r=>r.g==='G1');
  t('G1 blogu: 2 kadro + 1 ayrilan satiri, rowspan 3', g1.length===3 && g1[0].rs===3, JSON.stringify(g1));
  t('"N/M dolu" paydasi slot sayisi kalir: 2/2 (pay satiri doluluga KARISMAZ)', g1[0].c===2 && g1[0].fc===2, JSON.stringify(g1[0]));
  w.eval("window.__realRenderMembers();");
  { const tb = d.getElementById('members-tbody').innerHTML; const m = tb.match(/rowspan="(\d+)"[^>]*onclick="event.stopPropagation\(\);openGroupDetail\('G1'\)"/); t('masaustu G1 grup hucresi rowspan=3, etiket "2 kişi" (dolu uyarisi yok)', !!m && m[1]==='3' && />\s*2 kişi\s*</.test(tb) && !/\/3 dolu/.test(tb), m ? m[1] : 'rowspan bulunamadi'); }
  t('ayrilan satiri AYSE · isPartial · 2.125 · not "ayrıldı · 2 ders"', g1.some(r=>r.p&&r.n==='AYSE'&&r.own===2125&&/ayrıldı · 2 ders/.test(r.note)), JSON.stringify(g1));
  t('AYSE ayrica G2 kadrosunda satirda', rows.some(r=>r.g==='G2'&&r.n==='AYSE'&&!r.p));
  t('uye sayaci 4 (A,B,C,D) — pay satiri sayilmaz', w.eval(`(function(){const s=new Set();buildMemberRows('${CM}').forEach(r=>{ if(r.memberId&&!r.isPartial) s.add(personIdOf(r.memberId)); });return s.size;})()`)===4);
  w.eval("window.__realRenderMembers();");
  t('masaustu tabloda "ayrıldı · 2 ders"', d.getElementById('members-tbody').innerHTML.indexOf('ayrıldı · 2 ders')!==-1);
  t('mobil kartta "ayrıldı · 2 ders"', (d.getElementById('members-cards')||{innerHTML:''}).innerHTML.indexOf('ayrıldı · 2 ders')!==-1);

  console.log('[7] grup detayi: "Bu ay ayrılanlar" bolumu + odeme penceresi listesi (F2)');
  w.openGroupDetail('G1', CM);
  const gd = d.getElementById('modal-group-detail').innerHTML;
  t('bolum var, AYSE listelendi, 2 ders · 2.125', gd.indexOf('Bu ay ayrılanlar')!==-1 && /AYSE<\/b> <span class="badge"[^>]*>ayrıldı/.test(gd) && gd.indexOf('2 ders')!==-1);
  w.closeModal('modal-group-detail');
  w.openPaymentModal(null, null, 'G1', CM);
  const opts = [...d.querySelectorAll('#mp-member option')].map(o=>o.value);
  t('G1 odeme penceresi: ayrilan AYSE + kadro (D,B) listede', opts.includes('A') && opts.includes('D') && opts.includes('B'), JSON.stringify(opts));
  w.closeModal('modal-payment');

  console.log('[8] F7: ayni ay gruba GERI donen uyenin payi duser (cift sayim yok)');
  w.eval(`applyRosterChange(state.groups.find(g=>g.id==='G1'),'${CM}', mids => mids.map(x => x==='D' ? 'A' : x));`);
  t('AYSE geri kadroda → pay silindi', w.eval(`partialShareFor('G1','A','${CM}')`)===null && w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='G1'),'${CM}').includes('A')`));

  console.log('[9] Vazgec → pay yok; gecersiz cevap → pay yok');
  fixture(); DLG_INPUT = () => null;
  w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  t('Vazgec: pay acilmadi', w.eval(`partialShareFor('G1','A','${CM}')`)===null);
  fixture(); DLG_INPUT = () => 'not';
  w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  t('gecersiz tutar: pay acilmadi', w.eval(`partialShareFor('G1','A','${CM}')`)===null);
  DLG_INPUT = (o) => (o.input && o.input.value !== undefined) ? String(o.input.value) : 'not';

  console.log('[10] diger ayrilma yollari: aydan cikar + grup penceresinden cikarma');
  fixture();
  w.removeMemberFromMonth('A', CM); await tick();
  t('aydan cikar → pay 2 ders · 2.125, AYSE pasif', w.eval(`(partialShareFor('G1','A','${CM}')||{}).price`)===2125 && w.eval(`isMemberEnrolledInMonth('A','${CM}')`)===false);
  fixture();
  w.eval(`window.__groupEditCtxMonth='${CM}'; window.__groupEditBaselineIds=['A','B']; openGroupModal('G1');`);
  [...d.querySelectorAll('#mg-members input.gm-mc')].forEach(x=>{ if (x.value==='A') x.checked=false; });
  d.getElementById('mg-size').value='2'; d.getElementById('mg-instructor').value='h1'; d.getElementById('mg-package').value='p8';
  w.saveGroup(); await tick();
  t('grup penceresinden cikarma → pay 2 ders · 2.125, AYSE aktif (bireysel)', w.eval(`(partialShareFor('G1','A','${CM}')||{}).price`)===2125 && w.eval(`isMemberEnrolledInMonth('A','${CM}')`)===true && w.eval(`memberActiveGroupForMonth('A','${CM}')`)===null);

  console.log('[11] F11: orantili ucret sonraki aya KOPYALANMAZ; elle fiyat kalici');
  fixture();
  w.eval("assignMemberToSlot('A','G2',1)"); await tick(); w.eval("assignMemberToSlot('D','G1',0)"); await tick();
  w.eval(`__prepContinueMemberCore('D','${CM}','${NM}');`);
  t('Yeni Ay Hazirligi: DENIZ ${NM} fiyati kopyalanmadi (tam ucret)', w.eval(`((state.members.find(m=>m.id==='D').monthly||{})['${NM}']||{}).totalPrice`)===undefined);
  w.eval(`setMemberMonthly('B','${CM}',{totalPrice:7000}); __prepContinueMemberCore('B','${CM}','${NM}');`);
  t('normal fiyat override hala kopyalanir (davranis degismedi)', w.eval(`((state.members.find(m=>m.id==='B').monthly||{})['${NM}']||{}).totalPrice`)===7000);

  console.log('[12] F8 senkron bolme: pay FIYATI group_finance tablosunda, ders sayisi temelde; birlesince geri gelir');
  fixture(); w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  const sp = JSON.parse(w.eval("JSON.stringify(sbSplitGroup(state.groups.find(g=>g.id==='G1')))"));
  t('base: price YOK, sessions VAR', sp.base.monthlyPartials[CM][0].price===undefined && sp.base.monthlyPartials[CM][0].sessions===2, JSON.stringify(sp.base.monthlyPartials));
  t('fin.partialPrices[ay][A] = 2125', sp.fin.partialPrices && sp.fin.partialPrices[CM] && sp.fin.partialPrices[CM]['A']===2125, JSON.stringify(sp.fin.partialPrices));
  const mg = JSON.parse(w.eval("JSON.stringify(sbMergeGroup(sbSplitGroup(state.groups.find(g=>g.id==='G1')).base, sbSplitGroup(state.groups.find(g=>g.id==='G1')).fin))"));
  t('merge: fiyat geri geldi', mg.monthlyPartials[CM][0].price===2125);
  t('gidis-donus kayipsiz (anahtar sirasindan bagimsiz JSON esit)', w.__undoStable(mg.monthlyPartials)===w.eval("__undoStable(state.groups.find(g=>g.id==='G1').monthlyPartials)"));

  console.log('[13] Geri Al + elle sil/duzenle');
  fixture(); w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  t('on kosul: pay var', w.eval(`partialShareFor('G1','A','${CM}')`)!==null);
  t('soruya "Evet" kendi Geri Al kaydini acar (Pay kaydi)', w.eval("(__undoStack[__undoStack.length-1]||{}).label||''").indexOf('Pay kaydı')===0, w.eval("(__undoStack[__undoStack.length-1]||{}).label||''"));
  w.undoLast();
  // v165 kapsami: slota atama/tasima geri alinmaz; yalniz PAY kaydi geri alinir (tasima durur)
  t('geri al → yalniz pay silindi, AYSE G2 kadrosunda kaldi', w.eval(`partialShareFor('G1','A','${CM}')`)===null && w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='G2'),'${CM}').includes('A')`) && !w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='G1'),'${CM}').includes('A')`));
  fixture(); w.eval("assignMemberToSlot('D','G1',0)"); await tick();
  t('orantili ucret kabulu de Geri Al kaydi acar', w.eval("(__undoStack[__undoStack.length-1]||{}).label||''").indexOf('Orantılı ücret')===0, w.eval("(__undoStack[__undoStack.length-1]||{}).label||''"));
  w.undoLast();
  t('geri al → DENIZ orantili fiyati kalkti, kadroda kaldi', w.eval(`((state.members.find(m=>m.id==='D').monthly||{})['${CM}']||{}).totalPrice`)===undefined && w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='G1'),'${CM}').includes('D')`));
  fixture(); w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  DLG_INPUT = (o) => /ÜCRET/.test(o.msg) ? '3000' : (o.input && o.input.value !== undefined ? String(o.input.value) : 'not');
  await w.editPartialShare('G1','A',CM);
  t('duzenle: ucret 3.000, ders 2', w.eval(`(partialShareFor('G1','A','${CM}')||{}).price`)===3000 && w.eval(`(partialShareFor('G1','A','${CM}')||{}).sessions`)===2);
  DLG_INPUT = (o) => (o.input && o.input.value !== undefined) ? String(o.input.value) : 'not';
  w.deletePartialShare('G1','A',CM);
  t('sil: pay yok, geri al etiketi', w.eval(`partialShareFor('G1','A','${CM}')`)===null && w.eval("(__undoStack[__undoStack.length-1]||{}).label||''").indexOf('Pay sil')===0);
  w.undoLast();
  t('geri al → pay geri geldi (3.000)', w.eval(`(partialShareFor('G1','A','${CM}')||{}).price`)===3000);

  console.log('[14] paket henuz baslamamis gruba katilan → oneri YOK; ders almamis ayrilan → pay YOK');
  fixture(); w.__msgs.length=0;
  w.eval("state.lessons.forEach(l=>{ if(l.status==='completed') l.status='planned'; });"); // hic ders yapilmadi
  w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  t('ders almadan ayrilan: soru yok, pay yok', !seen('ders aldı') && w.eval(`partialShareFor('G1','A','${CM}')`)===null);
  w.eval("assignMemberToSlot('D','G1',0)"); await tick();
  t('paket baslamamis: fiyat onerisi yok, DENIZ tam ucret', !seen('ders kaldı') && w.eval(`((state.members.find(m=>m.id==='D').monthly||{})['${CM}']||{}).totalPrice`)===undefined);

  console.log('[15] F12 hoca hakedis tabani: ayrilanin katildigi yapilmis dersler TAM sayilir; F15 katilanin haki');
  fixture(); w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  const __lsA = w.eval(`(function(){ const l = state.lessons.find(x=>x.id==='Y0'); return JSON.stringify({m:l.memberIds, pot:l.packageOwnerType, poi:l.packageOwnerId, pm:l.packageMonth}); })()`);
  t('on kosul: yapilmis ders Y0 hala AYSE+BURCU (tarihsel)', JSON.parse(__lsA).m.join(',')==='A,B', __lsA);
  const __baseY0 = w.eval("perLessonPriceForLesson(Object.assign({packageOwnerType:'group',packageOwnerId:'G1'}, state.lessons.find(x=>x.id==='Y0')))");
  t('Y0 taban = AYSE payi 2.125/2 + BURCU 8.500/8 = 2.125 (yarim DEGIL)', __baseY0===2125, __baseY0);
  w.eval("assignMemberToSlot('D','G1',0)"); await tick();
  t('F15: DENIZ ders hakki 6 (sessionsOverride), fiyat 6.375', w.eval(`sessionQuotaFor('member','D','${CM}')`)===6 && w.eval(`memberMonthlyTotalPrice('D','${CM}')`)===6375);
  t('F15: soru metni hakki soyluyor', seen('ders hakkı: 6'));
  const __p0 = w.eval("JSON.stringify((state.lessons.find(x=>x.id==='P0')||{}).memberIds)");
  t('planli ders P0 kadrosu DENIZ+BURCU', /"D"/.test(__p0) && /"B"/.test(__p0) && !/"A"/.test(__p0), __p0);
  const __baseP0 = w.eval("perLessonPriceForLesson(Object.assign({packageOwnerType:'group',packageOwnerId:'G1'}, state.lessons.find(x=>x.id==='P0')))");
  t('P0 taban = DENIZ 6.375/6 + BURCU 8.500/8 = 2.125', __baseP0===2125, __baseP0);
  w.eval(`__prepContinueMemberCore('D','${CM}','${NM}');`);
  t('F15: hak sonraki aya kopyalanmaz', w.eval(`memberSessionsOverride('D','${NM}')`)===null && w.eval(`sessionQuotaFor('member','D','${NM}')`)===8);
  // kadro disi SIZAN uye (payi yok) yine sayilmaz — v49 emniyeti korunur
  w.eval("state.lessons.find(x=>x.id==='Y1').memberIds=['B','C']");
  const __baseY1 = w.eval("perLessonPriceForLesson(Object.assign({packageOwnerType:'group',packageOwnerId:'G1'}, state.lessons.find(x=>x.id==='Y1')))");
  t('sizan uye (CEREN, payi yok) tabana girmez = 1.062,5', __baseY1===1062.5, __baseY1);

  console.log('[16] F13 odeme penceresi: ayrilan uyeye PAY tutari kilitli (8.500 degil), ders sayisi 2');
  fixture(); w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  w.openPaymentModal('A', null, 'G1', CM);
  t('mp-amount = 2.125 ve kilitli', d.getElementById('mp-amount').value==='2125' && d.getElementById('mp-amount').readOnly===true, d.getElementById('mp-amount').value);
  t('mp-sessions = 2', d.getElementById('mp-sessions').value==='2', d.getElementById('mp-sessions').value);
  t('bilgi metni "ayrılan üye"', /ayrılan üye/.test(d.getElementById('mp-discount-info').textContent), d.getElementById('mp-discount-info').textContent);
  t('memberGroupShare(A,G1)=2.125; (B,G1)=8.500', w.eval(`memberGroupShare('A','G1','${CM}')`)===2125 && w.eval(`memberGroupShare('B','G1','${CM}')`)===8500);
  w.savePayment();
  const __payA = JSON.parse(w.eval("JSON.stringify(state.payments.filter(p=>p.memberId==='A').map(p=>[p.groupId,p.amount,p.sessions,p.packageMonth]))"));
  t('kayit: G1 · 2.125 · 2 ders', __payA.length===1 && __payA[0][0]==='G1' && __payA[0][1]===2125 && __payA[0][2]===2 && __payA[0][3]===CM, JSON.stringify(__payA));
  t('odeme sonrasi: G1 kalan = (8.500 + 2.125) − 2.125 = 8.500 (bos slot henuz dolmadi), AYSE bakiye 8.500 (yalniz G2)', w.eval(`groupBalanceForMonth('G1','${CM}')`)===8500 && w.eval(`memberBalanceForMonth('A','${CM}')`)===8500, w.eval(`groupBalanceForMonth('G1','${CM}')`)+'/'+w.eval(`memberBalanceForMonth('A','${CM}')`));
  w.closeModal('modal-payment');
  w.openPaymentModal('B', null, 'G1', CM);
  t('kadro uyesi BURCU: 8.500 kilitli, ders 8 (davranis degismedi)', d.getElementById('mp-amount').value==='8500' && d.getElementById('mp-sessions').value==='8', d.getElementById('mp-amount').value+'/'+d.getElementById('mp-sessions').value);
  w.closeModal('modal-payment');

  console.log('[17] F14 pay odemesi uyeyi aya GERI SOKMAZ (aydan cikmis uye pay odedi → pasif kalir)');
  fixture(); w.eval(`removeMemberFromMonth('A','${CM}')`); await tick();
  t('on kosul: AYSE pasif, pay var', w.eval(`memberPassiveInMonth(state.members.find(m=>m.id==='A'),'${CM}')`)===true && w.eval(`partialShareFor('G1','A','${CM}')`)!==null);
  await w.togglePaidTick('A','G1',null,CM);
  const __tk = JSON.parse(w.eval("JSON.stringify(state.payments.map(p=>[p.memberId,p.groupId,p.amount,p.sessions,p.note]))"));
  t('tik: 2.125 · 2 ders · not "ayrılan üye payı"', __tk.length===1 && __tk[0][2]===2125 && __tk[0][3]===2 && /ayrılan üye payı/.test(__tk[0][4]), JSON.stringify(__tk));
  t('enrolled:true YAZILMADI, pasif kaldi', w.eval(`JSON.stringify((state.members.find(m=>m.id==='A').monthly||{})['${CM}'])`)==='{"enrolled":false}' && w.eval(`memberPassiveInMonth(state.members.find(m=>m.id==='A'),'${CM}')`)===true, w.eval(`JSON.stringify((state.members.find(m=>m.id==='A').monthly||{})['${CM}'])`));
  t('Uyeler listesinde AYSE bireysel satiri YOK, G1 altinda pay satiri VAR', (function(){ const rows=JSON.parse(w.eval(`JSON.stringify(buildMemberRows('${CM}').map(r=>[r.type,r.groupId||'',r.memberId||'',!!r.isPartial]))`)); return !rows.some(r=>r[2]==='A'&&!r[3]) && rows.some(r=>r[1]==='G1'&&r[2]==='A'&&r[3]); })());
  w.eval("state.payments=[]");
  w.openPaymentModal('A', null, 'G1', CM); w.savePayment();
  t('odeme penceresinden pay odemesi de aya geri sokmaz', w.eval(`JSON.stringify((state.members.find(m=>m.id==='A').monthly||{})['${CM}'])`)==='{"enrolled":false}' && w.eval("state.payments.length")===1 && w.eval("state.payments[0].sessions")===2);
  w.closeModal('modal-payment');
  // kadro uyesine normal odeme hala aya sokar (v23 davranisi degismedi)
  w.eval(`setMemberMonthly('B','${CM}',{enrolled:false}); state.members.find(m=>m.id==='B').archivePeriods=[];`);
  w.openPaymentModal('B', null, 'G1', CM); w.savePayment(); w.closeModal('modal-payment');
  t('kadro uyesi odemesi: enrolled:true (v23 degismedi)', w.eval(`!!((state.members.find(m=>m.id==='B').monthly||{})['${CM}']||{}).enrolled`)===true);

  console.log('[18] F16 PERSONEL: para sorulmaz — pay yalniz ders sayisiyla, katilana yalniz hak');
  fixture(); w.eval("__sbRole='staff'"); w.__msgs.length=0;
  w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  const __psS = JSON.parse(w.eval(`JSON.stringify(partialShareFor('G1','A','${CM}'))`));
  t('personel: pay 2 ders, FIYAT YOK (undefined)', !!__psS && __psS.sessions===2 && !('price' in __psS), JSON.stringify(__psS));
  t('personel: soruda ucret/tutar yok, "Ücretini yönetici girer" var', seen('Ücretini yönetici girer') && !seen('Ücret (₺)'));
  t('fiyatsiz pay: memberPriceForGroupMonth=0, grup beklenen = kadro (8.500)', w.eval(`memberPriceForGroupMonth('A','G1','${CM}')`)===0 && w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G1'),'${CM}')`)===8500);
  const __spS = JSON.parse(w.eval("JSON.stringify(sbSplitGroup(state.groups.find(g=>g.id==='G1')))"));
  t('senkron: fiyatsiz pay fiyatsiz kalir (partialPrices yok, 0 YAZILMAZ)', __spS.fin.partialPrices===undefined && __spS.base.monthlyPartials[CM][0].sessions===2, JSON.stringify(__spS.fin));
  w.eval(`openGroupDetail('G1','${CM}')`);
  t('grup detayi: "ücret gir" uyarisi', /ücret gir/.test(d.getElementById('modal-group-detail').innerHTML));
  w.eval("assignMemberToSlot('D','G1',0)"); await tick();
  t('personel katilma: yalniz hak 6, fiyat YOK', w.eval(`sessionQuotaFor('member','D','${CM}')`)===6 && w.eval(`((state.members.find(m=>m.id==='D').monthly||{})['${CM}']||{}).totalPrice`)===undefined && seen('Ücreti yönetici belirler'));
  w.eval("__sbRole='owner'");
  // yonetici sonra ucreti girer
  DLG_INPUT = (o) => /ÜCRET/.test(o.msg) ? '2125' : (o.input && o.input.value !== undefined ? String(o.input.value) : 'not');
  await w.editPartialShare('G1','A',CM);
  DLG_INPUT = (o) => (o.input && o.input.value !== undefined) ? String(o.input.value) : 'not';
  t('yonetici ucreti girdi: 2.125; grup beklenen = DENIZ tam 8.500 (personel fiyat vermedi) + 8.500 + 2.125 = 19.125', w.eval(`(partialShareFor('G1','A','${CM}')||{}).price`)===2125 && w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G1'),'${CM}')`)===19125, w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G1'),'${CM}')`));

  console.log('[19] F17 kalici uye silme: pay da silinir (hayalet pay yok)');
  fixture(); w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  t('on kosul: pay var, G1 beklenen 10.625', w.eval(`partialShareFor('G1','A','${CM}')`)!==null && w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G1'),'${CM}')`)===10625);
  w.eval("permanentDeleteMember('A')");
  t('silindi: pay yok, G1 beklenen 8.500, monthlyPartials temiz', w.eval(`partialShareFor('G1','A','${CM}')`)===null && w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G1'),'${CM}')`)===8500 && w.eval("JSON.stringify(state.groups.find(g=>g.id==='G1').monthlyPartials||null)")==='null', w.eval("JSON.stringify(state.groups.find(g=>g.id==='G1').monthlyPartials||null)"));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
