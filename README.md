# Living Sketch AI • Interactive Live Mirror & Air Drawing

> **Transform your webcam into a real-time magical interactive mirror.** See your body and reflection while drawing directly over the live camera feed using MediaPipe hand tracking, and bring your sketches to life with procedural animation and AI magic.

---

## 🌟 Key Features

### 1. Full-Screen Mirror Camera
- **Primary background:** The live webcam feed fills the entire viewport (`object-fit: cover`) with horizontal flipping (`scaleX(-1)`) so movements mirror natural bathroom reflection.
- **Never replaced:** The live camera remains the continuous underlying foundation, never covered by illustrations, avatars, or static images.
- **Aspect ratio preservation:** Automatic screen mapping calculates video dimensions and cropping offsets to guarantee that the cursor and drawn strokes overlay with 100% pixel accuracy.

### 2. Draw Directly Over Your Reflection
- **MediaPipe Hand Landmarker:** Tracks the 21 3D hand landmarks in real time at 60 FPS using local offline WebAssembly/GPU acceleration.
- **PointSmoother (OneEuroFilter):** Adaptive low-pass filtering removes jitter and hand tremor while maintaining ultra-low latency for fast sweeps.
- **Layer 2 Transparent Canvas Overlay:** Preserves all strokes when hands enter/exit the field of view without accidental bridging lines.
- **Vibrant Brush Studio:** Neon Glow with multi-pass aura, Shimmering Sparkles, Rainbow Pulse, Calligraphy speed-taper, and crisp Solid styles.

### 3. Natural Hand Gestures
| Gesture | Action | Description |
| :--- | :--- | :--- |
| ☝️ **Index Pointing** | **Air Drawing** | Extend index finger with other fingers curled to draw glowing strokes directly over your reflection. |
| ✋ **Open Palm** | **Hover / Move Cursor** | Open all fingers to move the cursor freely without leaving any marks on the mirror. |
| 🤏 **Pinch** | **Grab & Move Creation** | Touch thumb and index tips together to pick up drawn sketches and reposition them (e.g. wings on shoulders, crown on head). |
| ✊ **Closed Fist** | **Pause Animations** | Clench fingers into a fist to temporarily freeze/pause all living creations. |
| 🖱️ / 📱 **Mouse & Touch** | **Fallback Drawing** | Full mouse and touch support with **AIR DRAWING: ON/OFF** toggle button. |

### 4. Bring My Drawing to Life
Click the glowing **BRING MY DRAWING TO LIFE** button to transform any sketch into an autonomous living creation:
- **🪽 Wings Flapping:** 3D perspective fold wave (wings, birds, butterflies).
- **🫧 Float & Hover:** Gentle buoyancy and breathing scale (crowns, clouds, floating sigils).
- **🦘 Bouncy Jiggle:** Dynamic squash-and-stretch spring jumps.
- **💓 Heartbeat Pulse:** Rhythmic double-pulse (hearts, glowing emblems).
- **💫 Orbit & Wander:** Playful drifting and planetary weave around your reflection.
- **🐾 Companion Pet:** Follows your hand cursor or perches by your shoulder!
- **✨ AI Magic Auras:** Sparkle Stardust, Neon Aura, Fire Flames, Rainbow Trails, and Electric Sparks.

### 5. Required Layer Order
1. **Layer 1:** Live mirrored webcam feed (`<video>` with `scaleX(-1)` and `object-fit: cover`)
2. **Layer 2:** Transparent drawing canvas
3. **Layer 3:** Hand-tracking cursor, glowing halo, and gesture status badge
4. **Layer 4:** Animated sketches and living characters
5. **Layer 5:** Particle effects and AI magic auras
6. **Layer 6:** Interface controls (toolbar, brush picker, settings modal, creations drawer)

### 6. Controls & Camera Tools
- Start / Stop camera & camera device switcher
- Toggle Mirror Mode (`ON` / `OFF`)
- Undo (`Ctrl+Z`), Redo (`Ctrl+Y`), and Clear Drawing
- Brush color picker (neon palette + custom colors) & size slider
- Snapshot Capture: High-resolution export compositing mirrored camera + drawings + living characters into a downloadable PNG!
- Synthesizer Sound Effects (Web Audio API)

---

## 🚀 Getting Started

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser and allow webcam permissions.

### Build
```bash
npm run build
```

### Test Suite
```bash
npm test
```
Runs the automated test suite verifying coordinate mapping, gesture recognition, jitter smoothing, stroke management, and animation physics.
