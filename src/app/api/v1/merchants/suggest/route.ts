import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DEFAULT_USER_ID = "default-user-001"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const merchant = searchParams.get("merchant") || ""

    if (!merchant) {
      return NextResponse.json(null)
    }

    // cari expense dengan merchant yang sama, ambil kategori terbanyak
    const result = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        userId: DEFAULT_USER_ID,
        merchant: { equals: merchant, mode: "insensitive" },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    })

    if (result.length === 0) {
      return NextResponse.json(null)
    }

    const category = await prisma.category.findUnique({
      where: { id: result[0].categoryId },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error suggesting category:", error)
    return NextResponse.json(
      { error: "Gagal menyarankan kategori" },
      { status: 500 }
    )
  }
}
