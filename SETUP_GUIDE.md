# Family Community App - Setup & Auto-Run Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Auto-Start Scripts](#auto-start-scripts)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional, for version control)

---

## Initial Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

---

## Environment Variables

### Backend (.env file in `backend/` folder)

Create a file named `.env` in the `backend/` directory with the following content:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/family-community

# JWT Secret (Generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Important:** Replace `JWT_SECRET` with a strong random string in production!

### Frontend (.env file in `frontend/` folder)

Create a file named `.env` in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:4000/api
```

---

## Database Setup

### 1. Start MongoDB

**Windows:**
```bash
# If MongoDB is installed as a service, it should start automatically
# Otherwise, run:
mongod
```

**Mac/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod
# OR
mongod --dbpath /path/to/your/data/directory
```

### 2. Create First Admin User

After starting the backend server, you can create an admin user directly in MongoDB:

**Option 1: Using MongoDB Compass (GUI)**
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Navigate to `family-community` database → `users` collection
4. Click "Insert Document"
5. Use this JSON (replace with your details):

```json
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@example.com",
  "mobileNumber": "+919876543210",
  "password": "$2b$10$xa5Ofq4zbEgev6A9nem9He78TROUt9IuVna4eOH8QyMT0Hrv/vYLi",
  "role": "admin",
  "status": "approved",
  "isActive": true,
  "address": {
    "line1": "Admin Address",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001"
  },
  "occupationType": "job",
  "maritalStatus": "single",
  "samaj": "Kadva Patidar"
}
```

**Note:** The password hash above is for `12345678`. Change it or use a password hasher.

**Option 2: Using MongoDB Shell**
```bash
mongosh
use family-community
db.users.insertOne({
  firstName: "Admin",
  lastName: "User",
  email: "admin@example.com",
  mobileNumber: "+919876543210",
  password: "$2b$10$xa5Ofq4zbEgev6A9nem9He78TROUt9IuVna4eOH8QyMT0Hrv/vYLi",
  role: "admin",
  status: "approved",
  isActive: true,
  address: {
    line1: "Admin Address",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pincode: "400001"
  },
  occupationType: "job",
  maritalStatus: "single",
  samaj: "Kadva Patidar"
})
```

---

## Running the Application

### Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# OR for development with auto-reload:
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000

---

## Auto-Start Scripts

### Windows (PowerShell)

Create a file `start-app.ps1` in the project root:

```powershell
# start-app.ps1
Write-Host "Starting Family Community App..." -ForegroundColor Green

# Start MongoDB (if not running as service)
# Start-Process mongod

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

# Wait a bit for backend to start
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host "Application started! Backend: http://localhost:4000 | Frontend: http://localhost:3000" -ForegroundColor Green
```

**To run:**
```powershell
.\start-app.ps1
```

### Windows (Batch File)

Create a file `start-app.bat`:

```batch
@echo off
echo Starting Family Community App...

start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm start"

echo Application started!
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
pause
```

**To run:** Double-click `start-app.bat`

### Mac/Linux (Bash Script)

Create a file `start-app.sh`:

```bash
#!/bin/bash

echo "Starting Family Community App..."

# Start Backend
echo "Starting Backend Server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start Frontend
echo "Starting Frontend Server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "Application started!"
echo "Backend: http://localhost:4000 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
wait
```

**To run:**
```bash
chmod +x start-app.sh
./start-app.sh
```

### Using PM2 (Recommended for Production)

PM2 is a process manager for Node.js applications.

**Install PM2:**
```bash
npm install -g pm2
```

**Create `ecosystem.config.js` in project root:**

```javascript
module.exports = {
  apps: [
    {
      name: "family-community-backend",
      script: "./backend/server.js",
      cwd: "./backend",
      env: {
        NODE_ENV: "development",
        PORT: 4000,
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "family-community-frontend",
      script: "npm",
      args: "start",
      cwd: "./frontend",
      env: {
        NODE_ENV: "development",
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
```

**Useful PM2 Commands:**
```bash
pm2 list              # List all processes
pm2 stop all          # Stop all processes
pm2 restart all       # Restart all processes
pm2 logs              # View logs
pm2 delete all        # Delete all processes
pm2 save              # Save current process list
pm2 startup           # Auto-start on system boot
```

---

## Auto-Start on System Boot

### Windows (Task Scheduler)

1. Open **Task Scheduler**
2. Create Basic Task
3. Name: "Family Community App"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `C:\Windows\System32\cmd.exe`
7. Arguments: `/c cd /d E:\Kadvasan && start-app.bat`

### Mac/Linux (systemd)

Create `/etc/systemd/system/family-community.service`:

```ini
[Unit]
Description=Family Community App
After=network.target mongod.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/Kadvasan
ExecStart=/usr/bin/node /path/to/pm2 start ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl enable family-community.service
sudo systemctl start family-community.service
```

---

## Troubleshooting

### Port Already in Use

**Backend (Port 4000):**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9
```

**Frontend (Port 3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Error

1. Check if MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl status mongod
   ```

2. Verify MongoDB URI in `.env` file

3. Check MongoDB logs for errors

### Module Not Found Errors

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### CORS Errors

Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL.

---

## Quick Reference

| Service | URL | Default Port |
|---------|-----|--------------|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:4000/api | 4000 |
| MongoDB | mongodb://localhost:27017 | 27017 |

---

## Support

For issues or questions, check:
1. Console logs (backend and frontend)
2. MongoDB logs
3. Network tab in browser DevTools
4. Backend error logs

---

**Happy Coding! 🚀**

