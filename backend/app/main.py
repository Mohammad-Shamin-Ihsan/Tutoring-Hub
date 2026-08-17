import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers import admin, auth, contact, inquiries, lookups, tutors

# Uvicorn only configures its own "uvicorn.*" loggers, not the root logger,
# so app-level logger.info() calls (e.g. the "SMTP not configured, logging
# email instead" fallback) would otherwise be silently dropped below the
# root logger's default WARNING threshold and never reach the console.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

logger = logging.getLogger("tutorhub")

settings = get_settings()

app = FastAPI(title="TutorHub UAE API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(lookups.router)
app.include_router(tutors.router)
app.include_router(inquiries.router)
app.include_router(contact.router)
app.include_router(admin.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Starlette's ServerErrorMiddleware sits outside CORSMiddleware, so a
    # response built here never passes back through it. Without manually
    # setting the header, every real 500 would show up in the browser as a
    # misleading "blocked by CORS policy" error instead of the actual
    # problem. Echo the request's Origin back if it's an allowed one.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    headers = {}
    origin = request.headers.get("origin")
    if origin in settings.cors_origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(status_code=500, content={"detail": "Internal server error"}, headers=headers)
