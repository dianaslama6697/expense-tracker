import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

const API_KEY = process.env.OPENAI_API_KEY
const BASE_URL =
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
const MODEL = process.env.OPENAI_MODEL || "gpt-4o"

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { receiptId, imageUrl } = await req.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL diperlukan" },
        { status: 400 }
      )
    }

    // Download image server-side biar vision API gak perlu fetch URL
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      throw new Error(`Gagal download image: ${imageRes.status}`)
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer())

    // Deteksi mime type dari magic bytes, bukan dari header
    const magic = imageBuffer.toString("hex", 0, 4).toUpperCase()
    let mimeType = "image/jpeg"
    if (magic.startsWith("89504E47")) mimeType = "image/png"
    else if (magic.startsWith("52494646") && imageBuffer.toString("ascii", 8, 12) === "WEBP")
      mimeType = "image/webp"
    else if (magic.startsWith("474946")) mimeType = "image/gif"
    else if (magic.startsWith("FFD8")) mimeType = "image/jpeg"

    const base64Image = imageBuffer.toString("base64")

    console.log("[PROCESS] Image:", (imageBuffer.length / 1024).toFixed(1), "KB, MIME:", mimeType, "Magic:", magic)

    const visionRes = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract information from this Indonesian receipt/struk. Return ONLY valid JSON: { merchant, amount, date, items: [{name, price, quantity}] }",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.05,
      }),
    })

    if (!visionRes.ok) {
      const errText = await visionRes.text()
      throw new Error(`Vision API ${visionRes.status}: ${errText}`)
    }

    const visionData = await visionRes.json()
    const rawText = visionData.choices?.[0]?.message?.content || ""

    console.log("[PROCESS] Raw response from API:", rawText.slice(0, 500))

    // Parse JSON dari response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    let parsed: Record<string, unknown> = {}
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        // fallback
      }
    }

    const aiData = parsed as object

    const merchant = String(parsed.merchant || "")
    const rawAmount = parsed.amount
    // Handle kalo AI balikin string kayak "43,500"
    const amount =
      typeof rawAmount === "number"
        ? rawAmount
        : Number(String(rawAmount).replace(/[^0-9.-]/g, "")) || 0

    const parsedDate = String(parsed.date || "")
    const categoryName = String(parsed.category || "")
    const description = String(parsed.description || "")
    const items = Array.isArray(parsed.items) ? parsed.items : []

    // Cari kategori yang cocok
    let categoryId: string | null = null
    if (categoryName) {
      const category = await prisma.category.findFirst({
        where: { userId, name: categoryName },
      })
      if (category) categoryId = category.id
    }

    // Update receipt status
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: "done",
        rawText,
        aiData,
        processedAt: new Date(),
      },
    })

    return NextResponse.json({
      merchant,
      amount,
      date: parsedDate || new Date().toISOString().split("T")[0],
      categoryId,
      categoryName,
      description,
      items,
    })
  } catch (error) {
    console.error("Process error:", error)

    try {
      const { receiptId } = await req.clone().json()
      if (receiptId) {
        await prisma.receipt.update({
          where: { id: receiptId },
          data: { status: "failed" },
        })
      }
    } catch {
      // silent
    }

    return NextResponse.json(
      { error: "Gagal memproses struk" },
      { status: 500 }
    )
  }
}
