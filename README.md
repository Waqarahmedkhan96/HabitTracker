# Habit Tracker

Full-stack habit tracking application with a Spring Boot API, React frontend, PostgreSQL database, and Docker-based local setup.

The app lets users register, log in, create habits, track daily progress, manage categories and reminders, view dashboard stats, update profile settings, and export habit data to CSV.

## Tech Stack

### Backend

- Java 21
- Spring Boot 4
- Spring Security with JWT authentication
- Spring Data JPA
- PostgreSQL for runtime data
- H2 for tests
- Maven Wrapper

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- ESLint

### Infrastructure

- Docker
- Docker Compose
- Kubernetes manifests in `k8s/`

## Features

- User registration and login
- JWT-protected API routes
- User-scoped habits, entries, categories, reminders, and profile data
- Habit CRUD
- Habit ordering
- Daily habit entry tracking
- Dashboard summary
- Category management
- Reminder management
- CSV export for habits and entries
- Demo data seeding for local development

## Repository Structure

```text
.
|-- backend/habittracker-backend/      # Spring Boot backend API
|-- frontend/habittracker-frontend/    # React + Vite frontend
|-- docs/                              # Requirements, use cases, diagrams, rules
|-- k8s/                               # Kubernetes manifests
|-- docker-compose.yml                 # Local full-stack environment
`-- README.md
```

## Prerequisites

- Java 21+
- Node.js 22+
- npm
- Docker and Docker Compose

## Quick Start With Docker

From the repository root:

```bash
docker compose up --build
```

Available services:

- Frontend: <http://localhost:8081>
- Backend API: <http://localhost:8080>
- PostgreSQL: `localhost:5432`

Stop the stack:

```bash
docker compose down
```

Remove database data too:

```bash
docker compose down -v
```

## Local Development

Start only PostgreSQL:

```bash
docker compose up -d db
```

Run the backend:

```bash
cd backend/habittracker-backend
./mvnw spring-boot:run
```

Run the frontend in another terminal:

```bash
cd frontend/habittracker-frontend
npm install
npm run dev
```

The Vite dev server usually runs on <http://localhost:5173>.

## Demo Account

Demo data is enabled by default with:

```properties
app.demo-data.enabled=true
```

Default demo user:

- Username: `demo`
- Email: `demo@habittracker.local`
- Password: `demo1234`

If the demo user already exists, seeding is skipped.

## Useful Commands

### Backend

```bash
cd backend/habittracker-backend
./mvnw test
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend/habittracker-frontend
npm install
npm run dev
npm run build
npm run lint
```

## API Overview

Main API areas:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `/api/habits`
- `/api/habits/{habitId}/entries`
- `/api/categories`
- `/api/reminders`
- `/api/dashboard`
- `/api/profile`
- `/api/export/habits`
- `/api/export/entries`

Most endpoints require a JWT token returned from login or registration.

## Domain Rules

- Each user owns their own habits, entries, categories, reminders, and profile.
- A habit can have only one entry per day.
- Supported habit types are `COMPLETED` and `NUMERIC`.
- Supported frequency types are `DAILY` and `SELECTED_DAYS`.
- Archived or inactive habits are excluded from normal active habit flows.
- Streak calculations respect habit scheduling rules.

## Configuration

Default backend configuration is in:

```text
backend/habittracker-backend/src/main/resources/application.properties
```

Important local defaults:

- Backend port: `8080`
- Frontend API base URL: `VITE_API_BASE_URL`, default `http://localhost:8080`
- Database name: `habittracker_db`
- Database user: `habittracker_user`
- Database password: `habittracker_password`
- Demo data: enabled

For production-like environments, replace the default JWT secret and database credentials.

## Tests

Backend tests:

```bash
cd backend/habittracker-backend
./mvnw test
```

Current test coverage includes application context loading and selected service logic, including habit statistics and master streak calculation.

Frontend validation:

```bash
cd frontend/habittracker-frontend
npm run lint
npm run build
```

## Documentation

Additional project documentation is available in `docs/`:

- Project description
- Requirements
- Use cases
- Business rules
- Domain model diagrams

## Known Gaps

- The Kubernetes manifests still need verification before production-like deployment.
- The stats page currently focuses on CSV export and does not yet provide full analytics views.
- Default local credentials and JWT secret are development-only values.

## Contributors

- Piotr Gala
- Waqar Ahmed Khan

## License

Created for educational and portfolio purposes.
