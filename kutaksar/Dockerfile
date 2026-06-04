FROM python:3.12-slim

WORKDIR /app

# Install system deps for PIL (image processing) and fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libfreetype6-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8002
EXPOSE 8002

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8002"]
