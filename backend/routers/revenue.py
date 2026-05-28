from fastapi import APIRouter, Request, Query
from db import get_conn
from routers.auth import verify_token
router = APIRouter()

@router.get("/summary")
def revenue_summary(period: str = Query("2025-05")):
    conn = get_conn()
    total = conn.execute("SELECT COALESCE(SUM(amount),0) as t FROM revenue WHERE period=?", (period,)).fetchone()["t"]
    paid_pct = conn.execute("SELECT ROUND(100.0*SUM(paid)/MAX(COUNT(*),1),1) as p FROM revenue WHERE period=?", (period,)).fetchone()["p"] or 0
    debt = conn.execute("""SELECT t.name, SUM(r.amount) as debt FROM revenue r
        JOIN tenants t ON t.id=r.tenant_id WHERE r.paid=0 AND r.period<?
        GROUP BY r.tenant_id ORDER BY debt DESC LIMIT 5""", (period,)).fetchall()
    conn.close()
    return {"period":period,"total":round(total),"paid_pct":paid_pct,
            "debt_tenants":[dict(r) for r in debt],"debt_total":round(sum(r["debt"] for r in debt))}

@router.get("/monthly")
def revenue_monthly():
    conn = get_conn()
    rows = conn.execute("SELECT period, SUM(amount) as total, type FROM revenue GROUP BY period,type ORDER BY period").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/by-tenant")
def revenue_by_tenant(period: str = Query("2025-05")):
    conn = get_conn()
    rows = conn.execute("""SELECT t.name,t.category,COALESCE(SUM(r.amount),0) as revenue,
        COALESCE(MAX(r.paid),0) as paid FROM tenants t
        LEFT JOIN revenue r ON r.tenant_id=t.id AND r.period=?
        WHERE t.status='active' GROUP BY t.id""", (period,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]
