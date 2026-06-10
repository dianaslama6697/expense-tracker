import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { categoryId, amount } = await req.json()

    if (!categoryId || amount === undefined) {
      return NextResponse.json(
        { error: "categoryId dan amount wajib diisi" },
        { status: 400 }
      )
    }

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const existing = await prisma.budget.findFirst({
      where: {
        userId,
        categoryId,
        period: "monthly",
        month,
        year,
      },
    })

    if (existing) {
      const updated = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.budget.create({
      data: {
        userId,
        categoryId,
        amount,
        period: "monthly",
        month,
        year,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Budget error:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan budget" },
      { status: 500 }
    )
  }
}
