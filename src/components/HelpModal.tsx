import React from 'react';
import { X, Sparkles, Hand, Move, Pause, Flame, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-cyan-500/40 p-6 text-white shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-lg font-['Outfit']">How to Air Draw on Your Mirror</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          {/* Natural Gestures */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
              Natural Air Gestures
            </h4>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-xs mb-0.5">☝️ Index Pointing: Draw Line</div>
                <p className="text-slate-300 leading-relaxed">
                  Extend your index finger while curling other fingers to draw glowing neon lines directly over your mirrored reflection in real time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                <Hand className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-xs mb-0.5">✋ Open Palm: Move Cursor Freely</div>
                <p className="text-slate-300 leading-relaxed">
                  Open your whole hand to stop drawing. The glowing cursor still tracks your index fingertip without leaving any marks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <Move className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-xs mb-0.5">🤏 Pinch: Grab & Move Creations</div>
                <p className="text-slate-300 leading-relaxed">
                  Touch your thumb and index fingertip together near any drawing or animated sketch to pick it up and place it on your shoulder, back, or head!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Pause className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-xs mb-0.5">✊ Closed Fist: Pause Animations</div>
                <p className="text-slate-300 leading-relaxed">
                  Curl all fingers into a fist to temporarily freeze/pause active animated characters.
                </p>
              </div>
            </div>
          </div>

          {/* Bringing Drawing to Life */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-cyan-500/10 border border-pink-500/30">
            <h4 className="font-bold text-pink-300 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Bringing Drawings to Life
            </h4>
            <p className="text-slate-300 leading-relaxed mb-2">
              Draw wings behind your shoulders, a crown above your head, or a little creature beside your face, then click <b>"BRING MY DRAWING TO LIFE"</b>.
            </p>
            <div className="flex flex-col gap-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>6 Procedural styles: Flapping Wings, Float, Bounce, Orbit, Heartbeat, Companion Pet</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>AI magic auras: Stardust, Rainbow stream, Fire flames, Electric sparks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Mouse fallback: You can also draw and drag directly using your mouse or touchscreen!</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
