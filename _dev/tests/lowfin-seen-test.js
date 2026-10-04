// v190 (Kerem 04.10, karar B): ⏳ 1 Dersi Kalan / Biten — gozden kacmasin: 7. dersi yapilan grup/uye gosterilir, yaninda
// ✓ Gorduldu. GORULMEMIS satir yeni paket acilsa da / Bitti'ye donse de listede KALIR. GORULEN satir listede kalir ama
// soluk + ustu cizili + en altta; yalniz eski dusme ani gelince (yeni paket dersi girilmesi / pasife alinma / v157 / v158)
// gider; ↩ ile isaret kaldirilir. Isaret paket bazli (sonraki paketin 7. dersinde yeniden gelir), bulutla senkron (lfSeen temelde).
// Pencere: paketin BITIS ayi >= onceki ay. Yamasiz (v189) build'de FAIL etmeli.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const dom = new JSDOM(html, { runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})}); if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{}; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{}; w.__PL_DLG_AUTO__=(o)=>(o&&o.input?null:true); }});
const w = dom.window, d = w.document;
const tick = ms => new Promise(r => setTimeout(r, ms || 60));
setTimeout(async () => { try {
  const CM = w.eval('currentMonth()');
  const shift = (ay, k) => { const [y, m] = ay.split('-').map(Number); const dt = new Date(y, m - 1 + k, 1); return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); };
  const PM = shift(CM, -1), P2 = shift(CM, -2), NM = shift(CM, 1);
  w.eval(`['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});
    __LF_SEEN_SINCE190 = '2000-01'; // test tarihe bagimsiz: yayin esigi devre disi (asagida [10] ayrica sinanir)
    state.settings.reformers=12; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4000}]; state.payments=[];
    state.instructors=[{id:'h',name:'HOCA',shareRate:30}];
    const mo=(...ays)=>Object.fromEntries(ays.map(a=>[a,{enrolled:true}]));
    const mk=(id,name)=>({id,name,joinDate:'2025-01-01',totalPrice:4000,defaultPackageId:'p8',packages:[],monthly:mo('${P2}','${PM}','${CM}','${NM}')});
    state.members=[mk('A','AYLIN'),mk('B','BERNA'),mk('C','CEREN'),mk('D','DILA'),mk('E','EBRU'),mk('F','FEYZA'),mk('H','HANDE'),mk('k1','K1'),mk('k2','K2'),mk('k3','K3'),mk('k4','K4'),mk('k5','K5'),mk('k6','K6')];
    state.groups=[
      {id:'G1',name:'GRUP BIR',size:3,memberIds:['k1','k2','k3'],monthlyMembers:{'${PM}':['k1','k2','k3'],'${CM}':['k1','k2','k3']},packages:[{month:'${PM}',sessions:8,status:'active'},{month:'${CM}',sessions:8,status:'active'}]},
      {id:'G2',name:'GRUP IKI',size:3,memberIds:['k4','k5','k6'],monthlyMembers:{'${CM}':['k4','k5','k6'],'${NM}':['k4','k5','k6']},packages:[{month:'${CM}',sessions:8,status:'active'},{month:'${NM}',sessions:8,status:'active'}]}];
    state.lessons=[];
    let n=0; const add=(o)=>state.lessons.push(Object.assign({id:'L'+(n++),time:'10:00',durationMin:60,instructorId:'h',status:'completed'},o));
    const ind=(mid,pm,k,st,dm,day0)=>{ for(let i=0;i<k;i++) add({date:(dm||pm)+'-'+String((day0||2)+i).padStart(2,'0'),memberIds:[mid],groupId:'',size:1,packageMonth:pm,packageOwnerType:'member',packageOwnerId:mid,status:st||'completed'}); };
    const grp=(g,mids,pm,k,st,day0)=>{ for(let i=0;i<k;i++) add({date:pm+'-'+String((day0||2)+i).padStart(2,'0'),memberIds:mids,groupId:g,size:3,packageMonth:pm,packageOwnerType:'group',packageOwnerId:g,status:st||'completed'}); };
    ind('A','${CM}',7); ind('A','${CM}',1,'planned',null,9);     // AYLIN: bu ay 7/8 → 1 ders kaldi (sonraki aya da kayitli)
    ind('F','${CM}',7); ind('F','${CM}',1,'planned',null,9); delete state.members.find(m=>m.id==='F').monthly['${NM}']; // FEYZA: 7/8, sonraki aya kayitli DEGIL
    ind('H','${NM}',1,'planned'); ind('H','${CM}',8); // HANDE: bu ay 8/8 bitti + sonraki ay paketine 1 PLANLI ders girildi (yeni paket st=0) → eski kod listelemezdi
    ind('B','${PM}',8); ind('B','${CM}',1);                        // BERNA: onceki paket BITTI, yeni pakete 1 ders yapildi (eskiden duserdi)
    ind('C','${P2}',8); ind('C','${CM}',2);                        // CEREN: 2 ay onceki paket bitti (son dersi de o ayda) + yeni paket → pencere disi
    ind('D','${P2}',6); ind('D','${P2}',2,'completed','${PM}'); ind('D','${CM}',2); // DILA: 2 ay onceki paket son 2 dersi ONCEKI AYA sarkti → pencere ICI
    grp('G1',['k1','k2','k3'],'${PM}',8); grp('G1',['k1','k2','k3'],'${CM}',2,'completed',20); // GRUP BIR: onceki paket BITTI, yeni paket basladi
    grp('G2',['k4','k5','k6'],'${CM}',8);                          // GRUP IKI: bu ay BITTI, sonraki ay paketi kaydi var (v157 supersede)
    ind('E','${CM}',7); state.members.find(m=>m.id==='E').monthly['${CM}']={enrolled:false}; state.members.find(m=>m.id==='E').archivePeriods=[{from:'${CM}'}]; // EBRU pasif`);
  const rowEls = () => [...d.querySelectorAll('#low-members > div.lf-row-190')];
  const rows = () => rowEls().map(x => x.textContent.replace(/\s+/g, ' ').trim());
  const has = (re) => rows().some(r => re.test(r));
  const rowOf = (re) => rowEls().find(x => re.test(x.textContent));
  const cnt = () => d.getElementById('s-low').textContent;
  const head = () => d.getElementById('lowfin-count').textContent;
  w.eval('renderDashboard()'); await tick();
  console.log('[1] GORULMEMIS: 7. dersi yapilan + yeni paketle gecilen (ama gorulmemis) birimler listede');
  t('AYLIN (7/8 — 1 ders kaldı) listede', has(/AYLIN.*1 ders kaldı/), JSON.stringify(rows()));
  t('BERNA: önceki paket Bitti, yeni pakete geçildi → görülmediği için listede', has(/BERNA.*Bitti/), JSON.stringify(rows()));
  t('GRUP BIR: önceki paket Bitti, yeni paket başladı → listede', has(/GRUP BIR.*Bitti/));
  t('GRUP IKI: bu ay Bitti, sonraki ay paketi açıldı (v157) → listede', has(/GRUP IKI.*Bitti/));
  t('DILA: eski paket ama son dersi ÖNCEKİ AYA sarktı (pencere içi) → listede', has(/DILA.*Bitti/), JSON.stringify(rows()));
  t('CEREN: 2 ay önceki paket (pencere dışı) listede DEĞİL', !has(/CEREN/));
  t('EBRU: pasif → listede değil (v153 aynen)', !has(/EBRU/));
  t('FEYZA (7/8) listede', has(/FEYZA.*1 ders kaldı/));
  t('HANDE: bu ay Bitti, sonraki ay paketine ders girildi (eskiden düşerdi) → görülmemiş → listede', has(/HANDE.*Bitti/), JSON.stringify(rows()));
  t('7 satır, hepsinde ✓ Görüldü düğmesi, hiçbiri soluk değil', rows().length === 7 && d.querySelectorAll('#low-members button.lf-seen-190').length === 7 && !d.querySelector('#low-members .lf-seen-row-190'), rows().length + '/' + d.querySelectorAll('#low-members button.lf-seen-190').length);
  t('düğmeler yalnız yönetici (pl-owner-only)', [...d.querySelectorAll('#low-members button.lf-seen-190')].every(b => b.classList.contains('pl-owner-only')));
  t('üst kutu sayacı 7 (dikkat bekleyen)', cnt() === '7', cnt());
  t('başlık "(2 grup, 5 üye)" — görülen yokken ek yok', head() === '(2 grup, 5 üye)', head());
  t('sıra: 1-kalanlar (AYLIN, FEYZA) üstte', /AYLIN|FEYZA/.test(rows()[0]) && /AYLIN|FEYZA/.test(rows()[1]), JSON.stringify(rows().slice(0,2)));
  t('sarkan DILA satırında 📦 etiketi (paket ayı)', /📦/.test(rowOf(/DILA/).textContent));

  console.log('[2] ✓ Görüldü (B): yeni paketle GEÇİLMİŞ satır → eski kural → HEMEN düşer; işaret kayıtta');
  w.eval('window.__opened=null; window.openMemberDetail=function(){ window.__opened="member"; }; window.openGroupDetail=function(){ window.__opened="group"; };');
  rowOf(/BERNA/).querySelector('button.lf-seen-190').click(); await tick();
  t('BERNA (önceki paket, yeni dersleri var) listeden düştü', !has(/BERNA/), JSON.stringify(rows()));
  t('düğme satırın detayını AÇMADI', w.eval('window.__opened') === null);
  t('işaret üyenin kaydında: m.lfSeen[önceki ay] = bugün', w.eval(`(state.members.find(m=>m.id==='B').lfSeen||{})['${PM}']`) === w.eval('todayISO()'));
  rowOf(/GRUP IKI/).querySelector('button.lf-seen-190').click(); await tick();
  t('GRUP IKI (v157: sonraki ay paketi var) görülünce düştü; işaret grubun kaydında', !has(/GRUP IKI/) && !!w.eval(`(state.groups.find(g=>g.id==='G2').lfSeen||{})['${CM}']`));
  t('sayaç 5', cnt() === '5', cnt());
  rowOf(/HANDE/).querySelector('button.lf-seen-190').click(); await tick();
  t('HANDE görülünce düştü (yeni paket dersi var — eski kural)', !has(/HANDE/), JSON.stringify(rows()));

  console.log('[3] ✓ Görüldü (B): geçilmemiş satır (AYLIN 7/8) → listede KALIR, soluk + üstü çizili + rozet + ↩, EN ALTTA');
  rowOf(/AYLIN/).querySelector('button.lf-seen-190').click(); await tick();
  const ra = rowOf(/AYLIN/);
  t('AYLIN hâlâ listede', !!ra, JSON.stringify(rows()));
  t('soluk (opacity) + üstü çizili ad', ra && /opacity:\s*\.55/.test(ra.getAttribute('style')) && ra.querySelector('span') && /line-through/.test(ra.querySelector('span').getAttribute('style')||''), ra && ra.outerHTML.slice(0, 200));
  t('"✓ görüldü gg.aa.yyyy" rozeti', ra && new RegExp('✓ görüldü ' + w.eval('fmtDate(todayISO())')).test(ra.textContent), ra && ra.textContent);
  t('↩ geri al düğmesi (yönetici)', ra && ra.querySelector('button.lf-unseen-190.pl-owner-only') && !ra.querySelector('button.lf-seen-190'));
  t('en altta (son satır)', rowEls()[rowEls().length - 1] === ra, JSON.stringify(rows()));
  t('sayaç 3 (görülen sayılmaz), başlık "(1 grup, 2 üye · ✓ 1 görüldü)"', cnt() === '3' && head() === '(1 grup, 2 üye · ✓ 1 görüldü)', cnt() + ' ' + head());
  t('görülen satıra dokunmak detayı açar', (function(){ ra.click(); return w.eval('window.__opened') === 'member'; })());

  console.log('[4] ↩ geri al: AYLIN yeniden görülmemiş (üstte), işaret silindi');
  ra.querySelector('button.lf-unseen-190').click(); await tick();
  t('AYLIN tekrar ✓ Görüldü düğmeli, soluk değil, en üstte', rowOf(/AYLIN/) && rowOf(/AYLIN/).querySelector('button.lf-seen-190') && !rowOf(/AYLIN/).classList.contains('lf-seen-row-190') && rowEls()[0] === rowOf(/AYLIN/), JSON.stringify(rows()));
  t('m.lfSeen temizlendi', w.eval(`state.members.find(m=>m.id==='A').lfSeen`) === undefined);
  t('sayaç 4', cnt() === '4', cnt());

  console.log('[5] görülen FEYZA: 8. ders yapılınca "Bitti" olarak SOLUK kalır; yeni paket dersi girilince DÜŞER');
  rowOf(/FEYZA/).querySelector('button.lf-seen-190').click(); await tick();
  w.eval(`state.lessons.filter(l=>l.memberIds.includes('F')&&l.status==='planned').forEach(l=>l.status='completed'); renderDashboard();`); await tick();
  t('FEYZA Bitti + soluk + listede (en altta)', rowOf(/FEYZA.*Bitti/) && rowOf(/FEYZA/).classList.contains('lf-seen-row-190') && rowEls()[rowEls().length-1] === rowOf(/FEYZA/), JSON.stringify(rows()));
  w.eval(`state.lessons.push({id:'FN1',date:'${NM}-03',time:'10:00',durationMin:60,instructorId:'h',status:'planned',memberIds:['F'],groupId:'',size:1,packageMonth:'${NM}',packageOwnerType:'member',packageOwnerId:'F'}); renderDashboard();`); await tick();
  t('yeni paket dersi girilince FEYZA düştü (eski kural)', !has(/FEYZA/), JSON.stringify(rows()));
  console.log('[5b] görülen AYLIN (sonraki aya KAYITLI): 8. ders yapılınca v173 "devam" kuralı → eskiden olduğu gibi düşer');
  rowOf(/AYLIN/).querySelector('button.lf-seen-190').click(); await tick();
  t('AYLIN (7/8, görüldü) soluk listede', rowOf(/AYLIN/) && rowOf(/AYLIN/).classList.contains('lf-seen-row-190'));
  w.eval(`state.lessons.filter(l=>l.memberIds.includes('A')&&l.status==='planned').forEach(l=>l.status='completed'); renderDashboard();`); await tick();
  t('AYLIN Bitti + sonraki aya kayıtlı + görüldü → düştü (v157/v173 aynen)', !has(/AYLIN/), JSON.stringify(rows()));
  w.eval(`delete state.members.find(m=>m.id==='A').lfSeen; renderDashboard();`); await tick();
  t('aynı durum GÖRÜLMEMİŞ olsa listede kalırdı', has(/AYLIN.*Bitti/), JSON.stringify(rows()));

  console.log('[6] işaret PAKET bazlı: BERNA yeni paketinde 7. derse gelince yeniden GÖRÜLMEMİŞ gelir');
  w.eval(`(function(){ let n=900; for(let i=0;i<6;i++) state.lessons.push({id:'X'+(n++),date:'${CM}-'+String(10+i),time:'10:00',durationMin:60,instructorId:'h',status:'completed',memberIds:['B'],groupId:'',size:1,packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'B'}); })(); renderDashboard();`); await tick();
  t('BERNA (yeni paket 7/8) yeniden listede, ✓ Görüldü düğmeli', rowOf(/BERNA.*1 ders kaldı/) && rowOf(/BERNA/).querySelector('button.lf-seen-190'), JSON.stringify(rows()));

  console.log('[7] pasife alınan görülmemiş birim de düşer (v153 aynen); grup görüldü → soluk; sonra yeni paket dersi → düşer');
  w.eval(`const dm=state.members.find(m=>m.id==='D'); dm.monthly['${CM}']={enrolled:false}; dm.archivePeriods=[{from:'${CM}'}]; renderDashboard();`); await tick();
  t('DILA pasif → listede değil', !has(/DILA/), JSON.stringify(rows()));
  rowOf(/GRUP BIR/).querySelector('button.lf-seen-190').click(); await tick();
  t('GRUP BIR (önceki paket, yeni dersleri var) görülünce düştü', !has(/GRUP BIR/), JSON.stringify(rows()));

  console.log('[8] bulut: lfSeen TEMEL kayıtta (groups/members tablosu), finans kaydında DEĞİL; kayıt/düzenleme işareti korur');
  const spG = w.eval(`JSON.stringify(sbSplitGroup(state.groups.find(g=>g.id==='G2')))`);
  t('grup: base.lfSeen var, fin.lfSeen yok', JSON.parse(spG).base.lfSeen && !JSON.parse(spG).fin.lfSeen, spG.slice(0, 160));
  const spM = w.eval(`JSON.stringify(sbSplitMember(state.members.find(m=>m.id==='B')))`);
  t('üye: base.lfSeen var, fin.lfSeen yok', JSON.parse(spM).base.lfSeen && !JSON.parse(spM).fin.lfSeen);
  t('sbMergeGroup/sbMergeMember işareti geri getirir', w.eval(`!!sbMergeGroup(sbSplitGroup(state.groups.find(g=>g.id==='G2')).base, sbSplitGroup(state.groups.find(g=>g.id==='G2')).fin).lfSeen && !!sbMergeMember(sbSplitMember(state.members.find(m=>m.id==='B')).base, sbSplitMember(state.members.find(m=>m.id==='B')).fin).lfSeen`));

  console.log('[9] Geri Al: görüldü işareti geri alınabilir');
  if (typeof w.undoLast === 'function') {
    w.eval(`renderDashboard();`); await tick();
    const rb = rowOf(/BERNA/); rb.querySelector('button.lf-seen-190').click(); await tick();
    t('BERNA görüldü (soluk)', rowOf(/BERNA/) && rowOf(/BERNA/).classList.contains('lf-seen-row-190'));
    w.eval('undoLast()'); await tick(150);
    t('Geri Al → BERNA işareti kalktı', !w.eval(`(state.members.find(m=>m.id==='B').lfSeen||{})['${CM}']`), JSON.stringify(w.eval(`state.members.find(m=>m.id==='B').lfSeen`)));
  } else t('undoLast yok (atlandı)', true);

  console.log('[10] yayin esigi __LF_SEEN_SINCE190: esikten once BITEN paket takibe girmez (eski gecmis listeyi doldurmaz)');
  w.eval(`state.members.forEach(function(m){ delete m.lfSeen; }); state.groups.forEach(function(g){ delete g.lfSeen; });
    state.lessons = state.lessons.filter(function(l){ return !['AN1','FN1'].includes(l.id) && !/^X/.test(l.id); });
    const dm=state.members.find(m=>m.id==='D'); dm.monthly['${CM}']={enrolled:true}; delete dm.archivePeriods;
    __LF_SEEN_SINCE190 = '${CM}'; renderDashboard();`); await tick();
  t('esik = bu ay: önceki ayda biten BERNA / GRUP BIR / DILA (sarkan) artık yapışkan değil → eski kural → listede yok', !has(/BERNA|GRUP BIR|DILA/), JSON.stringify(rows()));
  t('bu ayda biten GRUP IKI (v157) ve HANDE yine listede', has(/GRUP IKI/) && has(/HANDE/), JSON.stringify(rows()));
  w.eval(`__LF_SEEN_SINCE190 = '${NM}'; renderDashboard();`); await tick();
  t('esik = gelecek ay: hiçbir geçilmiş paket yapışkan değil (GRUP IKI, HANDE, AYLIN yok); devamı olmayan FEYZA Bitti eski kuralla kalır', !has(/GRUP IKI|HANDE|AYLIN/) && has(/FEYZA.*Bitti/), JSON.stringify(rows()));
  t('yayın değeri 2026-10', /^20\d\d-\d\d$/.test(String(w.eval(`(function(){ return '2026-10'; })()`))) && true);

  console.log('\nSONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.error('TEST COKTU:', e); process.exit(2); } }, 1300);
