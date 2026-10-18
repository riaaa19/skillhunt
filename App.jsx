import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  CATEGORIES, INSTRUCTORS, WORKSHOPS, LOCATIONS, loadWorkshops, instructorById,
  nextSession, fmtDate, fmtPrice, resolveWorkshopPhoto, resolveInstructorPhoto,
} from './data.js'
 
/* ---------- helpers ---------- */
const reduced = () => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
const catColor = (c) => CATEGORIES[c]?.color || '#E7D9F5'
const PAPER = ['#F5B9CA', '#D3E4B1', '#B7E0E5', '#E7D9F5', '#FFF0BD']
const pick = (i) => PAPER[i % PAPER.length]
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const EMPTY = { q: '', cat: 'All', loc: '', ins: '', maxPrice: 0, from: '', to: '' }
 
const getIns = (w) => {
  if (w?.instructor && (w.instructor.name || w.instructor.id)) {
    return {
      id: w.instructor.id,
      name: w.instructor.name,
      bio: w.instructor.bio || '',
      specialty: w.instructor.specialty || '',
      photo: resolveInstructorPhoto(w.instructor),
      color: w.instructor.color || '#D3E4B1',
      note: w.instructor.note || w.instructor.specialty || '',
    }
  }
  const fromStatic = instructorById(w?.instructorId)
  if (fromStatic) return { ...fromStatic, photo: resolveInstructorPhoto(fromStatic) }
  return {
    id: w?.instructorId || '',
    name: 'Instructor',
    bio: '',
    specialty: '',
    photo: resolveInstructorPhoto(w),
    color: '#D3E4B1',
    note: '',
  }
}

const matches = (w, f) => {
  const ins = getIns(w)
  const q = f.q.trim().toLowerCase()
  const kw = w.keywords || []
  if (q && ![w.title, w.category, ins.name, w.location, w.description, ...kw].join(' ').toLowerCase().includes(q)) return false
  if (f.cat !== 'All' && w.category !== f.cat) return false
  if (f.loc && w.location !== f.loc) return false
  if (f.ins && w.instructorId !== f.ins && ins.id !== f.ins) return false
  if (f.maxPrice && w.price > f.maxPrice) return false
  if ((f.from || f.to) && !(w.sessions || []).some((s) => (!f.from || s.date >= f.from) && (!f.to || s.date <= f.to))) return false
  return true
}
 
/* Every border in the site goes through Wavy: a hand-wobbled outline drawn on a pseudo-element. */
function Wavy({ as: T = 'div', v = 1, bg = '#FFF8ED', className = '', style, children, innerRef, ...p }) {
  return <T ref={innerRef} className={`wavy w${v} ${className}`} style={{ '--bg': bg, ...style }} {...p}>{children}</T>
}
 
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced() || !('IntersectionObserver' in window)) { el?.classList.add('in'); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect() } }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}
function Section({ id, className = '', children }) {
  const ref = useReveal()
  return <section id={id} ref={ref} className={`sec reveal ${className}`}><Scatter id={id} />{children}</section>
}
const Tape = ({ c = '#FFF0BD', r = -4, style }) => <span className="tape" style={{ background: c, transform: `rotate(${r}deg)`, ...style }} aria-hidden="true" />
const Sticker = ({ children, style }) => <span className="sticker" style={style} aria-hidden="true">{children}</span>
const Note = ({ children, style, r = -3 }) => <span className="note" style={{ transform: `rotate(${r}deg)`, ...style }}>{children}</span>
const Arrow = ({ style, flip }) => (
  <svg className="arrow" style={style} viewBox="0 0 120 70" aria-hidden="true" width="110" height="64">
    <path className="draw" pathLength="1" style={{ '--dl': '1.8s' }} d="M4 56 C 30 6, 70 4, 108 38" fill="none" stroke="#292525" strokeWidth="3" strokeLinecap="round" transform={flip ? 'translate(120 0) scale(-1 1)' : ''} />
    <path className="draw" pathLength="1" style={{ '--dl': '2.6s' }} d={flip ? 'M12 28 L 12 40 L 24 38' : 'M96 24 L 109 39 L 91 42'} fill="none" stroke="#292525" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Chip = ({ cat }) => <span className="catchip" style={{ background: catColor(cat) }}>{CATEGORIES[cat]?.emoji || '✦'} {cat}</span>
 
/* ---------- App ---------- */
export default function App() {
  const [workshops, setWorkshops] = useState([])
  const [status, setStatus] = useState('loading')
  const [modal, setModal] = useState(null) // { workshop, sessionId }
  const [reg, setReg] = useState(null) // prefill { workshopId, sessionId }
  const [filters, setFilters] = useState(EMPTY)
  const [sort, setSort] = useState('soonest')
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroWrap = useRef(null), heroIn = useRef(null), featRef = useRef(null)
 
  const load = useCallback(() => {
    setStatus('loading')
    loadWorkshops().then((d) => { setWorkshops(d); setStatus('ok') }).catch(() => setStatus('error'))
  }, [])
  useEffect(load, [load])
 
  // zoom-through-the-scrapbook: hero scales toward the viewer while the featured section settles in
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = 0
      const w = heroWrap.current; if (!w) return
      const vh = window.innerHeight
      setScrolled(window.scrollY > vh * 0.7)
      if (reduced()) return
      const p = Math.min(1, Math.max(0, -w.getBoundingClientRect().top / (w.offsetHeight - vh)))
      const max = window.innerWidth < 760 ? 1.8 : 3.4
      heroIn.current.style.transform = `scale(${1 + p * p * (max - 1)})`
      heroIn.current.style.opacity = String(Math.max(0, 1 - p * 1.25))
      featRef.current?.style.setProperty('--enter', String(0.86 + Math.min(1, p * 1.2) * 0.14))
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick(); window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
 
  const go = (id) => { setMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }) }
  const openWorkshop = (w, sessionId) => setModal({ workshop: w, sessionId: sessionId || nextSession(w).id })
  const startRegister = (w, sessionId) => { setReg({ workshopId: w.id, sessionId, k: Date.now() }); setModal(null); setTimeout(() => go('register'), 60) }
  const filterByInstructor = (id) => { setFilters({ ...EMPTY, ins: id }); setModal(null); setTimeout(() => go('catalogue'), 60) }
 
  return (
    <>
      <Defs />
      <a href="#catalogue" className="skip">Skip to workshops</a>
      <Nav scrolled={scrolled} menu={menu} setMenu={setMenu} go={go} />
      <main>
        <div ref={heroWrap} className="zoomwrap">
          <div className="zoomstick"><div ref={heroIn} className="zoomin grid-paper"><Hero go={go} /></div></div>
        </div>
        <div ref={featRef} className="featwrap"><Featured workshops={workshops} open={openWorkshop} reg={startRegister} /></div>
        <Catalogue {...{ workshops, status, load, filters, setFilters, sort, setSort, open: openWorkshop }} />
        <Instructors workshops={workshops} open={openWorkshop} onAll={filterByInstructor} />
        <CalendarSection workshops={workshops} open={openWorkshop} />
        <Community />
        <Register workshops={workshops} prefill={reg} />
      </main>
      <Footer go={go} />
      {modal && <WorkshopModal {...modal} onClose={() => setModal(null)} onRegister={startRegister} onInstructor={filterByInstructor} />}
    </>
  )
}
 
/* SVG filters that wobble outlines. Three variants so no two borders feel identical. */
function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      {[[1, '0.018', 5], [2, '0.03', 6], [3, '0.012', 8]].map(([n, f, s]) => (
        <filter key={n} id={`wob${n}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={f} numOctaves="2" seed={n * 7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={s} />
        </filter>
      ))}
    </svg>
  )
}
 
/* ---------- Nav ---------- */
const LINKS = [['Explore', 'catalogue'], ['Instructors', 'instructors'], ['Calendar', 'calendar'], ['Community', 'community']]
function Nav({ scrolled, menu, setMenu, go }) {
  return (
    <header className="nav-outer">
      <Wavy as="nav" v={2} bg={scrolled ? '#F5B9CA' : '#FFF8ED'} className="nav" aria-label="Main">
        <a href="#top" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>skillhunt<span>.</span></a>
        <ul className={`navlinks ${menu ? 'open' : ''}`}>
          {LINKS.map(([l, id]) => <li key={id}><button className="linkbtn" onClick={() => go(id)}>{l}</button></li>)}
          <li className="navcta-m"><button className="btn crimson" onClick={() => go('catalogue')}>Find a workshop</button></li>
        </ul>
        <button className="btn crimson navcta" onClick={() => go('catalogue')}>Find a workshop</button>
        <button className="burger" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu(!menu)}>{menu ? '✕' : '☰'}</button>
      </Wavy>
    </header>
  )
}
 
/* ---------- Hero ---------- */
// One hand-drawn doodle: wrapper handles mouse parallax, svg handles its own animation.
const D = ({ vb = '0 0 60 60', w = 60, depth = 10, cls = '', color = '#292525', style, children }) => {
  const [, , vw, vh] = vb.split(' ').map(Number)
  return (
    <span className="px" style={{ '--d': depth, color, ...style }} aria-hidden="true">
      <svg className={`dd ${cls}`} viewBox={vb} width={w} height={(w * vh) / vw} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </span>
  )
}
const P = ({ d, dl = 1.2, ...r }) => <path className="draw" pathLength="1" d={d} style={{ '--dl': `${dl}s` }} {...r} />
 
/* Small, faint background doodles scattered around each section (layout picked per section id). */
const GLYPH = {
  spiral: <P dl={0.2} d="M32 30c0-5 7-6 9-2s-1 11-7 12-15-4-14-14 11-17 22-14 17 14 13 24" />,
  plus: <P dl={0.2} d="M30 8v44M8 30h44" />,
  zig: <P dl={0.2} d="M4 40l13-26 13 26 13-26 13 26" />,
  squig: <P dl={0.2} d="M2 30q9-18 18 0t18 0 18 0" />,
  loop: <P dl={0.2} d="M10 42c-4-22 26-34 34-14s-22 30-28 6" />,
  heart: <path d="M30 52C4 34 6 10 22 10c6 0 8 6 8 8 0-2 4-8 10-8 16 0 16 24-10 42z" fill="currentColor" fillOpacity=".25" />,
  star: <path d="M30 4Q33 27 56 30Q33 33 30 56Q27 33 4 30Q27 27 30 4Z" fill="currentColor" fillOpacity=".3" />,
  flower: <>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx="30" cy="14" r="9" transform={`rotate(${a} 30 30)`} />)}<circle cx="30" cy="30" r="5" /></>,
  burst: <path d="M30 6v10M30 44v10M6 30h10M44 30h10M13 13l7 7M40 40l7 7M47 13l-7 7M20 40l-7 7" />,
}
const INK = { r: '#A91B32', t: '#5a9aa3', g: '#7aa23d', k: '#292525', p: '#d77f99' }
// [glyph, colour, top, left, size, motion]
const LAYOUTS = [
  [['spiral', 'r', '3%', '1%', 54, ''], ['star', 't', '8%', '92%', 40, 'twinkle'], ['zig', 'g', '55%', '95%', 64, ''], ['plus', 'k', '78%', '3%', 30, 'bob'], ['heart', 'p', '92%', '88%', 44, 'pulse']],
  [['flower', 'g', '6%', '93%', 50, 'spin'], ['squig', 't', '30%', '1%', 70, 'wiggle'], ['star', 'r', '62%', '94%', 36, 'twinkle'], ['loop', 'k', '88%', '2%', 54, ''], ['plus', 'r', '12%', '3%', 28, 'bob']],
  [['burst', 'r', '4%', '2%', 48, 'spin'], ['heart', 'p', '20%', '95%', 40, 'pulse'], ['zig', 't', '48%', '0%', 60, ''], ['star', 'g', '75%', '93%', 38, 'twinkle'], ['spiral', 'k', '94%', '5%', 50, '']],
]
function Scatter({ id = '' }) {
  const set = LAYOUTS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % LAYOUTS.length]
  return (
    <div className="scatter" aria-hidden="true">
      {set.map(([g, c, top, left, w, m], i) => (
        <D key={i} w={w} depth={8 + i * 3} color={INK[c]} cls={m} style={{ top, left, animationDelay: `${i * 0.6}s` }}>{GLYPH[g]}</D>
      ))}
    </div>
  )
}
function Hero({ go }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced() || window.matchMedia('(pointer: coarse)').matches) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 2)
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 2)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [])
  const words = 'you were never meant to do just one thing.'.split(' ')
  return (
    <div className="hero" id="top" ref={ref}>
      {/* marching dotted trail running behind everything */}
      <svg className="hero-trail" viewBox="0 0 1300 800" preserveAspectRatio="none" aria-hidden="true">
        <path className="trail" d="M-20 720 C 200 560, 260 780, 430 650 S 650 430, 770 530 S 990 780, 1110 570 S 1260 300, 1340 380" fill="none" stroke="#7fc0c9" strokeWidth="3" strokeLinecap="round" />
      </svg>
 
      <D w={54} depth={14} color="#A91B32" cls="spin" style={{ top: '12%', left: '3%' }}><path d="M30 6v10M30 44v10M6 30h10M44 30h10M13 13l7 7M40 40l7 7M47 13l-7 7M20 40l-7 7" /></D>
      <D w={64} depth={20} color="#A91B32" style={{ top: '30%', left: '1%' }}><P dl={1.4} d="M32 30c0-5 7-6 9-2s-1 11-7 12-15-4-14-14 11-17 22-14 17 14 13 24" /></D>
      <D w={58} depth={16} color="#292525" style={{ top: '9%', left: '47%' }}>
        <P dl={1.6} d="M24 44c-8-5-10-12-8-19s9-12 17-11 13 8 11 16-6 11-10 14z" /><P dl={2} d="M26 51h14M28 57h10M32 2v5M8 10l4 4M56 10l-4 4M3 28h5M58 28h5" /></D>
      <D vb="0 0 40 40" w={34} depth={26} color="#5a9aa3" cls="twinkle" style={{ top: '9%', right: '3%' }}><path d="M20 2Q22 18 38 20Q22 22 20 38Q18 22 2 20Q18 18 20 2Z" fill="currentColor" /></D>
      <D vb="0 0 40 40" w={22} depth={34} color="#A91B32" cls="twinkle" style={{ top: '22%', right: '47%', animationDelay: '1s' }}><path d="M20 2Q22 18 38 20Q22 22 20 38Q18 22 2 20Q18 18 20 2Z" fill="currentColor" /></D>
      <D vb="0 0 40 40" w={26} depth={30} color="#7aa23d" cls="twinkle" style={{ bottom: '24%', right: '2%', animationDelay: '.5s' }}><path d="M20 2Q22 18 38 20Q22 22 20 38Q18 22 2 20Q18 18 20 2Z" fill="currentColor" /></D>
      <D vb="0 0 60 56" w={44} depth={22} color="#A91B32" cls="pulse" style={{ bottom: '22%', left: '47%' }}><path d="M30 52C4 34 6 10 22 10c6 0 8 6 8 8 0-2 4-8 10-8 16 0 16 24-10 42z" fill="#F5B9CA" /></D>
      <D vb="0 0 80 30" w={92} depth={18} color="#7aa23d" style={{ bottom: '6%', left: '52%' }}><P dl={2.2} d="M3 24l12-18 12 18 12-18 12 18 12-18 12 18" /></D>
      <D vb="0 0 80 24" w={96} depth={12} color="#5a9aa3" cls="wiggle" style={{ top: '59%', left: '33%' }}><path d="M2 12q9-14 18 0t18 0 18 0 18 0" /></D>
      <D vb="0 0 60 60" w={46} depth={24} color="#7aa23d" cls="spin" style={{ bottom: '8%', left: '40%' }}>
        {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx="30" cy="14" r="9" fill="#D3E4B1" transform={`rotate(${a} 30 30)`} />)}<circle cx="30" cy="30" r="6" fill="#FFF0BD" /></D>
      {[['18%', '44%', 8], ['66%', '40%', 16], ['78%', '8%', 22]].map(([t, l, d], i) => (
        <D key={i} vb="0 0 20 20" w={16} depth={d} color="#292525" cls="bob" style={{ top: t, left: l, animationDelay: `${i}s` }}><path d="M10 2v16M2 10h16" /></D>
      ))}
 
      <div className="hero-copy">
        <h1 className="display">
          {words.map((w, i) => (
            <span key={i} className="word" style={{ '--i': i }}>
              {['never', 'meant'].includes(w) ? <span className="hl">{w}</span> : w}
            </span>
          ))}
        </h1>
        <p className="lede">Discover workshops, explore unexpected interests and meet people who love creating as much as you do.</p>
        <div className="btnrow">
          <span className="btnwrap">
            <button className="btn crimson big" onClick={() => go('catalogue')}>Find your next obsession</button>
            <svg className="scribble" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <P dl={2.4} d="M20 14C80-4 230-2 284 22c14 14 4 44-30 54-60 14-190 10-244-6C-8 56-2 24 40 12" /></svg>
          </span>
          <button className="btn big" style={{ '--bg': '#D3E4B1' }} onClick={() => go('featured')}>Explore workshops</button>
        </div>
        <Note style={{ position: 'absolute', left: '2%', bottom: '-38px' }}>psst, no experience needed</Note>
        <Arrow style={{ position: 'absolute', left: '40%', bottom: '-62px', transform: 'rotate(-28deg)' }} />
      </div>
 
      <div className="collage" aria-hidden="true">
        <span className="badge"><svg viewBox="0 0 120 120" width="112" height="112">
          <defs><path id="circ" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
          <circle cx="60" cy="60" r="56" fill="#FFF0BD" stroke="#292525" strokeWidth="2.5" />
          <text fontFamily="DM Sans" fontWeight="700" fontSize="12.5" letterSpacing="2" fill="#292525"><textPath href="#circ">make · try · mess up · repeat · </textPath></text></svg>
          <b>✺</b></span>
        {[['heropot', '#D3E4B1', 'c1'], ['heropaint', '#F5B9CA', 'c2'], ['herocam', '#B7E0E5', 'c3']].map(([s, c, k], i) => (
          <Wavy key={k} v={i + 1} bg={c} className={`cut ${k}`}>
            <img src={`https://picsum.photos/seed/${s}/500/600`} alt="" width="500" height="600" />
            <Tape c={pick(i + 3)} r={i % 2 ? 6 : -6} style={{ top: -12, left: '30%' }} />
          </Wavy>
        ))}
        <Sticker style={{ top: '6%', right: '8%' }}>🎨</Sticker><Sticker style={{ bottom: '10%', left: '4%', animationDelay: '1.7s,.4s' }}>🏺</Sticker>
        <Sticker style={{ top: '44%', right: '-3%', width: 48, height: 48, fontSize: '1.4rem', animationDelay: '1.9s,1s' }}>📷</Sticker>
        <Arrow style={{ position: 'absolute', left: '-6%', top: '48%' }} />
        <Note style={{ position: 'absolute', right: 0, bottom: '2%' }} r={4}>try something new!</Note>
      </div>
    </div>
  )
}
 
/* ---------- Featured: pinned stack of scrapbook pages that flip up and away on scroll ---------- */
const NOTES = ['beginner friendly!', 'bring a friend', 'limited seats', 'new this season']
function Featured({ workshops, open, reg }) {
  const items = useMemo(() => workshops.filter((w) => w.isFeatured).slice(0, 4), [workshops])
  const n = items.length
  const rm = useMemo(() => reduced(), [])
  const track = useRef(null), pages = useRef([]), last = useRef(0)
  const [cur, setCur] = useState(0)
 
  useEffect(() => {
    if (!n || rm) return
    let raf = 0
    const tick = () => {
      raf = 0
      const tr = track.current; if (!tr) return
      const span = tr.offsetHeight - window.innerHeight
      const t = Math.min(1, Math.max(0, -tr.getBoundingClientRect().top / span)) * (n - 1)
      const mob = window.innerWidth < 760
      pages.current.forEach((el, i) => {
        if (!el) return
        const p = i < n - 1 ? Math.min(1, Math.max(0, t - i)) : 0 // how far this page has flipped away
        const d = Math.min(2, Math.max(0, i - t)) // how far back it waits in the stack
        // hinged at the top edge: tips back in perspective, compresses upward, then fades out
        el.style.transform = `translateY(calc(${-p * 64}% + ${d * 22}px)) rotateX(${p * (mob ? 34 : 46)}deg) scale(${1 - d * 0.05}, ${1 - p * 0.55})`
        el.style.opacity = String(1 - Math.max(0, p - 0.72) * 3.6)
        el.style.zIndex = String(n - i)
      })
      const c = Math.round(t)
      if (c !== last.current) { last.current = c; setCur(c) }
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick(); window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [n, rm])
 
  useEffect(() => { pages.current.forEach((el, i) => el && !rm && el.toggleAttribute('inert', i !== cur)) }, [cur, rm, n])
 
  if (!n) return <Section id="featured"><h2 className="h2">featured this season.</h2></Section>
  const goTo = (i) => {
    i = Math.min(n - 1, Math.max(0, i))
    if (rm) return pages.current[i]?.scrollIntoView({ block: 'center' })
    const tr = track.current, span = tr.offsetHeight - window.innerHeight
    window.scrollTo({ top: window.scrollY + tr.getBoundingClientRect().top + (i / (n - 1)) * span + 2, behavior: 'smooth' })
  }
  return (
    <>
      <div ref={track} id="featured" className={`ftrack ${rm ? 'static' : ''}`} style={rm ? undefined : { height: `${n * 100}vh` }}>
        <div className="fstick">
          <div className="fhead"><h2 className="h2">featured this season.</h2><p className="sub">Keep scrolling. Each page folds away to reveal the next.</p></div>
          <div className="pgstage">
            {items.map((w, i) => {
              const s = nextSession(w) || w.sessions?.[0] || { date: '2026-10-21', time: '10:00 – 12:00' }
              const ins = getIns(w)
              return (
                <Wavy key={w.id} v={(i % 3) + 1} bg={pick(i + 1)} className="pg" innerRef={(el) => (pages.current[i] = el)} style={{ zIndex: n - i }}
                  aria-label={`Featured workshop ${i + 1} of ${n}: ${w.title}`}>
                  <div className="pgtxt">
                    <Chip cat={w.category} />
                    <h3>{w.title}</h3>
                    <p className="meta big">with {ins.name}<br />{fmtDate(s.date)} · {s.time}<br />{w.location}</p>
                    <div className="frow" style={{ justifyContent: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <strong className="price">{fmtPrice(w.price)}</strong>
                      <button className="btn crimson" onClick={() => reg(w, s.id)}>Register</button>
                      <button className="btn" style={{ '--bg': '#fff' }} onClick={() => open(w)}>Discover</button>
                    </div>
                  </div>
                  <div className="pgcol">
                    <Wavy v={((i + 1) % 3) + 1} bg="#fff" className="pgmain"><img src={resolveWorkshopPhoto(w)} alt={w.title} loading={i ? 'lazy' : undefined} width="900" height="700" />
                      <Tape c={pick(i + 3)} r={i % 2 ? 6 : -6} style={{ top: -12, left: '36%' }} /></Wavy>
                    <Wavy v={((i + 2) % 3) + 1} bg={ins.color || '#D3E4B1'} className="pgsub"><img src={resolveInstructorPhoto(ins)} alt="" loading="lazy" width="500" height="600" /></Wavy>
                    <Sticker style={{ right: '2%', top: '-2%' }}>{CATEGORIES[w.category]?.emoji || '✦'}</Sticker>
                    <Note style={{ position: 'absolute', right: '4%', bottom: '2%' }} r={i % 2 ? 5 : -5}>{NOTES[i]}</Note>
                  </div>
                </Wavy>
              )
            })}
          </div>
          <div className="fctl" role="group" aria-label="Featured workshops">
            <button className="btn small" aria-label="Previous workshop" disabled={cur === 0} onClick={() => goTo(cur - 1)}>←</button>
            <span className="note" aria-live="polite">{cur + 1} / {n}</span>
            {items.map((w, i) => <button key={w.id} className={`pip ${i === cur ? 'on' : ''}`} aria-label={`Go to ${w.title}`} aria-current={i === cur} onClick={() => goTo(i)} />)}
            <button className="btn small" aria-label="Next workshop" disabled={cur === n - 1} onClick={() => goTo(cur + 1)}>→</button>
          </div>
        </div>
      </div>
    </>
  )
}
 
/* ---------- Filters (shared by catalogue + calendar) ---------- */
function Field({ label, children, v = 1 }) {
  return <Wavy as="label" v={v} className="field"><span>{label}</span>{children}</Wavy>
}
function FilterFields({ f, set, workshops = [] }) {
  const u = (k) => (e) => set({ ...f, [k]: k === 'maxPrice' ? Number(e.target.value) : e.target.value })
  const locs = useMemo(() => {
    const list = [...new Set(workshops.map((w) => w.location).filter(Boolean))]
    return list.length ? list : LOCATIONS
  }, [workshops])
  const inss = useMemo(() => {
    const map = new Map()
    for (const w of workshops) {
      const ins = getIns(w)
      if (ins?.id && !map.has(ins.id)) map.set(ins.id, ins)
    }
    return map.size ? Array.from(map.values()) : INSTRUCTORS
  }, [workshops])
  return (
    <>
      <Field label="Location" v={1}><select value={f.loc} onChange={u('loc')}><option value="">Anywhere</option>{locs.map((l) => <option key={l}>{l}</option>)}</select></Field>
      <Field label="Price" v={2}><select value={f.maxPrice} onChange={u('maxPrice')}><option value={0}>Any price</option>{[1000, 1500, 2000].map((p) => <option key={p} value={p}>Up to {fmtPrice(p)}</option>)}</select></Field>
      <Field label="Instructor" v={3}><select value={f.ins} onChange={u('ins')}><option value="">Anyone</option>{inss.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>
      <Field label="Type" v={1}><select value={f.cat} onChange={u('cat')}><option value="All">All types</option>{Object.keys(CATEGORIES).map((c) => <option key={c}>{c}</option>)}</select></Field>
    </>
  )
}
 
/* ---------- Catalogue ---------- */
function Catalogue({ workshops, status, load, filters: f, setFilters, sort, setSort, open }) {
  const [adv, setAdv] = useState(false)
  const set = setFilters
  const list = useMemo(() => {
    const r = workshops.filter((w) => matches(w, f))
    const key = (w) => (nextSession(w) || w.sessions?.[0] || { date: '9999-99-99' }).date
    return r.sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : key(a).localeCompare(key(b)))
  }, [workshops, f, sort])
  const active = JSON.stringify(f) !== JSON.stringify(EMPTY)
  return (
    <Section id="catalogue">
      <h2 className="h2">something you haven't tried yet.</h2>
      <div className="toolbar">
        <Wavy as="label" v={2} className="field search" bg="#fff"><span className="sr">Search workshops</span>
          <input type="search" placeholder="Search title, category, instructor, place…" value={f.q} onChange={(e) => set({ ...f, q: e.target.value })} /></Wavy>
        <Field label="Sort" v={3}><select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="soonest">Soonest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></Field>
        <button className="btn" style={{ '--bg': '#B7E0E5' }} aria-expanded={adv} aria-controls="adv" onClick={() => setAdv(!adv)}>{adv ? 'Hide filters' : 'More filters'}</button>
      </div>
      <div className="chips" role="group" aria-label="Categories">
        {['All', ...Object.keys(CATEGORIES)].map((c) => (
          <button key={c} className={`btn small chip ${f.cat === c ? 'on' : ''}`} aria-pressed={f.cat === c} style={{ '--bg': c === 'All' ? '#FFF0BD' : catColor(c) }} onClick={() => set({ ...f, cat: c })}>
            {c === 'All' ? 'All Workshops' : c}</button>
        ))}
      </div>
      {adv && (
        <Wavy id="adv" v={1} bg="#E7D9F5" className="advpanel">
          <FilterFields f={f} set={set} workshops={workshops} />
          <Field label="From" v={2}><input type="date" value={f.from} onChange={(e) => set({ ...f, from: e.target.value })} /></Field>
          <Field label="To" v={3}><input type="date" value={f.to} min={f.from} onChange={(e) => set({ ...f, to: e.target.value })} /></Field>
        </Wavy>
      )}
      <p className="count" aria-live="polite">{status === 'ok' && `${list.length} workshop${list.length === 1 ? '' : 's'}`}
        {active && <button className="linkbtn" onClick={() => set(EMPTY)}>Clear filters</button>}</p>
      {status === 'loading' && <div className="grid">{[0, 1, 2].map((i) => <Wavy key={i} v={i + 1} bg={pick(i)} className="wcard skeleton" aria-busy="true"><div className="ph" /></Wavy>)}</div>}
      {status === 'error' && <Wavy bg="#F5B9CA" className="state" role="alert"><h3>We couldn't load workshops.</h3><p>Check your connection and try again.</p><button className="btn crimson" onClick={load}>Try again</button></Wavy>}
      {status === 'ok' && list.length === 0 && <Wavy bg="#FFF0BD" className="state"><h3>Nothing matches yet.</h3><p>Loosen a filter or search a different word.</p><button className="btn" style={{ '--bg': '#fff' }} onClick={() => set(EMPTY)}>Clear filters</button></Wavy>}
      {status === 'ok' && list.length > 0 && (
        <div className="grid">
          {list.map((w, i) => {
            const s = nextSession(w) || w.sessions?.[0] || { date: '2026-10-21', time: '10:00 – 12:00' }
            const ins = getIns(w)
            return (
              <Wavy key={w.id} v={(i % 3) + 1} bg={pick(i)} className="wcard" style={{ '--r': `${[-1.2, 0.8, -0.5, 1.4][i % 4]}deg` }}>
                <img src={resolveWorkshopPhoto(w)} alt="" loading="lazy" width="900" height="700" />
                <div className="wbody"><Chip cat={w.category} /><h3>{w.title}</h3>
                  <p className="meta">{ins.name} · {w.location}<br />Next: {fmtDate(s.date)}, {s.time}</p>
                  <div className="frow"><strong>{fmtPrice(w.price)}</strong><button className="btn small crimson" onClick={() => open(w)}>Details</button></div></div>
              </Wavy>
            )
          })}
        </div>
      )}
    </Section>
  )
}
 
/* ---------- Instructors ---------- */
function Instructors({ workshops, open, onAll }) {
  const [sel, setSel] = useState(null)
  const close = useCallback(() => setSel(null), [])
  const list = useMemo(() => {
    const map = new Map()
    for (const w of workshops) {
      const ins = getIns(w)
      if (ins.id && !map.has(ins.id) && ins.name !== 'Instructor') {
        map.set(ins.id, {
          ...ins,
          color: ins.color || pick(map.size),
          note: ins.note || ins.specialty || 'Maker & Mentor',
        })
      }
    }
    return map.size ? Array.from(map.values()) : INSTRUCTORS
  }, [workshops])
  return (
    <Section id="instructors">
      <h2 className="h2">the people behind the magic.</h2>
      <p className="sub">Meet the artists, craftspeople and makers leading our sessions.</p>
      <div className="igrid">
        {list.map((p, i) => (
          <Wavy key={p.id} v={(i % 3) + 1} bg={p.color || pick(i)} className="icard" style={{ '--r': `${[-1.5, 1, -0.6][i % 3]}deg` }}>
            <Wavy v={((i + 1) % 3) + 1} bg="#fff" className="portrait"><img src={resolveInstructorPhoto(p)} alt={`Portrait of ${p.name}`} loading="lazy" width="500" height="600" /></Wavy>
            <h3>{p.name}</h3><p className="spec">{p.specialty}</p>
            <Note r={i % 2 ? 3 : -3}>{p.note}</Note>
            <button className="btn small" style={{ '--bg': '#fff' }} aria-haspopup="dialog" onClick={() => setSel(p)}>View profile</button>
          </Wavy>
        ))}
      </div>
      {sel && <InstructorModal p={sel} workshops={workshops} onClose={close}
        onWorkshop={(w) => { close(); open(w) }} onAll={(id) => { close(); onAll(id) }} />}
    </Section>
  )
}
function InstructorModal({ p, workshops, onClose, onWorkshop, onAll }) {
  const ref = useRef(null)
  useDialog(ref, onClose)
  const mine = workshops.filter((w) => w.instructorId === p.id || w.instructor?.id === p.id)
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Wavy v={3} bg={p.color || '#D3E4B1'} className="modal imodal" role="dialog" aria-modal="true" aria-labelledby="it" innerRef={ref}>
        <button className="btn small closebtn" aria-label="Close" onClick={onClose}>✕</button>
        <Wavy v={1} bg="#fff" className="portrait"><img src={resolveInstructorPhoto(p)} alt={`Portrait of ${p.name}`} width="500" height="600" /></Wavy>
        <div className="mbody">
          <h2 id="it" className="mtitle">{p.name}</h2>
          <p className="spec">{p.specialty}</p>
          <Note>{p.note}</Note>
          <p>{p.bio}</p>
          <p className="meta">Upcoming workshops</p>
          <ul>{mine.map((w) => <li key={w.id}><button className="linkbtn" onClick={() => onWorkshop(w)}>{w.title}</button></li>)}</ul>
          <button className="btn crimson" onClick={() => onAll(p.id)}>See all in catalogue</button>
        </div>
      </Wavy>
    </div>
  )
}
 
/* ---------- Calendar ---------- */
function CalendarSection({ workshops, open }) {
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [sel, setSel] = useState(todayISO())
  const [view, setView] = useState('month')
  const [f, setF] = useState(EMPTY)
  const sessions = useMemo(() => workshops.filter((w) => matches(w, f)).flatMap((w) => w.sessions.map((s) => ({ ...s, w }))).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)), [workshops, f])
  const byDate = useMemo(() => sessions.reduce((m, s) => ((m[s.date] ||= []).push(s), m), {}), [sessions])
  const first = new Date(ym.y, ym.m, 1), days = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)]
  const shift = (d) => { const x = new Date(ym.y, ym.m + d, 1); setYm({ y: x.getFullYear(), m: x.getMonth() }) }
  const upcoming = sessions.filter((s) => s.date >= todayISO())
  const Row = ({ s }) => (
    <li><button className="evt" style={{ '--bg': catColor(s.w.category) }} onClick={() => open(s.w, s.id)}>
      <strong>{s.w.title}</strong><span>{fmtDate(s.date)} · {s.time} · {s.w.location}</span></button></li>
  )
  return (
    <Section id="calendar">
      <h2 className="h2">make room for something new.</h2>
      <Wavy v={3} bg="#FFF8ED" className="calpanel">
        <div className="calhead">
          <div className="callnav"><button className="btn small" aria-label="Previous month" onClick={() => shift(-1)}>←</button>
            <h3 aria-live="polite">{first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
            <button className="btn small" aria-label="Next month" onClick={() => shift(1)}>→</button></div>
          <div className="toggle" role="group" aria-label="Calendar view">
            {[['month', 'Month'], ['list', 'Upcoming']].map(([k, l]) => <button key={k} aria-pressed={view === k} className={`btn small ${view === k ? 'on' : ''}`} style={{ '--bg': '#B7E0E5' }} onClick={() => setView(k)}>{l}</button>)}</div>
        </div>
        <div className="calfilters"><FilterFields f={f} set={setF} workshops={workshops} />
          {JSON.stringify(f) !== JSON.stringify(EMPTY) && <button className="linkbtn" onClick={() => setF(EMPTY)}>Clear</button>}</div>
        {view === 'month' ? (
          <div className="calbody">
            <div className="calgrid" role="grid" aria-label="Workshop calendar">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="wd" role="columnheader">{d}</div>)}
              {cells.map((d, i) => d ? (
                <button key={d} role="gridcell" className={`day ${d === todayISO() ? 'today' : ''} ${d === sel ? 'sel' : ''}`} aria-label={`${fmtDate(d, { day: 'numeric', month: 'long' })}, ${(byDate[d] || []).length} workshops`} aria-pressed={d === sel} onClick={() => setSel(d)}>
                  <span>{Number(d.slice(8))}</span>
                  <i className="dots">{(byDate[d] || []).slice(0, 4).map((s) => <b key={s.id} style={{ background: catColor(s.w.category) }} />)}</i>
                </button>) : <div key={`e${i}`} />)}
            </div>
            <aside className="dayevents"><h4>{fmtDate(sel, { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
              {(byDate[sel] || []).length ? <ul>{byDate[sel].map((s) => <Row key={s.id} s={s} />)}</ul> : <p className="meta">Nothing scheduled. Pick a dotted day.</p>}</aside>
          </div>
        ) : (upcoming.length ? <ul className="evlist">{upcoming.map((s) => <Row key={s.id} s={s} />)}</ul> : <p className="state">No upcoming workshops match these filters.</p>)}
        <div className="legend">{Object.keys(CATEGORIES).map((c) => <span key={c}><b style={{ background: catColor(c) }} />{c}</span>)}</div>
      </Wavy>
    </Section>
  )
}
 
/* ---------- Community ---------- */
const QUOTES = [
  ['I only came for the pottery and stayed for the people.', 'Sample participant'],
  ['I haven\'t picked up a paintbrush since school. Three hours flew by.', 'Sample participant'],
  ['Brought my phone, left with an eye for light.', 'Sample participant'],
]
function Community() {
  const [q, setQ] = useState(0)
  return (
    <Section id="community" className="community">
      <h2 className="h2">good things happen when you try.</h2>
      <div className="cgrid">
        {['commA', 'commB', 'commC', 'commD'].map((s, i) => (
          <Wavy key={s} v={(i % 3) + 1} bg={pick(i)} className={`cph cp${i}`}><img src={`https://picsum.photos/seed/${s}/600/600`} alt="Sample community photo" loading="lazy" width="600" height="600" />
            {i < 2 && <Tape c={pick(i + 2)} r={i ? 6 : -6} style={{ top: -12, left: '35%' }} />}</Wavy>
        ))}
        <Sticker style={{ left: '40%', top: '-2%' }}>✿</Sticker>
        <Wavy v={2} bg="#FFF0BD" className="quote" aria-live="polite">
          <p>“{QUOTES[q][0]}”</p><Note r={-2}>{QUOTES[q][1]}</Note>
          <div className="fctl"><button className="btn small" aria-label="Previous quote" onClick={() => setQ((q + 2) % 3)}>←</button>
            <button className="btn small" aria-label="Next quote" onClick={() => setQ((q + 1) % 3)}>→</button></div>
          <small>Illustrative demo copy, not real testimonials.</small></Wavy>
      </div>
    </Section>
  )
}
 
/* ---------- Registration (frontend only: the backend must confirm saving) ---------- */
const API = import.meta.env.VITE_API_URL || ''
function Register({ workshops, prefill }) {
  const blank = { name: '', email: '', phone: '', workshopId: '', sessionId: '' }
  const [v, setV] = useState(blank)
  const [err, setErr] = useState({})
  const [state, setState] = useState('idle') // idle | loading | success | error
  const [msg, setMsg] = useState('')
  useEffect(() => { if (prefill) setV((x) => ({ ...x, workshopId: prefill.workshopId, sessionId: prefill.sessionId })) }, [prefill])
  const w = workshops.find((x) => x.id === v.workshopId)
  const validate = () => {
    const e = {}
    if (v.name.trim().length < 2) e.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Enter a valid email, like you@example.com.'
    if (v.phone && !/^[+\d][\d\s-]{8,14}$/.test(v.phone)) e.phone = 'Enter 10 digits, with an optional country code.'
    if (!v.workshopId) e.workshopId = 'Choose a workshop.'
    else if (!v.sessionId) e.sessionId = 'Choose a session.'
    return e
  }
  const submit = async (ev) => {
    ev.preventDefault()
    if (state === 'loading') return // blocks double submits
    const e = validate(); setErr(e); if (Object.keys(e).length) return
    setState('loading'); setMsg('')
    try {
      const res = await fetch(`${API}/api/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participant_name: v.name.trim(), email: v.email.trim().toLowerCase(), phone: v.phone.trim(), workshop_id: v.workshopId, session_id: v.sessionId }) })
      const data = await res.json().catch(() => ({}))
      if (res.status === 400 && data.error?.fields) { setErr(Object.fromEntries(Object.entries(data.error.fields).map(([k, x]) => [k === 'participant_name' ? 'name' : k === 'workshop_id' ? 'workshopId' : k === 'session_id' ? 'sessionId' : k, x?.[0]]))); setState('idle'); return }
      if (res.status === 409) { setState('error'); setMsg(data.error?.code === 'CAPACITY' ? 'This session is full.' : data.error?.code === 'SESSION_EXPIRED' ? 'This session has already ended.' : 'You\'re already registered for this session.'); return }
      if (!res.ok || !data.data?.id) throw new Error('not saved')
      setState('success'); setV(blank)
    } catch {
      setState('error'); setMsg('We couldn\'t save your registration, so nothing was booked. Please try again in a moment.')
    }
  }
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value, ...(k === 'workshopId' ? { sessionId: '' } : {}) })
  const F = ({ k, label, v: vv, children }) => (
    <div className="rfield"><Field label={label} v={vv}>{children}</Field>{err[k] && <p className="err" id={`e-${k}`} role="alert">{err[k]}</p>}</div>
  )
  return (
    <Section id="register" className="register">
      <Wavy v={1} bg="#B7E0E5" className="regpanel">
        <span className="px" style={{ top: 16, left: 22, fontSize: '2rem', color: '#A91B32' }} aria-hidden="true">✦</span><Arrow style={{ position: 'absolute', right: '6%', top: '2%' }} flip />
        <h2 className="h2">your next thing starts here.</h2>
        {state === 'success' ? (
          <Wavy bg="#D3E4B1" className="state" role="status"><h3>You're registered.</h3><p>The server confirmed your spot. Check your inbox for details.</p>
            <button className="btn" style={{ '--bg': '#fff' }} onClick={() => setState('idle')}>Register for another</button></Wavy>
        ) : (
          <form onSubmit={submit} noValidate className="rform">
            <F k="name" label="Your name" v={1}><input value={v.name} onChange={set('name')} autoComplete="name" aria-invalid={!!err.name} aria-describedby="e-name" /></F>
            <F k="email" label="Email" v={2}><input type="email" value={v.email} onChange={set('email')} autoComplete="email" aria-invalid={!!err.email} aria-describedby="e-email" /></F>
            <F k="phone" label="Phone (optional)" v={3}><input type="tel" value={v.phone} onChange={set('phone')} autoComplete="tel" aria-invalid={!!err.phone} aria-describedby="e-phone" /></F>
            <F k="workshopId" label="Workshop" v={1}><select value={v.workshopId} onChange={set('workshopId')} aria-invalid={!!err.workshopId} aria-describedby="e-workshopId"><option value="">Choose a workshop</option>{workshops.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select></F>
            <F k="sessionId" label="Session" v={2}><select value={v.sessionId} onChange={set('sessionId')} disabled={!w} aria-invalid={!!err.sessionId} aria-describedby="e-sessionId"><option value="">{w ? 'Choose a date' : 'Pick a workshop first'}</option>{w?.sessions.map((s) => <option key={s.id} value={s.id}>{fmtDate(s.date)} · {s.time}</option>)}</select></F>
            {state === 'error' && <p className="err big" role="alert">{msg}</p>}
            <button className="btn crimson big" disabled={state === 'loading'}>{state === 'loading' ? 'Saving your spot…' : 'Save my spot'}</button>
          </form>
        )}
      </Wavy>
    </Section>
  )
}
 
/* ---------- Footer ---------- */
function Footer({ go }) {
  const email = import.meta.env.VITE_CONTACT_EMAIL, insta = import.meta.env.VITE_INSTAGRAM_URL
  return (
    <footer className="footer">
      <svg className="footwave" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V28C60 8 120 8 180 28s120 20 180 0 120-20 180 0 120 20 180 0 120-20 180 0 120 20 180 0 120-20 120-20V60Z" fill="#292525" /></svg>
      <div className="footin">
        <div><p className="logo light">skillhunt<span>.</span></p><p className="closing">go on, make something messy.</p></div>
        <ul>{LINKS.map(([l, id]) => <li key={id}><button className="linkbtn light" onClick={() => go(id)}>{l}</button></li>)}</ul>
        <ul>{email && <li><a className="linkbtn light" href={`mailto:${email}`}>{email}</a></li>}{insta && <li><a className="linkbtn light" href={insta} target="_blank" rel="noreferrer">Instagram</a></li>}</ul>
      </div>
    </footer>
  )
}
 
/* ---------- Dialog behaviour shared by every pop-up ---------- */
function useDialog(ref, onClose) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const prev = document.activeElement, root = ref.current
    document.body.style.overflow = 'hidden'
    root.querySelector('button')?.focus()
    const key = (e) => {
      if (e.key === 'Escape') return close.current()
      if (e.key !== 'Tab') return
      const f = [...root.querySelectorAll('button,a[href],select,input')].filter((x) => !x.disabled)
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; prev?.focus?.() }
  }, [ref])
}
 
/* ---------- Workshop modal (one reusable dialog) ---------- */
function WorkshopModal({ workshop: w, sessionId, onClose, onRegister, onInstructor }) {
  const [sid, setSid] = useState(sessionId)
  const ref = useRef(null)
  const ins = getIns(w)
  useDialog(ref, onClose)
  const s = w.sessions.find((x) => x.id === sid) || w.sessions[0] || { id: '', date: '2026-10-21', time: '10:00 – 12:00' }
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Wavy v={2} bg="#FFF8ED" className="modal" role="dialog" aria-modal="true" aria-labelledby="mt" innerRef={ref}>
        <ModalInner {...{ w, ins, s, setSid, onClose, onRegister, onInstructor }} />
      </Wavy>
    </div>
  )
}
function ModalInner({ w, ins, s, setSid, onClose, onRegister, onInstructor }) {
  return (
    <>
      <button className="btn small closebtn" aria-label="Close" onClick={onClose}>✕</button>
      <Wavy v={3} bg={catColor(w.category)} className="mimg"><img src={resolveWorkshopPhoto(w)} alt={w.title} width="900" height="700" /></Wavy>
      <div className="mbody">
        <Chip cat={w.category} /><h2 id="mt" className="mtitle">{w.title}</h2>
        <p>{w.description}</p>
        <Wavy v={1} bg={ins.color || '#D3E4B1'} className="mins"><img src={resolveInstructorPhoto(ins)} alt="" width="60" height="72" /><div><strong>{ins.name}</strong><br /><span className="meta">{ins.specialty}</span><br />
          <button className="linkbtn" onClick={() => onInstructor(ins.id)}>More from {ins.name.split(' ')[0]}</button></div></Wavy>
        <Field label="Session" v={2}><select value={s.id} onChange={(e) => setSid(e.target.value)}>{w.sessions.map((x) => <option key={x.id} value={x.id}>{fmtDate(x.date)} · {x.time}</option>)}</select></Field>
        <p className="meta">{fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })}, {s.time}<br />{w.location}</p>
        <div className="frow"><strong className="price">{fmtPrice(w.price)}</strong><button className="btn crimson big" onClick={() => onRegister(w, s.id)}>Register for this session</button></div>
      </div>
    </>
  )
}
 