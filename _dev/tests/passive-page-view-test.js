// v159 — PASIF UYELER: AY BAZLI / GENEL GORUNUM + PASIFE ALINMA TARIHINE GORE SIRA (Kerem):
// "pasif uye listesinde ay bazli gorunumde olmali genel gorunumde olmali secenekli yap.
//  Pasife alinma tarihine gore sirali olmali en yeni en ustte."
// KURALLAR:
//  - Sayfada gorunum secici: 🗓️ Ay Bazli (secili ayda pasif olanlar — mevcut davranis) /
//    🌐 Genel (ay filtresi yok: bugun pasif olan HERKES + sonraki aydan silinmis olanlar).
//    Secim state.settings.passiveView'da kalicidir; Genel'de ay kutusu gizlenir.
//  - HER IKI gorunum de pasife alinma tarihine gore YENI->ESKI siralanir (esitlikte ada gore).
//    Tarih kaynagi passiveSinceMonth: archivedAt > ayi kapsayan donem from > gelecekte baslayan
//    donem from > acik cikarma (enrolled:false) ayi > son aktif kaydin/dersin ertesi ayi.
//  - v151 kanonu korunur: gezinme listesi (passiveNavListForMonth) sayfayla AYNI sirayi kullanir.
// Yamasiz build'de FAIL etmeli (setPassiveView yok; siralama ada gore).
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
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
setTimeout(()=>{ try {
  const CM = w.eval('currentMonth()');
  const PM = shiftM(CM,-1), P2 = shiftM(CM,-2), NM = shiftM(CM,+1);
  w.eval(`
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[]; state.lessons=[]; state.payments=[];
    state.members=[
      // ZEYNEP: bu ay ARSIVLENDI (archivedAt CM) — tarih sirasinda EN YENI (ay bazli gorunumde)
      {id:'mA',name:'ZEYNEP ARSIVLI',joinDate:'2026-01-01',packages:[],monthly:{},archived:true,archivedAt:'${CM}-10T00:00:00',archivedReason:'manual'},
      // AYLA: PM'den beri acik donemle pasif
      {id:'mB',name:'AYLA PASIF',joinDate:'2026-01-01',packages:[],monthly:{'${PM}':{enrolled:false}},archivePeriods:[{from:'${PM}',to:null}]},
      // BETUL: son aktif kaydi P2 — o zamandan beri sessiz (turetilmis pasif baslangici P2+1=PM)
      {id:'mC',name:'BETUL ESKI',joinDate:'2026-01-01',packages:[],monthly:{'${P2}':{enrolled:true}}},
      // DILARA: BU AY AKTIF ama SONRAKI AYDAN SILINMIS -> ay bazli (CM) listede YOK, GENEL listede VAR (en yeni)
      {id:'mD',name:'DILARA SONAY',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true},'${NM}':{enrolled:false}},archivePeriods:[{from:'${NM}',to:null}]}
    ];
    state.groups=[];
  `);

  console.log('[1] fonksiyonlar (yamasizda FAIL)');
  t('setPassiveView var', w.eval("typeof setPassiveView")==='function', w.eval("typeof setPassiveView"));
  t('passiveSinceMonth var', w.eval("typeof passiveSinceMonth")==='function');

  console.log('[2] AY BAZLI gorunum: tarihe gore YENI->ESKI (ada gore degil)');
  w.eval(`state.settings.passiveView='month';`);
  const am = d.getElementById('archive-month'); if (am) am.value = CM;
  w.renderArchive();
  const tb = d.getElementById('archive-tbody').innerHTML;
  t('DILARA (bu ay aktif) ay-bazli listede DEGIL', tb.indexOf('DILARA SONAY')===-1);
  const sira = ['ZEYNEP ARSIVLI','AYLA PASIF','BETUL ESKI'].map(nm=>tb.indexOf(nm));
  t('siralama tarih DESC: ZEYNEP(${CM}) once AYLA/BETUL(PM)', sira[0]!==-1 && sira[0]<sira[1] && sira[0]<sira[2], JSON.stringify(sira));
  t('esitlikte ada gore: AYLA once BETUL (ikisi de PM)', sira[1]!==-1 && sira[1]<sira[2], JSON.stringify(sira));
  t('ay kutusu ay-bazli gorunumde GORUNUR', am && am.style.display!=='none');

  console.log('[3] GENEL gorunum: sonraki aydan silinen de listede, en yeni en ustte');
  w.setPassiveView('all');
  const tb2 = d.getElementById('archive-tbody').innerHTML;
  t('tercih kaydedildi (settings.passiveView=all)', w.eval("state.settings.passiveView")==='all');
  t('DILARA SONAY (NM-den silinmis) GENEL listede', tb2.indexOf('DILARA SONAY')!==-1, tb2.slice(0,120));
  const sira2 = ['DILARA SONAY','ZEYNEP ARSIVLI','AYLA PASIF','BETUL ESKI'].map(nm=>tb2.indexOf(nm));
  t('sira: DILARA(NM) > ZEYNEP(CM) > AYLA/BETUL(PM)', sira2.every(i=>i!==-1) && sira2[0]<sira2[1] && sira2[1]<sira2[2] && sira2[2]<sira2[3], JSON.stringify(sira2));
  t('ay kutusu GENEL gorunumde GIZLI', am && am.style.display==='none');

  console.log('[4] gezinme listesi sayfayla ayni sirada (v151) + geri donus');
  const nav = w.eval(`JSON.stringify(passiveNavListForMonth('${CM}').map(m=>m.id))`);
  t('passiveNavListForMonth tarih sirali (mA ilk)', JSON.parse(nav)[0]==='mA', nav);
  w.setPassiveView('month');
  t('ay bazliya geri donus + ay kutusu geri geldi', w.eval("state.settings.passiveView")==='month' && am.style.display!=='none');

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
