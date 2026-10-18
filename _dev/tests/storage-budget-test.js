// v203 (Kerem 18.10: Derya'nın iPhone'unda "yerel depo doldu" uyarısı; "hiçbir türlü veri eksiği olmamalı"): yerel depo BÜTÇESİ.
// KÖK: tam durum kopyaları (pilateria + 5 slot halka + eski tek slot + 3 günlük + pre_pull/pre_overwrite/mass_delete/undo) WebKit'in ~5 MB
// (2,5M karakter) kotasını aşıyor; save() kota hatasında budama da yetmezse ALERT verip gönderimi PLANLAMIYORDU (yeniden açılışta kayıp riski).
// v203: platform bütçesi (WebKit 2,3M / diğer 4,6M karakter; test: window.__PIL_LS_BUDGET), her yedek yazımından önce öncelikli feda,
// save() yazımdan önce yer açar, kota yolunda halka dahil feda edip tekrar dener, yine olmazsa bulut gönderimi mutlaka planlanır.
// Yamasız (v202) yapıda [1]–[6] BAŞARISIZ olmalı (fonksiyonlar yok / gönderim planlanmıyor).
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
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
const keys=(w)=>{ const o=[]; for(let i=0;i<w.localStorage.length;i++) o.push(w.localStorage.key(i)); return o.sort(); };
setTimeout(async function(){try{
  console.log('[1] Bütçe: platforma göre (iPhone/iPad/Safari 2,3M; Chrome/Android/Edge 4,6M); test geçersiz kılma');
  { const w=boot(); await tick(1200);
    const f=(ua,p,m)=>w.eval("__pilLsBudgetForUA203("+JSON.stringify(ua)+","+JSON.stringify(p||'')+","+(m||0)+")");
    const IPH='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
    const IPAD='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
    const CRIOS='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1';
    const WIN='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
    const AND='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
    const EDGE='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0';
    t('iPhone Safari 2,3M; iPad masaüstü modu (MacIntel + dokunma) 2,3M; iPhone Chrome (WebKit) 2,3M', f(IPH)===2300000 && f(IPAD,'MacIntel',5)===2300000 && f(CRIOS)===2300000, [f(IPH),f(IPAD,'MacIntel',5),f(CRIOS)].join(','));
    t('Windows Chrome 4,6M; Android Chrome 4,6M; Edge 4,6M; Mac Safari 2,3M', f(WIN,'Win32',0)===4600000 && f(AND)===4600000 && f(EDGE,'Win32',0)===4600000 && f(IPAD,'MacIntel',0)===2300000);
    w.eval("window.__PIL_LS_BUDGET=123456"); t('geçersiz kılma: __PIL_LS_BUDGET', w.eval("__pilLsBudget203()")===123456);
    t('kullanım sayacı: anahtar + değer karakterleri', (()=>{ w.localStorage.clear(); w.localStorage.setItem('ab','xyz'); return w.eval("__pilLsUsed203()")===5; })());
  }

  console.log('[2] Feda sırası: bozuk yedek → undo → mass_delete → pre_pull → eski günlükler → eski halka → eski tek slot → pre_overwrite → son günlük → son halka; pilateria/ayarlar asla');
  { const w=boot(); await tick(1200); w.localStorage.clear();
    const S=(k,n)=>w.localStorage.setItem(k,'x'.repeat(n));
    S('pilateria',1000); S('pilateria_sync',50); S('pilateria_tomb',20); S('pilateria_pin_hash',10);
    S('pilateria_corrupted_BACKUP_1',100); S('pilateria_undo',100); S('pilateria_undo_meta',10); S('pilateria_mass_delete_backup',100); S('pilateria_pre_pull_backup',100);
    S('pilateria_daily_2026-10-01',100); S('pilateria_daily_2026-10-02',100); S('pilateria_daily_2026-10-03',100);
    S('pilateria_pre_cloud_1',100); S('pilateria_pre_cloud_2',100); S('pilateria_pre_cloud_3',100); w.localStorage.setItem('pilateria_pre_cloud_ix','3');
    S('pilateria_pre_cloud_backup',100); S('pilateria_pre_overwrite_backup',100);
    const v=JSON.parse(J(w,"__pilLsVictims203('')"));
    t('sıra doğru', JSON.stringify(v)===JSON.stringify(['pilateria_corrupted_BACKUP_1','pilateria_undo','pilateria_undo_meta','pilateria_mass_delete_backup','pilateria_pre_pull_backup','pilateria_daily_2026-10-01','pilateria_daily_2026-10-02','pilateria_pre_cloud_1','pilateria_pre_cloud_2','pilateria_pre_cloud_backup','pilateria_pre_overwrite_backup','pilateria_daily_2026-10-03','pilateria_pre_cloud_3']), JSON.stringify(v));
    t('korunan slot listede yok', !JSON.parse(J(w,"__pilLsVictims203('pilateria_pre_cloud_3')")).includes('pilateria_pre_cloud_3'));
    const used=w.eval("__pilLsUsed203()");
    w.eval("window.__PIL_LS_BUDGET="+(used+50)); // 50 karakter boşluk var
    t('sığıyorsa dokunmaz', w.eval("__pilLsMakeRoom203(40,'pilateria')")===true && w.localStorage.length===18);
    const ok=w.eval("__pilLsMakeRoom203(300,'pilateria')"); // 250 daha gerekir → bozuk(100+~25) + undo(100+14) + undo_meta(10+19) → yeter
    t('yer açar: en değersizden başlar, yetince durur', ok===true && !ls(w,'pilateria_corrupted_BACKUP_1') && !ls(w,'pilateria_undo') && !!ls(w,'pilateria_mass_delete_backup') && !!ls(w,'pilateria_daily_2026-10-01'), keys(w).join(','));
    const ok2=w.eval("__pilLsMakeRoom203(5000,'pilateria')");
    t('imkânsız istek: her yedek gider, pilateria + ayarlar kalır, false döner', ok2===false && JSON.stringify(keys(w))===JSON.stringify(['pilateria','pilateria_pin_hash','pilateria_pre_cloud_ix','pilateria_sync','pilateria_tomb']), keys(w).join(','));
  }

  console.log('[3] save(): yazımdan ÖNCE bütçeye göre yer açar — kota hatasına düşmez, uyarı yok, yedekler feda, gönderim planlanır');
  { const w=boot(); await tick(1200);
    w.eval("state.members=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; save();");
    const base=w.eval("__pilLsUsed203()");
    // sahte yedekler: 3 günlük + 3 halka + tek slot, her biri 20K
    w.eval("['pilateria_daily_2026-10-01','pilateria_daily_2026-10-02','pilateria_daily_2026-10-03','pilateria_pre_cloud_1','pilateria_pre_cloud_2','pilateria_pre_cloud_3','pilateria_pre_cloud_backup'].forEach(function(k){ localStorage.setItem(k, 'y'.repeat(20000)); }); localStorage.setItem('pilateria_pre_cloud_ix','3');");
    const used=w.eval("__pilLsUsed203()");
    w.eval("window.__PIL_LS_BUDGET="+(used+5000)); // 5K boşluk; durum +~60K büyüyecek
    w.eval("window.__pushCalls=0; const __o=markDirtyAndSchedulePush; window.markDirtyAndSchedulePush=function(){ window.__pushCalls++; return __o.apply(this, arguments); };");
    w.eval("for (let i=0;i<300;i++) state.lessons.push({id:'L'+i,date:'2026-10-01',time:'10:00',memberIds:['m'],instructorId:'G',status:'planned',groupId:'',size:1,durationMin:45,note:''});");
    const r=w.eval("save()");
    const st=JSON.parse(ls(w,'pilateria')||'{}');
    t('save true, uyarı yok, pilateria güncel (300 ders)', r===true && !w.__msgs.some(m=>/DEPO/.test(m)) && (st.lessons||[]).length===300, JSON.stringify(w.__msgs).slice(0,200));
    t('eski günlükler ve eski halka slotları feda edildi, en yeni halka slotu kaldı', !ls(w,'pilateria_daily_2026-10-01') && !ls(w,'pilateria_pre_cloud_1') && !!ls(w,'pilateria_pre_cloud_3'), keys(w).join(','));
    t('bütçe aşılmadı; gönderim planlandı', w.eval("__pilLsUsed203()")<=w.eval("__pilLsBudget203()") && w.eval("window.__pushCalls")>=1, w.eval("__pilLsUsed203()")+'/'+w.eval("__pilLsBudget203()"));
  }

  console.log('[4] save(): yerel yazım HER ŞEYE RAĞMEN başarısız (kota) → uyarı "buluta gönderiliyor", gönderim planlanır, bellek hâli korunur');
  { const w=boot(); await tick(1200);
    w.eval("state.members=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; save();");
    w.eval("window.__pushCalls=0; const __o=markDirtyAndSchedulePush; window.markDirtyAndSchedulePush=function(){ window.__pushCalls++; return __o.apply(this, arguments); };");
    w.eval("const __set=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if (k==='pilateria') { const e=new Error('QuotaExceededError: the quota has been exceeded'); e.name='QuotaExceededError'; throw e; } return __set.call(this,k,v); };");
    w.eval("state.lessons.push({id:'LX',date:'2026-10-02',time:'11:00',memberIds:['m'],instructorId:'G',status:'planned',groupId:'',size:1,durationMin:45,note:''});");
    const r=w.eval("save()");
    t('save false, uyarı metni buluta gönderimi söylüyor, eski yanıltıcı "Ctrl+Shift+R" metni yok', r===false && w.__msgs.some(m=>/YEREL DEPO DOLU/.test(m) && /BULUTA GÖNDERİLİYOR/.test(m)) && !w.__msgs.some(m=>/Ctrl\+Shift\+R/.test(m)), JSON.stringify(w.__msgs).slice(0,300));
    t('gönderim planlandı (eski davranış: planlanmıyordu); bellekte ders duruyor; __pilLocalWriteFailed damgası', w.eval("window.__pushCalls")>=1 && w.eval("state.lessons.length")===1 && w.eval("!!window.__pilLocalWriteFailed"));
    t('agresif budama + feda denendi (undo/pre_* anahtarları yok)', !ls(w,'pilateria_undo') && !ls(w,'pilateria_pre_overwrite_backup'));
  }

  console.log('[5] Açılış-öncesi halka bütçeli: sığan kadar slot; en yeni slot her zaman; eski tek slot yalnız sığıyorsa');
  { const w=boot(); await tick(1200); w.localStorage.clear();
    w.localStorage.setItem('pilateria', JSON.stringify({members:[]}));
    const raw=i=>JSON.stringify({members:[], pad:'z'.repeat(50000), v:i});
    w.eval("window.__PIL_LS_BUDGET=130000"); // ~2 slot (50K+) + pilateria
    for (let i=1;i<=5;i++) w.eval("__pilPreCloudRing("+JSON.stringify(raw(i))+")");
    const ring=keys(w).filter(k=>/^pilateria_pre_cloud_\d$/.test(k));
    t('bütçe aşılmadı, en az 1 en fazla 2 slot, en yeni (v5) duruyor', w.eval("__pilLsUsed203()")<=130000 && ring.length>=1 && ring.length<=2 && ring.some(k=>JSON.parse(ls(w,k)).state.indexOf('"v":5')>0), keys(w).join(',')+' used:'+w.eval("__pilLsUsed203()"));
    t('eski tek slot (pre_cloud_backup) sığmadığı için yazılmadı', !ls(w,'pilateria_pre_cloud_backup'));
    w.eval("window.__PIL_LS_BUDGET=4600000");
    for (let i=6;i<=9;i++) w.eval("__pilPreCloudRing("+JSON.stringify(raw(i))+")");
    const ring2=keys(w).filter(k=>/^pilateria_pre_cloud_\d$/.test(k));
    t('bütçe genişken 5 slot halka ve tek slot geri gelir (eski davranış)', ring2.length===5 && !!ls(w,'pilateria_pre_cloud_backup'), ring2.join(','));
  }

  console.log('[6] Günlük yedek bütçeli: sığmazsa en eski günlükler düşer, yine sığmazsa atlanır (iz), pilateria dokunulmaz');
  { const w=boot(); await tick(1200); w.localStorage.clear();
    const cur=JSON.stringify({members:[{id:'a',name:'X'}], payments:[{id:'p',amount:1}], pad:'q'.repeat(30000)});
    w.localStorage.setItem('pilateria', cur);
    w.localStorage.setItem('pilateria_daily_2026-10-01','d'.repeat(30000)); w.localStorage.setItem('pilateria_daily_2026-10-02','d'.repeat(30000));
    w.eval("window.__PIL_LS_BUDGET="+(w.eval("__pilLsUsed203()")+5000));
    w.eval("__pilDailySnapshot()");
    const d=keys(w).filter(k=>k.indexOf('pilateria_daily_')===0);
    t('en eski günlük düştü, bugünkü yazıldı, bütçe aşılmadı', !ls(w,'pilateria_daily_2026-10-01') && d.some(k=>k>'pilateria_daily_2026-10-02') && w.eval("__pilLsUsed203()")<=w.eval("__pilLsBudget203()"), d.join(','));
    w.localStorage.clear(); w.localStorage.setItem('pilateria', cur);
    w.eval("window.__PIL_LS_BUDGET="+(cur.length+100)); // yeni günlüğe hiç yer yok
    w.eval("__pilDailySnapshot()");
    t('yer yoksa günlük atlanır; pilateria korunur', keys(w).filter(k=>k.indexOf('pilateria_daily_')===0).length===0 && ls(w,'pilateria')===cur);
  }

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
