from fastapi import APIRouter, Query
from db import get_conn

router = APIRouter()

@router.get("/complaints")
def complaints(period: str = Query("2025-05")):
    conn = get_conn()
    by_cat = conn.execute("""
        SELECT category, COUNT(*) as count
        FROM complaints WHERE created_at LIKE ?
        GROUP BY category ORDER BY count DESC
    """, (f"{period}%",)).fetchall()

    recent = conn.execute("""
        SELECT c.category, c.severity, c.created_at, t.name as tenant
        FROM complaints c
        LEFT JOIN tenants t ON t.id=c.tenant_id
        ORDER BY c.created_at DESC LIMIT 10
    """).fetchall()

    conn.close()
    return {
        "by_category": [dict(r) for r in by_cat],
        "recent": [dict(r) for r in recent],
        "total": sum(r["count"] for r in by_cat),
    }

@router.get("/nps")
def nps():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM nps ORDER BY period").fetchall()
    conn.close()
    return [dict(r) for r in rows]
