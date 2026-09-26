import { ZoneSummary, CollectionRecord, KPIMetrics, SWMSHouseholdRecord } from '../types';

export const INITIAL_KPI_METRICS: KPIMetrics = {
  totalCollectedToday: 0,
  totalCoveredCount: 0,
  totalNotCoveredCount: 0,
  totalLocationsCount: 0,
  overallCoveragePercentage: 0,
};

export const INITIAL_ZONE_SUMMARIES: ZoneSummary[] = [
  { zone: 'Central Zone', totalLocations: 0, collectedCount: 0, notCollectedCount: 0, coveragePercentage: 0 },
  { zone: 'East Zone', totalLocations: 0, collectedCount: 0, notCollectedCount: 0, coveragePercentage: 0 },
  { zone: 'North Zone', totalLocations: 0, collectedCount: 0, notCollectedCount: 0, coveragePercentage: 0 },
  { zone: 'West Zone', totalLocations: 0, collectedCount: 0, notCollectedCount: 0, coveragePercentage: 0 },
  { zone: 'South Zone', totalLocations: 0, collectedCount: 0, notCollectedCount: 0, coveragePercentage: 0 },
];

export const INITIAL_SWMS_RECORDS: SWMSHouseholdRecord[] = [];

export const RECENT_COLLECTION_RECORDS: CollectionRecord[] = [];
