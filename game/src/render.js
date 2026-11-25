// render.js — every pixel of Sizzle & Serve 2 is drawn here on one canvas.
// One clear job: turn the game state into a dense, legible kitchen scene.
import {
  VIEW, STATIONS, COUNTER, PLATE_SPOTS, SERVE_PASS, BIN, INGREDIENTS, COOKED,
  RECIPES, formatClock,
} from './config.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';
const TITLE_FONT = '"Arial Black", "Trebuchet MS", Verdana, sans-serif';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', font = FONT, weight = 'bold') {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function outlineText(ctx, str, x, y, size, color, align = 'left', font = FONT) {
  ctx.font = `bold ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 6);
  ctx.strokeStyle = 'rgba(40,16,0,0.9)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// --- Ingredient icons, drawn in code (no images) ---------------------------
export function drawIngredientIcon(ctx, id, cx, cy, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bun') {
    ctx.fillStyle = '#f2b25c';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.15, s, s * 0.72, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e09a3e';
    ctx.fillRect(-s, -s * 0.18, s * 2, s * 0.3);
    ctx.fillStyle = '#fff3d0';
    for (const [dx, dy] of [[-0.45, -0.55], [0, -0.7], [0.45, -0.55], [-0.2, -0.35], [0.25, -0.35]]) {
      ctx.beginPath(); ctx.ellipse(dx * s, dy * s, s * 0.1, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty' || id === 'cookedPatty') {
    ctx.fillStyle = id === 'cookedPatty' ? '#7a3f1d' : '#c96f4a';
    roundRect(ctx, -s, -s * 0.45, s * 2, s * 0.9, s * 0.35);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    for (const dx of [-0.5, 0, 0.5]) {
      ctx.beginPath(); ctx.moveTo(dx * s, -s * 0.4); ctx.lineTo(dx * s, s * 0.4); ctx.stroke();
    }
    if (id === 'cookedPatty') {
      ctx.fillStyle = 'rgba(255,180,80,0.5)';
      ctx.beginPath(); ctx.arc(-s * 0.4, -s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.6); ctx.lineTo(s, s * 0.6); ctx.lineTo(0, -s * 0.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e0a800';
    for (const [dx, dy] of [[-0.25, 0.2], [0.2, 0.05], [0, 0.4]]) {
      ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.13, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'tomato') {
    ctx.fillStyle = '#ff5a4e';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9e2e';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.8, s * 0.35, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.ellipse(-s * 0.35, -s * 0.35, s * 0.22, s * 0.14, -0.6, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#7ed957';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5cbf3f';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'onion') {
    ctx.fillStyle = '#f4e9fb';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b98ad6';
    ctx.lineWidth = 2.5;
    for (const r of [0.62, 0.38]) {
      ctx.beginPath(); ctx.arc(0, 0, s * r, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
}

// A burger stack on a plate: layers bottom-to-top, finished with a top bun cap.
export function drawBurgerStack(ctx, stack, cx, cy, w) {
  const layerH = Math.max(7, Math.min(13, w * 0.11));
  // Plate
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(cx, cy, w / 2, w * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath(); ctx.ellipse(cx, cy, w / 2, w * 0.16, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(cx, cy - 1, w * 0.36, w * 0.1, 0, 0, Math.PI * 2); ctx.fill();

  let y = cy - w * 0.06;
  for (const id of stack) {
    const ing = INGREDIENTS[id] ?? COOKED[id];
    if (!ing) continue;
    y -= layerH;
    ctx.fillStyle = ing.color;
    if (id === 'bun') {
      ctx.beginPath(); ctx.ellipse(cx, y, w * 0.42, layerH * 0.9, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - w * 0.42, y - 1, w * 0.84, layerH * 0.5);
    } else if (id === 'cheese') {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.4, y + layerH * 0.4);
      ctx.lineTo(cx + w * 0.4, y + layerH * 0.4);
      ctx.lineTo(cx + w * 0.28, y - layerH * 0.7);
      ctx.lineTo(cx - w * 0.28, y - layerH * 0.7);
      ctx.closePath(); ctx.fill();
    } else if (id === 'lettuce') {
      ctx.beginPath();
      ctx.ellipse(cx, y, w * 0.46, layerH * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5cbf3f';
      ctx.beginPath(); ctx.ellipse(cx, y, w * 0.34, layerH * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      roundRect(ctx, cx - w * 0.42, y - layerH * 0.6, w * 0.84, layerH * 1.1, layerH * 0.5);
      ctx.fill();
    }
  }
  // Top bun cap so every stack reads as a finished burger.
  if (stack.length > 0) {
    y -= layerH * 0.4;
    ctx.fillStyle = '#f2b25c';
    ctx.beginPath(); ctx.ellipse(cx, y, w * 0.42, layerH * 1.5, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff3d0';
    for (const dx of [-0.2, 0.05, 0.24]) {
      ctx.beginPath(); ctx.ellipse(cx + dx * w, y - layerH * 0.7, 2.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// --- HUD -------------------------------------------------------------------
function drawHud(ctx, s) {
  const g = ctx.createLinearGradient(0, 0, 0, 56);
  g.addColorStop(0, '#3a2214');
  g.addColorStop(1, '#241208');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.W, 56);
  ctx.fillStyle = '#f2b25c';
  ctx.fillRect(0, 54, VIEW.W, 2);

  text(ctx, 'SIZZLE & SERVE 2', 16, 20, 26, '#ffd23e', 'left', TITLE_FONT);
  text(ctx, 'The Golden Skillet  •  run the lunch rush!', 16, 44, 13, '#e8c9a0');

  // Shift clock, dead centre and huge.
  const clock = formatClock(s.timeLeft);
  outlineText(ctx, 'SHIFT  ' + clock, 640, 24, 30, s.timeLeft <= 30 ? '#ff6b5e' : '#ffffff', 'center', TITLE_FONT);
  const prog = 1 - s.timeLeft / 180;
  ctx.fillStyle = '#4a2c17';
  roundRect(ctx, 520, 42, 240, 9, 4); ctx.fill();
  ctx.fillStyle = s.timeLeft <= 60 ? '#ff8a3d' : '#7ed957';
  roundRect(ctx, 520, 42, 240 * prog, 9, 4); ctx.fill();

  text(ctx, 'SCORE', 1064, 16, 12, '#c9a06a', 'right');
  text(ctx, String(s.board.score), 1064, 38, 26, '#ffffff', 'right', TITLE_FONT);
  text(ctx, 'EARNED', 1160, 16, 12, '#c9a06a', 'right');
  text(ctx, '$' + s.board.earned, 1160, 38, 26, '#7ed957', 'right', TITLE_FONT);
  if (s.board.combo > 1) {
    ctx.fillStyle = '#ff5a4e';
    roundRect(ctx, 1180, 10, 86, 36, 18); ctx.fill();
    outlineText(ctx, 'COMBO x' + s.board.combo, 1223, 29, 17, '#ffffff', 'center');
  } else {
    text(ctx, 'COMBO x1', 1223, 28, 15, '#c9a06a', 'center');
  }
}

// --- Order board ------------------------------------------------------------
function drawOrderTicket(ctx, order, x, y, w, h, pulse) {
  const ratio = Math.max(0, order.patience / order.maxPatience);
  const urgent = ratio < 0.35;
  const bg = urgent ? '#4a1f16' : '#2e2018';
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, 12); ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = urgent ? '#ff5a4e' : '#8a6a45';
  roundRect(ctx, x, y, w, h, 12); ctx.stroke();
  if (urgent && pulse) {
    ctx.strokeStyle = 'rgba(255,90,78,0.9)';
    ctx.lineWidth = 3.5;
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 10); ctx.stroke();
  }

  text(ctx, '#' + order.id, x + 12, y + 18, 15, '#c9a06a');
  text(ctx, order.recipe.name, x + 48, y + 18, 19, '#ffffff');
  text(ctx, '$' + order.recipe.price, x + w - 12, y + 18, 20, '#7ed957', 'right', TITLE_FONT);

  // Ingredient icons for the recipe, in stack order.
  let ix = x + 20;
  for (const id of order.recipe.needs) {
    drawIngredientIcon(ctx, id, ix, y + 52, 30);
    ix += 34;
  }
  // Patience bar.
  ctx.fillStyle = '#1a0f08';
  roundRect(ctx, x + 12, y + h - 24, w - 24, 13, 6); ctx.fill();
  ctx.fillStyle = ratio > 0.5 ? '#7ed957' : ratio > 0.25 ? '#ffb03a' : '#ff5a4e';
  roundRect(ctx, x + 12, y + h - 24, (w - 24) * ratio, 13, 6); ctx.fill();
  text(ctx, urgent ? 'HURRY!' : Math.ceil(order.patience) + 's', x + w - 16, y + h - 44, 13, urgent ? '#ff8a7a' : '#e8c9a0', 'right');
}

function drawOrderBoard(ctx, s) {
  ctx.fillStyle = '#5e3d1e';
  ctx.fillRect(0, 56, VIEW.W, 122);
  ctx.fillStyle = '#4a2c12';
  ctx.fillRect(0, 56, VIEW.W, 6);
  ctx.fillStyle = '#3a2210';
  ctx.fillRect(0, 172, VIEW.W, 6);
  text(ctx, 'ORDER BOARD', 16, 74, 13, '#f2b25c');
  text(ctx, 'fast serves = tips', 16, 138, 12, '#e8c9a0');
  text(ctx, '2 in a row = combo', 16, 158, 12, s.board.rush ? '#ff8a3d' : '#e8c9a0');
  if (s.board.rush) text(ctx, 'DINNER RUSH!', 16, 100, 13, '#ff8a3d');

  const ticketW = 273;
  const gap = 12;
  const startX = 150;
  s.board.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, startX + i * (ticketW + gap), 66, ticketW, 102, Math.floor(s.time * 2) % 2 === 0);
  });
  if (s.board.orders.length === 0) {
    outlineText(ctx, 'No orders — take a breath, chef!', 700, 118, 20, '#e8c9a0', 'center');
  }
}

// --- Wall, floor, stations ---------------------------------------------------
function drawWallAndFloor(ctx, s) {
  // Back wall with tiles, hanging pans and a window.
  ctx.fillStyle = '#f3dfae';
  ctx.fillRect(0, 178, VIEW.W, 36);
  ctx.fillStyle = '#e8cfa0';
  for (let x = 0; x < VIEW.W; x += 64) ctx.fillRect(x, 178, 2, 36);
  // Window with a sunny street view.
  ctx.fillStyle = '#7ec8e3';
  roundRect(ctx, 640, 180, 150, 32, 6); ctx.fill();
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath(); ctx.arc(760, 192, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5cbf3f';
  ctx.fillRect(650, 202, 130, 10);
  ctx.strokeStyle = '#8a6a45';
  ctx.lineWidth = 3;
  roundRect(ctx, 640, 180, 150, 32, 6); ctx.stroke();
  // Hanging pans.
  for (const [x, col] of [[300, '#3d3d3d'], [340, '#8a8a8a'], [380, '#b07a3e']]) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, 198, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(x - 1, 182, 2, 8);
  }
  // Chalkboard menu.
  ctx.fillStyle = '#2e4a3a';
  roundRect(ctx, 1060, 182, 198, 30, 5); ctx.fill();
  text(ctx, '★ TODAY: 8 BURGERS ★', 1159, 198, 13, '#fff3b0', 'center');
  // String lights.
  const colors = ['#ff5a4e', '#ffd23e', '#7ed957', '#4ec6ff'];
  for (let i = 0; i < 16; i++) {
    const x = 40 + i * 78;
    ctx.fillStyle = colors[i % 4];
    ctx.beginPath(); ctx.arc(x, 184 + Math.sin(i) * 2, 4, 0, Math.PI * 2); ctx.fill();
  }

  // Wood-plank floor.
  for (let y = 336; y < VIEW.H; y += 46) {
    ctx.fillStyle = (Math.floor(y / 46) % 2 === 0) ? '#c89a5e' : '#bd8f52';
    ctx.fillRect(0, y, VIEW.W, 46);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, y, VIEW.W, 2);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let x = 90; x < VIEW.W; x += 180) ctx.fillRect(x, 336, 2, VIEW.H - 336);
  // Rug under the counter island.
  ctx.fillStyle = '#a34a3a';
  roundRect(ctx, 288, 388, 704, 182, 14); ctx.fill();
  ctx.fillStyle = '#c96f4a';
  roundRect(ctx, 300, 400, 680, 158, 10); ctx.fill();
  // Floor props: a potted plant, a crate stack, and mats by the bin and serve pass.
  ctx.fillStyle = '#8a5a3a';
  roundRect(ctx, 176, 622, 52, 34, 6); ctx.fill();
  ctx.fillStyle = '#3f9e2e';
  for (const [dx, dy, r] of [[-10, -14, 12], [8, -18, 13], [0, -30, 11]]) {
    ctx.beginPath(); ctx.arc(202 + dx, 622 + dy, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#b07a3e';
  roundRect(ctx, 1030, 618, 56, 40, 5); ctx.fill();
  ctx.fillStyle = '#c98a4a';
  roundRect(ctx, 1088, 628, 48, 30, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1030, 618, 56, 40);
  ctx.strokeRect(1088, 628, 48, 30);
  ctx.fillStyle = '#7a3f2a';
  roundRect(ctx, 1110, 592, 150, 58, 8); ctx.fill();
  ctx.fillStyle = '#2e7d4f';
  roundRect(ctx, 24, 512, 132, 46, 8); ctx.fill();
}

function drawProgressBar(ctx, x, y, w, h, ratio, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(h, w * Math.min(1, ratio)), h, h / 2); ctx.fill();
}

function drawStation(ctx, s, key) {
  const st = STATIONS[key];
  const isBoard = key.startsWith('board');
  const isStove = key.startsWith('stove');
  const slot = isBoard ? (key === 'boardA' ? s.kitchen.boardA : s.kitchen.boardB)
    : isStove ? (key === 'stoveA' ? s.kitchen.stoveA : s.kitchen.stoveB) : null;

  const g = ctx.createLinearGradient(st.x, st.y, st.x, st.y + st.h);
  if (isStove) { g.addColorStop(0, '#4a4a55'); g.addColorStop(1, '#2c2c34'); }
  else if (key === 'fridge') { g.addColorStop(0, '#bfe3f2'); g.addColorStop(1, '#7fb8d4'); }
  else if (key === 'sink') { g.addColorStop(0, '#9fc6e8'); g.addColorStop(1, '#6a9cc4'); }
  else if (key === 'menu') { g.addColorStop(0, '#2e4a3a'); g.addColorStop(1, '#1f3328'); }
  else { g.addColorStop(0, '#d9a05b'); g.addColorStop(1, '#a8763a'); }
  ctx.fillStyle = g;
  roundRect(ctx, st.x, st.y, st.w, st.h, 12); ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, st.x, st.y, st.w, st.h, 12); ctx.stroke();

  text(ctx, st.label, st.x + st.w / 2, st.y + 16, 17, key === 'menu' ? '#fff3b0' : '#241208', 'center', TITLE_FONT);
  text(ctx, st.sub, st.x + st.w / 2, st.y + 34, 11, key === 'menu' ? '#cfe8d8' : 'rgba(36,18,8,0.75)', 'center');

  if (key === 'fridge') {
    // Six ingredient slots with their number keys.
    const ids = Object.keys(INGREDIENTS);
    ids.forEach((id, i) => {
      const x = st.x + 22 + (i % 3) * 52;
      const y = st.y + 62 + Math.floor(i / 3) * 38;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      roundRect(ctx, x - 20, y - 16, 40, 32, 8); ctx.fill();
      drawIngredientIcon(ctx, id, x, y, 26);
      text(ctx, INGREDIENTS[id].key, x + 16, y - 12, 11, '#241208', 'center');
    });
  } else if (key === 'menu') {
    RECIPES.slice(0, 4).forEach((r, i) => {
      text(ctx, `★ ${r.name}  $${r.price}`, st.x + 12, st.y + 56 + i * 15, 12, '#fff3b0');
    });
    text(ctx, '+ 4 more on the board', st.x + 12, st.y + 56 + 4 * 15, 11, '#9fc6a8');
  } else if (key === 'sink') {
    ctx.fillStyle = '#dfeefc';
    roundRect(ctx, st.x + 18, st.y + 52, st.w - 36, 44, 10); ctx.fill();
    ctx.fillStyle = '#7fb8d4';
    ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + 74, 42, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(st.x + st.w / 2 - 12, st.y + 72, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (s.kitchen.sinkClean > 0) text(ctx, '✦ FRESH HANDS ' + Math.ceil(s.kitchen.sinkClean) + 's', st.x + st.w / 2, st.y + 108, 12, '#1f5c2e', 'center');
    else text(ctx, 'E = rinse • +25% speed', st.x + st.w / 2, st.y + 108, 11, '#1f3a52', 'center');
  } else if (slot) {
    // Board or stove: two work circles / a work surface with progress.
    const doneAt = isBoard ? 3 : 4;
    const ratio = slot.item ? Math.min(1, slot.progress / doneAt) : 0;
    ctx.fillStyle = isBoard ? '#f7e8c8' : '#1c1c22';
    roundRect(ctx, st.x + 14, st.y + 48, st.w - 28, 56, 10); ctx.fill();
    if (slot.item) {
      drawIngredientIcon(ctx, slot.item, st.x + st.w / 2, st.y + 76, 44);
      if (slot.burnt) {
        outlineText(ctx, '🔥 BURNT!', st.x + st.w / 2, st.y + 76, 18, '#ff8a3d', 'center');
      } else if (slot.done) {
        ctx.fillStyle = '#7ed957';
        roundRect(ctx, st.x + 14, st.y + 48, st.w - 28, 56, 10); ctx.fill();
        ctx.globalAlpha = 0.25;
        drawIngredientIcon(ctx, slot.item, st.x + st.w / 2, st.y + 76, 44);
        ctx.globalAlpha = 1;
        outlineText(ctx, 'READY!', st.x + st.w / 2, st.y + 76, 20, '#ffffff', 'center');
      }
      drawProgressBar(ctx, st.x + 20, st.y + 110, st.w - 40, 9, ratio, slot.burnt ? '#ff5a4e' : slot.done ? '#7ed957' : '#ffb03a');
    } else {
      text(ctx, isBoard ? '» ready to chop' : '» ready to fry', st.x + st.w / 2, st.y + 76, 13, isBoard ? '#6a4a22' : '#9a9aa8', 'center');
    }
  }
}

function drawCounterAndPlates(ctx, s) {
  // Counter island.
  const g = ctx.createLinearGradient(COUNTER.x, COUNTER.y, COUNTER.x, COUNTER.y + COUNTER.h);
  g.addColorStop(0, '#c98a4a');
  g.addColorStop(1, '#9a6528');
  ctx.fillStyle = g;
  roundRect(ctx, COUNTER.x, COUNTER.y, COUNTER.w, COUNTER.h, 14); ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  roundRect(ctx, COUNTER.x, COUNTER.y, COUNTER.w, COUNTER.h, 14); ctx.stroke();
  text(ctx, 'INGREDIENTS ON THE COUNTER', COUNTER.x + 16, COUNTER.y + 16, 13, '#ffe9bd');

  // Six ingredient bins along the counter top.
  const ids = Object.keys(INGREDIENTS);
  ids.forEach((id, i) => {
    const x = COUNTER.x + 32 + i * 60;
    const y = COUNTER.y + 48;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(x, y, 30, 23, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(x, y + 4, 26, 17, 0, 0, Math.PI); ctx.fill();
    drawIngredientIcon(ctx, id, x, y - 3, 36);
    text(ctx, INGREDIENTS[id].name, x, y + 34, 12, '#fff3d0', 'center');
  });

  // Two plating plates side by side on the island's right end.
  s.kitchen.plates.forEach((stack, i) => {
    const spot = PLATE_SPOTS[i];
    const carried = s.kitchen.heldPlate === i;
    text(ctx, 'PLATE ' + (i + 1), spot.x + spot.w / 2, spot.y - 12, 13, '#fff3d0', 'center');
    ctx.save();
    if (carried) ctx.globalAlpha = 0.35;
    drawBurgerStack(ctx, stack, spot.x + spot.w / 2, spot.y + spot.h / 2 + 20, 68);
    ctx.restore();
    if (stack.length > 0) {
      const match = s.board.findMatch(stack);
      text(ctx, match ? '✓ MATCHES #' + match.id + '!' : stack.length + ' layers', spot.x + spot.w / 2, spot.y + spot.h + 20, 12, match ? '#7ed957' : '#e8c9a0', 'center');
    } else {
      text(ctx, 'empty', spot.x + spot.w / 2, spot.y + spot.h + 20, 11, '#c9a06a', 'center');
    }
  });
}

function drawServePassAndBin(ctx, s) {
  // Serve pass — glowing, with a bell and a big SERVE.
  const pulse = 0.75 + Math.sin(s.time * 4) * 0.25;
  const g = ctx.createLinearGradient(SERVE_PASS.x, SERVE_PASS.y, SERVE_PASS.x, SERVE_PASS.y + SERVE_PASS.h);
  g.addColorStop(0, '#ff8a3d');
  g.addColorStop(1, '#c94a1e');
  ctx.fillStyle = g;
  roundRect(ctx, SERVE_PASS.x, SERVE_PASS.y, SERVE_PASS.w, SERVE_PASS.h, 14); ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = `rgba(255,210,62,${pulse})`;
  roundRect(ctx, SERVE_PASS.x, SERVE_PASS.y, SERVE_PASS.w, SERVE_PASS.h, 14); ctx.stroke();
  text(ctx, '🔔', SERVE_PASS.x + SERVE_PASS.w / 2, SERVE_PASS.y + 34, 30, '#ffffff', 'center');
  outlineText(ctx, 'SERVE', SERVE_PASS.x + SERVE_PASS.w / 2, SERVE_PASS.y + 78, 30, '#ffffff', 'center', TITLE_FONT);
  text(ctx, 'PASS', SERVE_PASS.x + SERVE_PASS.w / 2, SERVE_PASS.y + 104, 20, '#ffe9bd', 'center', TITLE_FONT);
  const ready = s.kitchen.heldPlate >= 0;
  text(ctx, ready ? 'ring it! (E)' : 'bring a finished plate', SERVE_PASS.x + SERVE_PASS.w / 2, SERVE_PASS.y + 136, 13, '#ffffff', 'center');
  if (ready) {
    ctx.fillStyle = '#ffd23e';
    roundRect(ctx, SERVE_PASS.x + 18, SERVE_PASS.y + 152, SERVE_PASS.w - 36, 30, 15); ctx.fill();
    text(ctx, '★ READY TO SERVE ★', SERVE_PASS.x + SERVE_PASS.w / 2, SERVE_PASS.y + 168, 14, '#7a3f00', 'center');
  }

  // Bin.
  ctx.fillStyle = '#5a5a66';
  roundRect(ctx, BIN.x, BIN.y, BIN.w, BIN.h, 12); ctx.fill();
  ctx.fillStyle = '#3d3d46';
  roundRect(ctx, BIN.x + 8, BIN.y + 8, BIN.w - 16, 26, 8); ctx.fill();
  text(ctx, '🗑 BIN', BIN.x + BIN.w / 2, BIN.y + 58, 18, '#ffffff', 'center', TITLE_FONT);
  text(ctx, 'toss burnt food', BIN.x + BIN.w / 2, BIN.y + 84, 11, '#c9c9d4', 'center');
}

// --- Chef --------------------------------------------------------------------
function drawChef(ctx, s) {
  const c = s.chef;
  const bob = c.moving ? Math.sin(c.walkPhase) * 3 : Math.sin(s.time * 2) * 1.2;
  const x = c.x;
  const y = c.y + bob * 0.4;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, c.y + 26, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white coat + green apron.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 20, y - 8, 40, 34, 12); ctx.fill();
  ctx.fillStyle = '#2e7d4f';
  roundRect(ctx, x - 14, y + 2, 28, 24, 8); ctx.fill();
  // Arms.
  ctx.fillStyle = '#ffffff';
  const swing = c.moving ? Math.sin(c.walkPhase) * 6 : 0;
  roundRect(ctx, x - 27, y - 4 + swing, 10, 24, 5); ctx.fill();
  roundRect(ctx, x + 17, y - 4 - swing, 10, 24, 5); ctx.fill();
  // Head + chef hat.
  ctx.fillStyle = '#ffd9b0';
  ctx.beginPath(); ctx.arc(x, y - 22, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x, y - 36, 17, 9, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - 17, y - 40, 34, 8);
  // Face.
  ctx.fillStyle = '#241208';
  ctx.beginPath(); ctx.arc(x - 5 + c.dir * 2, y - 24, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5 + c.dir * 2, y - 24, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#241208';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(x + c.dir * 2, y - 18, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Held item floats above the chef's hands.
  if (s.kitchen.held) {
    drawIngredientIcon(ctx, s.kitchen.held, x + c.dir * 24, y - 2, 30);
  }
  if (s.kitchen.heldPlate >= 0) {
    const stack = s.kitchen.plates[s.kitchen.heldPlate];
    drawBurgerStack(ctx, stack, x + c.dir * 30, y + 6, 64);
  }
  // Name tag.
  text(ctx, 'YOU', x, y + 40, 11, '#241208', 'center');
}

// --- Overlays: hints, toasts, title, end -------------------------------------
function drawHints(ctx, s) {
  ctx.fillStyle = 'rgba(20,10,4,0.85)';
  ctx.fillRect(0, 664, VIEW.W, 56);
  ctx.fillStyle = '#f2b25c';
  ctx.fillRect(0, 664, VIEW.W, 2);
  text(ctx, 'WASD / arrows move   •   E use station   •   1–6 fridge   •   click a station to walk there   •   M mute   •   R restart', 16, 694, 15, '#e8c9a0');
  const held = s.kitchen.held
    ? 'Holding: ' + (INGREDIENTS[s.kitchen.held]?.name ?? COOKED[s.kitchen.held]?.name ?? s.kitchen.held)
    : s.kitchen.heldPlate >= 0
      ? 'Carrying plate ' + (s.kitchen.heldPlate + 1) + ' — take it to the SERVE PASS!'
      : 'Hands empty — grab an ingredient from the fridge';
  ctx.fillStyle = s.kitchen.held || s.kitchen.heldPlate >= 0 ? '#ffd23e' : '#5a4632';
  roundRect(ctx, 880, 676, 384, 32, 16); ctx.fill();
  text(ctx, held, 1072, 693, 14, s.kitchen.held || s.kitchen.heldPlate >= 0 ? '#241208' : '#e8c9a0', 'center');

  if (s.kitchen.flash) {
    const f = s.kitchen.flash;
    ctx.fillStyle = f.kind === 'bad' ? 'rgba(120,20,10,0.92)' : f.kind === 'good' ? 'rgba(30,90,40,0.92)' : 'rgba(40,25,10,0.92)';
    const w = Math.min(560, 40 + f.text.length * 9.5);
    roundRect(ctx, 640 - w / 2, 600, w, 40, 20); ctx.fill();
    outlineText(ctx, f.text, 640, 621, 18, '#ffffff', 'center');
  }
}

function drawTitleScreen(ctx, s) {
  ctx.fillStyle = 'rgba(20,8,2,0.72)';
  ctx.fillRect(0, 0, VIEW.W, VIEW.H);
  ctx.fillStyle = '#2b1a12';
  roundRect(ctx, 240, 90, 800, 500, 20); ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#f2b25c';
  roundRect(ctx, 240, 90, 800, 500, 20); ctx.stroke();
  outlineText(ctx, 'SIZZLE & SERVE 2', 640, 150, 52, '#ffd23e', 'center', TITLE_FONT);
  outlineText(ctx, 'THE GOLDEN SKILLET', 640, 200, 26, '#ffffff', 'center', TITLE_FONT);
  text(ctx, 'Run the lunch rush: chop, fry, stack and serve — before the customers walk out!', 640, 248, 18, '#e8c9a0', 'center');
  const steps = [
    '1  •  Grab ingredients from the FRIDGE (keys 1–6)',
    '2  •  Chop veggies on the BOARDS, fry patties on the STOVES',
    '3  •  Stack the burger on a PLATE — match the order ticket exactly',
    '4  •  Ring the SERVE PASS bell. Fast serves earn tips, streaks build combos!',
  ];
  steps.forEach((line, i) => text(ctx, line, 640, 300 + i * 34, 18, '#ffffff', 'center'));
  text(ctx, '8 recipes  •  dinner rush in the last minute  •  3-minute shift  •  3 stars to earn', 640, 452, 16, '#7ed957', 'center');
  const blink = Math.floor(s.time * 2) % 2 === 0;
  if (blink) outlineText(ctx, '▶  PRESS ENTER OR CLICK TO START  ◀', 640, 520, 24, '#ffd23e', 'center', TITLE_FONT);
  text(ctx, 'WASD / arrows to move  •  E to use a station  •  M to mute', 640, 560, 15, '#c9a06a', 'center');
}

function drawEndScreen(ctx, s) {
  const stars = s.board.stars();
  ctx.fillStyle = 'rgba(20,8,2,0.78)';
  ctx.fillRect(0, 0, VIEW.W, VIEW.H);
  ctx.fillStyle = '#2b1a12';
  roundRect(ctx, 290, 110, 700, 460, 20); ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#f2b25c';
  roundRect(ctx, 290, 110, 700, 460, 20); ctx.stroke();
  outlineText(ctx, 'SHIFT OVER!', 640, 170, 46, '#ffd23e', 'center', TITLE_FONT);
  const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  outlineText(ctx, starStr, 640, 228, 44, '#ffd23e', 'center');
  const rows = [
    ['Earned', '$' + s.board.earned],
    ['Orders served', String(s.board.served)],
    ['Customers walked out', String(s.board.walkedOut)],
    ['Best combo', 'x' + Math.max(1, s.board.bestCombo)],
    ['Score', String(s.board.score)],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 380, 290 + i * 40, 20, '#e8c9a0');
    text(ctx, value, 900, 290 + i * 40, 22, '#ffffff', 'right', TITLE_FONT);
  });
  const verdict = stars === 3 ? 'A golden shift! The Golden Skillet shines. 🏆'
    : stars === 2 ? 'A solid shift — the regulars are happy.'
    : 'The rush got away from you — one more shift?';
  text(ctx, verdict, 640, 500, 18, '#7ed957', 'center');
  const blink = Math.floor(s.time * 2) % 2 === 0;
  if (blink) outlineText(ctx, 'PRESS R TO PLAY AGAIN', 640, 542, 22, '#ffd23e', 'center', TITLE_FONT);
}

// --- Main entry ----------------------------------------------------------------
export function drawGame(ctx, s) {
  ctx.clearRect(0, 0, VIEW.W, VIEW.H);
  drawWallAndFloor(ctx, s);
  for (const key of Object.keys(STATIONS)) drawStation(ctx, s, key);
  drawCounterAndPlates(ctx, s);
  drawServePassAndBin(ctx, s);
  drawChef(ctx, s);
  s.particles.draw(ctx);
  drawOrderBoard(ctx, s);
  drawHud(ctx, s);
  drawHints(ctx, s);
  if (s.phase === 'title') drawTitleScreen(ctx, s);
  if (s.phase === 'end') drawEndScreen(ctx, s);
  if (s.phase === 'paused') {
    ctx.fillStyle = 'rgba(20,8,2,0.6)';
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    outlineText(ctx, 'PAUSED — press P to resume', 640, 360, 34, '#ffffff', 'center', TITLE_FONT);
  }
  // Rush banner across the top of the kitchen when the rush starts.
  if (s.phase === 'play' && s.board.rush && s.timeLeft > 55 && s.timeLeft < 60) {
    outlineText(ctx, 'DINNER RUSH!', 640, 340, 40, '#ff8a3d', 'center', TITLE_FONT);
  }
}

export { RECIPES };
