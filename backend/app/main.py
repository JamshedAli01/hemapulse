import logging
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.db.session import get_db
from app.api.routes import auth, donors, requests, matching, notifications, dashboard, hospitals, ai, donations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# docs_url=None disables the default /docs so we can serve our custom one
app = FastAPI(
    title="Smart Blood & Emergency Donor Network API",
    version="1.0.0",
    docs_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# ---------------------------------------------------------------------------
# Custom Swagger UI — auto-authorizes with the dev admin account on load
# ---------------------------------------------------------------------------
_AUTO_AUTH_JS = """
<script>
(function autoAuthorize() {
  // Wait until SwaggerUIBundle is ready
  const MAX_ATTEMPTS = 40;
  let attempts = 0;

  function tryAuth() {
    attempts++;
    const ui = window.ui;
    if (!ui) {
      if (attempts < MAX_ATTEMPTS) setTimeout(tryAuth, 250);
      return;
    }

    // Only auto-auth if no token is already stored
    const stored = ui.getConfigs ? ui.getConfigs().persistAuthorization : false;
    const authState = ui.authSelectors ? ui.authSelectors.authorized().toJS() : {};
    if (Object.keys(authState).length > 0) return; // already authorized

    const formData = new URLSearchParams();
    formData.append("username", "admin@bloodnet.pk");
    formData.append("password", "Hackathon@123");

    fetch("/api/auth/swagger-login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.access_token) return;
        ui.authActions.authorize({
          BearerAuth: {
            name: "BearerAuth",
            schema: { type: "http", scheme: "bearer" },
            value: data.access_token,
          },
        });
        console.log("[AutoAuth] Swagger authorized as admin@bloodnet.pk ✓");
      })
      .catch((e) => console.error("[AutoAuth] Failed:", e));
  }

  // Swagger UI fires a custom event when it's ready
  window.addEventListener("load", () => setTimeout(tryAuth, 500));
})();
</script>
"""


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    html = get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Smart Blood & Emergency Donor Network API — Dev",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )
    # Inject our auto-auth script just before </body>
    patched = html.body.decode().replace("</body>", f"{_AUTO_AUTH_JS}\n</body>")
    return HTMLResponse(content=patched)


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

