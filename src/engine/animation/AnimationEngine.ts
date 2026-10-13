import type { LivingEntity, AnimationType, AIEffectType, Stroke } from '../../types/index.ts';
import { BrushRenderer } from '../drawing/BrushRenderer.ts';
import { ParticleSystem } from '../particles/ParticleSystem.ts';

export class AnimationEngine {
  private entities: LivingEntity[] = [];
  private selectedEntityId: string | null = null;
  private particleSystem: ParticleSystem;
  private isGlobalPaused = false;

  constructor(particleSystem: ParticleSystem) {
    this.particleSystem = particleSystem;
  }

  public getEntities(): LivingEntity[] {
    return this.entities;
  }

  public getSelectedEntity(): LivingEntity | null {
    if (!this.selectedEntityId) return null;
    return this.entities.find(e => e.id === this.selectedEntityId) || null;
  }

  public setSelectedEntityId(id: string | null) {
    this.selectedEntityId = id;
  }

  public addEntity(entity: LivingEntity) {
    this.entities.push(entity);
    this.selectedEntityId = entity.id;
    // Spawn celebratory burst
    this.particleSystem.spawnBurst(entity.x, entity.y, 45);
  }

  public removeEntity(id: string) {
    this.entities = this.entities.filter(e => e.id !== id);
    if (this.selectedEntityId === id) {
      this.selectedEntityId = this.entities.length > 0 ? this.entities[this.entities.length - 1].id : null;
    }
  }

  public clearAll() {
    this.entities = [];
    this.selectedEntityId = null;
  }

  public togglePause(id?: string) {
    if (id) {
      const entity = this.entities.find(e => e.id === id);
      if (entity) entity.isPaused = !entity.isPaused;
    } else {
      this.isGlobalPaused = !this.isGlobalPaused;
      for (const e of this.entities) {
        e.isPaused = this.isGlobalPaused;
      }
    }
  }

  public setGlobalPaused(paused: boolean) {
    this.isGlobalPaused = paused;
    for (const e of this.entities) {
      e.isPaused = paused;
    }
  }

  public isPaused(): boolean {
    return this.isGlobalPaused;
  }

  /**
   * Check if pinch position hits an entity to grab and drag
   */
  public handlePinchStart(pinchX: number, pinchY: number): LivingEntity | null {
    // Check in reverse order (topmost first)
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      const radius = Math.max(40, Math.hypot(e.bounds.width, e.bounds.height) / 2);
      const dist = Math.hypot(pinchX - e.x, pinchY - e.y);

      if (dist <= radius) {
        e.isGrabbed = true;
        this.selectedEntityId = e.id;
        return e;
      }
    }
    return null;
  }

  /**
   * Move grabbed entity to pinch coordinates
   */
  public handlePinchMove(pinchX: number, pinchY: number) {
    for (const e of this.entities) {
      if (e.isGrabbed) {
        // Smoothly interpolate towards pinch position
        e.x = pinchX;
        e.y = pinchY;
        e.baseX = pinchX;
        e.baseY = pinchY;
      }
    }
  }

  /**
   * Release any grabbed entities
   */
  public handlePinchEnd() {
    for (const e of this.entities) {
      e.isGrabbed = false;
    }
  }

  /**
   * Update animation state for all entities
   */
  public update(time: number, handCursor: { x: number; y: number } | null = null) {
    const t = time / 1000;

    for (const e of this.entities) {
      if (e.isPaused || e.isGrabbed) {
        // Don't procedural animate if grabbed or paused
        continue;
      }

      const speed = e.animationSpeed || 1.0;
      const phase = (e.createdAt % 10000) / 1000;

      switch (e.animationType) {
        case 'hover': {
          // Gentle floating buoyancy and subtle breathing
          const bobOffsetY = Math.sin(t * 2.5 * speed + phase) * 14;
          const tilt = Math.cos(t * 1.5 * speed + phase) * 0.05;
          const breath = 1.0 + Math.sin(t * 2.0 * speed + phase) * 0.04;

          e.y = e.baseY + bobOffsetY;
          e.rotation = tilt;
          e.scale = breath;
          break;
        }

        case 'wings_flap': {
          // Perspective flapping motion (scaleX rhythmic wave)
          const flap = Math.cos(t * 6.0 * speed + phase);
          // ScaleX oscillates between 0.25 (folded back) and 1.0 (spread out)
          const scaleX = 0.65 + 0.35 * flap;
          const bobY = Math.sin(t * 3.0 * speed + phase) * 8;

          e.y = e.baseY + bobY;
          e.scale = scaleX;
          e.rotation = Math.sin(t * 3.0 * speed + phase) * 0.08;
          break;
        }

        case 'bouncing': {
          // Bouncy squash & stretch physics
          const bounceRaw = Math.abs(Math.sin(t * 4.0 * speed + phase));
          const jumpY = -bounceRaw * 40;
          const squash = 1.0 + (1.0 - bounceRaw) * 0.25 - bounceRaw * 0.15;
          const stretch = 1.0 / Math.max(0.6, squash);

          e.y = e.baseY + jumpY;
          e.scale = (squash + stretch) / 2;
          break;
        }

        case 'orbit': {
          // Drifting planetary wander around base point
          const radiusX = 45;
          const radiusY = 25;
          e.x = e.baseX + Math.cos(t * 2.0 * speed + phase) * radiusX;
          e.y = e.baseY + Math.sin(t * 2.0 * speed + phase) * radiusY;
          e.rotation = Math.sin(t * 1.5 * speed + phase) * 0.12;
          break;
        }

        case 'heartbeat': {
          // Dual-pulse heartbeat (lub-dub)
          const cycle = (t * speed * 1.2) % 1.0;
          let pulse = 0;
          if (cycle < 0.15) {
            pulse = Math.sin((cycle / 0.15) * Math.PI) * 0.25;
          } else if (cycle > 0.25 && cycle < 0.4) {
            pulse = Math.sin(((cycle - 0.25) / 0.15) * Math.PI) * 0.18;
          }

          e.scale = 1.0 + pulse;
          e.rotation = Math.sin(t * 2.0 * speed) * 0.03;
          break;
        }

        case 'follow_hand': {
          // Pet companion follows hand cursor smoothly
          if (handCursor) {
            const targetX = handCursor.x + 60; // Hover slightly to the side
            const targetY = handCursor.y - 40;
            e.baseX += (targetX - e.baseX) * 0.06 * speed;
            e.baseY += (targetY - e.baseY) * 0.06 * speed;
          }
          const bob = Math.sin(t * 3.0 * speed) * 10;
          e.x = e.baseX;
          e.y = e.baseY + bob;
          e.scale = 1.0 + Math.sin(t * 2.0 * speed) * 0.05;
          break;
        }
      }

      // Emit AI / magic particle auras
      if (e.aiEffect && e.aiEffect !== 'none') {
        this.particleSystem.emitEntityAura(
          e.x,
          e.y,
          e.bounds.width * e.scale,
          e.bounds.height * e.scale,
          e.aiEffect
        );
      }
    }
  }

  /**
   * Render all living entities onto canvas
   */
  public render(ctx: CanvasRenderingContext2D, glowStrength = 1.0) {
    for (const e of this.entities) {
      ctx.save();

      // Transform to entity position, rotation, and scale
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rotation);
      ctx.scale(e.scale, e.scale);

      // Render selection ring if selected
      if (e.id === this.selectedEntityId) {
        ctx.save();
        ctx.beginPath();
        const r = Math.max(e.bounds.width, e.bounds.height) / 2 + 16;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#60A5FA';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();

        // Render name tag badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#60A5FA';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.roundRect(-45, -r - 26, 90, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#93C5FD';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.name, 0, -r - 15);
        ctx.restore();
      }

      // Render the entity's relative strokes
      BrushRenderer.renderStrokes(ctx, e.relativeStrokes, glowStrength);

      ctx.restore();
    }
  }
}
