alter table public.bookings
  add column if not exists city text,
  add column if not exists event_time text,
  add column if not exists theme text,
  add column if not exists preferred_contact text,
  add column if not exists how_heard text;

alter table public.orders
  add column if not exists city text,
  add column if not exists event_time text;

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  note text not null check (char_length(note) between 1 and 2000),
  author text,
  created_at timestamptz not null default now(),
  check ((booking_id is not null) <> (order_id is not null))
);

alter table public.admin_notes enable row level security;
create policy "admin full access" on public.admin_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.admin_notes to authenticated;
grant all on public.admin_notes to service_role;
