import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '20mb' }))

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const RECIPE_PROMPT = `Extract the recipe from the content above and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "title": "Recipe Name",
  "description": "1-2 sentence casual, conversational description — like a home cook talking to a friend, not a food blogger. Keep it short and chill.",
  "category": one of ["Breakfast","Lunch","Dinner","Desserts","Breads","Sides","Appetizers","Soups","Salads","Snacks","Drinks","Sauces","Holiday Recipes","Family Favorites"],
  "prepTime": integer minutes or null,
  "cookTime": integer minutes or null,
  "totalTime": integer minutes or null,
  "servings": integer or null,
  "difficulty": "easy" | "medium" | "advanced" | null,
  "sourceUrl": "",
  "sourceName": "",
  "tatesTips": "",
  "tags": ["only use tags from the allowed list below"],
  "ingredients": [
    { "quantity": "1", "measurement": "cup", "name": "all-purpose flour", "preparation": "sifted", "order": 0, "group": "Cake" }
  ],
  "instructions": [
    { "step": 1, "text": "Full step description." }
  ]
}

For "measurement" use only one of: "" "tsp" "tbsp" "cup" "oz" "fl oz" "pint" "quart" "gallon" "g" "kg" "lb" "pinch" "dash" "clove" "can" "package" "stick" "whole" "slice" "piece"
If the unit does not match any above, put the unit in the quantity field and use "" for measurement.
For "tags": ONLY use tags from this exact list — do not invent new ones:
Dietary: "Gluten Free" "Dairy Free" "Vegetarian" "Vegan" "Nut Free" "High Protein" "Low Sugar"
Occasion: "Weeknight Dinner" "Sunday Dinner" "BBQ" "Party" "Cozy Meal"
Holidays: "Christmas" "Thanksgiving" "Easter" "4th of July" "Halloween" "New Year's Eve" "Valentine's Day" "Mother's Day" "Father's Day" "St. Patrick's Day"
Other: "Devyn" "Family Favorite" "Quick" "Comfort Food" "Fancy" "Cozy" "Summer" "Meal Prep" "Crowd Pleaser" "Easy" "Worth the Effort"
Only include tags that genuinely apply. Leave the array empty if none fit.

For "group": if the recipe has labeled ingredient sections (e.g. "For the cake", "Frosting", "Sauce", "Dough"), set "group" to that section name for every ingredient in that section. If all ingredients belong to one unlabeled group, set "group" to "" for all of them.
Return ONLY the JSON object — no markdown fences, no explanation, nothing else.`

app.post('/api/parse-recipe', async (req, res) => {
  try {
    const { images, url } = req.body as {
      images?: { data: string; mediaType: string }[]
      url?: string
    }

    let messages: Anthropic.MessageParam[]

    if (images && images.length > 0) {
      messages = [{
        role: 'user',
        content: [
          ...images.map((img) => ({
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: img.data,
            },
          })),
          { type: 'text' as const, text: images.length > 1 ? `These ${images.length} images are pages of the same recipe. ${RECIPE_PROMPT}` : RECIPE_PROMPT },
        ],
      }]
    } else if (url) {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TatesRecipes/1.0)' },
      })
      const html = await resp.text()
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                       .replace(/<style[\s\S]*?<\/style>/gi, '')
                       .replace(/<[^>]+>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .slice(0, 40000)
      messages = [{
        role: 'user',
        content: `URL: ${url}\n\nPage content:\n${text}\n\n${RECIPE_PROMPT}`,
      }]
    } else {
      res.status(400).json({ error: 'Provide images or url' })
      return
    }

    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      messages,
    })

    const raw = (msg.content[0] as Anthropic.TextBlock).text.trim()
    const jsonStr = raw.startsWith('{') ? raw : raw.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(jsonStr)

    res.json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Parse failed' })
  }
})

app.listen(3001, () => console.log('API server → http://localhost:3001'))
