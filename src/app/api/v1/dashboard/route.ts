import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

function toLocalDateStr(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const now = new Date()

    // Parse filter params
    const startParam = searchParams.get("start")
    const endParam = searchParams.get("end")
    const categoryId = searchParams.get("categoryId") || undefined

    const startDate = startParam
      ? new Date(startParam + "T00:00:00")
      : new Date(now.getFullYear(), now.getMonth(), 1)

    const endDate = endParam
      ? new Date(endParam + "T23:59:59.999")
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Previous period (same length)
    const rangeMs = endDate.getTime() - startDate.getTime()
    const prevStart = new Date(startDate.getTime() - rangeMs - 1)
    const prevEnd = new Date(startDate.getTime() - 1)

    // Build where clause
    const wherePeriod: Record<string, unknown> = {
      userId: userId,
      expenseDate: { gte: startDate, lte: endDate },
    }
    const wherePrev: Record<string, unknown> = {
      userId: userId,
      expenseDate: { gte: prevStart, lte: prevEnd },
    }

    if (categoryId) {
      wherePeriod.categoryId = categoryId
      wherePrev.categoryId = categoryId
    }

    const [currentExpenses, prevExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: wherePeriod,
        include: { category: true },
        orderBy: { expenseDate: "desc" },
      }),
      prisma.expense.findMany({
        where: wherePrev,
      }),
    ])

    const currentTotal = currentExpenses.reduce(
      (s, e) => s + Number(e.amount),
      0
    )
    const prevTotal = prevExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const changePercent =
      prevTotal > 0
        ? ((currentTotal - prevTotal) / prevTotal) * 100
        : currentTotal > 0
          ? 100
          : 0

    // Days in range
    const diffDays = Math.floor(rangeMs / (1000 * 60 * 60 * 24)) + 1
    const daysSoFar = Math.min(
      Math.floor(
        (Math.min(endDate.getTime(), now.getTime()) - startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1,
      diffDays
    )
    const averagePerDay = daysSoFar > 0 ? currentTotal / daysSoFar : 0

    // Per kategori
    const categoryMap = new Map<
      string,
      { name: string; color: string | null; total: number }
    >()
    for (const exp of currentExpenses) {
      const key = exp.categoryId
      const existing = categoryMap.get(key) || {
        name: exp.category.name,
        color: exp.category.color,
        total: 0,
      }
      existing.total += Number(exp.amount)
      categoryMap.set(key, existing)
    }

    const byCategory = Array.from(categoryMap.entries()).map(
      ([catId, data]) => ({
        categoryId: catId,
        name: data.name,
        color: data.color,
        total: data.total,
        percentage: currentTotal > 0 ? (data.total / currentTotal) * 100 : 0,
      })
    )
    byCategory.sort((a, b) => b.total - a.total)

    // Per hari
    const dailyMap = new Map<string, number>()
    for (const exp of currentExpenses) {
      const day = exp.expenseDate.toISOString().split("T")[0]
      dailyMap.set(day, (dailyMap.get(day) || 0) + Number(exp.amount))
    }

    const dailyTotals = Array.from({ length: diffDays }, (_, i) => {
      const date = new Date(startDate.getTime() + i * 86400000)
      const key = date.toISOString().split("T")[0]
      return {
        date: key,
        day: date.getDate(),
        total: dailyMap.get(key) || 0,
      }
    })

    let pocketsData: Record<string, unknown>[] = []
    if (!categoryId) {
      const pocketRows = await prisma.pocket.findMany({
        where: { userId },
        include: {
          categories: { include: { category: true } },
        },
        orderBy: { createdAt: "asc" },
      })

      if (pocketRows.length > 0) {
        pocketsData = pocketRows.map((p) => {
          const categoryIds = p.categories.map((pc) => pc.categoryId)
          const spent = currentExpenses
            .filter((e) => categoryIds.includes(e.categoryId))
            .reduce((s, e) => s + Number(e.amount), 0)
          return {
            id: p.id,
            name: p.name,
            emoji: p.emoji,
            color: p.color,
            budgetAmount: Number(p.amount),
            spent,
            remaining: Number(p.amount) - spent,
            percentage: Number(p.amount) > 0 ? (spent / Number(p.amount)) * 100 : 0,
            categories: p.categories.map((pc) => ({
              id: pc.category.id,
              name: pc.category.name,
              color: pc.category.color,
            })),
          }
        })
      }
    }

    // ---- Insights ----
    const insights: { type: string; icon: string; message: string }[] = []

    // 1. Perbandingan periode
    if (prevTotal > 0 && currentTotal > 0) {
      if (changePercent > 10) {
        insights.push({
          type: "warning",
          icon: "trending-up",
          message: `Pengeluaran naik ${Math.round(changePercent)}% dibanding periode sebelumnya`,
        })
      } else if (changePercent < -10) {
        insights.push({
          type: "success",
          icon: "trending-down",
          message: `Pengeluaran turun ${Math.round(Math.abs(changePercent))}% dibanding periode sebelumnya`,
        })
      }
    }

    // 2. Rata-rata vs salah satu hari
    if (currentTotal > 0 && daysSoFar > 0) {
      const todayStr = now.toISOString().split("T")[0]
      const todayTotal = dailyMap.get(todayStr) || 0
      if (todayTotal > 0) {
        const ratio = todayTotal / averagePerDay
        if (ratio > 1.5) {
          insights.push({
            type: "warning",
            icon: "alert-circle",
            message: `Hari ini pengeluaran ${Math.round(ratio * 100)}% lebih tinggi dari rata-rata harian (Rp${Math.round(averagePerDay).toLocaleString("id-ID")})`,
          })
        }
      }
    }

    // 3. Kategori paling dominan
    if (byCategory.length > 0 && currentTotal > 0) {
      const top = byCategory[0]
      if (top.percentage > 40) {
        insights.push({
          type: "info",
          icon: "pie-chart",
          message: `${top.name} mendominasi ${Math.round(top.percentage)}% dari total pengeluaran`,
        })
      }
    }

    // 4. Pocket alert
    for (const bp of pocketsData) {
      const p = bp as { name: string; percentage: number }
      if (p.percentage >= 80 && p.percentage < 100) {
        insights.push({
          type: "warning",
          icon: "wallet",
          message: `Pocket ${p.name} sudah terpakai ${Math.round(p.percentage)}%`,
        })
      } else if (p.percentage >= 100) {
        insights.push({
          type: "danger",
          icon: "alert-triangle",
          message: `Pocket ${p.name} sudah habis!`,
        })
      }
    }

    // 5. Merchant paling sering
    const merchantCount = new Map<string, number>()
    for (const e of currentExpenses) {
      if (e.merchant) {
        merchantCount.set(e.merchant, (merchantCount.get(e.merchant) || 0) + 1)
      }
    }
    const topMerchant = Array.from(merchantCount.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]
    if (topMerchant && topMerchant[1] >= 3) {
      insights.push({
        type: "info",
        icon: "shopping-bag",
        message: `${topMerchant[1]}x transaksi di ${topMerchant[0]} periode ini`,
      })
    }

    // 6. Tidak ada transaksi hari ini
    const todayStr = now.toISOString().split("T")[0]
    const hasToday = dailyMap.has(todayStr)
    if (!hasToday && currentTotal > 0) {
      insights.push({
        type: "info",
        icon: "bell",
        message: "Belum ada pengeluaran hari ini",
      })
    }

    return NextResponse.json({
      period: {
        start: toLocalDateStr(startDate),
        end: toLocalDateStr(endDate),
        days: diffDays,
      },
      currentPeriod: {
        total: currentTotal,
        count: currentExpenses.length,
        averagePerDay: Math.round(averagePerDay * 100) / 100,
        daysSoFar,
      },
      previousPeriod: {
        total: prevTotal,
        start: prevStart.toISOString().split("T")[0],
        end: prevEnd.toISOString().split("T")[0],
      },
      changePercent: Math.round(changePercent * 100) / 100,
      byCategory,
      dailyTotals,
      budgets: pocketsData,
      insights,
      recentExpenses: currentExpenses.slice(0, 5),
    })
  } catch (error) {
    console.error("Error fetching dashboard:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data dashboard" },
      { status: 500 }
    )
  }
}
