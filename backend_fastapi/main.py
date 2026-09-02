import os
from datetime import datetime
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import engine, Base, get_db, SQLALCHEMY_DATABASE_URL
import models
import schemas

# Create database tables automatically in Neon PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Coimbatore Solid Waste Management System (SWMS) API",
    description="FastAPI Backend with local SQLite database support and optional Neon PostgreSQL connectivity",
    version="2.0.0"
)

# CORS Middleware configuration to allow React Vite frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    db_type = "Neon PostgreSQL (Remote Cloud)" if "neon.tech" in SQLALCHEMY_DATABASE_URL else "Local SQLite Database"
    return {
        "service": "CCMC Solid Waste Management System (SWMS) FastAPI Backend",
        "database": db_type,
        "status": "online",
        "version": "2.0.0"
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Health check verifying database availability."""
    try:
        db.execute(text("SELECT 1"))
        db_type = "Neon PostgreSQL (Remote Cloud)" if "neon.tech" in SQLALCHEMY_DATABASE_URL else "Local SQLite Database"
        return {
            "status": "healthy",
            "database": db_type,
            "connected": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "connected": False
        }


@app.get("/api/swms/data", response_model=schemas.SWMSDataResponse)
def get_swms_data(db: Session = Depends(get_db)):
    """Fetch all SWMS household records & calculate live stats from Neon DB."""
    db_records = db.query(models.HouseholdRecordModel).order_by(models.HouseholdRecordModel.created_at.desc()).all()
    
    records_list = []
    for r in db_records:
        records_list.append(schemas.SWMSHouseholdRecordSchema(
            id=r.id,
            houseId=r.house_id,
            zone=r.zone,
            ward=r.ward,
            siName=r.si_name or "Karthik Muthusamy",
            siContact=r.si_contact or "+91 94431 10012",
            ssName=r.ss_name or "Manoj Kumar S",
            ssContact=r.ss_contact or "+91 98422 20012",
            cssName=r.css_name or "Dr. V. Arumugam",
            driverWorkerName=r.driver_worker_name or "Karthik Muthusamy",
            driverWorkerContact=r.driver_worker_contact or "+91 98765 43210",
            householderName=r.householder_name or "Resident",
            householderContact=r.householder_contact or "+91 98421 11223",
            streetName=r.street_name,
            doorNo=r.door_no,
            coverageStatus=r.coverage_status,
            notCoveredReason=r.not_covered_reason,
            remarks=r.remarks,
            submittedAt=r.submitted_at,
            latitude=r.latitude or 11.0168,
            longitude=r.longitude or 76.9558,
            locationName=r.location_name,
            gpsCoordinates=r.gps_coordinates,
            gpsAccuracy=r.gps_accuracy or 3.8,
            assignedVehicleId=r.assigned_vehicle_id or "v-push-cart",
            vehicleNo=r.vehicle_no or "TN 37 CZ 4812",
            vehicleType=r.vehicle_type or "PUSH CART"
        ))

    total = len(records_list)
    covered = sum(1 for r in records_list if r.coverageStatus == "Covered")
    not_covered = sum(1 for r in records_list if r.coverageStatus == "Not Covered")
    coverage_pct = round((covered / total) * 100) if total > 0 else 0

    zones = ["Central Zone", "East Zone", "West Zone", "North Zone", "South Zone"]
    zone_breakdown = []
    for z in zones:
        z_total = sum(1 for r in records_list if r.zone == z)
        z_covered = sum(1 for r in records_list if r.zone == z and r.coverageStatus == "Covered")
        zone_breakdown.append(schemas.ZoneBreakdownItem(
            zone=z,
            covered=z_covered,
            total=z_total
        ))

    stats = schemas.SWMSDashboardStatsSchema(
        totalHouseholds=total,
        coveredHouseholds=covered,
        notCoveredHouseholds=not_covered,
        todaysEntries=covered,
        coveragePercentage=coverage_pct,
        zoneBreakdown=zone_breakdown
    )

    return schemas.SWMSDataResponse(
        records=records_list,
        stats=stats,
        source="Neon PostgreSQL Database"
    )


@app.post("/api/swms/submit", status_code=status.HTTP_201_CREATED)
def submit_swms_record(data: schemas.SWMSHouseholdRecordSchema, db: Session = Depends(get_db)):
    """Submit or update a household record in Neon PostgreSQL Database."""
    existing = db.query(models.HouseholdRecordModel).filter(models.HouseholdRecordModel.id == data.id).first()
    
    if existing:
        existing.coverage_status = data.coverageStatus
        existing.not_covered_reason = data.notCoveredReason
        existing.remarks = data.remarks
        existing.submitted_at = data.submittedAt
        existing.door_no = data.doorNo
        existing.street_name = data.streetName
    else:
        new_rec = models.HouseholdRecordModel(
            id=data.id,
            house_id=data.houseId,
            zone=data.zone,
            ward=data.ward,
            si_name=data.siName,
            si_contact=data.siContact,
            ss_name=data.ssName,
            ss_contact=data.ssContact,
            css_name=data.cssName,
            driver_worker_name=data.driverWorkerName,
            driver_worker_contact=data.driverWorkerContact,
            householder_name=data.householderName,
            householder_contact=data.householderContact,
            street_name=data.streetName,
            door_no=data.doorNo,
            coverage_status=data.coverageStatus,
            not_covered_reason=data.notCoveredReason,
            remarks=data.remarks,
            submitted_at=data.submittedAt,
            latitude=data.latitude,
            longitude=data.longitude,
            location_name=data.locationName,
            gps_coordinates=data.gpsCoordinates,
            gps_accuracy=data.gpsAccuracy,
            assigned_vehicle_id=data.assignedVehicleId,
            vehicle_no=data.vehicleNo,
            vehicle_type=data.vehicleType
        )
        db.add(new_rec)
        
    db.commit()
    return {"message": "Record successfully saved to Neon PostgreSQL Database", "id": data.id}
