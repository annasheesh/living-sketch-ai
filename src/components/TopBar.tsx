import React from 'react';
import { HelpCircle, Sliders, Layers, Camera } from 'lucide-react';

interface TopBarProps {
  cameraStatus: string;
  isMirrored: boolean;
  onOpenHelp: () => void;
  onOpenSettings?: () => void;
  livingEntitiesCount?: number;
  onOpenCreations?: () => void;
  onTakeScreenshot?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  cameraStatus,
  isMirrored,
  onOpenHelp,
  onOpenSettings,
  livingEntitiesCount = 0,
  onOpenCreations,
  onTakeScreenshot
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
      {/* Live Mirror Status Tag */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 text-xs font-semibold shadow-lg">
        <div
          className={`w-2 h-2 rounded-full ${
            cameraStatus === 'tracking'
              ? 'bg-emerald-400 animate-pulse'
              : cameraStatus === 'initializing'
              ? 'bg-amber-400 animate-ping'
              : 'bg-slate-500'
          }`}
        />
        <span className="text-slate-200 uppercase tracking-wider text-[11px] font-['Outfit']">
          {cameraStatus === 'tracking' ? 'Live Mirror Active' : cameraStatus}
        </span>
        {isMirrored && (
          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
            Mirrored
          </span>
        )}
      </div>

      {/* Living Creations count badge if any */}
      {livingEntitiesCount > 0 && onOpenCreations && (
        <button
          onClick={onOpenCreations}
          title="Living Creations"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-950/80 backdrop-blur-xl border border-indigo-500/40 text-indigo-300 hover:text-white transition cursor-pointer shadow-lg text-xs font-semibold"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{livingEntitiesCount}</span>
        </button>
      )}

      {/* Screenshot / Snapshot icon */}
      {onTakeScreenshot && (
        <button
          onClick={onTakeScreenshot}
          title="Take Snapshot (S)"
          className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer shadow-lg"
        >
          <Camera className="w-4 h-4" />
        </button>
      )}

      {/* Settings Modal */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer shadow-lg"
        >
          <Sliders className="w-4 h-4" />
        </button>
      )}

      {/* Help & Guide Button */}
      <button
        onClick={onOpenHelp}
        title="Gesture & Mirror Guide"
        className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer shadow-lg"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </div>
  );
};
