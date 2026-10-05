FROM python:3.11-slim

# Install system dependencies (ffmpeg is required by moviepy/whisper, libgl1/libglib for opencv)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY . .

# Create needed directories with correct permissions
RUN mkdir -p static/uploads static/music static/sfx && chmod -R 777 static

# Support dynamic cloud port (defaults to 7860 for Hugging Face Spaces, or $PORT on Railway/Render)
ENV PORT=7860
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
