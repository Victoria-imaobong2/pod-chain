from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import Base, engine, get_db
from models import UserModel, UserRole
from auth_utils import verify_password, hash_password, create_access_token
from routers.parcels import router as parcel_router

app = FastAPI(
    title="PodChain Auth Service",
    description="API for PodChain Application",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request Schemas ---

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.SME  # Default role or passed from frontend
    phone_number: str | None = None
    wallet_address: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Endpoints ---

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    stmt = select(UserModel).where(UserModel.email == user_data.email)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered. Login or use a different email address.",
        )

    # Single clean instantiation
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
    }

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
@app.post("/api/auth/login")
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(UserModel).where(UserModel.email == credentials.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password, retry with correct credentials.",
        )

    # Encode user details into JWT token
    token_data = {
        "sub": user.email,
        "id": user.id,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
    }

    access_token = create_access_token(data=token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
            "wallet_address": user.wallet_address,
        },
    }


app.include_router(parcel_router)


@app.get("/")
def read_root():
    return {"message": "POD Chain Backend API is Running"}