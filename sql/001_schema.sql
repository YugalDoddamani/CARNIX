-- ============================================
-- CARNIX Schema v1
-- ============================================

-- 1. USERS (mirrors auth.users, adds role/name)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'tech' check (role in ('admin','tech')),
  created_at timestamptz default now()
);

-- 2. PRICE LIST
create table public.price_list (
  id uuid primary key default gen_random_uuid(),
  case_type text not null,
  label text not null,
  price numeric(10,2) not null,
  active boolean default true,
  created_at timestamptz default now()
);
create index idx_price_list_case_type on public.price_list(case_type);

-- 3. CASES
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  received_date date not null default current_date,
  doctor_name text not null,
  patient_identifier text,
  case_type text not null,
  label text,
  unit_price numeric(10,2) not null,
  quantity int not null default 1,
  delivery_date date,
  delivered_at date,
  calculated_price numeric(10,2) generated always as (unit_price * quantity) stored,
  status text not null default 'in-queue'
    check (status in ('in-queue','received','delivered','complete')),
  payment_status boolean not null default false,
  notes text,
  invoice_id uuid,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_cases_delivery on public.cases(delivery_date);
create index idx_cases_payment on public.cases(payment_status);
create index idx_cases_doctor on public.cases(doctor_name);

-- 4. EXPENSES
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  category text not null,
  vendor text,
  description text,
  amount numeric(10,2) not null,
  payment_type text,
  status text default 'Paid',
  paid_from text,
  frequency text,
  is_asset boolean default false,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);
create index idx_expenses_date on public.expenses(date);

-- 5. INVENTORY
create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text,
  quantity numeric(10,2) not null default 0,
  min_quantity numeric(10,2) not null default 0,
  vendor text,
  notes text,
  updated_at timestamptz default now()
);

-- 6. INVOICES
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  doctor_name text not null,
  start_date date not null,
  end_date date not null,
  total numeric(10,2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid','paid')),
  generated_at timestamptz default now(),
  paid_at timestamptz,
  created_by uuid references public.users(id)
);

-- 7. INVOICE ITEMS (snapshot of cases at invoice time)
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  case_id uuid references public.cases(id),
  description text,
  unit_price numeric(10,2) not null,
  quantity int not null,
  amount numeric(10,2) not null
);
create index idx_invoice_items_invoice on public.invoice_items(invoice_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.users enable row level security;
alter table public.price_list enable row level security;
alter table public.cases enable row level security;
alter table public.expenses enable row level security;
alter table public.inventory enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- USERS: user can read own row, admin reads all
create policy "users self read" on public.users
  for select using (auth.uid() = id or public.is_admin());
create policy "users admin write" on public.users
  for all using (public.is_admin());

-- PRICE LIST: everyone reads, admin writes
create policy "price_list read" on public.price_list
  for select using (auth.role() = 'authenticated');
create policy "price_list admin write" on public.price_list
  for all using (public.is_admin());

-- CASES: authenticated read/write, only admin delete
create policy "cases read" on public.cases
  for select using (auth.role() = 'authenticated');
create policy "cases insert" on public.cases
  for insert with check (auth.role() = 'authenticated');
create policy "cases update" on public.cases
  for update using (auth.role() = 'authenticated');
create policy "cases delete" on public.cases
  for delete using (public.is_admin());

-- EXPENSES: admin only
create policy "expenses admin" on public.expenses
  for all using (public.is_admin());

-- INVENTORY: authenticated read, admin write
create policy "inventory read" on public.inventory
  for select using (auth.role() = 'authenticated');
create policy "inventory admin write" on public.inventory
  for all using (public.is_admin());

-- INVOICES: admin only
create policy "invoices admin" on public.invoices
  for all using (public.is_admin());
create policy "invoice_items admin" on public.invoice_items
  for all using (public.is_admin());

-- ============================================
-- TRIGGER: auto-update updated_at
-- ============================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cases_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

create trigger inventory_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- ============================================
-- TRIGGER: create user row on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'tech')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
