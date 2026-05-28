from fastapi import APIRouter
from db import get_conn
router = APIRouter()

@router.get("/summary")
def traffic_summary():
    conn = get_conn()
    today = conn.execute("SELECT COALESCE(SUM(count),0) as c FROM traffic WHERE ts LIKE '2025-05-28%'").fetchone()["c"]
    monthly = conn.execute("SELECT DATE(ts) as day, SUM(count) as total FROM traffic WHERE ts LIKE '2025-05%' GROUP BY day ORDER BY day").fetchall()
    hourly = conn.execute("SELECT SUBSTR(ts,12,2) as hour, ROUND(AVG(count)) as avg_count FROM traffic GROUP BY hour ORDER BY hour").fetchall()
    by_dow = conn.execute("SELECT CAST(strftime('%w',ts) AS INTEGER) as dow, ROUND(AVG(count)) as avg_count FROM traffic GROUP BY dow ORDER BY dow").fetchall()
    conn.close()
    return {"today":today,"monthly":[dict(r) for r in monthly],"hourly":[dict(r) for r in hourly],"by_dow":[dict(r) for r in by_dow]}
