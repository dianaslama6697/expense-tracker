import fs from "fs"
import path from "path"

const API_KEY = process.env.OPENAI_API_KEY || ""
const BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
const MODEL = process.env.OPENAI_MODEL || "gpt-4o"

async function main() {
  const imagePath = path.resolve(process.argv[2] || "struk_breadtalk.webp")
  const imageBuffer = fs.readFileSync(imagePath)
  const base64Image = imageBuffer.toString("base64")
  const mimeType = `image/${path.extname(imagePath).slice(1)}`

  console.log("Model:", MODEL)
  console.log("Base URL:", BASE_URL)
  console.log("Image:", imagePath, `(${(imageBuffer.length / 1024).toFixed(1)} KB)`)
  console.log("---")

  const res = await fetch(`${BASE_URL}/chat/completions`, {
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
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.05,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Error:", res.status, err)
    process.exit(1)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ""
  console.log("Response:")
  console.log(content)

  // Log usage
  if (data.usage) {
    console.log("---")
    console.log("Tokens:", JSON.stringify(data.usage))
  }
}

main().catch(console.error)
