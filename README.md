# Maharana Pratap Hostel Management System (HMS-GS)

Comprehensive property, hostel, worker accommodation, and student living management system in Jaipur.

## Architecture & Packages

This repository is organized into independent packages:
- **`backend-2/`**: Node.js Express API with TypeScript, Prisma 7, and PostgreSQL. Handles authentication, reservations, property operations, mess & dining, financial ledgers, and billing.
- **`my-admin-portal/`**: React 19, TypeScript, and Vite 8 administrative portal. Features property management, room/unit allocation, resident onboarding, employee/HR directory, payroll, and billing dashboards.
- **`landing_site/`**: Public-facing landing page and guest booking flow built with React, Vite, and GSAP animations.
- **`frontend/`**: Auxiliary legacy React client.

## Node.js Engine Policy

- **Supported Node.js Versions**: Node.js `^18.0.0 || ^20.0.0 || ^22.0.0` (fully compatible with Prisma 7 and Vite 8 runtime constraints).
- Package manager: `npm` (with workspaces configured at root).

## Environment Variables

Copy `.env.example` to `.env` in the respective package directories. Required variables:
- `PORT` (default: 3000)
- `VITE_API_URL` (Backend API base URL)
- `DATABASE_URL` (PostgreSQL connection string for Prisma)
- `JWT_SECRET` (Authentication signing secret)
- `GEMINI_API_KEY` (Optional, for AI features)

## Available Commands

- **Install dependencies**: `npm install`
- **Run Admin Portal (Dev)**: `npm run dev` (starts Vite dev server on port 3000)
- **Build Admin Portal**: `npm run build --workspace=my-admin-portal`
- **Build Landing Site**: `npm run build --workspace=landing_site`
- **Build Backend**: `npm run build --workspace=backend-2`

## Prisma & Data Safety Cautions

- `backend-2/prisma/schema.prisma` and migrations manage the database schema.
- **Never** run destructive database resets (`prisma migrate reset` or `db push`) against production or shared environments.
- Financial ledgers, billing periods, and agreed rates enforce strict accounting invariants.
