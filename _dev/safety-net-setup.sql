-- ============================================================================
-- PILATERIA — SUNUCU TARAFI GÜVENLİK AĞI  (v118 — 27 Tem 2026)
--
-- Kerem: "bir daha böyle bir şey yaşanmamalı."
--
-- v118 uygulama tarafında silmeyi "mezar taşı" kapısına bağladı: bir kayıt
-- buluttan ANCAK o cihazda gerçekten silindiğinde silinir. Bu dosya aynı
-- garantiyi SUNUCU tarafında kurar; yani uygulamada ne olursa olsun,
-- hangi cihaz ne yaparsa yapsın, SİLİNEN SATIRIN İÇERİĞİ KAYBOLMAZ.
--
-- İki katman:
--   1) SİLME ARŞİVİ  — 13 tablonun her birine BEFORE DELETE tetikleyicisi.
--      Silinen satır, silinmeden ÖNCE public.deleted_rows tablosuna kopyalanır.
--      Arşivleme başarısız olursa SİLME DE OLMAZ (güvenli taraf).
--   2) SAATLİK ANLIK GÖRÜNTÜ — gecelik yedeğe ek olarak her saat başı tam
--      görüntü. 26 Tem'de hasar 23:2x'te oldu, gecelik yedek 00:00'da çalıştı;
--      yani yedek hasarı ÇOKTAN içine almıştı. Saatlik görüntü bu boşluğu kapatır.
--
-- KULLANIM: Supabase panosu → SQL Editor → hepsini yapıştır → RUN.
-- Tek seferlik. Tekrar çalıştırmak zararsızdır (her adım "varsa atla" mantığında).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) SİLME ARŞİVİ TABLOSU
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.deleted_rows (
  seq         bigserial primary key,
  table_name  text        not null,
  row_id      text        not null,
  data        jsonb,
  deleted_at  timestamptz not null default now(),
  deleted_by  uuid                                  -- oturum sahibi (varsa)
);

create index if not exists deleted_rows_at_ix    on public.deleted_rows (deleted_at desc);
create index if not exists deleted_rows_table_ix on public.deleted_rows (table_name, row_id);

alter table public.deleted_rows enable row level security;

-- Giriş yapmış kullanıcı OKUYABİLİR (kurtarma konsolu için).
-- YAZMA/SİLME için HİÇBİR politika yok → istemci arşivi kurcalayamaz.
-- Tetikleyici security definer çalıştığı için RLS onu engellemez.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='deleted_rows' and policyname='deleted_rows_auth_read'
  ) then
    create policy deleted_rows_auth_read on public.deleted_rows
      for select to authenticated using (true);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) TETİKLEYİCİ FONKSİYONU
--    BEFORE DELETE → satırı arşive kopyala → OLD döndür (silmeye izin ver).
--    Arşiv yazılamazsa hata fırlar ve SİLME İPTAL olur. Bu KASITLIDIR:
--    "silinemedi" görünür ve düzeltilebilir; "kayboldu" düzeltilemez.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.pilateria_archive_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  begin
    v_uid := auth.uid();
  exception when others then
    v_uid := null;
  end;

  insert into public.deleted_rows(table_name, row_id, data, deleted_by)
  values (tg_table_name, old.id, old.data, v_uid);

  return old;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) 13 TABLONUN HEPSİNE TETİKLEYİCİYİ TAK
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
  tablolar text[] := array[
    'members','member_finance','groups','group_finance','lessons',
    'instructors','instructor_finance','payments','instructor_payouts',
    'package_types','campaigns','wa_templates','settings'
  ];
begin
  foreach t in array tablolar loop
    if to_regclass('public.' || quote_ident(t)) is null then
      raise notice 'ATLA: public.% tablosu yok', t;
      continue;
    end if;
    execute format('drop trigger if exists pilateria_archive_del on public.%I', t);
    execute format(
      'create trigger pilateria_archive_del before delete on public.%I
         for each row execute function public.pilateria_archive_delete()', t);
    raise notice 'TAKILDI: public.%', t;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) GERİ ALMA FONKSİYONU
--    Belirtilen andan sonra silinen ve ŞU AN tabloda OLMAYAN satırları geri koyar.
--    "on conflict do nothing" → mevcut (daha yeni) satırlar ASLA ezilmez.
--    Yalnız SQL Editor'den çalıştırılabilir (aşağıda tüm rollerden yetki alınıyor).
--
--    Örnek:  select * from public.pilateria_restore_deleted(now() - interval '6 hours');
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.pilateria_restore_deleted(
  p_since timestamptz default (now() - interval '24 hours'),
  p_table text default null
)
returns table(tablo text, geri_gelen bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  t text;
  n bigint;
  tablolar text[] := array[
    'members','member_finance','groups','group_finance','lessons',
    'instructors','instructor_finance','payments','instructor_payouts',
    'package_types','campaigns','wa_templates','settings'
  ];
begin
  foreach t in array tablolar loop
    if p_table is not null and p_table <> t then continue; end if;
    if to_regclass('public.' || quote_ident(t)) is null then continue; end if;

    execute format(
      'with src as (
         select distinct on (row_id) row_id, data
           from public.deleted_rows
          where table_name = %L and deleted_at >= %L and data is not null
          order by row_id, deleted_at desc
       )
       insert into public.%I (id, data)
       select row_id, data from src
       on conflict (id) do nothing', t, p_since, t);

    get diagnostics n = row_count;
    if n > 0 then
      tablo := t; geri_gelen := n; return next;
    end if;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) SAATLİK ANLIK GÖRÜNTÜ
--    Aynı daily_backups tablosuna yazar; kimliği 'YYYY-MM-DD_HH' (Türkiye saati).
--    Gecelik yedek ('YYYY-MM-DD') olduğu gibi kalır — ikisi yan yana durur ve
--    kurtarma konsolları ikisini de listeler (metin sıralaması doğru çalışır).
--    Saatlikler 3 gün, gecelikler 30 gün saklanır.
-- ─────────────────────────────────────────────────────────────────────────────
-- 5a) Ortak görüntü üreteci (tek yerde dursun; hem saatlik hem gecelik bunu kullanır)
create or replace function public.pilateria_snapshot_json()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  snap jsonb;
begin
  select jsonb_build_object(
    'members',            (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.members),
    'member_finance',     (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.member_finance),
    'groups',             (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.groups),
    'group_finance',      (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.group_finance),
    'lessons',            (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.lessons),
    'instructors',        (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.instructors),
    'instructor_finance', (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.instructor_finance),
    'payments',           (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.payments),
    'instructor_payouts', (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.instructor_payouts),
    'package_types',      (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.package_types),
    'campaigns',          (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.campaigns),
    'wa_templates',       (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.wa_templates),
    'settings',           (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.settings)
  ) into snap;
  return snap;
end $$;

-- 5b) Yazıcı: kimliği verilen görüntüyü yazar, bakımı yapar.
--     BOŞ görüntü YAZILMAZ — hasarlı/boş bir an sağlam yedeğin üstüne geçemez.
create or replace function public.pilateria_write_snapshot(p_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  snap jsonb := public.pilateria_snapshot_json();
begin
  if coalesce(jsonb_array_length(snap->'members'), 0) = 0 then
    return 'ATLANDI (uye yok — bos goruntu yedegi EZMEZ)';
  end if;

  insert into public.daily_backups(id, snapshot, created_at)
  values (p_id, snap, now())
  on conflict (id) do update set snapshot = excluded.snapshot, created_at = now();

  -- saatlikler (id içinde '_' var) 3 gün; gecelikler 30 gün
  delete from public.daily_backups where id like '%\_%'     and created_at < now() - interval '3 days';
  delete from public.daily_backups where id not like '%\_%' and created_at < now() - interval '30 days';
  -- silme arşivi 90 gün
  delete from public.deleted_rows where deleted_at < now() - interval '90 days';

  return p_id;
end $$;

-- 5c) Saatlik görüntü — 'YYYY-MM-DD_HH'
create or replace function public.pilateria_take_snapshot()
returns text
language sql
security definer
set search_path = public
as $$
  select public.pilateria_write_snapshot(to_char(timezone('Europe/Istanbul', now()), 'YYYY-MM-DD_HH24'));
$$;

-- 5d) Gecelik yedek — ADI VE İMZASI AYNI kalıyor (mevcut cron işi bozulmadan çalışmaya
--     devam eder), ama artık BOŞ görüntü koruması var. 26 Tem'de eksik olan da buydu.
create or replace function public.pilateria_take_backup()
returns text
language sql
security definer
set search_path = public
as $$
  select public.pilateria_write_snapshot(to_char(timezone('Europe/Istanbul', now()), 'YYYY-MM-DD'));
$$;

create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('pilateria-hourly-snapshot')
    from cron.job where jobname = 'pilateria-hourly-snapshot';
exception when others then null;
end $$;

select cron.schedule('pilateria-hourly-snapshot', '0 * * * *', $$select public.pilateria_take_snapshot();$$);

-- İlk saatlik görüntüyü HEMEN al (kurulumu doğrulamak için)
select public.pilateria_take_snapshot() as ilk_saatlik_goruntu;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6) YETKİ KAPATMA — bu güçlü fonksiyonlar YALNIZ SQL Editor'den çalışsın.
--    (pilateria_take_backup için bekleyen revoke da burada halledildi.)
-- ─────────────────────────────────────────────────────────────────────────────
revoke execute on function public.pilateria_take_backup()                       from public, anon, authenticated;
revoke execute on function public.pilateria_take_snapshot()                     from public, anon, authenticated;
revoke execute on function public.pilateria_write_snapshot(text)                from public, anon, authenticated;
revoke execute on function public.pilateria_snapshot_json()                     from public, anon, authenticated;
revoke execute on function public.pilateria_restore_deleted(timestamptz, text)  from public, anon, authenticated;
revoke execute on function public.pilateria_archive_delete()                    from public, anon, authenticated;

-- ============================================================================
-- DOĞRULAMA (isteğe bağlı — tek tek çalıştırılabilir)
--
--   -- tetikleyiciler takılı mı? (13 satır beklenir)
--   select event_object_table, trigger_name, action_timing, event_manipulation
--     from information_schema.triggers
--    where trigger_name = 'pilateria_archive_del' order by event_object_table;
--
--   -- son 24 saatte ne silindi?
--   select table_name, count(*), max(deleted_at)
--     from public.deleted_rows
--    where deleted_at > now() - interval '24 hours'
--    group by table_name order by 2 desc;
--
--   -- silinen kayıtların kendisi
--   select deleted_at, table_name, row_id, data->>'date' as tarih, data->>'name' as ad
--     from public.deleted_rows
--    where deleted_at > now() - interval '24 hours'
--    order by deleted_at desc limit 50;
--
--   -- yedek listesi (saatlik + gecelik bir arada)
--   select id, created_at, jsonb_array_length(snapshot->'members') as uye,
--          jsonb_array_length(snapshot->'lessons') as ders,
--          jsonb_array_length(snapshot->'payments') as odeme
--     from public.daily_backups order by id desc limit 40;
--
--   -- cron işleri
--   select jobname, schedule, active from cron.job where jobname like 'pilateria%';
--
--   -- GERİ ALMA (yalnız gerektiğinde!): son 6 saatte silinenleri geri koy
--   -- select * from public.pilateria_restore_deleted(now() - interval '6 hours');
-- ============================================================================
