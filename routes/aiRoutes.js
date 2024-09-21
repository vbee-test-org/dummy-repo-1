import express from "express"

const router = express.Router()

router.post("/", async (req, res) => {
  const prompt = req.body.prompt

  if (!prompt) {
    return res.status(400).json({
      "error": "Prompt must not be empty!"
    })
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    body: JSON.stringify({ "contents": [{ "parts": [{ "text": prompt }] }] }
    ),
    headers: {
      "Content-type": "application/json"
    }
  })
  const result = await response.json()
  const text = result.candidates[0].content.parts[0].text
  return res.status(200).json({ response: text })
})

export { router as aiRoutes }
