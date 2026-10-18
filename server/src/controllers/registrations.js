import { createRegistration, getRegistration } from '../services/registrations.js'

export async function create(req, res, next) {
  try {
    const data = await createRegistration(req.body)
    res.status(201).json({ data: { id: data.id, created_at: data.created_at } })
  } catch (e) {
    if (e.code === 'DUPLICATE') return res.status(409).json({ error: { code: e.code, message: 'You are already registered for this session.' } })
    if (e.code === 'CAPACITY') return res.status(409).json({ error: { code: e.code, message: 'This session is full.' } })
    if (e.code === 'SESSION_EXPIRED') return res.status(409).json({ error: { code: e.code, message: 'This session has already ended.' } })
    if (e.code === 'MISMATCH') return res.status(400).json({ error: { code: e.code, message: 'The selected session does not belong to this workshop.' } })
    if (e.code === 'NOT_FOUND') return res.status(404).json({ error: { code: e.code, message: 'Workshop or session not found.' } })
    next(e)
  }
}

export async function one(req, res, next) {
  try {
    const data = await getRegistration(req.params.id)
    if (!data) return res.status(404).json({ error: { code: 'REGISTRATION_NOT_FOUND', message: 'Registration not found.' } })
    res.json({ data: { id: data.id, participant_name: data.participant_name, workshop: data.workshops, session: data.workshop_sessions, created_at: data.created_at } })
  } catch (e) { next(e) }
}
