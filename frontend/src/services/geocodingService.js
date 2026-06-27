/**
 * Reverse geocoding via FastAPI → Nominatim proxy
 */

import { apiGet } from './apiClient'

const CACHE_PREFIX = 'civicpulse_geo_'
const CACHE_TTL_MS = 30 * 60 * 1000

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
        const data = await apiGet(`/geocode/reverse?lat=${lat}&lng=${lng}`)
        const address = data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        setCache(key, address)
        return address
    } catch (err) {
        console.warn('Reverse geocode failed:', err)
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
}

export async function forwardGeocode(query) {
    console.warn('forwardGeocode is not implemented on the backend yet')
    return []
}
