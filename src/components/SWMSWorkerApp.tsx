import React, { useState } from 'react';
import { SWMSHouseholdRecord, SWMSDashboardStats, CoverageStatus } from '../types';
import { SWMSHistoryHomeView } from './SWMSHistoryHomeView';
import { SWMSHouseholdFormView } from './SWMSHouseholdFormView';
import { SWMSScannerView } from './SWMSScannerView';
import { DustbinAnimationModal } from './DustbinAnimationModal';
import { 
  QrCode,
  Globe
} from 'lucide-react';

interface SWMSWorkerAppProps {
  stats: SWMSDashboardStats;
  records: SWMSHouseholdRecord[];
  lang: 'en' | 'ta';
  assignedVehicleId?: string;
  onSetAssignedVehicle?: (vehicleId: string) => void;
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onOpenLanguageModal?: () => void;
  onOpenVehicleAssignment?: () => void;
  onRefreshData: () => void;
  onRecordCreated?: (newRecord: SWMSHouseholdRecord) => void;
  userName?: string;
  onLogout?: () => void;
}

export const SWMSWorkerApp: React.FC<SWMSWorkerAppProps> = ({
  stats,
  records,
  lang,
  assignedVehicleId = 'v-push-cart',
  onSetAssignedVehicle,
  onSetLanguage,
  onOpenLanguageModal,
  onOpenVehicleAssignment,
  onRefreshData,
  onRecordCreated,
  userName = 'Karthik Muthusamy',
  onLogout
}) => {
  // Opens directly on 'history' (Area Coverage History Dashboard)
  const [activeTab, setActiveTab] = useState<'history' | 'scan' | 'form'>('history');
  const [scannedHouseId, setScannedHouseId] = useState('HID100101');

  // Animation Modal state
  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState<SWMSHouseholdRecord | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<CoverageStatus>('Covered');

  const toggleLanguage = () => {
    if (onSetLanguage) {
      onSetLanguage(lang === 'en' ? 'ta' : 'en');
    }
  };

  // Handle Scan completion -> navigates to household form
  const handleScanComplete = (houseId: string) => {
    setScannedHouseId(houseId);
    setActiveTab('form');
  };

  // Handle Bottom SCAN Button click
  const handleBottomScanClick = () => {
    if (activeTab === 'scan') {
      const targetHouse = 'HID' + Math.floor(100101 + Math.random() * 10);
      setScannedHouseId(targetHouse);
      setActiveTab('form');
    } else {
      setActiveTab('scan');
    }
  };

  // Handle Form Submission Success -> Opens Modal & Navigates back to front Area History View
  const handleFormSubmitSuccess = (newRecord: SWMSHouseholdRecord, status: CoverageStatus) => {
    setLastSubmittedRecord(newRecord);
    setSubmittedStatus(status);
    setIsAnimationOpen(true);
    if (onRecordCreated) {
      onRecordCreated(newRecord);
    }
    onRefreshData();
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen relative bg-white font-sans overflow-hidden">
      
      {/* App Main Content Stage */}
      <div className="flex-1 overflow-y-auto relative bg-white flex flex-col">
        
        {/* VIEW 1: AREA COVERAGE HISTORY (FIRST LANDING DASHBOARD) */}
        {activeTab === 'history' && (
          <SWMSHistoryHomeView
            stats={stats}
            records={records}
            lang={lang}
            assignedVehicleId={assignedVehicleId}
            onSetAssignedVehicle={onSetAssignedVehicle}
            onSetLanguage={onSetLanguage}
            onToggleLang={toggleLanguage}
            userName={userName}
            onLogout={onLogout}
            onOpenVehicleAssignment={onOpenVehicleAssignment}
            onSelectDoor={(houseId) => {
              setScannedHouseId(houseId);
              setActiveTab('form');
            }}
            onOpenScanner={() => setActiveTab('scan')}
          />
        )}

        {/* VIEW 2: SCANNER PAGE (WITH BACK ARROW TO DASHBOARD) */}
        {activeTab === 'scan' && (
          <div className="flex-1 w-full h-full flex flex-col overflow-hidden pb-20">
            <SWMSScannerView
              lang={lang}
              onSetLanguage={onSetLanguage}
              onToggleLang={toggleLanguage}
              onScanComplete={handleScanComplete}
              onBackToDashboard={() => setActiveTab('history')}
            />
          </div>
        )}

        {/* VIEW 3: HOUSEHOLD / STREET FORM ENTRY */}
        {activeTab === 'form' && (
          <div className="flex-1 overflow-y-auto pb-28 h-full">
            <SWMSHouseholdFormView
              scannedHouseId={scannedHouseId}
              lang={lang}
              onSetLanguage={onSetLanguage}
              onToggleLang={toggleLanguage}
              assignedVehicleId={assignedVehicleId}
              onBackToScanner={() => setActiveTab('scan')}
              onSubmitSuccess={handleFormSubmitSuccess}
            />
          </div>
        )}

      </div>

      {/* FLOATING SCAN BUTTON - SHOWN ONLY ON HISTORY HOME DASHBOARD */}
      {activeTab === 'history' && (
        <div className="fixed bottom-4 left-0 right-0 z-40 flex items-center justify-center pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-full p-1.5 border border-emerald-300 shadow-2xl flex items-center justify-center">
            <button
              onClick={handleBottomScanClick}
              className="flex items-center space-x-2 px-7 py-2.5 rounded-full transition transform active:scale-95 text-white font-black shadow-xl cursor-pointer bg-[#1E7A38] hover:bg-[#166534] hover:scale-105 ring-4 ring-emerald-500/20"
              title="Scan QR Code / க்யூஆர் ஸ்கேன் செய்யவும்"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border border-white/40">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs tracking-wider uppercase font-black">
                {lang === 'ta' ? 'ஸ்கேன்' : 'SCAN'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* DUSTBIN DROP & NOT COVERED ANIMATION MODAL */}
      <DustbinAnimationModal
        isOpen={isAnimationOpen}
        coverageStatus={submittedStatus}
        houseId={lastSubmittedRecord?.houseId || scannedHouseId}
        doorNo={lastSubmittedRecord?.doorNo || '45'}
        streetName={lastSubmittedRecord?.streetName || 'Kamaraj Salai'}
        gpsCoordinates={lastSubmittedRecord?.gpsCoordinates}
        locationName={lastSubmittedRecord?.locationName}
        latitude={lastSubmittedRecord?.latitude}
        longitude={lastSubmittedRecord?.longitude}
        ward={lastSubmittedRecord?.ward}
        lang={lang}
        assignedVehicleId={assignedVehicleId}
        onClose={() => {
          setIsAnimationOpen(false);
          setActiveTab('history'); // Navigates back to front history dashboard
        }}
        onNextScan={() => {
          setIsAnimationOpen(false);
          setActiveTab('scan');
        }}
      />

    </div>
  );
};
