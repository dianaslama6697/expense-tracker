import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"
import { reportError } from "@/lib/error-handler"

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(categories)
  } catch (error) {
    await reportError(error, { route: "/api/v1/categories", method: "GET" })
    return NextResponse.json(
      { error: "Gagal mengambil kategori" },
      { status: 500 }
    )
  }
}
