// chef.js — the chef: position, walking animation, click-to-walk target and the
// nearest-station check. One clear job: where the chef is and how they get there.
import { WALK, CHEF_SPEED, BLOCKS } from './config.js';

export class Chef {
  constructor() {
    this.x = 640;
    this.y = 560;
    this.dir = 1; // 1 = facing right, -1 = facing left
    this.moving = false;
    this.walkPhase = 0;
    this.target = null; // {x, y} click-to-walk destination, or null
    this.busy = 0; // seconds of chop/fry animation lock at a station
  }

  update(dt, move, bounds = WALK) {
    if (this.busy > 0) {
      this.busy -= dt;
      this.moving = false;
      return;
    }
    let vx = move.x;
    let vy = move.y;
    if ((vx === 0 && vy === 0) && this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        this.target = null;
      } else {
        vx = dx / dist;
        vy = dy / dist;
      }
    }
    if (vx !== 0 || vy !== 0) {
      this.moving = true;
      if (vx !== 0) this.dir = vx > 0 ? 1 : -1;
      this.walkPhase += dt * 11;
      const speed = CHEF_SPEED;
      const nx = this.x + vx * speed * dt;
      const ny = this.y + vy * speed * dt;
      // Slide along counters: try each axis separately, skip a move that would
      // push the chef's circle inside a blocking rect.
      if (!this._hitsBlock(nx, this.y)) this.x = nx;
      if (!this._hitsBlock(this.x, ny)) this.y = ny;
    } else {
      this.moving = false;
    }
    this.x = Math.max(bounds.x0, Math.min(bounds.x1, this.x));
    this.y = Math.max(bounds.y0, Math.min(bounds.y1, this.y));
  }

  // Walk toward a point on the floor (clamped into the walkable area).
  goTo(x, y) {
    this.target = {
      x: Math.max(WALK.x0, Math.min(WALK.x1, x)),
      y: Math.max(WALK.y0, Math.min(WALK.y1, y)),
    };
  }

  // True when a circle of radius 16 at (x, y) would overlap a blocking rect.
  _hitsBlock(x, y) {
    const r = 16;
    return BLOCKS.some((b) => x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h);
  }

  // Station hit-boxes the chef can use: each station's "use zone" is the strip of
  // floor just below it (stations) or just above it (bottom row).
  static stationZone(station) {
    const s = station;
    if (s.y < 400) return { x: s.x - 6, y: s.y + s.h - 4, w: s.w + 12, h: 46 };
    return { x: s.x - 6, y: s.y - 46, w: s.w + 12, h: 46 };
  }

  near(rect) {
    return (
      this.x >= rect.x && this.x <= rect.x + rect.w &&
      this.y >= rect.y && this.y <= rect.y + rect.h
    );
  }
}
