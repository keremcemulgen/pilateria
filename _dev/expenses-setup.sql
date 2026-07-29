-- ============================================================================
-- PILATERIA — GİDER TABLOSU KURULUMU (v127 — 29 Tem 2026)
--
-- Amaç: state.expenses koleksiyonu için diğer 13 tabloyla BİREBİR aynı düzende
-- bulut tablosu. Mevcut hiçbir tabloya/veriye DOKUNULMAZ; yalnız:
--   1) public.expenses tablosu (id text pk + data jsonb) — yoksa oluşturulur
--   2) RLS + authenticated politikası (diğer veri tablolarıyla aynı model)
--   3) Realtime yayınına ekleme (cihazlar arası anlık senkron)
--   4) BEFORE DELETE arşiv tetikleyicisi (v118 sunucu güvenlik ağı)
--   5) pilateria_snapshot_json() YENİDEN yazılır — 14 tabloyu kapsar
--      (yoksa gider verisi saatlik/gecelik yedeklerin DIŞINDA kalırdı!)
--   6) pilateria_restore_deleted() YENİDEN yazılır — 14 tablo
--
-- Tekrar çalıştırmak zararsızdır (her adım "varsa atla").
-- ============================================================================

-- ── ÖN BİLGİ (yalnız çıktı; karşılaştırma için payments politikaları) ──
select tablename, policyname, cmd, roles
  from pg_policies
 where schemaname = 'public' and tablename in ('payments')
 order by policyname;

-- ─────────────────────────────────────────────────────────────
-- 1) TABLO
-- ─────────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id   text primary key,
  data jsonb
);

-- ─────────────────────────────────────────────────────────────
-- 2) RLS — payments ile aynı model: giriş yapmış kullanıcı tam erişim
-- ─────────────────────────────────────────────────────────────
alter table public.expenses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='expenses'
  ) then
    create policy expenses_auth_all on public.expenses
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 3) REALTIME YAYINI
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='expenses'
  ) then
    alter publication supabase_realtime add table public.expenses;
  end if;
exception when others then
  raise notice 'realtime yayini eklenemedi: %', sqlerrm;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 4) SİLME ARŞİVİ TETİKLEYİCİSİ (fonksiyon v118'den beri mevcut)
-- ─────────────────────────────────────────────────────────────
drop trigger if exists pilateria_archive_del on public.expenses;
create trigger pilateria_archive_del before delete on public.expenses
  for each row execute function public.pilateria_archive_delete();

-- ─────────────────────────────────────────────────────────────
-- 5) GÖRÜNTÜ ÜRETECİ — 14 TABLO (expenses eklendi, gerisi AYNI)
-- ─────────────────────────────────────────────────────────────
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
    'settings',           (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.settings),
    'expenses',           (select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data)),'[]'::jsonb) from public.expenses)
  ) into snap;
  return snap;
end $$;

revoke execute on function public.pilateria_snapshot_json() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6) GERİ ALMA — 14 TABLO (expenses eklendi, gerisi AYNI)
-- ─────────────────────────────────────────────────────────────
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
    'package_types','campaigns','wa_templates','settings','expenses'
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

revoke execute on function public.pilateria_restore_deleted(timestamptz, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 7) DOĞRULAMA ÇIKTILARI
-- ─────────────────────────────────────────────────────────────
select 'tablo'      as ne, to_regclass('public.expenses') is not null as tamam
union all
select 'politika',    exists(select 1 from pg_policies where schemaname='public' and tablename='expenses')
union all
select 'tetikleyici', exists(select 1 from information_schema.triggers where trigger_name='pilateria_archive_del' and event_object_table='expenses')
union all
select 'realtime',    exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='expenses')
union all
select 'yedek-kapsami', (public.pilateria_snapshot_json() ? 'expenses');
