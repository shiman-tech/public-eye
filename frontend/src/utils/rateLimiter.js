/**
 * Client-side rate limiter using localStorage.
 * Prevents spam submissions and excessive API calls.
 */

const STORAGE_PREFIX = 'civicpulse_rl_'

export function checkRateLimit(key, { maxAttempts = 5, windowMs = 60_000 } = {}) {
    const storageKey = STORAGE_PREFIX + key
    const now = Date.now()

    try {
        const raw = localStorage.getItem(storageKey)
        const timestamps = raw ? JSON.parse(raw) : []
        const recent = timestamps.filter((t) => now - t < windowMs)

        if (recent.length >= maxAttempts) {
            const oldest = recent[0]
            const retryAfterMs = windowMs - (now - oldest)
            return {
                allowed: false,
                retryAfterMs,
                retryAfterSec: Math.ceil(retryAfterMs / 1000),
            }
        }

        recent.push(now)
        localStorage.setItem(storageKey, JSON.stringify(recent))
        return { allowed: true }
    } catch {
        return { allowed: true }
    }
}

export function formatRetryMessage(retryAfterSec) {
    if (retryAfterSec < 60) {
        return `Please wait ${retryAfterSec} seconds before trying again.`
    }
    const mins = Math.ceil(retryAfterSec / 60)
    return `Please wait ${mins} minute${mins > 1 ? 's' : ''} before trying again.`
}
