import type { Particle, AIEffectType } from '../../types/index.ts';

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId = 0;
  private maxParticles = 400;

  public clear() {
    this.particles = [];
  }

  /**
   * Spawn a burst of celebratory particles / confetti
   */
  public spawnBurst(x: number, y: number, count = 40, colors?: string[]) {
    const palette = colors || [
      '#FF3366', '#33CCFF', '#FFCC00', '#00FF99', '#CC33FF', '#FFFFFF'
    ];

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      const color = palette[Math.floor(Math.random() * palette.length)];

      this.particles.push({
        id: this.nextId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Slight upward lift
        size: 3 + Math.random() * 5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 35 + Math.random() * 25,
        shape: Math.random() > 0.4 ? 'star' : 'circle'
      });
    }
  }

  /**
   * Emit fingertip trail particles when user moves finger
   */
  public emitFingertipTrail(x: number, y: number, color: string, isDrawing: boolean) {
    if (this.particles.length >= this.maxParticles) return;

    const count = isDrawing ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * (isDrawing ? 2 : 1);

      this.particles.push({
        id: this.nextId++,
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isDrawing ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2,
        color,
        alpha: 0.9,
        life: 0,
        maxLife: isDrawing ? 20 + Math.random() * 15 : 12 + Math.random() * 10,
        shape: 'spark'
      });
    }
  }

  /**
   * Emit specialized aura particles for living entity
   */
  public emitEntityAura(
    x: number,
    y: number,
    width: number,
    height: number,
    effect: AIEffectType
  ) {
    if (effect === 'none' || this.particles.length >= this.maxParticles) return;

    const spawnCount = effect === 'fire_flame' ? 3 : 2;
    for (let i = 0; i < spawnCount; i++) {
      // Pick random point along perimeter or interior
      const px = x + (Math.random() - 0.5) * width;
      const py = y + (Math.random() - 0.5) * height;

      switch (effect) {
        case 'sparkle_dust':
          this.particles.push({
            id: this.nextId++,
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -0.5 - Math.random() * 1.5,
            size: 2 + Math.random() * 3,
            color: Math.random() > 0.5 ? '#FFDF00' : '#E0F7FA',
            alpha: 1,
            life: 0,
            maxLife: 25 + Math.random() * 20,
            shape: 'star'
          });
          break;

        case 'neon_aura':
          this.particles.push({
            id: this.nextId++,
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: 3 + Math.random() * 4,
            color: `hsl(${Math.random() * 60 + 280}, 100%, 70%)`,
            alpha: 0.8,
            life: 0,
            maxLife: 20 + Math.random() * 15,
            shape: 'circle'
          });
          break;

        case 'fire_flame':
          this.particles.push({
            id: this.nextId++,
            x: px,
            y: y + height * 0.3 + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 2,
            vy: -2.5 - Math.random() * 3,
            size: 4 + Math.random() * 6,
            color: Math.random() > 0.4 ? '#FF5500' : '#FFDD00',
            alpha: 0.9,
            life: 0,
            maxLife: 22 + Math.random() * 15,
            shape: 'circle'
          });
          break;

        case 'rainbow_trail':
          this.particles.push({
            id: this.nextId++,
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 0.5 + Math.random() * 1.5,
            size: 3 + Math.random() * 3,
            color: `hsl(${Math.random() * 360}, 100%, 65%)`,
            alpha: 0.85,
            life: 0,
            maxLife: 30 + Math.random() * 15,
            shape: 'circle'
          });
          break;

        case 'electric':
          this.particles.push({
            id: this.nextId++,
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: 1.5 + Math.random() * 2,
            color: '#60A5FA',
            alpha: 1,
            life: 0,
            maxLife: 8 + Math.random() * 8,
            shape: 'spark'
          });
          break;
      }
    }
  }

  /**
   * Update particle physics and lifecycles
   */
  public update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      // Drag and gravity
      p.vx *= 0.97;
      p.vy += 0.05; // Gentle downward gravity

      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render all active particles
   */
  public render(ctx: CanvasRenderingContext2D) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;

      if (p.shape === 'star') {
        this.drawStar(ctx, p.x, p.y, 4, p.size, p.size * 0.4);
      } else if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
}
