import type { Stroke, Point, BrushType, EntityBounds } from '../../types/index.ts';

export class StrokeManager {
  private strokes: Stroke[] = [];
  private undoStack: Stroke[][] = [];
  private redoStack: Stroke[][] = [];
  private activeStroke: Stroke | null = null;
  private minPointDistance = 3.0; // Min px distance between consecutive stroke points

  public getStrokes(): Stroke[] {
    return this.strokes;
  }

  public getActiveStroke(): Stroke | null {
    return this.activeStroke;
  }

  public canUndo(): boolean {
    return this.strokes.length > 0 || this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Start a new stroke with specified brush properties
   */
  public beginStroke(
    startPoint: Point,
    color: string,
    size: number,
    brushType: BrushType,
    opacity = 1.0
  ): Stroke {
    this.activeStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      points: [{ ...startPoint, timestamp: performance.now() }],
      color,
      size,
      brushType,
      opacity
    };
    return this.activeStroke;
  }

  /**
   * Add a point to the active stroke with distance filtering
   */
  public addPoint(point: Point): boolean {
    if (!this.activeStroke) return false;

    const points = this.activeStroke.points;
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
      if (dist < this.minPointDistance) {
        return false;
      }
    }

    points.push({ ...point, timestamp: performance.now() });
    return true;
  }

  /**
   * Complete active stroke and record to history
   */
  public endStroke(): Stroke | null {
    if (!this.activeStroke) return null;

    const completed = this.activeStroke;
    this.activeStroke = null;

    if (completed.points.length >= 1) {
      // Push state before change to undo stack
      this.undoStack.push([...this.strokes]);
      this.redoStack = []; // Clear redo
      this.strokes.push(completed);
      return completed;
    }
    return null;
  }

  /**
   * Cancel active stroke without committing
   */
  public cancelStroke() {
    this.activeStroke = null;
  }

  /**
   * Undo last stroke
   */
  public undo(): boolean {
    if (this.strokes.length === 0) return false;

    this.redoStack.push([...this.strokes]);
    const previous = this.undoStack.pop();
    this.strokes = previous || [];
    return true;
  }

  /**
   * Redo previously undone stroke
   */
  public redo(): boolean {
    if (this.redoStack.length === 0) return false;

    this.undoStack.push([...this.strokes]);
    const next = this.redoStack.pop();
    if (next) {
      this.strokes = next;
      return true;
    }
    return false;
  }

  /**
   * Clear all strokes
   */
  public clear(): boolean {
    if (this.strokes.length === 0) return false;

    this.undoStack.push([...this.strokes]);
    this.redoStack = [];
    this.strokes = [];
    this.activeStroke = null;
    return true;
  }

  /**
   * Calculate bounding box and center of mass across all or specified strokes
   */
  public static calculateBounds(strokes: Stroke[]): EntityBounds | null {
    if (strokes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let hasPoints = false;

    for (const stroke of strokes) {
      for (const pt of stroke.points) {
        hasPoints = true;
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    if (!hasPoints) return null;

    // Pad slightly to account for brush width
    const padding = 12;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = Math.max(20, maxX - minX);
    const height = Math.max(20, maxY - minY);
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      centerX,
      centerY
    };
  }

  /**
   * Converts strokes into relative strokes centered around (0, 0)
   */
  public static normalizeStrokesToCenter(strokes: Stroke[], centerX: number, centerY: number): Stroke[] {
    return strokes.map(stroke => ({
      ...stroke,
      points: stroke.points.map(pt => ({
        ...pt,
        x: pt.x - centerX,
        y: pt.y - centerY
      }))
    }));
  }
}
