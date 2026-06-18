import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                body_size = int(content_length)
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={"error": {"code": "invalid_request", "message": "Invalid request headers."}},
                )
            if body_size > settings.max_request_size_bytes:
                return JSONResponse(
                    status_code=413,
                    content={"error": {"code": "request_too_large", "message": "Request body is too large."}},
                )

        ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        window = settings.rate_limit_window_seconds
        bucket = self.requests[ip]
        while bucket and now - bucket[0] > window:
            bucket.popleft()
        if len(bucket) >= settings.rate_limit_requests:
            return JSONResponse(
                status_code=429,
                content={"error": {"code": "rate_limited", "message": "Too many requests. Please retry shortly."}},
            )
        bucket.append(now)
        return await call_next(request)
