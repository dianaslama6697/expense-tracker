import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { reportError } from "@/lib/error-handler"

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const splitBill = await prisma.splitBill.findUnique({
      where: { shareCode: params.code },
      include: {
        persons: {
          include: {
            assignments: { include: { item: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        items: { orderBy: { createdAt: "asc" } },
        user: { select: { name: true } },
      },
    })

    if (!splitBill) {
      return NextResponse.json({ error: "Split bill tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(splitBill)
  } catch (error) {
    await reportError(error, { route: `/api/v1/split-bills/${params.code}`, method: "GET" })
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 })
  }
}
