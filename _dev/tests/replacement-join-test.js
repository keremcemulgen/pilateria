// v186 — (Kerem 2026-10-04) "Nese gruptan ayrildi isaretledikten sonra yeni uye ekle deyip Kubis'i eklemeye
// calistigimda izin vermiyor" + "6 ders girmeme ragmen 8 ders yaziyor / 8 ders disinda ders girilemiyor".
// KOK 1: grubun Eylul paketi Ekim'e SARKIYOR (27.09 baslamis, kalan 7 ders Ekim tarihli ama paket ayi Eylul). Ekim'de
// yapilan degisiklik ASIMETRIKTI: cikan uye Eylul paketinden cikiyor, yeni uye yalniz "Ekim" kadrosuna giriyordu —
// Ekim derslerinin hepsi Eylul paketinin dersleri oldugu icin yeni uye hicbir derse giremiyor, ders penceresinde bile
// listelenmiyordu. v186: yeni uye DEVAM EDEN pakete (sarkan paket) gidenin yerine girer — kalan derslere yazilir,
// ucret/hak kalan derse gore (v171 sorusu); "bu aydan cikar / pasife al" ile ayrilan uye de devam eden paketten
// ayrilir (aldigi ders payi kalir). Gruptan cikarilip baska yere gitmeyen uye icin "Pasif mi / Bireysel mi" sorulur.
// KOK 2: odeme penceresindeki "Ders Sayisi" hicbir seyi degistirmiyordu (12 ders × 562,50 girilince "tanimli fiyat
// asilamaz"); uyenin kendi hakki varken "Kalan Ders" grubun 8'inden gosteriliyordu; ozel hakla girilen ucret sonraki aya
// kopyalaniyordu; ay icinde secilen paket tipi (12 ders) onceden acilmis 8'lik paket kaydi yuzunden etkisizdi.
// v187 (Kerem: "ben secmek isterim"): kendi hakki olan uye derslere OTOMATIK yazilmaz — Kerem ders penceresinden secer.
// Yamasiz (v185) build'de FAIL eder.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let DLG = null;
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.__msgs=[];
    w.__PL_DLG_AUTO__=(o)=>{ const m=String((o&&o.msg)||''); w.__msgs.push(m); if (DLG) { const r = DLG(o); if (r !== undefined) return r; } return (o&&o.input)?String(o.input.value):true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return true; }; w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 80));
const J = (e) => JSON.parse(w.eval('JSON.stringify(' + e + ')') || 'null');
const eq = (a,b) => Math.abs((+a||0)-(+b||0)) < 0.01;
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const sh = (k) => { const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-1+k,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); };
  const S = CM, T = sh(1), T2 = sh(2);  // S = "Eylul" (paket ayi), T = "Ekim" (baglam), T2 = sonraki ay
  function fixture(spill){
    w.eval(`
      state.settings.reformers=12; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500},{id:'p12',name:'12 Ders',sessions:12,price:6750}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      const mk=(id,name,mo,o)=>Object.assign({id:id,name:name,phone:'',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,instructorId:'h1',packages:[],monthly:mo},o||{});
      state.members=[mk('S1','SILA',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),mk('I1','IKRA',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),
        mk('N1','NESE',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),mk('Y1','YASEMIN',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),
        mk('K1','KUBRA',{'2026-06':{note:'eski'},'2026-07':{enrolled:false}}),
        mk('B1','BIREY',{'${T}':{enrolled:true}})];
      state.groups=[{id:'G',name:'SILA - IKRA - NESE - YASEMIN',size:4,memberIds:['S1','I1','N1','Y1'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'10:00',
          packages:[{month:'${S}',startDate:'${S}-27',sessions:8,price:18000,status:'active'}],monthlyMembers:{'2026-08':[]},monthlyNotes:{}},
        {id:'GK',name:'KUBRA',size:1,memberIds:['K1'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[{month:'2026-06',startDate:'2026-06-10',sessions:8,price:3600,status:'completed'}],monthlyMembers:{},monthlyNotes:{}}];
      state.lessons=[{id:'s0',groupId:'G',memberIds:['S1','I1','N1','Y1'],date:'${S}-27',time:'10:00',status:'completed',packageMonth:'${S}',packageOwnerType:'group',packageOwnerId:'G',instructorId:'h1',size:4}];
      ${spill ? `['02','06','09','13','16','20','23'].forEach((dd,i)=>state.lessons.push({id:'o'+i,groupId:'G',memberIds:['S1','I1','N1','Y1'],date:'${T}-'+dd,time:'10:00',status:'planned',packageMonth:'${S}',packageOwnerType:'group',packageOwnerId:'G',instructorId:'h1',size:4}));`
              : `['02','06','09','13','16','20','23','27'].forEach((dd,i)=>state.lessons.push({id:'o'+i,groupId:'G',memberIds:['S1','I1','N1','Y1'],date:'${T}-'+dd,time:'10:00',status:'planned',packageMonth:'${T}',packageOwnerType:'group',packageOwnerId:'G',instructorId:'h1',size:4})); state.groups[0].packages.push({month:'${T}',startDate:'${T}-02',sessions:8,price:18000,status:'active'}); state.lessons[0].date='${S}-03';`}
      state.payments=[];
      document.getElementById('member-month').innerHTML='<option value="${T}">${T}</option><option value="${S}">${S}</option>'; document.getElementById('member-month').value='${T}';
      __undoStack=[]; while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }
    `);
    w.__msgs.length=0; DLG = null;
  }
  const rosterS = () => J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='G'),'${S}')`);
  const rosterT = () => J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='G'),'${T}')`);
  const inLessons = (mid) => J(`state.lessons.filter(l=>l.groupId==='G'&&l.status==='planned').map(l=>(l.memberIds||[]).includes('${mid}'))`);

  console.log('[1] SARKAN PAKET — Duzenle penceresi: NESE cikar, KUBRA (eski pasif) eklenir');
  fixture(true);
  DLG = (o) => /ne olsun/.test(String(o.msg||'')) ? 'passive' : undefined;
  w.eval(`openGroupDetail('G','${T}')`); await tick(); w.eval(`openGroupModal('G')`); await tick();
  d.querySelector('#mg-members input.gm-mc[value="N1"]').checked = false;
  d.querySelector('#mg-members input.gm-mc[value="K1"]').checked = true;
  w.eval('saveGroup()'); await tick(300);
  t('KUBRA devam eden (Eylul) paketin kadrosunda, NESE\'nin yerinde', JSON.stringify(rosterS())===JSON.stringify(['S1','I1','K1','Y1']), JSON.stringify(rosterS()));
  t('KUBRA Ekim kadrosunda da', rosterT().includes('K1') && !rosterT().includes('N1'), JSON.stringify(rosterT()));
  t('v188: KUBRA hakki 7 = kalan 7 ders (secilecek bir sey yok) → HEPSINE otomatik; NESE hicbirinde', inLessons('K1').every(Boolean) && inLessons('N1').every(x=>!x), JSON.stringify(inLessons('K1')));
  t('yapilmis Eylul dersi aynen (NESE orada, KUBRA yok)', J("state.lessons.find(l=>l.id==='s0').memberIds").join()==='S1,I1,N1,Y1');
  t('KUBRA Eylul paketi: hak 7 (kalan), ucret kalan derse gore', w.eval(`memberEffectiveQuota('K1','${S}','G')`)===7 && eq(w.eval(`memberPriceForGroupMonth('K1','G','${S}')`), 3937.5), w.eval(`memberEffectiveQuota('K1','${S}','G')`) + ' / ' + w.eval(`memberPriceForGroupMonth('K1','G','${S}')`));
  t('NESE Eylul payi 1 ders = 562,50', eq(J(`partialShareFor('G','N1','${S}')`).price, 562.5) && J(`partialShareFor('G','N1','${S}')`).sessions===1, JSON.stringify(J(`partialShareFor('G','N1','${S}')`)));
  t('Eylul grup toplami 18.000 (3×4500 + 562,50 + 3.937,50)', eq(w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G'),'${S}')`), 18000), w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G'),'${S}')`));
  t('NESE sorusu soruldu ("Ekim\'de ne olsun") → Pasif secildi: NESE Ekim\'de kayitli degil, Ekim borcu yok', w.__msgs.some(m=>/NESE/.test(m) && /ne olsun/.test(m)) && w.eval(`isMemberEnrolledInMonth('N1','${T}')`)===false && w.eval(`memberBalanceForMonth('N1','${T}')`)===0, JSON.stringify(w.__msgs.filter(m=>/ne olsun/.test(m))));
  t('NESE Eylul\'de duruyor (ayrilan pay satiri)', w.eval(`isMemberEnrolledInMonth('N1','${S}')`)===true);
  w.eval("while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }");
  // v187 hala gecerli: hak kalan derslerden AZSA (5 < 7) otomatik yazilmaz, Kerem secer
  w.eval(`state.lessons.forEach(l=>{ if(l.groupId==='G'&&l.status==='planned') l.memberIds=l.memberIds.filter(x=>x!=='K1'); }); setMemberMonthly('K1','${S}',{sessionsOverride:5}); syncGroupLessonsToRoster('G','${S}');`);
  t('v187: hak 5 < kalan 7 → KUBRA otomatik YAZILMADI (Kerem secer)', inLessons('K1').every(x=>!x), JSON.stringify(inLessons('K1')));
  w.eval(`openLessonModal('o1')`); await tick();
  t('ders penceresinde KUBRA listede (isaretsiz — secim Kerem\'de)', !!d.querySelector('#modal-lesson input[type=checkbox][value="K1"]') && !d.querySelector('#modal-lesson input[type=checkbox][value="K1"]:checked'), JSON.stringify([...d.querySelectorAll('#modal-lesson input[type=checkbox]')].map(x=>x.value+':'+x.checked)));
  { const cb = d.querySelector('#modal-lesson input[type=checkbox][value="K1"]'); if (cb) { cb.checked = true; cb.dispatchEvent(new w.Event('change',{bubbles:true})); } }
  w.eval('saveLesson()'); await tick(150);
  w.eval(`syncGroupLessonsToRoster('G','${S}')`);
  t('KUBRA o1 dersine secildi ve senkronda KALDI; diger derslere eklenmedi', J("state.lessons.find(l=>l.id==='o1').memberIds").includes('K1') && J("state.lessons.filter(l=>l.groupId==='G'&&l.status==='planned'&&l.id!=='o1').every(l=>!l.memberIds.includes('K1'))"), JSON.stringify(J("state.lessons.filter(l=>l.groupId==='G').map(l=>l.id+':'+l.memberIds.join(''))")));
  w.eval("closeModal('modal-lesson')");

  console.log('[2] SARKAN PAKET — "Pasife Al / bu aydan cikar" (v179: devam eden paket ve odemesi oldugu gibi) + bos slotu doldur');
  fixture(true);
  w.eval(`removeMemberFromMonth('N1','${T}')`); await tick(200);
  t('v179 kanonu: NESE Eylul kadrosunda kaldi (pay yok), sarkan derslerden dustu', rosterS().includes('N1') && !J(`partialShareFor('G','N1','${S}')`) && inLessons('N1').every(x=>!x), JSON.stringify(rosterS()));
  const slot = w.eval(`(buildMemberRows('${T}').find(r=>r.groupId==='G' && !r.memberId)||{}).slotIndex`);
  t('Ekim\'de bos slot var', slot !== undefined && slot !== null, slot);
  w.eval(`fillEmptySlot('G', ${slot})`); await tick();
  const kbtn = [...d.querySelectorAll('#modal-fill-slot button')].find(b=>/KUBRA/.test(b.textContent));
  t('slot listesinde KUBRA var', !!kbtn);
  if (kbtn) { kbtn.click(); await tick(250); }
  t('KUBRA devam eden Eylul paketine de girdi', rosterS().includes('K1') && rosterT().includes('K1') && !rosterT().includes('N1'), JSON.stringify(rosterS()) + ' / ' + JSON.stringify(rosterT()));
  t('v188: KUBRA (hak 7 = kalan 7) sarkan derslerin HEPSINDE; NESE yok (4 kisi)', inLessons('K1').every(Boolean) && inLessons('N1').every(x=>!x) && J("state.lessons.filter(l=>l.groupId==='G'&&l.status==='planned').every(l=>l.memberIds.length===4)"), JSON.stringify(inLessons('K1')));
  t('KUBRA Eylul ucreti kalan derse gore (7 ders, 3.937,50)', w.eval(`memberEffectiveQuota('K1','${S}','G')`)===7 && eq(w.eval(`memberPriceForGroupMonth('K1','G','${S}')`), 3937.5));

  console.log('[3] SARKMA YOKSA davranis ayni: ekleme yalniz baglam ayindan, onceki paket kadrosu sabit');
  fixture(false);
  DLG = (o) => /ne olsun/.test(String(o.msg||'')) ? 'passive' : undefined;
  w.eval(`openGroupDetail('G','${T}')`); await tick(); w.eval(`openGroupModal('G')`); await tick();
  d.querySelector('#mg-members input.gm-mc[value="N1"]').checked = false;
  d.querySelector('#mg-members input.gm-mc[value="K1"]').checked = true;
  w.eval('saveGroup()'); await tick(300);
  t('Eylul kadrosu degismedi (NESE orada, KUBRA yok)', JSON.stringify(rosterS())===JSON.stringify(['S1','I1','N1','Y1']), JSON.stringify(rosterS()));
  t('Ekim kadrosu S1,I1,K1,Y1 ve Ekim dersleri KUBRA\'li', JSON.stringify(rosterT())===JSON.stringify(['S1','I1','K1','Y1']) && inLessons('K1').every(Boolean), JSON.stringify(rosterT()));

  console.log('[4] NESE sorusu — varsayilan/Vazgec: uye Bireysel kalir (eski davranis)');
  fixture(true);
  w.eval(`openGroupDetail('G','${T}')`); await tick(); w.eval(`openGroupModal('G')`); await tick();
  d.querySelector('#mg-members input.gm-mc[value="N1"]').checked = false;
  w.eval('saveGroup()'); await tick(300);
  t('soru soruldu, cevap verilmedi → NESE Ekim\'de kayitli kaldi', w.__msgs.some(m=>/ne olsun/.test(m)) && w.eval(`isMemberEnrolledInMonth('N1','${T}')`)===true);

  console.log('[5] ODEME PENCERESI "Ders Sayisi": bireysel 12 ders → tutar 12 × 562,50, hak 12, odeme kaydedilir');
  fixture(true);
  w.eval(`openPaymentModal('B1', null, '', '${T}')`); await tick();
  t('pencere: ders 8, tutar 4500', d.getElementById('mp-sessions').value==='8' && +d.getElementById('mp-amount').value===4500, d.getElementById('mp-sessions').value + '/' + d.getElementById('mp-amount').value);
  w.eval("document.getElementById('mp-sessions').value='12'; onPaySessionsChange186();"); await tick();
  t('ders 12 yazilinca tutar ve liste 6750 (1 ders 562,50 sabit)', +d.getElementById('mp-amount').value===6750 && +d.getElementById('mp-list').value===6750, d.getElementById('mp-amount').value);
  w.eval("savePayment()"); await tick(150);
  t('odeme kaydedildi (6750, 12 ders) — "fiyat asilamaz" engeli yok', J(`state.payments.filter(p=>p.memberId==='B1').map(p=>p.amount+'/'+p.sessions)`).join()==='6750/12', JSON.stringify(J(`state.payments.filter(p=>p.memberId==='B1').map(p=>p.amount+'/'+p.sessions)`)) + ' ' + JSON.stringify(w.__msgs.slice(-2)));
  t('BIREY ' + T + ': hak 12, ucret 6750, 1 ders 562,50, bakiye 0', w.eval(`sessionQuotaFor('member','B1','${T}')`)===12 && eq(w.eval(`memberMonthlyTotalPrice('B1','${T}')`),6750) && eq(w.eval(`memberPerLessonPrice('B1','${T}')`),562.5) && eq(w.eval(`memberBalanceForMonth('B1','${T}')`),0));
  t('8. dersten sonra 9. ders tavanina takilmaz (hak 12)', w.eval(`(function(){ for (let i=0;i<8;i++) state.lessons.push({id:'bx'+i,memberIds:['B1'],date:'${T}-0'+(i+1),time:'08:00',status:'planned',packageMonth:'${T}',instructorId:'h1',size:1}); return quotaCeilingMsg('member','B1','${T}'); })()`)===null);
  t('bu aya ozel ucret sonraki aya KOPYALANMAZ (Yeni Ay Hazirligi)', (function(){ w.eval(`__prepContinueMemberCore('B1','${T}','${T2}')`); const mo = J(`state.members.find(m=>m.id==='B1').monthly['${T2}']`) || {}; return mo.totalPrice === undefined; })(), JSON.stringify(J(`state.members.find(m=>m.id==='B1').monthly['${T2}']`)));

  console.log('[6] ODEME PENCERESI grup uyesi: 6 ders → tutar 6 × 562,50 = 3375; uyenin hakki 6, grubun hakki 8');
  fixture(false);
  w.eval(`state.lessons = state.lessons.filter(l=>l.groupId!=='G' || l.packageMonth!=='${T}');`);
  w.eval(`openPaymentModal('S1', null, 'G', '${T}')`); await tick();
  w.eval("document.getElementById('mp-sessions').value='6'; onPaySessionsChange186();"); await tick();
  t('tutar 3375 (kilitli alan da guncellendi)', +d.getElementById('mp-amount').value===3375, d.getElementById('mp-amount').value);
  w.eval("savePayment()"); await tick(150);
  t('SILA ' + T + ': hak 6, grup hakki 8, ucret 3375, bakiye 0, Kalan Ders 6 (8 degil)', w.eval(`memberEffectiveQuota('S1','${T}','G')`)===6 && w.eval(`sessionQuotaFor('group','G','${T}')`)===8 && eq(w.eval(`memberPriceForGroupMonth('S1','G','${T}')`),3375) && eq(w.eval(`memberBalanceForMonth('S1','${T}')`),0) && w.eval(`memberRemainingForMonth('S1','${T}')`)===6,
    [w.eval(`memberEffectiveQuota('S1','${T}','G')`), w.eval(`sessionQuotaFor('group','G','${T}')`), w.eval(`memberPriceForGroupMonth('S1','G','${T}')`), w.eval(`memberBalanceForMonth('S1','${T}')`), w.eval(`memberRemainingForMonth('S1','${T}')`)].join(' / '));
  t('IKRA etkilenmedi (hak 8, 4500)', w.eval(`memberEffectiveQuota('I1','${T}','G')`)===8 && eq(w.eval(`memberPriceForGroupMonth('I1','G','${T}')`),4500));
  w.eval(`openGroupDetail('G','${T}')`); await tick();
  { const row = [...d.querySelectorAll('#gd-content table tbody tr')].find(tr => /SILA/.test(tr.textContent)); t('grup detayi SILA satiri Kalan Ders 6', !!row && /\b6\b/.test((row.children[2]||{}).textContent||''), row && row.textContent.replace(/\s+/g,' ').slice(0,80)); }
  w.eval("closeModal('modal-group-detail')");

  console.log('[7] Uye Duzenle: bu aya ozel hak + ucret → sonraki aya kopyalanmaz; hak bos → ucret kalici (eski davranis)');
  fixture(false);
  w.eval(`window.__memberEditCtxMonth='${T}'; openMemberModal('B1');`); await tick();
  w.eval("document.getElementById('mm-sessions').value='6'; document.getElementById('mm-total-price').value='3375'; saveMember();"); await tick(100);
  t('hak 6 + 3375 → ay-ozel (__prorata)', J(`state.members.find(m=>m.id==='B1').monthly['${T}'].__prorata`)===true);
  w.eval(`__prepContinueMemberCore('B1','${T}','${T2}')`);
  t('sonraki aya 3375 kopyalanmadi', (J(`state.members.find(m=>m.id==='B1').monthly['${T2}']`)||{}).totalPrice === undefined);
  w.eval(`openMemberModal('I1');`); await tick();
  w.eval("document.getElementById('mm-sessions').value=''; document.getElementById('mm-total-price').value='5000'; saveMember();"); await tick(100);
  t('hak bos + 5000 → kalici fiyat (sonraki aya kopyalanir)', J(`state.members.find(m=>m.id==='I1').monthly['${T}'].__prorata`)===false && (w.eval(`__prepContinueMemberCore('I1','${T}','${T2}')`), J(`state.members.find(m=>m.id==='I1').monthly['${T2}'].totalPrice`))===5000);

  console.log('[8] Ay icinde paket tipi 12 Ders secilince hak 12 (onceden acilmis 8\'lik paket kaydi ezilmez degil, guncellenir)');
  fixture(false);
  w.eval(`createMemberPackage(state.members.find(m=>m.id==='B1'),'${T}','${T}-01',{silent181:true})`);
  t('on kosul: paket kaydi 8, hak 8', w.eval(`sessionQuotaFor('member','B1','${T}')`)===8);
  w.eval(`window.__memberEditCtxMonth='${T}'; openMemberModal('B1');`); await tick();
  w.eval("document.getElementById('mm-package').value='p12'; saveMember();"); await tick(100);
  t('paket tipi 12 Ders → hak 12', w.eval(`sessionQuotaFor('member','B1','${T}')`)===12, w.eval(`sessionQuotaFor('member','B1','${T}')`));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
