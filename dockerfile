# Use official Python image
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

#Comment out when testing locally
ARG LLM_API_KEY
ARG DJANGO_SECRET_KEY
ARG YT_API_KEY


# Set environment variables from build-time arguments
ENV LLM_API_KEY=$LLM_API_KEY
ENV DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY
ENV YT_API_KEY=$YT_API_KEY

RUN echo foo
RUN echo "LLM API KEY: $LLM_API_KEY"

RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/

# Set environment variables (Cloud Run uses PORT=8080)
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV DJANGO_SETTINGS_MODULE=backend.settings

# Run Django migrations
RUN python manage.py makemigrations
RUN python manage.py migrate

RUN python manage.py makemigrations pathways
RUN python manage.py migrate pathways

# Expose the default port for Cloud Run
EXPOSE 8080

# Run the Gunicorn server
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8080"]
