from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base

class UserRole(str, enum.Enum):
    SME = "SME"
    COURIER = "COURIER"
    RECEIVER = "RECEIVER"

class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, index=True, nullable=True)
    sender_id = Column(Integer, nullable=True)  # Or ForeignKey("users.id") if using a User model
    receiver_email = Column(String, nullable=False)
    receiver_phone = Column(String, nullable=False)
    pin = Column(String, nullable=False)
    ipfs_hash = Column(String, nullable=True)
    tx_hash = Column(String, nullable=True)
    status = Column(String, default="Created")
    created_at = Column(DateTime, default=datetime.utcnow)

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String, unique=True, index=True, nullable=False)
    wallet_address = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)

    