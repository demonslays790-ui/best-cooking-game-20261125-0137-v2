// main.js — the game loop and wiring: input → kitchen → orders → render.
// One clear job: run Sizzle & Serve 2. Boots from index.html, no build step.
import { VIEW, STATIONS, COUNTER, PLATE_SPOTS, SERVE_PASS, BIN, INGREDIENTS, SHIFT_SECONDS } from './config.js';
import { KitchenAudio } from './audio.js';
import { Input } from './input.js';
import { OrderBoard } from './orders.js';
import { Kitchen } from './kitchen.js';
import { Chef } from './chef.js';
import { Particles } from './particles.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  phase: 'title', // title | play | paused | end
  time: 0, // render clock (always advances, drives pulses and walk cycles)
  timeLeft: SHIFT_SECONDS,
  board: new OrderBoard(),
  kitchen: new Kitchen(),
  chef: new Chef(),
  particles: new Particles(),
  audio: new KitchenAudio(),
  shot: null, // frozen demo state for screenshots (?shot=cover|assembly|rush|serve)
  pendingInteract: null, // station id to use once the chef walks up to it
  hintTimer: 0,
};

const input = new Input(canvas);
input.onFirstGesture = () => state.audio.unlock();

function resetShift() {
  state.board = new OrderBoard();
  state.kitchen = new Kitchen();
  state.chef = new Chef();
  state.particles = new Particles();
  state.timeLeft = SHIFT_SECONDS;
  state.pendingInteract = null;
}

// --- Interaction zones: where the chef must stand to use each station --------
function zones() {
  const list = [];
  for (const [id, st] of Object.entries(STATIONS)) {
    list.push({ id, zone: Chef.stationZone(st), cx: st.x + st.w / 2, cy: st.y + st.h / 2 });
  }
  // Counter island ring: within 48px of the island, but not inside it.
  list.push({
    id: 'counter',
    zone: { x: COUNTER.x - 48, y: COUNTER.y - 48, w: COUNTER.w + 96, h: COUNTER.h + 96 },
    cx: COUNTER.x + COUNTER.w / 2, cy: COUNTER.y + COUNTER.h / 2, ring: COUNTER,
  });
  for (let i = 0; i < 2; i++) {
    const p = PLATE_SPOTS[i];
    list.push({
      id: 'plate' + i,
      zone: { x: p.x - 56, y: p.y - 56, w: p.w + 112, h: p.h + 112 },
      cx: p.x + p.w / 2, cy: p.y + p.h / 2, ring: COUNTER,
    });
  }
  list.push({
    id: 'serve',
    zone: { x: SERVE_PASS.x - 48, y: SERVE_PASS.y, w: 48, h: SERVE_PASS.h },
    cx: SERVE_PASS.x + SERVE_PASS.w / 2, cy: SERVE_PASS.y + SERVE_PASS.h / 2,
  });
  list.push({
    id: 'bin',
    zone: { x: BIN.x + BIN.w, y: BIN.y, w: 48, h: BIN.h },
    cx: BIN.x + BIN.w / 2, cy: BIN.y + BIN.h / 2,
  });
  return list;
}

// Nearest station whose zone contains the chef (null when standing nowhere useful).
function nearestStation() {
  let best = null;
  let bestDist = Infinity;
  for (const z of zones()) {
    const inZone = state.chef.near(z.zone);
    if (!inZone) continue;
    if (z.ring && state.chef.x > z.ring.x && state.chef.x < z.ring.x + z.ring.w
      && state.chef.y > z.ring.y && state.chef.y < z.ring.y + z.ring.h) continue; // inside the counter
    const d = Math.hypot(state.chef.x - z.cx, state.chef.y - z.cy);
    if (d < bestDist) { bestDist = d; best = z; }
  }
  return best;
}

function useStation(id) {
  const k = state.kitchen;
  if (id === 'fridge') {
    k.say('Pick an ingredient: keys 1–6', 'info');
    state.audio.click();
    return;
  }
  if (id === 'menu') {
    k.say('8 recipes — Classic, Cheese, Garden, Veggie, Onion Melt, Double, Golden, Big Sizzle', 'info');
    state.audio.click();
    return;
  }
  if (id === 'counter') {
    k.say('Ingredients are laid out here — plates are on the right end', 'info');
    state.audio.click();
    return;
  }
  const result = k.interact(id, state.board);
  if (id === 'serve' && result.ok) {
    const paid = state.board.serve(result.order, state.timeLeft);
    state.audio.serve();
    state.particles.confetti(SERVE_PASS.x + SERVE_PASS.w / 2, SERVE_PASS.y + 40);
    state.particles.popup(state.chef.x, state.chef.y - 60, `+$${paid.paid}  ${result.order.recipe.name}!`, '#ffe27a');
    if (paid.tip > 0) state.particles.popup(state.chef.x, state.chef.y - 88, `incl. $${paid.tip} tip`, '#7ed957');
    k.say(`Served ${result.order.recipe.name} — $${paid.paid}!`, 'good');
    return;
  }
  if (result.ok) {
    if (id.startsWith('board') || id.startsWith('stove')) state.chef.busy = 0.35;
    if (result.action === 'added') state.audio.plate();
    else if (result.action === 'picked') state.audio.pick();
    else state.audio.click();
    if (result.what) k.say(result.what, 'good');
  } else if (result.why) {
    state.audio.error();
    k.say(result.why, 'bad');
  }
}

function fridgeKey(id) {
  const near = nearestStation();
  if (!near || near.id !== 'fridge') {
    state.kitchen.say('Walk up to the FRIDGE first!', 'bad');
    state.audio.error();
    return;
  }
  const r = state.kitchen.takeFromFridge(id);
  if (r.ok) {
    state.audio.pick();
    state.kitchen.say(`${INGREDIENTS[id].name} taken — ${INGREDIENTS[id].prep === 'none' ? 'ready to plate' : INGREDIENTS[id].prep === 'chop' ? 'needs the chopping board' : 'needs a stove'}`, 'info');
  } else {
    state.audio.error();
    state.kitchen.say(r.why, 'bad');
  }
}

function clickStationAt(x, y) {
  // Clicking a station walks the chef there and uses it on arrival.
  for (const z of zones()) {
    const hit = z.id === 'counter'
      ? (x >= COUNTER.x && x <= COUNTER.x + COUNTER.w && y >= COUNTER.y && y <= COUNTER.y + COUNTER.h)
      : z.id.startsWith('plate')
        ? false
        : (x >= (STATIONS[z.id]?.x ?? -1) && x <= (STATIONS[z.id]?.x ?? -1) + (STATIONS[z.id]?.w ?? 0)
          && y >= (STATIONS[z.id]?.y ?? -1) && y <= (STATIONS[z.id]?.y ?? -1) + (STATIONS[z.id]?.h ?? 0));
    if (hit) {
      const target = z.id === 'serve'
        ? { x: SERVE_PASS.x - 30, y: SERVE_PASS.y + SERVE_PASS.h / 2 }
        : z.id === 'bin'
          ? { x: BIN.x + BIN.w + 30, y: BIN.y + BIN.h / 2 }
          : { x: z.cx, y: z.zone.y + z.zone.h + 10 };
      state.chef.goTo(target.x, target.y);
      state.pendingInteract = z.id;
      return true;
    }
  }
  // Clicking a plate spot walks over and uses that plate.
  for (let i = 0; i < 2; i++) {
    const p = PLATE_SPOTS[i];
    if (x >= p.x - 10 && x <= p.x + p.w + 10 && y >= p.y - 10 && y <= p.y + p.h + 10) {
      state.chef.goTo(p.x + p.w / 2, p.y + p.h + 70);
      state.pendingInteract = 'plate' + i;
      return true;
    }
  }
  if (x >= SERVE_PASS.x && x <= SERVE_PASS.x + SERVE_PASS.w && y >= SERVE_PASS.y && y <= SERVE_PASS.y + SERVE_PASS.h) {
    state.chef.goTo(SERVE_PASS.x - 30, SERVE_PASS.y + SERVE_PASS.h / 2);
    state.pendingInteract = 'serve';
    return true;
  }
  if (x >= BIN.x && x <= BIN.x + BIN.w && y >= BIN.y && y <= BIN.y + BIN.h) {
    state.chef.goTo(BIN.x + BIN.w + 30, BIN.y + BIN.h / 2);
    state.pendingInteract = 'bin';
    return true;
  }
  return false;
}

// --- Per-frame update ----------------------------------------------------------
function update(dt) {
  state.time += dt;
  const k = state.kitchen;

  if (state.phase === 'title') {
    if (input.wasPressed('enter') || input.takeClick()) {
      state.phase = 'play';
      state.audio.unlock();
      state.audio.ding();
    }
    return;
  }
  if (state.phase === 'end') {
    if (input.wasPressed('r')) { resetShift(); state.phase = 'play'; }
    return;
  }
  if (state.phase === 'paused') {
    if (input.wasPressed('p')) state.phase = 'play';
    return;
  }
  if (state.phase !== 'play') return;

  // Pause / mute / restart.
  if (input.wasPressed('p')) { state.phase = 'paused'; return; }
  if (input.wasPressed('m')) {
    const muted = state.audio.toggleMute();
    k.say(muted ? 'Sound OFF (M to turn on)' : 'Sound ON', 'info');
  }
  if (input.wasPressed('r')) { resetShift(); return; }

  if (!state.shot) {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.phase = 'end';
      state.audio.walkout();
      return;
    }
  }

  // Fridge keys 1–6.
  for (const id of Object.keys(INGREDIENTS)) {
    if (input.wasPressed(INGREDIENTS[id].key)) fridgeKey(id);
  }

  // E uses the nearest station.
  if (input.wasPressed('e')) {
    const near = nearestStation();
    if (near) useStation(near.id);
    else { k.say('Walk up to a station first!', 'bad'); state.audio.error(); }
  }

  // Click: station → walk + use on arrival; floor → walk.
  const click = input.takeClick();
  if (click) {
    if (!clickStationAt(click.x, click.y)) {
      state.chef.goTo(click.x, click.y);
      state.pendingInteract = null;
    }
  }
  if (state.pendingInteract) {
    const near = nearestStation();
    if (near && near.id === state.pendingInteract) {
      useStation(state.pendingInteract);
      state.pendingInteract = null;
    } else if (near && state.chef.target === null) {
      state.pendingInteract = null; // arrived somewhere else; drop the plan
    }
  }

  // Movement.
  state.chef.update(dt, input.moveVector());

  if (!state.shot) {
    // Kitchen timers and their sounds/popups.
    const events = k.update(dt);
    for (const ev of events) {
      if (ev.type === 'chopped') { state.audio.chop(); k.say('Chopped!', 'good'); }
      if (ev.type === 'cooked') { state.audio.ding(); k.say('Patty ready!', 'good'); }
      if (ev.type === 'burnt') { state.audio.burn(); k.say('A patty BURNT! Bin it!', 'bad'); }
    }
    state.board.update(dt, state.timeLeft,
      (o) => { state.audio.walkout(); state.particles.popup(640, 120, `Customer #${o.id} walked out!`, '#ff8a7a'); },
      () => { state.audio.rush(); k.say('DINNER RUSH! Orders fly in, patience runs short!', 'bad'); });

    // Sizzle ambience + steam while stoves cook.
    if (k.anyCooking) {
      state.audio.sizzleStart();
      if (Math.random() < dt * 14) state.particles.steam(629, 292);
      if (Math.random() < dt * 14) state.particles.steam(801, 292);
      if (Math.random() < dt * 6) state.particles.spark(629 + (Math.random() - 0.5) * 60, 300);
      if (Math.random() < dt * 6) state.particles.spark(801 + (Math.random() - 0.5) * 60, 300);
    } else {
      state.audio.sizzleStop();
    }
  }
  state.particles.update(dt);
}

// --- Boot ----------------------------------------------------------------------
function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last ?? now)) / 1000 || 0.016);
  frame.last = now;
  update(dt);
  drawGame(ctx, state);
  input.endFrame();
  requestAnimationFrame(frame);
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  state.shot = shotName;
  state.phase = 'play';
  applyShot(state, shotName);
  state.time = 3; // a little render-clock so pulses and steam read as live
}
window.__sizzleReady = true;
requestAnimationFrame(frame);
