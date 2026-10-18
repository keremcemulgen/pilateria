// Chromium: kart ekstresi PDF yükleme — pdf.js (kendi sunulan) metin çıkarımı + önizleme + şifreli PDF
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: {width:1366,height:900} });
  const p = await ctx.newPage();
  const errs = [], cons = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type()==='error') cons.push('console: '+m.text()); }); // konsol hataları (CSP notu, 404) bilgi; sayfa istisnası = hata
  await p.goto('http://127.0.0.1:8765/pilateria.html', { waitUntil: 'load' }); await p.waitForTimeout(1500);
  await p.evaluate(() => { sbHideAuth(); document.body.classList.remove('pl-authlock','pl-staff-view'); window.alert=function(m){ window.__alerts=(window.__alerts||[]).concat([m]); };
    const CM = currentMonth(); state.members=[]; state.groups=[]; state.lessons=[]; state.payments=[]; state.expenses=[]; state.finRules=[]; state.finImports=[]; state.finDues=[];
    const c=finAccount196('acc-cash'); c.openingDate='2026-09-01'; c.openingBalance=1000; const bb=finAccount196('acc-bank'); bb.openingDate='2026-09-01'; bb.openingBalance=50000;
    state.finAccounts.push({id:'card1',kind:'account',type:'card',name:'Garanti Bonus',bank:'Garanti BBVA',owner:'Kerem',openingDate:'2026-09-01',openingBalance:-1000,cutoffDay:15,dueDay:25,active:true});
    window.__PL_DLG_AUTO__ = (o) => { window.__dlg=(window.__dlg||[]).concat([String(o.msg||'')]); if (o && o.input) return '12345678901'; return true; };
    switchPage('payments'); finSwitchTab196('moves'); openFinImportModal196(); });
  let ok = 0, fail = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  for (const [file, period, expRows, expBank, expTotal] of [['garanti-real.pdf','2026-10',10,'Garanti BBVA',5733.59], ['vakif-real.pdf','2026-09',7,'VakıfBank',4875.4], ['garanti.pdf','2026-10',6,'Garanti BBVA',3245.4], ['tf.pdf','2026-10',3,'Türkiye Finans',700], ['vakif.pdf','2026-10',2,'VakıfBank',2000]]) { // v200: gerçek biçimleri taklit eden anonim ekstreler önce
    await p.setInputFiles('#fi-file', path.join(process.env.FIN_PDF_DIR || (process.env.SP + '/pdfs'), file));
    await p.fill('#fi-period', period);
    await p.click('text=Oku ve önizle');
    await p.waitForFunction(() => { const pv = document.getElementById('fi-preview'); return pv && (pv.querySelectorAll('tbody tr').length > 0 || /Satır bulunamadı|okunamadı/.test(pv.textContent)); }, null, { timeout: 20000 });
    const info = await p.evaluate(() => { const pv = document.getElementById('fi-preview'); return { n: pv.querySelectorAll('tbody tr').length, txt: pv.textContent.slice(0, 160), meta: __finImp196 ? __finImp196.meta : null, rows: __finImp196 ? __finImp196.rows.map(r => [r.date, r.desc, r.amount, r.kind]) : null, pdfjs: !!window.pdfjsLib }; });
    t(file + ': pdf.js yüklendi, ' + expRows + ' satır, banka ' + expBank + ', dönem borcu ' + expTotal, info.pdfjs && info.n === expRows && info.meta && info.meta.bank === expBank && Math.abs((info.meta.toplam || 0) - expTotal) < 0.01, JSON.stringify(info));
    console.log('     rows:', JSON.stringify(info.rows));
    if (file === 'vakif.pdf') { const dlg = await p.evaluate(() => (window.__dlg||[]).some(m => /şifre/i.test(m))); t('şifreli PDF: şifre soruldu ve çözüldü', dlg && info.n === 2); }
  }
  // İşle (vakif) → gider oluştu
  await p.click('#fi-process');
  await p.waitForTimeout(400);
  const after = await p.evaluate(() => ({ exp: state.expenses.length, due: state.finDues.length, modal: !!document.getElementById('modal-fin-imp'), card: finBalance196('card1') }));
  t('İşle: 2 gider, kart kalemi, pencere kapandı, kart borcu −3.000', after.exp === 2 && after.due === 1 && !after.modal && after.card === -3000, JSON.stringify(after));
  await p.screenshot({ path: (process.env.SP || '/tmp') + '/fin-import-after.png', fullPage: false });
  t('sayfa istisnası yok', errs.length === 0, JSON.stringify(errs).slice(0, 300)); if (cons.length) console.log('     (konsol: ' + cons.join(' | ').slice(0, 200) + ')');
  console.log('SONUC: ' + ok + '/' + (ok + fail));
  await b.close();
  process.exit(fail ? 1 : 0);
})();
