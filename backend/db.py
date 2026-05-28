import sqlite3, os, random
from datetime import date, timedelta

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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, category TEXT,
        area_sqm REAL, rent_rate REAL,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS revenue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id),
        period TEXT NOT NULL, amount REAL NOT NULL,
        type TEXT DEFAULT 'rent', paid INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS traffic (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT NOT NULL, count INTEGER NOT NULL,
        zone TEXT DEFAULT 'total'
    );
    CREATE TABLE IF NOT EXISTS delivery_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id),
        platform TEXT NOT NULL, order_date TEXT NOT NULL,
        amount REAL NOT NULL, rating REAL,
        created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES tenants(id),
        category TEXT NOT NULL, severity TEXT DEFAULT 'medium',
        resolved INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS marketing_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period TEXT NOT NULL, platform TEXT NOT NULL,
        metric TEXT NOT NULL, value REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS nps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period TEXT NOT NULL, score REAL NOT NULL,
        promoters INTEGER, detractors INTEGER, total INTEGER
    );
    """)
    if conn.execute("SELECT COUNT(*) as c FROM tenants").fetchone()["c"] == 0:
        _seed(cur)
    conn.commit()
    conn.close()

def _seed(cur):
    tenants = [
        ("Sushi Boom","Азия",42,4500), ("BurgerKing","Фаст-фуд",58,3800),
        ("HiCha","Напитки",18,4200),   ("Pizza Lab","Фаст-фуд",35,3500),
        ("Chaihana","Азия",30,3200),   ("Wok Street","Азия",28,3600),
        ("Sweet Cup","Десерты",16,4000),("Грузинский дом","Европа",50,4800),
    ]
    cur.executemany("INSERT INTO tenants (name,category,area_sqm,rent_rate) VALUES (?,?,?,?)", tenants)
    random.seed(42)
    months = ["2025-01","2025-02","2025-03","2025-04","2025-05"]
    bases  = [680000,540000,210000,390000,180000,310000,145000,490000]
    for tid, base in enumerate(bases, 1):
        for m in months:
            cur.execute("INSERT INTO revenue (tenant_id,period,amount,type,paid) VALUES (?,?,?,?,?)",
                (tid, m, round(base*(0.9+random.random()*0.25)), "rent", 1 if m<"2025-05" else random.randint(0,1)))
    base_date = date(2025,5,1)
    for d in range(28):
        for h in range(10,22):
            ts  = f"{base_date+timedelta(days=d)} {h:02d}:00"
            dow = (base_date+timedelta(days=d)).weekday()
            cnt = int((120+random.gauss(0,30))*(1.5 if 17<=h<=20 else 1.0)*(1.3 if dow>=5 else 1.0))
            cur.execute("INSERT INTO traffic (ts,count) VALUES (?,?)", (ts, max(20,cnt)))
    for d in range(28):
        day = str(base_date+timedelta(days=d))
        for _ in range(random.randint(80,130)):
            cur.execute("INSERT INTO delivery_orders (tenant_id,platform,order_date,amount,rating) VALUES (?,?,?,?,?)",
                (random.randint(1,8), random.choices(["yandex","dc","self"],[.49,.34,.17])[0],
                 day, round(random.uniform(300,900),2), round(random.uniform(3.5,5.0),1)))
    for d in range(28):
        if random.random()<0.6:
            cur.execute("INSERT INTO complaints (tenant_id,category,severity,created_at) VALUES (?,?,?,?)",
                (random.randint(1,8), random.choice(["cleanliness","queue","food","service","tech"]),
                 random.choice(["low","medium","high"]), str(base_date+timedelta(days=d))))
    foll = {"instagram":10800,"vk":8100,"telegram":1800}
    for m in months:
        for pl in ["instagram","vk","telegram"]:
            foll[pl] += random.randint(50,400)
            cur.execute("INSERT INTO marketing_metrics VALUES (NULL,?,?,?,?)", (m,pl,"followers",foll[pl]))
            cur.execute("INSERT INTO marketing_metrics VALUES (NULL,?,?,?,?)", (m,pl,"reach",random.randint(5000,15000)))
        cur.execute("INSERT INTO marketing_metrics VALUES (NULL,?,?,?,?)", (m,"yandex_direct","spend",random.randint(8000,15000)))
        cur.execute("INSERT INTO marketing_metrics VALUES (NULL,?,?,?,?)", (m,"vk_ads","spend",random.randint(4000,8000)))
    for m,s in zip(months,[65,68,72,74,71]):
        total=random.randint(80,150)
        cur.execute("INSERT INTO nps VALUES (NULL,?,?,?,?,?)", (m,s,int(total*s/100*1.3),int(total*(100-s)/100*.4),total))
