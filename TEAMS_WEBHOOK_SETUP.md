# Microsoft Teams Webhook Integration - Setup Guide

## Overview

This guide shows you how to connect Ayphen PM Tool to your Microsoft Teams channel so that notifications (issue created, status changes, comments, etc.) appear in Teams automatically.

---

## Step 1: Open Microsoft Teams

1. Open **Microsoft Teams** (desktop app or web)
2. Go to the **Team** where you want notifications to appear
3. Select the **Channel** (e.g., "General" or create a dedicated "PM Notifications" channel)

---

## Step 2: Add Incoming Webhook Connector

1. Click on the **channel name** to open channel settings
2. Click the **⋯ (three dots)** next to the channel name
3. Select **"Connectors"** or **"Manage channel"** → **"Connectors"**

   ![Connectors menu location](https://docs.microsoft.com/en-us/microsoftteams/platform/assets/images/connectors/connectors-menu.png)

4. Search for **"Incoming Webhook"**
5. Click **"Configure"** or **"Add"**

---

## Step 3: Configure the Webhook

1. Give your webhook a **name**: `Ayphen PM Notifications`
2. Optionally upload an **icon** for the notifications
3. Click **"Create"**
4. **IMPORTANT**: Copy the **Webhook URL** that appears
   
   It looks like:
   ```
   https://outlook.office.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/IncomingWebhook/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

5. Click **"Done"**

---

## Step 4: Add Webhook URL to Ayphen Backend

1. Open your backend `.env` file:
   ```
   /ayphen-jira-backend/.env
   ```

2. Add this line with your webhook URL:
   ```bash
   TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/your-full-webhook-url-here
   ```

3. Also add your app URL (for "View Issue" links):
   ```bash
   APP_URL=https://ayphen-pm-toll.vercel.app
   ```

4. Save the file

---

## Step 5: Restart Backend

If running locally:
```bash
cd ayphen-jira-backend
npm run dev
```

If deployed on Render/Heroku/etc.:
- Go to your deployment dashboard
- Add the environment variables
- Redeploy the service

---

## Step 6: Test the Integration

### Option A: Using the Test Endpoint

```bash
curl -X POST https://your-backend-url/api/teams-webhook/test
```

### Option B: Check Status

```bash
curl https://your-backend-url/api/teams-webhook/status
```

Should return:
```json
{
  "success": true,
  "configured": true,
  "message": "Teams webhook is configured and ready"
}
```

---

## What Notifications Will Appear in Teams?

| Event | Teams Message |
|-------|---------------|
| 🆕 Issue Created | New issue with key, summary, creator |
| ✏️ Issue Updated | Changes made to issue |
| ✅ Status Changed | Status transition (e.g., To Do → Done) |
| 💬 New Comment | Comment added with preview |
| 🏃 Sprint Started | Sprint name and start info |
| 🏁 Sprint Completed | Sprint completion notice |
| ⚠️ Alerts | Warning or error notifications |

---

## Troubleshooting

### "Teams webhook not configured"
- Check that `TEAMS_WEBHOOK_URL` is set in `.env`
- Restart the backend after adding the variable

### Notifications not appearing
- Verify the webhook URL is correct (no extra spaces)
- Check that the channel still has the webhook connector
- Look at backend logs for errors

### "Failed to send notification"
- The webhook URL may have expired
- Recreate the Incoming Webhook in Teams

---

## Security Notes

- Keep your webhook URL **private** - anyone with it can post to your channel
- Don't commit the `.env` file to version control
- You can delete/recreate the webhook anytime in Teams settings

---

## Example .env Configuration

```bash
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret

# Teams Integration (Optional)
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
APP_URL=https://ayphen-pm-toll.vercel.app

# AI (Optional)
CEREBRAS_API_KEY=your-key
```

---

*Last Updated: January 2026*
