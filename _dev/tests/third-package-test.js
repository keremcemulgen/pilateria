// v149 — 3. PAKET (VE SONRASI) AYNI KURALLARLA (Kerem: "3.pakete de aynı kurallar ile izin versin,
// şuan sadece 2.pakete izin veriyor").
// KOK KISIT UI'DAYDI: buton yalniz ASIL uyede gorunuyordu (!secondOfMember) ve etiketi sabit
// "+ 2. Paket" idi; motor (createSecondPackage) zaten N. paketi dogru numaralandiriyor.
// KURAL (v149): buton pasif olmayan HER kayitta (asil + klon) gorunur; etiket dinamik
// "+ N. Paket" (N = asilin AKTIF klon sayisi + 2); klondan basilirsa ASILA baglanir (zincir degil);
// v52/v58/v59 kurallari aynen: kisi sayisi degismez, acilan aya kayitli, arsiv bagimsiz.
// Yamasiz build'de FAIL etmeli (etiket sabit + klonda buton yok + toast sabit).
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
    w.alert=()=>{};w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
    w.__confirms=[]; w.confirm=(msg)=>{ w.__confirms.push(String(msg||'')); return true; };
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  const CM = w.eval('currentMonth()');
  w.eval(`
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[{id:'mR',name:'AYSE YILMAZ',joinDate:'2026-01-01',totalPrice:8000,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}}];
    state.groups=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
  `);
  const md = () => d.getElementById('modal-member-detail').innerHTML;

  console.log('[1] TEMEL: klon yokken asil uyede "+ 2. Paket"');
  w.openMemberDetail('mR');
  t('asil uyede + 2. Paket butonu', md().indexOf('+ 2. Paket') !== -1);

  console.log('[2] 2. PAKET ACILDIKTAN SONRA: etiket "+ 3. Paket"e ILERLER');
  w.createSecondPackage('member','mR',CM);
  const c2 = w.eval("state.members.find(m=>m.secondOfMember==='mR')");
  t('(2. Paket) klonu olustu', !!c2 && /\(2\. Paket\)/.test(c2.name), c2&&c2.name);
  w.openMemberDetail('mR');
  t('asil uyede etiket artik "+ 3. Paket"', md().indexOf('+ 3. Paket') !== -1, (md().match(/\+ \d+\. Paket/g)||[]).join(','));
  t('eski sabit "+ 2. Paket" etiketi kalmadi', md().indexOf('+ 2. Paket') === -1);

  console.log('[3] KLON KAYITTA DA BUTON VAR (3. paket klondan da acilabilir)');
  w.openMemberDetail(c2.id);
  t('klon detayinda "+ 3. Paket" butonu', md().indexOf('+ 3. Paket') !== -1, (md().match(/\+ \d+\. Paket/g)||[]).join(','));

  console.log('[4] 3. PAKET KLONDAN ACILIR: ASILA baglanir, ayni kurallar');
  w.createSecondPackage('member', c2.id, CM);
  const c3 = w.eval("state.members.filter(m=>m.secondOfMember==='mR').find(m=>/\\(3\\. Paket\\)/.test(m.name))");
  t('(3. Paket) klonu olustu', !!c3, w.eval("state.members.map(m=>m.name).join(' | ')"));
  t('3. paket ASILA bagli (zincir degil)', c3 && c3.secondOfMember === 'mR');
  t('acilan aya kayitli (v58 kurali)', c3 && c3.monthly && (c3.monthly[CM]||{}).enrolled === true);
  t('onay metni "(3. Paket)" der', w.__confirms.some(m=>m.indexOf('(3. Paket)') !== -1));

  console.log('[5] AYNI KURALLAR: kisi sayisi + bagimsiz arsiv');
  const kisi = w.eval("state.members.filter(m=>!m.secondOfMember && isMemberEnrolledInMonth(m.id,'"+CM+"')).length");
  t('kisi sayisi hala 1 (klonlar sayilmaz — v59)', kisi === 1, kisi);
  w.eval("state.members.find(m=>m.id==='mR').archived = true;");
  t('asil pasif olsa da 3. paket AKTIF (bagimsiz arsiv)', w.eval("isMemberInactiveInMonth(state.members.find(m=>/\\(3\\. Paket\\)/.test(m.name)), '"+CM+"')") === false);
  w.eval("state.members.find(m=>m.id==='mR').archived = false;");

  console.log('[6] NUMARALAMA ILERLER VE ARSIVLE GERI SARAR');
  w.openMemberDetail('mR');
  t('2 aktif klonla etiket "+ 4. Paket"', md().indexOf('+ 4. Paket') !== -1, (md().match(/\+ \d+\. Paket/g)||[]).join(','));
  w.eval("state.members.find(m=>/\\(3\\. Paket\\)/.test(m.name)).archived = true;");
  w.openMemberDetail('mR');
  t('3. paket arsivlenince etiket "+ 3. Paket"e doner', md().indexOf('+ 3. Paket') !== -1, (md().match(/\+ \d+\. Paket/g)||[]).join(','));
  w.closeModal('modal-member-detail');

  console.log('[7] KAYNAK: toast metni sabit "2. paket" degil, dinamik');
  t("plToast('2. paket için...) sabiti kalknis", html.indexOf("plToast('2. paket için") === -1);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
