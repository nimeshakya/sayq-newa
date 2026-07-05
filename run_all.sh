#!/bin/bash

# Get the root directory where this script is located
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting all services in separate terminals..."

# Backend - Terminal 1
gnome-terminal --tab --title="Backend" -- bash -c "cd '$ROOT_DIR/backend' && npm start; exec bash"

# Frontend - Terminal 2
gnome-terminal --tab --title="Frontend" -- bash -c "cd '$ROOT_DIR/frontend' && npm run dev; exec bash"

# ML Agent - Terminal 3
gnome-terminal --tab --title="ML Agent" -- bash -c "source '$ROOT_DIR/env/bin/activate' && cd '$ROOT_DIR/ml_agent' && uvicorn service:app --reload; exec bash"

# Kutaksar API - Terminal 4
gnome-terminal --tab --title="Kutaksar API" -- bash -c "source '$ROOT_DIR/env/bin/activate' && cd '$ROOT_DIR/kutaksar' && uvicorn api:app --reload --port 8001; exec bash"

echo "All services launched in separate terminal tabs!"
echo "Check the terminal windows to see the output from each service."
