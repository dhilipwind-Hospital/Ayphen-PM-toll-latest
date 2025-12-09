# 🔄 Server Restart Guide

**Date:** December 1, 2025, 4:21 PM IST

---

## 🚀 Quick Restart Commands

### **Option 1: Using Separate Terminals (Recommended)**

#### **Terminal 1 - Backend (Port 8500):**
```bash
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira-backend
npm run dev
```

#### **Terminal 2 - Frontend (Port 1600):**
```bash
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira
npm run dev
```

---

## 📋 Step-by-Step Instructions

### **Step 1: Stop Any Running Servers**

```bash
# Find processes on port 8500 (backend)
lsof -ti:8500 | xargs kill -9

# Find processes on port 1600 (frontend)
lsof -ti:1600 | xargs kill -9
```

### **Step 2: Start Backend Server**

```bash
# Navigate to backend directory
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira-backend

# Start backend in development mode
npm run dev
```

**Expected Output:**
```
✅ Database connected successfully
🚀 Server is running on http://localhost:8500
📊 API endpoints available at http://localhost:8500/api
🔌 WebSocket service initialized
```

**Verify Backend:**
```bash
# In a new terminal
curl http://localhost:8500/health
```

**Expected Response:**
```json
{"status":"ok","message":"Ayphen Jira API is running"}
```

### **Step 3: Start Frontend Server**

```bash
# Navigate to frontend directory
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira

# Start frontend in development mode
npm run dev
```

**Expected Output:**
```
VITE v7.1.7  ready in XXX ms

➜  Local:   http://localhost:1600/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Verify Frontend:**
- Open browser: http://localhost:1600
- Should see Jira application login page

---

## 🔧 Troubleshooting

### **Issue: Port Already in Use**

**Backend (8500):**
```bash
# Find what's using port 8500
lsof -i :8500

# Kill the process
kill -9 <PID>

# Or kill all on port 8500
lsof -ti:8500 | xargs kill -9
```

**Frontend (1600):**
```bash
# Find what's using port 1600
lsof -i :1600

# Kill the process
kill -9 <PID>

# Or kill all on port 1600
lsof -ti:1600 | xargs kill -9
```

### **Issue: npm run dev Not Working**

**Check if dependencies are installed:**
```bash
# Backend
cd ayphen-jira-backend
npm install

# Frontend
cd ayphen-jira
npm install
```

### **Issue: Database Connection Error**

**Check .env file:**
```bash
cd ayphen-jira-backend
cat .env
```

**Required variables:**
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=ayphen_jira
CEREBRAS_API_KEY=your_api_key
```

### **Issue: Module Not Found**

**Rebuild:**
```bash
# Backend
cd ayphen-jira-backend
rm -rf node_modules package-lock.json
npm install
npm run dev

# Frontend
cd ayphen-jira
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🧹 Clean Restart (If Issues Persist)

```bash
# 1. Stop all servers
lsof -ti:8500 | xargs kill -9
lsof -ti:1600 | xargs kill -9

# 2. Clean backend
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira-backend
rm -rf node_modules package-lock.json dist
npm install
npm run build

# 3. Clean frontend
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira
rm -rf node_modules package-lock.json dist
npm install

# 4. Restart backend
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira-backend
npm run dev

# 5. Restart frontend (in new terminal)
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira
npm run dev
```

---

## ✅ Verification Checklist

### **Backend (http://localhost:8500):**
- [ ] Server starts without errors
- [ ] Database connects successfully
- [ ] Health endpoint responds: `curl http://localhost:8500/health`
- [ ] No error messages in console
- [ ] WebSocket initialized

### **Frontend (http://localhost:1600):**
- [ ] Vite server starts
- [ ] No compilation errors
- [ ] Browser opens to login page
- [ ] No console errors in browser DevTools
- [ ] Can see UI elements

### **Integration:**
- [ ] Frontend can call backend APIs
- [ ] No CORS errors
- [ ] Login works
- [ ] Can create issues
- [ ] Duplicate detection works

---

## 🎯 Quick Test After Restart

### **Test 1: Backend Health**
```bash
curl http://localhost:8500/health
```

### **Test 2: Frontend Access**
```bash
open http://localhost:1600
```

### **Test 3: API Integration**
```bash
# Test duplicate detection endpoint
curl -X POST http://localhost:8500/api/duplicate-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "test-1",
    "suggestedDuplicateId": "test-2",
    "aiConfidence": 85,
    "userAction": "linked",
    "userId": "test-user"
  }'
```

**Expected:** `{"success":true,"message":"Feedback recorded successfully"}`

---

## 📊 Server Status

### **Check if Servers are Running:**
```bash
# Backend
lsof -i :8500

# Frontend
lsof -i :1600

# Both
lsof -i :8500 -i :1600
```

### **View Server Logs:**
```bash
# Backend logs are in the terminal where you ran npm run dev
# Frontend logs are in the terminal where you ran npm run dev
```

---

## 🚀 Production Build (Optional)

### **Backend:**
```bash
cd ayphen-jira-backend
npm run build
npm start
```

### **Frontend:**
```bash
cd ayphen-jira
npm run build
npm run preview
```

---

## 💡 Tips

1. **Always start backend first**, then frontend
2. **Keep terminals open** to see logs
3. **Check console** for errors
4. **Use separate terminals** for each server
5. **Verify .env file** has all required variables
6. **Check database** is running (PostgreSQL)

---

## 🔗 URLs

- **Frontend:** http://localhost:1600
- **Backend:** http://localhost:8500
- **Backend Health:** http://localhost:8500/health
- **Backend API:** http://localhost:8500/api

---

**Last Updated:** December 1, 2025, 4:21 PM IST
