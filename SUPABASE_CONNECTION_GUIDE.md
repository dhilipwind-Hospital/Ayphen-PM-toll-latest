# 🔍 How to Find Your Supabase Connection String

## Method 1: Using Supabase Dashboard (Recommended)

### Step-by-Step with Screenshots:

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/projects
   - You should see your project "ayphen-jira"

2. **Click on your project**
   - Click on the "ayphen-jira" card

3. **Find Settings**
   - Look at the LEFT sidebar
   - Scroll down to find the ⚙️ **Settings** icon (gear icon)
   - Click on it

4. **Click "Database"**
   - In the Settings menu, click **"Database"**
   - It's usually the second option after "General"

5. **Find Connection String**
   - Scroll down to the section called **"Connection string"**
   - You'll see several tabs:
     - **URI** ← Click this one!
     - Postgres
     - JDBC
     - .NET
   
6. **Copy the URI**
   - Click the **URI** tab
   - You'll see something like:
     ```
     postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
     ```
   - Click the **Copy** button (📋 icon)

7. **Replace [YOUR-PASSWORD]**
   - The copied string has `[YOUR-PASSWORD]` in it
   - Replace it with the password you created when setting up the project
   - Example:
     ```
     # Before:
     postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
     
     # After (if your password is "MyPass123"):
     postgresql://postgres.abcdefghijk:MyPass123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
     ```

---

## Method 2: Build Connection String Manually

If you still can't find it, you can build it yourself:

### **Get These Values:**

1. **Project Reference ID:**
   - Go to Settings > General
   - Look for "Reference ID"
   - Copy it (looks like: `abcdefghijk`)

2. **Region:**
   - In Settings > General
   - Look for "Region"
   - Note it down (e.g., `ap-south-1`, `us-east-1`, etc.)

3. **Your Password:**
   - The password YOU created when setting up the project
   - If you forgot it, you can reset it in Settings > Database

### **Build the Connection String:**

```
postgresql://postgres.[REFERENCE-ID]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Example:**
```
Reference ID: abcdefghijk
Region: ap-south-1
Password: MySecurePass123

Connection String:
postgresql://postgres.abcdefghijk:MySecurePass123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

---

## Method 3: Using Supabase SQL Editor

### **Alternative Way to Get Connection Info:**

1. **Go to SQL Editor**
   - Click on the **SQL Editor** icon in the left sidebar (looks like </> )

2. **Run this query:**
   ```sql
   SELECT current_database(), current_user, inet_server_addr(), inet_server_port();
   ```

3. **You'll see:**
   - Database: `postgres`
   - User: `postgres`
   - Host: (the IP address)
   - Port: `5432` or `6543`

4. **Then go to Settings > Database to get the full host name**

---

## 🎯 Quick Checklist

**To find your connection string, you need:**

- [ ] Go to https://supabase.com/dashboard
- [ ] Click on your project
- [ ] Click ⚙️ **Settings** (left sidebar, bottom)
- [ ] Click **Database**
- [ ] Scroll to **"Connection string"** section
- [ ] Click **URI** tab
- [ ] Click **Copy** button
- [ ] Replace `[YOUR-PASSWORD]` with your actual password

---

## 🔑 Forgot Your Password?

### **Reset Database Password:**

1. Go to Settings > Database
2. Scroll to **"Database password"** section
3. Click **"Reset database password"**
4. Enter new password
5. Click **"Update password"**
6. Wait 2-3 minutes for changes to apply
7. Use the new password in your connection string

---

## 📸 Visual Guide

### **Where to Click:**

```
Supabase Dashboard
├── Your Projects
│   └── ayphen-jira (click here)
│       ├── Table Editor
│       ├── SQL Editor
│       ├── Database
│       ├── Authentication
│       ├── Storage
│       ├── Edge Functions
│       └── ⚙️ Settings (click here)
│           ├── General
│           ├── Database (click here) ← YOU ARE HERE
│           │   ├── Connection pooling
│           │   ├── Connection string ← LOOK HERE
│           │   │   ├── URI (click this tab) ← COPY THIS
│           │   │   ├── Postgres
│           │   │   └── JDBC
│           │   └── Database password
│           ├── API
│           └── Auth
```

---

## ✅ How to Verify Your Connection String

### **Test if it's correct:**

**Format should be:**
```
postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Check:**
- ✅ Starts with `postgresql://`
- ✅ Has `postgres.` followed by reference ID
- ✅ Has `:` followed by your password (no brackets!)
- ✅ Has `@aws-0-` followed by region
- ✅ Ends with `.pooler.supabase.com:6543/postgres`

**Example of CORRECT format:**
```
postgresql://postgres.xyzabc123:MyPassword123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**Example of WRONG format (don't use):**
```
postgresql://postgres.xyzabc123:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
                                 ^^^^^^^^^^^^^^^^
                                 Replace this!
```

---

## 🆘 Still Can't Find It?

### **Try This:**

1. **Take a screenshot of your Supabase dashboard**
2. **Share what you see in Settings > Database**
3. **I'll help you locate it!**

### **Or Use Direct Connection (Alternative):**

Instead of pooler connection, you can use direct connection:

1. In Settings > Database
2. Look for **"Connection parameters"** section
3. You'll see:
   - Host: `aws-0-[region].pooler.supabase.com`
   - Database: `postgres`
   - Port: `5432`
   - User: `postgres.[ref]`
   - Password: [your password]

4. Build connection string:
   ```
   postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres
   ```

---

## 🎯 Next Step After Getting Connection String

Once you have your connection string:

1. **Open your `.env` file**
2. **Replace this line:**
   ```env
   DATABASE_URL=./ayphen_jira.db
   ```
3. **With your Supabase connection string:**
   ```env
   DATABASE_URL=postgresql://postgres.abc123:YourPass@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
4. **Save the file**
5. **Run migration:**
   ```bash
   node scripts/migrate-schema.js
   ```

---

**Let me know what you see in your Supabase dashboard and I'll help you find it!** 🚀
