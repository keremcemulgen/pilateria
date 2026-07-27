-- ============================================================================
-- PILATERIA — OTOMATIK GÜNLÜK YEDEK KURULUMU (Supabase, Free plan uyumlu)
-- Her gece saat 00:00'da (Türkiye) tüm veriyi ayrı bir tabloya yedekler.
-- Bu tablo uygulamanın senkron döngüsüne DAHİL DEĞİL → "bulut boşalınca silme"
-- hatası bu yedeklere ASLA dokunamaz. Son 30 gün saklanır.
-- Supabase panosunda: SQL Editor → hepsini yapıştır → RUN.
-- ============================================================================

-- 1) Yedek tablosu
create table if not exists public.daily_backups (
  id          text primary key,             -- 'YYYY-MM-DD' (Türkiye tarihi)
  created_at  timestamptz not null default now(),
  snapshot    jsonb not null                -- { members:[{id,data}...], ... } tüm tablolar
);

alter table public.daily_backups enable row level security;

-- v120 GÜVENLİK (Y-3) — BU BLOK ESKİDEN BİR GERİ-ADIM TUZAĞIYDI.
-- Eski hali "daily_backups_auth_all" adlı, giriş yapmış HERKESE tam yetki veren bir politika
-- kuruyordu ve varlık kontrolünü POLİTİKA ADINA göre yapıyordu. Üretimde artık sahibe-özel
-- "daily_backups_owner_all" politikası var; adlar farklı olduğu için bu betiği tekrar
-- çalıştırmak gevşek politikayı yenisinin YANINA ekliyordu. PostgreSQL permissive politikaları
-- OR'ladığından yedekler (TC kimlik, adres, sağlık notu dahil TÜM veri) sessizce personele
-- yeniden açılıyordu. Artık gevşek politika açıkça DÜŞÜRÜLÜR ve sahibe-özel olan kurulur.

-- Rolü profiles'tan okuyan güvenli yardımcı (SECURITY DEFINER + sabit search_path).
create or replace function public.my_role()
returns text language sql stable security definer set search_path to 'public'
as $fn$ select coalesce((select role from public.profiles where id = auth.uid()), 'none') $fn$;

drop policy if exists daily_backups_auth_all  on public.daily_backups;   -- gevşek olanı düşür
drop policy if exists daily_backups_owner_all on public.daily_backups;   -- idempotent yeniden kurulum
create policy daily_backups_owner_all on public.daily_backups
  for all to authenticated
  using (my_role() = 'owner')
  with check (my_role() = 'owner');

-- 2) Anlık görüntü fonksiyonu (tüm tabloları tek jsonb'de toplar, 30 günden eskiyi siler)
create or replace function public.pilateria_take_backup()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  snap jsonb;
  bid  text := to_char(timezone('Europe/Istanbul', now()), 'YYYY-MM-DD');
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

  insert into public.daily_backups(id, snapshot, created_at)
  values (bid, snap, now())
  on conflict (id) do update set snapshot = excluded.snapshot, created_at = now();

  delete from public.daily_backups where created_at < now() - interval '30 days';
  return bid;
end $$;

-- 2b) K-1 — FONKSİYONU İNTERNETE KAPAT.
-- PostgreSQL yeni fonksiyonlara EXECUTE yetkisini varsayılan olarak HERKESE verir.
-- Bu fonksiyon "security definer" olduğu için RLS'i atlar; yetki açık kalırsa
-- giriş yapmamış herkes onu sınırsız çağırıp veritabanını yorabilir ve o günkü
-- yedeği anlık halle ezebilir. Üretimde bu yetki zaten kaldırılmış durumda
-- (2026-07-27 doğrulaması: acl = postgres + service_role); burada da olması,
-- betiğin ileride yeniden çalıştırılmasının açığı geri getirmemesi içindir.
-- pg_cron postgres yetkisiyle koştuğundan gece yedeği bundan etkilenmez.
revoke execute on function public.pilateria_take_backup() from public, anon, authenticated;

-- 3) İlk yedeği HEMEN al (kurulumu doğrulamak için)
select public.pilateria_take_backup() as ilk_yedek_gunu;

-- 4) Her gece otomatik çalıştır (pg_cron). 21:00 UTC = 00:00 Türkiye (UTC+3).
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('pilateria-daily-backup')
    from cron.job where jobname = 'pilateria-daily-backup';
exception when others then null;
end $$;

select cron.schedule('pilateria-daily-backup', '0 21 * * *', $$select public.pilateria_take_backup();$$);

-- Doğrulama sorguları (isteğe bağlı):
--   select id, created_at, jsonb_array_length(snapshot->'members') as uye from public.daily_backups order by id desc;
--   select jobname, schedule, active from cron.job where jobname='pilateria-daily-backup';
