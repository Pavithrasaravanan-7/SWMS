from pydantic import BaseModel
from typing import Optional, List


class SWMSHouseholdRecordSchema(BaseModel):
    id: str
    houseId: str
    zone: str
    ward: str
    siName: Optional[str] = "Karthik Muthusamy"
    siContact: Optional[str] = "+91 94431 10012"
    ssName: Optional[str] = "Manoj Kumar S"
    ssContact: Optional[str] = "+91 98422 20012"
    cssName: Optional[str] = "Dr. V. Arumugam"
    driverWorkerName: Optional[str] = "Karthik Muthusamy"
    driverWorkerContact: Optional[str] = "+91 98765 43210"
    householderName: Optional[str] = "Resident"
    householderContact: Optional[str] = "+91 98421 11223"
    streetName: str
    doorNo: str
    coverageStatus: str
    notCoveredReason: Optional[str] = None
    remarks: Optional[str] = None
    submittedAt: str
    latitude: Optional[float] = 11.0168
    longitude: Optional[float] = 76.9558
    locationName: Optional[str] = None
    gpsCoordinates: Optional[str] = None
    gpsAccuracy: Optional[float] = 3.8
    assignedVehicleId: Optional[str] = "v-push-cart"
    vehicleNo: Optional[str] = "TN 37 CZ 4812"
    vehicleType: Optional[str] = "PUSH CART"

    class Config:
        from_attributes = True


class ZoneBreakdownItem(BaseModel):
    zone: str
    covered: int
    total: int


class SWMSDashboardStatsSchema(BaseModel):
    totalHouseholds: int
    coveredHouseholds: int
    notCoveredHouseholds: int
    todaysEntries: int
    coveragePercentage: int
    zoneBreakdown: List[ZoneBreakdownItem]


class SWMSDataResponse(BaseModel):
    records: List[SWMSHouseholdRecordSchema]
    stats: SWMSDashboardStatsSchema
    source: str = "Neon PostgreSQL Database"
