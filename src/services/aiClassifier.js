/**
 * AI Image Classifier - Placeholder / Stub
 *
 * This module simulates an AI vision classification.
 * Replace the body of classifyImage() with a real API call
 * (e.g., OpenAI Vision, Google Vision API) to get real results.
 */

const CATEGORY_KEYWORDS = {
    Pothole: ['pothole', 'hole', 'crack', 'road', 'asphalt', 'pavement'],
    Streetlight: ['light', 'lamp', 'streetlight', 'bulb', 'dark'],
    Sanitation: ['trash', 'garbage', 'waste', 'litter', 'bin', 'dump', 'rubbish'],
    Flooding: ['flood', 'water', 'drain', 'puddle', 'overflow'],
    Vandalism: ['graffiti', 'vandal', 'damage', 'broken', 'spray'],
}

/**
 * Analyze an image file and suggest a category.
 * @param {File} file - The uploaded image file
 * @returns {{ category: string, confidence: number, isAI: boolean }}
 */
export async function classifyImage(file) {
    if (!file) return null

    // Simulate network delay for realism
    await new Promise((res) => setTimeout(res, 800))

    const name = file.name.toLowerCase()

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some((kw) => name.includes(kw))) {
            return {
                category,
                confidence: Math.floor(Math.random() * 20) + 75, // 75–95%
                isAI: true,
            }
        }
    }

    // Default: random category with low confidence to indicate uncertainty
    const categories = Object.keys(CATEGORY_KEYWORDS)
    return {
        category: categories[Math.floor(Math.random() * categories.length)],
        confidence: Math.floor(Math.random() * 20) + 40, // 40–60%
        isAI: true,
    }
}

/**
 * TODO: Replace classifyImage with a real Vision API like:
 *
 * OpenAI Vision:
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{
 *     role: 'user',
 *     content: [
 *       { type: 'text', text: 'Classify this infrastructure issue into one of: Pothole, Sanitation, Streetlight, Flooding, Vandalism, Other. Reply with just the category name and a confidence percentage.' },
 *       { type: 'image_url', image_url: { url: base64DataUrl } }
 *     ]
 *   }]
 * })
 */
