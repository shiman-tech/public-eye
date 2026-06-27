import { apiGet, apiPatchJson, apiPostForm } from './apiClient'
import { compressImage } from '../utils/imageUtils'
import { supabase } from './supabase'

/**
 * Fetch all reports ordered by newest first
 */
export async function fetchReports() {
    return apiGet('/reports')
}

/**
 * Submit a new report (with optional image upload)
 */
export async function submitReport({ title, description, category, priority, lat, lng, address, reportedBy }, imageFile) {
    const compressed = imageFile ? await compressImage(imageFile) : null
    const formData = new FormData()

    formData.append('category', category)
    formData.append('lat', String(lat))
    formData.append('lng', String(lng))
    formData.append('priority', priority || 'Medium')
    formData.append('reported_by', reportedBy || 'Anonymous')

    if (title) formData.append('title', title)
    if (description) formData.append('description', description)
    if (address) formData.append('address', address)
    if (compressed) formData.append('image', compressed, compressed.name)

    return apiPostForm('/reports', formData)
}

/**
 * Update the status of a report (admin only).
 */
export async function updateReportStatus(id, newStatus, { adminEmail = 'admin', adminNote = '', previousStatus = '' } = {}) {
    return apiPatchJson(`/reports/${id}/status`, {
        status: newStatus,
        admin_note: adminNote,
        previous_status: previousStatus,
    })
}

/**
 * Fetch status history (audit trail) for a specific report.
 */
export async function fetchStatusHistory(reportId) {
    try {
        return await apiGet(`/reports/${reportId}/history`)
    } catch (err) {
        console.warn('Failed to fetch status history:', err)
        return []
    }
}

/**
 * Compute dashboard statistics from the reports array.
 */
export function computeDashboardStats(reports) {
    if (!reports || reports.length === 0) {
        return {
            total: 0,
            open: 0,
            inProgress: 0,
            resolved: 0,
            critical: 0,
            high: 0,
            avgResolutionHours: null,
            categoryBreakdown: {},
        }
    }

    const total = reports.length
    const open = reports.filter(r => r.status === 'Open').length
    const inProgress = reports.filter(r => r.status === 'In Progress').length
    const resolved = reports.filter(r => r.status === 'Resolved').length
    const critical = reports.filter(r => r.priority === 'Critical').length
    const high = reports.filter(r => r.priority === 'High').length

    const resolvedReports = reports.filter(r => r.status === 'Resolved' && r.resolved_at)
    let avgResolutionHours = null
    if (resolvedReports.length > 0) {
        const totalMs = resolvedReports.reduce((sum, r) => {
            return sum + (new Date(r.resolved_at) - new Date(r.created_at))
        }, 0)
        avgResolutionHours = Math.round(totalMs / resolvedReports.length / (1000 * 60 * 60))
    }

    const categoryBreakdown = {}
    reports.forEach(r => {
        categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1
    })

    return {
        total,
        open,
        inProgress,
        resolved,
        critical,
        high,
        avgResolutionHours,
        categoryBreakdown,
    }
}

/**
 * Subscribe to real-time changes on the reports table via Supabase Realtime
 */
export function subscribeToReports(onInsert, onUpdate) {
    const channel = supabase
        .channel('reports-realtime')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'reports' },
            (payload) => onInsert && onInsert(payload.new)
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'reports' },
            (payload) => onUpdate && onUpdate(payload.new)
        )
        .subscribe()

    return () => supabase.removeChannel(channel)
}
