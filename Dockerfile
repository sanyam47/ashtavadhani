FROM python:3.11-slim

# Install system dependencies (ffmpeg is required by moviepy/whisper)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . .

# Create needed directories with correct permissions
RUN mkdir -p static/uploads static/music static/sfx && chmod -R 777 static

# Hugging Face Spaces runs on port 7860 by default
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
