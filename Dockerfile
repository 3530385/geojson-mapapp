# Use slim Python image
FROM python:3.11-slim


# Prevents Python from writing pyc files & enables unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1 \
PYTHONUNBUFFERED=1 \
PIP_NO_CACHE_DIR=1


# Install system deps (optional, here just curl for debugging)
RUN apt-get update && apt-get install -y --no-install-recommends \
curl \
&& rm -rf /var/lib/apt/lists/*


# Workdir
WORKDIR /app


# Install Python deps
COPY requirements.txt ./
RUN pip install -r requirements.txt


# Copy app
COPY app ./app


# Expose port
EXPOSE 8000


# Start Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
