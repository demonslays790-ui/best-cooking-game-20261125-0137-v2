// particles.js — steam, sizzle sparks, floating score popups and serve confetti.
// One clear job: short-lived visual feedback. All drawing is circles and rects.
export class Particles {
  constructor() {
    this.list = []; // {kind, x, y, vx, vy, life, maxLife, size, color, text}
  }

  steam(x, y) {
    this.list.push({
      kind: 'steam', x: x + (Math.random() - 0.5) * 24, y, vx: (Math.random() - 0.5) * 8,
      vy: -26 - Math.random() * 14, life: 0, maxLife: 1.1 + Math.random() * 0.5,
      size: 7 + Math.random() * 7, color: 'rgba(255,255,255,0.55)',
    });
  }

  spark(x, y) {
    this.list.push({
      kind: 'spark', x, y, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 60,
      life: 0, maxLife: 0.45 + Math.random() * 0.25, size: 2 + Math.random() * 2.5,
      color: Math.random() < 0.5 ? '#ffcf3f' : '#ff8a3d',
    });
  }

  popup(x, y, text, color = '#ffe27a') {
    this.list.push({
      kind: 'text', x, y, vx: 0, vy: -34, life: 0, maxLife: 1.4,
      size: 22, color, text,
    });
  }

  confetti(x, y) {
    const colors = ['#ffd23e', '#ff5a4e', '#7ed957', '#4ec6ff', '#ff9de2'];
    for (let i = 0; i < 26; i++) {
      this.list.push({
        kind: 'confetti', x, y, vx: (Math.random() - 0.5) * 260, vy: -120 - Math.random() * 180,
        life: 0, maxLife: 1.1 + Math.random() * 0.6, size: 4 + Math.random() * 4,
        color: colors[i % colors.length], rot: Math.random() * Math.PI,
      });
    }
  }

  update(dt) {
    for (const p of this.list) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'steam') { p.vy -= 6 * dt; p.size += 9 * dt; }
      if (p.kind === 'confetti') p.vy += 320 * dt;
      if (p.kind === 'spark') p.vy += 120 * dt;
    }
    this.list = this.list.filter((p) => p.life < p.maxLife);
    if (this.list.length > 220) this.list.splice(0, this.list.length - 220);
  }

  draw(ctx) {
    for (const p of this.list) {
      const t = 1 - p.life / p.maxLife;
      if (p.kind === 'text') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 1.6);
        ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(60,20,0,0.85)';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      } else if (p.kind === 'confetti') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 1.5);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + p.life * 6);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.kind === 'steam') {
        ctx.save();
        ctx.globalAlpha = 0.5 * t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t + 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}
