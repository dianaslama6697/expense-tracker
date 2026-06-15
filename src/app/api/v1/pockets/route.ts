import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const pockets = await prisma.pocket.findMany({
      where: { userId },
      include: {
        categories: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const result = await Promise.all(
      pockets.map(async (p) => {
        const categoryIds = p.categories.map((pc) => pc.categoryId)
        const expenses = await prisma.expense.aggregate({
          where: {
            userId,
            categoryId: { in: categoryIds },
            expenseDate: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
          _sum: { amount: true },
        })
        const spent = Number(expenses._sum.amount || 0)
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
          createdAt: p.createdAt,
        }
      })
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching pockets:", error)
    return NextResponse.json(
      { error: "Gagal mengambil pocket" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, emoji, color, amount, categoryIds } = await req.json()

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: "Nama dan amount wajib diisi" },
        { status: 400 }
      )
    }

    const pocket = await prisma.pocket.create({
      data: {
        userId,
        name,
        emoji: emoji || null,
        color: color || null,
        amount,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        categories: {
          create: (categoryIds as string[] || []).map((categoryId: string) => ({
            categoryId,
          })),
        },
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    })

    return NextResponse.json(
      {
        id: pocket.id,
        name: pocket.name,
        emoji: pocket.emoji,
        color: pocket.color,
        budgetAmount: Number(pocket.amount),
        categories: pocket.categories.map((pc) => ({
          id: pc.category.id,
          name: pc.category.name,
          color: pc.category.color,
        })),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating pocket:", error)
    return NextResponse.json(
      { error: "Gagal membuat pocket" },
      { status: 500 }
    )
  }
}
