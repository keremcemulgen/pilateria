// v116 — UYE ADI DEGISTIRILINCE TAKVIMDEKI AD ESKI KALIYOR (Kerem, 26 Tem)
// Sikayet: "ismini degistirdigim uyenin takvimdeki ismi geriye donuk olarak ayni kaliyor".
//
// KOK SEBEP (iki bagimsiz yol, ikisi de METIN TABANLI donmus ad):
//  (1) g.monthlyNames[ay] = uye adlarindan URETILMIS bir METIN. Uye adi degisince bu metin
//      guncellenmez -> groupDisplayName once monthlyNames'e baktigi icin takvim ESKI adi gosterir.
//      'ay <= secili ay' olan EN SON anahtar kullanildigindan hem GECMIS hem GELECEK aylar bozulur.
//  (2) g.name otomatik uretilmis olsa bile __looksLikeAutoName(g.name) her parcayi MEVCUT uye
//      adlariyla karsilastirir. Yeniden adlandirmadan sonra eski parca hicbir uyeye uymaz ->
//      'otomatik degil' sanilir -> kadrodan yeniden turetme YAPILMAZ, g.name (eski ad) donulur.
//
// KANON: ay bazli ad KADRO gecmisini korur, YAZIM gecmisini DEGIL. Ayni insan yeniden
// adlandirildiginda gecmis aylar dahil her yerde yeni adiyla gorunmelidir.
// Elle yazilmis (otomatik kalipta olmayan) adlar ASLA degistirilmemelidir.
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

// Uyeler: A ve B ayni grupta. Grup adi otomatik: "Ayşe Yılmaz - Fatma Kaya".
function seed() {
  w.eval(
    "state.members=["+
    " {id:'MA',name:'Ayşe Yılmaz',joinDate:'2026-01-01',monthly:{'2026-05':{enrolled:true},'2026-06':{enrolled:true},'2026-07':{enrolled:true}}},"+
    " {id:'MB',name:'Fatma Kaya',joinDate:'2026-01-01',monthly:{'2026-05':{enrolled:true},'2026-06':{enrolled:true},'2026-07':{enrolled:true}}},"+
    " {id:'MC',name:'Zeynep Ak',joinDate:'2026-01-01',monthly:{'2026-07':{enrolled:true}}}"+
    "];"+
    "state.groups=[{id:'G1',name:'Ayşe Yılmaz - Fatma Kaya',memberIds:['MA','MB'],packages:[],archived:false,"+
    "  monthlyNames:{'2026-05':'Ayşe Yılmaz - Fatma Kaya','2026-06':'Ayşe Yılmaz - Fatma Kaya'}}];"+
    "state.lessons=[{id:'L1',date:'2026-05-12',time:'10:00',groupId:'G1',memberIds:['MA','MB'],packageMonth:'2026-05',status:'planned'},"+
    "               {id:'L2',date:'2026-07-14',time:'10:00',groupId:'G1',memberIds:['MA','MB'],packageMonth:'2026-07',status:'planned'}];"+
    "state.payments=[]; state.instructors=[];"
  );
}
const disp = (ay)=> w.eval("groupNameForMonth('G1','"+ay+"')");
// Uyeyi YENIDEN ADLANDIR — uygulamanin gercek yolu (saveMember) uzerinden.
function rename(id, yeniAd) {
  w.eval(
    "(function(){ var m=state.members.find(x=>x.id==='"+id+"');"+
    " document.getElementById('mm-id').value='"+id+"';"+
    " document.getElementById('mm-name').value='"+yeniAd+"';"+
    " document.getElementById('mm-tcno').value=m.tcno||'';"+
    " document.getElementById('mm-phone').value=m.phone||'';"+
    " document.getElementById('mm-join').value=m.joinDate||'2026-01-01';"+
    " document.getElementById('mm-adres').value='';"+
    " document.getElementById('mm-instructor').value='';"+
    " document.getElementById('mm-health').value='';"+
    " document.getElementById('mm-note').value='';"+
    " document.getElementById('mm-share-rate').value='';"+
    " document.getElementById('mm-total-price').value='';"+
    " var s=document.getElementById('mm-sessions'); if(s) s.value='';"+
    " window.__memberEditCtxMonth='';"+
    " saveMember(); })()"
  );
}

setTimeout(async ()=>{ try {
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','setCloudDot','plToast','save','closeModal','refreshMemberDetailIfOpen','refreshGroupDetailIfOpen'].forEach(fn=>window[fn]=function(){});");

  console.log('[1] BASLANGIC: otomatik ad her ayda dogru gorunuyor');
  seed();
  t('mayıs adı doğru', disp('2026-05')==='Ayşe Yılmaz - Fatma Kaya', disp('2026-05'));
  t('temmuz adı doğru', disp('2026-07')==='Ayşe Yılmaz - Fatma Kaya', disp('2026-07'));

  console.log('[2] ⛔ HATA: üye yeniden adlandırılınca donmuş monthlyNames ESKİ adı gösteriyor');
  rename('MA','Ayşe Demir');
  t('üye adı state içinde değişti', w.eval("state.members.find(x=>x.id==='MA').name")==='Ayşe Demir', w.eval("state.members.find(x=>x.id==='MA').name"));
  t('GEÇMİŞ ay (2026-05) yeni adı gösterir', disp('2026-05')==='Ayşe Demir - Fatma Kaya', disp('2026-05'));
  t('GEÇMİŞ ay (2026-06) yeni adı gösterir', disp('2026-06')==='Ayşe Demir - Fatma Kaya', disp('2026-06'));
  t('GÜNCEL ay (2026-07) yeni adı gösterir', disp('2026-07')==='Ayşe Demir - Fatma Kaya', disp('2026-07'));

  console.log('[3] ⛔ HATA: monthlyNames HİÇ yokken de g.name donuyor (__looksLikeAutoName kırılır)');
  seed();
  w.eval("delete state.groups[0].monthlyNames;");
  rename('MA','Ayşe Demir');
  t('monthlyNames yokken de yeni ad türetilir', disp('2026-07')==='Ayşe Demir - Fatma Kaya', disp('2026-07'));
  t('g.name alanı da tazelendi', w.eval("state.groups[0].name")==='Ayşe Demir - Fatma Kaya', w.eval("state.groups[0].name"));

  console.log('[4] ESKİ "/" (ilk isim) BİÇİMİ de tazelenir');
  seed();
  w.eval("state.groups[0].name='Ayşe/Fatma'; state.groups[0].monthlyNames={'2026-05':'Ayşe/Fatma'};");
  rename('MA','Ayşe Demir');
  t('ilk isim aynı kaldığı için "/" biçimi bozulmaz', disp('2026-05')==='Ayşe/Fatma', disp('2026-05'));
  seed();
  w.eval("state.groups[0].name='Ayşe/Fatma'; state.groups[0].monthlyNames={'2026-05':'Ayşe/Fatma'};");
  rename('MA','Hatice Demir');
  t('ilk isim değişince "/" biçimi de tazelenir', disp('2026-05')==='Hatice/Fatma', disp('2026-05'));

  console.log('[5] 🛡️ ELLE YAZILMIŞ AD ASLA DEĞİŞMEZ (kanon korunur)');
  seed();
  w.eval("state.groups[0].name='Sabah Ekibi'; state.groups[0].monthlyNames={'2026-05':'Sabah Ekibi','2026-06':'Pazartesi Grubu'};");
  rename('MA','Ayşe Demir');
  t('elle ad (mayıs) DOKUNULMADI', disp('2026-05')==='Sabah Ekibi', disp('2026-05'));
  t('elle ad (haziran) DOKUNULMADI', disp('2026-06')==='Pazartesi Grubu', disp('2026-06'));
  t('elle g.name DOKUNULMADI', w.eval("state.groups[0].name")==='Sabah Ekibi', w.eval("state.groups[0].name"));

  console.log('[6] 🛡️ KADRO GEÇMİŞİ KORUNUR: adı geçmeyen ay yeniden yazılmaz');
  seed();
  // Haziranda grup yalnizca Fatma+Zeynep idi; Ayşe o ayda YOK.
  w.eval("state.groups[0].monthlyNames={'2026-05':'Ayşe Yılmaz - Fatma Kaya','2026-06':'Fatma Kaya - Zeynep Ak'};");
  rename('MA','Ayşe Demir');
  t('mayıs (adı geçiyor) tazelendi', disp('2026-05')==='Ayşe Demir - Fatma Kaya', disp('2026-05'));
  t('haziran (adı geçmiyor) AYNEN kaldı', disp('2026-06')==='Fatma Kaya - Zeynep Ak', disp('2026-06'));

  console.log('[7] 🛡️ AD DEĞİŞMEDİYSE hiçbir şeye dokunulmaz');
  seed();
  const __before = w.eval("JSON.stringify(state.groups)");
  rename('MA','Ayşe Yılmaz'); // aynı ad
  t('gruplar bit bit aynı', w.eval("JSON.stringify(state.groups)")===__before);

  console.log('[8] 🛡️ ADAŞ KORUMASI: aynı ada sahip BAŞKA üye varsa metin yeniden yazılmaz');
  seed();
  w.eval("state.members.push({id:'MD',name:'Ayşe Yılmaz',joinDate:'2026-01-01',monthly:{'2026-07':{enrolled:true}}});");
  rename('MA','Ayşe Demir');
  t('adaş varken donmuş metne DOKUNULMAZ (yanlış kişiyi yeniden adlandırma riski)', disp('2026-05')==='Ayşe Yılmaz - Fatma Kaya', disp('2026-05'));

  console.log('[9] BİREYSEL ders adı zaten CANLI (regresyon koruması)');
  seed();
  rename('MA','Ayşe Demir');
  t('memberName canlı çözer', w.eval("memberName('MA')")==='Ayşe Demir', w.eval("memberName('MA')"));

  console.log('[10] KAYNAK: yeniden adlandırma yayılımı saveMember içinde ÇAĞRILIYOR');
  t('__propagateMemberRename tanımlı', w.eval("typeof __propagateMemberRename")==='function', w.eval("typeof __propagateMemberRename"));
  t('saveMember içinde çağrılıyor', /__propagateMemberRename\(/.test(html) && (html.match(/__propagateMemberRename\(/g)||[]).length>=2, (html.match(/__propagateMemberRename\(/g)||[]).length);

  // v116 ONARIM: yama ONCESI yapilmis yeniden adlandirmalar MEVCUT veride bayat kalmis olabilir
  // (Kerem'in verisi tam boyle). Onarim kadroyla KONUM KONUM hizalar. Asagidaki "bayat" durumlar
  // saveMember'dan GECMEDEN dogrudan state uzerinde uretilir.
  const staleRename = (id, yeniAd)=> w.eval("state.members.find(x=>x.id==='"+id+"').name='"+yeniAd+"';");
  const repair = ()=> w.eval("__repairStaleGroupNames(state)");

  console.log('[11] ⛔→✅ ONARIM: yama ÖNCESİ donmuş kalan adlar kadroyla tazelenir');
  seed(); staleRename('MA','Ayşe Demir');
  t('onarım öncesi BAYAT (hata tekrar üretildi)', disp('2026-05')==='Ayşe Yılmaz - Fatma Kaya', disp('2026-05'));
  repair();
  t('onarım sonrası GEÇMİŞ ay tazelendi', disp('2026-05')==='Ayşe Demir - Fatma Kaya', disp('2026-05'));
  t('onarım sonrası haziran da tazelendi', disp('2026-06')==='Ayşe Demir - Fatma Kaya', disp('2026-06'));
  t('onarım ETKİSİZ-TEKRARLI (ikinci çağrı 0 değişiklik)', repair()===0, repair());

  console.log('[12] 🛡️ ONARIM EŞİKLERİ: elle yazılmış adlar korunur');
  seed(); staleRename('MA','Ayşe Demir');
  w.eval("state.groups[0].name='Sabah Ekibi'; state.groups[0].monthlyNames={'2026-05':'Sabah Ekibi'};");
  t('tek parçalı elle ad DOKUNULMADI', repair()===0 && disp('2026-05')==='Sabah Ekibi', disp('2026-05'));
  seed(); staleRename('MA','Ayşe Demir');
  // iki parca da hicbir uyeye uymuyor => bu bir yeniden adlandirma DEGIL, elle yazilmis bir ad
  // (g.name da elle yapilir; aksi halde onun onarimi sayaci kirletir)
  w.eval("state.groups[0].name='Sabah Ekibi'; state.groups[0].monthlyNames={'2026-05':'Sabah - Akşam'};");
  t('İKİ parça bayatsa (yeniden adlandırma değil) DOKUNULMADI', repair()===0 && disp('2026-05')==='Sabah - Akşam', disp('2026-05'));
  seed(); staleRename('MA','Ayşe Demir');
  w.eval("state.groups[0].name='Sabah Ekibi'; state.groups[0].monthlyNames={'2026-05':'Ayşe Yılmaz - Fatma Kaya - Zeynep Ak'};");
  t('kadro sayısı tutmuyorsa DOKUNULMADI', repair()===0 && disp('2026-05')==='Ayşe Yılmaz - Fatma Kaya - Zeynep Ak', disp('2026-05'));
  seed(); staleRename('MA','Ayşe Demir');
  w.eval("state.members.push({id:'MD',name:'Ayşe Yılmaz',joinDate:'2026-01-01',monthly:{'2026-07':{enrolled:true}}});");
  t('adaş varken onarım DOKUNMAZ', repair()===0 && disp('2026-05')==='Ayşe Yılmaz - Fatma Kaya', disp('2026-05'));
  seed(); staleRename('MA','Ayşe Demir');
  w.eval("state.groups[0].monthlyNames={'2026-05':'Ayşe Yılmaz - Fatma Kaya','2026-06':'Fatma Kaya - Zeynep Ak'};");
  repair();
  t('onarımda da KADRO GEÇMİŞİ korunur (adı geçmeyen ay aynen)', disp('2026-06')==='Fatma Kaya - Zeynep Ak', disp('2026-06'));

  console.log('[13] KAYNAK: onarım açılış göçüne bağlı (mevcut bayat veri kendiliğinden düzelir)');
  t('__repairStaleGroupNames tanımlı', w.eval("typeof __repairStaleGroupNames")==='function', w.eval("typeof __repairStaleGroupNames"));
  t('applyV10MigrationToState içinde çağrılıyor', /__repairStaleGroupNames\(s\);/.test(html));

  console.log('\n=== rename-propagation: '+pass+' gecti, '+fail+' kaldi ===');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} }, 900);
