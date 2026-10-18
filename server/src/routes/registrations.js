import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validate } from '../middleware/validate.js'
import { registrationBody, registrationId } from '../validators/schemas.js'
import * as controller from '../controllers/registrations.js'

const router = Router()
const registrationLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again later.' } } })
router.post('/', registrationLimit, validate(registrationBody), controller.create)
router.get('/:id', validate(registrationId, 'params'), controller.one)
export default router
