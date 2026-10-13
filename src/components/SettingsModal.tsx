import React from 'react';
import { AppSettings, CameraDevice } from '../types';
import { X, Camera, Sliders, Volume2, VolumeX, Eye, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  cameraDevices: CameraDevice[];
  selectedCameraId: string;
  onSelectCamera: (deviceId: string) => void;
  cameraStatus: string;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onClearAllEntities: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  cameraDevices,
  selectedCameraId,
  onSelectCamera,
  cameraStatus,
  onStartCamera,
  onStopCamera,
  onClearAllEntities
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/95 border border-slate-700/80 p-6 text-white shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-lg font-['Outfit']">Settings & Controls</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-sm">
          {/* Camera Management */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Webcam Feed
            </label>
            <div className="flex flex-col gap-2">
              {cameraDevices.length > 0 && (
                <select
                  value={selectedCameraId}
                  onChange={e => onSelectCamera(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  {cameraDevices.map(cam => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex gap-2">
                {cameraStatus === 'tracking' ? (
                  <button
                    onClick={onStopCamera}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-semibold transition cursor-pointer"
                  >
                    Stop Camera
                  </button>
                ) : (
                  <button
                    onClick={onStartCamera}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold transition cursor-pointer"
                  >
                    Start Camera
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Gesture Mode Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Drawing Activation Gesture
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ gestureDrawingMode: 'point_to_draw' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.gestureDrawingMode === 'point_to_draw'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs">Point to Draw</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Point index finger (fist/curled) to draw, open palm to hover
                </div>
              </button>

              <button
                onClick={() => onUpdateSettings({ gestureDrawingMode: 'pinch_to_draw' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  settings.gestureDrawingMode === 'pinch_to_draw'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs">Pinch to Draw</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Touch index & thumb together to draw
                </div>
              </button>
            </div>
          </div>

          {/* Fingertip Jitter Smoothing Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Fingertip Smoothing</span>
              <span className="font-mono text-cyan-400">
                {Math.round(settings.smoothingFactor * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={settings.smoothingFactor}
              onChange={e => onUpdateSettings({ smoothingFactor: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Higher value reduces hand tremor and creates ultra-silky curves.
            </p>
          </div>

          {/* Audio Synthesizer */}
          <div className="flex items-center justify-between py-2 border-t border-slate-800">
            <div>
              <div className="font-medium text-xs text-slate-200">Synthesizer Sound Effects</div>
              <div className="text-[10px] text-slate-400">Play chimes and tactile audio cues</div>
            </div>
            <button
              onClick={() => onUpdateSettings({ soundEffects: !settings.soundEffects })}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                settings.soundEffects
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {settings.soundEffects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Show Gesture HUD */}
          <div className="flex items-center justify-between py-2 border-t border-slate-800">
            <div>
              <div className="font-medium text-xs text-slate-200">Show Gesture Badge & HUD</div>
              <div className="text-[10px] text-slate-400">Display recognized hand gesture tag</div>
            </div>
            <button
              onClick={() => onUpdateSettings({ showGestureHUD: !settings.showGestureHUD })}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                settings.showGestureHUD
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Reset & Clear Creations */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={onClearAllEntities}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              Remove All Living Creations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
