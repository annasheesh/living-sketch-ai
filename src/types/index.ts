export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export type BrushType = 'neon' | 'solid' | 'rainbow' | 'sparkle' | 'calligraphy';

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  brushType: BrushType;
  opacity: number;
}

export type GestureType = 'none' | 'pointing' | 'drawing' | 'open_palm' | 'pinch' | 'fist';

export interface HandTrackingState {
  isActive: boolean;
  isHandDetected: boolean;
  rawLandmarks: Array<{ x: number; y: number; z: number }> | null;
  cursor: { x: number; y: number } | null;
  gesture: GestureType;
  confidence: number;
  isPinching: boolean;
  pinchDistance: number;
  pinchCenter: { x: number; y: number } | null;
  handType?: 'Left' | 'Right';
  isDrawing: boolean;
}

export type AnimationType = 
  | 'hover' 
  | 'wings_flap' 
  | 'bouncing' 
  | 'orbit' 
  | 'heartbeat' 
  | 'follow_hand';

export type AIEffectType = 
  | 'none'
  | 'sparkle_dust' 
  | 'neon_aura' 
  | 'fire_flame' 
  | 'rainbow_trail' 
  | 'electric';

export interface EntityBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface LivingEntity {
  id: string;
  name: string;
  // Local strokes relative to (0, 0)
  relativeStrokes: Stroke[];
  bounds: EntityBounds;
  // Current screen position and transforms
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  scale: number;
  rotation: number;
  vx: number;
  vy: number;
  // Animation settings
  animationType: AnimationType;
  animationSpeed: number;
  isPaused: boolean;
  // AI enhancement
  aiPrompt?: string;
  aiEffect: AIEffectType;
  // Interactivity
  isGrabbed?: boolean;
  createdAt: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'star' | 'spark';
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface AppSettings {
  mirrorMode: boolean;
  airDrawingEnabled: boolean;
  gestureDrawingMode: 'point_to_draw' | 'pinch_to_draw';
  brushColor: string;
  brushSize: number;
  brushType: BrushType;
  smoothingFactor: number;
  showLandmarkSkeleton: boolean;
  showGestureHUD: boolean;
  soundEffects: boolean;
  glowStrength: number;
}
