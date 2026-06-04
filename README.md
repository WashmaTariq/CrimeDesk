# CrimeDesk — Crime Reporting & Investigation Management System

A full-stack web application for reporting and managing crime cases, built with MongoDB, Node.js, Express, React, and Socket.io.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [One-Time Database Setup](#one-time-database-setup)
- [API Endpoints](#api-endpoints)
- [MongoDB Features Demonstrated](#mongodb-features-demonstrated)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Group Members](#group-members)

---

## Project Overview

CrimeDesk is a unified crime reporting and investigation management system that allows citizens to report physical crimes and cybercrimes online. The system automatically assigns severity and risk scores, tracks case investigation lifecycles, and provides a real-time analytics dashboard for administrators.

**Key capabilities:**
- Citizens can submit crime reports with digital evidence metadata.
- System auto-assigns severity levels and calculates risk scores based on crime type and configuration rules.
- Administrators can seamlessly update case status through the investigation pipeline.
- Real-time dashboard analytics powered by high-efficiency MongoDB aggregation pipelines.
- Modern frontend data visualization charts that synchronize instantly across clients via WebSockets.
- Complete audit trail logging database state mutations.

---

## Tech Stack

| Layer        | Technology                             |
|--------------|----------------------------------------|
| Database     | MongoDB (Local) / MongoDB Atlas (Cloud)|
| ODM          | Mongoose                               |
| Backend      | Node.js, Express.js                    |
| Frontend     | React.js (Vite), Tailwind CSS, Recharts|
| Real-time    | Socket.io                              |
| API Client   | Axios                                  |
| Dev Tools    | Nodemon                                |

---

## Project Structure

```text
crimedesk/
├── .gitignore               # Root Git ignore configuration (hides node_modules, .env, etc.)
├── README.md                # Project documentation and setup guide
├── backend/
│   ├── middleware/
│   │   └── auth.js          # API key authentication middleware
│   ├── models/
│   │   ├── Case.js          # Cases collection schema
│   │   ├── Officer.js       # Officers collection schema
│   │   ├── Reporter.js      # Reporters collection schema
│   │   └── Log.js           # Audit logs collection schema
│   ├── routes/
│   │   ├── caseRoutes.js    # Case CRUD + aggregation endpoints
│   │   └── officerRoutes.js # Officer CRUD endpoints
│   ├── .env                 # Environment variables (git-ignored)
│   ├── indexes.js           # Database index creation script
│   ├── views.js             # Database view creation script
│   ├── seed.js              # Automated database seeder script
│   ├── sharding.js          # Shard key configuration blueprint
│   ├── package.json         # Backend dependencies & runtime scripts
│   └── server.js            # Main server entry point
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── cases.js     # Axios API connection layers
    │   ├── App.jsx          # Main dashboard view & UI state controller
    │   ├── index.css        # Custom styling & Tailwind directives
    │   └── main.jsx         # React DOM root initializer
    ├── index.html
    ├── package.json         # Frontend dependencies & configurations
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.js