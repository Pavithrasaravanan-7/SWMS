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
              <th className="px-4 py-3.5 text-center w-[8%] font-bold">{lang === 'ta' ? 'வரிசை' : 'S. No.'}</th>
              <th className="px-5 py-3.5 w-[14%] font-bold">{lang === 'ta' ? 'தேதி' : 'Date'}</th>
              <th className="px-5 py-3.5 w-[15%] font-bold">{lang === 'ta' ? 'மண்டலம்' : 'Zone'}</th>
              <th className="px-5 py-3.5 w-[12%] font-bold">{lang === 'ta' ? 'வார்டு' : 'Ward'}</th>
              <th className="px-5 py-3.5 w-[20%] font-bold">{lang === 'ta' ? 'தெரு' : 'Street'}</th>
              <th className="px-5 py-3.5 w-[16%] font-bold">{lang === 'ta' ? 'பணியாளர் பெயர்' : 'Worker Name'}</th>
              <th className="px-4 py-3.5 text-center w-[15%] font-bold">{lang === 'ta' ? 'நிலை' : 'Status'}</th>
              <th className="px-4 py-3.5 text-center w-[8%] font-bold">{lang === 'ta' ? 'செயல்' : 'Action'}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm font-semibold text-gray-800">
            {displayRecords.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3.5 text-center font-bold text-gray-700">
                  {index + 1}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap text-gray-700 font-semibold">
                  {item.date}
                </td>

                <td className="px-5 py-3.5 font-bold text-gray-900">
                  {getZoneDisplayName(item.zone || 'Central Zone', lang)}
                </td>

                <td className="px-5 py-3.5 font-semibold text-gray-700">
                  {item.ward}
                </td>

                <td className="px-5 py-3.5 font-bold text-gray-900">
                  {item.street}
                </td>

                <td className="px-5 py-3.5 font-semibold text-gray-800">
                  {item.workerName}
                </td>

                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                  {item.status === 'Collected' ? (
                    <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#1E7A38] border border-emerald-200/80">
                      {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}
                    </span>
                  ) : (
                    <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#FCE8E6] text-[#C5221F] border border-rose-200/80">
                      {lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected'}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => onInspectRecord(item)}
                    title={lang === 'ta' ? 'விரிவான விவரங்களை பார்க்க' : 'View Detailed Ward & Worker Telemetry'}
                    className="inline-flex items-center justify-center p-1.5 rounded-full text-[#1E7A38] hover:bg-emerald-100/80 transition-colors focus:outline-none"
                  >
                    <Eye className="w-5 h-5 text-[#1E7A38]" />
                  </button>
                </td>
              </tr>
            ))}
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
