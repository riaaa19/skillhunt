import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app.js'

describe('SkillHunt API', () => {
  beforeEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('reports degraded health without database configuration', async () => {
    const res = await request(createApp()).get('/api/health')
    expect(res.status).toBe(503)
    expect(res.body).toEqual({ status: 'degraded', database: 'unavailable' })
  })

  it('rejects malformed registration payloads before database access', async () => {
    const res = await request(createApp()).post('/api/registrations').send({ email: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.fields).toHaveProperty('participant_name')
  })

  it('rejects malformed registration identifiers', async () => {
    const res = await request(createApp()).get('/api/registrations/not-a-uuid')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
