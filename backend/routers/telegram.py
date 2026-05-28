from fastapi import APIRouter, Request
from pydantic import BaseModel
from db import get_conn
from routers.auth import verify_token
import httpx, os
router = APIRouter()

class TgSettings(BaseModel):
    bot_token: str = ""; chat_id: str = ""; enabled: bool = False; daily_digest: bool = True

def ensure_table(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)""")

@router.get("/settings")
def get_settings(request: Request):
    verify_token(request)
    conn = get_conn(); ensure_table(conn)
    rows = {r["key"]: r["value"] for r in conn.execute("SELECT * FROM settings").fetchall()}
    conn.close()
    return {"bot_token": rows.get("tg_token",""), "chat_id": rows.get("tg_chat",""),
            "enabled": rows.get("tg_enabled","0")=="1", "daily_digest": rows.get("tg_digest","1")=="1"}

@router.post("/settings")
def save_settings(request: Request, s: TgSettings):
    verify_token(request)
    conn = get_conn(); ensure_table(conn)
    for k, v in [("tg_token",s.bot_token),("tg_chat",s.chat_id),("tg_enabled","1" if s.enabled else "0"),("tg_digest","1" if s.daily_digest else "0")]:
        conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)", (k,v))
    conn.commit(); conn.close(); return {"ok": True}

@router.post("/test")
async def test_send(request: Request):
    verify_token(request)
    conn = get_conn(); ensure_table(conn)
    rows = {r["key"]: r["value"] for r in conn.execute("SELECT * FROM settings").fetchall()}
    conn.close()
    token = rows.get("tg_token",""); chat = rows.get("tg_chat","")
    if not token or not chat:
        from fastapi import HTTPException; raise HTTPException(400, "Токен или chat_id не заданы")
    async with httpx.AsyncClient() as client:
        r = await client.post(f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat, "text": "✅ ПРИВОЗ BI — тест уведомлений работает!"})
    if r.status_code != 200:
        from fastapi import HTTPException; raise HTTPException(400, r.text)
    return {"ok": True}
