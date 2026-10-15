import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecipeContext } from '../context/RecipeContext'
import { useRecipeScale } from '../hooks/useRecipeScale'
import { useChecklist } from '../hooks/useChecklist'
import { useTimers, TimerPill } from '../lib/timers'
import { IngredientPanel } from '../components/recipes/IngredientPanel'
import { StepText } from '../components/recipes/StepText'
import { CookLogModal } from '../components/recipes/CookLogModal'
import { findDurations } from '../utils/timers'
import { convertAmount, normalizeName } from '../utils/quantity'
import { Ingredient } from '../types'
import {
  ArrowLeftIcon, ArrowRightIcon, CheckIcon, ChefHatIcon, ChevronLeftIcon, ListIcon, SparkleIcon, StarIcon, TimerIcon, XIcon,
} from '../components/ui/Icons'
import { PartyIcon, StopIcon, UtensilsIcon, VolumeIcon } from '../components/ui/FoodIcons'
import styles from './CookModePage.module.css'

/** Ingredients mentioned in a step ("add the garlic" → garlic) */
function ingredientsInStep(text: string, ingredients: Ingredient[]): Ingredient[] {
  const t = ` ${text.toLowerCase().replace(/[^a-z\s]/g, ' ')} `
  return ingredients.filter((ing) => {
    const words = normalizeName(ing.name).split(' ').filter((w) => w.length > 2)
    if (!words.length) return false
    const head = words[words.length - 1]
    return t.includes(` ${head}`) || t.includes(` ${words.join(' ')}`)
  })
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number } }) => void) | null
  onend: (() => void) | null
}

export function CookModePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRecipe, loading } = useRecipeContext()
  const recipe = getRecipe(id!)
  const scale = useRecipeScale(recipe)
  const gathered = useChecklist(`tt:gathered:${id}`)
  const { timers, start, toggle, dismiss, setDockHidden } = useTimers()

  // -1 = mise en place, steps.length = finished
  const [index, setIndex] = useState(-1)
  const [panelOpen, setPanelOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [awake, setAwake] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const touchX = useRef<number | null>(null)
  const recognizer = useRef<SpeechRecognitionLike | null>(null)

  const steps = useMemo(() => (recipe ? recipe.instructions.slice().sort((a, b) => a.step - b.step) : []), [recipe])
  const total = steps.length
  const current = index >= 0 && index < total ? steps[index] : null

  const go = useCallback((delta: 1 | -1) => {
    setDirection(delta)
    setIndex((i) => Math.max(-1, Math.min(total, i + delta)))
  }, [total])

  // Hide the floating timer dock; cook mode shows timers in its header
  useEffect(() => {
    setDockHidden(true)
    return () => setDockHidden(false)
  }, [setDockHidden])

  // Keep the screen on while cooking
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    async function acquire() {
      try {
        lock = (await nav.wakeLock?.request('screen')) ?? null
        setAwake(!!lock)
      } catch { setAwake(false) }
    }
    acquire()
    const onVis = () => { if (document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      lock?.release().catch(() => {})
    }
  }, [])

  // Keyboard: ← → space, Esc to leave
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).closest('input, textarea')) return
      if (logOpen) return
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
      else if (e.key === 'Escape') navigate(`/recipe/${id}`)
      else if (e.key.toLowerCase() === 'i') setPanelOpen((o) => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, navigate, id, logOpen])

  // Read the current step aloud
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.98
    u.onend = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(u)
  }, [])
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const stepText = current?.text ?? ''
  const firstTimer = findDurations(stepText)[0]

  // Hands-free: "next", "back", "repeat", "start timer"
  const handleCommand = useCallback((said: string) => {
    const s = said.toLowerCase()
    if (/\b(next|continue|done)\b/.test(s)) go(1)
    else if (/\b(back|previous)\b/.test(s)) go(-1)
    else if (/\b(repeat|read|again)\b/.test(s) && stepText) speak(stepText)
    else if (/\btimer\b/.test(s) && firstTimer) start(firstTimer.seconds, `Step ${index + 1} · ${firstTimer.label}`, recipe?.title)
  }, [go, speak, stepText, firstTimer, start, index, recipe?.title])

  const commandRef = useRef(handleCommand)
  commandRef.current = handleCommand

  const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
  const RecognitionCtor = SR.SpeechRecognition ?? SR.webkitSpeechRecognition

  function toggleListening() {
    if (!RecognitionCtor) return
    if (listening) {
      setListening(false)
      recognizer.current?.stop()
      recognizer.current = null
      return
    }
    const rec = new RecognitionCtor()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1]
      if (last?.[0]) commandRef.current(last[0].transcript)
    }
    rec.onend = () => { if (recognizer.current === rec) rec.start() } // keep listening
    recognizer.current = rec
    rec.start()
    setListening(true)
  }
  useEffect(() => () => { const r = recognizer.current; recognizer.current = null; r?.stop() }, [])

  if (!recipe) {
    return (
      <div className={styles.shell}>
        <div className={styles.center}>
          <p>{loading ? 'Loading…' : 'Recipe not found.'}</p>
          {!loading && <button className={styles.ghostBtn} onClick={() => navigate('/')}>Back home</button>}
        </div>
      </div>
    )
  }

  const r = recipe
  const used = current ? ingredientsInStep(current.text, r.ingredients) : []
  const usedIds = new Set(used.map((u) => u.id))
  const progress = total ? (Math.min(index + 1, total) / total) * 100 : 0
  const finished = index >= total

  return (
    <div
      className={styles.shell}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1)
      }}
    >
      <header className={styles.header}>
        <button className={styles.iconBtn} onClick={() => navigate(`/recipe/${r.id}`)} aria-label="Exit cook mode">
          <XIcon size={20} strokeWidth={2} />
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.recipeName}>{r.title}</span>
          <span className={styles.stepCount}>
            {index < 0 ? 'Get ready' : finished ? 'All done' : `Step ${index + 1} of ${total}`}
            {awake && <span className={styles.awake} title="Your screen will stay on"> · screen stays on</span>}
          </span>
        </div>
        <div className={styles.headerActions}>
          {RecognitionCtor && (
            <button className={`${styles.pillBtn} ${listening ? styles.pillOn : ''}`} onClick={toggleListening} title='Say "next", "back", "repeat" or "start timer"'>
              <span className={styles.micDot} /> <span className={styles.pillLabel}>{listening ? 'Listening' : 'Hands-free'}</span>
            </button>
          )}
          <button className={`${styles.iconBtn} ${panelOpen ? styles.iconOn : ''}`} onClick={() => setPanelOpen((o) => !o)} aria-label="Ingredients">
            <ListIcon size={20} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className={styles.progress}>
        {steps.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.seg} ${i <= index ? styles.segOn : ''}`}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i) }}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      {timers.length > 0 && (
        <div className={styles.timers}>
          {timers.map((t) => <TimerPill key={t.id} timer={t} large onToggle={() => toggle(t.id)} onDismiss={() => dismiss(t.id)} />)}
        </div>
      )}

      <main className={styles.stage}>
        <div className={styles.content} key={index} data-dir={direction}>
          {index < 0 && (
            <div className={styles.mise}>
              <p className={styles.eyebrow}>Mise en place</p>
              <h1 className={styles.miseTitle}>Gather everything first.</h1>
              <p className={styles.miseSub}>Tap each ingredient as you set it out. {r.totalTime ? `About ${r.totalTime >= 60 ? `${Math.round(r.totalTime / 6) / 10} hours` : `${r.totalTime} minutes`} start to finish.` : ''}</p>
              <div className={styles.miseList}>
                <IngredientPanel
                  recipe={r}
                  servings={scale.servings}
                  factor={scale.factor}
                  units={scale.units}
                  onServings={scale.setServings}
                  onFactor={scale.setFactor}
                  onUnits={scale.setUnits}
                  isChecked={gathered.isChecked}
                  onToggle={gathered.toggle}
                />
              </div>
            </div>
          )}

          {current && (
            <div className={styles.stepWrap}>
              <p className={styles.bigNum}>{String(index + 1).padStart(2, '0')}</p>
              <p className={styles.stepText}>
                <StepText text={current.text} stepNumber={index + 1} recipeTitle={r.title} />
              </p>
              <div className={styles.stepTools}>
                <button className={styles.toolBtn} onClick={() => (speaking ? (window.speechSynthesis.cancel(), setSpeaking(false)) : speak(current.text))}>
                  {speaking ? <><StopIcon size={15} /> Stop reading</> : <><VolumeIcon size={15} /> Read aloud</>}
                </button>
                {firstTimer && (
                  <button className={styles.toolBtn} onClick={() => start(firstTimer.seconds, `Step ${index + 1} · ${firstTimer.label}`, r.title)}>
                    <TimerIcon size={15} strokeWidth={2} /> Start {firstTimer.label} timer
                  </button>
                )}
              </div>
              {used.length > 0 && (
                <div className={styles.used}>
                  <p className={styles.eyebrow}>In this step</p>
                  <div className={styles.usedList}>
                    {used.map((ing) => {
                      const amt = convertAmount(ing, scale.factor, scale.units)
                      return (
                        <span key={ing.id} className={styles.usedChip}>
                          <strong>{[amt.quantity, amt.unit].filter(Boolean).join(' ')}</strong> {ing.name}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {finished && (
            <div className={styles.finish}>
              <div className={styles.confetti} aria-hidden="true">{[PartyIcon, ChefHatIcon, SparkleIcon, UtensilsIcon, StarIcon].map((I, i) => <span key={i} style={{ animationDelay: `${i * 90}ms` }}><I size={34} strokeWidth={1.5} /></span>)}</div>
              <h1 className={styles.miseTitle}>Dinner is served.</h1>
              <p className={styles.miseSub}>Nicely done. How did it turn out?</p>
              <div className={styles.finishActions}>
                <button className={styles.primaryBtn} onClick={() => setLogOpen(true)}><CheckIcon size={18} strokeWidth={2.5} /> Log it in the journal</button>
                <button className={styles.ghostBtn} onClick={() => navigate(`/recipe/${r.id}`)}>Back to recipe</button>
              </div>
            </div>
          )}
        </div>

        {panelOpen && (
          <aside className={styles.panel}>
            <div className={styles.panelHead}>
              <p className={styles.eyebrow}>Ingredients</p>
              <button className={styles.iconBtn} onClick={() => setPanelOpen(false)} aria-label="Close ingredients"><XIcon size={18} /></button>
            </div>
            <IngredientPanel
              compact
              recipe={r}
              servings={scale.servings}
              factor={scale.factor}
              units={scale.units}
              onServings={scale.setServings}
              onFactor={scale.setFactor}
              onUnits={scale.setUnits}
              isChecked={gathered.isChecked}
              onToggle={gathered.toggle}
              highlight={usedIds}
            />
          </aside>
        )}
      </main>

      <footer className={styles.footer}>
        <button className={styles.navBtn} onClick={() => go(-1)} disabled={index < 0}>
          <ChevronLeftIcon size={22} strokeWidth={2} />
          <span>Back</span>
        </button>
        {!finished && (
          <button className={styles.nextBtn} onClick={() => go(1)}>
            <span>{index < 0 ? "Let's cook" : index === total - 1 ? 'Finish' : 'Next step'}</span>
            {index === total - 1 ? <CheckIcon size={20} strokeWidth={2.5} /> : <ArrowRightIcon size={20} strokeWidth={2} />}
          </button>
        )}
        {finished && (
          <button className={styles.nextBtn} onClick={() => navigate(`/recipe/${r.id}`)}>
            <ArrowLeftIcon size={20} strokeWidth={2} /><span>Back to recipe</span>
          </button>
        )}
        <div className={styles.progressPct} aria-hidden="true">{Math.round(progress)}%</div>
      </footer>

      <CookLogModal recipeId={r.id} recipeTitle={r.title} isOpen={logOpen} onClose={() => { setLogOpen(false) }} />
    </div>
  )
}
