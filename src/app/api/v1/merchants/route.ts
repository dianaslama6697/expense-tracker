import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DEFAULT_USER_ID = "default-user-001"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""

    if (!q || q.length < 1) {
      return NextResponse.json([])
    }

    const expenses = await prisma.expense.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        merchant: { not: null, contains: q, mode: "insensitive" },
      },
      select: { merchant: true },
      orderBy: { expenseDate: "desc" },
      take: 20,
    })

    // hitung frekuensi tiap merchant, urutkan dari paling sering
    const freq = new Map<string, number>()
    for (const e of expenses) {
      const m = e.merchant!
      freq.set(m, (freq.get(m) || 0) + 1)
    }

    const result = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([merchant]) => merchant)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching merchants:", error)
    return NextResponse.json(
      { error: "Gagal mengambil merchant" },
      { status: 500 }
    )
  }
}
