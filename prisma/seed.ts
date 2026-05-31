import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEFAULT_USER_ID = "default-user-001"
const DEFAULT_USER_EMAIL = "default@expense-tracker.local"

const defaultCategories = [
  { name: "Makanan & Minuman", icon: "utensils-crossed", color: "#ef4444" },
  { name: "Transportasi", icon: "car", color: "#f97316" },
  { name: "Belanja", icon: "shopping-bag", color: "#eab308" },
  { name: "Hiburan", icon: "gamepad-2", color: "#22c55e" },
  { name: "Tagihan", icon: "file-text", color: "#3b82f6" },
  { name: "Kesehatan", icon: "heart-pulse", color: "#ec4899" },
  { name: "Pendidikan", icon: "book-open", color: "#8b5cf6" },
  { name: "Lainnya", icon: "more-horizontal", color: "#6b7280" },
]

function catId(name: string) {
  return `default-cat-${name.toLowerCase().replace(/[\s&]+/g, "-")}`
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

const merchants: Record<string, { name: string; weight: number }[]> = {
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

type CategoryInfo = { id: string; name: string; color: string }

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: {
      id: DEFAULT_USER_ID,
      email: DEFAULT_USER_EMAIL,
      name: "Default User",
    },
  })

  const categories: CategoryInfo[] = []
  for (const cat of defaultCategories) {
    const c = await prisma.category.upsert({
      where: { id: catId(cat.name) },
      update: {},
      create: {
        id: catId(cat.name),
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      },
    })
    categories.push(c)
  }

  // Hapus expenses dan budgets lama
  await prisma.expense.deleteMany({ where: { userId: user.id } })
  await prisma.budget.deleteMany({ where: { userId: user.id } })
  // Hapus kategori Gaji jika masih ada dari seed sebelumnya
  await prisma.category.deleteMany({ where: { id: "default-cat-gaji" } })

  const catMap = new Map(categories.map((c) => [c.name, c]))

  // ── Helper: generate expenses per category ──
  async function generateExpenses(
    catName: string,
    year: number,
    month: number,
    count: number,
    minAmount: number,
    maxAmount: number,
    preferWeekends = false,
  ) {
    const cat = catMap.get(catName)!
    const days = daysInMonth(year, month)
    const merchantList = merchants[catName] || []

    for (let i = 0; i < count; i++) {
      let day: number
      if (preferWeekends) {
        // 70% weekend, 30% weekday
        if (Math.random() < 0.7) {
          const weekendDays: number[] = []
          for (let d = 1; d <= days; d++) {
            const dow = new Date(year, month - 1, d).getDay()
            if (dow === 0 || dow === 6) weekendDays.push(d)
          }
          day = pick(weekendDays) || randomInt(1, days)
        } else {
          day = randomInt(1, days)
        }
      } else {
        day = randomInt(1, days)
      }

      const amount = randomInt(minAmount, maxAmount)
      const merchant = merchantList.length > 0
        ? pick(merchantList.map((m) => Array(m.weight).fill(m.name)).flat())
        : undefined

      await prisma.expense.create({
        data: {
          userId: user.id,
          categoryId: cat.id,
          amount,
          merchant,
          expenseDate: new Date(formatDate(year, month, day)),
        },
      })
    }
  }

  // ── Generate data untuk Mar, Apr, May 2026 ──
  const months = [
    { year: 2026, month: 3 },
    { year: 2026, month: 4 },
    { year: 2026, month: 5 },
  ]

  for (const { year, month } of months) {
    // Makanan — 2x sehari pada weekday, 3x pada weekend
    const days = daysInMonth(year, month)
    let foodCount = 0
    for (let d = 1; d <= days; d++) {
      const dow = new Date(year, month - 1, d).getDay()
      const isWeekend = dow === 0 || dow === 6
      foodCount += isWeekend ? randomInt(2, 4) : randomInt(1, 3)
    }
    await generateExpenses("Makanan & Minuman", year, month, foodCount, 15000, 120000)

    // Transportasi — 3-4x per minggu
    const transportCount = randomInt(12, 16)
    await generateExpenses("Transportasi", year, month, transportCount, 10000, 80000)

    // Belanja — 3-5x per bulan
    const shopCount = randomInt(3, 5)
    await generateExpenses("Belanja", year, month, shopCount, 50000, 500000)

    // Hiburan — 1-2x per minggu
    const entCount = randomInt(6, 10)
    await generateExpenses("Hiburan", year, month, entCount, 15000, 200000, true)

    // Tagihan — fixed tagihan bulanan
    const billCat = catMap.get("Tagihan")!
    const bills = [
      { amount: 250000, merchant: "PLN", day: randomInt(1, 5) },
      { amount: 120000, merchant: "PDAM", day: randomInt(5, 10) },
      { amount: 300000, merchant: "IndiHome", day: randomInt(1, 3) },
      { amount: 100000, merchant: "Telkomsel", day: randomInt(10, 15) },
      { amount: 66000, merchant: "BPJS Kesehatan", day: randomInt(1, 10) },
    ]
    for (const bill of bills) {
      await prisma.expense.create({
        data: {
          userId: user.id,
          categoryId: billCat.id,
          amount: bill.amount,
          merchant: bill.merchant,
          expenseDate: new Date(formatDate(year, month, bill.day)),
        },
      })
    }

    // Kesehatan — 1x per bulan atau skip
    if (month !== 4 || Math.random() < 0.6) {
      await generateExpenses("Kesehatan", year, month, randomInt(0, 2), 30000, 250000)
    }

    // Pendidikan — 0-1x per bulan
    if (Math.random() < 0.4) {
      await generateExpenses("Pendidikan", year, month, 1, 100000, 500000)
    }

    // Lainnya — 3-5x per bulan
    await generateExpenses("Lainnya", year, month, randomInt(3, 6), 10000, 80000)
  }

  // ── Buat budget ──
  const budgets = [
    { catName: "Makanan & Minuman", amount: 1500000 },
    { catName: "Transportasi", amount: 500000 },
    { catName: "Belanja", amount: 1000000 },
    { catName: "Hiburan", amount: 500000 },
    { catName: "Tagihan", amount: 1000000 },
    { catName: "Kesehatan", amount: 300000 },
    { catName: "Pendidikan", amount: 500000 },
    { catName: "Lainnya", amount: 300000 },
  ]

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  for (const { catName, amount } of budgets) {
    const cat = catMap.get(catName)!
    await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: cat.id,
        amount,
        period: "monthly",
        month: currentMonth,
        year: currentYear,
      },
    })
  }

  console.log("✅ Seed selesai — 3 bulan data + budget berhasil ditambahkan")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
