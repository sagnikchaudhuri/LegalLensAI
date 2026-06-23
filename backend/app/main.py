import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse

from app.api.routes import router
from app.config import settings
from app.security.audit_logger import audit_log
from app.security.rate_limiter import RateLimitMiddleware
from app.services.embedding_service import warmup_embedding_model


logger = logging.getLogger("legallens")
PRODUCTION_FRONTEND_ORIGIN = "https://legal-lensai.vercel.app"


def _split_origins(value: str | None) -> list[str]:
    if not value:
        return []
    return [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]


def _cors_origins() -> list[str]:
    origins = [
        * _split_origins(settings.frontend_url),
        * _split_origins(settings.cors_allowed_origins),
        PRODUCTION_FRONTEND_ORIGIN,
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ]
    return list(dict.fromkeys(origins))


async def _warmup_embeddings() -> None:
    logger.info("Starting embedding model warmup: %s on %s", settings.embedding_model_name, settings.embedding_device)
    ready, message = await asyncio.to_thread(warmup_embedding_model)
    if ready:
        logger.info(message)
    else:
        logger.warning("Embedding model warmup did not complete: %s", message)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.embedding_warmup_on_start:
        asyncio.create_task(_warmup_embeddings())
    yield


app = FastAPI(
    title=settings.app_name,
    description="AI-powered contract intelligence API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=settings.cors_allow_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "X-Document-Token", "Accept", "Origin"],
)
app.add_middleware(RateLimitMiddleware)
app.include_router(router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "request_error", "message": str(exc.detail)}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(
        "Validation error for %s: %s",
        request.url.path,
        [{"loc": error.get("loc"), "type": error.get("type")} for error in exc.errors()],
    )
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": "Invalid request data."}},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server error for %s", request.url.path)
    audit_log(
        "security_warning",
        "failed",
        "Unhandled server error suppressed from API response.",
        client_ip=request.client.host if request.client else None,
    )
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "server_error", "message": "An internal error occurred."}},
    )


@app.get("/")
def health_check():
    return {"status": "ok", "service": "LegalLens AI Backend"}


@app.get("/api/health")
def api_health_check():
    return {"status": "ok", "api": "healthy"}
