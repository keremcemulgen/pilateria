// v196 ADIM 5 — KOMBİNASYON / RASTGELE İŞLEM DİZİSİ DEĞİŞMEZLİK TESTİ (Kerem: "olabilecek bütün kombinasyonlarda denetle")
// Tohumlu rastgele 500 işlem (ödeme, gider, vadeli gider, hoca ödemesi, virman/kart/çekim/sermaye/mutabakat, şablon, vade ödeme
// (tam/kısmi), atlama, silme, ekstre içe aktarma (binişen), Geri Al, bulut gidiş-dönüş). Her adımdan sonra değişmezler:
// bağımsız bakiye hesabı = finBalance; vade↔hareket 1:1 (yetim yok); parmak izi tekil; şablon kalemi tekil; kayıt türleri doğru;
// projeksiyon tutarlı; Geri Al tam geri alır; bulut satırları kayıpsız. Seed değiştirilerek tekrar koşturulabilir: SEED=7 node …
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const SEED = +(process.env.SEED || 20261017); const N_OPS = +(process.env.N_OPS || 500);
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__PL_DLG_AUTO__=(o)=>{ if(o&&o.input) return String(o.input.value); return true; };
  w.alert=()=>{}; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
}});
const w=dom.window;
let seed = SEED; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const J=(e)=>JSON.parse(w.eval('JSON.stringify('+e+')'));
const r2 = x => Math.round((+x || 0) * 100) / 100;
setTimeout(async function(){try{
  w.eval("['renderCalendar','renderArchive','renderDashboard','renderMembers','renderGroups','__refreshUIInPlace','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','plToast'].forEach(fn=>window[fn]=function(){});");
  const TODAY=w.eval('todayISO()'), CUR=w.eval('currentMonth()'), PREV=w.eval("finMonthAdd196(currentMonth(),-1)"), NEXT=w.eval("finMonthAdd196(currentMonth(),1)");
  const addD=(iso,k)=>w.eval("addDaysISO('"+iso+"',"+k+")");
  const OPEN = PREV + '-01';
  w.eval(`state.settings.instructorShareRate=30; state.packageTypes=[{id:'p1',name:'BIREYSEL',sessions:8,price:4500}];
    state.instructors=[{id:'G',name:'GIZEM',shareRate:30},{id:'D',name:'DERYA',shareRate:30,partner:true}];
    const en={'${PREV}':{enrolled:true},'${CUR}':{enrolled:true},'${NEXT}':{enrolled:true}};
    const mk=(id,name)=>({id,name,joinDate:'2026-01-01',defaultPackageId:'p1',totalPrice:4500,packages:[],monthly:JSON.parse(JSON.stringify(en))});
    state.members=['A','B','C','E','F','H'].map((id,i)=>mk(id,'UYE'+id));
    state.groups=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.finMoves=[]; state.finDues=[]; state.finTemplates=[]; state.finRules=[]; state.finImports=[]; state.lessons=[];
    let n=0; ['A','B','C'].forEach(function(mid,i){ ['03','05','08','10'].forEach(function(d){ state.lessons.push({id:'L'+(n++),groupId:'',instructorId:i%2?'D':'G',date:'${CUR}-'+d,time:'10:00',durationMin:45,status:'completed',memberIds:[mid],packageMonth:'${CUR}',packageOwnerType:'member',packageOwnerId:mid,size:1}); }); });
    state.lessons.push({id:'LF',groupId:'',instructorId:'G',date:'${addD(TODAY,4)}',time:'11:00',durationMin:45,status:'planned',memberIds:['F'],packageMonth:'${addD(TODAY,4).slice(0,7)}',packageOwnerType:'member',packageOwnerId:'F',size:1});
    const c=finAccount196('acc-cash'); c.openingDate='${OPEN}'; c.openingBalance=5000; const b=finAccount196('acc-bank'); b.openingDate='${OPEN}'; b.openingBalance=40000;
    state.finAccounts.push({id:'card1',kind:'account',type:'card',name:'Garanti (Kerem)',bank:'Garanti BBVA',owner:'Kerem',openingDate:'${OPEN}',openingBalance:-3000,cutoffDay:15,dueDay:25,active:true},{id:'card2',kind:'account',type:'card',name:'Vakıf (Derya)',bank:'VakıfBank',owner:'Derya',openingDate:'${OPEN}',openingBalance:0,cutoffDay:10,dueDay:20,active:true});
    state.finCounterparties.push({id:'CP1',kind:'counterparty',name:'KIRALAYAN',type:'landlord',active:true},{id:'CP2',kind:'counterparty',name:'MUHASEBECI',type:'accountant',active:true});
    state.settings.finance.partners=['Kerem','Derya'];
    document.getElementById('pay-month').value='${CUR}';`);
  const ACCS = ['acc-cash','acc-bank','card1','card2'];
  const datePool = []; for (let k = -20; k <= 10; k++) datePool.push(addD(TODAY, k));
  const validDate = () => { let d = pick(datePool); if (d < OPEN) d = OPEN; return d; };
  // ─── bağımsız bakiye hesabı (uygulamanın finMovements196'sından BAĞIMSIZ) ───
  function independentBalances() {
    const st = J('state'); const out = {};
    st.finAccounts.forEach(a => {
      if (!a.openingDate) { out[a.id] = null; return; }
      let b = +a.openingBalance || 0; const inWin = d => String(d || '').slice(0, 10) >= a.openingDate;
      const mAcc = m => m === 'Nakit' ? 'acc-cash' : (m === 'IBAN' ? 'acc-bank' : '');
      st.payments.forEach(p => { if (mAcc(p.method) === a.id && inWin(p.date)) b += r2(p.amount); });
      st.expenses.forEach(e => { if (e.accountId === a.id && e.status !== 'open' && e.business !== false && e.category !== 'Hoca Maaşı' && inWin(e.paidDate || e.date)) b -= r2(e.amount); });
      st.instructorPayouts.forEach(po => { if (mAcc(po.method) === a.id && inWin(po.paidDate)) b -= r2(po.amount); });
      st.finMoves.forEach(mv => { if (!inWin(mv.date)) return; const amt = r2(mv.amount);
        if (mv.op === 'transfer' || mv.op === 'cardpay') { if (mv.fromAccountId === a.id) b -= Math.abs(amt); if (mv.toAccountId === a.id) b += Math.abs(amt); }
        else if (mv.op === 'draw') { if ((mv.fromAccountId || mv.accountId) === a.id) b -= Math.abs(amt); }
        else if (mv.op === 'capital') { if ((mv.toAccountId || mv.accountId) === a.id) b += Math.abs(amt); }
        else if (mv.op === 'reconcile') { if (mv.accountId === a.id) b += amt; } });
      out[a.id] = r2(b);
    });
    return out;
  }
  function snapshotFin() { return JSON.stringify(J("({a:state.finAccounts,m:state.finMoves,c:state.finCounterparties,d:state.finDues,t:state.finTemplates,r:state.finRules,i:state.finImports,e:state.expenses,p:state.payments,po:state.instructorPayouts})")); }
  const viol = [];
  function checkInvariants(step, opName) {
    const st = J('state');
    // I1 bağımsız bakiye
    const ib = independentBalances(); const ab = J('finBalances196()');
    Object.keys(ib).forEach(id => { if (ib[id] !== ab[id]) viol.push(step + ' ' + opName + ': I1 bakiye ' + id + ' bağımsız ' + ib[id] + ' ≠ uygulama ' + ab[id]); });
    // I2/I3 vade ↔ hareket
    st.finDues.forEach(d => {
      if (['open','paid','skipped'].indexOf(d.status) === -1) viol.push(step + ': I9 vade durumu ' + d.status);
      if (d.status === 'paid') { if (!d.paidRef) viol.push(step + ': I2 paid kalem paidRef yok ' + d.id); else { const ok = d.paidRef.type === 'expense' ? st.expenses.some(e => e.id === d.paidRef.id && e.dueId === d.id) : st.finMoves.some(m => m.id === d.paidRef.id); if (!ok) viol.push(step + ': I2 yetim paidRef ' + d.id + ' → ' + d.paidRef.type + ':' + d.paidRef.id); } }
      if (d.status === 'open' && d.paidRef) viol.push(step + ': I2 açık kalemde paidRef ' + d.id);
      if (!(d.amount > 0)) viol.push(step + ': I6 kalem tutarı ' + d.id + ' ' + d.amount);
    });
    st.expenses.forEach(e => { if (e.dueId) { const d = st.finDues.find(x => x.id === e.dueId); if (!d) viol.push(step + ': I3 gider yetim dueId ' + e.id); else if (d.status === 'open' && d.paidRef === undefined && d.paidAmount === undefined) { /* yeniden açılmış olabilir — gider silindi mi? */ if (st.expenses.some(x => x.id === e.id)) viol.push(step + ': I3 gider var ama kalem açık ' + e.id + '/' + d.id); } } });
    // I4 parmak izi tekil (hesap bazında)
    const fps = {}; st.expenses.concat(st.finMoves).forEach(x => { if (!x.fingerprint) return; const k = (x.accountId || x.fromAccountId || x.toAccountId) + '|' + x.fingerprint; if (fps[k]) viol.push(step + ': I4 çift parmak izi ' + k); fps[k] = 1; });
    // I5 şablon kalemi tekil
    const tp = {}; st.finDues.forEach(d => { if (!d.templateId || /-k\d+$/.test(d.id)) return; const k = d.templateId + '|' + d.period; if (tp[k]) viol.push(step + ': I5 çift şablon kalemi ' + k); tp[k] = 1; });
    // I9 türler
    st.finAccounts.forEach(a => { if (a.kind !== 'account') viol.push(step + ': I9 account kind'); }); st.finMoves.forEach(m => { if (m.kind !== 'move') viol.push(step + ': I9 move kind'); }); st.finDues.forEach(d => { if (d.kind !== 'due') viol.push(step + ': I9 due kind'); });
    // I6 projeksiyon tutarlı
    const pr = J('finProjection196(30)'); if (pr.active) { const endA = r2(pr.start + pr.totIn - pr.totOut); if (Math.abs(endA - pr.end.a) > 0.011) viol.push(step + ': I6 projeksiyon ' + endA + ' ≠ ' + pr.end.a); }
    // I11 nakit = kart dışı toplam
    const cash = J('finCash196()'); const sumNc = r2(st.finAccounts.filter(a => a.type !== 'card' && a.active !== false).reduce((s, a) => s + (ab[a.id] || 0), 0)); if (cash !== sumNc) viol.push(step + ': I11 nakit ' + cash + ' ≠ ' + sumNc);
    // I7 bulut gidiş-dönüş
    const rt = J("(function(){ const f = sbRowsToState(sbStateToRows()); return { a:f.finAccounts.length, m:f.finMoves.length, d:f.finDues.length, t:f.finTemplates.length, r:f.finRules.length, i:f.finImports.length, c:f.finCounterparties.length, e:f.expenses.length }; })()");
    if (rt.a !== st.finAccounts.length || rt.m !== st.finMoves.length || rt.d !== st.finDues.length || rt.t !== st.finTemplates.length || rt.r !== st.finRules.length || rt.i !== st.finImports.length || rt.c !== st.finCounterparties.length || rt.e !== st.expenses.length) viol.push(step + ': I7 bulut gidiş-dönüş kayıp ' + JSON.stringify(rt));
    // ekranlar çökmeden render
    try { w.eval("renderFinCash196(); renderFinDues196(); renderFinCari196(); renderFinMoves196(); renderFinAccounts196(); __finRep196.kind='pl'; renderFinReports196(); __finRep196.kind='cf'; renderFinReports196(); __finRep196.kind='acc'; renderFinReports196();"); } catch(e) { viol.push(step + ': render ' + (e && e.message)); }
  }
  w.eval("switchPage('payments')"); await new Promise(r => setTimeout(r, 200));
  const log = []; let tplN = 0, impN = 0, undoN = 0;
  const OPS = ['pay','pay','exp','exp','expdue','payout','transfer','cardpay','draw','capital','reconcile','tpl','paydue','paydue','partial','skip','rmexp','rmmove','import','undo','edit'];
  for (let step = 1; step <= N_OPS; step++) {
    const op = pick(OPS); const before = snapshotFin(); let did = op;
    try {
      if (op === 'pay') { const m = pick(['A','B','C','E','F','H']); const mth = pick(['Nakit','IBAN']); const d = validDate(); const amt = pick([4500, 2000, 2500, 1500]); w.eval("state.payments.push({id:uid(),memberId:'"+m+"',groupId:'',date:'"+d+"',packageMonth:'"+d.slice(0,7)+"',pkgName:'BIREYSEL',sessions:8,amount:"+amt+",listPrice:4500,method:'"+mth+"',note:'fuzz'}); save();"); }
      else if (op === 'exp') { const acc = pick(ACCS); const d = validDate(); const amt = ri(50, 5000); const cat = pick(['Kira','Temizlik','Malzeme/Ekipman','Diğer','Hoca Maaşı']); w.eval("state.expenses.push({id:uid(),date:'"+d+"',category:'"+cat+"',amount:"+amt+",note:'fuzz',accountId:'"+acc+"',counterpartyId:'"+pick(['','CP1','CP2'])+"',source:'manual'}); save();"); }
      else if (op === 'expdue') { const d = addD(TODAY, ri(-5, 40)); const amt = ri(100, 8000); w.eval("state.finDues.push({id:uid(),kind:'due',dtype:'manual',title:'fuzz kalem "+step+"',amount:"+amt+",dueDate:'"+d+"',period:'"+d.slice(0,7)+"',category:'Diğer',counterpartyId:'"+pick(['','CP1','CP2'])+"',accountId:'"+pick(['','acc-bank','acc-cash'])+"',status:'open',createdAt:new Date().toISOString()}); save();"); }
      else if (op === 'payout') { const d = validDate(); const amt = ri(100, 3000); w.eval("state.instructorPayouts.push({id:uid(),instructorId:'G',year:+'"+CUR+"'.slice(0,4),month:+'"+CUR+"'.slice(5,7),amount:"+amt+",paidDate:'"+d+"',method:'"+pick(['Nakit','IBAN'])+"',note:''}); save();"); }
      else if (op === 'transfer' || op === 'cardpay' || op === 'draw' || op === 'capital') {
        w.eval("openFinMoveModal196('"+op+"')"); const d = validDate(); const amt = ri(100, 6000);
        w.document.getElementById('fm-date').value = d; w.document.getElementById('fm-amount').value = String(amt);
        if (op === 'transfer') { const f = pick(['acc-cash','acc-bank']); w.document.getElementById('fm-from').value = f; w.document.getElementById('fm-to').value = f === 'acc-cash' ? 'acc-bank' : 'acc-cash'; }
        if (op === 'cardpay') { w.document.getElementById('fm-from').value = 'acc-bank'; w.document.getElementById('fm-to').value = pick(['card1','card2']); }
        if (op === 'draw') { w.document.getElementById('fm-from').value = pick(ACCS); const pe = w.document.getElementById('fm-partner'); if (pe) pe.value = pick(['Kerem','Derya']); }
        if (op === 'capital') { w.document.getElementById('fm-to').value = pick(['acc-cash','acc-bank']); const pe = w.document.getElementById('fm-partner'); if (pe) pe.value = pick(['Kerem','Derya']); }
        w.eval('saveFinMove196()'); const m = w.document.getElementById('modal-fin-move'); if (m) m.remove();
      }
      else if (op === 'reconcile') { const acc = pick(['acc-cash','acc-bank']); const d = validDate(); const actual = J("finBalance196('"+acc+"','"+d+"')") + pick([0, 100, -250, 37.5]); w.eval("finReconcile196('"+acc+"','"+d+"',"+actual+",'fuzz'); save();"); }
      else if (op === 'tpl') { tplN++; w.eval("state.finTemplates.push({id:'T"+tplN+"',kind:'template',title:'Sablon "+tplN+"',amount:"+ri(500, 30000)+",dayOfMonth:"+ri(1, 28)+",category:'Kira',counterpartyId:'CP1',accountId:'acc-bank',resmi:false,kdvRate:0,startMonth:'"+pick([PREV, CUR])+"',endMonth:'',active:true}); finEnsureTemplateDues196();"); }
      else if (op === 'paydue' || op === 'partial') { const open = J("state.finDues.filter(d=>d.status==='open' && d.dtype!=='card').map(d=>({id:d.id,amount:d.amount}))"); if (!open.length) { did = 'noop'; } else { const d = pick(open); const amt = op === 'partial' ? r2(d.amount * pick([0.3, 0.5, 0.9])) : d.amount; const res = J("finPayDue196('"+d.id+"',{amount:"+amt+",date:'"+validDate()+"',accountId:'"+pick(ACCS)+"',note:'fuzz'})"); did = op + (res ? '' : '(ret null)'); } }
      else if (op === 'skip') { const open = J("state.finDues.filter(d=>d.status==='open').map(d=>d.id)"); if (!open.length) did = 'noop'; else await w.eval("finSkipDue196('"+pick(open)+"')"); }
      else if (op === 'rmexp') { const ex = J("state.expenses.map(e=>e.id)"); if (!ex.length) did = 'noop'; else w.eval("removeExpense('"+pick(ex)+"')"); }
      else if (op === 'rmmove') { const mv = J("state.finMoves.map(m=>m.id)"); if (!mv.length) did = 'noop'; else await w.eval("removeFinMove196('"+pick(mv)+"')"); }
      else if (op === 'import') { impN++; const card = pick(['card1','card2']); const lines = []; const nl = ri(2, 6); for (let k = 0; k < nl; k++) { const d = validDate(); const dd = d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4); const merch = pick(['MİGROS KADIKÖY','DECATHLON','STARBUCKS','İSKİ SU','TRENDYOL','KOÇTAŞ']); const amt = (ri(10, 3000) + pick([0, 0.5, 0.9])).toFixed(2).replace('.', ','); const credit = rnd() < 0.15; lines.push(dd + '  ' + merch + (credit ? ' İADE' : '') + '  ' + (credit ? '-' : '') + amt + ' TL'); } if (rnd() < 0.3 && log.length) { const prev = log.filter(l => l.importText).slice(-1)[0]; if (prev) lines.push.apply(lines, prev.importText.split('\n').slice(0, 2)); } const text = 'GARANTİ BBVA\nSon Ödeme Tarihi: ' + addD(TODAY, 10).split('-').reverse().join('/') + '\nDönem Borcu: ' + (ri(1000, 9000)) + ',00 TL\n' + lines.join('\n'); w.eval("finImportPreview196("+JSON.stringify(text)+",'"+card+"','"+CUR+"')"); w.eval("__finImp196.rows.forEach(function(r,i){ if (i%4===1) r.business=false; });"); const res = J("finImportProcess196({total:"+ri(1000, 9000)+", dueDate:'"+addD(TODAY, 10)+"'})"); did = 'import(' + (res ? (res.expenses + '+' + res.draws + '+' + res.credits) : 'null') + ')'; log.push({ importText: text }); }
      else if (op === 'undo') { if (J("(__undoStack||[]).length") > 0) { w.eval("undoLast()"); undoN++; did = 'undo'; } else did = 'noop'; }
      else if (op === 'edit') { const open = J("state.finDues.filter(d=>d.status==='open').map(d=>d.id)"); if (!open.length) did = 'noop'; else { const id = pick(open); w.eval("(function(){ const d=state.finDues.find(x=>x.id==='"+id+"'); d.amount="+ri(50, 9000)+"; d.dueDate='"+addD(TODAY, ri(-3, 30))+"'; save(); })()"); } }
    } catch(e) { viol.push(step + ' ' + op + ': İSTİSNA ' + (e && e.message)); }
    log.push({ step, op: did });
    checkInvariants(step, did);
    if (viol.length) break;
  }
  const st = J('state');
  t('rastgele ' + N_OPS + ' işlem (seed ' + SEED + ') — değişmez ihlali YOK', viol.length === 0, viol.slice(0, 6).join(' | ') + ' | son işlemler: ' + log.slice(-6).map(l => l.op).join(','));
  t('karışım gerçekleşti: ödeme/gider/vade/ekstre/undo hepsi çalıştı', st.payments.length > 5 && st.expenses.length > 5 && st.finDues.length > 3 && impN > 0 && undoN > 0, JSON.stringify({ p: st.payments.length, e: st.expenses.length, d: st.finDues.length, imp: impN, undo: undoN, moves: st.finMoves.length }));
  // Geri Al tam geri alıyor mu? (son 5 işlem için birebir)
  let undoOk = true;
  for (let k = 0; k < 5; k++) { const before = snapshotFin(); const d = addD(TODAY, 1); w.eval("__undoSnapshot('fuzz-undo'); state.expenses.push({id:uid(),date:'"+d+"',category:'Diğer',amount:123,note:'u',accountId:'acc-cash'}); state.finMoves.push({id:uid(),kind:'move',op:'draw',date:'"+d+"',amount:77,fromAccountId:'acc-cash',partner:'Kerem'}); save(); undoLast();"); if (snapshotFin() !== before) { undoOk = false; break; } }
  t('Geri Al: finans + gider + hareket birebir eski hale döner', undoOk);
  // bulut gidiş-dönüş içerik eşitliği
  const rt = J("(function(){ const f = sbRowsToState(sbStateToRows()); const norm = a => JSON.stringify(a.slice().sort((x,y)=>String(x.id).localeCompare(String(y.id)))); return ['finAccounts','finMoves','finDues','finTemplates','finRules','finImports','finCounterparties'].every(k => norm(f[k]) === norm(state[k].map(r => Object.assign({}, r, { kind: FIN_COLLS196[k] })))); })()");
  t('bulut satırları → state: tüm finans kayıtları içerikçe birebir', rt === true);
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST COKTU',e);process.exit(2);}},50);
