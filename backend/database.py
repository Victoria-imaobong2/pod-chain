import os
import ssl
from urllib.parse import urlsplit, parse_qsl, urlunsplit, urlencode
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

load_dotenv()

RAW_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/podchain",
)

# 1. Normalize Postgres driver prefix for asyncpg
if RAW_DATABASE_URL.startswith("postgres://"):
    RAW_DATABASE_URL = RAW_DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif RAW_DATABASE_URL.startswith("postgresql://") and not RAW_DATABASE_URL.startswith("postgresql+asyncpg://"):
    RAW_DATABASE_URL = RAW_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# 2. Strip libpq-only parameters (like channel_binding and sslmode) that asyncpg rejects
parsed = urlsplit(RAW_DATABASE_URL)
clean_query_params = []
for k, v in parse_qsl(parsed.query):
    if k.lower() not in {"sslmode", "channel_binding", "gssencmode"}:
        clean_query_params.append((k, v))

clean_query = urlencode(clean_query_params)
DATABASE_URL = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, clean_query, parsed.fragment))

# 3. Configure SSL context for Neon/Cloud Postgres
connect_args = {}
if "neon.tech" in DATABASE_URL or "aws" in DATABASE_URL or "render.com" in DATABASE_URL:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ctx

# 4. Create the ASYNC engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args=connect_args,
)

# 5. Create the ASYNC session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

# 6. Async dependency generator for FastAPI endpoints
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()