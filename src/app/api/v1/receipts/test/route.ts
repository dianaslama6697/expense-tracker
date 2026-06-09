import { NextResponse } from "next/server"

export async function GET() {
  const model = process.env.OPENAI_MODEL || "gpt-4o"
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const apiKey = process.env.OPENAI_API_KEY || ""

  // Cek apakah key visible
  const keyPreview = apiKey ? apiKey.slice(0, 8) + "..." + apiKey.slice(-4) : "TIDAK ADA"

  // Coba test call ke API models
  let modelStatus = "unknown"
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) {
      const data = await res.json()
      const hasVisionModel = data.data?.some((m: { id: string }) =>
        m.id.includes(model)
      )
      modelStatus = hasVisionModel
        ? "Model tersedia ✅"
        : "Model TIDAK ditemukan di akun ini ❌"
    } else {
      const err = await res.text()
      modelStatus = `HTTP ${res.status}: ${err.slice(0, 200)}`
    }
  } catch (e) {
    modelStatus = `Error: ${e}`
  }

  return NextResponse.json({
    configuredModel: model,
    baseUrl,
    keyPreview,
    modelCheck: modelStatus,
  })
}
