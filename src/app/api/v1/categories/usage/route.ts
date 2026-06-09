import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [categories, usageRaw] = await Promise.all([
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: { userId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ])

    const usageMap = new Map(
      usageRaw.map((u) => [u.categoryId, u._count.id])
    )

    const result = categories
      .map((cat) => ({
        ...cat,
        usageCount: usageMap.get(cat.id) || 0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching category usage:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data kategori" },
      { status: 500 }
    )
  }
}
