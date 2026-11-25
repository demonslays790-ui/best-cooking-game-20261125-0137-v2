// kitchen.js — the stations: fridge, two chopping boards, two stoves, sink, bin,
// counter island with ingredient bins, two plating plates and the serve pass.
// One clear job: what each station holds and how it changes over time.
import { INGREDIENTS, COOKED } from './config.js';

export const CHOP_SECONDS = 3;
export const FRY_SECONDS = 4;
export const BURN_SECONDS = 7; // seconds past done before a patty burns

// A job slot on a board or stove: {item, progress, done, burnt}
function emptySlot() {
  return { item: null, progress: 0, done: false, burnt: false };
}

export class Kitchen {
  constructor() {
    this.boardA = emptySlot();
    this.boardB = emptySlot();
    this.stoveA = emptySlot();
    this.stoveB = emptySlot();
    this.plates = [[], []]; // each plate is a stack of servable item ids, bottom first
    this.held = null; // item id the chef is carrying, or null
    this.heldPrepared = false; // true once a board/stove finished the held item
    this.heldPlate = -1; // plate index the chef is carrying, or -1
    this.sinkClean = 0; // seconds of "fresh hands" focus left (sink bonus)
    this.flash = null; // {text, kind} transient station message
    this.flashTimer = 0;
  }

  // Advance all timers. Returns events the main loop turns into sounds/popups.
  update(dt) {
    const events = [];
    for (const [slot, kind] of [[this.boardA, 'chop'], [this.boardB, 'chop'], [this.stoveA, 'fry'], [this.stoveB, 'fry']]) {
      if (!slot.item) continue;
      // Fresh hands from the sink: everything finishes 25% faster.
      slot.progress += dt * (this.sinkClean > 0 ? 1.25 : 1);
      const doneAt = kind === 'chop' ? CHOP_SECONDS : FRY_SECONDS;
      if (!slot.done && slot.progress >= doneAt) {
        slot.done = true;
        events.push({ type: kind === 'chop' ? 'chopped' : 'cooked', slot });
      }
      if (kind === 'fry' && slot.done && !slot.burnt && slot.progress >= doneAt + BURN_SECONDS) {
        slot.burnt = true;
        events.push({ type: 'burnt', slot });
      }
    }
    if (this.sinkClean > 0) this.sinkClean -= dt;
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) this.flash = null;
    }
    return events;
  }

  get anyCooking() {
    return (this.stoveA.item && !this.stoveA.done) || (this.stoveB.item && !this.stoveB.done);
  }

  say(text, kind = 'info') {
    this.flash = { text, kind };
    this.flashTimer = 2.2;
  }

  // Fridge: take a raw ingredient (keys 1-6). Hands must be empty.
  takeFromFridge(itemId) {
    if (this.held || this.heldPlate >= 0) return { ok: false, why: 'Hands full!' };
    if (!INGREDIENTS[itemId]) return { ok: false, why: 'No such ingredient' };
    this.held = itemId;
    this.heldPrepared = false;
    return { ok: true };
  }

  // Start chopping a choppable item on a free board.
  startChop() {
    if (!this.held) return { ok: false, why: 'Nothing to chop' };
    const ing = INGREDIENTS[this.held];
    if (!ing || ing.prep !== 'chop') return { ok: false, why: `${ing?.name ?? 'That'} needs no chopping` };
    const slot = !this.boardA.item ? this.boardA : !this.boardB.item ? this.boardB : null;
    if (!slot) return { ok: false, why: 'Both boards busy!' };
    slot.item = this.held;
    slot.progress = 0;
    slot.done = false;
    slot.burnt = false;
    this.held = null;
    return { ok: true };
  }

  // Start frying a raw patty on a free stove.
  startFry() {
    if (!this.held) return { ok: false, why: 'Nothing to fry' };
    if (this.held !== 'patty') return { ok: false, why: 'Only patties go on the stove' };
    const slot = !this.stoveA.item ? this.stoveA : !this.stoveB.item ? this.stoveB : null;
    if (!slot) return { ok: false, why: 'Both stoves busy!' };
    slot.item = this.held;
    slot.progress = 0;
    slot.done = false;
    slot.burnt = false;
    this.held = null;
    return { ok: true };
  }

  // Pick up a finished item from a board or stove. Returns the servable item id.
  _collectFrom(slot) {
    if (!slot.item) return { ok: false, why: 'Nothing here' };
    if (!slot.done) return { ok: false, why: 'Not ready yet!' };
    if (slot.burnt) return { ok: false, why: 'Burnt! Bin it (E at the bin)' };
    if (this.held || this.heldPlate >= 0) return { ok: false, why: 'Hands full!' };
    const item = slot.item;
    slot.item = null;
    slot.progress = 0;
    slot.done = false;
    this.held = item === 'patty' ? 'cookedPatty' : item;
    this.heldPrepared = true;
    return { ok: true };
  }

  // Bin a burnt patty (or any held item) into the trash.
  binIt() {
    const slot = [this.stoveA, this.stoveB].find((s) => s.burnt);
    if (slot) {
      slot.item = null;
      slot.progress = 0;
      slot.done = false;
      slot.burnt = false;
      return { ok: true, what: 'burnt patty binned' };
    }
    if (this.held) {
      this.held = null;
      this.heldPrepared = false;
      return { ok: true, what: 'tossed it' };
    }
    return { ok: false, why: 'Nothing to bin' };
  }

  // Sink: rinse hands — next chop/fry finishes 25% faster for 20 seconds.
  useSink() {
    this.sinkClean = 20;
    return { ok: true };
  }

  // Plating: add the held servable item to a plate, or pick the plate up.
  // Returns {ok, action: 'added'|'picked'|'wrong', ...}.
  usePlate(index) {
    const plate = this.plates[index];
    if (this.heldPlate === index) {
      // Put the carried plate back down.
      this.heldPlate = -1;
      return { ok: true, action: 'putdown' };
    }
    if (this.heldPlate >= 0) return { ok: false, why: 'Already carrying a plate!' };
    if (this.held) {
      const ing = INGREDIENTS[this.held] ?? COOKED[this.held];
      if (!ing) return { ok: false, why: 'Cannot plate that' };
      // Raw fridge items that need prep are not servable; a board or stove
      // marks the held item prepared when it is collected.
      if (ing.prep !== 'none' && !this.heldPrepared) return { ok: false, why: `${ing.name} is not ready yet` };
      plate.push(this.held);
      this.held = null;
      this.heldPrepared = false;
      return { ok: true, action: 'added' };
    }
    if (plate.length === 0) return { ok: false, why: 'Plate is empty' };
    this.heldPlate = index;
    return { ok: true, action: 'picked' };
  }

  // Serve the carried plate at the pass. Returns the matched order or null.
  servePlate(board) {
    if (this.heldPlate < 0) return { ok: false, why: 'Bring a plate first!' };
    const stack = this.plates[this.heldPlate];
    const order = board.findMatch(stack);
    if (!order) return { ok: false, why: 'No order matches this plate' };
    this.plates[this.heldPlate] = [];
    this.heldPlate = -1;
    return { ok: true, order };
  }

  // What a station does when the chef presses E (or clicks it) while standing by.
  interact(stationId, board) {
    switch (stationId) {
      case 'fridge': return { ok: false, why: 'Pick an ingredient: keys 1-6' };
      case 'boardA': return this._boardInteract(this.boardA);
      case 'boardB': return this._boardInteract(this.boardB);
      case 'stoveA': return this._stoveInteract(this.stoveA);
      case 'stoveB': return this._stoveInteract(this.stoveB);
      case 'sink': return this.useSink();
      case 'bin': return this.binIt();
      case 'plate0': return this.usePlate(0);
      case 'plate1': return this.usePlate(1);
      case 'serve': return this.servePlate(board);
      default: return { ok: false, why: '' };
    }
  }

  _boardInteract(slot) {
    if (slot.item) return this._collectFrom(slot);
    return this.startChop();
  }

  _stoveInteract(slot) {
    if (slot.item) return this._collectFrom(slot);
    return this.startFry();
  }
}
