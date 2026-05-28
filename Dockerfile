FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Build frontend
COPY frontend/package*.json frontend/
RUN npm --prefix frontend install --silent

COPY frontend/ frontend/
RUN npm --prefix frontend run build && \
    cp -r frontend/dist backend/frontend_dist

# Copy backend
COPY backend/ backend/

# Init DB and start
CMD cd backend && \
    python -c 'from db import init_db; init_db()' && \
    uvicorn main:app --host 0.0.0.0 --port $PORT
