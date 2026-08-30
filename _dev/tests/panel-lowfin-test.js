// v147+v148 — PANEL "1 DERSI KALAN / BITEN" AY-BAGIMSIZ (Kerem: "bu aylik bir sey degil —
// temmuzdan veya daha onceki aylardan sarkan derslerde gozukmeli, takvimdeki gibi").
// KURAL: Her birimin (grup / bireysel uye) SU AN UZERINDE OLDUGU paket = iptal-olmayan dersi
// bulunan EN SON paket ayi. O paketin YAPILDI+YANDI toplami hak-1 -> "1 ders kaldi",
// hak ve ustu (veya v108 erken kapanis) -> "Bitti". PLANLI dersler tuketime SAYILMAZ ama
// birimin hangi pakete gectigini belirler (yeni ay planlandiysa eski ay artik konu degil —
// "temmuz dersleri bitmeden agustos paketi sorun olmaz"in tersi). Gecmis aydan sarkan paket
// satirinda takvimdeki gibi 📦 ay etiketi olur; "Bitti" satirlari en fazla 1 onceki aydan
// gosterilir (cok eski bitmisler = ayrilmis uye, liste kirletmez), "1 ders kaldi" YAS SINIRSIZ
// (sarkan ders hala yapilmali). v146 (panel-ayi-filtreli) build'de FAIL etmeli.
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
function ev(x){ return w.eval(x); }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
setTimeout(()=>{ try {
  const CM = ev('currentMonth()');
  const PM = shiftM(CM,-1), P2 = shiftM(CM,-2), P3 = shiftM(CM,-3);
  // ders ureteci: paket AYI parametreli (sarkan paketler icin), istege bagli "son ders" indeksi
  w.eval(`
    window.__mk = function(pref, ownerTip, ownerId, gid, mids, ay, stz, lastIdx){
      stz.forEach(function(st, i){
        state.lessons.push({id:pref+i, date:ay+'-'+String((i%26)+2).padStart(2,'0'), time:'10:00', durationMin:45,
          instructorId:'h1', size:(mids||[]).length||1, memberIds:(mids||[]).slice(), groupId:gid||'',
          packageMonth:ay, packageOwnerType:ownerTip, packageOwnerId:ownerId, status:st,
          isLastOfPackage:(lastIdx===i)||undefined});
      });
    };
    state.packageTypes=[]; state.campaigns=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const M=function(id,ad,aylar){ const mo={}; (aylar||[]).forEach(function(a){ mo[a]={enrolled:true}; });
      return {id:id,name:ad,joinDate:'2026-01-01',totalPrice:4000,packages:[],monthly:mo}; };
    // v157 fixture gercekciligi: HER GRUBUN KENDI uye cifti var — ayni iki kisiyi 4 gruba koymak
    // v157 "uyesi devam eden Biten duser" kuralinda sahte devamlilik uretiyordu (gercekte olmaz).
    const G=function(id,ad,aylar,mids){ mids=mids||['u3','u4']; const mm={}; (aylar||[]).forEach(function(a){ mm[a]=mids.slice(); });
      return {id:id,name:ad,size:2,memberIds:mids.slice(),packages:[],monthlyMembers:mm,monthlyNotes:{}}; };
    state.members=[M('u1','AYLIN TEK',['${CM}']),M('u2','BERNA BITEN',['${CM}']),
      M('u3','CEREN GRUPTA',['${PM}','${CM}']),M('u4','DERIN GRUPTA',['${PM}','${CM}']),
      M('u6','FUNDA PLANLI',['${CM}']),M('u7','HALE ERKEN',['${CM}']),
      M('u8','SEVIM SARKAN',['${P2}']),M('u9','ZUHAL ESKIBITEN',['${P3}']),
      Object.assign(M('u10','PASIF GIDEN',['${PM}']),{archived:true, archivedAt:'${CM}-05T00:00:00'}), // v153: bitirdi + PASIFE ALINDI -> listede olmamali
      M('u11','NALAN BITTIPM',['${PM}']),M('u12','OYA BITTIPM',['${PM}']),
      M('u13','PERI ROLL',['${PM}','${CM}']),M('u14','RANA ROLL',['${PM}','${CM}'])];
    state.groups=[
      G('gpm','G SARKAN',['${PM}']),
      G('gbitpm','G BITTIPM',['${PM}'],['u11','u12']),
      G('groll','G ROLL',['${PM}','${CM}'],['u13','u14']),
      G('gcm','G CMSON',['${CM}']),
      {id:'gyetim',name:'G YETIM',size:2,memberIds:[],packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:4500,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
      {id:'gpasif',name:'G PASIF',size:2,memberIds:['u3','u4'],packages:[],monthlyMembers:{'${PM}':['u3','u4']},monthlyNotes:{},archived:true,archivedAt:'${CM}-05T00:00:00'} // v153: bitirdi + grup PASIFE ALINDI -> listede olmamali
    ];
    state.lessons=[];
    __mk('a','group','gpm','gpm',['u3','u4'],'${PM}',['completed','completed','completed','completed','completed','completed','completed']); // PM 7/8 -> SARKAN, listede
    __mk('b','group','gbitpm','gbitpm',['u11','u12'],'${PM}',['completed','completed','completed','completed','completed','completed','completed','completed']); // PM 8/8 -> Bitti (1 ay yas siniri icinde)
    __mk('r1','group','groll','groll',['u13','u14'],'${PM}',['completed','completed','completed','completed','completed','completed','completed','completed']); // PM 8/8...
    __mk('r2','group','groll','groll',['u13','u14'],'${CM}',['completed','completed','completed']); // ...ama CM paketi BASLAMIS -> PM artik konu degil, CM 3/8 -> listede YOK
    __mk('c','group','gcm','gcm',['u3','u4'],'${CM}',['completed','completed','completed','completed','completed','completed','completed','planned']); // CM 7/8 (+1 planli) -> listede
    __mk('d','member','u1','',['u1'],'${CM}',['completed','completed','completed','completed','completed','completed','missed']); // 6+1 yandi = 7/8
    __mk('e','member','u2','',['u2'],'${CM}',['completed','completed','completed','completed','completed','completed','missed','missed']); // 8/8 Bitti
    __mk('f','member','u6','',['u6'],'${CM}',['completed','completed','completed','completed','completed','planned','planned','planned']); // 5/8 -> YOK
    __mk('g','member','u7','',['u7'],'${CM}',['completed','completed','completed'], 2); // erken kapanis 3/8 -> Bitti
    __mk('s','member','u8','',['u8'],'${P2}',['completed','completed','completed','completed','completed','completed','completed']); // P2 7/8 -> SARKAN, yas SINIRSIZ listede
    __mk('z','member','u9','',['u9'],'${P3}',['completed','completed','completed','completed','completed','completed','completed','completed']); // P3 8/8 -> v153: sonrasinda DERS GIRILMEMIS + pasif degil -> LISTEDE KALIR
    __mk('p','member','u10','',['u10'],'${PM}',['completed','completed','completed','completed','completed','completed','completed','completed']); // PM 8/8 ama PASIFE ALINDI -> listede DEGIL
    __mk('q','group','gpasif','gpasif',['u3','u4'],'${PM}',['completed','completed','completed','completed','completed','completed','completed','completed']); // PM 8/8 ama grup PASIF -> listede DEGIL
  `);
  w.renderDashboard();
  const lh = d.getElementById('low-members').innerHTML;
  const pmLbl = ev("pkgMonthLabel('"+PM+"')");

  console.log('[1] AY-BAGIMSIZ: sarkan paketler de listede (panel ayi filtresi YOK)');
  t('onceki ay 7/8 grubu LISTEDE (G SARKAN)', /G SARKAN/.test(lh), lh.slice(0,200));
  t('onceki ay 8/8 grubu LISTEDE (G BITTIPM)', /G BITTIPM/.test(lh));
  t('2 ay onceki 7/8 bireysel LISTEDE — sarkan ders yas sinirsiz (SEVIM)', /SEVIM SARKAN/.test(lh));
  t('yeni ay paketi BASLAMISSA eski ay artik konu degil (G ROLL yok)', !/G ROLL/.test(lh));
  console.log('[1b] v153: Bitti satiri DERS GIRILENE ya da PASIFE ALINANA kadar kalir');
  t('eski bitmis ama ders girilmemis + AKTIF uye LISTEDE KALIR (ZUHAL, yas siniri yok)', /ZUHAL/.test(lh), (lh.match(/ZUHAL[^<]*/)||[''])[0]);
  t('bitirdikten sonra PASIFE ALINAN uye listede DEGIL (PASIF GIDEN)', !/PASIF GIDEN/.test(lh));
  t('bitirdikten sonra PASIFE ALINAN grup listede DEGIL (G PASIF)', !/G PASIF\b/.test(lh));

  console.log('[2] OLCUT AYNEN v146: yapildi+yandi; planli sayilmaz');
  t('bu ay 7/8 (+1 planli) grup listede (G CMSON)', /G CMSON/.test(lh));
  t('6+1 yandi bireysel listede (AYLIN 7/8)', /AYLIN TEK/.test(lh));
  t('8/8 bireysel Bitti (BERNA)', /BERNA BITEN/.test(lh));
  t('5 yapildi + 3 planli LISTEDE DEGIL (FUNDA)', !/FUNDA PLANLI/.test(lh));
  t('erken kapanan listede (HALE, v108)', /HALE ERKEN/.test(lh));
  t('grup uyesinin BIREYSEL satiri YOK (CEREN)', !/CEREN GRUPTA<\/span>|👤 CEREN/.test(lh));
  t('yetim/bos kadrolu grup listede DEGIL', !/G YETIM/.test(lh));

  console.log('[3] ROZETLER: sayi + durum + takvimdeki gibi 📦 ay etiketi');
  t('7/8 — 1 ders kaldi rozeti', lh.indexOf('⏳ 7/8 — 1 ders kaldı') !== -1);
  t('8/8 — Bitti rozeti', lh.indexOf('✅ 8/8 — Bitti') !== -1);
  t('erken kapanista 3/8 — Bitti', lh.indexOf('✅ 3/8 — Bitti') !== -1);
  t('sarkan satirda 📦 + ay adi (' + pmLbl + ')', lh.indexOf('📦 ' + pmLbl) !== -1);
  t('📦 yalniz sarkanlarda (4 adet: gpm, gbitpm, u8, u9)', lh.split('📦').length - 1 === 4, lh.split('📦').length - 1);
  const satirlar = lh.split('class="row between"').length - 1;
  t('8 satir (gpm,gbitpm,gcm + u1,u2,u7,u8,u9)', satirlar === 8, satirlar);

  console.log('[4] SATIR -> DETAY: sarkan satir KENDI ayinin detayina gider + SAYAC + SIRA');
  t('sarkan grup satiri o ayin detayina', lh.indexOf("openGroupDetail('gpm','"+PM+"')") !== -1);
  t('bu ay grubu bu ayin detayina', lh.indexOf("openGroupDetail('gcm','"+CM+"')") !== -1);
  t('uye satiri da AY iletir (v148 — Kerem: bos Agustos acilmasin)', lh.indexOf("openMemberDetail('u1','"+CM+"')") !== -1, lh.match(/openMemberDetail\([^)]*\)/g));
  t('sarkan uye satiri KENDI ayini iletir (u8 -> '+P2+')', lh.indexOf("openMemberDetail('u8','"+P2+"')") !== -1);
  t('ust kutu sayaci 8', d.getElementById('s-low').textContent === '8', d.getElementById('s-low').textContent);
  t('baslik sayaci (3 grup, 5 üye) — ay YOK', /\(3 grup, 5 üye\)/.test(d.getElementById('lowfin-count').textContent), d.getElementById('lowfin-count').textContent);
  t('siralama: 1-kalanlar ustte, bitenler altta', lh.indexOf('1 ders kaldı') < lh.indexOf('— Bitti'));
  t('siralama: 1-kalanlarda eski ay once (SEVIM P2 < G SARKAN PM)', lh.indexOf('SEVIM SARKAN') < lh.indexOf('G SARKAN'));
  t('siralama: bitenlerde de eski ay once (ZUHAL P3 < G BITTIPM PM)', lh.indexOf('ZUHAL') < lh.indexOf('G BITTIPM'));

  console.log('[5] UYE DETAYI VERILEN AYDA ACILIR (v148 kok neden: ctxAy parametresizdi)');
  w.openMemberDetail('u8', P2); // sarkan satirdan acilis
  const mdn = () => d.getElementById('md-name').innerHTML;
  const mdBody = () => d.getElementById('modal-member-detail').innerHTML;
  t('baslikta paketin ayi (— '+P2+')', mdn().indexOf('— '+P2) !== -1, mdn());
  t('istatistikler o ayin: Yapılan Ders ('+P2+')', mdBody().indexOf('Yapılan Ders ('+P2+')') !== -1);
  t('o ayin dersleri gorunur (7 yapildi — bos degil)', mdBody().indexOf(P2+' Dersleri (7)') !== -1);
  w.eval('refreshMemberDetailIfOpen()'); // cross-modal yenileme (odeme kaydi vb.)
  t('yenileme ay baglamini KORUR (— '+P2+' kalir)', mdn().indexOf('— '+P2) !== -1, mdn());
  w.openMemberDetail('u1'); // navigasyon/normal acilis: ay verilmedi -> varsayilana doner
  t('baska uyeye ay TASINMAZ (u1 varsayilan '+CM+')', mdn().indexOf('— '+CM) !== -1, mdn());
  w.closeModal('modal-member-detail');

  console.log('[6] BOS DURUM + STATIK');
  w.eval("state.lessons=[]; ");
  w.renderDashboard();
  t('bos mesaj ay-bagimsiz (Şu an ...)', /Şu an 1 dersi kalan ya da hakkı biten yok/.test(d.getElementById('low-members').innerHTML), d.getElementById('low-members').innerHTML.slice(0,120));
  t('stat etiketi guncel (1 Kalan / Biten)', html.indexOf('1 Kalan / Biten') !== -1);
  t('kart basligi guncel', html.indexOf('1 Dersi Kalan / Biten') !== -1);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
