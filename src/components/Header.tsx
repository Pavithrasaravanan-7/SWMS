import React, { useState, useEffect } from 'react';
import { ChevronDown, Bell, Navigation, Menu, X, LogOut, Truck, ShieldCheck, Sparkles, Globe, RefreshCw, UserCheck, User } from 'lucide-react';
import { 
  cmPhoto, 
  cmFallbackPhoto, 
  ccmcLogo, 
  ccmcFallbackLogo
} from '../constants/branding';
import { ICCCLiveBadge } from './ICCCLiveBadge';
import { MunicipalAlert } from '../types';

interface HeaderProps {
  liveConnection: boolean;
  onToggleLiveConnection: () => void;
  alerts?: MunicipalAlert[];
  onOpenAlerts?: () => void;
  onNavigateToLiveTracking?: (zone?: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
  onSwitchRole?: () => void;
  userRole?: 'admin' | 'worker';
  userName?: string;
  userDesignation?: string;
  lang?: 'en' | 'ta';
  onSetLang?: (l: 'en' | 'ta') => void;
  onOpenLangModal?: () => void;
  onOpenAiModal?: () => void;
  onRefreshData?: () => void;
  hideRightControls?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  liveConnection,
  onToggleLiveConnection,
  alerts = [],
  onOpenAlerts,
  onNavigateToLiveTracking,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  onLogout,
  onSwitchRole,
  userRole = 'admin',
  userName = userRole === 'admin' ? 'Administrative Directorate' : 'Karthik Muthusamy',
  userDesignation = userRole === 'admin' ? 'Admin Officer, CCMC' : 'Sanitary Inspector (SI) • Ward 12',
  lang = 'en',
  onSetLang,
  onOpenLangModal,
  onOpenAiModal,
  onRefreshData,
  hideRightControls = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAlertsDropdownOpen, setIsAlertsDropdownOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);

  const unreadAlerts = alerts.filter((a) => !a.isRead && !a.isResolved);
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.isResolved).length;

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const day = now.getDate();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[now.getDay()];

      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;

      setCurrentTime(`${day} ${month} ${year} • ${dayOfWeek} ${hours}:${minutes} ${ampm}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full select-none text-white shadow-md sticky top-0 z-50">
      {/* Top Main Green Bar - Exact Login Green #1E7A38 */}
      <div className="bg-[#1E7A38] px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-4 border-b border-[#166534] min-h-[52px] sm:min-h-[64px]">
        {/* Left Side: Mobile Menu Toggle + CM Portrait & CCMC Emblem Duo + Municipal Titles */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          
          {/* Mobile Menu Hamburger Button (if applicable) */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-[#166534] hover:bg-[#113B22] text-emerald-100 border border-emerald-400/30 transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              aria-label="Toggle Navigation Drawer"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}

          {/* Unified Government Brand Insignia: CM Portrait + CCMC Emblem */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Hon'ble Chief Minister of Tamil Nadu */}
            <div 
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-500/20 shadow-sm relative flex-shrink-0 flex items-center justify-center" 
              title="Hon'ble Chief Minister of Tamil Nadu"
            >
              <img
                src={cmPhoto}
                alt="Hon'ble Chief Minister of Tamil Nadu"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== cmFallbackPhoto) {
                    e.currentTarget.src = cmFallbackPhoto;
                  }
                }}
                className="w-full h-full object-cover object-top scale-110"
              />
            </div>

            {/* Coimbatore City Emblem / CCMC Logo */}
            <div 
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-sm relative flex-shrink-0 flex items-center justify-center" 
              title="Coimbatore City Municipal Corporation Emblem"
            >
              <img
                src={ccmcLogo}
                alt="Coimbatore City Municipal Corporation Logo"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== ccmcFallbackLogo) {
                    e.currentTarget.src = ccmcFallbackLogo;
                  }
                }}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Municipal Title - Clean, Responsive Two-Tier Layout */}
          <div className="min-w-0 flex flex-col justify-center">
            {/* Mobile View: Compact, High-Legibility (< sm) */}
            <div className="sm:hidden flex flex-col justify-center leading-none">
              <div className="text-[12px] font-black tracking-tight text-white truncate leading-tight drop-shadow-xs">
                {lang === 'ta' ? 'கோவை மாநகராட்சி' : 'Coimbatore CCMC'}
              </div>
              <div className="text-[9.5px] font-bold text-amber-300 tracking-wide uppercase truncate leading-tight mt-0.5">
                {userRole === 'admin' 
                  ? (lang === 'ta' ? 'ஆணையர் நிர்வாகம்' : 'Commissioner Review') 
                  : (lang === 'ta' ? 'களப் பணியாளர்' : 'Field Worker')}
              </div>
            </div>

            {/* Tablet & Desktop View: Full Crisp Government Format (>= sm) */}
            <div className="hidden sm:flex sm:flex-col sm:justify-center leading-tight">
              <div className="text-sm lg:text-base font-black tracking-tight text-white whitespace-nowrap drop-shadow-xs">
                Coimbatore City
              </div>
              <div className="text-xs lg:text-[14px] font-black tracking-tight text-amber-300 whitespace-nowrap drop-shadow-xs">
                Municipal Corporation
              </div>
              <div className="text-[10px] lg:text-xs font-black tracking-wider text-cyan-300 uppercase whitespace-nowrap drop-shadow-xs mt-0.5">
                {userRole === 'admin' ? (
                  <span>COMMISSIONER'S REVIEW</span>
                ) : (
                  <span>SANITARY FIELD WORKER</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Notification Bell + User Profile + Language + Logout */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">

          {userRole === 'admin' && (
            <>
              {/* Notifications Bell Dropdown */}
              <div className="relative block">
                <button
                  onClick={() => setIsAlertsDropdownOpen(!isAlertsDropdownOpen)}
                  className="relative p-1.5 sm:p-2.5 rounded-full bg-[#166534] hover:bg-[#113B22] text-emerald-100 border border-emerald-400/30 transition-all shadow-xs cursor-pointer flex items-center justify-center"
                  title="Operational Alerts & Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
                  {unreadAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4">
                      {criticalCount > 0 && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 text-[9px] sm:text-[10px] font-black items-center justify-center text-white ${
                          criticalCount > 0 ? 'bg-rose-600' : 'bg-amber-500'
                        }`}
                      >
                        {unreadAlerts.length}
                      </span>
                    </span>
                  )}
                </button>

                {/* Notification Flyout Menu */}
                {isAlertsDropdownOpen && (
                  <div className="absolute right-0 top-auto mt-2 w-80 sm:w-96 max-w-[calc(100vw-20px)] bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 bg-[#1E7A38] text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-200" />
                        <span className="text-xs font-bold uppercase tracking-wider">Live Municipal Alerts</span>
                      </div>
                      <span className="bg-[#166534] text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadAlerts.length} active
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {alerts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          {lang === 'ta' ? 'செயல்பாட்டு எச்சரிக்கைகள் எதுவும் இல்லை.' : 'No active operational alerts.'}
                        </div>
                      ) : (
                        alerts.slice(0, 5).map((alert) => (
                          <div
                            key={alert.id}
                            className={`p-3 text-left transition-colors hover:bg-slate-50 flex items-start gap-2.5 ${
                              !alert.isRead ? 'bg-amber-50/20' : ''
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {alert.severity === 'critical' ? (
                                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                              ) : alert.severity === 'warning' ? (
                                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-slate-900 line-clamp-1">{alert.title}</span>
                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{alert.timeAgo}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">{alert.message}</p>
                              <div className="flex items-center justify-between mt-1.5 text-[10px] text-emerald-800 font-bold">
                                <span className="bg-slate-100 px-1.5 py-0.2 rounded-md text-slate-700">{alert.zone} • {alert.ward}</span>
                                {onNavigateToLiveTracking && (
                                  <button
                                    onClick={() => {
                                      setIsAlertsDropdownOpen(false);
                                      onNavigateToLiveTracking(alert.zone);
                                    }}
                                    className="text-[#1E7A38] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                                  >
                                    <Navigation className="w-2.5 h-2.5" />
                                    <span>Track</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {onOpenAlerts && (
                      <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                        <button
                          onClick={() => {
                            setIsAlertsDropdownOpen(false);
                            onOpenAlerts();
                          }}
                          className="text-xs font-bold text-[#1E7A38] hover:text-[#166534] w-full py-1"
                        >
                          View All Live Alerts in Dashboard Panel →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ICCC Live Connection Badge with blinking effect and interactive telemetry - Desktop Only */}
              <div className="hidden md:flex items-center">
                <ICCCLiveBadge lang={lang} />
              </div>
            </>
          )}

          {/* User Profile Console / "S" Logo Pill with Dropdown (Worker view only if applicable) */}
          {userRole !== 'admin' && (
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 bg-[#166534] hover:bg-[#113B22] border border-emerald-400/40 rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 shadow-sm transition cursor-pointer"
                title={`${userName} Account & Menu`}
              >
                {/* Official SWMS Logo Badge */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-white shadow-xs flex items-center justify-center border border-emerald-200 flex-shrink-0 overflow-hidden p-0.5" title="Swachh Bharat SWMS Portal">
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9Yi9x2fIRfFWOX4bKywfFVpp7-ZnDqGUpXdxKwQ0g15y5DQlyWabP8PI&s=10"
                      alt="SWMS"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xs"
                    />
                  </div>
                  <div className="text-left pr-1 hidden md:block max-w-[120px] sm:max-w-none">
                    <div className="text-xs font-bold text-white leading-tight truncate">
                      {userName}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-200 tracking-wider flex items-center gap-1">
                      <span>{lang === 'ta' ? 'களப் பணியாளர்' : 'FIELD WORKER'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-emerald-200 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-gray-800">
                  <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 rounded-t-2xl">
                    <p className="text-xs font-black text-gray-900">{userName}</p>
                    <p className="text-[10px] text-[#1E7A38] font-bold uppercase tracking-wider mt-0.5">{userDesignation}</p>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {/* Language Selector */}
                    {onSetLang && (
                      <div className="px-3 py-2 text-xs border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-bold flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-[#1E7A38]" />
                            <span>Language:</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onSetLang('en')}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                lang === 'en' ? 'bg-[#1E7A38] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              EN
                            </button>
                            <button
                              onClick={() => onSetLang('ta')}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                lang === 'ta' ? 'bg-[#1E7A38] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              தமிழ்
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Ward Audit */}
                    {onOpenAiModal && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onOpenAiModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#1E7A38] hover:bg-emerald-50 rounded-xl transition text-left cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#1E7A38]" />
                        <span>{lang === 'ta' ? 'AI தணிக்கை மற்றும் உதவி' : 'Gemini AI Ward Audit'}</span>
                      </button>
                    )}

                    {/* Refresh Data */}
                    {onRefreshData && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onRefreshData();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#1E7A38] hover:bg-emerald-50 rounded-xl transition text-left cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-[#1E7A38]" />
                        <span>{lang === 'ta' ? 'சர்வர் தரவை புதுப்பி' : 'Sync Live SWMS Data'}</span>
                      </button>
                    )}

                    {/* Switch Role Option */}
                    {onSwitchRole && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onSwitchRole();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#1E7A38] hover:bg-emerald-50 rounded-xl transition text-left cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Switch to Admin / Commissioner</span>
                      </button>
                    )}

                    {/* Logout */}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left cursor-pointer border-t border-gray-100"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Log Out of Console</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language Switcher */}
          {onSetLang && (
            <>
              {/* Mobile Single Toggle Pill (< sm) */}
              <button
                type="button"
                onClick={() => onSetLang(lang === 'en' ? 'ta' : 'en')}
                className="sm:hidden px-2 py-1 rounded-full text-[10px] font-black bg-[#113B22] border border-emerald-400/40 text-amber-300 hover:text-white flex items-center gap-1 shadow-xs flex-shrink-0 cursor-pointer active:scale-95"
                title={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}
              >
                <Globe className="w-3 h-3 text-emerald-300" />
                <span>{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
              </button>

              {/* Desktop / Tablet Segmented Pill (>= sm) */}
              <div className="hidden sm:flex bg-[#113B22] border border-emerald-500/40 rounded-full p-0.5 items-center shadow-xs flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onSetLang('ta')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                    lang === 'ta'
                      ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                  }`}
                  title="தமிழ் மொழியைத் தேர்வு செய்"
                >
                  <Globe className={`w-3 h-3 ${lang === 'ta' ? 'text-slate-950' : 'text-emerald-300'}`} />
                  <span>தமிழ்</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetLang('en')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                  }`}
                  title="Select English Language"
                >
                  <span>English</span>
                </button>
              </div>
            </>
          )}

          {/* Direct Header Logout Button */}
          {onLogout && (
            <>
              {/* Mobile Compact Icon Button (< sm) */}
              <button
                onClick={onLogout}
                className="sm:hidden p-1.5 rounded-full bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white shadow-md border border-rose-400/50 cursor-pointer active:scale-95 flex-shrink-0 flex items-center justify-center"
                title="Logout Portal / வெளியேறு"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>

              {/* Desktop / Tablet Full Button (>= sm) */}
              <button
                onClick={onLogout}
                className="hidden sm:flex items-center gap-1 bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white font-bold px-3 py-1.5 rounded-full text-xs transition-all shadow-md border border-rose-400/50 cursor-pointer active:scale-95 flex-shrink-0"
                title="Logout Portal / வெளியேறு"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="font-bold">{lang === 'ta' ? 'வெளியேறு' : 'Logout'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dark Secondary Ticker/Stream Status Bar - Hidden on mobile & tablet view (< lg), visible only on large desktop */}
      <div className="hidden lg:flex bg-[#113B22] px-2.5 py-1.5 sm:px-6 sm:py-1.5 items-center justify-between text-[9px] sm:text-xs text-emerald-100/90 font-medium border-t border-[#166534] overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center gap-1 bg-[#0A2E17] border border-emerald-400/50 rounded-full px-2 py-0.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span className="text-amber-300 font-black text-[9px] sm:text-[10px] whitespace-nowrap">
              {userRole === 'admin' 
                ? (lang === 'ta' ? 'நிர்வாக அதிகாரி' : 'Admin Officer') 
                : (lang === 'ta' ? 'கள அதிகாரி' : 'Field Officer')}:
            </span>
            <span className="text-white font-bold text-[9px] sm:text-[10px] truncate max-w-[110px] sm:max-w-[180px]">
              {userName || 'Karthik Muthusamy'}
            </span>
          </div>

          <span className="hidden md:inline text-emerald-400/60">|</span>
          <span className="hidden md:inline text-emerald-100 truncate">{currentTime || '13 August 2026 • Thursday 12:34 pm'}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ICCCLiveBadge lang={lang} />
        </div>
      </div>
    </header>
  );
};


