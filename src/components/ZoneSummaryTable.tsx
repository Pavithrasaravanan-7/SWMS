import React from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { ZoneSummary } from '../types';

interface ZoneSummaryTableProps {
  summaries: ZoneSummary[];
  onSelectZone?: (zone: string) => void;
}

export const ZoneSummaryTable: React.FC<ZoneSummaryTableProps> = ({
  summaries,
  onSelectZone,
}) => {
  // Calculate Totals
  const totalLocationsSum = summaries.reduce((acc, curr) => acc + curr.totalLocations, 0);
  const totalCollectedSum = summaries.reduce((acc, curr) => acc + curr.collectedCount, 0);
  const totalNotCollectedSum = summaries.reduce((acc, curr) => acc + curr.notCollectedCount, 0);
  const overallCoverageSum = totalLocationsSum > 0 
    ? ((totalCollectedSum / totalLocationsSum) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
      {/* Header Title */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
          Zone Wise Overall Collection Summary
        </h2>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="text-xs sm:text-sm font-bold divide-x divide-gray-200/60 border-b border-gray-200">
              {/* Zone Header */}
              <th className="bg-[#E9F5ED] text-[#1E7A38] px-6 py-3.5 w-[28%]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#1E7A38] flex-shrink-0" />
                  <span className="font-bold">Zone</span>
                </div>
              </th>

              {/* Total Locations Header */}
              <th className="bg-[#E9F5ED] text-[#1E7A38] px-6 py-3.5 text-center font-bold w-[18%]">
                Total Locations
              </th>

              {/* Collected Count Header */}
              <th className="bg-[#E9F5ED] text-[#1E7A38] px-6 py-3.5 text-center font-bold w-[18%]">
                Collected Count
              </th>

              {/* Not Collected Count Header (Red/Pink Tint Cell) */}
              <th className="bg-[#FCE8E6] text-[#C5221F] px-6 py-3.5 text-center font-bold w-[18%]">
                Not Collected Count
              </th>

              {/* Coverage % Header */}
              <th className="bg-[#E9F5ED] text-[#1E7A38] px-6 py-3.5 text-center font-bold w-[18%]">
                Coverage %
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm font-semibold text-gray-800">
            {summaries.map((row) => (
              <tr
                key={row.zone}
                onClick={() => onSelectZone?.(row.zone)}
                className="hover:bg-emerald-50/30 transition-colors cursor-pointer divide-x divide-gray-100"
              >
                {/* Zone Column */}
                <td className="px-6 py-3.5 text-gray-900 font-bold">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1E7A38] flex-shrink-0" />
                    <span>{row.zone}</span>
                  </div>
                </td>

                {/* Total Locations */}
                <td className="px-6 py-3.5 text-center font-bold text-gray-800">
                  {row.totalLocations.toLocaleString()}
                </td>

                {/* Collected Count */}
                <td className="px-6 py-3.5 text-center font-bold text-gray-800">
                  {row.collectedCount.toLocaleString()}
                </td>

                {/* Not Collected Count */}
                <td className="px-6 py-3.5 text-center font-bold text-gray-800">
                  {row.notCollectedCount.toLocaleString()}
                </td>

                {/* Coverage % */}
                <td className="px-6 py-3.5 text-center font-extrabold text-[#1E7A38]">
                  {row.coveragePercentage.toFixed(2)}%
                </td>
              </tr>
            ))}

            {/* Total Summary Row */}
            <tr className="bg-gray-50/90 font-bold border-t-2 border-gray-200 text-gray-900 divide-x divide-gray-200/60">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#1E7A38] flex items-center justify-center text-white flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <span className="font-extrabold text-gray-900">Total</span>
                </div>
              </td>

              <td className="px-6 py-4 text-center font-extrabold text-gray-900">
                {totalLocationsSum.toLocaleString()}
              </td>

              <td className="px-6 py-4 text-center font-extrabold text-gray-900">
                {totalCollectedSum.toLocaleString()}
              </td>

              <td className="px-6 py-4 text-center font-extrabold text-gray-900">
                {totalNotCollectedSum.toLocaleString()}
              </td>

              <td className="px-6 py-4 text-center font-extrabold text-[#1E7A38] text-base">
                {overallCoverageSum}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};


