# 🩸 HemaPulse

> 🚑 Smart Blood Emergency Coordination Platform

HemaPulse connects blood requesters, donors, hospitals, and administrators through a centralized platform designed to coordinate urgent blood needs, donor matching, notifications, and donation scheduling.

## 🌐 Live Application

**Try HemaPulse:** [https://hemapulse-app.netlify.app](https://hemapulse-app.netlify.app)

- Frontend: Netlify
- Backend API: Railway

## 💡 Overview

Blood emergencies often require quickly finding compatible donors and coordinating communication between requesters, hospitals, and donors. HemaPulse provides a centralized workflow for:

- Creating blood requests
- Identifying compatible donors
- Notifying matched donors
- Accepting or declining requests
- Coordinating donation scheduling
- Tracking request status
- Managing hospitals and donor profiles

## ✨ Core Features

### 🔐 Authentication and Roles

- User registration and login
- JWT-based authentication
- Role-based access for Requesters, Donors, Hospitals, and Administrators
- Ownership and role checks for protected operations

### 🆘 Blood Requests

- Create requests with blood group, units, urgency, required-before time, and hospital association
- View request details and status
- Cancel requests when authorized
- Track verification and fulfillment-related information

### 🎯 Smart Matching

HemaPulse identifies compatible donors using the application's supported blood-group compatibility rules, donor availability, eligibility, and geographic distance. Matching creates donor match records and in-app notifications.

### 🧑‍🤝‍🧑 Donor Workflow

- Create and manage a donor profile
- Maintain availability and eligibility information
- View matched requests
- Accept or decline matched requests
- Preserve an optional decline reason
- Schedule and confirm donations

### 🔔 Notifications

- Blood request match notifications
- Donor accepted and donor declined notifications
- Notification history
- Read/unread notification state

### 🏥 Hospital Management

- List hospitals
- View hospital information
- Associate hospitals with blood requests
- Search for human-readable hospital and location information

### 🤖 AI-Assisted Support

The current AI endpoints provide rule-based request urgency analysis and duplicate-request detection. These are supporting workflow tools, not autonomous medical decision-making.

## 🔄 How HemaPulse Works

```text
Requester creates blood request
        ↓
Hospital/location is associated
        ↓
HemaPulse evaluates compatible eligible donors
        ↓
Matched donors receive notifications
        ↓
Donor accepts or declines
        ↓
Requester receives response notification
        ↓
Donation can be scheduled
```

## 👥 User Roles

| Role | Purpose |
| --- | --- |
| Requester | Creates and manages blood requests |
| Donor | Maintains donor availability and responds to matched requests |
| Hospital | Provides hospital-related information and participates in request workflows |
| Admin | Provides administrative oversight and protected management operations |

## 🩸 Blood Matching

Matching uses the application's supported blood-group compatibility rules and considers donor eligibility, availability, and geographic distance. HemaPulse is a coordination platform and does not replace professional medical judgment, blood-bank procedures, or hospital protocols.

## 📍 Location Handling

Users work with hospital names, cities, and addresses rather than manually entering latitude and longitude in the request workflow. Coordinates may be used internally for distance calculations and map-related features.

Location handling is actively being refined to improve hospital-coordinate accuracy and geographic matching.

## 🛠️ Technology Stack

### 💻 Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### ⚙️ Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT authentication

### ☁️ Deployment

- Netlify
- Railway
- PostgreSQL on Railway

## 📁 Repository Structure

```text
the-warriors/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── tests/
│   ├── schema.sql
│   ├── seed.sql
│   └── requirements.txt
├── smart_blood_emergency_api.yaml
├── LICENSE
└── README.md
```

## 🚀 Local Development

The frontend and backend run separately during local development.

### 💻 Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

### ⚙️ Backend

```powershell
cd backend
.\venv2\Scripts\python.exe -m uvicorn app.main:app --reload
```

The backend normally serves locally at `http://127.0.0.1:8000`. FastAPI documentation is available at `/docs` while the backend is running.

## 🔑 Environment Variables

Use local environment files and never commit real credentials or tokens.

### Backend

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
ENVIRONMENT=development
```

### Frontend

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 📡 API Contract

The repository includes [smart_blood_emergency_api.yaml](./smart_blood_emergency_api.yaml), an OpenAPI-style API contract describing backend endpoints and data models. The contract is a reference and does not necessarily mean every documented endpoint is currently implemented.

## 🧪 Testing and Verification

Useful checks include:

```powershell
cd frontend
npm.cmd run build
```

```powershell
cd backend
python -m compileall -q app
pytest -q
```

The backend test suite has previously passed 26 tests. Additional focused verification is performed during active development; database-backed tests may require a configured PostgreSQL environment.

## ☁️ Deployment

```text
Frontend → Netlify
Backend  → Railway
Database → PostgreSQL on Railway
```

Live application: [https://hemapulse-app.netlify.app](https://hemapulse-app.netlify.app)

## 🛡️ Security and Authorization

Protected operations use authenticated users together with role and ownership checks. Examples include:

- Request cancellation restricted to authorized request creators or supported administrators
- Matching operations restricted to authorized requester/admin workflows
- Donor responses restricted to donors matched to the request
- Backend validation for request, hospital, and location data

## 📌 Current Status

HemaPulse is an actively developed prototype focused on demonstrating an end-to-end blood emergency coordination workflow. Core request, matching, notification, donor-response, hospital, and donation workflows are implemented, while location/geocoding accuracy and some UX areas remain under active development.

## 🗺️ Roadmap

Potential future work includes:

- More robust hospital and location geocoding
- Expanded notification channels
- Advanced analytics
- More comprehensive hospital workflows
- Production-grade monitoring
- Additional accessibility and UX improvements

## ⚠️ Safety Disclaimer

HemaPulse is a software coordination platform for blood-emergency workflows. It does not replace doctors, hospitals, blood banks, laboratory testing, compatibility verification, or professional medical judgment.

## 📄 License

HemaPulse is licensed under the [MIT License](./LICENSE).

## 🤝 Contributing

Contributions and improvements are welcome. Please open an issue or pull request with a clear description of the proposed change and its verification steps.
