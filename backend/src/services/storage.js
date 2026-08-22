import crypto from 'crypto'
import { getSupabase } from '../db.js'

const BUCKET = 'report-images'

/**
 * Upload a report image to Supabase Storage bucket and return public URL
 * @param {Buffer} fileBuffer
 * @param {string} originalFilename
 * @param {string} contentType
 * @returns {Promise<string>}
 */
export async function uploadReportImage(fileBuffer, originalFilename, contentType = 'image/jpeg') {
  const ext = originalFilename.includes('.') ? originalFilename.split('.').pop() : 'jpg'
  const objectName = `report_${crypto.randomUUID().replace(/-/g, '')}.${ext}`

  const supabase = getSupabase()

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectName, fileBuffer, {
    contentType: contentType || 'image/jpeg',
    cacheControl: '3600',
    upsert: false,
  })

  if (uploadError) {
    throw new Error(`Failed to upload image to storage: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectName)
  return data.publicUrl
}
