from fastapi import APIRouter, Query
from db import get_conn

router = APIRouter()

@router.get("/summary")
def revenue_summary(period: str = Query("2025-05")):
    conn = get_conn()
    cur = conn.cursor()

    total = cur.execute(
        "SELECT COALESCE(SUM(amount),0) as total FROM revenue WHERE period=?", (period,)
    ).fetchone()["total"]

    paid_pct = cur.execute(
        "SELECT ROUND(100.0 * SUM(paid) / COUNT(*), 1) as pct FROM revenue WHERE period=?", (period,)
    ).fetchone()["pct"] or 0

    debt = cur.execute(
        """SELECT t.name, SUM(r.amount) as debt
           FROM revenue r JOIN tenants t ON t.id=r.tenant_id
           WHERE r.paid=0 AND r.period<?
           GROUP BY r.tenant_id ORDER BY debt DESC LIMIT 5""",
        (period,)
    ).fetchall()

    conn.close()
    return {
        "period": period,
        "total": round(total),
        "paid_pct": paid_pct,
        "debt_tenants": [dict(r) for r in debt],
        "debt_total": round(sum(r["debt"] for r in debt)),
    }

@router.get("/monthly")
def revenue_monthly():
    conn = get_conn()
    rows = conn.execute(
        "SELECT period, SUM(amount) as total, type FROM revenue GROUP BY period, type ORDER BY period"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/by-tenant")
def revenue_by_tenant(period: str = Query("2025-05")):
    conn = get_conn()
    rows = conn.execute(
        """SELECT t.name, t.category, SUM(r.amount) as revenue, r.paid
           FROM revenue r JOIN tenants t ON t.id=r.tenant_id
           WHERE r.period=? GROUP BY r.tenant_id""",
        (period,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
