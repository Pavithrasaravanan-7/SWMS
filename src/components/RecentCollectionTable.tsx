import React from 'react';
import { Eye } from 'lucide-react';
import { CollectionRecord } from '../types';

interface RecentCollectionTableProps {
  records: CollectionRecord[];
  lang?: 'en' | 'ta';
  onInspectRecord: (record: CollectionRecord) => void;
  onViewAllReports: () => void;
}

const getZoneDisplayName = (zoneName: string, lang: 'en' | 'ta') => {
  if (lang !== 'ta') return zoneName;
  if (zoneName.includes('North Zone')) return 'வடக்கு மண்டலம் (North Zone)';
  if (zoneName.includes('Central Zone')) return 'மத்திய மண்டலம் (Central Zone)';
  if (zoneName.includes('South Zone')) return 'தெற்கு மண்டலம் (South Zone)';
  if (zoneName.includes('West Zone')) return 'மேற்கு மண்டலம் (West Zone)';
  if (zoneName.includes('East Zone')) return 'கிழக்கு மண்டலம் (East Zone)';
  return zoneName;
};

export const RecentCollectionTable: React.FC<RecentCollectionTableProps> = ({
  records,
  lang = 'en',
  onInspectRecord,
  onViewAllReports,
}) => {
  // Display top 5 items for the summary card as shown in the screenshot
  const displayRecords = records.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
      {/* Table Title */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
          {lang === 'ta' ? 'சமீபத்திய சேகரிப்பு மேலோட்டம்' : 'Recent Collection Overview'}
        </h2>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-[#EAF3ED] text-[#1E7A38] text-xs sm:text-sm font-bold border-b border-gray-200/80">
              <th className="px-4 py-3.5 text-center w-[6%] font-bold">{lang === 'ta' ? 'வரிசை' : 'S. No.'}</th>
              <th className="px-4 py-3.5 w-[12%] font-bold">{lang === 'ta' ? 'தேதி' : 'Date'}</th>
              <th className="px-4 py-3.5 w-[14%] font-bold">{lang === 'ta' ? 'மண்டலம்' : 'Zone'}</th>
              <th className="px-4 py-3.5 w-[10%] font-bold">{lang === 'ta' ? 'வார்டு' : 'Ward'}</th>
              <th className="px-4 py-3.5 w-[18%] font-bold">{lang === 'ta' ? 'தெரு' : 'Street'}</th>
              <th className="px-4 py-3.5 w-[18%] font-bold">{lang === 'ta' ? 'வாகன எண் & 5-ஸ்கேன்' : 'Vehicle No. & 5-Scans'}</th>
              <th className="px-4 py-3.5 w-[14%] font-bold">{lang === 'ta' ? 'பணியாளர்' : 'Worker'}</th>
              <th className="px-3 py-3.5 text-center w-[12%] font-bold">{lang === 'ta' ? 'நிலை' : 'Status'}</th>
              <th className="px-3 py-3.5 text-center w-[6%] font-bold">{lang === 'ta' ? 'செயல்' : 'Action'}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm font-semibold text-gray-800">
            {displayRecords.map((item, index) => {
              const isPushCart = (item.vehicleType || '').toLowerCase().includes('push') || item.vehicleNo === 'PUSHCART';
              const totalScans = isPushCart ? 1 : 5;
              const stName = item.streetName || item.street;
              const isTodaySubmitted = (ts?: string): boolean => {
                if (!ts || ts === 'Shift Pending' || ts === 'Not Logged In') return false;
                const today = new Date();
                const d = String(today.getDate()).padStart(2, '0');
                const dSingle = String(today.getDate());
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const mSingle = String(today.getMonth() + 1);
                const y = String(today.getFullYear());
                const datePart = ts.split(',')[0].trim();
                return (
                  datePart.includes(`${m}/${d}/${y}`) ||
                  datePart.includes(`${mSingle}/${dSingle}/${y}`) ||
                  datePart.includes(`${d}/${m}/${y}`) ||
                  datePart.includes(`${dSingle}/${mSingle}/${y}`) ||
                  datePart.includes(`${y}-${m}-${d}`)
                );
              };

              const isShiftPending = item.date === 'Shift Pending' || 
                                     item.scannedAt === 'Shift Pending' || 
                                     !item.scannedAt || 
                                     item.scannedAt === 'Not Logged In' ||
                                     !isTodaySubmitted(item.scannedAt || item.timestamp || item.date);
              
              let streetScanList: any[] = item.streetScans || [];
              if (!isShiftPending) {
                try {
                  const raw = localStorage.getItem('ccmc_street_5scans');
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (stName && parsed[stName] && Array.isArray(parsed[stName])) {
                      streetScanList = parsed[stName];
                    }
                  }
                } catch (e) {}
              }

              let scannedCount = 0;
              if (!isShiftPending) {
                if (streetScanList && streetScanList.length > 0) {
                  scannedCount = streetScanList.filter((s: any) => s.isScanned).length;
                } else if (typeof item.completedScansCount === 'number') {
                  scannedCount = item.completedScansCount;
                } else if (item.status === 'Collected') {
                  scannedCount = totalScans;
                }
              }

              // Exact boolean status per checkpoint 1..5
              const dotStatusList: boolean[] = Array.from({ length: totalScans }, (_, i) => {
                if (isShiftPending) return false;
                const cpNum = i + 1;
                if (streetScanList && streetScanList.length > 0) {
                  const match = streetScanList.find((s: any) => (s.id === cpNum || s.checkpointNo === cpNum));
                  if (match) return !!match.isScanned;
                  if (streetScanList[i]) return !!streetScanList[i].isScanned;
                }
                return i < scannedCount || item.status === 'Collected';
              });
              
              return (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3.5 text-center font-bold text-gray-700">
                    {index + 1}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap text-gray-700 font-semibold text-xs">
                    {!isShiftPending && scannedCount > 0 ? (
                      item.date
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-bold text-[11px]">
                        🕒 {lang === 'ta' ? 'இன்று உள்நுழையவில்லை' : 'Not Logged In Today'}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 font-bold text-gray-900 text-xs">
                    {getZoneDisplayName(item.zone || 'Central Zone', lang)}
                  </td>

                  <td className="px-4 py-3.5 font-semibold text-gray-700 text-xs">
                    {item.ward}
                  </td>

                  <td className="px-4 py-3.5 font-bold text-gray-900">
                    {item.street}
                  </td>

                  {/* Vehicle No & 5-Scan Status Cell */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md w-max border border-slate-200">
                        {(item.vehicleNo && !item.vehicleNo.includes('38 PV 9001')) ? item.vehicleNo : ((item.street?.toLowerCase().includes('mageshwari') || item.streetName?.toLowerCase().includes('mageshwari')) ? 'TN66AD6465' : (item.vehicleNo || 'TN66AD6465'))}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${
                          !isShiftPending && scannedCount === totalScans
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : !isShiftPending && scannedCount > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {scannedCount}/{totalScans} Scanned
                        </span>
                        <div className="flex gap-0.5">
                          {dotStatusList.map((isScanned, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                isScanned ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              title={`Checkpoint ${i + 1}: ${isScanned ? 'Scanned ✓' : 'Pending X'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 font-semibold text-gray-800 text-xs">
                    {item.workerName}
                  </td>

                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {isShiftPending || scannedCount === 0 ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FCE8E6] text-[#C5221F] border border-rose-200/80">
                        {lang === 'ta' ? 'இன்று உள்நுழையவில்லை' : 'Not Logged In Today'}
                      </span>
                    ) : item.status === 'Collected' ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#1E7A38] border border-emerald-200/80">
                        {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                        {lang === 'ta' ? 'பகுதி சேகரிப்பு' : 'Partial Scan'}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3.5 text-center">
                    <button
                      onClick={() => onInspectRecord(item)}
                      title={lang === 'ta' ? 'விரிவான விவரங்களை பார்க்க' : 'View Detailed Ward & Worker Telemetry'}
                      className="inline-flex items-center justify-center p-1.5 rounded-full text-[#1E7A38] hover:bg-emerald-100/80 transition-colors focus:outline-none cursor-pointer"
                    >
                      <Eye className="w-5 h-5 text-[#1E7A38]" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer View All Reports Button */}
      <div className="p-4 bg-white border-t border-gray-100 flex justify-center">
        <button
          onClick={onViewAllReports}
          className="px-7 py-2 border-2 border-[#1E7A38] text-[#1E7A38] hover:bg-[#1E7A38] hover:text-white font-bold rounded-xl text-sm transition-all focus:outline-none cursor-pointer"
        >
          {lang === 'ta' ? 'அனைத்து அறிக்கைகளையும் காண்க' : 'View All Reports'}
        </button>
      </div>
    </div>
  );
};
