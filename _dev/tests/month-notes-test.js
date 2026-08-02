// v140 — AY NOTLARI: uyeler sayfasinda aya ozel not defteri. Yamasiz build'de FAIL etmeli.
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
    w.__PL_DLG_AUTO__=(o)=>{ w.__dlgMsg = o && o.msg; return o && o.input ? null : true; };
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function ev(x){ return w.eval(x); }
function addM(ym,k){ const p=ym.split('-').map(Number); const dd=new Date(p[0],p[1]-1+k,1); return dd.getFullYear()+'-'+String(dd.getMonth()+1).padStart(2,'0'); }
setTimeout(()=>{ try {
  const cm = ev('currentMonth()');
  const onceki = addM(cm,-1);
  w.eval(`
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:1500,packages:[],monthly:{'${cm}':{enrolled:true}}}];
    state.groups=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructors=[]; state.instructorPayouts=[];
    delete state.settings.monthNotes;`);

  console.log('[1] EKLE: form uzerinden aya ozel not');
  t('addMonthNote var', ev("typeof addMonthNote === 'function'"));
  w.renderMembers();
  d.getElementById('mn-text').value = 'Klima servisi aranacak\nReformer 3 gicirdiyor';
  w.addMonthNote();
  t('kayit settings.monthNotes[bu ay] icinde', ev("(state.settings.monthNotes['"+cm+"']||[]).length") === 1);
  const l1 = d.getElementById('month-notes-list').innerHTML;
  t('listede metin gorunur (cok satirli)', /Klima servisi aranacak/.test(l1) && /Reformer 3/.test(l1));
  t('TARIH gorunur (bugun + saat)', new RegExp(ev("fmtDate(todayISO())").replace(/\./g,'\\.') + ' \\d\\d:\\d\\d').test(l1), l1.match(/🗓️[^<]*/) ? l1.match(/🗓️[^<]*/)[0] : 'yok');
  t('sayac: 1 not', /1 not/.test(d.getElementById('month-notes-sub').textContent));
  t('metin kutusu temizlendi', d.getElementById('mn-text').value === '');

  console.log('[2] LISTE: yeni not USTTE (telefon notlari gibi)');
  d.getElementById('mn-text').value = 'IKINCI NOT';
  w.addMonthNote();
  const l2 = d.getElementById('month-notes-list').innerHTML;
  t('2 kayit ve yeni ustte', ev("state.settings.monthNotes['"+cm+"'].length") === 2 && l2.indexOf('IKINCI NOT') < l2.indexOf('Klima servisi'), l2.indexOf('IKINCI NOT')+' vs '+l2.indexOf('Klima servisi'));

  console.log('[3] XSS: not metni her zaman kacislanir');
  d.getElementById('mn-text').value = '<img src=x onerror=alert(1)> kotu <script>zarar()</scr'+'ipt>';
  w.addMonthNote();
  const l3 = d.getElementById('month-notes-list').innerHTML;
  t('ham <img/script yok, kacislanmis var', !/<img src=x/.test(l3) && !/<script>zarar/.test(l3) && /&lt;img/.test(l3), l3.slice(0,160));
  w.eval("state.settings.monthNotes['"+cm+"'] = state.settings.monthNotes['"+cm+"'].slice(1);"); // xss kaydini kaldir
  w.renderMonthNotes(cm);

  console.log('[4] DUZENLE: metin degisir, olusturma tarihi korunur, duzenlendi damgasi');
  const id1 = ev("state.settings.monthNotes['"+cm+"'].find(n=>n.text==='IKINCI NOT').id");
  const created1 = ev("state.settings.monthNotes['"+cm+"'].find(n=>n.id==='"+id1+"').createdAt");
  w.editMonthNote(cm, id1);
  t('duzenleme kutusu acildi', !!d.getElementById('mn-edit-'+id1));
  d.getElementById('mn-edit-'+id1).value = 'IKINCI NOT (guncellendi)';
  w.saveMonthNoteEdit(cm, id1);
  t('metin guncellendi + createdAt AYNI', ev("state.settings.monthNotes['"+cm+"'].find(n=>n.id==='"+id1+"').text") === 'IKINCI NOT (guncellendi)' && ev("state.settings.monthNotes['"+cm+"'].find(n=>n.id==='"+id1+"').createdAt") === created1);
  t('listede "düzenlendi" damgasi', /düzenlendi/.test(d.getElementById('month-notes-list').innerHTML));

  console.log('[5] SIL: onayli; ay bosalinca anahtar silinir');
  w.removeMonthNote(cm, id1);
  t('silindi (1 kaldi)', ev("state.settings.monthNotes['"+cm+"'].length") === 1);
  const id2 = ev("state.settings.monthNotes['"+cm+"'][0].id");
  w.removeMonthNote(cm, id2);
  t('ay bosaldi, anahtar kalkti', ev("!state.settings.monthNotes || !state.settings.monthNotes['"+cm+"']"));

  console.log('[6] AY IZOLASYONU: notlar AYA ozel');
  w.eval("state.settings.monthNotes = {'"+onceki+"': [{id:'n-onceki', text:'GECEN AYIN NOTU', createdAt:'2026-01-15T10:00:00.000Z'}]};");
  w.renderMonthNotes(onceki);
  t('onceki ay listesinde kendi notu', /GECEN AYIN NOTU/.test(d.getElementById('month-notes-list').innerHTML));
  w.renderMonthNotes(cm);
  t('bu ay listesi BOS ("not yok")', /Bu ay için not yok/.test(d.getElementById('month-notes-list').innerHTML) && /not yok/.test(d.getElementById('month-notes-sub').textContent));

  console.log('[7] KALICILIK + KANCA');
  w.eval("state.settings.monthNotes['"+cm+"'] = [{id:'nk', text:'KALICI NOT', createdAt: new Date().toISOString()}]; save();");
  t('localStorage nota sahip', (ev("localStorage.getItem('pilateria')")||'').indexOf('KALICI NOT') !== -1);
  w.renderMembers();
  t('renderMembers notlari da cizer (kanca)', /KALICI NOT/.test(d.getElementById('month-notes-list').innerHTML));

  console.log('[8] STATIK: polyfill + kart');
  t('structuredClone polyfill kaynakta', html.indexOf('if (!window.structuredClone)') !== -1);
  t('not karti uyeler sayfasinda', html.indexOf('id="month-notes-card"') !== -1 && html.indexOf('Ay Notları') !== -1);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
