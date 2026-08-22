import { config } from '../config.js'

export const CATEGORIES = [
  'Pothole',
  'Sanitation',
  'Streetlight',
  'Flooding',
  'Vandalism',
  'Other',
]

const SYSTEM_PROMPT = `You are a civic infrastructure issue classifier. Analyze the image and classify it into exactly one category: ${CATEGORIES.join(', ')}.

Respond with ONLY valid JSON in this format:
{"category":"<category>","confidence":<0-100>}

Rules:
- category must be one of the listed values exactly
- confidence is your certainty percentage (integer 0-100)
- If unclear, use "Other" with lower confidence`

/**
 * Classifies an image using OpenAI Vision API
 * @param {string} imageBase64
 * @param {string} mimeType
 * @returns {Promise<{category: string, confidence: number, isAI: boolean, model: string}>}
 */
export async function classifyImage(imageBase64, mimeType = 'image/jpeg') {
  if (!config.openaiApiKey) {
    const error = new Error('OpenAI API key not configured')
    error.statusCode = 503
    throw error
  }

  let response
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Classify this civic infrastructure issue.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'low',
                },
              },
            ],
          },
        ],
      }),
    })
  } catch (err) {
    const error = new Error(`OpenAI request failed: ${err.message}`)
    error.statusCode = 502
    throw error
  }

  if (!response.ok) {
    const errorText = await response.text()
    const error = new Error(`OpenAI request failed: ${errorText}`)
    error.statusCode = 502
    throw error
  }

  const data = await response.json()
  const content = (data.choices?.[0]?.message?.content || '').trim()

  let parsed = { category: 'Other', confidence: 50 }
  try {
    const match = content.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(match ? match[0] : content)
  } catch {
    parsed = { category: 'Other', confidence: 50 }
  }

  const category = CATEGORIES.includes(parsed.category) ? parsed.category : 'Other'
  const rawConfidence = Number(parsed.confidence) || 50
  const confidence = Math.min(100, Math.max(0, Math.round(rawConfidence)))

  return {
    category,
    confidence,
    isAI: true,
    model: 'gpt-4o-mini',
  }
}
