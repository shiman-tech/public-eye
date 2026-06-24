import { supabase } from './supabase'
import { compressImage } from '../utils/imageUtils'

const BUCKET = 'report-images'

/**
 * Fetch all reports ordered by newest first
 */
export async function fetchReports() {
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

/**
 * Upload an image file to Supabase Storage and return the public URL
 */
async function uploadImage(imageFile) {
    if (!imageFile) return null

    const ext = imageFile.name.split('.').pop()
    const fileName = `report_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, imageFile, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return data.publicUrl
}

/**
 * Submit a new report (with optional image upload)
 */
export async function submitReport({ title, description, category, priority, lat, lng, address, reportedBy }, imageFile) {
    const compressed = imageFile ? await compressImage(imageFile) : null
    const image_url = await uploadImage(compressed)

    const basePayload = {
        title: title || `${category} Issue`,
        description,
        category,
        lat,
        lng,
        address,
        image_url,
        reported_by: reportedBy || 'Anonymous',
        status: 'Open',
    }

    // Try with priority column first
    let { data, error } = await supabase
        .from('reports')
        .insert([{ ...basePayload, priority: priority || 'Medium' }])
        .select()
        .single()

    // Fall back without priority if column doesn't exist yet
    if (error && error.message && error.message.includes('schema cache')) {
        console.warn('Priority column not found — falling back. Run migration_robustness.sql to enable full features.')
        const fallback = await supabase
            .from('reports')
            .insert([basePayload])
            .select()
            .single()
        data = fallback.data
        error = fallback.error
    }

    if (error) throw error
    return data
}

/**
 * Update the status of a report (admin only).
 * Records the change in the audit trail with admin identity and notes.
 * @param {string} id - Report ID
 * @param {string} newStatus - The new status value
 * @param {object} options - Additional options
 * @param {string} options.adminEmail - Email of the admin making the change
 * @param {string} options.adminNote - Note explaining the status change
 * @param {string} options.previousStatus - The status before the change
 */
export async function updateReportStatus(id, newStatus, { adminEmail = 'admin', adminNote = '', previousStatus = '' } = {}) {
    // Build the full update payload with new columns
    const fullPayload = { status: newStatus }

    // If resolving, record who and when
    if (newStatus === 'Resolved') {
        fullPayload.resolved_by = adminEmail
        fullPayload.resolved_at = new Date().toISOString()
    }

    // If moving back from Resolved, clear resolution fields
    if (previousStatus === 'Resolved' && newStatus !== 'Resolved') {
        fullPayload.resolved_by = null
        fullPayload.resolved_at = null
    }

    // Append admin note if provided
    if (adminNote) {
        fullPayload.admin_notes = adminNote
    }

    // Try update with all new columns first
    let { data, error } = await supabase
        .from('reports')
        .update(fullPayload)
        .eq('id', id)
        .select()
        .single()

    // If the new columns don't exist yet (migration not run), fall back to status-only update
    if (error && error.message && error.message.includes('schema cache')) {
        console.warn('New columns not found — falling back to status-only update. Run migration_robustness.sql in Supabase SQL Editor to enable full features.')
        const fallback = await supabase
            .from('reports')
            .update({ status: newStatus })
            .eq('id', id)
            .select()
            .single()
        data = fallback.data
        error = fallback.error
    }

    if (error) throw error

    // Insert audit trail entry (will silently fail if status_history table doesn't exist yet)
    try {
        await supabase.from('status_history').insert([{
            report_id: id,
            from_status: previousStatus || null,
            to_status: newStatus,
            changed_by: adminEmail,
            note: adminNote || null,
        }])
    } catch (historyErr) {
        // Don't fail the whole operation if history insert fails
        console.warn('Failed to record status history:', historyErr)
    }

    return data
}

/**
 * Fetch status history (audit trail) for a specific report.
 * Returns entries ordered chronologically (oldest first).
 * @param {string} reportId
 * @returns {Promise<Array>}
 */
export async function fetchStatusHistory(reportId) {
    const { data, error } = await supabase
        .from('status_history')
        .select('*')
        .eq('report_id', reportId)
        .order('changed_at', { ascending: true })

    if (error) {
        console.warn('Failed to fetch status history:', error)
        return []
    }
    return data || []
}

/**
 * Compute dashboard statistics from the reports array.
 * Runs client-side to avoid extra DB queries.
 * @param {Array} reports
 * @returns {object}
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

    // Calculate average resolution time for resolved reports
    const resolvedReports = reports.filter(r => r.status === 'Resolved' && r.resolved_at)
    let avgResolutionHours = null
    if (resolvedReports.length > 0) {
        const totalMs = resolvedReports.reduce((sum, r) => {
            return sum + (new Date(r.resolved_at) - new Date(r.created_at))
        }, 0)
        avgResolutionHours = Math.round(totalMs / resolvedReports.length / (1000 * 60 * 60))
    }

    // Category breakdown
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
 * Subscribe to real-time changes on the reports table
 * @param {Function} onInsert - called with new report
 * @param {Function} onUpdate - called with updated report
 * @returns unsubscribe function
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
