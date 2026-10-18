import { getSupabase } from '../lib/supabase.js'

const select = `
  id,title,slug,description,category,location,price,image_url,is_featured,is_published,created_at,updated_at,
  instructor:instructors(id,name,bio,specialty,image_url),
  sessions:workshop_sessions(id,starts_at,ends_at,capacity)
`

const PICSUM_WORKSHOPS = {
  'watercolour-for-beginners': 'https://picsum.photos/seed/watercolor/900/700',
  'paint-your-own-world': 'https://picsum.photos/seed/painting/900/700',
  'pottery-basics': 'https://picsum.photos/seed/pottery/900/900',
  'clay-and-coffee': 'https://picsum.photos/seed/glaze/900/650',
  'everyday-photo-stories': 'https://picsum.photos/seed/streetphoto/900/650',
  'photography-walk': 'https://picsum.photos/seed/darkroom/800/800',
  'creative-paper-crafts': 'https://picsum.photos/seed/journal/800/800',
  'make-something-handmade': 'https://picsum.photos/seed/croissant/900/700',
}

const PICSUM_INSTRUCTORS = {
  'Maya Shah': 'https://picsum.photos/seed/meera/500/600',
  'Aarav Mehta': 'https://picsum.photos/seed/arjun/500/600',
  'Ira Kapoor': 'https://picsum.photos/seed/zoya/500/600',
  'Neha Desai': 'https://picsum.photos/seed/tara/500/600',
}

function resolveImage(url, slug, fallbackSeed, w = 900, h = 700) {
  if (!url || url.includes('placehold.co')) {
    return PICSUM_WORKSHOPS[slug] || `https://picsum.photos/seed/${fallbackSeed || slug || 'craft'}/${w}/${h}`
  }
  return url
}

function resolveInstructorImage(url, name, fallbackSeed) {
  if (!url || url.includes('placehold.co')) {
    return PICSUM_INSTRUCTORS[name] || `https://picsum.photos/seed/${fallbackSeed || name || 'art'}/500/600`
  }
  return url
}

function toDto(row) {
  const instructor = row.instructor
  const photo = resolveImage(row.image_url, row.slug, row.category)
  const insPhoto = instructor ? resolveInstructorImage(instructor.image_url, instructor.name, instructor.name) : null
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    instructorId: instructor?.id || row.instructor_id,
    instructor: instructor ? {
      id: instructor.id,
      name: instructor.name,
      bio: instructor.bio,
      specialty: instructor.specialty,
      photo: insPhoto,
    } : null,
    location: row.location,
    price: Number(row.price),
    photo,
    isFeatured: row.is_featured,
    keywords: [row.category, row.location, row.title].filter(Boolean),
    sessions: (row.sessions || []).map((s) => ({
      id: s.id,
      date: s.starts_at.slice(0, 10),
      time: `${new Date(s.starts_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} – ${new Date(s.ends_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      capacity: s.capacity,
    })),
  }
}

function applyFilters(query, filters) {
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.location) query = query.eq('location', filters.location)
  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice)
  return query
}

export async function listWorkshops(filters = {}) {
  const supabase = getSupabase()
  let query = supabase.from('workshops').select(select, { count: 'exact' }).eq('is_published', true)
  query = applyFilters(query, filters)
  if (filters.instructor || filters.search) {
    const instructorQuery = supabase.from('instructors').select('id')
    const escaped = (filters.search || filters.instructor || '').replace(/[%(),]/g, ' ')
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.instructor)
    const instructorFilter = filters.instructor ? (isUuid ? `id.eq.${filters.instructor}` : `name.ilike.%${escaped}%`) : `name.ilike.%${escaped}%,specialty.ilike.%${escaped}%`
    const { data: instructors, error } = await instructorQuery.or(instructorFilter)
    if (error) throw error
    if (filters.instructor) {
      query = instructors?.length ? query.in('instructor_id', instructors.map((x) => x.id)) : query.eq('instructor_id', '00000000-0000-0000-0000-000000000000')
    } else {
      const fields = `title.ilike.%${escaped}%,description.ilike.%${escaped}%,category.ilike.%${escaped}%,location.ilike.%${escaped}%`
      query = query.or(instructors?.length ? `${fields},instructor_id.in.(${instructors.map((x) => x.id).join(',')})` : fields)
    }
  } else if (filters.search) {
    const escaped = filters.search.replace(/[%(),]/g, ' ')
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%,category.ilike.%${escaped}%,location.ilike.%${escaped}%`)
  }
  if (filters.startDate || filters.endDate) {
    const { data: sessions, error } = await supabase.from('workshop_sessions').select('workshop_id').gte('starts_at', filters.startDate ? `${filters.startDate}T00:00:00Z` : '1900-01-01T00:00:00Z').lte('starts_at', filters.endDate ? `${filters.endDate}T23:59:59Z` : '2999-12-31T23:59:59Z')
    if (error) throw error
    query = query.in('id', [...new Set((sessions || []).map((x) => x.workshop_id))])
  }
  const order = filters.sort === 'price_asc' ? ['price', { ascending: true }] : filters.sort === 'price_desc' ? ['price', { ascending: false }] : filters.sort === 'newest' ? ['created_at', { ascending: false }] : ['created_at', { ascending: true }]
  query = query.order(order[0], order[1])
  const from = (filters.page - 1) * filters.limit
  const { data, count, error } = await query.range(from, from + filters.limit - 1)
  if (error) throw error
  return { items: (data || []).map(toDto), total: count || 0, page: filters.page, limit: filters.limit }
}

export async function getWorkshop(id) {
  const { data, error } = await getSupabase().from('workshops').select(select).eq('id', id).eq('is_published', true).maybeSingle()
  if (error) throw error
  return data ? toDto(data) : null
}

export async function listFeatured() {
  const result = await listWorkshops({ page: 1, limit: 100 })
  return result.items.filter((w) => w.isFeatured)
}

export async function listCategories() {
  const { data, error } = await getSupabase().from('workshops').select('category').eq('is_published', true)
  if (error) throw error
  return [...new Set((data || []).map((x) => x.category))].sort()
}

export async function listInstructors() {
  const { data, error } = await getSupabase().from('instructors').select('id,name,bio,specialty,image_url,workshops:workshops!instructor_id(id,title,category,location,price,image_url,is_featured,sessions:workshop_sessions(id,starts_at,ends_at))').eq('workshops.is_published', true).order('name')
  if (error) throw error
  return (data || []).map((i) => ({ ...i, photo: resolveInstructorImage(i.image_url, i.name, i.name), workshops: (i.workshops || []).map((w) => ({ ...w, photo: resolveImage(w.image_url, w.slug, w.category) })) }))
}

export async function listCalendar({ startDate, endDate } = {}) {
  const result = await listWorkshops({ startDate, endDate, page: 1, limit: 100 })
  return result.items.flatMap((workshop) => workshop.sessions.map((session) => ({ date: session.date, session, workshop }))).sort((a, b) => a.date.localeCompare(b.date))
}
