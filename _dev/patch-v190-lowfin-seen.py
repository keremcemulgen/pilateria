# -*- coding: utf-8 -*-
# v190 (Kerem 04.10): "Paket bitimi yaklasan uyeler — gruplar ve uyeler gozden kacmasin diye 7. dersi yapilan uyeler ve
# gruplar gosterilsin, yaninda tik isareti olsun; ben gorduldu olarak isaretleyene kadar listeden dusmesin."
# Karar (duz metin, ikinci cevap): "B" = isaretlenen satir listede KALIR (soluk, ustu cizili, en altta); yalniz eskiden
# oldugu gibi kendiliginden dusme ani gelince (yeni paket dersi girilmesi / pasife alinma) gider.
# ONCEKI DAVRANIS: ⏳ 1 Dersi Kalan / Biten listesi birimin yalniz EN SON paketini izliyordu; yeni paketin ilk dersi girilince
# (ya da sonraki ayin paket kaydi / ikiz grubu acilinca — v157 supersede; v158 guncel-kadro sarti) Kerem gormeden satir
# kayboluyordu.
# KURALLAR:
#  - GORULMEMIS paket (lfSeen yok): yeni paketle gecilse de, Bitti'ye donse de listede kalir (v157/v158/"yeni ders girildi"
#    dusurmeleri uygulanmaz). Pencere: paketin BITIS ayi (son dersinin ayi) >= onceki ay — eski gecmis listeyi doldurmaz.
#  - GORULEN paket (lfSeen[ay] = tarih): soluk + ustu cizili + "✓ görüldü gg.aa" rozeti + ↩ geri al; listenin EN ALTINDA;
#    eski kurallar aynen (yeni paket dersi / v157 / v158 / pasif / sonraki aydan silinme gelince duser).
#  - Isaret PAKET bazli (g.lfSeen[ay] / m.lfSeen[ay], temel kayitta → bulutla senkron); sonraki paketin 7. dersinde yeniden
#    GORULMEMIS gelir. Dugmeler yalniz yonetici (pl-owner-only). Pasif (v153) / sonraki aydan silinen (v159) birim AYNEN dusmez→duser.
#  - Ust kutu sayaci = GORULMEMIS satir sayisi (dikkat bekleyen); baslik: "(N grup, M üye · ✓ K görüldü)".
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep("""    const __st = function(fin){
      if (!fin || fin.quota < 1 || fin.done < 1) return 0; // hic tuketimi olmayan listelenmez""",
"""    // v190 (Kerem, karar B): GORULDU ISARETI — gorulmemis paket yeni paketle gecilse de listede kalir; gorulen soluk/altta,
    // eski dusme kurallariyla gider. Pencere: paketin BITIS ayi (son ders ayi) >= onceki ay.
    // Pencere tabani: onceki ay — ama yayin esigi __LF_SEEN_SINCE190'dan (Ekim 2026) once BITEN paketler takibe girmez
    // (canli olcum 04.10: esik olmasa Agustos/Temmuz'un Eylul'e sarkan 24 eski paketi bir anda "gorulmemis" dusecekti).
    const __floor190 = (function(){ const p = __nowAy.split('-').map(Number); const dt = new Date(p[0], p[1] - 2, 1); const pv = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); let since = ''; try { since = String(__LF_SEEN_SINCE190 || ''); } catch(e) { since = ''; } return (since > pv) ? since : pv; })();
    const __seen190 = function(obj, ay){ return !!(obj && obj.lfSeen && ay && obj.lfSeen[ay]); };
    const __sticky190 = function(tip, obj, ay){ return !!(obj && ay) && !__seen190(obj, ay) && (__pkgEndMonth173(tip, obj.id, ay) >= __floor190); };
    const __months190 = function(tip, id){ // birimin iptal-olmayan dersi bulunan paket aylari
      const set = {};
      (state.lessons || []).forEach(function(l){
        if (!l || l.status === 'cancelled') return;
        if (tip === 'group') { if (l.groupId !== id) return; }
        else { if (l.groupId) return; if (!(l.memberIds || []).includes(id)) return; }
        const pm = l.packageMonth || String(l.date || '').slice(0, 7);
        if (pm) set[pm] = 1;
      });
      return Object.keys(set).sort();
    };
    const __st = function(fin){
      if (!fin || fin.quota < 1 || fin.done < 1) return 0; // hic tuketimi olmayan listelenmez""")

rep("""      const ay = __curAy('group', g.id); if (!ay) return;
      if (isGroupInactiveInMonth(g, ay)) return;""",
"""      const ay = __curAy('group', g.id); if (!ay) return;
      // v190: yeni paketle GECILMIS ama GORULMEMIS onceki paket(ler) — Kerem isaretleyene kadar listede (pasif / sonraki
      // aydan silinmis grup haric). En son paketin kayit/kadro durumundan BAGIMSIZ degerlendirilir.
      { const __liveG190 = (ay < __nowAy) && (__pkgEndMonth173('group', g.id, ay) >= __nowAy);
        const __outG190 = (!__liveG190 && isGroupInactiveInMonth(g, __nowAy)) || (!__liveG190 && __groupRemovedForward(g, __nowAy));
        if (!__outG190) __months190('group', g.id).forEach(function(pm){
          if (pm >= ay || !__sticky190('group', g, pm)) return;
          if (isGroupInactiveInMonth(g, pm)) return;
          if (!(activeGroupRosterForMonth(g, pm) || []).length) return;
          const f2 = sessionsFinishState('group', g.id, pm); const s2 = __st(f2); if (!s2) return;
          rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, pm), ay: pm, st: s2, fin: f2, seen: false });
        }); }
      if (isGroupInactiveInMonth(g, ay)) return;""")
rep("""      if (!__live173 && __groupRemovedForward(g, __nowAy)) return; // v159: sonraki aydan silinen grup takip edilmez
      const ros = (typeof activeGroupRosterForMonth === 'function') ? activeGroupRosterForMonth(g, ay) : (g.memberIds||[]);""",
"""      if (!__live173 && __groupRemovedForward(g, __nowAy)) return; // v159: sonraki aydan silinen grup takip edilmez
      const __stk190 = __sticky190('group', g, ay);
      const ros = (typeof activeGroupRosterForMonth === 'function') ? activeGroupRosterForMonth(g, ay) : (g.memberIds||[]);""")

rep("""      if (st === 2 && __supersededGroupFin(g.id, ay)) return; // v157: yeni paket yazilmis — Biten satiri duser""",
"""      if (st === 2 && __supersededGroupFin(g.id, ay) && !__stk190) return; // v157: yeni paket yazilmis — Biten satiri duser · v190: gorulmemisse KALIR""")
rep("""      if (st === 2 && !__live173 && !((typeof activeGroupRosterForMonth === 'function' ? activeGroupRosterForMonth(g, __nowAy) : []) || []).length) return;
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, ay), ay: ay, st: st, fin: fin });""",
"""      if (st === 2 && !__live173 && !__stk190 && !((typeof activeGroupRosterForMonth === 'function' ? activeGroupRosterForMonth(g, __nowAy) : []) || []).length) return; // v190: gorulmemisse KALIR
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, ay), ay: ay, st: st, fin: fin, seen: __seen190(g, ay) });""")

rep("""      const ay = __curAy('member', mm.id); if (!ay) return;
      if (!isMemberEnrolledInMonth(mm.id, ay)) return;""",
"""      const ay = __curAy('member', mm.id); if (!ay) return;
      // v190: yeni paketle GECILMIS ama GORULMEMIS onceki bireysel paket(ler) — pasif / sonraki aydan silinmis uye haric;
      // en son paketin kayit durumundan BAGIMSIZ degerlendirilir.
      { const __liveM190 = (ay < __nowAy) && (__pkgEndMonth173('member', mm.id, ay) >= __nowAy);
        const __outM190 = (!__liveM190 && isMemberInactiveInMonth(mm, __nowAy)) || (!__liveM190 && __removedAfter(mm.id, ay));
        if (!__outM190) __months190('member', mm.id).forEach(function(pm){
          if (pm >= ay || !__sticky190('member', mm, pm)) return;
          if (!isMemberEnrolledInMonth(mm.id, pm)) return;
          if (memberActiveGroupForMonth(mm.id, pm)) return;
          const f2 = sessionsFinishState('member', mm.id, pm); const s2 = __st(f2); if (!s2) return;
          rows.push({ tip:'member', id:mm.id, ad: mm.name, ay: pm, st: s2, fin: f2, seen: false });
        }); }
      if (!isMemberEnrolledInMonth(mm.id, ay)) return;""")

rep("""      if (st === 2 && __supersededMemberFin(mm.id, ay)) return; // v157: yeni paket yazilmis — Biten satiri duser
      rows.push({ tip:'member', id:mm.id, ad: mm.name, ay: ay, st: st, fin: fin });
    });
    rows.sort(function(a,b){ return (a.st - b.st) || String(a.ay).localeCompare(String(b.ay)) || String(a.ad).localeCompare(String(b.ad), 'tr'); }); // 1-kalanlar ustte; eski ay once (daha acil)""",
"""      if (st === 2 && __supersededMemberFin(mm.id, ay) && !__sticky190('member', mm, ay)) return; // v157: yeni paket yazilmis — Biten satiri duser · v190: gorulmemisse KALIR
      rows.push({ tip:'member', id:mm.id, ad: mm.name, ay: ay, st: st, fin: fin, seen: __seen190(mm, ay) });
    });
    rows.sort(function(a,b){ return ((a.seen ? 1 : 0) - (b.seen ? 1 : 0)) || (a.st - b.st) || String(a.ay).localeCompare(String(b.ay)) || String(a.ad).localeCompare(String(b.ad), 'tr'); }); // v190: gorulenler EN ALTTA; 1-kalanlar ustte; eski ay once (daha acil)""")

rep("""  document.getElementById('s-low').textContent = __lf.length;""",
"""  document.getElementById('s-low').textContent = __lf.filter(function(r){ return !r.seen; }).length; // v190: dikkat bekleyen (gorulmemis)""")

rep("""  if (__lfCnt) __lfCnt.textContent = '(' + __lf.filter(function(r){return r.tip==='group';}).length + ' grup, ' + __lf.filter(function(r){return r.tip==='member';}).length + ' üye)';""",
"""  if (__lfCnt) { const __sn190 = __lf.filter(function(r){ return r.seen; }).length; __lfCnt.textContent = '(' + __lf.filter(function(r){return r.tip==='group' && !r.seen;}).length + ' grup, ' + __lf.filter(function(r){return r.tip==='member' && !r.seen;}).length + ' üye' + (__sn190 ? ' · ✓ ' + __sn190 + ' görüldü' : '') + ')'; } // v190: gorulenler ayri""")

rep("""    const ac = r.tip === 'group' ? ("openGroupDetail('" + r.id + "','" + r.ay + "')") : ("openMemberDetail('" + r.id + "','" + r.ay + "')"); // v148: uye detayi da paketin AYINDA acilir
    return '<div class="row between" style="padding:7px 8px;border-bottom:1px solid var(--border);cursor:pointer;" onclick="' + ac + '" title="Detayı aç — yeni paket/ödeme oradan">'
      + '<span>' + (r.tip === 'group' ? '👯' : '👤') + ' ' + escapeHtml(r.ad) + '</span>'
      + '<span style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">' + sarkan + roz + '</span></div>';""",
"""    const ac = r.tip === 'group' ? ("openGroupDetail('" + r.id + "','" + r.ay + "')") : ("openMemberDetail('" + r.id + "','" + r.ay + "')"); // v148: uye detayi da paketin AYINDA acilir
    // v190 (Kerem, B): gorulmemis → "✓ Görüldü" dugmesi; gorulen → soluk + ustu cizili + rozet + ↩ geri al (yalniz yonetici)
    const __arg190 = "'" + r.tip + "','" + r.id + "','" + r.ay + "'";
    const __seenAt190 = (function(){ try { const o = r.tip === 'group' ? state.groups.find(function(x){ return x && x.id === r.id; }) : state.members.find(function(x){ return x && x.id === r.id; }); const v = o && o.lfSeen && o.lfSeen[r.ay]; return (typeof v === 'string' && /^\\d{4}-\\d{2}-\\d{2}/.test(v)) ? fmtDate(v.slice(0, 10)) : ''; } catch(e) { return ''; } })();
    const btn = r.seen
      ? '<span class="badge lf-seen-badge-190" style="background:#eceff1;color:#546e7a;" title="Görüldü olarak işaretlendi — yeni paket dersi girilince ya da pasife alınınca listeden düşer">✓ görüldü' + (__seenAt190 ? ' ' + __seenAt190 : '') + '</span>'
        + '<button type="button" class="btn small secondary lf-unseen-190 pl-owner-only" style="padding:3px 8px;" onclick="event.stopPropagation(); lfUnseen190(' + __arg190 + ')" title="İşareti kaldır — satır yeniden dikkat listesine çıkar">↩</button>'
      : '<button type="button" class="btn small secondary lf-seen-190 pl-owner-only" style="padding:3px 9px;" onclick="event.stopPropagation(); lfMarkSeen190(' + __arg190 + ')" title="Gördüm — satır listenin altına iner (soluk); yeni paket dersi girilince ya da pasife alınınca düşer">✓ Görüldü</button>';
    return '<div class="row between lf-row-190' + (r.seen ? ' lf-seen-row-190' : '') + '" style="padding:7px 8px;border-bottom:1px solid var(--border);cursor:pointer;' + (r.seen ? 'opacity:.55;' : '') + '" onclick="' + ac + '" title="Detayı aç — yeni paket/ödeme oradan">'
      + '<span' + (r.seen ? ' style="text-decoration:line-through;"' : '') + '>' + (r.tip === 'group' ? '👯' : '👤') + ' ' + escapeHtml(r.ad) + '</span>'
      + '<span style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">' + sarkan + roz + btn + '</span></div>';""")

rep("""// Occupancy = (used reformer-hours in month) / (capacity reformer-hours in month)""",
"""// v190 (Kerem, karar B): ⏳ listesinde ✓ Gorduldu / ↩ geri al — isaret PAKET bazli, temel kayitta (bulutla senkron)
var __LF_SEEN_SINCE190 = '2026-10'; // yayin esigi: bu aydan once BITEN (son dersi daha eski) paketler "gorulene kadar kal" kuralina girmez
function __lfUnit190(tip, id) { return tip === 'group' ? (state.groups || []).find(function(x){ return x && x.id === id; }) : (state.members || []).find(function(x){ return x && x.id === id; }); }
function lfMarkSeen190(tip, id, ay) {
  const obj = __lfUnit190(tip, id); if (!obj || !ay) return;
  const ad = tip === 'group' ? groupDisplayName(obj, ay) : (obj.name || 'Üye');
  try { __undoSnapshot('Görüldü: ' + ad + ' — ' + ay); } catch(e) {}
  if (!obj.lfSeen || typeof obj.lfSeen !== 'object') obj.lfSeen = {};
  obj.lfSeen[ay] = todayISO();
  save();
  try { renderDashboard(); } catch(e) {}
  if (typeof plToast === 'function') { try { plToast('✓ ' + ad + ' — görüldü (listenin altında soluk kalır; yeni paket dersi girilince düşer)', 5000); } catch(e) {} }
}
function lfUnseen190(tip, id, ay) {
  const obj = __lfUnit190(tip, id); if (!obj || !ay || !obj.lfSeen) return;
  const ad = tip === 'group' ? groupDisplayName(obj, ay) : (obj.name || 'Üye');
  try { __undoSnapshot('Görüldü işareti kaldır: ' + ad + ' — ' + ay); } catch(e) {}
  delete obj.lfSeen[ay];
  if (!Object.keys(obj.lfSeen).length) delete obj.lfSeen;
  save();
  try { renderDashboard(); } catch(e) {}
  if (typeof plToast === 'function') { try { plToast('↩ ' + ad + ' — işaret kaldırıldı, yeniden dikkat listesinde'); } catch(e) {} }
}
// Occupancy = (used reformer-hours in month) / (capacity reformer-hours in month)""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.10.04.112">', '<meta name="app-version" content="2026.10.04.113">')
rep("const APP_VERSION = '2026.10.04.112';", "const APP_VERSION = '2026.10.04.113';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v189-2026-10-04-112'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v190-2026-10-04-113'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
