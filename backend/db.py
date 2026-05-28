"""
db.py — единая точка доступа к данным.
- SQLite для хранения всех данных на Railway (файл /data/privoz.db)
- pandas для парсинга Excel/Google Sheets при загрузке
"""
import sqlite3
import os
import json
from datetime import datetime, date
from typing import Optional
import pandas as pd

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "privoz.db"))

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS tenants (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        category    TEXT,
        area_sqm    REAL,
        rent_rate   REAL,
        status      TEXT DEFAULT 'active',
        created_at  TEXT DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS revenue (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id   INTEGER REFERENCES tenants(id),
        period      TEXT NOT NULL,   -- YYYY-MM
        amount      REAL NOT NULL,
        type        TEXT NOT NULL,   -- rent | service | event | ads
        paid        INTEGER DEFAULT 0,
        paid_at     TEXT,
        created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS traffic (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        ts          TEXT NOT NULL,   -- YYYY-MM-DD HH:00
        count       INTEGER NOT NULL,
        zone        TEXT DEFAULT 'total',
        source      TEXT DEFAULT 'counter'
    );

    CREATE TABLE IF NOT EXISTS delivery_orders (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id   INTEGER REFERENCES tenants(id),
        platform    TEXT NOT NULL,   -- yandex | dc | self
        order_date  TEXT NOT NULL,
        amount      REAL NOT NULL,
        rating      REAL,
        created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id   INTEGER REFERENCES tenants(id),
        category    TEXT NOT NULL,   -- cleanliness | queue | food | service | tech
        text        TEXT,
        severity    TEXT DEFAULT 'medium',
        resolved    INTEGER DEFAULT 0,
        created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS marketing_metrics (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        period      TEXT NOT NULL,   -- YYYY-MM
        platform    TEXT NOT NULL,   -- instagram | vk | telegram | yandex_direct | vk_ads
        metric      TEXT NOT NULL,   -- followers | reach | clicks | spend | ctr
        value       REAL NOT NULL,
        created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS nps (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        period      TEXT NOT NULL,
        score       REAL NOT NULL,
        promoters   INTEGER,
        detractors  INTEGER,
        total       INTEGER,
        source      TEXT DEFAULT 'survey'
    );
    """)

    # Seed demo data if tables are empty
    row = cur.execute("SELECT COUNT(*) as c FROM tenants").fetchone()
    if row["c"] == 0:
        _seed_demo(cur)

    conn.commit()
    conn.close()

def _seed_demo(cur):
    tenants = [
        ("Sushi Boom",      "Азия",      42, 4500),
        ("BurgerKing",      "Фаст-фуд",  58, 3800),
        ("HiCha",           "Напитки",   18, 4200),
        ("Pizza Lab",       "Фаст-фуд",  35, 3500),
        ("Chaihana",        "Азия",      30, 3200),
        ("Wok Street",      "Азия",      28, 3600),
        ("Sweet Cup",       "Десерты",   16, 4000),
        ("Грузинский дом",  "Европа",    50, 4800),
    ]
    cur.executemany(
        "INSERT INTO tenants (name, category, area_sqm, rent_rate) VALUES (?,?,?,?)",
        tenants
    )

    import random
    random.seed(42)
    months = ["2025-01","2025-02","2025-03","2025-04","2025-05"]
    bases  = [680000, 540000, 210000, 390000, 180000, 310000, 145000, 490000]
    for tid, base in enumerate(bases, start=1):
        for m in months:
            amt = base * (0.9 + random.random() * 0.25)
            paid = 1 if m < "2025-05" else random.randint(0, 1)
            cur.execute(
                "INSERT INTO revenue (tenant_id, period, amount, type, paid) VALUES (?,?,?,?,?)",
                (tid, m, round(amt), "rent", paid)
            )

    # Traffic: hourly for last 30 days
    from datetime import timedelta
    base_date = date(2025, 5, 1)
    for d in range(28):
        for h in range(10, 22):
            ts = f"{base_date + timedelta(days=d)} {h:02d}:00"
            dow = (base_date + timedelta(days=d)).weekday()
            peak = 1.5 if 17 <= h <= 20 else 1.0
            wknd = 1.3 if dow >= 5 else 1.0
            cnt  = int((120 + random.gauss(0, 30)) * peak * wknd)
            cur.execute("INSERT INTO traffic (ts, count) VALUES (?,?)", (ts, max(20, cnt)))

    # Delivery
    platforms = ["yandex", "dc", "self"]
    weights   = [0.49, 0.34, 0.17]
    for d in range(28):
        day = str(base_date + timedelta(days=d))
        n_orders = random.randint(80, 130)
        for _ in range(n_orders):
            plat = random.choices(platforms, weights=weights)[0]
            tid  = random.randint(1, 8)
            amt  = round(random.uniform(300, 900))
            rat  = round(random.uniform(3.5, 5.0), 1)
            cur.execute(
                "INSERT INTO delivery_orders (tenant_id, platform, order_date, amount, rating) VALUES (?,?,?,?,?)",
                (tid, plat, day, amt, rat)
            )

    # Complaints
    cats = ["cleanliness","queue","food","service","tech"]
    for d in range(28):
        if random.random() < 0.6:
            day = str(base_date + timedelta(days=d))
            cat = random.choice(cats)
            tid = random.randint(1, 8)
            cur.execute(
                "INSERT INTO complaints (tenant_id, category, severity, created_at) VALUES (?,?,?,?)",
                (tid, cat, random.choice(["low","medium","high"]), day)
            )

    # Marketing
    platforms_mkt = ["instagram","vk","telegram","yandex_direct","vk_ads"]
    followers = {"instagram": 10800, "vk": 8100, "telegram": 1800}
    for i, m in enumerate(months):
        for pl in ["instagram","vk","telegram"]:
            followers[pl] += random.randint(50, 400)
            cur.execute("INSERT INTO marketing_metrics (period,platform,metric,value) VALUES (?,?,?,?)",
                        (m, pl, "followers", followers[pl]))
            cur.execute("INSERT INTO marketing_metrics (period,platform,metric,value) VALUES (?,?,?,?)",
                        (m, pl, "reach", random.randint(5000, 15000)))
        cur.execute("INSERT INTO marketing_metrics (period,platform,metric,value) VALUES (?,?,?,?)",
                    (m, "yandex_direct", "spend", random.randint(8000, 15000)))
        cur.execute("INSERT INTO marketing_metrics (period,platform,metric,value) VALUES (?,?,?,?)",
                    (m, "vk_ads", "spend", random.randint(4000, 8000)))

    # NPS
    nps_vals = [65, 68, 72, 74, 71]
    for m, s in zip(months, nps_vals):
        total = random.randint(80, 150)
        prom  = int(total * s / 100 * 1.3)
        det   = int(total * (100 - s) / 100 * 0.4)
        cur.execute("INSERT INTO nps (period, score, promoters, detractors, total) VALUES (?,?,?,?,?)",
                    (m, s, prom, det, total))
