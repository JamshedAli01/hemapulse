import logging
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.db.session import get_db
from app.api.routes import auth, donors, requests, matching, notifications, dashboard, hospitals, ai, donations, responses

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# docs_url=None disables the default /docs so we can serve our custom one
app = FastAPI(
    title="Smart Blood & Emergency Donor Network API",
    version="1.0.0",
    docs_url=None,
)

app.include_router(auth.router)
app.include_router(donors.router)
app.include_router(requests.router)
app.include_router(matching.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(hospitals.router)
app.include_router(ai.router)
app.include_router(donations.router)
app.include_router(responses.router)


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    html = get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Smart Blood & Emergency Donor Network API — Dev",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )
    return HTMLResponse(content=html.body.decode())


# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    if settings.ENVIRONMENT == "development":
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(exc)},
        )
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1")).scalar()
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        db_status = "error"

    return {"status": "ok", "database": db_status}


# Ensure CORS headers are also present on unhandled exceptions.
app = CORSMiddleware(
    app=app,
    allow_origins=[
        "https://hemapulse-app.netlify.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
