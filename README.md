# best-cooking-game-20261125-0137-v2

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/demonslays790-ui/best-cooking-game-20261125-0137-v2/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/demonslays790-ui/best-cooking-game-20261125-0137-v2/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle & Serve 2 — The Golden Skillet: run a busy little kitchen through the lunch rush. Grab ingredients from the fridge, chop veggies on the boards, fry patties on the stoves (but don't let them burn), stack burgers layer by layer on the plates, and ring the serve-pass bell before the customer walks out. Eight recipes, speed tips, combo multipliers, a sink that freshens your hands, and a dinner rush in the last minute — all in a three-minute shift.

## How to play

- **Move** with WASD or the arrow keys — or click anywhere on the floor to walk there. Click a station to walk up to it and use it.
- **Fridge** — take an ingredient (keys 1–6). Buns and cheese are ready to plate; patties need a stove, tomato, lettuce and onion need a chopping board.
- **Chopping boards (×2)** — chop in three seconds. **Stoves (×2)** — a patty fries in four seconds, but leave it too long and it burns; bin the burnt one.
- **Sink** — rinse your hands: chopping and frying run 25% faster for 20 seconds.
- **Plating counter** — stack the recipe's ingredients on a plate in order, pick the plate up, and serve it at the **serve pass**. A plate must match an order ticket exactly — a matching plate is flagged on the counter.
- Serve fast for a tip, and serve twice in a row within 20 seconds for a combo multiplier (up to ×2). In the last minute the dinner rush hits: orders arrive faster and patience runs shorter.
- Eight recipes: Classic Burger, Cheeseburger, Garden Stack, Veggie Delight, Onion Melt, Double Trouble, Golden Stack and Big Sizzle. The shift ends after three minutes — earn 3 stars by serving 12+ orders, earning $340+, and losing at most 2 customers.

All art is drawn in code on a canvas and all sounds (chops, sizzles, bells, a little kitchen tune) are synthesised with WebAudio. No external assets, no network requests, no libraries — just static files under `game/`.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a desktop browser
```

## Files

- `game/index.html` — the page; `game/src/main.js` — game loop and wiring
- `game/src/config.js` — tuning, ingredients, the 8 recipes, station layout
- `game/src/orders.js` — order board: spawning, patience, tips, combos
- `game/src/kitchen.js` — station state machines (fridge, boards, stoves, sink, bin, plates, serve pass)
- `game/src/chef.js` — chef movement, click-to-walk, collision
- `game/src/render.js` — all canvas art: kitchen, stations, burgers, chef, HUD
- `game/src/particles.js` — steam, sizzle sparks, score popups, serve confetti
- `game/src/audio.js` — synthesised WebAudio sounds and music
- `game/src/input.js` — keyboard and mouse input
- `game/src/shots.js` — staged demo states used for the screenshots (real renders of the game's own code)
- `screenshots/` — 4 screenshots: the lunch rush, burger assembly, the dinner rush, and a plate ready to serve

---

<sub>Entered on [make.fun](https://make.fun/?ref=y7zat5h5&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
