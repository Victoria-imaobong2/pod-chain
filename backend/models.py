import enum
from sqlalchemy import Column, Integer, String, Enum
from database import Base

class UserRole(str, enum.Enum):
    SME = "SME"
    COURIER = "COURIER"
    RECEIVER = "RECEIVER"

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String, unique=True, index=True, nullable=False)
    wallet_address = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)

    