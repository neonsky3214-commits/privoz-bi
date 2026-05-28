from fastapi import APIRouter, Query
from db import get_conn
router = APIRouter()

@router.get("/summary")
def delivery_summary(period: str = Query("2025-05")):
    conn = get_conn()
    by_platform = conn.execute("""SELECT platform, COUNT(*) as orders,
        ROUND(SUM(amount)) as revenue, ROUND(AVG(amount)) as avg_check, ROUND(AVG(rating),1) as avg_rating
        FROM delivery_orders WHERE order_date LIKE ? GROUP BY platform""", (f"{period}%",)).fetchall()
    daily = conn.execute("""SELECT order_date, platform, COUNT(*) as orders
        FROM delivery_orders WHERE order_date LIKE ? GROUP BY order_date,platform ORDER BY order_date""",
        (f"{period}%",)).fetchall()
    conn.close()
    return {"by_platform":[dict(r) for r in by_platform],"daily":[dict(r) for r in daily]}
