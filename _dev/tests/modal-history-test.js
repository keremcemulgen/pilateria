// v174 — ICTEKI PENCERE KAPANINCA ALTTAKI DETAY ACIK KALMALI (Kerem 2026-09-21: "grup/bireysel uye
// sayfasinin icinde bir sayfa daha acinca, onu kaydederken/kapatirken ana Uyeler sayfasina donuyor").
// KOK NEDEN: closeModal → history.back(); dogan popstate'i yutan bayrak setTimeout(0) ile
// sifirlaniyordu. Guncel Chrome'da popstate zamanlayicidan SONRA gelir (gercek Chromium'da 20/20
// olculdu) → bayrak kapali → isleyici alttaki detayi da kapatiyordu. Bu test Chrome'un sirasini
// birebir modeller: history.back() gercekte BIR SONRAKI gorevde (0 ms zamanlayicidan sonra) islenir.
// Yamasiz build'de FAIL etmeli.
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
    w.__PL_DLG_AUTO__=(o)=>(o&&o.input)?String(o.input.value):true; w.alert=()=>{}; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
    // CHROME SIRASI: history.back()'in popstate'i, cagri aninda kuyruga giren 0 ms zamanlayicilardan SONRA gelir.
    const realBack = w.History.prototype.back;
    w.History.prototype.back = function(){ const self = this; w.setTimeout(function(){ realBack.call(self); }, 4); };
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 80));
const stack = () => w.eval('JSON.stringify(__modalStack)');
const isOpen = id => !!(d.getElementById(id) && d.getElementById(id).classList.contains('open'));
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});");
  // TARIHE BAGIMLI OLMASIN: grubun planli dersi her zaman BUGUNDEN SONRA (katilim tarihi bugun yazilir)
  const FUT = (function(){ const d=new Date(w.eval('todayISO()')+'T12:00:00'); d.setDate(d.getDate()+3); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })();
  const CM = w.eval('currentMonth()');
  function fixture(){
    w.eval(`
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[
        {id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'B',name:'BURCU',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'C',name:'CEREN',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}}
      ];
      state.groups=[{id:'G1',name:'AYSE - BURCU',size:2,memberIds:['A','B'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'10:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:17000,status:'active'}],monthlyMembers:{},monthlyNotes:{}}];
      state.lessons=[{id:'L1',groupId:'G1',memberIds:['A','B'],date:'${FUT}',time:'10:00',status:'planned',packageMonth:'${FUT.slice(0,7)}',instructorId:'h1',size:2}];
      state.payments=[];
      document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
    `);
  }
  async function reset(){ // tum pencereleri kapat, history'yi sakinlestir
    w.eval("while(__modalStack.length){ const id=__modalStack[__modalStack.length-1]; closeModal(id); }");
    await tick(120);
    fixture();
  }

  console.log('[1] uye detayi > Duzenle > IPTAL → detay acik kalir');
  await reset();
  w.eval(`openMemberDetail('C','${CM}'); openMemberModal('C');`); await tick();
  t('on kosul: yigin detay>uye', stack()==='["modal-member-detail","modal-member"]', stack());
  w.eval('cancelMemberModal()'); await tick();
  t('iptal sonrasi yigin = [uye detayi]', stack()==='["modal-member-detail"]', stack());
  t('uye detayi GORUNUR (ana sayfaya dusmedi)', isOpen('modal-member-detail'));

  console.log('[2] grup detayi > Odeme al > ✕ → detay acik kalir');
  await reset();
  w.eval(`openGroupDetail('G1','${CM}'); openPaymentModal('A', null, 'G1', '${CM}');`); await tick();
  w.eval("closeModal('modal-payment')"); await tick();
  t('✕ sonrasi yigin = [grup detayi]', stack()==='["modal-group-detail"]', stack());
  t('grup detayi GORUNUR', isOpen('modal-group-detail'));

  console.log('[3] grup detayi > Odeme al > KAYDET → detay acik kalir');
  await reset();
  w.eval(`openGroupDetail('G1','${CM}'); openPaymentModal('A', null, 'G1', '${CM}');`); await tick();
  w.eval('savePayment()'); await tick();
  t('kaydet sonrasi yigin = [grup detayi]', stack()==='["modal-group-detail"]', stack());
  t('odeme kaydedildi', w.eval('state.payments.length')===1);

  console.log('[4] grup detayi > Duzenle > KAYDET → detay acik kalir');
  await reset();
  w.eval(`openGroupDetail('G1','${CM}'); openGroupModal('G1');`); await tick();
  w.eval('saveGroup()'); await tick();
  t('kaydet sonrasi yigin = [grup detayi]', stack()==='["modal-group-detail"]', stack());

  console.log('[5] grup detayi > ders > KAYDET → detay acik kalir');
  await reset();
  w.eval(`openGroupDetail('G1','${CM}'); openLessonModal('L1');`); await tick();
  w.eval('saveLesson()'); await tick();
  t('kaydet sonrasi yigin = [grup detayi]', stack()==='["modal-group-detail"]', stack());

  console.log('[6] Esc ve arka plan tiklamasi yalniz EN USTTEKINI kapatir');
  await reset();
  w.eval(`openMemberDetail('C','${CM}'); openPaymentModal('C');`); await tick();
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key:'Escape', bubbles:true })); await tick();
  t('Esc sonrasi yigin = [uye detayi]', stack()==='["modal-member-detail"]', stack());
  w.eval("openPaymentModal('C')"); await tick();
  d.getElementById('modal-payment').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await tick();
  t('arka plan tiklamasi sonrasi yigin = [uye detayi]', stack()==='["modal-member-detail"]', stack());

  console.log('[7] GERCEK geri tusu (← / Android geri) yalniz en usttekini kapatir, sonra detayi');
  await reset();
  w.eval(`openMemberDetail('C','${CM}'); openPaymentModal('C');`); await tick();
  w.history.back(); await tick();
  t('1. geri: yigin = [uye detayi]', stack()==='["modal-member-detail"]', stack());
  w.history.back(); await tick();
  t('2. geri: yigin bos (ana sayfa)', stack()==='[]', stack());

  console.log('[8] uc kat: grup detayi > Duzenle > + Yeni Uye > Iptal > Grup penceresi Vazgec');
  await reset();
  w.eval(`openGroupDetail('G1','${CM}'); openGroupModal('G1'); quickAddMemberFromGroup('G1');`); await tick();
  t('on kosul: 3 kat', stack()==='["modal-group-detail","modal-group","modal-member"]', stack());
  w.eval('cancelMemberModal()'); await tick();
  t('uye formu kapandi, grup penceresi + detay duruyor', stack()==='["modal-group-detail","modal-group"]', stack());
  w.eval("closeModal('modal-group')"); await tick();
  t('grup penceresi kapandi, detay duruyor', stack()==='["modal-group-detail"]', stack());

  console.log('[9] KEREM VAKASI: Yeni Grup → + Yeni Uye → Kaydet(uye) → grup penceresi ACIK ve uye isaretli → Kaydet(grup)');
  await reset();
  w.eval("openGroupModal(); quickAddMemberFromGroup('');"); await tick();
  t('on kosul: yigin grup>uye', stack()==='["modal-group","modal-member"]', stack());
  w.eval("document.getElementById('mm-name').value='YENI UYE'; saveMember();"); await tick(150);
  t('uye kaydi sonrasi grup penceresi ACIK (yigin = [grup])', stack()==='["modal-group"]', stack());
  t('yeni uye grup penceresinde isaretli', w.eval("[...document.querySelectorAll('#mg-members input.gm-mc:checked')].length")===1 && w.eval("[...document.querySelectorAll('#mg-members input.gm-mc:checked')].map(x=>state.members.find(m=>m.id===x.value).name).join()")==='YENI UYE');
  w.eval("document.getElementById('mg-time').value='11:00'; document.querySelectorAll('#mg-days input[data-gday]').forEach(function(c){ if(c.getAttribute('data-gday')==='2') c.checked=true; }); document.getElementById('mg-size').value='2'; saveGroup();"); await tick(150);
  t('grup kaydedildi, yeni uye GRUPTA (bireysel DEGIL)', w.eval(`(function(){ const m=state.members.find(x=>x.name==='YENI UYE'); return !!memberActiveGroupForMonth(m.id,'${CM}'); })()`)===true);

  console.log('[10] TAM TARAMA: "+ BOS slot" → "+ Yeni Uye Olustur ve Ekle" → uye o ayin KADROSUNDA (anlik goruntu varken de)');
  await reset();
  w.eval(`state.groups[0].monthlyMembers={'${CM}':['A','B']};`); // gercek hayattaki gibi: o ay icin kadro anlik goruntusu VAR
  w.eval("state.groups[0].size=3; fillEmptySlot('G1', 2); startNewMemberForSlot('G1', 2);"); await tick();
  w.eval("document.getElementById('mm-name').value='SLOT UYESI'; saveMember();"); await tick(150);
  { const r = JSON.parse(w.eval(`(function(){ const m=state.members.find(x=>x.name==='SLOT UYESI'); const g=state.groups.find(x=>x.id==='G1'); return JSON.stringify({ kadroda: activeGroupRosterForMonth(g,'${CM}').includes(m.id), tip:(buildMemberRows('${CM}').find(r=>r.memberId===m.id)||{}).type, katilim: !!(g.memberJoinDates||{})[m.id], derste: state.lessons.some(l=>l.groupId==='G1'&&(l.memberIds||[]).includes(m.id)), yigin: __modalStack.slice() }); })()`));
    t('yeni uye o ayin kadrosunda', r.kadroda===true, JSON.stringify(r));
    t('Uyeler satiri tipi = group (bireysel DEGIL)', r.tip==='group', r.tip);
    t('katilim tarihi yazildi + ileri derslere eklendi', r.katilim && r.derste, JSON.stringify(r));
    t('pencere yigini bos (ana sayfada, slot penceresi kapali)', r.yigin.length===0 && !d.getElementById('modal-fill-slot'), JSON.stringify(r.yigin)); }

  console.log('[11] history imleci tutarli: kapattiktan sonra gecerli kayit alttaki detayi gosterir');
  await reset();
  w.eval(`openGroupDetail('G1','${CM}'); openPaymentModal('A', null, 'G1', '${CM}');`); await tick();
  w.eval("closeModal('modal-payment')"); await tick();
  t('history.state = grup detayi (alttaki pencere)', JSON.stringify((w.history.state||{}).pilateriaModal)==='"modal-group-detail"', JSON.stringify(w.history.state));

  console.log('[12] CIFT KAPATMA (mobilde cift dokunma / cift cagri): ✕ x2 → yalniz ust pencere kapanir, detay KALIR');
  await reset();
  w.eval(`openGroupDetail('G1','${CM}'); openPaymentModal('A', null, 'G1', '${CM}');`); await tick();
  w.eval("(function(){ const x=document.querySelector('#modal-payment .modal-close-x'); x.click(); x.click(); })()"); await tick(150);
  t('✕ cift tiklama: yigin = [grup detayi]', stack()==='["modal-group-detail"]', stack());
  t('grup detayi hala ACIK', isOpen('modal-group-detail'));
  await reset();
  w.eval(`openMemberDetail('C','${CM}'); openMemberModal('C');`); await tick();
  w.eval("(function(){ const x=document.querySelector('#modal-member .modal-close-x'); x.click(); x.click(); })()"); await tick(150);
  t('uye detayi > Duzenle > ✕ cift tiklama: yigin = [uye detayi]', stack()==='["modal-member-detail"]', stack());
  t('uye detayi hala ACIK', isOpen('modal-member-detail'));

  console.log('[13] KAPAT + HEMEN AC: takvim ders secici → ders penceresi ACIK KALIR (bekleyen geri, yeni pencereyi kapatmaz)');
  await reset();
  w.eval(`switchPage('calendar'); openLessonPicker('${FUT}', '10:00');`); await tick();
  t('on kosul: yigin = [secici]', stack()==='["modal-lesson-picker"]', stack());
  w.eval("document.querySelector('#lpk-body .lpk-item').click();"); await tick(200);
  t('secici kapandi, ders penceresi ACIK (yigin = [ders])', stack()==='["modal-lesson"]', stack());
  t('history.state = ders penceresi (kayit yeniden yazildi)', JSON.stringify((w.history.state||{}).pilateriaModal)==='"modal-lesson"', JSON.stringify(w.history.state));
  w.eval("closeModal('modal-lesson')"); await tick(200);
  t('ders penceresi kapaninca yigin bos', stack()==='[]', stack());
  t('acik pencere yok', !d.querySelector('.modal-bg.open'));

  console.log('[14] KAPAT + HEMEN AC: Yeni Grup → ayni kadro ZATEN AKTIF → Vazgec → o grubun detayi acilir ve ACIK KALIR');
  await reset();
  w.eval("switchPage('groups'); openGroupModal();"); await tick();
  // A ve B zaten G1'de → listede ancak "Baska grupta olanlar" acilinca gorunur
  w.eval("document.getElementById('mg-show-all').checked=true; renderGroupMembersCheckboxes([], ''); document.querySelectorAll('#mg-members input.gm-mc').forEach(function(c){ c.checked = (c.value==='A'||c.value==='B'); }); document.getElementById('mg-size').value='2'; document.getElementById('mg-time').value='10:00'; document.querySelectorAll('#mg-days input[data-gday]').forEach(function(c){ if(c.getAttribute('data-gday')==='1') c.checked=true; });");
  { const __oldConfirm = w.confirm; let __seen = false; w.confirm = (m) => { if (String(m).indexOf('ZATEN AKT') >= 0) { __seen = true; return false; } return true; };
    w.eval("saveGroup();"); await tick(250);
    w.confirm = __oldConfirm;
    t('"zaten aktif" uyarisi soruldu', __seen);
    t('grup penceresi kapandi, mevcut grubun DETAYI ACIK (yigin = [grup detayi])', stack()==='["modal-group-detail"]', stack());
    t('history.state = grup detayi', JSON.stringify((w.history.state||{}).pilateriaModal)==='"modal-group-detail"', JSON.stringify(w.history.state));
    t('yeni grup kaydi ACILMADI (hala 1 grup)', w.eval('state.groups.length')===1, w.eval('state.groups.length')); }

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
