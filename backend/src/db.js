import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'

let serviceRoleClient = null

/**
 * Returns the singleton Supabase admin client (Service Role key)
 */
export function getSupabase() {
  if (!serviceRoleClient) {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.')
    }
    serviceRoleClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return serviceRoleClient
}

/**
 * Returns a Supabase client configured for the specific user token
 * (matching FastAPI get_supabase_client(token) behavior)
 */
export function getSupabaseClient(token = null) {
  if (token) {
    return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
  }
  return getSupabase()
}
