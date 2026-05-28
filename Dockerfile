FROM python:3.11-slim

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY frontend/package*.json frontend/
RUN npm --prefix frontend install --silent

COPY frontend/ frontend/
RUN npm --prefix frontend run build && \
    cp -r frontend/dist backend/frontend_dist

COPY backend/ backend/

CMD cd backend && \
    python -c 'from db import init_db; init_db()' && \
    python seed_data.py && \
    uvicorn main:app --host 0.0.0.0 --port $PORT
