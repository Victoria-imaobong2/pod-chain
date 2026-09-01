import io
import base64
import os
import traceback
import hashlib
import secrets
import math
import httpx

from datetime import datetime, time
from typing import Optional

import qrcode

from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Query,
    status,
)

from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from database import get_db
from models import Parcel
from auth_utils import get_current_user

router = APIRouter(
    prefix="/api/v1/parcels",
    tags=["Parcels & Notifications"],
)

# ============================================================
# SCHEMAS
# ============================================================

class CreateParcelRecordRequest(BaseModel):
    tracking_number: str
    contents_name: str
    receiver_email: str = ""
    receiver_phone: str
    destination_address: str
    pin: Optional[str] = None
    delivery_code: Optional[str] = None
    ipfs_hash: Optional[str] = ""
    tx_hash: Optional[str] = ""
    sender_wallet: Optional[str] = ""


class AcceptParcelRequest(BaseModel):
    courier_wallet: str
    courier_phone: Optional[str] = None
    courier_name: Optional[str] = None
    courier_email: Optional[str] = None


class ProximityUpdateRequest(BaseModel):
    checkpoint: str


class NotifyRequest(BaseModel):
    parcelId: int | str
    receiverEmail: EmailStr
    receiverPhone: str
    pin: str
    ipfsHash: Optional[str] = ""
    txHash: Optional[str] = ""
    senderAddress: Optional[str] = ""


class OTPRequest(BaseModel):
    receiver_email: EmailStr
    receiver_phone: str


class ConfirmDeliveryRequest(BaseModel):
    tx_hash: Optional[str] = None
    delivery_code: Optional[str] = None


class GPSLocationUpdate(BaseModel):
    latitude: float
    longitude: float


# ============================================================
# BREVO EMAIL DISPATCH (ANY RECIPIENT EMAIL)
# ============================================================

async def send_delivery_email(receiver_email: str, pin: str):
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("MAIL_FROM") or os.getenv("SENDER_EMAIL") or "solomonvictoria2023@gmail.com"

    if not api_key:
        print("[WARNING] BREVO_API_KEY missing in environment. Email skipped.")
        return

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json",
    }
    payload = {
        "sender": {"name": "POD Chain Logistics", "email": sender_email},
        "to": [{"email": receiver_email}],
        "subject": f"POD Chain - Your Delivery Verification PIN: {pin}",
        "htmlContent": f"""
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0d9488; margin-top: 0;">POD Chain Delivery Verification</h2>
            <p>A package has been dispatched to your destination.</p>
            <p>Your one-time delivery confirmation PIN is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 14px; background: #f1f5f9; text-align: center; border-radius: 8px; color: #0f172a; margin: 16px 0;">
                {pin}
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                Give this 6-digit code to the courier upon physical arrival to release smart contract escrow funds.
            </p>
        </div>
        """,
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers, json=payload, timeout=10.0)
        if res.status_code in (200, 201):
            print(f"[SUCCESS] OTP email dispatched via Brevo to {receiver_email}")
        else:
            print(f"[BREVO ERROR] {res.status_code}: {res.text}")


# ============================================================
# GENERATE DELIVERY OTP
# ============================================================

@router.post("/generate-otp")
async def generate_otp(payload: OTPRequest):
    try:
        raw_otp = f"{secrets.randbelow(1_000_000):06d}"

        from Crypto.Hash import keccak
        k = keccak.new(digest_bits=256)
        k.update(raw_otp.encode("utf-8"))
        confirmation_hash = "0x" + k.hexdigest()

        # Send via Brevo HTTP API
        try:
            await send_delivery_email(payload.receiver_email, raw_otp)
        except Exception as email_err:
            print(f"[WARNING] Email dispatch error: {email_err}")

        return {
            "status": "success",
            "confirmationHash": confirmation_hash,
            "rawPin": raw_otp,
        }

    except Exception as e:
        print("========== OTP ERROR ==========")
        traceback.print_exc()
        print("===============================")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate delivery OTP: {str(e)}",
        )


# ============================================================
# CREATE / SYNC BLOCKCHAIN PARCEL INTO POSTGRESQL
# ============================================================

@router.post("/sync", status_code=status.HTTP_201_CREATED)
async def sync_parcel(
    data: CreateParcelRecordRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Prevent duplicate transaction records
        if data.tx_hash:
            existing_tx_stmt = select(Parcel).where(Parcel.tx_hash == data.tx_hash)
            existing_tx_result = await db.execute(existing_tx_stmt)
            existing_tx = existing_tx_result.scalar_one_or_none()

            if existing_tx:
                return {
                    "message": "Parcel already synchronized",
                    "parcel": {
                        "id": existing_tx.id,
                        "tracking_number": existing_tx.tracking_number,
                        "tx_hash": existing_tx.tx_hash,
                        "status": existing_tx.status,
                    },
                }

        # Prevent duplicate tracking numbers
        existing_tracking_stmt = select(Parcel).where(
            Parcel.tracking_number == data.tracking_number
        )
        existing_tracking_result = await db.execute(existing_tracking_stmt)
        existing_tracking = existing_tracking_result.scalar_one_or_none()

        if existing_tracking:
            return {
                "message": "Parcel already exists",
                "parcel": {
                    "id": existing_tracking.id,
                    "tracking_number": existing_tracking.tracking_number,
                    "tx_hash": existing_tracking.tx_hash,
                    "status": existing_tracking.status,
                },
            }

        pin_value = data.pin or data.delivery_code

        new_parcel = Parcel(
            tracking_number=data.tracking_number,
            sender_id=current_user["id"],
            contents_name=data.contents_name,
            receiver_email=data.receiver_email or "Not Provided",
            receiver_phone=data.receiver_phone,
            destination_address=data.destination_address,
            pin=pin_value,
            ipfs_hash=data.ipfs_hash or None,
            tx_hash=data.tx_hash or None,
            status="Created",
            proximity_checkpoint="Created",
        )

        db.add(new_parcel)
        await db.commit()
        await db.refresh(new_parcel)

        return {
            "message": "Parcel synchronized successfully",
            "parcel": {
                "id": new_parcel.id,
                "tracking_number": new_parcel.tracking_number,
                "contents_name": new_parcel.contents_name,
                "destination_address": new_parcel.destination_address,
                "receiver_phone": new_parcel.receiver_phone,
                "status": new_parcel.status,
                "tx_hash": new_parcel.tx_hash,
                "created_at": new_parcel.created_at,
            },
        }

    except Exception as e:
        await db.rollback()
        print("========== PARCEL SYNC ERROR ==========")
        traceback.print_exc()
        print("=======================================")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to synchronize parcel: {str(e)}",
        )


# ============================================================
# RECEIVER SHIPMENTS (PUBLIC / EMAIL-BASED & AUTHENTICATED)
# ============================================================

@router.get("/receiver/{email}")
async def get_receiver_shipments_by_email(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns parcels explicitly addressed to the receiver's email with PIN verification.
    """
    try:
        clean_email = email.strip().lower()
        stmt = (
            select(Parcel)
            .where(func.trim(func.lower(Parcel.receiver_email)) == clean_email)
            .order_by(Parcel.created_at.desc())
        )
        result = await db.execute(stmt)
        parcels = result.scalars().all()

        return [
            {
                "id": p.id,
                "tracking_number": p.tracking_number,
                "contents_name": p.contents_name,
                "receiver_email": p.receiver_email,
                "receiver_phone": p.receiver_phone,
                "destination_address": p.destination_address,
                "courier_name": p.courier_name or "Assigning Courier...",
                "courier_phone": p.courier_phone or "N/A",
                "proximity_checkpoint": p.proximity_checkpoint or "Created",
                "status": p.status,
                "pin": p.pin,
                "ipfs_hash": p.ipfs_hash,
                "tx_hash": p.tx_hash,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in parcels
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/receiver-shipments")
async def get_receiver_shipments(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        user_email = current_user.get("email", "").strip().lower()
        if not user_email:
            return []

        stmt = (
            select(Parcel)
            .where(func.trim(func.lower(Parcel.receiver_email)) == user_email)
            .order_by(Parcel.created_at.desc())
        )
        result = await db.execute(stmt)
        parcels = result.scalars().all()

        return [
            {
                "id": p.id,
                "tracking_number": p.tracking_number,
                "contents_name": p.contents_name,
                "receiver_email": p.receiver_email,
                "receiver_phone": p.receiver_phone,
                "destination_address": p.destination_address,
                "courier_name": p.courier_name or "Assigning Courier...",
                "courier_phone": p.courier_phone or "N/A",
                "proximity_checkpoint": p.proximity_checkpoint or "Created",
                "status": p.status,
                "pin": p.pin,
                "ipfs_hash": p.ipfs_hash,
                "tx_hash": p.tx_hash,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in parcels
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# GET ALL SHIPMENTS
# ============================================================

@router.get("")
@router.get("/")
async def get_all_parcels(
    db: AsyncSession = Depends(get_db),
):
    try:
        stmt = select(Parcel).order_by(Parcel.created_at.desc())
        result = await db.execute(stmt)
        parcels = result.scalars().all()

        return [
            {
                "id": p.id,
                "tracking_number": p.tracking_number,
                "contents_name": p.contents_name,
                "receiver_email": p.receiver_email,
                "receiver_phone": p.receiver_phone,
                "destination_address": p.destination_address,
                "courier_name": p.courier_name or "Assigning Courier...",
                "courier_phone": p.courier_phone or "N/A",
                "courier_email": p.courier_email or "N/A",
                "courier_address": p.courier_address,
                "proximity_checkpoint": p.proximity_checkpoint or "Created",
                "status": p.status,
                "pin": p.pin,
                "ipfs_hash": p.ipfs_hash,
                "tx_hash": p.tx_hash,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in parcels
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# GET AVAILABLE PARCELS
# ============================================================

@router.get("/available")
async def get_available_parcels(db: AsyncSession = Depends(get_db)):
    try:
        stmt = (
            select(Parcel)
            .where(Parcel.status == "Created")
            .order_by(Parcel.created_at.desc())
        )
        result = await db.execute(stmt)
        parcels = result.scalars().all()

        return [
            {
                "id": p.id,
                "tracking_number": p.tracking_number,
                "contents_name": p.contents_name,
                "receiver_phone": p.receiver_phone,
                "destination_address": p.destination_address,
                "status": p.status,
                "tx_hash": p.tx_hash,
                "ipfs_hash": p.ipfs_hash,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in parcels
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# ACCEPT PARCEL
# ============================================================

@router.post("/{parcel_id}/accept")
async def accept_parcel_job(
    parcel_id: int,
    data: AcceptParcelRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Parcel).where(Parcel.id == parcel_id)
    result = await db.execute(stmt)
    parcel = result.scalar_one_or_none()

    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel with ID {parcel_id} not found")

    parcel.status = "InTransit"
    parcel.courier_address = data.courier_wallet
    parcel.courier_phone = data.courier_phone
    parcel.courier_name = data.courier_name
    parcel.courier_email = data.courier_email
    parcel.proximity_checkpoint = "Dispatched from Merchant"

    await db.commit()
    await db.refresh(parcel)

    return {
        "message": f"Parcel {parcel_id} assigned to courier",
        "status": parcel.status,
        "courier_wallet": parcel.courier_address,
        "courier_name": parcel.courier_name,
    }


def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.patch("/{parcel_id}/gps-ping")
async def update_courier_gps(
    parcel_id: int,
    location: GPSLocationUpdate,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Parcel).where(Parcel.id == parcel_id)
    result = await db.execute(stmt)
    parcel = result.scalar_one_or_none()

    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    parcel.current_lat = location.latitude
    parcel.current_lng = location.longitude

    if parcel.dest_lat and parcel.dest_lng:
        distance = calculate_distance(
            location.latitude, location.longitude, 
            parcel.dest_lat, parcel.dest_lng
        )
        parcel.distance_remaining_km = round(distance, 2)

        if distance <= 0.2:
            parcel.proximity_checkpoint = "Arrived at Destination"
        elif distance <= 1.0:
            parcel.proximity_checkpoint = "Approaching Destination (<1km)"
        else:
            parcel.proximity_checkpoint = f"In Transit ({parcel.distance_remaining_km} km away)"

    await db.commit()
    return {
        "status": "success",
        "distance_remaining_km": parcel.distance_remaining_km,
        "checkpoint": parcel.proximity_checkpoint
    }


@router.patch("/{parcel_id}/proximity")
async def update_proximity(
    parcel_id: int,
    data: ProximityUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Parcel).where(Parcel.id == parcel_id)
    result = await db.execute(stmt)
    parcel = result.scalar_one_or_none()

    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel with ID {parcel_id} not found")

    parcel.proximity_checkpoint = data.checkpoint
    await db.commit()
    await db.refresh(parcel)

    return {
        "message": "Proximity updated successfully",
        "checkpoint": parcel.proximity_checkpoint,
    }


@router.post("/{parcel_id}/confirm-delivery")
async def confirm_delivery_complete(
    parcel_id: int,
    data: ConfirmDeliveryRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Parcel).where(Parcel.id == parcel_id)
    result = await db.execute(stmt)
    parcel = result.scalar_one_or_none()

    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel with ID {parcel_id} not found")

    parcel.status = "Delivered"
    parcel.proximity_checkpoint = "Delivered"
    if data.tx_hash:
        parcel.tx_hash = data.tx_hash

    await db.commit()
    await db.refresh(parcel)

    return {
        "message": f"Parcel {parcel_id} marked as Delivered",
        "status": parcel.status,
        "proximity_checkpoint": parcel.proximity_checkpoint,
    }