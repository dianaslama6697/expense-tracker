import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const pocket = await prisma.pocket.findFirst({
      where: { id: params.id, userId },
    })
    if (!pocket) {
      return NextResponse.json({ error: "Pocket tidak ditemukan" }, { status: 404 })
    }

    const { name, emoji, color, amount, categoryIds } = await req.json()

    const updated = await prisma.pocket.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(emoji !== undefined && { emoji }),
        ...(color !== undefined && { color }),
        ...(amount !== undefined && { amount }),
      },
    })

    if (categoryIds !== undefined) {
      await prisma.pocketCategory.deleteMany({
        where: { pocketId: params.id },
      })
      if (categoryIds.length > 0) {
        await prisma.pocketCategory.createMany({
          data: (categoryIds as string[]).map((categoryId: string) => ({
            pocketId: params.id,
            categoryId,
          })),
        })
      }
    }

    return NextResponse.json({ id: updated.id, name: updated.name })
  } catch (error) {
    console.error("Error updating pocket:", error)
    return NextResponse.json(
      { error: "Gagal mengupdate pocket" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const pocket = await prisma.pocket.findFirst({
      where: { id: params.id, userId },
    })
    if (!pocket) {
      return NextResponse.json({ error: "Pocket tidak ditemukan" }, { status: 404 })
    }

    await prisma.pocket.delete({ where: { id: params.id } })

    return NextResponse.json({ message: "Pocket dihapus" })
  } catch (error) {
    console.error("Error deleting pocket:", error)
    return NextResponse.json(
      { error: "Gagal menghapus pocket" },
      { status: 500 }
    )
  }
}
