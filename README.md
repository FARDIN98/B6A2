# Vehicle Rental System API

Backend API for managing vehicles, users, and bookings with role-based authentication.

## Live & Repository

- Project Name: Vehicle Rental System API
- Live URL: https://b6-a2-mu.vercel.app/
- Local Dev URL: http://localhost:5001
- GitHub Repo: https://github.com/FARDIN98/B6A2

## Features

- Authentication (JWT) with secure password hashing (bcrypt)
- Role-based access control: Admin and Customer
- Vehicles CRUD with validations and availability tracking
- Users management with profile update and deletion constraints
- Bookings creation, cancellation, and return flow
- Automatic booking return after `rent_end_date` with vehicle availability update
- Standardized success/error response structures

## Technology Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL (`pg`)
- bcryptjs, jsonwebtoken

## Setup & Usage

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Environment variables (`.env` at project root):
   ```env
   CONNECTION_STR=postgres://username:password@localhost:5432/your_database_name
   JWT_SECRET=your_jwt_secret
   ```
3. Initialize database (tables and constraints):
   ```bash
   npx tsx ./src/scripts/setupDatabase.ts
   ```

### Run Dev Server
```bash
npm run dev
```
- Base URL: `http://localhost:5001`
- API Base Path: `/api/v1`

## Project Structure

```
B6A2/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   └── database.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── errorHandler.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.service.ts
│   │   ├── bookings/
│   │   │   ├── bookings.controller.ts
│   │   │   ├── bookings.routes.ts
│   │   │   └── bookings.service.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.service.ts
│   │   └── vehicles/
│   │       ├── vehicles.controller.ts
│   │       ├── vehicles.routes.ts
│   │       └── vehicles.service.ts
│   ├── jobs/
│   │   └── autoReturn.ts
│   ├── scripts/
│   │   └── setupDatabase.ts
│   └── types/
│       └── db.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Scripts
- `npm run dev`: Start development server with hot reload
- `npx tsx ./src/scripts/setupDatabase.ts`: Initialize or update database schema

## API Testing

- Base URL: `http://localhost:5001`
- API Base Path: `/api/v1`
- Auth Header: `Authorization: Bearer <jwt_token>`

### 1) Register and Login
- Register Admin:
  ```bash
  curl -X POST http://localhost:5001/api/v1/auth/signup \
    -H 'Content-Type: application/json' \
    -d '{
      "name":"Admin",
      "email":"admin@example.com",
      "password":"AdminPass123",
      "phone":"01700000000",
      "role":"admin"
    }'
  ```
- Default Admin (demo):
  - Email: `admin@example.com`
  - Password: `AdminPass123`
  - Note: For production, create your own admin and rotate credentials.
  
  Login Admin (get token):
  ```bash
  ADMIN_TOKEN=$(curl -sS -X POST http://localhost:5001/api/v1/auth/signin \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@example.com","password":"AdminPass123"}' | jq -r '.data.token')
  ```
- Register Customer:
  ```bash
  curl -X POST http://localhost:5001/api/v1/auth/signup \
    -H 'Content-Type: application/json' \
    -d '{
      "name":"Customer",
      "email":"customer@example.com",
      "password":"SecurePass123",
      "phone":"01712345678",
      "role":"customer"
    }'
  ```
- Login Customer (get token):
  ```bash
  TOKEN=$(curl -sS -X POST http://localhost:5001/api/v1/auth/signin \
    -H 'Content-Type: application/json' \
    -d '{"email":"customer@example.com","password":"SecurePass123"}' | jq -r '.data.token')
  ```

### 2) Vehicles (Admin)
- Create Vehicle:
  ```bash
  curl -X POST http://localhost:5001/api/v1/vehicles \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
      "vehicle_name":"Toyota Camry 2024",
      "type":"car",
      "registration_number":"ABC-1234",
      "daily_rent_price":50,
      "availability_status":"available"
    }'
  ```
- Get All Vehicles:
  ```bash
  curl http://localhost:5001/api/v1/vehicles
  ```
- Get Vehicle by ID:
  ```bash
  curl http://localhost:5001/api/v1/vehicles/1
  ```
- Update Vehicle (example):
  ```bash
  curl -X PUT http://localhost:5001/api/v1/vehicles/1 \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"daily_rent_price":55}'
  ```
- Delete Vehicle:
  ```bash
  curl -X DELETE http://localhost:5001/api/v1/vehicles/1 \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  ```

### 3) Bookings
- Create Booking (Customer/Admin):
  ```bash
  curl -X POST http://localhost:5001/api/v1/bookings \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
      "customer_id": <customer_id>,
      "vehicle_id": <vehicle_id>,
      "rent_start_date": "2025-12-10",
      "rent_end_date": "2025-12-12"
    }'
  ```
- Get Bookings (Admin):
  ```bash
  curl http://localhost:5001/api/v1/bookings -H "Authorization: Bearer $ADMIN_TOKEN"
  ```
- Get Bookings (Customer):
  ```bash
  curl http://localhost:5001/api/v1/bookings -H "Authorization: Bearer $TOKEN"
  ```
- Update Booking — Customer Cancel:
  ```bash
  curl -X PUT http://localhost:5001/api/v1/bookings/<booking_id> \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"status":"cancelled"}'
  ```
- Update Booking — Admin Returned:
  ```bash
  curl -X PUT http://localhost:5001/api/v1/bookings/<booking_id> \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"status":"returned"}'
  ```

### 4) Users
- Get All Users (Admin):
  ```bash
  curl http://localhost:5001/api/v1/users -H "Authorization: Bearer $ADMIN_TOKEN"
  ```
- Update User (Admin or Own Profile):
  ```bash
  curl -X PUT http://localhost:5001/api/v1/users/<user_id> \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"role":"customer"}'
  ```
- Delete User (Admin):
  ```bash
  curl -X DELETE http://localhost:5001/api/v1/users/<user_id> \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  ```

### Notes
- Follow exact request/response structures in `API_REFERENCE.md`.
- Deletion constraints: cannot delete if there are active bookings.
- Auto-return: bookings auto-marked as `returned` after `rent_end_date`; vehicle becomes `available`.

## Submission

Provide these in your assignment submission:

```
GitHub Repo: https://github.com/your-username/your-repo
Live Deployment: https://your-live-deployment.example.com
```
