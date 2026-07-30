-- ============================================================================
-- PILATERIA — SABAH WHATSAPP OTOMASYONU (v129 hazırlık — 30 Tem 2026)
--
-- GÖLGE MODDA başlar: enabled='false' → HİÇBİR mesaj gönderilmez; her sabah
-- 08:00 TR'de yalnız "bugün kime ne gidecekti" listesi wa_morning_log'a yazılır.
-- Gerçek gönderim, Meta kurulumu bitip wa_config'e token/phone_number_id
-- girilince ve enabled='true' yapılınca başlar.
--
-- Mevcut hiçbir tabloya/veriye DOKUNULMAZ (lessons/members yalnız OKUNUR).
-- Tekrar çalıştırmak zararsızdır.
-- ============================================================================

create extension if not exists pg_net;

-- ─────────────────────────────────────────────────────────────
-- 1) YAPILANDIRMA — istemciden TAMAMEN gizli (RLS açık, SIFIR politika;
--    yalnız security definer fonksiyonlar okur; token asla istemciye inmez)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.wa_config (
  k text primary key,
  v text
);
alter table public.wa_config enable row level security;

insert into public.wa_config(k, v) values
  ('enabled', 'false'),
  ('api_ver', 'v21.0'),
  ('template', 'ders_hatirlatma'),
  ('lang', 'tr'),
  ('phone_number_id', ''),
  ('token', '')
on conflict (k) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 2) SABAH RAPORU — istemci YALNIZ OKUR (panel kartı buradan beslenir)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.wa_morning_log (
  id         text primary key,               -- 'YYYY-MM-DD'
  data       jsonb,
  created_at timestamptz not null default now()
);
alter table public.wa_morning_log enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wa_morning_log') then
    create policy wa_morning_log_read on public.wa_morning_log
      for select to authenticated using (true);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 3) ANA FONKSİYON
-- ─────────────────────────────────────────────────────────────
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
  n_total int := 0; n_ok int := 0; n_bad int := 0; n_sent int := 0;
  r record;
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
    if e164 like '0%' then e164 := '9' || e164; end if;                       -- 05xx… → 905xx…
    if length(e164) = 10 and e164 like '5%' then e164 := '90' || e164; end if; -- 5xx… → 905xx…
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

  insert into public.wa_morning_log(id, data, created_at)
  values (gun::text, jsonb_build_object(
      'mode',       case when api_enabled then 'live' else 'shadow' end,
      'toplam',     n_total,
      'uygun',      n_ok,
      'sorunlu',    n_bad,
      'gonderilen', n_sent,
      'kisiler',    rec), now())
  on conflict (id) do update set data = excluded.data, created_at = now();

  delete from public.wa_morning_log where created_at < now() - interval '30 days';

  return case when api_enabled then 'CANLI: ' else 'GÖLGE: ' end
      || n_total || ' üye · uygun ' || n_ok || ' · sorunlu ' || n_bad || ' · gönderilen ' || n_sent;
end $$;

revoke execute on function public.pilateria_wa_morning() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4) ZAMANLAYICI — 08:00 TR = 05:00 UTC (Türkiye kalıcı UTC+3)
-- ─────────────────────────────────────────────────────────────
do $$
begin
  perform cron.unschedule('pilateria-wa-morning') from cron.job where jobname = 'pilateria-wa-morning';
exception when others then null;
end $$;

select cron.schedule('pilateria-wa-morning', '0 5 * * *', $$select public.pilateria_wa_morning();$$);

-- ─────────────────────────────────────────────────────────────
-- 5) HEMEN bir GÖLGE koşusu — bugünün listesi (HİÇBİR ŞEY GÖNDERİLMEZ)
-- ─────────────────────────────────────────────────────────────
select public.pilateria_wa_morning() as ilk_golge_kosusu;

-- ─────────────────────────────────────────────────────────────
-- 6) DOĞRULAMA
-- ─────────────────────────────────────────────────────────────
select 'wa_config'          as ne, (select count(*) from public.wa_config) >= 6                                        as tamam
union all select 'config-politikasiz', not exists(select 1 from pg_policies where schemaname='public' and tablename='wa_config')
union all select 'log-tablosu',        to_regclass('public.wa_morning_log') is not null
union all select 'log-okuma',          exists(select 1 from pg_policies where schemaname='public' and tablename='wa_morning_log')
union all select 'cron-aktif',         exists(select 1 from cron.job where jobname = 'pilateria-wa-morning' and active);
