from fastapi import APIRouter, Query, Request
from db import get_conn
from routers.auth import verify_token

router = APIRouter()

@router.get("/")
def list_tenants(request: Request, date_from: str = Query("2025-01"), date_to: str = Query("2025-12")):
    verify_token(request)
    conn = get_conn()

    # Get all periods in range
    rows = conn.execute("""
        SELECT tenant,
               SUM(turnover) as turnover,
               SUM(traffic) as traffic,
               AVG(avg_check) as avg_check,
               AVG(new_pct) as new_pct,
               COUNT(period) as months_active
        FROM turnover
        WHERE tenant != 'Привоз, Москва'
          AND period >= ? AND period <= ?
          AND turnover > 0
        GROUP BY tenant
        ORDER BY turnover DESC
    """, (date_from, date_to)).fetchall()
    conn.close()

    result = []
    for i, r in enumerate(rows):
        result.append({
            "id": i+1,
            "name": r["tenant"],
            "turnover": r["turnover"],
            "traffic": r["traffic"],
            "avg_check": round(r["avg_check"], 0) if r["avg_check"] else None,
            "new_pct": round(r["new_pct"], 1) if r["new_pct"] else None,
            "months_active": r["months_active"],
            "debt": 0,
            "status": "active",
        })
    return result

@router.get("/periods")
def get_periods(request: Request):
    """Список доступных периодов для фильтра"""
    verify_token(request)
    conn = get_conn()
    rows = conn.execute("""
        SELECT DISTINCT period FROM turnover
        WHERE tenant = 'Привоз, Москва'
        ORDER BY period
    """).fetchall()
    conn.close()
    return [r["period"] for r in rows]
