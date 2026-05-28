from fastapi import APIRouter
from db import get_conn

router = APIRouter()

@router.get("/revenue")
def forecast_revenue():
    conn = get_conn()
    hist = conn.execute(
        "SELECT period, SUM(amount) as total FROM revenue GROUP BY period ORDER BY period"
    ).fetchall()
    conn.close()

    data = [dict(r) for r in hist]
    if len(data) >= 2:
        last   = data[-1]["total"]
        prev   = data[-2]["total"]
        growth = (last - prev) / prev if prev else 0.05
        growth = min(max(growth, -0.1), 0.15)  # cap at ±10–15%

        from datetime import date
        import calendar
        last_period = data[-1]["period"]
        y, m = int(last_period[:4]), int(last_period[5:7])
        forecast = []
        val = last
        for _ in range(3):
            m += 1
            if m > 12: m = 1; y += 1
            val = round(val * (1 + growth))
            forecast.append({"period": f"{y}-{m:02d}", "total": val, "is_forecast": True})
        data = [{**d, "is_forecast": False} for d in data] + forecast
    return data
