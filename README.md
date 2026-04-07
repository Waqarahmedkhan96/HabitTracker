# Habit Tracker

Habit Tracker is a full-stack web application for tracking personal habits.
This repository now contains a working backend and frontend, plus Docker and Kubernetes deployment resources.

## Current Project Status

The project is in active implementation phase.

Implemented today:
- JWT-based authentication (register and login)
- User-scoped data model (habits, entries, categories, reminders, profile)
- Dashboard endpoint and dashboard UI
- Habit CRUD, ordering, and details views
- Daily habit entry tracking
- Category management
- CSV export for habits and entries
- Dockerized local stack (PostgreSQL + backend + frontend)

## Tech Stack

Frontend:
- React 19
- TypeScript
- Vite
- React Router

Backend:
- Java 21
- Spring Boot 4
- Spring Security
- Spring Data JPA

Database:
- PostgreSQL (runtime)
- H2 (tests)

Infrastructure:
- Docker and Docker Compose
- Kubernetes manifests (currently outdated and need update)

## Core Domain Concepts

- AppUser
- Habit
- HabitEntry
- Category
- Reminder
- UserPreference

Key domain rules currently reflected in code:
- One habit entry per habit per day
- Habits can be archived/deactivated using active flag
- Habit types: COMPLETED and NUMERIC
- Frequency types: DAILY and SELECTED_DAYS
- Streak logic accounts for scheduling rules

## Main Application Features

- Authentication and authorization
	- Register: POST /api/auth/register
	- Login: POST /api/auth/login

- Habits
	- List, create, update, delete habits
	- Reorder habits via PATCH /api/habits/order
	- Track entries under /api/habits/{habitId}/entries

- Categories
	- List, create, update categories

- Dashboard
	- GET /api/dashboard with optional date parameter

- Profile
	- GET and PUT /api/profile

- Export
	- GET /api/export/habits
	- GET /api/export/entries

## Repository Structure

```bash
.
|- backend/habittracker-backend/
|  |- src/main/java/
|  |- src/main/resources/
|  |- src/test/java/
|  |- Dockerfile
|  |- pom.xml
|- frontend/habittracker-frontend/
|  |- src/
|  |- public/
|  |- Dockerfile
|  |- package.json
|- docs/
|- k8s/
|- docker-compose.yml
`- README.md
```

## Running Locally

### Prerequisites

- Java 21+
- Node.js 22+
- npm
- Docker (recommended for PostgreSQL)

### Option 1: Full stack with Docker Compose (recommended)

From repository root:

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:8081
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

To stop:

```bash
docker compose down
```

### Option 2: Run backend and frontend separately

1) Start only PostgreSQL with Docker:

```bash
docker compose up -d db
```

2) Run backend:

```bash
cd backend/habittracker-backend
sh mvnw spring-boot:run
```

3) Run frontend in a second terminal:

```bash
cd frontend/habittracker-frontend
npm install
npm run dev
```

Frontend dev URL is usually http://localhost:5173 and uses backend http://localhost:8080 by default.

## Demo Data

Backend demo data seeding is enabled by default via app.demo-data.enabled=true.

Default seeded demo user:
- username: demo (or email: demo@habittracker.local)
- password: demo1234

If this user already exists, seeding is skipped.

## Tests

Backend tests are available and run with:

```bash
cd backend/habittracker-backend
sh mvnw test
```

Current test coverage includes application context and selected service logic (for example streak and habit statistics services).

## Documentation

Project analysis and design documents are in docs/, including:
- project description
- requirements
- use cases
- business rules
- domain model diagrams

These documents describe the original foundation and are now complemented by the implemented application code.

## Known Gaps

- k8s/ manifests still use older viatab naming and credentials and should be updated before production-like Kubernetes deployment.
- The stats page currently focuses on CSV export and has a placeholder note for richer statistics views.

## Contributors

- Piotr Gala
- Waqar Ahmed Khan

## License

Created for educational and portfolio purposes.
