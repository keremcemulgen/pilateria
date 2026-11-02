// v216 (Kerem 02.11): "Z. U. H.'yi Kasım'da ekliyorum üyelere ağustosta temmuzda geri çıkıyor kontrol et. Bu nasıl kökten çözmek"
// CANLI DESEN (PC kopyası, salt okunur): Haziran'dan beri ay kadrosu kaydı OLMAYAN eski grup; 01→02.11'de yalnız Ekim kadrosu [eşi]
// olarak sabitlendi → "kayıt yoksa sonraki ilk kayıt" kuralıyla HAZİRAN–EYLÜL kadroları da [eşi] oldu → üye Haziran/Temmuz'da grubun
// derslerine girmiş ve gruba ödemiş olduğu halde ayrıca BİREYSEL + borçlu (6.000 / 6.500 ₺) göründü.
// [1] KÖK: kadro değişikliğinden önce grubun TÜM geçmiş ayları sabitlenir → sonradan tek bir ay kaydı geçmişi yeniden yazamaz.
// [2] ONARIM-4: grubundan düşmüş üye adıyla sorulur → "Kadroya geri koy" → o aylarda gruba döner, bireysel borç kalkar; ders/ödeme aynen.
//     "Kalsın" → bir daha sorulmaz. Tek misafir dersi / gerçekten bireysel olan üye sorulmaz. Yamasız v215'te FAIL etmeli.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const tick = ms => new Promise(r => setTimeout(r, ms || 100));
function boot(ans) {
  return new JSDOM(html, { runScripts: 'dangerously', url: 'https://localhost/p.html', pretendToBeVisual: true, beforeParse(w) {
    w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }); if (!w.structuredClone) w.structuredClone = o => JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: () => Promise.resolve({}), getRegistrations: () => Promise.resolve([]) }, configurable: true });
    w.__msgs = []; w.__ANS = ans;
    w.__PL_DLG_AUTO__ = (o) => { const m = String((o && o.msg) || ''); w.__msgs.push(m); if (o && o.buttons && /Grubundan düşmüş üye/.test(m)) return w.__ANS; if (o && o.buttons && o.buttons.length) return null; if (o && o.input) return null; return true; };
    w.alert = (m) => w.__msgs.push('ALERT:' + m); w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
  } }).window;
}
// Z = ZEYNEP (gerçek üye yerine), C = CENK (eşi). Ay kadrosu kaydı YOK (eski grup) — sonra yalnız Ekim [C] sabitlenmiş (hasarlı hal).
function fixture(w, damaged) {
  w.eval(`['renderCalendar','renderArchive'].forEach(f=>window[f]=function(){}); window.plToast=function(){};
    state.settings.reformers=12; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:6500}]; state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const mk=(id,n,mo,per)=>({id,name:n,joinDate:'2026-06-01',defaultPackageId:'p8',totalPrice:6500,instructorId:'h1',packages:[],monthly:mo,archivePeriods:per});
    state.members=[
      mk('Z','ZEYNEP DENEME',{'2026-06':{totalPrice:6000},'2026-07':{totalPrice:6500},'2026-08':{enrolled:false},'2026-09':{enrolled:true},'2026-10':{enrolled:true}},[{from:'2026-08',to:'2026-09'}]),
      mk('C','CENK DENEME',{'2026-06':{totalPrice:6000},'2026-07':{totalPrice:6500},'2026-08':{enrolled:false},'2026-09':{enrolled:true},'2026-10':{enrolled:true}},[{from:'2026-08',to:'2026-09'}]),
      mk('M','MISAFIR DENEME',{'2026-06':{}},[])];
    state.groups=[{id:'G',name:'ZEYNEP DENEME - CENK DENEME',size:2,memberIds:['C','Z'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,4],defaultTime:'10:00',customTotalPrice:13000,
      packages:[{month:'2026-06',sessions:8,price:12000,status:'completed'},{month:'2026-07',sessions:8,price:13000,status:'completed'},{month:'2026-09',sessions:8,price:13000,status:'completed'}],
      monthlyMembers:${damaged ? "{'2026-10':['C']}" : '{}'},monthlyNotes:{}}];
    state.lessons=[]; let n=0; const L=(d,pm,ids)=>state.lessons.push({id:'L'+(n++),groupId:'G',memberIds:ids,date:d,time:'10:00',status:'completed',packageMonth:pm,instructorId:'h1',size:2});
    ['06-19','06-22','06-26','06-29','07-03','07-13','07-17','07-20'].forEach((d,i)=>L('2026-'+d,'2026-06', i===0 ? ['C','Z','M'] : ['C','Z']));
    ['07-24','07-27','07-31','08-03','08-07','08-10','08-14','08-17'].forEach(d=>L('2026-'+d,'2026-07',['C','Z']));
    ['08-31','09-01','09-04','09-07','09-09','09-14','09-16','09-18'].forEach(d=>L('2026-'+d,'2026-09',['C','Z']));
    state.payments=[]; let pn=0; const P=(mid,pm,amt)=>state.payments.push({id:'P'+(pn++),memberId:mid,groupId:'G',date:pm+'-19',packageMonth:pm,amount:amt,method:'Nakit',sessions:8});
    ['Z','C'].forEach(m=>{ P(m,'2026-06',6000); P(m,'2026-07',6500); P(m,'2026-09',6500); });
    const mm=document.getElementById('member-month'); mm.innerHTML=['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11'].map(v=>'<option value="'+v+'">'+v+'</option>').join(''); mm.value='2026-11';
    switchPage('members'); renderMembers();`);
}
const J = (w, e) => JSON.parse(w.eval('JSON.stringify(' + e + ')'));
const rowsOf = (w, ay, mid) => J(w, `buildMemberRows('${ay}').filter(r=>r.memberId==='${mid}').map(r=>r.type+':'+(r.groupId||'')+':'+(+r.remaining||0))`);
setTimeout(async () => { try {
  console.log('[1] KÖK: kadro değişikliği geçmişi dondurur — sonradan tek ay kaydı Haziran–Eylül kadrosunu YENİDEN YAZAMAZ');
  { const w = boot(null); await tick(1100); fixture(w, false);
    const before = ['2026-06','2026-07','2026-09'].map(a => rowsOf(w, a, 'Z').join());
    t('başlangıç: ZEYNEP Haziran/Temmuz/Eylül grubun satırında', before.every(x => /^group:G:/.test(x)), JSON.stringify(before));
    w.eval("applyRosterChange(state.groups[0], '2026-12', function(m){ return m.slice(); })"); // Aralık'ta herhangi bir kadro işlemi
    w.eval("state.groups[0].monthlyMembers['2026-10'] = ['C']; renderMembers();");          // sonra Ekim tek başına [CENK] yazılsa bile
    const after = ['2026-06','2026-07','2026-09'].map(a => rowsOf(w, a, 'Z').join());
    t('Haziran/Temmuz/Eylül kadroları DEĞİŞMEDİ (ZEYNEP grubun satırında, bireysel borç yok)', JSON.stringify(after) === JSON.stringify(before), JSON.stringify(after));
    t('geçmiş aylar kendi kadro kaydıyla sabit', ['2026-06','2026-07','2026-08','2026-09'].every(a => JSON.stringify(J(w, `state.groups[0].monthlyMembers['${a}']||null`)) === '["C","Z"]'), JSON.stringify(J(w, 'state.groups[0].monthlyMembers')));
    w.close(); }

  console.log('[2] ONARIM-4: hasarlı hal (yalnız Ekim [CENK]) → ZEYNEP Haziran/Temmuz bireysel borçlu → adıyla sorulur → Kadroya geri koy');
  { const w = boot('fix'); await tick(1100); fixture(w, true);
    t('hasar görünüyor: ZEYNEP Haziran BİREYSEL 6.000 ₺ borçlu', rowsOf(w, '2026-06', 'Z').join() === 'individual::6000', rowsOf(w, '2026-06', 'Z').join());
    t('hasar görünüyor: ZEYNEP Temmuz BİREYSEL 6.500 ₺ borçlu', rowsOf(w, '2026-07', 'Z').join() === 'individual::6500', rowsOf(w, '2026-07', 'Z').join());
    const lesB = w.eval("JSON.stringify(state.lessons)"), payB = w.eval("JSON.stringify(state.payments)");
    t('onarım fonksiyonu var', w.eval("typeof __offerGroupOrphanRepair216") === 'function');
    if (w.eval("typeof __offerGroupOrphanRepair216") === 'function') { w.eval("__offerGroupOrphanRepair216()"); await tick(300); }
    const q = w.__msgs.find(m => /Grubundan düşmüş üye/.test(m)) || '';
    t('soru adıyla ve aylarıyla soruldu (Haziran, Temmuz, Eylül)', /ZEYNEP DENEME/.test(q) && /Haziran/.test(q) && /Temmuz/.test(q) && /Eylül/.test(q), q.slice(0, 300));
    t('misafir (tek ders, ödemesiz) SORULMADI', !w.__msgs.some(m => /MISAFIR/.test(m)));
    t('CENK SORULMADI (kadroda)', !w.__msgs.some(m => /Grubundan düşmüş üye\n\nCENK/.test(m)));
    ['2026-06', '2026-07', '2026-09'].forEach(a => t('ZEYNEP ' + a + ' grubun satırında, bireysel borç YOK', /^group:G:0$/.test(rowsOf(w, a, 'Z').join()), rowsOf(w, a, 'Z').join()));
    t('CENK satırları aynen (grup, borç yok)', ['2026-06','2026-07','2026-09'].every(a => /^group:G:0$/.test(rowsOf(w, a, 'C').join())), JSON.stringify(['2026-06','2026-07','2026-09'].map(a => rowsOf(w, a, 'C'))));
    t('Ağustos/Ekim/Kasım: ZEYNEP satırı yok (pasif aylar aynen)', ['2026-08'].every(a => !rowsOf(w, a, 'Z').length), JSON.stringify(rowsOf(w, '2026-08', 'Z')));
    t('dersler ve ödemeler DEĞİŞMEDİ', w.eval("JSON.stringify(state.lessons)") === lesB && w.eval("JSON.stringify(state.payments)") === payB);
    t('Ekim kadrosu aynen [CENK]', JSON.stringify(J(w, "state.groups[0].monthlyMembers['2026-10']")) === '["C"]');
    t('ikinci taramada artık bulgu yok', J(w, '__groupOrphanScan216().length') === 0, JSON.stringify(J(w, '__groupOrphanScan216()')));
    w.close(); }

  console.log('[3] "Kalsın" → bir daha sorulmaz; "Sonra" → veri aynen');
  { const w = boot('keep'); await tick(1100); fixture(w, true);
    if (w.eval("typeof __offerGroupOrphanRepair216") === 'function') { w.eval("__offerGroupOrphanRepair216()"); await tick(300); }
    t('Kalsın: veri aynen (Haziran hâlâ bireysel)', rowsOf(w, '2026-06', 'Z').join() === 'individual::6000');
    t('Kalsın: yeniden taramada SORULMAZ', w.eval("typeof __groupOrphanScan216") === 'function' && J(w, '__groupOrphanScan216().length') === 0);
    w.close(); }
  { const w = boot(null); await tick(1100); fixture(w, true);
    if (w.eval("typeof __offerGroupOrphanRepair216") === 'function') { w.eval("__offerGroupOrphanRepair216()"); await tick(300); }
    t('Sonra: veri aynen, sonraki açılışta yine sorulur', rowsOf(w, '2026-06', 'Z').join() === 'individual::6000' && w.eval("typeof __groupOrphanScan216") === 'function' && J(w, '__groupOrphanScan216().length') === 1);
    w.close(); }

  console.log('\nSONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.log('TEST COKTU', e && e.stack || e); process.exit(2); } }, 50);
