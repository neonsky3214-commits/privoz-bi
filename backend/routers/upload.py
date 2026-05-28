"""
upload.py — импорт данных из Excel или по ссылке Google Sheets.

Ожидаемый формат Excel (лист «revenue»):
  tenant | period (YYYY-MM) | amount | type | paid (0/1)

Ожидаемый формат Excel (лист «traffic»):
  ts (YYYY-MM-DD HH:00) | count
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import pandas as pd
import io
import httpx
from db import get_conn

router = APIRouter()

def _upsert_revenue(df: pd.DataFrame, conn):
    cur = conn.cursor()
    for _, row in df.iterrows():
        tid = cur.execute(
            "SELECT id FROM tenants WHERE name=?", (str(row.get("tenant","")),)
        ).fetchone()
        if not tid:
            cur.execute("INSERT INTO tenants (name) VALUES (?)", (str(row["tenant"]),))
            tid_val = cur.lastrowid
        else:
            tid_val = tid["id"]
        cur.execute(
            "INSERT OR REPLACE INTO revenue (tenant_id,period,amount,type,paid) VALUES (?,?,?,?,?)",
            (tid_val, str(row["period"]), float(row["amount"]),
             str(row.get("type","rent")), int(row.get("paid", 0)))
        )
    conn.commit()

def _upsert_traffic(df: pd.DataFrame, conn):
    rows = [(str(r["ts"]), int(r["count"])) for _, r in df.iterrows()]
    conn.executemany("INSERT INTO traffic (ts, count) VALUES (?,?)", rows)
    conn.commit()

@router.post("/excel")
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Нужен файл .xlsx или .xls")
    content = await file.read()
    xf = pd.ExcelFile(io.BytesIO(content))
    conn = get_conn()
    imported = []

    if "revenue" in xf.sheet_names:
        df = xf.parse("revenue")
        df.columns = [c.lower().strip() for c in df.columns]
        _upsert_revenue(df, conn)
        imported.append(f"revenue: {len(df)} строк")

    if "traffic" in xf.sheet_names:
        df = xf.parse("traffic")
        df.columns = [c.lower().strip() for c in df.columns]
        _upsert_traffic(df, conn)
        imported.append(f"traffic: {len(df)} строк")

    conn.close()
    return {"ok": True, "imported": imported}

@router.post("/google-sheets")
async def upload_gsheets(url: str = Query(..., description="Ссылка на Google Sheets (published as CSV)")):
    """
    Используй: Файл → Поделиться → Опубликовать в интернете → CSV
    URL вида: https://docs.google.com/spreadsheets/d/.../pub?output=csv
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, follow_redirects=True)
    if resp.status_code != 200:
        raise HTTPException(400, f"Не удалось загрузить таблицу: {resp.status_code}")

    df = pd.read_csv(io.StringIO(resp.text))
    df.columns = [c.lower().strip() for c in df.columns]

    conn = get_conn()
    if "tenant" in df.columns and "amount" in df.columns:
        _upsert_revenue(df, conn)
        conn.close()
        return {"ok": True, "imported": f"revenue: {len(df)} строк"}
    elif "ts" in df.columns and "count" in df.columns:
        _upsert_traffic(df, conn)
        conn.close()
        return {"ok": True, "imported": f"traffic: {len(df)} строк"}
    conn.close()
    raise HTTPException(400, "Неизвестный формат таблицы. Нужны колонки: tenant+amount или ts+count")
