-- 既存の staff_accounts (id, name, normalized_name, pin_hash) 用。
-- Supabase SQL Editor で一度実行してください。既存の名前・ハッシュは保持します。
begin;
create extension if not exists pgcrypto with schema extensions;
alter table public.staff_accounts
  add column if not exists organization text not null default '管理者',
  add column if not exists facility_id text not null default '',
  add column if not exists failed_attempts integer not null default 0,
  add column if not exists locked_until timestamptz;
alter table public.staff_accounts enable row level security;
revoke all on public.staff_accounts from anon, authenticated;

create or replace function public.hoho_staff_exists(p_name text)
returns boolean language sql security definer set search_path = '' as $$
  select exists(select 1 from public.staff_accounts
    where normalized_name = regexp_replace(p_name, '[[:space:]　]+', '', 'g'));
$$;

create or replace function public.hoho_staff_login(p_name text, p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  account public.staff_accounts%rowtype;
begin
  if length(p_name) > 100 or length(p_password) > 256 or p_password = '' then
    return null;
  end if;
  select * into account from public.staff_accounts
    where normalized_name = regexp_replace(p_name, '[[:space:]　]+', '', 'g')
    limit 1 for update;
  if not found then return null; end if;
  if account.locked_until > now() then return null; end if;
  if account.pin_hash is null or p_password is null or
     extensions.crypt(p_password, account.pin_hash) <> account.pin_hash then
    update public.staff_accounts
      set failed_attempts = case when account.failed_attempts >= 4 then 0 else account.failed_attempts + 1 end,
          locked_until = case when account.failed_attempts >= 4 then now() + interval '5 minutes' else null end
      where id = account.id;
    return null;
  end if;
  update public.staff_accounts set failed_attempts = 0, locked_until = null where id = account.id;
  return jsonb_build_object('id', account.id::text, 'name', account.name,
    'role', 'staff', 'organization', account.organization, 'facilityId', account.facility_id);
end;
$$;
revoke all on function public.hoho_staff_exists(text) from public;
revoke all on function public.hoho_staff_login(text, text) from public;
grant execute on function public.hoho_staff_exists(text) to anon, authenticated;
grant execute on function public.hoho_staff_login(text, text) to anon, authenticated;
commit;
