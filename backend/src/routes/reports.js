import { Router } from 'express'
import multer from 'multer'
import { getSupabase, getSupabaseClient } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { uploadReportImage } from '../services/storage.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

/**
 * GET /api/reports - List all reports ordered by created_at desc
 */
router.get('/', async (req, res, next) => {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ detail: error.message })
    }

    return res.json(data || [])
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/reports - Create a new report (multipart/form-data)
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const { category, lat, lng, title, description, priority = 'Medium', address, reported_by = 'Anonymous' } = req.body

    if (!category || lat === undefined || lng === undefined) {
      return res.status(422).json({ detail: 'category, lat, and lng are required fields' })
    }

    let imageUrl = null
    if (req.file) {
      try {
        imageUrl = await uploadReportImage(req.file.buffer, req.file.originalname, req.file.mimetype)
      } catch (uploadErr) {
        console.error('Image upload failed:', uploadErr)
      }
    }

    const payload = {
      title: title || `${category} Issue`,
      description: description || null,
      category,
      priority: priority || 'Medium',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: address || null,
      image_url: imageUrl,
      reported_by: reported_by || 'Anonymous',
      status: 'Open',
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.from('reports').insert(payload).select('*')

    if (error || !data || data.length === 0) {
      return res.status(500).json({ detail: error?.message || 'Failed to create report' })
    }

    return res.status(201).json(data[0])
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/reports/:id/status - Update report status (admin only)
 */
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, admin_note = '', previous_status = '' } = req.body

    if (!status) {
      return res.status(400).json({ detail: 'status is required' })
    }

    const adminEmail = req.admin.email
    const token = req.admin.token

    const payload = { status }

    if (status === 'Resolved') {
      payload.resolved_by = adminEmail
      payload.resolved_at = new Date().toISOString()
    } else if (previous_status === 'Resolved' && status !== 'Resolved') {
      payload.resolved_by = null
      payload.resolved_at = null
    }

    if (admin_note) {
      payload.admin_notes = admin_note
    }

    const supabase = getSupabaseClient(token)
    const { data, error } = await supabase
      .from('reports')
      .update(payload)
      .eq('id', id)
      .select('*')

    if (error || !data || data.length === 0) {
      return res.status(404).json({ detail: 'Report not found' })
    }

    // Record status change history
    try {
      await supabase.from('status_history').insert({
        report_id: id,
        from_status: previous_status || null,
        to_status: status,
        changed_by: adminEmail,
        note: admin_note || null,
      })
    } catch (historyErr) {
      console.warn('Failed to insert status history:', historyErr)
    }

    return res.json(data[0])
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/reports/:id/history - Get status audit trail for a report
 */
router.get('/:id/history', async (req, res, next) => {
  try {
    const { id } = req.params
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('report_id', id)
      .order('changed_at', { ascending: true })

    if (error) {
      return res.status(500).json({ detail: error.message })
    }

    return res.json(data || [])
  } catch (err) {
    next(err)
  }
})

export default router
