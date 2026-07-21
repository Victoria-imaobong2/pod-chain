# backend/parcels.py (or backend/routers/parcels.py)
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import qrcode
import io
import base64

router = APIRouter(
    prefix="/api/v1/parcels",
    tags=["Parcels & Notifications"]
)

class NotifyRequest(BaseModel):
    parcelId: int
    receiverEmail: EmailStr
    receiverPhone: str
    pin: str

@router.post("/notify")
async def process_delivery_secret(payload: NotifyRequest):
    try:
        # 1. Generate the QR Code in memory
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(payload.pin)
        qr.make(fit=True)

        # 2. Render image to an in-memory buffer
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")

        # 3. Convert image bytes to Base64 URI (easy to render in React/Emails)
        qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        qr_data_url = f"data:image/png;base64,{qr_base64}"

        # 4. Save to Database & Send Email/SMS (Placeholder forthe DB/mailer service)
        # await save_parcel_pin_to_db(payload.parcelId, payload.pin, qr_data_url)
        # await send_email_notification(to=payload.receiverEmail, pin=payload.pin, qr_url=qr_data_url)

        return {
            "status": "success",
            "parcelId": payload.parcelId,
            "qrCodeUrl": qr_data_url,
            "message": "Notification generated and queued successfully."
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate QR notification: {str(e)}"
        )