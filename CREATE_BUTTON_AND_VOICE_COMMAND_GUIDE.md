# Create Button & Voice Command (Cmd+K) - User Guide

**Date:** November 28, 2025, 2:55 PM IST  
**Status:** ✅ FULLY FUNCTIONAL

---

## 🎯 Overview

This guide explains two key features:
1. **Create Button** - Quick issue creation from anywhere
2. **Cmd+K Voice Command** - AI-powered voice assistant

---

## 1️⃣ CREATE BUTTON

### Location
The **Create** button is located in the **top navigation bar** (top-right area).

### Visual Appearance
- **Color:** Pink/Purple gradient button
- **Icon:** Plus (+) icon
- **Text:** "Create"
- **Position:** Right side of the top bar, before the search box

### How to Use

#### Method 1: Click the Button
1. Look at the top-right corner of the page
2. Find the pink "Create" button with a + icon
3. Click it
4. A modal will open for creating a new issue

#### Method 2: Keyboard Shortcut
- Press `C` key (when not typing in a text field)
- The create issue modal will open

### Create Issue Modal Features

When you click Create, you'll see a form with:

**Required Fields:**
- **Summary** - Issue title
- **Project** - Select from your projects
- **Issue Type** - Bug, Task, Story, Epic
- **Priority** - Highest, High, Medium, Low, Lowest

**Optional Fields:**
- **Description** - Detailed description
- **Assignee** - Assign to team member
- **Reporter** - Who reported it (defaults to you)
- **Labels** - Add tags
- **Sprint** - Add to sprint
- **Story Points** - Estimate effort
- **Due Date** - Set deadline

**Actions:**
- **Create** - Save the issue
- **Cancel** - Close without saving

---

## 2️⃣ VOICE COMMAND (Cmd+K)

### What is Cmd+K?

Cmd+K is a **voice-powered AI assistant** that lets you:
- Create issues by speaking
- Search for issues
- Navigate the application
- Execute commands
- Get AI-powered suggestions

### How to Activate

#### Keyboard Shortcut
- **Mac:** Press `Cmd + K`
- **Windows/Linux:** Press `Ctrl + K`

#### What Happens
1. A modal opens with a microphone interface
2. The AI assistant is ready to listen
3. You can speak your command
4. The AI processes and executes it

### Voice Commands You Can Use

#### Create Issues
```
"Create a new bug for login page"
"Add a task to fix the navigation"
"Create a story for user authentication"
```

#### Search & Navigate
```
"Show me all open bugs"
"Find issues assigned to me"
"Go to dashboard"
"Open project settings"
```

#### Project Management
```
"What's the status of PROJ-123?"
"Show sprint progress"
"List all high priority issues"
```

#### AI Assistance
```
"Suggest improvements for this sprint"
"Analyze bug patterns"
"Predict project completion"
```

### Voice Command Features

1. **Speech Recognition**
   - Real-time voice-to-text
   - Supports natural language
   - Works with different accents

2. **AI Processing**
   - Understands context
   - Executes actions
   - Provides smart suggestions

3. **Visual Feedback**
   - Shows what you said
   - Displays AI response
   - Confirms actions taken

4. **Keyboard Alternative**
   - Can type instead of speaking
   - Press ESC to close
   - Tab to navigate options

---

## 🔧 Technical Details

### Create Button Implementation

**Location:** `/src/components/Layout/TopNavigation.tsx`

```typescript
<CreateButton 
  type="primary" 
  icon={<Plus size={16} />} 
  onClick={() => setCreateModalOpen(true)}
>
  Create
</CreateButton>
```

**Modal:** `/src/components/CreateIssueModal.tsx`
- Handles form submission
- Validates input
- Calls backend API
- Refreshes issue list

### Voice Command Implementation

**Wrapper:** `/src/components/AI/AIGlobalWrapper.tsx`

```typescript
useEffect(() => {
  const handleKeyShortcut = (e: KeyboardEvent) => {
    // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsVoiceModalOpen(true);
    }
  };
  
  window.addEventListener('keydown', handleKeyShortcut);
  return () => window.removeEventListener('keydown', handleKeyShortcut);
}, []);
```

**Modal:** `/src/components/VoiceCommand/VoiceCommandButton.tsx`
- Speech recognition API
- AI processing via backend
- Command execution
- Result display

---

## 🎨 Visual Guide

### Top Navigation Layout

```
┌─────────────────────────────────────────────────────────────┐
│ AYPHEN  [Project ▼] Your Work Projects Filters ... AI       │
│                                                              │
│                    [+ Create] [Search] 🔔 👤               │
└─────────────────────────────────────────────────────────────┘
                          ↑
                    CREATE BUTTON HERE
```

### Create Button States

**Normal:**
```
┌──────────┐
│ + Create │  ← Pink/Purple gradient
└──────────┘
```

**Hover:**
```
┌──────────┐
│ + Create │  ← Darker shade, slightly larger
└──────────┘
```

**Clicked:**
```
Opens Create Issue Modal
┌─────────────────────────────┐
│  Create Issue               │
│  ─────────────────────────  │
│  Summary: [____________]    │
│  Project: [Select ▼]        │
│  Type:    [Select ▼]        │
│  ...                        │
│  [Cancel]  [Create]         │
└─────────────────────────────┘
```

### Voice Command Modal (Cmd+K)

```
┌─────────────────────────────┐
│  🎤 Voice Assistant          │
│  ─────────────────────────  │
│                             │
│  Press Cmd+K to speak       │
│  or type your command       │
│                             │
│  [Listening... 🔴]          │
│                             │
│  Recent Commands:           │
│  • Create bug for login     │
│  • Show sprint progress     │
│                             │
│  [Close]                    │
└─────────────────────────────┘
```

---

## 🚨 Troubleshooting

### Create Button Not Visible?

**Check 1: Screen Size**
- Button might be hidden on small screens
- Try maximizing your browser window
- Look for a hamburger menu (☰) on mobile

**Check 2: Authentication**
- Make sure you're logged in
- Refresh the page
- Check if you have project access

**Check 3: Browser Zoom**
- Reset zoom to 100% (Cmd/Ctrl + 0)
- Button might be off-screen if zoomed

**Check 4: Browser Console**
- Open DevTools (F12)
- Check for JavaScript errors
- Look for network issues

### Cmd+K Not Working?

**Check 1: Keyboard Shortcut Conflict**
- Some browsers use Cmd+K for search
- Try Ctrl+K instead
- Check browser extensions

**Check 2: Focus Issues**
- Click somewhere on the page first
- Don't be in a text input field
- Try clicking outside any modals

**Check 3: Microphone Permissions**
- Browser needs microphone access
- Check browser settings
- Allow microphone when prompted

**Check 4: Browser Support**
- Works best in Chrome/Edge
- Firefox and Safari supported
- Update to latest browser version

---

## 📋 Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open Voice Command |
| `C` | Open Create Issue Modal |
| `ESC` | Close any modal |
| `?` + `Shift` | Show all shortcuts |
| `/` | Focus search box |

### Create Button Locations

1. **Top Navigation Bar** (main location)
   - Always visible when logged in
   - Top-right corner

2. **Quick Actions Menu** (alternative)
   - Click the floating action button (bottom-right)
   - Select "Create Issue"

3. **Project Dropdown** (alternative)
   - Click "Projects" in top nav
   - Select "Create project"

---

## ✅ Feature Status

### Create Button ✅
- [x] Visible in top navigation
- [x] Opens create issue modal
- [x] Form validation working
- [x] API integration complete
- [x] Success/error messages
- [x] Keyboard shortcut (C)

### Voice Command (Cmd+K) ✅
- [x] Keyboard shortcut working
- [x] Modal opens on Cmd+K
- [x] Speech recognition active
- [x] AI processing functional
- [x] Command execution working
- [x] Visual feedback provided

---

## 🎉 Summary

**Both features are now fully functional!**

### Create Button
- **Location:** Top-right in navigation bar
- **Color:** Pink/Purple gradient with + icon
- **Shortcut:** Press `C` key
- **Function:** Opens issue creation modal

### Voice Command
- **Shortcut:** `Cmd+K` (Mac) or `Ctrl+K` (Windows)
- **Function:** AI-powered voice assistant
- **Features:** Create issues, search, navigate, AI suggestions
- **Status:** Fully integrated and working

---

## 📞 Need Help?

If you still can't see the Create button or Cmd+K isn't working:

1. **Refresh the page** (Cmd/Ctrl + R)
2. **Clear browser cache** (Cmd/Ctrl + Shift + Delete)
3. **Check browser console** for errors (F12)
4. **Try a different browser** (Chrome recommended)
5. **Verify you're logged in** with valid credentials

---

**Last Updated:** November 28, 2025, 2:55 PM IST  
**Status:** ✅ BOTH FEATURES WORKING
