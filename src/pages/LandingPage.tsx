import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Mountain, Map as MapIcon, ArrowRight, Landmark, ExternalLink } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("/hero-bg.jpg")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="max-w-3xl mx-auto flex flex-col items-center"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
            className="mb-8 p-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10"
          >
            <Mountain className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
          </motion.div>

          <p className="text-emerald-400 font-sans tracking-[0.2em] text-sm md:text-base uppercase mb-4">
            愛媛大学ミュージアム 特別企画展
          </p>

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-tight drop-shadow-lg">
            えひめの山
          </h1>
          
          <div className="w-24 h-px bg-white/30 mb-8"></div>

          <p className="font-serif text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mb-12 drop-shadow">
            四国山地の険しい峰々から、瀬戸内に面した穏やかな里山まで。<br className="hidden md:inline" />
            愛媛の隆起と浸食が織りなす地形の魅力を登山記録とともに紐解く。
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/explore')}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium tracking-wider overflow-hidden transition-colors"
          >
            <span className="relative z-10 flex items-center gap-2">
              <MapIcon className="w-5 h-5" />
              展示マップを探索する
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.button>

          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            href="https://portal.museum.ehime-u.ac.jp/"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 inline-flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white transition-colors py-2 px-5 rounded-full border border-gray-600 hover:border-gray-400 bg-white/5 backdrop-blur-sm"
          >
            <Landmark className="w-4 h-4 text-emerald-400" />
            ミュージアム ポータルサイトへ
            <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
          </motion.a>
        </motion.div>
      </div>

      {/* Footer / Credits */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="relative z-10 py-6 text-center text-gray-500 text-sm font-sans"
      >
        <p>&copy; {new Date().getFullYear()} Ehime University Museum. All Rights Reserved.</p>
        <p className="mt-1 text-xs">Exhibition Companion App</p>
      </motion.div>
    </div>
  );
}
