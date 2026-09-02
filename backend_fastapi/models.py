from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from database import Base


class HouseholdRecordModel(Base):
    """SQLAlchemy ORM Model for SWMS Door-to-Door Household Records in Neon PostgreSQL."""
    __tablename__ = "swms_household_records"

    id = Column(String, primary_key=True, index=True)
    house_id = Column(String, index=True, nullable=False)
    zone = Column(String, index=True, nullable=False)
    ward = Column(String, index=True, nullable=False)
    si_name = Column(String, nullable=True)
    si_contact = Column(String, nullable=True)
    ss_name = Column(String, nullable=True)
    ss_contact = Column(String, nullable=True)
    css_name = Column(String, nullable=True)
    driver_worker_name = Column(String, nullable=True)
    driver_worker_contact = Column(String, nullable=True)
    householder_name = Column(String, nullable=True)
    householder_contact = Column(String, nullable=True)
    street_name = Column(String, index=True, nullable=False)
    door_no = Column(String, nullable=False)
    coverage_status = Column(String, index=True, nullable=False)
    not_covered_reason = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)
    submitted_at = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String, nullable=True)
    gps_coordinates = Column(String, nullable=True)
    gps_accuracy = Column(Float, nullable=True)

    assigned_vehicle_id = Column(String, nullable=True)
    vehicle_no = Column(String, nullable=True)
    vehicle_type = Column(String, nullable=True)


class VehicleAssignmentModel(Base):
    """SQLAlchemy ORM Model for Vehicle & Area Assignments in Neon PostgreSQL."""
    __tablename__ = "swms_vehicle_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    area_id = Column(String, index=True, nullable=False)
    area_name = Column(String, nullable=False)
    vehicle_id = Column(String, index=True, nullable=False)
    vehicle_name = Column(String, nullable=False)
    ward = Column(String, nullable=True)
    zone = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
