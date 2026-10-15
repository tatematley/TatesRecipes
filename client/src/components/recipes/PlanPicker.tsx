import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { CalendarIcon } from '../ui/Icons'
import { useToast } from '../ui/Toast'
import { useAppData, toISODate } from '../../lib/appData'
import { PlanEntry, Recipe } from '../../types'
import styles from './PlanPicker.module.css'

type Meal = PlanEntry['meal']
const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

function defaultMeal(recipe: Recipe): Meal {
  switch (recipe.category) {
    case 'Breakfast': return 'Breakfast'
    case 'Lunch': case 'Salads': return 'Lunch'
    case 'Snacks': case 'Desserts': case 'Drinks': case 'Appetizers': return 'Snack'
    default: return 'Dinner'
  }
}

interface Props {
  recipe: Recipe
  isOpen: boolean
  onClose: () => void
}

/** Pick a day in the next two weeks and a meal, then add the recipe to the plan. */
export function PlanPicker({ recipe, isOpen, onClose }: Props) {
  const { plan, addToPlan } = useAppData()
  const toast = useToast()

  const days = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return { d, date: toISODate(d), i }
    })
    // Recompute each time the picker opens so "today" stays right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const [date, setDate] = useState(days[0].date)
  const [meal, setMeal] = useState<Meal>(() => defaultMeal(recipe))

  useEffect(() => {
    if (!isOpen) return
    setDate(days[0].date)
    setMeal(defaultMeal(recipe))
  }, [isOpen, recipe, days])

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of plan) m.set(e.date, (m.get(e.date) ?? 0) + 1)
    return m
  }, [plan])

  const alreadyThere = plan.some((e) => e.date === date && e.recipeId === recipe.id && e.meal === meal)
  const chosen = days.find((x) => x.date === date) ?? days[0]

  function dayPhrase() {
    if (chosen.i === 0) return meal === 'Dinner' ? 'tonight' : 'today'
    if (chosen.i === 1) return 'tomorrow'
    const weekday = chosen.d.toLocaleDateString(undefined, { weekday: 'long' })
    return chosen.i >= 7 ? `next ${weekday}` : weekday
  }

  function confirm() {
    addToPlan({ date, recipeId: recipe.id, meal, servings: recipe.servings })
    const phrase = dayPhrase()
    const message = phrase === 'tonight'
      ? "Added to tonight's dinner"
      : `Added to ${phrase}'s ${meal.toLowerCase()}`
    toast(message, { label: 'View plan', to: '/planner' })
    onClose()
  }

  const weeks = [days.slice(0, 7), days.slice(7)]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to meal plan"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon={<CalendarIcon size={16} />} onClick={confirm}>
            Add to {dayPhrase() === 'tonight' ? 'tonight' : chosen.i === 0 ? 'today' : chosen.d.toLocaleDateString(undefined, { weekday: 'short' })}
          </Button>
        </>
      }
    >
      <p className={styles.recipe}>{recipe.title}</p>

      {weeks.map((week, wi) => (
        <div key={wi} className={styles.week}>
          <span className={styles.weekLabel}>{wi === 0 ? 'This week' : 'Next week'}</span>
          <div className={styles.days} role="radiogroup" aria-label={wi === 0 ? 'Days this week' : 'Days next week'}>
            {week.map(({ d, date: iso, i }) => {
              const n = counts.get(iso) ?? 0
              return (
                <button
                  key={iso}
                  role="radio"
                  aria-checked={date === iso}
                  aria-label={d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + (n ? `, ${n} planned` : '')}
                  className={[styles.day, date === iso ? styles.on : '', i === 0 ? styles.today : ''].join(' ')}
                  onClick={() => setDate(iso)}
                >
                  <span className={styles.dow}>{i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span className={styles.num}>{d.getDate()}</span>
                  <span className={styles.dots} aria-hidden="true">
                    {Array.from({ length: Math.min(n, 3) }, (_, k) => <i key={k} />)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <span className={styles.weekLabel}>Meal</span>
      <div className={styles.meals} role="radiogroup" aria-label="Meal">
        {MEALS.map((m) => (
          <button key={m} role="radio" aria-checked={meal === m} className={meal === m ? styles.mealOn : ''} onClick={() => setMeal(m)}>
            {m}
          </button>
        ))}
      </div>
      {alreadyThere && <p className={styles.note}>This recipe is already planned for that meal.</p>}
    </Modal>
  )
}
