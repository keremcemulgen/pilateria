// v204 (Kerem 18.10 "Küçültmeyi yap"): yedek kopyaları PLZ ile sıkıştırılır (LZ77, 15 bit/karakter, UTF-16 güvenli). CANLI 'pilateria'
// anahtarı sıkıştırılmaz. Halka slotları, eski tek slot, günlük yedek, pre_pull, pre_overwrite, mass_delete, undo paketli yazılır;
// okuyucular (undo yükleme, halka tekrar denetimi, yedek paneli, çekme-öncesi geri yükleme, recover.html, kurtar.html) çözer; işaretsiz
// eski yedekler aynen okunur. v205: açılışta eski ham yedekler bir kez sıkıştırılır ([7]). Yamasız (v203) yapıda [1]–[7] BAŞARISIZ olmalı.
const fs=require('fs'); const path=require('path'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const DIR=path.dirname(path.resolve(process.argv[2]));
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(src){ return new JSDOM(src||html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); if(o&&o.input) return String(o.input.value); return true; };
  w.alert=(m)=>{ w.__msgs.push('ALERT:'+m); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
}}).window; }
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
const J=(w,e)=>w.eval('JSON.stringify('+e+')');
const ls=(w,k)=>w.localStorage.getItem(k);
// gerçek boyutta sentetik durum (~700K karakter): 1100 ders, 190 üye, 280 ödeme, 205 gider
function bigState(){
  const rnd=(n)=>Math.random().toString(36).slice(2,2+n);
  const st={members:[],lessons:[],payments:[],expenses:[],groups:[],instructors:[{id:'p5cxj21z',name:'GİZEM',shareRate:30}],packageTypes:[{id:'p1',name:'BIREYSEL',sessions:8,price:4500}],settings:{finance:{partners:['Kerem ÖZTEPE','Derya ÖZTEPE'],startMonth:'2026-07'}}};
  for(let i=0;i<190;i++) st.members.push({id:rnd(8),name:'ÜYE '+i+' ÇĞİÖŞÜ',phone:'05'+String(300000000+i*7919),joinDate:'2026-0'+(1+i%9)+'-1'+(i%9),defaultPackageId:'p1',totalPrice:4500,packages:[],monthly:{'2026-09':{enrolled:true,totalPrice:4500},'2026-10':{enrolled:true}},note:i%5?'':'Bel ağrısı var 🙂'});
  for(let i=0;i<1110;i++) st.lessons.push({id:rnd(8),date:'2026-'+String(7+Math.floor(i/370)).padStart(2,'0')+'-'+String(1+i%28).padStart(2,'0'),note:'',size:1+i%3,time:String(8+i%12).padStart(2,'0')+':00',status:i%7?'completed':'planned',groupId:'',memberIds:[st.members[i%190].id],durationMin:45,instructorId:'p5cxj21z',packageMonth:'2026-0'+(7+Math.floor(i/370)),packageOwnerId:st.members[i%190].id,isLastOfPackage:false,packageOwnerType:'member',excludedMemberIds:[],instructorRateOverride:null});
  for(let i=0;i<280;i++) st.payments.push({id:rnd(8),memberId:st.members[i%190].id,groupId:'',date:'2026-09-'+String(1+i%28).padStart(2,'0'),packageMonth:'2026-09',pkgName:'BIREYSEL',sessions:8,amount:4500+(i%5)*250,listPrice:4500,method:i%2?'IBAN':'Nakit',note:''});
  for(let i=0;i<205;i++) st.expenses.push({id:rnd(8),date:'2026-09-'+String(1+i%28).padStart(2,'0'),category:'Market/Yemek',amount:Math.round(Math.random()*500000)/100,note:'MOKA U /YANDEX GO '+rnd(5),accountId:'e2k5o0yh',scope:'hane',source:'card-import',fingerprint:rnd(8)+'|'+i});
  return st;
}
setTimeout(async function(){try{
  console.log('[1] Codec: gidiş-dönüş (Türkçe, emoji, vekil çift, sınır değerler), işaret, düz metin geçişi, bozuk girdi istisna');
  { const w=boot(); await tick(1200);
    const cases=['', 'a', 'abc', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'çğıöşüÇĞİÖŞÜ €₺ 🙂🧹💳 😀 \u0000￿', JSON.stringify({a:[1,2,3],b:'x'.repeat(5000),c:'yz'.repeat(3000)}), 'P'.repeat(300000), 'PLZ1:5:hello', JSON.stringify(bigState())];
    let ok=true, detail=[];
    for (const c of cases) { const r=w.eval("(function(s){ return __plzDecompress(__plzCompress(s)); })("+JSON.stringify(c)+")"); if (r!==c) { ok=false; detail.push(c.slice(0,30)); } }
    t('9 durumda gidiş-dönüş birebir', ok, detail.join(' | '));
    const big=JSON.stringify(bigState()); const zlen=w.eval("__plzCompress("+JSON.stringify(big)+").length");
    t('gerçek boyutta durum ('+big.length+' karakter) en az 8 kat küçülür', zlen*8<big.length, zlen+'/'+big.length);
    const z=w.eval("__plzCompress('{\"a\":1,\"a\":1,\"a\":1,\"a\":1,\"a\":1,\"a\":1}')");
    t('paket işareti PLZ1: + uzunluk(36) + : ve yük karakterleri 32..32799 (vekil yok)', /^PLZ1:[0-9a-z]+:/.test(z) && [...z.slice(z.indexOf(':',5)+1)].every(ch=>{ const c=ch.charCodeAt(0); return c>=32 && c<=32799; }), z.slice(0,20));
    t('düz metin __plzDecompress ile aynen döner; işaretli-görünümlü düz metin paketlenir', w.eval("__plzDecompress('{\"x\":1}')")==='{"x":1}' && w.eval("__plzIsPacked(__plzCompress('PLZ1:5:hello'))")===true);
    let thrown=0; for (const bad of ['PLZ1:zz:abc','PLZ1:100:'+String.fromCharCode(32,33,34),'PLZ1:5:','PLZ1:']) { try { w.eval("__plzDecompress("+JSON.stringify(bad)+")"); } catch(e) { thrown++; } }
    t('bozuk 4 girdi istisna atar (çökme/sonsuz döngü yok)', thrown===4, thrown);
  }

  console.log('[2] Halka slotları ve eski tek slot PAKETLİ; tekrar denetimi (aynı içerik → slot tüketmez) çözerek çalışır; __pilBackupGet çözer');
  { const w=boot(); await tick(1200); w.localStorage.clear(); w.eval("window.__PIL_LS_BUDGET=4600000");
    const raw=JSON.stringify(bigState()); w.localStorage.setItem('pilateria', raw);
    w.eval("__pilPreCloudRing("+JSON.stringify(raw)+")");
    const slot=ls(w,'pilateria_pre_cloud_1'), single=ls(w,'pilateria_pre_cloud_backup');
    t('slot 1 ve tek slot yazıldı, ikisi de paketli, ham boyutun %15\'inden küçük', !!slot && !!single && w.eval("__plzIsPacked(localStorage.getItem('pilateria_pre_cloud_1'))") && w.eval("__plzIsPacked(localStorage.getItem('pilateria_pre_cloud_backup'))") && slot.length*100 < raw.length*15, slot&&slot.length);
    const back=JSON.parse(w.eval("__pilBackupGet('pilateria_pre_cloud_1')"));
    t('__pilBackupGet → {at, h, state}; state ham JSON ile birebir', back && back.at && back.h && back.state===raw);
    w.eval("__pilPreCloudRing("+JSON.stringify(raw)+")");
    t('aynı içerik ikinci kez slot tüketmedi (ix 1 kaldı)', ls(w,'pilateria_pre_cloud_ix')==='1' && !ls(w,'pilateria_pre_cloud_2'));
    w.eval("__pilPreCloudRing("+JSON.stringify(raw.replace('"members"','"members2"'))+")");
    t('farklı içerik → slot 2', !!ls(w,'pilateria_pre_cloud_2') && ls(w,'pilateria_pre_cloud_ix')==='2');
    t('toplam yerel depo: canlı + 2 slot + tek slot < ham × 1,5 (eskiden ham × 4)', w.eval("__pilLsUsed203()") < raw.length*1.5, w.eval("__pilLsUsed203()")+'/'+raw.length);
  }

  console.log('[3] Günlük yedek paketli; var olan güne yeniden yazılmaz; bütçe paketli boyutla hesaplanır');
  { const w=boot(); await tick(1200); w.localStorage.clear(); w.eval("window.__PIL_LS_BUDGET=4600000");
    const raw=JSON.stringify(bigState()); w.localStorage.setItem('pilateria', raw);
    w.eval("__pilDailySnapshot()");
    const dk=Object.keys(w.localStorage).filter(k=>k.indexOf('pilateria_daily_')===0);
    t('bugünkü günlük yedek paketli ve çözülünce canlı ile birebir', dk.length===1 && w.eval("__plzIsPacked(localStorage.getItem('"+dk[0]+"'))") && w.eval("__pilBackupGet('"+dk[0]+"')")===raw, dk.join(','));
    const before=ls(w,dk[0]); w.localStorage.setItem('pilateria', raw.replace('"members"','"members9"')); w.eval("__pilDailySnapshot()");
    t('aynı gün ikinci çağrı yeniden yazmaz', ls(w,dk[0])===before);
    // bütçe: canlı 700K + günlük (paketli ~40K) → 800K bütçeye sığar (ham yazılsaydı sığmazdı)
    w.localStorage.clear(); w.localStorage.setItem('pilateria', raw); w.eval("window.__PIL_LS_BUDGET="+(raw.length+120000));
    w.eval("__pilDailySnapshot()");
    t('paketli günlük yedek dar bütçeye sığdı (ham sığmazdı)', Object.keys(w.localStorage).filter(k=>k.indexOf('pilateria_daily_')===0).length===1 && w.eval("__pilLsUsed203()")<=w.eval("__pilLsBudget203()"));
  }

  console.log('[4] Geri alma yedeği paketli; yeni açılışta __undoLoad çözer; eski (işaretsiz) yedek de yüklenir');
  { const w=boot(); await tick(1200); w.eval("state.members=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; save();");
    w.eval("__undoStack=[]; __undoExt={}; __undoPrevRows=null; try{localStorage.removeItem('pilateria_undo');}catch(e){}");
    w.eval("__undoSnapshot('Deneme işlemi')");
    const persisted=ls(w,'pilateria_undo');
    t('pilateria_undo paketli', !!persisted && w.eval("__plzIsPacked(localStorage.getItem('pilateria_undo'))"));
    const w2=boot(); await tick(200); w2.localStorage.setItem('pilateria', ls(w,'pilateria')); w2.localStorage.setItem('pilateria_undo', persisted); await tick(1200);
    w2.eval("__undoStack=[]; __undoLoad();");
    t('yeni açılış: yığın 1, etiket korunmuş', w2.eval("__undoStack.length")===1 && w2.eval("__undoStack[0].label")==='Deneme işlemi', w2.eval("__undoStack.length"));
    const w3=boot(); await tick(200); w3.localStorage.setItem('pilateria', ls(w,'pilateria')); w3.localStorage.setItem('pilateria_undo', JSON.stringify({label:'Eski biçim',at:new Date().toISOString(),ms:Date.now(),state:ls(w,'pilateria')})); await tick(1200);
    w3.eval("__undoStack=[]; __undoLoad();");
    t('eski işaretsiz yedek de yüklenir (geri uyum)', w3.eval("__undoStack.length")===1 && w3.eval("__undoStack[0].label")==='Eski biçim');
  }

  console.log('[5] pre_pull paketli ve çekme-öncesi geri yükleme çözer; mass_delete yazımı paketli; eski ham pre_pull da geri yüklenir');
  { const w=boot(); await tick(1200); w.eval("state.members=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; save();");
    const cur=ls(w,'pilateria');
    w.eval("__pilBackupSet('pilateria_pre_pull_backup', JSON.stringify({at:'2026-10-18T10:00:00.000Z', state: localStorage.getItem('pilateria')}))");
    t('pre_pull paketli, __pilBackupGet → at ve state', w.eval("__plzIsPacked(localStorage.getItem('pilateria_pre_pull_backup'))") && JSON.parse(w.eval("__pilBackupGet('pilateria_pre_pull_backup')")).state===cur);
    w.eval("window.location.reload=function(){ window.__reloaded=true; }; window.plConfirm=async function(){ return true; };");
    w.localStorage.setItem('pilateria', '{"members":[{"id":"zz","name":"BOZUK"}]}');
    await w.eval("restorePrePullBackup()"); await tick(1200);
    t('geri yükleme paketli yedeği çözüp canlıya yazdı', ls(w,'pilateria')===cur && !w.__msgs.some(m=>/okunamadı/.test(m)), JSON.stringify(w.__msgs).slice(0,200));
    w.localStorage.setItem('pilateria_pre_pull_backup', JSON.stringify({at:'2026-10-18T10:00:00.000Z', state: cur})); w.localStorage.setItem('pilateria', '{"members":[]}');
    await w.eval("restorePrePullBackup()"); await tick(1200);
    t('eski ham pre_pull de geri yüklenir', ls(w,'pilateria')===cur);
  }

  console.log('[6] recover.html ve kurtar.html: parseState paketli yedeği çözer; işaretsiz de okur');
  { for (const page of ['recover.html','kurtar.html']) {
      const p=path.join(DIR,page); if (!fs.existsSync(p)) { t(page+' bulundu', false, p); continue; }
      const src=fs.readFileSync(p,'utf-8').replace(/<script src="supabase-vendor.js"><\/script>/,'');
      const w=boot(src); await tick(600);
      const st=JSON.stringify({members:[{id:'a',name:'A'}],groups:[],lessons:[{id:'l'}],payments:[{id:'p'}],instructors:[]});
      const packedWrap=w.eval("__plzCompress("+JSON.stringify(JSON.stringify({at:'2026-10-18T09:00:00',state:st}))+")");
      const packedBare=w.eval("__plzCompress("+JSON.stringify(st)+")");
      const r1=JSON.parse(J(w,"parseState("+JSON.stringify(packedWrap)+")")); const r2=JSON.parse(J(w,"parseState("+JSON.stringify(packedBare)+")")); const r3=JSON.parse(J(w,"parseState("+JSON.stringify(st)+")"));
      t(page+': sarmalı paket → at + state; çıplak paket → state; işaretsiz → state', r1 && r1.at==='2026-10-18T09:00:00' && r1.state.members.length===1 && r2 && r2.state.lessons.length===1 && r3 && r3.state.payments.length===1, JSON.stringify([r1&&r1.at, !!r2, !!r3]));
      t(page+': bozuk paket null (çökmez)', w.eval("parseState('PLZ1:zz:abc')")===null);
  } }

  console.log('[7] v205: açılışta eski HAM yedekler bir kez sıkıştırılır; canlı anahtar ve küçük/ayar anahtarları dokunulmaz; bayrakla tekrar etmez; açılış akışında çağrılır');
  { const w=boot(); await tick(1200); w.localStorage.clear();
    const raw=JSON.stringify(bigState()); const pack=JSON.stringify({at:'2026-10-18T08:00:00.000Z',h:'abc',state:raw});
    w.localStorage.setItem('pilateria', raw);
    w.localStorage.setItem('pilateria_pre_cloud_1', pack); w.localStorage.setItem('pilateria_pre_cloud_2', pack.replace('abc','abd')); w.localStorage.setItem('pilateria_pre_cloud_backup', pack);
    w.localStorage.setItem('pilateria_daily_2026-10-17', raw); w.localStorage.setItem('pilateria_pre_overwrite_backup', raw); w.localStorage.setItem('pilateria_undo', JSON.stringify({label:'x',at:'2026-10-18T08:00:00.000Z',ms:Date.now(),state:raw}));
    w.localStorage.setItem('pilateria_sync', '{"a":1}'); w.localStorage.setItem('pilateria_tomb', '{}'); w.localStorage.setItem('pilateria_pre_cloud_ix','2');
    const before=w.eval("__pilLsUsed203()");
    const n=w.eval("__pilRepackBackups204()");
    const after=w.eval("__pilLsUsed203()");
    t('6 ham yedek sıkıştırıldı, toplam depo en az 4 kat küçüldü', n===6 && after*4<before, n+' '+before+'→'+after);
    t('canlı anahtar ham kaldı; küçük anahtarlar dokunulmadı; bayrak yazıldı', ls(w,'pilateria')===raw && ls(w,'pilateria_sync')==='{"a":1}' && ls(w,'pilateria_pre_cloud_ix')==='2' && ls(w,'pilateria_repack_v204')==='1');
    t('paketli yedekler çözülünce birebir (halka, günlük, pre_overwrite, undo)', w.eval("__pilBackupGet('pilateria_pre_cloud_1')")===pack && w.eval("__pilBackupGet('pilateria_daily_2026-10-17')")===raw && w.eval("__pilBackupGet('pilateria_pre_overwrite_backup')")===raw && JSON.parse(w.eval("__pilBackupGet('pilateria_undo')")).label==='x');
    t('ikinci çağrı bayrak nedeniyle 0 (tekrar etmez)', w.eval("__pilRepackBackups204()")===0);
    t('açılış akışı çağırıyor (kaynakta __pilDailySnapshot öncesi)', /__pilRepackBackups204\(\); \} catch\(e\) \{\} \/\/ v205[^\n]*\n__pilDailySnapshot\(\);/.test(html));
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
