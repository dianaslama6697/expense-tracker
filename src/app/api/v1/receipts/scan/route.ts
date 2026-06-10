import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

const API_KEY = process.env.OPENAI_API_KEY
const BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
const MODEL = process.env.OPENAI_MODEL || "gpt-4o"

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET

async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000)
  const params = { timestamp }
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${(params as any)[k]}`)
    .join("&")
  const signature = crypto
    .createHash("sha256")
    .update(toSign + CLOUD_SECRET)
    .digest("hex")

  const formData = new FormData()
  formData.append("file", new Blob([new Uint8Array(buffer)]), "receipt.jpg")
  formData.append("api_key", CLOUD_KEY!)
  formData.append("timestamp", String(timestamp))
  formData.append("signature", signature)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  )
  if (!res.ok) throw new Error(`Cloudinary error: ${res.status}`)
  const data = await res.json()
  return data.secure_url
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Kompres gambar sekecil mungkin
    const compressed = await sharp(buffer)
      .resize(480, 640, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 50 })
      .toBuffer()

    // Convert ke base64
    const base64 = compressed.toString("base64")
    const mimeType = "image/jpeg"
    const dataUri = `data:${mimeType};base64,${base64}`

    console.log(
      "[SCAN] Original:",
      (buffer.length / 1024).toFixed(1),
      "KB → Compressed:",
      (compressed.length / 1024).toFixed(1),
      "KB → Base64:",
      (base64.length / 1024).toFixed(1),
      "KB"
    )

    // Upload ke Cloudinary untuk penyimpanan
    const cloudinaryUrl = await uploadToCloudinary(compressed)

    // Kirim ke adaCODE pakai gpt-4o (vision-capable)
    console.log("[SCAN] Calling vision API with model:", MODEL)
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
                text: 'Extract dari gambar ini. Bisa struk toko ATAU bukti transfer. Return ONLY valid JSON tanpa markdown: { type: "receipt"|"transfer", merchant, amount, date (YYYY-MM-DD), items?: [{name, price, quantity}], bankFrom?: string, bankTo?: string, description?: string }',
              },
              {
                type: "image_url",
                image_url: { url: dataUri },
              },
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0.05,
      }),
    })

    if (!visionRes.ok) {
      const errText = await visionRes.text()
      console.error("[SCAN] API error:", visionRes.status, errText.slice(0, 500))
      return NextResponse.json(
        { error: "API vision error" },
        { status: 502 }
      )
    }

    const visionData = await visionRes.json()

    const rawText = visionData.choices?.[0]?.message?.content || ""
    console.log("[SCAN] Tokens:", JSON.stringify(visionData.usage || {}))
    console.log("[SCAN] Response:", rawText.slice(0, 400))

    // Parse JSON dari response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    let parsed: Record<string, unknown> = {}
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {}
    }

    const merchant = String(parsed.merchant || "")
    const rawAmount = parsed.amount
    const amount =
      typeof rawAmount === "number"
        ? rawAmount
        : Number(String(rawAmount).replace(/[^0-9.-]/g, "")) || 0

    const parsedDate = String(parsed.date || "")
    const items = Array.isArray(parsed.items) ? parsed.items : []
    const documentType = String(parsed.type || "receipt")
    const description = String(parsed.description || "")
    const bankFrom = String(parsed.bankFrom || "")
    const bankTo = String(parsed.bankTo || "")

    // Simpan receipt
    const receipt = await prisma.receipt.create({
      data: {
        userId,
        imageUrl: cloudinaryUrl,
        imageKey: cloudinaryUrl.split("/").slice(-1)[0],
        status: "done",
        rawText,
        aiData: parsed as object,
        processedAt: new Date(),
      },
    })

    const finalDescription =
      description ||
      (documentType === "transfer"
        ? [bankFrom, bankTo].filter(Boolean).join(" → ")
        : "")

    return NextResponse.json({
      receiptId: receipt.id,
      imageUrl: cloudinaryUrl,
      merchant,
      amount,
      date: parsedDate || new Date().toISOString().split("T")[0],
      items,
      type: documentType,
      description: finalDescription,
    })
  } catch (error) {
    console.error("Scan error:", error)
    return NextResponse.json(
      { error: "Gagal scan struk" },
      { status: 500 }
    )
  }
}
