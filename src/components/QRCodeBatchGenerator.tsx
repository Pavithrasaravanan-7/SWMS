import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Household, Street } from '../types';
import { Printer, Search, QrCode, Building, Home, Building2, Download } from 'lucide-react';

interface QRCodeBatchGeneratorProps {
  households: Household[];
  streets: Street[];
}

export const QRCodeBatchGenerator: React.FC<QRCodeBatchGeneratorProps> = ({
  households,
  streets
}) => {
  const [selectedStreetId, setSelectedStreetId] = useState<string>('all');
  const [rangeFilter, setRangeFilter] = useState<string>('1-50');
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});

  // Filter households
  const filtered = households.filter(h => {
    if (selectedStreetId !== 'all' && h.streetId !== selectedStreetId) return false;

    const doorNum = parseInt(h.newDoorNo, 10);
    if (rangeFilter !== 'all') {
      const [start, end] = rangeFilter.split('-').map(Number);
      if (isNaN(doorNum) || doorNum < start || doorNum > end) return false;
    }
    return true;
  });

  // Limit display to maximum 60 items at a time for fast rendering
  const displayed = filtered.slice(0, 60);

  // Generate QR code data URLs asynchronously
  useEffect(() => {
    async function generateQRs() {
      const newUrls: Record<string, string> = {};
      for (const h of displayed) {
        try {
          const url = await QRCode.toDataURL(h.qrCodePayload, {
            margin: 1,
            width: 160,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          newUrls[h.id] = url;
        } catch (err) {
          console.error("Failed to generate QR for", h.id, err);
        }
      }
      setQrDataUrls(newUrls);
    }

    generateQRs();
  }, [selectedStreetId, rangeFilter, households]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-100 font-sans">
      
      {/* Controls Bar (Hidden when printing) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-xs text-purple-400 font-semibold uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>Door QR Label Generator</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">Household QR Code Print Center</h1>
          <p className="text-xs text-slate-400">
            Generate and print scannable SBM QR code stickers for doors (1 to 999)
          </p>
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Street Filter</label>
            <select
              value={selectedStreetId}
              onChange={(e) => setSelectedStreetId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Streets</option>
              {streets.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Batch Range</label>
            <select
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:ring-2 focus:ring-purple-500"
            >
              <option value="1-30">Doors 1 to 30</option>
              <option value="31-60">Doors 31 to 60</option>
              <option value="61-100">Doors 61 to 100</option>
              <option value="101-200">Doors 101 to 200</option>
              <option value="201-500">Doors 201 to 500</option>
              <option value="501-999">Doors 501 to 999</option>
              <option value="all">All Doors (Max 60 view)</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print QR Cards</span>
          </button>
        </div>
      </div>

      {/* Grid of Printable Household Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
        {displayed.map((h) => (
          <div
            key={h.id}
            className="bg-white text-slate-900 border-2 border-slate-300 rounded-xl p-3 flex flex-col items-center justify-between shadow-md print:shadow-none print:border-black print:p-2 break-inside-avoid"
          >
            {/* SBM Header */}
            <div className="text-center space-y-0.5 w-full border-b pb-1.5 border-slate-200">
              <div className="text-[9px] font-black text-emerald-700 tracking-wider uppercase">
                Swachh Bharat Mission (SBM)
              </div>
              <div className="text-[11px] font-extrabold text-slate-900 truncate">
                {h.streetName}
              </div>
              <div className="text-[8px] text-slate-500 font-mono">
                Ward 01 • {h.zone}
              </div>
            </div>

            {/* QR Code Canvas/Image */}
            <div className="my-2 p-1 bg-white border border-slate-200 rounded-lg shadow-inner">
              {qrDataUrls[h.id] ? (
                <img
                  src={qrDataUrls[h.id]}
                  alt={`QR for door ${h.newDoorNo}`}
                  className="w-28 h-28 object-contain"
                />
              ) : (
                <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Door Number & Details Footer */}
            <div className="w-full bg-slate-100 rounded-lg p-2 text-center space-y-0.5 border border-slate-200">
              <div className="text-base font-black text-slate-900 font-mono">
                DOOR #{h.newDoorNo}
              </div>
              <div className="text-[9px] text-slate-600 font-mono">
                Old Door No: <strong>{h.oldDoorNo}</strong>
              </div>
              <div className="text-[8px] text-slate-500 font-mono truncate">
                ID: {h.id}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
