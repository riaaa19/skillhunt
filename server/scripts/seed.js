import 'dotenv/config'
import { getSupabase } from '../src/lib/supabase.js'

const image = (seed, width = 900, height = 700) => `https://picsum.photos/seed/${seed}/${width}/${height}`
const instructors = [
  ['11111111-1111-4111-8111-111111111111', 'i1', 'Meera Kulkarni', 'Paints tiny cities in big colours. Every beginner already has a style.', 'Watercolour & ink', image('meera', 500, 600)],
  ['22222222-2222-4222-8222-222222222222', 'i2', 'Arjun Rao', 'Ex-engineer turned potter. Teaches centring clay with patience and bad puns.', 'Wheel-thrown pottery', image('arjun', 500, 600)],
  ['33333333-3333-4333-8333-333333333333', 'i3', 'Zoya Sheikh', 'Shoots the city at golden hour and teaches you to notice what you walk past.', 'Street & film photography', image('zoya', 500, 600)],
  ['44444444-4444-4444-8444-444444444444', 'i4', 'Tara Menon', 'Collects offcuts and makes journals. Her studio smells like glue and chai.', 'Paper craft & bookbinding', image('tara', 500, 600)],
  ['55555555-5555-4555-8555-555555555555', 'i5', 'Kabir Das', 'Home baker who went too deep on croissants and never came back.', 'Sourdough & laminated dough', image('kabir', 500, 600)],
  ['66666666-6666-4666-8666-666666666666', 'i6', 'Isha Pillai', 'Choreographer who thinks anyone can move once the music is loud enough.', 'Contemporary & improv dance', image('isha', 500, 600)],
].map(([id, slug, name, bio, specialty, image_url]) => ({ id, slug, name, bio, specialty, image_url }))

const workshopSeeds = [
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'watercolour-city-sketching', 'Watercolour city sketching', 'Art & Painting', '11111111-1111-4111-8111-111111111111', 'Bandra, Mumbai', 1200, true, 'watercolor', 'Learn washes, wet-on-wet and quick ink lines while sketching a corner of the neighbourhood. Materials included.'],
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'first-time-wheel-pottery', 'First-time wheel pottery', 'Pottery', '22222222-2222-4222-8222-222222222222', 'Andheri West, Mumbai', 1800, true, 'pottery', 'Centre, open and pull your first bowl. Glazed pieces are ready for pickup two weeks later.'],
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'golden-hour-street-photography', 'Golden hour street photography', 'Photography', '33333333-3333-4333-8333-333333333333', 'Colaba, Mumbai', 900, true, 'streetphoto', 'A guided walk on composition, light and candid portraits. Phone cameras are welcome.'],
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'make-your-own-journal', 'Make-your-own journal', 'Crafts', '44444444-4444-4444-8444-444444444444', 'Powai, Mumbai', 750, false, 'journal', 'Fold, stitch and cover a pocket journal using Japanese stab binding.'],
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'croissants-from-scratch', 'Croissants from scratch', 'Food & Baking', '55555555-5555-4555-8555-555555555555', 'Lower Parel, Mumbai', 2400, true, 'croissant', 'Laminate, shape and bake butter croissants. Take a box home, hopefully.'],
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'improv-dance-for-non-dancers', 'Improv dance for non-dancers', 'Movement', '66666666-6666-4666-8666-666666666666', 'Bandra, Mumbai', 600, false, 'dance', 'Warm-ups, games and freestyle. Wear something comfy and leave self-consciousness at the door.'],
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 'ink-gouache-botanicals', 'Ink & gouache botanicals', 'Art & Painting', '11111111-1111-4111-8111-111111111111', 'Powai, Mumbai', 1500, false, 'botanical', 'Build a botanical study layer by layer with ink lines and opaque gouache.'],
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 'glaze-lab-colour-on-clay', 'Glaze lab: colour on clay', 'Pottery', '22222222-2222-4222-8222-222222222222', 'Colaba, Mumbai', 1400, false, 'glaze', 'Test glazes on tiles and finish a piece of your own. Bring a bisque piece or use ours.'],
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', 'darkroom-basics-on-film', 'Darkroom basics on film', 'Photography', '33333333-3333-4333-8333-333333333333', 'Andheri West, Mumbai', 1600, false, 'darkroom', 'Develop a roll and make a print by hand. Film and chemicals included.'],
].map(([id, slug, title, category, instructor_id, location, price, is_featured, seed, description]) => ({ id, slug, title, category, instructor_id, location, price, is_featured, description, image_url: image(seed), is_published: true }))

const sessionRows = [
  ['10000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '2026-10-24T10:00:00+05:30', '2026-10-24T13:00:00+05:30'],
  ['10000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '2026-10-25T14:00:00+05:30', '2026-10-25T17:00:00+05:30'],
  ['10000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '2026-10-31T16:30:00+05:30', '2026-10-31T19:00:00+05:30'],
  ['10000000-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '2026-11-01T11:00:00+05:30', '2026-11-01T13:30:00+05:30'],
  ['10000000-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '2026-11-08T09:00:00+05:30', '2026-11-08T14:00:00+05:30'],
  ['10000000-0000-4000-8000-000000000006', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', '2026-10-28T19:00:00+05:30', '2026-10-28T20:30:00+05:30'],
  ['10000000-0000-4000-8000-000000000007', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', '2026-11-15T10:00:00+05:30', '2026-11-15T13:00:00+05:30'],
  ['10000000-0000-4000-8000-000000000008', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', '2026-12-06T15:00:00+05:30', '2026-12-06T18:00:00+05:30'],
  ['10000000-0000-4000-8000-000000000009', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', '2026-11-22T12:00:00+05:30', '2026-11-22T16:00:00+05:30'],
].map(([id, workshop_id, starts_at, ends_at]) => ({ id, workshop_id, starts_at, ends_at, capacity: 12 }))

const db = getSupabase()
for (const rows of [[instructors, 'instructors', 'slug'], [workshopSeeds, 'workshops', 'slug'], [sessionRows, 'workshop_sessions', 'id']]) {
  const { error } = await db.from(rows[1]).upsert(rows[0], { onConflict: rows[2] })
  if (error) throw error
}
console.log(`Seeded ${instructors.length} instructors, ${workshopSeeds.length} workshops and ${sessionRows.length} sessions.`)
