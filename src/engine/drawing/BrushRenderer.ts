import type { Stroke, Point, BrushType } from '../../types/index.ts';

export class BrushRenderer {
  /**
   * Render a collection of strokes onto a 2D canvas context
   */
  public static renderStrokes(
    ctx: CanvasRenderingContext2D,
    strokes: Stroke[],
    glowStrength: number = 1.0
  ) {
    for (const stroke of strokes) {
      this.renderSingleStroke(ctx, stroke, glowStrength);
    }
  }

  /**
   * Render a single stroke with specialized brush styles
   */
  public static renderSingleStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    glowStrength: number = 1.0
  ) {
    if (!stroke.points || stroke.points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.opacity;

    switch (stroke.brushType) {
      case 'neon':
        this.renderNeonStroke(ctx, stroke, glowStrength);
        break;
      case 'rainbow':
        this.renderRainbowStroke(ctx, stroke, glowStrength);
        break;
      case 'sparkle':
        this.renderSparkleStroke(ctx, stroke, glowStrength);
        break;
      case 'calligraphy':
        this.renderCalligraphyStroke(ctx, stroke);
        break;
      case 'solid':
      default:
        this.renderSolidStroke(ctx, stroke);
        break;
    }

    ctx.restore();
  }

  /**
   * Neon Glow style: Multi-pass rendering with soft outer aura and bright white-tinted inner core
   */
  private static renderNeonStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    glowStrength: number
  ) {
    const points = stroke.points;
    if (points.length < 2) {
      // Draw single glowing dot
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = 18 * glowStrength;
      ctx.fill();
      return;
    }

    // Outer wide glow pass
    ctx.beginPath();
    this.buildSmoothPath(ctx, points);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size * 1.8;
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = 24 * glowStrength;
    ctx.stroke();

    // Mid intense glow pass
    ctx.beginPath();
    this.buildSmoothPath(ctx, points);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = 12 * glowStrength;
    ctx.stroke();

    // Inner bright core pass
    ctx.beginPath();
    this.buildSmoothPath(ctx, points);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, stroke.size * 0.4);
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4 * glowStrength;
    ctx.stroke();
  }

  /**
   * Solid Clean style: Smooth, anti-aliased, crisp stroke
   */
  private static renderSolidStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke
  ) {
    const points = stroke.points;
    if (points.length < 2) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
      return;
    }

    ctx.beginPath();
    this.buildSmoothPath(ctx, points);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.stroke();
  }

  /**
   * Rainbow style: Continuous dynamic hue shifting along stroke length
   */
  private static renderRainbowStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    glowStrength: number
  ) {
    const points = stroke.points;
    if (points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const hue = (i * 12 + ((p1.timestamp || 0) * 0.1)) % 360;
      const color = `hsl(${hue}, 100%, 60%)`;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = stroke.size;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * glowStrength;
      ctx.stroke();
    }
  }

  /**
   * Sparkle style: Main stroke with magical shimmering glitter dots along its path
   */
  private static renderSparkleStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    glowStrength: number
  ) {
    const points = stroke.points;
    this.renderNeonStroke(ctx, stroke, glowStrength * 0.8);

    // Render twinkling sparkle stars along points
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = 10 * glowStrength;

    for (let i = 0; i < points.length; i += 3) {
      const pt = points[i];
      const seed = Math.sin(i * 99 + pt.x);
      const radius = Math.max(1, (seed * 0.5 + 0.5) * (stroke.size * 0.7));
      
      ctx.beginPath();
      ctx.arc(pt.x + seed * 3, pt.y + (1 - seed) * 3, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Calligraphy style: Fluid thickness based on segment speed/distance
   */
  private static renderCalligraphyStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke
  ) {
    const points = stroke.points;
    if (points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      // Speed-based dynamic taper: faster = thinner, slower = thicker
      const width = Math.max(2, stroke.size * Math.max(0.4, 1.6 - dist * 0.05));

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }

  /**
   * Smooth quadratic Bezier path through point sequence
   */
  public static buildSmoothPath(ctx: CanvasRenderingContext2D, points: Point[]) {
    if (points.length === 0) return;
    if (points.length === 1) {
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[0].x, points[0].y);
      return;
    }

    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
      return;
    }

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  }
}
