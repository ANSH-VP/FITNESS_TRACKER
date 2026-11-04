# FitTrack – Your Personal Fitness Companion ⚡🏃‍♂️🥗

A complete, responsive, modern fitness tracking web application built for a university second-year evaluation project using **React 19**, **Vite**, **JavaScript**, **HTML5**, and **CSS3**.

FitTrack empowers users to manage running activities with real-time GPS maps, analyze nutrition via the Open Food Facts API and barcode scanner, log strength and cardio workouts, monitor body metrics over time, and establish progressive fitness milestones.

---

## 🌟 Key Features

### 👤 User Module
- **Welcome Page**: Clean, modern landing page with feature previews, visual HUD graphics, and one-click demo credentials filler.
- **Authentication & User Data Isolation**:
  - Full registration with validation (name, email, age, gender, height, weight, fitness level, fitness objective).
  - Credentials and datasets persisted in browser **LocalStorage**.
  - Current login session maintained securely in **SessionStorage**.
  - Strict user data partition: logging out or switching accounts never leaks previous user's records.
- **Athlete Dashboard**:
  - Real-time statistics: total distance run, total duration, sessions, calories burned, and daily calorie budget.
  - Interactive Recharts graphs: 7-day mileage and caloric intake trends.
  - Quick action pills and recent activity feed.
  - Friendly empty state for brand-new athletes.
- **GPS Running Tracker**:
  - Browser Geolocation API live movement tracking with Haversine distance calculation.
  - Interactive **Leaflet** map with **OpenStreetMap** tiles showing route polylines and current position pin.
  - Live pace (min/km), duration timer, and weight-based caloric expenditure.
  - Full controls: Start, Pause, Resume, End, Discard, and Save Run.
  - **Manual Run Entry** fallback when GPS permission is denied or unavailable on desktop.
- **Food Scanner & Search**:
  - Global nutrition lookup powered by the official **Open Food Facts API**.
  - Manual numeric barcode search and camera barcode scanner (via `html5-qrcode`).
  - Keyword food search (e.g. Oatmeal, Chicken Breast, Greek Yogurt).
  - Interactive portion adjuster (grams) that dynamically calculates calories, protein, carbs, and fat.
  - "Add to Diary" with direct meal category assignment (Breakfast, Lunch, Dinner, Snacks).
  - Manual custom food entry fallback and offline catalog.
- **Daily Nutrition Diary**:
  - Meals organized by Breakfast, Lunch, Dinner, and Snacks.
  - Day-by-day date stepper and calendar picker.
  - Macro breakdown cards (Protein, Carbohydrates, Healthy Fats).
  - Configurable daily calorie target and intake progress bar.
  - Edit and delete meal records.
- **Workout Tracker**:
  - Categories: Strength Training, Cardio, Running, Cycling, Walking, Bodyweight Training, HIIT, Other.
  - Exercise presets library (Bench Press, Squats, Deadlifts, Push-ups, Pull-ups, etc.).
  - Multi-set strength builder with sets, reps, and weight (kg).
  - Automated calorie estimates based on duration and activity MET values.
  - Filterable workout history.
- **Progress Tracking & Goals**:
  - Body weight log history with interactive line chart.
  - BMI calculator with category classifications and healthcare advice.
  - Running distance history chart.
  - Custom goal setting with automated real-time progress calculations and celebratory confetti.
- **Athlete Profile & Settings**:
  - Edit personal metrics, physical profile, and daily targets.
  - JSON Data Export (download a personal fitness backup).
  - Academic project security disclosure.

---

### 🛡️ Admin Module
- **Distinct Visual Theme**: Dark obsidian/navy layout with amber and gold superuser badges.
- **Admin Dashboard**: Aggregated statistics across all users (total athletes, total runs, total workouts, total meals, total kilometers).
- **User Management**:
  - Search athletes by name, email, or goal.
  - Inspect individual athlete records (runs, workouts, nutrition).
  - Cascading account deletion (safely cleans up all isolated user data without affecting other users).
  - Protection against deleting the root administrator account.
  - User passwords are strictly protected and never exposed.
- **Global Activity Logs**: Chronological audit trail of all platform activities with multi-type filters.

---

## 🔑 Demo Review Credentials

FitTrack includes pre-configured demo accounts initialized on first launch:

| Role | Email | Password | Access |
|---|---|---|---|
| **Regular Athlete** | `demo@fittrack.app` | `Fittrack123` | User Dashboard, GPS Tracker, Scanner, Diary, Workouts, Progress |
| **Administrator** | `admin@fittrack.app` | `Admin12345` | Admin Console, User Management, Activity Logs |

*Note: On the login page, you can also use the one-click "Fill Demo Athlete" or "Fill Demo Admin" buttons to test instantly.*

---

## 🛠️ Technology Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM (v7)
- **Charts**: Recharts
- **Mapping & Geolocation**: Leaflet, OpenStreetMap, Browser Geolocation API
- **Food Data & Barcodes**: Open Food Facts API, `html5-qrcode`
- **Icons**: Lucide React
- **Celebratory Effects**: Canvas Confetti
- **Storage**: Browser LocalStorage (data isolation) & SessionStorage (session lifecycle)

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### 1. Clone & Navigate
```bash
git clone https://github.com/your-username/fittrack.git
cd fittrack
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
This produces an optimized production bundle inside the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

---

## ☁️ Deployment Guide (Vercel)

This project is pre-configured and ready for deployment to [Vercel](https://vercel.com):

1. Push your repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: FitTrack application"
   git branch -M main
   git remote add origin https://github.com/your-username/fittrack.git
   git push -u origin main
   ```
2. Log in to your **Vercel Dashboard** and click **"Add New Project"**.
3. Import your `fittrack` GitHub repository.
4. Framework preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Click **Deploy**.

> **SPA Routing on Vercel**: The included `vercel.json` contains route rewrites (`"source": "/(.*)", "destination": "/index.html"`), ensuring page refreshes work properly without 404 errors.

---

## 🔒 Academic Project Architecture Notice

This application was developed as a university second-year project demonstrating frontend state management, REST API consumption, Geolocation handling, and UI design. Data persistence and authentication use client-side browser **LocalStorage** and **SessionStorage**. In a production enterprise system, credentials and sensitive data would be stored in a secured backend database with bcrypt password hashing and JWT authentication tokens.

---

## 📄 License
This project is open-source and intended for educational evaluation.
