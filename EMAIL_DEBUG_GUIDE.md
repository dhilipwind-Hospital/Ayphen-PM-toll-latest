# 📧 EMAIL NOT SENDING - DEBUGGING GUIDE

**Issue:** Project invitation emails are not being received  
**Date:** December 17, 2025  
**Status:** Investigating

---

## ✅ What's Working

Based on code review:
- ✅ SMTP configuration exists in `.env`:
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=dhilipwind@gmail.com`
  - `SMTP_PASSWORD=qdvgzvyylflccqvw` (App password)
  - `SMTP_FROM_EMAIL=dhilipwind@gmail.com`

- ✅ Email service is initialized (`email.service.ts`)
- ✅ SendGrid fallback configured (`sendgrid.service.ts`)
- ✅ Invitation email template exists
- ✅ Invitation creation works (appears in UI)

---

## 🔴 PROBLEM: Emails Not Being Delivered

### **Possible Causes:**

#### **1. Gmail App Password Issues** ⚠️ MOST LIKELY
**Problem:** Google may be blocking the app password

**Solution:**
1. Verify Gmail app password is still valid
2. Check if 2-Factor Authentication is enabled
3. Generate NEW app password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and device
   - Copy the 16-character password
   - Update `.env` with new password

**How to Test:**
```bash
# In backend terminal, check for errors when sending:
cd ayphen-jira-backend
npm run dev

# Watch for logs like:
# ✅ Invitation email sent to <email>
# OR
# ❌ Failed to send invitation email: <error>
```

---

#### **2. Backend Server Not Running Email Service**
**Problem:** Email service might not be initialized

**Solution:**
Check backend console for:
```
📧 Email service initialized with SMTP
   Host: smtp.gmail.com
   Port: 587
   User: dhilipwind@gmail.com
```

If you see:
```
⚠️  SMTP credentials not configured! Emails will NOT be sent.
```
Then `.env` file is not being loaded.

**Fix:**
```bash
cd ayphen-jira-backend
# Verify .env file exists and is in the correct location
ls -la .env

# Restart server
npm run dev
```

---

#### **3. SendGrid API Key** (Alternative)
If SMTP fails, you can use SendGrid instead:

**Setup SendGrid (FREE):**
1. Create account: https://signup.sendgrid.com/
2. Go to Settings → API Keys
3. Create API Key (starts with `SG.`)
4. Add to `.env`:
```env
SENDGRID_API_KEY=SG.your_api_key_here
```

SendGrid is more reliable than Gmail SMTP for production.

---

#### **4. Email Caught in Spam**
**Problem:** Gmail might be sending to spam folder

**Solution:**
1. Check spam/junk folder in `dhilipwind+50@gmail.com`
2. If found, mark as "Not Spam"
3. Add sender to contacts

---

#### **5. Frontend URL Issue**
**Problem:** Invitation link might be malformed

**Current Setting:**
```env
FRONTEND_URL=https://ayphen-pm-toll.vercel.app
```

**Check:** Email template uses this for invitation link:
```
https://ayphen-pm-toll.vercel.app/accept-invitation/{token}
```

This looks correct! ✅

---

## 🔧 IMMEDIATE DEBUGGING STEPS

### **Step 1: Check Backend Logs**

Run backend in development mode and watch console:

```bash
cd ayphen-jira-backend
npm run dev
```

When you send an invitation, you should see:

```
✅ Invitation email sent to dhilipwind+50@gmail.com
```

OR an error like:

```
❌ Failed to send invitation email: Error: Invalid login
```

**📸 TAKE SCREENSHOT of the logs when creating invitation!**

---

### **Step 2: Test Email Service Directly**

Create a test file to verify email works:

**File:** `ayphen-jira-backend/test-email.ts`

```typescript
import { emailService } from './src/services/email.service';

async function testEmail() {
  console.log('🧪 Testing email service...');
  
  try {
    await emailService.sendEmail(
      'dhilipwind+50@gmail.com',
      'Test Email - Ayphen',
      '<h1>Hello!</h1><p>This is a test email from Ayphen.</p>'
    );
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Test email failed:', error);
  }
  
  process.exit(0);
}

testEmail();
```

**Run test:**
```bash
cd ayphen-jira-backend
npx tsx test-email.ts
```

This will show exact error if email fails!

---

### **Step 3: Verify Gmail Settings**

1. **Check Gmail Security:** https://myaccount.google.com/security
   - Ensure "Less secure app access" is OFF (should use app password)
   - Ensure "2-Step Verification" is ON

2. **Check App Passwords:** https://myaccount.google.com/apppasswords
   - Generate NEW app password if old one expired
   - App passwords look like: `abcd efgh ijkl mnop`
   - Remove spaces when adding to `.env`: `abcdefghijklmnop`

3. **Check Account Activity:** https://myaccount.google.com/notifications
   - Look for "Blocked sign-in attempt" alerts
   - If found, allow the attempt

---

### **Step 4: Alternative - Use Mailtrap (Dev/Testing)**

For testing, use Mailtrap (catches emails without sending):

**Mailtrap Free Account:**
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<mailtrap_username>
SMTP_PASSWORD=<mailtrap_password>
SMTP_FROM_EMAIL=noreply@ayphen.com
```

Sign up: https://mailtrap.io/

---

## 🎯 QUICK FIX - MOST LIKELY SOLUTION

### **Fix 1: Regenerate Gmail App Password**

1. Go to: https://myaccount.google.com/apppasswords
2. Click "Generate" (select "Mail" + "Other device")
3. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
4. Update `.env`:
   ```env
   SMTP_PASSWORD=abcdefghijklmnop
   ```
   (Remove spaces!)
5. Restart backend:
   ```bash
   cd ayphen-jira-backend
   npm run dev
   ```
6. Try sending invitation again

---

### **Fix 2: Use SendGrid (Recommended for Production)**

SendGrid is FREE for 100 emails/day and more reliable than Gmail:

1. **Sign up:** https://signup.sendgrid.com/
2. **Create API Key:**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Choose "Full Access"
   - Copy key (starts with `SG.`)

3. **Add to `.env`:**
   ```env
   SENDGRID_API_KEY=SG.your_key_here
   SMTP_FROM_EMAIL=dhilipwind@gmail.com
   ```

4. **Verify Sender:**
   - Go to Settings → Sender Authentication
   - Add `dhilipwind@gmail.com` as verified sender
   - Check email for verification link

5. **Restart backend**

Your code already has SendGrid support - it'll automatically use it if API key is set!

---

## 📊 CHECKLIST

- [ ] Backend server is running
- [ ] Backend shows "Email service initialized with SMTP"
- [ ] No error in backend console when sending invitation
- [ ] `.env` file exists in `ayphen-jira-backend/`
- [ ] SMTP_PASSWORD is valid Gmail app password
- [ ] 2FA is enabled on Gmail account
- [ ] Created new app password (last 7 days)
- [ ] Checked spam folder
- [ ] Tested with test-email.ts script
- [ ] Backend deployed to Render (if testing production)

---

## 🚨 SEND ME THIS INFO

To help debug, please provide:

1. **Backend console output** when creating invitation (screenshot)
2. **Does backend show:** `✅ Invitation email sent to...`?
3. **Any errors** in backend console?
4. **Is backend running** in development or production?
5. **Spam folder** - checked?

---

## 💡 MOST LIKELY ISSUE

Based on your setup, the **#1 most likely issue** is:

**Gmail is blocking the SMTP connection**

**Solution:**
1. Generate NEW Gmail app password
2. Or switch to SendGrid (free, more reliable)

**Try this right now:**
```bash
cd ayphen-jira-backend
npm run dev
```

Watch console when you send invitation. If you see error, copy it and send to me!

---

**Next Step:** Run backend in dev mode and send me the console output! 📸
