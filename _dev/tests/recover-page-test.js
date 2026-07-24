// v113 — KURTARMA SAYFASI (recover.html) TARIH KANONU:
// Yedekler TARIHE gore YENIDEN ESKIYE siralanir; 'EN YENI' rozeti en yeni TARIHLI yedege verilir
// (kayit sayisi OLCUT DEGIL — silme mesru islemdir, dunku yedek bugunkunden KALABALIK olabilir).
// Ayrica regresyon: kart HTML'i gecerli oznitelik tirnaklariyla uretilir (curly-quote bugu),
// 'Buluta Yukle' dugmeleri gercekten baglanir, girissiz tiklama guvenlidir.
// NOT: run-tests.sh bu teste dosya olarak recover.html verir.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');

const ST = (n)=>{ // n uyeli ornek state (plain 'pilateria' formati)
  return JSON.stringify({
    members: Array.from({length:n},(_,i)=>({id:'m'+(i+1),name:'U'+(i+1),joinDate:'2026-01-01',packages:[],monthly:{}})),
    groups:[], lessons:[{id:'l1',date:'2026-07-10',time:'10:00',status:'completed',memberIds:['m1']}],
    payments:[{id:'p1',memberId:'m1',date:'2026-07-05',amount:4500,method:'cash'}],
    instructors:[], settings:{}
  });
};

const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/recover.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    w.scrollTo=()=>{}; w.Element.prototype.scrollIntoView=function(){};
    w.__ALERTS=[]; w.alert=(m)=>{w.__ALERTS.push(String(m));};
    w.__CONFIRMS=0; w.confirm=()=>{w.__CONFIRMS++; return false;};
    // ---- yerel yedek tohumlari (karisik sirada — siralamayi SAYFA yapmali) ----
    // canli hal: 3 uye
    w.localStorage.setItem('pilateria', ST(3));
    // 18 Temmuz gunluk yedegi: 5 UYE (EN KALABALIK ama EN ESKI -> rozet ALMAMALI, EN ALTTA olmali)
    w.localStorage.setItem('pilateria_daily_2026-07-18', ST(5));
    // 21 Temmuz acilis-oncesi yedegi: 2 uye (EN YENI TARIH -> rozet BUNA)
    w.localStorage.setItem('pilateria_pre_cloud_backup', JSON.stringify({at:'2026-07-21T09:00:00', state: ST(2)}));
    // 20 Temmuz gunluk yedegi: 1 uye (tarih dayAt ile anahtar adindan cikarilmali)
    w.localStorage.setItem('pilateria_daily_2026-07-20', ST(1));
    // 19 Temmuz toplu-silme ani yedegi: 4 uye
    w.localStorage.setItem('pilateria_mass_delete_backup', JSON.stringify({at:'2026-07-19T12:00:00', state: ST(4)}));
  }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  const box = d.getElementById('local-list');
  const cards = Array.from(box.querySelectorAll('.card'));
  const txt = (el)=> (el.textContent||'').replace(/\s+/g,' ');
  const memOf = (el)=>{ const m = txt(el).match(/(\d+)\s*üye/); return m ? +m[1] : -1; };

  console.log('[1] LISTE: 5 yedek karti uretildi, canli hal EN USTTE');
  t('5 kart', cards.length===5, cards.length);
  t('ilk kart CANLI hal (3 uye)', cards.length && /canlı/.test(txt(cards[0])) && memOf(cards[0])===3, cards.length?txt(cards[0]).slice(0,80):'-');
  t('canli kartta "şu an" tarihi', cards.length && /şu an/.test(txt(cards[0])));

  console.log('[2] TARIH KANONU: tarihli yedekler YENIDEN ESKIYE (21->20->19->18); kayit sayisi olcut DEGIL');
  const mems = cards.slice(1).map(memOf);
  t('sira uye sayilarindan bagimsiz TARIHE gore: [2,1,4,5]', JSON.stringify(mems)==='[2,1,4,5]', JSON.stringify(mems));
  t('gunluk yedek tarihi anahtar adindan cikti (20.07 karti var)', cards.some(c=>/20\.07\.2026/.test(txt(c))), txt(cards[2]||d.body).slice(0,60));
  t('toplu-silme ani yedegi listede', cards.some(c=>/Toplu silme/.test(txt(c))));

  console.log('[3] EN YENI ROZETI: en yeni TARIHLI yedekte (21.07, 2 uye) — EN KALABALIKTA (5 uye) DEGIL');
  const badged = cards.filter(c=>/EN YENİ/.test(txt(c)));
  t('tek rozet var', badged.length===1, badged.length);
  t('rozet 2 uyeli 21.07 yedeginde', badged.length===1 && memOf(badged[0])===2 && badged[0]===cards[1], badged.length?memOf(badged[0]):'-');
  t('rozetli kart "best" cerceveli', badged.length===1 && badged[0].className.indexOf('best')>=0, badged.length?badged[0].className:'-');
  t('5 uyeli EN ESKI yedek rozet ALMADI ve EN ALTTA', memOf(cards[4])===5 && !/EN YENİ/.test(txt(cards[4])), memOf(cards[4]));

  console.log('[4] HTML/OZNITELIK REGRESYONU: dugmeler gercek class/data-ix ile uretildi ve BAGLI');
  const btns = Array.from(box.querySelectorAll('button.restore-local'));
  t('5 "Buluta Yükle" dugmesi .restore-local sinifiyla bulundu', btns.length===5, btns.length);
  t('data-ix sayisal (0..4)', btns.length===5 && btns.every((b,i)=>String(+b.dataset.ix)===b.dataset.ix) && +btns[0].dataset.ix===0, btns.map(b=>b.dataset.ix).join(','));
  t('kart ic yapisi (.b-row/.b-title/.counts) gecerli', box.querySelectorAll('.b-row').length===5 && box.querySelectorAll('.b-title').length===5 && box.querySelectorAll('.counts').length===5);
  t('meta satirinda takvim (📅) var', box.querySelectorAll('.b-meta').length===5 && /📅/.test(txt(cards[1])));

  console.log('[5] GUVENLIK: girissiz tiklama -> "önce giriş yap" uyarisi, buluta yazma YOK');
  btns[1] && btns[1].click();
  t('tiklama patlamadi + confirm ACILMADI (giris yok)', w.__CONFIRMS===0, w.__CONFIRMS);
  t('giris uyarisi gosterildi', /giriş/.test(d.getElementById('login-status').textContent||''), d.getElementById('login-status').textContent);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },400);
