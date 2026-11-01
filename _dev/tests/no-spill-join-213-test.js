// v213 (Kerem 01.11): "Uygulama yine geriye dönük üye ekliyor … Kadroya üye ekliyorum Ekim için uyarı veriyor eylüle üye ekliyor borç
// ödeme cikriyor" → karar "Hiç sorma, asla yazma" + onarım "Bulup listele, ben onaylayayım".
// [1] Ekim'e (üç yoldan: boş slota mevcut üye / boş slottan yeni üye / Grubu Düzenle) eklenen üye — grubun Eylül paketi Ekim'e "planlı"
//     dersle sarkıyor olsa bile — Eylül'e YAZILMAZ: soru yok, Eylül kadrosu/dersleri/kaydı aynen, Eylül borcu yok (tüm sorulara "Evet"
//     verilse bile). Yamasız v212'de FAIL etmeli.
// [2] Onarım: "Eylül paketine de girsin = Evet" ile yazılmış eski kayıt açılışta adıyla sorulur; "çıkar" → Eylül kadrosu, planlı dersleri,
//     orantılı ücret/hak ve borç kalkar; yapılmış ders ve ödeme silinmez; Ekim aynen. "Kalsın" → bir daha sorulmaz.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const tick = ms => new Promise(r => setTimeout(r, ms || 100));
const S = '2026-09', T = '2026-10';
function boot(ans) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://localhost/p.html', pretendToBeVisual: true, beforeParse(w) {
    w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }); if (!w.structuredClone) w.structuredClone = o => JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: () => Promise.resolve({}), getRegistrations: () => Promise.resolve([]) }, configurable: true });
    w.__msgs = []; w.__ANS = ans || 'yes';
    w.__PL_DLG_AUTO__ = (o) => { w.__msgs.push(String((o && o.msg) || '')); if (o && o.buttons) { const b = o.buttons.find(b => b.value === w.__ANS) || o.buttons[0]; return b.value; } if (o && o.input) return null; return true; };
    w.alert = (m) => w.__msgs.push('ALERT:' + m); w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
  } });
  return dom.window;
}
function fixture(w, extra) {
  w.eval(`['renderCalendar','renderArchive'].forEach(f=>window[f]=function(){}); window.plToast=function(){};
    state.settings.reformers=10; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}]; state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const mk=(id,n,mo)=>({id,name:n,joinDate:'2026-06-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:mo});
    state.members=[mk('A','ALI DENEME',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),mk('B','BETUL DENEME',{'${S}':{enrolled:true},'${T}':{enrolled:true}}),mk('X','XENA DENEME',{})];
    state.groups=[{id:'G',name:'ALI - BETUL',size:3,memberIds:['A','B'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'10:00',
      packages:[{month:'${S}',startDate:'${S}-15',sessions:8,price:0,status:'active'},{month:'${T}',startDate:'${T}-13',sessions:8,price:0,status:'active'}],
      monthlyMembers:{'${S}':['A','B'],'${T}':['A','B']},monthlyNotes:{}}];
    state.lessons=[];
    ['15','17','22','24','29','30'].forEach((dd,i)=>state.lessons.push({id:'s'+i,groupId:'G',memberIds:['A','B'],date:'${S}-'+dd,time:'10:00',status:'completed',packageMonth:'${S}',instructorId:'h1',size:3}));
    ['06','08'].forEach((dd,i)=>state.lessons.push({id:'sx'+i,groupId:'G',memberIds:['A','B'],date:'${T}-'+dd,time:'10:00',status:'planned',packageMonth:'${S}',instructorId:'h1',size:3}));
    ['13','15','20','22','27','29'].forEach((dd,i)=>state.lessons.push({id:'t'+i,groupId:'G',memberIds:['A','B'],date:'${T}-'+dd,time:'10:00',status:'completed',packageMonth:'${T}',instructorId:'h1',size:3}));
    state.payments=[{id:'pa',memberId:'A',groupId:'G',date:'${S}-15',packageMonth:'${S}',amount:4500},{id:'pb',memberId:'B',groupId:'G',date:'${S}-15',packageMonth:'${S}',amount:4500}];
    const mm=document.getElementById('member-month'); mm.innerHTML='<option value="${T}">${T}</option><option value="${S}">${S}</option>'; mm.value='${T}'; switchPage('members'); renderMembers();
    ${extra || ''}`);
}
const J = (w, e) => w.eval('JSON.stringify(' + e + ')');
setTimeout(async () => { try {
  for (const flow of ['slot', 'newslot', 'modal']) {
    console.log('[1-' + flow + '] Ekim\'e üye ekle (Eylül paketi Ekim\'e sarkıyor; tüm sorulara "Evet")');
    const w = boot('yes'); await tick(1200); fixture(w);
    const sBefore = J(w, `{ roster: activeGroupRosterForMonth(state.groups[0],'${S}'), mm: state.groups[0].monthlyMembers['${S}'], les: state.lessons.filter(l=>l.packageMonth==='${S}').map(l=>l.memberIds.join(',')) }`);
    if (flow === 'slot') w.eval("assignMemberToSlot('X','G',2)");
    else if (flow === 'newslot') { w.eval("state.members=state.members.filter(m=>m.id!=='X'); renderMembers(); fillEmptySlot('G',2)"); await tick(); w.eval("startNewMemberForSlot('G',2)"); await tick(); w.eval("document.getElementById('mm-name').value='XENA DENEME'; saveMember();"); }
    else { w.eval(`openGroupDetail('G','${T}')`); await tick(); w.eval("openGroupModal('G')"); await tick(); w.eval("renderGroupMembersCheckboxes(['A','B','X'],'G')"); w.eval('saveGroup()'); }
    await tick(800);
    const X = w.eval("(state.members.find(m=>m.name==='XENA DENEME')||{}).id");
    t('üye Ekim kadrosunda', w.eval(`activeGroupRosterForMonth(state.groups[0],'${T}').includes('${X}')`) === true, J(w, `activeGroupRosterForMonth(state.groups[0],'${T}')`));
    t('"Eylül paketi … sarkıyor … girsin mi?" sorusu ÇIKMADI', !w.__msgs.some(m => /sarkıyor/.test(m) && /girsin mi/.test(m)), JSON.stringify(w.__msgs.map(m => m.slice(0, 90))));
    const sAfter = J(w, `{ roster: activeGroupRosterForMonth(state.groups[0],'${S}'), mm: state.groups[0].monthlyMembers['${S}'], les: state.lessons.filter(l=>l.packageMonth==='${S}').map(l=>l.memberIds.join(',')) }`);
    t('Eylül kadrosu ve Eylül paketinin dersleri AYNEN', sAfter === sBefore, sAfter + ' vs ' + sBefore);
    t('üyenin Eylül kaydı yok', !w.eval(`!!((state.members.find(m=>m.id==='${X}')||{}).monthly||{})['${S}']`), J(w, `(state.members.find(m=>m.id==='${X}')||{}).monthly`));
    t('Eylül borcu YOK (Geciken Ödemeler\'de Eylül yok)', !w.eval(`getOverduePayments({includeFuture:true}).some(r=>r.months.includes('${S}'))`), J(w, `getOverduePayments({includeFuture:true}).map(r=>r.label+':'+r.months.join('/'))`));
  }

  console.log('[2] ONARIM: "Eylül paketine de girsin = Evet" ile yazılmış eski kayıt adıyla sorulur → çıkar');
  const yesFix = `state.members.find(m=>m.id==='X').monthly={'${S}':{enrolled:true,totalPrice:1125,sessionsOverride:2,__prorata:true},'${T}':{enrolled:true}};
    state.groups[0].monthlyMembers={'${S}':['A','B','X'],'${T}':['A','B','X']}; state.groups[0].memberIds=['A','B','X'];
    state.groups[0].memberJoinDates={X:'${T}-01'}; state.groups[0].spillJoin195={'X|${S}':'yes'};
    state.lessons.forEach(l=>{ if(l.id==='sx0'||l.id==='sx1'||l.packageMonth==='${T}') l.memberIds=['A','B','X']; });
    state.lessons.find(l=>l.id==='sx0').status='completed';
    state.payments.push({id:'px',memberId:'X',groupId:'G',date:'${T}-05',packageMonth:'${S}',amount:500});`;
  { const w = boot('remove'); await tick(1200); fixture(w, yesFix);
    t('önce: Eylül borcu var (X)', w.eval(`getOverduePayments({includeFuture:true}).some(r=>r.months.includes('${S}'))`) === true);
    await w.eval('(__spillRepairAsked191=false, __offerSpillJoinRepair191())'); await tick(300);
    const q = w.__msgs.find(m => /Önceki aya yazılmış üye/.test(m)) || '';
    t('onarım sorusu adıyla geldi (XENA DENEME, Eylül, Ekim)', /XENA DENEME/.test(q) && /Eylül/.test(q) && /Ekim/.test(q), q.slice(0, 200));
    t('soru yapılmış dersi ve ödemeyi söylüyor (silinmez)', /1 ders yapılmış/.test(q) && /500/.test(q) && /SİLİNMEZ/.test(q), q.slice(0, 400));
    t('X Eylül kadrosundan çıktı', !w.eval(`activeGroupRosterForMonth(state.groups[0],'${S}').includes('X')`), J(w, `activeGroupRosterForMonth(state.groups[0],'${S}')`));
    t('X Eylül paketinin PLANLI dersinden çıktı', !w.eval(`state.lessons.find(l=>l.id==='sx1').memberIds.includes('X')`));
    t('yapılmış ders olduğu gibi (sx0\'da X duruyor)', w.eval(`state.lessons.find(l=>l.id==='sx0').memberIds.includes('X')`) === true);
    t('orantılı Eylül ücreti/hakkı silindi', !w.eval(`(state.members.find(m=>m.id==='X').monthly['${S}']||{}).__prorata`) && w.eval(`(state.members.find(m=>m.id==='X').monthly['${S}']||{}).totalPrice`) === undefined, J(w, `state.members.find(m=>m.id==='X').monthly`));
    t('Eylül ödemesi SİLİNMEDİ', w.eval("state.payments.some(p=>p.id==='px')") === true);
    t('Ekim kaydı aynen (kadro + dersler)', w.eval(`activeGroupRosterForMonth(state.groups[0],'${T}').includes('X') && state.lessons.filter(l=>l.packageMonth==='${T}').every(l=>l.memberIds.includes('X'))`) === true);
    t('karar "no" yazıldı (bir daha sorulmaz)', w.eval(`state.groups[0].spillJoin195['X|${S}']`) === 'no');
    t('Geri Al yedeği alındı', w.eval("(__undoStack[__undoStack.length-1]||{}).label||''").indexOf('Onarım: önceki aya') === 0, w.eval("(__undoStack[__undoStack.length-1]||{}).label||''"));
  }
  console.log('[3] ONARIM: "Kalsın" → dokunulmaz, bir daha sorulmaz');
  { const w = boot('keep'); await tick(1200); fixture(w, yesFix);
    await w.eval('(__spillRepairAsked191=false, __offerSpillJoinRepair191())'); await tick(300);
    t('X Eylül kadrosunda KALDI', w.eval(`activeGroupRosterForMonth(state.groups[0],'${S}').includes('X')`) === true);
    t('karar "keep"', w.eval(`state.groups[0].spillJoin195['X|${S}']`) === 'keep');
    const n0 = w.__msgs.length;
    await w.eval('(__spillRepairAsked191=false, __offerSpillJoinRepair191())'); await tick(300);
    t('ikinci açılışta tekrar SORULMADI', !w.__msgs.slice(n0).some(m => /Önceki aya yazılmış üye/.test(m)));
  }
  console.log('\nSONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.log('TEST COKTU', e && e.stack || e); process.exit(2); } }, 50);
