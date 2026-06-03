# Starparties

Starparties is a simple room reservation app for student groups. It includes a Next.js frontend and an Express + MongoDB backend.

## Features

- Register and login with JWT auth stored in an httpOnly cookie
- View the homepage and available room
- Click the room card to go to reservation
- Create one-hour reservations
- Update your profile picture and profile details

## Project Structure

- `frontend/` - Next.js app
- `backend/` - Express API with MongoDB models

## Requirements

- Node.js 18+ recommended
- MongoDB connection string
- npm

## Environment Setup

Create these files if they do not already exist:

### `backend/.env`

```env
PORT=5001
FRONTEND_URL=http://localhost:3000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_long_random_secret
```

### `frontend/.env.local`

```env
BACKEND_URL=http://localhost:5001
```

## Install Dependencies

Run these commands from the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Run the App

Open two terminals and run:

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

Then open:

- Frontend: http://localhost:3000
- Backend health check: http://localhost:5001/health

## How to Use

1. Open the homepage.
2. Register a new account.
3. Log in.
4. Click the room card to go to reservation.
5. Use the top-left profile banner to update your profile.

## Notes

- The backend seeds one default room automatically: `Band Room` (`BR-101`).
- Profile images are stored as compressed image data in the database.
- Reservations are limited to one hour.

## Scripts

### Frontend

- `npm run dev` - start development server
- `npm run build` - build production app
- `npm run start` - start production app
- `npm run lint` - run ESLint

### Backend

- `npm run dev` - start API with nodemon
- `npm run start` - start API with Node

## Troubleshooting

- If login or register fails, confirm both servers are running and the environment variables are set correctly.
- If the backend cannot connect to MongoDB, check `MONGO_URI`.
- If the room does not appear, restart the backend so the seed runs after database connection.
