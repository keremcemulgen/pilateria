// kurtar.html — Kurtarma Konsolu: analiz dogru mu, birlestirme ESKIDEN YENIYE mi, SILME var mi?
// KRITIK KURAL: bu sayfa ASLA silme yapmaz (yalniz upsert). Test once bunu kanitlar.
const fs=require('fs'); const path=require('path'); const {JSDOM}=require('jsdom');
const file=process.argv[2] && process.argv[2].indexOf('kurtar')>=0 ? process.argv[2]
          : path.join(path.dirname(process.argv[2]||'.'),'kurtar.html');
const html=fs.readFileSync(file,'utf-8');

let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}

// ---- KAYNAK DENETIMI (DOM'dan bagimsiz) ----
console.log('[0] Kaynak: silme yok, upsert var');
t('sb.from(...).delete( HIC kullanilmiyor', !/\.from\([^)]*\)\s*\.delete\(/.test(html));
t('".delete(" hic gecmiyor', !/\.delete\(/.test(html));
t('upsert kullaniliyor', /\.upsert\(part\)/.test(html));
t('settings varsayilan olarak yazilmiyor (opt-in)', /writeSettings\|\|t!=='settings'/.test(html));
t('sifre saklanmiyor (pass alani temizleniyor)', /getElementById\('pass'\)\.value=''/.test(html));
t('sifre localStorage/bulut yazilmiyor', !/setItem\([^)]*pass/i.test(html));

// ---- DOM TESTI ----
const STORE={};
function packed(at,st){ return JSON.stringify({at:at, state:JSON.stringify(st)}); }
const mk=(ids,f)=>ids.map(f);
const S_LIVE ={members:mk(['M1','M2'],i=>({id:i,name:'U'+i})),groups:[],lessons:mk(['L1','L2','L3'],i=>({id:i,date:'2026-07-20',time:'10:00',memberName:'U'})),payments:mk(['P1'],i=>({id:i,date:'2026-07-20',amount:100})),instructors:[],settings:{a:1}};
const S_PRE  ={members:mk(['M1','M2'],i=>({id:i,name:'U'+i})),groups:[],lessons:mk(['L1','L2','L3','L4','L5','L6'],i=>({id:i,date:'2026-07-26',time:'11:00',memberName:'U'})),payments:mk(['P1','P2','P3'],i=>({id:i,date:'2026-07-26',amount:200})),instructors:[],settings:{a:2}};
const S_DAY  ={members:mk(['M1','M2'],i=>({id:i,name:'U'+i})),groups:[],lessons:mk(['L1','L2','L3','L9'],i=>({id:i,date:'2026-07-25',time:'09:00',memberName:'U'})),payments:mk(['P1','P8'],i=>({id:i,date:'2026-07-25',amount:50})),instructors:[],settings:{a:3}};
STORE['pilateria']=JSON.stringify(S_LIVE);
STORE['pilateria_pre_cloud_backup']=packed('2026-07-26T18:00:00.000Z',S_PRE);
STORE['pilateria_daily_2026-07-25']=packed(null,S_DAY);

// BULUT: hasarli hal (L1..L3, P1) — L4,L5,L6,L9 ve P2,P3,P8 YOK
const CLOUD={members:{M1:{id:'M1',name:'U1',monthly:{}},M2:{id:'M2',name:'U2',monthly:{}}},member_finance:{},groups:{},group_finance:{},
  lessons:{L1:{id:'L1',date:'2026-07-20',time:'10:00',memberName:'U'},L2:{id:'L2',date:'2026-07-20',time:'10:00',memberName:'U'},L3:{id:'L3',date:'2026-07-20',time:'10:00',memberName:'U'}},
  instructors:{},instructor_finance:{},payments:{P1:{id:'P1',date:'2026-07-20',amount:100}},instructor_payouts:{},package_types:{},campaigns:{},wa_templates:{},settings:{}};

const WRITES=[]; let DELETES=0;
// v120 Y-1: kurtarma konsolu artik SAHIP kapisi ariyor (profiles.role). Mock rolu
// disaridan degistirilebilir ki hem gecerli (owner) hem reddedilen (staff) yol denenebilsin.
let ROLE='owner';
function mockClient(){
  return {
    auth:{
      signInWithPassword:()=>Promise.resolve({data:{session:{user:{id:'u'}}},error:null}),
      getSession:()=>Promise.resolve({data:{session:{user:{id:'u',email:'a@b.c'}}},error:null})
    },
    from:function(tab){
      return {
        select:function(){
          return {
            range:function(){ const arr=Object.keys(CLOUD[tab]||{}).map(id=>({id,data:CLOUD[tab][id]})); return Promise.resolve({data:arr,error:null}); },
            order:function(){ return { limit:function(){ return Promise.resolve({data:[],error:null}); } }; },
            eq:function(){ return {
              maybeSingle:function(){ return Promise.resolve({data:null,error:null}); },
              single:function(){ return Promise.resolve(tab==='profiles'?{data:{role:ROLE},error:null}:{data:null,error:null}); }
            }; }
          };
        },
        upsert:function(rows){ WRITES.push({table:tab, ids:rows.map(r=>r.id)}); return Promise.resolve({error:null}); },
        delete:function(){ DELETES++; return { in:function(){ return Promise.resolve({error:null}); } }; }
      };
    }
  };
}

const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/kurtar.html',pretendToBeVisual:true,beforeParse(w){
  w.supabase={createClient:()=>mockClient()};
  w.alert=()=>{}; w.confirm=()=>true; w.prompt=()=>null;
  if(!w.URL.createObjectURL) w.URL.createObjectURL=()=>'blob:x';
  if(!w.URL.revokeObjectURL) w.URL.revokeObjectURL=()=>{};
  const ls={ get length(){return Object.keys(STORE).length;}, key:i=>Object.keys(STORE)[i],
    getItem:k=>(k in STORE?STORE[k]:null), setItem:(k,v)=>{STORE[k]=String(v);}, removeItem:k=>{delete STORE[k];}, clear:()=>{for(const k in STORE)delete STORE[k];} };
  Object.defineProperty(w,'localStorage',{value:ls,configurable:true});
}});
const w=dom.window,d=w.document;

setTimeout(async function(){try{
  console.log('\n[1] Yerel yedekler listelendi');
  const cards=d.querySelectorAll('#local-list .card');
  t('3 yerel kaynak gorunuyor (canli + pre_cloud + daily)', cards.length===3, cards.length);
  t('canli en ustte', /CANLI/.test(cards[0].innerHTML));
  t('pre_cloud (26 Tem) daily (25 Tem) oncesinde (yeniden eskiye)', /v103/.test(cards[1].innerHTML)&&/gunluk|günlük/i.test(cards[2].innerHTML), cards[1].textContent.slice(0,40)+' | '+cards[2].textContent.slice(0,40));

  console.log('\n[2] Giris + bulut analizi');
  d.getElementById('email').value='a@b.c'; d.getElementById('pass').value='x';
  d.getElementById('login-btn').click();
  await new Promise(r=>setTimeout(r,600));
  t('sifre alani temizlendi', d.getElementById('pass').value==='', JSON.stringify(d.getElementById('pass').value));
  t('bulut bolumu acildi', d.getElementById('cloud-part').style.display==='block');
  const an=d.querySelectorAll('#analysis .card');
  t('analiz kartlari olustu', an.length===3, an.length);

  const txt=i=>an[i].textContent.replace(/\s+/g,' ');
  t('CANLI hal kazanc 0 (bulutla ayni)', /kazanç 0/i.test(txt(0)), txt(0).slice(0,120));
  t('pre_cloud: 3 ders + 2 odeme kazandirir', /3 ders/.test(txt(1))&&/2 ödeme/.test(txt(1)), txt(1).slice(0,160));
  t('daily: 1 ders + 1 odeme kazandirir', /1 ders/.test(txt(2))&&/1 ödeme/.test(txt(2)), txt(2).slice(0,160));
  t('EN COK KAZANDIRAN etiketi pre_cloud kartinda', /EN ÇOK KAZANDIRAN/.test(an[1].innerHTML));
  t('geri gelecek kayitlar listesi var', /Geri gelecek kayıtları göster/.test(an[1].innerHTML));

  console.log('\n[3] Secim + birlesim ozeti');
  an[1].querySelector('.pick').click(); an[2].querySelector('.pick').click();
  await new Promise(r=>setTimeout(r,60));
  const mp=d.getElementById('merge-picks').textContent.replace(/\s+/g,' ');
  t('yazma sirasi ESKIDEN YENIYE: once 25 Tem (daily), sonra 26 Tem (pre_cloud)',
    mp.indexOf('Cihaz günlük yedeği') < mp.indexOf('v103') && mp.indexOf('Cihaz günlük yedeği')>=0, mp.slice(0,200));
  t('birlesim: 4 ders + 3 odeme', /4 ders/.test(mp)&&/3 ödeme/.test(mp), mp.slice(0,240));
  t('birlestir dugmesi aktif', d.getElementById('merge-btn').disabled===false);

  console.log('\n[4] Birlestirme calisir: SILME YOK, sira dogru, settings yazilmaz');
  WRITES.length=0; DELETES=0;
  d.getElementById('merge-btn').click();
  await new Promise(r=>setTimeout(r,900));
  t('HIC silme yapilmadi', DELETES===0, DELETES);
  t('upsert cagrildi', WRITES.length>0, WRITES.length);
  t('settings tablosuna YAZILMADI (varsayilan)', WRITES.every(x=>x.table!=='settings'), JSON.stringify(WRITES.filter(x=>x.table==='settings')));
  const lw=WRITES.filter(x=>x.table==='lessons');
  t('lessons iki kez yazildi (iki kaynak)', lw.length===2, lw.length);
  t('ONCE daily (L9 iceren) yazildi', lw[0]&&lw[0].ids.indexOf('L9')>=0, lw[0]&&lw[0].ids.join(','));
  t('SONRA pre_cloud (L4,L5,L6 iceren) yazildi', lw[1]&&lw[1].ids.indexOf('L6')>=0, lw[1]&&lw[1].ids.join(','));

  console.log('\n[5] Birlestirme sonrasi secim SIFIRLANIR (yanlislikla iki kez yazma korumasi)');
  t('merge sonrasi hicbir kaynak secili degil', d.querySelectorAll('#analysis .pick:checked').length===0, d.querySelectorAll('#analysis .pick:checked').length);
  t('birlestir dugmesi yeniden pasif', d.getElementById('merge-btn').disabled===true);

  console.log('\n[6] Ayarlar opt-in: isaretlenince settings YAZILIR');
  WRITES.length=0;
  const an2=d.querySelectorAll('#analysis .card');
  an2[1].querySelector('.pick').click();
  await new Promise(r=>setTimeout(r,60));
  d.getElementById('opt-settings').checked=true;
  d.getElementById('merge-btn').click();
  await new Promise(r=>setTimeout(r,900));
  t('settings yazildi (opt-in)', WRITES.some(x=>x.table==='settings'), JSON.stringify(WRITES.map(x=>x.table)));
  t('yine hic silme yok', DELETES===0, DELETES);

  // ==========================================================================
  // [7] v120 Y-1 — SAHIP KAPISI. Bu konsol tum bulutu yeniden yazabiliyor;
  // eskiden "giris yapmis olmak" yetiyordu, yani personel de birlestirebiliyordu.
  // ==========================================================================
  console.log('\n[7] v120 Y-1: PERSONEL birlestiremez (sahip kapisi)');
  ROLE='staff';
  WRITES.length=0; DELETES=0;
  const an3=d.querySelectorAll('#analysis .card');
  an3[1].querySelector('.pick').click();
  await new Promise(r=>setTimeout(r,60));
  d.getElementById('merge-btn').click();
  await new Promise(r=>setTimeout(r,900));
  t('v120 Y-1: personel rolunde HIC yazma olmadi', WRITES.length===0, WRITES.length);
  t('v120 Y-1: personel rolunde HIC silme olmadi', DELETES===0, DELETES);
  t('v120 Y-1: kullaniciya SAHIP uyarisi gosterildi',
    /SAHİP/.test(d.getElementById('merge-status').textContent), d.getElementById('merge-status').textContent.slice(0,80));
  ROLE='owner';

  console.log("\n=== kurtar-console: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},700);
