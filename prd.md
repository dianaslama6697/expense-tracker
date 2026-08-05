# Product Requirements Document (PRD) - Expense Tracker

**Project Name**: ACIS Expense Tracker  
**Version**: 1.0  
**Status**: Draft  
**Date**: 2026-07-30  

---

## 1. Overview

ACIS Expense Tracker is a comprehensive personal finance management application designed to help individuals track expenses, manage budgets, split bills with friends, and automatically extract data from receipts using OCR technology. The app follows a mobile-first design pattern with responsive web capabilities, making it accessible from both mobile devices and desktop browsers.

### Problem Statement
Users often struggle to:
- Track daily spending accurately and consistently
- Understand spending patterns across categories
- Share meal/expenditure costs with friends in a transparent way
- Manually enter receipt data (time-consuming and error-prone)
- Set and monitor monthly budget limits

### Solution
ACIS provides an all-in-one solution with:
- **Instant expense tracking** through quick-add form with merchant auto-suggestion
- **Smart receipt scanning** using OCR AI to extract data from photos
- **Calendar view** for visualizing spending patterns and identifying missed dates
- **Budget pockets** for category-specific monthly caps
- **Split bill functionality** for shared expenses with friends
- **AI-driven insights** to identify spending trends and anomalies

---

## 2. Target Audience

| Segment | Description |
|---------|-------------|
| **Students** | Managing limited budgets, splitting costs with roommates/friends |
| **Young Professionals** | Tracking daily expenses, monitoring career-related spending |
| **Freelancers** | Managing variable income, categorizing business vs personal expenses |
| **Couples/Families** | Shared household expenses, budget coordination |
| **Social Groups** | Group dinners, trips, shared purchases requiring cost splitting |

---

## 3. Core Features

### 3.1 Authentication & User Management
- Email/password login (bcrypt hashed)
- Google OAuth sign-in
- Session management via NextAuth.js
- Default category seeding on first user creation (9 predefined categories)
- Profile persistence (name, email, avatar, currency preference)

### 3.2 Dashboard (Home Page)

#### 3.2.1 Key Metrics Display
- **Current Period Summary**: Total spent, count of transactions, average per day, days elapsed
- **Period Comparison**: Previous period comparison with percentage change (+/-)
- **Time Range Selector**: Preset options (this month, last month, last 3 months, this year, custom range)
- Category filter toggle

#### 3.2.2 Data Visualizations
- **Pie Chart**: Spending breakdown by category (percentage of total)
- **Bar Chart**: Daily expenditure trend over selected period

#### 3.2.3 Budget Pockets (Kantong)
- Monthly budget allocation per group of categories
- Real-time spending progress (% used)
- Alerts when pocket reaches 80% and 100% usage
- Visual indication of over-budget status

#### 3.2.4 Smart Insights (AI Recommendations)
System analyzes spending patterns and provides actionable insights:
- Spending increased/decreased >10% compared to previous period
- Today's spending significantly above daily average (>150%)
- Single category dominates spending (>40% of total)
- Pocket nearing or exceeding budget limit
- Merchant appears frequently (≥3 transactions in current period)
- No expenses recorded today

#### 3.2.5 Recent Expenses List
- Paginated list of most recent transactions
- Expandable view to show all entries
- Quick delete/edit capability (future enhancement)

### 3.3 Expense Management

#### 3.3.1 Quick Add (Fast Entry)
One-screen entry with the following fields:
- **Amount**: Auto-formatted with locale (IDR), numeric input only
- **Merchant**: Text field with auto-suggestion based on transaction history
- **Category**: Grid selection showing top-used categories; suggested category based on merchant
- **Date**: Auto-filled with current date (modifiable)

**Workflow**: Enter amount → Select merchant (optionally) → Tap category → Automatically saved

#### 3.3.2 Expense List View
- Full list of all expenses with date filters
- Month/year selector
- Category filter dropdown
- Sort options (date descending, amount descending)
- Delete individual expenses (with confirmation)

#### 3.3.3 Receipt-Based Expense Creation
- Camera/gallery picker for image upload
- OCR processing pipeline (see Section 3.4)
- Pre-filled form after scan completion (merchant, amount, date, items)
- Manual verification before saving

### 3.4 Receipt OCR Scanner

#### 3.4.1 Workflow
1. User taps "+" camera button (FAB) or scanner drawer
2. Select source: camera or gallery
3. Image uploaded and compressed (sharp library)
4. Image stored on Cloudinary (secure URL)
5. Vision API call (OpenAI-compatible endpoint) with prompt engineering:
   ```
   "Scan struk ini. EKSTRAK SETIAP BARIS ITEM SATU PER SATU. JANGAN GABUNGIN ITEM. JANGAN BUAT ITEM 'TOTAL'. SEMUA item harus tercantum di array items. Return ONLY valid JSON tanpa markdown, tanpa komentar: { \"type\": \"receipt\", \"merchant\": string, \"amount\": number, \"date\": \"YYYY-MM-DD\", \"items\": [{ \"name\": string, \"price\": number, \"quantity\": number }], \"description\": string }"
   ```
6. Response parsed and validated
7. Receipt record created in database with raw text and AI data
8. User reviews extracted data and confirms/save expense

#### 3.4.2 Technical Components
- **Image Compression**: sharp.js resize to 1200x1600, quality 80%
- **Storage**: Cloudinary for permanent image storage
- **OCR Engine**: Vision-capable model (GPT-5.3 / gpt-4o equivalent via OpenAI-compatible API)
- **Fallback**: tesseract.js mentioned in dependencies (may be alternative OCR path)

#### 3.4.3 UI States
- Idle: Ready to scan
- Uploading: Spinner with "Mengupload gambar..." message
- Processing: Sparkles animation + "Membaca struk dengan AI..."
- Done: Preview image + editable form fields + Save/Cancel buttons

### 3.5 Calendar View
A dedicated calendar page for visualizing expense patterns and identifying missed dates.

#### 3.5.1 Features
- Monthly view with navigation (prev/next month)
- Color-coded days: colored dots for days with expenses, empty dots for missed days
- Click any date to open Quick Add with that date pre-selected
- Month summary: total spending and transaction count
- Expense indicators: color dots showing category colors for each day

#### 3.5.2 API Endpoint
- `GET /api/v1/calendar?month={m}&year={y}` returns daily expense data for the month

#### 3.5.3 UI Layout
```
┌──────────────────────────────┐
│  ◀ Juli 2026 ▶               │  ← navigation
├─────────────────────────────┤
│  Total: Rp X | X transaksi   │  ← summary card
├─────────────────────────────┤
│  Min Sen Sel Rab Kam Jum Sab │
│   ·  ·  🟢  🟢  ·  🔴 🔴  │  ← days grid
│   🟢  🟢  🔴  ·  ·  🟢  🟢  │
└─────────────────────────────┘
```

### 3.6 Split Bills (Pecah Tagihan)

#### 3.5.1 Create Split Bill
- **Merchant**: Name of restaurant/store
- **Total Amount**: Grand total (including tax/service charge if any)
- **Tax**: Optional tax amount
- **Service Charge**: Optional service fee
- **Items**: List of ordered items with name, price, quantity
- **Persons**: List of people involved with names

#### 3.5.2 Itemized Assignment System
- Each person can select specific items they want to pay for
- Quantity-based assignment system
- Automatic calculation per-person share

#### 3.5.3 Share Code Generation
- Unique share code (e.g., `SB-ABC123`) generated for each split bill
- Shared URL pattern: `/split/{shareCode}`
- Friends can view their share without logging in (read-only)

#### 3.5.4 Data Model
```
SplitBill
├─ userId
├─ merchant
├─ totalAmount
├─ tax
├─ serviceCharge
├─ shareCode (unique)
├─ createdAt
├─ SplitBillItem [1..*]
│   ├─ id
│   ├─ splitBillId
│   ├─ name
│   ├─ price
│   ├─ quantity
├─ SplitBillPerson [1..*]
│   ├─ id
│   ├─ splitBillId
│   ├─ name
└─ SplitBillAssignment [0..*]
    ├─ personId
    ├─ itemId
    └─ quantity
```

### 3.6 Pockets (Bukana Anggaran/Money Pots)

#### 3.6.1 Concept
"Pocket" = A bucket of money allocated for a category or set of categories for the month.

#### 3.6.2 Pocket Creation
- **Name**: e.g., "Makan Malam", "Transportation", "Shopping"
- **Emoji**: Optional visual indicator (e.g., 🍔, 🚗, 🛍️)
- **Color**: Optional hex color for visualization
- **Monthly Budget**: Decimal amount
- **Associated Categories**: Multiple categories can belong to one pocket

#### 3.6.3 Tracking
- Real-time spending vs. budget
- Progress bar with percentage display
- Warning at 80%, critical at 100%+

#### 3.6.4 Use Case Example
Pocket "Makan Malam" (Rp 2,000,000/month) includes categories: Makanan & Minuman, Hiburan. Expenses tagged to these categories deduct from the pocket balance.

---

## 4. Technical Architecture

### 4.1 Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router, Server Components) |
| Runtime | Node.js (Vercel/standalone) |
| Styling | Tailwind CSS + shadcn/ui + class-variance-authority |
| State Management | React Context (Theme, Auth), useState/useEffect |
| Chart Library | Recharts |
| Animation | framer-motion |
| Toast/Snacks | Sonner |
| Auth | NextAuth.js v5 (beta) + Prisma Adapter |
| Database | PostgreSQL via Prisma ORM |
| Image Processing | sharp (compression), Cloudinary (storage) |
| OCR/API | OpenAI-compatible Vision API |
| Build Script | prisma generate && prisma db push && next build |

### 4.2 API Design Pattern
RESTful API endpoints under `/api/v1/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard` | Get aggregated dashboard data |
| GET | `/api/v1/calendar` | Get daily expenses for a specific month |
| GET | `/api/v1/expenses` | List expenses with date filters |
| POST | `/api/v1/expenses` | Create new expense |
| GET | `/api/v1/categories/usage` | Top used categories (for quick add) |
| GET | `/api/v1/merchants/suggest` | Suggest category by merchant name |
| GET | `/api/v1/categories` | All categories |
| GET | `/api/v1/pockets` | List user's pockets |
| POST | `/api/v1/pockets` | Create new pocket |
| GET | `/api/v1/pockets/:id` | Get single pocket |
| PUT | `/api/v1/pockets/:id` | Update pocket |
| DELETE | `/api/v1/pockets/:id` | Delete pocket |
| POST | `/api/v1/receipts/scan` | OCR scan receipt |
| POST | `/api/v1/receipts/upload` | Upload receipt image |
| GET | `/api/v1/split-bills` | List split bills |
| POST | `/api/v1/split-bills` | Create split bill |
| GET | `/api/v1/split-bills/:code` | Public view of split bill |

### 4.3 Database Schema (Prisma)

Key models (from schema.prisma):
- `User`: Authentication entity with profile info
- `Category`: Spending categories with colors/icons
- `Expense`: Individual expenditure entries
- `Receipt`: Scanned receipt metadata and OCR results
- `Budget`: Per-category monthly budget limits
- `Pocket`: Multi-category budget buckets
- `Tag`: Flexible tags for expenses
- `SplitBill`: Shared expense entries with persons/items/assignments

---

## 5. User Flow

### 5.1 Onboarding
1. User opens app → lands on Dashboard (requires auth)
2. If not authenticated: redirected to Login page
3. Login via Google or email/password
4. On first login: 9 default categories auto-created
5. Redirect to Dashboard

### 5.2 Quick Expense Entry
```
Dashboard → Quick Add (visible on home)
   ↓ Enter amount (e.g., 50000)
   ↓ Type merchant (optional, e.g., "Indomaret")
   ↓ System suggests category (based on merchant history)
   ↓ Tap category circle/button
   ↓ Expense saved, toast success, form resets
```

### 5.3 Receipt Scan Flow
```
Floating Camera Button → Choose source (camera/gallery)
   ↓ Upload
   ↓ Processing (AI extracting data)
   ↓ Review extracted data (merchant, amount, date, items list)
   ↓ Edit if needed → Save
   ↓ Expense created with source="ocr", receipt linked
```

### 5.4 Split Bill Sharing
```
Create Split Bill → Enter items & persons → Generate Share Code
   ↓ Share link/code with friends
   Friends visit /split/ABC123 → See bill details & their share
```

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Dashboard load time < 2 seconds on reasonable network
- OCR processing complete within 10-15 seconds
- Image compression should reduce file size by 70%+ while maintaining readability

### 6.2 Security
- Passwords hashed with bcrypt (cost factor appropriate)
- All API routes authenticate user session via NextAuth
- CSRF protection via Next.js built-in mechanisms
- Cloudinary signed URLs with timestamp validation
- Environment variables for sensitive credentials (API keys, DB URL)

### 6.3 Reliability
- Graceful degradation: if OCR fails, user can still manually create expense
- Error handling at API layer with descriptive messages
- Transactional integrity where needed (Prisma transactions not yet implemented but recommended for future)

### 6.4 Localization
- Primary language: Indonesian (ID)
- Currency: IDR (default), extensible to other currencies
- Date format: dd-MMM-yyyy
- Number formatting: Indonesian locale with thousands separator

### 6.5 Accessibility
- Color contrast sufficient for text/background
- Screen reader support for main components
- Keyboard navigation for forms

---

## 7. Future Enhancements (Phase 2+)

1. **Expense Editing** - Modify existing expenses
2. **Data Export** - CSV/PDF export of reports
3. **Recurring Expenses** - Set up automatic recurring entries (rent, subscription)
4. **Multi-user Accounts** - Family/shared wallet feature
5. **Mobile App** - Wrap as PWA or build native mobile app
6. **More Payment Methods** - Cash, card, e-wallet tracking
7. **Backup/Restore** - Cloud backup of user data
8. **Notifications** - Push notifications for budget alerts
9. **Integration** - Bank statement import (OCR PDF)
10. **Advanced Charts** - Seasonal analysis, forecasting

---

## 8. Dependencies Checklist

### Required Environment Variables
```
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_AUTH_URL=http://localhost:3000
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5.3
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_SECRET=...
```

### npm Packages (from package.json)
```json
@auth/prisma-adapter, @base-ui/react, @prisma/client, bcryptjs,
class-variance-authority, cloudinary, clsx, date-fns, framer-motion,
lucide-react, next, next-auth, prisma, react, recharts, shadcn, sharp,
sonner, tailwind-merge, tailwindcss-animate, tesseract.js, vaul
```

---

## 9. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| DAU/MAU Ratio | ≥ 20% | Auth user activity logs |
| Expense Entry Time | < 15 seconds (quick add) | UX testing |
| OCR Accuracy Rate | ≥ 85% (merchant, amount, date) | User feedback loop |
| Budget Adherence Improvement | % users setting budgets | Analytics |
| Feature Adoption Rate | Percentage using split bills | Event tracking |

---

## 10. Documentation References

- `DESIGN.md` - Design system documentation
- `AGENTS.md` - Agent integration guide
- Component files in `src/components/`
- API route files in `src/app/api/`
- Prisma schema: `prisma/schema.prisma`
- Seed data: `prisma/seed.ts`, `seed_user_data.sql`
