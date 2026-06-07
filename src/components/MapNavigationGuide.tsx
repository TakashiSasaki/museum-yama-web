import React from 'react';
import { Move, Layers, RefreshCw, Maximize2 } from 'lucide-react';

export const MapNavigationGuide: React.FC = () => {
  return (
    <div className="w-full text-white">
      {/* Dynamic inline styles for smooth self-contained animations */}
      <style>{`
        @keyframes guide-move {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, 0); }
          50% { transform: translate(30px, 30px); }
          75% { transform: translate(0, 30px); }
        }
        @keyframes guide-tilt {
          0%, 100% { transform: translateY(-20px); }
          50% { transform: translateY(20px); }
        }
        @keyframes guide-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes guide-zoom {
          0%, 100% { transform: scale(0.6); }
          50% { transform: scale(1.3); }
        }
        .animate-guide-move {
          animation: guide-move 6s ease-in-out infinite;
        }
        .animate-guide-tilt {
          animation: guide-tilt 3s ease-in-out infinite;
        }
        .animate-guide-rotate {
          animation: guide-rotate 8s linear infinite;
        }
        .animate-guide-zoom {
          animation: guide-zoom 4s ease-in-out infinite;
        }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
        {/* Card 1: 1. スクロール (移動する) */}
        <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs">
                1
              </span>
              <h3 className="font-bold text-sm sm:text-base text-blue-300">
                スクロール (移動)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300">
              1本の指で画面をなぞると、マップを平行に移動できます。
            </p>
          </div>
          
          {/* Animated Demonstration Canvas */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-zinc-950/80 rounded-lg border border-white/5 relative flex items-center justify-center overflow-hidden flex-shrink-0">
            {/* Screen indicator grids */}
            <div className="absolute inset-2 border border-dashed border-white/10 rounded flex items-center justify-center">
              <Move className="w-8 h-8 text-white/5" />
            </div>
            {/* Hand finger representation */}
            <div className="absolute w-6 h-6 rounded-full bg-blue-500/30 border-2 border-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/40 animate-guide-move">
              <div className="w-2 h-2 rounded-full bg-blue-200" />
            </div>
          </div>
        </div>

        {/* Card 2: 2. チルト (立体的に見る) */}
        <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                2
              </span>
              <h3 className="font-bold text-sm sm:text-base text-emerald-300">
                チルト (傾ける・3D)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300">
              2本の指を並べて同時に上下にスライドすると、カメラの傾斜（3D表示の角度）を調整できます。
            </p>
          </div>

          {/* Animated Demonstration Canvas */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-zinc-950/80 rounded-lg border border-white/5 relative flex items-center justify-center overflow-hidden flex-shrink-0">
            <div className="absolute inset-2 border border-dashed border-white/10 rounded [transform:rotateX(45deg)] flex items-center justify-center">
              <Layers className="w-8 h-8 text-white/5" />
            </div>
            {/* Two fingers in parallel */}
            <div className="absolute flex gap-4 animate-guide-tilt">
              <div className="w-5 h-5 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: 3. 回転 (ぐるっと回す) */}
        <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">
                3
              </span>
              <h3 className="font-bold text-sm sm:text-base text-amber-300">
                回転 (方位を変える)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300">
              2本の指を置いたまま円を描くようにひねると、マップを回転して方向を変えられます。
            </p>
          </div>

          {/* Animated Demonstration Canvas */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-zinc-950/80 rounded-lg border border-white/5 relative flex items-center justify-center overflow-hidden flex-shrink-0">
            {/* Circular dashed route outline */}
            <div className="absolute w-16 h-16 border border-dashed border-white/15 rounded-full animate-spin-slow flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white/5" />
            </div>
            {/* Two rotating fingers */}
            <div className="absolute w-20 h-20 origin-center animate-guide-rotate">
              <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: 4. ズーム (近づく・はなれる) */}
        <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs">
                4
              </span>
              <h3 className="font-bold text-sm sm:text-base text-rose-300">
                ズーム (拡大・縮小)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300">
              2本の指の距離を広げたり（ピンチアウト）縮めたり（ピンチイン）して拡大縮小します。
            </p>
          </div>

          {/* Animated Demonstration Canvas */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-zinc-950/80 rounded-lg border border-white/5 relative flex items-center justify-center overflow-hidden flex-shrink-0">
            <div className="absolute inset-2 border border-dashed border-white/10 rounded flex items-center justify-center">
              <Maximize2 className="w-8 h-8 text-white/5" />
            </div>
            {/* Zoom fingers pinch/spread */}
            <div className="absolute w-12 h-12 flex items-center justify-center animate-guide-zoom">
              <div className="absolute top-0 left-0 w-5 h-5 rounded-full bg-rose-500/30 border-2 border-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-200" />
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-rose-500/30 border-2 border-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
