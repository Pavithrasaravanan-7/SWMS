import React, { useState, useEffect, useCallback } from 'react';
import { SWMSHouseholdRecord, SWMSDashboardStats } from './types';
import { SWMSWorkerApp } from './components/SWMSWorkerApp';
import { AIAssistantModal } from './components/AIAssistantModal';
import { LanguageSelectionModal } from './components/LanguageSelectionModal';
import { VehicleAreaAssignmentView } from './components/VehicleAreaAssignmentView';
import { CheckCircle2 } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { CommissionerConsole } from './components/CommissionerConsole';
import { Header } from './components/Header';
import { INITIAL_MUNICIPAL_ALERTS } from './data/alertsData';
import { INITIAL_SWMS_RECORDS } from './data/mockData';
import { ErrorBoundary } from './components/ErrorBoundary';


export default function App() {
  const [records, setRecords] = useState<SWMSHouseholdRecord[]>(() => {
    const saved = localStorage.getItem('swms_household_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude any legacy dummy records
          const realOnly = parsed.filter(
            (r: any) =>
              r &&
              r.id &&
              !r.id.startsWith('REC-100') &&
              !r.houseId?.startsWith('HID10010')
          );
          return realOnly;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_SWMS_RECORDS;
  });

  const [stats, setStats] = useState<SWMSDashboardStats>(() => {
    const saved = localStorage.getItem('swms_household_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const covered = INITIAL_SWMS_RECORDS.filter(r => r.coverageStatus === 'Covered').length;
    const notCovered = INITIAL_SWMS_RECORDS.filter(r => r.coverageStatus === 'Not Covered').length;
    const total = INITIAL_SWMS_RECORDS.length;
    return {
      totalHouseholds: total,
      coveredHouseholds: covered,
      notCoveredHouseholds: notCovered,
      todaysEntries: covered,
      coveragePercentage: total > 0 ? Math.round((covered / total) * 100) : 0,
      zoneBreakdown: [
        { zone: "Central Zone", covered: 0, total: 0 },
        { zone: "East Zone", covered: 0, total: 0 },
        { zone: "West Zone", covered: 0, total: 0 },
        { zone: "North Zone", covered: 0, total: 0 },
        { zone: "South Zone", covered: 0, total: 0 }
      ]
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Global Language State ('en' | 'ta') - Default to English 'en'
  const [lang, setLang] = useState<'en' | 'ta'>(() => {
    const saved = localStorage.getItem('ccmc_lang');
    return (saved === 'en' || saved === 'ta') ? saved : 'en';
  });
  // Currently assigned vehicle ('v-push-cart' | 'v-tata-ace' | 'v-bov' | 'v-obl-pvt')
  const [assignedVehicleId, setAssignedVehicleId] = useState<string>(() => {
    return localStorage.getItem('ccmc_assigned_vehicle') || 'v-push-cart';
  });
  // Initial Language Selection Modal opens automatically after login
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  // Post-Language Vehicle & Area Assignment View
  const [showVehicleAssignment, setShowVehicleAssignment] = useState(false);
  const [liveConnection, setLiveConnection] = useState(true);

  // User Session State - Default to null so initial link load always opens the Login Screen first
  const [user, setUser] = useState<{ role: 'worker' | 'admin'; name: string } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleLoginSuccess = (loggedInUser: { role: 'worker' | 'admin'; name: string }) => {
    setUser(loggedInUser);
    localStorage.setItem('ccmc_session', JSON.stringify(loggedInUser));
    if (loggedInUser.role === 'worker') {
      setIsLangModalOpen(true);
    } else {
      setIsLangModalOpen(false);
      setShowVehicleAssignment(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ccmc_session');
    setIsLangModalOpen(false);
    setShowVehicleAssignment(false);
    showToast('Session logged out.');
  };

  const handleSetLang = (newLang: 'en' | 'ta') => {
    setLang(newLang);
    localStorage.setItem('ccmc_lang', newLang);
    showToast(newLang === 'ta' ? 'தமிழ் மொழி மாற்றப்பட்டது' : 'Language set to English');
  };

  // Save records and stats to local storage on change
  useEffect(() => {
    localStorage.setItem('swms_household_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('swms_household_stats', JSON.stringify(stats));
  }, [stats]);

  const fetchSwmsData = useCallback(async () => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSwmsData();
  }, [fetchSwmsData]);

  const handleRecordCreated = (newRecord: SWMSHouseholdRecord) => {
    setRecords(prev => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);
    setStats(prev => {
      const isCovered = newRecord.coverageStatus === 'Covered';
      const total = prev.totalHouseholds + 1;
      const covered = isCovered ? prev.coveredHouseholds + 1 : prev.coveredHouseholds;
      const notCovered = !isCovered ? prev.notCoveredHouseholds + 1 : prev.notCoveredHouseholds;
      return {
        ...prev,
        totalHouseholds: total,
        coveredHouseholds: covered,
        notCoveredHouseholds: notCovered,
        todaysEntries: prev.todaysEntries + 1,
        coveragePercentage: total > 0 ? Math.round((covered / total) * 100) : 0
      };
    });
  };

  const handleSelectLanguage = (selectedLang: 'en' | 'ta') => {
    setLang(selectedLang);
    setIsLangModalOpen(false);
    // Directly transition to the requested Vehicle & Area Assignment page
    setShowVehicleAssignment(true);
    showToast(selectedLang === 'ta' ? 'தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது' : 'English Language Selected');
  };

  const handleToggleLang = () => {
    const nextLang = lang === 'en' ? 'ta' : 'en';
    setLang(nextLang);
    showToast(nextLang === 'ta' ? 'தமிழ் மொழி மாற்றப்பட்டது' : 'Language changed to English');
  };

  const handleSwitchToWorker = () => {
    const workerUser = {
      role: 'worker' as const,
      name: 'Karthik Muthusamy',
    };
    setUser(workerUser);
    localStorage.setItem('ccmc_session', JSON.stringify(workerUser));
    showToast('Switched to Field Worker Portal.');
  };

  const handleSwitchToAdmin = () => {
    const adminUser = {
      role: 'admin' as const,
      name: 'Thiru. Katta Ravi Teja, IAS',
    };
    setUser(adminUser);
    setIsLangModalOpen(false);
    setShowVehicleAssignment(false);
    localStorage.setItem('ccmc_session', JSON.stringify(adminUser));
    showToast('Switched to Commissioner Command Center.');
  };

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </ErrorBoundary>
    );
  }

  // Admin users directly enter Commissioner Command Console
  if (user.role === 'admin') {
    return (
      <ErrorBoundary>
        <CommissionerConsole
          sbmRecords={records}
          sbmStats={stats}
          onRefreshSbmData={fetchSwmsData}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchToWorker}
          lang={lang}
          onSetLang={handleSetLang}
        />
      </ErrorBoundary>
    );
  }

  // If Language Selection modal is active right after field worker login, render it
  if (isLangModalOpen) {
    return (
      <ErrorBoundary>
        <LanguageSelectionModal
          isOpen={true}
          currentLang={lang}
          onSelectLanguage={handleSelectLanguage}
          onClose={() => {
            setIsLangModalOpen(false);
            setShowVehicleAssignment(true);
          }}
        />
      </ErrorBoundary>
    );
  }

  // Field worker sequence: Language -> Vehicle & Area Assignment screen
  if (showVehicleAssignment) {
    return (
      <ErrorBoundary>
        <VehicleAreaAssignmentView
          lang={lang}
          userName={user.name || 'Karthik Muthusamy'}
          onSetLanguage={setLang}
          onToggleLang={() => {
            const nextLang = lang === 'en' ? 'ta' : 'en';
            setLang(nextLang);
            showToast(nextLang === 'ta' ? 'தமிழ் மொழி மாற்றப்பட்டது' : 'Language switched to English');
          }}
          onLogout={handleLogout}
          onComplete={(assignments, chosenVehicleId) => {
            const selected = chosenVehicleId || assignments[0]?.vehicleId || 'v-push-cart';
            setAssignedVehicleId(selected);
            localStorage.setItem('ccmc_assigned_vehicle', selected);
            setShowVehicleAssignment(false);
            showToast(
              lang === 'ta'
                ? `வாகனம் மற்றும் பகுதிகள் வெற்றிகரமாக ஒதுக்கப்பட்டன`
                : `Vehicle & areas assigned successfully`
            );
          }}
          onSkip={() => {
            setShowVehicleAssignment(false);
            showToast(lang === 'ta' ? 'ஒதுக்கீடு தவிர்க்கப்பட்டது' : 'Assignment skipped');
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white sm:bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
        {/* Main App Stage - Official CCMC Header is directly integrated into SWMSWorkerApp */}
        <main className="flex-1 w-full flex flex-col justify-start items-stretch bg-white p-0">
          <SWMSWorkerApp
            stats={stats}
            records={records}
            lang={lang}
            assignedVehicleId={assignedVehicleId}
            onSetAssignedVehicle={(vId) => {
              setAssignedVehicleId(vId);
              localStorage.setItem('ccmc_assigned_vehicle', vId);
            }}
            userName={user.name || 'Karthik Muthusamy'}
            onLogout={handleLogout}
            onSetLanguage={setLang}
            onOpenLanguageModal={() => setIsLangModalOpen(true)}
            onOpenVehicleAssignment={() => setShowVehicleAssignment(true)}
            onRefreshData={fetchSwmsData}
            onRecordCreated={handleRecordCreated}
          />
        </main>

        {/* Gemini AI Audit Modal */}
        <AIAssistantModal
          isOpen={isAiModalOpen}
          lang={lang}
          onClose={() => setIsAiModalOpen(false)}
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center space-x-2 animate-bounce font-medium text-xs">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-200" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

