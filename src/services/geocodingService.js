/**
 * Nominatim Reverse Geocoding Service
 * Converts lat/lng coordinates to a human-readable address
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export async function reverseGeocode(lat, lng) {
    try {
        const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
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

        return parts.length > 0 ? parts.join(', ') : data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
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
