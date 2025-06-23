#!/bin/bash
# Azure App Service startup script for FastAPI application

echo "Starting LeadIntel FastAPI Backend..."

# Set environment variables for production
export PYTHONPATH="${PYTHONPATH}:/home/site/wwwroot"

# Navigate to application directory
cd /home/site/wwwroot

# Install dependencies if not cached
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations/setup if needed
echo "Setting up database..."
python scripts/init_db.py || echo "Database setup completed or already exists"

# Start the FastAPI application with Gunicorn
echo "Starting FastAPI with Gunicorn..."
exec gunicorn app.main:app \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 600 \
    --keep-alive 10 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --preload \
    --log-level info \
    --access-logfile - \
    --error-logfile -