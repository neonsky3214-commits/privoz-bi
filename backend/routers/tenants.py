from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from typing import Optional
from db import get_conn
from routers.auth import verify_token
router = APIRouter()

class TenantCreate(BaseModel):
    name: str; category: Optional[str]=None; area_sqm: Optional[float]=None; rent_rate: Optional[float]=None

@router.get("/")
def list_tenants(request: Request, period: str = Query("2025-05")):
    verify_token(request)
    conn = get_conn()
    rows = conn.execute("""
        SELECT t.id,t.name,t.category,t.area_sqm,t.rent_rate,t.status,
               COALESCE(SUM(r.amount),0) as revenue,
               COALESCE(SUM(CASE WHEN r.paid=0 THEN r.amount ELSE 0 END),0) as debt,
               COALESCE(AVG(d.amount),0) as avg_check
        FROM tenants t
        LEFT JOIN revenue r ON r.tenant_id=t.id AND r.period=?
        LEFT JOIN delivery_orders d ON d.tenant_id=t.id AND d.order_date LIKE ?
        WHERE t.status='active' GROUP BY t.id ORDER BY revenue DESC
    """, (period, f"{period}%")).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/")
def create_tenant(request: Request, t: TenantCreate):
    verify_token(request)
    conn = get_conn()
    cur = conn.execute("INSERT INTO tenants (name,category,area_sqm,rent_rate) VALUES (?,?,?,?)",
                       (t.name,t.category,t.area_sqm,t.rent_rate))
    conn.commit(); conn.close()
    return {"id":cur.lastrowid,**t.dict()}
