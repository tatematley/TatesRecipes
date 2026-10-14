import { Recipe, Ingredient, Instruction, Measurement } from '../types'

// Sample recipes used when the app runs without Supabase credentials.
// Written to exercise every feature: groups, timers, tips, tags, sources.

let n = 0
const id = () => `demo-${++n}`

function ing(line: string, group?: string): Ingredient {
  // "qty|unit|name|prep"
  const [quantity, measurement, name, preparation = ''] = line.split('|')
  return { id: id(), quantity, measurement: measurement as Measurement, name, preparation, order: 0, group }
}
function steps(...texts: string[]): Instruction[] {
  return texts.map((text, i) => ({ id: id(), step: i + 1, text }))
}
function withOrder(ings: Ingredient[]): Ingredient[] {
  return ings.map((x, i) => ({ ...x, order: i }))
}
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

type Seed = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'photos' | 'heroImage'> & { age: number }

const SEEDS: Seed[] = [
  {
    title: 'Brown Butter Chocolate Chip Cookies',
    description: 'Crispy edges, gooey middles, and that nutty brown butter thing going on. The cookie everyone asks me to bring.',
    category: 'Desserts', prepTime: 20, cookTime: 12, totalTime: 32, servings: 24, difficulty: 'easy',
    sourceUrl: '', sourceName: '', createdByTate: true, isFavorite: true, age: 2,
    tatesTips: 'Chill the dough for at least an hour (overnight is even better). Pull them when the centers still look a little underdone.\nFlaky salt on top is not optional.',
    tags: ['Family Favorite', 'Crowd Pleaser', 'Vegetarian', 'Worth the Effort'],
    ingredients: withOrder([
      ing('1|cup|unsalted butter|browned and cooled'), ing('1|cup|brown sugar|packed'), ing('1/2|cup|granulated sugar'),
      ing('2||eggs|room temperature'), ing('2|tsp|vanilla extract'), ing('2 1/4|cup|all-purpose flour'),
      ing('1|tsp|baking soda'), ing('1|tsp|kosher salt'), ing('2|cup|dark chocolate|chopped'), ing('1|pinch|flaky sea salt|for topping'),
    ]),
    instructions: steps(
      'Brown the butter in a light-colored pan over medium heat, swirling, until it smells nutty and the solids turn golden, about 5 minutes. Pour into a bowl and cool for 15 minutes.',
      'Whisk the brown sugar and granulated sugar into the butter, then beat in the eggs and vanilla until glossy.',
      'Stir in the flour, baking soda and salt until just combined, then fold in the chocolate.',
      'Cover and chill the dough for at least 1 hour.',
      'Heat the oven to 350°F. Scoop 2-tablespoon balls onto a lined sheet, spacing them well apart.',
      'Bake for 11 to 12 minutes, until the edges are set and golden. Sprinkle with flaky salt and let cool on the sheet for 5 minutes.',
    ),
  },
  {
    title: 'Weeknight Chicken Tikka Masala',
    description: 'Rich, creamy and way faster than takeout. Make the rice first and this comes together while it cooks.',
    category: 'Dinner', prepTime: 15, cookTime: 30, totalTime: 45, servings: 4, difficulty: 'medium',
    sourceUrl: 'https://www.seriouseats.com', sourceName: 'Serious Eats (tweaked)', createdByTate: false, isFavorite: true, age: 6,
    tatesTips: 'Thighs, not breasts. Double the garlic. A squeeze of lime at the end wakes the whole thing up.',
    tags: ['Weeknight Dinner', 'Gluten Free', 'High Protein', 'Comfort Food'],
    ingredients: withOrder([
      ing('1 1/2|lb|chicken thighs|cut into bite-size pieces', 'Chicken'), ing('1/2|cup|plain yogurt', 'Chicken'),
      ing('2|tsp|garam masala', 'Chicken'), ing('1|tsp|kosher salt', 'Chicken'),
      ing('2|tbsp|butter', 'Sauce'), ing('1||yellow onion|finely diced', 'Sauce'), ing('4|clove|garlic|grated', 'Sauce'),
      ing('1|tbsp|fresh ginger|grated', 'Sauce'), ing('2|tbsp|tomato paste', 'Sauce'), ing('1|can|crushed tomatoes|28 oz', 'Sauce'),
      ing('3/4|cup|heavy cream', 'Sauce'), ing('1|tbsp|garam masala', 'Sauce'), ing('1/2|cup|cilantro|chopped', 'To serve'),
      ing('1||lime|cut into wedges', 'To serve'),
    ]),
    instructions: steps(
      'Toss the chicken with yogurt, garam masala and salt. Let it sit while you prep the sauce, at least 10 minutes.',
      'Heat a large skillet over high heat and sear the chicken in batches until charred in spots, about 4 minutes per batch. Set aside.',
      'Lower the heat to medium. Melt the butter, add the onion and cook until soft and golden, 8 minutes.',
      'Add the garlic, ginger, tomato paste and garam masala and cook for 1 minute, until fragrant.',
      'Pour in the crushed tomatoes and simmer for 10 minutes. Stir in the cream and the chicken and simmer 5 minutes more.',
      'Finish with cilantro and lime. Serve over basmati rice with warm naan.',
    ),
  },
  {
    title: 'Sunday Sourdough Boule',
    description: 'My go-to loaf. Long, slow, mostly hands-off, and it makes the whole house smell incredible.',
    category: 'Breads', prepTime: 30, cookTime: 45, totalTime: 1440, servings: 10, difficulty: 'advanced',
    sourceUrl: '', sourceName: '', createdByTate: true, isFavorite: false, age: 14,
    tatesTips: 'Feed the starter the night before. If the kitchen is cold, the bulk ferment can take 7+ hours, so watch the dough, not the clock.',
    tags: ['Worth the Effort', 'Vegan', 'Dairy Free'],
    ingredients: withOrder([
      ing('100|g|active sourdough starter'), ing('375|g|water|lukewarm'), ing('500|g|bread flour'), ing('10|g|fine sea salt'),
    ]),
    instructions: steps(
      'Mix the starter and 350 g of the water, then add the flour and mix until no dry bits remain. Rest for 45 minutes.',
      'Add the salt and remaining water and squeeze it through the dough until absorbed.',
      'Bulk ferment for 5 to 6 hours at room temperature, doing a set of stretch and folds every 30 minutes for the first 2 hours.',
      'Shape into a tight boule, place seam-side up in a floured banneton, and refrigerate overnight (12 to 16 hours).',
      'Heat the oven with a Dutch oven inside to 500°F for 45 minutes.',
      'Score the loaf, lower it into the pot, cover and bake for 20 minutes. Uncover, drop to 450°F and bake 25 minutes more until deep brown.',
      'Cool on a rack for at least 1 hour before slicing.',
    ),
  },
  {
    title: 'Lemony Orzo with Peas and Feta',
    description: 'Bright, quick, and somehow both a side and a dinner. Great warm or cold the next day.',
    category: 'Sides', prepTime: 5, cookTime: 15, totalTime: 20, servings: 4, difficulty: 'easy',
    sourceUrl: 'https://cooking.nytimes.com', sourceName: 'NYT Cooking', createdByTate: false, isFavorite: false, age: 9,
    tatesTips: 'Toast the orzo in the butter first. Small step, big flavor.',
    tags: ['Quick', 'Vegetarian', 'Weeknight Dinner', 'Summer'],
    ingredients: withOrder([
      ing('1 1/2|cup|orzo'), ing('2|tbsp|butter'), ing('3|cup|chicken stock'), ing('1|cup|frozen peas'),
      ing('1||lemon|zested and juiced'), ing('1/2|cup|feta|crumbled'), ing('1/4|cup|fresh dill|chopped'), ing('||black pepper|to taste'),
    ]),
    instructions: steps(
      'Melt the butter in a saucepan over medium heat and toast the orzo, stirring, until golden, about 3 minutes.',
      'Add the stock, bring to a simmer, and cook for 10 minutes, stirring often, until the orzo is tender and creamy.',
      'Stir in the peas and cook 2 minutes more.',
      'Off the heat, add the lemon zest and juice, feta and dill. Season with pepper and serve.',
    ),
  },
  {
    title: 'Fluffy Buttermilk Pancakes',
    description: 'Tall, tender, slightly tangy. Saturday morning in pancake form.',
    category: 'Breakfast', prepTime: 10, cookTime: 15, totalTime: 25, servings: 4, difficulty: 'easy',
    sourceUrl: '', sourceName: '', createdByTate: true, isFavorite: true, age: 21,
    tatesTips: 'Do not overmix! Lumps are good. Let the batter rest 5 minutes while the griddle heats.',
    tags: ['Family Favorite', 'Vegetarian', 'Easy', 'Devyn'],
    ingredients: withOrder([
      ing('2|cup|all-purpose flour'), ing('2|tbsp|sugar'), ing('2|tsp|baking powder'), ing('1/2|tsp|baking soda'),
      ing('1/2|tsp|salt'), ing('2|cup|buttermilk'), ing('2||eggs'), ing('4|tbsp|butter|melted, plus more for the pan'),
    ]),
    instructions: steps(
      'Whisk the flour, sugar, baking powder, baking soda and salt in a big bowl.',
      'In another bowl whisk the buttermilk, eggs and melted butter.',
      'Pour the wet into the dry and fold until just combined. Rest the batter for 5 minutes.',
      'Heat a buttered griddle over medium. Pour 1/3 cup batter per pancake and cook until bubbles form, about 2 minutes. Flip and cook 1 minute more.',
    ),
  },
  {
    title: 'Roasted Tomato Basil Soup',
    description: 'Roasting the tomatoes makes it taste like the middle of August, even in January.',
    category: 'Soups', prepTime: 15, cookTime: 50, totalTime: 65, servings: 6, difficulty: 'easy',
    sourceUrl: '', sourceName: '', createdByTate: true, isFavorite: false, age: 30,
    tatesTips: 'Make grilled cheese croutons. You will not regret it.',
    tags: ['Cozy Meal', 'Vegetarian', 'Gluten Free', 'Meal Prep'],
    ingredients: withOrder([
      ing('3|lb|Roma tomatoes|halved'), ing('1||yellow onion|quartered'), ing('6|clove|garlic|peeled'), ing('3|tbsp|olive oil'),
      ing('2|cup|vegetable stock'), ing('1|cup|fresh basil|packed'), ing('1/2|cup|heavy cream'), ing('1|tsp|kosher salt'),
    ]),
    instructions: steps(
      'Heat the oven to 425°F. Toss the tomatoes, onion and garlic with olive oil and salt on a sheet pan.',
      'Roast for 40 minutes, until the tomatoes are collapsed and charred at the edges.',
      'Scrape everything into a pot with the stock and simmer for 10 minutes.',
      'Add the basil and blend until smooth. Stir in the cream and adjust the salt.',
    ),
  },
  {
    title: 'Crispy Smashed Potatoes',
    description: 'Boiled, smashed, roasted until shatteringly crisp. The side that steals the show.',
    category: 'Sides', prepTime: 10, cookTime: 50, totalTime: 60, servings: 4, difficulty: 'easy',
    sourceUrl: '', sourceName: '', createdByTate: false, isFavorite: true, age: 4,
    tatesTips: 'Let them steam-dry for a few minutes after boiling so they get extra crispy.',
    tags: ['Crowd Pleaser', 'Vegan', 'Gluten Free', 'Sunday Dinner'],
    ingredients: withOrder([
      ing('2|lb|baby potatoes'), ing('1/4|cup|olive oil'), ing('1|tsp|flaky salt'), ing('4|clove|garlic|minced'),
      ing('2|tbsp|fresh rosemary|chopped'), ing('1/4|cup|parmesan|grated'),
    ]),
    instructions: steps(
      'Boil the potatoes in well-salted water until fork-tender, about 20 minutes. Drain and let steam-dry for 5 minutes.',
      'Heat the oven to 450°F. Oil a sheet pan, add the potatoes and smash each one flat with the bottom of a glass.',
      'Drizzle with more oil, sprinkle with salt, garlic and rosemary.',
      'Roast for 25 minutes, until deeply golden and crisp. Shower with parmesan and serve hot.',
    ),
  },
  {
    title: 'Spicy Pork Bulgogi Bowls',
    description: 'Sweet, spicy, caramelized pork over rice with quick pickles. A total crowd pleaser.',
    category: 'Dinner', prepTime: 20, cookTime: 10, totalTime: 30, servings: 4, difficulty: 'medium',
    sourceUrl: 'https://www.maangchi.com', sourceName: 'Maangchi', createdByTate: false, isFavorite: false, age: 11,
    tatesTips: 'Freeze the pork for 20 minutes so it is easier to slice thin.',
    tags: ['Weeknight Dinner', 'Dairy Free', 'High Protein'],
    ingredients: withOrder([
      ing('1 1/2|lb|pork shoulder|thinly sliced', 'Pork'), ing('3|tbsp|gochujang', 'Pork'), ing('2|tbsp|soy sauce', 'Pork'),
      ing('1|tbsp|honey', 'Pork'), ing('1|tbsp|sesame oil', 'Pork'), ing('4|clove|garlic|minced', 'Pork'),
      ing('1||cucumber|thinly sliced', 'Quick pickles'), ing('1/4|cup|rice vinegar', 'Quick pickles'), ing('1|tsp|sugar', 'Quick pickles'),
      ing('4|cup|cooked rice', 'To serve'), ing('2||green onions|sliced', 'To serve'),
    ]),
    instructions: steps(
      'Mix the gochujang, soy sauce, honey, sesame oil and garlic. Toss with the pork and marinate for 15 minutes.',
      'Combine the cucumber, rice vinegar and sugar and set aside to pickle.',
      'Cook the pork in a very hot skillet in batches until caramelized, about 3 minutes per batch.',
      'Serve over rice topped with pickles and green onions.',
    ),
  },
  {
    title: 'Classic Pumpkin Pie',
    description: 'Silky, warmly spiced, and the reason Thanksgiving is my favorite holiday.',
    category: 'Holiday Recipes', prepTime: 25, cookTime: 60, totalTime: 85, servings: 8, difficulty: 'medium',
    sourceUrl: '', sourceName: 'Grandma Matley', createdByTate: false, isFavorite: true, age: 40,
    tatesTips: 'Blind bake the crust for 15 minutes first so the bottom stays crisp.',
    tags: ['Thanksgiving', 'Vegetarian', 'Family Favorite'],
    ingredients: withOrder([
      ing('1||pie crust|unbaked, 9-inch', 'Crust'), ing('1|can|pumpkin puree|15 oz', 'Filling'), ing('3/4|cup|brown sugar', 'Filling'),
      ing('2||eggs', 'Filling'), ing('1|cup|evaporated milk', 'Filling'), ing('1|tsp|cinnamon', 'Filling'),
      ing('1/2|tsp|ground ginger', 'Filling'), ing('1/4|tsp|ground cloves', 'Filling'), ing('1/2|tsp|salt', 'Filling'),
    ]),
    instructions: steps(
      'Heat the oven to 425°F. Blind bake the crust for 15 minutes.',
      'Whisk together the pumpkin, sugar, eggs, evaporated milk, spices and salt until smooth.',
      'Pour into the warm crust and bake for 15 minutes.',
      'Lower the oven to 350°F and bake 40 to 45 minutes more, until the center barely jiggles.',
      'Cool completely, at least 2 hours, before slicing.',
    ),
  },
  {
    title: 'Mango Chili Margaritas',
    description: 'Sweet heat in a glass. Perfect for patio season.',
    category: 'Drinks', prepTime: 10, cookTime: null, totalTime: 10, servings: 4, difficulty: 'easy',
    sourceUrl: '', sourceName: '', createdByTate: true, isFavorite: false, age: 1,
    tatesTips: 'Tajín on the rim, always.',
    tags: ['Party', 'Summer', 'Vegan', '4th of July'],
    ingredients: withOrder([
      ing('2|cup|frozen mango'), ing('3/4|cup|blanco tequila'), ing('1/3|cup|lime juice'), ing('1/4|cup|orange liqueur'),
      ing('2|tbsp|agave syrup'), ing('1||jalapeño|seeded'), ing('2|cup|ice'), ing('2|tbsp|Tajín|for the rim'),
    ]),
    instructions: steps(
      'Rim four glasses with lime and Tajín.',
      'Blend the mango, tequila, lime juice, orange liqueur, agave, jalapeño and ice until smooth.',
      'Pour and serve right away.',
    ),
  },
  {
    title: 'Garlic Parmesan Caesar Salad',
    description: 'Punchy homemade dressing and giant crunchy croutons. Better than any restaurant version.',
    category: 'Salads', prepTime: 20, cookTime: 10, totalTime: 30, servings: 4, difficulty: 'easy',
    sourceUrl: 'https://www.bonappetit.com', sourceName: 'Bon Appétit', createdByTate: false, isFavorite: false, age: 18,
    tatesTips: '',
    tags: ['Sunday Dinner', 'Crowd Pleaser'],
    ingredients: withOrder([
      ing('2||romaine hearts|chopped', 'Salad'), ing('3|cup|crusty bread|torn', 'Croutons'), ing('3|tbsp|olive oil', 'Croutons'),
      ing('2||anchovy fillets', 'Dressing'), ing('1|clove|garlic', 'Dressing'), ing('1||egg yolk', 'Dressing'),
      ing('1|tbsp|lemon juice', 'Dressing'), ing('1|tsp|dijon mustard', 'Dressing'), ing('1/2|cup|olive oil', 'Dressing'),
      ing('1/2|cup|parmesan|finely grated', 'Dressing'),
    ]),
    instructions: steps(
      'Heat the oven to 400°F. Toss the bread with oil and salt and bake for 10 minutes, until golden.',
      'Mash the anchovies and garlic into a paste. Whisk in the egg yolk, lemon and mustard, then stream in the oil.',
      'Stir in the parmesan. Toss the romaine with the dressing and croutons.',
    ),
  },
  {
    title: 'Overnight Cinnamon Rolls',
    description: 'Prep tonight, bake tomorrow morning, look like a hero.',
    category: 'Breakfast', prepTime: 45, cookTime: 25, totalTime: 600, servings: 12, difficulty: 'advanced',
    sourceUrl: '', sourceName: '', createdByTate: true, isFavorite: false, age: 26,
    tatesTips: 'Use dental floss to cut the rolls. Cleanest cut ever.',
    tags: ['Christmas', 'Worth the Effort', 'Vegetarian', 'Devyn'],
    ingredients: withOrder([
      ing('4 1/2|cup|all-purpose flour', 'Dough'), ing('1|package|instant yeast', 'Dough'), ing('1/3|cup|sugar', 'Dough'),
      ing('1|cup|warm milk', 'Dough'), ing('1/3|cup|butter|melted', 'Dough'), ing('2||eggs', 'Dough'),
      ing('1|cup|brown sugar', 'Filling'), ing('3|tbsp|cinnamon', 'Filling'), ing('1/3|cup|butter|softened', 'Filling'),
      ing('4|oz|cream cheese|softened', 'Icing'), ing('1 1/2|cup|powdered sugar', 'Icing'), ing('1|tsp|vanilla extract', 'Icing'),
    ]),
    instructions: steps(
      'Mix the dough ingredients and knead for 8 minutes until smooth. Let rise for 1 hour, until doubled.',
      'Roll into a large rectangle, spread with softened butter, and sprinkle with the brown sugar and cinnamon.',
      'Roll up tightly, cut into 12 rolls and arrange in a buttered pan. Cover and refrigerate overnight.',
      'In the morning, let the rolls sit out for 30 minutes while the oven heats to 350°F.',
      'Bake for 25 minutes until golden. Beat the icing ingredients and spread over the warm rolls.',
    ),
  },
]

export function buildDemoRecipes(): Recipe[] {
  return SEEDS.map(({ age, ...seed }, i) => ({
    ...seed,
    id: `demo-recipe-${i + 1}`,
    heroImage: '',
    photos: [],
    createdAt: daysAgo(age),
    updatedAt: daysAgo(age),
  }))
}
