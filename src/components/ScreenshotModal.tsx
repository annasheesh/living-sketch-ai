import React from 'react';
import { X, Download, Share2, Sparkles } from 'lucide-react';

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  isOpen,
  onClose,
  imageUrl
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `living-sketch-mirror-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md pointer-events-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900/95 border border-cyan-500/40 p-6 text-white shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-lg font-['Outfit']">Snapshot Captured!</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-black flex items-center justify-center mb-4">
          <img
            src={imageUrl}
            alt="Living Sketch Mirror Snapshot"
            className="w-full h-auto max-h-[60vh] object-contain rounded-xl"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Exported at full screen resolution with live reflection & sketches
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
