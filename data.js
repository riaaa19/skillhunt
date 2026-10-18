// SAMPLE CONTENT: every instructor, workshop, price and date below is illustrative demo data.
// One model feeds the collage, catalogue, calendar, modal and registration form.
// Photos are placeholders from picsum.photos (seeded). Swap for real images later.
const img = (s, w = 800, h = 600) => `https://picsum.photos/seed/${s}/${w}/${h}`

export const CATEGORIES = {
  'Art & Painting': { color: '#F5B9CA', emoji: '🎨' },
  Pottery: { color: '#D3E4B1', emoji: '🏺' },
  Photography: { color: '#B7E0E5', emoji: '📷' },
  Crafts: { color: '#E7D9F5', emoji: '✂️' },
  'Food & Baking': { color: '#FFF0BD', emoji: '🥐' },
  Movement: { color: '#F5B9CA', emoji: '💃' },
}

export const INSTRUCTORS = [
  { id: 'i1', name: 'Meera Kulkarni', specialty: 'Watercolour & ink', bio: 'Paints tiny cities in big colours. Believes every beginner already has a style.', note: 'always bring a spare brush!', photo: img('meera', 500, 600), color: '#F5B9CA' },
  { id: 'i2', name: 'Arjun Rao', specialty: 'Wheel-thrown pottery', bio: 'Ex-engineer turned potter. Teaches centring clay with patience and bad puns.', note: 'wedge your clay. twice.', photo: img('arjun', 500, 600), color: '#D3E4B1' },
  { id: 'i3', name: 'Zoya Sheikh', specialty: 'Street & film photography', bio: 'Shoots the city at golden hour and teaches you to notice what you walk past.', note: 'light is the whole story', photo: img('zoya', 500, 600), color: '#B7E0E5' },
  { id: 'i4', name: 'Tara Menon', specialty: 'Paper craft & bookbinding', bio: 'Collects offcuts, makes journals. Her studio smells like glue and chai.', note: 'scraps are treasure', photo: img('tara', 500, 600), color: '#E7D9F5' },
  { id: 'i5', name: 'Kabir Das', specialty: 'Sourdough & laminated dough', bio: 'Home baker who went too deep on croissants and never came back.', note: 'trust the fold', photo: img('kabir', 500, 600), color: '#FFF0BD' },
  { id: 'i6', name: 'Isha Pillai', specialty: 'Contemporary & improv dance', bio: 'Choreographer who thinks anyone can move once the music is loud enough.', note: 'no mirrors, just joy', photo: img('isha', 500, 600), color: '#F5B9CA' },
]

const S = (id, date, time) => ({ id, date, time })
export const WORKSHOPS = [
  { id: 'w1', title: 'Watercolour city sketching', category: 'Art & Painting', instructorId: 'i1', location: 'Bandra, Mumbai', price: 1200, keywords: ['painting', 'sketch', 'urban', 'beginner'], photo: img('watercolor', 900, 700), description: 'Learn washes, wet-on-wet and quick ink lines while sketching a corner of the neighbourhood. Materials included, no experience needed.', sessions: [S('w1a', '2026-10-24', '10:00 – 13:00'), S('w1b', '2026-11-07', '10:00 – 13:00')] },
  { id: 'w2', title: 'First-time wheel pottery', category: 'Pottery', instructorId: 'i2', location: 'Andheri West, Mumbai', price: 1800, keywords: ['clay', 'wheel', 'ceramics', 'bowl'], photo: img('pottery', 900, 900), description: 'Centre, open and pull your first bowl. Glazed pieces are ready for pickup two weeks later.', sessions: [S('w2a', '2026-10-25', '14:00 – 17:00'), S('w2b', '2026-11-14', '14:00 – 17:00'), S('w2c', '2026-11-28', '11:00 – 14:00')] },
  { id: 'w3', title: 'Golden hour street photography', category: 'Photography', instructorId: 'i3', location: 'Colaba, Mumbai', price: 900, keywords: ['camera', 'street', 'phone', 'walk'], photo: img('streetphoto', 900, 650), description: 'A guided walk on composition, light and candid portraits. Phone cameras are welcome.', sessions: [S('w3a', '2026-10-31', '16:30 – 19:00'), S('w3b', '2026-11-21', '16:30 – 19:00')] },
  { id: 'w4', title: 'Make-your-own journal', category: 'Crafts', instructorId: 'i4', location: 'Powai, Mumbai', price: 750, keywords: ['paper', 'bookbinding', 'stitch', 'journal'], photo: img('journal', 800, 800), description: 'Fold, stitch and cover a pocket journal using Japanese stab binding.', sessions: [S('w4a', '2026-11-01', '11:00 – 13:30'), S('w4b', '2026-12-05', '11:00 – 13:30')] },
  { id: 'w5', title: 'Croissants from scratch', category: 'Food & Baking', instructorId: 'i5', location: 'Lower Parel, Mumbai', price: 2400, keywords: ['pastry', 'butter', 'baking', 'bread'], photo: img('croissant', 900, 700), description: 'Laminate, shape and bake butter croissants. Take a box home, hopefully.', sessions: [S('w5a', '2026-11-08', '09:00 – 14:00'), S('w5b', '2026-12-13', '09:00 – 14:00')] },
  { id: 'w6', title: 'Improv dance for non-dancers', category: 'Movement', instructorId: 'i6', location: 'Bandra, Mumbai', price: 600, keywords: ['dance', 'improv', 'fun', 'beginner'], photo: img('dance', 900, 700), description: 'Warm-ups, games and freestyle. Wear something comfy, leave the self-consciousness at the door.', sessions: [S('w6a', '2026-10-28', '19:00 – 20:30'), S('w6b', '2026-11-11', '19:00 – 20:30'), S('w6c', '2026-11-25', '19:00 – 20:30')] },
  { id: 'w7', title: 'Ink & gouache botanicals', category: 'Art & Painting', instructorId: 'i1', location: 'Powai, Mumbai', price: 1500, keywords: ['plants', 'gouache', 'illustration'], photo: img('botanical', 800, 900), description: 'Build a botanical study layer by layer with ink lines and opaque gouache.', sessions: [S('w7a', '2026-11-15', '10:00 – 13:00')] },
  { id: 'w8', title: 'Glaze lab: colour on clay', category: 'Pottery', instructorId: 'i2', location: 'Colaba, Mumbai', price: 1400, keywords: ['glaze', 'ceramics', 'test tiles'], photo: img('glaze', 900, 650), description: 'Test glazes on tiles and finish a piece of your own. Bring a bisque piece or use ours.', sessions: [S('w8a', '2026-12-06', '15:00 – 18:00')] },
  { id: 'w9', title: 'Darkroom basics on film', category: 'Photography', instructorId: 'i3', location: 'Andheri West, Mumbai', price: 1600, keywords: ['film', 'darkroom', 'analog', 'prints'], photo: img('darkroom', 800, 800), description: 'Develop a roll and make a print by hand. Film and chemicals included.', sessions: [S('w9a', '2026-11-22', '12:00 – 16:00'), S('w9b', '2026-12-20', '12:00 – 16:00')] },
]

export const LOCATIONS = [...new Set(WORKSHOPS.map((w) => w.location))]
export const instructorById = (id) => INSTRUCTORS.find((i) => i.id === id)
export const sessionsOf = (w) => w.sessions.map((s) => ({ ...s, workshopId: w.id }))
export const nextSession = (w) => [...w.sessions].sort((a, b) => a.date.localeCompare(b.date))[0]
export const ALL_SESSIONS = WORKSHOPS.flatMap(sessionsOf).sort((a, b) => a.date.localeCompare(b.date))

export const loadWorkshops = async () => {
  const res = await fetch('/api/workshops?limit=100')
  if (!res.ok) throw new Error('Unable to load workshops')
  const body = await res.json()
  return body.data?.items || []
}

export const fmtDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', opts)
export const fmtPrice = (n) => '₹' + n.toLocaleString('en-IN')
