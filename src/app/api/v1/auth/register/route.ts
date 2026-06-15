import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
      },
    })

    // Buat default categories untuk user baru
    const defaultCategories = [
      { name: "Makanan & Minuman", icon: "utensils-crossed", color: "#ef4444" },
      { name: "Transportasi", icon: "car", color: "#f97316" },
      { name: "Belanja", icon: "shopping-bag", color: "#eab308" },
      { name: "Hiburan", icon: "gamepad-2", color: "#22c55e" },
      { name: "Tagihan", icon: "file-text", color: "#3b82f6" },
      { name: "Kesehatan", icon: "heart-pulse", color: "#ec4899" },
      { name: "Pendidikan", icon: "book-open", color: "#8b5cf6" },
      { name: "Olahraga", icon: "dumbbell", color: "#a855f7" },
      { name: "Lainnya", icon: "more-horizontal", color: "#6b7280" },
    ]

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        userId: user.id,
        ...cat,
        isDefault: true,
      })),
    })

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Gagal mendaftar" },
      { status: 500 }
    )
  }
}
