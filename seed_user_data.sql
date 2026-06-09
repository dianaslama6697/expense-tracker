-- ============================================================
-- Seed data dari default-user-001 ke user ID kamu
-- 
-- CARA PAKAI:
-- 1. Buka Supabase Dashboard → Table Editor → tabel "users"
-- 2. Cari baris dengan email kamu (yang pake Google login)
-- 3. Copy UUID dari kolom "id"
-- 4. Replace 'YOUR_USER_ID' di bawah dengan UUID tersebut
-- 5. Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- GANTI INI dengan UUID kamu dari tabel users
DO $$
DECLARE
  target_user_id TEXT := '5c8897b9-e25c-4c0e-924c-beec7e0a4a16';
  seed_user_id TEXT := 'default-user-001';
  cat_map JSONB := '{}';
  new_id TEXT;
  cat_record RECORD;
  exp_record RECORD;
  budget_record RECORD;
BEGIN

  -- 1. Copy categories
  FOR cat_record IN
    SELECT * FROM categories WHERE user_id = seed_user_id
  LOOP
    new_id := gen_random_uuid()::text;
    INSERT INTO categories (id, user_id, name, icon, color, is_default, budget_limit)
    VALUES (new_id, target_user_id, cat_record.name, cat_record.icon, cat_record.color, cat_record.is_default, cat_record.budget_limit);
    cat_map := cat_map || jsonb_build_object(cat_record.id::text, new_id::text);
  END LOOP;

  -- 2. Copy budgets
  FOR budget_record IN
    SELECT * FROM budgets WHERE user_id = seed_user_id
  LOOP
    INSERT INTO budgets (id, user_id, category_id, amount, period, month, year, alert_at)
    VALUES (
      gen_random_uuid()::text,
      target_user_id,
      cat_map ->> budget_record.category_id::text,
      budget_record.amount,
      budget_record.period,
      budget_record.month,
      budget_record.year,
      budget_record.alert_at
    );
  END LOOP;

  -- 3. Copy expenses
  FOR exp_record IN
    SELECT * FROM expenses WHERE user_id = seed_user_id
  LOOP
    INSERT INTO expenses (id, user_id, category_id, amount, currency, merchant, description, expense_date, source, created_at)
    VALUES (
      gen_random_uuid()::text,
      target_user_id,
      cat_map ->> exp_record.category_id::text,
      exp_record.amount,
      exp_record.currency,
      exp_record.merchant,
      exp_record.description,
      exp_record.expense_date,
      exp_record.source,
      exp_record.created_at
    );
  END LOOP;

  RAISE NOTICE 'Selesai! Kategori: %, Budget: %, Pengeluaran: %',
    (SELECT count(*) FROM categories WHERE user_id = target_user_id),
    (SELECT count(*) FROM budgets WHERE user_id = target_user_id),
    (SELECT count(*) FROM expenses WHERE user_id = target_user_id);
END $$;
