from fastapi import APIRouter
from db import get_conn
router = APIRouter()

@router.get("/social")
def social():
    conn = get_conn()
    rows = conn.execute("SELECT period,platform,metric,value FROM marketing_metrics WHERE platform IN ('instagram','vk','telegram') ORDER BY period,platform").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/ads")
def ads():
    conn = get_conn()
    rows = conn.execute("SELECT period,platform,SUM(value) as spend FROM marketing_metrics WHERE platform IN ('yandex_direct','vk_ads') GROUP BY period,platform ORDER BY period").fetchall()
    conn.close()
    return [dict(r) for r in rows]
