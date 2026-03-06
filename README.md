# Slooze Food Ordering App

This is a full-stack, role-based food ordering platform built for Slooze Take Home Challenge. 

## Features
- **RBAC & Re-BAC**: Admins, Managers, and Members have restricted functionality depending on their role and geographical location (INDIA vs AMERICA).
- **Backend**: NestJS, GraphQL, SQLite Database (Prisma).
- **Frontend**: Next.js 14, Apollo Client, Tailwind CSS.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Start the Backend API

Open a terminal and run the following:

```bash
cd backend
npm install

# Push schema and seed mock users & restaurants
npx prisma db push
npx ts-node prisma/seed.ts

# Start the dev server
npm run start:dev
```
The NestJS server will start on `http://localhost:3001` with a GraphQL playground available at `http://localhost:3001/graphql`.

### 2. Start the Frontend Application

Open a second terminal and run the following:

```bash
cd frontend-new
npm install
npm run dev
```

Your Next.js app will be running at `http://localhost:3000`.

## Testing Accounts
Mock accounts are injected into the database on seeding. You can log into `http://localhost:3000` using these:

1. **Admin**: `nick@slooze.xyz` / `password123` (Can do everything)
2. **Manager (INDIA)**: `marvel@slooze.xyz` / `password123` (Can't edit payment methods, can do the rest for India)
3. **Manager (AMERICA)**: `america@slooze.xyz` / `password123` (Can do Manager roles for America)
4. **Member (INDIA)**: `thanos@slooze.xyz` / `password123` (Can't checkout or cancel)
5. **Member (AMERICA)**: `travis@slooze.xyz` / `password123`

## Author
Implementation challenge answer by AI. 
