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
