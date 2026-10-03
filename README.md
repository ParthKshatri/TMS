# Office Task and Work Management System (TMS)

A production-ready office task and work management system built using the MERN stack (MongoDB Atlas, Express.js, React, Node.js) in plain JavaScript.

---

## Features & Roles

### Admin Role
- **Task Management**: Create and assign office tasks to active employees with optional due dates.
- **Work Review**: Review employee-submitted work descriptions; approve or reject submissions with optional review remarks.
- **Employee Accounts**: Create employee accounts (no public self-registration).
- **History Logs**: Inspect task status transition history, work submission logs, and daily attendance logs across all employees.

### Employee Role
- **Daily Attendance**: Record clock-in and clock-out timestamps for daily work shifts.
- **Task Progression**: View assigned tasks and update status from pending to in progress.
- **Work Submissions**: Write and submit detailed descriptions of completed work for admin review.
- **Personal Log History**: View personal task history, work submission statuses, and attendance logs.

---

## Tech Stack & Architecture

- **Backend**: Node.js, Express.js, MongoDB with Mongoose object modeling.
- **Frontend**: React 18, Vite, React Router DOM, Axios, Lucide Icons.
- **Authentication**: Server-side sessions using `express-session` stored directly in MongoDB via `connect-mongo`. Passwords hashed with `bcryptjs`.
- **Security**: Security headers with `helmet`, CORS restriction to frontend origin, rate limiting on authentication endpoints, `httpOnly` secure cookies.

---

## Repository Directory Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & session configuration
│   │   ├── models/          # User, Task, TaskStatusHistory, WorkSubmission, Attendance
│   │   ├── controllers/     # Route logic handlers
│   │   ├── routes/          # Express route definitions
│   │   ├── middleware/      # Auth, role check, validation, error handler
│   │   ├── utils/           # Date and helper utilities
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server listener entry point
│   ├── scripts/             # Admin seeding script
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance with credentials
│   │   ├── components/      # Reusable UI elements (Navbar, Sidebar, Modal, StatusBadge, Pagination)
│   │   ├── pages/           # Login, Admin pages, Employee pages
│   │   ├── context/         # AuthContext state provider
│   │   ├── routes/          # ProtectedRoute, AdminRoute, AppRoutes
│   │   ├── styles/          # Base CSS design system
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── .env.example
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Server listening port | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `MONGODB_URI` | MongoDB Atlas database connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/tms_db` |
| `SESSION_SECRET` | Secret key for signing session cookies | `your-production-session-secret` |
| `CLIENT_ORIGIN` | Allowed frontend origin URL | `http://localhost:5173` |
| `SEED_ADMIN_NAME` | Initial seed administrator name | `System Administrator` |
| `SEED_ADMIN_EMAIL` | Initial seed administrator email | `<createmail@gmail.com>` |
| `SEED_ADMIN_PASSWORD` | Initial seed administrator password | `<createpassword>` |

### Frontend (`frontend/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `VITE_API_URL` | Base URL for API calls | `http://localhost:5000/api` |

---

## MongoDB Atlas Setup Guide

1. Create a MongoDB Atlas cluster on the free tier or paid tier.
2. Under **Database Access**, create a database user with read/write privileges.
3. Under **Network Access**, add an IP access rule (add `0.0.0.0/0` for cloud deployment or your specific IP address for local development).
4. Click **Connect** > **Drivers** to get your MongoDB connection string.
5. Replace `<username>` and `<password>` in the connection string and set `MONGODB_URI` in `backend/.env`.

---

## Local Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB Atlas URI and configurations
```

Seed the initial administrator account:

```bash
npm run seed:admin
```

Start the backend development server:

```bash
npm run dev
```

The backend server will start on `http://localhost:5000`.

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend application will start on `http://localhost:5173`.

---

## Deployment Steps

### Backend Deployment (Render / Railway)

1. Connect your repository to Render or Railway.
2. Set root directory to `backend`.
3. Set build command: `npm install`
4. Set start command: `node src/server.js`
5. Configure environment variables in the cloud dashboard (`NODE_ENV=production`, `MONGODB_URI`, `SESSION_SECRET`, `CLIENT_ORIGIN=https://your-frontend.vercel.app`, `PORT`).
6. Run the seed script via cloud CLI or setup command: `npm run seed:admin`.

### Frontend Deployment (Vercel / Netlify)

1. Import your project repository into Vercel or Netlify.
2. Set root directory to `frontend`.
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`.
6. Enable SPA routing redirect rules if needed (e.g., `_redirects` file or `vercel.json` rewrites for single page apps).
