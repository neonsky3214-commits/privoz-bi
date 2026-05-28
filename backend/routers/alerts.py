from fastapi import APIRouter, Query, Request
from db import get_conn
from routers.auth import verify_token
router = APIRouter()

@router.get("/")
def get_alerts(request: Request, period: str = Query("2025-05")):
    verify_token(request)
    conn = get_conn()
    alerts = []

    # Debt alerts
    debt = conn.execute("""
        SELECT t.name, SUM(r.amount) as debt FROM revenue r
        JOIN tenants t ON t.id=r.tenant_id
        WHERE r.paid=0 AND r.period < ?
        GROUP BY r.tenant_id HAVING debt > 50000
    """, (period,)).fetchall()
    for d in debt:
        alerts.append({"level":"red","message":f"💸 {d['name']} — долг {round(d['debt']/1000)}К ₽ не оплачен более месяца"})

    # NPS alert
    nps = conn.execute("SELECT score FROM nps ORDER BY period DESC LIMIT 1").fetchone()
    if nps and nps["score"] < 60:
        alerts.append({"level":"red","message":f"📉 NPS упал до {nps['score']} — ниже критического порога"})
    elif nps and nps["score"] < 70:
        alerts.append({"level":"amber","message":f"⚠️ NPS {nps['score']} — снижается, нужно обратить внимание"})

    # Complaints alert
    cnt = conn.execute("SELECT COUNT(*) as c FROM complaints WHERE created_at LIKE ?", (f"{period}%",)).fetchone()["c"]
    if cnt > 30:
        alerts.append({"level":"red","message":f"🔴 {cnt} жалоб за период — выше нормы (>30)"})
    elif cnt > 20:
        alerts.append({"level":"amber","message":f"🟡 {cnt} жалоб — приближается к пороговому значению"})

    conn.close()
    return alerts
