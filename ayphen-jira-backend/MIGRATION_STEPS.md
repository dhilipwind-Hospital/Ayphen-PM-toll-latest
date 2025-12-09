# 🚀 PostgreSQL Migration - Quick Start Guide

## ✅ What's Ready:
- ✅ PostgreSQL package (pg) installed
- ✅ Database connection file created (`db/connection.js`)
- ✅ Schema migration script ready (`scripts/migrate-schema.js`)
- ✅ Environment template created (`.env.postgresql`)

---

## 📝 Step-by-Step Instructions

### **Step 1: Create Supabase Account (5 minutes)**

1. **Go to Supabase:**
   - Visit: https://supabase.com
   - Click "Start your project"

2. **Sign Up:**
   - Click "Sign in with GitHub"
   - Authorize Supabase
   - No credit card required! ✅

3. **Create Organization:**
   - Name: Your name or company
   - Click "Create organization"

4. **Create Project:**
   - Click "New project"
   - Fill in:
     - **Name:** `ayphen-jira`
     - **Database Password:** Choose a strong password (SAVE THIS!)
     - **Region:** Choose closest to you (e.g., `ap-south-1` for India)
     - **Pricing Plan:** Free (selected by default)
   - Click "Create new project"
   - Wait 2-3 minutes for setup ⏳

---

### **Step 2: Get Your Connection String (2 minutes)**

1. **In Supabase Dashboard:**
   - Click on your project "ayphen-jira"
   - Go to **Settings** (gear icon) > **Database**

2. **Copy Connection String:**
   - Scroll to "Connection string"
   - Select **URI** tab
   - Copy the connection string
   - It looks like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - **IMPORTANT:** Replace `[YOUR-PASSWORD]` with the password you created!

3. **Example:**
   ```
   postgresql://postgres.abcdefghijk:MySecurePass123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

---

### **Step 3: Update Your .env File (1 minute)**

**Open:** `/Users/dhilipelango/VS Jira 2/ayphen-jira-backend/.env`

**Replace this line:**
```env
DATABASE_URL=./ayphen_jira.db
```

**With your Supabase connection string:**
```env
DATABASE_URL=postgresql://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Save the file!**

---

### **Step 4: Run Schema Migration (1 minute)**

**In your terminal:**
```bash
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira-backend

# Run the migration
node scripts/migrate-schema.js
```

**Expected Output:**
```
🔄 Starting schema migration...

Creating users table...
Creating projects table...
Creating issues table...
Creating comments table...
Creating attachments table...
Creating history table...
Creating sprints table...
Creating test_cases table...
Creating indexes...

✅ All tables created successfully!

📊 Tables created:
  - users
  - projects
  - issues
  - comments
  - attachments
  - history
  - sprints
  - test_cases

✅ Indexes created for optimal performance
✅ Schema migration completed successfully!
```

---

### **Step 5: Verify in Supabase (1 minute)**

1. **Go back to Supabase Dashboard**
2. **Click "Table Editor"** (database icon on left)
3. **You should see all tables:**
   - users
   - projects
   - issues
   - comments
   - attachments
   - history
   - sprints
   - test_cases

**If you see all tables, migration is successful! 🎉**

---

### **Step 6: Test Your Backend (2 minutes)**

**Start your backend:**
```bash
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira-backend
npm start
```

**Expected Output:**
```
✅ Connected to PostgreSQL database
Server running on port 8500
```

**Test in browser:**
- Open: http://localhost:8500/api/projects
- Should return: `[]` (empty array - no data yet)

---

## 🎯 What Happens Next?

### **Your Database is Now:**
- ✅ Running on PostgreSQL (Supabase)
- ✅ Free forever (500MB storage)
- ✅ Production-ready
- ✅ Auto-backups enabled
- ✅ Ready for deployment

### **Your Old SQLite Data:**
- Still exists in `ayphen_jira.db`
- Not migrated yet (tables are empty)
- You can migrate data later if needed

---

## 🔄 Optional: Migrate Existing Data

**If you want to copy data from SQLite to PostgreSQL:**

I can create a data migration script that will:
1. Read all data from SQLite
2. Insert into PostgreSQL
3. Preserve all IDs and relationships

**Let me know if you want this!**

---

## 🚀 Ready for Deployment!

Once migration is complete, you can deploy:

### **Backend → Render:**
```bash
1. Go to render.com
2. New > Web Service
3. Connect GitHub repo
4. Add DATABASE_URL environment variable
5. Deploy!
```

### **Frontend → Vercel:**
```bash
1. Go to vercel.com
2. Import project
3. Add VITE_API_URL environment variable
4. Deploy!
```

---

## 🆘 Troubleshooting

### **Connection Error:**
```
❌ Error: connect ECONNREFUSED
```
**Solution:** Check your DATABASE_URL is correct

### **Authentication Failed:**
```
❌ Error: password authentication failed
```
**Solution:** Make sure you replaced `[YOUR-PASSWORD]` with actual password

### **SSL Error:**
```
❌ Error: SSL connection required
```
**Solution:** Already handled in `db/connection.js` ✅

---

## 📞 Need Help?

If you encounter any issues:
1. Check the error message
2. Verify DATABASE_URL is correct
3. Make sure Supabase project is active
4. Let me know the error and I'll help!

---

**Ready to start? Follow Step 1 above! 🚀**
