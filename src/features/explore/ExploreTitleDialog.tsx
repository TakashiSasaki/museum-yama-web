import React from 'react';
import { Home, Landmark, ExternalLink, X } from 'lucide-react';
import yamaIcon from '../../assets/yama_icon.svg';

interface ExploreTitleDialogProps {
  isTitleDialogOpen: boolean;
  setIsTitleDialogOpen: (open: boolean) => void;
  navigateHome: () => void;
}

export const ExploreTitleDialog = React.memo(({
  isTitleDialogOpen,
  setIsTitleDialogOpen,
  navigateHome
}: ExploreTitleDialogProps) => {
  if (!isTitleDialogOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsTitleDialogOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <img src={yamaIcon} alt="Icon" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
            えひめの山
          </h2>
          <button 
            onClick={() => setIsTitleDialogOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        <button
          onClick={() => {
            setIsTitleDialogOpen(false);
            navigateHome();
          }}
          className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
        >
          <Home size={18} />
          オープニングに戻る
        </button>

        <a
          href="https://portal.museum.ehime-u.ac.jp/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setIsTitleDialogOpen(false)}
          className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
        >
          <Landmark size={18} className="text-emerald-600" />
          ポータルを開く
          <ExternalLink size={14} className="ml-1 text-gray-400" />
        </a>
      </div>
    </div>
  );
});
ExploreTitleDialog.displayName = 'ExploreTitleDialog';
