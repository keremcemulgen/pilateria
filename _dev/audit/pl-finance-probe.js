// PİLATERİA — MALİ DENETİM CANLI SONDASI (v176). SALT-OKUNUR: state'e dokunmaz, save() çağırmaz.
// Kullanım (sayfa içinde, giriş yapılmış): __plFinanceProbe(['2026-07','2026-08','2026-09']) → yalnız SAYI ve maskeli örnek.
// Amaç: v176 düzeltmelerinin canlı veride hangi kayıtları etkilediğini ölçmek (kampanya, fiyatsız üye, grup-toplam fiyatı,
// grup hakkı ≠ üye tipi hakkı, hoca hakedişi eski↔yeni taban farkı, vadesi geçen, çapraz yüzey denetimi).
window.__plFinanceProbe = function(months) {
  const mask = s => { s = String(s || ''); return s.slice(0, 3) + '***'; };
  const R = { version: (document.querySelector('meta[name="app-version"]')||{}).content || '', settings: {}, months: {} };
  const st = state.settings || {};
  R.settings = { kdvRate: st.kdvRate, gvRate: st.gvRate, taxOfficialMode: st.taxOfficialMode || '(varsayilan iban_kk)', taxStartMonth: st.taxStartMonth || '', campaigns: (state.campaigns||[]).length, packageTypes: (state.packageTypes||[]).map(p => p.sessions + 'x' + p.price) };
  const payMonth = p => p.packageMonth || String(p.date || '').slice(0, 7);
  const lesMonth = l => l.packageMonth || String(l.date || '').slice(0, 7);
  (months || [currentMonth()]).forEach(function(M){
    const o = { payments: {}, members: {}, groups: {}, instructors: {}, overdue: {}, audit: null };
    const pays = (state.payments||[]).filter(p => p && payMonth(p) === M);
    o.payments.count = pays.length; o.payments.sum = Math.round(pays.reduce((a,p)=>a+(+p.amount||0),0)*100)/100;
    o.payments.byMethod = {}; pays.forEach(p => { const k = p.method || '?'; o.payments.byMethod[k] = (o.payments.byMethod[k]||0) + 1; });
    o.payments.campaign = pays.filter(p => p.campaignId).length;
    o.payments.refund = pays.filter(p => p.refund || (+p.amount||0) < 0).length;
    o.payments.partialFlag = pays.filter(p => p.partial).length;
    o.payments.discountSum = Math.round(pays.reduce((a,p)=>a+(+p.discount||0),0)*100)/100;
    o.payments.installmentPkgs = (function(){ const c = {}; pays.forEach(p => { const k = p.memberId + '|' + (p.groupId||''); c[k] = (c[k]||0)+1; }); return Object.keys(c).filter(k => c[k] > 1).length; })();
    const enrolled = (state.members||[]).filter(m => m && isMemberEnrolledInMonth(m.id, M));
    o.members.enrolled = enrolled.length;
    o.members.clones = enrolled.filter(m => m.secondOfMember).length;
    const indiv = enrolled.filter(m => !memberActiveGroupForMonth(m.id, M));
    o.members.individual = indiv.length;
    o.members.individualNoPrice = indiv.filter(m => !(+memberMonthlyTotalPrice(m.id, M) > 0)).map(m => mask(m.name));
    o.members.zeroPriceOverride = enrolled.filter(m => { const ov = getMemberMonthlyOverride(m.id, M) || {}; return ov.totalPrice === 0 || ov.totalPrice === '0'; }).length;
    const groups = (state.groups||[]).filter(g => g && !isGroupInactiveInMonth(g, M) && activeGroupRosterForMonth(g, M).length);
    o.groups.active = groups.length;
    o.groups.customTotalWithUnpriced = groups.filter(g => (+g.customTotalPrice > 0) && activeGroupRosterForMonth(g, M).some(mid => !(+memberMonthlyTotalPrice(mid, M) > 0))).map(g => mask(groupDisplayName(g, M)));
    o.groups.quotaMismatch = groups.filter(g => { const gq = +sessionQuotaFor('group', g.id, M); return activeGroupRosterForMonth(g, M).some(mid => +sessionQuotaFor('member', mid, M) !== gq); }).map(g => mask(groupDisplayName(g, M)) + ' (' + sessionQuotaFor('group', g.id, M) + ')');
    o.groups.solo = groups.filter(g => activeGroupRosterForMonth(g, M).length === 1).length;
    o.groups.extended = groups.filter(g => (g.packages||[]).some(p => p.month === M && p.status === 'extended')).length;
    // v177: askida odeme (grup toplamina sayilmayan) — uye|grup basina maskeli
    o.groups.askida177 = (function(){ if (typeof __memberGroupExcess177 !== 'function') return null; const out = []; const seen = {}; pays.forEach(function(p){ if (!p.groupId || !p.memberId) return; const k = p.memberId + '|' + p.groupId; if (seen[k]) return; seen[k] = 1; const ex = __memberGroupExcess177(p.memberId, p.groupId, M); if (ex > 0) out.push(mask(memberName(p.memberId)) + '@' + mask(groupDisplayName(state.groups.find(function(g){ return g.id === p.groupId; }) || {}, M)) + ':' + ex); }); return out; })();
    // v177: hakedis — uyeye ozel oranin (memberInstructorRates) cok kisilik derste etkisi: v176 (tek oran) ↔ v177 (uye bazli)
    o.instructorsRateDelta177 = (function(){ const out = {}; (state.instructors||[]).forEach(function(inst){ let cur = 0, old = 0; (state.lessons||[]).filter(l => l.instructorId === inst.id && lessonHappened(l) && String(l.date||'').startsWith(M)).forEach(function(l){ cur += instructorEarningForLesson(l); old += perLessonPriceForLesson(l) * (resolveInstructorRate(l) / 100); }); const dlt = Math.round((cur - old) * 100) / 100; if (dlt !== 0) out[mask(inst.name)] = dlt; }); return out; })();
    // Hoca hakedisi: mevcut (v176) ↔ eski taban (uyenin kendi hakki, grup toplam fallback yok)
    (state.instructors||[]).forEach(function(inst){
      const ls = (state.lessons||[]).filter(l => l.instructorId === inst.id && lessonHappened(l) && String(l.date||'').startsWith(M));
      let cur = 0, legacy = 0;
      ls.forEach(function(l){
        cur += instructorEarningForLesson(l);
        // eski taban: grup dersinde uyenin KENDI hakki; fiyatsiz uye 0; grupsuz cok-uyeli: packageTypes[0]/8*size
        let base = 0;
        if (l.packageOwnerType === 'group' && l.packageOwnerId) {
          const g = state.groups.find(x => x.id === l.packageOwnerId);
          if (g) { const pkg = (g.packages||[]).find(p => p.month === l.packageMonth); if (!(pkg && pkg.status === 'extended')) { const ros = new Set(activeGroupRosterForMonth(g, l.packageMonth)); (l.memberIds||[]).forEach(mid => { if (ros.has(mid)) { const pr = +memberMonthlyTotalPrice(mid, l.packageMonth) || 0; const q = +sessionQuotaFor('member', mid, l.packageMonth) || 8; base += pr / q; } }); } }
        } else base = perLessonPriceForLesson(l);
        legacy += base * (resolveInstructorRate(l) / 100);
      });
      o.instructors[mask(inst.name)] = { lessons: ls.length, current: Math.round(cur*100)/100, legacy: Math.round(legacy*100)/100, delta: Math.round((cur-legacy)*100)/100 };
    });
    try { const ov = getOverduePayments().filter(x => (x.months||[]).includes(M)); o.overdue = { count: ov.length, sum: Math.round(ov.reduce((a,x)=>a+(+x.missing||0),0)*100)/100 }; } catch(e) { o.overdue = { err: e.message }; }
    try { if (typeof __plAudit === 'function') { const a = __plAudit(M, { detail: false }); o.audit = { checks: a.checks, mismatchCount: a.mismatchCount, orphans: a.counts.orphans, orphanCats: a.counts.orphanCats, sample: (a.sample||a.mismatches||[]).slice(0,5) }; } } catch(e) { o.audit = { err: e.message }; }
    R.months[M] = o;
  });
  return R;
};
