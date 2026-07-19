// v59 — UYE SAYISI = benzersiz KISI: 2.paket klonu ayni ayda ikinci uye olarak SAYILMAZ
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
  const ay='2026-06';
  w.eval(`
    const M=(id)=>({id,name:id.toUpperCase(),joinDate:'2026-01-01',archived:false,totalPrice:4500,packages:[],monthly:{'2026-06':{enrolled:true}}});
    state.members=[M('a'),M('b'),M('c')];
    state.members.push({id:'a2',name:'A (2. Paket)',secondOfMember:'a',joinDate:'2026-01-01',archived:false,totalPrice:4500,packages:[],monthly:{'2026-06':{enrolled:true}}});
    state.groups=[]; state.lessons=[]; state.payments=[];
    document.getElementById('dash-month') && (document.getElementById('dash-month').value='2026-06');
  `);
  console.log('[1] personIdOf kanonu');
  t("klon -> kok kisi id", w.personIdOf('a2')==='a');
  t("normal uye kendi id", w.personIdOf('b')==='b');

  console.log('[2] Uyeler sayfasi "Uye Sayisi" stati: 3 kisi (a+a2 = 1 kisi)');
  w.renderMembers();
  const stats = d.getElementById('members-stats').textContent;
  t('stat 3 gosterir (4 DEGIL)', /Üye Sayısı/.test(stats) && stats.includes('3') && !/\b4\b/.test(d.querySelector('#members-stats .stat .value').textContent), d.querySelector('#members-stats .stat .value').textContent);
  t('klon satiri listede GORUNUR (yonetim icin)', (w.buildMemberRows(ay)||[]).some(r=>r.memberId==='a2'));

  console.log('[3] Dashboard "Aktif Uye": 3 (klon katlanir)');
  w.eval("try{renderDashboard()}catch(e){}");
  const sm = d.getElementById('s-members').textContent;
  t('s-members = 3', sm==='3', sm);

  console.log('[4] YALNIZ KLON aktif ayda kisi yine 1 sayilir (0 degil)');
  w.eval("state.members.find(x=>x.id==='a').monthly['2026-06']={enrolled:false};");
  w.eval("try{renderDashboard()}catch(e){}");
  t('asil pasif + klon aktif -> kisi sayisi 3 (b,c,a-kisi)', d.getElementById('s-members').textContent==='3', d.getElementById('s-members').textContent);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
