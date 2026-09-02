from datetime import datetime
import enum

from sqlalchemy import (
    Column,
    Float,
    Integer,
    String,
    Enum as SQLEnum,
    DateTime,
)

from database import Base


class UserRole(str, enum.Enum):
    SME = "SME"
    COURIER = "COURIER"
    RECEIVER = "RECEIVER"


class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    tracking_number = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    sender_id = Column(
        Integer,
        nullable=True,
        index=True,
    )

    contents_name = Column(
        String,
        nullable=False,
    )

    receiver_email = Column(
        String,
        nullable=False,
    )

    receiver_phone = Column(
        String,
        nullable=False,
    )

    destination_address = Column(
        String,
        nullable=False,
    )

    courier_name = Column(
        String,
        nullable=True,
    )

    courier_phone = Column(
        String,
        nullable=True,
    )

    courier_email = Column(
        String,
        nullable=True,
    )

    courier_address = Column(
        String,
        nullable=True,
    )

    proximity_checkpoint = Column(
        String,
        nullable=True,
        default="Created",
    )

    pin = Column(
        String,
        nullable=False,
    )

    ipfs_hash = Column(
        String,
        nullable=True,
    )

    tx_hash = Column(
        String,
        nullable=True,
        index=True,
    )

    status = Column(
        String,
        nullable=False,
        default="Created",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    transaction_timestamp = Column(
        DateTime,
        nullable=True,
    )

    delivery_proof_image_url = Column(String, nullable=True,
    )
    delivered_at = Column(
        DateTime(timezone=True), 
        nullable=True,
        )
   
    dest_lat = Column(Float, nullable=True)
    dest_lng = Column(Float, nullable=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    distance_remaining_km = Column(Float, nullable=True)


class UserModel(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    phone_number = Column(
        String,
        unique=False,
        index=True,
        nullable=True,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    wallet_address = Column(
        String,
        nullable=True,
    )

    role = Column(
        SQLEnum(UserRole, name="userrole", create_type=False),
       default=UserRole.SME,
        nullable=False,
    )