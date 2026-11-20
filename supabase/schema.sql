-- ==============================================================================
-- Full Real-Time Pharmacy Schema for ApexCare Rx (Supabase)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/jefrkgpouhgcsflupyib/sql
-- ==============================================================================

-- 1. Profiles Table (Pharmacy Store & Proprietor)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  pharmacy_name text default 'HealthPlus Meds & Wellness',
  owner_name text default 'Dr. Anjali Verma',
  license_number text default 'DL-KA-2024-99120B',
  phone text default '+91 98201 54321',
  address text default 'Shop No. 4, Ground Floor, Shanti Heights, Link Road, Andheri West',
  city text default 'Mumbai, Maharashtra 400053',
  pharmacy_type text default 'standalone',
  store_size text default 'medium',
  role text default 'Pharmacist Admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure newly added columns exist if table was already created
alter table public.profiles add column if not exists phone text default '+91 98201 54321';
alter table public.profiles add column if not exists address text default 'Shop No. 4, Ground Floor, Shanti Heights, Link Road, Andheri West';
alter table public.profiles add column if not exists city text default 'Mumbai, Maharashtra 400053';
alter table public.profiles add column if not exists pharmacy_type text default 'standalone';
alter table public.profiles add column if not exists store_size text default 'medium';

-- 2. Real-time Inventory Batches Table
create table if not exists public.inventory_batches (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  medicine_id text not null,
  medicine_name text not null,
  generic_name text default '',
  category text default 'Analgesics & Pain',
  manufacturer text default '',
  batch_number text not null,
  quantity integer not null default 0,
  purchase_price numeric(10, 2) not null default 0,
  selling_price numeric(10, 2) not null default 0,
  expiry_date text not null,
  reorder_threshold integer not null default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Real-time Invoices / Billing Table
create table if not exists public.invoices (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  invoice_number text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_phone text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10, 2) not null default 0,
  discount_percent numeric(5, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  tax_percent numeric(5, 2) not null default 12,
  tax_amount numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  payment_method text not null default 'Cash',
  payment_status text not null default 'Completed',
  cashier_name text default 'Dr. Anjali Verma',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.invoices enable row level security;

-- 5. RLS Policies for Profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 6. RLS Policies for Inventory Batches
drop policy if exists "Users can view own inventory batches" on public.inventory_batches;
create policy "Users can view own inventory batches"
  on public.inventory_batches for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own inventory batches" on public.inventory_batches;
create policy "Users can insert own inventory batches"
  on public.inventory_batches for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own inventory batches" on public.inventory_batches;
create policy "Users can update own inventory batches"
  on public.inventory_batches for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own inventory batches" on public.inventory_batches;
create policy "Users can delete own inventory batches"
  on public.inventory_batches for delete
  using (auth.uid() = user_id);

-- 7. RLS Policies for Invoices
drop policy if exists "Users can view own invoices" on public.invoices;
create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own invoices" on public.invoices;
create policy "Users can insert own invoices"
  on public.invoices for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own invoices" on public.invoices;
create policy "Users can update own invoices"
  on public.invoices for update
  using (auth.uid() = user_id);

-- 8. Automatic Trigger on Auth Sign-Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    pharmacy_name,
    owner_name,
    license_number,
    phone,
    address,
    city,
    pharmacy_type,
    store_size,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'pharmacy_name', 'HealthPlus Meds & Wellness'),
    coalesce(new.raw_user_meta_data->>'owner_name', 'Dr. Anjali Verma'),
    coalesce(new.raw_user_meta_data->>'license_number', 'DL-KA-2024-99120B'),
    coalesce(new.raw_user_meta_data->>'phone', '+91 98201 54321'),
    coalesce(new.raw_user_meta_data->>'address', 'Shop No. 4, Ground Floor, Shanti Heights, Link Road, Andheri West'),
    coalesce(new.raw_user_meta_data->>'city', 'Mumbai, Maharashtra 400053'),
    coalesce(new.raw_user_meta_data->>'pharmacy_type', 'standalone'),
    coalesce(new.raw_user_meta_data->>'store_size', 'medium'),
    coalesce(new.raw_user_meta_data->>'role', 'Pharmacist Admin')
  )
  on conflict (id) do update set
    pharmacy_name = excluded.pharmacy_name,
    owner_name = excluded.owner_name,
    license_number = excluded.license_number;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. Enable Real-Time Replication on all Tables!
-- This powers instant live dashboard updates across browser tabs & devices!
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.inventory_batches;
alter publication supabase_realtime add table public.invoices;
