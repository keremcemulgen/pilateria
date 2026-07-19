// v2026.07.18.04 — grup penceresinden "+ Yeni Üye": paket/fiyat kaydolur + gruba otomatik isaretlenir + grup sayfasinda tanimsiz DEGIL
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
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  w.eval("['renderDashboard','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  w.eval(`state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:4500},{id:'p2',name:'12 Ders',sessions:12,price:6500}];
    state.members=[]; state.groups=[]; state.lessons=[]; state.payments=[];
    const mmSel=document.getElementById('member-month'); if(mmSel){mmSel.innerHTML='<option value="2026-07">7</option>';mmSel.value='2026-07';}`);

  console.log('[1] grup penceresi acik, "+ Yeni Üye" tam formu acar (pending bayrak)');
  w.openGroupModal(); // yeni grup
  d.getElementById('modal-group').classList.add('open');
  w.quickAddMemberFromGroup(''); // yeni grupta groupId yok
  t('member modali acildi (mm-title Yeni Üye)', d.getElementById('mm-title').textContent.includes('Yeni Üye'));
  t('paket dropdown DOM da (secilebilir)', !!d.getElementById('mm-package') && d.getElementById('mm-package').options.length>1);
  t('pending grup-ekleme bayragi set', w.eval('!!_pendingGroupModalAdd'));

  console.log('[2] paket+fiyat gir, kaydet -> uye fiyatli olusur');
  d.getElementById('mm-name').value='YENI UYE';
  d.getElementById('mm-package').value='p1';
  w.onMemberPkgChange(); // fiyati paket fiyatina ceker
  t('paket secince fiyat 4500 otomatik geldi', +d.getElementById('mm-total-price').value===4500, d.getElementById('mm-total-price').value);
  w.saveMember();
  const nm = w.S().members.find(x=>x.name==='YENI UYE');
  t('uye olustu', !!nm);
  t('uye fiyati kaydedildi (totalPrice 4500)', +nm.totalPrice===4500, nm && nm.totalPrice);
  t('uye paketi kaydedildi (defaultPackageId p1)', nm.defaultPackageId==='p1', nm && nm.defaultPackageId);

  console.log('[3] grup sayfasinda fiyat TANIMSIZ degil');
  t('memberMonthlyTotalPrice 4500 (tanimsiz degil)', w.memberMonthlyTotalPrice(nm.id,'2026-07')===4500, w.memberMonthlyTotalPrice(nm.id,'2026-07'));

  console.log('[4] grup penceresinde yeni uye OTOMATIK isaretli');
  const checkedNow = [...d.querySelectorAll('#mg-members input.gm-mc:checked')].map(x=>x.value);
  t('yeni uye grup penceresinde isaretli', checkedNow.includes(nm.id), JSON.stringify(checkedNow));
  t('pending bayrak temizlendi', w.eval('_pendingGroupModalAdd===null'));

  console.log('[5] grubu kaydet -> uye grupta + fiyat grup toplamina yansir');
  d.getElementById('mg-name').value='';
  d.getElementById('mg-size').value='2';
  w.saveGroup();
  const g = w.S().groups[0];
  t('yeni uye grup kadrosunda', (g.memberIds||[]).includes(nm.id), JSON.stringify(g.memberIds));
  t('grup toplami 4500 (uye fiyati yansidi, tanimsiz yok)', w.groupExpectedTotal(g,'2026-07')===4500, w.groupExpectedTotal(g,'2026-07'));

  console.log('[6] İptal ederse bayrak takili kalmaz (stale add yok)');
  w.quickAddMemberFromGroup(g.id);
  t('bayrak set', w.eval('!!_pendingGroupModalAdd'));
  w.cancelMemberModal();
  t('iptal sonrasi bayrak temiz', w.eval('_pendingGroupModalAdd===null'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('HATA', e&&e.stack||e); process.exit(1); } }, 1500);
