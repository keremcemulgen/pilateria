// v129 — panel sabah WhatsApp raporu karti. Yamasiz build'de FAIL etmeli.
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
function stubSb(fixture){
  w.eval(`sbClient = { from: function(tab){ return { select: function(){ return { eq: function(){ return { maybeSingle: async function(){ return ${JSON.stringify(fixture)}; } }; } }; } }; } };`);
}
setTimeout(async ()=>{ try {
  const today = w.eval('todayISO()');

  console.log('[1] GOLGE raporu karti');
  t('__waMorningFetch fonksiyonu var', w.eval("typeof __waMorningFetch === 'function'"));
  stubSb({ data: { id: today, data: { mode:'shadow', toplam:18, uygun:0, sorunlu:18, gonderilen:0,
    kisiler: [
      { memberId:'m1', ad:'BERIL TEST', tel:'', e164:'', saat:'10:00', mesaj:'Merhaba BERIL', durum:'telefon-hatali' },
      { memberId:'m2', ad:'AYSE TEST', tel:'05551234567', e164:'905551234567', saat:'11:00', mesaj:'Merhaba AYSE', durum:'golge' }
    ] } }, error: null });
  await w.eval('__waMorningFetch()');
  const card = d.getElementById('dash-wa-morning');
  t('kart gorunur', !!card && card.style.display === 'block', card ? card.style.display : 'yok');
  t('GOLGE MOD rozeti + 18 uye', !!card && /GÖLGE MOD/.test(card.innerHTML) && /18/.test(card.innerHTML));
  t('sorunlu numara uyarisi', !!card && /18 sorunlu numara/.test(card.textContent));

  console.log('[2] detay modali');
  w.waMorningDetail();
  const mdl = d.getElementById('modal-wa-morning');
  t('modal acildi', !!mdl);
  t('uye satirlari listelendi', !!mdl && /BERIL TEST/.test(mdl.innerHTML) && /AYSE TEST/.test(mdl.innerHTML));
  t('hatali satirda 📞 Ekle kisayolu', !!mdl && /openMemberModal\('m1'\)/.test(mdl.innerHTML));
  t('golge aciklamasi (GONDERILMEDI)', !!mdl && /GÖNDERİLMEDİ/.test(mdl.innerHTML));
  if (mdl) mdl.remove();

  console.log('[3] CANLI raporu');
  stubSb({ data: { id: today, data: { mode:'live', toplam:14, uygun:14, sorunlu:1, gonderilen:13, kisiler: [] } }, error: null });
  await w.eval('__waMorningFetch()');
  t('canli: "13 gönderildi"', /13/.test(card.innerHTML) && /gönderildi/.test(card.textContent), card.textContent.slice(0,80));

  console.log('[4] tablo yoksa sessizce gizlenir');
  stubSb({ data: null, error: { code: '42P01' } });
  await w.eval('__waMorningFetch()');
  t('hata durumunda kart gizli', card.style.display === 'none');

  console.log('[5] panel kancasi');
  t('renderDashboard __waMorningFetch cagirir', html.includes('__waMorningFetch(); } catch(e){}'));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
