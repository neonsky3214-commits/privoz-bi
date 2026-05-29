from fastapi import APIRouter, Query, Request
from db import get_conn
from routers.auth import verify_token

router = APIRouter()

def ensure_table(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS bdds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT, name TEXT, period TEXT,
        plan REAL, fact REAL,
        UNIQUE(code, period))""")

@router.get("/summary")
def bdds_summary(request: Request, year: str = Query("2026")):
    verify_token(request)
    conn = get_conn(); ensure_table(conn)

    # Key metrics for the year
    rows = conn.execute("""
        SELECT code, name,
               SUM(plan) as plan_total,
               SUM(fact) as fact_total
        FROM bdds
        WHERE period LIKE ? AND period NOT LIKE '%-12'
        GROUP BY code
        ORDER BY code
    """, (f"{year}-%",)).fetchall()

    # Monthly cashflow
    monthly = conn.execute("""
        SELECT b1.period,
               b1.plan as income_plan, b1.fact as income_fact,
               b2.plan as expense_plan, b2.fact as expense_fact
        FROM bdds b1
        LEFT JOIN bdds b2 ON b2.period = b1.period AND b2.code = '2'
        WHERE b1.code = '1' AND b1.period LIKE ?
        ORDER BY b1.period
    """, (f"{year}-%",)).fetchall()

    conn.close()
    return {
        "year": year,
        "items": [dict(r) for r in rows],
        "monthly": [dict(r) for r in monthly],
    }

@router.get("/plan-fact")
def bdds_plan_fact(request: Request, date_from: str = Query("2026-01"), date_to: str = Query("2026-12")):
    verify_token(request)
    conn = get_conn(); ensure_table(conn)

    rows = conn.execute("""
        SELECT code, name, period, plan, fact
        FROM bdds
        WHERE period >= ? AND period <= ? AND period NOT LIKE '%-12'
        ORDER BY period, code
    """, (date_from, date_to)).fetchall()

    conn.close()
    return [dict(r) for r in rows]

@router.get("/breakdown")
def bdds_breakdown(request: Request, period: str = Query("2026-03")):
    """Детализация за конкретный месяц"""
    verify_token(request)
    conn = get_conn(); ensure_table(conn)

    rows = conn.execute("""
        SELECT code, name, plan, fact,
               CASE WHEN plan > 0 THEN ROUND((COALESCE(fact,0) - plan) / plan * 100, 1) ELSE NULL END as deviation_pct
        FROM bdds WHERE period = ?
        ORDER BY code
    """, (period,)).fetchall()

    conn.close()
    return [dict(r) for r in rows]

@router.get("/years")
def bdds_years(request: Request):
    verify_token(request)
    conn = get_conn(); ensure_table(conn)
    rows = conn.execute("SELECT DISTINCT SUBSTR(period,1,4) as year FROM bdds ORDER BY year").fetchall()
    conn.close()
    return [r["year"] for r in rows]
