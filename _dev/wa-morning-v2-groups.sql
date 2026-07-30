-- ============================================================================
-- PILATERIA — SABAH WHATSAPP MOTORU v2: GRUP MESAJI HAZIRLAYICI (30 Tem 2026)
--
-- Kerem karari (A+B): uyelere kisisel otomatik mesaj (mevcut) + o gun dersi olan
-- HER GRUP icin hazir mesaj metni. Grup metinleri GONDERILMEZ (resmi API grup
-- sohbetine gonderemez) — panelde "Kopyala" ile WhatsApp grubuna yapistirilir.
--
-- Bu betik YALNIZ pilateria_wa_morning() fonksiyonunu gunceller (gruplar alani
-- eklenir); wa_config / wa_morning_log / cron AYNEN kalir. Tekrar calistirmak
-- zararsizdir. Mevcut hicbir tabloya/veriye DOKUNULMAZ.
-- ============================================================================

create or replace function public.pilateria_wa_morning()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  gun date := (timezone('Europe/Istanbul', now()))::date;
  cfg jsonb;
  api_enabled boolean;
  tok text; pnid text; tpl text; lng text; ver text;
  rec jsonb := '[]'::jsonb;
  grp jsonb := '[]'::jsonb;
  n_total int := 0; n_ok int := 0; n_bad int := 0; n_sent int := 0;
  r record; r2 record;
  fullname text; firstname text; rawphone text; e164 text; tel_ok boolean;
  saatler text; mesaj text; durum text; reqid bigint;
begin
  select jsonb_object_agg(k, v) into cfg from public.wa_config;
  tok  := coalesce(cfg->>'token','');
  pnid := coalesce(cfg->>'phone_number_id','');
  tpl  := coalesce(cfg->>'template','ders_hatirlatma');
  lng  := coalesce(cfg->>'lang','tr');
  ver  := coalesce(cfg->>'api_ver','v21.0');
  api_enabled := (coalesce(cfg->>'enabled','false') = 'true') and tok <> '' and pnid <> '';

  -- ── BIREYSEL LISTE (degismedi) ──
  for r in
    with ders as (
      select l.data as ld
      from public.lessons l
      where l.data->>'date' = gun::text
        and coalesce(l.data->>'status','planned') <> 'cancelled'
    ),
    kisi as (
      select distinct jsonb_array_elements_text(ld->'memberIds') as mid, ld->>'time' as saat
      from ders
    ),
    topla as (
      select mid, string_agg(distinct saat, ' ve ' order by saat) as saatler
      from kisi
      where mid is not null and mid <> ''
      group by mid
    )
    select t.mid, t.saatler, m.data as md
    from topla t
    join public.members m on m.id = t.mid
    order by t.saatler
  loop
    n_total := n_total + 1;
    fullname  := coalesce(r.md->>'name','');
    firstname := coalesce(nullif(split_part(fullname, ' ', 1), ''), fullname);
    rawphone  := coalesce(r.md->>'phone','');
    e164 := regexp_replace(rawphone, '[^0-9]', '', 'g');
    if e164 like '0%' then e164 := '9' || e164; end if;
    if length(e164) = 10 and e164 like '5%' then e164 := '90' || e164; end if;
    tel_ok := (length(e164) = 12 and e164 like '905%');
    saatler := coalesce(r.saatler, '');
    mesaj := 'Merhaba ' || firstname || ' 🌸 Bugün ' || saatler || ' dersiniz var. Görüşmek üzere! — PİLATERİA';

    if not tel_ok then
      durum := 'telefon-hatali'; n_bad := n_bad + 1;
    elsif api_enabled then
      begin
        select net.http_post(
          url := 'https://graph.facebook.com/' || ver || '/' || pnid || '/messages',
          headers := jsonb_build_object('Authorization', 'Bearer ' || tok, 'Content-Type', 'application/json'),
          body := jsonb_build_object(
            'messaging_product', 'whatsapp',
            'to', e164,
            'type', 'template',
            'template', jsonb_build_object(
              'name', tpl,
              'language', jsonb_build_object('code', lng),
              'components', jsonb_build_array(jsonb_build_object(
                'type', 'body',
                'parameters', jsonb_build_array(
                  jsonb_build_object('type','text','text', firstname),
                  jsonb_build_object('type','text','text', saatler)
                )
              ))
            )
          )
        ) into reqid;
        durum := 'kuyrukta(#' || coalesce(reqid, 0) || ')'; n_sent := n_sent + 1; n_ok := n_ok + 1;
      exception when others then
        durum := 'hata: ' || sqlerrm; n_bad := n_bad + 1;
      end;
    else
      durum := 'golge'; n_ok := n_ok + 1;
    end if;

    rec := rec || jsonb_build_array(jsonb_build_object(
      'memberId', r.mid, 'ad', fullname, 'tel', rawphone, 'e164', e164,
      'saat', saatler, 'mesaj', mesaj, 'durum', durum));
  end loop;

  -- ── v2: GRUP MESAJLARI (yalniz HAZIRLANIR; gonderim yok — API grup sohbetine gonderemez) ──
  for r2 in
    select l.data->>'groupId' as gid,
           coalesce(g.data->>'name', 'Grup') as gad,
           string_agg(distinct l.data->>'time', ' ve ' order by l.data->>'time') as saatler
    from public.lessons l
    join public.groups g on g.id = l.data->>'groupId'
    where l.data->>'date' = gun::text
      and coalesce(l.data->>'status','planned') <> 'cancelled'
      and coalesce(l.data->>'groupId','') <> ''
    group by l.data->>'groupId', coalesce(g.data->>'name', 'Grup')
    order by 3
  loop
    grp := grp || jsonb_build_array(jsonb_build_object(
      'groupId', r2.gid,
      'ad', r2.gad,
      'saat', r2.saatler,
      'mesaj', 'Günaydın 🌸 Bugün ' || r2.saatler || ' dersimiz var. Görüşmek üzere! — PİLATERİA'));
  end loop;

  insert into public.wa_morning_log(id, data, created_at)
  values (gun::text, jsonb_build_object(
      'mode',       case when api_enabled then 'live' else 'shadow' end,
      'toplam',     n_total,
      'uygun',      n_ok,
      'sorunlu',    n_bad,
      'gonderilen', n_sent,
      'gruplar',    grp,
      'kisiler',    rec), now())
  on conflict (id) do update set data = excluded.data, created_at = now();

  delete from public.wa_morning_log where created_at < now() - interval '30 days';

  return case when api_enabled then 'CANLI: ' else 'GÖLGE: ' end
      || n_total || ' üye · uygun ' || n_ok || ' · sorunlu ' || n_bad || ' · gönderilen ' || n_sent
      || ' · grup mesajı ' || jsonb_array_length(grp);
end $$;

revoke execute on function public.pilateria_wa_morning() from public, anon, authenticated;

-- HEMEN yeniden kos (golge) — bugunun kaydina gruplar alani da yazilsin
select public.pilateria_wa_morning() as v2_golge_kosusu;

-- dogrulama: bugunun kaydinda grup sayisi + ilk grup mesaji
select id,
       jsonb_array_length(coalesce(data->'gruplar','[]'::jsonb)) as grup_sayisi,
       data->'gruplar'->0->>'ad'    as ilk_grup,
       data->'gruplar'->0->>'mesaj' as ilk_mesaj
from public.wa_morning_log
where id = (timezone('Europe/Istanbul', now()))::date::text;
