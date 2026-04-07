# AttendX - Modern Student Attendance Dashboard

A stunning full-stack web application for viewing student attendance with a futuristic UI.

## 🔥 Features

- **Secure Login**: Enter credentials to fetch attendance (credentials are NOT stored)
- **Beautiful Dashboard**: Glassmorphism UI with neon gradients
- **3D Animated Background**: Three.js floating particles
- **Smooth Animations**: Framer Motion transitions
- **Responsive Design**: Works on mobile and desktop
- **Data Visualization**: Charts and progress bars
- **Dark/Light Theme Toggle**
- **Toast Notifications**

## 🧠 Tech Stack

### Frontend
- React.js 18 (with Vite)
- Tailwind CSS + Custom CSS animations
- Three.js (3D backgrounds)
- Framer Motion (animations)
- Recharts (data visualization)
- React Router DOM

### Backend
- Python FastAPI
- Selenium (web scraping)
- WebDriver Manager

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Chrome browser (for Selenium)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend will start at http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at http://localhost:5173

## ☁️ Deploy to Render (Backend) + Vercel (Frontend)

### 1) Deploy backend to Render

1. Push this project to GitHub.
2. In Render, create a **New Web Service** from your repository.
3. Choose these settings:
  - Root Directory: `backend`
  - Runtime: `Docker`
  - Dockerfile: `backend/Dockerfile` (auto-detected if Root Directory is backend)
4. Add environment variable:
  - `CORS_ORIGINS` = your Vercel app URL (for example `https://your-app.vercel.app`)
5. Deploy and copy your Render backend URL, for example:
  - `https://attendx-backend.onrender.com`

### 2) Deploy frontend to Vercel

1. In Vercel, import the same GitHub repository.
2. Set these project settings:
  - Root Directory: `frontend`
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
3. Add environment variable:
  - `VITE_API_URL` = your Render backend URL
4. Deploy.

### 3) Update CORS after final Vercel domain

If Vercel gives a different production URL after deploy, update Render:

- `CORS_ORIGINS` = that exact Vercel domain

Then redeploy Render once.

### Notes

- `frontend/vercel.json` is included so React Router routes work on refresh.
- Backend CORS now supports env-based origins via `CORS_ORIGINS`.
- Backend Docker image includes Chromium + ChromeDriver for Selenium on Render.

## 📁 Project Structure

```
AttendX/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ThreeBackground.jsx    # 3D particle background
│   │   │   ├── GlassCard.jsx          # Glassmorphism card
│   │   │   ├── AnimatedButton.jsx     # Ripple effect button
│   │   │   ├── CircularProgress.jsx   # Animated progress ring
│   │   │   ├── Sidebar.jsx            # Dashboard sidebar
│   │   │   ├── Navbar.jsx             # Top navigation
│   │   │   ├── AttendanceCard.jsx     # Subject attendance card
│   │   │   ├── Charts.jsx             # Bar & Pie charts
│   │   │   ├── SkeletonLoader.jsx     # Loading skeletons
│   │   │   ├── Toast.jsx              # Notifications
│   │   │   ├── ThemeToggle.jsx        # Dark/Light switch
│   │   │   └── PageTransition.jsx     # Route animations
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx          # Login screen
│   │   │   └── DashboardPage.jsx      # Main dashboard
│   │   ├── hooks/
│   │   │   ├── useToast.js            # Toast notifications
│   │   │   └── useTheme.js            # Theme management
│   │   ├── utils/
│   │   │   ├── api.js                 # API client
│   │   │   └── storage.js             # Local storage
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   ├── main.py                         # FastAPI server
│   ├── scraper.py                      # Selenium scraper
│   └── requirements.txt
└── README.md
```

## 🔐 Security Note

This application does NOT store any credentials. Login information is used only temporarily to fetch attendance data from the student portal and is immediately discarded.

## 🎨 UI Features

- **Dark Theme**: Neon gradients (purple, blue, cyan)
- **Glassmorphism**: Blur + transparency cards
- **3D Background**: Floating particles with Three.js
- **Smooth Animations**: Framer Motion transitions
- **Hover Effects**: Glow and tilt on cards
- **Loading States**: Skeleton UI + spinners
- **Responsive**: Mobile-first design
- **Toast Notifications**: Success/error feedback

## 🌐 API Endpoints

### POST /login
Authenticate and fetch attendance data.

**Request:**
```json
{
  "username": "student_id",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "student_name": "John Doe",
  "subjects": [
    { "name": "Mathematics", "attendance": 85 },
    { "name": "Physics", "attendance": 72 },
    { "name": "Chemistry", "attendance": 90 }
  ]
}
```

## 🎯 Color Coding

- 🟢 **Green**: >75% attendance
- 🟡 **Yellow**: 60-75% attendance
- 🔴 **Red**: <60% attendance

## ⚡ Performance

- Optimized Three.js rendering
- Lazy loading components
- Efficient state management
- Minimal re-renders

---

Made with ❤️ for students
