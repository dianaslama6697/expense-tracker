# Expense Tracker + OCR Receipt AI

## Stack
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS + shadcn/ui + Meta design system
- Database: PostgreSQL + Prisma ORM
- Auth: NextAuth.js v5 (Google OAuth)
- Storage: Cloudinary (receipt images)
- AI/OCR: OpenAI GPT-4o Vision
- Deploy: Vercel + Supabase (Session Pooler)
- Animations: Framer Motion
- Charts: Recharts
- Mobile: Vaul (bottom drawer)

## Conventions
- Bahasa: Indonesia untuk komentar, English untuk kode
- Komponen: snake_case untuk file, PascalCase untuk nama komponen
- API routes: /api/v1/[resource]
- Selalu gunakan TypeScript strict mode
- Error handling wajib di setiap API route
- Jangan gunakan `any` type

## Project structure
src/app/          → App Router pages
src/components/   → Reusable UI components  
src/lib/          → Utilities, db client, helpers
src/types/        → TypeScript type definitions
prisma/           → Schema dan migrations
scripts/          → Utility scripts (gen-sql-seed.mjs)

## Environment
- **Local:** PostgreSQL di localhost:5432/expense_tracker
- **Production:** Supabase Session Pooler (Vercel env vars)
- Database URL format: `postgresql://postgres.<project-ref>:<password>@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require`
- Auth bypass: `DEFAULT_USER_ID = "default-user-001"` (sementara, middleware kosong)

## Key Features
- **Dashboard** (`/`): summary cards, PieChart by category, BarChart daily trend, budget tracking (green/amber/red), 5 recent expenses, filter presets (Bulan Ini, Bulan Lalu, 3 Bulan, Tahun Ini, Kustom), month navigation, category filter, period comparison, 6 rule-based spending insights
- **Expense CRUD**: daftar expense grup per bulan (limit 10, load more 10), Vaul drawer form (tambah/edit), QuickAdd bar (amount → suggested categories → save), merchant autocomplete + smart category suggestion
- **QuickAdd**: input nominal → Enter → pilih kategori (sorted by usage frequency) → langsung simpan
- **Merchant autocomplete**: GET /api/v1/merchants?q=xxx — dropdown keyboard navigable, debounce 150ms
- **Smart category suggestion**: GET /api/v1/merchants/suggest?merchant=xxx
- **Copy expense**: duplicate with today's date
- **Sonner toast** on all CRUD actions
- **Framer Motion**: FadeIn, StaggerList, StaggerItem wrappers
- **Responsive mobile**: header compact, filter stacked, PieChart radius adjusted, Vaul drawer swipeable, toaster top-center
- **Meta design**: black pill primary buttons, cobalt blue secondary, cards rounded-2xl, pill buttons, body bg-[#f1f4f7]

## Data
- 3 months seed data (Mar–May 2026): ~307 transaksi, 8 kategori, 8 budgets
- Merchan realistis Indonesia: Warung Padang, KFC, Mie Gacoan, KRL, SPBU, PLN, Tokopedia, Netflix, dll
- Seed SQL file: `seed_supabase.sql` (untuk di-run via Supabase SQL Editor)

## Current status
[x] Project initialization
[x] Authentication (NextAuth v5 + PrismaAdapter + camelCase wrapper)
[x] Expense CRUD (list, add, edit, delete, copy)
[x] Dashboard & analytics (charts, insights, budgets, filters)
[x] QuickAdd bar with merchant autocomplete + smart category
[x] Meta design system (pill buttons, rounded-2xl, colors)
[x] Responsive mobile (header, filters, charts, Vaul drawer)
[x] Framer Motion animations
[x] Seed data (3 months realistic expenses)
[x] Deploy to Vercel + Supabase
[x] OCR integration (receipt scanning)
[ ] Recurring expenses
[ ] Inline budget edit (click budget on dashboard)
[ ] CSV import/export
[ ] Monthly report page (/report)
[x] Auth integration (enable middleware, remove DEFAULT_USER_ID)
    - middleware.ts menggunakan auth() dari NextAuth v5
    - 10 API routes pake getUserId() dari session
    - API routes return 401 JSON, page routes redirect ke /login
[x] next.config.mjs — Cloudinary remotePatterns, bodySizeLimit 10mb
[x] .env.example akurat untuk production (tanpa NEXTAUTH_URL)
[ ] Deploy checklist: set 7 env vars di Vercel, run seed_supabase.sql di Supabase SQL Editor

## Deployment Notes
- Build: `prisma generate && next build` (otomatis di Vercel)
- Prisma generate juga di `postinstall` untuk Vercel
- `DATABASE_URL` harus diset di Vercel Environment Variables
- Auth middleware disabled (matcher: []) — masih pake default user
