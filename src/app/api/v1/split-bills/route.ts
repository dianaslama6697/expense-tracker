import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"
import crypto from "node:crypto"

function generateShareCode(): string {
  return "SB-" + crypto.randomUUID().slice(0, 8).toUpperCase()
}

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const splitBills = await prisma.splitBill.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true, persons: true } },
      },
    })

    return NextResponse.json(splitBills)
  } catch (error) {
    console.error("Fetch split bills error:", error)
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { merchant, totalAmount, tax, serviceCharge, items, persons } = body

    if (!merchant || !totalAmount || !items?.length || !persons?.length) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const shareCode = generateShareCode()

    const splitBill = await prisma.splitBill.create({
      data: {
        userId,
        merchant,
        totalAmount,
        tax: tax || 0,
        serviceCharge: serviceCharge || 0,
        shareCode,
        items: {
          create: items.map((i: { name: string; price: number; quantity?: number }) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity || 1,
          })),
        },
      },
      include: { items: { orderBy: { createdAt: "asc" } } },
    })

    // Create persons with assignments by item index + quantity
    for (const p of persons) {
      const person = await prisma.splitBillPerson.create({
        data: {
          splitBillId: splitBill.id,
          name: p.name,
        },
      })

      if (p.itemQtys) {
        for (const [idxStr, qty] of Object.entries(p.itemQtys)) {
          const idx = Number(idxStr)
          const item = splitBill.items[idx]
          if (item && Number(qty) > 0) {
            await prisma.splitBillAssignment.create({
              data: { personId: person.id, itemId: item.id, quantity: Number(qty) },
            })
          }
        }
      }
    }

    const result = await prisma.splitBill.findUnique({
      where: { id: splitBill.id },
      include: {
        persons: {
          include: {
            assignments: { include: { item: true } },
          },
        },
        items: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Create split bill error:", error)
    return NextResponse.json({ error: "Gagal membuat split bill" }, { status: 500 })
  }
}
