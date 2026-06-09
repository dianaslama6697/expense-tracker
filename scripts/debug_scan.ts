import fs from "fs"
import path from "path"

const API_KEY = process.env.OPENAI_API_KEY || ""
const BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
const MODEL = process.env.OPENAI_MODEL || "gpt-4o"

// Replikasi persis logic di scan/route.ts
async function scanEndpointSimulation(filePath: string) {
  console.log("=== DEBUG SCAN ENDPOINT ===")
  console.log("Model:", MODEL)
  console.log("Base URL:", BASE_URL)
  console.log("File:", filePath)

  // Baca file (simulasi req.formData -> file.arrayBuffer -> Buffer)
  const originalBuffer = fs.readFileSync(filePath)
  const buffer = Buffer.from(originalBuffer)  // sama kayak Buffer.from(await file.arrayBuffer())

  console.log("Size:", (buffer.length / 1024).toFixed(1), "KB")

  // Deteksi mime type dari magic bytes
  const magic = buffer.toString("hex", 0, 4).toUpperCase()
  let mimeType = "image/jpeg"
  if (magic.startsWith("89504E47")) mimeType = "image/png"
  else if (magic.startsWith("52494646") && buffer.toString("ascii", 8, 12) === "WEBP")
    mimeType = "image/webp"
  else if (magic.startsWith("474946")) mimeType = "image/gif"
  else if (magic.startsWith("FFD8")) mimeType = "image/jpeg"

  console.log("MIME type:", mimeType, "(magic:", magic, ")")
  console.log("Base64 length:", buffer.toString("base64").length)

  // Kirim ke Vision API
  const base64Image = buffer.toString("base64")
  const dataUri = `data:${mimeType};base64,${base64Image}`
  console.log("Data URI length:", dataUri.length)
  console.log("Data URI prefix:", dataUri.substring(0, 50) + "...")

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
              image_url: { url: dataUri },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.05,
    }),
  })

  const visionData = await visionRes.json()
  const rawText = visionData.choices?.[0]?.message?.content || ""
  const usage = visionData.usage || {}

  console.log("\n=== RESPONSE ===")
  console.log("Tokens used:", JSON.stringify(usage))
  console.log("Raw text:", rawText)
}

scanEndpointSimulation(process.argv[2] || "struk_indomaret.jpeg").catch(console.error)
