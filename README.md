# Tasky — Full-Stack Task Manager

A modern, full-featured productivity app built with React, Node.js, MongoDB, and Socket.IO.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + Google OAuth 2.0 |
| Real-time | Socket.IO WebSockets |
| Drag & Drop | @dnd-kit |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

## Features

### Core
- User registration & login (email/password + Google OAuth)
- JWT auth with HttpOnly cookies
- Create, edit, delete tasks
- Task categories (Work, Personal, Health, Finance, Education, Shopping, Other)
- Priority levels (Low, Medium, High, Urgent)
- Due dates + email reminders
- Subtasks with progress tracking
- Task comments & collaboration
- Full-text search
- Filter by priority, category, status

### Advanced
- **Kanban board** with drag-and-drop (4 columns: To Do / In Progress / Review / Done)
- **List view** with sorting
- **Analytics dashboard** — by status, priority, category, overdue count
- **Real-time collaboration** via WebSockets
- **Dark mode** (light / dark / system)
- **In-app notifications**
- **Responsive** — works on mobile, tablet, desktop
- **API rate limiting** (global + strict auth limits)
- **Security**: Helmet, CORS, Mongo sanitize, XSS protection, input validation

## Project Structure

```
tasky/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── middleware/auth.js + errorHandler.js
│   │   ├── models/User.js + Task.js
│   │   ├── routes/auth.js + tasks.js
│   │   ├── socket/index.js
│   │   ├── utils/jwt.js + email.js
│   │   └── index.js
│   ├── .env.example
│   └── render.yaml
│
└── frontend/
    ├── src/
    │   ├── api/client.js + auth.js + tasks.js
    │   ├── components/Board/ + Layout/ + Task/
    │   ├── context/AuthContext + ThemeContext + SocketContext
    │   ├── hooks/useTasks.js
    │   ├── pages/Login + Register + Board + ListView + Analytics + Settings
    │   └── utils/helpers.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── vercel.json
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [Atlas](https://cloud.mongodb.com))

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Environment Variables (backend/.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Optional: Email reminders
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM=noreply@tasky.app
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile |
| PATCH | `/api/auth/change-password` | Change password |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/tasks` | List tasks (filter, sort, paginate) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/reorder` | Bulk reorder (Kanban DnD) |
| GET | `/api/tasks/stats` | Analytics aggregates |
| POST | `/api/tasks/:id/comments` | Add comment |
| PATCH | `/api/tasks/:id/subtasks/:sid` | Toggle subtask |
| PATCH | `/api/tasks/:id/archive` | Archive/unarchive |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `task:created` | Server → Client | New task created |
| `task:updated` | Server → Client | Task modified |
| `task:deleted` | Server → Client | Task removed |
| `task:reordered` | Server → Client | Kanban positions updated |
| `task:comment` | Server → Client | New comment |
| `task:typing` | Bidirectional | Typing indicator |
| `user:presence` | Server → Client | Online/offline status |

## Deployment inprogress

### Frontend → Vercel
1. Push to GitHub, import repo in [vercel.com](https://vercel.com)
2. Set env vars, Vercel auto-deploys on push

### Backend → Render
1. Push to GitHub, New Web Service in [render.com](https://render.com)
2. Connect repo, set env vars from `render.yaml`

### Database → MongoDB Atlas ocmpleted
1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Copy connection string to `MONGODB_URI`

## Security Features
- JWT tokens (HttpOnly cookies + Authorization header)
- bcrypt password hashing (12 rounds)
- Rate limiting: 200 req/15min global, 10 login/15min, 5 register/hour
- Helmet.js security headers
- MongoDB query sanitization
- XSS input cleaning
- CORS restricted to frontend origin
- Input validation via express-validator
