import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const ExplorePage = React.lazy(() => import('./pages/ExplorePage'));
const EarthPage = React.lazy(() => import('./pages/EarthPage'));

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold">Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore/:hikeId?/:waypointId?" element={<ExplorePage />} />
          <Route path="/earth" element={<EarthPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
