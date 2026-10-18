-- Policies are now enforced and managed directly in owner-protected Redis APIs.
-- Retain historical rows but close the old direct PostgREST access path.
begin;
do $$
begin
  if to_regclass('public.bot_policies') is not null then
    alter table public.bot_policies enable row level security;
    revoke all on table public.bot_policies from public, anon, authenticated;
  end if;
end
$$;
commit;
