/**
 * AI Image Classifier — OpenAI GPT-4o Vision via secure server proxy.
 * Falls back to filename heuristics when the API is unavailable.
 */

const CATEGORIES = ['Pothole', 'Sanitation', 'Streetlight', 'Flooding', 'Vandalism', 'Other']

const CATEGORY_KEYWORDS = {
    Pothole: ['pothole', 'hole', 'crack', 'road', 'asphalt', 'pavement'],
    Streetlight: ['light', 'lamp', 'streetlight', 'bulb', 'dark'],
    Sanitation: ['trash', 'garbage', 'waste', 'litter', 'bin', 'dump', 'rubbish'],
    Flooding: ['flood', 'water', 'drain', 'puddle', 'overflow'],
    Vandalism: ['graffiti', 'vandal', 'damage', 'broken', 'spray'],
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4MB for API payload

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result
            const base64 = dataUrl.split(',')[1]
            resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

async function compressForApi(file) {
    if (file.size <= MAX_IMAGE_BYTES) return file

    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(url)
            const canvas = document.createElement('canvas')
            const scale = Math.min(1, Math.sqrt(MAX_IMAGE_BYTES / file.size))
            canvas.width = Math.round(img.width * scale)
            canvas.height = Math.round(img.height * scale)
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            canvas.toBlob(
                (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
                'image/jpeg',
                0.85
            )
        }
        img.onerror = () => resolve(file)
        img.src = url
    })
}

function classifyByFilename(file) {
    const name = file.name.toLowerCase()

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some((kw) => name.includes(kw))) {
            return {
                category,
                confidence: Math.floor(Math.random() * 15) + 70,
                isAI: false,
                source: 'heuristic',
            }
        }
    }

    return {
        category: 'Other',
        confidence: 45,
        isAI: false,
        source: 'heuristic',
    }
}

/**
 * Analyze an image file and suggest a category.
 * @param {File} file - The uploaded image file
 * @returns {Promise<{ category: string, confidence: number, isAI: boolean, source?: string, model?: string } | null>}
 */
export async function classifyImage(file) {
    if (!file) return null

    try {
        const compressed = await compressForApi(file)
        const imageBase64 = await fileToBase64(compressed)
        const mimeType = compressed.type || 'image/jpeg'

        const res = await fetch('/api/classify-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, mimeType }),
        })

        if (res.ok) {
            const result = await res.json()
            if (result.category && CATEGORIES.includes(result.category)) {
                return result
            }
        }
    } catch (err) {
        console.warn('OpenAI classification failed, using fallback:', err.message)
    }

    return classifyByFilename(file)
}

export { CATEGORIES }
