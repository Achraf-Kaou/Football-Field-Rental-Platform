# Football Field Rental Platform

This repository contains a full-stack football field rental platform with:

- **Frontend**: Angular application for users and managers
- **Backend**: NestJS API with Prisma and PostgreSQL

## Features

- User authentication and role-based access (user/manager/admin)
- Complex and field management
- Booking workflows
- Chat and messaging features
- Reviews and dashboard modules

## Project Structure

- `/frontend` – Angular client
- `/backend` – NestJS server

## Quick Start

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm start
```

Backend runs on `http://localhost:3000` and frontend runs on Angular's default local port.

## More Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for architecture and module-level documentation.
