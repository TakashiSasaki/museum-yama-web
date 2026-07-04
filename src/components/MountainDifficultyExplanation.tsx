import React from 'react';
import { X, ShieldAlert, Footprints, Flame, Info, Compass } from 'lucide-react';

const YamapIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M 50 15 L 85 85 L 50 85 L 50 45 L 30 85 L 15 85 Z" 
      stroke="currentColor" 
      strokeWidth="8" 
      strokeLinejoin="round"
    />
  </svg>
);

interface Mountain {
  No: number;
  山名: string;
  標高: string;
  難易度ランク: number;
  市町村?: string;
  エントリーコースお勧め山?: boolean | null;
  YAMAPアクティビティID?: string | number;
}

interface MountainDifficultyExplanationProps {
  mountain: Mountain;
  onClose: () => void;
  isDrawerVisible: boolean;
}

// Map difficulty rank 1-5 to localized specifications
const DIFFICULTY_METADATA = {
  1: {
    level: 'レベル1: 非常にやさしい（入門）',
    guideline: '整備された平坦な遊歩道やなだらかな傾斜を歩くコースです。普段着や軽装でも楽しめるお散歩ファミリー向け。',
    gear: '歩きやすいスニーカーで十分に楽しめますが、水分補給は忘れずに。',
    bg: 'from-violet-500/10 to-violet-500/2 border-violet-500/30',
    accentColor: '#8b5cf6',
    textColor: 'text-violet-400',
    stars: '★☆☆☆☆',
  },
  2: {
    level: 'レベル2: やさしい（初級・ハイキング）',
    guideline: '登山道に多少の傾斜や不整地（土や砂利の道）を含みます。日帰りで気軽に楽しめる定番のハイキングコース。',
    gear: '厚手の靴底スニーカーや、ローカットのトレッキングシューズが推奨。',
    bg: 'from-blue-500/10 to-blue-500/2 border-blue-500/30',
    accentColor: '#3b82f6',
    textColor: 'text-blue-400',
    stars: '★★☆☆☆',
  },
  3: {
    level: 'レベル3: 普通（中級・本格登山）',
    guideline: '本格的な登山道。連続した登り下り、木の根や滑りやすい粘土、一部に簡単な岩場があり、一定の体力が必要です。',
    gear: 'しっかり足をホールドするトレッキングシューズ、登山靴、雨具、携帯用リュックが必須です。',
    bg: 'from-emerald-500/10 to-emerald-500/2 border-emerald-500/30',
    accentColor: '#10b981',
    textColor: 'text-emerald-400',
    stars: '★★★☆☆',
  },
  4: {
    level: 'レベル4: やや難しい（上級・急登岩場）',
    guideline: '傾斜の急な登走路、鎖場、梯子、足場が不安定な岩稜帯などを含み、適切な経験と体力が必須となる本格コース。',
    gear: '本格登山靴、手袋（グローブ）、万一のためのヘルメットやヘッドランプの携帯を強く推奨します。',
    bg: 'from-orange-500/10 to-orange-500/2 border-orange-500/30',
    accentColor: '#f97316',
    textColor: 'text-orange-400',
    stars: '★★★★☆',
  },
  5: {
    level: 'レベル5: 非常に難しい（熟達向け）',
    guideline: '急峻な断崖、狭い岩の尾根、道迷いの危険、厳しい標高差など危険箇所が連続します。高い読図力と体力が要求されます。',
    gear: '万全の登山・安全救助装備に加え、単独行を避けエキスパートと同行、またはガイド同伴を強くお勧めします。',
    bg: 'from-red-500/10 to-red-500/2 border-red-500/30',
    accentColor: '#ef4444',
    textColor: 'text-red-400',
    stars: '★★★★★',
  },
};

export const MountainDifficultyExplanation: React.FC<MountainDifficultyExplanationProps> = ({
  mountain,
  onClose,
  isDrawerVisible,
}) => {
  const rank = (mountain.難易度ランク >= 1 && mountain.難易度ランク <= 5)
    ? (mountain.難易度ランク as 1 | 2 | 3 | 4 | 5)
    : 2; // default fallback

  const meta = DIFFICULTY_METADATA[rank];

  return (
    <div
      id="mountain-difficulty-popup"
      className={`fixed z-50 pointer-events-auto transition-all duration-300 max-w-sm md:max-w-md w-[calc(100%-2rem)] mx-4 sm:mx-0 ${
        isDrawerVisible
          ? 'bottom-[33vh] sm:bottom-[26vh] md:bottom-[27vh] lg:bottom-[31vh]'
          : 'bottom-6'
      } right-4 sm:right-6 md:right-8 lg:right-10 animate-fade-in`}
    >
      {/* Inline styles for the timer bar shrinking animation */}
      <style>{`
        @keyframes shrink-timer {
          100% { width: 0%; }
        }
        .animate-timer-shrink {
          animation: shrink-timer 30s linear forwards;
        }
      `}</style>

      <div className="relative bg-zinc-950/90 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-[0_20px_40px_-5px_rgba(0,0,0,0.8)]">
        
        {/* Top Header Grid Accent Bar */}
        <div className="w-full h-1" style={{ backgroundColor: meta.accentColor }} />

        <div className="p-4 md:p-5 flex flex-col gap-3 text-white">
          {/* Header Area */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">
                {mountain.市町村 || '愛媛県'}
              </span>
              <h2 className="text-xl font-extrabold text-white flex items-baseline gap-1.5 truncate mt-0.5">
                <span>{mountain.山名}</span>
                <span className="text-[12px] text-gray-200 font-medium font-mono">{mountain.標高}m</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {mountain.YAMAPアクティビティID && (
                <a
                  href={`https://yamap.com/activities/${mountain.YAMAPアクティビティID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#E60012]/20 hover:bg-[#E60012]/30 text-[#E60012] transition-colors p-1.5 rounded-full flex items-center justify-center"
                  title="YAMAPで開く"
                >
                  <YamapIcon className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-full cursor-pointer"
                title="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Difficulty Rank Banner */}
          <div className={`p-3 rounded-xl border bg-gradient-to-r flex flex-col gap-1 ${meta.bg}`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-black tracking-wide ${meta.textColor}`}>
                {meta.level}
              </span>
              <span className="text-[10px] font-mono tracking-wider text-amber-400 font-bold">
                {meta.stars}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[8.5px] uppercase font-bold tracking-widest text-gray-200">
              <Flame className="w-3.5 h-3.5 fill-current flex-shrink-0" style={{ color: meta.accentColor }} />
              <span>Ehime Peak Grade classification</span>
            </div>
          </div>

          {/* Guidelines Section */}
          <div className="flex flex-col gap-2.5 mt-1 border-t border-white/10 pt-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-white/10 flex-shrink-0 text-gray-200 mt-0.5">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-gray-300 font-extrabold block">ルートの特徴</span>
                <p className="text-xs text-gray-100 mt-0.5 leading-relaxed">
                  {meta.guideline}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-white/10 flex-shrink-0 text-gray-200 mt-0.5">
                <Footprints className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-gray-300 font-extrabold block">推奨される装備・足元</span>
                <p className="text-xs text-gray-100 mt-0.5 leading-relaxed">
                  {meta.gear}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic real-time closure visual indicator */}
          <div className="mt-2 flex items-center justify-between text-[9px] text-gray-400 font-medium font-mono border-t border-white/10 pt-2.5 leading-none">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-gray-400" />
              <span>選択から30秒後に自動で非表示</span>
            </span>
            <span>AUTO CLOSE TIME</span>
          </div>

        </div>

        {/* 30 Second progress bar */}
        <div className="w-full bg-white/5 h-1 relative overflow-hidden">
          <div 
            className="h-full bg-emerald-500/80 animate-timer-shrink" 
            style={{ width: '100%', borderBottomRightRadius: '9999px', borderTopRightRadius: '9999px' }} 
          />
        </div>

      </div>
    </div>
  );
};
