// v215 (Kerem 02.11): "İleri ki aylı tarihlerde ki üye eklemeleri geriye dönük ayları etkiliyor hâlâ. Bu kaçıncı aynı sorun bunu düzelt.
// Uygulamaya bu ve benzeri konular ile ilgili tam tarama yap eksik hata olmasın."
// FARK TESTİ (genel kural): bir AY BAĞLAMINDA (ileri ay N1/N2 ya da bu ay) yapılan HER üye ekleme / taşıma / aktive etme işlemi
// o aydan ÖNCEKİ hiçbir ayın görünümünü DEĞİŞTİRMEZ: Üyeler satırları (beklenen/ödenen/kalan/hak/pencere), Üyeler istatistikleri,
// grup kadroları, üye aylık kayıtları + aktiflik/pasiflik, o ayın paketine ait dersler (kadro/durum), ödemeler, Geciken Ödemeler.
// Her yol iki fikstürle: "bare" (ileri aya hazırlık yok) ve "prepared" (ileri ay kadroları/kayıtları açılmış). Tüm sorulara ilk düğme.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const ONLY = process.argv[3] || '';
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const tick = ms => new Promise(r => setTimeout(r, ms || 100));
function boot() {
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://localhost/p.html', pretendToBeVisual: true, beforeParse(w) {
    w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }); if (!w.structuredClone) w.structuredClone = o => JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: () => Promise.resolve({}), getRegistrations: () => Promise.resolve([]) }, configurable: true });
    w.__msgs = []; // v214 sorusunda 'T' (önceki pakete YAZMA): açık onay yoksa geçmiş değişmemeli
    w.__PL_DLG_AUTO__ = (o) => { w.__msgs.push(String((o && o.msg) || '')); if (o && o.buttons && o.buttons.length) { const tb = o.buttons.find(b => b.value === 'T'); if (tb && /ÖDENMİŞ ama hiç dersi yok/.test(String(o.msg || ''))) return 'T'; return o.buttons[0].value; } if (o && o.input) return null; return true; };
    w.alert = (m) => w.__msgs.push('ALERT:' + m); w.confirm = (m) => { w.__msgs.push('CONFIRM:' + m); return true; }; w.prompt = () => null; w.scrollTo = () => {};
  } });
  return dom.window;
}
function addM(ym, k) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function fixture(w, mode) { const prepared = mode === 'prepared', legacy = mode === 'legacy';
  const CUR = w.eval('currentMonth()'), TODAY = w.eval('todayISO()');
  const P2 = addM(CUR, -2), P1 = addM(CUR, -1), N1 = addM(CUR, 1), N2 = addM(CUR, 2);
  const lastDay = w.eval(`(function(){ const p=parseISO('${CUR}-01'); return isoDate(new Date(p.getFullYear(), p.getMonth()+1, 0)); })()`);
  const futCur = TODAY < lastDay ? lastDay : TODAY; // bu ayın bugünden sonraki (ya da bugünkü) planlı günü
  w.eval(`['renderCalendar','renderArchive'].forEach(f=>window[f]=function(){}); window.plToast=function(){};
    state.settings.reformers=12; state.settings.groupPackageDays=30;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}]; state.instructors=[{id:'h1',name:'HOCA',shareRate:30},{id:'h2',name:'HOCA2',shareRate:30}];
    const ms=${JSON.stringify([P2, P1, CUR])}; const en=(arr)=>{ const o={}; arr.forEach(a=>o[a]={enrolled:true}); return o; };
    const mk=(id,n,mo,extra)=>Object.assign({id,name:n,joinDate:'${P2}-01',defaultPackageId:'p8',totalPrice:4500,instructorId:'h1',packages:[],monthly:mo},extra||{});
    const N1='${N1}';
    const prep=${prepared ? 'true' : 'false'};
    const plus=(arr)=>prep?arr.concat([N1]):arr;
    state.members=[
      mk('A','AYLA DENEME',en(plus(ms))), mk('B','BERNA DENEME',en(plus(ms))),
      mk('C','CEMRE DENEME',en(plus(ms))), mk('D','DUYGU DENEME',en(plus(ms))),
      mk('E','EBRU DENEME',en(plus(ms))), mk('F','FULYA DENEME',en(plus(ms))),
      mk('I','IPEK DENEME',en(plus(ms))),
      mk('Q','SEDA DENEME',en(['${P2}']),{archived:true,archivedAt:'${P1}-01'}),
      mk('Z','ZEYNEP DENEME',en(['${P2}','${P1}']))
    ];
    const rost=(ids)=>{ const o={}; if (${legacy ? 'true' : 'false'}) return o; /* v216: ESKİ grup — ay kadrosu anahtarı yok (memberIds tüm aylar) */ ms.forEach(a=>o[a]=ids.slice()); if(prep) o[N1]=ids.slice(); return o; };
    const pk=(a)=>({month:a,startDate:a+'-03',sessions:8,price:0,status:'active'});
    state.groups=[
      {id:'GA',name:'AYLA - BERNA',size:3,memberIds:['A','B'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'10:00',customTotalPrice:9000,packages:ms.map(pk),monthlyMembers:rost(['A','B']),monthlyNotes:{}},
      {id:'GB',name:'CEMRE - DUYGU',size:3,memberIds:['C','D'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'11:00',customTotalPrice:9000,packages:ms.map(pk),monthlyMembers:rost(['C','D']),monthlyNotes:{}},
      {id:'GC',name:'EBRU - FULYA',size:2,memberIds:['E','F'],defaultInstructorId:'h2',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'12:00',customTotalPrice:9000,packages:ms.map(pk),monthlyMembers:rost(['E','F']),monthlyNotes:{}}
    ];
    state.lessons=[]; let n=0;
    const L=(gid,mids,date,status,pm,ins,time)=>state.lessons.push({id:'L'+(n++),groupId:gid,memberIds:mids.slice(),date,time:time||'10:00',status,packageMonth:pm,instructorId:ins||'h1',size:gid?3:1});
    ms.forEach(a=>{ ['05','07','12','14','19','21','26','28'].forEach(d=>{ const dt=a+'-'+d; const st=(dt<'${TODAY}')?'completed':'planned';
      L('GA',['A','B'],dt,st,a,'h1','10:00'); L('GB',['C','D'],dt,st,a,'h1','11:00'); }); });
    // GC: bu ayın paketi ileri aya SARKIYOR (son 3 ders N1 tarihli, planlı)
    ${JSON.stringify([P2, P1])}.forEach(a=>{ ['05','07','12','14','19','21','26','28'].forEach(d=>L('GC',['E','F'],a+'-'+d,'completed',a,'h2','12:00')); });
    ['20','24','27'].forEach(d=>{ const dt='${CUR}-'+d; L('GC',['E','F'],dt,(dt<'${TODAY}')?'completed':'planned','${CUR}','h2','12:00'); });
    ['02','04','09','11','16'].forEach(d=>L('GC',['E','F'],'${N1}-'+d,'planned','${CUR}','h2','12:00'));
    // I bireysel: geçmiş aylar tamam; bu ay bugünden sonra planlı bireysel ders(ler)
    ${JSON.stringify([P2, P1])}.forEach(a=>{ ['06','13','20','27'].forEach(d=>L('',['I'],a+'-'+d,'completed',a,'h1','15:00')); });
    L('',['I'],'${futCur}','planned','${CUR}','h1','15:00');
    L('',['I'],'${CUR}-01','completed','${CUR}','h1','15:00');
    // Z bireysel P2/P1
    ${JSON.stringify([P2, P1])}.forEach(a=>{ ['08','15'].forEach(d=>L('',['Z'],a+'-'+d,'completed',a,'h1','16:00')); });
    state.payments=[]; let pn=0; const P=(mid,gid,a,amt)=>state.payments.push({id:'P'+(pn++),memberId:mid,groupId:gid,date:a+'-04',packageMonth:a,amount:amt,method:'Nakit'});
    ms.forEach(a=>{ P('A','GA',a,4500); P('B','GA',a,4500); P('C','GB',a,4500); P('D','GB',a,4500); P('E','GC',a,4500); P('F','GC',a,4500); P('I','',a,4500); });
    P('Z','','${P2}',4500); P('Z','','${P1}',4500); P('Q','','${P2}',4500);
    const mm=document.getElementById('member-month'); mm.innerHTML=[${JSON.stringify([P2, P1, CUR, N1, N2])}].flat().map(v=>'<option value="'+v+'">'+v+'</option>').join(''); mm.value='${CUR}';
    switchPage('members'); renderMembers();`);
  return { CUR, P2, P1, N1, N2 };
}
const SNAP = `(function(months){
  const prim = (o) => { if (!o || typeof o !== 'object') return String(o); const out = []; Object.keys(o).sort().forEach(k => { const v = o[k];
    if (v === null || typeof v !== 'object') { if (typeof v !== 'function') out.push(k + '=' + v); }
    else if (Array.isArray(v)) out.push(k + '=[' + v.map(x => (x && typeof x === 'object') ? (x.id || x.name || '') + ':' + Object.keys(x).filter(kk => x[kk] === null || typeof x[kk] !== 'object').sort().map(kk => kk + '=' + x[kk]).join(';') : String(x)).join('|') + ']'); }); return out.join(', '); };
  const od = (() => { try { return getOverduePayments({includeFuture:true}); } catch(e) { return []; } })();
  const res = {};
  months.forEach(M => {
    const r = {};
    try { r.rows = buildMemberRows(M).map(prim); } catch(e) { r.rows = 'ERR ' + e.message; }
    try { r.stats = prim(membersMonthStats212(M)); } catch(e) { r.stats = 'ERR'; }
    try { r.groupNav = groupNavListForMonth(M).map(g => g.id + ':' + groupDisplayName(g, M)); } catch(e) { r.groupNav = 'ERR ' + e.message; }
    r.groups = state.groups.filter(g => activeGroupRosterForMonth(g, M).length || (g.packages || []).some(p => p && p.month === M)).map(g => g.id + ' akt=' + activeGroupRosterForMonth(g, M).join(',') + ' pasif=' + isGroupInactiveInMonth(g, M) + ' ad=' + (function(){ try { return groupDisplayName(g, M); } catch(e) { return '?'; } })() + ' pkt=' + JSON.stringify(((g.packages||[]).find(p => p && p.month === M)) || null));
    r.members = state.members.filter(m => ['A','B','C','D','E','F','I','Q','Z'].includes(m.id)).map(m => m.id + ' akt=' + __memberActiveInMonth(m, M) + ' pas=' + isMemberInactiveInMonth(m, M) + ' mo=' + JSON.stringify((m.monthly || {})[M] || null) + ' pkt=' + JSON.stringify(((m.packages||[]).find(p => p && p.month === M)) || null));
    r.lessons = state.lessons.filter(l => (l.packageMonth || String(l.date).slice(0, 7)) === M || String(l.date).slice(0, 7) === M).map(l => l.id + ' ' + l.date + ' ' + l.status + ' pm=' + (l.packageMonth || '') + ' g=' + (l.groupId || '') + ' [' + (l.memberIds || []).join(',') + ']').sort();
    r.pays = state.payments.filter(p => (p.packageMonth || String(p.date).slice(0, 7)) === M).map(p => p.id + ' ' + p.memberId + ' ' + (p.groupId || '') + ' ' + p.amount).sort();
    r.overdue = od.filter(x => (x.months || []).includes(M)).map(x => x.label + ':' + (x.amount || x.due || '')).sort();
    r.partials = state.groups.map(g => { try { const ps = __partialsOf(g, M); return (ps && ps.length) ? g.id + ':' + JSON.stringify(ps) : ''; } catch(e) { return g.id + ':?'; } }).filter(Boolean);
    res[M] = r;
  });
  return JSON.stringify(res);
})`;
function diff(a, b) {
  const A = JSON.parse(a), B = JSON.parse(b), out = [];
  Object.keys(A).forEach(M => Object.keys(A[M]).forEach(k => {
    const x = A[M][k], y = B[M][k];
    if (JSON.stringify(x) === JSON.stringify(y)) return;
    if (Array.isArray(x) && Array.isArray(y)) { const gone = x.filter(v => !y.includes(v)), add = y.filter(v => !x.includes(v)); out.push(M + ' ' + k + ': -' + JSON.stringify(gone).slice(0, 400) + ' +' + JSON.stringify(add).slice(0, 400)); }
    else out.push(M + ' ' + k + ': ' + JSON.stringify(x).slice(0, 200) + ' → ' + JSON.stringify(y).slice(0, 200));
  }));
  return out;
}
const ctxGroup = (w, gid, ay) => { w.eval(`openGroupDetail('${gid}','${ay}')`); };
const OPS = {
  'slot: bireysel üye gruba (bu ay ileri tarihli bireysel dersi var)': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("assignMemberToSlot('I','GB',2)"); },
  'slot: başka gruptan taşıma': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("assignMemberToSlot('A','GB',2)"); },
  'slot: paketi ileri aya SARKAN gruptan taşıma': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("assignMemberToSlot('E','GB',2)"); },
  'slot: pasif üyeyi gruba': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("assignMemberToSlot('Q','GB',2)"); },
  'slot: önceki ayların üyesini gruba': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("assignMemberToSlot('Z','GB',2)"); },
  'slot: boş slottan YENİ üye': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("startNewMemberForSlot('GB',2)"); await tick(); w.eval("document.getElementById('mm-name').value='YENI DENEME'; saveMember()"); },
  'Üyeler: YENİ bireysel üye': async (w, ay) => { w.eval(`document.getElementById('member-month').value='${ay}'; renderMembers(); openMemberModal()`); await tick(); w.eval("document.getElementById('mm-name').value='YENI2 DENEME'; saveMember()"); },
  'Üyeler: aya ekle (önceki ayların üyesi)': async (w, ay) => { w.eval(`document.getElementById('member-month').value='${ay}'; renderMembers(); addMemberToMonth('Z','${ay}')`); },
  'Üyeler: pasif üyeyi aktive et': async (w, ay) => { w.eval(`document.getElementById('member-month').value='${ay}'; renderMembers(); reactivateMemberForMonth('Q','${ay}')`); },
  'Grubu Düzenle: bireysel üyeyi ekle': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("openGroupModal('GB')"); await tick(); w.eval("renderGroupMembersCheckboxes(['C','D','I'],'GB'); saveGroup()"); },
  'Grubu Düzenle: başka gruptan ekle': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("openGroupModal('GB')"); await tick(); w.eval("renderGroupMembersCheckboxes(['C','D','A'],'GB'); saveGroup()"); },
  'Grubu Düzenle: sarkan gruptan ekle': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("openGroupModal('GB')"); await tick(); w.eval("renderGroupMembersCheckboxes(['C','D','E'],'GB'); saveGroup()"); },
  'Yeni grup: iki gruptan + bireysel': async (w, ay) => { w.eval(`document.getElementById('member-month').value='${ay}'; renderMembers(); window.__groupEditCtxMonth='${ay}'; openGroupModal()`); await tick(); w.eval(`window.__groupEditCtxMonth='${ay}'; document.getElementById('mg-size').value='3'; renderGroupMembersCheckboxes(['B','I','F'],''); saveGroup()`); },
  'Grubu Düzenle: üye çıkar': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("openGroupModal('GB')"); await tick(); w.eval("renderGroupMembersCheckboxes(['C'],'GB'); saveGroup()"); },
  'Grubu Düzenle: SARKAN gruptan üye çıkar': async (w, ay) => { ctxGroup(w, 'GC', ay); await tick(); w.eval("openGroupModal('GC')"); await tick(); w.eval("renderGroupMembersCheckboxes(['F'],'GC'); saveGroup()"); },
  'Üyeler: üyeyi bu aydan pasife al': async (w, ay) => { w.eval(`document.getElementById('member-month').value='${ay}'; renderMembers(); removeMemberFromMonth('I','${ay}')`); },
  'Üyeler: grup üyesini bu aydan pasife al': async (w, ay) => { w.eval(`document.getElementById('member-month').value='${ay}'; renderMembers(); removeMemberFromMonth('C','${ay}')`); },
  'Üye düzenle: bu aya fiyat + paket': async (w, ay) => { w.eval(`document.getElementById('member-month').value='${ay}'; renderMembers(); openMemberModal('I')`); await tick(); w.eval("document.getElementById('mm-total-price').value='5000'; saveMember()"); },
  'Grup detayından üye düzenle (fiyat)': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("openMemberModal('C')"); await tick(); w.eval("document.getElementById('mm-total-price').value='5200'; saveMember()"); },
  'Yeni Ay Hazırlığı (önceki aydan çek)': async (w, ay) => { w.eval(`document.getElementById('member-month').value='${ay}'; renderMembers(); initMonthFromPrevious('${ay}')`); },
  'Grubu pasife al (Pasife Al / Sil düğmesi)': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("openGroupModal('GB')"); await tick(); w.eval("deleteGroup()"); },
  'Grup detayı → Detay → üyeyi Pasife Al': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval(`(function(){ const b=[...document.querySelectorAll('#modal-group-detail button')].find(x=>/Detay/.test(x.textContent) && /'C'/.test(x.getAttribute('onclick')||'')); if (b) b.click(); else openMemberDetail('C','${ay}'); })()`); await tick(); w.eval("deleteMember('C')"); },
  'Pasif (arşivli) üyeye ödeme gir': async (w, ay) => { w.eval(`openPaymentModal('Q', null, '', '${ay}')`); await tick(); w.eval(`document.getElementById('mp-pkg-month').value='${ay}'; document.getElementById('mp-amount').value='4500'; savePayment()`); },
  'Pasif (arşivli) üyeye ders gir': async (w, ay) => { w.eval(`openLessonModal(null,'${ay}-10','09:00')`); await tick(); w.eval(`document.getElementById('ml-instructor').value='h2'; __lessonMemberSearch='SEDA'; renderLessonMembersCheckboxes(); const c=[...document.querySelectorAll('#ml-members input[type=checkbox]')].find(x=>x.value==='Q'); if(c) c.checked=true; populateLessonPkgMonth('${ay}'); saveLesson()`); },
  'Gruplar sayfası (o ay): + Yeni Grup (önce başka ayın detayı açılıp kapanmış)': async (w, ay, M) => { w.eval(`openGroupDetail('GA','${M.P1}')`); await tick(); w.eval("closeModal('modal-group-detail')"); w.eval(`switchPage('groups'); const s=document.getElementById('group-month'); if(![...s.options].some(o=>o.value==='${ay}')) s.insertAdjacentHTML('beforeend','<option value=\"${ay}\">${ay}</option>'); s.value='${ay}'; renderGroups(); openGroupModal()`); await tick(); w.eval(`document.getElementById('mg-size').value='3'; renderGroupMembersCheckboxes(['B','I','F'],''); saveGroup()`); },
  'Grubu Düzenle → + Yeni Üye → Kaydet': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval("openGroupModal('GB')"); await tick(); w.eval("quickAddMemberFromGroup('GB')"); await tick(); w.eval("document.getElementById('mm-name').value='YENI3 DENEME'; saveMember()"); await tick(150); w.eval("saveGroup()"); },
  'Yeni Ay Hazırlığı: hepsi devam': async (w, ay) => { w.eval(`openMonthPrep('${ay}')`); await tick(); w.eval('prepAllContinue()'); await tick(300); },
  'Grup: 2. paket aç': async (w, ay) => { ctxGroup(w, 'GB', ay); await tick(); w.eval(`createGroupSecondPackage('GB','${ay}')`); },
  'Yeni grup: 1 kişilik (bireysel birim)': async (w, ay) => { w.eval(`document.getElementById('member-month').value='${ay}'; renderMembers(); window.__groupEditCtxMonth='${ay}'; openGroupModal()`); await tick(); w.eval(`window.__groupEditCtxMonth='${ay}'; document.getElementById('mg-size').value='1'; renderGroupMembersCheckboxes(['A'],''); saveGroup()`); }
};
// İşlemin KENDİ ayında gerçekten yapıldığı (boş işlem "değişmedi" diye geçmesin)
const EXPECT = {
  'slot: bireysel üye gruba (bu ay ileri tarihli bireysel dersi var)': "activeGroupRosterForMonth(G('GB'),AY).includes('I')",
  'slot: başka gruptan taşıma': "activeGroupRosterForMonth(G('GB'),AY).includes('A') && !activeGroupRosterForMonth(G('GA'),AY).includes('A')",
  'slot: paketi ileri aya SARKAN gruptan taşıma': "activeGroupRosterForMonth(G('GB'),AY).includes('E') && !activeGroupRosterForMonth(G('GC'),AY).includes('E')",
  'slot: pasif üyeyi gruba': "activeGroupRosterForMonth(G('GB'),AY).includes('Q')",
  'slot: önceki ayların üyesini gruba': "activeGroupRosterForMonth(G('GB'),AY).includes('Z')",
  'slot: boş slottan YENİ üye': "activeGroupRosterForMonth(G('GB'),AY).some(id => (state.members.find(m => m.id === id) || {}).name === 'YENI DENEME')",
  'Üyeler: YENİ bireysel üye': "state.members.some(m => m.name === 'YENI2 DENEME' && __memberActiveInMonth(m, AY))",
  'Üyeler: aya ekle (önceki ayların üyesi)': "__memberActiveInMonth(M_('Z'), AY)",
  'Üyeler: pasif üyeyi aktive et': "!isMemberInactiveInMonth(M_('Q'), AY)",
  'Grubu Düzenle: bireysel üyeyi ekle': "activeGroupRosterForMonth(G('GB'),AY).includes('I')",
  'Grubu Düzenle: başka gruptan ekle': "activeGroupRosterForMonth(G('GB'),AY).includes('A') && !activeGroupRosterForMonth(G('GA'),AY).includes('A')",
  'Grubu Düzenle: sarkan gruptan ekle': "activeGroupRosterForMonth(G('GB'),AY).includes('E')",
  'Grubu Düzenle: üye çıkar': "!activeGroupRosterForMonth(G('GB'),AY).includes('D')",
  'Grubu Düzenle: SARKAN gruptan üye çıkar': "!activeGroupRosterForMonth(G('GC'),AY).includes('E')",
  'Üyeler: üyeyi bu aydan pasife al': "isMemberInactiveInMonth(M_('I'), AY)",
  'Üyeler: grup üyesini bu aydan pasife al': "isMemberInactiveInMonth(M_('C'), AY)",
  'Üye düzenle: bu aya fiyat + paket': "+((M_('I').monthly || {})[AY] || {}).totalPrice === 5000",
  'Grup detayından üye düzenle (fiyat)': "+((M_('C').monthly || {})[AY] || {}).totalPrice === 5200",
  'Yeni grup: iki gruptan + bireysel': "state.groups.some(g => !['GA','GB','GC'].includes(g.id) && ['B','I','F'].every(x => activeGroupRosterForMonth(g, AY).includes(x)))",
  'Grubu pasife al (Pasife Al / Sil düğmesi)': "G('GB').archived === true && isGroupInactiveInMonth(G('GB'), addMonth215(AY, 1))",
  'Grup detayı → Detay → üyeyi Pasife Al': "isMemberInactiveInMonth(M_('C'), AY)",
  'Pasif (arşivli) üyeye ödeme gir': "state.payments.some(p => p.memberId === 'Q' && p.packageMonth === AY) && !isMemberInactiveInMonth(M_('Q'), AY)",
  'Pasif (arşivli) üyeye ders gir': "state.lessons.some(l => (l.memberIds||[]).includes('Q') && l.date === AY + '-10') && !isMemberInactiveInMonth(M_('Q'), AY)",
  'Gruplar sayfası (o ay): + Yeni Grup (önce başka ayın detayı açılıp kapanmış)': "state.groups.some(g => !['GA','GB','GC'].includes(g.id) && ['B','I','F'].every(x => activeGroupRosterForMonth(g, AY).includes(x)))",
  'Grubu Düzenle → + Yeni Üye → Kaydet': "activeGroupRosterForMonth(G('GB'),AY).some(id => (state.members.find(m => m.id === id) || {}).name === 'YENI3 DENEME')",
  'Yeni grup: 1 kişilik (bireysel birim)': "__memberActiveInMonth(M_('A'), AY) && !activeGroupRosterForMonth(G('GA'),AY).includes('A')"
};
setTimeout(async () => { try {
  for (const mode of ['bare', 'prepared', 'legacy']) for (const k of ['N1', 'N2', 'CUR']) for (const name of Object.keys(OPS)) { const prepared = mode === 'prepared';
    if (ONLY && !(name + ' ' + k + ' ' + mode).includes(ONLY)) continue;
    const w = boot(); await tick(1100);
    const M = fixture(w, mode); const ay = M[k];
    const months = [M.P2, M.P1, M.CUR, M.N1].filter(x => x < ay);
    const before = w.eval(SNAP + '(' + JSON.stringify(months) + ')');
    let err = '';
    try { await OPS[name](w, ay, M); await tick(700); } catch (e) { err = String(e && e.message || e); }
    const after = w.eval(SNAP + '(' + JSON.stringify(months) + ')');
    const d = diff(before, after);
    if (EXPECT[name]) { const ok = w.eval(`(function(){ const AY='${ay}'; const G=id=>state.groups.find(g=>g.id===id); const addMonth215=(a,k)=>{ const p=a.split('-').map(Number); const d=new Date(p[0],p[1]-1+k,1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }; const M_=id=>state.members.find(m=>m.id===id); return !!(${EXPECT[name]}); })()`); if (!ok) d.push('İŞLEM ' + ay + ' AYINDA YAPILMADI: ' + EXPECT[name]); }
    t('[' + ({ bare: 'çıplak', prepared: 'hazır', legacy: 'eski grup' })[mode] + ' · ' + k + '=' + ay + '] ' + name + ' → önceki aylar (' + months.join(',') + ') DEĞİŞMEDİ', !err && d.length === 0, (err ? 'HATA ' + err + ' · ' : '') + d.join('\n        '));
    w.close();
  }
  console.log('\nSONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.log('TEST COKTU', e && e.stack || e); process.exit(2); } }, 50);
