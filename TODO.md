# Appointment Booking App Development Plan

## Overview
Create a simple appointment booking app using Next.js, Ant Design, Tailwind CSS, and MongoDB. Features include user booking, admin settings for working hours/days, and appointment management.

## Steps to Complete

### 1. Install Dependencies
- Install Ant Design (@ant-design/icons, antd)
- Install MongoDB driver (mongoose)
- Install authentication libraries (bcryptjs, jsonwebtoken)
- Install additional utilities (dotenv for env)

### 2. Set Up Environment Variables
- Create .env.local file with MongoDB URI, admin username/password, JWT secret

### 3. Set Up Database Connection
- Create lib/mongodb.ts for MongoDB connection using mongoose

### 4. Create Database Models
- Create models/Appointment.ts (name, phone, extra info, type: visit/accommodate, address if accommodate, date/time)
- Create models/Settings.ts (working days, start/end times, session duration)

### 5. Create API Routes
- /api/appointments: GET (list all), POST (create new)
- /api/settings: GET (get settings), PUT (update settings)
- /api/auth/login: POST (admin login, return JWT)

### 6. Create Pages and Components
- Update app/page.tsx: Booking form with date/time selection, user info form
- Create app/admin/page.tsx: Protected admin dashboard (view appointments, set settings)
- Create app/admin/login/page.tsx: Login form for admin
- Use Ant Design components throughout

### 7. Implement Authentication Middleware
- Create middleware.ts for protecting admin routes with JWT

### 8. Implement Business Logic
- In booking: Check availability based on settings and existing appointments
- In admin: CRUD for settings, list appointments

### 9. Styling and UI Polish
- Use Tailwind CSS for additional styling, ensure compatibility with Ant Design
- Make responsive

### 10. Testing and Deployment Prep
- Test all features locally
- Ensure no complex features, keep it simple
