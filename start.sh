#!/bin/bash
# Constituency Connect — Start both servers

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Constituency Connect — Full Stack"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start Django backend in background
echo ""
echo "▶  Starting Django API server on :8000 …"
cd backend
source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
pip install -r requirements.txt -q
python manage.py migrate -q
python manage.py runserver 8000 &
DJANGO_PID=$!
cd ..

echo "   Django PID: $DJANGO_PID"
echo ""

# Start React frontend
echo "▶  Starting React frontend on :3000 …"
cd frontend
npm install -q
npm start &
REACT_PID=$!
cd ..

echo "   React PID: $REACT_PID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend  →  http://localhost:8000"
echo "  Frontend →  http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "kill $DJANGO_PID $REACT_PID; echo 'Stopped.'" INT
wait
