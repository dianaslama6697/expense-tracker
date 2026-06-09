import { writeFileSync, readFileSync } from "fs"

function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647
  return (seed - 1) / 2147483646
}

function seededInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min
}

function seededPick(arr) {
  return arr[seededInt(0, arr.length - 1)]
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

let seed = 42

const merchants = {
  "Makanan & Minuman": [
    { name: "Warung Padang Sederhana", weight: 15 },
    { name: "KFC", weight: 8 },
    { name: "McDonald's", weight: 6 },
    { name: "Indomie Rebus + Telur", weight: 12 },
    { name: "Bakso Pak Kumis", weight: 10 },
    { name: "Ayam Geprek Bu Rum", weight: 10 },
    { name: "Starbucks", weight: 5 },
    { name: "Kopi Kenangan", weight: 8 },
    { name: "Chatime", weight: 4 },
    { name: "Martabak Bang Ali", weight: 6 },
    { name: "Sate Padang Pak Karjo", weight: 7 },
    { name: "Nasi Goreng Mas Andre", weight: 9 },
    { name: "Dimsum Moms", weight: 5 },
    { name: "Mie Gacoan", weight: 8 },
    { name: "Pizza Hut", weight: 4 },
    { name: "GoFood", weight: 10 },
    { name: "GrabFood", weight: 8 },
  ],
  Transportasi: [
    { name: "SPBU Pertamina", weight: 20 },
    { name: "Gojek", weight: 15 },
    { name: "Grab", weight: 12 },
    { name: "Transjakarta", weight: 8 },
    { name: "MRT Jakarta", weight: 7 },
    { name: "KRL Commuter", weight: 10 },
    { name: "Tol JORR", weight: 5 },
    { name: "Parkir", weight: 8 },
    { name: "Blue Bird", weight: 5 },
    { name: "Shell", weight: 10 },
  ],
  Belanja: [
    { name: "Superindo", weight: 15 },
    { name: "Hypermart", weight: 10 },
    { name: "Tokopedia", weight: 20 },
    { name: "Shopee", weight: 18 },
    { name: "Lazada", weight: 8 },
    { name: "Uniqlo", weight: 6 },
    { name: "H&M", weight: 5 },
    { name: "IKEA", weight: 4 },
    { name: "Ace Hardware", weight: 4 },
    { name: "Miniso", weight: 5 },
    { name: "Mr DIY", weight: 5 },
  ],
  Hiburan: [
    { name: "Netflix", weight: 12 },
    { name: "Spotify", weight: 10 },
    { name: "CGV", weight: 15 },
    { name: "Disney+ Hotstar", weight: 8 },
    { name: "Steam", weight: 10 },
    { name: "PlayStation Store", weight: 6 },
    { name: "Game Center", weight: 8 },
    { name: "YouTube Premium", weight: 7 },
    { name: "IQIYI", weight: 4 },
    { name: "Viu", weight: 5 },
    { name: "GO Play", weight: 5 },
    { name: "Konser Musik", weight: 3 },
    { name: "Bowling", weight: 4 },
    { name: "Billiard", weight: 3 },
  ],
  Tagihan: [
    { name: "PLN", weight: 20 },
    { name: "PDAM", weight: 15 },
    { name: "IndiHome", weight: 18 },
    { name: "Telkomsel", weight: 16 },
    { name: "XL", weight: 10 },
    { name: "BPJS Kesehatan", weight: 12 },
    { name: "Cicilan Rumah", weight: 5 },
    { name: "Asuransi", weight: 4 },
  ],
  Kesehatan: [
    { name: "Apotek Kimia Farma", weight: 20 },
    { name: "Klinik Sehat", weight: 18 },
    { name: "Rs Hermina", weight: 12 },
    { name: "Apotek K24", weight: 15 },
    { name: "Guardian", weight: 10 },
    { name: "Century", weight: 8 },
    { name: "Fisioterapi", weight: 7 },
    { name: "Dokter Gigi", weight: 6 },
    { name: "Optik Melawai", weight: 4 },
  ],
  Pendidikan: [
    { name: "Coursera", weight: 15 },
    { name: "Udemy", weight: 20 },
    { name: "Ruangguru", weight: 18 },
    { name: "Buku Kompas Gramedia", weight: 15 },
    { name: "Dicoding", weight: 12 },
    { name: "Duolingo", weight: 8 },
    { name: "Skill Academy", weight: 7 },
    { name: "iCourse", weight: 5 },
  ],
  Lainnya: [
    { name: "Indomaret", weight: 20 },
    { name: "Alfamart", weight: 18 },
    { name: "Pulsa", weight: 12 },
    { name: "Donasi", weight: 8 },
    { name: "ATM", weight: 10 },
    { name: "Laundry", weight: 15 },
    { name: "Potong Rambut", weight: 7 },
    { name: "Parkir", weight: 10 },
  ],
}

function pickMerchant(catName) {
  const list = merchants[catName] || []
  if (list.length === 0) return null
  const expanded = list.map((m) => Array(m.weight).fill(m.name)).flat()
  return seededPick(expanded)
}

const catMap = {
  "Makanan & Minuman": "default-cat-makanan-minuman",
  Transportasi: "default-cat-transportasi",
  Belanja: "default-cat-belanja",
  Hiburan: "default-cat-hiburan",
  Tagihan: "default-cat-tagihan",
  Kesehatan: "default-cat-kesehatan",
  Pendidikan: "default-cat-pendidikan",
  Lainnya: "default-cat-lainnya",
}

const months = [
  { year: 2026, month: 3 },
  { year: 2026, month: 4 },
  { year: 2026, month: 5 },
]

let inserts = []

for (const { year, month } of months) {
  const days = daysInMonth(year, month)

  // Makanan
  let foodCount = 0
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    const isWeekend = dow === 0 || dow === 6
    foodCount += isWeekend ? seededInt(2, 4) : seededInt(1, 3)
  }
  for (let i = 0; i < foodCount; i++) {
    const day = seededInt(1, days)
    const amount = seededInt(15000, 120000)
    const merchant = pickMerchant("Makanan & Minuman")
    inserts.push(`(gen_random_uuid(),'default-user-001','${catMap["Makanan & Minuman"]}',${amount},'IDR','${merchant}',NULL,'2026-0${month}-${String(day).padStart(2, "0")}','manual',NOW())`)
  }

  // Transportasi
  const transportCount = seededInt(12, 16)
  for (let i = 0; i < transportCount; i++) {
    const day = seededInt(1, days)
    const amount = seededInt(10000, 80000)
    const merchant = pickMerchant("Transportasi")
    inserts.push(`(gen_random_uuid(),'default-user-001','${catMap.Transportasi}',${amount},'IDR','${merchant}',NULL,'2026-0${month}-${String(day).padStart(2, "0")}','manual',NOW())`)
  }

  // Belanja
  const shopCount = seededInt(3, 5)
  for (let i = 0; i < shopCount; i++) {
    const day = seededInt(1, days)
    const amount = seededInt(50000, 500000)
    const merchant = pickMerchant("Belanja")
    inserts.push(`(gen_random_uuid(),'default-user-001','${catMap.Belanja}',${amount},'IDR','${merchant}',NULL,'2026-0${month}-${String(day).padStart(2, "0")}','manual',NOW())`)
  }

  // Hiburan
  const entCount = seededInt(6, 10)
  for (let i = 0; i < entCount; i++) {
    let day
    if (seededRandom() < 0.7) {
      const weekendDays = []
      for (let d = 1; d <= days; d++) {
        const dow = new Date(year, month - 1, d).getDay()
        if (dow === 0 || dow === 6) weekendDays.push(d)
      }
      day = weekendDays.length > 0 ? seededPick(weekendDays) : seededInt(1, days)
    } else {
      day = seededInt(1, days)
    }
    const amount = seededInt(15000, 200000)
    const merchant = pickMerchant("Hiburan")
    inserts.push(`(gen_random_uuid(),'default-user-001','${catMap.Hiburan}',${amount},'IDR','${merchant}',NULL,'2026-0${month}-${String(day).padStart(2, "0")}','manual',NOW())`)
  }

  // Tagihan
  const bills = [
    { amount: 250000, merchant: "PLN", day: seededInt(1, 5) },
    { amount: 120000, merchant: "PDAM", day: seededInt(5, 10) },
    { amount: 300000, merchant: "IndiHome", day: seededInt(1, 3) },
    { amount: 100000, merchant: "Telkomsel", day: seededInt(10, 15) },
    { amount: 66000, merchant: "BPJS Kesehatan", day: seededInt(1, 10) },
  ]
  for (const bill of bills) {
    inserts.push(`(gen_random_uuid(),'default-user-001','${catMap.Tagihan}',${bill.amount},'IDR','${bill.merchant}',NULL,'2026-0${month}-${String(bill.day).padStart(2, "0")}','manual',NOW())`)
  }

  // Kesehatan
  if (month !== 4 || seededRandom() < 0.6) {
    const healthCount = seededInt(0, 2)
    for (let i = 0; i < healthCount; i++) {
      const day = seededInt(1, days)
      const amount = seededInt(30000, 250000)
      const merchant = pickMerchant("Kesehatan")
      inserts.push(`(gen_random_uuid(),'default-user-001','${catMap.Kesehatan}',${amount},'IDR','${merchant}',NULL,'2026-0${month}-${String(day).padStart(2, "0")}','manual',NOW())`)
    }
  }

  // Pendidikan
  if (seededRandom() < 0.4) {
    const day = seededInt(1, days)
    const amount = seededInt(100000, 500000)
    const merchant = pickMerchant("Pendidikan")
    inserts.push(`(gen_random_uuid(),'default-user-001','${catMap.Pendidikan}',${amount},'IDR','${merchant}',NULL,'2026-0${month}-${String(day).padStart(2, "0")}','manual',NOW())`)
  }

  // Lainnya
  const otherCount = seededInt(3, 6)
  for (let i = 0; i < otherCount; i++) {
    const day = seededInt(1, days)
    const amount = seededInt(10000, 80000)
    const merchant = pickMerchant("Lainnya")
    inserts.push(`(gen_random_uuid(),'default-user-001','${catMap.Lainnya}',${amount},'IDR','${merchant}',NULL,'2026-0${month}-${String(day).padStart(2, "0")}','manual',NOW())`)
  }
}

// Build SQL
let sql = `-- =============================================
-- Expense Tracker - Seed Data for Supabase
-- =============================================

BEGIN;

-- User
INSERT INTO users (id, name, email, created_at) VALUES
('default-user-001', 'Default User', 'default@expense-tracker.local', NOW())
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO categories (id, user_id, name, icon, color, is_default) VALUES
('default-cat-makanan-minuman', 'default-user-001', 'Makanan & Minuman', 'utensils-crossed', '#ef4444', true),
('default-cat-transportasi', 'default-user-001', 'Transportasi', 'car', '#f97316', true),
('default-cat-belanja', 'default-user-001', 'Belanja', 'shopping-bag', '#eab308', true),
('default-cat-hiburan', 'default-user-001', 'Hiburan', 'gamepad-2', '#22c55e', true),
('default-cat-tagihan', 'default-user-001', 'Tagihan', 'file-text', '#3b82f6', true),
('default-cat-kesehatan', 'default-user-001', 'Kesehatan', 'heart-pulse', '#ec4899', true),
('default-cat-pendidikan', 'default-user-001', 'Pendidikan', 'book-open', '#8b5cf6', true),
('default-cat-lainnya', 'default-user-001', 'Lainnya', 'more-horizontal', '#6b7280', true)
ON CONFLICT (id) DO NOTHING;

-- Budgets
INSERT INTO budgets (id, user_id, category_id, amount, period, month, year) VALUES
(gen_random_uuid(), 'default-user-001', 'default-cat-makanan-minuman', 1500000, 'monthly', 5, 2026),
(gen_random_uuid(), 'default-user-001', 'default-cat-transportasi', 500000, 'monthly', 5, 2026),
(gen_random_uuid(), 'default-user-001', 'default-cat-belanja', 1000000, 'monthly', 5, 2026),
(gen_random_uuid(), 'default-user-001', 'default-cat-hiburan', 500000, 'monthly', 5, 2026),
(gen_random_uuid(), 'default-user-001', 'default-cat-tagihan', 1000000, 'monthly', 5, 2026),
(gen_random_uuid(), 'default-user-001', 'default-cat-kesehatan', 300000, 'monthly', 5, 2026),
(gen_random_uuid(), 'default-user-001', 'default-cat-pendidikan', 500000, 'monthly', 5, 2026),
(gen_random_uuid(), 'default-user-001', 'default-cat-lainnya', 300000, 'monthly', 5, 2026);

-- Expenses
`

const batchSize = 50
for (let i = 0; i < inserts.length; i += batchSize) {
  const batch = inserts.slice(i, i + batchSize)
  sql += `INSERT INTO expenses (id, user_id, category_id, amount, currency, merchant, description, expense_date, source, created_at) VALUES\n${batch.join(",\n")};\n`
}

sql += "\nCOMMIT;\n"

writeFileSync("seed_supabase.sql", sql)
console.log(`✅ Generated ${inserts.length} expense rows in seed_supabase.sql`)
