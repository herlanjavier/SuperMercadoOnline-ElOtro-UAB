alter table public.sales
add column if not exists status text not null default 'active',
add column if not exists cancelled_at timestamptz,
add column if not exists cancelled_by uuid references public.profiles(id),
add column if not exists cancellation_reason text;

alter table public.sales
drop constraint if exists sales_status_check;

alter table public.sales
add constraint sales_status_check
check (status in ('active', 'cancelled'));
