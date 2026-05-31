# Expense Tracker + OCR Receipt AI

## Stack
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS + shadcn/ui
- Database: PostgreSQL + Prisma ORM
- Auth: NextAuth.js (Google OAuth)
- Storage: Cloudinary (receipt images)
- AI/OCR: OpenAI GPT-4o Vision
- Deploy: Vercel + Supabase

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

## Current status
[x] Project initialization
[x] Authentication
[ ] Expense CRUD
[ ] OCR integration
[ ] Dashboard & analytics