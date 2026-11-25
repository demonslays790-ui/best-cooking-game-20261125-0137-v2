// config.js — Sizzle & Serve 2: The Golden Skillet. All tuning, ingredients and recipes.
// One clear job: the game's data. Nothing here draws or updates state.
export const VIEW = { W: 1280, H: 720 };
export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 4;
export const RUSH_AT = 60; // seconds left when the dinner rush hits

// Ingredient catalogue. `prep` says what turns the raw item into a servable one:
// none = ready to plate, 'chop' = chopping board, 'fry' = stove.
export const INGREDIENTS = {
  bun:     { name: 'Bun',        color: '#f2b25c', dark: '#c98a2e', prep: 'none', key: '1', emoji: '🍞' },
  patty:   { name: 'Patty',      color: '#c96f4a', dark: '#8a3f22', prep: 'fry',  key: '2', emoji: '🥩' },
  cheese:  { name: 'Cheese',     color: '#ffd23e', dark: '#e0a800', prep: 'none', key: '3', emoji: '🧀' },
  tomato:  { name: 'Tomato',     color: '#ff5a4e', dark: '#c22e24', prep: 'chop', key: '4', emoji: '🍅' },
  lettuce: { name: 'Lettuce',    color: '#7ed957', dark: '#3f9e2e', prep: 'chop', key: '5', emoji: '🥬' },
  onion:   { name: 'Onion',      color: '#e8d8f5', dark: '#a67fc9', prep: 'chop', key: '6', emoji: '🧅' },
};

// A cooked patty is its own servable item (a burnt one is trash, not food).
export const COOKED = {
  cookedPatty: { name: 'Patty (cooked)', color: '#8a4b2a', dark: '#5e2f16', prep: 'none', key: '', emoji: '🍔' },
};

// Recipes: `needs` lists servable item ids in bottom-to-top stack order.
export const RECIPES = [
  { id: 'classic',   name: 'Classic Burger',  price: 24, needs: ['bun', 'cookedPatty', 'lettuce'] },
  { id: 'cheese',    name: 'Cheeseburger',    price: 28, needs: ['bun', 'cookedPatty', 'cheese'] },
  { id: 'garden',    name: 'Garden Stack',    price: 30, needs: ['bun', 'lettuce', 'tomato', 'cheese'] },
  { id: 'veggie',    name: 'Veggie Delight',  price: 34, needs: ['bun', 'lettuce', 'tomato', 'onion', 'cheese'] },
  { id: 'onionmelt', name: 'Onion Melt',      price: 32, needs: ['bun', 'cookedPatty', 'cheese', 'onion'] },
  { id: 'double',    name: 'Double Trouble',  price: 38, needs: ['bun', 'cookedPatty', 'cookedPatty', 'cheese', 'onion'] },
  { id: 'golden',    name: 'Golden Stack',    price: 44, needs: ['bun', 'cookedPatty', 'cheese', 'tomato', 'lettuce', 'onion'] },
  { id: 'bigsizzle', name: 'Big Sizzle',      price: 48, needs: ['bun', 'cookedPatty', 'cookedPatty', 'cheese', 'tomato', 'lettuce'] },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Station layout (canvas pixels). Stations sit along the back wall; the chef walks
// the floor between the station row and the bottom row.
export const STATIONS = {
  fridge: { x: 20,  y: 214, w: 172, h: 122, label: 'FRIDGE',  sub: 'take ingredients 1-6' },
  boardA: { x: 206, y: 214, w: 158, h: 122, label: 'CHOPPING', sub: 'chop: 3s' },
  boardB: { x: 378, y: 214, w: 158, h: 122, label: 'CHOPPING', sub: 'chop: 3s' },
  stoveA: { x: 550, y: 214, w: 158, h: 122, label: 'STOVE',   sub: 'fry: 4s — watch it!' },
  stoveB: { x: 722, y: 214, w: 158, h: 122, label: 'STOVE',   sub: 'fry: 4s — watch it!' },
  sink:   { x: 894, y: 214, w: 150, h: 122, label: 'SINK',    sub: 'rinse hands, +focus' },
  menu:   { x: 1058, y: 214, w: 202, h: 122, label: 'MENU',   sub: 'recipes on the wall' },
};

// The long counter island: ingredient bins on top, two plating plates side by side.
export const COUNTER = { x: 300, y: 400, w: 680, h: 150 };
export const PLATE_SPOTS = [
  { x: 700, y: 470, w: 110, h: 70 },
  { x: 845, y: 470, w: 110, h: 70 },
];
export const SERVE_PASS = { x: 1120, y: 380, w: 140, h: 200, label: 'SERVE PASS', sub: 'ring the bell!' };
export const BIN = { x: 20, y: 380, w: 120, h: 120, label: 'BIN', sub: 'toss burnt food' };

// Rects the chef cannot walk through (stations row is above the floor already).
export const BLOCKS = [
  { x: 300, y: 400, w: 680, h: 150 },   // counter island
  { x: 1120, y: 380, w: 140, h: 200 }, // serve pass
  { x: 20, y: 380, w: 120, h: 120 },   // bin
];

export const WALK = { x0: 26, x1: 1254, y0: 344, y1: 700 }; // chef walkable floor
export const CHEF_SPEED = 265;

export function recipeNeedsLabel(recipe) {
  return recipe.needs.map((id) => (INGREDIENTS[id] ?? COOKED[id]).name).join(' + ');
}

export function formatClock(secondsLeft) {
  const s = Math.max(0, Math.ceil(secondsLeft));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
