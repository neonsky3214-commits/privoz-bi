# ПРИВОЗ BI Platform

Полноценная BI-платформа для фудмолла ПРИВОЗ.
Стек: **Python FastAPI** + **React + Recharts** + **SQLite** + **Railway**

---

## Структура проекта

```
privoz-bi/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── db.py                # SQLite + seed данные
│   ├── requirements.txt
│   └── routers/
│       ├── revenue.py       # /api/revenue
│       ├── tenants.py       # /api/tenants
│       ├── traffic.py       # /api/traffic
│       ├── delivery.py      # /api/delivery
│       ├── marketing.py     # /api/marketing
│       ├── ops.py           # /api/ops + nps
│       ├── forecast.py      # /api/forecast
│       └── upload.py        # /api/upload (Excel + GSheets)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Sidebar + routing
│   │   ├── api.js           # Все API-запросы
│   │   ├── index.css
│   │   └── pages/           # Все страницы дашборда
│   ├── package.json
│   └── vite.config.js
├── data/                    # SQLite DB (создаётся автоматически)
├── railway.toml
└── Procfile
```

---

## Деплой на Railway — пошагово

### 1. Зарегистрируйся на railway.app

### 2. Установи Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 3. Залей код на GitHub
```bash
git init
git add .
git commit -m "init privoz-bi"
git remote add origin https://github.com/ВАШ_ЛОГИН/privoz-bi.git
git push -u origin main
```

### 4. Создай проект в Railway
- railway.app → New Project → Deploy from GitHub → выбери репозиторий
- Railway автоматически найдёт `railway.toml` и задеплоит

### 5. Добавь Volume для базы данных
- В Railway → твой сервис → Volumes → Add Volume
- Mount path: `/app/data`

### 6. Собери фронтенд и положи в backend
```bash
cd frontend
npm install
npm run build
cp -r dist ../backend/static   # или настрой в vite.config.js outDir
```

> Либо сделай отдельный Railway-сервис для фронтенда (Vite → Static Site)

### 7. Переменные окружения (Railway → Variables)
```
DB_PATH=/app/data/privoz.db
```

---

## Локальный запуск

### Бэкенд
```bash
cd backend
pip install -r requirements.txt
python -c "from db import init_db; init_db()"
uvicorn main:app --reload --port 8000
```
API документация: http://localhost:8000/docs

### Фронтенд
```bash
cd frontend
npm install
npm run dev
# открой http://localhost:5173
```

---

## Загрузка реальных данных

### Excel
Создай файл с листами:
- **revenue**: `tenant | period | amount | type | paid`
- **traffic**: `ts | count`

Загружай через раздел «Загрузить» в платформе или через POST /api/upload/excel

### Google Sheets
1. Файл → Поделиться → Опубликовать в интернете → Лист → CSV
2. Скопируй ссылку вида `https://docs.google.com/spreadsheets/d/.../pub?output=csv`
3. Вставь в раздел «Загрузить» → Google Sheets

---

## Стоимость Railway
- **Hobby Plan**: $5/мес — достаточно для этого проекта
- **Persistent Volume** для SQLite: ~$0.25/GB/мес

---

## Следующие шаги по развитию
- [ ] Авторизация (JWT) — чтобы не все видели дашборд
- [ ] Подключение к Яндекс Еде / DC через API агрегаторов
- [ ] Тепловая карта (canvas) с реальными зонами ПРИВОЗ
- [ ] Уведомления в Telegram при критических показателях
- [ ] Экспорт отчётов в PDF/Excel
