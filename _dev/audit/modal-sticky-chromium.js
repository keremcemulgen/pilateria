// v197 — PENCERE İÇİ TABLO BAŞLIĞI DENETİMİ (Chromium): üye detay penceresindeki ders tablosu kaydırılınca başlık satırı
// (Tarih · Saat · Hoca …) satırların ortasına yapışmamalı, hiçbir satırı örtmemeli (Kerem 18.10 ekran görüntüsü).
// Görünümler: masaüstü 1366, yatay tablet 1024, dikey tablet 768, telefon 390. Ayrıca ana sayfa Üyeler tablosunda yapışkan
// başlık DEĞİŞMEDEN kalır (masaüstünde sticky, sekmelerin altında).
// Kullanım: NODE_PATH=$(npm root -g) SHOTS=<klasör> node _dev/audit/modal-sticky-chromium.js http://127.0.0.1:8765/pilateria.html
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
const SHOTS = process.env.SHOTS || '';
const FX = () => { sbHideAuth(); document.body.classList.remove('pl-authlock','pl-staff-view'); window.alert=function(){}; window.confirm=function(){return true;};
  const CM = currentMonth();
  state.packageTypes=[{id:'p4',name:'1 KİŞİLİK',sessions:12,price:9000}]; state.instructors=[{id:'I',name:'İCLAL KOÇ',shareRate:30}];
  state.members=[{id:'Y',name:'YAĞMUR K.',joinDate:'2026-01-01',defaultPackageId:'p4',totalPrice:9000,packages:[],monthly:{[CM]:{enrolled:true}}}]; state.groups=[]; state.lessons=[]; state.payments=[];
  for (let d=1; d<=28; d+=2) state.lessons.push({id:'L'+d,groupId:'',instructorId:'I',date:CM+'-'+String(d).padStart(2,'0'),time:'17:30',durationMin:45,status:d<10?'cancelled':(d<16?'completed':'planned'),memberIds:['Y'],packageMonth:CM,packageOwnerType:'member',packageOwnerId:'Y',size:1});
  document.getElementById('member-month').innerHTML='<option value="'+CM+'">'+CM+'</option>'; document.getElementById('member-month').value=CM;
  switchPage('members'); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let ok = 0, fail = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  const VIEWS = [['masaustu', { width: 1366, height: 700 }], ['tablet-yatay', { width: 1024, height: 700 }], ['tablet', { width: 768, height: 900 }], ['telefon', { width: 390, height: 844 }]];
  for (const [vname, vp] of VIEWS) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200); await p.evaluate(FX); await p.waitForTimeout(300);
    // 1) ana sayfa Üyeler tablosu: masaüstünde sticky KALIR
    const pg = await p.evaluate(() => { const th = document.querySelector('#members-table thead th'); return th ? getComputedStyle(th).position : 'yok'; });
    t(vname + ': ana sayfa Üyeler tablosu başlığı ' + (vp.width > 768 ? 'sticky (değişmedi)' : 'static (telefon/tablet, v63)'), vp.width > 768 ? pg === 'sticky' : pg === 'static', pg);
    // 2) üye detay penceresi: kaydır → başlık satır örtmez
    await p.evaluate(() => { openMemberDetail('Y', currentMonth()); }); await p.waitForTimeout(400);
    const r = await p.evaluate(() => new Promise(res => {
      const mdl = document.querySelector('.modal-bg.open'); const modal = mdl && mdl.querySelector('.modal');
      const tbl = modal && modal.querySelector('table.sticky-head'); if (!tbl) return res({ err: 'tablo yok' });
      const th = tbl.querySelector('thead th'); const rows = [...tbl.querySelectorAll('tbody tr')];
      const cs = getComputedStyle(modal); const scroller = (cs.overflowY === 'auto' || cs.overflowY === 'scroll') ? modal : mdl;
      const tTop = tbl.getBoundingClientRect().top; scroller.scrollTop += (tTop - 20) + 260;
      setTimeout(() => {
        const tr = th.getBoundingClientRect();
        const covered = rows.filter(r => { const rr = r.getBoundingClientRect(); return rr.top < tr.bottom - 1 && rr.bottom > tr.top + 1; }).map(r => r.cells[0].textContent);
        const headAboveFirst = tr.bottom <= rows[0].getBoundingClientRect().top + 1;
        res({ pos: getComputedStyle(th).position, covered: covered, headAboveFirst: headAboveFirst, scrolled: scroller.scrollTop > 100, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 });
      }, 150);
    }));
    t(vname + ': pencere kaydırıldı, başlık static, hiçbir satırı örtmüyor, ilk satırın üstünde', !r.err && r.pos === 'static' && r.covered.length === 0 && r.headAboveFirst && r.scrolled && !r.overflow, JSON.stringify(r));
    if (SHOTS) await p.screenshot({ path: SHOTS + '/modal-sticky-' + vname + '.png' });
    t(vname + ': sayfa hatası yok', errs.length === 0, JSON.stringify(errs).slice(0, 300));
    await ctx.close();
  }
  console.log('SONUC: ' + ok + '/' + (ok + fail));
  await b.close(); process.exit(fail ? 1 : 0);
})();
