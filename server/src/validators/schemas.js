import { z } from 'zod'

const uuid = z.string().uuid()
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const listQuery = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  instructor: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().min(0).max(10000000).optional(),
  maxPrice: z.coerce.number().min(0).max(10000000).optional(),
  startDate: date.optional(),
  endDate: date.optional(),
  sort: z.enum(['soonest', 'price_asc', 'price_desc', 'newest']).default('soonest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
}).refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
  message: 'minPrice must not exceed maxPrice',
  path: ['minPrice'],
})

export const calendarQuery = z.object({
  startDate: date.optional(),
  endDate: date.optional(),
}).refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
  message: 'startDate must not be after endDate',
  path: ['startDate'],
})

export const registrationBody = z.object({
  participant_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  workshop_id: uuid,
  session_id: uuid,
})

export const registrationId = z.object({ id: uuid })
