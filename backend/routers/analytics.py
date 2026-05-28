"""
analytics.py — роутеры для реальных данных из таблицы turnover:
- /api/analytics/overview     — сводка по фудмоллу
- /api/analytics/tenants      — топ арендаторов по товарообороту
- /api/analytics/traffic      — реальный трафик и средний чек
- /api/analytics/seasonality  — сезонность год-к-году
- /api/analytics/new-vs-return — новые vs повторные посетители
- /api/analytics/weather       — товарооборот vs температура
"""
from fastapi import APIRouter, Query, Request
from db import get_conn
from routers.auth import verify_token

router = APIRouter()

@router.get("/overview")
def overview(request: Request, period: str = Query("2025-12")):
    verify_token(request)
    conn = get_conn()
    year = period[:4]

    # Total turnover for Привоз (whole mall)
    row = conn.execute("""
        SELECT turnover, traffic, avg_check, new_pct, return_pct
        FROM turnover WHERE tenant='Привоз, Москва' AND period=?
    """, (period,)).fetchone()

    # YoY comparison
    prev_year_period = f"{int(year)-1}{period[4:]}"
    prev = conn.execute("""
        SELECT turnover, traffic FROM turnover
        WHERE tenant='Привоз, Москва' AND period=?
    """, (prev_year_period,)).fetchone()

    # YTD
    ytd = conn.execute("""
        SELECT SUM(turnover) as total, SUM(traffic) as visits
        FROM turnover WHERE tenant='Привоз, Москва' AND period LIKE ?
    """, (f"{year}%",)).fetchone()

    # Active tenants this period
    active = conn.execute("""
        SELECT COUNT(DISTINCT tenant) as c FROM turnover
        WHERE period=? AND tenant != 'Привоз, Москва' AND turnover > 0
    """, (period,)).fetchone()["c"]

    conn.close()

    def pct_change(new, old):
        if not old or old == 0: return None
        return round((new - old) / old * 100, 1)

    return {
        "period": period,
        "turnover": dict(row) if row else {},
        "yoy_turnover": pct_change(row["turnover"] if row else 0, prev["turnover"] if prev else 0),
        "yoy_traffic": pct_change(row["traffic"] if row else 0, prev["traffic"] if prev else 0),
        "ytd_turnover": ytd["total"] if ytd else 0,
        "ytd_visits": ytd["visits"] if ytd else 0,
        "active_tenants": active,
    }

@router.get("/tenants")
def tenants_turnover(request: Request, period: str = Query("2025"), limit: int = Query(20)):
    verify_token(request)
    conn = get_conn()
    # If period is YYYY-MM use month, if YYYY use year
    if len(period) == 7:
        where = "period=?"
        param = period
    else:
        where = "period LIKE ?"
        param = f"{period}%"

    rows = conn.execute(f"""
        SELECT tenant,
               SUM(turnover) as turnover,
               AVG(avg_check) as avg_check,
               MAX(new_pct) as new_pct
        FROM turnover
        WHERE {where} AND tenant != 'Привоз, Москва' AND turnover > 0
        GROUP BY tenant
        ORDER BY turnover DESC
        LIMIT ?
    """, (param, limit)).fetchall()
    conn.close()
    return [{"tenant": r["tenant"], "turnover": r["turnover"],
             "avg_check": round(r["avg_check"], 0) if r["avg_check"] else None,
             "new_pct": round(r["new_pct"], 1) if r["new_pct"] else None}
            for r in rows]

@router.get("/traffic")
def traffic_real(request: Request, months: int = Query(12)):
    verify_token(request)
    conn = get_conn()
    rows = conn.execute("""
        SELECT period, traffic, avg_check, new_pct, return_pct, turnover, temp
        FROM turnover WHERE tenant='Привоз, Москва'
        ORDER BY period DESC LIMIT ?
    """, (months,)).fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]

@router.get("/seasonality")
def seasonality(request: Request):
    verify_token(request)
    conn = get_conn()
    rows = conn.execute("""
        SELECT period, turnover, traffic
        FROM turnover WHERE tenant='Привоз, Москва'
        ORDER BY period
    """).fetchall()
    conn.close()

    # Group by year and month
    by_year = {}
    for r in rows:
        y, m = r["period"][:4], int(r["period"][5:7])
        if y not in by_year:
            by_year[y] = {}
        by_year[y][m] = {"turnover": r["turnover"], "traffic": r["traffic"]}

    months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"]
    result = []
    for m_idx, m_name in enumerate(months, 1):
        row = {"month": m_name}
        for year in sorted(by_year.keys()):
            d = by_year[year].get(m_idx, {})
            row[year] = d.get("turnover")
        result.append(row)
    return result

@router.get("/new-vs-return")
def new_vs_return(request: Request, months: int = Query(12)):
    verify_token(request)
    conn = get_conn()
    rows = conn.execute("""
        SELECT period, new_pct, return_pct, traffic
        FROM turnover WHERE tenant='Привоз, Москва' AND new_pct IS NOT NULL
        ORDER BY period DESC LIMIT ?
    """, (months,)).fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]

@router.get("/tenant-history")
def tenant_history(request: Request, tenant: str = Query(...)):
    verify_token(request)
    conn = get_conn()
    rows = conn.execute("""
        SELECT period, turnover, avg_check, temp
        FROM turnover WHERE tenant=? ORDER BY period
    """, (tenant,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/tenant-list")
def tenant_list(request: Request):
    verify_token(request)
    conn = get_conn()
    rows = conn.execute("""
        SELECT DISTINCT tenant FROM turnover
        WHERE tenant != 'Привоз, Москва' AND turnover > 0
        ORDER BY tenant
    """).fetchall()
    conn.close()
    return [r["tenant"] for r in rows]
