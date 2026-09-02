export type CoverageStatus = 'Covered' | 'Not Covered' | 'Partially Covered';

export interface StreetScanPoint {
  id: number;
  label: string;
  taLabel: string;
  locationName: string;
  taLocationName: string;
  isScanned: boolean;
  scannedAt?: string;
}

export type NotCoveredReason = 
  | 'House Locked' 
  | 'Door Closed' 
  | 'Waste Not Separated' 
  | 'Refused' 
  | 'Vacant House' 
  | 'Not Available'
  | 'Waste Not Given'
  | 'Other';

export interface SWMSHouseholdRecord {
  id: string; // e.g., REC-1001
  houseId: string; // e.g., HID123456
  zone: string; // e.g., East Zone, Central Zone, West Zone, South Zone, North Zone
  ward: string; // e.g., Ward 12
  siName: string; // Sanitary Inspector Name
  siContact: string; // SI Contact Number
  ssName: string; // Sanitary Supervisor Name
  ssContact: string; // SS Contact Number
  cssName: string; // Chief Sanitary Supervisor Name
  driverWorkerName: string; // Driver Name
  driverWorkerContact: string; // Driver Contact Number
  householderName: string; // Householder Name
  householderContact: string; // Householder Contact Number
  streetName: string; // Street Name
  doorNo: string; // Door No
  coverageStatus: CoverageStatus; // Covered | Not Covered
  notCoveredReason?: NotCoveredReason; // Reason if Not Covered
  remarks?: string; // Optional worker remark text
  submittedAt: string;
  // GPS Telemetry & Geocoded Location
  latitude?: number;
  longitude?: number;
  locationName?: string; // e.g. "Kamaraj Salai, Cross Cut Rd, Gandhipuram, Coimbatore - 641012"
  gpsCoordinates?: string; // e.g. "11.0168° N, 76.9558° E"
  gpsAccuracy?: number; // e.g. 3.8 (meters)
  gpsTimestamp?: string;
  // Vehicle Assignment fields
  assignedVehicleId?: string; // e.g. "v-push-cart", "v-tata-ace", "v-bov", "v-obl-pvt"
  vehicleNo?: string; // e.g. "TN 38 BG 4410"
  vehicleType?: string; // e.g. "TATA ACE", "PUSH CART", "BOV"
}

export interface AreaWardStats {
  areaName: string;
  ward: string;
  zone: string;
  totalHouses: number;
  coveredHouses: number;
  notCoveredHouses: number;
}

export interface SWMSDashboardStats {
  totalHouseholds: number; // Total Area Houses
  coveredHouseholds: number; // Covered count
  notCoveredHouseholds: number; // Not Covered count
  todaysEntries: number;
  coveragePercentage: number;
  zoneBreakdown: Array<{ zone: string; covered: number; total: number }>;
  areaBreakdown?: AreaWardStats[];
}

export interface WorkerInfo {
  name: string;
  id: string;
  vehicleNo: string;
  vehicleType: string;
  assignedZone: string;
  assignedWard: string;
  assignedStreet: string;
  siName: string;
  siContact: string;
  ssName: string;
  ssContact: string;
  cssName: string;
  driverName: string;
  driverContact: string;
}

// Legacy Compatibility Types for old components
export type VehicleType = 'Tata Ace' | 'BOV (Battery Operated Vehicle)' | 'Push Cart (PTC)';
export type PropertyType = 'Residence' | 'Commercial' | 'Institution';
export type CollectionStatus = 'Collected' | 'Not Collected' | 'Locked' | 'Refused';
export type WasteType = 'Segregated (Wet & Dry)' | 'Unsegregated' | 'Hazardous / Bio';

export interface StaffDetails {
  zone: string;
  ward: string;
  siName: string;
  siContact: string;
  ssName: string;
  ssContact: string;
  cssName: string;
  cssDriverName?: string;
  workerName: string;
  workerContact: string;
  vehicleType: VehicleType;
  vehicleNo: string;
}

export interface Street {
  id: string;
  name: string;
  zone: string;
  ward: string;
  startDoorNo: number;
  endDoorNo: number;
  totalDoors: number;
}

export interface Household {
  id: string;
  streetId: string;
  streetName: string;
  ward: string;
  zone: string;
  oldDoorNo: string;
  newDoorNo: string;
  propertyType: PropertyType;
  ownerName: string;
  qrCodePayload: string;
}

export interface CollectionRecord {
  id: string | number;
  householdId?: string;
  oldDoorNo?: string;
  newDoorNo?: string;
  streetId?: string;
  streetName?: string;
  ward: string;
  status: any;
  wasteType?: WasteType;
  propertyType?: PropertyType;
  scannedAt?: string;
  workerName: string;
  vehicleType?: VehicleType;
  vehicleNo: string;
  remarks?: string;

  // CCMC-specific mock fields
  date?: string;
  time?: string;
  timestamp?: string;
  zone?: string;
  street?: string;
  workerPhone?: string;
  binLevelPercent?: number;
  supervisor?: string;
  coordinates?: { lat: number; lng: number };
  locationName?: string;
  proofPhoto?: string;
  proofTimestamp?: string;
  reasonIfNotCollected?: string;
}


export interface DailySummaryStats {
  totalHouseholds: number;
  totalCollectedToday: number;
  totalPending: number;
  totalLockedRefused: number;
  segregatedPercentage: number;
  collectionRatePercentage: number;
  vehicleStats: Record<string, number>;
  streetStats: Array<{
    streetId: string;
    streetName: string;
    total: number;
    collected: number;
    percentage: number;
  }>;
}

export type NavigationTab = 
  | 'overview' 
  | 'vehicle-assignment'
  | 'live-tracking' 
  | 'alerts' 
  | 'reports' 
  | 'collected' 
  | 'not-collected'
  | 'frequently-not-covered-area'
  | 'ai-prediction'
  | 'sbm-admin';

// CCMC Commissioner Review Console Types
export type AlertCategory = 
  | 'high_missed_houses' 
  | 'worker_not_started' 
  | 'vehicle_delayed' 
  | 'collection_pending_zone' 
  | 'zone_completed';

export type AlertSeverity = 'critical' | 'warning' | 'success';
export type ZoneName = 'North Zone' | 'Central Zone' | 'South Zone' | 'West Zone' | 'East Zone' | 'All';

export interface MunicipalAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  zone: string;
  ward: string;
  streetOrSector: string;
  timeAgo: string;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
  affectedCount?: number;
  assignedEntity?: string;
  actionRequired?: string;
  details?: string;
}

export interface KPIMetrics {
  totalCollectedToday: number;
  totalCoveredCount: number;
  totalNotCoveredCount: number;
  totalLocationsCount: number;
  overallCoveragePercentage: number;
  frequentlyNotCoveredCount?: number;
}

export interface ZoneSummary {
  zone: string;
  totalLocations: number;
  collectedCount: number;
  notCollectedCount: number;
  coveragePercentage: number;
}

export interface LiveVehicle {
  id: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  zone: string;
  ward: string;
  type: 'BOV' | 'Tata Ace' | 'Push Cart' | string;
  currentPos: [number, number];
  speedKmH: number;
  heading: number;
  status: string;
  fuelOrBattery: number;
  batteryLevel?: number;
  payloadPercent: number;
  lastPingTime: string;
  distanceCoveredKm: number;
  completedStreetsCount?: number;
  pendingStreetsCount?: number;
  coveredStreetsList?: string[];
  pendingStreetsList?: string[];
  currentStreetName?: string;
  assignedRouteStreets?: Array<{
    id: string;
    name: string;
    status: 'Completed' | 'In Progress' | 'Pending';
    households: number;
    collectedHouseholds: number;
    coordinates: [number, number][];
    notes?: string;
  }>;
  routeCoveragePercentage?: number;
  routeStatus?: 'Completed' | 'In Progress' | 'Delayed' | 'Not Started' | string;
  travelledPath: [number, number][];
}

export interface LiveCollector {
  id: string;
  name: string;
  phone: string;
  zone: string;
  ward: string;
  currentPos: [number, number];
  status: string;
  batteryPercent: number;
  assignedVehicleNo: string;
  completedHouses: number;
  totalHouses: number;
  lastActive: string;
}

export interface StreetSegment {
  id: string;
  name: string;
  ward: string;
  zone: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  coordinates: [number, number][];
  totalHouseholds: number;
  collectedHouseholds: number;
  completionTime?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  assignedWorker: string;
  assignedVehicle: string;
  pendingReason?: string;
}

export type ReportType = 'daily' | 'zone' | 'street' | 'worker' | 'vehicle' | 'vehicle-assignment';

export interface DailyReportSummary {
  date: string;
  totalTargetHouses: number;
  totalCoveredHouses: number;
  totalMissedHouses: number;
  coveragePercentage: number;
  segregationPercentage: number;
  totalTonnageCollected: number;
  totalActiveVehicles: number;
  totalFieldWorkers: number;
}

export interface WorkerReportItem {
  id: string;
  name: string;
  phone: string;
  zone: string;
  ward: string;
  assignedRoute: string;
  targetHouses: number;
  completedHouses: number;
  siName: string;
  siPhone: string;
  ssName: string;
  ssPhone: string;
  cssName: string;
  cssPhone: string;
  efficiencyPercent: number;
  shiftStartTime: string;
  hoursOnField: number;
  status: string;
  rating: number;
}

export interface VehicleReportItem {
  id: string;
  vehicleNo: string;
  type: string;
  capacity?: string;
  driverName: string;
  driverPhone: string;
  zone: string;
  ward: string;
  assignedWards?: string[];
  assignedStreets?: string[];
  targetHouseholds?: number;
  coveredHouseholds?: number;
  distanceCoveredKm: number;
  tripsToDumpYard: number;
  totalPayloadTons: number;
  fuelOrBattery: number;
  status: string;
  shiftTiming?: string;
  gpsStatus?: string;
}

export interface StreetReportItem {
  id: string;
  streetName: string;
  ward: string;
  zone: string;
  totalHouseholds: number;
  collectedHouseholds: number;
  missedHouseholds: number;
  status: 'Collected' | 'Not Collected';
  rfidScanRate: number;
  timeCompleted?: string;
  workerName: string;
  vehicleNo: string;
  reasonIfNotCollected?: string;
}

export interface MonthlySummaryData {
  month: string;
  year: number;
  totalTonnage: number;
  avgDailyCoveragePercent: number;
  totalHousesAudited: number;
  totalFleetTrips: number;
  segregationCompliancePercent: number;
  complaintsResolvedPercent: number;
  zoneRankings: Array<{
    zone: string;
    score: number;
    tonnage: number;
    coverage: number;
  }>;
  dailyTrends: Array<{
    day: number;
    date: string;
    coverage: number;
    tonnage: number;
  }>;
}

export interface FrequentlyNotCollectedItem {
  id: string;
  houseId: string;
  doorNo: string;
  streetName: string;
  ward: string;
  zone: string;
  householderName: string;
  householderPhone: string;
  consecutiveDaysMissed: number;
  totalMissedThisMonth: number;
  primaryReason: NotCoveredReason | string;
  lastMissedDate: string;
  lastWorkerName: string;
  lastWorkerPhone: string;
  supervisorName: string;
  supervisorPhone: string;
  coordinates: { lat: number; lng: number };
  remarks?: string;
  actionStatus: 'Pending' | 'Notice Sent' | 'Special Dispatch' | 'Resolved';
}

export interface FrequentlyNotCoveredAreaSummary {
  areaId: string;
  areaName: string;
  streetName: string;
  ward: string;
  zone: string;
  totalHouses: number;
  uncoveredHouses: number;
  uncoveredPercentage: number;
  consecutiveDaysMissed: number;
  primaryReason: string;
  obstacleType: 'Lockout' | 'Segregation_Failure' | 'Narrow_Access' | 'Road_Work' | 'Refused' | 'Vacant';
  supervisorName: string;
  supervisorPhone: string;
  assignedDriver: string;
  assignedVehicle: string;
  coordinates: { lat: number; lng: number };
  lastAttemptTime: string;
  status: 'Critical Attention' | 'Warning' | 'Dispatched' | 'Cleared';
}


