# Power Automate Flow Setup for Ayphen PM Notifications

## Overview

This guide shows you how to configure your Power Automate workflow to receive notifications from Ayphen PM and post them to a Microsoft Teams channel.

---

## Step 1: Open Your Power Automate Flow

1. Go to **https://make.powerautomate.com**
2. Sign in with your organization account
3. Click **My flows** in the left sidebar
4. Find and open your flow (the one with the webhook URL you shared)

---

## Step 2: Configure the HTTP Trigger

Your flow should already have a trigger. Click on it and configure the JSON schema:

**Request Body JSON Schema:**
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "type": {
      "type": "string"
    },
    "issueKey": {
      "type": "string"
    },
    "issueUrl": {
      "type": "string"
    },
    "projectName": {
      "type": "string"
    },
    "userName": {
      "type": "string"
    },
    "timestamp": {
      "type": "string"
    }
  }
}
```

Click **Save** after adding the schema.

---

## Step 3: Add "Post Message to Teams" Action

1. Click **+ New step**
2. Search for **"Microsoft Teams"**
3. Select **"Post message in a chat or channel"**

### Configure the action:

| Field | Value |
|-------|-------|
| **Post as** | Flow bot |
| **Post in** | Channel |
| **Team** | Select your team (e.g., "AI Group") |
| **Channel** | Select your channel (e.g., "General") |
| **Message** | See below ⬇️ |

### Message Content (use Dynamic Content):

Click in the Message field and use the **Dynamic content** panel to build this:

```
📢 @{triggerBody()?['title']}

@{triggerBody()?['message']}

📋 Issue: @{triggerBody()?['issueKey']}
👤 By: @{triggerBody()?['userName']}
📁 Project: @{triggerBody()?['projectName']}

🔗 View: @{triggerBody()?['issueUrl']}
```

**Or use this expression directly:**
```
concat('📢 ', triggerBody()?['title'], '

', triggerBody()?['message'], '

📋 Issue: ', coalesce(triggerBody()?['issueKey'], 'N/A'), '
👤 By: ', coalesce(triggerBody()?['userName'], 'System'), '
📁 Project: ', coalesce(triggerBody()?['projectName'], 'N/A'), '

🔗 ', coalesce(triggerBody()?['issueUrl'], ''))
```

---

## Step 4: Add Adaptive Card (Optional - Better Looking)

For a nicer card-style message, use **"Post adaptive card in a chat or channel"** instead:

1. Delete the previous Teams action
2. Add **"Post adaptive card in a chat or channel"**
3. Configure Team and Channel as before
4. For **Adaptive Card**, paste this JSON:

```json
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "@{triggerBody()?['title']}",
      "weight": "Bolder",
      "size": "Medium",
      "wrap": true
    },
    {
      "type": "TextBlock",
      "text": "@{triggerBody()?['message']}",
      "wrap": true,
      "spacing": "Small"
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "Issue",
          "value": "@{coalesce(triggerBody()?['issueKey'], 'N/A')}"
        },
        {
          "title": "By",
          "value": "@{coalesce(triggerBody()?['userName'], 'System')}"
        },
        {
          "title": "Project",
          "value": "@{coalesce(triggerBody()?['projectName'], 'N/A')}"
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "View Issue",
      "url": "@{coalesce(triggerBody()?['issueUrl'], 'https://ayphen-pm-toll.vercel.app')}"
    }
  ]
}
```

---

## Step 5: Save and Test

1. Click **Save** at the top
2. Go to Ayphen PM: **https://ayphen-pm-toll.vercel.app**
3. Open Team Notifications panel
4. Send a test notification
5. Check your Teams channel!

---

## Complete Flow Example

Your flow should look like this:

```
┌─────────────────────────────────┐
│  When a HTTP request is        │
│  received                       │
│  (Manual trigger)               │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  Post message in a chat or     │
│  channel                        │
│  Team: Your Team                │
│  Channel: General               │
│  Message: Dynamic content       │
└─────────────────────────────────┘
```

---

## Troubleshooting

### "Flow is not receiving data"
- Check that your webhook URL is correctly added to Render environment variables
- Verify the backend has been redeployed after adding the variable

### "Message is empty or shows null"
- Use `coalesce()` function to handle null values
- Example: `coalesce(triggerBody()?['userName'], 'Unknown')`

### "Permission denied posting to Teams"
- Make sure the Flow has permissions to post to the selected Team/Channel
- You may need to reconnect the Teams connector

### "Test from Ayphen doesn't work"
- Check Render logs for any errors
- Verify the `TEAMS_WEBHOOK_URL` environment variable is set correctly

---

## Sample Notifications You'll Receive

| Event | Teams Message |
|-------|---------------|
| Issue Created | 📢 🆕 New Issue Created<br>POW-123: Fix login bug<br>By: Dhilip |
| Status Changed | 📢 ✅ Issue Completed<br>POW-123: Fix login bug<br>To Do → Done |
| Comment Added | 📢 💬 New Comment<br>POW-123: "Great work on this fix!" |
| Sprint Started | 📢 🏃 Sprint Started<br>Sprint 5 has begun |

---

## Need More Help?

- Power Automate Documentation: https://docs.microsoft.com/en-us/power-automate/
- Teams Connector: https://docs.microsoft.com/en-us/connectors/teams/
- Adaptive Cards Designer: https://adaptivecards.io/designer/

---

*Last Updated: January 2026*
