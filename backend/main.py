from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import UserModel, UserRole
from auth_utils import verify_password, hash_password, create_access_token

#For automatic generation of Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PodChain Auth Service", description="API for PodChain Application", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    wallet_address: str = None

# --- Endpoints for Authorization ---
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    # Checking if another user with the same email exists
    db_user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
    if db_user:
        raise HTTPException(ststus_code=400, detail="Email is already registered, Login or use a different email address.")
    
    new_user = UserModel(
        name=user_data.name,
        email=user_data.email,
        password_=hash_password(user_data.password),
        wallet_address=user_data.wallet_address,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered Successfully", "id": new_user.id}

@app.post("api/auth/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password, retary with right email"
        )
    