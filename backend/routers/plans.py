from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from db import get_conn
from routers.auth import verify_token
router = APIRouter()

class PlanIn(BaseModel):
    tenant_id: int; period: str; plan_amount: float

@router.get("/")
def get_plans(request: Request, period: str = Query("2025-05")):
    verify_token(request)
    conn = get_conn()
    conn.execute("""CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER, period TEXT, plan_amount REAL,
        UNIQUE(tenant_id, period))""")
    rows = conn.execute("SELECT * FROM plans WHERE period=?", (period,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/")
def save_plan(request: Request, p: PlanIn):
    verify_token(request)
    conn = get_conn()
    conn.execute("""CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER, period TEXT, plan_amount REAL,
        UNIQUE(tenant_id, period))""")
    conn.execute("INSERT OR REPLACE INTO plans (tenant_id,period,plan_amount) VALUES (?,?,?)",
                 (p.tenant_id, p.period, p.plan_amount))
    conn.commit(); conn.close()
    return {"ok": True}
