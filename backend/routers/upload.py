from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import io, csv, httpx
from db import get_conn
router = APIRouter()

def _save_revenue(rows, conn):
    cur = conn.cursor()
    for r in rows:
        tid = cur.execute("SELECT id FROM tenants WHERE name=?", (r.get("tenant",""),)).fetchone()
        tid_val = tid["id"] if tid else cur.execute("INSERT INTO tenants (name) VALUES (?)", (r.get("tenant",""),)).lastrowid
        cur.execute("INSERT INTO revenue (tenant_id,period,amount,type,paid) VALUES (?,?,?,?,?)",
                    (tid_val, r["period"], float(r["amount"]), r.get("type","rent"), int(r.get("paid",0))))
    conn.commit()

def _save_traffic(rows, conn):
    conn.executemany("INSERT INTO traffic (ts,count) VALUES (?,?)", [(r["ts"],int(r["count"])) for r in rows])
    conn.commit()

@router.post("/excel")
async def upload_excel(file: UploadFile = File(...)):
    content = await file.read()
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True)
        imported = []
        conn = get_conn()
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            rows_iter = iter(ws.rows)
            headers = [str(c.value).lower().strip() for c in next(rows_iter)]
            rows = [dict(zip(headers,[str(c.value) if c.value is not None else "" for c in row])) for row in rows_iter]
            if sheet_name == "revenue" and "amount" in headers:
                _save_revenue(rows, conn)
                imported.append(f"revenue: {len(rows)} строк")
            elif sheet_name == "traffic" and "count" in headers:
                _save_traffic(rows, conn)
                imported.append(f"traffic: {len(rows)} строк")
        conn.close()
        return {"ok":True,"imported":imported}
    except Exception as e:
        raise HTTPException(400, str(e))

@router.post("/google-sheets")
async def upload_gsheets(url: str = Query(...)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, follow_redirects=True)
    if resp.status_code != 200:
        raise HTTPException(400, f"Ошибка загрузки: {resp.status_code}")
    reader = csv.DictReader(io.StringIO(resp.text))
    rows = [{k.lower().strip():v for k,v in r.items()} for r in reader]
    if not rows: raise HTTPException(400, "Пустая таблица")
    conn = get_conn()
    headers = list(rows[0].keys())
    if "tenant" in headers and "amount" in headers:
        _save_revenue(rows, conn); conn.close()
        return {"ok":True,"imported":f"revenue: {len(rows)} строк"}
    elif "ts" in headers and "count" in headers:
        _save_traffic(rows, conn); conn.close()
        return {"ok":True,"imported":f"traffic: {len(rows)} строк"}
    conn.close()
    raise HTTPException(400, "Нужны колонки: tenant+amount или ts+count")
