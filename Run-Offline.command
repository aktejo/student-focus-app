#!/bin/bash
# Change to the script's directory
cd "$(dirname "$0")"

echo "========================================"
echo "Preparing Student Focus App..."
echo "========================================"

# Check if node modules exist, if not install
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (first time only)..."
  npm install
fi

echo "Building production bundle..."
npm run build

# Find an available port starting at 8080
PORT=8080
while lsof -i -P -n | grep -q ":$PORT (LISTEN)"; do
  PORT=$((PORT + 1))
done

echo "Starting lightweight local server on http://localhost:$PORT..."
# Start Python HTTP server in the background
python3 -m http.server $PORT --directory dist > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for the server to spin up
sleep 1

# Open the default browser to the local server
open "http://localhost:$PORT"

echo "========================================"
echo "Student Focus App is running offline!"
echo "Keep this window open while using the app."
echo "Press Ctrl+C in this terminal window to stop."
echo "========================================"

# Clean up background server on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT
wait
