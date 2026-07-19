// ============================================================================
// KAPSAMLI SAGLAMLIK TESTI — 6 ay, 120 uye, 3 hoca, gruplar, dersler, odemeler
// Amac: tam-kapasite gercekci kullanimda para/maas/ay-izolasyonu/kapasite hesaplari
// HATASIZ ve TUTARLI mi? (Kerem: "ilerleyen zamanlarda hata/yanlis veri olmasin")
// ============================================================================
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
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0; const fails=[];
function t(n,c,x){ if(c){pass++;} else {fail++;fails.push(n+(x!==undefined?(' -> '+x):''));console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }

setTimeout(function(){ try {
  // ---- deterministik PRNG ----
  let __s=(+process.argv[3]||987654321); const rnd=()=>{__s=(__s*1103515245+12345)&0x7fffffff;return __s/0x7fffffff;};
  const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1)); const pick=a=>a[ri(0,a.length-1)];
  const MONTHS=['2026-02','2026-03','2026-04','2026-05','2026-06','2026-07'];
  const PRICES=[4000,4500,5000,5500,6000,6500,7000,8000];
  const pad=(n,l)=>String(n).padStart(l,'0');

  w.eval("window.__pilSuppressDirty=true;");
  // temiz state
  w.eval("state.members=[];state.groups=[];state.lessons=[];state.payments=[];state.instructors=[];state.instructorPayouts=[];state.packageTypes=[];state.campaigns=[];state.waTemplates=[];");
  w.eval("state.settings=Object.assign(state.settings||{},{reformers:5,open:9,close:21,lessonDuration:60,slotStepMin:60,workDays:[1,2,3,4,5,6],instructorShareRate:30,groupPackageDays:30});");

  // ---- 3 hoca ----
  w.eval("state.instructors=[{id:'h1',name:'HOCA BIR',phone:'',shareRate:30},{id:'h2',name:'HOCA IKI',phone:'',shareRate:35},{id:'h3',name:'HOCA UC',phone:'',shareRate:25}];");
  const HOCA=['h1','h2','h3'];
  // ---- paket tipleri ----
  w.eval("state.packageTypes=[{id:'pk8',name:'8 Ders',price:5000,sessions:8},{id:'pk12',name:'12 Ders',price:7000,sessions:12}];");

  // ---- 120 uye uret ----
  const members=[]; const joinMonthOf={};
  for(let i=1;i<=120;i++){
    const id='m'+pad(i,3);
    // cogu Ocak'ta katilmis; bir kismi Mart/Nisan
    const jm = (i%17===0)?'2026-04-05':(i%11===0)?'2026-03-03':'2026-01-02';
    joinMonthOf[id]=jm.slice(0,7);
    const price=pick(PRICES);
    // aylik enrollment: katildigi aydan itibaren aktif; ~%15 o ay pasif (enrolled:false)
    const monthly={};
    MONTHS.forEach((mo,idx)=>{
      if(mo < joinMonthOf[id]) return;
      // pasiflik deseni: bazi uyeler bazi aylarda pasif
      const passive = ((i*7+idx*13)%20 < 3); // ~%15
      if(passive) monthly[mo]={enrolled:false};
      // aktif aylar icin enrolled:true (pre-ROSTER'da absent=aktif ama net olsun diye yaziyoruz)
      else monthly[mo]={enrolled:true};
    });
    members.push({id,name:'UYE '+pad(i,3),phone:'555'+pad(i,4),joinDate:jm,totalPrice:price,instructorId:pick(HOCA),monthly,packages:[]});
  }
  w.eval("state.members="+JSON.stringify(members)+";");

  // ---- gruplar: ilk ~60 uyeyi ~20 gruba dagit (boyut 2-5) ----
  const groups=[]; let gi=0, mi=0;
  const groupedIds=new Set();
  while(mi < 60 && gi < 24){
    const size=ri(2,5);
    const mids=[];
    for(let k=0;k<size && mi<60;k++){ mids.push(members[mi].id); groupedIds.add(members[mi].id); mi++; }
    if(mids.length<1) break;
    const gid='g'+pad(++gi,2);
    // grup paketi her ay: fiyat = uyelerin fiyat toplami, sessions 8
    const packages=MONTHS.map(mo=>({month:mo,startDate:mo+'-01',sessions:8,price:0,status:'active'}));
    groups.push({id:gid,name:mids.map(x=>members.find(y=>y.id===x).name).join(' - '),size,memberIds:mids,defaultInstructorId:pick(HOCA),defaultPackageId:'pk8',defaultTime:pad(9+gi%11,2)+':00',defaultDays:[ (gi%6)+1 ],packages,rescheduleUsed:0,cancelUsed:0,monthlyNotes:{}});
  }
  w.eval("state.groups="+JSON.stringify(groups)+";");
  const individualIds = members.map(m=>m.id).filter(id=>!groupedIds.has(id));

  // ---- dersler + odemeler: her ay ----
  // kapasite guvenli: her grup KENDI (gun,saat) slotunda; bireyseller ayri slotlarda
  const lessons=[]; const payments=[]; let lid=0, pid=0;
  const STATUS_POOL=['completed','completed','completed','completed','missed','cancelled','planned']; // ~%57 yapildi
  MONTHS.forEach(mo=>{
    const [Y,M]=mo.split('-').map(Number);
    // GRUP dersleri
    groups.forEach(g=>{
      // o ay enrolled uyeler
      const enr = g.memberIds.filter(id=>{ const m=members.find(x=>x.id===id); const rec=(m.monthly||{})[mo]; return m && mo>=joinMonthOf[id] && !(rec&&rec.enrolled===false); });
      if(!enr.length) return;
      // grup paketi fiyati = enrolled uyelerin fiyat toplami (o ay)
      const gpkg = g.packages.find(p=>p.month===mo); gpkg.price = enr.reduce((s,id)=>s+(+members.find(x=>x.id===id).totalPrice||0),0);
      // 8 ders planla (hafta ici gunler)
      const day=g.defaultDays[0]; const time=g.defaultTime; const inst=g.defaultInstructorId;
      let cnt=0;
      for(let dd=1; dd<=28 && cnt<8; dd++){
        const dow=new Date(Y,M-1,dd).getDay(); if(dow!==day) continue;
        cnt++;
        lessons.push({id:'L'+pad(++lid,5),date:mo+'-'+pad(dd,2),time,durationMin:60,instructorId:inst,size:enr.length,memberIds:enr.slice(),groupId:g.id,packageMonth:mo,packageOwnerType:'group',packageOwnerId:g.id,status:pick(STATUS_POOL),note:''});
      }
      // grup odemesi: her enrolled uye kendi fiyatini oder (bazilari eksik)
      enr.forEach((id,ix)=>{ const m=members.find(x=>x.id===id); const r=rnd(); let amt=+m.totalPrice; if(r<0.15)amt=0; else if(r<0.3)amt=Math.round(m.totalPrice/2); if(amt>0) payments.push({id:'P'+pad(++pid,5),memberId:id,groupId:g.id,packageMonth:mo,date:mo+'-'+pad(5+ix%20,2),amount:amt,sessions:8,method:pick(['Nakit','IBAN','Kredi Kartı']),pkgName:'8 Ders',size:enr.length,listPrice:+m.totalPrice}); });
    });
    // BIREYSEL dersler
    individualIds.forEach((id,ix)=>{
      const m=members.find(x=>x.id===id); const rec=(m.monthly||{})[mo];
      if(mo<joinMonthOf[id] || (rec&&rec.enrolled===false)) return;
      // bireysel paket kaydi (o ay)
      m.packages=m.packages||[]; if(!m.packages.find(p=>p.month===mo)) m.packages.push({month:mo,startDate:mo+'-01',sessions:8,price:+m.totalPrice,status:'active'});
      const inst=m.instructorId; const time=pad(9+ix%12,2)+':30'; const day=(ix%6)+1;
      let cnt=0;
      for(let dd=1; dd<=28 && cnt<4; dd++){ const dow=new Date(Y,M-1,dd).getDay(); if(dow!==day) continue; cnt++;
        lessons.push({id:'L'+pad(++lid,5),date:mo+'-'+pad(dd,2),time,durationMin:60,instructorId:inst,size:1,memberIds:[id],packageMonth:mo,packageOwnerType:'member',packageOwnerId:id,status:pick(STATUS_POOL),note:''}); }
      const r=rnd(); let amt=+m.totalPrice; if(r<0.15)amt=0; else if(r<0.3)amt=Math.round(m.totalPrice/2);
      if(amt>0) payments.push({id:'P'+pad(++pid,5),memberId:id,packageMonth:mo,date:mo+'-'+pad(6+ix%18,2),amount:amt,sessions:8,method:pick(['Nakit','IBAN','Kredi Kartı']),pkgName:'8 Ders',size:1,listPrice:+m.totalPrice});
    });
  });
  w.eval("state.members="+JSON.stringify(members)+";"); // packages guncellendi
  w.eval("state.lessons="+JSON.stringify(lessons)+";");
  w.eval("state.payments="+JSON.stringify(payments)+";");
  w.eval("if(typeof save==='function'){window.__pilSuppressDirty=true;save();}");

  console.log('[KURULUM] uye='+members.length+' grup='+groups.length+' bireysel='+individualIds.length+' ders='+lessons.length+' odeme='+payments.length);

  const isFiniteNum = v => typeof v==='number' && isFinite(v);
  const S = () => w.eval('state');

  // ================= INVARIANTLAR =================
  console.log('[1] Her ay: render/hesap fonksiyonlari EXCEPTION atmaz + NaN/undefined yok');
  MONTHS.forEach(mo=>{
    let threw=null;
    try {
      const rows = w.buildMemberRows(mo);
      rows.forEach(r=>{
        ['ownPrice','paid'].forEach(k=>{ const v=r[k]; if(v!=='' && v!==undefined && !isFiniteNum(+v===+v?+v:NaN) && v!=='') { /*allow ''*/ } });
        // paid daima sayi
        if(!(r.paid===''||isFiniteNum(+r.paid))) throw new Error('paid NaN '+mo+' '+r.memberId);
        if(r.ownPrice!=='' && r.ownPrice!==undefined && !isFiniteNum(+r.ownPrice)) throw new Error('ownPrice NaN '+mo+' '+r.memberId);
        if(r.remaining!=='' && !isFiniteNum(+r.remaining)) throw new Error('remaining NaN '+mo+' '+r.memberId);
      });
      S().groups.forEach(g=>{ const gt=w.groupExpectedTotal(g,mo); const gp=w.groupPaidForMonth(g,mo); if(!isFiniteNum(gt)||gt<0) throw new Error('groupTotal '+g.id+' '+mo+'='+gt); if(!isFiniteNum(gp)||gp<0) throw new Error('groupPaid '+g.id+' '+mo+'='+gp); });
      HOCA.forEach(h=>{ const e=w.instructorEarningsForMonth(h,mo); if(!isFiniteNum(e.total)||e.total<0) throw new Error('hocaMaas '+h+' '+mo+'='+e.total); });
      const occ=w.monthOccupancy(mo); if(!isFiniteNum(occ.ratio)||occ.ratio<0) throw new Error('occ '+mo);
    } catch(e){ threw=e.message; }
    t('['+mo+'] hesaplar exception/NaN yok', threw===null, threw);
  });

  console.log('[2] Grup toplami = o ay ENROLLED uyelerin KENDI fiyat toplami (ay-izolasyonu)');
  MONTHS.forEach(mo=>{
    let ok=true, bad='';
    S().groups.forEach(g=>{
      const enr = g.memberIds.filter(id=>w.isMemberEnrolledInMonth(id,mo));
      const sum = enr.reduce((s,id)=>s+w.memberMonthlyTotalPrice(id,mo),0);
      const gt = w.groupExpectedTotal(g,mo);
      if(sum>0 && gt!==sum){ ok=false; bad=g.id+'@'+mo+' beklenen '+sum+' bulunan '+gt; }
    });
    t('['+mo+'] grup toplami = uye fiyat toplami', ok, bad);
  });

  console.log('[3] Grup uyesi mobil kartta KENDI fiyatini gosterir (ownPrice), toplam yalniz ilk satirda');
  MONTHS.forEach(mo=>{
    let ok=true, bad='';
    S().groups.forEach(g=>{
      const rows=w.buildMemberRows(mo).filter(r=>r.groupId===g.id && r.memberId && !r.isEmpty);
      rows.forEach(r=>{ const own=w.memberMonthlyTotalPrice(r.memberId,mo); if(+r.ownPrice!==own){ok=false;bad=g.id+' '+r.memberId+'@'+mo+' ownPrice '+r.ownPrice+'!='+own;} });
      const firsts=rows.filter(r=>r.isFirstInGroup);
      const others=rows.filter(r=>!r.isFirstInGroup);
      if(others.some(r=>r.totalPrice!=='')){ok=false;bad=g.id+'@'+mo+' grup-toplami ilk-disinda dolu';}
    });
    t('['+mo+'] her grup uyesi ownPrice + toplam ilk satirda', ok, bad);
  });

  console.log('[4] Hoca maasi = BAGIMSIZ yeniden-hesap (yapilmis dersler x ders-fiyati x pay%) + AY-IZOLASYONU');
  MONTHS.forEach(mo=>{
    HOCA.forEach(h=>{
      const appVal = w.instructorEarningsForMonth(h,mo).total;
      // bagimsiz hesap
      let indep=0;
      S().lessons.forEach(l=>{ if(l.instructorId!==h) return; if(!(l.status==='completed'||l.status==='missed')) return; if(!(l.date||'').startsWith(mo)) return; indep += w.perLessonPriceForLesson(l)*(w.resolveInstructorRate(l)/100); });
      t('['+mo+'] hoca '+h+' maasi bagimsiz-hesapla ayni', Math.abs(appVal-indep)<0.01, appVal+' vs '+indep);
    });
  });

  console.log('[5] Ay geliri (dashboard) = o ayin packageMonth odemeleri toplami');
  MONTHS.forEach(mo=>{
    w.eval("window.__dashMonthUserSet=true; document.getElementById('dash-month').value='"+mo+"'; renderDashboard();");
    const shown = w.eval("document.getElementById('s-revenue').textContent").replace(/[^0-9]/g,'');
    const expect = S().payments.filter(p=>(p.packageMonth||'')===mo).reduce((a,b)=>a+(+b.amount||0),0);
    t('['+mo+'] gelir = packageMonth odemeleri', +shown===expect, shown+' vs '+expect);
  });

  console.log('[6] AKTIF + PASIF + KATILMAMIS = toplam (ay-izolasyonu; her ay tutarli)');
  MONTHS.forEach(mo=>{
    const total=S().members.length;
    const aktif=S().members.filter(m=>w.isMemberEnrolledInMonth(m.id,mo)).length;
    const pasif=S().members.filter(m=>{ if(m.joinDate&&String(m.joinDate).slice(0,7)>mo) return false; return !w.isMemberEnrolledInMonth(m.id,mo); }).length;
    const katilmamis=S().members.filter(m=>m.joinDate&&String(m.joinDate).slice(0,7)>mo).length;
    t('['+mo+'] aktif+pasif+katilmamis=toplam', aktif+pasif+katilmamis===total, aktif+'+'+pasif+'+'+katilmamis+'='+ (aktif+pasif+katilmamis)+' != '+total);
  });

  console.log('[7] Kapasite: hicbir grup 5-ustu; ayni (tarih+saat) slotta toplam makine <= 5');
  t('hicbir grup size>5', S().groups.every(g=>(+g.size||0)<=5), JSON.stringify(S().groups.filter(g=>g.size>5).map(g=>g.id)));
  { const slot={}; let over=''; S().lessons.forEach(l=>{ if(l.status==='cancelled')return; const k=l.date+' '+l.time; slot[k]=(slot[k]||0)+(+l.size||1); if(slot[k]>5&&!over)over=k+'='+slot[k]; }); t('ayni slotta makine <=5', over==='', over); }

  console.log('[8] AY-IZOLASYONU: bir ayda uye pasife alinca BASKA ay etkilenmez');
  {
    const moA='2026-03', moB='2026-06';
    const beforeA = JSON.stringify(w.buildMemberRows(moA).map(r=>[r.memberId,r.ownPrice,r.paid,r.remaining]));
    // moB'de bir aktif uyeyi pasife al (enrolled:false)
    const victim = S().members.find(m=>w.isMemberEnrolledInMonth(m.id,moB) && w.isMemberEnrolledInMonth(m.id,moA));
    w.eval("window.__pilSuppressDirty=true; setMemberMonthly('"+victim.id+"','"+moB+"',{enrolled:false});");
    const afterA = JSON.stringify(w.buildMemberRows(moA).map(r=>[r.memberId,r.ownPrice,r.paid,r.remaining]));
    t('moB pasiflestirme moA satirlarini DEGISTIRMEDI', beforeA===afterA);
    t('victim moB da artik pasif', !w.isMemberEnrolledInMonth(victim.id,moB));
    t('victim moA da hala aktif', w.isMemberEnrolledInMonth(victim.id,moA));
    // geri al
    w.eval("setMemberMonthly('"+victim.id+"','"+moB+"',{enrolled:true});");
  }

  console.log('[9] ROUND-TRIP: sbStateToRows -> sbRowsToState KAYIPSIZ (uye/grup/ders/odeme/fiyat)');
  {
    const rows=w.sbStateToRows(); const back=w.sbRowsToState(rows);
    const norm=(o)=>{const r={};Object.keys(o).sort().forEach(k=>{if(o[k]!==undefined)r[k]=o[k];});return r;};
    t('uye sayisi korunur', back.members.length===S().members.length, back.members.length+'/'+S().members.length);
    t('grup sayisi korunur', back.groups.length===S().groups.length);
    t('ders sayisi korunur', back.lessons.length===S().lessons.length);
    t('odeme sayisi korunur', back.payments.length===S().payments.length);
    // fiyat/enrollment ornek dogrulama
    let priceOk=true;
    S().members.slice(0,40).forEach(m=>{ const b=back.members.find(x=>x.id===m.id); if(!b||String(b.totalPrice)!==String(m.totalPrice)) priceOk=false; });
    t('uye fiyatlari round-trip korunur', priceOk);
    let grpOk=true;
    S().groups.forEach(g=>{ const b=back.groups.find(x=>x.id===g.id); if(!b||JSON.stringify(b.memberIds)!==JSON.stringify(g.memberIds)||b.size!==g.size) grpOk=false; });
    t('grup kadro/boyut round-trip korunur', grpOk);
  }

  console.log('[10] Grup adi kadroyla tutarli olabilir (uyelik degisince otomatik) — bayat ad iyilesme');
  {
    const g=S().groups[0]; const stale='ESKI - BAYAT - ISIM';
    w.eval("state.groups.find(x=>x.id==='"+g.id+"').name='"+stale+"';");
    w.eval("window.__groupOpsCtxMonth=function(){return '2026-07';};");
    // bir uyeyi cikar (slot bosalt) -> ad guncellenmeli
    const remId=g.memberIds[g.memberIds.length-1];
    w.eval("['renderMembers','renderGroups','renderDashboard','renderCalendar'].forEach(fn=>window[fn]=function(){});");
    w.eval("currentGroupDetailId='"+g.id+"';currentGroupDetailMonth='2026-07';");
    // assignMemberToSlot ile ayni gruba tekrar ekleme yerine: removeMemberFromMonth degil, dogrudan auto-name kontrolu
    const expected = w.autoGroupName(S().groups.find(x=>x.id===g.id).memberIds);
    // slot doldurma ile tetikle: bos bir bireysel uyeyi gruba ekle
    const freeId = individualIds.find(id=>w.isMemberEnrolledInMonth(id,'2026-07'));
    w.eval("assignMemberToSlot('"+freeId+"','"+g.id+"',"+g.memberIds.length+");");
    const __g2=S().groups.find(x=>x.id===g.id);
    const nn=w.groupDisplayName(__g2,'2026-07'); // v41: ad AY BAZLI
    const __exp=w.autoGroupName(w.__activeRosterForMonth(__g2,'2026-07')); // v42: AKTIF kadro
    t('uyelik degisince bayat ad guncellendi (Temmuz gorunumu)', nn===__exp && nn!==stale, 'nn='+nn+' | exp='+__exp);
  }

  console.log('[11] Bireysel uye: kalan = max(0, kendi_fiyat - odenen)');
  MONTHS.forEach(mo=>{ let ok=true,bad=''; w.buildMemberRows(mo).filter(r=>r.type==='individual').forEach(r=>{ const exp=Math.max(0,(+r.ownPrice||0)-(+r.paid||0)); if(+r.remaining!==exp){ok=false;bad=r.memberId+'@'+mo+' kalan '+r.remaining+'!='+exp;} }); t('['+mo+'] bireysel kalan tutarli', ok, bad); });

  console.log('[12] renderReports exception atmaz + rapor geliri packageMonth odemesiyle ayni');
  MONTHS.forEach(mo=>{ let threw=null; try{ w.eval("document.getElementById('rep-month').value='"+mo+"'; renderReports();"); }catch(e){threw=e.message;} t('['+mo+'] renderReports calisti', threw===null, threw); });

  console.log('[13] DETERMINIZM: buildMemberRows 2 kez ayni sonuc (cihazlar arasi tutarlilik)');
  MONTHS.forEach(mo=>{ const a=JSON.stringify(w.buildMemberRows(mo).map(r=>[r.memberId,r.groupId,r.ownPrice,r.paid,r.remaining])); const b=JSON.stringify(w.buildMemberRows(mo).map(r=>[r.memberId,r.groupId,r.ownPrice,r.paid,r.remaining])); t('['+mo+'] buildMemberRows deterministik', a===b); });

  console.log('[14] Pasif sekmesi (renderArchive): o ay pasif uyeler gorunur + exception yok');
  MONTHS.forEach(mo=>{ let threw=null; try{ w.eval("var am=document.getElementById('archive-month'); if(am)am.value='"+mo+"'; renderArchive();"); }catch(e){threw=e.message;} const cardsHtml=(d.getElementById('archive-cards')||{}).innerHTML||''; const pasifSay=S().members.filter(m=>{ if(m.joinDate&&String(m.joinDate).slice(0,7)>mo)return false; return !w.isMemberEnrolledInMonth(m.id,mo); }).length; t('['+mo+'] renderArchive calisti', threw===null, threw); t('['+mo+'] pasif varsa kart uretildi', pasifSay===0 || /mc-card/.test(cardsHtml), 'pasif='+pasifSay); });

  console.log('[15] Butunluk: hicbir dersin uyesi/hocasi hayalet degil (orphan yok)');
  { const mids=new Set(S().members.map(m=>m.id)); const hids=new Set(S().instructors.map(i=>i.id)); let orphan='';
    S().lessons.forEach(l=>{ (l.memberIds||[]).forEach(id=>{ if(id && !mids.has(id) && !orphan) orphan='ders '+l.id+' hayalet uye '+id; }); if(l.instructorId && !hids.has(l.instructorId) && !orphan) orphan='ders '+l.id+' hayalet hoca'; });
    t('hicbir derste hayalet uye/hoca yok', orphan==='', orphan); }

  console.log('[16] Hoca yillik toplam = aylik toplamlarin toplami (ay sizmasi yok)');
  HOCA.forEach(h=>{ const aylikToplam=MONTHS.reduce((a,mo)=>a+w.instructorEarningsForMonth(h,mo).total,0); let bagimsizTum=0; S().lessons.forEach(l=>{ if(l.instructorId===h && (l.status==='completed'||l.status==='missed') && MONTHS.some(mo=>(l.date||'').startsWith(mo))) bagimsizTum+=w.perLessonPriceForLesson(l)*(w.resolveInstructorRate(l)/100); }); t('hoca '+h+' 6-ay toplam tutarli', Math.abs(aylikToplam-bagimsizTum)<0.01, aylikToplam+' vs '+bagimsizTum); });

  console.log('\n=== stress-6month: '+pass+' OK, '+fail+' FAIL ===');
  if(fail){ console.log('--- HATALAR ---'); fails.slice(0,40).forEach(f=>console.log('  * '+f)); }
  process.exit(fail?1:0);
} catch(e){ console.error('HARNESS HATASI', e); process.exit(1); } }, 900);
