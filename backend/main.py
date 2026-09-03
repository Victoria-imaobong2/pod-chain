from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.future import select

# Model & Database imports
from database import Base, engine, get_db
import models
from models import UserModel, Parcel, UserRole
from auth_utils import verify_password, hash_password, create_access_token
from routers.parcels import router as parcel_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize all database tables in Neon
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # 2. Add any missing geolocation/telemetry columns safely
        alter_queries = [
            "ALTER TABLE parcels ADD COLUMN IF NOT EXISTS dest_lat DOUBLE PRECISION;",
            "ALTER TABLE parcels ADD COLUMN IF NOT EXISTS dest_lng DOUBLE PRECISION;",
            "ALTER TABLE parcels ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION;",
            "ALTER TABLE parcels ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;",
            "ALTER TABLE parcels ADD COLUMN IF NOT EXISTS distance_remaining_km DOUBLE PRECISION;",
        ]
        for query in alter_queries:
            try:
                await conn.execute(text(query))
            except Exception as e:
                print(f"Migration note: {e}")

    yield

    # Cleanup on shutdown
    await engine.dispose()


app = FastAPI(
    title="PodChain Auth Service",
    description="API for PodChain Application",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request Schemas ---

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole 
    phone_number: str | None = None
    wallet_address: str | None = None

    @field_validator("role", mode="before")
    @classmethod
    def match_enum(cls, v):
        if isinstance(v, str):
            val = v.strip()
            # Match against enum name (COURIER) or value ("courier" / "COURIER")
            for member in UserRole:
                if member.name.lower() == val.lower() or str(member.value).lower() == val.lower():
                    return member
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    selected_role: Optional[str] = None  # "SME", "COURIER", or "RECEIVER"

# --- Endpoints ---

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(UserModel).where(UserModel.email == user_data.email)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered. Login or use a different email address.",
        )

    new_user = UserModel(
        name=user_data.name,
        email=user_data.email,
        phone_number=user_data.phone_number,
        password_hash=hash_password(user_data.password),
        wallet_address=user_data.wallet_address,
        role=user_data.role,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "id": new_user.id,
        "email": new_user.email,
        "role": new_user.role.value if hasattr(new_user.role, "value") else str(new_user.role),
    }


@app.post("/api/auth/login")
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    clean_email = credentials.email.lower().strip()
    stmt = select(UserModel).where(UserModel.email == clean_email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password, retry with correct credentials.",
        )

    # Pick the frontend-chosen role or fall back to the registered database role
    if credentials.selected_role:
        role_str = str(credentials.selected_role).upper()
    else:
        raw_role = user.role
        role_str = raw_role.value if hasattr(raw_role, "value") else str(raw_role)
        role_str = role_str.upper()

    token_data = {
        "sub": user.email,
        "id": user.id,
        "role": role_str,
    }

    access_token = create_access_token(data=token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role_str,
            "wallet_address": user.wallet_address,
        },
    }


app.include_router(parcel_router)

@app.get("/")
def read_root():
    return {"message": "POD Chain Backend API is Running"}