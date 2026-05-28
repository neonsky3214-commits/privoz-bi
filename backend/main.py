from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from routers import revenue, tenants, traffic, delivery, marketing, ops, forecast, upload

app = FastAPI(title="ПРИВОЗ BI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(revenue.router,   prefix="/api/revenue")
app.include_router(tenants.router,   prefix="/api/tenants")
app.include_router(traffic.router,   prefix="/api/traffic")
app.include_router(delivery.router,  prefix="/api/delivery")
app.include_router(marketing.router, prefix="/api/marketing")
app.include_router(ops.router,       prefix="/api/ops")
app.include_router(forecast.router,  prefix="/api/forecast")
app.include_router(upload.router,    prefix="/api/upload")

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist,"assets")), name="assets")
    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        return FileResponse(os.path.join(frontend_dist,"index.html"))
