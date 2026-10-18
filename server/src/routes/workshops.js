import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { calendarQuery, listQuery } from '../validators/schemas.js'
import * as controller from '../controllers/workshops.js'

const router = Router()
router.get('/', validate(listQuery, 'query'), controller.all)
router.get('/featured', controller.featured)
router.get('/categories', controller.categories)
router.get('/instructors', controller.instructors)
router.get('/calendar', validate(calendarQuery, 'query'), controller.calendar)
router.get('/:id', controller.one)
export default router
