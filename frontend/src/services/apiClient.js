import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function getAuthHeaders(extraHeaders = {}) {
    const { data } = await supabase.auth.getSession()
    const headers = { ...extraHeaders }
    const token = data.session?.access_token
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }
    return headers
}

async function parseResponse(res) {
    const text = await res.text()
    let data = null
    try {
        data = text ? JSON.parse(text) : null
    } catch (err) {
        if (!res.ok) {
            throw new Error(text || res.statusText || 'Request failed')
        }
        throw err
    }
    if (!res.ok) {
        const message = data?.detail || data?.error || res.statusText || 'Request failed'
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
    }
    return data
}

export async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: await getAuthHeaders(),
    })
    return parseResponse(res)
}

export async function apiPostJson(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
    })
    return parseResponse(res)
}

export async function apiPatchJson(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
    })
    return parseResponse(res)
}

export async function apiPostForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: formData,
    })
    return parseResponse(res)
}
