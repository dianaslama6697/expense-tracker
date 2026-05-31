import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DEFAULT_USER_ID = "default-user-001"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const where: Record<string, unknown> = { userId: DEFAULT_USER_ID }

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1)
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999)
      where.expenseDate = { gte: startDate, lte: endDate }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { expenseDate: "desc" },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Gagal mengambil pengeluaran" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      amount,
      categoryId,
      description,
      merchant,
      expenseDate,
      currency = "IDR",
    } = body

    if (!amount || !categoryId) {
      return NextResponse.json(
        { error: "Jumlah dan kategori wajib diisi" },
        { status: 400 }
      )
    }

    // validasi kategori milik user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: DEFAULT_USER_ID },
    })
    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        userId: DEFAULT_USER_ID,
        categoryId,
        amount,
        currency,
        merchant: merchant || null,
        description: description || null,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      },
      include: { category: true },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Gagal menambah pengeluaran" },
      { status: 500 }
    )
  }
}
