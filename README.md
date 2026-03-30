# Habit Tracker

Habit Tracker is a full-stack software engineering project focused on analysis, system design, and domain modeling for a habit tracking web application.

At the current stage, the project is centered on defining the core structure of the system before full implementation. The main goal is to build a solid foundation that can later be developed into a complete SaaS-style web application.

## Current Project Status

The project is currently in the **analysis and design phase**.

So far, the work has focused on:
- defining the project idea and scope
- identifying core system requirements
- writing use cases
- defining business rules
- designing the domain model
- planning the system structure and architecture

This means the repository currently represents the **foundation of the project**, not the final application.

## Project Idea

The application is intended to help users:
- create personal habits
- define schedules for habits
- track daily progress
- monitor streaks and consistency
- organize habits into categories
- review history and statistics
- manage preferences and reminders
- export personal tracking data

The long-term goal is to create a simple and motivating habit tracking platform that is cleanly designed and technically extensible.

## Planned System Scope

The intended system will include:
- user registration and login
- secure user-specific data access
- habit creation, editing, and archiving
- support for different habit types
- daily progress tracking
- dashboard for today's habits
- streak calculation
- progress statistics
- category management
- reminder configuration
- CSV export

## Main Domain Concepts

The current domain model is based on the following core entities:
- `AppUser`
- `Habit`
- `HabitEntry`
- `Category`
- `Reminder`
- `UserPreference`

### Key domain decisions
- one `HabitEntry` per habit per day
- habits are archived using an `active` flag
- habit types are `COMPLETED` and `NUMERIC`
- frequency types are `DAILY` and `SELECTED_DAYS`
- streaks are calculated only on scheduled days

## Planned Tech Stack

### Frontend
- React
- TypeScript

### Backend
- Spring Boot
- Java

### Database
- PostgreSQL

### DevOps / Deployment
- Docker
- Kubernetes

## Repository Structure

```bash
.
├── backend/
├── frontend/
├── k8s/
├── docs/
├── docker-compose.yml
└── README.md
```

## Documentation

The current documentation includes:
- project description
- system requirements
- use cases
- business rules
- domain model

## Future Development

The next stages of the project are expected to include:
- backend implementation
- frontend implementation
- database integration
- API development
- authentication flow
- dashboard and habit tracking features
- statistics and export functionality
- deployment improvements

## Contributors

- Piotr Gała
- Waqar Ahmed Khan

## License

This project is created for educational and portfolio purposes.
