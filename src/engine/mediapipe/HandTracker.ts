import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureDetector } from './gestureDetector.ts';
import { PointSmoother } from './smoothing.ts';
import { CoordinateMapper } from './coordinateMapper.ts';
import { HandTrackingState, GestureType } from '../../types/index.ts';

export type StateCallback = (state: HandTrackingState) => void;
export type StatusCallback = (
  status: 'idle' | 'initializing' | 'tracking' | 'hand-lost' | 'denied' | 'error',
  errorMsg?: string
) => void;

export interface HandTrackerConfig {
  mirrorMode: boolean;
  gestureDrawingMode: 'point_to_draw' | 'pinch_to_draw';
  smoothingFactor: number;
  cameraId?: string;
}

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isRunning = false;
  private animFrameId: number | null = null;
  private lastVideoTime = -1;

  private gestureDetector: GestureDetector;
  private smoother: PointSmoother;

  private config: HandTrackerConfig;
  private stateCallbacks: Set<StateCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();

  constructor(config: HandTrackerConfig) {
    this.config = config;
    this.gestureDetector = new GestureDetector();
    this.smoother = new PointSmoother();
    this.smoother.setSensitivity(config.smoothingFactor);
  }

  public updateConfig(config: Partial<HandTrackerConfig>) {
    this.config = { ...this.config, ...config };
    if (config.smoothingFactor !== undefined) {
      this.smoother.setSensitivity(config.smoothingFactor);
    }
  }

  public onState(cb: StateCallback): () => void {
    this.stateCallbacks.add(cb);
    return () => this.stateCallbacks.delete(cb);
  }

  public onStatus(cb: StatusCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => this.statusCallbacks.delete(cb);
  }

  private notifyState(state: HandTrackingState) {
    for (const cb of this.stateCallbacks) {
      cb(state);
    }
  }

  private notifyStatus(
    status: 'idle' | 'initializing' | 'tracking' | 'hand-lost' | 'denied' | 'error',
    errorMsg?: string
  ) {
    for (const cb of this.statusCallbacks) {
      cb(status, errorMsg);
    }
  }

  /**
   * Initializes MediaPipe HandLandmarker with offline local assets and CDN fallback
   */
  public async initTracker(): Promise<boolean> {
    if (this.handLandmarker) return true;

    this.notifyStatus('initializing');
    try {
      // 1. Resolve WASM assets: local bundle first, CDN fallback if needed
      let vision;
      try {
        const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
        const wasmBase = `${window.location.origin}${basePath}/mediapipe/wasm`;
        vision = await FilesetResolver.forVisionTasks(wasmBase);
      } catch (localErr) {
        console.warn('Local WASM loading failed, falling back to CDN:', localErr);
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      // 2. Load model: local bundled task first, CDN fallback if needed
      const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
      const modelPath = `${window.location.origin}${basePath}/mediapipe/hand_landmarker.task`;

      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      } catch (gpuErr) {
        console.warn('GPU delegate failed, retrying with CPU delegate:', gpuErr);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to initialize MediaPipe HandLandmarker:', err);
      this.notifyStatus('error', `MediaPipe initialization failed: ${msg}`);
      return false;
    }
  }

  /**
   * Start camera and tracking loop
   */
  public async start(videoElem?: HTMLVideoElement): Promise<boolean> {
    if (this.isRunning) return true;

    const initialized = await this.initTracker();
    if (!initialized || !this.handLandmarker) return false;

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: this.config.cameraId
          ? { deviceId: { exact: this.config.cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoElem) {
        this.videoElement = videoElem;
      } else if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
      }

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      this.isRunning = true;
      this.lastVideoTime = -1;
      this.smoother.reset();
      this.gestureDetector.reset();
      this.notifyStatus('tracking');

      this.scheduleNextFrame();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        this.notifyStatus('denied', 'Camera permission was denied. Please allow camera access.');
      } else {
        this.notifyStatus('error', `Camera error: ${msg}`);
      }
      return false;
    }
  }

  /**
   * Stop camera and tracking loop
   */
  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.smoother.reset();
    this.gestureDetector.reset();
    this.notifyStatus('idle');
  }

  /**
   * Enumerate available video input devices
   */
  public static async getCameraDevices(): Promise<Array<{ deviceId: string; label: string }>> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`
        }));
    } catch (e) {
      console.warn('Failed to enumerate cameras:', e);
      return [];
    }
  }

  private scheduleNextFrame() {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(() => this.processFrame());
  }

  private processFrame() {
    if (!this.isRunning || !this.videoElement || !this.handLandmarker) return;

    // Check if video is playing and ready
    if (
      this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      this.videoElement.currentTime !== this.lastVideoTime
    ) {
      this.lastVideoTime = this.videoElement.currentTime;
      const timestamp = performance.now();

      try {
        const results = this.handLandmarker.detectForVideo(this.videoElement, timestamp);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const handType = (results.handedness && results.handedness[0] && results.handedness[0][0])
            ? (results.handedness[0][0].categoryName as 'Left' | 'Right')
            : undefined;

          // Gesture evaluation
          const gestureResult = this.gestureDetector.evaluate(
            landmarks,
            this.config.gestureDrawingMode
          );

          // Index fingertip landmark (index 8)
          const rawTip = gestureResult.indexTip;

          // Screen mapping
          const containerWidth = this.videoElement.clientWidth || window.innerWidth;
          const containerHeight = this.videoElement.clientHeight || window.innerHeight;
          const videoWidth = this.videoElement.videoWidth || 1280;
          const videoHeight = this.videoElement.videoHeight || 720;

          const screenPos = CoordinateMapper.mapNormalizedToScreen(
            rawTip.x,
            rawTip.y,
            {
              containerWidth,
              containerHeight,
              videoWidth,
              videoHeight,
              isMirrored: this.config.mirrorMode
            }
          );

          // Apply jitter-free smoothing
          const smoothedCursor = this.smoother.smooth(screenPos.x, screenPos.y, timestamp);

          // Map pinch center if pinching
          let pinchCenterScreen: { x: number; y: number } | null = null;
          if (gestureResult.isPinching) {
            const rawPinch = gestureResult.pinchCenter;
            const mappedPinch = CoordinateMapper.mapNormalizedToScreen(
              rawPinch.x,
              rawPinch.y,
              {
                containerWidth,
                containerHeight,
                videoWidth,
                videoHeight,
                isMirrored: this.config.mirrorMode
              }
            );
            pinchCenterScreen = mappedPinch;
          }

          this.notifyState({
            isActive: true,
            isHandDetected: true,
            rawLandmarks: landmarks,
            cursor: smoothedCursor,
            gesture: gestureResult.gesture,
            confidence: gestureResult.confidence,
            isPinching: gestureResult.isPinching,
            pinchDistance: gestureResult.pinchDistance,
            pinchCenter: pinchCenterScreen,
            handType,
            isDrawing: gestureResult.isDrawing
          });
        } else {
          // Hand lost
          this.smoother.reset();
          this.gestureDetector.reset();
          this.notifyState({
            isActive: true,
            isHandDetected: false,
            rawLandmarks: null,
            cursor: null,
            gesture: 'none',
            confidence: 0,
            isPinching: false,
            pinchDistance: 1,
            pinchCenter: null,
            isDrawing: false
          });
        }
      } catch (err) {
        console.warn('MediaPipe frame detection error:', err);
      }
    }

    this.scheduleNextFrame();
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }
}
