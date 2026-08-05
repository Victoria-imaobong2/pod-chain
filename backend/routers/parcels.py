import io
import base64
import os
import qrcode
from typing import Optional
from datetime import datetime, time
from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel, EmailStr
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import traceback

# Adjust these imports according to your project setup
from database import get_db
from models import Parcel  # Import your SQLAlchemy Parcel model
from auth_utils import get_current_user

router = APIRouter(
    prefix="/api/v1/parcels",
    tags=["Parcels & Notifications"]
)

# Email Configuration from environment variables
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=465,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    MAIL_FROM_NAME="POD Chain Logistics",
    TIMEOUT=15
)


class NotifyRequest(BaseModel):
    parcelId: int | str
    receiverEmail: EmailStr
    receiverPhone: str
    pin: str
    ipfsHash: Optional[str] = ""
    txHash: Optional[str] = ""
    senderAddress: Optional[str] = ""


# ---------------------------------------------------------
# Async Database Endpoint: Fetch User Shipments
# ---------------------------------------------------------
@router.get("/user-shipments")
async def get_user_shipments(
    start_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Format: YYYY-MM-DD"),
    limit: Optional[int] = Query(None, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Build async SQLAlchemy select query
        stmt = select(Parcel).where(Parcel.sender_id == current_user["id"])

        if start_date:
            parsed_start = datetime.strptime(start_date, "%Y-%m-%d")
            stmt = stmt.where(Parcel.created_at >= parsed_start)

        if end_date:
            parsed_end = datetime.combine(
                datetime.strptime(end_date, "%Y-%m-%d").date(),
                time.max
            )
            stmt = stmt.where(Parcel.created_at <= parsed_end)

        stmt = stmt.order_by(Parcel.created_at.desc())

        if limit:
            stmt = stmt.limit(limit)

        # Execute asynchronously
        result = await db.execute(stmt)
        shipments = result.scalars().all()
        return shipments

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {str(e)}"
        )


# ---------------------------------------------------------
# Async Endpoint: Notify Receiver & Send QR Email
# ---------------------------------------------------------
@router.post("/notify")
async def process_delivery_secret(
    payload: NotifyRequest
):
    try:
        # 1. Generate QR Code
        qr_data = f"POD_PARCEL:{payload.txHash}|PIN:{payload.pin}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_bytes = buffered.getvalue()

        qr_base64 = base64.b64encode(img_bytes).decode("utf-8")
        qr_data_url = f"data:image/png;base64,{qr_base64}"

        # 2. HTML Email Content
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #0d9488;">📦 Package Delivery Incoming!</h2>
                    <p>Hello,</p>
                    <p>A new parcel has been dispatched to you via <strong>POD Chain Escrow</strong>.</p>
                    
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold; color: #166534;">Your Delivery PIN:</p>
                        <h1 style="margin: 8px 0; color: #0d9488; letter-spacing: 4px;">{payload.pin}</h1>
                        <p style="margin: 0; font-size: 12px; color: #15803d;">Provide this PIN or present the attached QR code to the courier upon delivery.</p>
                    </div>

                    <p><strong>Transaction Hash:</strong> <code style="font-size: 11px;">{payload.txHash}</code></p>
                    <p><strong>Package Proof (IPFS):</strong> {payload.ipfsHash}</p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="font-size: 12px; color: #64748b; text-align: center;">POD Chain • Decentralized Proof of Delivery</p>
                </div>
            </body>
        </html>
        """

        # 3. Message schema with Reply-To set to sender address
        mail_from = os.getenv("MAIL_FROM") or "noreply@podchain.com"
        reply_to_email = payload.senderAddress if (payload.senderAddress and "@" in payload.senderAddress) else mail_from
        message = MessageSchema(
            subject="📦 Your Package Delivery Details & QR Code",
            recipients=[payload.receiverEmail],
            body=html_content,
            subtype=MessageType.html,
            reply_to=[reply_to_email],
            
            
        )

        # 4. Send email synchronously so SMTP failures surface to the caller
        fm = FastMail(conf)
        try:
            await fm.send_message(message)
        except Exception as mail_error:
            print("--- EMAIL SEND FAILED ---")
            traceback.print_exc()
            print("-------------------------")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to send notification email to {payload.receiverEmail}: {str(mail_error)}"
            )

        return {
            "status": "success",
            "parcelId": payload.parcelId,
            "qrCodeUrl": qr_data_url,
            "message": "Notification email sent successfully."
        }

    except HTTPException:
        # Re-raise HTTP errors (e.g. email failure) untouched
        raise
    except Exception as e:
        print("--- NOTIFY ENDPOINT ERROR STACKTRACE ---")
        traceback.print_exc()
        print("---------------------------------------")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate QR notification: {str(e)}"
        )