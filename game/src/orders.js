// orders.js — the order board: spawning, patience, tips, combos and walk-outs.
// One clear job: the money loop. The kitchen module owns the stations.
import { RECIPES, RUSH_AT, SHIFT_SECONDS } from './config.js';

export class OrderBoard {
  constructor() {
    this.orders = []; // {id, recipe, patience, maxPatience, bornAt}
    this.nextId = 1;
    this.spawnIn = 2.5; // first order arrives fast so the board is never empty
    this.served = 0;
    this.walkedOut = 0;
    this.earned = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboTimer = 0; // seconds left to keep the combo alive
    this.lastServeAt = -99;
  }

  get rush() {
    return this.timeLeft <= RUSH_AT;
  }

  // Called every frame with the shift clock; dt in seconds.
  update(dt, timeLeft, onWalkout, onRushStart) {
    this.timeLeft = timeLeft;
    const wasRush = this._wasRush;
    this._wasRush = this.rush;
    if (this.rush && !wasRush && onRushStart) onRushStart();

    // Spawn a new order when the timer lapses and the board has room.
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.orders.length < 4) {
      this.spawnOrder(timeLeft);
      this.spawnIn = this.rush ? 7 + Math.random() * 3 : 11 + Math.random() * 5;
    }
    // Patience drains; an empty bar walks the customer out.
    for (const o of this.orders) o.patience -= dt;
    const gone = this.orders.filter((o) => o.patience <= 0);
    if (gone.length) {
      this.orders = this.orders.filter((o) => o.patience > 0);
      for (const o of gone) {
        this.walkedOut += 1;
        this.combo = 0;
        this.comboTimer = 0;
        if (onWalkout) onWalkout(o);
      }
    }
    // Combo only survives a short gap between serves.
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
  }

  spawnOrder(timeLeft) {
    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    const patience = this.rush ? 30 : 45;
    this.orders.push({
      id: this.nextId++,
      recipe,
      patience,
      maxPatience: patience,
      bornAt: SHIFT_SECONDS - timeLeft,
    });
  }

  // Does any open order match this exact plate stack? Returns the order or null.
  findMatch(stack) {
    const key = stack.join('|');
    return this.orders.find((o) => o.recipe.needs.join('|') === key) ?? null;
  }

  // Serve a matching order: price + speed tip, times the combo multiplier.
  serve(order, timeLeft) {
    const patienceRatio = Math.max(0, order.patience / order.maxPatience);
    const tip = Math.round(order.recipe.price * 0.5 * patienceRatio);
    this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = 20;
    const multiplier = 1 + (this.combo - 1) * 0.25;
    const paid = Math.round((order.recipe.price + tip) * multiplier);
    this.earned += paid;
    this.score += paid + (this.combo > 1 ? 25 * (this.combo - 1) : 0);
    this.served += 1;
    this.lastServeAt = SHIFT_SECONDS - timeLeft;
    this.orders = this.orders.filter((o) => o.id !== order.id);
    return { paid, tip, combo: this.combo, multiplier };
  }

  // Stars for the end-of-shift summary: earnings + service record.
  stars() {
    let s = 1;
    if (this.earned >= 220 && this.served >= 8) s = 2;
    if (this.earned >= 340 && this.served >= 12 && this.walkedOut <= 2) s = 3;
    return s;
  }
}
