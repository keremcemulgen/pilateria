// v208 — TEK ÖZET DENETİMİ (Chromium): Finans › 📊 Özet ve Raporlar › Para Özeti, 4 görünüm (360 / 390 / 768 / 1366) → yatay taşma yok,
// Özet bölümleri var (param, kâr/zarar, düzenli, son aylar, resmi defter), Panel = Raporlar = Özet aynı rakam, kur penceresi, sayfa hatası yok.
// Kullanım: NODE_PATH=/opt/node-tools/node_modules SHOTS=<klasör> node _dev/audit/finance-ozet-chromium.js http://127.0.0.1:8765/pilateria.html
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
const SHOTS = process.env.SHOTS || '';
const FX = () => { sbHideAuth(); document.body.classList.remove('pl-authlock','pl-staff-view'); window.alert=function(m){ window.__alerts=(window.__alerts||[]).concat([String(m)]); }; window.confirm=function(){return true;};
  window.__PL_DLG_AUTO__ = (o) => (o && o.input) ? String(o.input.value) : true;
  const CUR = currentMonth(), PREV = finMonthAdd196(CUR, -1), NEXT = finMonthAdd196(CUR, 1); const [CY, CM] = CUR.split('-').map(Number), [PY, PM] = PREV.split('-').map(Number);
  state.packageTypes=[]; state.instructors=[{id:'I1',name:'HOCA BİR',shareRate:30}]; state.members=[]; state.groups=[]; state.lessons=[];
  state.payments=[{id:'p1',memberId:'m1',groupId:'',date:CUR+'-03',packageMonth:CUR,amount:4500,method:'Nakit',sessions:8,pkgName:'x'},{id:'p2',memberId:'m2',groupId:'',date:CUR+'-20',packageMonth:NEXT,amount:6000,method:'IBAN',sessions:8,pkgName:'x'},{id:'p3',memberId:'m3',groupId:'',date:PREV+'-28',packageMonth:CUR,amount:3000,method:'Nakit',sessions:8,pkgName:'x'}];
  state.instructorPayouts=[{id:'po1',instructorId:'I1',year:PY,month:PM,amount:2000,paidDate:CUR+'-02',method:'Nakit'},{id:'po2',instructorId:'I1',year:CY,month:CM,amount:1500,paidDate:CUR+'-25',method:'IBAN'}];
  state.finAccounts=state.finAccounts.filter(a=>a.id==='acc-cash'||a.id==='acc-bank');
  const c=finAccount196('acc-cash'); c.openingDate=PREV+'-01'; c.openingBalance=56000; const b=finAccount196('acc-bank'); b.openingDate=PREV+'-01'; b.openingBalance=387000;
  state.finAccounts.push({id:'kb',kind:'account',type:'bank',name:'Kerem Banka (şahsi)',owner:'Kerem',openingDate:PREV+'-01',openingBalance:10000,active:true});
  state.finAccounts.push({id:'cardD',kind:'account',type:'card',name:'Vakıf (Derya)',bank:'VakıfBank',owner:'Derya',openingDate:PREV+'-01',openingBalance:-2000,cutoffDay:25,dueDay:5,active:true,scopeDefault:'studio'});
  state.finAccounts.push({id:'cardK',kind:'account',type:'card',name:'Vakıf (Kerem)',bank:'VakıfBank',owner:'Kerem',openingDate:PREV+'-01',openingBalance:0,cutoffDay:25,dueDay:5,active:true,scopeDefault:'hane',employerSkip:true});
  state.finTemplates=[{id:'TK',kind:'template',title:'Kira',amount:33000,dayOfMonth:13,category:'Kira',accountId:'acc-bank',resmi:true,kdvRate:0,startMonth:CUR,endMonth:'',active:true,flow:'out',scope:'studio'},{id:'TE',kind:'template',title:'Ev kirası',amount:22000,dayOfMonth:10,category:'Kira',accountId:'kb',resmi:false,kdvRate:0,startMonth:CUR,endMonth:'',active:true,flow:'out',scope:'hane'},{id:'TM',kind:'template',title:'Kerem maaşı',amount:100000,dayOfMonth:5,category:'Diğer',accountId:'kb',resmi:false,kdvRate:0,startMonth:CUR,endMonth:'',active:true,flow:'in',scope:'hane'},{id:'TA',kind:'template',title:'Muhasebe ücreti',amount:4500,dayOfMonth:28,category:'Diğer',accountId:'acc-bank',resmi:true,kdvRate:20,startMonth:CUR,endMonth:'',active:true,flow:'out',scope:'studio'}];
  state.finDues=[{id:'due-TK-'+CUR,kind:'due',dtype:'expense',templateId:'TK',period:CUR,title:'Kira',amount:33000,dueDate:CUR+'-13',category:'Kira',accountId:'acc-bank',resmi:true,kdvRate:0,scope:'studio',status:'paid',paidRef:{type:'expense',id:'eK'},paidDate:CUR+'-13',paidAmount:33000},{id:'due-TE-'+CUR,kind:'due',dtype:'expense',templateId:'TE',period:CUR,title:'Ev kirası',amount:22000,dueDate:CUR+'-10',category:'Kira',accountId:'kb',resmi:false,kdvRate:0,scope:'hane',status:'open'},{id:'due-TM-'+CUR,kind:'due',dtype:'income',templateId:'TM',period:CUR,title:'Kerem maaşı',amount:100000,dueDate:CUR+'-05',category:'Diğer',accountId:'kb',resmi:false,kdvRate:0,scope:'hane',status:'paid',paidRef:{type:'move',id:'mvM'},paidDate:CUR+'-05',paidAmount:100000},{id:'due-TA-'+CUR,kind:'due',dtype:'expense',templateId:'TA',period:CUR,title:'Muhasebe ücreti',amount:4500,dueDate:CUR+'-28',category:'Diğer',accountId:'acc-bank',resmi:true,kdvRate:20,scope:'studio',status:'open'}];
  state.expenses=[{id:'eK',date:CUR+'-13',paidDate:CUR+'-13',category:'Kira',amount:33000,note:'Kira',resmi:true,kdvRate:0,accountId:'acc-bank',scope:'studio',dueId:'due-TK-'+CUR,source:'due'},{id:'eM',date:CUR+'-05',paidDate:CUR+'-05',category:'Market/Yemek',amount:1200,note:'MİGROS',accountId:'cardK',scope:'hane',source:'card-import'},{id:'eE',date:CUR+'-08',paidDate:CUR+'-08',category:'Elektrik/Su/Doğalgaz',amount:799.9,note:'ENERJİSA',accountId:'cardD',scope:'studio',source:'card-import'},{id:'eV',date:CUR+'-01',category:'KDV Ödemesi',amount:2089.68,note:'KDV',accountId:'cardK',scope:'studio',source:'manual'},{id:'eS',date:CUR+'-01',category:'Stopaj',amount:8250,note:'Muhtasar',accountId:'cardK',scope:'studio',source:'manual'},{id:'eB',date:CUR+'-27',category:'Diğer',amount:4500,note:'mali müşavir',accountId:'acc-bank',scope:'studio',source:'manual'}];
  state.finMoves=[{id:'mvM',kind:'move',op:'income',date:CUR+'-05',amount:100000,toAccountId:'kb',scope:'hane',title:'Kerem maaşı',dueId:'due-TM-'+CUR},{id:'mvC',kind:'move',op:'cardpay',date:CUR+'-15',amount:2000,fromAccountId:'acc-bank',toAccountId:'cardD'}];
  state.finCounterparties=[]; state.finRules=[]; state.finImports=[];
  state.settings.taxStartMonth=PREV; state.settings.taxOpeningLoss=513390.5; state.settings.taxOpeningKdv=0; state.settings.taxLedger={}; state.settings.kdvRate=20;
  state.settings.finance.fx={usd:41.85,eur:48.7,date:todayISO()};
  document.getElementById('member-month').innerHTML='<option value="'+CUR+'">'+CUR+'</option>'; document.getElementById('member-month').value=CUR;
  switchPage('payments'); finSwitchTab196('ozet'); window.scrollTo(0,0); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let ok = 0, fail = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  const VIEWS = [['dar-telefon', { width: 360, height: 780 }], ['telefon', { width: 390, height: 844 }], ['tablet', { width: 768, height: 1024 }], ['masaustu', { width: 1366, height: 900 }]];
  for (const [vname, vp] of VIEWS) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, locale: 'tr-TR' }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200); await p.evaluate(FX); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const el = document.getElementById('fin-ozet-body'); const de = document.documentElement; const tx = el ? el.textContent : ''; const S = finSummary208(currentMonth());
      return { active: document.getElementById('fin-panel-ozet').classList.contains('active'), overflow: de.scrollWidth > de.clientWidth + 1 ? (de.scrollWidth + '>' + de.clientWidth) : '',
        secs: ['Param', 'Toplam param', 'Kart borcu', 'Net varlık', 'NET KÂR', 'Reelde', 'Devlette', 'Düzenli gelir', 'Son ', 'olası ödeme', '≈'].filter(k => tx.indexOf(k) === -1),
        ledger: !!document.querySelector('#fin-panel-ozet #tax-ledger-card'), net: S.studio.net, tot: S.toplam.net,
        rowsOver: [...document.querySelectorAll('#fin-ozet-body .fo-row')].filter(r => r.scrollWidth > r.clientWidth + 1).length,
        plOver: (function(){ const tb = document.querySelector('#fin-ozet-body .fo-pl-t'); return tb ? tb.scrollWidth > tb.clientWidth + 1 : true; })() }; });
    t(vname + ' / Özet: etkin, yatay taşma yok, bölümler tam, defter içeride, satır/tablo taşması yok', r.active && !r.overflow && !r.secs.length && r.ledger && !r.rowsOver && !r.plOver, JSON.stringify(r));
    if (SHOTS) await p.screenshot({ path: SHOTS + '/ozet-' + vname + '.png', fullPage: true });
    // Panel ve Raporlar aynı rakam
    const q = await p.evaluate(() => { const m = currentMonth(); window.__dashMonthUserSet = true; document.getElementById('dash-month').value = m; switchPage('dashboard'); renderDashboard(); const dash = document.getElementById('s-netprofit').textContent.trim();
      document.getElementById('rep-month').value = m; switchPage('reports'); renderReports(); window.scrollTo(0, 0); const np = document.getElementById('net-profit-panel').textContent; const de = document.documentElement;
      const S = finSummary208(m); return { dash: dash, want: money(S.studio.net), npHas: np.indexOf(money(Math.abs(S.studio.net))) !== -1, overflow: de.scrollWidth > de.clientWidth + 1 ? (de.scrollWidth + '>' + de.clientWidth) : '' }; });
    t(vname + ' / Panel net = Özet; Raporlar Para Özeti aynı rakam; taşma yok', q.dash === q.want && q.npHas && !q.overflow, JSON.stringify(q));
    await p.waitForTimeout(600); // sayfa geçiş animasyonu bitsin
    if (SHOTS) await p.screenshot({ path: SHOTS + '/rapor-' + vname + '.png', fullPage: vname !== 'masaustu' });
    const fxm = await p.evaluate(() => { switchPage('payments'); finSwitchTab196('ozet'); openFinFxModal208(); const m = document.getElementById('modal-fin-fx'); const de = document.documentElement; const r = { open: !!m, w: m ? m.querySelector('.modal').getBoundingClientRect().width : 0, vw: window.innerWidth, overflow: de.scrollWidth > de.clientWidth + 1 }; if (m) m.remove(); return r; });
    t(vname + ' / kur penceresi ekrana sığar', fxm.open && fxm.w <= fxm.vw && !fxm.overflow, JSON.stringify(fxm));
    t(vname + ': sayfa hatası yok', errs.length === 0, JSON.stringify(errs).slice(0, 300));
    await ctx.close();
  }
  console.log('SONUC: ' + ok + '/' + (ok + fail));
  await b.close(); process.exit(fail ? 1 : 0);
})();
