# Documentation

## Overview

The Football Field Rental Platform is a full-stack web application that supports booking and managing football fields.

## Architecture

- **Frontend**: Angular (`/frontend`)
- **Backend**: NestJS (`/backend`)
- **Database**: PostgreSQL via Prisma

## Backend Modules

Defined in `backend/src/app.module.ts`:

- `AuthModule`
- `UsersModule`
- `ComplexModule`
- `FieldModule`
- `BookingModule`
- `MessageModule`
- `ChatMessageModule`
- `DashboardModule`
- `ReviewModule`

## Frontend Routes

Core routes are defined in `frontend/src/app/app.routes.ts`, including:

- Public routes: `/`, `/login`, `/unauthorized`
- User area: `/user`, `/user/fields`, `/user/booking/:idField`, `/user/user-bookings`, `/user/chat`, `/user/profile`, `/user/complexes`
- Manager area: `/manager`, `/manager/complex-list`, `/manager/complex/new`, `/manager/complex/:id`, field and booking management routes

## Environment Setup

### Backend

Use `backend/.env.example` as a template for:

- Database connection
- JWT secrets
- OAuth providers (Google/Facebook)
- App URLs

### Frontend

Environment files are in `frontend/src/environments/`.

## Development Commands

### Backend

```bash
cd backend
npm run start:dev
npm run lint
npm run test
npm run build
```

### Frontend

```bash
cd frontend
npm start
npm run build
npm run test -- --watch=false
```
