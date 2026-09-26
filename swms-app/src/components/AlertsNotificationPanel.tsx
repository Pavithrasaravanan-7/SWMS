import React, { useState, useMemo } from 'react';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  User,
  Filter,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Navigation,
  Search,
  Check,
  Radio,
  Layers,
} from 'lucide-react';
import { MunicipalAlert, AlertCategory, AlertSeverity, ZoneName } from '../types';
import { alertsIcon } from '../constants/branding';

const ALERTS_ICON_URL = alertsIcon;

interface AlertsNotificationPanelProps {
  alerts: MunicipalAlert[];
  onResolveAlert: (id: string) => void;
  onDismissAlert: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToLiveTracking: (zone?: ZoneName | string, info?: string) => void;
  onShowToast: (msg: string) => void;
  lang?: 'en' | 'ta';
}

export const AlertsNotificationPanel: React.FC<AlertsNotificationPanelProps> = ({
  alerts,
  onResolveAlert,
  onDismissAlert,
  onMarkAllAsRead,
  onNavigateToLiveTracking,
  onShowToast,
  lang = 'en',
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  // Counters
  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.isResolved).length;
  const warningCount = alerts.filter((a) => a.severity === 'warning' && !a.isResolved).length;
  const successCount = alerts.filter((a) => a.severity === 'success' || a.isResolved).length;

  // Category breakdown counts
  const categoryCounts = useMemo(() => {
    return {
      high_missed_houses: alerts.filter((a) => a.category === 'high_missed_houses' && !a.isResolved).length,
      worker_not_started: alerts.filter((a) => a.category === 'worker_not_started' && !a.isResolved).length,
      vehicle_delayed: alerts.filter((a) => a.category === 'vehicle_delayed' && !a.isResolved).length,
      collection_pending_zone: alerts.filter((a) => a.category === 'collection_pending_zone' && !a.isResolved).length,
      zone_completed: alerts.filter((a) => a.category === 'zone_completed' || a.isResolved).length,
    };
  }, [alerts]);

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Severity Filter
      if (selectedSeverity !== 'all') {
        if (selectedSeverity === 'resolved') {
          if (!alert.isResolved) return false;
        } else if (alert.severity !== selectedSeverity) {
          return false;
        }
      }
      // Category Filter
      if (selectedCategory !== 'all' && alert.category !== selectedCategory) {
        return false;
      }
      // Zone Filter
      if (selectedZone !== 'all' && alert.zone !== selectedZone) {
        return false;
      }
      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = alert.title.toLowerCase().includes(q);
        const matchMessage = alert.message.toLowerCase().includes(q);
        const matchWard = alert.ward.toLowerCase().includes(q);
        const matchZone = alert.zone.toLowerCase().includes(q);
        const matchEntity = alert.assignedEntity?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchMessage && !matchWard && !matchZone && !matchEntity) {
          return false;
        }
      }
      return true;
    });
  }, [alerts, selectedSeverity, selectedCategory, selectedZone, searchQuery]);

  const getCategoryLabel = (category: AlertCategory) => {
    if (lang === 'ta') {
      switch (category) {
        case 'high_missed_houses':
          return 'விடுபட்ட வீடுகள்';
        case 'worker_not_started':
          return 'பணியாளர் தொடங்கவில்லை';
        case 'vehicle_delayed':
          return 'வாகனம் தாமதம்';
        case 'collection_pending_zone':
          return 'மண்டலத்தில் நிலுவை';
        case 'zone_completed':
          return 'மண்டலம் முடிந்தது';
        default:
          return category;
      }
    }
    switch (category) {
      case 'high_missed_houses':
        return 'Missed Households';
      case 'worker_not_started':
        return 'Worker Delay';
      case 'vehicle_delayed':
        return 'Vehicle Delay';
      case 'collection_pending_zone':
        return 'Zone Pending';
      case 'zone_completed':
        return 'Zone Completed';
      default:
        return category;
    }
  };

  const getCategoryBadgeClass = (category: AlertCategory) => {
    switch (category) {
      case 'high_missed_houses':
      case 'collection_pending_zone':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'worker_not_started':
      case 'vehicle_delayed':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'zone_completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      {/* Top Header */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1 flex-shrink-0">
            <img
              src={ALERTS_ICON_URL}
              alt="Alerts"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {lang === 'ta' ? 'செயல்பாட்டு எச்சரிக்கைகள்' : 'Operational Alerts & Incident Feed'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                {lang === 'ta' ? 'நேரலை' : 'Live Stream'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'ta'
                ? 'விடுபட்ட வீடுகள், வாகன தாமதங்கள் மற்றும் மண்டல தூய்மை எச்சரிக்கைகள்'
                : 'Real-time operational alerts for missed households, route delays, and zonal progress'}
            </p>
          </div>
        </div>

        {/* Quick Summary Counts */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-xs font-semibold text-slate-600">{lang === 'ta' ? 'அவசரம்' : 'Critical'}:</span>
            <span className="text-xs font-black text-rose-600">{criticalCount}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-xs font-semibold text-slate-600">{lang === 'ta' ? 'எச்சரிக்கை' : 'Warning'}:</span>
            <span className="text-xs font-black text-amber-700">{warningCount}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-slate-600">{lang === 'ta' ? 'முடிந்தது' : 'Resolved'}:</span>
            <span className="text-xs font-black text-emerald-700">{successCount}</span>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => {
                onMarkAllAsRead();
                onShowToast(lang === 'ta' ? 'அனைத்து எச்சரிக்கைகளும் வாசிக்கப்பட்டன' : 'All alerts marked as read');
              }}
              className="text-xs font-bold text-[#1E7A38] hover:text-[#166534] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'அனைத்தும் வாசி' : 'Mark all read'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar (Sleek, Clean, Modern) */}
      <div className="px-5 py-2.5 bg-slate-50/90 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
          {lang === 'ta' ? 'பிரிவுகள்:' : 'Category:'}
        </span>

        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          {lang === 'ta' ? 'அனைத்தும்' : 'All Categories'} ({alerts.length})
        </button>

        <button
          onClick={() => setSelectedCategory(selectedCategory === 'high_missed_houses' ? 'all' : 'high_missed_houses')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedCategory === 'high_missed_houses'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-rose-50'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span>{lang === 'ta' ? 'விடுபட்ட வீடுகள்' : 'Missed Households'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 text-rose-800 ml-0.5">
            {categoryCounts.high_missed_houses}
          </span>
        </button>

        <button
          onClick={() => setSelectedCategory(selectedCategory === 'worker_not_started' ? 'all' : 'worker_not_started')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedCategory === 'worker_not_started'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>{lang === 'ta' ? 'பணியாளர் தாமதம்' : 'Worker Delay'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 ml-0.5">
            {categoryCounts.worker_not_started}
          </span>
        </button>

        <button
          onClick={() => setSelectedCategory(selectedCategory === 'vehicle_delayed' ? 'all' : 'vehicle_delayed')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedCategory === 'vehicle_delayed'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>{lang === 'ta' ? 'வாகன தாமதம்' : 'Vehicle Delay'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 ml-0.5">
            {categoryCounts.vehicle_delayed}
          </span>
        </button>

        <button
          onClick={() => setSelectedCategory(selectedCategory === 'collection_pending_zone' ? 'all' : 'collection_pending_zone')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedCategory === 'collection_pending_zone'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-rose-50'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span>{lang === 'ta' ? 'மண்டல நிலுவை' : 'Pending in Zone'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 text-rose-800 ml-0.5">
            {categoryCounts.collection_pending_zone}
          </span>
        </button>

        <button
          onClick={() => setSelectedCategory(selectedCategory === 'zone_completed' ? 'all' : 'zone_completed')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedCategory === 'zone_completed'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>{lang === 'ta' ? 'மண்டலம் முடிந்தது' : 'Zone Completed'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 ml-0.5">
            {categoryCounts.zone_completed}
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Severity Filter Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSelectedSeverity('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
              selectedSeverity === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'ta' ? 'அனைத்தும்' : 'All'}
          </button>
          <button
            onClick={() => setSelectedSeverity('critical')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
              selectedSeverity === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span>{lang === 'ta' ? 'அவசரம்' : 'Critical'}</span>
          </button>
          <button
            onClick={() => setSelectedSeverity('warning')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
              selectedSeverity === 'warning'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <span>{lang === 'ta' ? 'எச்சரிக்கை' : 'Warning'}</span>
          </button>
          <button
            onClick={() => setSelectedSeverity('resolved')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
              selectedSeverity === 'resolved'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <span>{lang === 'ta' ? 'முடிந்தது' : 'Resolved'}</span>
          </button>
        </div>

        {/* Zone Selector & Search Input */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:min-w-[320px]">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="all">{lang === 'ta' ? 'அனைத்து மண்டலங்கள்' : 'All Zones'}</option>
            <option value="North Zone">North Zone</option>
            <option value="Central Zone">Central Zone</option>
            <option value="South Zone">South Zone</option>
            <option value="West Zone">West Zone</option>
            <option value="East Zone">East Zone</option>
          </select>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'ta' ? 'எச்சரிக்கை, வார்டு தேடுக...' : 'Search alert, ward, worker...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'ta' ? 'எந்த எச்சரிக்கையும் இல்லை' : 'No matching alerts found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {lang === 'ta'
                ? 'தேர்ந்தெடுக்கப்பட்ட பிரிவில் அனைத்துப் பணிகளும் சீராக இயங்குகின்றன.'
                : 'All collection routes in this filter category are running within standard operational thresholds.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            const isResolved = alert.isResolved;

            return (
              <div
                key={alert.id}
                className={`p-4 sm:p-5 transition-colors border-l-4 ${
                  isResolved
                    ? 'border-l-emerald-500 bg-slate-50/40 opacity-80'
                    : isCritical
                    ? 'border-l-rose-500 bg-white hover:bg-rose-50/20'
                    : isWarning
                    ? 'border-l-amber-500 bg-white hover:bg-amber-50/20'
                    : 'border-l-emerald-500 bg-white hover:bg-emerald-50/20'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Clean Severity Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                      isResolved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isCritical
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : isWarning
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isResolved ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCritical ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : isWarning ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    {/* Meta Header Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getCategoryBadgeClass(
                          alert.category
                        )}`}
                      >
                        {getCategoryLabel(alert.category)}
                      </span>

                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {alert.zone} • {alert.ward}
                      </span>

                      {alert.affectedCount && (
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {alert.affectedCount} {lang === 'ta' ? 'வீடுகள்' : 'Houses'}
                        </span>
                      )}

                      <span className="text-xs text-slate-400 ml-auto flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{alert.timeAgo}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-slate-900">
                      {alert.title}
                    </h4>

                    {/* Clean Message */}
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    {/* Expanded Telemetry Box */}
                    {isExpanded && (
                      <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        {alert.assignedEntity && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 font-medium">{lang === 'ta' ? 'பணியாளர் / வாகனம்:' : 'Assigned Staff / Vehicle:'}</span>
                            <span className="font-bold text-slate-900">{alert.assignedEntity}</span>
                          </div>
                        )}
                        {alert.streetOrSector && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 font-medium">{lang === 'ta' ? 'தெரு / பகுதி:' : 'Street / Sector:'}</span>
                            <span className="font-semibold text-slate-800">{alert.streetOrSector}</span>
                          </div>
                        )}
                        {alert.actionRequired && (
                          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950">
                            <span className="font-bold block text-[11px] text-emerald-900 mb-0.5">
                              {lang === 'ta' ? 'பரிந்துரைக்கப்பட்ட நடவடிக்கை:' : 'Recommended Municipal Action:'}
                            </span>
                            <span>{alert.actionRequired}</span>
                          </div>
                        )}
                        {alert.details && (
                          <div className="text-slate-500 text-[11px]">
                            <span className="font-semibold">{lang === 'ta' ? 'விவரம்:' : 'Diagnostic Note:'}</span> {alert.details}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons Toolbar */}
                    <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-100 flex-wrap">
                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <span>{lang === 'ta' ? 'சுருக்குக' : 'Less info'}</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>{lang === 'ta' ? 'கூடுதல் விவரங்கள்' : 'View details'}</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onNavigateToLiveTracking(alert.zone, `${alert.title} in ${alert.ward}`);
                          }}
                          className="px-3 py-1.5 bg-[#1E7A38] hover:bg-[#166534] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>{lang === 'ta' ? 'வரைபடத்தில் பார்' : 'View on Map'}</span>
                        </button>

                        {!alert.isResolved ? (
                          <button
                            onClick={() => {
                              onResolveAlert(alert.id);
                              onShowToast(lang === 'ta' ? 'எச்சரிக்கை தீர்க்கப்பட்டது' : 'Alert marked as resolved');
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1E7A38] text-xs font-bold rounded-lg transition flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-[#1E7A38]" />
                            <span>{lang === 'ta' ? 'தீர்க்கப்பட்டது' : 'Resolve'}</span>
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{lang === 'ta' ? 'முடிந்தது' : 'Resolved'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>{filteredAlerts.length} {lang === 'ta' ? 'எச்சரிக்கைகள் காட்டப்படுகின்றன' : 'alerts displayed'}</span>
        <span>{lang === 'ta' ? 'நேரலை ஜிபிஎஸ் தரவு தானாக புதுப்பிக்கப்படுகிறது' : 'Live municipal telemetry synchronized'}</span>
      </div>
    </div>
  );
};
