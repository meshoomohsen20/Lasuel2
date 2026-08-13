-- ============================================
-- Laseul Store — Supabase Schema
-- شغّل الكود ده في مشروعك الجديد من: SQL Editor → New query → Run
-- ============================================

-- جدول المنتجات
create table public.laseul_products (
  id text primary key,                 -- كود المنتج، مثال: ls-001
  name text not null,                  -- اسم المنتج
  category text not null,              -- التصنيف: فساتين، بلوزات...
  price numeric not null,              -- السعر الحالي
  old_price numeric,                   -- السعر قبل الخصم (اختياري)
  colors jsonb not null default '[]',  -- مثال: ["بيج", "أسود"]
  sizes jsonb not null default '[]',   -- مثال: ["S", "M", "L"]
  image text not null,                 -- صورة الغلاف
  images jsonb not null default '[]',  -- كل صور المنتج (جاليري)
  description text,                    -- الوصف
  created_at timestamptz not null default now()
);

-- تفعيل الحماية (RLS) — إجباري عشان محدش يقدر يعدل غير الأدمن
alter table public.laseul_products enable row level security;

-- أي حد (زباين الموقع) يقدر يقرا المنتجات بس
create policy "Public can read products"
on public.laseul_products for select
to anon, authenticated
using (true);

-- الأدمن (بعد تسجيل الدخول) بس اللي يقدر يضيف
create policy "Authenticated can insert products"
on public.laseul_products for insert
to authenticated
with check (true);

-- الأدمن بس اللي يقدر يعدّل
create policy "Authenticated can update products"
on public.laseul_products for update
to authenticated
using (true);

-- الأدمن بس اللي يقدر يمسح
create policy "Authenticated can delete products"
on public.laseul_products for delete
to authenticated
using (true);
