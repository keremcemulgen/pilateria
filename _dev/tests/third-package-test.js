// v149 — 3. PAKET (VE SONRASI) AYNI KURALLARLA + v150 — NUMARA SIRALI VE AY-BAGLAMLI
// (Kerem v150: "2.paketi olmayan uyeye +3.paket geliyor, bu sirayla olmali").
// v150 KURALI: bir numara ancak BAGLAM AYINDA KAYITLI (enrolled), arsivli olmayan bir klon
// tarafindan doludur; teklif = 2'den baslayan EN KUCUK bos numara. O numarali UYKUDA kayit
// (arsivli degil ama o ay kayitli degil) varsa YENIDEN ETKINLESTIRILIR — mukerrer kayit acilmaz.
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
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
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

  console.log('[8] v150 — UYKUDA KLON: gecmis ayda kalan 2. Paket bu ay sayaca GIRMEZ (Kerem vakasi)');
  const PM = shiftM(CM,-1);
  w.eval(`
    state.members.push({id:'mD',name:'DILEK KAYA',joinDate:'2026-01-01',totalPrice:8000,defaultPackageId:'p8',packages:[],monthly:{'${PM}':{enrolled:true},'${CM}':{enrolled:true}}});
    state.members.push({id:'cD2',name:'DILEK KAYA (2. Paket)',secondOfMember:'mD',joinDate:'2026-01-01',totalPrice:8000,defaultPackageId:'p8',packages:[],archived:false,monthly:{'${PM}':{enrolled:true}}}); // yalniz GECMIS ayda kayitli — bu ay uykuda
  `);
  w.openMemberDetail('mD');
  t('bu ay 2. paketi olmayan uyede buton "+ 2. Paket"', md().indexOf('+ 2. Paket') !== -1, (md().match(/\+ \d+\. Paket/g)||[]).join(','));
  t('"+ 3. Paket" TEKLIF EDILMEZ', md().indexOf('+ 3. Paket') === -1);
  const oncekiSayi = w.eval('state.members.length');
  w.eval('window.__confirms.length = 0;');
  w.createSecondPackage('member','mD',CM);
  t('YENI KAYIT ACILMAZ — uykudaki kayit yeniden kullanilir', w.eval('state.members.length') === oncekiSayi, w.eval('state.members.length') + ' vs ' + oncekiSayi);
  t('uykudaki (2. Paket) bu aya KAYITLANDI', w.eval("isMemberEnrolledInMonth('cD2','"+CM+"')") === true);
  t('onay metni yeniden etkinlestirmeyi soyler', w.__confirms.some(m=>/YENİDEN ETKİNLEŞTİR/i.test(m)), w.__confirms.join(' || ').slice(0,150));
  w.openMemberDetail('mD');
  t('yeniden etkinlestirme sonrasi buton "+ 3. Paket"e ilerler', md().indexOf('+ 3. Paket') !== -1);

  console.log('[9] v150 — BOSLUK: 2 arsivli + 3 bu ay kayitliyken teklif "+ 2. Paket" (mukerrer 3 acilmaz)');
  w.eval(`
    state.members.push({id:'mE',name:'EMEL SOY',joinDate:'2026-01-01',totalPrice:8000,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}});
    state.members.push({id:'cE2',name:'EMEL SOY (2. Paket)',secondOfMember:'mE',joinDate:'2026-01-01',totalPrice:8000,defaultPackageId:'p8',packages:[],archived:true,monthly:{'${CM}':{enrolled:true}}});
    state.members.push({id:'cE3',name:'EMEL SOY (3. Paket)',secondOfMember:'mE',joinDate:'2026-01-01',totalPrice:8000,defaultPackageId:'p8',packages:[],archived:false,monthly:{'${CM}':{enrolled:true}}});
  `);
  w.openMemberDetail('mE');
  t('bos numara 2 teklif edilir (3 doluyken)', md().indexOf('+ 2. Paket') !== -1, (md().match(/\+ \d+\. Paket/g)||[]).join(','));
  w.createSecondPackage('member','mE',CM);
  const e2ler = w.eval("state.members.filter(m=>m.secondOfMember==='mE' && /\\(2\\. Paket\\)/.test(m.name) && !m.archived).length");
  const e3ler = w.eval("state.members.filter(m=>m.secondOfMember==='mE' && /\\(3\\. Paket\\)/.test(m.name)).length");
  t('yeni kayit "(2. Paket)" olarak acildi (arsivli sayilmaz kanonu)', e2ler === 1, 'aktif2:'+e2ler);
  t('mukerrer "(3. Paket)" ACILMADI', e3ler === 1, '3lu:'+e3ler);
  w.closeModal('modal-member-detail');


  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
