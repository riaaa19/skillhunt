import express from 'express'
import cors from 'cors'
import { getSupabase } from './lib/supabase.js'
import workshopRoutes from './routes/workshops.js'
import registrationRoutes from './routes/registrations.js'
import { errorHandler, notFound } from './middleware/error.js'

export function createApp() {
  const app = express()
  const frontend = process.env.FRONTEND_URL
  app.use(cors(frontend ? { origin: frontend } : {}))
  app.use(express.json({ limit: '32kb' }))
  app.get('/api/health', async (req, res) => {
    try {
      const { error } = await getSupabase().from('instructors').select('id', { head: true, count: 'exact' })
      res.status(error ? 503 : 200).json({ status: error ? 'degraded' : 'ok', database: error ? 'unavailable' : 'ok' })
    } catch {
      res.status(503).json({ status: 'degraded', database: 'unavailable' })
    }
  })
  app.use('/api/workshops', workshopRoutes)
  app.use('/api/registrations', registrationRoutes)
  app.use(notFound)
  app.use(errorHandler)
  return app
}
