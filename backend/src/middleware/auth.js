import { getSupabase } from '../db.js'

/**
 * Middleware to verify admin bearer token via Supabase Auth
 * Matches FastAPI get_current_admin behavior
 */
export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication required' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ detail: 'Authentication required' })
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user || !data.user.email) {
      return res.status(401).json({ detail: 'Invalid or expired token' })
    }

    req.admin = {
      email: data.user.email,
      token: token,
      user: data.user,
    }
    next()
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid or expired token' })
  }
}
