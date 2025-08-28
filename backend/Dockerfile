FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip wheel \
 && pip install --no-cache-dir -r requirements.txt \
 && pip install --no-cache-dir gunicorn

COPY . /app

ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV APP_MODULE=app:app

EXPOSE 5000

CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT} ${APP_MODULE} --workers 2 --timeout 120"]
