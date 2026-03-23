# University CRM/ERP System

A full-stack demo web application for managing university operations — students, courses, enrollments, attendance, grades, and fees — built with Django REST Framework and React.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![Django](https://img.shields.io/badge/Django-4.x-green)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)

---

## Features

- **CRM Module** — Student management with search, filter by status, pagination, and full CRUD
- **ERP Module** — Courses, enrollments, attendance tracking, grade management, fee records
- **Dashboard** — Live stat cards, enrollment bar chart, fee doughnut chart, student status chart
- **Authentication** — JWT login, protected routes, silent token refresh, logout
- **Finance** — Fee records with quick mark-paid action and revenue summary cards
- **REST API** — 15+ endpoints with search, filter, pagination, and aggregation actions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Auth | SimpleJWT (JSON Web Tokens) |
| Database | SQLite (dev) / PostgreSQL (production) |
| Frontend | React 18, Vite |
| Charts | Recharts |
| HTTP client | Axios |
| Routing | React Router v6 |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Project Structure

```
university-crm/
├── backend/                  # Django project
│   ├── config/               # Settings, URLs, WSGI
│   ├── students/             # Student model, API
│   ├── courses/              # Courses, Enrollments, Grades, Attendance
│   ├── finance/              # Fee records
│   ├── build.sh              # Render build script
│   ├── Procfile              # Gunicorn start command
│   └── requirements.txt
│
└── frontend/                 # React + Vite project
    └── src/
        ├── components/
        │   └── layout/       # Sidebar, Topbar, MainLayout
        ├── context/          # AuthContext (JWT)
        ├── pages/            # Dashboard, Students, Courses,
        │                     # Enrollments, Attendance, Grades, Fees
        └── services/         # api.js — all Axios calls
```

---

## Getting Started Locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/university-crm.git
cd university-crm
```

### 2. Set up the backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create an admin user
python manage.py createsuperuser

# Start the server
python manage.py runserver
```

Django runs at `http://127.0.0.1:8000`

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

React runs at `http://localhost:5173`

### 4. Log in

Go to `http://localhost:5173` and sign in with the superuser credentials you created above.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/token/` | Obtain JWT tokens |
| POST | `/api/token/refresh/` | Refresh access token |
| GET/POST | `/api/students/` | List / create students |
| GET/PUT/DELETE | `/api/students/{id}/` | Retrieve / update / delete student |
| GET | `/api/students/stats/` | Student counts by status |
| GET/POST | `/api/courses/` | List / create courses |
| GET/POST | `/api/enrollments/` | List / create enrollments |
| GET/POST | `/api/grades/` | List / create grades |
| GET/POST | `/api/attendance/` | List / create attendance records |
| GET/POST | `/api/fees/` | List / create fee records |
| GET | `/api/fees/summary/` | Fee totals by status |
| GET | `/api/dashboard/` | Aggregated dashboard stats |
| GET/POST | `/api/departments/` | List / create departments |
| GET/POST | `/api/faculty/` | List / create faculty |

All endpoints (except `/api/token/` and `/api/dashboard/`) require a Bearer token in the Authorization header.

---

## Database Models

```
Student          — student profile, status, enrollment date
Department       — faculty department
Faculty          — staff member, designation, department
Course           — code, name, credits, semester, department, faculty
Enrollment       — student ↔ course link, status
Grade            — marks, grade letter, linked to enrollment
Attendance       — date, present/absent/late, linked to enrollment
FeeRecord        — amount, type, status, due date, paid date
```

---

## Environment Variables

### Backend (set in Render or `.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for dev, `False` for production |
| `DATABASE_URL` | PostgreSQL connection string (set automatically by Render) |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames |

### Frontend (set in Vercel or `.env.production`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full URL of the backend API, e.g. `https://your-app.onrender.com/api` |

---

## Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `bash build.sh`
5. Set **Start Command** to `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
6. Add a **PostgreSQL** database service and copy the Internal Database URL into `DATABASE_URL`
7. Add the remaining environment variables listed above

### Frontend → Vercel

1. Import your GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`
5. Add `VITE_API_URL` pointing to your Render backend URL

Both services redeploy automatically on every push to `main`.

---

## Screenshots

| Page | Description |
|---|---|
| Dashboard | Stat cards + enrollment and fee charts |
| Students | Paginated table with search, filter, add/edit modal |
| Courses | Course list with department and faculty info |
| Enrollments | Student–course links with status tracking |
| Attendance | Present/absent/late records with quick-mark buttons |
| Grades | Marks entry with auto-suggested grade letter |
| Fees | Fee records with mark-paid action and revenue summary |

---

## Admin Panel

Django's built-in admin is available at `/admin` with your superuser credentials. All models are registered with search and filter support.

---

## License

MIT — free to use for learning and demo purposes.
