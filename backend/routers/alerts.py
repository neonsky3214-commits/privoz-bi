from fastapi import APIRouter, Query, Request
from db import get_conn
from routers.auth import verify_token
router = APIRouter()

def _table_exists(conn, name):
    return conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone() is not None

@router.get("/")
def get_alerts(request: Request, period: str = Query("2025-12")):
    verify_token(request)
    conn = get_conn()
    alerts = []

    try:
        # 1. Падение товарооборота месяц к месяцу
        if _table_exists(conn, "turnover"):
            rows = conn.execute("""
                SELECT period, turnover FROM turnover
                WHERE tenant='Привоз, Москва' AND turnover > 0
                ORDER BY period DESC LIMIT 2
            """).fetchall()
            if len(rows) == 2 and rows[1]["turnover"]:
                change = (rows[0]["turnover"] - rows[1]["turnover"]) / rows[1]["turnover"] * 100
                if change < -10:
                    alerts.append({"level":"red","message":f"📉 Товарооборот упал на {abs(round(change))}% за месяц ({rows[0]['period']})"})
                elif change < -3:
                    alerts.append({"level":"amber","message":f"⚠️ Товарооборот снизился на {abs(round(change))}% к прошлому месяцу"})

            # 2. Арендаторы с резким падением оборота
            decline = conn.execute("""
                WITH last_two AS (
                    SELECT tenant, period, turnover,
                           ROW_NUMBER() OVER (PARTITION BY tenant ORDER BY period DESC) as rn
                    FROM turnover
                    WHERE tenant != 'Привоз, Москва' AND turnover > 0
                )
                SELECT a.tenant, a.turnover as cur, b.turnover as prev
                FROM last_two a JOIN last_two b ON a.tenant=b.tenant
                WHERE a.rn=1 AND b.rn=2 AND b.turnover > 0
                  AND (a.turnover - b.turnover) / CAST(b.turnover AS REAL) < -0.3
                LIMIT 3
            """).fetchall()
            for d in decline:
                drop = round((d["prev"] - d["cur"]) / d["prev"] * 100)
                alerts.append({"level":"amber","message":f"🔻 {d['tenant']}: оборот упал на {drop}% за месяц"})

        # 3. БДДС: расходы превысили план
        if _table_exists(conn, "bdds"):
            over = conn.execute("""
                SELECT name, plan, fact FROM bdds
                WHERE code='2' AND fact IS NOT NULL AND plan > 0 AND fact > plan * 1.1
                ORDER BY period DESC LIMIT 1
            """).fetchone()
            if over:
                pct = round((over["fact"] - over["plan"]) / over["plan"] * 100)
                alerts.append({"level":"amber","message":f"💸 Расходы превысили план на {pct}% — проверь бюджет"})
    except Exception:
        pass

    conn.close()
    return alerts
