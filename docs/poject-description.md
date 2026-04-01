# Habit Tracker - Project Description

## 1. Introduction

Habit Tracker is a SaaS-style web application designed to help users build positive habits, reduce negative habits, and monitor their daily progress in a structured and motivating way.

The system allows users to create personal habits, define how often they should be performed, record daily results, and review progress over time. The application focuses on simplicity, clarity, and long-term consistency, making it suitable for everyday use.

This project is also intended as a full-stack software engineering practice project. It demonstrates the design and implementation of a modern web application using frontend, backend, database, and deployment technologies.

---

## 2. Problem Statement

Many people want to improve their daily routines, but they often lack a simple and organized way to track habits consistently. Without regular tracking and visible progress, it becomes difficult to stay motivated or identify improvement patterns.

The Habit Tracker application addresses this problem by providing a centralized system where users can manage their habits, log progress, and view feedback such as streaks, history, and completion statistics.

---

## 3. Project Goal

The goal of the project is to design and implement a web-based habit tracking system that enables users to:

- create and manage personal habits
- track daily habit completion
- monitor long-term consistency
- organize habits into categories
- review progress using statistics and streaks
- manage preferences and reminders
- export personal tracking data

From a software engineering perspective, the goal is also to build a clean, maintainable, and extensible full-stack application that reflects professional development practices.

---

## 4. Target Users

The primary target users are individuals who want to improve productivity, health, study routines, fitness consistency, or other daily behaviors through structured habit tracking.

The application is intended for users who want:
- a personal dashboard for daily habits
- simple progress logging
- visual feedback on consistency
- access to their data through an authenticated web application

---

## 5. Core System Idea

The core idea of the system is that each user has a personal account and can define habits they want to track.

Each habit has:
- a type
- a schedule
- optional target information
- optional category
- daily entries representing progress

The application supports two habit types:
- `COMPLETED` for habits tracked as done or not done
- `NUMERIC` for habits tracked using measurable values

The application supports two schedule types:
- `DAILY`
- `SELECTED_DAYS`

Users can log progress for each habit on a specific date. Based on these entries, the system can provide dashboard summaries, streak calculations, historical tracking, and basic statistics.

---

## 6. Main Features Overview

The system is expected to support the following main features:

- user registration and login
- secure access to personal data
- habit creation, editing, and archiving
- daily progress tracking
- one habit entry per habit per day
- dashboard with today’s scheduled habits
- streak and history tracking
- basic statistics
- category management
- reminder configuration
- user preferences
- CSV export

---

## 7. Project Scope

The project focuses on a personal habit tracking platform for authenticated users. It is not intended to be a social platform and does not currently include features such as public profiles, habit sharing, or community challenges.

The main scope is:
- account-based habit management
- daily tracking and data persistence
- progress visualization
- clean domain modeling
- practical full-stack implementation

The project is designed with future extension in mind, so more advanced features such as smart recommendations, predictive analytics, or richer notification systems could be added later.

---

## 8. Technical Context

The system is planned as a modern full-stack web application using the following technologies:

### Frontend
- React
- TypeScript

### Backend
- Spring Boot (Java)

### Database
- PostgreSQL

### DevOps / Deployment
- Docker
- Kubernetes

This technology stack supports both practical learning goals and realistic software architecture for a student SaaS-style project.

---

## 9. Expected Outcome

The expected outcome is a working web application where a user can:

1. register and log in
2. create and manage habits
3. define schedules and targets
4. log daily progress
5. monitor streaks and statistics
6. export data
7. use the application across devices through a browser

In addition to the application itself, the project should result in a well-structured codebase, a clear domain model, and documentation that demonstrates sound software engineering practice.
