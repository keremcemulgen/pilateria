// v175 — KEREM'IN AKISI GERCEK CHROMIUM'DA (mobil gorunum). jsdom paketinin PARCASI DEGILDIR.
// Calistirma (repo kokunden, yerel sunucu acikken — bkz. modal-flows-chromium.js):
//   NODE_PATH=$(npm root -g) node _dev/audit/solo-to-individual-chromium.js http://127.0.0.1:8765/pilateria.html
// Beklenen: SONUC: 3/3 — (A) Pasif listesi "↩️ Aktive Et" → soru → Tamam → Uyeler'de Bireysel, grup karti yok;
// (B) grup detayi "👤 Bireysele Çevir"; (C) Duzenle → "1 kisilik (bireysel)" → Kaydet → Tamam. Veri uydurma.
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const out = [];
  async function fresh() {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.__dialogs = []; p.on('dialog', async d => { p.__dialogs.push(d.type() + ': ' + d.message().slice(0, 90)); await d.accept(); });
    await p.goto(URL); await p.waitForTimeout(2000);
    await p.evaluate(() => {
      sbHideAuth(); document.body.classList.remove('pl-authlock','pl-staff-view'); __sbRole = 'owner';
      const CM = currentMonth(); const p = CM.split('-').map(Number);
      const sh = (k) => { const d = new Date(p[0], p[1]-1+k, 1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); };
      const PREV2 = sh(-2), PREV1 = sh(-1);
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[{id:'DZ',name:'DUYGU',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{[PREV2]:{enrolled:true}},archivePeriods:[{from:PREV1}]}];
      state.groups=[{id:'G1',name:'DUYGU',size:1,memberIds:['DZ'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'10:00',packages:[{month:PREV2,startDate:PREV2+'-01',sessions:8,price:8500,status:'completed'}],monthlyMembers:{},monthlyNotes:{}}];
      state.lessons=[]; for (let i=0;i<8;i++) state.lessons.push({id:'J'+i,groupId:'G1',memberIds:['DZ'],date:PREV2+'-'+String(2+i*3).padStart(2,'0'),time:'10:00',status:'completed',packageMonth:PREV2,packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:1});
      state.payments=[];
      switchPage('members');
      const sel=document.getElementById('member-month'); if(sel && ![...sel.options].some(o=>o.value===CM)) sel.insertAdjacentHTML('beforeend','<option value="'+CM+'">'+CM+'</option>'); sel.value=CM;
      renderMembers();
    });
    return { ctx, p };
  }
  // A) uye detayi → Aktive Et (gercek tiklama) → Tamam
  { const { ctx, p } = await fresh();
    // ay-bazli pasif uye: "Aktive Et" dugmesi Arsiv/Pasif sayfasindaki ay listesinde (mobil kart)
    await p.evaluate(() => { switchPage('archive'); const s = document.getElementById('archive-month'); if (s) s.value = currentMonth(); renderArchive(); }); await p.waitForTimeout(500);
    const btn = await p.$('#page-archive button:has-text("Aktive Et")');
    if (!btn) out.push('HATA A: Aktive Et dugmesi yok'); else { await btn.click(); await p.waitForTimeout(900); }
    const r = await p.evaluate(() => { const CM = currentMonth(); const g = memberActiveGroupForMonth('DZ', CM); const row = buildMemberRows(CM).find(r=>r.memberId==='DZ')||{}; renderMembers(); const txt = document.getElementById('page-members').innerText; return { grupta: !!g, tip: row.type, yigin: __modalStack.slice(), bireyselYazisi: /Bireysel/.test(txt), grupKarti: /👯\s*DUYGU/.test(txt), ders: state.lessons.filter(l=>(l.memberIds||[]).includes('DZ') && !l.groupId && (l.packageMonth||l.date.slice(0,7))===CM).length }; });
    out.push((!r.grupta && r.tip==='individual' && !r.grupKarti && r.ders===8 ? 'OK  ' : 'HATA') + ' A) Aktive Et → soru → Tamam → bireysel ' + JSON.stringify(r) + ' | dialoglar: ' + JSON.stringify(p.__dialogs));
    await ctx.close(); }
  // B) pasiften cikarma (Vazgec) → grup detayi → "Bireysele Cevir" (gercek tiklama)
  { const { ctx, p } = await fresh();
    await p.evaluate(() => reactivateMemberForMonth('DZ', currentMonth())); await p.waitForTimeout(300);
    await p.evaluate(() => openGroupDetail('G1', currentMonth())); await p.waitForTimeout(400);
    const btn = await p.$('#modal-group-detail button:has-text("Bireysele Çevir")');
    if (!btn) out.push('HATA B: Bireysele Cevir dugmesi yok'); else { await btn.click(); await p.waitForTimeout(900); }
    const r = await p.evaluate(() => { const CM = currentMonth(); const g = memberActiveGroupForMonth('DZ', CM); const row = buildMemberRows(CM).find(r=>r.memberId==='DZ')||{}; return { grupta: !!g, tip: row.type, yigin: __modalStack.slice(), grupPasif: isGroupInactiveInMonth(state.groups[0], CM) }; });
    out.push((!r.grupta && r.tip==='individual' && r.yigin.join()==='modal-member-detail' && r.grupPasif ? 'OK  ' : 'HATA') + ' B) grup detayi → Bireysele Çevir → uye detayi ' + JSON.stringify(r) + ' | dialoglar: ' + JSON.stringify(p.__dialogs));
    await ctx.close(); }
  // C) Duzenle yolu: grupta → Duzenle → (1 kisilik zaten secili) → Kaydet → Tamam
  { const { ctx, p } = await fresh();
    await p.evaluate(() => reactivateMemberForMonth('DZ', currentMonth())); await p.waitForTimeout(300);
    await p.evaluate(() => { openGroupDetail('G1', currentMonth()); openGroupModal('G1'); }); await p.waitForTimeout(400);
    const sz = await p.evaluate(() => document.getElementById('mg-size').value);
    const btn = await p.$('#modal-group button:has-text("Kaydet")');
    if (!btn) out.push('HATA C: Kaydet yok'); else { await btn.click(); await p.waitForTimeout(900); }
    const r = await p.evaluate(() => { const CM = currentMonth(); const g = memberActiveGroupForMonth('DZ', CM); const row = buildMemberRows(CM).find(r=>r.memberId==='DZ')||{}; return { boyut: null, grupta: !!g, tip: row.type, yigin: __modalStack.slice() }; });
    r.boyut = sz;
    out.push((!r.grupta && r.tip==='individual' && r.yigin.join()==='modal-member-detail' ? 'OK  ' : 'HATA') + ' C) Duzenle (1 kisilik) → Kaydet → Tamam → bireysel ' + JSON.stringify(r) + ' | dialoglar: ' + JSON.stringify(p.__dialogs));
    await ctx.close(); }
  out.forEach(l => console.log(l));
  console.log('SONUC:', out.filter(l => l.startsWith('OK')).length + '/' + out.length);
  await b.close();
})();
