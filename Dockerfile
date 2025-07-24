FROM python:3.12.3-slim

WORKDIR /app
COPY . /app

RUN pip install --upgrade pip && pip install -r backend/requirements.txt

CMD ["uvicorn", "core.main:app", "--host", "0.0.0.0", "--port", "10000"] 