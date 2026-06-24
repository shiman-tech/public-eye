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
export async function submitReport({ title, description, category, lat, lng, address, reportedBy }, imageFile) {
    const compressed = imageFile ? await compressImage(imageFile) : null
    const image_url = await uploadImage(compressed)

    const { data, error } = await supabase
        .from('reports')
        .insert([{
            title: title || `${category} Issue`,
            description,
            category,
            lat,
            lng,
            address,
            image_url,
            reported_by: reportedBy || 'Anonymous',
            status: 'Open',
        }])
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Update the status of a report (admin only)
 */
export async function updateReportStatus(id, status) {
    const { data, error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
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
