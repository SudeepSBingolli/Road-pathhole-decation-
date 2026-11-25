# RoadWatch Backend API 🛣️🔍

RoadWatch is a production-grade backend platform for community pothole reporting, municipal dispatching, and end-to-end repair tracking. Built with **Node.js**, **Express**, **MongoDB (Mongoose)**, **JWT**, **Multer**, **Cloudinary**, and **Socket.IO**.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │            Client Layer               │
                      │  (Mobile App, Web Portal, Dashboard)  │
                      └──────────────────┬────────────────────┘
                                         │
                         HTTPS REST API  │  WebSocket (WSS)
                                         │
                      ┌──────────────────▼────────────────────┐
                      │        Express.js API Gateway         │
                      │  Helmet • CORS • RateLimit • Morgan   │
                      └──────────────────┬────────────────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          │                              │                              │
┌─────────▼─────────┐          ┌─────────▼─────────┐          ┌─────────▼─────────┐
│ Auth & Roles      │          │ Core Workflows    │          │ Realtime Engine   │
│ - JWT / bcrypt    │          │ - 25m $near dedupe│          │ - Socket.IO Auth  │
│ - Citizen / Admin │          │ - Auto Priority   │          │ - Room Dispatch   │
│ - Maintenance     │          │ - Verification    │          │ - DB Notification │
└─────────┬─────────┘          └─────────┬─────────┘          └─────────┬─────────┘
          │                              │                              │
          └──────────────────────────────┼──────────────────────────────┘
                                         │
                               ┌─────────▼─────────┐
                               │  MongoDB Database │
                               │  2dsphere Index   │
                               │  Aggregation API  │
                               └───────────────────┘
```

---

## Key Features

1. **Role-Based Access Control (RBAC)**:
   - `citizen`: Report potholes, view nearby damages, track report progress.
   - `maintenance`: View team tasks, change task status to `in-progress`, submit repairs with before/after photos.
   - `admin`: Supervise entire system, override priority, assign teams with deadlines, reject/approve repair work, view advanced analytics.
2. **Proximity Deduplication (25-meter Geospatial $near)**:
   - When a citizen reports a pothole, the backend searches for an open report within 25 meters.
   - If found:
     - Automatically links the report as a duplicate.
     - Increments the parent report's `complaintCount`.
     - Adds citizen to the report's `upvotes`.
     - Recalculates priority:
       - **1–2 complaints**: `low`
       - **3–5 complaints**: `medium`
       - **6–9 complaints**: `high`
       - **10+ complaints**: `critical`
     - Appends an audit entry to `statusHistory`.
3. **Geospatial Discovery (`$geoNear`)**:
   - `GET /api/reports/nearby`: Fetches damage spots sorted by distance from the user's GPS coordinates.
4. **Maintenance & Verification Lifecycle**:
   - `submitted` ➔ `assigned` (with due date) ➔ `in-progress` ➔ `repair-completed` (with before/after photos) ➔ `verified` (Admin approval) or back to `in-progress` (Admin rejection with rework notes).
5. **Automated Overdue Flagging**:
   - Hourly background cron job flags reports exceeding `dueDate` without verification as `isOverdue = true` and emits alerts.
6. **Realtime Socket.IO Notifications**:
   - Authenticates directly during the socket handshake using JWT.
   - Joins rooms: `user:<id>`, `role:admin`, `team:<id>`.
   - Real-time events: `report:new`, `report:statusChanged`, `task:assigned`, `repair:submitted`, `repair:verified`.
7. **Advanced Analytics Aggregations**:
   - Summary statistics by status and priority (`$facet`).
   - 12-month trend comparisons.
   - Average repair duration.
   - Per-team performance metrics (completed count, average time, overdue count, rework rate).
   - Hotspot clustering by administrative area and geospatial grid cells.

---

## Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **MongoDB**: v6.0 or higher (Local instance or MongoDB Atlas)
* **Cloudinary Account**: Free tier (optional for dev; fallback mock images provided)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd roadwatch-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your MongoDB connection string and Cloudinary credentials.

4. Seed the database with sample teams, users, and reports:
   ```bash
   npm run seed
   ```

5. Start the server:
   ```bash
   # Development (with nodemon)
   npm run dev

   # Production
   npm start
   ```

---

## Seed Accounts (Ready for Testing)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@roadwatch.org` | `AdminPassword123!` | System Administrator |
| **Maintenance** | `john.maint@roadwatch.org` | `MaintPassword123!` | Lead Tech, Central Pothole Squad (Downtown) |
| **Maintenance** | `david.maint@roadwatch.org` | `MaintPassword123!` | Field Tech, Metro Quick Repair (North Ward) |
| **Citizen** | `alice.citizen@gmail.com` | `CitizenPassword123!` | Citizen (Downtown reporter) |
| **Citizen** | `bob.citizen@gmail.com` | `CitizenPassword123!` | Citizen (North Ward reporter) |

---

## Postman API Reference Guide

### 1. Authentication Endpoints

#### Register Citizen
* **Endpoint**: `POST /api/auth/register`
* **Access**: Public (Citizen only)
* **Body** (`application/json`):
  ```json
  {
    "name": "Jane Citizen",
    "email": "jane@example.com",
    "password": "Password123!",
    "phone": "+1-555-0199"
  }
  ```
* **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Citizen registered successfully",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
      "user": {
        "id": "663f...",
        "name": "Jane Citizen",
        "email": "jane@example.com",
        "role": "citizen"
      }
    }
  }
  ```

#### Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Body** (`application/json`):
  ```json
  {
    "email": "admin@roadwatch.org",
    "password": "AdminPassword123!"
  }
  ```

#### Get Current User Profile
* **Endpoint**: `GET /api/auth/me`
* **Headers**: `Authorization: Bearer <TOKEN>`

#### Create Maintenance Staff (Admin Only)
* **Endpoint**: `POST /api/auth/maintenance`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
* **Body** (`application/json`):
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex.maint@roadwatch.org",
    "password": "MaintPassword123!",
    "phone": "+1-555-0144",
    "teamId": "663f..."
  }
  ```

---

### 2. Report Endpoints

#### Submit a Report (Multipart)
* **Endpoint**: `POST /api/reports`
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Content-Type**: `multipart/form-data`
* **Form Fields**:
  * `description` (text): "Huge pothole in middle of intersection"
  * `address` (text): "405 Congress Ave, Austin, TX"
  * `area` (text): "Downtown"
  * `latitude` (text/float): "30.2672"
  * `longitude` (text/float): "-97.7431"
  * `images` (file, max 3): [photo1.jpg, photo2.jpg]
* **Behavior**:
  * If within 25m of an open report: returns `isDuplicate: true`, updates parent count & priority.
  * If new: returns `isDuplicate: false`, creates report with `RW-2026-000X`.

#### Get Nearby Reports ($geoNear)
* **Endpoint**: `GET /api/reports/nearby?lat=30.2672&lng=-97.7431&radius=5000`
* **Access**: Public or Protected

#### List Reports with Filters & Pagination
* **Endpoint**: `GET /api/reports?status=assigned&priority=critical&area=Downtown&page=1&limit=10`
* **Headers**: `Authorization: Bearer <TOKEN>`

#### Admin: Set Priority Manually
* **Endpoint**: `PATCH /api/reports/:id/priority`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
* **Body** (`application/json`):
  ```json
  {
    "priority": "critical",
    "note": "Escalated due to high morning traffic volume"
  }
  ```

#### Admin: Assign Team with Due Date
* **Endpoint**: `PATCH /api/reports/:id/assign`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
* **Body** (`application/json`):
  ```json
  {
    "teamId": "663f...",
    "dueDate": "2026-11-15T18:00:00.000Z",
    "note": "Complete before weekend rush"
  }
  ```

#### Admin: Reject or Mark Duplicate
* **Endpoint**: `PATCH /api/reports/:id/status`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
* **Body** (`application/json`):
  ```json
  {
    "status": "rejected",
    "note": "Private driveway, outside municipal jurisdiction"
  }
  ```

---

### 3. Maintenance Task & Repair Endpoints

#### Get My Team's Assigned Tasks
* **Endpoint**: `GET /api/tasks`
* **Headers**: `Authorization: Bearer <MAINTENANCE_TOKEN>`

#### Start Working on a Task
* **Endpoint**: `PATCH /api/tasks/:id/status`
* **Headers**: `Authorization: Bearer <MAINTENANCE_TOKEN>`
* **Body** (`application/json`):
  ```json
  {
    "status": "in-progress",
    "note": "Crew deployed with asphalt roller"
  }
  ```

#### Submit Completed Repair (Multipart)
* **Endpoint**: `POST /api/tasks/:id/repair`
* **Headers**: `Authorization: Bearer <MAINTENANCE_TOKEN>`
* **Content-Type**: `multipart/form-data`
* **Form Fields**:
  * `notes` (text): "Excavated loose material, applied asphalt tack coat, compacted hot mix."
  * `timeTakenHours` (number): "3.5"
  * `materialsUsed` (text): "Cold Patch (40kg), Bitumen Emulsion (5L)"
  * `beforeImages` (file, max 3): [before.jpg]
  * `afterImages` (file, max 3): [after.jpg]

---

### 4. Admin Repair Verification

#### Verify Repair (Approve or Reject for Rework)
* **Endpoint**: `PATCH /api/repairs/:id/verify`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
* **Body - Approval**:
  ```json
  {
    "status": "approved",
    "remarks": "Repair verified on-site. Road surface level is smooth."
  }
  ```
* **Body - Rejection (Sends back to `in-progress`)**:
  ```json
  {
    "status": "rejected",
    "remarks": "Patch edges are uneven. Re-roll and seal perimeter."
  }
  ```

---

### 5. Analytics Aggregations

#### Status & Priority Summary
* **Endpoint**: `GET /api/analytics/summary`
* **Headers**: `Authorization: Bearer <ADMIN_OR_MAINT_TOKEN>`

#### 12-Month Trends
* **Endpoint**: `GET /api/analytics/trends?months=12`
* **Headers**: `Authorization: Bearer <ADMIN_OR_MAINT_TOKEN>`

#### Average Repair Time
* **Endpoint**: `GET /api/analytics/avg-repair-time`
* **Headers**: `Authorization: Bearer <ADMIN_OR_MAINT_TOKEN>`

#### Per-Team Performance & Rework Rates
* **Endpoint**: `GET /api/analytics/team-performance`
* **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`

#### Pothole Hotspots (Area & Coordinate Grid Clusters)
* **Endpoint**: `GET /api/analytics/hotspots`
* **Headers**: `Authorization: Bearer <ADMIN_OR_MAINT_TOKEN>`

---

### 6. Notifications

#### Get My Notifications
* **Endpoint**: `GET /api/notifications?unreadOnly=false&page=1&limit=20`
* **Headers**: `Authorization: Bearer <TOKEN>`

#### Mark Notification as Read
* **Endpoint**: `PATCH /api/notifications/:id/read`
* **Headers**: `Authorization: Bearer <TOKEN>`
* *Tip*: Pass `:id` as `read-all` to mark all notifications as read.

---

## Realtime Socket.IO Events

### Connection Handshake
Pass the JWT token in `auth.token`:
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "<YOUR_JWT_TOKEN>"
  }
});

socket.on("connect", () => {
  console.log("Connected to RoadWatch socket server");
});
```

### Event Catalog

| Event | Target Rooms | Payload Summary |
| :--- | :--- | :--- |
| `report:new` | `role:admin` | `{ reportId, complaintId, area, address, priority }` |
| `report:statusChanged` | `user:<citizenId>`, `role:admin`, `team:<assignedTeam>` | `{ reportId, complaintId, status, note }` |
| `task:assigned` | `team:<teamId>`, `user:<citizenId>`, `role:admin` | `{ reportId, complaintId, teamId, dueDate, address }` |
| `repair:submitted` | `role:admin`, `user:<citizenId>` | `{ repairId, reportId, complaintId, teamId, timeTakenHours }` |
| `repair:verified` | `team:<teamId>`, `user:<citizenId>`, `role:admin` | `{ repairId, reportId, verificationStatus, reportStatus, remarks }` |

---

## Production Checklist

* [x] **2dsphere Indexing**: Built-in on `Report.location` for high-performance geospatial `$near` queries.
* [x] **Atomic Sequences**: `RW-YYYY-XXXX` counter prevents race conditions during concurrent reports.
* [x] **Rate Limiting**: Protects sensitive auth and report creation endpoints.
* [x] **File Sanitization**: Multer memory storage enforces JPEG/PNG/WebP format and a 5MB per-file ceiling.
* [x] **Graceful Shutdown**: Handlers for `SIGTERM` and `SIGINT` ensure clean DB and HTTP disconnects.
* [x] **Environment Robustness**: Graceful mock image generation when live Cloudinary keys are unset.

