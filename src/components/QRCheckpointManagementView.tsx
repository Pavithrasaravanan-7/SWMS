import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { QrCode,
  Users,
  Home,
  Building2,
  Download,
  Printer,
  Eye,
  Plus,
  Loader2,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ccmcLogo, ccmcFallbackLogo } from '../constants/branding';
import {
  adminQROptions,
  adminQRZones,
  adminQRGenerateSingle,
  adminQRGenerateZone,
  adminQRDownloadAll,
  qrImageUrl,
  qrImageDownloadUrl,
} from '../api/client';
import type {
  QRAdminListResult,
  QROptionsResult,
  QRCheckpointAdmin,
  QRGenerateSinglePayload,
} from '../types';

interface Props {
  token: string;
}

const ZONE_ORDER = ['Central Zone', 'East Zone', 'West Zone', 'North Zone', 'South Zone'];

const SCAN_PREFIX: Record<string, string> = {
  'Central Zone': 'C',
  'East Zone': 'E',
  'West Zone': 'W',
  'North Zone': 'N',
  'South Zone': 'S',
};
const scanPrefixFor = (zone: string) => SCAN_PREFIX[zone] || 'X';

export const QRCheckpointManagementView: React.FC<Props> = ({ token }) => {
  const [zonesData, setZonesData] = useState<QRAdminListResult>({ success: true, zones: [], checkpoints: [] });
  const [options, setOptions] = useState<QROptionsResult | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('East Zone');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create-checkpoint form state
  const [ward, setWard] = useState('Ward 12');
  const [streetId, setStreetId] = useState<number | ''>('');
  const [households, setHouseholds] = useState('100');
  const [workerId, setWorkerId] = useState<number | ''>('');
  const [ssId, setSsId] = useState<number | ''>('');
  const [cssId, setCssId] = useState<number | ''>('');
  const [siId, setSiId] = useState<number | ''>('');

  const [viewQr, setViewQr] = useState<QRCheckpointAdmin | null>(null);
  const [downloading, setDownloading] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const loadAll = useCallback(async () => {
    setBusy('Loading');
    setError(null);
    try {
      const [z, o] = await Promise.all([
        adminQRZones(token),
        adminQROptions(token),
      ]);
      setZonesData(z);
      setOptions(o);
      const zoneNames = ZONE_ORDER.filter((zn) => z.zones.some((zz) => zz.zone === zn));
      if (!zoneNames.includes(selectedZone) && z.zones.length > 0) {
        setSelectedZone(z.zones[0].zone);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load QR management data.');
    } finally {
      setBusy(null);
    }
  }, [token, selectedZone]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const zoneCheckpoints = useMemo(
    () => zonesData.checkpoints.filter((c) => c.zone === selectedZone),
    [zonesData.checkpoints, selectedZone],
  );
  const selectedZoneSummary = zonesData.zones.find((z) => z.zone === selectedZone);

  const zoneStreets = useMemo(
    () => (options?.streets || []).filter((s) => s.zone === selectedZone),
    [options, selectedZone],
  );
  const zoneWards = useMemo(
    () => Array.from(new Set(zoneStreets.map((s) => s.ward))),
    [zoneStreets],
  );
  const streetsForWard = useMemo(
    () => zoneStreets.filter((s) => !ward || s.ward === ward),
    [zoneStreets, ward],
  );

  const handleZoneChange = (zone: string) => {
    setSelectedZone(zone);
    const firstStreet = (options?.streets || []).find((s) => s.zone === zone);
    setWard(firstStreet?.ward || '');
    setStreetId(firstStreet?.id ?? '');
  };

  const resetForm = () => {
    setWard('');
    setStreetId('');
    setHouseholds('100');
    setWorkerId('');
    setSsId('');
    setCssId('');
    setSiId('');
  };

  const handleGenerateSingle = async () => {
    if (!streetId) {
      setError('Please select a street for the checkpoint.');
      return;
    }
    const street = (options?.streets || []).find((s) => s.id === Number(streetId));
    const pickStaff = (id: number | '', role: 'SI' | 'SS' | 'CSS') => {
      const item = (options?.staff?.[role] || []).find((s) => s.id === Number(id));
      return item ? { name: item.staffName, contact: item.staffPhone || null } : { name: null, contact: null };
    };
    const si = pickStaff(siId, 'SI');
    const ss = pickStaff(ssId, 'SS');
    const css = pickStaff(cssId, 'CSS');

    const payload: QRGenerateSinglePayload = {
      zone: selectedZone,
      ward: street?.ward || ward || '',
      streetId: Number(streetId),
      households: Number(households) || 0,
      workerId: workerId === '' ? null : Number(workerId),
      siName: si.name,
      siContact: si.contact,
      ssName: ss.name,
      ssContact: ss.contact,
      cssName: css.name,
      cssContact: css.contact,
    };
    setBusy('Creating checkpoint');
    setError(null);
    try {
      const res = await adminQRGenerateSingle(token, payload);
      setZonesData((prev) => ({
        ...prev,
        checkpoints: [...prev.checkpoints, ...res.checkpoints],
        zones: prev.zones.map((z) =>
          z.zone === selectedZone
            ? { ...z, checkpoints: z.checkpoints + res.checkpoints.length, generatedQrs: [...z.generatedQrs, ...res.checkpoints.map((c) => c.qrId)] }
            : z,
        ),
      }));
      setViewQr(res.checkpoints[0] || null);
      resetForm();
      showToast(res.message || `Checkpoint created and QR generated.`);
    } catch (e: any) {
      setError(e?.message || 'Failed to create checkpoint.');
    } finally {
      setBusy(null);
    }
  };

  const handleGenerateFive = async () => {
    setBusy('Generating 5 QR codes');
    setError(null);
    try {
      const res = await adminQRGenerateZone(token, selectedZone);
      setZonesData((prev) => ({
        ...prev,
        checkpoints: [...prev.checkpoints, ...res.checkpoints],
        zones: prev.zones.map((z) =>
          z.zone === selectedZone
            ? { ...z, checkpoints: z.checkpoints + res.checkpoints.length, generatedQrs: [...z.generatedQrs, ...res.checkpoints.map((c) => c.qrId)] }
            : z,
        ),
      }));
      showToast(
        `${res.message} ${res.duplicateQrs?.length ? `(already present: ${res.duplicateQrs.join(', ')})` : ''}`,
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to generate zone QR codes.');
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    setError(null);
    try {
      const blob = await adminQRDownloadAll(token, selectedZone);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SWM-QR-Codes-${selectedZoneSummary?.zoneCode || selectedZone}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(`ZIP downloaded for ${selectedZone}.`);
    } catch (e: any) {
      setError(e?.message || 'Failed to download ZIP.');
    } finally {
      setDownloading(false);
    }
  };

  const staffName = (c: QRCheckpointAdmin) =>
    [c.workerName ? `${c.workerName} (Worker)` : null, c.ssName ? `${c.ssName} (SS)` : null, c.cssName ? `${c.cssName} (CSS)` : null, c.siName ? `${c.siName} (SI)` : null].filter(Boolean).join(', ') || 'Not assigned';

  const inputCls =
    'w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-[12px] uppercase tracking-wide font-bold text-emerald-900 mb-1';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-900 text-white rounded-2xl p-5 border border-emerald-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <QrCode className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black">QR Checkpoint Management</h2>
            <p className="text-xs text-emerald-200 font-medium mt-0.5">
              Auto-generate scannable checkpoint QR codes for every zone, ward and street
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadAll}
            disabled={busy === 'Loading'}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow border border-emerald-500 disabled:opacity-60 inline-flex items-center space-x-1.5"
          >
            {busy === 'Loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={downloading || zoneCheckpoints.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow border border-emerald-400 disabled:opacity-60 inline-flex items-center space-x-1.5"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Download All (ZIP)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-xs font-bold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Zone selector chips */}
      <div className="flex flex-wrap gap-2">
        {zonesData.zones.map((z) => (
          <button
            key={z.zone}
            onClick={() => handleZoneChange(z.zone)}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-black transition shadow-sm ${
              selectedZone === z.zone
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-emerald-200'
                : 'bg-white text-emerald-900 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <span className="font-mono mr-1.5 opacity-80">{z.zoneCode}</span>
            {z.zone}
            <span className={`ml-2 text-[12px] px-1.5 py-0.5 rounded-full ${selectedZone === z.zone ? 'bg-white/20' : 'bg-emerald-50 text-emerald-800'}`}>
              {z.generatedQrs.length} QR
            </span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Create checkpoint form */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 h-fit">
          <div className="flex items-center space-x-2 mb-4">
            <Plus className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-black text-slate-900">Create Checkpoint &amp; Generate QR</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Zone</label>
              <select value={selectedZone} onChange={(e) => handleZoneChange(e.target.value)} className={inputCls} disabled={busy !== null}>
                {zonesData.zones.map((z) => (
                  <option key={z.zone} value={z.zone}>{z.zone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ward</label>
              <select value={ward} onChange={(e) => setWard(e.target.value)} className={inputCls} disabled={busy !== null}>
                <option value="">Select ward</option>
                {zoneWards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Street</label>
              <select value={streetId} onChange={(e) => setStreetId(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} disabled={busy !== null}>
                <option value="">Select street</option>
                {streetsForWard.map((s) => (
                  <option key={s.id} value={s.id}>{s.streetName}{s.area ? ` (${s.area})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Household Count</label>
              <input type="number" min={0} value={households} onChange={(e) => setHouseholds(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Assign Worker</label>
              <select value={workerId} onChange={(e) => setWorkerId(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} disabled={busy !== null}>
                <option value="">No worker</option>
                {options?.workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.workerName} ({w.workerCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Assign SS (Sanitary Supervisor)</label>
              <select value={ssId} onChange={(e) => setSsId(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} disabled={busy !== null}>
                <option value="">No SS</option>
                {options?.staff.SS.map((s) => (
                  <option key={s.id} value={s.id}>{s.staffName} ({s.staffCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Assign CSS (Chief Sanitary Supervisor)</label>
              <select value={cssId} onChange={(e) => setCssId(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} disabled={busy !== null}>
                <option value="">No CSS</option>
                {options?.staff.CSS.map((s) => (
                  <option key={s.id} value={s.id}>{s.staffName} ({s.staffCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Assign SI (Sanitary Inspector)</label>
              <select value={siId} onChange={(e) => setSiId(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} disabled={busy !== null}>
                <option value="">No SI</option>
                {options?.staff.SI.map((s) => (
                  <option key={s.id} value={s.id}>{s.staffName} ({s.staffCode})</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerateSingle}
              disabled={busy !== null}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-3 rounded-xl shadow-lg transition disabled:opacity-60 inline-flex items-center justify-center space-x-2"
            >
              {busy === 'Creating checkpoint' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>Create Checkpoint</span>
            </button>
            <button
              onClick={handleGenerateFive}
              disabled={busy !== null}
              className="w-full bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-400 text-emerald-800 text-xs font-black py-3 rounded-xl transition disabled:opacity-60 inline-flex items-center justify-center space-x-2"
            >
              {busy === 'Generating 5 QR codes' ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              <span>Generate 5 QR Codes ({scanPrefixFor(selectedZone)}-SCAN1..05)</span>
            </button>
          </div>
        </div>

        {/* Right: checkpoint inventory for the selected zone */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>{selectedZone} Checkpoints</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                {selectedZoneSummary?.generatedQrs.length || 0} QR codes generated
                {selectedZoneSummary ? ` · ${selectedZoneSummary.streets} streets` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedZoneSummary?.generatedQrs.map((id) => (
                <span key={id} className="font-mono text-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-1 rounded-lg">
                  {id}
                </span>
              ))}
            </div>
          </div>

          {zoneCheckpoints.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-2xl">
              <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">No checkpoints yet for {selectedZone}</p>
              <p className="text-xs text-slate-400 mt-1">Use the form to create one, or press &quot;Generate 5 QR Codes&quot;.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
              {zoneCheckpoints.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded-2xl p-3 bg-white hover:border-emerald-300 transition shadow-sm">
                  <div className="flex items-start space-x-3">
                    <img
                      src={qrImageUrl(c.qrId)}
                      alt={`QR ${c.qrId}`}
                      className="w-20 h-20 rounded-xl border border-slate-200 bg-white object-contain flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-black text-emerald-800">{c.qrId}</span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-600 font-medium">
                        <div className="flex items-center space-x-1"><Home className="w-3 h-3 text-emerald-600" /><span>{c.streetName} · {c.ward}</span></div>
                        <div className="flex items-center space-x-1"><Users className="w-3 h-3 text-emerald-600" /><span className="truncate">{staffName(c)}</span></div>
                        <div className="font-mono text-slate-500">Checkpoint #{String(c.checkpointNumber).padStart(2, '0')} · {c.households} households</div>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-2">
                        <button onClick={() => setViewQr(c)} className="inline-flex items-center space-x-1 bg-emerald-700 text-white text-[12px] font-black px-2.5 py-1.5 rounded-lg hover:bg-emerald-600 transition">
                          <Eye className="w-3 h-3" /> View QR
                        </button>
                        <a
                          href={qrImageDownloadUrl(c.qrId)}
                          download={`${c.qrId}.png`}
                          className="inline-flex items-center space-x-1 bg-white border border-slate-300 text-slate-700 text-[12px] font-black px-2.5 py-1.5 rounded-lg hover:border-emerald-300 transition"
                        >
                          <Download className="w-3 h-3" /> Download
                        </a>
                        <button onClick={() => setViewQr(c)} className="inline-flex items-center space-x-1 bg-white border border-slate-300 text-slate-700 text-[12px] font-black px-2.5 py-1.5 rounded-lg hover:border-emerald-300 transition">
                          <Printer className="w-3 h-3" /> Print
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Print-only label sheet for the selected checkpoint */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .qr-label-sheet, .qr-label-sheet * { visibility: visible; }
          .qr-label-sheet { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: white; }
        }
      `}</style>

      {/* Full QR view / printable label modal */}
      {viewQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">Checkpoint QR — {viewQr.qrId}</h3>
              </div>
              <button onClick={() => setViewQr(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1">×</button>
            </div>
            <div className="p-5">
              {/* The printable label */}
              <div className="qr-label-sheet border-2 border-emerald-900 rounded-2xl p-4 bg-white text-center">
                <div className="mx-auto w-12 h-12 rounded-full border-[2.5px] border-[#F59E0B] bg-white p-0.5 flex items-center justify-center overflow-hidden mb-2">
                  <img
                    src={ccmcLogo}
                    alt="Coimbatore City Municipal Corporation Logo"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      if (e.currentTarget.src !== ccmcFallbackLogo) e.currentTarget.src = ccmcFallbackLogo;
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[12px] font-black text-emerald-800 uppercase tracking-widest">SWM / CCMC</div>
                <div className="text-xs font-extrabold text-slate-900">Coimbatore City Municipal Corporation</div>
                <div className="text-[11px] text-slate-500 font-semibold">Smart Solid Waste Management</div>
                <div className="my-3 mx-auto w-fit p-2 border border-slate-300 rounded-xl bg-white">
                  <img src={qrImageUrl(viewQr.qrId, 20)} alt={`QR ${viewQr.qrId}`} className="w-48 h-48 object-contain" />
                </div>
                <div className="space-y-1 text-[11px] font-bold text-slate-800">
                  <div>Zone: <span className="font-mono">{viewQr.zone}</span></div>
                  <div>Ward: <span className="font-mono">{viewQr.ward}</span></div>
                  <div>Street: <span className="font-mono">{viewQr.streetName}</span></div>
                  <div>Checkpoint: <span className="font-mono">#{String(viewQr.checkpointNumber).padStart(2, '0')}</span></div>
                  <div>QR ID: <span className="font-mono font-black text-emerald-800">{viewQr.qrId}</span></div>
                </div>
                <div className="mt-3 text-[11px] font-bold text-emerald-800 uppercase tracking-wider border-t border-slate-200 pt-2">
                  Scan to record waste collection
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <a
                  href={qrImageDownloadUrl(viewQr.qrId, 20)}
                  download={`${viewQr.qrId}.png`}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2.5 rounded-xl transition"
                >
                  <Download className="w-4 h-4" /> Download QR
                </a>
                <button
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-white border-2 border-emerald-700 text-emerald-800 text-xs font-black py-2.5 rounded-xl hover:bg-emerald-50 transition"
                >
                  <Printer className="w-4 h-4" /> Print Label
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-4 z-[60] bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center space-x-2 animate-bounce font-bold text-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-300" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default QRCheckpointManagementView;