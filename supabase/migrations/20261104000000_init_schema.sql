-- =========================================================
-- CarisGold Events: initial schema, RLS and seed data
-- =========================================================

-- ---------- Enums ----------
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.order_status as enum ('new', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
create type public.booking_status as enum ('new', 'quoted', 'accepted', 'paid', 'completed', 'cancelled');
create type public.order_type as enum ('juice', 'package');

-- ---------- Helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Profiles (admin roles) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Catalog ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('juice', 'local_drink', 'mocktail')),
  description text,
  image_url text,
  is_preorder boolean not null default false,
  is_active boolean not null default true,
  available_in_shop boolean not null default true,
  available_in_packages boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (size in ('gallon', '500ml', '350ml', '250ml', 'single')),
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  unique (product_id, size)
);

create table public.treats (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  guests int not null unique check (guests > 0),
  varieties int not null check (varieties > 0),
  price numeric(10,2) not null check (price >= 0),
  includes text not null default 'Attendant, disposable cups, dispensers and setup',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger packages_updated_at before update on public.packages
  for each row execute function public.set_updated_at();

-- ---------- Settings and Terms ----------
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  version int not null unique,
  body text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index terms_one_current on public.terms (is_current) where is_current;

-- ---------- Orders ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  user_id uuid references auth.users(id) on delete set null,
  order_type public.order_type not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  fulfilment text not null default 'delivery' check (fulfilment in ('pickup', 'delivery')),
  event_date date,
  delivery_address text,
  guests int,
  package_id uuid references public.packages(id),
  notes text,
  total numeric(10,2) not null check (total >= 0),
  currency text not null default 'GHS',
  is_late_order boolean not null default false,
  status public.order_status not null default 'new',
  payment_status public.payment_status not null default 'pending',
  paystack_reference text unique,
  terms_version int not null references public.terms(version),
  terms_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create index orders_created_idx on public.orders (created_at desc);
create index orders_payment_idx on public.orders (payment_status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_type text not null check (item_type in ('variant', 'package', 'package_variety', 'extra_variety', 'treat')),
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  treat_id uuid references public.treats(id),
  description text not null,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  line_total numeric(10,2) generated always as (quantity * unit_price) stored
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------- Event management bookings ----------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_no bigint generated always as identity,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  service_type text not null check (service_type in ('event_management', 'decor', 'event_management_and_decor')),
  event_type text not null,
  event_date date not null,
  guests int,
  venue text,
  budget_range text,
  message text,
  status public.booking_status not null default 'new',
  quote_amount numeric(10,2) check (quote_amount >= 0),
  quote_note text,
  quote_sent_at timestamptz,
  payment_status public.payment_status not null default 'pending',
  paystack_reference text unique,
  terms_version int not null references public.terms(version),
  terms_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create index bookings_status_idx on public.bookings (status);

-- ---------- Payments (one row per Paystack transaction) ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  reference text not null unique,
  amount numeric(10,2) not null,
  currency text not null default 'GHS',
  status public.payment_status not null default 'pending',
  channel text,
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  check (order_id is not null or booking_id is not null)
);

-- ---------- Grants ----------
grant usage on schema public to anon, authenticated, service_role;
grant select on public.products, public.product_variants, public.packages,
  public.treats, public.settings, public.terms to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- ---------- Row level security ----------
do $$
declare t text;
begin
  foreach t in array array[
    'products', 'product_variants', 'packages', 'treats', 'settings', 'terms',
    'profiles', 'orders', 'order_items', 'payments', 'bookings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "admin full access" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;

-- Public can read the storefront catalog
create policy "public read products" on public.products for select to anon, authenticated using (is_active);
create policy "public read variants" on public.product_variants for select to anon, authenticated using (is_active);
create policy "public read packages" on public.packages for select to anon, authenticated using (is_active);
create policy "public read treats" on public.treats for select to anon, authenticated using (is_active);
create policy "public read settings" on public.settings for select to anon, authenticated using (true);
create policy "public read terms" on public.terms for select to anon, authenticated using (true);

-- Signed-in customers can read their own records (all writes go through server routes using the service role)
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "read own orders" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "read own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "read own bookings" on public.bookings for select to authenticated using (user_id = auth.uid());

-- =========================================================
-- SEED DATA
-- =========================================================

-- Settings
insert into public.settings (key, value) values
  ('extra_variety_price', '150'),
  ('min_notice_days', '14'),
  ('treat_price_per_person', '15'),
  ('treat_picks', '3'),
  ('currency', '"GHS"');

-- Terms and conditions (v1). The payment line is reworded for full payment at checkout: confirm with client.
insert into public.terms (version, body, is_current) values (
  1,
  $terms$Extra variety is at an extra cost of GHS 150.
Orders should be made at least two clear weeks before the event. Late orders may attract additional charges.
Specific themed setup and customized branding may attract extra charges.
Local snacks come at a separate cost.
Full payment is required at checkout to confirm your booking and block the date.
Rates are exclusive of transportation and taxes. Transport charges may vary depending on location.$terms$,
  true
);

-- Guest packages (2025 price list)
insert into public.packages (guests, varieties, price) values
  (50, 3, 2000), (100, 4, 3600), (150, 5, 5250), (200, 5, 6800), (250, 5, 8000),
  (300, 6, 9000), (350, 6, 10500), (400, 6, 12000), (450, 6, 13500), (500, 6, 15000);

-- Local treats
insert into public.treats (name, sort_order) values
  ('Nkate Cake', 1), ('Kube Cake', 2), ('Condensed Milk Toffee', 3), ('Kube Toffee', 4),
  ('Adunley / Kulikuli', 5), ('Agbeli Kaaklo', 6), ('Poloo', 7), ('Adakwa', 8),
  ('Plantain Chips', 9), ('Achomo', 10), ('Devilled Eggs (Kosua ne Meko)', 11),
  ('Roasted Peanuts & Corn (Aburo ne Nkatie)', 12);

-- Products + size prices (2025 menu names, 2024 per-size prices)
with seed (slug, name, category, preorder, sort, g, s500, s350, s250, single) as (
  values
  ('pineapple', 'Pineapple', 'juice', false, 1, 150, 20, 15, 10, null),
  ('pineapple-ginger', 'Pineapple & Ginger', 'juice', false, 2, 150, 20, 15, 10, null),
  ('pineapple-passion', 'Pineapple & Passion', 'juice', false, 3, 150, 20, 15, 10, null),
  ('pineapple-coconut', 'Pineapple & Coconut', 'juice', true, 4, 150, 20, 15, 10, null),
  ('pineapple-mint', 'Pineapple & Mint', 'juice', true, 5, 150, 20, 15, 10, null),
  ('orange', 'Orange', 'juice', false, 6, 180, 25, 18, 12, null),
  ('orange-pineapple', 'Orange & Pineapple', 'juice', false, 7, 170, 25, 18, 12, null),
  ('orange-carrot', 'Orange & Carrot', 'juice', true, 8, 180, 25, 18, 12, null),
  ('mango', 'Mango', 'juice', false, 9, 170, 25, 18, 12, null),
  ('mango-pineapple', 'Mango & Pineapple', 'juice', false, 10, 150, 20, 15, 10, null),
  ('watermelon', 'Watermelon', 'juice', false, 11, 150, 20, 15, 10, null),
  ('watermelon-pineapple', 'Watermelon & Pineapple', 'juice', false, 12, 150, 20, 15, 10, null),
  ('fruit-cocktail', 'Fruit Cocktail', 'juice', false, 13, 150, 20, 15, 10, null),
  ('sugarcane-juice', 'Sugarcane Juice (with Ginger, Lime or Mint)', 'juice', true, 14, 150, 20, 15, 10, null),
  ('lemonade', 'Lemonade', 'juice', false, 15, 220, 70, null, null, null),
  ('beetroot', 'Beetroot', 'juice', false, 16, 150, 20, 15, 10, null),
  ('beetroot-pineapple-ginger', 'Beetroot, Pineapple & Ginger', 'juice', false, 17, 150, 20, 15, 10, null),
  ('beetroot-melon', 'Beetroot & Melon', 'juice', false, 18, 150, 20, 15, 10, null),
  ('green-juice', 'Green Juice', 'juice', false, 19, 150, 20, 15, 10, null),
  ('carrot-juice', 'Carrot Juice', 'juice', false, 20, 150, 20, 15, 10, null),
  ('coconut-milk', 'Coconut Milk', 'juice', false, 21, 150, 20, 15, 10, null),
  ('powerhouse', 'Powerhouse (Tigernut, Dates & Ginger)', 'juice', false, 22, 150, 20, 15, 10, null),
  ('tigernuts-dates-pineapple', 'Tigernuts, Dates & Pineapple', 'juice', true, 23, 150, 20, 15, 10, null),
  ('banana-mango', 'Banana & Mango', 'juice', false, 24, 150, 20, 15, 10, null),
  ('cucumber-orange-ginger', 'Cucumber, Orange & Ginger', 'juice', false, 25, 150, 20, 15, 10, null),
  ('fresh-coconut', 'Fresh Coconut', 'juice', false, 26, null, null, null, null, 10),
  ('bissap-sobolo', 'Bissap / Sobolo', 'local_drink', false, 27, 100, 15, 10, 7, null),
  ('asaana', 'Asaana', 'local_drink', false, 28, 100, 15, 10, 7, null),
  ('palm-wine', 'Palm Wine', 'local_drink', false, 29, 100, 15, 10, 7, null),
  ('lamugine', 'Lamugine', 'local_drink', false, 30, 100, 15, 10, 7, null),
  ('pito', 'Pito', 'local_drink', false, 31, 120, 15, 12, 7, null),
  ('brukina', 'Brukina', 'local_drink', true, 32, 120, 15, 12, 7, null),
  ('tigernut-bliss', 'Tigernut Bliss (Tigernuts, Dates, Coconut & Ginger)', 'local_drink', false, 33, null, null, null, null, null),
  ('fula', 'Fula', 'local_drink', true, 34, null, null, null, null, null),
  ('virgin-mojito', 'Virgin Mojito', 'mocktail', false, 35, null, null, null, null, null),
  ('pina-colada', 'Pina Colada', 'mocktail', false, 36, null, null, null, null, null),
  ('ojacoius-christocentric-islander', 'Ojacoius Christocentric Islander', 'mocktail', false, 37, null, null, null, null, null),
  ('quiet-sunday', 'Quiet Sunday', 'mocktail', false, 38, null, null, null, null, null)
),
ins as (
  insert into public.products (slug, name, category, is_preorder, available_in_shop, available_in_packages, sort_order)
  select slug, name, category, preorder, (g is not null or single is not null), true, sort
  from seed
  returning id, slug
)
insert into public.product_variants (product_id, size, price)
select ins.id, v.size, v.price
from ins
join seed on seed.slug = ins.slug
cross join lateral (
  values ('gallon', seed.g), ('500ml', seed.s500), ('350ml', seed.s350), ('250ml', seed.s250), ('single', seed.single)
) as v(size, price)
where v.price is not null;
