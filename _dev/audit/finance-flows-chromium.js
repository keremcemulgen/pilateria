// v196 — FİNANS AKIŞ DENETİMİ (Chromium): v209 4 alt sekme (Özet · Gelir & Gider · Raporlar · Hesaplar) × 3 görünüm (telefon 390, tablet 768, masaüstü 1366) → yatay taşma yok,
// sekme panelleri görünür; pencereler (nakit hareketi, hesap, cari, vade, şablon, ekstre, ödeme) açılır/kapanır; sayfa hatası yok.
// Kullanım: NODE_PATH=$(npm root -g) SHOTS=<klasör> node _dev/audit/finance-flows-chromium.js http://127.0.0.1:8765/pilateria.html
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
const SHOTS = process.env.SHOTS || '';
const FX = () => { sbHideAuth(); document.body.classList.remove('pl-authlock','pl-staff-view'); window.alert=function(m){ window.__alerts=(window.__alerts||[]).concat([String(m)]); }; window.confirm=function(){return true;};
  window.__PL_DLG_AUTO__ = (o) => (o && o.input) ? String(o.input.value) : true;
  const CM = currentMonth(); const td = todayISO();
  state.packageTypes=[{id:'p4',name:'4 KİŞİLİK',sessions:8,price:4500}]; state.instructors=[{id:'I',name:'İCLAL KOÇ',shareRate:30},{id:'D',name:'DERYA ÖZTEPE',shareRate:30,partner:true}];
  const mk=(id,n)=>({id,name:n,joinDate:'2026-01-01',defaultPackageId:'p4',totalPrice:4500,packages:[],monthly:{[CM]:{enrolled:true},[finMonthAdd196(CM,1)]:{enrolled:true}}});
  state.members=[mk('Y','YAĞMUR K.'),mk('N','NURGÜL P.'),mk('V','VENNUR Y.'),mk('T','TAMELLA T.')]; state.groups=[]; state.lessons=[];
  state.payments=[{id:'p1',memberId:'Y',groupId:'',date:CM+'-14',amount:4500,method:'Nakit',packageMonth:CM,pkgName:'4 KİŞİLİK',sessions:8},{id:'p2',memberId:'N',groupId:'',date:CM+'-07',amount:4500,method:'IBAN',packageMonth:CM,pkgName:'4 KİŞİLİK',sessions:8}];
  const c=finAccount196('acc-cash'); c.openingDate=CM+'-01'; c.openingBalance=12000; const b=finAccount196('acc-bank'); b.openingDate=CM+'-01'; b.openingBalance=85000;
  state.finAccounts=state.finAccounts.filter(a=>a.type!=='card');
  state.finAccounts.push({id:'card1',kind:'account',type:'card',name:'Garanti Bonus',bank:'Garanti BBVA',owner:'Kerem',openingDate:CM+'-01',openingBalance:-23400,cutoffDay:15,dueDay:25,active:true},{id:'card2',kind:'account',type:'card',name:'Vakıf World',bank:'VakıfBank',owner:'Derya',openingDate:CM+'-01',openingBalance:-8150,cutoffDay:10,dueDay:20,active:true});
  state.expenses=[{id:'E1',date:CM+'-03',category:'Kira',amount:30000,note:'Ekim kirası',accountId:'acc-bank',resmi:true,kdvRate:0},{id:'E2',date:CM+'-09',category:'Malzeme/Ekipman',amount:1840.5,note:'Decathlon mat',accountId:'card1'}];
  state.instructorPayouts=[{id:'PO1',instructorId:'I',year:+CM.slice(0,4),month:+CM.slice(5,7),amount:1000,paidDate:CM+'-12',method:'IBAN',note:'avans'}];
  state.finMoves=[{id:'M1',kind:'move',op:'transfer',date:CM+'-13',amount:9000,fromAccountId:'acc-cash',toAccountId:'acc-bank',note:'kasadan bankaya'},{id:'M2',kind:'move',op:'draw',date:CM+'-14',amount:5000,fromAccountId:'acc-cash',partner:'Kerem',note:''}];
  state.settings.finance.partners=['Kerem','Derya']; state.settings.finance.safetyMin=25000;
  state.finCounterparties=[{id:'CP1',kind:'counterparty',name:'MÜLK SAHİBİ',type:'landlord',active:true},{id:'CP2',kind:'counterparty',name:'MUHASEBECİ',type:'accountant',active:true}];
  state.finTemplates=[{id:'T1',kind:'template',title:'Kira',amount:30000,dayOfMonth:5,category:'Kira',counterpartyId:'CP1',accountId:'acc-bank',resmi:false,kdvRate:0,startMonth:CM,endMonth:'',active:true},{id:'T3',kind:'template',title:'SGK primi',amount:12400,dayOfMonth:28,category:'Vergi/SGK',counterpartyId:'',accountId:'acc-bank',resmi:false,kdvRate:0,startMonth:CM,endMonth:'',active:true}];
  state.finDues=[]; state.finRules=[]; state.finImports=[];
  const L=(mid,ins,date,st,id)=>state.lessons.push({id:id,groupId:'',instructorId:ins,date,time:'10:00',durationMin:45,status:st,memberIds:[mid],packageMonth:date.slice(0,7),packageOwnerType:'member',packageOwnerId:mid,size:1});
  L('V','I',addDaysISO(td,4),'planned','LV'); L('T','I',addDaysISO(td,-6),'completed','LT1'); L('T','I',addDaysISO(td,-3),'completed','LT2'); ['01','02','03','04','05','06','07'].forEach((d,i)=>L('Y','I',CM+'-'+d,'completed','LY'+i));
  finEnsureTemplateDues196();
  document.getElementById('member-month').innerHTML='<option value="'+CM+'">'+CM+'</option>'; document.getElementById('member-month').value=CM;
  switchPage('payments'); window.scrollTo(0,0); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let ok = 0, fail = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  const VIEWS = [['telefon', { width: 390, height: 844 }], ['tablet', { width: 768, height: 1024 }], ['masaustu', { width: 1366, height: 900 }]];
  const TABS = ['ozet', 'moves', 'rapor', 'accounts']; // v209: 4 sekme (Kerem "başlıkları azalt")
  for (const [vname, vp] of VIEWS) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200); await p.evaluate(FX); await p.waitForTimeout(300);
    for (const tab of TABS) {
      await p.evaluate((tb) => { finSwitchTab196(tb); window.scrollTo(0, 0); }, tab); await p.waitForTimeout(250);
      const r = await p.evaluate((tb) => { const panel = document.getElementById('fin-panel-' + tb); const de = document.documentElement; return { active: panel && panel.classList.contains('active') && panel.offsetHeight > 40, overflow: de.scrollWidth > de.clientWidth + 1 ? (de.scrollWidth + '>' + de.clientWidth) : '', txt: (panel && panel.textContent.trim().length) || 0 }; }, tab);
      t(vname + ' / ' + tab + ': panel görünür, yatay taşma yok, içerik var', r.active && !r.overflow && r.txt > 30, JSON.stringify(r));
      if (SHOTS) await p.screenshot({ path: SHOTS + '/fin-' + vname + '-' + tab + '.png', fullPage: vname !== 'telefon' });
    }
    // pencereler
    const modals = [['nakit hareketi', "openFinMoveModal196('transfer')", 'modal-fin-move'], ['hesap', "openFinAccountModal196('')", 'modal-fin-acc'], ['cari', "openFinCpModal196('')", 'modal-fin-cp'], ['vade', "openFinDueModal196('')", 'modal-fin-due'], ['şablon', "openFinTemplateModal196('')", 'modal-fin-tpl'], ['ekstre', 'openFinImportModal196()', 'modal-fin-imp'], ['kart ödemesi (v206)', "finPayItem196((finDueItems196().find(x=>x.dtype==='card')||{}).id)", 'modal-fin-cardpay'], ['ekstre (üye)', "openFinStatement196('member','T')", 'modal-fin-stm'], ['vade öde', "finPayDueModal196(state.finDues.find(d=>d.status==='open').id)", 'modal-fin-pay'], ['kur (v208)', 'openFinFxModal208()', 'modal-fin-fx']];
    for (const [name, call, id] of modals) {
      const r = await p.evaluate(([call, id]) => { try { eval(call); } catch(e) { return { err: String(e) }; } const m = document.getElementById(id); const de = document.documentElement; const r = { open: !!m, overflow: de.scrollWidth > de.clientWidth + 1, w: m ? m.querySelector('.modal').getBoundingClientRect().width : 0, vw: window.innerWidth }; if (m) m.remove(); return r; }, [call, id]);
      t(vname + ' / pencere ' + name + ': açıldı, ekrana sığdı', r.open && !r.overflow && r.w <= r.vw, JSON.stringify(r));
    }
    t(vname + ': sayfa hatası yok', errs.length === 0, JSON.stringify(errs).slice(0, 300));
    await ctx.close();
  }
  console.log('SONUC: ' + ok + '/' + (ok + fail));
  await b.close(); process.exit(fail ? 1 : 0);
})();
