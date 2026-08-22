import { Router } from 'express'
import { classifyImage } from '../services/aiClassifier.js'

const router = Router()

/**
 * POST /api/classify-image - Classify infrastructure issue image using OpenAI Vision
 */
router.post('/classify-image', async (req, res, next) => {
  try {
    const { imageBase64, image_base64, mimeType = 'image/jpeg', mime_type = 'image/jpeg' } = req.body

    const base64Data = imageBase64 || image_base64
    const resolvedMimeType = mimeType || mime_type || 'image/jpeg'

    if (!base64Data) {
      return res.status(400).json({ detail: 'imageBase64 is required' })
    }

    const result = await classifyImage(base64Data, resolvedMimeType)
    return res.json(result)
  } catch (err) {
    const statusCode = err.statusCode || 500
    return res.status(statusCode).json({ detail: err.message || 'Classification failed' })
  }
})

export default router
