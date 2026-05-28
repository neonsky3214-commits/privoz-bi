from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from db import get_conn
from routers.auth import verify_token
router = APIRouter()

class EventIn(BaseModel):
    date: str; title: str; type: str; expected_traffic: Optional[int] = None

def ensure_table(conn):
    conn.execute("""CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT, title TEXT, type TEXT,
        expected_traffic INTEGER, created_at TEXT DEFAULT (datetime('now')))""")

@router.get("/")
def list_events(request: Request):
    verify_token(request)
    conn = get_conn(); ensure_table(conn)
    rows = conn.execute("SELECT * FROM events ORDER BY date DESC").fetchall()
    conn.close(); return [dict(r) for r in rows]

@router.post("/")
def create_event(request: Request, e: EventIn):
    verify_token(request)
    conn = get_conn(); ensure_table(conn)
    cur = conn.execute("INSERT INTO events (date,title,type,expected_traffic) VALUES (?,?,?,?)",
                       (e.date, e.title, e.type, e.expected_traffic))
    conn.commit()
    row = conn.execute("SELECT * FROM events WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close(); return dict(row)

@router.delete("/{eid}")
def delete_event(request: Request, eid: int):
    verify_token(request)
    conn = get_conn(); ensure_table(conn)
    conn.execute("DELETE FROM events WHERE id=?", (eid,))
    conn.commit(); conn.close(); return {"ok": True}
