import { Router } from 'express'

const router = Router()
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'PublicEye-Express/1.0',
}

/**
 * GET /api/geocode/reverse - Reverse geocode latitude and longitude to human address
 */
router.get('/reverse', async (req, res, next) => {
  const { lat, lng } = req.query

  if (!lat || !lng) {
    return res.status(400).json({ detail: 'lat and lng query parameters are required' })
  }

  const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&zoom=18`

  try {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) })

    if (!response.ok) {
      return res.status(502).json({ detail: 'Geocoding service unavailable' })
    }

    const data = await response.json()
    const addr = data.address || {}

    const parts = [
      addr.house_number,
      addr.road || addr.pedestrian || addr.footway,
      addr.suburb || addr.neighbourhood,
      addr.city || addr.town || addr.village,
      addr.state,
    ].filter(Boolean)

    let address = ''
    if (parts.length > 0) {
      address = parts.join(', ')
    } else {
      const parsedLat = parseFloat(lat)
      const parsedLng = parseFloat(lng)
      address = data.display_name || `${parsedLat.toFixed(5)}, ${parsedLng.toFixed(5)}`
    }

    return res.json({ address })
  } catch (err) {
    return res.status(502).json({ detail: 'Geocoding service unavailable' })
  }
})

export default router
