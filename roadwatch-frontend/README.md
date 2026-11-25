# RoadWatch Frontend (React + Vite + Tailwind CSS) 🛣️💻

A production-ready, highly responsive citizen reporting and municipal road repair dispatch portal built with **React (Vite)**, **Tailwind CSS**, **Leaflet**, **Chart.js**, and **Socket.IO**.

---

## Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      React 18 (Vite)                        │
├──────────────────────────────┬──────────────────────────────┤
│ State & Communication        │ Realtime & Data              │
│ - AuthContext (JWT & Roles)  │ - Socket.IO Client           │
│ - SocketContext (Live bus)   │ - Axios Interceptors         │
│ - React Hot Toast            │ - navigator.geolocation      │
├──────────────────────────────┼──────────────────────────────┤
│ Interactive GIS & Charts     │ UI & Design System           │
│ - Leaflet + React-Leaflet    │ - Tailwind CSS               │
│ - Dynamic Priority SVGs      │ - Lucide Icons               │
│ - Chart.js + React-Chartjs-2 │ - Sliding Drawers & Modals   │
└──────────────────────────────┴──────────────────────────────┘
```

* **Build Tool**: Vite 5
* **CSS Framework**: Tailwind CSS with custom brand colors
* **Routing**: React Router DOM v6 with role-based `ProtectedRoute` guards
* **Maps**: Leaflet + React-Leaflet with OpenStreetMap tiles and custom priority markers
* **Charts**: Chart.js + react-chartjs-2 (Doughnut, Line, Bar)
* **Realtime**: Socket.IO Client with automatic room subscription and toast dispatch
* **HTTP**: Axios with JWT Bearer token request and 401 response interceptors

---

## Project Structure

```text
roadwatch-frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── api/
│   │   ├── client.js            # Axios client with JWT interceptor
│   │   ├── authApi.js           # Login, register, me, staff creation
│   │   ├── reportApi.js         # Report creation, $geoNear, filters, assignment
│   │   ├── taskApi.js           # Maintenance tasks & repair submission
│   │   ├── repairApi.js         # Repair verification & queries
│   │   ├── teamApi.js           # Team creation and member listing
│   │   ├── analyticsApi.js      # Aggregation summary, trends, hotspots
│   │   └── notificationApi.js   # Notifications & read status
│   ├── context/
│   │   ├── AuthContext.jsx      # Global token, user, role, login/logout
│   │   └── SocketContext.jsx    # Realtime socket connection, toasts & event bus
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSocket.js
│   │   └── useGeolocation.js    # Browser GPS locator with fallback
│   ├── components/
│   │   ├── common/
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── PriorityBadge.jsx
│   │   │   ├── Timeline.jsx     # Vertical status history timeline
│   │   │   ├── Skeleton.jsx     # Card & Table skeletons
│   │   │   ├── EmptyState.jsx   # Friendly empty state illustrations
│   │   │   ├── Modal.jsx        # Accessible dialog modal
│   │   │   ├── Drawer.jsx       # Sliding complaint detail drawer
│   │   │   └── BeforeAfterViewer.jsx # Side-by-side or toggle photo viewer
│   │   ├── layout/
│   │   │   ├── Navbar.jsx       # Role-aware navbar with bell badge dropdown
│   │   │   ├── Sidebar.jsx      # Desktop sidebar + mobile responsive nav
│   │   │   └── DashboardLayout.jsx
│   │   └── map/
│   │       ├── LeafletMarkerFix.js # Priority-colored SVG marker generator
│   │       ├── MapPicker.jsx    # Draggable pin for reporting damage
│   │       └── PotholeMap.jsx   # Clustered / colored map with action popups
│   ├── pages/
│   │   ├── public/
│   │   │   └── LandingPage.jsx  # Hero, live stats counter, How it works, CTA
│   │   ├── auth/
│   │   │   ├── Login.jsx        # With 1-click demo credential switcher
│   │   │   └── Register.jsx     # Citizen registration form
│   │   ├── citizen/
│   │   │   ├── ReportPothole.jsx# Multi-photo upload, GPS pin, 25m duplicate alert
│   │   │   ├── MyComplaints.jsx # Card list with real-time update & details drawer
│   │   │   └── NearbyPotholes.jsx # Map centred on user with radius slider & upvote
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx # Stat cards, 4 Chart.js charts, Hotspots list
│   │   │   ├── AdminMapView.jsx # Interactive map with quick dispatch drawer
│   │   │   ├── ComplaintsTable.jsx # Search, filter, paginate, priority override, assign
│   │   │   ├── RepairVerification.jsx # Before/after photo proof approval queue
│   │   │   ├── TeamsPerformance.jsx # Rework rates, completed counts, team creator
│   │   │   └── ManageMaintenance.jsx # Provision technician accounts
│   │   └── maintenance/
│   │       ├── MyTasks.jsx      # Assigned tasks, Google Maps link, repair submit
│   │       └── TaskHistory.jsx  # Completed history with verification feedback
│   └── routes/
│       ├── ProtectedRoute.jsx   # Route guard by role
│       └── AppRoutes.jsx        # Central route tree
```

---

## Quick Start

### 1. Installation
```bash
cd roadwatch-frontend
npm install
```

### 2. Environment Variables
Create `.env` (already pre-filled):
```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## Demo Login Accounts (1-Click on Login Screen)

On the **Login** page (`/login`), click any of the 3 quick-fill buttons:
1. **Admin**: `admin@roadwatch.org` / `AdminPassword123!`
2. **Maintenance**: `john.maint@roadwatch.org` / `MaintPassword123!`
3. **Citizen**: `alice.citizen@gmail.com` / `CitizenPassword123!`

---

## Key Feature Walkthrough

### 1. Citizen Portal
* **Report Damage (`/citizen/report`)**:
  * Upload up to 3 images with instant thumbnail previews.
  * Drag the blue pin on the Leaflet map or tap "Use Current GPS".
  * If a pothole is within 25 meters, RoadWatch flags it with an informative banner and automatically combines your report and citizen upvote.
* **My Complaints (`/citizen/complaints`)**:
  * Filter complaints by active or completed status.
  * Click any card to slide out the **Details Drawer** showing full timeline history and completed repair photos once fixed.
  * Real-time socket updates reflect status changes in place without refreshing.
* **Nearby Potholes (`/citizen/nearby`)**:
  * Adjust the interactive radius slider (0.5 km to 15 km).
  * Markers are colored by severity (Green: Low, Amber: Medium, Orange: High, Red pulsing: Critical).
  * Click any marker popup to tap **"I'm Affected"** to endorse the ticket.

### 2. Administrator Portal
* **Operations Dashboard (`/admin/dashboard`)**:
  * Metric cards: Total Reports, Open/Pending, In Progress, Verified Fixed, Overdue Tasks.
  * 4 Chart.js charts: 12-Month Trends Line, Status Distribution Doughnut, Priority Breakdown Bar, and Team Output Bar.
  * Regional Hotspots Table aggregating damage density by municipal ward.
* **Live Dispatch Map (`/admin/map`)**:
  * Map with one-click **"Assign Crew"** drawer to set completion deadlines.
* **Complaints Management (`/admin/complaints`)**:
  * Instant search and multi-criteria filters.
  * Detail modal allowing priority override, team assignment, or ticket rejection.
* **Repair Verification (`/admin/verifications`)**:
  * Side-by-side Before & After photo viewer.
  * Inspect crew notes and materials applied.
  * **Approve** (transitions ticket to `verified`) or **Reject** (sends ticket back to `in-progress` with supervisor remarks).
* **Teams & Performance (`/admin/teams`)**:
  * Tracks completed tasks, average hours taken, overdue counts, and supervisor **rework rates**.

### 3. Maintenance Crew Portal
* **My Tasks (`/maintenance/tasks`)**:
  * Lists dispatch orders assigned specifically to the technician's crew.
  * Highlights overdue tickets in red.
  * Direct one-click **"Get Directions"** link launching Google Maps turn-by-turn navigation to the exact coordinates.
  * **"Accept & Start Work"** moves status to `in-progress`.
  * **"Submit Completed Repair"** allows uploading before & after proof, logging hours taken and asphalt materials used.
* **Task History (`/maintenance/history`)**:
  * Archive of past jobs with supervisor inspection feedback.

