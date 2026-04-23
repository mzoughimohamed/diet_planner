# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x start.sh

RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 8000

CMD ["./start.sh"]
