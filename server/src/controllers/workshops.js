import { listCalendar, listCategories, listFeatured, listInstructors, listWorkshops, getWorkshop } from '../services/workshops.js'

export async function all(req, res, next) {
  try { res.json({ data: await listWorkshops(req.query) }) } catch (e) { next(e) }
}
export async function featured(req, res, next) {
  try { res.json({ data: await listFeatured() }) } catch (e) { next(e) }
}
export async function one(req, res, next) {
  try {
    const data = await getWorkshop(req.params.id)
    if (!data) return res.status(404).json({ error: { code: 'WORKSHOP_NOT_FOUND', message: 'Workshop not found.' } })
    res.json({ data })
  } catch (e) { next(e) }
}
export async function categories(req, res, next) {
  try { res.json({ data: await listCategories() }) } catch (e) { next(e) }
}
export async function instructors(req, res, next) {
  try { res.json({ data: await listInstructors() }) } catch (e) { next(e) }
}
export async function calendar(req, res, next) {
  try { res.json({ data: await listCalendar(req.query) }) } catch (e) { next(e) }
}
