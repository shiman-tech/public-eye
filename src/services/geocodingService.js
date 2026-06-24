/**
 * Nominatim Reverse Geocoding Service
 * Converts lat/lng coordinates to a human-readable address
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const CACHE_PREFIX = 'civicpulse_geo_'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

function cacheKey(lat, lng) {
    return `${CACHE_PREFIX}${lat.toFixed(5)}_${lng.toFixed(5)}`
}

function getCached(key) {
    try {
        const raw = sessionStorage.getItem(key)
        if (!raw) return null
        const { address, ts } = JSON.parse(raw)
        if (Date.now() - ts > CACHE_TTL_MS) {
            sessionStorage.removeItem(key)
            return null
        }
        return address
    } catch {
        return null
    }
}

function setCache(key, address) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ address, ts: Date.now() }))
    } catch {
        // Storage full — ignore
    }
}

export async function reverseGeocode(lat, lng) {
    const key = cacheKey(lat, lng)
    const cached = getCached(key)
    if (cached) return cached

    try {
        const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
        const res = await fetch(url, {
            headers: {
                'Accept-Language': 'en',
                'User-Agent': 'CivicPulse-App/1.0',
            },
        })
        if (!res.ok) throw new Error('Nominatim request failed')
        const data = await res.json()

        // Build a clean address string
        const addr = data.address || {}
        const parts = [
            addr.house_number,
            addr.road || addr.pedestrian || addr.footway,
            addr.suburb || addr.neighbourhood,
            addr.city || addr.town || addr.village,
            addr.state,
        ].filter(Boolean)

        const address = parts.length > 0 ? parts.join(', ') : data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        setCache(key, address)
        return address
    } catch (err) {
        console.warn('Reverse geocode failed:', err)
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
}

/**
 * Forward geocode: search for a place by name
 */
export async function forwardGeocode(query) {
    try {
        const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'en', 'User-Agent': 'CivicPulse-App/1.0' },
        })
        if (!res.ok) throw new Error('Nominatim forward geocode failed')
        return await res.json()
    } catch {
        return []
    }
}
