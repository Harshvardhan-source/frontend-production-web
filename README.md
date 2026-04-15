<<<<<<< HEAD
# sir-app-web
=======
# Constituency Connect — Django + React Full Stack

A complete redesign of the Constituency Connect governance platform.
Django serves as a pure JSON API backend. React handles all UI.

---

## Project Structure

```
cc-fullstack/
├── backend/                  ← Django (API only, no templates)
│   ├── telusko/
│   │   ├── settings.py       ← Django settings + CORS config
│   │   ├── urls.py           ← Root URL router
│   │   └── wsgi.py
│   ├── calc/
│   │   ├── views.py          ← All API views (return JSON)
│   │   └── urls.py           ← API routes under /api/
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/                 ← React (Vite/CRA)
    ├── public/index.html
    ├── src/
    │   ├── App.jsx            ← Router + Auth context
    │   ├── index.js
    │   ├── api/client.js      ← Axios instance (CSRF-aware)
    │   ├── styles/global.css  ← Full design system
    │   ├── components/
    │   │   └── Navbar.jsx     ← Top nav + mobile bottom tabs
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       ├── Dashboard.jsx  ← Stats, charts, quick actions
    │       ├── SurveyOpt.jsx  ← Ward selector
    │       ├── SurveyForm.jsx ← 4-step form
    │       ├── SchemeOpt.jsx  ← Ward selector for schemes
    │       ├── SchemeVoters.jsx  ← Voter cards + scheme modal
    │       ├── DataView.jsx   ← Paginated table + CSV export
    │       └── VoterSearch.jsx   ← Search + modal
    └── package.json
```

---

## Quick Start

### Step 1 — Backend (Django)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (SQLite, for sessions/admin)
python manage.py migrate

# Start Django API server
python manage.py runserver 8000
```

Django API will be available at: **http://localhost:8000/api/**

### Step 2 — Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start React dev server
npm start
```

React app will be available at: **http://localhost:3000**

The `"proxy": "http://localhost:8000"` in `package.json` automatically
forwards all `/api/` requests from React → Django.

---

## API Endpoints

All routes are prefixed with `/api/`

| Method | Route                 | Description                       |
|--------|-----------------------|-----------------------------------|
| GET    | /api/csrf/            | Set CSRF cookie (called on startup) |
| GET    | /api/me/              | Check current session              |
| POST   | /api/register/        | Create new account                 |
| POST   | /api/login/           | Authenticate user                  |
| POST   | /api/logout/          | End session                        |
| GET    | /api/dashboard/       | Dashboard statistics               |
| GET    | /api/serial-number/   | Next survey serial number          |
| POST   | /api/save-survey/     | Save survey record to MongoDB      |
| GET    | /api/wards/           | List all 38 wards                  |
| POST   | /api/scheme-voter-list/ | Voters by ward number            |
| POST   | /api/view-scheme/     | Check scheme eligibility           |
| GET    | /api/data/            | Paginated data view                |
| POST   | /api/upload-voter-list/ | Upload CSV/Excel voter list      |
| GET    | /api/voters/          | Search voter registry              |
| GET    | /api/voter-family/    | Family members by house number     |

---

## Configuration

### MongoDB Connection
Update `backend/telusko/settings.py`:
```python
MONGODB_URL = "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/"
```

### CORS (for production)
Update `backend/telusko/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    'https://your-react-domain.com',
]
```

### Production Build
```bash
# Build React
cd frontend && npm run build

# Serve the build via Django or any static host (Nginx, S3+CloudFront, etc.)
# Option: serve build/ folder with whitenoise
```

---

## Features

### Dashboard
- Live statistics: total surveys, voters, houses, coverage %
- Ward-level coverage bar chart (color-coded green/amber/red)
- Religion pie chart (voter distribution)
- Gender breakdown with progress bars
- Quick action links

### Survey Module
- Ward selection with live serial number
- 4-step form: Personal → Address → Demographics → Employment/Health
- Full conditional logic (community by religion, sub-category by community, employment type if employed, disease fields if diseased)
- Saves directly to MongoDB `SurveyRecords` collection

### Scheme Eligibility
- Ward-based voter list from `MainB.CollDB`
- Click any voter → fetches eligible schemes from `StoreAllSheetData.xlsx`
- Scheme cards with name, type, ministry, description, link

### Data Explorer
- Toggle between Survey and Voter list data
- Server-side pagination (100 records/page)
- Search filter
- CSV export of current page
- Voter list upload (CSV/Excel)

### Voter Search
- Real-time search against MongoDB `VoterList`
- Voter cards with gender/religion badges
- Modal: Basic details + Family members tab

### Mobile Design
- Bottom tab navigation on ≤768px screens
- Touch-friendly (44px+ tap targets)
- iOS safe-area inset support
- Responsive grids with `auto-fill`
- Fluid typography with `clamp()`

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Django 4.2, PyMongo, Pandas         |
| Database   | MongoDB Atlas (primary), SQLite (sessions) |
| Frontend   | React 18, React Router 6            |
| Charts     | Recharts                            |
| HTTP       | Axios (with CSRF interceptor)       |
| Styling    | Pure CSS (custom design system, no framework) |
| Fonts      | Sora (display) + DM Sans (body)     |
# Mangaloresouth-app
>>>>>>> fd1b622 (Initial commit)
