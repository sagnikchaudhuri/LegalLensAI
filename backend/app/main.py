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
from app.services.ai_service import gemini_enabled
from app.services.embedding_service import warmup_embedding_model


logger = logging.getLogger("legallens")


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
    allow_origins=[settings.frontend_url, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": "Invalid request data."}},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
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
    return {
        "status": "healthy",
        "service": settings.app_name,
        "mode": "gemini" if gemini_enabled() else "local-rules",
    }
