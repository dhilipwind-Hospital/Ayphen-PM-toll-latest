# 🧪 Voice Assistant Testing Guide

**Date:** December 2, 2025  
**Version:** Complete (All 10 Phases)

---

## 📋 Quick Start

### **Prerequisites:**
1. ✅ Backend running on http://localhost:8500
2. ✅ Frontend running on http://localhost:1600
3. ✅ Chrome/Edge browser (for best voice support)
4. ✅ Microphone access granted
5. ✅ Logged into the application

---

## 🎤 Phase 1-2: Foundation Testing

### **Test 1: Basic Voice Recognition**

**Steps:**
1. Navigate to any issue detail page
2. Look for the microphone button (🎤)
3. Click the microphone button
4. Say: "set priority to high"
5. Wait for processing

**Expected Results:**
- ✅ Microphone button turns pink/active
- ✅ You see "Listening..." status
- ✅ Transcript appears: "set priority to high"
- ✅ Confidence score shows (e.g., 0.95)
- ✅ Issue priority updates to "high"
- ✅ Success message displays

---

### **Test 2: Confidence Scoring**

**Steps:**
1. Click microphone
2. Say clearly: "move to in progress"
3. Note the confidence score

**Expected Results:**
- ✅ Confidence bar shows green (>0.7)
- ✅ Percentage displays (e.g., 95%)
- ✅ Command executes automatically

**Test Low Confidence:**
1. Click microphone
2. Mumble or speak unclearly
3. Note the confidence score

**Expected Results:**
- ✅ Confidence bar shows yellow/red (<0.7)
- ✅ Warning message: "Low confidence - please confirm"
- ✅ Preview shows before execution

---

### **Test 3: Visual Waveform**

**Steps:**
1. Click microphone
2. Speak while watching the waveform

**Expected Results:**
- ✅ Waveform animates while speaking
- ✅ Bars move with voice volume
- ✅ Animation stops when silent

**Try Different Styles:**
- Bars style (default)
- Gradient style
- Circle style

---

### **Test 4: Edit Before Execute**

**Steps:**
1. Click microphone
2. Say: "set priority to hgh" (intentional typo)
3. Look for the preview/edit option
4. Edit the text to "set priority to high"
5. Click confirm

**Expected Results:**
- ✅ Preview shows with edit button
- ✅ Can edit the transcript
- ✅ Can confirm or cancel
- ✅ Edited command executes correctly

---

### **Test 5: Offline Queue**

**Steps:**
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" mode
4. Click microphone
5. Say: "set priority to high"
6. Uncheck "Offline" mode

**Expected Results:**
- ✅ Command queued (not executed immediately)
- ✅ Queue icon shows (1 pending)
- ✅ When online, command auto-syncs
- ✅ Success notification appears

---

### **Test 6: Multi-Language Support**

**Steps:**
1. Open voice settings
2. Change language to "Spanish (es-ES)"
3. Click microphone
4. Say: "establecer prioridad alta" (set priority high)

**Expected Results:**
- ✅ Spanish recognition works
- ✅ Command understood and executed
- ✅ Can switch back to English

**Supported Languages to Test:**
- English (US, UK)
- Spanish
- French
- German
- Italian
- Portuguese

---

### **Test 7: Text Mode Fallback (Firefox)**

**Steps:**
1. Open Firefox browser
2. Navigate to issue page
3. Look for voice input

**Expected Results:**
- ✅ Text input field shows instead of voice
- ✅ Can type commands
- ✅ Commands execute same as voice
- ✅ Message: "Voice not supported, using text mode"

---

## 🧠 Phase 3-4: AI Intelligence Testing

### **Test 8: Natural Language Understanding**

**Test Natural Phrases:**
```
Instead of: "set priority to high"
Try: "make this urgent"
Expected: ✅ Priority set to highest

Instead of: "move to in progress"
Try: "start working on this"
Expected: ✅ Status changed to in-progress

Instead of: "assign to john"
Try: "john should handle this"
Expected: ✅ Assigned to John
```

---

### **Test 9: Pronoun Resolution**

**Steps:**
1. Open issue PROJ-123
2. Click microphone
3. Say: "set it to high priority"

**Expected Results:**
- ✅ System resolves "it" to "PROJ-123"
- ✅ Command executes: "set PROJ-123 to high priority"
- ✅ Success message shows issue key

**More Pronoun Tests:**
```
"assign this to me" → Assigns current issue
"move that to done" → Moves current issue
"set the issue to high" → Updates current issue
```

---

### **Test 10: Command Chaining**

**Steps:**
1. Click microphone
2. Say: "set priority to high and assign to john"

**Expected Results:**
- ✅ System detects 2 commands
- ✅ Both execute in sequence:
  1. Priority set to high
  2. Assigned to John
- ✅ Success message for both

**More Chaining Tests:**
```
"set priority to high and move to in progress and assign to me"
→ Executes 3 commands

"make this urgent, assign to sarah, and add label frontend"
→ Executes 3 commands
```

---

### **Test 11: Smart Suggestions**

**Steps:**
1. Open issue detail page (status: todo)
2. Look for suggestion chips

**Expected Results:**
- ✅ Suggestions appear based on context:
  - "Move to in progress" (95% confidence)
  - "Assign to me" (85% confidence)
  - "Set priority to high" (80% confidence)

**Test Different Contexts:**
- **Board page:** "Create a bug", "Show my issues"
- **Morning (9am):** "Generate standup update"
- **Blocked issues:** "Show my 3 blocked issues"

---

### **Test 12: Conversation History**

**Steps:**
1. Execute command: "set priority to high"
2. Immediately say: "also assign to john"

**Expected Results:**
- ✅ System remembers last command
- ✅ "also" applies to same issue
- ✅ Both actions completed

**Test Context Retention:**
```
Command 1: "set PROJ-123 to high priority"
Command 2: "also assign it to sarah"
Expected: ✅ Assigns PROJ-123 to Sarah
```

---

### **Test 13: Synonym Expansion**

**Test Synonyms:**
```
"urgent" → "highest priority" ✅
"asap" → "highest priority" ✅
"working on" → "in progress" ✅
"finished" → "done" ✅
"give to john" → "assign to john" ✅
```

---

## 🚀 Phase 5-6: Advanced Features Testing

### **Test 14: Voice-to-Voice Conversation**

**Steps:**
1. Navigate to voice assistant page
2. Click the voice orb (large circular button)
3. Wait for TTS: "I'm listening"
4. Say: "set priority to high"
5. Listen for TTS response

**Expected Results:**
- ✅ TTS says: "I'm listening"
- ✅ Orb pulses while listening
- ✅ After execution, TTS says: "Done! Priority set to high"
- ✅ TTS asks: "What would you like to do next?"
- ✅ Can continue conversation

**Test Emotions:**
- Success: Higher pitch, faster rate
- Error: Lower pitch, slower rate
- Warning: Slightly higher pitch

---

### **Test 15: Multi-Modal Input (Voice + Touch)**

**Steps:**
1. Say: "set this to high priority"
2. Within 3 seconds, click on issue PROJ-123

**Expected Results:**
- ✅ System combines voice + click
- ✅ Resolves "this" to clicked issue
- ✅ Command: "set PROJ-123 to high priority"
- ✅ Confidence: 95% (voice-touch mode)

**More Multi-Modal Tests:**
```
Voice: "assign this to me"
Click: Issue PROJ-456
Result: ✅ PROJ-456 assigned to you

Voice: "move to done"
Long-press: Issue PROJ-789
Result: ✅ Shows details + moves to done
```

---

### **Test 16: Batch Operations**

**Steps:**
1. Select multiple issues (checkbox)
2. Click microphone
3. Say: "set all selected to high priority"

**Expected Results:**
- ✅ Preview shows: "10 issues will be updated"
- ✅ Confirm button appears
- ✅ After confirm, all 10 update in parallel
- ✅ Progress indicator shows
- ✅ Success: "9 successful, 1 failed"

**More Batch Tests:**
```
"set all to high priority" → Updates all in project
"move all selected to done" → Bulk status change
"assign all to john" → Bulk assignment
```

---

### **Test 17: Analytics Dashboard**

**Steps:**
1. Navigate to Settings → Voice Analytics
2. View dashboard

**Expected Results:**
- ✅ Total commands: 150
- ✅ Success rate: 93%
- ✅ Average confidence: 0.87
- ✅ Top intents chart
- ✅ Usage by hour graph
- ✅ Time saved: 75 minutes

**Test Export:**
1. Click "Export Data"
2. Choose JSON or CSV
3. Download file

**Expected Results:**
- ✅ File downloads
- ✅ Contains all analytics data
- ✅ Properly formatted

---

### **Test 18: User Insights**

**Steps:**
1. Navigate to Profile → Voice Insights
2. View personalized insights

**Expected Results:**
- ✅ Efficiency score: 87/100
- ✅ Favorite commands listed
- ✅ Peak usage time: "9:00-10:00"
- ✅ Improvement suggestions shown
- ✅ Success rate trend graph

---

## 🤝 Phase 7-8: Integrations Testing

### **Test 19: Microsoft Teams Bot**

**Steps:**
1. Open Microsoft Teams
2. Search for "Jira Voice Assistant" bot
3. Start chat
4. Type: "help"

**Expected Results:**
- ✅ Bot responds with help card
- ✅ Shows example commands
- ✅ Lists supported features

**Test Commands in Teams:**
```
"Set PROJ-123 to high priority"
Expected: ✅ Adaptive card with success message

"Show my open issues"
Expected: ✅ List of issues in card format

"Create a bug for login issue"
Expected: ✅ New issue created, key returned
```

---

### **Test 20: Mobile Voice Assistant**

**Steps:**
1. Open app on mobile device (or resize browser to mobile)
2. Look for floating voice button (bottom-right)
3. Tap floating button
4. Bottom sheet slides up
5. Tap voice orb

**Expected Results:**
- ✅ Floating button visible
- ✅ Bottom sheet animates up
- ✅ Large 80px voice orb
- ✅ Quick action buttons scroll horizontally
- ✅ Can use voice OR text input

**Test Quick Actions:**
1. Tap "Set priority to high"
2. Command executes immediately

**Expected Results:**
- ✅ No voice needed
- ✅ One-tap execution
- ✅ Success feedback

---

### **Test 21: Meeting Integration**

**Setup:**
1. Start a Zoom/Teams meeting
2. Enable meeting transcription
3. Configure webhook to: `/api/voice-integrations/meeting/start`

**During Meeting:**
1. Say: "We need to fix PROJ-123 by Friday"
2. Say: "Action item: John will update the documentation"
3. Say: "This blocks PROJ-456"

**After Meeting:**
1. End meeting
2. View meeting summary

**Expected Results:**
- ✅ PROJ-123 tracked (mentioned 1 time)
- ✅ Action item detected: "John will update documentation"
- ✅ Issue reference: PROJ-456 tracked
- ✅ Meeting summary generated
- ✅ Can create issues from action items

---

## 🎯 Phase 9-10: Analytics & Learning Testing

### **Test 22: Custom Command Aliases**

**Create Alias:**
1. Navigate to Settings → Voice Aliases
2. Click "Create Alias"
3. Shortcut: "urgent"
4. Full Command: "set priority to highest and assign to me"
5. Save

**Use Alias:**
1. Click microphone
2. Say: "urgent"

**Expected Results:**
- ✅ System resolves: "set priority to highest and assign to me"
- ✅ Both actions execute
- ✅ Usage count increments

---

### **Test 23: Auto-Suggest Aliases**

**Steps:**
1. Use command "show my blocked issues" 5+ times
2. Navigate to Settings → Voice Aliases
3. Look for suggestions

**Expected Results:**
- ✅ Suggestion appears: "myblocked" → "show my blocked issues"
- ✅ Reason: "Used 5 times"
- ✅ Confidence: 0.25
- ✅ Can accept with one click

---

### **Test 24: Default Aliases**

**Test Built-in Aliases:**
```
Say: "qh"
Expected: ✅ "set priority to high"

Say: "ip"
Expected: ✅ "move to in progress"

Say: "me"
Expected: ✅ "assign to me"

Say: "myissues"
Expected: ✅ "show my issues"

Say: "bug"
Expected: ✅ "create a bug"
```

---

### **Test 25: Feedback Collection**

**Thumbs Up/Down:**
1. Execute a command
2. Look for feedback widget: [👍] [👎] [💬]
3. Click thumbs up

**Expected Results:**
- ✅ Button turns green
- ✅ Message: "Thanks for the feedback!"
- ✅ Feedback recorded in analytics

**Add Comment:**
1. Click comment icon (💬)
2. Type: "This worked perfectly!"
3. Click Send

**Expected Results:**
- ✅ Comment box appears
- ✅ Comment submitted
- ✅ Success message

---

### **Test 26: Submit Correction**

**Steps:**
1. Say: "set priority high" (missing "to")
2. System misunderstands
3. Click "Correct" button
4. Type correct version: "set priority to high"
5. Submit

**Expected Results:**
- ✅ Correction recorded
- ✅ System learns from correction
- ✅ Next time, understands both versions

---

### **Test 27: Feature Request**

**Steps:**
1. Navigate to Settings → Feedback
2. Click "Feature Request"
3. Type: "Add support for bulk priority updates"
4. Submit

**Expected Results:**
- ✅ Request recorded
- ✅ Appears in admin dashboard
- ✅ Can be prioritized

---

### **Test 28: Command Effectiveness**

**Steps:**
1. Navigate to Analytics → Command Effectiveness
2. Select command: "set priority"
3. View metrics

**Expected Results:**
- ✅ Total executions: 150
- ✅ Success rate: 95%
- ✅ Average confidence: 0.87
- ✅ Thumbs up: 128
- ✅ Thumbs down: 14
- ✅ User satisfaction: 90/100
- ✅ Improvement suggestions listed

---

## 🧪 Integration Testing

### **Test 29: End-to-End Workflow**

**Complete User Journey:**
1. **Morning:** Say "show my tasks for today"
2. **Select Issue:** Click PROJ-123
3. **Voice Command:** "set it to high priority"
4. **Multi-Modal:** Say "assign this" + click user "John"
5. **Chaining:** "move to in progress and add label frontend"
6. **Feedback:** Click thumbs up
7. **Alias:** Create "urgent" shortcut
8. **Use Alias:** Say "urgent" on next issue
9. **Batch:** Select 5 issues, say "set all to medium"
10. **Analytics:** View dashboard, see all activity

**Expected Results:**
- ✅ All steps work seamlessly
- ✅ Context maintained throughout
- ✅ Analytics track everything
- ✅ Feedback recorded
- ✅ Alias works immediately

---

### **Test 30: Cross-Platform**

**Test on Different Platforms:**

**Desktop (Chrome):**
- ✅ Full voice features
- ✅ All visualizations
- ✅ Waveform animations

**Desktop (Firefox):**
- ✅ Text mode fallback
- ✅ All commands work
- ✅ No voice recognition

**Mobile (Safari):**
- ✅ Touch-optimized UI
- ✅ Floating button
- ✅ Bottom sheet
- ✅ Quick actions

**Teams:**
- ✅ Bot responds
- ✅ Adaptive cards
- ✅ Notifications

---

## 📊 Performance Testing

### **Test 31: Response Time**

**Measure Response Times:**
1. Open DevTools → Network
2. Execute voice command
3. Check timing

**Expected Results:**
- ✅ Speech recognition: <500ms
- ✅ AI parsing: 200-300ms
- ✅ Command execution: <200ms
- ✅ Total: <1 second

---

### **Test 32: Batch Performance**

**Steps:**
1. Select 100 issues
2. Say: "set all to high priority"
3. Measure execution time

**Expected Results:**
- ✅ Processing: 50-100 issues/second
- ✅ Total time: 1-2 seconds for 100 issues
- ✅ Progress indicator shows
- ✅ No UI freeze

---

### **Test 33: Offline Reliability**

**Steps:**
1. Go offline
2. Execute 10 commands
3. Go online
4. Wait for sync

**Expected Results:**
- ✅ All 10 queued
- ✅ Auto-sync when online
- ✅ All execute successfully
- ✅ Queue cleared

---

## ✅ Testing Checklist

### **Foundation (Phase 1-2):**
- [ ] Basic voice recognition works
- [ ] Confidence scoring accurate
- [ ] Waveform animates
- [ ] Edit before execute works
- [ ] Offline queue saves/syncs
- [ ] Multi-language works
- [ ] Text fallback (Firefox)

### **AI Intelligence (Phase 3-4):**
- [ ] Natural language understood
- [ ] Pronouns resolved
- [ ] Command chaining works
- [ ] Synonyms expanded
- [ ] Smart suggestions relevant
- [ ] Context tracked
- [ ] Corrections suggested

### **Advanced Features (Phase 5-6):**
- [ ] Voice-to-voice conversation
- [ ] TTS emotions work
- [ ] Multi-modal combines inputs
- [ ] Batch operations execute
- [ ] Analytics track events
- [ ] Insights generated
- [ ] Export works

### **Integrations (Phase 7-8):**
- [ ] Teams bot responds
- [ ] Mobile UI works
- [ ] Meeting transcription
- [ ] Action items detected
- [ ] Issue references tracked
- [ ] Summaries generated

### **Analytics & Learning (Phase 9-10):**
- [ ] Aliases created/used
- [ ] Auto-suggestions work
- [ ] Feedback collected
- [ ] Corrections tracked
- [ ] Effectiveness scored
- [ ] Default aliases work

---

## 🐛 Common Issues & Solutions

### **Issue: Microphone not working**
**Solution:**
1. Check browser permissions
2. Allow microphone access
3. Refresh page
4. Try different browser

### **Issue: Low confidence scores**
**Solution:**
1. Speak more clearly
2. Reduce background noise
3. Use headset microphone
4. Add to custom vocabulary

### **Issue: Commands not executing**
**Solution:**
1. Check network connection
2. Verify backend is running
3. Check browser console for errors
4. Try text mode

### **Issue: Offline queue not syncing**
**Solution:**
1. Check network status
2. Manually trigger sync
3. Clear localStorage
4. Restart browser

---

## 📈 Success Criteria

**All tests passing means:**
- ✅ 95-98% accuracy
- ✅ <1 second response time
- ✅ 100% browser coverage
- ✅ 95% reliability
- ✅ All features functional
- ✅ Analytics tracking correctly
- ✅ Feedback collection working
- ✅ Cross-platform compatibility

---

**Last Updated:** December 2, 2025  
**Status:** Complete Testing Guide for All 10 Phases
