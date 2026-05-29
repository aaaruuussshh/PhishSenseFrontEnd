import { useState, useEffect, useRef } from 'react'

const C = {
  deepBrown:  '#713600',
  amber:      '#C05800',
  cream:      '#FDFBD4',
  nearBlack:  '#38240D',
  offCream:   '#F5F0C0',
  border:     'rgba(56,36,13,0.15)',
  divider:    'rgba(56,36,13,0.08)',
  bodyMuted:  'rgba(56,36,13,0.70)',
  labelMuted: 'rgba(56,36,13,0.50)',
  dimMuted:   'rgba(56,36,13,0.40)',
  veryMuted:  'rgba(56,36,13,0.30)',
}
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const MONO = '"Courier New", Courier, monospace'

const STEPS = [
  { label: 'Intercepting link',   dots: '...............' },
  { label: 'Unfolding shortener', dots: '.............' },
  { label: 'Opening sandbox',     dots: '................' },
  { label: 'Rendering page',      dots: '..................' },
  { label: 'AI vision analysis',  dots: '..............' },
  { label: 'Calculating score',   dots: '...............' },
]

const MOCK_DATA = {
  finalUrl: 'https://sbi-kyc-update.xyz/verify/account',
  pageTitle: 'SBI KYC Update — Urgent Action Required',
  redirectChain: ['https://bit.ly/3xKp9mQ','https://tinyurl.com/sbi-update','https://sbi-kyc-update.xyz/verify/account'],
  screenshotBase64: null,
  forensicData: {
    geminiAnalysis: {
      is_phishing: true, confidence: 94,
      brand_impersonated: 'State Bank of India (SBI)',
      red_flags: ['SBI logo hosted on unrelated domain','Account blocked urgency language','OTP input field on non-SBI domain','Domain registered 2 days ago'],
      reasoning: 'This page impersonates SBI with a copied login interface. The domain sbi-kyc-update.xyz was registered 48 hours ago and has no affiliation with the State Bank of India. The page harvests OTP and account credentials.',
    },
    technicalFlags: ['Suspicious TLD (.xyz)','KYC keyword used in URL path','No HTTPS on form submission endpoint','Domain age: 2 days'],
    heuristicAnalysis: { score: 88, flags: ['KYC keyword','New domain'], domainAge: 2, isWhitelisted: false },
    outgoingLinks: ['https://sbi-kyc-update.xyz/submit-otp','https://sbi-kyc-update.xyz/collect'],
  },
  redFlags: ['SBI logo hosted on unrelated domain','Account blocked urgency language','OTP input field on non-SBI domain','Domain registered only 2 days ago','Suspicious .xyz top-level domain'],
  totalRiskScore: 94,
  verdict: 'DANGEROUS',
}

/* ── GLOBAL STYLES ─────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { width: 100%; min-height: 100vh; }

  body {
    width: 100%;
    min-height: 100vh;
    background: #1a0f05;
    font-family: ${FONT};
    overflow-x: hidden;
    cursor: none;
  }
    #root {
  width: 100%;
  min-height: 100vh;
}

  /* ── Custom cursor ── */

  /* ── Custom cursor ── */
  #cursor-dot {
    position: fixed; top: 0; left: 0; z-index: 9999;
    width: 8px; height: 8px; border-radius: 50%;
    background: ${C.amber};
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: width 0.2s, height 0.2s, opacity 0.2s;
    mix-blend-mode: normal;
  }
  #cursor-ring {
    position: fixed; top: 0; left: 0; z-index: 9998;
    width: 36px; height: 36px; border-radius: 50%;
    border: 1.5px solid rgba(192,88,0,0.5);
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: transform 0.12s ease, width 0.25s, height 0.25s, border-color 0.25s, opacity 0.2s;
  }
  body:has(button:hover) #cursor-dot,
  body:has(a:hover)      #cursor-dot  { width: 12px; height: 12px; background: ${C.deepBrown}; }
  body:has(button:hover) #cursor-ring,
  body:has(a:hover)      #cursor-ring { width: 52px; height: 52px; border-color: rgba(113,54,0,0.6); }

  /* ── Aurora background blobs ── */
  #aurora {
    position: fixed; inset: 0; z-index: 0; overflow: hidden;
    pointer-events: none;
  }
  .blob {
    position: absolute; border-radius: 50%;
    filter: blur(80px); opacity: 0.35;
    transition: transform 0.05s linear;
  }
  .blob-1 { width:600px; height:600px; background:radial-gradient(circle, #713600 0%, transparent 70%); top:-100px; left:-100px; }
  .blob-2 { width:500px; height:500px; background:radial-gradient(circle, #C05800 0%, transparent 70%); top:20%; right:-120px; opacity:0.2; }
  .blob-3 { width:400px; height:400px; background:radial-gradient(circle, #FDFBD4 0%, transparent 70%); bottom:0; left:30%; opacity:0.06; }

  /* ── Cursor spotlight ── */
  #spotlight {
    position: fixed; z-index: 1; pointer-events: none;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(192,88,0,0.08) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: transform 0.08s linear;
  }

  /* ── Glassmorphism card ── */
  .glass {
    background: rgba(253,251,212,0.07);
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
    border: 1px solid rgba(253,251,212,0.12);
    border-radius: 12px;
  }
  .glass-strong {
    background: rgba(253,251,212,0.11);
    backdrop-filter: blur(28px) saturate(1.6);
    -webkit-backdrop-filter: blur(28px) saturate(1.6);
    border: 1px solid rgba(253,251,212,0.18);
    border-radius: 12px;
  }
  .glass-topbar {
    background: rgba(20,10,3,0.65);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(253,251,212,0.08);
  }

  /* ── Tilt card ── */
  .tilt-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    will-change: transform;
    transform-style: preserve-3d;
  }

  /* ── Animations ── */
  @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes ringFill { from { stroke-dashoffset: 283; } }
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .fade-up   { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) both; }
  .fade-up-1 { animation: fadeUp 0.5s 0.06s cubic-bezier(.22,1,.36,1) both; }
  .fade-up-2 { animation: fadeUp 0.5s 0.13s cubic-bezier(.22,1,.36,1) both; }
  .fade-up-3 { animation: fadeUp 0.5s 0.20s cubic-bezier(.22,1,.36,1) both; }
  .fade-up-4 { animation: fadeUp 0.5s 0.27s cubic-bezier(.22,1,.36,1) both; }
  .blink     { animation: blink 1s step-end infinite; }
  .ring-arc  { animation: ringFill 1.4s 0.3s cubic-bezier(.4,0,.2,1) both; }
  .float     { animation: float 5s ease-in-out infinite; }

  /* ── Shimmer text for verdict ── */
  .shimmer-text {
    background: linear-gradient(90deg, ${C.amber} 0%, #ffb347 40%, ${C.amber} 60%, #e06000 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
  .shimmer-safe {
    background: linear-gradient(90deg, ${C.deepBrown} 0%, #b85c00 40%, ${C.deepBrown} 60%, #8a4200 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }

  /* ── Text colors on dark bg ── */
  .text-cream   { color: ${C.cream}; }
  .text-amber   { color: ${C.amber}; }
  .text-muted   { color: rgba(253,251,212,0.55); }
  .text-dimmer  { color: rgba(253,251,212,0.35); }

  /* ── Buttons ── */
  .btn-primary {
    width:100%; padding:16px; font-size:15px; font-weight:700;
    font-family:${FONT}; color:${C.cream}; border:none; border-radius:8px;
    cursor:pointer; letter-spacing:0.04em;
    background: ${C.deepBrown};
    box-shadow: 0 0 0 1px rgba(113,54,0,0.3), 0 4px 24px rgba(113,54,0,0.4);
    transition: transform 0.1s, box-shadow 0.15s, background 0.15s;
  }
  .btn-primary:hover { background:#5a2c00; box-shadow:0 0 0 1px rgba(113,54,0,0.5), 0 6px 32px rgba(113,54,0,0.55); }
  .btn-primary:active { transform:scale(0.985); }
  .btn-primary:disabled { background:rgba(56,36,13,0.3); box-shadow:none; cursor:not-allowed; color:rgba(253,251,212,0.4); }

  .btn-ghost-glass {
    background: rgba(253,251,212,0.06);
    border: 1px solid rgba(253,251,212,0.15);
    border-radius:8px;
    width:100%; padding:13px 24px; font-size:13px;
    font-family:${FONT}; color:rgba(253,251,212,0.8);
    cursor:pointer; letter-spacing:0.02em;
    transition: background 0.15s, border-color 0.15s;
  }
  .btn-ghost-glass:hover { background:rgba(253,251,212,0.1); border-color:rgba(253,251,212,0.28); }

  .btn-link {
    background:none; border:none; cursor:pointer; font-family:${FONT}; padding:0;
  }
  .btn-link:hover { text-decoration:underline; }

  /* ── Input ── */
  .glass-input {
    width:100%; padding:16px; font-size:15px;
    font-family:${FONT}; color:${C.cream};
    background: rgba(253,251,212,0.06);
    border: 1px solid rgba(253,251,212,0.15);
    border-radius:8px; outline:none;
    transition: border-color 0.2s, background 0.2s;
    margin-bottom:12px;
    caret-color: ${C.amber};
  }
  .glass-input::placeholder { color:rgba(253,251,212,0.35); }
  .glass-input:focus { border-color:rgba(192,88,0,0.7); background:rgba(253,251,212,0.09); }

  /* ── Topbar btn ── */
  .topbar-btn {
    background:rgba(253,251,212,0.08); border:1px solid rgba(253,251,212,0.15);
    border-radius:6px; padding:6px 14px; font-size:12px;
    font-family:${FONT}; color:rgba(253,251,212,0.8); cursor:pointer;
    letter-spacing:0.04em; transition:background 0.15s;
  }
  .topbar-btn:hover { background:rgba(253,251,212,0.14); }

  /* ── Section label ── */
  .section-label {
    font-size:10px; letter-spacing:0.16em; text-transform:uppercase;
    font-family:${FONT}; margin-bottom:14px;
    display:flex; align-items:center; gap:10px;
    color:rgba(253,251,212,0.35);
  }
  .section-label::after {
    content:''; flex:1; height:1px;
    background:rgba(253,251,212,0.08);
  }

  /* ── Tech toggle ── */
  .tech-toggle {
    background:none; border:none; cursor:pointer; font-size:13px;
    color:rgba(192,88,0,0.9); font-family:${FONT}; padding:0;
  }
  .tech-toggle:hover { text-decoration:underline; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(192,88,0,0.3); border-radius:2px; }
`

function InjectCSS() {
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = GLOBAL_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])
  return null
}

/* ── CURSOR + AURORA + SPOTLIGHT ───────────────────────────────────────── */
function CursorAndAurora() {
  const dotRef      = useRef(null)
  const ringRef     = useRef(null)
  const spotRef     = useRef(null)
  const blob1Ref    = useRef(null)
  const blob2Ref    = useRef(null)
  const mouseRef    = useRef({ x: window.innerWidth/2, y: window.innerHeight/2 })
  const ringPosRef  = useRef({ x: window.innerWidth/2, y: window.innerHeight/2 })
  const rafRef      = useRef(null)

  useEffect(() => {
    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove, { passive: true })

    const lerp = (a, b, t) => a + (b - a) * t

    const tick = () => {
      const { x, y } = mouseRef.current

      // dot follows exactly
      if (dotRef.current) {
        dotRef.current.style.left = x + 'px'
        dotRef.current.style.top  = y + 'px'
      }

      // ring lags behind
      ringPosRef.current.x = lerp(ringPosRef.current.x, x, 0.14)
      ringPosRef.current.y = lerp(ringPosRef.current.y, y, 0.14)
      if (ringRef.current) {
        ringRef.current.style.left = ringPosRef.current.x + 'px'
        ringRef.current.style.top  = ringPosRef.current.y + 'px'
      }

      // spotlight
      if (spotRef.current) {
        spotRef.current.style.left = x + 'px'
        spotRef.current.style.top  = y + 'px'
      }

      // blobs drift gently with cursor
      const cx = x / window.innerWidth  - 0.5
      const cy = y / window.innerHeight - 0.5
      if (blob1Ref.current) blob1Ref.current.style.transform = `translate(${cx*30}px, ${cy*20}px)`
      if (blob2Ref.current) blob2Ref.current.style.transform = `translate(${-cx*25}px, ${-cy*18}px)`

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div id="aurora">
        <div ref={blob1Ref} className="blob blob-1"/>
        <div ref={blob2Ref} className="blob blob-2"/>
        <div className="blob blob-3"/>
      </div>
      <div id="spotlight" ref={spotRef}/>
      <div id="cursor-dot" ref={dotRef}/>
      <div id="cursor-ring" ref={ringRef}/>
    </>
  )
}

/* ── TILT CARD ─────────────────────────────────────────────────────────── */
function TiltCard({ children, style, className = '' }) {
  const ref = useRef(null)

  const onMove = (e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width  - 0.5
    const y = (e.clientY - r.top)  / r.height - 0.5
    el.style.transform = `perspective(800px) rotateY(${x*8}deg) rotateX(${-y*6}deg) scale(1.01)`
    el.style.boxShadow = `${-x*12}px ${-y*8}px 40px rgba(192,88,0,0.12), 0 0 0 1px rgba(253,251,212,0.1)`
  }
  const onLeave = (e) => {
    const el = ref.current; if (!el) return
    el.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)'
    el.style.boxShadow = 'none'
  }

  return (
    <div ref={ref} className={`tilt-card ${className}`}
      style={style} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}

/* ── TOPBAR ──────────────────────────────────────────────────────────────── */
function Topbar({ onReset, showBack }) {
  return (
    <div className="glass-topbar" style={{
      position:'sticky', top:0, zIndex:100,
      padding:'0 24px', height:'52px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px',
        cursor: showBack ? 'pointer' : 'default' }}
        onClick={showBack ? onReset : undefined}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={C.cream} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ fontFamily:FONT, fontWeight:700, fontSize:'13px',
          letterSpacing:'0.2em', color:C.cream, textTransform:'uppercase' }}>
          PhishSense
        </span>
      </div>
      {showBack && (
        <button className="topbar-btn" onClick={onReset}>← New scan</button>
      )}
    </div>
  )
}

/* ── SCORE RING ──────────────────────────────────────────────────────────── */
function ScoreRing({ score, color }) {
  const r = 45, circ = 2 * Math.PI * r
  const filled = typeof score === 'number' ? (score/100)*circ : 0
  return (
    <div style={{ position:'relative', width:120, height:120, flexShrink:0 }}>
      <svg width="120" height="120" viewBox="0 0 120 120"
        style={{ transform:'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none"
          stroke="rgba(253,251,212,0.08)" strokeWidth="6"/>
        <circle cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          className="ring-arc"/>
      </svg>
      <div style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
      }}>
        <span style={{ fontSize:'28px', fontWeight:700, color:C.cream,
          fontFamily:FONT, lineHeight:1 }}>
          {typeof score === 'number' ? Math.round(score) : '—'}
        </span>
        <span style={{ fontSize:'9px', color:'rgba(253,251,212,0.4)',
          letterSpacing:'0.1em', textTransform:'uppercase',
          fontFamily:FONT, marginTop:'2px' }}>
          RISK
        </span>
      </div>
    </div>
  )
}

/* ── IDLE ────────────────────────────────────────────────────────────────── */
function IdleScreen({ url, setUrl, onAnalyze, onDemo }) {
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])
  const active = url.trim().length > 0

  return (
    <>
      <Topbar showBack={false} />
      <div style={{
        minHeight:'calc(100vh - 52px)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'48px 24px', position:'relative', zIndex:2,
      }}>
        <div className="fade-up" style={{ width:'100%', maxWidth:'440px', textAlign:'center' }}>

          {/* Hero shield */}
          <div className="float" style={{ marginBottom:'28px', display:'inline-block' }}>
            <div style={{
              width:72, height:72, borderRadius:'20px', margin:'0 auto',
              background:'rgba(113,54,0,0.35)',
              border:'1px solid rgba(192,88,0,0.35)',
              backdropFilter:'blur(12px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 40px rgba(192,88,0,0.2)',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke={C.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </div>

          <h1 style={{ fontSize:'clamp(34px,6vw,48px)', fontWeight:800,
            color:C.cream, margin:'0 0 16px 0', lineHeight:1.1,
            letterSpacing:'-0.03em' }}>
            Is this link safe?
          </h1>

          <p style={{ fontSize:'16px', color:'rgba(253,251,212,0.6)', lineHeight:1.7,
            margin:'0 0 40px 0', maxWidth:'360px',
            marginLeft:'auto', marginRight:'auto' }}>
            Paste any suspicious link. We open it in an isolated environment
            so your device never touches it.
          </p>

          <TiltCard className="glass-strong" style={{ padding:'24px', marginBottom:'0' }}>
            <input
              ref={ref} type="text" value={url}
              className="glass-input"
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && active) onAnalyze() }}
              placeholder="Paste link here..."
            />
            <button className="btn-primary" onClick={onAnalyze} disabled={!active}>
              Analyze
            </button>
          </TiltCard>

          <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'20px 0 16px' }}>
            <div style={{ flex:1, height:'1px', background:'rgba(253,251,212,0.08)' }}/>
            <span style={{ fontSize:'11px', color:'rgba(253,251,212,0.3)',
              letterSpacing:'0.1em', textTransform:'uppercase' }}>or</span>
            <div style={{ flex:1, height:'1px', background:'rgba(253,251,212,0.08)' }}/>
          </div>

          <button className="btn-ghost-glass" onClick={onDemo}>
            Try a demo — see what a phishing report looks like
          </button>

          <p style={{ marginTop:'24px', fontSize:'12px', color:'rgba(253,251,212,0.3)' }}>
            Used by thousands of Indians to check WhatsApp and SMS links.
          </p>
        </div>
      </div>
    </>
  )
}

/* ── LOADING ─────────────────────────────────────────────────────────────── */
function LoadingScreen({ step, url }) {
  return (
    <>
      <Topbar showBack={false} />
      <div style={{
        minHeight:'calc(100vh - 52px)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'48px 24px', position:'relative', zIndex:2,
      }}>
        <div className="fade-up" style={{ width:'100%', maxWidth:'520px' }}>
          {url && (
            <div style={{ fontFamily:MONO, fontSize:'11px',
              color:'rgba(253,251,212,0.35)',
              marginBottom:'32px', textAlign:'center',
              wordBreak:'break-all', lineHeight:1.5 }}>
              Scanning:{' '}
              <span style={{ color:C.amber }}>{url}</span>
            </div>
          )}

          <TiltCard className="glass" style={{ padding:'32px 36px' }}>
            <div style={{ fontFamily:MONO, fontSize:'13px', lineHeight:'2.4' }}>
              {STEPS.map((s, i) => {
                const isDone    = i < step
                const isRunning = i === step
                const color  = isDone ? 'rgba(253,251,212,0.85)' : isRunning ? C.amber : 'rgba(253,251,212,0.2)'
                const weight = isRunning ? 700 : 400
                const status = isDone ? 'done' : isRunning ? 'running' : 'waiting'
                return (
                  <div key={i} style={{ color, fontWeight:weight,
                    display:'flex', alignItems:'baseline', gap:'4px' }}>
                    <span style={{ whiteSpace:'pre' }}>{s.label} {s.dots} {status}</span>
                    {isRunning && <span className="blink" style={{ color:C.amber }}>_</span>}
                  </div>
                )
              })}
            </div>
          </TiltCard>

          <p style={{ marginTop:'36px', fontSize:'12px',
            color:'rgba(253,251,212,0.3)',
            textAlign:'center', lineHeight:1.6 }}>
            This takes 15–25 seconds. Your device is completely safe.
          </p>
        </div>
      </div>
    </>
  )
}

/* ── RESULTS ─────────────────────────────────────────────────────────────── */
function ResultsScreen({ data, onReset, isDemo }) {
  const [showTech, setShowTech] = useState(false)

  const { finalUrl, pageTitle, redirectChain, screenshotBase64,
          forensicData, redFlags, totalRiskScore, verdict } = data

  const gemini    = forensicData?.geminiAnalysis    || {}
  const techFlags = forensicData?.technicalFlags    || []
  const heuristic = forensicData?.heuristicAnalysis || {}
  const outgoing  = forensicData?.outgoingLinks     || []
  const domainAge = heuristic.domainAge
  const score     = typeof totalRiskScore === 'number' ? Math.round(totalRiskScore) : null
  const isSafe    = verdict === 'LIKELY SAFE'
  const verdictColor = isSafe ? C.deepBrown : C.amber

  const reasoning = gemini.reasoning || gemini.summary || gemini.explanation
    || (gemini.confidence != null
        ? `AI confidence: ${gemini.confidence}% phishing probability.${gemini.brand_impersonated ? ` Suspected impersonation of ${gemini.brand_impersonated}.` : ''}`
        : null)
    || (redFlags?.length > 0 ? `${redFlags.length} red flag${redFlags.length>1?'s':''} detected.` : null)
    || (isSafe ? 'No phishing indicators detected. This page appears to be legitimate.' : null)

  const copyReport = () => {
    const txt = ['PhishSense PHISHING REPORT','',
      `URL: ${finalUrl}`, `Verdict: ${verdict}`, `Threat Score: ${score}/100`,'',
      `Analysis: ${reasoning || '—'}`,'','Red Flags:',
      ...(redFlags?.map(f=>`  - ${f}`) || ['  None.']),
      '','Redirect Chain:',
      ...(redirectChain?.map((u,i)=>`  ${i+1}. ${u}`) || []),
    ].join('\n')
    navigator.clipboard?.writeText(txt).catch(()=>{})
  }

  const SectionLabel = ({ children }) => (
    <div className="section-label">{children}</div>
  )

  return (
    <>
      <Topbar onReset={onReset} showBack />
      <div style={{
        padding:'40px 24px 80px', position:'relative', zIndex:2,
        minHeight:'calc(100vh - 52px)',
      }}>
        <div style={{ maxWidth:'680px', margin:'0 auto' }}>

          {isDemo && (
            <div className="fade-up glass" style={{
              padding:'10px 16px', marginBottom:'24px',
              display:'flex', alignItems:'center', gap:'8px',
            }}>
              <span style={{ fontSize:'10px', color:'rgba(253,251,212,0.4)',
                letterSpacing:'0.1em', textTransform:'uppercase' }}>Demo</span>
              <span style={{ fontSize:'12px', color:'rgba(253,251,212,0.4)' }}>
                Sample report. Connect backend to analyze real links.
              </span>
            </div>
          )}

          {/* ── VERDICT ─────────────────────────────────────────────────── */}
          <TiltCard className="fade-up glass-strong" style={{
            padding:'28px 28px 28px 22px',
            borderLeft:`3px solid ${verdictColor}`,
            borderRadius:'12px',
            marginBottom:'32px',
            display:'flex', alignItems:'center', gap:'24px', flexWrap:'wrap',
          }}>
            <div style={{ flex:1, minWidth:'200px' }}>
              <div className={isSafe ? 'shimmer-safe' : 'shimmer-text'} style={{
                fontSize: verdict === 'DANGEROUS' ? '32px' : '26px',
                fontWeight:800, fontFamily:FONT,
                letterSpacing:'0.05em', marginBottom:'10px',
                lineHeight:1, textTransform:'uppercase',
              }}>
                {verdict}
              </div>
              {reasoning && (
                <p style={{ fontSize:'14px', color:'rgba(253,251,212,0.65)',
                  lineHeight:1.65, margin:0 }}>
                  {reasoning}
                </p>
              )}
              
            </div>
            <ScoreRing score={score} color={verdictColor} />
          </TiltCard>

          {/* ── SCREENSHOT ──────────────────────────────────────────────── */}
          <div className="fade-up-1" style={{ marginBottom:'32px' }}>
            <SectionLabel>What we found inside</SectionLabel>

            {gemini.brand_impersonated && (
              <div className="glass" style={{
                display:'flex', alignItems:'center', gap:'8px',
                padding:'10px 14px', marginBottom:'12px',
                borderLeft:`2px solid ${C.amber}`,
                borderRadius:'8px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={C.amber} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span style={{ fontSize:'13px', fontWeight:700, color:C.amber, fontFamily:FONT }}>
                  Impersonating {gemini.brand_impersonated}
                </span>
              </div>
            )}

            <div className="glass" style={{ overflow:'hidden', borderRadius:'12px' }}>
              <div style={{ padding:'9px 14px',
                borderBottom:'1px solid rgba(253,251,212,0.08)',
                display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ display:'flex', gap:'5px' }}>
                  {[0.15,0.15,0.15].map((o,i)=>(
                    <div key={i} style={{ width:8, height:8, borderRadius:'50%',
                      background:`rgba(253,251,212,${o})` }}/>
                  ))}
                </div>
                <span style={{ fontSize:'11px', fontFamily:MONO,
                  color:'rgba(253,251,212,0.35)', wordBreak:'break-all', flex:1 }}>
                  {finalUrl}
                </span>
              </div>
              {pageTitle && (
                <div style={{ padding:'6px 14px',
                  borderBottom:'1px solid rgba(253,251,212,0.06)' }}>
                  <span style={{ fontSize:'11px', fontFamily:FONT,
                    color:'rgba(253,251,212,0.25)' }}>{pageTitle}</span>
                </div>
              )}
              {screenshotBase64 ? (
  <div style={{ maxHeight:'500px', overflowY:'auto',
    scrollbarWidth:'thin',
    scrollbarColor:'rgba(192,88,0,0.3) transparent' }}>
    <img src={`data:image/png;base64,${screenshotBase64}`}
      alt="Screenshot" style={{ width:'100%', display:'block' }}/>
  </div>
              ) : (
  <div style={{ padding:'32px 24px' }}>
    <div style={{ fontFamily:MONO, lineHeight:2.2, marginBottom:'20px', textAlign:'center' }}>
      <div style={{ fontSize:'10px', letterSpacing:'0.08em',
        textTransform:'uppercase', color:'rgba(253,251,212,0.2)',
        marginBottom:'8px' }}>
        {isDemo ? 'Screenshot appears with live backend' : 'Screenshot unavailable'}
      </div>
      <div style={{ fontSize:'12px', color:'rgba(253,251,212,0.15)' }}>
        $ sandbox --headless {finalUrl.slice(0,42)}...
      </div>
    </div>

    {/* Placard */}
    {!isDemo && (
      <div style={{
        border:'1px solid rgba(192,88,0,0.25)',
        borderLeft:'3px solid rgba(192,88,0,0.6)',
        borderRadius:'8px',
        padding:'16px 18px',
        background:'rgba(192,88,0,0.06)',
      }}>
        <div style={{ fontSize:'11px', letterSpacing:'0.1em',
          textTransform:'uppercase', color:'rgba(192,88,0,0.7)',
          fontFamily:'FONT', marginBottom:'10px', fontWeight:700 }}>
          ⚠ Why no screenshot?
        </div>
        <div style={{ fontSize:'13px', color:'rgba(253,251,212,0.5)',
          fontFamily:FONT, lineHeight:1.7 }}>
          This site actively blocked our sandbox browser. Legitimate websites
          generally do not block automated security analysis tools.
          <span style={{ color:'rgba(192,88,0,0.8)', fontWeight:600 }}> Blocking sandbox access is itself a suspicious behavior</span> commonly
          used by phishing and scam sites to avoid detection.
        </div>
      </div>
    )}
  </div>
)}
            </div>
            <p style={{ fontSize:'11px', color:'rgba(253,251,212,0.25)',
              marginTop:'8px', fontFamily:FONT }}>
              Captured inside our secure sandbox. Your device never opened this link.
            </p>
          </div>

          {/* ── RED FLAGS ───────────────────────────────────────────────── */}
          <div className="fade-up-2" style={{ marginBottom:'32px' }}>
            <SectionLabel>Red flags detected</SectionLabel>
            {redFlags && redFlags.length > 0 ? (
              <div className="glass" style={{ padding:'20px 24px', borderRadius:'12px' }}>
                {redFlags.map((flag, i) => (
                  <div key={i} style={{
                    fontSize:'14px', color:'rgba(253,251,212,0.75)',
                    fontFamily:FONT, lineHeight:1.6, marginBottom:'12px',
                    paddingLeft:'18px', position:'relative',
                    borderBottom: i < redFlags.length-1 ? '1px solid rgba(253,251,212,0.05)' : 'none',
                    paddingBottom: i < redFlags.length-1 ? '12px' : 0,
                  }}>
                    <span style={{ position:'absolute', left:0,
                      color:C.amber, fontWeight:700, fontSize:'16px', lineHeight:1.4 }}>—</span>
                    {flag}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:'14px', color:'rgba(253,251,212,0.35)', fontFamily:FONT }}>
                No significant flags detected.
              </p>
            )}
          </div>

          {/* ── REDIRECT CHAIN ──────────────────────────────────────────── */}
          {redirectChain && redirectChain.length > 1 && (
            <div className="fade-up-3" style={{ marginBottom:'32px' }}>
              <SectionLabel>Link trail</SectionLabel>
              <div className="glass" style={{ padding:'20px 24px', borderRadius:'12px' }}>
                {redirectChain.map((u, i) => {
                  const isLast = i === redirectChain.length - 1
                  return (
                    <div key={i}>
                      <div style={{ fontSize:'12px', fontFamily:MONO,
                        color: isLast ? C.amber : 'rgba(253,251,212,0.55)',
                        wordBreak:'break-all', lineHeight:1.7,
                        display:'flex', alignItems:'baseline', gap:'8px' }}>
                        <span style={{ color:'rgba(253,251,212,0.25)', fontFamily:FONT,
                          fontSize:'10px', flexShrink:0, letterSpacing:'0.06em' }}>
                          {String(i+1).padStart(2,'0')}
                        </span>
                        <span>{u}</span>
                        {isLast && (
                          <span style={{ fontSize:'9px', color:'#1a0f05',
                            background:C.amber, fontFamily:FONT, padding:'2px 6px',
                            borderRadius:'3px', letterSpacing:'0.08em',
                            textTransform:'uppercase', flexShrink:0, fontWeight:700 }}>
                            destination
                          </span>
                        )}
                      </div>
                      {!isLast && (
                        <div style={{ fontSize:'11px', color:'rgba(253,251,212,0.2)',
                          margin:'2px 0 2px 26px' }}>↓</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── TECHNICAL ───────────────────────────────────────────────── */}
          <div className="fade-up-4" style={{ marginBottom:'40px' }}>
            <button className="tech-toggle"
              onClick={() => setShowTech(v=>!v)}>
              {showTech ? '− Hide technical details' : '+ Show technical details'}
            </button>

            {showTech && (
              <div className="glass" style={{ marginTop:'16px', padding:'20px 24px', borderRadius:'12px' }}>

                {domainAge !== null && domainAge !== undefined && (
                  <div style={{ marginBottom:'20px' }}>
                    <div style={{ fontSize:'10px', color:'rgba(253,251,212,0.3)',
                      letterSpacing:'0.12em', textTransform:'uppercase',
                      fontFamily:FONT, marginBottom:'8px' }}>Domain Age</div>
                    <div style={{ fontSize:'14px', fontFamily:FONT, lineHeight:1.6,
                      color: domainAge < 30 ? C.amber : 'rgba(253,251,212,0.65)',
                      fontWeight: domainAge < 7 ? 600 : 400 }}>
                      {domainAge === 0 ? 'Registered today — extremely suspicious' :
                       domainAge === 1 ? '1 day old — extremely new' :
                       domainAge < 7  ? `${domainAge} days old — very recently registered` :
                       domainAge < 30 ? `${domainAge} days old — recently registered` :
                       domainAge < 90 ? `${domainAge} days old — relatively new` :
                       domainAge < 365 ? `${domainAge} days (${Math.floor(domainAge/30)} months) old` :
                       `${Math.floor(domainAge/365)} year${Math.floor(domainAge/365)>1?'s':''} old — established domain`}
                    </div>
                  </div>
                )}

                {techFlags.length > 0 && (
                  <div style={{ marginBottom:'20px' }}>
                    <div style={{ fontSize:'10px', color:'rgba(253,251,212,0.3)',
                      letterSpacing:'0.12em', textTransform:'uppercase',
                      fontFamily:FONT, marginBottom:'8px' }}>Technical Flags</div>
                    {techFlags.map((f,i) => (
                      <div key={i} style={{ fontSize:'13px', fontFamily:MONO,
                        color:'rgba(253,251,212,0.5)', marginBottom:'6px' }}>— {f}</div>
                    ))}
                  </div>
                )}

                {heuristic.flags?.length > 0 && (
                  <div style={{ marginBottom:'20px' }}>
                    <div style={{ fontSize:'10px', color:'rgba(253,251,212,0.3)',
                      letterSpacing:'0.12em', textTransform:'uppercase',
                      fontFamily:FONT, marginBottom:'8px' }}>Heuristic Flags</div>
                    {heuristic.flags.map((f,i) => (
                      <div key={i} style={{ fontSize:'13px', fontFamily:MONO,
                        color:'rgba(253,251,212,0.5)', marginBottom:'6px' }}>— {f}</div>
                    ))}
                  </div>
                )}

                {outgoing.length > 0 && (
                  <div>
                    <div style={{ fontSize:'10px', color:'rgba(253,251,212,0.3)',
                      letterSpacing:'0.12em', textTransform:'uppercase',
                      fontFamily:FONT, marginBottom:'8px' }}>Outgoing Links</div>
                    {outgoing.map((l,i) => (
                      <div key={i} style={{ fontSize:'12px', fontFamily:MONO,
                        color:'rgba(253,251,212,0.4)', wordBreak:'break-all', marginBottom:'6px' }}>
                        {String(i+1).padStart(2,'0')}. {l}
                      </div>
                    ))}
                  </div>
                )}

                {!domainAge && !techFlags.length && !heuristic.flags?.length && !outgoing.length && (
                  <p style={{ fontSize:'13px', color:'rgba(253,251,212,0.3)', fontFamily:FONT }}>
                    No additional technical data available.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── ACTIONS ─────────────────────────────────────────────────── */}
          <div style={{
            borderTop:'1px solid rgba(253,251,212,0.08)', paddingTop:'28px',
            display:'flex', gap:'28px', flexWrap:'wrap',
          }}>
            <button className="btn-link" onClick={onReset}
              style={{ fontSize:'14px', color:'rgba(192,88,0,0.9)', fontWeight:500 }}>
              ← Analyze another link
            </button>
            <button className="btn-link" onClick={copyReport}
              style={{ fontSize:'14px', color:'rgba(253,251,212,0.35)' }}>
              Copy report
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

/* ── ERROR ───────────────────────────────────────────────────────────────── */
function ErrorScreen({ onReset }) {
  return (
    <>
      <Topbar showBack={false} />
      <div style={{ minHeight:'calc(100vh - 52px)', display:'flex',
        flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'32px 24px', textAlign:'center', position:'relative', zIndex:2 }}>
        <div className="fade-up">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke={C.amber} strokeWidth="1.8" strokeLinecap="round"
            style={{ display:'block', margin:'0 auto 24px' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h2 style={{ fontSize:'22px', fontWeight:700, color:C.cream, marginBottom:'12px' }}>
            We couldn't analyze this link.
          </h2>
          <p style={{ fontSize:'15px', color:'rgba(253,251,212,0.55)', lineHeight:1.65,
            maxWidth:'380px', margin:'0 auto 32px' }}>
            This can happen with links that block automated access. Try copying
            the full URL including{' '}
            <code style={{ fontFamily:MONO, fontSize:'13px', color:C.amber }}>https://</code>
          </p>
          <button className="btn-link" onClick={onReset}
            style={{ fontSize:'15px', color:'rgba(192,88,0,0.9)', fontWeight:500 }}>
            ← Try again
          </button>
        </div>
      </div>
    </>
  )
}

/* ── ROOT ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [appState,    setAppState]    = useState('idle')
  const [url,         setUrl]         = useState('')
  const [data,        setData]        = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [isDemo,      setIsDemo]      = useState(false)
  const timerRef = useRef(null)

  const startTimer = (onComplete) => {
    let s = 0; setLoadingStep(0)
    timerRef.current = setInterval(() => {
      s += 1
      if (s < STEPS.length) setLoadingStep(s)
      else { clearInterval(timerRef.current); onComplete?.() }
    }, 1800)
  }

  const handleDemo = () => {
    setIsDemo(true); setAppState('loading'); setLoadingStep(0); setData(null)
    startTimer(() => { setLoadingStep(STEPS.length); setData(MOCK_DATA); setAppState('results') })
  }

const handleAnalyze = async () => {
  const trimmed = url.trim();
  if (!trimmed) return;

  setIsDemo(false);
  setAppState('loading');
  setLoadingStep(0);
  setData(null);
  startTimer(null);

  try {
    const res = await fetch(
      'https://phishsense1.onrender.com/analyze',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'hello_my_name_aarush'
        },
        body: JSON.stringify({
          url: trimmed,
          preliminary_report: {}
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    clearInterval(timerRef.current);
    setLoadingStep(STEPS.length);
    setData(json);
    setAppState('results');
  } catch (err) {
    console.error(err);
    clearInterval(timerRef.current);
    setAppState('error');
  }
};

  const handleReset = () => {
    clearInterval(timerRef.current)
    setAppState('idle'); setUrl(''); setData(null); setLoadingStep(0); setIsDemo(false)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  return (
    <>
      <InjectCSS />
      <CursorAndAurora />
      <div style={{ position:'relative', zIndex:2 }}>
        {appState==='idle'    && <IdleScreen    url={url} setUrl={setUrl} onAnalyze={handleAnalyze} onDemo={handleDemo}/>}
        {appState==='loading' && <LoadingScreen step={loadingStep} url={url}/>}
        {appState==='results' && <ResultsScreen data={data} onReset={handleReset} isDemo={isDemo}/>}
        {appState==='error'   && <ErrorScreen   onReset={handleReset}/>}
      </div>
    </>
  )
}
