## Use an official Python runtime as a parent image
FROM --platform=linux/amd64 python:3.11

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=0

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libffi-dev \
    libssl-dev \
    libblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Adding backend directory to make absolute filepaths consistent across services
WORKDIR /backend

# Install Python dependencies with no cache to avoid stale dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Download en_core_web_sm needed for spacy [domain adaptation]
RUN python -m spacy download en_core_web_sm --verbose

# Download en_core_sci_scibert needed for scispacy [factscore]
RUN pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_scibert-0.5.4.tar.gz

# Add the rest of the code
COPY . ./

# Make port 8000 available for the app
EXPOSE 8000

# Be sure to use 0.0.0.0 for the host within the Docker container, otherwise the browser won't be able to find it
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
