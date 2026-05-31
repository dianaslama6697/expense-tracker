import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DEFAULT_USER_ID = "default-user-001"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Gagal mengambil kategori" },
      { status: 500 }
    )
  }
}
