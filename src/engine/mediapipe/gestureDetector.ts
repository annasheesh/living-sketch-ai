import type { GestureType } from '../../types/index.ts';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export interface GestureDetectorConfig {
  pinchThreshold: number;        // Normalized threshold to enter pinch
  pinchReleaseThreshold: number; // Normalized threshold to exit pinch
  confirmationFrames: number;   // Consecutive frames needed to switch gesture
}

export interface GestureDetectionResult {
  gesture: GestureType;
  isDrawing: boolean;
  isPinching: boolean;
  pinchDistance: number;
  pinchCenter: { x: number; y: number };
  indexTip: { x: number; y: number; z: number };
  thumbTip: { x: number; y: number; z: number };
  fingerExtensions: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  confidence: number;
}

export class GestureDetector {
  private config: GestureDetectorConfig;
  private isPinching = false;
  private currentGesture: GestureType = 'none';
  private consecutiveGestureFrames = 0;
  private candidateGesture: GestureType = 'none';

  constructor(config?: Partial<GestureDetectorConfig>) {
    this.config = {
      pinchThreshold: config?.pinchThreshold ?? 0.28,
      pinchReleaseThreshold: config?.pinchReleaseThreshold ?? 0.38,
      confirmationFrames: config?.confirmationFrames ?? 2
    };
  }

  public updateConfig(config: Partial<GestureDetectorConfig>) {
    this.config = { ...this.config, ...config };
  }

  public reset() {
    this.isPinching = false;
    this.currentGesture = 'none';
    this.candidateGesture = 'none';
    this.consecutiveGestureFrames = 0;
  }

  /**
   * Evaluates 21 MediaPipe landmarks to identify hand gesture
   * Landmark indices:
   * 0: Wrist
   * 1-4: Thumb (4 is tip)
   * 5-8: Index (5: MCP, 6: PIP, 7: DIP, 8: TIP)
   * 9-12: Middle (9: MCP, 10: PIP, 11: DIP, 12: TIP)
   * 13-16: Ring (13: MCP, 14: PIP, 15: DIP, 16: TIP)
   * 17-20: Pinky (17: MCP, 18: PIP, 19: DIP, 20: TIP)
   */
  public evaluate(
    landmarks: Landmark3D[],
    drawMode: 'point_to_draw' | 'pinch_to_draw' = 'point_to_draw'
  ): GestureDetectionResult {
    if (!landmarks || landmarks.length < 21) {
      return {
        gesture: 'none',
        isDrawing: false,
        isPinching: false,
        pinchDistance: 1,
        pinchCenter: { x: 0.5, y: 0.5 },
        indexTip: { x: 0.5, y: 0.5, z: 0 },
        thumbTip: { x: 0.5, y: 0.5, z: 0 },
        fingerExtensions: { thumb: false, index: false, middle: false, ring: false, pinky: false },
        confidence: 0
      };
    }

    const wrist = landmarks[0];
    const thumbMcp = landmarks[2];
    const thumbTip = landmarks[4];
    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const indexTip = landmarks[8];
    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleTip = landmarks[12];
    const ringMcp = landmarks[13];
    const ringPip = landmarks[14];
    const ringTip = landmarks[16];
    const pinkyMcp = landmarks[17];
    const pinkyPip = landmarks[18];
    const pinkyTip = landmarks[20];

    // Reference hand scale: wrist to middle finger MCP
    const handScale = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.2;

    // Helper to calculate Euclidean distance
    const dist = (p1: Landmark3D, p2: Landmark3D) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    // Scale-invariant distance from wrist
    const indexDistWrist = dist(indexTip, wrist) / handScale;
    const middleDistWrist = dist(middleTip, wrist) / handScale;
    const ringDistWrist = dist(ringTip, wrist) / handScale;
    const pinkyDistWrist = dist(pinkyTip, wrist) / handScale;
    const thumbDistWrist = dist(thumbTip, wrist) / handScale;

    // Extension check: tip is substantially farther from wrist than pip or mcp
    const isIndexExtended = indexDistWrist > 1.35 && dist(indexTip, indexPip) > dist(indexPip, indexMcp) * 0.7;
    const isMiddleExtended = middleDistWrist > 1.35 && dist(middleTip, middlePip) > dist(middlePip, middleMcp) * 0.7;
    const isRingExtended = ringDistWrist > 1.25 && dist(ringTip, ringPip) > dist(ringPip, ringMcp) * 0.7;
    const isPinkyExtended = pinkyDistWrist > 1.15 && dist(pinkyTip, pinkyPip) > dist(pinkyPip, pinkyMcp) * 0.7;
    // Thumb is extended if its tip is away from index MCP and wrist
    const isThumbExtended = thumbDistWrist > 0.9 && (dist(thumbTip, indexMcp) / handScale > 0.45);

    const fingerExtensions = {
      thumb: isThumbExtended,
      index: isIndexExtended,
      middle: isMiddleExtended,
      ring: isRingExtended,
      pinky: isPinkyExtended
    };

    // Pinch distance between thumb tip and index tip
    const rawPinchDist = dist(thumbTip, indexTip);
    const normalizedPinchDist = rawPinchDist / handScale;

    // Pinch hysteresis
    if (!this.isPinching) {
      if (normalizedPinchDist <= this.config.pinchThreshold) {
        this.isPinching = true;
      }
    } else {
      if (normalizedPinchDist >= this.config.pinchReleaseThreshold) {
        this.isPinching = false;
      }
    }

    // Extended finger count (excluding thumb for 4-finger gestures)
    const extendedFingerCount = 
      (isIndexExtended ? 1 : 0) +
      (isMiddleExtended ? 1 : 0) +
      (isRingExtended ? 1 : 0) +
      (isPinkyExtended ? 1 : 0) +
      (isThumbExtended ? 1 : 0);

    const extendedNonThumbCount = 
      (isIndexExtended ? 1 : 0) +
      (isMiddleExtended ? 1 : 0) +
      (isRingExtended ? 1 : 0) +
      (isPinkyExtended ? 1 : 0);

    // Determine raw gesture
    let rawGesture: GestureType = 'none';
    const isClosedFist = extendedNonThumbCount === 0 && !isThumbExtended;

    if (isClosedFist) {
      // Closed fist: all fingers curled
      this.isPinching = false;
      rawGesture = 'fist';
    } else if (this.isPinching) {
      // Pinch gesture
      rawGesture = 'pinch';
    } else if (extendedFingerCount >= 4) {
      // Open palm: all or most fingers extended
      rawGesture = 'open_palm';
    } else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      // Only index extended: pointing / drawing gesture
      rawGesture = 'pointing';
    } else if (isIndexExtended) {
      // Index extended alongside thumb or slight middle
      rawGesture = 'pointing';
    } else {
      rawGesture = 'pointing';
    }

    // Hysteresis stabilization on gesture changes
    if (rawGesture === this.candidateGesture) {
      this.consecutiveGestureFrames++;
      if (this.consecutiveGestureFrames >= this.config.confirmationFrames) {
        this.currentGesture = rawGesture;
      }
    } else {
      this.candidateGesture = rawGesture;
      this.consecutiveGestureFrames = 1;
      if (this.config.confirmationFrames <= 1 || this.currentGesture === 'none') {
        this.currentGesture = rawGesture;
      }
    }

    // Calculate drawing state based on gesture mode
    let isDrawing = false;
    let finalGesture = this.currentGesture;

    if (drawMode === 'point_to_draw') {
      if (this.currentGesture === 'pointing') {
        // Index is pointed with other fingers closed: Active Drawing!
        isDrawing = true;
        finalGesture = 'drawing';
      } else if (this.currentGesture === 'open_palm') {
        // Open palm stops drawing and moves cursor freely
        isDrawing = false;
        finalGesture = 'open_palm';
      } else if (this.currentGesture === 'pinch') {
        isDrawing = false;
        finalGesture = 'pinch';
      } else if (this.currentGesture === 'fist') {
        isDrawing = false;
        finalGesture = 'fist';
      }
    } else {
      // 'pinch_to_draw' mode: pinch draws, index pointing moves cursor
      if (this.currentGesture === 'pinch') {
        isDrawing = true;
        finalGesture = 'drawing';
      } else if (this.currentGesture === 'pointing') {
        isDrawing = false;
        finalGesture = 'pointing';
      } else if (this.currentGesture === 'open_palm') {
        isDrawing = false;
        finalGesture = 'open_palm';
      } else if (this.currentGesture === 'fist') {
        isDrawing = false;
        finalGesture = 'fist';
      }
    }

    const pinchCenter = {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2
    };

    return {
      gesture: finalGesture,
      isDrawing,
      isPinching: this.isPinching,
      pinchDistance: normalizedPinchDist,
      pinchCenter,
      indexTip,
      thumbTip,
      fingerExtensions,
      confidence: 0.95
    };
  }
}
