import React from 'react';
import { TrendingUp, ArrowRight, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { KPIMetrics } from '../types';
import { 
  TotalHouseholdsLogo,
  CollectedTruckLogo,
  NotCollectedDustbinLogo
} from './icons/KpiLogos';
import { 
  frequentlyNotCollectedIcon, 
  frequentlyNotCollectedFallbackIcon 
} from '../constants/branding';
import { AnimatedCounter } from './AnimatedCounter';

interface KPICardsProps {
  metrics: KPIMetrics;
  onNavigateToLiveTracking?: () => void;
  onNavigateToCollected?: () => void;
  onNavigateToCovered?: () => void;
  onNavigateToNotCovered?: () => void;
  onNavigateToFrequentlyNotCovered?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ 
  metrics, 
  onNavigateToLiveTracking,
  onNavigateToCollected,
  onNavigateToCovered,
  onNavigateToNotCovered,
  onNavigateToFrequentlyNotCovered,
}) => {
  const total = metrics.totalCollectedToday || metrics.totalLocationsCount || 0;
  const coveredPercent = total > 0 ? ((metrics.totalCoveredCount / total) * 100).toFixed(1) : '0%';
  const notCoveredPercent = total > 0 ? ((metrics.totalNotCoveredCount / total) * 100).toFixed(1) : '0%';
  const frequentlyCount = metrics.frequentlyNotCoveredCount ?? 0;
  const frequentlyPercent = total > 0 ? (((frequentlyCount) / total) * 100).toFixed(1) : '0%';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      
      {/* 1. GOOGLE BLUE BACKGROUND: Total Collected / Total Households */}
      <div 
        onClick={onNavigateToCollected || onNavigateToLiveTracking}
        title="Click to view Total Waste Collection Details & GPS Map"
        className="bg-[#1A73E8] hover:bg-[#1765CC] text-white rounded-2xl p-5 border border-blue-400/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full cursor-pointer group relative overflow-hidden select-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/90 bg-white p-1.5 flex-shrink-0 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <TotalHouseholdsLogo className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
              <span className="truncate">Total Households</span>
              <span className="text-[10px] text-white bg-white/20 border border-white/30 px-2 py-0.5 rounded-full font-black flex items-center gap-1 flex-shrink-0 backdrop-blur-xs">
                All
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight my-0.5">
              <AnimatedCounter value={metrics.totalCollectedToday} />
            </div>
            <div className="text-xs font-semibold text-white/90 flex items-center justify-between">
              <div className="flex items-center gap-1 text-blue-100 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
                <span>Registered in ward</span>
              </div>
              <span className="text-[11px] text-white font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Details <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GOOGLE GREEN BACKGROUND: Household Collected */}
      <div 
        onClick={onNavigateToCovered || onNavigateToCollected}
        title="Click to view Total Household Collected Details & Cleared Locations"
        className="bg-[#188038] hover:bg-[#137333] text-white rounded-2xl p-5 border border-emerald-400/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full cursor-pointer group relative overflow-hidden select-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/90 bg-white p-1.5 flex-shrink-0 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <CollectedTruckLogo className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
              <span className="truncate">Collected</span>
              <span className="text-[10px] text-white bg-white/20 border border-white/30 px-2 py-0.5 rounded-full font-black flex items-center gap-1 flex-shrink-0 backdrop-blur-xs">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" /> {typeof coveredPercent === 'string' && coveredPercent.includes('%') ? coveredPercent : `${coveredPercent}%`}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight my-0.5">
              <AnimatedCounter value={metrics.totalCoveredCount} />
            </div>
            <div className="text-xs font-semibold text-white/90 flex items-center justify-between">
              <span className="text-emerald-100 font-medium">Serviced doors</span>
              <span className="text-[11px] text-white font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Collected <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GOOGLE YELLOW / AMBER BACKGROUND: Household Not Collected */}
      <div 
        onClick={onNavigateToNotCovered}
        title="Click to view Total Household Not Collected Reports & Missed Locations"
        className="bg-[#EA8600] hover:bg-[#D97706] text-white rounded-2xl p-5 border border-amber-400/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full cursor-pointer group relative overflow-hidden select-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/90 bg-white p-1.5 flex-shrink-0 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <NotCollectedDustbinLogo className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
              <span className="truncate">Not Collected</span>
              <span className="text-[10px] text-white bg-white/25 border border-white/35 px-2 py-0.5 rounded-full font-black flex items-center gap-1 flex-shrink-0 backdrop-blur-xs">
                <AlertTriangle className="w-2.5 h-2.5 text-white" /> {typeof notCoveredPercent === 'string' && notCoveredPercent.includes('%') ? notCoveredPercent : `${notCoveredPercent}%`}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight my-0.5">
              <AnimatedCounter value={metrics.totalNotCoveredCount} />
            </div>
            <div className="text-xs font-semibold text-white/90 flex items-center justify-between">
              <span className="text-amber-100 font-medium">Requires re-visit</span>
              <span className="text-[11px] text-white font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Reports <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. GOOGLE RED BACKGROUND: Frequently Not Collected Household */}
      <div 
        onClick={onNavigateToFrequentlyNotCovered}
        title="Click to view Frequently Not Collected Household Intelligence"
        className="bg-[#D93025] hover:bg-[#B31412] text-white rounded-2xl p-5 border border-red-400/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full cursor-pointer group relative overflow-hidden select-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/90 bg-white p-1.5 flex-shrink-0 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img
              src={frequentlyNotCollectedIcon}
              alt="Frequently Not Collected Household"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== frequentlyNotCollectedFallbackIcon) {
                  e.currentTarget.src = frequentlyNotCollectedFallbackIcon;
                }
              }}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
              <span className="truncate font-black">Frequently Not Collected Household</span>
              <span className="text-[10px] text-white bg-white/20 border border-white/30 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 flex-shrink-0 backdrop-blur-xs">
                <AlertOctagon className="w-2.5 h-2.5 text-white" /> {typeof frequentlyPercent === 'string' && frequentlyPercent.includes('%') ? frequentlyPercent : `${frequentlyPercent}%`}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight my-0.5 flex items-baseline gap-1.5">
              <AnimatedCounter value={frequentlyCount} />
            </div>
            <div className="text-xs font-semibold text-white/90 flex items-center justify-between">
              <span className="text-red-100 font-medium truncate">Locked & Skipped</span>
              <span className="text-[11px] text-white font-black group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Household View <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};


