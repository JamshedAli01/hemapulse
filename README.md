# 🩸 HemaPulse

### Smart Blood Emergency & Donor Matching Platform

HemaPulse is a web-based blood emergency management platform designed to help connect patients and hospitals with compatible blood donors quickly and efficiently.

The platform provides a centralized workflow for managing blood requests, donor availability, matching, notifications, hospitals, and emergency response coordination.

---

## 🚨 The Problem

During blood emergencies, finding a suitable donor quickly can be difficult.

Traditional processes often involve:

* Calling multiple people individually
* Searching through disconnected donor lists
* Difficulty identifying currently available donors
* Delays in communicating urgent requests
* Limited visibility into blood request status

HemaPulse aims to streamline this process through a centralized digital platform.

---

## 💡 Solution

HemaPulse brings donors, patients, and hospitals into one system.

The platform is built around an emergency workflow:

**Blood Request → Verification → Donor Matching → Donor Response → Fulfillment**

The goal is to reduce unnecessary delays and make blood emergency coordination more organized.

---

## ✨ Key Features

### 👤 Donor Management

* Donor registration and profiles
* Blood group information
* Donor availability management
* Donor information retrieval

### 🆘 Blood Requests

* Create blood emergency requests
* Track request information
* Request verification
* Request cancellation
* Request-to-donor matching workflow

### 🏥 Hospital Management

* Hospital information management
* Hospital listing
* Hospital-specific information

### 🔎 Donor Matching

* Match blood requests with suitable donors
* View matching results
* Donor response workflow

### 🔔 Notifications

* Emergency notification workflow
* Notification management
* Notification read status

### 📊 Dashboard

* Blood-group information
* Emergency/request overview
* Dashboard statistics

### 🤖 AI-Assisted Workflow

The project architecture includes an AI layer intended to assist with emergency request analysis and duplicate-request detection.

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      User / Web     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite UI   │
                    │      Tailwind CSS   │
                    └──────────┬──────────┘
                               │ HTTPS / REST API
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │      Python         │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
        ┌────────────┐ ┌─────────────┐ ┌──────────────┐
        │ PostgreSQL │ │ Matching /  │ │ Notification │
        │  Database  │ │ API Logic   │ │   Services   │
        └────────────┘ └─────────────┘ └──────────────┘
```

### Technology Stack

**Frontend**

* React
* TypeScript
* Vite
* Tailwind CSS

**Backend**

* Python
* FastAPI
* REST API
* JWT-based authentication

**Database**

* PostgreSQL

**Deployment**

* Netlify — Frontend
* Railway — Backend/API
* PostgreSQL — Production database

---

## 📁 Project Structure

```text
the-warriors/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── db/
│   ├── tests/
│   ├── requirements.txt
│   └── ...
│
├── smart_blood_emergency_api.yaml
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* Python 3.10+
* PostgreSQL
* Git

---

# 🔧 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 🗄️ Database Configuration

HemaPulse uses **PostgreSQL**.

Configure the database connection through the backend environment configuration.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/hemapulse
```

Do not commit real database credentials or other secrets to GitHub.

---

## ▶️ Run the Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The API will normally be available at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

---

# 💻 Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file if required:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Vite will provide the local frontend URL in the terminal.

---

# 🔐 Environment Variables

Do not store production secrets in the repository.

Typical environment configuration includes:

### Backend

```env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_secret_key
```

### Frontend

```env
VITE_API_URL=http://127.0.0.1:8000
```

For production, `VITE_API_URL` should point to the deployed HTTPS backend.

Example:

```env
VITE_API_URL=https://your-backend-domain.example
```

---

# ☁️ Deployment

The intended production architecture is:

```text
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │    Netlify     │
              │ React Frontend │
              └───────┬────────┘
                      │ HTTPS
                      ▼
              ┌────────────────┐
              │    Railway     │
              │ FastAPI Backend│
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │   PostgreSQL   │
              │    Database    │
              └────────────────┘
```

The frontend communicates with the FastAPI backend through HTTPS REST API requests.

---

# 📡 API

The project's API contract is documented in:

```text
smart_blood_emergency_api.yaml
```

FastAPI also provides interactive API documentation when the backend is running:

```text
/docs
```

---

# 🔄 Core Workflow

```text
1. User creates a blood request
             │
             ▼
2. Request is verified
             │
             ▼
3. Matching process identifies compatible donors
             │
             ▼
4. Donors receive/respond to the request
             │
             ▼
5. Donation is coordinated
             │
             ▼
6. Emergency request is fulfilled
```

---

# 🛡️ Security Considerations

HemaPulse is designed with common web-application security practices in mind, including:

* Authentication
* JWT-based authorization
* Environment-based secrets
* PostgreSQL database
* CORS configuration
* API-level validation

Production deployments should use secure environment variables and HTTPS.

---

# 🧪 Testing

Backend tests are located in:

```text
backend/tests/
```

Run the test suite from the backend environment with:

```bash
pytest
```

Some tests may require a running PostgreSQL database and appropriate seed/configuration data.

---

# 🗺️ Future Improvements

Potential future improvements include:

* Real-time donor notifications
* SMS/WhatsApp emergency alerts
* More advanced donor ranking and matching
* Hospital verification workflows
* Location-based donor discovery
* Real-time request tracking
* Expanded AI-assisted emergency analysis
* Analytics and reporting
* Mobile application
* Improved production monitoring

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Make your changes
4. Commit your changes

```bash
git commit -m "Add your feature"
```

5. Push the branch

```bash
git push origin feature/your-feature
```

6. Open a Pull Request

---

# 📄 License

This project is currently provided for educational, hackathon, and development purposes.

---

## ❤️ HemaPulse

**Connecting blood donors with people who need them — faster.**
