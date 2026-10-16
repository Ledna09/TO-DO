-- =====================================================================
-- Céges teendő app – adatbázis séma
-- Futtasd le egyszer: Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------- Profilok (kik használhatják az appot) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text not null default 'user' check (role in ('user','admin')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Új felhasználóhoz automatikusan profil készül (jóváhagyásra vár)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Már létező felhasználók pótlása
insert into public.profiles (id, email, name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- ---------- Segédfüggvények a jogosultsághoz ----------
create or replace function public.is_member()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and approved);
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and approved and role = 'admin');
$$;

-- ---------- Teendők ----------
create table if not exists public.tasks (
  id bigint generated always as identity primary key,
  category text not null,
  cat_order int not null default 0,
  pos int not null default 0,
  title text not null,
  kind text not null default 'folyamatos' check (kind in ('folyamatos','egyszeri')),
  is_new boolean not null default false,
  done boolean not null default false,
  done_by text,
  done_at timestamptz,
  assignee text,
  due date,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- ---------- Heti beosztás ----------
create table if not exists public.schedule (
  id bigint generated always as identity primary key,
  day date not null,
  kind text not null check (kind in ('csoport','iroda','fizikai')),
  time_label text,
  title text,
  staff text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);
create index if not exists schedule_day_idx on public.schedule(day);

-- ---------- Beszerzés ----------
create table if not exists public.procurement (
  id bigint generated always as identity primary key,
  category text not null,
  item text not null,
  unit text,
  stock numeric not null default 0,
  min_stock numeric not null default 0,
  ordered numeric not null default 0,
  ordered_at date,
  supplier text,
  note text,
  pos int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.procurement_log (
  id bigint generated always as identity primary key,
  item_id bigint not null references public.procurement(id) on delete cascade,
  kind text not null check (kind in ('fogyás','rendelés','beérkezett','leltár')),
  qty numeric not null,
  by_name text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists procurement_log_item_idx on public.procurement_log(item_id);

-- ---------- Jogosultságok (Row Level Security) ----------
alter table public.profiles        enable row level security;
alter table public.tasks           enable row level security;
alter table public.schedule        enable row level security;
alter table public.procurement     enable row level security;
alter table public.procurement_log enable row level security;

-- Névtelen (be nem jelentkezett) látogató semmit nem érhet el
revoke all on all tables in schema public from anon;

-- profiles: mindenki a sajátját látja; jóváhagyott tagok mindenkit; csak admin módosít
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_member());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- tasks: tagok olvashatnak, felvehetnek, módosíthatnak; törölni csak admin
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using (public.is_member());
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated with check (public.is_member());
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
  using (public.is_member()) with check (public.is_member());
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated using (public.is_admin());

-- schedule: tagok olvashatnak, csak admin szerkeszt
drop policy if exists schedule_select on public.schedule;
create policy schedule_select on public.schedule for select to authenticated using (public.is_member());
drop policy if exists schedule_write on public.schedule;
create policy schedule_write on public.schedule for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- procurement: tagok olvashatnak, felvehetnek, módosíthatnak; törölni csak admin
drop policy if exists proc_select on public.procurement;
create policy proc_select on public.procurement for select to authenticated using (public.is_member());
drop policy if exists proc_insert on public.procurement;
create policy proc_insert on public.procurement for insert to authenticated with check (public.is_member());
drop policy if exists proc_update on public.procurement;
create policy proc_update on public.procurement for update to authenticated
  using (public.is_member()) with check (public.is_member());
drop policy if exists proc_delete on public.procurement;
create policy proc_delete on public.procurement for delete to authenticated using (public.is_admin());

-- procurement_log
drop policy if exists plog_select on public.procurement_log;
create policy plog_select on public.procurement_log for select to authenticated using (public.is_member());
drop policy if exists plog_insert on public.procurement_log;
create policy plog_insert on public.procurement_log for insert to authenticated with check (public.is_member());
drop policy if exists plog_delete on public.procurement_log;
create policy plog_delete on public.procurement_log for delete to authenticated using (public.is_admin());

-- ---------- Élő frissítés (mindenki azonnal látja a változást) ----------
do $$
declare t text;
begin
  foreach t in array array['tasks','schedule','procurement','procurement_log','profiles'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------- ELSŐ ADMIN BEÁLLÍTÁSA ----------
-- Miután az admin felhasználót létrehoztad (Authentication → Users),
-- futtasd le ezt a SAJÁT e-mail címeddel:
--
-- update public.profiles set role = 'admin', approved = true
-- where email = 'te@ceged.ro';
