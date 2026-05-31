import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DEFAULT_USER_ID = "default-user-001"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: params.id, userId: DEFAULT_USER_ID },
    })
    if (!expense) {
      return NextResponse.json(
        { error: "Pengeluaran tidak ditemukan" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { amount, categoryId, description, merchant, expenseDate, currency } =
      body

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: DEFAULT_USER_ID },
      })
      if (!category) {
        return NextResponse.json(
          { error: "Kategori tidak ditemukan" },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...(amount !== undefined && { amount }),
        ...(categoryId !== undefined && { categoryId }),
        ...(currency !== undefined && { currency }),
        ...(merchant !== undefined && { merchant }),
        ...(description !== undefined && { description }),
        ...(expenseDate !== undefined && { expenseDate: new Date(expenseDate) }),
      },
      include: { category: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json(
      { error: "Gagal mengubah pengeluaran" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: params.id, userId: DEFAULT_USER_ID },
    })
    if (!expense) {
      return NextResponse.json(
        { error: "Pengeluaran tidak ditemukan" },
        { status: 404 }
      )
    }

    await prisma.expense.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Gagal menghapus pengeluaran" },
      { status: 500 }
    )
  }
}
