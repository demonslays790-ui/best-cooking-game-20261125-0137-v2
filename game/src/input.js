// input.js — keyboard (WASD/arrows + E + 1-6 + M + R) and mouse (click to walk,
// click a station to use it). One clear job: turn raw events into game intents.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered keys, consumed once per frame
    this.click = null; // {x, y} in canvas pixels, consumed once per frame
    this.onFirstGesture = null;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
      if (this.onFirstGesture) this.onFirstGesture();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.click = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
      if (this.onFirstGesture) this.onFirstGesture();
    });
    // Keep focus on the canvas so keys keep working after a click elsewhere.
    window.addEventListener('blur', () => this.keys.clear());
  }

  // Movement vector from WASD / arrows, normalised.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }

  // True once on the frame the key went down.
  wasPressed(key) {
    const hit = this.pressed.has(key.toLowerCase());
    if (hit) this.pressed.delete(key.toLowerCase());
    return hit;
  }

  takeClick() {
    const c = this.click;
    this.click = null;
    return c;
  }

  // Clear edge presses at the end of each frame so a held key fires once.
  endFrame() {
    this.pressed.clear();
  }
}
