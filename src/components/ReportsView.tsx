import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Layers,
  MapPin,
  Users,
  Truck,
  Download,
  Printer,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  FileDown,
  Phone,
  Bell,
  ChevronDown,
  Route,
  ShieldCheck,
  Activity,
  Check,
  AlertTriangle,
  Radio,
  ExternalLink,
  Map,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ReportType,
  ZoneName,
  CollectionRecord,
  DailyReportSummary,
  WorkerReportItem,
  VehicleReportItem,
  StreetReportItem,
  ZoneSummary,
} from '../types';
import {
  INITIAL_DAILY_REPORT_SUMMARY,
  MOCK_WORKER_REPORTS,
  MOCK_VEHICLE_REPORTS,
  MOCK_STREET_REPORTS,
  MOCK_MONTHLY_SUMMARIES,
} from '../data/reportsData';
import {
  getVehicleReportItems,
  VEHICLE_ASSIGNMENT_EVENT,
} from '../utils/vehicleAssignmentStorage';

import { 
  reportsIcon,
  vehicleAssignmentIcon,
  vehicleAssignmentFallbackIcon
} from '../constants/branding';

const REPORTS_ICON_URL = reportsIcon;
const VEHICLE_ASSIGNMENT_ICON_URL = vehicleAssignmentIcon;
import ccmcLogo from '../assets/ccmc_logo.jpg';
import cmPhoto from '../assets/cm_stalin.jpg';

interface ReportsViewProps {
  records: CollectionRecord[];
  zoneSummaries: ZoneSummary[];
  onInspectRecord: (record: CollectionRecord) => void;
  onNavigateToLiveTracking?: (zone?: string) => void;
  onShowToast: (msg: string) => void;
  lang?: 'en' | 'ta';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  zoneSummaries,
  onInspectRecord,
  onNavigateToLiveTracking,
  onShowToast,
  lang = 'en',
}) => {
  const [activeReportType, setActiveReportType] = useState<ReportType>('vehicle-assignment');
  const [selectedDate, setSelectedDate] = useState<string>('2026-05-13');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-05');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');
  const [vehicleViewMode, setVehicleViewMode] = useState<'table' | 'cards' | 'ward-matrix'>('table');
  const [dailyViewPeriod, setDailyViewPeriod] = useState<'daily' | 'monthly'>('daily');
  const [dailyStatusFilter, setDailyStatusFilter] = useState<'all' | 'Collected' | 'Not Collected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [vehicleReports, setVehicleReports] = useState<VehicleReportItem[]>(() => getVehicleReportItems());

  useEffect(() => {
    const handleUpdate = () => {
      setVehicleReports(getVehicleReportItems());
    };
    window.addEventListener(VEHICLE_ASSIGNMENT_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(VEHICLE_ASSIGNMENT_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

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
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Trigger report generation animation
  const handleGenerateReport = (type: ReportType) => {
    setIsGenerating(true);
    setActiveReportType(type);
    setTimeout(() => {
      setIsGenerating(false);
      onShowToast(`Generated official ${getReportTitle(type)}.`);
    }, 350);
  };

  const getReportTitle = (type: ReportType): string => {
    switch (type) {
      case 'vehicle-assignment':
        return 'Vehicle Assigned Ward List & Fleet Details';
      case 'daily':
        return 'Daily Collection Report';
      case 'zone':
        return 'Zone-wise Report';
      case 'street':
        return 'Street-wise Report';
      case 'worker':
        return 'Worker Report';
      case 'vehicle':
        return 'Vehicle Performance Report';
      default:
        return 'Municipal Report';
    }
  };

  // Helper to extract exportable tabular data (for Excel, CSV, PDF)
  const getExportData = (forPDF = false) => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReportType === 'vehicle-assignment' || activeReportType === 'vehicle') {
      if (forPDF) {
        headers = [
          'S.No',
          'Vehicle No',
          'Type',
          'Zone',
          'Ward',
          'Assigned Route',
          'Driver Name',
          'Driver Contact',
          'Target',
          'Covered',
          'Cov %',
          'KM',
          'Trips',
          'GPS Status',
          'Status',
        ];
        rows = filteredVehicleAssignmentReports.map((v, idx) => {
          const target = v.targetHouseholds || 250;
          const covered = v.coveredHouseholds || 230;
          const pct = Math.round((covered / target) * 100);
          return [
            idx + 1,
            v.vehicleNo,
            v.type,
            v.zone,
            v.ward,
            (v.assignedStreets || []).slice(0, 2).join(', '),
            v.driverName,
            v.driverPhone,
            target,
            covered,
            `${pct}%`,
            v.distanceCoveredKm,
            v.tripsToDumpYard,
            v.gpsStatus || 'GPS Active',
            v.status,
          ];
        });
      } else {
        headers = [
          'S.No',
          'Vehicle Plate No',
          'Vehicle Type',
          'Capacity',
          'Zone',
          'Primary Ward',
          'All Assigned Wards',
          'Assigned Streets / Route',
          'Driver / Leader Name',
          'Driver Contact',
          'Shift Timing',
          'Target Houses',
          'Covered Houses',
          'Coverage %',
          'Distance (km)',
          'Vellalore Trips',
          'GPS Tracking Status',
          'Operational Status',
        ];
        rows = filteredVehicleAssignmentReports.map((v, idx) => {
          const target = v.targetHouseholds || 250;
          const covered = v.coveredHouseholds || 230;
          const pct = Math.round((covered / target) * 100);
          return [
            idx + 1,
            v.vehicleNo,
            v.type,
            v.capacity || 'Standard',
            v.zone,
            v.ward,
            (v.assignedWards || [v.ward]).join(', '),
            (v.assignedStreets || []).join(' | '),
            v.driverName,
            v.driverPhone,
            v.shiftTiming || '06:30 AM - 02:30 PM',
            target,
            covered,
            `${pct}%`,
            v.distanceCoveredKm,
            v.tripsToDumpYard,
            v.gpsStatus || 'GPS Active',
            v.status,
          ];
        });
      }
    } else if (activeReportType === 'daily' || activeReportType === 'street') {
      headers = ['S.No', 'Date', 'Time', 'Zone', 'Ward', 'Street Name', 'Assigned Worker', 'Vehicle Plate', 'Status', 'Missed Reason'];
      rows = filteredStreetReports.map((s, i) => [
        i + 1,
        selectedDate,
        s.timeCompleted || 'Pending',
        s.zone,
        s.ward,
        s.streetName,
        s.workerName,
        s.vehicleNo,
        s.status,
        s.reasonIfNotCollected || 'N/A',
      ]);
    } else if (activeReportType === 'zone') {
      if (forPDF) {
        headers = ['S.No', 'Zone Name', 'Total Locations', 'Collected Points', 'Pending Points', 'Coverage %'];
        rows = zoneSummaries.map((z, idx) => [
          idx + 1,
          z.zone,
          z.totalLocations,
          z.collectedCount,
          z.notCollectedCount,
          `${z.coveragePercentage}%`,
        ]);
      } else {
        headers = ['Zone', 'Total Locations', 'Collected Points', 'Pending Points', 'Coverage %'];
        rows = zoneSummaries.map((z) => [
          z.zone,
          z.totalLocations,
          z.collectedCount,
          z.notCollectedCount,
          `${z.coveragePercentage}%`,
        ]);
      }
    } else if (activeReportType === 'worker') {
      if (forPDF) {
        headers = [
          'S.No',
          'Worker ID',
          'Sanitary Worker Name',
          'Worker Mobile',
          'Zone',
          'Ward No',
          'Assigned Route',
          'Target',
          'Done',
          'Eff %',
          'SI Name',
          'SI Mobile',
          'Shift Start',
          'Status',
        ];
        rows = filteredWorkerReports.map((w, idx) => [
          idx + 1,
          w.id,
          w.name,
          w.phone,
          w.zone,
          w.ward,
          w.assignedRoute,
          w.targetHouses,
          w.completedHouses,
          `${w.efficiencyPercent}%`,
          w.siName,
          w.siPhone || 'N/A',
          w.shiftStartTime,
          w.completedHouses >= w.targetHouses ? 'Completed' : w.completedHouses > 0 ? 'In Progress' : 'Pending',
        ]);
      } else {
        headers = [
          'S.No',
          'Worker ID',
          'Sanitary Worker Name',
          'Worker Mobile No',
          'Zone',
          'Ward No',
          'Assigned Route',
          'Target Houses',
          'Completed Houses',
          'Efficiency %',
          'SI Name',
          'SI Phone Number',
          'SS Name',
          'SS Phone Number',
          'CSS Name',
          'CSS Phone Number',
          'Shift Start Time',
          'Hours on Field',
          'Status',
        ];
        rows = filteredWorkerReports.map((w, idx) => [
          idx + 1,
          w.id,
          w.name,
          w.phone,
          w.zone,
          w.ward,
          w.assignedRoute,
          w.targetHouses,
          w.completedHouses,
          `${w.efficiencyPercent}%`,
          w.siName,
          w.siPhone || 'N/A',
          w.ssName,
          w.ssPhone || 'N/A',
          w.cssName,
          w.cssPhone || 'N/A',
          w.shiftStartTime,
          `${w.hoursOnField} hrs`,
          w.completedHouses >= w.targetHouses ? 'Completed' : w.completedHouses > 0 ? 'In Progress' : 'Pending',
        ]);
      }
    }
    return { headers, rows };
  };

  // Helper for Exporting Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const { headers, rows } = getExportData();
      const reportTitle = getReportTitle(activeReportType);
      const periodText = dailyViewPeriod === 'monthly' && activeReportType === 'daily' ? `Month: ${selectedMonth}` : `Date: ${selectedDate}`;

      // Build Sheet Data with official CCMC Header metadata
      const wsData: (string | number)[][] = [
        ['COIMBATORE CITY MUNICIPAL CORPORATION (CCMC)'],
        ['Solid Waste Management Directorate - Smart ICCC Monitoring System'],
        [`Report: ${reportTitle.toUpperCase()}`],
        [`Period: ${periodText} | Zone Filter: ${selectedZone} | Status Filter: ${dailyStatusFilter}`],
        [`Generated On: ${new Date().toLocaleString()} | Reference: CCMC/SWM/${new Date().getFullYear()}/${activeReportType.toUpperCase()}`],
        [], // empty row separator
        headers,
        ...rows,
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto-fit column widths
      const colWidths = headers.map((h, colIndex) => {
        let maxLen = h.length;
        rows.forEach((r) => {
          const val = r[colIndex] !== undefined && r[colIndex] !== null ? String(r[colIndex]) : '';
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
      });
      ws['!cols'] = colWidths;

      const sheetName = `${activeReportType.slice(0, 20).toUpperCase()} Report`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const filename = `CCMC_${activeReportType}_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      onShowToast(`Exported Excel: ${filename}`);
    } catch (err) {
      console.error('Excel Export Error:', err);
      onShowToast('Failed to export Excel file. Please try again.');
    }
  };

  // Helper to load and clip Image to Circular Canvas for jsPDF (100% cross-browser reliable)
  const loadCircularImageCanvas = async (
    imageSrc: string,
    borderColor: string = '#F59E0B',
    borderWidth: number = 3,
    bgColor: string = '#FFFFFF'
  ): Promise<{ canvas: HTMLCanvasElement | null; dataUri: string | null }> => {
    try {
      // 1. Fetch asset blob and convert to pure base64 data URI first
      let dataUri = imageSrc;
      if (!imageSrc.startsWith('data:')) {
        try {
          const res = await fetch(imageSrc);
          const blob = await res.blob();
          dataUri = await new Promise<string>((resolveUri) => {
            const reader = new FileReader();
            reader.onloadend = () => resolveUri(reader.result as string);
            reader.onerror = () => resolveUri(imageSrc);
            reader.readAsDataURL(blob);
          });
        } catch (fetchErr) {
          console.warn('Fetch image failed, using raw src:', fetchErr);
        }
      }

      // 2. Render circular image on canvas
      const canvas = await new Promise<HTMLCanvasElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const size = 256;
            const cvs = document.createElement('canvas');
            cvs.width = size;
            cvs.height = size;
            const ctx = cvs.getContext('2d');
            if (!ctx) return resolve(null);

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.clearRect(0, 0, size, size);

            // Background Fill
            if (bgColor) {
              ctx.fillStyle = bgColor;
              ctx.beginPath();
              ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
              ctx.fill();
            }

            // Clip Circle
            ctx.save();
            ctx.beginPath();
            const pad = borderWidth * 2;
            ctx.arc(size / 2, size / 2, size / 2 - pad, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            const rawW = img.naturalWidth || img.width || size;
            const rawH = img.naturalHeight || img.height || size;
            const minDim = Math.min(rawW, rawH);
            const sx = (rawW - minDim) / 2;
            const sy = (rawH - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, pad, pad, size - pad * 2, size - pad * 2);
            ctx.restore();

            // Border Circle
            if (borderColor && borderWidth > 0) {
              ctx.strokeStyle = borderColor;
              ctx.lineWidth = borderWidth * 2;
              ctx.beginPath();
              ctx.arc(size / 2, size / 2, size / 2 - pad, 0, Math.PI * 2);
              ctx.stroke();
            }

            resolve(cvs);
          } catch (e) {
            console.error('Canvas render error:', e);
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = dataUri;
      });

      return { canvas, dataUri };
    } catch {
      return { canvas: null, dataUri: imageSrc };
    }
  };

  // Helper for Exporting PDF (.pdf) with Official CCMC Header & High-Legibility Grid Boxes
  const handleExportPDF = async () => {
    try {
      const { headers, rows } = getExportData(true);
      const reportTitle = getReportTitle(activeReportType);
      const isLandscape = activeReportType === 'worker' || activeReportType === 'street' || activeReportType === 'daily' || activeReportType === 'vehicle' || activeReportType === 'vehicle-assignment';
      
      const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Preload pristine circular canvas images & raw base64 data URIs
      const [cmImgData, ccmcImgData] = await Promise.all([
        loadCircularImageCanvas(cmPhoto, '#F59E0B', 3, '#1E7A38'),
        loadCircularImageCanvas(ccmcLogo, '#F59E0B', 3, '#FFFFFF'),
      ]);

      const drawOfficialHeader = () => {
        // --- 1. Top Main Green Bar (#1E7A38) ---
        doc.setFillColor(30, 122, 56);
        doc.rect(0, 0, pageWidth, 22, 'F');
        doc.setDrawColor(22, 101, 52);
        doc.setLineWidth(0.5);
        doc.line(0, 22, pageWidth, 22);

        // CM Stalin Photo (Large 15mm x 15mm Circular Image or Direct Base64 Image)
        if (cmImgData.canvas) {
          try {
            doc.addImage(cmImgData.canvas, 'PNG', 6, 3.5, 15, 15);
          } catch (e) {
            console.error('Failed to add CM canvas:', e);
          }
        } else if (cmImgData.dataUri && cmImgData.dataUri.startsWith('data:image')) {
          try {
            doc.addImage(cmImgData.dataUri, 'JPEG', 6, 3.5, 15, 15);
          } catch {}
        } else {
          doc.setFillColor(245, 158, 11);
          doc.circle(13.5, 11, 7.5, 'F');
          doc.setFillColor(22, 101, 52);
          doc.circle(13.5, 11, 6.8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text('TN', 13.5, 13, { align: 'center' });
        }

        // CCMC Logo Emblem (Large 15mm x 15mm Circular Image or Direct Base64 Image)
        if (ccmcImgData.canvas) {
          try {
            doc.addImage(ccmcImgData.canvas, 'PNG', 23, 3.5, 15, 15);
          } catch (e) {
            console.error('Failed to add CCMC canvas:', e);
          }
        } else if (ccmcImgData.dataUri && ccmcImgData.dataUri.startsWith('data:image')) {
          try {
            doc.addImage(ccmcImgData.dataUri, 'JPEG', 23, 3.5, 15, 15);
          } catch {}
        } else {
          doc.setFillColor(255, 255, 255);
          doc.circle(30.5, 11, 7.5, 'F');
          doc.setFillColor(30, 122, 56);
          doc.circle(30.5, 11, 6.8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.text('CCMC', 30.5, 13, { align: 'center' });
        }

        // Main Title & Subtitle (Prominent & Clear)
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Coimbatore City Municipal Corporation', 41, 10);

        doc.setTextColor(167, 243, 208); // Emerald-200
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text("ADMIN REVIEW DASHBOARD • SOLID WASTE MANAGEMENT DIRECTORATE", 41, 16.5);

        // Right-side Status Elements
        const rightOffset = isLandscape ? pageWidth - 80 : pageWidth - 72;

        // Notification Bell Badge
        doc.setFillColor(22, 101, 52);
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.25);
        doc.circle(rightOffset + 6, 11, 3.8, 'FD');
        doc.setFillColor(225, 29, 72);
        doc.circle(rightOffset + 9, 8, 2.2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text('6', rightOffset + 9, 9.5, { align: 'center' });

        // ICCC Live Status Pill
        doc.setFillColor(22, 101, 52);
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.25);
        doc.roundedRect(rightOffset + 14, 7.5, 20, 7.5, 3.5, 3.5, 'FD');
        doc.setFillColor(52, 211, 153);
        doc.circle(rightOffset + 18, 11.2, 1.3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text('ICCC Live', rightOffset + 21, 12.2);

        // Admin Console Profile Pill
        doc.setFillColor(17, 59, 34);
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.25);
        const commPillW = isLandscape ? 46 : 40;
        doc.roundedRect(rightOffset + 36, 6.5, commPillW, 9.5, 4.5, 4.5, 'FD');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5.8);
        doc.setFont('helvetica', 'bold');
        doc.text('Administrative Directorate', rightOffset + 39, 10.2);

        doc.setTextColor(167, 243, 208);
        doc.setFontSize(4.8);
        doc.setFont('helvetica', 'bold');
        doc.text('ADMIN CONSOLE', rightOffset + 39, 14);

        // --- 2. Dark Secondary Ticker Stream Bar (#113B22) ---
        doc.setFillColor(17, 59, 34);
        doc.rect(0, 22, pageWidth, 7, 'F');

        // Green Beacon Dot
        doc.setFillColor(16, 185, 129);
        doc.circle(7, 25.5, 1.1, 'F');

        // Left Stream Text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Active Municipal Data Stream', 9.8, 26.8);

        doc.setTextColor(52, 211, 153);
        doc.text('|', 50, 26.8);

        doc.setTextColor(220, 245, 230);
        doc.setFont('helvetica', 'normal');
        doc.text(currentTime || '14 August 2026 • Friday 4:26 pm', 53, 26.8);

        // Right Stream Summary
        const tickerRightX = pageWidth - 70;
        doc.setTextColor(167, 243, 208);
        doc.setFontSize(6.5);
        doc.text('5 Zones   •   100 Wards   •   ', tickerRightX, 26.8);

        doc.setTextColor(251, 191, 36);
        doc.setFont('helvetica', 'bold');
        doc.text('248 GPS Compactors Online', tickerRightX + 35, 26.8);

        // --- 3. Report Metadata Ribbon Bar (#F0FDF4) ---
        doc.setFillColor(240, 253, 244);
        doc.rect(0, 29, pageWidth, 7.5, 'F');
        doc.setDrawColor(167, 243, 208);
        doc.setLineWidth(0.4);
        doc.line(0, 36.5, pageWidth, 36.5);

        const periodText = dailyViewPeriod === 'monthly' && activeReportType === 'daily' ? `Month: ${selectedMonth}` : `Date: ${selectedDate}`;
        doc.setTextColor(6, 78, 59);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `Ref: CCMC/SWM/${new Date().getFullYear()}/${activeReportType.toUpperCase()}  |  Zone: ${selectedZone}  |  Period: ${periodText}`,
          6,
          34
        );

        doc.setTextColor(4, 120, 87);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Solid Waste Management Directorate • SWM Audit Verified', pageWidth - 6, 34, { align: 'right' });
      };

      // Draw initial page header
      drawOfficialHeader();

      // Determine dynamic typography & box sizing based on column density
      const numCols = headers.length;
      let headerFontSize = 10;
      let bodyFontSize = 9;
      let cellPad = 3.5;
      let minRowHeight = 9.5;

      if (numCols <= 6) {
        headerFontSize = 11;
        bodyFontSize = 10;
        cellPad = 4.5;
        minRowHeight = 11;
      } else if (numCols <= 10) {
        headerFontSize = 10;
        bodyFontSize = 9;
        cellPad = 4;
        minRowHeight = 10;
      } else {
        headerFontSize = 8.5;
        bodyFontSize = 8;
        cellPad = 3.2;
        minRowHeight = 9;
      }

      // Configure column styles without rigid cell widths so autoTable stretches 100% full page width
      let columnStylesConfig: Record<number, any> = {};

      if (activeReportType === 'vehicle-assignment' || activeReportType === 'vehicle') {
        columnStylesConfig = {
          0: { halign: 'center' }, // S.No
          1: { fontStyle: 'bold' }, // Vehicle No
          2: {}, // Type
          3: {}, // Zone
          4: {}, // Ward
          5: {}, // Route
          6: {}, // Driver Name
          7: {}, // Contact
          8: { halign: 'right' }, // Target
          9: { halign: 'right' }, // Covered
          10: { halign: 'right', fontStyle: 'bold' }, // Cov %
          11: { halign: 'right' }, // KM
          12: { halign: 'center' }, // Trips
          13: { halign: 'center' }, // Status
        };
      } else if (activeReportType === 'worker') {
        columnStylesConfig = {
          0: { halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { fontStyle: 'bold' },
          3: {},
          4: {},
          5: {},
          6: {},
          7: { halign: 'right' },
          8: { halign: 'right' },
          9: { halign: 'right', fontStyle: 'bold' },
          10: {},
          11: {},
          12: {},
          13: { halign: 'center' },
        };
      } else if (activeReportType === 'daily' || activeReportType === 'street') {
        columnStylesConfig = {
          0: { halign: 'center' },
          1: {},
          2: {},
          3: {},
          4: {},
          5: { fontStyle: 'bold' },
          6: {},
          7: {},
          8: { halign: 'center' },
          9: {},
        };
      } else if (activeReportType === 'zone') {
        columnStylesConfig = {
          0: { halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' },
        };
      }

      // Render Table starting cleanly at Y=38 with 100% full-page width & clean row page-breaks
      autoTable(doc, {
        startY: 38,
        margin: { top: 38, bottom: 15, left: 6, right: 6 },
        tableWidth: 'auto', // Expands table to 100% full printable width across page
        showHead: 'everyPage', // Repeats header bar cleanly on every page
        rowPageBreak: 'avoid', // Moves entire row to next page cleanly if it doesn't fit on current page
        pageBreak: 'auto',
        head: [headers],
        body: rows,
        theme: 'grid',
        tableLineWidth: 0.4,
        tableLineColor: [30, 122, 56],
        columnStyles: columnStylesConfig,
        headStyles: {
          fillColor: [30, 122, 56],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: headerFontSize,
          cellPadding: cellPad,
          halign: 'left',
          valign: 'middle',
          lineWidth: 0.35,
          lineColor: [15, 80, 40],
          overflow: 'linebreak',
        },
        styles: {
          fontSize: bodyFontSize,
          cellPadding: cellPad,
          minCellHeight: minRowHeight,
          textColor: [15, 23, 42], // Deep high-contrast dark text (#0F172A) for max visibility
          lineColor: [160, 174, 192], // Crisp, clearly visible grid lines for every box
          lineWidth: 0.35, // Thick border lines for every grid cell
          overflow: 'linebreak',
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [242, 249, 244],
        },
        didDrawPage: (data) => {
          // Always draw official CCMC header on every page
          drawOfficialHeader();

          // Bottom Footer
          const totalPages = doc.getNumberOfPages();
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(110, 110, 110);
          doc.text(
            `CCMC Smart SWM Command Center • Confidential Municipal Record • Page ${data.pageNumber} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
          );
        },
      });

      const filename = `CCMC_${activeReportType}_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      onShowToast(`Exported PDF: ${filename}`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      onShowToast('Failed to export PDF file. Please try again.');
    }
  };

  // Helper for Exporting CSV
  const handleExportCSV = () => {
    const filename = `CCMC_${activeReportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    const { headers, rows } = getExportData();
    const formattedRows = rows.map((r) => r.map((c) => (typeof c === 'string' && c.includes(',') ? `"${c}"` : `"${c}"`)));
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...formattedRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exported CSV: ${filename}`);
  };

  // Filtered Workers
  const filteredWorkerReports = useMemo(() => {
    return MOCK_WORKER_REPORTS.filter((w) => {
      const matchZone = selectedZone === 'All' || w.zone === selectedZone;
      const matchSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.assignedRoute.toLowerCase().includes(searchTerm.toLowerCase());
      return matchZone && matchSearch;
    });
  }, [selectedZone, searchTerm]);

  // Filtered Vehicles for Assignment & Fleet Reports
  const filteredVehicleAssignmentReports = useMemo(() => {
    return vehicleReports.filter((v) => {
      const matchZone = selectedZone === 'All' || v.zone === selectedZone;
      const matchType =
        selectedVehicleType === 'all' ||
        v.type.toLowerCase() === selectedVehicleType.toLowerCase() ||
        (selectedVehicleType === 'Tata Ace' && v.type.toLowerCase().includes('tata')) ||
        (selectedVehicleType === 'BOV' && v.type.toLowerCase().includes('bov')) ||
        (selectedVehicleType === 'Push Cart' && v.type.toLowerCase().includes('push')) ||
        (selectedVehicleType === 'OBL-PVT' && v.type.toLowerCase().includes('obl'));
      
      const search = searchTerm.toLowerCase().trim();
      if (!search) return matchZone && matchType;

      const inPlate = v.vehicleNo.toLowerCase().includes(search);
      const inType = v.type.toLowerCase().includes(search);
      const inDriver = v.driverName.toLowerCase().includes(search);
      const inPhone = v.driverPhone.toLowerCase().includes(search);
      const inWard = v.ward.toLowerCase().includes(search);
      const inAssignedWards = v.assignedWards && v.assignedWards.some((w) => w.toLowerCase().includes(search));
      const inAssignedStreets = v.assignedStreets && v.assignedStreets.some((s) => s.toLowerCase().includes(search));
      const inGps = v.gpsStatus && v.gpsStatus.toLowerCase().includes(search);

      return matchZone && matchType && (inPlate || inType || inDriver || inPhone || inWard || inAssignedWards || inAssignedStreets || inGps);
    });
  }, [selectedZone, selectedVehicleType, searchTerm]);

  // Filtered Vehicles
  const filteredVehicleReports = useMemo(() => {
    return filteredVehicleAssignmentReports;
  }, [filteredVehicleAssignmentReports]);

  // Filtered Streets / Daily Collection Records
  const filteredStreetReports = useMemo(() => {
    return MOCK_STREET_REPORTS.filter((s) => {
      const matchZone = selectedZone === 'All' || s.zone === selectedZone;
      const matchStatus =
        dailyStatusFilter === 'all' || s.status === dailyStatusFilter;
      const matchSearch =
        s.streetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase());
      return matchZone && matchStatus && matchSearch;
    });
  }, [selectedZone, dailyStatusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-600/50 bg-white p-0.5 flex-shrink-0 shadow-sm flex items-center justify-center">
            <img
              src={REPORTS_ICON_URL}
              alt="Reports"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Municipal Reports Generation Center
              </h1>
              <span className="bg-emerald-100 text-[#1E7A38] text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                Commissioner's Audit Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              Generate, audit, print, and export all Coimbatore City Municipal Corporation waste collection performance records.
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Excel (.xlsx) Download */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download report in Microsoft Excel (.xlsx) format"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Download Excel</span>
          </button>

          {/* PDF (.pdf) Download */}
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download official report in PDF (.pdf) format"
          >
            <FileDown className="w-4 h-4 text-rose-200" />
            <span>Download PDF</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Export raw data in CSV format"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>CSV</span>
          </button>

          {/* Print Report */}
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Print or print-to-PDF via browser dialog"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 6 Report Selector Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Vehicle & Ward Assignment Report */}
        <button
          onClick={() => handleGenerateReport('vehicle-assignment')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeReportType === 'vehicle-assignment'
              ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm ring-2 ring-emerald-400/40'
              : 'bg-white text-gray-700 border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-emerald-300/60 p-0.5 flex items-center justify-center shadow-2xs">
              <img
                src={VEHICLE_ASSIGNMENT_ICON_URL}
                alt="Vehicle Assignment"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== vehicleAssignmentFallbackIcon) {
                    e.currentTarget.src = vehicleAssignmentFallbackIcon;
                  }
                }}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              activeReportType === 'vehicle-assignment' ? 'bg-white text-[#1E7A38]' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              Fleet & Wards
            </span>
          </div>
          <div className="font-extrabold text-xs">Vehicle Assigned Ward</div>
          <p className={`text-[10px] mt-0.5 truncate ${activeReportType === 'vehicle-assignment' ? 'text-emerald-100' : 'text-gray-500'}`}>
            Ward list & vehicle type
          </p>
        </button>

        {/* 2. Daily Collection Report */}
        <button
          onClick={() => handleGenerateReport('daily')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeReportType === 'daily'
              ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Calendar className={`w-5 h-5 ${activeReportType === 'daily' ? 'text-emerald-200' : 'text-emerald-700'}`} />
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeReportType === 'daily' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Daily
            </span>
          </div>
          <div className="font-extrabold text-xs">Daily Collection</div>
          <p className={`text-[10px] mt-0.5 ${activeReportType === 'daily' ? 'text-emerald-100' : 'text-gray-400'}`}>
            Shift & door logs
          </p>
        </button>

        {/* 3. Zone-wise Report */}
        <button
          onClick={() => handleGenerateReport('zone')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeReportType === 'zone'
              ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Layers className={`w-5 h-5 ${activeReportType === 'zone' ? 'text-emerald-200' : 'text-blue-600'}`} />
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeReportType === 'zone' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              5 Zones
            </span>
          </div>
          <div className="font-extrabold text-xs">Zone-wise</div>
          <p className={`text-[10px] mt-0.5 ${activeReportType === 'zone' ? 'text-emerald-100' : 'text-gray-400'}`}>
            Zonal comparison
          </p>
        </button>

        {/* 4. Street-wise Report */}
        <button
          onClick={() => handleGenerateReport('street')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeReportType === 'street'
              ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <MapPin className={`w-5 h-5 ${activeReportType === 'street' ? 'text-emerald-200' : 'text-purple-600'}`} />
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeReportType === 'street' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}>
              Micro
            </span>
          </div>
          <div className="font-extrabold text-xs">Street-wise</div>
          <p className={`text-[10px] mt-0.5 ${activeReportType === 'street' ? 'text-emerald-100' : 'text-gray-400'}`}>
            House RFID audit
          </p>
        </button>

        {/* 5. Worker Report */}
        <button
          onClick={() => handleGenerateReport('worker')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeReportType === 'worker'
              ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Users className={`w-5 h-5 ${activeReportType === 'worker' ? 'text-emerald-200' : 'text-indigo-600'}`} />
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeReportType === 'worker' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              Staff
            </span>
          </div>
          <div className="font-extrabold text-xs">Worker Report</div>
          <p className={`text-[10px] mt-0.5 ${activeReportType === 'worker' ? 'text-emerald-100' : 'text-gray-400'}`}>
            Crew performance
          </p>
        </button>

        {/* 6. Vehicle Performance Report */}
        <button
          onClick={() => handleGenerateReport('vehicle')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeReportType === 'vehicle'
              ? 'bg-[#1E7A38] text-white border-[#1E7A38] shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Activity className={`w-5 h-5 ${activeReportType === 'vehicle' ? 'text-emerald-200' : 'text-teal-600'}`} />
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeReportType === 'vehicle' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
            }`}>
              Trips & Fuel
            </span>
          </div>
          <div className="font-extrabold text-xs">Vehicle Trips</div>
          <p className={`text-[10px] mt-0.5 ${activeReportType === 'vehicle' ? 'text-emerald-100' : 'text-gray-400'}`}>
            Fuel, trips & km
          </p>
        </button>
      </div>

      {/* Filter Parameters Ribbon */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Daily Collection Period Toggle (Daily Report / Monthly Report) */}
          {activeReportType === 'daily' && (
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setDailyViewPeriod('daily')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  dailyViewPeriod === 'daily'
                    ? 'bg-[#1E7A38] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Daily Report
              </button>
              <button
                type="button"
                onClick={() => setDailyViewPeriod('monthly')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  dailyViewPeriod === 'monthly'
                    ? 'bg-[#1E7A38] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly Report
              </button>
            </div>
          )}

          {/* Date Picker (or Month Picker when Monthly is selected) */}
          {activeReportType !== 'vehicle-assignment' && activeReportType !== 'zone' && (
            dailyViewPeriod === 'monthly' && activeReportType === 'daily' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="2026-05">May 2026</option>
                  <option value="2026-04">April 2026</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">Report Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )
          )}

          {/* Zone Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Municipal Zones</option>
              <option value="North Zone">North Zone</option>
              <option value="Central Zone">Central Zone</option>
              <option value="South Zone">South Zone</option>
              <option value="West Zone">West Zone</option>
              <option value="East Zone">East Zone</option>
            </select>
          </div>

          {/* Vehicle Type Filter (for Vehicle Assignment & Vehicle reports) */}
          {(activeReportType === 'vehicle-assignment' || activeReportType === 'vehicle') && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">Vehicle Type:</span>
              <select
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value)}
                className="text-xs font-bold bg-emerald-50/70 border border-emerald-300 rounded-xl px-3 py-1.5 text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Vehicle Types (12)</option>
                <option value="Tata Ace">Tata Ace (Mini Truck)</option>
                <option value="BOV">BOV (Electric Trike)</option>
                <option value="Push Cart">Push Cart (Sanitary)</option>
                <option value="OBL-PVT">OBL-PVT (Heavy Tipper)</option>
              </select>
            </div>
          )}

          {/* Status Filter for Daily Collection */}
          {activeReportType === 'daily' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">Status:</span>
              <select
                value={dailyStatusFilter}
                onChange={(e) => setDailyStatusFilter(e.target.value as 'all' | 'Collected' | 'Not Collected')}
                className="text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="Collected">Collected</option>
                <option value="Not Collected">Not Collected</option>
              </select>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeReportType === 'vehicle-assignment'
                  ? 'Search vehicle plate (e.g. TN 37), type, ward, street, driver...'
                  : `Search ${getReportTitle(activeReportType).toLowerCase()}...`
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Right side View Modes for Vehicle Assignment */}
        <div className="flex items-center gap-2">
          {activeReportType === 'vehicle-assignment' && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setVehicleViewMode('table')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  vehicleViewMode === 'table' ? 'bg-[#1E7A38] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table View
              </button>
              <button
                type="button"
                onClick={() => setVehicleViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  vehicleViewMode === 'cards' ? 'bg-[#1E7A38] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ward Cards
              </button>
              <button
                type="button"
                onClick={() => setVehicleViewMode('ward-matrix')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  vehicleViewMode === 'ward-matrix' ? 'bg-[#1E7A38] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ward Matrix
              </button>
            </div>
          )}

          <button
            onClick={() => handleGenerateReport(activeReportType)}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Official Report Display Canvas */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Printable Official Document Title Banner */}
        <div className="bg-gradient-to-r from-[#1E7A38] to-[#166534] text-white px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {getReportTitle(activeReportType)}
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                Coimbatore City Municipal Corporation • Solid Waste Management Directorate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#113B22]/70 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-200">
              Certified Audit Record
            </span>
          </div>
        </div>

        {/* Report Metadata Sub-Ribbon */}
        <div className="bg-emerald-50/70 border-b border-emerald-200/70 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
          <div className="flex items-center gap-3 flex-wrap font-semibold">
            <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-bold text-[11px]">
              Ref: CCMC/SWM/{new Date().getFullYear()}/{activeReportType.toUpperCase()}
            </span>
            <span>Zone: <strong className="text-emerald-900">{selectedZone}</strong></span>
            <span>•</span>
            <span>Period: <strong className="text-emerald-900">{dailyViewPeriod === 'monthly' && activeReportType === 'daily' ? selectedMonth : selectedDate}</strong></span>
            {activeReportType === 'daily' && (
              <>
                <span>•</span>
                <span>Status Filter: <strong className="text-emerald-900">{dailyStatusFilter}</strong></span>
              </>
            )}
          </div>
          <div className="text-[11px] text-emerald-800 font-medium">
            Solid Waste Management Directorate • SWM Audit Verified
          </div>
        </div>

        {/* ----------------- REPORT VIEW 1: DAILY COLLECTION REPORT (with Monthly & Status Filters) ----------------- */}
        {activeReportType === 'daily' && (
          <div className="p-6 space-y-6">
            {/* KPI Metric Cards - Dynamic according to Daily vs Monthly View */}
            {dailyViewPeriod === 'monthly' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Monthly Tonnage ({MOCK_MONTHLY_SUMMARIES[selectedMonth]?.month || 'May'} {MOCK_MONTHLY_SUMMARIES[selectedMonth]?.year || 2026})
                  </div>
                  <div className="text-2xl font-black text-emerald-950 mt-1">
                    {(MOCK_MONTHLY_SUMMARIES[selectedMonth] || MOCK_MONTHLY_SUMMARIES['2026-05']).totalTonnage.toLocaleString()} MT
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Processed at Vellalore Facility</p>
                </div>

                <div className="p-4 bg-emerald-100/60 rounded-2xl border border-emerald-300">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Avg. Daily Coverage</div>
                  <div className="text-2xl font-black text-[#1E7A38] mt-1">
                    {(MOCK_MONTHLY_SUMMARIES[selectedMonth] || MOCK_MONTHLY_SUMMARIES['2026-05']).avgDailyCoveragePercent}%
                  </div>
                  <p className="text-[11px] text-emerald-800 font-bold mt-0.5">Across 100 Municipal Wards</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Monthly Fleet Trips</div>
                  <div className="text-2xl font-black text-blue-900 mt-1">
                    {(MOCK_MONTHLY_SUMMARIES[selectedMonth] || MOCK_MONTHLY_SUMMARIES['2026-05']).totalFleetTrips.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">Compactor dump runs</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                  <div className="text-xs font-bold text-purple-800 uppercase tracking-wider">Segregation Compliance</div>
                  <div className="text-2xl font-black text-purple-900 mt-1">
                    {(MOCK_MONTHLY_SUMMARIES[selectedMonth] || MOCK_MONTHLY_SUMMARIES['2026-05']).segregationCompliancePercent}%
                  </div>
                  <p className="text-[11px] text-purple-700 mt-0.5">Wet, dry & sanitary separation</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Target Households</div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">{INITIAL_DAILY_REPORT_SUMMARY.totalTargetHouses}</div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Municipal roster points</p>
                </div>

                <div className="p-4 bg-emerald-100/60 rounded-2xl border border-emerald-300">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Covered Today</div>
                  <div className="text-2xl font-black text-[#1E7A38] mt-1">{INITIAL_DAILY_REPORT_SUMMARY.totalCoveredHouses}</div>
                  <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
                    {INITIAL_DAILY_REPORT_SUMMARY.coveragePercentage}% Daily Coverage
                  </p>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Missed / Skipped</div>
                  <div className="text-2xl font-black text-rose-700 mt-1">{INITIAL_DAILY_REPORT_SUMMARY.totalMissedHouses}</div>
                  <p className="text-[11px] text-rose-600 mt-0.5">Dispatched for re-run</p>
                </div>
              </div>
            )}

            {/* Monthly Zone Rankings Leaderboard if Monthly View is selected */}
            {dailyViewPeriod === 'monthly' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span>Monthly Zonal Performance & Tonnage Breakdown</span>
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">
                    Evaluated against Tamil Nadu Municipal benchmarks
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#EAF3ED] text-[#1E7A38] font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-3 text-center">Rank</th>
                        <th className="p-3">Zone Name</th>
                        <th className="p-3 text-right">Performance Score</th>
                        <th className="p-3 text-right">Monthly Tonnage</th>
                        <th className="p-3 text-right">Coverage %</th>
                        <th className="p-3 text-center">Audit Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {(MOCK_MONTHLY_SUMMARIES[selectedMonth] || MOCK_MONTHLY_SUMMARIES['2026-05']).zoneRankings.map(
                        (zr, idx) => (
                          <tr key={zr.zone} className="hover:bg-gray-50">
                            <td className="p-3 text-center font-bold text-gray-500">#{idx + 1}</td>
                            <td className="p-3 font-bold text-gray-900">{zr.zone}</td>
                            <td className="p-3 text-right font-black text-emerald-900">{zr.score} / 100</td>
                            <td className="p-3 text-right font-bold text-gray-800">{zr.tonnage} MT</td>
                            <td className="p-3 text-right font-extrabold text-[#1E7A38]">{zr.coverage}%</td>
                            <td className="p-3 text-center">
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                Grade A
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Collection Street Log Table (Filtered by Collected / Not Collected) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">
                  {dailyViewPeriod === 'monthly' ? 'Aggregated Street Collection Log' : 'Daily Street-by-Street Collection Log'}
                </h3>
                <span className="text-xs text-gray-500">
                  Showing {filteredStreetReports.length} street entries
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#EAF3ED] text-[#1E7A38] font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-3 text-center">S.No</th>
                      <th className="p-3">Ward & Street</th>
                      <th className="p-3">Zone</th>
                      <th className="p-3 text-right">Households</th>
                      <th className="p-3 text-right">Collected</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Worker & Crew</th>
                      <th className="p-3">Vehicle</th>
                      <th className="p-3">Timestamp / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredStreetReports.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-500">
                          No collection records match the selected status ({dailyStatusFilter}) and zone filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStreetReports.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-gray-900">{item.streetName}</div>
                            <div className="text-[11px] text-gray-500">{item.ward}</div>
                          </td>
                          <td className="p-3 font-semibold text-gray-700">{item.zone}</td>
                          <td className="p-3 text-right font-bold">{item.totalHouseholds}</td>
                          <td className="p-3 text-right font-bold text-emerald-800">{item.collectedHouseholds}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                item.status === 'Collected'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-gray-800">{item.workerName}</td>
                          <td className="p-3 font-semibold text-gray-700">{item.vehicleNo}</td>
                          <td className="p-3 text-[11px] text-gray-600">
                            {item.status === 'Collected' ? (
                              <span className="text-emerald-700 font-semibold">Logged {item.timeCompleted}</span>
                            ) : (
                              <span className="text-rose-600 font-semibold">{item.reasonIfNotCollected}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- REPORT VIEW 2: ZONE-WISE REPORT ----------------- */}
        {activeReportType === 'zone' && (
          <div className="p-6 space-y-6">
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#EAF3ED] text-[#1E7A38] font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5 text-center">Zonal Rank</th>
                    <th className="p-3.5">Zone Name</th>
                    <th className="p-3.5 text-right">Total Locations</th>
                    <th className="p-3.5 text-right">Collected Points</th>
                    <th className="p-3.5 text-right">Pending Points</th>
                    <th className="p-3.5">Coverage Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {zoneSummaries.map((z, idx) => (
                    <tr key={z.zone} className="hover:bg-gray-50">
                      <td className="p-3.5 text-center">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#1E7A38] font-black inline-flex items-center justify-center text-xs">
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-gray-900 text-sm">
                        {z.zone}
                      </td>
                      <td className="p-3.5 text-right font-bold text-gray-800">{z.totalLocations}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-800">{z.collectedCount}</td>
                      <td className="p-3.5 text-right font-bold text-rose-700">{z.notCollectedCount}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-28 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#1E7A38] h-full rounded-full transition-all"
                              style={{ width: `${z.coveragePercentage}%` }}
                            ></div>
                          </div>
                          <span className="font-extrabold text-xs text-gray-900">{z.coveragePercentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Zonal Analysis Narrative */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="font-black text-sm text-[#1E7A38] flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>Commissioner's Zonal Assessment</span>
              </div>
              <p className="leading-relaxed">
                <strong>North Zone</strong> leads Coimbatore City Municipal Corporation with 79.30% coverage and lowest delay index. <strong>West Zone</strong> and <strong>Central Zone</strong> require secondary afternoon mini-tipper routing due to narrow commercial market access bottlenecks.
              </p>
            </div>
          </div>
        )}

        {/* ----------------- REPORT VIEW 3: STREET-WISE REPORT ----------------- */}
        {activeReportType === 'street' && (
          <div className="p-6 space-y-6">
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#EAF3ED] text-[#1E7A38] font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-center">Street ID</th>
                    <th className="p-3">Street Name</th>
                    <th className="p-3">Ward</th>
                    <th className="p-3">Zone</th>
                    <th className="p-3 text-right">Households</th>
                    <th className="p-3 text-right">Collected</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Worker Assigned</th>
                    <th className="p-3">Vehicle Plate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredStreetReports.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-3 text-center font-bold text-gray-500">{s.id}</td>
                      <td className="p-3 font-bold text-gray-900">{s.streetName}</td>
                      <td className="p-3 font-semibold text-gray-700">{s.ward}</td>
                      <td className="p-3 text-gray-600">{s.zone}</td>
                      <td className="p-3 text-right font-bold">{s.totalHouseholds}</td>
                      <td className="p-3 text-right font-bold text-emerald-800">{s.collectedHouseholds}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            s.status === 'Collected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-800">{s.workerName}</td>
                      <td className="p-3 font-semibold text-gray-700">{s.vehicleNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------- REPORT VIEW 4: WORKER REPORT ----------------- */}
        {activeReportType === 'worker' && (
          <div className="p-6 space-y-6">
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#EAF3ED] text-[#1E7A38] font-bold border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="p-3 text-center w-12">S.No</th>
                    <th className="p-3">Worker ID</th>
                    <th className="p-3">Sanitary Worker</th>
                    <th className="p-3">Worker Phone</th>
                    <th className="p-3">Zone</th>
                    <th className="p-3">Ward</th>
                    <th className="p-3">Assigned Route</th>
                    <th className="p-3 text-right">Target</th>
                    <th className="p-3 text-right">Completed</th>
                    <th className="p-3 text-center">Efficiency</th>
                    <th className="p-3">Sanitary Inspector (SI & No)</th>
                    <th className="p-3">Sanitary Supervisor (SS & No)</th>
                    <th className="p-3">Chief Supervisor (CSS & No)</th>
                    <th className="p-3 text-center">Shift / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredWorkerReports.map((w, idx) => (
                    <tr key={w.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-gray-700">{w.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#1E7A38] text-sm">{w.name}</div>
                      </td>
                      <td className="p-3">
                        <a
                          href={`tel:${w.phone}`}
                          className="text-xs text-gray-700 font-mono flex items-center gap-1 hover:text-emerald-700 font-semibold"
                          title="Call worker"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{w.phone}</span>
                        </a>
                      </td>
                      <td className="p-3 font-bold text-gray-900">{w.zone}</td>
                      <td className="p-3 font-semibold text-gray-700">{w.ward}</td>
                      <td className="p-3 text-gray-800 font-medium">{w.assignedRoute}</td>
                      <td className="p-3 text-right font-bold text-gray-700">{w.targetHouses}</td>
                      <td className="p-3 text-right font-bold text-emerald-800">{w.completedHouses}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                              w.efficiencyPercent >= 90
                                ? 'bg-emerald-100 text-emerald-800'
                                : w.efficiencyPercent >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {w.efficiencyPercent}%
                          </span>
                        </div>
                      </td>
                      {/* SI */}
                      <td className="p-3">
                        <div className="bg-blue-50/90 border border-blue-200/80 rounded-lg px-2.5 py-1.5 min-w-[150px] space-y-0.5">
                          <div className="font-bold text-blue-950 text-xs">{w.siName}</div>
                          <a
                            href={`tel:${w.siPhone}`}
                            className="font-mono text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
                            title="Call Sanitary Inspector"
                          >
                            <Phone className="w-2.5 h-2.5 text-blue-600" />
                            <span>{w.siPhone}</span>
                          </a>
                        </div>
                      </td>
                      {/* SS */}
                      <td className="p-3">
                        <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 min-w-[150px] space-y-0.5">
                          <div className="font-bold text-emerald-950 text-xs">{w.ssName}</div>
                          <a
                            href={`tel:${w.ssPhone}`}
                            className="font-mono text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                            title="Call Sanitary Supervisor"
                          >
                            <Phone className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{w.ssPhone}</span>
                          </a>
                        </div>
                      </td>
                      {/* CSS */}
                      <td className="p-3">
                        <div className="bg-purple-50/90 border border-purple-200/80 rounded-lg px-2.5 py-1.5 min-w-[150px] space-y-0.5">
                          <div className="font-bold text-purple-950 text-xs">{w.cssName}</div>
                          <a
                            href={`tel:${w.cssPhone}`}
                            className="font-mono text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
                            title="Call Chief Sanitary Supervisor"
                          >
                            <Phone className="w-2.5 h-2.5 text-purple-600" />
                            <span>{w.cssPhone}</span>
                          </a>
                        </div>
                      </td>
                      {/* Shift & Status */}
                      <td className="p-3 text-center">
                        <div className="space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-block ${
                              w.completedHouses >= w.targetHouses
                                ? 'bg-emerald-100 text-emerald-800'
                                : w.completedHouses > 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {w.completedHouses >= w.targetHouses ? 'Completed' : w.completedHouses > 0 ? 'In Progress' : 'Pending'}
                          </span>
                          <div className="text-[10px] text-gray-500 font-mono">{w.shiftStartTime}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------- REPORT VIEW: VEHICLE ASSIGNED WARD LIST & DETAILS ----------------- */}
        {activeReportType === 'vehicle-assignment' && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Fleet Summary Header Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Total Deployed Fleet</span>
                  <Truck className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {filteredVehicleAssignmentReports.length} <span className="text-xs font-semibold text-emerald-700">Units</span>
                </div>
                <div className="text-[11px] text-emerald-800/80 font-medium mt-0.5">
                  Tata Ace, BOV, Push Cart & OBL
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">Wards Assigned</span>
                  <MapPin className="w-4 h-4 text-blue-700" />
                </div>
                <div className="text-2xl font-black text-blue-950 mt-1">
                  100% <span className="text-xs font-semibold text-blue-700">Coverage</span>
                </div>
                <div className="text-[11px] text-blue-800/80 font-medium mt-0.5">
                  Across North, South, Central, East & West
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">Target Households</span>
                  <Users className="w-4 h-4 text-purple-700" />
                </div>
                <div className="text-2xl font-black text-purple-950 mt-1">
                  {filteredVehicleAssignmentReports.reduce((acc, v) => acc + (v.targetHouseholds || 250), 0).toLocaleString()}{' '}
                  <span className="text-xs font-semibold text-purple-700">Houses</span>
                </div>
                <div className="text-[11px] text-purple-800/80 font-medium mt-0.5">
                  {filteredVehicleAssignmentReports.reduce((acc, v) => acc + (v.coveredHouseholds || 230), 0).toLocaleString()} Covered (92.0% Pace)
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">Active On-Route Fleet</span>
                  <Activity className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-2xl font-black text-amber-950 mt-1">
                  {filteredVehicleAssignmentReports.filter(v => v.status === 'In Service').length} / {filteredVehicleAssignmentReports.length}{' '}
                  <span className="text-xs font-semibold text-amber-700">Active</span>
                </div>
                <div className="text-[11px] text-amber-800/80 font-medium mt-0.5">
                  Live GPS Tracking Active
                </div>
              </div>
            </div>

            {/* TABULAR VIEW */}
            {vehicleViewMode === 'table' && (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#EAF3ED] text-[#1E7A38] font-black border-b border-emerald-200">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap">S.No</th>
                      <th className="p-3.5 whitespace-nowrap">Vehicle Number & ID</th>
                      <th className="p-3.5 whitespace-nowrap">Vehicle Type & Specs</th>
                      <th className="p-3.5 whitespace-nowrap">Zone & Primary Ward</th>
                      <th className="p-3.5 min-w-[140px]">Assigned Ward(s)</th>
                      <th className="p-3.5 min-w-[200px]">Assigned Street Names & Routes</th>
                      <th className="p-3.5 whitespace-nowrap">Driver / Crew Leader</th>
                      <th className="p-3.5 whitespace-nowrap">Target vs Covered</th>
                      <th className="p-3.5 whitespace-nowrap">Shift Timing & GPS</th>
                      <th className="p-3.5 text-center whitespace-nowrap">Trips to Vellalore</th>
                      <th className="p-3.5 text-center whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium bg-white">
                    {filteredVehicleAssignmentReports.map((v, idx) => {
                      const target = v.targetHouseholds || 250;
                      const covered = v.coveredHouseholds || 230;
                      const pct = Math.min(100, Math.round((covered / target) * 100));

                      const getTypeBadge = (type: string) => {
                        if (type.toLowerCase().includes('tata')) {
                          return { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: 'Tata Ace Mini Truck' };
                        } else if (type.toLowerCase().includes('bov')) {
                          return { bg: 'bg-cyan-100 text-cyan-900 border-cyan-300', label: 'BOV Electric Trike' };
                        } else if (type.toLowerCase().includes('push')) {
                          return { bg: 'bg-amber-100 text-amber-900 border-amber-300', label: 'Push Cart (Manual)' };
                        } else {
                          return { bg: 'bg-purple-100 text-purple-900 border-purple-300', label: 'OBL-PVT Heavy Tipper' };
                        }
                      };

                      const typeBadge = getTypeBadge(v.type);

                      return (
                        <tr key={v.id} className="hover:bg-emerald-50/40 transition-colors">
                          {/* S.No */}
                          <td className="p-3.5 font-bold text-gray-500">{idx + 1}</td>

                          {/* Vehicle Number Plate */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="inline-flex items-center bg-yellow-300 text-black border-2 border-gray-900 rounded-lg px-2.5 py-1 font-mono font-black text-xs shadow-2xs tracking-wider">
                              <span className="text-[9px] bg-blue-900 text-white px-1 py-0.2 rounded mr-1.5 font-sans font-bold">
                                IND
                              </span>
                              {v.vehicleNo}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5 ml-0.5">
                              ID: {v.id}
                            </div>
                          </td>

                          {/* Vehicle Type & Specs */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${typeBadge.bg}`}>
                              <Truck className="w-3 h-3" />
                              {v.type}
                            </span>
                            <div className="text-[11px] text-gray-600 font-semibold mt-0.5">
                              {v.capacity || 'Standard Capacity'}
                            </div>
                          </td>

                          {/* Zone & Primary Ward */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-extrabold text-gray-900 text-xs">{v.ward}</div>
                            <div className="text-[11px] text-emerald-800 font-semibold">{v.zone}</div>
                          </td>

                          {/* Assigned Wards List */}
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1">
                              {(v.assignedWards || [v.ward]).map((w) => (
                                <span
                                  key={w}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-md font-bold text-[11px]"
                                >
                                  {w}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Assigned Streets */}
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {(v.assignedStreets || ['Main Arterial Road', 'Inner Sector Lane']).map((street, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-900 border border-gray-200 rounded-md text-[11px] font-medium transition-colors"
                                >
                                  {street}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Driver / Crew Leader & Phone */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-extrabold text-gray-900 text-xs">{v.driverName}</div>
                            <a
                              href={`tel:${v.driverPhone}`}
                              className="font-mono text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 mt-0.5"
                              title="Direct call driver"
                            >
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{v.driverPhone}</span>
                            </a>
                          </td>

                          {/* Target vs Covered Households */}
                          <td className="p-3.5 whitespace-nowrap min-w-[140px]">
                            <div className="flex items-center justify-between text-[11px] font-bold text-gray-800 mb-1">
                              <span>{covered} / {target}</span>
                              <span className={pct >= 90 ? 'text-emerald-700' : 'text-amber-700'}>{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 90 ? 'bg-emerald-600' : pct >= 70 ? 'bg-blue-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>

                          {/* Shift & GPS Status */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="text-[11px] font-mono font-bold text-gray-800">
                              {v.shiftTiming || '06:30 AM - 02:30 PM'}
                            </div>
                            <div className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span className="truncate max-w-[130px]">{v.gpsStatus || 'Live GPS Active'}</span>
                            </div>
                          </td>

                          {/* Vellalore Trips */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="font-extrabold text-emerald-900 text-xs">
                              {v.tripsToDumpYard} trips
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {v.distanceCoveredKm} km
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                v.status === 'In Service'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'In Service' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* WARD CARDS VIEW */}
            {vehicleViewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVehicleAssignmentReports.map((v) => {
                  const target = v.targetHouseholds || 250;
                  const covered = v.coveredHouseholds || 230;
                  const pct = Math.min(100, Math.round((covered / target) * 100));

                  return (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Header: Plate & Status */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="inline-flex items-center bg-yellow-300 text-black border-2 border-gray-900 rounded-lg px-2.5 py-1 font-mono font-black text-xs shadow-2xs tracking-wider">
                              <span className="text-[9px] bg-blue-900 text-white px-1 py-0.2 rounded mr-1 font-sans font-bold">
                                IND
                              </span>
                              {v.vehicleNo}
                            </div>
                            <div className="text-[11px] font-bold text-gray-700 mt-1 flex items-center gap-1">
                              <Truck className="w-3 h-3 text-emerald-700" />
                              <span>{v.type}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500 font-normal">{v.capacity}</span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              v.status === 'In Service' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>

                        {/* Zone & Assigned Wards */}
                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80 mb-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">Zone & Primary Ward:</span>
                            <span className="font-bold text-gray-900">{v.zone} • {v.ward}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-200">
                            <span className="text-[11px] text-gray-500 font-semibold">Assigned Wards:</span>
                            {(v.assignedWards || [v.ward]).map((w) => (
                              <span key={w} className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-bold text-[10px]">
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Assigned Streets */}
                        <div className="mb-3">
                          <div className="text-[11px] font-bold text-gray-600 mb-1">Assigned Streets:</div>
                          <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                            {(v.assignedStreets || ['Main Road', 'Sector 1']).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded text-[10px] font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Coverage Progress */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span className="text-gray-600">Door Coverage:</span>
                            <span className="text-emerald-800">{covered} / {target} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Driver Contact & GPS */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-gray-900">{v.driverName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{v.shiftTiming}</div>
                        </div>
                        <a
                          href={`tel:${v.driverPhone}`}
                          className="px-3 py-1.5 bg-[#1E7A38] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* WARD MATRIX VIEW */}
            {vehicleViewMode === 'ward-matrix' && (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#EAF3ED] text-[#1E7A38] font-black border-b border-emerald-200">
                    <tr>
                      <th className="p-3.5">Ward Number</th>
                      <th className="p-3.5">Municipal Zone</th>
                      <th className="p-3.5">Assigned Vehicle Number</th>
                      <th className="p-3.5">Vehicle Type</th>
                      <th className="p-3.5">Assigned Crew Leader</th>
                      <th className="p-3.5">Total Streets Assigned</th>
                      <th className="p-3.5">Target Households</th>
                      <th className="p-3.5 text-center">Coverage Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium bg-white">
                    {filteredVehicleAssignmentReports.map((v) => (
                      <tr key={v.id} className="hover:bg-emerald-50/40">
                        <td className="p-3.5 font-extrabold text-blue-900 text-xs">
                          <span className="px-2.5 py-1 bg-blue-100 border border-blue-300 rounded-lg">
                            {v.ward}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-gray-800">{v.zone}</td>
                        <td className="p-3.5">
                          <span className="font-mono font-black text-gray-900 bg-yellow-200/80 px-2 py-0.5 rounded border border-yellow-400">
                            {v.vehicleNo}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-900">{v.type} ({v.capacity})</td>
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900">{v.driverName}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{v.driverPhone}</div>
                        </td>
                        <td className="p-3.5 font-bold text-gray-700">
                          {(v.assignedStreets || []).length} Main Streets
                        </td>
                        <td className="p-3.5 font-bold text-gray-900">
                          {v.coveredHouseholds || 230} / {v.targetHouseholds || 250} Houses
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-900">
                            100% Ward Allocated
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ----------------- REPORT VIEW 5: VEHICLE REPORT ----------------- */}
        {activeReportType === 'vehicle' && (
          <div className="p-6 space-y-6">
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#EAF3ED] text-[#1E7A38] font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Vehicle Plate No.</th>
                    <th className="p-3">Vehicle Type & Specs</th>
                    <th className="p-3">Driver Name & Contact</th>
                    <th className="p-3">Zone & Ward</th>
                    <th className="p-3 text-right">Distance (km)</th>
                    <th className="p-3 text-center">Vellalore Trips</th>
                    <th className="p-3 text-center">Battery / Fuel</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredVehicleReports.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-extrabold text-gray-900 font-mono text-xs bg-yellow-200/80 px-2 py-0.5 rounded border border-yellow-400 inline-block">
                          {v.vehicleNo}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-900">{v.type}</div>
                        <div className="text-[10px] text-gray-500">{v.capacity}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{v.driverName}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{v.driverPhone}</div>
                      </td>
                      <td className="p-3 text-gray-700">
                        <div className="font-bold text-gray-900">{v.ward}</div>
                        <div className="text-[11px] text-gray-500">{v.zone}</div>
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900">{v.distanceCoveredKm} km</td>
                      <td className="p-3 text-center font-bold text-emerald-800">{v.tripsToDumpYard} trips</td>
                      <td className="p-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${v.fuelOrBattery > 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {v.fuelOrBattery}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            v.status === 'In Service'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
