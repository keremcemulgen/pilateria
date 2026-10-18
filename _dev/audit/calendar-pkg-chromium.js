// v198 — TAKVİM PAKET BİLGİSİ DENETİMİ (Chromium): masaüstü 1366 (hafta+gün), yatay tablet 1024 (hafta), tablet 768 (gün), telefon 390
// (gün + ay gündemi). 45 dk'lık kutuda 3. satır (gev-l3) kutuya SIĞAR (taşma yok), telefon kartında pcal-c3 görünür, yatay taşma yok.
// Kullanım: NODE_PATH=$(npm root -g) SHOTS=<klasör> node _dev/audit/calendar-pkg-chromium.js http://127.0.0.1:8765/pilateria.html
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
const SHOTS = process.env.SHOTS || '';
const FX = () => { sbHideAuth(); document.body.classList.remove('pl-authlock','pl-staff-view'); window.alert=function(){}; window.confirm=function(){return true;};
  const CM = currentMonth(); const PREV = finMonthAdd196(CM, -1); const td = todayISO();
  state.settings.reformers=5; state.settings.workDays=[1,2,3,4,5,6]; state.packageTypes=[{id:'p8',name:'8 DERS',sessions:8,price:4500}];
  state.instructors=[{id:'I',name:'İCLAL KOÇ',shareRate:30},{id:'G',name:'GİZEM KASAP',shareRate:30}];
  const en={}; en[PREV]={enrolled:true}; en[CM]={enrolled:true};
  const mk=(id,name)=>({id,name,joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:JSON.parse(JSON.stringify(en))});
  state.members=[mk('A','AYLA T.'),mk('B','BETÜL K.'),mk('M','MERVE D.'),mk('N','NİGAR E.')];
  state.groups=[{id:'G1',name:'AYLA / BETÜL',size:2,memberIds:['A','B'],monthlyMembers:{[CM]:['A','B']},packages:[],rescheduleUsed:0,cancelUsed:0}];
  state.payments=[]; state.lessons=[];
  const L=(id,gid,mids,ins,date,time,st,pm,dur)=>state.lessons.push({id,groupId:gid,instructorId:ins,date,time,durationMin:dur||45,status:st,memberIds:mids,packageMonth:pm||date.slice(0,7),packageOwnerType:gid?'group':'member',packageOwnerId:gid||mids[0],size:mids.length});
  // bu haftanın günleri: bugünden başlayarak
  const d0 = td; const d1 = addDaysISO(td, 1), d2 = addDaysISO(td, 2);
  L('L1','G1',['A','B'],'I',d0,'10:00','completed'); L('L2','G1',['A','B'],'I',d1,'10:00','planned'); L('L3','G1',['A','B'],'I',d2,'10:00','planned');
  ['01','02','03','04','05','06'].forEach((d,i)=>L('P'+i,'',['M'],'G',PREV+'-'+d,'11:00','completed'));
  L('PS','',['M'],'G',d0,'11:00','planned',PREV); // sarkan: Eylül paketi 7/8
  L('M1','',['N'],'G',d0,'12:00','planned'); L('MC','',['N'],'G',d1,'12:00','cancelled'); L('M2','',['N'],'G',d2,'12:00','planned');
  L('K60','',['M'],'I',d1,'14:00','planned',CM,60); L('K30','',['N'],'I',d1,'16:00','planned',CM,30);
  switchPage('calendar'); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let ok = 0, fail = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  const VIEWS = [['masaustu', { width: 1366, height: 900 }, ['week', 'day']], ['tablet-yatay', { width: 1024, height: 768 }, ['week']], ['tablet', { width: 768, height: 1024 }, ['day', 'week']], ['telefon', { width: 390, height: 844 }, ['day', 'month']]];
  for (const [vname, vp, views] of VIEWS) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200); await p.evaluate(FX); await p.waitForTimeout(300);
    for (const v of views) {
      await p.evaluate((vv) => { calView = vv; calAnchor = new Date(); calAnchor.setHours(0,0,0,0); renderCalendar(); window.scrollTo(0, 0); }, v); await p.waitForTimeout(300);
      const r = await p.evaluate(() => {
        const de = document.documentElement; const overflow = de.scrollWidth > de.clientWidth + 1;
        const evs = [...document.querySelectorAll('.gcal-ev')].map(e => { const l3 = e.querySelector('.gev-l3'); const l3Vis = l3 && getComputedStyle(l3).display !== 'none'; return { id: (e.getAttribute('onclick')||'').match(/'([^']+)'/)[1], h: e.clientHeight, sh: e.scrollHeight, l3: !!l3, l3Vis: !!l3Vis, l3Text: l3 ? l3.textContent : '', l3Bottom: l3Vis ? Math.round(l3.getBoundingClientRect().bottom - e.getBoundingClientRect().bottom) : null } });
        const cards = [...document.querySelectorAll('.pcal-card')].map(c => { const c3 = c.querySelector('.pcal-c3'); return { c3: !!c3, txt: c3 ? c3.textContent : '', vis: c3 ? c3.getBoundingClientRect().height > 8 : false }; });
        return { overflow, evs, cards, mobile: __calMobile() };
      });
      const withL3 = r.evs.filter(e => e.l3Vis);
      if (!r.mobile && (v === 'week' || v === 'day')) {
        t(vname + '/' + v + ': 45 dk kutularda gev-l3 var ve kutuya sığıyor (taşma yok)', withL3.length >= 3 && withL3.every(e => e.l3Bottom <= -1), JSON.stringify(withL3.map(e => [e.id, e.h, e.sh, e.l3Bottom])));
        t(vname + '/' + v + ': sarkan ders "7/8", iptal "iptal", 30 dk kompakt kutuda l3 yok', withL3.some(e => /7\/8/.test(e.l3Text)) && (r.evs.find(e => e.id === 'MC') ? /iptal/.test((r.evs.find(e => e.id === 'MC')||{}).l3Text || '') : true) && !(r.evs.find(e => e.id === 'K30') || {}).l3, JSON.stringify(r.evs.map(e => [e.id, e.l3Text])));
      } else if (r.mobile && v === 'week') {
        t(vname + '/hafta: telefon/tablet hafta kutusunda l3 gizli (dar kutu)', r.evs.length > 0 && r.evs.every(e => !e.l3Vis));
      } else {
        t(vname + '/' + v + ': gündem kartlarında pcal-c3 görünür ("paketi · n. ders / 8")', r.cards.length >= 2 && r.cards.filter(c => c.c3).length >= 2 && r.cards.filter(c => c.c3).every(c => c.vis && /paketi · \d+\. ders \/ 8|iptal/.test(c.txt)), JSON.stringify(r.cards));
      }
      t(vname + '/' + v + ': yatay taşma yok', !r.overflow);
      if (SHOTS) await p.screenshot({ path: SHOTS + '/cal-' + vname + '-' + v + '.png', fullPage: false });
    }
    t(vname + ': sayfa hatası yok', errs.length === 0, JSON.stringify(errs).slice(0, 300));
    await ctx.close();
  }
  console.log('SONUC: ' + ok + '/' + (ok + fail));
  await b.close(); process.exit(fail ? 1 : 0);
})();
