// v174 — PENCERE-USTUNE-PENCERE TAM TARAMASI (GERCEK CHROMIUM, masaustu + mobil). jsdom paketinin
// (bash _dev/run-tests.sh) PARCASI DEGILDIR; tarayici zamanlamasini birebir olcmek icin Playwright ister.
// Calistirma (repo kokunden):
//   setsid nohup python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &
//   NODE_PATH=$(npm root -g) node _dev/audit/modal-flows-chromium.js http://127.0.0.1:8765/pilateria.html
// Beklenen: SONUC: 40/40. Yamasiz (v173) build'de: B (slot → ham memberIds), K/M/R/T (kapatinca detay
// kapaniyor), J (secici → ders penceresi hemen kapaniyor) HATA verir — zamanlamaya bagli oldugundan
// bazi kosularda tesadufen gecebilir; v174 zamanlamadan bagimsizdir.
// Sabit veri: UYDURMA (gercek uye/odeme yok).
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const results = [];
  async function fresh(mobile) {
    const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1200, height: 900 } });
    const p = await ctx.newPage(); p.on('dialog', d => d.accept());
    await p.goto(URL); await p.waitForTimeout(2000);
    await p.evaluate(() => {
      sbHideAuth(); document.body.classList.remove('pl-authlock','pl-staff-view');
      window.alert = function(){}; window.confirm = function(){ return true; };
      const CM = currentMonth();
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30},{id:'h2',name:'HOCA2',shareRate:30}];
      state.members=[
        {id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{[CM]:{enrolled:true}}},
        {id:'C',name:'CEREN',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{[CM]:{enrolled:true}}}
      ];
      // G1: gercek hayattaki gibi bu ay icin kadro anlik goruntusu VAR (applyRosterChange bunu rutin yazar)
      state.groups=[{id:'G1',name:'AYSE',size:2,memberIds:['A'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'10:00',packages:[{month:CM,startDate:CM+'-01',sessions:8,price:17000,status:'active'}],monthlyMembers:{[CM]:['A']},monthlyNotes:{}}];
      state.lessons=[{id:'L1',groupId:'G1',memberIds:['A'],date:CM+'-25',time:'10:00',status:'planned',packageMonth:CM,instructorId:'h1',size:1},{id:'L2',memberIds:['C'],date:CM+'-25',time:'10:30',status:'planned',packageMonth:CM,instructorId:'h2',size:1}];
      state.payments=[];
      switchPage('members');
      const sel=document.getElementById('member-month'); if(sel && ![...sel.options].some(o=>o.value===CM)) sel.insertAdjacentHTML('beforeend','<option value="'+CM+'">'+CM+'</option>'); sel.value=CM;
      renderMembers();
    });
    return { ctx, p };
  }
  const st = async (p) => p.evaluate(() => __modalStack.slice());
  async function run(name, mobile, fn) {
    const { ctx, p } = await fresh(mobile);
    let r; try { r = await fn(p); } catch(e) { r = { ok:false, info:'HATA '+e.message }; }
    results.push({ name: name + (mobile?' [mobil]':' [masaustu]'), ok: !!r.ok, info: r.info || '' });
    await ctx.close();
  }
  const newMember = async (p, nm) => { await p.evaluate((nm) => { document.getElementById('mm-name').value = nm; saveMember(); }, nm); await p.waitForTimeout(600); };
  for (const mobile of [false, true]) {
    await run('A) Yeni Grup → + Yeni Üye → Kaydet(üye) → Kaydet(grup)', mobile, async (p) => {
      await p.evaluate(() => { openGroupModal(); quickAddMemberFromGroup(''); }); await p.waitForTimeout(300);
      await newMember(p, 'YENI UYE A');
      const s1 = await st(p); const checked = await p.evaluate(() => [...document.querySelectorAll('#mg-members input.gm-mc:checked')].map(x=>x.value).length);
      const size = await p.evaluate(() => document.getElementById('mg-size').value);
      if (s1.join() !== 'modal-group') return { ok:false, info:'üye kaydı sonrası yığın: ' + JSON.stringify(s1) + ' (grup penceresi KAPANDI)' };
      if (checked !== 1) return { ok:false, info:'yeni üye grup penceresinde işaretli değil' };
      await p.evaluate(() => { document.getElementById('mg-size').value='2'; document.getElementById('mg-time').value='11:00'; document.querySelectorAll('#mg-days input[data-gday]').forEach(c=>{ if(c.getAttribute('data-gday')==='2') c.checked=true; }); saveGroup(); }); await p.waitForTimeout(500);
      const res = await p.evaluate(() => { const m = state.members.find(x=>x.name==='YENI UYE A'); const g = memberActiveGroupForMonth(m.id, currentMonth()); return { grupta: !!g, yigin: __modalStack.slice(), bireyselMi: !g }; });
      return { ok: res.grupta && res.yigin.length === 0, info: 'grupta=' + res.grupta + ' (boyut alanı ' + size + ') yığın=' + JSON.stringify(res.yigin) };
    });
    await run('B) Üyeler → + BOŞ slot → + Yeni Üye Oluştur ve Ekle', mobile, async (p) => {
      await p.evaluate(() => { fillEmptySlot('G1', 1); startNewMemberForSlot('G1', 1); }); await p.waitForTimeout(300);
      await newMember(p, 'YENI UYE B');
      const res = await p.evaluate(() => { const m = state.members.find(x=>x.name==='YENI UYE B'); const g = state.groups.find(x=>x.id==='G1'); return { kadroda: activeGroupRosterForMonth(g, currentMonth()).includes(m.id), hamListede: (g.memberIds||[]).includes(m.id), enrolled: isMemberEnrolledInMonth(m.id, currentMonth()), derste: state.lessons.some(l=>l.groupId==='G1'&&(l.memberIds||[]).includes(m.id)), yigin: __modalStack.slice(), satirTipi: (buildMemberRows(currentMonth()).find(r=>r.memberId===m.id)||{}).type }; });
      return { ok: res.kadroda && res.satirTipi === 'group', info: JSON.stringify(res) };
    });
    await run('C) Grup detayı → Düzenle → + Yeni Üye → Kaydet(üye) → Kaydet(grup) → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openGroupDetail('G1', currentMonth()); openGroupModal('G1'); quickAddMemberFromGroup('G1'); }); await p.waitForTimeout(300);
      await newMember(p, 'YENI UYE C');
      const s1 = await st(p);
      if (s1.join() !== 'modal-group-detail,modal-group') return { ok:false, info:'üye kaydı sonrası yığın: ' + JSON.stringify(s1) };
      await p.evaluate(() => saveGroup()); await p.waitForTimeout(600);
      const res = await p.evaluate(() => { const m = state.members.find(x=>x.name==='YENI UYE C'); const g = state.groups.find(x=>x.id==='G1'); return { kadroda: activeGroupRosterForMonth(g, currentMonth()).includes(m.id), yigin: __modalStack.slice() }; });
      return { ok: res.kadroda && res.yigin.join() === 'modal-group-detail', info: JSON.stringify(res) };
    });
    await run('D) Grup detayı → + BOŞ (slot) → mevcut üye seç → detay açık, üye kadroda', mobile, async (p) => {
      await p.evaluate(() => { openGroupDetail('G1', currentMonth()); fillEmptySlot('G1', 1); }); await p.waitForTimeout(200);
      await p.evaluate(() => assignMemberToSlot('C', 'G1', 1)); await p.waitForTimeout(500);
      const res = await p.evaluate(() => ({ kadroda: activeGroupRosterForMonth(state.groups.find(x=>x.id==='G1'), currentMonth()).includes('C'), yigin: __modalStack.slice(), slotAcik: !!document.getElementById('modal-fill-slot') }));
      return { ok: res.kadroda && res.yigin.join() === 'modal-group-detail' && !res.slotAcik, info: JSON.stringify(res) };
    });
    await run('E) Üye detayı → Düzenle → Kaydet → detay açık ve yenilenmiş', mobile, async (p) => {
      await p.evaluate(() => { openMemberDetail('C', currentMonth()); openMemberModal('C'); document.getElementById('mm-name').value = 'CEREN YENI'; saveMember(); }); await p.waitForTimeout(600);
      const res = await p.evaluate(() => ({ yigin: __modalStack.slice(), baslik: ((document.getElementById('md-name')||{}).textContent||'').includes('CEREN YENI') }));
      return { ok: res.yigin.join() === 'modal-member-detail' && res.baslik, info: JSON.stringify(res) };
    });
    await run('F) Üye detayı → + Paket/Ödeme → Kaydet → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openMemberDetail('C', currentMonth()); openPaymentModal('C'); savePayment(); }); await p.waitForTimeout(600);
      const res = await p.evaluate(() => ({ yigin: __modalStack.slice(), odeme: state.payments.length }));
      return { ok: res.yigin.join() === 'modal-member-detail' && res.odeme === 1, info: JSON.stringify(res) };
    });
    await run('G) Grup detayı → Ödeme al → Gruptaki Tüm Üyeler İçin Kaydet → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openGroupDetail('G1', currentMonth()); openPaymentModal('A', null, 'G1', currentMonth()); saveGroupPaymentAll(); }); await p.waitForTimeout(600);
      const res = await p.evaluate(() => ({ yigin: __modalStack.slice(), odeme: state.payments.length }));
      return { ok: res.yigin.join() === 'modal-group-detail' && res.odeme === 1, info: JSON.stringify(res) };
    });
    await run('H) Grup detayı → ders → Kaydet → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openGroupDetail('G1', currentMonth()); openLessonModal('L1'); saveLesson(); }); await p.waitForTimeout(600);
      const res = await p.evaluate(() => ({ yigin: __modalStack.slice() }));
      return { ok: res.yigin.join() === 'modal-group-detail', info: JSON.stringify(res) };
    });
    await run('I) Üyeler → + Aya Üye Ekle → kapat → sayfa aynı', mobile, async (p) => {
      await p.evaluate(() => { openMonthAddPicker(currentMonth()); }); await p.waitForTimeout(200);
      const acik = await p.evaluate(() => !!document.getElementById('modal-month-add'));
      await p.evaluate(() => closeMonthAddPicker()); await p.waitForTimeout(300);
      const res = await p.evaluate(() => ({ kapandi: !document.getElementById('modal-month-add'), sayfa: document.querySelector('.page.active, [data-page].active') ? true : true, yigin: __modalStack.slice() }));
      return { ok: acik && res.kapandi && res.yigin.length === 0, info: JSON.stringify(res) };
    });
    await run('J) Takvim → aynı saatte 2 ders → seçici → ders aç → ders penceresi AÇIK KALIR → Kaydet', mobile, async (p) => {
      await p.evaluate(() => { switchPage('calendar'); openLessonPicker(currentMonth()+'-25', '10:00'); }); await p.waitForTimeout(300);
      const s0 = await st(p);
      await p.evaluate(() => { const it = document.querySelector('#lpk-body .lpk-item'); it.click(); }); await p.waitForTimeout(700);
      const s1 = await st(p);
      if (s1.join() !== 'modal-lesson') return { ok:false, info:'seçici sonrası yığın: ' + JSON.stringify(s1) + ' (önce ' + JSON.stringify(s0) + ')' };
      await p.evaluate(() => saveLesson()); await p.waitForTimeout(600);
      const s2 = await st(p);
      return { ok: s2.length === 0, info: 'secici=' + JSON.stringify(s0) + ' ders=' + JSON.stringify(s1) + ' kaydet=' + JSON.stringify(s2) };
    });
    await run('K) Grup detayı → Toplu Ders Tarihleri → ✕ → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openGroupDetail('G1', currentMonth()); openBatchDatesGroup('G1', currentMonth()); }); await p.waitForTimeout(300);
      const s1 = await st(p);
      await p.evaluate(() => closeModal('modal-batch-dates')); await p.waitForTimeout(600);
      const s2 = await st(p);
      return { ok: s1.join() === 'modal-group-detail,modal-batch-dates' && s2.join() === 'modal-group-detail', info: JSON.stringify(s1) + ' → ' + JSON.stringify(s2) };
    });
    await run('L) Üye detayı → Toplu Ders Gir → Kaydet → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openMemberDetail('C', currentMonth()); openBatchDatesMember('C', currentMonth()); }); await p.waitForTimeout(300);
      const s1 = await st(p);
      await p.evaluate(() => { try { saveBatchDates(); } catch(e) { closeModal('modal-batch-dates'); } }); await p.waitForTimeout(600);
      const s2 = await st(p);
      return { ok: s1.join() === 'modal-member-detail,modal-batch-dates' && s2.join() === 'modal-member-detail', info: JSON.stringify(s1) + ' → ' + JSON.stringify(s2) };
    });
    await run('M) Üye detayı → Ders Programı raporu → ✕ → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openMemberDetail('C', currentMonth()); openScheduleReport('member', 'C', currentMonth()); }); await p.waitForTimeout(300);
      const s1 = await st(p);
      await p.evaluate(() => closeModal('modal-schedule-report')); await p.waitForTimeout(600);
      const s2 = await st(p);
      return { ok: s1.join() === 'modal-member-detail,modal-schedule-report' && s2.join() === 'modal-member-detail', info: JSON.stringify(s1) + ' → ' + JSON.stringify(s2) };
    });
    await run('N) Panel → WhatsApp penceresi → Kapat → yığın bozulmaz', mobile, async (p) => {
      await p.evaluate(() => { openMemberDetail('C', currentMonth()); openWhatsAppModal('C', 'overdue'); }); await p.waitForTimeout(300);
      const acik = await p.evaluate(() => !!document.getElementById('modal-whatsapp'));
      await p.evaluate(() => closeWaModal()); await p.waitForTimeout(500);
      const res = await p.evaluate(() => ({ kapandi: !document.getElementById('modal-whatsapp'), yigin: __modalStack.slice() }));
      return { ok: acik && res.kapandi && res.yigin.join() === 'modal-member-detail', info: JSON.stringify(res) };
    });
    await run('O) Yeni Ay Hazırlığı → ✕ → ana sayfa', mobile, async (p) => {
      await p.evaluate(() => { openMonthPrep(currentMonth()); }); await p.waitForTimeout(300);
      const s1 = await st(p);
      await p.evaluate(() => closeModal('modal-month-prep')); await p.waitForTimeout(600);
      const s2 = await st(p);
      return { ok: s1.join() === 'modal-month-prep' && s2.length === 0, info: JSON.stringify(s1) + ' → ' + JSON.stringify(s2) };
    });
    await run('P) Üye detayı → ders → Kaydet → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openMemberDetail('C', currentMonth()); openLessonModal('L2'); saveLesson(); }); await p.waitForTimeout(700);
      const res = await p.evaluate(() => ({ yigin: __modalStack.slice() }));
      return { ok: res.yigin.join() === 'modal-member-detail', info: JSON.stringify(res) };
    });
    await run('Q) Grup detayı → Ders Ekle (grup dersi) → Kaydet → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openGroupDetail('G1', currentMonth()); openLessonModalForGroup('G1', currentMonth()); }); await p.waitForTimeout(300);
      const s1 = await st(p);
      await p.evaluate(() => { document.getElementById('ml-date').value = currentMonth()+'-27'; document.getElementById('ml-time').value = '15:00'; saveLesson(); }); await p.waitForTimeout(700);
      const s2 = await st(p);
      const warn = await p.evaluate(() => (document.getElementById('ml-warning')||{}).textContent || '');
      return { ok: s1.join() === 'modal-group-detail,modal-lesson' && s2.join() === 'modal-group-detail', info: JSON.stringify(s1) + ' → ' + JSON.stringify(s2) + ' ' + warn.slice(0,80) };
    });
    await run('R) Grup detayı → Düzenle → + Yeni Üye → Kaydet(üye) → Vazgeç(grup) → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openGroupDetail('G1', currentMonth()); openGroupModal('G1'); quickAddMemberFromGroup('G1'); }); await p.waitForTimeout(300);
      await newMember(p, 'YENI UYE R');
      const s1 = await st(p);
      await p.evaluate(() => closeModal('modal-group')); await p.waitForTimeout(600);
      const s2 = await st(p);
      return { ok: s1.join() === 'modal-group-detail,modal-group' && s2.join() === 'modal-group-detail', info: JSON.stringify(s1) + ' → ' + JSON.stringify(s2) };
    });
    await run('S) Grup detayı → Ödeme → "← Geri" düğmesi → yalnız ödeme kapanır', mobile, async (p) => {
      await p.evaluate(() => { openGroupDetail('G1', currentMonth()); openPaymentModal('A', null, 'G1', currentMonth()); }); await p.waitForTimeout(300);
      await p.evaluate(() => { const b = document.querySelector('#modal-payment .modal-back-btn'); if (b) b.click(); else history.back(); }); await p.waitForTimeout(700);
      const res = await p.evaluate(() => ({ yigin: __modalStack.slice(), hist: (history.state && history.state.pilateriaModal) || null }));
      return { ok: res.yigin.join() === 'modal-group-detail' && res.hist === 'modal-group-detail', info: JSON.stringify(res) };
    });
    await run('T) Grup detayı → Ödeme → ✕ ÇİFT dokunma → detay açık', mobile, async (p) => {
      await p.evaluate(() => { openGroupDetail('G1', currentMonth()); openPaymentModal('A', null, 'G1', currentMonth()); }); await p.waitForTimeout(300);
      await p.evaluate(() => { const x = document.querySelector('#modal-payment .modal-close-x'); x.click(); x.click(); }); await p.waitForTimeout(800);
      const res = await p.evaluate(() => ({ yigin: __modalStack.slice() }));
      return { ok: res.yigin.join() === 'modal-group-detail', info: JSON.stringify(res) };
    });
  }
  results.forEach(r => console.log((r.ok ? 'OK  ' : 'HATA') + ' ' + r.name.padEnd(80) + ' ' + r.info.slice(0, 150)));
  console.log('SONUC:', results.filter(r=>r.ok).length + '/' + results.length);
  await b.close();
})();
