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

  console.log('[6] GRUP MESAJI HAZIRLAYICI (v130)');
  stubSb({ data: { id: today, data: { mode:'shadow', toplam:5, uygun:5, sorunlu:0, gonderilen:0,
    gruplar: [
      { groupId:'g1', ad:'BANU - DILA', saat:'10:00', mesaj:'Günaydın 🌸 Bugün 10:00 dersimiz var. Görüşmek üzere! — PİLATERİA' },
      { groupId:'g2', ad:'HULYA - NAZ', saat:'12:15', mesaj:'Günaydın 🌸 Bugün 12:15 dersimiz var. Görüşmek üzere! — PİLATERİA' }
    ],
    kisiler: [] } }, error: null });
  await w.eval('__waMorningFetch()');
  t('kartta "2 grup mesajı hazır"', /2<\/b> grup mesajı hazır/.test(card.innerHTML), card.textContent.slice(0,120));
  w.waMorningDetail();
  const m2 = d.getElementById('modal-wa-morning');
  t('modalde grup satirlari', !!m2 && /BANU - DILA/.test(m2.innerHTML) && /HULYA - NAZ/.test(m2.innerHTML));
  t('Kopyala dugmeleri var', !!m2 && (m2.innerHTML.match(/waCopyGroupMsg\(/g)||[]).length === 2);
  t('grup sohbetine otomatik gonderim olmadigi aciklanir', !!m2 && /otomatik gönderemez/.test(m2.innerHTML));
  w.eval("Object.defineProperty(navigator, 'clipboard', { value: { writeText: function(t){ window.__copied = t; return Promise.resolve(); } }, configurable: true });");
  w.waCopyGroupMsg(0);
  await new Promise(res => setTimeout(res, 50));
  t('kopyalanan metin dogru', /Bugün 10:00 dersimiz var/.test(w.eval("window.__copied || ''")), w.eval("(window.__copied||'').slice(0,50)"));
  if (m2) m2.remove();

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
