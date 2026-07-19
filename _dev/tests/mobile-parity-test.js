// v.36 MOBIL PARITE + JSONBin TEMIZLIK: pasif/odeme tablolari mobilde KART (resp-cards),
// pasif uyeler grup/ders secicide gorunur, JSONBin karti DOM'dan kaldirildi (null-guard'li).
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
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }

setTimeout(function(){ try {
  console.log('[1] resp-cards CSS + tablolara sinif');
  t("resp-cards CSS blogu var", /table\.resp-cards[\s\S]*?display:block/.test(html));
  t("resp-cards card-actions kurali var", /table\.resp-cards td\.card-actions/.test(html));
  t("pasif mobilde KART (#archive-cards .m-cards container)", /<div id="archive-cards" class="m-cards">/.test(html));
  t("pasif tablo mobilde gizli (#archive-table-wrap)", /#members-table-wrap, #archive-table-wrap \{ display:none/.test(html));
  t("odemeler tablo resp-cards", /<table class="resp-cards">[\s\S]*?<th>Kampanya<\/th>/.test(html));

  console.log('[2] Pasif MOBIL KARTLAR (.mc-card, uye kartlariyla ayni)');
  w.eval("['renderMembers','renderDashboard','renderGroups'].forEach(fn=>window[fn]=function(){});");
  w.eval("state.members=[{id:'PX',name:'PASIF UYE',phone:'555',joinDate:'2026-05-01',totalPrice:4000,monthly:{'2026-07':{enrolled:false}}}];");
  w.eval("state.payments=[]; state.lessons=[];");
  w.eval("var am=document.getElementById('archive-month'); if(am) am.value='2026-07'; renderArchive();");
  const cards = d.getElementById('archive-cards').innerHTML;
  t("pasif KART uretildi (.mc-card)", /class="mc-card"/.test(cards));
  t("kart mc-name + isim", /class="mc-name">PASIF UYE/.test(cards));
  t("kart 💤 Pasif rozeti (mc-status)", /class="mc-status due">💤 Pasif/.test(cards));
  t("kart Aktive Et butonu", /↩️ Aktive Et/.test(cards) && cards.indexOf('2026-07 Aktive Et')===-1);
  t("kart mc-actions (uye kartlariyla ayni yapi)", /class="mc-actions"/.test(cards));

  w.eval("state.members=[{id:'PR',name:'REASON UYE',phone:'',joinDate:'2026-05-01',totalPrice:4000,archived:true,archivedAt:'2026-07-01T00:00:00',archivedReason:'manual-delete',monthly:{'2026-07':{enrolled:false}}}]; state.payments=[]; state.lessons=[];");
  w.eval("var am2=document.getElementById('archive-month'); if(am2) am2.value='2026-07'; renderArchive();");
  const cards2 = d.getElementById('archive-cards').innerHTML;
  t("kart Sebep insan-dostu (manual-delete -> Elle pasife alindi)", cards2.indexOf('Elle pasife alındı')>=0 && cards2.indexOf('manual-delete')===-1);
  t("arsivli kartta Kalici Sil butonu", /🗑️ Sil/.test(cards2));

  console.log('[3] Grup secici: pasif uyeler VARSAYILAN gorunur');
  w.eval("state.members=[{id:'A1',name:'AKTIF',joinDate:'2026-01-01',archived:false},{id:'P1',name:'PASIF ARSIV',joinDate:'2026-01-01',archived:true}];");
  w.eval("state.groups=[]; state.instructors=[]; state.packageTypes=[];");
  w.eval("renderGroupMembersCheckboxes([], '');");
  const mg = d.getElementById('mg-members').innerHTML;
  t("arsivli (pasif) uye grup secicide GORUNUR (varsayilan)", mg.indexOf('PASIF ARSIV')>=0);
  t("pasif rozeti var", /archived-badge">Pasif/.test(mg));
  t("'Pasif üyeleri göster' onay kutusu var", /Pasif üyeleri göster/.test(html));

  console.log('[4] Ders secici (grupsuz): aramada pasif cikar + rozet');
  t("ders secici arama filtresi archived'i DISLAMAZ", !/!m\.archived && q\.length >= 2/.test(html));
  t("ders secici satirinda pasif rozeti", /m\.archived\?'<span class="archived-badge">Pasif<\/span>'/.test(html));

  console.log('[5] JSONBin karti DOM\'dan kaldirildi + guard');
  t("sync-key input DOM'da YOK", !d.getElementById('sync-key'));
  t("sync-bin input DOM'da YOK", !d.getElementById('sync-bin'));
  t("X-Master-Key gorunur placeholder YOK", html.indexOf('placeholder="$2a$10$')===-1);
  t("saveSyncConfig null-guard'li", /function saveSyncConfig\(\) \{\s*if \(!document\.getElementById\('sync-key'\)\) return;/.test(html));
  t("settings-render sync alanlari null-guard'li (__sk)", /const __sk = document\.getElementById\('sync-key'\); if \(__sk\)/.test(html));
  t("PIN yardim metni JSONBin'siz", html.indexOf('JSONBin.io panelinde Bin')===-1);

  console.log('[6] KOK: grup secici filtre kutulari (mg-show-archived/all) UYE SAYILMAZ');
  w.eval("state.groups=[{id:'gF',name:'GF',size:2,memberIds:['mA','mB'],customTotalPrice:8000,note:'',monthlyNotes:{}}]; state.members=[{id:'mA',name:'A',joinDate:'2026-01-01'},{id:'mB',name:'B',joinDate:'2026-01-01'}]; state.instructors=[]; state.packageTypes=[];");
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  w.eval("window.__groupOpsCtxMonth=function(){return '2026-07';};");
  w.eval("currentGroupDetailId='gF'; currentGroupDetailMonth='2026-07'; if(window.openGroupDetail) openGroupDetail('gF','2026-07');");
  w.eval("openGroupModal('gF');");
  // varsayilan pasif-goster ACIK -> mg-show-archived checked; uye kutulari .gm-mc
  const allChecked = [...d.querySelectorAll('#mg-members input[type=checkbox]:checked')].map(x=>x.value);
  const memberChecked = [...d.querySelectorAll('#mg-members input.gm-mc:checked')].map(x=>x.value);
  t("filtre kutusu ('on') genel :checked'te olabilir", true);
  t("uye kutusu sorgusu (.gm-mc) yalniz gercek uyeler", memberChecked.every(v=>v==='mA'||v==='mB') && memberChecked.length===2, JSON.stringify(memberChecked));
  t("uye kutusu sorgusunda 'on' YOK", memberChecked.indexOf('on')===-1);
  // saveGroup notu dogru aya yazsin (filtre kutusu size'i sismesin)
  w.eval("d=document; document.getElementById('mg-note').value='TEMMUZ NOTU F';");
  w.eval("saveGroup();");
  const gF = w.eval("JSON.parse(JSON.stringify(state.groups.find(g=>g.id==='gF')))");
  t("saveGroup memberIds'e 'on' KATMADI", JSON.stringify(gF.memberIds)===JSON.stringify(['mA','mB']), JSON.stringify(gF.memberIds));
  t("Temmuz notu kaydedildi (filtre kutusu engellemedi)", (gF.monthlyNotes||{})['2026-07']==='TEMMUZ NOTU F', JSON.stringify(gF.monthlyNotes));

  console.log('[7] autoGroupName tam-isim + __isAutoGroupName + slot secici pasif');
  w.eval("state.members=[{id:'g1',name:'GOKCE KURT',joinDate:'2026-01-01'},{id:'g2',name:'GIZEM DOGAN',joinDate:'2026-01-01'},{id:'pz',name:'PASIF ZEHRA',joinDate:'2026-01-01',archived:true,archivedAt:'2026-06-01T00:00:00'}];");
  t("autoGroupName TAM isim ' - ' ile birlesir", w.eval("autoGroupName(['g1','g2'])")==='GOKCE KURT - GIZEM DOGAN', w.eval("autoGroupName(['g1','g2'])"));
  t("__isAutoGroupName yeni format taninir", w.eval("__isAutoGroupName('GOKCE KURT - GIZEM DOGAN',['g1','g2'])")===true);
  t("__isAutoGroupName ESKI '/' format da taninir", w.eval("__isAutoGroupName('GOKCE/GIZEM',['g1','g2'])")===true);
  t("__isAutoGroupName gercek elle-yazilmis ad KORUNUR", w.eval("__isAutoGroupName('SABAH GRUBU',['g1','g2'])")===false);
  // slot secici: arsivli uye gorunur + Pasif rozeti
  w.eval("['renderMembers','renderGroups','renderDashboard','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  w.eval("window.__groupOpsCtxMonth=function(){return '2026-07';};");
  w.eval("state.groups=[{id:'gS',name:'GOKCE KURT - GIZEM DOGAN',size:3,memberIds:['g1','g2'],monthlyNotes:{}}];");
  w.eval("fillEmptySlot('gS',2);");
  const fs = (d.getElementById('modal-fill-slot')||{}).innerHTML || '';
  t("slot secici PASIF uyeyi gosterir", fs.indexOf('PASIF ZEHRA')>=0);
  t("slot secici Pasif rozeti var", /archived-badge">Pasif/.test(fs));

  console.log("\n=== mobile-parity: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
} catch(e){ console.error('HATA', e); process.exit(1); } }, 800);
