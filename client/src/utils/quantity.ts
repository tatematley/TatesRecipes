import { Ingredient, Measurement } from '../types'

// ─── Parsing & formatting ──────────────────────────────────────

const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

/** "1 1/2" → 1.5, "½" → 0.5, "2-3" → 2 (first value), "" → null */
export function parseQuantity(raw: string): number | null {
  if (!raw) return null
  let s = raw.trim()
  for (const [ch, v] of Object.entries(UNICODE_FRACTIONS)) s = s.replace(ch, ` ${v}`)
  s = s.split(/\s*(?:-|–|to)\s*/)[0]
  let total = 0
  let found = false
  for (const part of s.split(/\s+/)) {
    if (!part) continue
    if (part.includes('/')) {
      const [a, b] = part.split('/').map(Number)
      if (!isNaN(a) && !isNaN(b) && b !== 0) { total += a / b; found = true }
    } else {
      const v = parseFloat(part)
      if (!isNaN(v)) { total += v; found = true }
    }
  }
  return found ? total : null
}

const NICE_FRACTIONS: [number, string][] = [
  [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.375, '⅜'], [0.5, '½'],
  [0.625, '⅝'], [2 / 3, '⅔'], [0.75, '¾'], [0.875, '⅞'],
]

/** 1.5 → "1 ½", 0.333 → "⅓", 2.4 → "2.4" */
export function formatQuantity(value: number): string {
  if (value <= 0) return '0'
  if (value >= 20) return String(Math.round(value))
  const whole = Math.floor(value)
  const frac = value - whole
  if (frac < 0.04) return String(whole)
  if (frac > 0.96) return String(whole + 1)
  const match = NICE_FRACTIONS.find(([f]) => Math.abs(frac - f) < 0.04)
  if (match) return whole > 0 ? `${whole} ${match[1]}` : match[1]
  return (Math.round(value * 10) / 10).toString()
}

/** Scales the quantity text; leaves non-numeric text ("to taste") alone. */
export function scaleQuantity(raw: string, factor: number): string {
  if (!raw || factor === 1) return raw
  const v = parseQuantity(raw)
  if (v == null) return raw
  return formatQuantity(v * factor)
}

// ─── Unit conversion ───────────────────────────────────────────

export type UnitSystem = 'original' | 'metric' | 'us'

const TO_ML: Partial<Record<Measurement, number>> = {
  tsp: 4.93, tbsp: 14.79, cup: 236.6, 'fl oz': 29.57, pint: 473.2, quart: 946.4, gallon: 3785,
}
const TO_G: Partial<Record<Measurement, number>> = { oz: 28.35, lb: 453.6, g: 1, kg: 1000 }

export interface Amount { quantity: string; unit: string }

/** Converts an ingredient amount to the given system, returning display strings. */
export function convertAmount(ing: Pick<Ingredient, 'quantity' | 'measurement'>, factor: number, system: UnitSystem): Amount {
  const value = parseQuantity(ing.quantity)
  const unit = ing.measurement
  if (value == null) return { quantity: ing.quantity, unit }
  const scaled = value * factor

  if (system === 'metric') {
    if (TO_ML[unit] && unit !== 'tsp' && unit !== 'tbsp') {
      const ml = scaled * TO_ML[unit]!
      return ml >= 1000 ? { quantity: round(ml / 1000, 2), unit: 'L' } : { quantity: round(ml, ml < 20 ? 0 : -1), unit: 'ml' }
    }
    if (unit === 'oz' || unit === 'lb') {
      const g = scaled * TO_G[unit]!
      return g >= 1000 ? { quantity: round(g / 1000, 2), unit: 'kg' } : { quantity: round(g, g < 50 ? 0 : -1), unit: 'g' }
    }
  }
  if (system === 'us') {
    if (unit === 'g' || unit === 'kg') {
      const g = scaled * TO_G[unit]!
      return g >= 453.6 ? { quantity: formatQuantity(g / 453.6), unit: 'lb' } : { quantity: formatQuantity(g / 28.35), unit: 'oz' }
    }
  }
  return { quantity: formatQuantity(scaled), unit }
}

function round(v: number, digits: number): string {
  const p = Math.pow(10, digits)
  return String(Math.round(v * p) / p)
}

// ─── Names, aisles, matching ───────────────────────────────────

const DESCRIPTORS = /\b(fresh|large|small|medium|chopped|minced|diced|sliced|grated|ground|unsalted|salted|extra[- ]virgin|boneless|skinless|ripe|organic|whole|frozen|dried|packed|softened|melted|room temperature|finely|roughly|thinly)\b/g

/** "Large Eggs" → "egg", "fresh basil leaves" → "basil leave" (good enough for matching) */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(DESCRIPTORS, '')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith('es') && !w.endsWith('ses') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
    .join(' ')
    .trim()
}

/** True when two ingredient names likely refer to the same thing. */
export function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const wa = na.split(' ')
  const wb = nb.split(' ')
  // "chicken" matches "chicken thigh"; "garlic" matches "garlic clove"
  return wa.every((w) => wb.includes(w)) || wb.every((w) => wa.includes(w))
}

export const AISLES = [
  'Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 'Pantry', 'Spices & Baking', 'Frozen', 'Drinks', 'Other',
] as const
export type Aisle = (typeof AISLES)[number]

const AISLE_KEYWORDS: [Aisle, string[]][] = [
  ['Frozen', ['frozen', 'ice cream', 'ice']],
  ['Meat & Seafood', ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage', 'shrimp', 'salmon', 'fish', 'steak', 'ham', 'anchov', 'prosciutto', 'chorizo', 'tuna', 'crab']],
  ['Dairy & Eggs', ['milk', 'butter', 'cream', 'cheese', 'yogurt', 'egg', 'parmesan', 'feta', 'mozzarella', 'cheddar', 'ricotta', 'buttermilk', 'sour cream', 'half-and-half']],
  ['Bakery', ['bread', 'bun', 'tortilla', 'pita', 'baguette', 'naan', 'pie crust', 'croissant', 'roll']],
  ['Spices & Baking', ['salt', 'pepper', 'cinnamon', 'cumin', 'paprika', 'garam masala', 'clove', 'nutmeg', 'chili powder', 'oregano', 'thyme', 'vanilla', 'baking soda', 'baking powder', 'yeast', 'flour', 'sugar', 'cocoa', 'chocolate', 'tajín', 'tajin', 'spice', 'starter', 'powder']],
  ['Drinks', ['tequila', 'vodka', 'rum', 'wine', 'beer', 'liqueur', 'soda', 'coffee', 'tea']],
  ['Produce', ['onion', 'garlic', 'tomato', 'potato', 'lemon', 'lime', 'orange', 'apple', 'banana', 'berry', 'berries', 'lettuce', 'romaine', 'spinach', 'kale', 'basil', 'cilantro', 'parsley', 'dill', 'rosemary', 'mint', 'scallion', 'green onion', 'pepper', 'jalapeño', 'jalapeno', 'cucumber', 'carrot', 'celery', 'mushroom', 'avocado', 'zucchini', 'squash', 'pumpkin', 'mango', 'pea', 'corn', 'broccoli', 'cabbage', 'ginger', 'shallot', 'herb', 'fruit']],
  ['Pantry', ['oil', 'vinegar', 'stock', 'broth', 'pasta', 'orzo', 'rice', 'noodle', 'bean', 'lentil', 'can', 'sauce', 'paste', 'honey', 'syrup', 'agave', 'mustard', 'mayo', 'ketchup', 'soy', 'gochujang', 'nut', 'oat', 'puree', 'evaporated', 'condensed', 'breadcrumb', 'crumb']],
]

export function aisleFor(name: string): Aisle {
  const n = name.toLowerCase()
  // "ground ginger" is a spice, "fresh ginger" is produce
  if (/\b(ground|dried)\b/.test(n) && !/beef|pork|turkey|chicken|lamb|sausage|meat/.test(n)) return 'Spices & Baking'
  for (const [aisle, words] of AISLE_KEYWORDS) {
    // Word-start matches only, so "ice" doesn't catch "rice" or "juice"
    if (words.some((w) => new RegExp(`(^|[^a-z])${w}`).test(n))) return aisle
  }
  return 'Other'
}

// ─── Grocery combining ─────────────────────────────────────────

export interface GroceryLine {
  key: string
  name: string
  amounts: string[]          // e.g. ["2 cup", "3 tbsp"]
  aisle: Aisle
  recipeIds: string[]
}

/**
 * Merges ingredients from several recipes into one shopping list.
 * Same name + same unit are summed; different units are listed side by side.
 */
export function combineIngredients(
  sources: { recipeId: string; ingredients: Ingredient[]; factor: number }[],
): GroceryLine[] {
  const byName = new Map<string, { name: string; units: Map<string, number | string[]>; recipeIds: Set<string> }>()

  for (const src of sources) {
    for (const ing of src.ingredients) {
      if (!ing.name.trim()) continue
      const key = normalizeName(ing.name) || ing.name.toLowerCase()
      const entry = byName.get(key) ?? { name: ing.name.trim(), units: new Map(), recipeIds: new Set<string>() }
      entry.recipeIds.add(src.recipeId)
      const unit = ing.measurement || ''
      const v = parseQuantity(ing.quantity)
      if (v != null) {
        const prev = entry.units.get(unit)
        entry.units.set(unit, (typeof prev === 'number' ? prev : 0) + v * src.factor)
      } else if (ing.quantity.trim()) {
        const prev = entry.units.get(`text:${unit}`)
        const list = Array.isArray(prev) ? prev : []
        list.push(`${ing.quantity} ${unit}`.trim())
        entry.units.set(`text:${unit}`, list)
      }
      byName.set(key, entry)
    }
  }

  const lines: GroceryLine[] = []
  for (const [key, e] of byName) {
    const amounts: string[] = []
    for (const [unit, v] of e.units) {
      if (typeof v === 'number') amounts.push(`${formatQuantity(v)}${unit ? ` ${unit}` : ''}`)
      else amounts.push(...v)
    }
    lines.push({ key, name: e.name, amounts, aisle: aisleFor(e.name), recipeIds: [...e.recipeIds] })
  }
  return lines.sort((a, b) => a.name.localeCompare(b.name))
}

// ─── Parsing pasted ingredient lines ───────────────────────────

const UNIT_ALIASES: [RegExp, Measurement][] = [
  [/^(teaspoons?|tsps?|t)\.?$/, 'tsp'],
  [/^(tablespoons?|tbsps?|tbs|tb|T)\.?$/, 'tbsp'],
  [/^cups?\.?$/, 'cup'],
  [/^(fluid ounces?|fl\.? ?oz)\.?$/, 'fl oz'],
  [/^(ounces?|oz)\.?$/, 'oz'],
  [/^(pints?|pts?)\.?$/, 'pint'],
  [/^(quarts?|qts?)\.?$/, 'quart'],
  [/^(gallons?|gals?)\.?$/, 'gallon'],
  [/^(grams?|g)\.?$/, 'g'],
  [/^(kilograms?|kgs?)\.?$/, 'kg'],
  [/^(pounds?|lbs?)\.?$/, 'lb'],
  [/^pinch(es)?$/, 'pinch'],
  [/^dash(es)?$/, 'dash'],
  [/^cloves?$/, 'clove'],
  [/^cans?$/, 'can'],
  [/^(packages?|pkgs?)$/, 'package'],
  [/^sticks?$/, 'stick'],
  [/^slices?$/, 'slice'],
  [/^pieces?$/, 'piece'],
]

/** "1 1/2 cups flour, sifted" → { quantity: "1 1/2", measurement: "cup", name: "flour", preparation: "sifted" } */
export function parseIngredientLine(line: string): Pick<Ingredient, 'quantity' | 'measurement' | 'name' | 'preparation'> | null {
  let s = line.replace(/^[\s•\-*–·▢☐]+/, '').trim()
  if (!s) return null
  const qtyMatch = s.match(/^((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?(?:\s*[¼½¾⅓⅔⅛])?|[¼½¾⅓⅔⅛])(?:\s*(?:-|–|to)\s*(?:\d+(?:\/\d+)?|[¼½¾⅓⅔]))?/)
  let quantity = ''
  if (qtyMatch) {
    quantity = qtyMatch[0].trim()
    s = s.slice(qtyMatch[0].length).trim()
  }
  let measurement: Measurement = ''
  const [first, ...rest] = s.split(/\s+/)
  if (first) {
    const word = first.replace(/[(),]/g, '')
    const alias = UNIT_ALIASES.find(([re]) => re.test(word) || re.test(word.toLowerCase()))
    if (alias && quantity) {
      measurement = alias[1]
      s = rest.join(' ')
    }
  }
  s = s.replace(/^of\s+/i, '')
  let name = s
  let preparation = ''
  const comma = s.indexOf(',')
  if (comma > 0) {
    name = s.slice(0, comma).trim()
    preparation = s.slice(comma + 1).trim()
  }
  return { quantity, measurement, name: name.trim(), preparation }
}
