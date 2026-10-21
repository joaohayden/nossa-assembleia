-- Bora: run once in a new Supabase project's SQL Editor.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 2 and 60),
 unit text not null check (char_length(unit) between 1 and 40),
 role text not null default 'resident' check (role in ('resident','admin')),
 approved boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.proposals (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id),
 title text not null check (char_length(btrim(title)) between 8 and 100),
 description text not null check (char_length(btrim(description)) between 15 and 1500),
 category text not null check (category in ('Segurança','Áreas comuns','Manutenção','Convivência')),
 status text not null default 'open' check (status in ('open','assembly','done','archived')),
 note text not null default '' check (char_length(note) <= 1000),
 created_at timestamptz not null default now()
);
create table public.supports (
 proposal_id uuid not null references public.proposals(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (proposal_id,user_id)
);
create index proposals_created_at_idx on public.proposals(created_at desc);
create index supports_user_idx on public.supports(user_id);
create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,name,unit) values(new.id, left(coalesce(nullif(btrim(new.raw_user_meta_data->>'name'),''),'Morador'),60), left(coalesce(nullif(btrim(new.raw_user_meta_data->>'unit'),''),'A confirmar'),40));
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
create function public.is_member() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = (select auth.uid()) and approved);
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = (select auth.uid()) and approved and role = 'admin');
$$;
alter table public.profiles enable row level security;
alter table public.proposals enable row level security;
alter table public.supports enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_member());
create policy proposals_read on public.proposals for select to authenticated using (public.is_member() and (status <> 'archived' or public.is_admin()));
create policy proposals_insert on public.proposals for insert to authenticated with check (public.is_member() and author_id = (select auth.uid()) and status = 'open' and note = '');
create policy proposals_admin_update on public.proposals for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy supports_read on public.supports for select to authenticated using (public.is_member() and exists(select 1 from public.proposals p where p.id = proposal_id));
-- Revoke default table privileges; changes to approval and votes use controlled functions.
revoke all on public.profiles, public.proposals, public.supports from anon, authenticated;
grant select on public.profiles, public.proposals, public.supports to authenticated;
grant insert (author_id,title,description,category) on public.proposals to authenticated;
grant update (status,note) on public.proposals to authenticated;
create function public.approve_member(member_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'Admin required'; end if;
 update public.profiles set approved = true where id = member_id;
end; $$;
revoke all on function public.create_profile() from public, anon, authenticated;
revoke all on function public.is_member(), public.is_admin(), public.approve_member(uuid) from public, anon;
grant execute on function public.is_member(), public.is_admin(), public.approve_member(uuid) to authenticated;
commit;
-- After signing up and confirming the administrator's email, promote that account
-- manually in the SQL Editor (replace the address below):
-- update public.profiles set role = 'admin', approved = true
-- where id = (select id from auth.users where email = 'seu-email@exemplo.com');

-- Existing installations only: run after the original schema.
begin;
alter table public.supports add column if not exists value smallint not null default 1 check(value in (-1,1));
drop function if exists public.toggle_support(uuid);
create or replace function public.toggle_vote(proposal_id_input uuid, direction integer) returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_status text; previous integer; selected_vote integer; positives integer; negatives integer;
begin
 if not public.is_member() then raise exception 'Approved member required'; end if;
 if direction is null or direction not in (-1,1) then raise exception 'Invalid vote'; end if;
 select status into current_status from public.proposals where id = proposal_id_input for update;
 if current_status is null or current_status not in ('open','assembly') then raise exception 'Proposal is closed'; end if;
 select value into previous from public.supports where proposal_id=proposal_id_input and user_id=auth.uid();
 if previous = direction then
  delete from public.supports where proposal_id=proposal_id_input and user_id=auth.uid(); selected_vote:=0;
 else
  insert into public.supports(proposal_id,user_id,value) values(proposal_id_input,auth.uid(),direction)
  on conflict(proposal_id,user_id) do update set value=excluded.value; selected_vote:=direction;
 end if;
 select count(*) filter(where value=1), count(*) filter(where value=-1) into positives,negatives from public.supports where proposal_id=proposal_id_input;
 return jsonb_build_object('vote',selected_vote,'up',positives,'down',negatives);
end; $$;
revoke all on function public.toggle_vote(uuid,integer) from public, anon;
grant execute on function public.toggle_vote(uuid,integer) to authenticated;
commit;

-- Existing proposals remain editable; new proposals require resident details.
begin;
alter table public.proposals add column resident_name text check(char_length(btrim(resident_name)) between 2 and 60);
alter table public.proposals add column apartment text check(char_length(btrim(apartment)) between 1 and 20);
alter table public.proposals add column block text check(char_length(btrim(block)) between 1 and 20);
create function public.require_resident_details() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.resident_name is null or new.apartment is null or new.block is null then
  raise exception 'Resident name, apartment and block are required';
 end if;
 return new;
end; $$;
create trigger require_resident_details before insert on public.proposals for each row execute function public.require_resident_details();
revoke all on function public.require_resident_details() from public, anon, authenticated;
grant insert (resident_name,apartment,block) on public.proposals to authenticated;
commit;
