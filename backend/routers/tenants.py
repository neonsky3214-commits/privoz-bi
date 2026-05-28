from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from db import get_conn
router = APIRouter()

class TenantCreate(BaseModel):
    name: str; category: Optional[str]=None; area_sqm: Optional[float]=None; rent_rate: Optional[float]=None

@router.get("/")
def list_tenants(period: str = Query("2025-05")):
    conn = get_conn()
    rows = conn.execute("""SELECT t.id,t.name,t.category,t.area_sqm,t.rent_rate,t.status,
        COALESCE(SUM(r.amount),0) as revenue,
        COALESCE(SUM(CASE WHEN r.paid=0 THEN r.amount ELSE 0 END),0) as debt
        FROM tenants t LEFT JOIN revenue r ON r.tenant_id=t.id AND r.period=?
        WHERE t.status='active' GROUP BY t.id ORDER BY revenue DESC""", (period,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/")
def create_tenant(t: TenantCreate):
    conn = get_conn()
    cur = conn.execute("INSERT INTO tenants (name,category,area_sqm,rent_rate) VALUES (?,?,?,?)",
                       (t.name,t.category,t.area_sqm,t.rent_rate))
    conn.commit(); conn.close()
    return {"id":cur.lastrowid,**t.dict()}
