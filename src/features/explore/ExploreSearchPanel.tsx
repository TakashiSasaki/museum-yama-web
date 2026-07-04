import React from 'react';
import { Search, Heart, Navigation, X } from 'lucide-react';
import { getDifficultyColor } from './exploreUtils';
import { MountainRecord } from '../../lib/mountainData';
import { logPerformanceMetrics } from './performanceDebug';

interface ExploreSearchPanelProps {
  isSearchDialogOpen: boolean;
  setIsSearchDialogOpen: (open: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedMunicipality: string | null;
  onMunicipalityChange: (muni: string | null) => void;
  filterRecommended: boolean;
  onRecommendedToggle: (recommended: boolean) => void;
  onResetFilters: () => void;
  handleLocateCurrentPosition: () => void;
  isLocating: boolean;
  sortBy: 'none' | 'distance';
  uniqueMunicipalities: string[];
  muniCounts: Record<string, number>;
  filteredMountains: MountainRecord[];
  selectedMountainNo: number | null;
  handleSelectMountain: (no: number) => void;
}

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

const MountainListItem = React.memo(({ 
  mountain, 
  isSelected, 
  onSelect 
}: { 
  mountain: MountainRecord; 
  isSelected: boolean; 
  onSelect: (no: number) => void;
}) => {
  const color = getDifficultyColor(mountain.難易度ランク);
  
  return (
    <div
      onClick={() => onSelect(mountain.No)}
      style={{ borderLeftColor: color, borderLeftWidth: '5px' }}
      className={`p-2 rounded-xl cursor-pointer transition-all border flex items-center justify-between gap-2 ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm transform scale-[1.01]'
          : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50/30'
      }`}
    >
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-bold text-gray-400 tracking-wider truncate">
            {mountain.市町村 || '愛媛県'}
          </span>
          {mountain.エントリーコースお勧め山 === true && (
            <span className="text-[8px] bg-rose-500/10 text-rose-500 border border-rose-500/10 font-bold px-1 rounded flex items-center gap-0.5 leading-none py-0.5">
              <Heart className="w-2.5 h-2.5 fill-current" />
              <span>お勧め</span>
            </span>
          )}
          <span className="text-[10px] font-mono text-gray-400 font-medium ml-0.5">{mountain.標高}m</span>
        </div>
        <h3 className="font-bold text-gray-800 leading-snug flex items-center gap-1.5 min-w-0 mt-0.5">
          <span className="text-sm truncate block">{mountain.山名}</span>
        </h3>
      </div>
      
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ color: color, backgroundColor: `${color}15` }}>
          難易度.{mountain.難易度ランク}
        </span>
        {mountain.YAMAPアクティビティID && (
          <a
            href={`https://yamap.com/activities/${mountain.YAMAPアクティビティID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#E60012]/10 hover:bg-[#E60012]/20 text-[#E60012] transition-colors px-1.5 py-0.5 rounded-full flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
            title="YAMAPで開く"
          >
            <YamapIcon className="w-3 h-3" />
            <span className="text-[8px] font-bold tracking-wider">YAMAP</span>
          </a>
        )}
      </div>
    </div>
  );
});
MountainListItem.displayName = 'MountainListItem';

export const ExploreSearchPanel = React.memo(({
  isSearchDialogOpen,
  setIsSearchDialogOpen,
  searchQuery,
  onSearchQueryChange,
  selectedMunicipality,
  onMunicipalityChange,
  filterRecommended,
  onRecommendedToggle,
  onResetFilters,
  handleLocateCurrentPosition,
  isLocating,
  sortBy,
  uniqueMunicipalities,
  muniCounts,
  filteredMountains,
  selectedMountainNo,
  handleSelectMountain
}: ExploreSearchPanelProps) => {
  const getInitialLimit = () => typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 80;
  const [renderLimit, setRenderLimit] = React.useState(getInitialLimit);

  // Reset limit when filters change
  React.useEffect(() => {
    setRenderLimit(getInitialLimit());
  }, [searchQuery, selectedMunicipality, filterRecommended, sortBy]);

  const renderedMountains = React.useMemo(() => {
    // Make sure we include the selected mountain if it's beyond the limit
    const limited = filteredMountains.slice(0, renderLimit);
    if (selectedMountainNo) {
      const selectedIndex = filteredMountains.findIndex(m => m.No === selectedMountainNo);
      if (selectedIndex >= renderLimit) {
        // Just append the selected mountain if it's cut off
        limited.push(filteredMountains[selectedIndex]);
      }
    }
    logPerformanceMetrics('ExploreSearchPanel', {
      filteredCount: filteredMountains.length,
      renderedListCount: limited.length,
      renderLimit
    });
    return limited;
  }, [filteredMountains, renderLimit, selectedMountainNo]);
  return (
    <div className={`
      md:flex md:w-96 md:bg-white md:border-r md:border-gray-200 md:flex-col md:transition-all md:duration-300 md:z-10 md:h-full
      ${isSearchDialogOpen 
        ? 'fixed inset-x-4 top-20 bottom-8 z-[100] bg-white/85 backdrop-blur-md flex flex-col rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 overflow-hidden border border-white/50' 
        : 'hidden'
      }
    `}>
      {/* Header for Mobile Dialog */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200/50 flex-shrink-0">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-600" />
          山を探す
        </h2>
        <button 
          onClick={() => setIsSearchDialogOpen(false)}
          className="p-1.5 text-gray-500 hover:text-gray-700 bg-black/5 hover:bg-black/10 transition-colors rounded-full"
        >
          <X size={20} />
        </button>
      </div>
      {/* Search and Filters Header */}
      <div className="p-4 border-b border-gray-200/50 space-y-3 flex-shrink-0 shadow-xs md:bg-white">
        {/* Search input with search icon */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="山名・キーワードで検索..."
            className="w-full text-xs pl-8 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-0.5"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* Municipality and Recommended filtering */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedMunicipality || ''}
            onChange={(e) => onMunicipalityChange(e.target.value || null)}
            className="text-[11px] py-2 px-2 border border-gray-200 rounded-xl font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50/50 outline-none"
          >
            <option value="">すべての市町村・島</option>
            {uniqueMunicipalities.map((muni) => (
              <option key={muni} value={muni}>
                {muni} ({muniCounts[muni] || 0})
              </option>
            ))}
          </select>
          <button
            onClick={() => onRecommendedToggle(!filterRecommended)}
            className={`py-2 px-2 border rounded-xl flex items-center justify-center gap-1 transition-all text-[11px] font-bold ${
              filterRecommended
                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Heart className={`w-3 h-3 ${filterRecommended ? 'fill-white' : ''}`} />
            <span>お勧めのみ</span>
          </button>
        </div>

        <button
          onClick={handleLocateCurrentPosition}
          disabled={isLocating}
          className={`w-full py-2 px-2 border rounded-xl flex items-center justify-center gap-1 transition-all text-[11px] font-bold ${
            sortBy === 'distance'
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          } disabled:opacity-50`}
        >
          <Navigation className={`w-3 h-3 ${isLocating ? 'animate-pulse' : ''}`} />
          <span>{sortBy === 'distance' ? '現在地順' : '現在地から探す'}</span>
        </button>
      </div>

      {/* Mountains Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 grid grid-cols-2 md:grid-cols-1 gap-2 content-start no-scrollbar">
        {filteredMountains.length === 0 ? (
          <div className="text-center py-12 text-gray-400 space-y-2 col-span-2 md:col-span-1">
            <p className="text-xs">該当する山が見つかりませんでした。</p>
            <button
              onClick={onResetFilters}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              フィルターをリセット
            </button>
          </div>
        ) : (
          <>
            {renderedMountains.map((mountain) => (
              <MountainListItem
                key={mountain.No}
                mountain={mountain}
                isSelected={selectedMountainNo === mountain.No}
                onSelect={handleSelectMountain}
              />
            ))}
            {filteredMountains.length > renderLimit && (
              <div className="col-span-2 md:col-span-1 p-2 flex justify-center">
                <button
                  onClick={() => setRenderLimit(prev => prev + getInitialLimit())}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-full hover:bg-gray-200 transition-colors w-full"
                >
                  さらに表示
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
ExploreSearchPanel.displayName = 'ExploreSearchPanel';
