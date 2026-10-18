// v198 (Kerem 18.10): "takvimde üye derslerinde hangi grup veya bireysel ders ise hocasının altına o paketin hangi ayın paketi ve
// kaçıncı dersi olduğu gözüksün" → __lessonPkgInfo198(l): paket ayı + sıra (iptal hariç, tarih+saat sırası) / hak; masaüstü
// gcal kutusunda 3. satır (gev-l3), telefon/tablet gündem kartında 3. satır (pcal-c3), ay görünümü çipinde ipucu (title).
// Eş-ders kümesi sessionsFinishState / isLastLessonOfPackage ile AYNI kural (grup: groupId+paket ayı; bireysel: ilk üye, grupsuz).
// Yamasız (v197) yapıda bu test BAŞARISIZ olmalı.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__PL_DLG_AUTO__=(o)=>(o&&o.input)?String(o.input.value):true; w.alert=()=>{}; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
}}).window; }
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
const J=(w,e)=>w.eval('JSON.stringify('+e+')');
setTimeout(async function(){try{
  const w=boot(); await tick(1200);
  const CM=w.eval('currentMonth()'), PREV=w.eval("finMonthAdd196(currentMonth(),-1)");
  const PREVL=w.eval("pkgMonthLabel('"+PREV+"')"), CML=w.eval("pkgMonthLabel('"+CM+"')");
  w.eval(`
    state.settings.reformers=5; state.settings.workDays=[1,2,3,4,5,6,0]; state.packageTypes=[{id:'p8',name:'8 DERS',sessions:8,price:4500}];
    state.instructors=[{id:'I',name:'İCLAL KOÇ',shareRate:30}];
    const en={'${PREV}':{enrolled:true},'${CM}':{enrolled:true}};
    const mk=(id,name)=>({id,name,joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:JSON.parse(JSON.stringify(en))});
    state.members=[mk('A','AYLA'),mk('B','BETÜL'),mk('M','MERVE')];
    state.groups=[{id:'G1',name:'GRUP',size:2,memberIds:['A','B'],monthlyMembers:{'${CM}':['A','B']},packages:[],rescheduleUsed:0,cancelUsed:0}];
    state.payments=[]; state.lessons=[];
    const L=(id,gid,mids,date,time,st,pm,dur)=>state.lessons.push({id,groupId:gid,instructorId:'I',date,time,durationMin:dur||45,status:st,memberIds:mids,packageMonth:pm||date.slice(0,7),packageOwnerType:gid?'group':'member',packageOwnerId:gid||mids[0],size:mids.length});
    L('L1','G1',['A','B'],'${CM}-01','10:00','completed'); L('LC','G1',['A','B'],'${CM}-02','10:00','cancelled'); L('L2','G1',['A','B'],'${CM}-03','10:00','completed');
    L('L3','G1',['A','B'],'${CM}-05','10:00','missed'); L('L4','G1',['A','B'],'${CM}-08','10:00','planned'); L('L5','G1',['A','B'],'${CM}-08','09:00','planned');
    ['01','02','03','04','05','06'].forEach((d,i)=>L('P'+i,'',['M'],'${PREV}-'+d,'11:00','completed'));
    L('PS','',['M'],'${CM}-02','11:00','planned','${PREV}');          // ${PREVL} paketinin 7. dersi, Ekim'e sarkan
    L('M1','',['M'],'${CM}-09','11:00','planned');                    // ${CML} paketinin 1. dersi
    L('K30','',['M'],'${CM}-09','12:00','planned','${CM}',30);        // 30 dk → kompakt kutu (satır 2/3 yok)
    L('BOS','',[],'${CM}-09','13:00','planned');                      // boş ders → bilgi yok
  `);
  const info=id=>JSON.parse(J(w,"(typeof __lessonPkgInfo198==='function')?__lessonPkgInfo198(state.lessons.find(l=>l.id==='"+id+"')):null"));
  console.log('[1] __lessonPkgInfo198: sıra (iptal sayılmaz), hak, etiketler');
  t('yardımcı var', w.eval("typeof __lessonPkgInfo198==='function'"));
  const q=w.eval("sessionQuotaFor('group','G1','"+CM+"')");
  t('grup hakkı 8', q===8, q);
  t('L1 → 1/8', (info('L1')||{}).ord===1 && (info('L1')||{}).quota===8 && (info('L1')||{}).short==='📦 '+CML+' · 1/8', JSON.stringify(info('L1')));
  t('L2 → 2/8 (iptal LC sayılmaz)', (info('L2')||{}).ord===2, JSON.stringify(info('L2')));
  t('L3 (yandı) → 3/8', (info('L3')||{}).ord===3, JSON.stringify(info('L3')));
  t('aynı gün 09:00 (L5) → 4, 10:00 (L4) → 5 (saat sırası)', (info('L5')||{}).ord===4 && (info('L4')||{}).ord===5, JSON.stringify([info('L5'),info('L4')]));
  t('iptal LC → sıra 0, etiket "iptal"', (info('LC')||{}).ord===0 && /iptal/.test((info('LC')||{}).short||''), JSON.stringify(info('LC')));
  t('sarkan PS → '+PREVL+' paketi 7/8', (info('PS')||{}).pm===PREV && (info('PS')||{}).ord===7 && (info('PS')||{}).short==='📦 '+PREVL+' · 7/8', JSON.stringify(info('PS')));
  t('M1 → '+CML+' 1/8', (info('M1')||{}).ord===1 && (info('M1')||{}).pm===CM, JSON.stringify(info('M1')));
  t('uzun etiket: "'+PREVL+' paketi · 7. ders / 8"', (info('PS')||{}).long===PREVL+' paketi · 7. ders / 8', JSON.stringify(info('PS')));
  t('boş ders → null', info('BOS')===null, JSON.stringify(info('BOS')));

  console.log('[2] Masaüstü takvim (gcal): hocanın altında 3. satır');
  w.eval("window.__forceCalMobile=false; switchPage('calendar'); calView='day'; calAnchor=parseISO('"+CM+"-02'); renderCalendar();"); await tick(100);
  let cal=w.document.getElementById('calendar').innerHTML;
  t('gün görünümü: sarkan dersin kutusunda gev-l3 "📦 '+PREVL+' · 7/8"', /gev-l3[^>]*>📦 [^<]*7\/8</.test(cal) && cal.indexOf('📦 '+PREVL+' · 7/8')!==-1, cal.match(/gev-l3[^<]*</g));
  t('gün görünümü: iptal dersin kutusunda "iptal"', /gev-l3[^>]*>📦 [^<]*iptal</.test(cal));
  t('hoca satırı (gev-l2) korunur, paket satırı ondan SONRA', (function(){ const i2=cal.indexOf('gev-l2'), i3=cal.indexOf('gev-l3'); return i2>0 && i3>i2; })());
  w.eval("calView='week'; calAnchor=parseISO('"+CM+"-01'); renderCalendar();"); await tick(100);
  cal=w.document.getElementById('calendar').innerHTML;
  t('hafta görünümü: L1 kutusunda "· 1/8"', cal.indexOf('📦 '+CML+' · 1/8')!==-1);
  w.eval("calView='day'; calAnchor=parseISO('"+CM+"-09'); renderCalendar();"); await tick(100);
  cal=w.document.getElementById('calendar').innerHTML;
  const k30=cal.match(/<div class="gcal-ev[^"]*"[^>]*onclick="[^"]*K30[^"]*"[\s\S]*?<\/div>\s*<\/div>/);
  t('30 dk kompakt kutuda gev-l3 YOK', k30 && k30[0].indexOf('gev-l3')===-1, k30&&k30[0].slice(0,200));
  t('boş derste gev-l3 YOK', (function(){ const m=cal.match(/onclick="[^"]*BOS[^"]*"[\s\S]*?<\/div>\s*<\/div>/); return m && m[0].indexOf('gev-l3')===-1; })());
  t('M1 kutusunda "· 1/8"', cal.indexOf('📦 '+CML+' · 1/8')!==-1);
  w.eval("calView='month'; calAnchor=parseISO('"+CM+"-01'); renderCalendar();"); await tick(150);
  cal=w.document.getElementById('calendar').innerHTML;
  t('ay görünümü çip ipucu (title) paket bilgisini taşır', /title="[^"]*📦 [^"]*1\/8[^"]*"/.test(cal));

  console.log('[3] Telefon/tablet gündem kartı: 3. satır (pcal-c3)');
  w.eval("window.__forceCalMobile=true; calView='day'; calAnchor=parseISO('"+CM+"-03'); renderCalendar();"); await tick(100);
  cal=w.document.getElementById('calendar').innerHTML;
  t('gündem kartında pcal-c3 "📦 '+CML+' paketi · 2. ders / 8"', /pcal-c3[^>]*>📦 [^<]*2\. ders \/ 8</.test(cal), cal.match(/pcal-c3[^<]*</g));
  t('pcal-c3, hoca satırının (pcal-c2) ALTINDA', (function(){ const i2=cal.indexOf('pcal-c2'), i3=cal.indexOf('pcal-c3'); return i2>0 && i3>i2; })());
  w.eval("calView='month'; calAnchor=parseISO('"+CM+"-01'); __calSelDay='"+CM+"-02'; renderCalendar();"); await tick(150);
  cal=w.document.getElementById('calendar').innerHTML;
  t('telefon ay görünümü gündemi: sarkan ders "'+PREVL+' paketi · 7. ders / 8" + iptal kartı', cal.indexOf(PREVL+' paketi · 7. ders / 8')!==-1 && /pcal-c3[^>]*>📦 [^<]*iptal/.test(cal));
  w.eval("window.__forceCalMobile=false;");

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
