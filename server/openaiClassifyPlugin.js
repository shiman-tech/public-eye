/**
 * Vite plugin: proxies /api/classify-image to OpenAI Vision.
 * Keeps OPENAI_API_KEY server-side during dev and preview.
 */

const CATEGORIES = ['Pothole', 'Sanitation', 'Streetlight', 'Flooding', 'Vandalism', 'Other']

const SYSTEM_PROMPT = `You are a civic infrastructure issue classifier. Analyze the image and classify it into exactly one category: ${CATEGORIES.join(', ')}.

Respond with ONLY valid JSON in this format:
{"category":"<category>","confidence":<0-100>}

Rules:
- category must be one of the listed values exactly
- confidence is your certainty percentage (integer 0-100)
- If unclear, use "Other" with lower confidence`

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('end', () => resolve(Buffer.concat(chunks).toString()))
        req.on('error', reject)
    })
}

function createHandler(apiKey) {
    return async (req, res, next) => {
        if (!req.url?.startsWith('/api/classify-image')) return next()

        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.statusCode = 204
            res.end()
            return
        }

        if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
        }

        if (!apiKey) {
            res.statusCode = 503
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'OpenAI API key not configured' }))
            return
        }

        try {
            const raw = await readBody(req)
            const { imageBase64, mimeType = 'image/jpeg' } = JSON.parse(raw)

            if (!imageBase64) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'imageBase64 is required' }))
                return
            }

            const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
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

            if (!openaiRes.ok) {
                const errText = await openaiRes.text()
                console.error('[OpenAI]', openaiRes.status, errText)
                res.statusCode = openaiRes.status
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'OpenAI request failed', details: errText }))
                return
            }

            const data = await openaiRes.json()
            const content = data.choices?.[0]?.message?.content?.trim() || ''

            let parsed
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/)
                parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
            } catch {
                parsed = { category: 'Other', confidence: 50 }
            }

            const category = CATEGORIES.includes(parsed.category) ? parsed.category : 'Other'
            const confidence = Math.min(100, Math.max(0, Math.round(Number(parsed.confidence) || 50)))

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ category, confidence, isAI: true, model: 'gpt-4o-mini' }))
        } catch (err) {
            console.error('[classify-image]', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
        }
    }
}

export function openaiClassifyPlugin(apiKey) {
    const handler = createHandler(apiKey)
    return {
        name: 'openai-classify-api',
        configureServer(server) {
            server.middlewares.use(handler)
        },
        configurePreviewServer(server) {
            server.middlewares.use(handler)
        },
    }
}
