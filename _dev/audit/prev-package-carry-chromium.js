// v181 — ONCEKI PAKETTEN DEVAM EDEN HAK bilgisi GERCEK CHROMIUM'DA (mobil gorunum). jsdom paketinin PARCASI DEGILDIR.
// Calistirma (repo kokunden, yerel sunucu acikken):
//   NODE_PATH=$(npm root -g) node _dev/audit/prev-package-carry-chromium.js http://127.0.0.1:8765/pilateria.html [ekran-goruntusu-klasoru]
// Beklenen: SONUC: 4/4 — (A) odeme penceresi kutusu; (B) Kaydet → paket acildi + 1.9 sn sonra bilgi toast'i;
// (C) grup detayi notu; (D) uye detayi notu. Veri uydurma.
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
const SHOT = process.argv[3] || '';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const out = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  p.__dialogs = []; p.on('dialog', async d => { p.__dialogs.push(d.type() + ': ' + d.message().slice(0, 160)); await d.accept(); });
  await p.goto(URL); await p.waitForTimeout(2000);
  await p.evaluate(() => {
    sbHideAuth(); document.body.classList.remove('pl-authlock','pl-staff-view'); __sbRole = 'owner';
    const CM = currentMonth(); const pp = CM.split('-').map(Number);
    const sh = (k) => { const d = new Date(pp[0], pp[1]-1+k, 1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); };
    const PREV = sh(-1), PREV2 = sh(-2);
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const mk = (id,name) => ({id:id,name:name,phone:'',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{[PREV2]:{enrolled:true},[PREV]:{enrolled:true},[CM]:{enrolled:true}}});
    state.members=[mk('A','AYSE'),mk('B','BERNA'),mk('L','LEYLA'),mk('I','IREM')];
    state.groups=[{id:'GA',name:'AYSE - BERNA',size:4,memberIds:['A','B','L'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'12:15',packages:[{month:PREV,startDate:PREV+'-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{[PREV]:['A','B'],[CM]:['A','B','L']},monthlyNotes:{}}];
    state.members.find(m=>m.id==='I').packages=[{month:PREV,startDate:PREV+'-01',sessions:8,price:8000,status:'active'}];
    state.members.find(m=>m.id==='L').packages=[{month:PREV2,startDate:PREV2+'-01',sessions:8,price:8000,status:'active'}];
    state.lessons=[];
    const L = (id, o) => state.lessons.push(Object.assign({id:id,time:'10:00',status:'completed',instructorId:'h1',size:1}, o));
    [3,5,10,12,17].forEach((day,i)=> L('ga'+i, {groupId:'GA',memberIds:['A','B'],date:PREV+'-'+String(day).padStart(2,'0'),time:'12:15',packageMonth:PREV,packageOwnerType:'group',packageOwnerId:'GA',size:4}));
    [2,4].forEach((day,i)=> L('gap'+i, {groupId:'GA',memberIds:['A','B'],date:CM+'-'+String(day).padStart(2,'0'),time:'12:15',status:'planned',packageMonth:PREV,packageOwnerType:'group',packageOwnerId:'GA',size:4}));
    [1,3,8,10,15,17].forEach((day,i)=> L('i'+i, {memberIds:['I'],date:PREV+'-'+String(day).padStart(2,'0'),packageMonth:PREV,packageOwnerType:'member',packageOwnerId:'I'}));
    [2,4,9,11,16].forEach((day,i)=> L('l'+i, {memberIds:['L'],date:PREV2+'-'+String(day).padStart(2,'0'),packageMonth:PREV2,packageOwnerType:'member',packageOwnerId:'L'}));
    state.payments=[];
    switchPage('members');
    const sel=document.getElementById('member-month'); if(sel && ![...sel.options].some(o=>o.value===CM)) sel.insertAdjacentHTML('beforeend','<option value="'+CM+'">'+CM+'</option>'); sel.value=CM;
    renderMembers();
  });
  // A) odeme penceresi: GA / AYSE
  await p.evaluate(() => openPaymentModal('A', null, 'GA', currentMonth())); await p.waitForTimeout(500);
  { const r = await p.evaluate(() => { const b = document.getElementById('mp-carry-181'); const cs = b ? getComputedStyle(b) : null; return { var: !!b, gorunur: !!(b && cs.display !== 'none' && b.offsetHeight > 0), metin: b ? b.textContent.replace(/\s+/g,' ').slice(0, 400) : '' }; });
    if (SHOT) await p.screenshot({ path: SHOT + '/v181-A-odeme-kutusu.png' });
    out.push((r.var && r.gorunur && /3 ders hakkı devam ediyor/.test(r.metin) && /LEYLA/.test(r.metin) ? 'OK  ' : 'HATA') + ' A) odeme penceresi kutusu ' + JSON.stringify(r)); }
  // B) Kaydet → paket acildi + 1.9 sn sonra toast
  const saveBtn = await p.$('#modal-payment button:text-is("Kaydet")');
  if (!saveBtn) out.push('HATA B: Kaydet dugmesi yok'); else { await saveBtn.click(); await p.waitForTimeout(400); }
  { const r0 = await p.evaluate(() => ({ paket: state.groups[0].packages.some(x => x.month === currentMonth()), toastHemen: !!document.querySelector('.pl-toast.on') }));
    await p.waitForTimeout(2200);
    const r = await p.evaluate(() => { const t = document.querySelector('.pl-toast.on'); return { toast: !!t, metin: t ? t.textContent.slice(0, 200) : '', genislik: t ? t.getBoundingClientRect().width : 0, vw: window.innerWidth }; });
    if (SHOT) await p.screenshot({ path: SHOT + '/v181-B-toast.png' });
    out.push((r0.paket && r.toast && /3 ders hakkı devam ediyor/.test(r.metin) && r.genislik <= r.vw && r.genislik >= r.vw * 0.8 ? 'OK  ' : 'HATA') + ' B) Kaydet → paket acildi + bilgi toast\'i ' + JSON.stringify(Object.assign(r0, r)) + ' | dialoglar: ' + JSON.stringify(p.__dialogs)); }
  await p.waitForTimeout(8500);
  // C) grup detayi notu
  await p.evaluate(() => openGroupDetail('GA', currentMonth())); await p.waitForTimeout(600);
  { const r = await p.evaluate(() => { const n = document.querySelector('#gd-content .carry-note-181'); return { not: !!n, gorunur: !!(n && n.offsetHeight > 0), metin: n ? n.textContent.replace(/\s+/g,' ').slice(0, 200) : '' }; });
    if (SHOT) { await p.evaluate(() => { const n = document.querySelector('#gd-content .carry-note-181'); if (n) n.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200); await p.screenshot({ path: SHOT + '/v181-C-grup-detayi.png' }); }
    out.push((r.not && r.gorunur && /3 ders hakkı devam ediyor/.test(r.metin) ? 'OK  ' : 'HATA') + ' C) grup detayi notu ' + JSON.stringify(r)); }
  await p.evaluate(() => closeModal('modal-group-detail'));
  // D) uye detayi notu (IREM bireysel)
  await p.evaluate(() => openMemberDetail('I', currentMonth())); await p.waitForTimeout(600);
  { const r = await p.evaluate(() => { const n = document.querySelector('#md-content .carry-note-181'); return { not: !!n, gorunur: !!(n && n.offsetHeight > 0), metin: n ? n.textContent.replace(/\s+/g,' ').slice(0, 200) : '' }; });
    if (SHOT) { await p.evaluate(() => { const n = document.querySelector('#md-content .carry-note-181'); if (n) n.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200); await p.screenshot({ path: SHOT + '/v181-D-uye-detayi.png' }); }
    out.push((r.not && r.gorunur && /bireysel .* paketinde 2 ders hakkı devam ediyor/.test(r.metin) && !/IREM —/.test(r.metin) ? 'OK  ' : 'HATA') + ' D) uye detayi notu ' + JSON.stringify(r)); }
  await ctx.close(); await b.close();
  out.forEach(l => console.log(l));
  const ok = out.filter(l => l.startsWith('OK')).length;
  console.log('SONUC: ' + ok + '/' + out.length);
  process.exit(ok === out.length ? 0 : 1);
})().catch(e => { console.log('HATA', e && e.stack || e); process.exit(1); });
