from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from routers import revenue, tenants, traffic, delivery, marketing, ops, forecast, upload

app = FastAPI(title="ПРИВОЗ BI Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(revenue.router,    prefix="/api/revenue",    tags=["revenue"])
app.include_router(tenants.router,    prefix="/api/tenants",    tags=["tenants"])
app.include_router(traffic.router,    prefix="/api/traffic",    tags=["traffic"])
app.include_router(delivery.router,   prefix="/api/delivery",   tags=["delivery"])
app.include_router(marketing.router,  prefix="/api/marketing",  tags=["marketing"])
app.include_router(ops.router,        prefix="/api/ops",        tags=["ops"])
app.include_router(forecast.router,   prefix="/api/forecast",   tags=["forecast"])
app.include_router(upload.router,     prefix="/api/upload",     tags=["upload"])

# Serve React frontend from /frontend/dist in production
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        return FileResponse(os.path.join(frontend_dist, "index.html"))
