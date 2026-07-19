// v53 — FOCUS KORUMA: innerHTML ile yeniden cizilen arama kutusunda "her harften sonra tekrar tikla" bug'i
// Kok: renderGroupMembersCheckboxes / renderLessonMembersCheckboxes, oninput'ta KENDI konteynerini
// innerHTML ile yeniden ciziyor -> input dugumu yok edilip yaratiliyor -> focus+caret kaybi.
// Fix: setHTMLKeepFocus(el,html) swap oncesi odakli descendant input'u id ile yakalar, sonra geri koyar.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{}; }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');

  console.log('[1] setHTMLKeepFocus — mekanizma (sentetik text input)');
  t('setHTMLKeepFocus tanimli', typeof w.setHTMLKeepFocus==='function');
  // konteyner + icinde odakli text input; yeniden ciz -> focus+caret korunmali
  d.body.insertAdjacentHTML('beforeend', '<div id="fk-box"></div>');
  const box = d.getElementById('fk-box');
  box.innerHTML = '<input id="fk-in" type="text" value="merhaba">';
  const inp = d.getElementById('fk-in');
  inp.focus(); inp.setSelectionRange(3,3);
  t('on-kosul: input odakli', d.activeElement===inp);
  w.setHTMLKeepFocus(box, '<span>x</span><input id="fk-in" type="text" value="merhaba"><span>y</span>');
  const inp2 = d.getElementById('fk-in');
  t('swap sonrasi YENI dugum (rebuild oldu)', inp2 && inp2!==inp);
  t('focus KORUNDU (id ayni)', d.activeElement && d.activeElement.id==='fk-in', d.activeElement && d.activeElement.id);
  t('caret KORUNDU (selectionStart=3)', inp2.selectionStart===3, inp2.selectionStart);

  console.log('[2] setHTMLKeepFocus — odak DISARIDA ise calmaz');
  d.body.insertAdjacentHTML('beforeend', '<input id="fk-out" type="text"><div id="fk-box2"><input id="fk-inner" type="text"></div>');
  const out = d.getElementById('fk-out'); out.focus();
  t('on-kosul: dis input odakli', d.activeElement===out);
  w.setHTMLKeepFocus(d.getElementById('fk-box2'), '<input id="fk-inner" type="text">');
  t('dis odak KORUNDU (calinmadi)', d.activeElement && d.activeElement.id==='fk-out', d.activeElement && d.activeElement.id);

  console.log('[3] GRUP modali — renderGroupMembersCheckboxes focus kaybetmez (Kerem raporu)');
  w.eval(`state.groups=[]; state.members=[
     {id:'m1',name:'Ayse Yilmaz',phone:'',joinDate:'2026-01-01',packages:[],monthly:{},archived:false},
     {id:'m2',name:'Burak Demir',phone:'',joinDate:'2026-01-01',packages:[],monthly:{},archived:false}
   ];`);
  t('#mg-members var', !!d.getElementById('mg-members'));
  w.renderGroupMembersCheckboxes([], '');            // ilk cizim -> #mg-member-search olusur
  const gs = d.getElementById('mg-member-search');
  t('mg-member-search olustu', !!gs);
  gs.focus(); gs.value='Ay';
  t('on-kosul: arama kutusu odakli', d.activeElement===gs);
  w.renderGroupMembersCheckboxes([], '');            // oninput'un yaptigi: yeniden ciz
  const gs2 = d.getElementById('mg-member-search');
  t('yeniden cizildi (yeni dugum)', gs2 && gs2!==gs);
  t('GRUP: focus KORUNDU', d.activeElement && d.activeElement.id==='mg-member-search', d.activeElement && d.activeElement.id);
  t('GRUP: yazilan metin korundu (buyuk/kucuk aynen)', gs2 && gs2.value==='Ay', gs2 && gs2.value);
  t('GRUP: arama filtreledi (Ayse gorunur)', /Ayse/.test(d.getElementById('mg-members').innerHTML));

  console.log('[4] DERS modali — renderLessonMembersCheckboxes focus kaybetmez');
  const mlg = d.getElementById('ml-group'); if (mlg) mlg.value='';   // bireysel ders (grupsuz)
  w.eval(`state.members=[{id:'mA',name:'Aaron Kaya',phone:'',joinDate:'2026-01-01',packages:[],monthly:{},archived:false}]; __lessonMemberSearch='';`);
  t('#ml-members var', !!d.getElementById('ml-members'));
  w.renderLessonMembersCheckboxes([]);               // ilk cizim -> #ml-member-search olusur
  const ls = d.getElementById('ml-member-search');
  t('ml-member-search olustu', !!ls);
  ls.focus(); ls.value='aa'; try{ ls.setSelectionRange(2,2); }catch(_){}
  t('on-kosul: ders arama kutusu odakli', d.activeElement===ls);
  w.onLessonMemberSearch(ls);                          // = __lessonMemberSearch='aa' + yeniden ciz
  const ls2 = d.getElementById('ml-member-search');
  t('DERS: yeniden cizildi (yeni dugum)', ls2 && ls2!==ls);
  t('DERS: focus KORUNDU', d.activeElement && d.activeElement.id==='ml-member-search', d.activeElement && d.activeElement.id);
  t('DERS: caret KORUNDU (2)', ls2 && ls2.selectionStart===2, ls2 && ls2.selectionStart);
  t('DERS: metin korundu (aa)', ls2 && ls2.value==='aa', ls2 && ls2.value);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
