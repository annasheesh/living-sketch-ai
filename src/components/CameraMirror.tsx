import React, { forwardRef } from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraMirrorProps {
  isMirrored: boolean;
  cameraStatus: 'idle' | 'initializing' | 'tracking' | 'hand-lost' | 'denied' | 'error';
  errorMessage?: string;
  onRetry: () => void;
  onStartCamera: () => void;
  isSimulatedMirror: boolean;
  onToggleSimulatedMirror: () => void;
}

export const CameraMirror = forwardRef<HTMLVideoElement, CameraMirrorProps>(
  (
    {
      isMirrored,
      cameraStatus,
      errorMessage,
      onRetry,
      onStartCamera,
      isSimulatedMirror,
      onToggleSimulatedMirror
    },
    ref
  ) => {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black select-none pointer-events-none z-0">
        {/* Layer 1: Live Video Feed */}
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-200 ${
            isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
          } ${isSimulatedMirror || cameraStatus === 'denied' || cameraStatus === 'error' || cameraStatus === 'idle' ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Simulated Mirror Fallback (when camera is offline or simulated mode is on) */}
        {(isSimulatedMirror || cameraStatus === 'idle') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black pointer-events-auto">
            <div className="relative w-80 h-96 rounded-3xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Interactive Mirror</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Connect your webcam to see your real-time reflection and draw in the air with hand tracking!
              </p>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={onStartCamera}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Start Live Camera
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permission Denied or Error Screen */}
        {(cameraStatus === 'denied' || cameraStatus === 'error') && !isSimulatedMirror && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md pointer-events-auto p-6 z-10">
            <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900/90 border border-red-500/30 text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Camera Access Required</h3>
              <p className="text-sm text-slate-300 mb-4">
                {errorMessage || 'Webcam permission was not granted. Please allow camera access in your browser to use the interactive mirror.'}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onRetry}
                  className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium text-sm flex items-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Access
                </button>
                <button
                  onClick={onToggleSimulatedMirror}
                  className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition cursor-pointer"
                >
                  Draw with Mouse
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner for MediaPipe / Camera initialization */}
        {cameraStatus === 'initializing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 pointer-events-auto">
            <div className="w-12 h-12 rounded-full border-3 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4" />
            <p className="text-sm font-medium text-cyan-300 animate-pulse">
              Starting Live Mirror & AI Hand Tracker...
            </p>
          </div>
        )}
      </div>
    );
  }
);

CameraMirror.displayName = 'CameraMirror';
