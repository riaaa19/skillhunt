import { getSupabase } from '../lib/supabase.js'

export async function createRegistration(input) {
  const { data, error } = await getSupabase().rpc('create_registration', {
    p_workshop_id: input.workshop_id,
    p_session_id: input.session_id,
    p_participant_name: input.participant_name,
    p_email: input.email,
    p_phone: input.phone || null,
  })
  if (error) {
    const code = error.code === '23505' || error.message?.includes('DUPLICATE_REGISTRATION') ? 'DUPLICATE' : error.message?.includes('CAPACITY') ? 'CAPACITY' : error.message?.includes('SESSION_WORKSHOP_MISMATCH') ? 'MISMATCH' : error.message?.includes('SESSION_EXPIRED') ? 'SESSION_EXPIRED' : error.message?.includes('SESSION_NOT_FOUND') || error.message?.includes('WORKSHOP_NOT_FOUND') ? 'NOT_FOUND' : null
    const e = new Error(code || 'Registration could not be saved')
    e.code = code || 'DATABASE_ERROR'
    throw e
  }
  return data
}

export async function getRegistration(id) {
  const { data, error } = await getSupabase().from('registrations').select('id,workshop_id,session_id,participant_name,created_at,workshops(title),workshop_sessions(starts_at,ends_at)').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
