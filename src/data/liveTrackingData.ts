import { LiveVehicle, LiveCollector, StreetSegment } from '../types';

export const INITIAL_LIVE_VEHICLES: LiveVehicle[] = [
  {
    id: 'v-101',
    vehicleNo: 'TN 38 N 1402',
    driverName: 'Karthik Muthusamy',
    driverPhone: '9842101234',
    zone: 'North Zone',
    ward: 'Ward 12',
    type: 'BOV',
    currentPos: [11.0285, 76.9580],
    speedKmH: 14,
    heading: 45,
    status: 'Active Collecting',
    fuelOrBattery: 88,
    batteryLevel: 88,
    payloadPercent: 65,
    lastPingTime: 'Just now',
    distanceCoveredKm: 12.4,
    completedStreetsCount: 8,
    pendingStreetsCount: 3,
    coveredStreetsList: ['Cross Cut Road', '10th Street Gandhipuram', 'Kamaraj Road'],
    pendingStreetsList: ['11th Street Gandhipuram', 'Power House Road'],
    currentStreetName: 'Cross Cut Road',
    assignedRouteStreets: [
      {
        id: 'rs-1',
        name: 'Cross Cut Road',
        status: 'In Progress',
        households: 45,
        collectedHouseholds: 30,
        coordinates: [[11.0270, 76.9560], [11.0285, 76.9580], [11.0300, 76.9600]]
      },
      {
        id: 'rs-2',
        name: '10th Street Gandhipuram',
        status: 'Completed',
        households: 35,
        collectedHouseholds: 35,
        coordinates: [[11.0260, 76.9550], [11.0270, 76.9560]]
      },
      {
        id: 'rs-3',
        name: '11th Street Gandhipuram',
        status: 'Pending',
        households: 40,
        collectedHouseholds: 0,
        coordinates: [[11.0285, 76.9580], [11.0295, 76.9590]]
      }
    ],
    routeCoveragePercentage: 72,
    routeStatus: 'In Progress',
    travelledPath: [[11.0250, 76.9540], [11.0260, 76.9550], [11.0270, 76.9560], [11.0285, 76.9580]]
  },
  {
    id: 'v-102',
    vehicleNo: 'TN 37 CB 9081',
    driverName: 'M. Murugan',
    driverPhone: '9842205678',
    zone: 'Central Zone',
    ward: 'Ward 24',
    type: 'Tata Ace',
    currentPos: [11.0168, 76.9558],
    speedKmH: 18,
    heading: 120,
    status: 'Active Collecting',
    fuelOrBattery: 75,
    batteryLevel: 75,
    payloadPercent: 82,
    lastPingTime: '1 min ago',
    distanceCoveredKm: 18.2,
    completedStreetsCount: 12,
    pendingStreetsCount: 2,
    coveredStreetsList: ['DB Road RS Puram', 'TV Samy Road', 'Cowley Brown Road'],
    pendingStreetsList: ['Mettupalayam Road', 'Sukrawar Pettai'],
    currentStreetName: 'DB Road RS Puram',
    assignedRouteStreets: [
      {
        id: 'rs-4',
        name: 'DB Road RS Puram',
        status: 'In Progress',
        households: 60,
        collectedHouseholds: 48,
        coordinates: [[11.0140, 76.9520], [11.0168, 76.9558], [11.0190, 76.9580]]
      },
      {
        id: 'rs-5',
        name: 'TV Samy Road',
        status: 'Completed',
        households: 50,
        collectedHouseholds: 50,
        coordinates: [[11.0120, 76.9500], [11.0140, 76.9520]]
      }
    ],
    routeCoveragePercentage: 86,
    routeStatus: 'In Progress',
    travelledPath: [[11.0100, 76.9480], [11.0120, 76.9500], [11.0140, 76.9520], [11.0168, 76.9558]]
  },
  {
    id: 'v-103',
    vehicleNo: 'TN 38 G 2190',
    driverName: 'R. Sundaram',
    driverPhone: '9443100011',
    zone: 'South Zone',
    ward: 'Ward 45',
    type: 'BOV',
    currentPos: [10.9980, 76.9620],
    speedKmH: 10,
    heading: 180,
    status: 'Active Collecting',
    fuelOrBattery: 92,
    batteryLevel: 92,
    payloadPercent: 40,
    lastPingTime: 'Just now',
    distanceCoveredKm: 9.5,
    completedStreetsCount: 6,
    pendingStreetsCount: 4,
    coveredStreetsList: ['Trichy Road', 'Ramanathapuram Main Road'],
    pendingStreetsList: ['Nanjundapuram Road', 'Sungam Bypass'],
    currentStreetName: 'Trichy Road',
    assignedRouteStreets: [
      {
        id: 'rs-6',
        name: 'Trichy Road',
        status: 'In Progress',
        households: 55,
        collectedHouseholds: 25,
        coordinates: [[10.9950, 76.9600], [10.9980, 76.9620], [11.0010, 76.9650]]
      }
    ],
    routeCoveragePercentage: 50,
    routeStatus: 'In Progress',
    travelledPath: [[10.9920, 76.9580], [10.9950, 76.9600], [10.9980, 76.9620]]
  },
  {
    id: 'v-104',
    vehicleNo: 'TN 37 CCMC (BOV-08)',
    driverName: 'K. Selvam',
    driverPhone: '9789012345',
    zone: 'West Zone',
    ward: 'Ward 38',
    type: 'Push Cart',
    currentPos: [11.0110, 76.9380],
    speedKmH: 5,
    heading: 270,
    status: 'Active Collecting',
    fuelOrBattery: 100,
    batteryLevel: 100,
    payloadPercent: 55,
    lastPingTime: 'Just now',
    distanceCoveredKm: 5.8,
    completedStreetsCount: 5,
    pendingStreetsCount: 1,
    coveredStreetsList: ['Thadagam Road', 'Vadavalli Link Rd'],
    pendingStreetsList: ['Lawley Road'],
    currentStreetName: 'Thadagam Road',
    assignedRouteStreets: [
      {
        id: 'rs-7',
        name: 'Thadagam Road',
        status: 'In Progress',
        households: 40,
        collectedHouseholds: 28,
        coordinates: [[11.0090, 76.9350], [11.0110, 76.9380], [11.0130, 76.9410]]
      }
    ],
    routeCoveragePercentage: 70,
    routeStatus: 'In Progress',
    travelledPath: [[11.0070, 76.9320], [11.0090, 76.9350], [11.0110, 76.9380]]
  },
  {
    id: 'v-105',
    vehicleNo: 'TN 38 B 5512',
    driverName: 'P. Palanisamy',
    driverPhone: '9843098765',
    zone: 'East Zone',
    ward: 'Ward 52',
    type: 'Tata Ace',
    currentPos: [11.0220, 76.9850],
    speedKmH: 16,
    heading: 90,
    status: 'Active Collecting',
    fuelOrBattery: 80,
    batteryLevel: 80,
    payloadPercent: 78,
    lastPingTime: 'Just now',
    distanceCoveredKm: 14.1,
    completedStreetsCount: 9,
    pendingStreetsCount: 3,
    coveredStreetsList: ['Avinashi Road', 'Peelamedu Main Rd'],
    pendingStreetsList: ['Hopes College Rd', 'Singanallur Rd'],
    currentStreetName: 'Avinashi Road',
    assignedRouteStreets: [
      {
        id: 'rs-8',
        name: 'Avinashi Road',
        status: 'In Progress',
        households: 70,
        collectedHouseholds: 52,
        coordinates: [[11.0200, 76.9800], [11.0220, 76.9850], [11.0240, 76.9900]]
      }
    ],
    routeCoveragePercentage: 74,
    routeStatus: 'In Progress',
    travelledPath: [[11.0180, 76.9750], [11.0200, 76.9800], [11.0220, 76.9850]]
  }
];

export const INITIAL_LIVE_COLLECTORS: LiveCollector[] = [
  {
    id: 'col-1',
    name: 'Karthik Muthusamy',
    phone: '9842101234',
    zone: 'North Zone',
    ward: 'Ward 12',
    currentPos: [11.0285, 76.9580],
    status: 'Active',
    batteryPercent: 90,
    assignedVehicleNo: 'TN 38 N 1402',
    completedHouses: 42,
    totalHouses: 50,
    lastActive: 'Just now'
  },
  {
    id: 'col-2',
    name: 'M. Murugan',
    phone: '9842205678',
    zone: 'Central Zone',
    ward: 'Ward 24',
    currentPos: [11.0168, 76.9558],
    status: 'Active',
    batteryPercent: 85,
    assignedVehicleNo: 'TN 37 CB 9081',
    completedHouses: 55,
    totalHouses: 65,
    lastActive: '1 min ago'
  }
];

export const INITIAL_STREET_SEGMENTS: StreetSegment[] = [
  {
    id: 'st-1',
    name: 'Cross Cut Road',
    ward: 'Ward 12',
    zone: 'North Zone',
    status: 'In Progress',
    totalHouseholds: 45,
    collectedHouseholds: 30,
    priority: 'High',
    assignedWorker: 'Karthik Muthusamy',
    assignedVehicle: 'TN 38 N 1402',
    coordinates: [[11.0270, 76.9560], [11.0285, 76.9580], [11.0300, 76.9600]]
  },
  {
    id: 'st-2',
    name: 'DB Road RS Puram',
    ward: 'Ward 24',
    zone: 'Central Zone',
    status: 'In Progress',
    totalHouseholds: 60,
    collectedHouseholds: 48,
    priority: 'Normal',
    assignedWorker: 'M. Murugan',
    assignedVehicle: 'TN 37 CB 9081',
    coordinates: [[11.0140, 76.9520], [11.0168, 76.9558], [11.0190, 76.9580]]
  }
];

