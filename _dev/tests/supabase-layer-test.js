// v33 — SUPABASE VERI KATMANI: bolme/birlestirme simetrisi + diff + rol maskeleme (mod kapaliyken saf fonksiyonlar)
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};
    w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const norm=(o)=>{ if(Array.isArray(o))return o.map(norm); if(o&&typeof o==='object'){const r={};Object.keys(o).sort().forEach(k=>{if(o[k]!==undefined)r[k]=norm(o[k]);});return r;} return o; };
const eq=(a,b)=>JSON.stringify(norm(a))===JSON.stringify(norm(b));

setTimeout(()=>{ try {
  console.log('[1] Uye bolme/birlestirme — PARA finance tarafinda, simetri tam');
  const m = {id:'mS',name:'SPLIT UYE',phone:'555',joinDate:'2026-07-01',totalPrice:4500,
    monthly:{'2026-07':{enrolled:true,note:'gorusme notu',totalPrice:5000,extendedNote:'uzadi'},'2026-08':{enrolled:false}},
    packages:[{month:'2026-07',startDate:'2026-07-05',price:5000,sessions:8}], instructorId:'h1', note:'genel'};
  const sp = w.sbSplitMember(m);
  t('base icinde fiyat YOK', sp.base.totalPrice===undefined && !JSON.stringify(sp.base).includes('4500'));
  t('base icinde paket YOK (fiyat tasir)', sp.base.packages===undefined);
  t('base aylik notu TASIR (personel isi)', sp.base.monthly['2026-07'].note==='gorusme notu');
  t('base aylik fiyati TASIMAZ', sp.base.monthly['2026-07'].totalPrice===undefined);
  t('fin fiyatlari tasir', sp.fin.totalPrice===4500 && sp.fin.monthly['2026-07'].totalPrice===5000 && sp.fin.packages.length===1);
  const back = w.sbMergeMember(sp.base, sp.fin);
  t('birlestirme = orijinal (kayipsiz)', eq(back, m));
  const staffView = w.sbMergeMember(sp.base, null);
  t('personel gorunumu: fiyatsiz ama uye tam', staffView.name==='SPLIT UYE' && staffView.totalPrice===undefined && staffView.monthly['2026-07'].note==='gorusme notu');

  console.log('[2] Grup + hoca bolme/birlestirme');
  const g = {id:'gS',name:'GRUP S',size:2,memberIds:['mS'],customTotalPrice:9000,packages:[{month:'2026-07',price:9000,startDate:'2026-07-01'}],defaultTime:'10:00'};
  const gs = w.sbSplitGroup(g);
  t('grup base fiyatsiz', gs.base.customTotalPrice===undefined && gs.base.packages===undefined && gs.base.defaultTime==='10:00');
  t('grup simetri', eq(w.sbMergeGroup(gs.base, gs.fin), g));
  const ins = {id:'hS',name:'HOCA S',phone:'',rate:35};
  const is2 = w.sbSplitInstructor(ins);
  t('hoca base oransiz', is2.base.rate===undefined);
  t('hoca simetri', eq(w.sbMergeInstructor(is2.base, is2.fin), ins));

  console.log('[3] state→rows→state GIDIS-DONUS (mevcut test verisiyle)');
  w.eval(`
    state.members.push({id:'mRT',name:'ROUNDTRIP',joinDate:'2026-07-01',totalPrice:4000,monthly:{'2026-07':{totalPrice:4200,note:'n'}},packages:[{month:'2026-07',price:4200}]});
    state.groups.push({id:'gRT',name:'RT GRUP',size:2,memberIds:['mRT'],customTotalPrice:8000,packages:[]});
    state.lessons.push({id:'lRT',date:'2026-07-15',time:'09:00',memberIds:['mRT'],groupId:'gRT',status:'planned',packageMonth:'2026-07'});
    state.payments.push({id:'payRT',memberId:'mRT',amount:4200,packageMonth:'2026-07',date:'2026-07-14'});
  `);
  const rows = w.sbStateToRows();
  t('rows: uye base+finance ayri', !!rows.members['mRT'] && !!rows.member_finance['mRT'] && rows.members['mRT'].totalPrice===undefined);
  t('rows: odeme payments tablosunda', !!rows.payments['payRT']);
  t('rows: settings singleton', !!rows.settings['singleton']);
  const st2 = w.sbRowsToState(rows);
  const m2 = st2.members.find(x=>x.id==='mRT');
  t('donuste uye fiyati geri geldi', m2 && m2.totalPrice===4000 && m2.monthly['2026-07'].totalPrice===4200);
  t('donuste ders/odeme/grup tam', st2.lessons.some(l=>l.id==='lRT') && st2.payments.some(p=>p.id==='payRT') && st2.groups.find(x=>x.id==='gRT').customTotalPrice===8000);

  console.log('[4] Diff mantigi (shadow)');
  w.eval(`sbSnapshotShadow(sbStateToRows());`);
  w.eval(`state.members.find(x=>x.id==='mRT').name='DEGISTI'; state.lessons.push({id:'lRT2',date:'2026-07-16',time:'10:00',memberIds:[],status:'planned'});`);
  const rows2 = w.sbStateToRows();
  const changed = [];
  for (const tt of w.eval('SB_TABLES')) {
    for (const id in rows2[tt]) if (w.eval(`__sbShadow['${tt}'] && __sbShadow['${tt}']['${id}']`) !== JSON.stringify(rows2[tt][id])) changed.push(tt+':'+id);
  }
  t('yalniz degisenler tespit edildi', changed.includes('members:mRT') && changed.includes('lessons:lRT2'), JSON.stringify(changed));
  t('degismeyenler diffe girmedi', !changed.includes('payments:payRT') && !changed.includes('groups:gRT'));

  console.log('[5] Personel UI maskeleme (rol=staff)');
  w.eval(`__sbRole='staff'; window.SUPABASE_MODE_TEST=true;`);
  // SUPABASE_MODE const false — fonksiyon modu kontrol ediyor; testte dogrudan cagirmak icin gecici olarak kontrol edelim:
  t('sbApplyRoleUI mod kapaliyken dokunmaz', (()=>{ w.sbApplyRoleUI(); return d.querySelector('[data-page="payments"]').style.display !== 'none'; })());

  console.log('[6] Auth ekrani DOM hazir');
  t('login + setpass kutulari var', !!d.getElementById('sb-login-box') && !!d.getElementById('sb-setpass-box'));
  t('oturum karti var (gizli)', d.getElementById('sb-session-card').style.display==='none');
  t('vendor script etiketi self-hosted', !!d.querySelector('script[src="supabase-vendor.js"]') && !d.querySelector('script[src^="http"]'));

  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi`);
  process.exit(fail?1:0);
} catch(err) { console.error('TEST HATASI:', err); process.exit(1); } }, 700);
