from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse

from app.api.routes import router
from app.config import settings
from app.security.audit_logger import audit_log
from app.security.rate_limiter import RateLimitMiddleware
from app.services.ai_service import gemini_enabled


app = FastAPI(
    title=settings.app_name,
    description="AI-powered contract intelligence API",
    version="1.0.0",
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
