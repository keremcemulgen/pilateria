-- v104 IZLEME + UZUN SAKLAMA (Pilateria)
-- 1) Gunluk yedek fonksiyonu: 30 gun tam + AY BASI yedekleri 400 gune kadar saklanir
create or replace function public.pilateria_take_backup()
returns text language plpgsql security definer set search_path = public as $$
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
  delete from public.daily_backups where created_at < now() - interval '30 days' and id not like '%-01';
  delete from public.daily_backups where created_at < now() - interval '400 days';
  return bid;
end $$;

-- 2) Saglik fonksiyonu: KISISEL VERI YOK (yalniz sayilar); gizli anahtar ister; anon GET ile cagrilabilir
create or replace function public.pilateria_health(k text)
returns json language sql stable security definer set search_path = public as $$
  select case when k = '<GIZLI-IZLEME-ANAHTARI — claude.ai projesindeki veri-kurtarma dokumaninda>' then json_build_object(
    'uye',            (select count(*) from members),
    'grup',           (select count(*) from groups),
    'ders',           (select count(*) from lessons),
    'odeme',          (select count(*) from payments),
    'son_yedek_gun',  (select max(id) from daily_backups),
    'son_yedek_zaman',(select max(created_at) from daily_backups),
    'cron_aktif',     (select bool_or(active) from cron.job where jobname = 'pilateria-daily-backup')
  ) else null end
$$;
grant execute on function public.pilateria_health(text) to anon, authenticated;

-- 3) Dogrulama
select public.pilateria_health('<GIZLI-IZLEME-ANAHTARI — claude.ai projesindeki veri-kurtarma dokumaninda>') as saglik;
