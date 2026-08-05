import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"
import { reportError } from "@/lib/error-handler"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns"
import { id as localeId } from "date-fns/locale"

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

    const monthStart = startOfMonth(new Date(year, month - 1, 1))
    const monthEnd = endOfMonth(monthStart)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        expenseDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
      orderBy: { expenseDate: "asc" },
    })

    // Group expenses by date
    const expensesByDate = new Map<string, typeof expenses>()
    for (const exp of expenses) {
      const dayKey = format(exp.expenseDate, "yyyy-MM-dd", { locale: localeId })
      const existing = expensesByDate.get(dayKey) || []
      existing.push(exp)
      expensesByDate.set(dayKey, existing)
    }

    const monthLabel = format(monthStart, "MMMM yyyy", { locale: localeId })

    // Total for the month
    const totalMonth = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    const days = daysInMonth.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd", { locale: localeId })
      const dayExpenses = expensesByDate.get(dayKey) || []
      const dayTotal = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const hasExpense = dayExpenses.length > 0
      const isCurrentMonth = isSameMonth(day, monthStart)
      const isTodayDate = isToday(day)

      return {
        date: dayKey,
        day: format(day, "d", { locale: localeId }),
        hasExpense,
        dayTotal,
        expenses: dayExpenses.map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          merchant: e.merchant,
          category: e.category,
        })),
        isCurrentMonth,
        isToday: isTodayDate,
      }
    })

    return NextResponse.json({
      month: monthLabel,
      monthShort: format(monthStart, "MMM yyyy", { locale: localeId }),
      year,
      monthNumber: month,
      days,
      totalMonth,
      expenseCount: expenses.length,
    })
  } catch (error) {
    await reportError(error, { route: "/api/v1/calendar", method: "GET" })
    return NextResponse.json({ error: "Gagal mengambil data kalender" }, { status: 500 })
  }
}
