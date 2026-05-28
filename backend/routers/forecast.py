from fastapi import APIRouter, Request
from db import get_conn
from routers.auth import verify_token
router = APIRouter()

@router.get("/revenue")
def forecast_revenue():
    conn = get_conn()
    hist = conn.execute("SELECT period, SUM(amount) as total FROM revenue GROUP BY period ORDER BY period").fetchall()
    conn.close()
    data = [{**dict(r),"is_forecast":False} for r in hist]
    if len(data) >= 2:
        growth = min(max((data[-1]["total"]-data[-2]["total"])/max(data[-2]["total"],1), -0.1), 0.15)
        last_p = data[-1]["period"]; y,m = int(last_p[:4]),int(last_p[5:7])
        val = data[-1]["total"]
        for _ in range(3):
            m+=1
            if m>12: m=1; y+=1
            val = round(val*(1+growth))
            data.append({"period":f"{y}-{m:02d}","total":val,"is_forecast":True})
    return data
