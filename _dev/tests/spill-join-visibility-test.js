// v188 — CANLI (2026-10-04) KUMIS/NESE: Eylul paketi Ekim'e sarkiyor; Nese 2 ders yapip pasife alindi (pay: 2 ders),
// yerine Ekim'de olusturulan KUMIS Eylul paketinin kalan 6 dersine giriyor.
// (1) acik kayit (monthly[Eylul].enrolled:true) kayit tarihini (joinDate=Ekim) yener → KUMIS Eylul kadrosunda AKTIF
// (2) yerine yeni uye eklemek pasif Nese'nin "ayrildi · 2 ders" payini SILMEZ; geri giren uyenin payi yine duser (F7)
// (3) arama bos donunce "liste henuz olusturulmadi" denmez
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const S = '2026-09', T = '2026-10';
function boot() {
  const dom = new JSDOM(html, { runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
    beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
      w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})}); if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
      Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
      w.__msgs=[]; w.__decline=false;
      w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'').slice(0,200)); if (o&&o.input) return w.__decline ? null : String(o.input.value); return true; };
      w.alert=(m)=>{ w.__msgs.push('ALERT:'+String(m||'')); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{}; }});
  return dom.window;
}
function fixture(w, ctx) {
  w.eval(`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.settings.reformers=12; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const mk=(id,name,mo,o)=>Object.assign({id,name,phone:'',joinDate:'2026-09-27',defaultPackageId:'p8',totalPrice:4000,packages:[],monthly:mo},o||{});
    state.members=[mk('S1','SILA',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),mk('I1','IKRA',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),
      mk('N1','NESE',{'${S}':{enrolled:false},'${T}':{enrolled:true}},{archivePeriods:[{from:'${S}',to:'${T}',reason:''}]}),
      mk('Y1','YASEMIN',{'${S}':{enrolled:true},'${T}':{enrolled:true}},{joinDate:'2026-09-28'}),
      mk('D1','DIDEM',{'${S}':{enrolled:false},'${T}':{enrolled:true}})];
    state.groups=[{id:'G',name:'SILA - IKRA - NESE - YASEMIN',size:4,memberIds:['S1','I1','Y1'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'09:00',
      packages:[{month:'${S}',startDate:'${S}-27',sessions:8,price:16000,status:'active'}],monthlyMembers:{'2026-08':[],'${S}':['S1','I1','N1','Y1']},monthlyNotes:{},
      monthlyPartials:{'${S}':[{at:'2026-10-04',note:'',memberId:'N1',sessions:2,price:1000}]},
      memberJoinDates:{S1:'${S}-27',I1:'${S}-27',N1:'${S}-27',Y1:'${S}-28'}},
      {id:'GD',name:'DIDEM - NESE',size:4,memberIds:['D1','N1'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[{month:'${T}',sessions:8,price:12000,status:'active'}],monthlyMembers:{'${S}':['D1']},memberJoinDates:{N1:'${T}-04'}}];
    state.lessons=[];
    state.lessons.push({id:'c0',groupId:'G',memberIds:['I1','N1','S1','Y1'],date:'${S}-29',time:'09:00',status:'completed',packageMonth:'${S}',packageOwnerType:'group',packageOwnerId:'G',instructorId:'h1',size:4});
    state.lessons.push({id:'c1',groupId:'G',memberIds:['I1','N1','S1','Y1'],date:'${T}-01',time:'09:00',status:'completed',packageMonth:'${S}',packageOwnerType:'group',packageOwnerId:'G',instructorId:'h1',size:4});
    ['06','08','13','15','20','22'].forEach((dd,i)=>state.lessons.push({id:'o'+i,groupId:'G',memberIds:['S1','I1','Y1'],date:'${T}-'+dd,time:'09:00',status:'planned',packageMonth:'${S}',packageOwnerType:'group',packageOwnerId:'G',instructorId:'h1',size:4}));
    state.payments=[];
    document.getElementById('member-month').innerHTML='<option value="${T}">${T}</option><option value="${S}">${S}</option>';
    document.getElementById('member-month').value='${ctx}';`);
}
const tick = ms => new Promise(r => setTimeout(r, ms || 80));
const J = (w, e) => w.eval('JSON.stringify(' + e + ')');
const kumId = w => w.eval(`(state.members.find(m=>m.name==='KUMIS')||{}).id`);
const partialN = w => w.eval(`(state.groups[0].monthlyPartials&&state.groups[0].monthlyPartials['${S}']||[]).some(p=>p.memberId==='N1')`);
async function newMemberViaSlot(w) {
  w.eval(`switchPage('members'); renderMembers();`); await tick();
  const slot = w.eval(`(function(){ const a=document.getElementById('member-month').value; const r=buildMemberRows(a).find(r=>r.groupId==='G' && !r.memberId && !r.isPartial); return r ? r.slotIndex : 3; })()`);
  w.eval(`fillEmptySlot('G', ${slot})`); await tick();
  w.eval(`startNewMemberForSlot('G', ${slot})`); await tick();
  w.eval(`document.getElementById('mm-name').value='KUMIS'; saveMember();`); await tick(300);
}
async function newMemberViaGroupModal(w) {
  w.eval(`openGroupDetail('G', document.getElementById('member-month').value)`); await tick(); w.eval(`openGroupModal('G')`); await tick();
  w.eval(`quickAddMemberFromGroup('G')`); await tick();
  w.eval(`document.getElementById('mm-name').value='KUMIS'; saveMember();`); await tick(150);
  w.eval('saveGroup()'); await tick(300);
}
setTimeout(async () => { try {
  for (const [ctx, how] of [[S, 'slot'], [S, 'modal'], [T, 'slot'], [T, 'modal']]) {
    console.log(`[${ctx} · ${how}] Nese pasif (pay 2 ders) → yerine YENI uye KUMIS (kayit tarihi bugun)`);
    const w = boot(); await tick(1200); fixture(w, ctx);
    w.__decline = true; // ucret/hak onerisi reddedildi → KUMIS kendi hakki olmadan grup hakkiyla girer
    if (how === 'slot') await newMemberViaSlot(w); else await newMemberViaGroupModal(w);
    const k = kumId(w);
    t('KUMIS olusturuldu', !!k);
    t('KUMIS Eylul paketinde AKTIF (isMemberEnrolledInMonth)', w.eval(`isMemberEnrolledInMonth('${k}','${S}')`) === true, J(w, `state.members.find(m=>m.id==='${k}')`));
    t('Eylul aktif kadro: SILA+IKRA+YASEMIN+KUMIS', J(w, `activeGroupRosterForMonth(state.groups[0],'${S}').slice().sort()`) === JSON.stringify(['I1','S1','Y1',k].sort()), J(w, `activeGroupRosterForMonth(state.groups[0],'${S}')`));
    t('Nese "ayrildi · 2 ders" payi KORUNDU', partialN(w), J(w, 'state.groups[0].monthlyPartials'));
    const inLes = J(w, `state.lessons.filter(l=>l.groupId==='G'&&l.status==='planned').map(l=>l.memberIds.includes('${k}'))`);
    t('KUMIS sarkan 6 planli dersin HEPSINDE', inLes === JSON.stringify([true,true,true,true,true,true]), inLes);
    t('yapilmis dersler (Nese ile) DOKUNULMADI', J(w, `state.lessons.filter(l=>l.status==='completed').map(l=>l.memberIds.join(','))`) === JSON.stringify(['I1,N1,S1,Y1','I1,N1,S1,Y1']));
    if (ctx === S) {
      w.eval(`document.getElementById('member-search').value='KUMIS'; switchPage('members'); renderMembers();`); await tick();
      const txt = w.document.getElementById('members-tbody').textContent;
      t('Eylul uye listesinde "KUMIS" aramasi SONUC verir', /KUMIS/.test(txt) && !/oluşturulmadı/.test(txt), txt.slice(0, 160));
    }
  }
  console.log('[onerili] ucret/hak onerisi KABUL → kendi hakki 6 = kalan 6 ders → hepsine otomatik (Kerem 2026-10-04), Nese payi yine korunur');
  { const w = boot(); await tick(1200); fixture(w, S); w.__decline = false; await newMemberViaSlot(w); const k = kumId(w);
    t('oneri soruldu: 6 ders kaldi', w.__msgs.some(m => /6 ders kaldı/.test(m)), JSON.stringify(w.__msgs));
    t('KUMIS hakki 6', w.eval(`sessionQuotaFor('member','${k}','${S}')`) === 6);
    t('KUMIS Eylul aktif', w.eval(`isMemberEnrolledInMonth('${k}','${S}')`) === true);
    t('Nese payi KORUNDU', partialN(w));
    const inL = J(w, `state.lessons.filter(l=>l.groupId==='G'&&l.status==='planned').map(l=>l.memberIds.includes('${k}'))`);
    t('Kerem: hak 6 = kalan 6 ders → KUMIS 6 dersin HEPSINE otomatik', inL === JSON.stringify([true,true,true,true,true,true]), inL);
    // hak kalan derslerden AZSA (4 < 6) v187: Kerem secer — otomatik yazilmaz
    w.eval(`state.lessons.forEach(l=>{ if(l.groupId==='G'&&l.status==='planned') l.memberIds=l.memberIds.filter(x=>x!=='${k}'); }); setMemberMonthly('${k}','${S}',{sessionsOverride:4}); syncGroupLessonsToRoster('G','${S}');`);
    t('hak 4 < kalan 6 → otomatik YAZILMADI (Kerem secer)', J(w, `state.lessons.filter(l=>l.groupId==='G'&&l.status==='planned').some(l=>l.memberIds.includes('${k}'))`) === 'false'); }
  console.log('[F7] pasif Nese ayni ay gruba GERI donerse payi duser (cift sayim yok)');
  { const w = boot(); await tick(1200); fixture(w, S);
    w.eval(`openGroupDetail('G','${S}')`); await tick(); w.eval(`openGroupModal('G')`); await tick();
    const nb = w.document.querySelector('#mg-members input.gm-mc[value="N1"]');
    if (nb) nb.checked = true; else w.eval(`renderGroupMembersCheckboxes(['S1','I1','Y1','N1'],'G')`);
    w.eval('saveGroup()'); await tick(300);
    t('Nese Eylul aktif kadroda', w.eval(`activeGroupRosterForMonth(state.groups[0],'${S}').includes('N1')`) === true, J(w, `activeGroupRosterForMonth(state.groups[0],'${S}')`));
    t('Nese payi DUSTU (geri dondu)', !partialN(w), J(w, 'state.groups[0].monthlyPartials')); }
  console.log('[kanon] kayit tarihi kurali: kaydi olmayan ayda yine aktif DEGIL');
  { const w = boot(); await tick(1200); fixture(w, T);
    w.eval(`state.members.push({id:'Z1',name:'ZEYNEP',joinDate:'2026-10-04',packages:[],monthly:{'${T}':{enrolled:true}}})`);
    t('Z1 Ekim aktif', w.eval(`isMemberEnrolledInMonth('Z1','${T}')`) === true);
    t('Z1 Eylul (kaydi yok) aktif DEGIL', w.eval(`isMemberEnrolledInMonth('Z1','${S}')`) === false);
    w.eval(`state.members.find(m=>m.id==='Z1').monthly['${S}']={enrolled:false}`);
    t('Z1 Eylul enrolled:false → pasif DEGIL (henuz katilmamis)', w.eval(`memberPassiveInMonth(state.members.find(m=>m.id==='Z1'),'${S}')`) === false);
    console.log('[arama] Ekim listesi var, arama bos → "olusturulmadi" DENMEZ');
    w.eval(`document.getElementById('member-month').value='${T}'; document.getElementById('member-search').value='QQQXX'; switchPage('members'); renderMembers();`); await tick();
    const txt = w.document.getElementById('members-tbody').textContent;
    t('bos aramada "liste henuz olusturulmadi" YOK', !/oluşturulmadı/.test(txt), txt.slice(0, 120));
    t('bos aramada "aramaya / filtreye uyan üye yok" var', /aramaya \/ filtreye uyan üye yok/.test(txt), txt.slice(0, 120));
    w.eval(`document.getElementById('member-month').innerHTML+='<option value="2026-12">2026-12</option>'; document.getElementById('member-month').value='2026-12'; document.getElementById('member-search').value=''; renderMembers();`); await tick();
    t('gercekten bos ay (2026-12) icin kurulum mesaji AYNEN', /oluşturulmadı/.test(w.document.getElementById('members-tbody').textContent)); }
  console.log('\nSONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.error('TEST COKTU:', e); process.exit(2); } }, 50);
