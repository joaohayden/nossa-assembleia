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
