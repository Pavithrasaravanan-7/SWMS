import { AreaOption, VehicleOption } from '../components/VehicleAreaAssignmentView';
import { VehicleReportItem } from '../types';

export const VEHICLE_ASSIGNMENT_STORAGE_KEY = 'ccmc_vehicle_area_assignments';
export const VEHICLE_ASSIGNMENT_EVENT = 'ccmc-vehicle-assignments-updated';

export interface VehicleMasterInfo {
  id: string;
  name: string;
  type: string;
  plateNo: string;
  capacity: string;
  driverName: string;
  driverPhone: string;
  shiftTiming: string;
  colorHex: string;
  colorName: string;
  imageUrl?: string;
  gpsStatus: string;
  speed: string;
  batteryOrFuel: string;
  tripsToDumpYard: number;
  status: 'In Service' | 'On Route' | 'Standby' | 'Maintenance';
}

export const MASTER_VEHICLES: VehicleMasterInfo[] = [
  {
    id: 'v-tata-ace',
    name: 'TATA ACE',
    type: 'Mini truck · wide streets',
    plateNo: 'TN 38 BG 4410',
    capacity: '1.2 T',
    driverName: 'Karthik Muthusamy (Field Officer)',
    driverPhone: '+91 94432 18765',
    shiftTiming: '06:00 AM - 02:00 PM',
    colorHex: '#4285F4', // 🔵 Google Blue
    colorName: 'Google Blue',
    imageUrl: 'https://images.jdmagicbox.com/quickquotes/images_main/tata-ace-hydraulic-garbage-tipper-body-ms-construction-green-2236342196-0nl3bq2j.jpeg',
    gpsStatus: 'GPS Live (14 km/h)',
    speed: '14 km/h',
    batteryOrFuel: 'Diesel (72%)',
    tripsToDumpYard: 2,
    status: 'In Service',
  },
  {
    id: 'v-bov',
    name: 'BOV',
    type: 'Battery operated · inner lanes',
    plateNo: 'TN 38 EV 2091',
    capacity: '600 kg',
    driverName: 'Murugan K. (Sanitary Driver)',
    driverPhone: '+91 98421 54321',
    shiftTiming: '06:30 AM - 02:30 PM',
    colorHex: '#EA4335', // 🔴 Google Red
    colorName: 'Google Red',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTScUmlqQZ3UI_btMH8RztQrSQKGZsUzCPknknaz5Alg&s=10',
    gpsStatus: 'GPS Live (8 km/h)',
    speed: '8 km/h',
    batteryOrFuel: 'EV Battery (85%)',
    tripsToDumpYard: 1,
    status: 'In Service',
  },
  {
    id: 'v-obl-pvt',
    name: 'OBL-PVT',
    type: 'Private contractor lorry',
    plateNo: 'TN 37 CB 8820',
    capacity: '2.5 T',
    driverName: 'Selvam R. (Heavy Driver)',
    driverPhone: '+91 97890 12345',
    shiftTiming: '05:30 AM - 01:30 PM',
    colorHex: '#FBBC05', // 🟡 Google Yellow
    colorName: 'Google Yellow',
    imageUrl: 'https://image.shutterstock.com/image-vector/zero-waste-separation-concept-containers-260nw-2277880785.jpg',
    gpsStatus: 'GPS Live (22 km/h)',
    speed: '22 km/h',
    batteryOrFuel: 'Diesel (64%)',
    tripsToDumpYard: 3,
    status: 'In Service',
  },
  {
    id: 'v-push-cart',
    name: 'PUSH CART',
    type: 'Manual · narrow streets',
    plateNo: 'PTC-WZ-104',
    capacity: '120 kg',
    driverName: 'Dhanraj S. (Field Collector)',
    driverPhone: '+91 94860 99881',
    shiftTiming: '06:00 AM - 01:00 PM',
    colorHex: '#34A853', // 🟢 Google Green
    colorName: 'Google Green',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKXfYeMiA902KDmyOxqrZrZx95qvNMWjpTtB8u-PVy2Dfgo-spg2zimk0&s=10',
    gpsStatus: 'RFID Active',
    speed: '4 km/h',
    batteryOrFuel: 'Manual Push Cart',
    tripsToDumpYard: 1,
    status: 'In Service',
  },
];

export const INITIAL_ASSIGNED_AREAS: AreaOption[] = [
  {
    id: 'a-ss-nagar',
    name: 'SS Nagar',
    nameTa: 'எஸ்.எஸ் நகர்',
    zone: 'East Zone',
    ward: 'Ward 54',
    streets: ['1st Main Road', 'Cross Street 1', 'Cross Street 2', 'Temple Road'],
    streetsCount: 4,
    qrPoints: 22,
  },
  {
    id: 'a-kpr-nagar',
    name: 'KPR Nagar',
    nameTa: 'கே.பி.ஆர் நகர்',
    zone: 'North Zone',
    ward: 'Ward 32',
    streets: ['Gandhi Street', 'Park Avenue', 'School Road'],
    streetsCount: 3,
    qrPoints: 17,
  },
  {
    id: 'a-lw-nagar',
    name: 'LW Nagar',
    nameTa: 'எல்.டபிள்யூ நகர்',
    zone: 'Central Zone',
    ward: 'Ward 45',
    streets: ['Lake View Street', 'North Street', 'South Lane'],
    streetsCount: 3,
    qrPoints: 20,
  },
  {
    id: 'a-gandhi-puram',
    name: 'Gandhi Puram',
    nameTa: 'காந்தி புரம்',
    zone: 'Central Zone',
    ward: 'Ward 12',
    streets: ['7th Street', 'Cross Cut Road', 'Bharathi Street'],
    streetsCount: 3,
    qrPoints: 16,
  },
  {
    id: 'a-anna-colony',
    name: 'Anna Colony',
    nameTa: 'அண்ணா காலனி',
    zone: 'South Zone',
    ward: 'Ward 68',
    streets: ['Kamaraj Road', 'Anna Salai', 'Periyar Street'],
    streetsCount: 3,
    qrPoints: 15,
  },
  {
    id: 'a-vivek-nagar',
    name: 'Vivek Nagar',
    nameTa: 'விவேக் நகர்',
    zone: 'West Zone',
    ward: 'Ward 29',
    streets: ['Swami Vivekananda Street', 'Bazaar Street', 'Library Lane'],
    streetsCount: 3,
    qrPoints: 18,
  },
  {
    id: 'a-ram-nagar',
    name: 'Ram Nagar',
    nameTa: 'ராம் நகர்',
    zone: 'Central Zone',
    ward: 'Ward 18',
    streets: ['Ramachandra Road', 'Sastri Road', 'Devan Road'],
    streetsCount: 4,
    qrPoints: 24,
  },
  {
    id: 'a-rs-puram',
    name: 'RS Puram',
    nameTa: 'ஆர்.எஸ் புரம்',
    zone: 'West Zone',
    ward: 'Ward 22',
    streets: ['DB Road', 'Cowley Brown Road', 'Sir Shanmugam Road'],
    streetsCount: 5,
    qrPoints: 28,
  },
  {
    id: 'a-peelamedu',
    name: 'Peelamedu',
    nameTa: 'பீளமேடு',
    zone: 'East Zone',
    ward: 'Ward 58',
    streets: ['Avinashi Road', 'College Road', 'Pioneer Mill Road'],
    streetsCount: 4,
    qrPoints: 26,
  },
  {
    id: 'a-singanallur',
    name: 'Singanallur',
    nameTa: 'சிங்கநல்லூர்',
    zone: 'East Zone',
    ward: 'Ward 62',
    streets: ['Trichy Road', 'Kamatchi Amman Kovil Street', 'Bus Stand Lane'],
    streetsCount: 4,
    qrPoints: 21,
  },
  {
    id: 'a-saibaba-colony',
    name: 'Saibaba Colony',
    nameTa: 'சாய்பாபா காலனி',
    zone: 'North Zone',
    ward: 'Ward 36',
    streets: ['NSR Road', 'Bharathi Park Road', 'Alagesan Road'],
    streetsCount: 5,
    qrPoints: 25,
  },
  {
    id: 'a-saravanampatti',
    name: 'Saravanampatti',
    nameTa: 'சரவணம்பட்டி',
    zone: 'North Zone',
    ward: 'Ward 40',
    streets: ['Sathy Road', 'IT Park Avenue', 'KCT Junction Road'],
    streetsCount: 4,
    qrPoints: 23,
  },
];

/**
 * Load currently assigned areas from localStorage or default
 */
export function getStoredAssignedAreas(): AreaOption[] {
  try {
    const raw = localStorage.getItem(VEHICLE_ASSIGNMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // If stored version is legacy pre-assigned template where all 12 were assigned initially to legacy defaults, migrate to unassigned:
        const legacyPreAssignedCount = parsed.filter((a: AreaOption) => a.assignedVehicleId === 'v-tata-ace' || a.assignedVehicleId === 'v-push-cart' || a.assignedVehicleId === 'v-bov' || a.assignedVehicleId === 'v-obl-pvt').length;
        if (legacyPreAssignedCount === 12 && !localStorage.getItem('ccmc_vehicle_assignments_user_customized')) {
          localStorage.removeItem(VEHICLE_ASSIGNMENT_STORAGE_KEY);
          return INITIAL_ASSIGNED_AREAS;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading vehicle area assignments from localStorage:', err);
  }
  return INITIAL_ASSIGNED_AREAS;
}

/**
 * Save assigned areas to localStorage and dispatch custom update event
 */
export function saveStoredAssignedAreas(areas: AreaOption[]): void {
  try {
    localStorage.setItem(VEHICLE_ASSIGNMENT_STORAGE_KEY, JSON.stringify(areas));
    localStorage.setItem('ccmc_vehicle_assignments_user_customized', 'true');
    window.dispatchEvent(new CustomEvent(VEHICLE_ASSIGNMENT_EVENT, { detail: { areas } }));
  } catch (err) {
    console.error('Error saving vehicle area assignments to localStorage:', err);
  }
}

export interface AssignedVehicleSummaryItem {
  vehicle: VehicleMasterInfo;
  assignedAreas: AreaOption[];
  totalStreetsCount: number;
  totalQrPoints: number;
  allWards: string[];
  allZones: string[];
  estimatedHouseholds: number;
}

/**
 * Get structured summary grouped by vehicle
 */
export function getVehicleAssignmentSummary(): {
  vehicles: AssignedVehicleSummaryItem[];
  totalVehiclesCount: number;
  totalAssignedAreasCount: number;
  totalQrPointsAssigned: number;
  totalStreetsAssigned: number;
} {
  const areas = getStoredAssignedAreas();
  const summaryList: AssignedVehicleSummaryItem[] = MASTER_VEHICLES.map((v) => {
    const matchedAreas = areas.filter((a) => a.assignedVehicleId === v.id);
    const totalStreets = matchedAreas.reduce((acc, a) => acc + (a.streetsCount || a.streets?.length || 0), 0);
    const totalQr = matchedAreas.reduce((acc, a) => acc + (a.qrPoints || 0), 0);
    const wards = Array.from(new Set(matchedAreas.map((a) => a.ward).filter(Boolean) as string[]));
    const zones = Array.from(new Set(matchedAreas.map((a) => a.zone).filter(Boolean) as string[]));
    const estimatedHouses = totalQr * 12; // Approx ~12 houses per QR check

    return {
      vehicle: v,
      assignedAreas: matchedAreas,
      totalStreetsCount: totalStreets,
      totalQrPoints: totalQr,
      allWards: wards,
      allZones: zones,
      estimatedHouseholds: estimatedHouses,
    };
  });

  const totalAssignedAreas = areas.filter((a) => a.assignedVehicleId).length;
  const totalQr = areas.reduce((acc, a) => acc + (a.assignedVehicleId ? a.qrPoints : 0), 0);
  const totalStreets = areas.reduce((acc, a) => acc + (a.assignedVehicleId ? a.streetsCount : 0), 0);

  return {
    vehicles: summaryList,
    totalVehiclesCount: MASTER_VEHICLES.length,
    totalAssignedAreasCount: totalAssignedAreas,
    totalQrPointsAssigned: totalQr,
    totalStreetsAssigned: totalStreets,
  };
}

/**
 * Transform assigned areas into VehicleReportItem format for ReportsView
 */
export function getVehicleReportItems(): VehicleReportItem[] {
  const summary = getVehicleAssignmentSummary();
  return summary.vehicles.map((vItem) => {
    const v = vItem.vehicle;
    const areas = vItem.assignedAreas;
    const allStreets: string[] = [];
    areas.forEach((a) => {
      if (a.streets) allStreets.push(...a.streets);
      else allStreets.push(a.name);
    });

    const targetHouses = vItem.estimatedHouseholds > 0 ? vItem.estimatedHouseholds : 240;
    const coveredHouses = Math.round(targetHouses * 0.88);

    return {
      id: v.id,
      vehicleNo: v.plateNo,
      type: v.name as any,
      capacity: v.capacity,
      driverName: v.driverName,
      driverPhone: v.driverPhone,
      zone: vItem.allZones[0] || 'Central Zone',
      ward: vItem.allWards[0] || 'Ward 12',
      assignedWards: vItem.allWards.length > 0 ? vItem.allWards : ['Ward 12'],
      assignedStreets: allStreets.length > 0 ? allStreets : ['Main Street'],
      shiftTiming: v.shiftTiming,
      targetHouseholds: targetHouses,
      coveredHouseholds: coveredHouses,
      coveragePercentage: 88,
      distanceCoveredKm: 18.5,
      tripsToDumpYard: v.tripsToDumpYard,
      totalPayloadTons: v.id === 'v-tata-ace' ? 2.4 : v.id === 'v-bov' ? 1.2 : v.id === 'v-obl-pvt' ? 3.1 : 0.8,
      fuelOrBattery: v.id === 'v-bov' ? 88 : 74,
      gpsStatus: v.gpsStatus,
      status: v.status,
    };
  });
}
