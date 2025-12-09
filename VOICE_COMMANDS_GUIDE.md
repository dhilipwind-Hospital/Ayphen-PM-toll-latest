# Voice Assistant Commands Guide 🎤

## How to Use
1. Open any issue detail page (e.g., `/issue/AIA-1`)
2. Click the microphone button in the header
3. Speak your command clearly
4. Wait for confirmation

## Supported Commands

### Priority Commands
- "set priority to high"
- "set priority to medium"
- "set priority to low"
- "change priority to urgent" (sets to high)

### Status Commands
- "change status to in progress"
- "change status to done"
- "change status to todo"
- "change status to review"
- "move to in progress"
- "move to done"

### Assignment Commands
- "assign to John"
- "assign to Sarah"
- "assign [name]"

### Story Points
- "set story points to 5"
- "set points to 8"
- "estimate 3 points"

### Labels
- "add label urgent"
- "add label bug"
- "tag frontend"

### Description
- "add description [your text here]"
- "set description [your text here]"
- "description [your text here]"

## Command Variations
The system understands natural variations:
- "set priority high" = "set priority to high"
- "status in progress" = "change status to in progress"
- "assign John" = "assign to John"
- "description fix login bug" = "add description fix login bug"

## Tips
- Speak clearly and at normal pace
- Wait for "Listening..." to appear
- Check the transcript box for what was heard
- Success messages appear as notifications
- Page refreshes automatically after updates

## Troubleshooting
- **No microphone button?** Check browser compatibility (Chrome/Safari only)
- **Command not recognized?** Try rephrasing using examples above
- **No update?** Check network tab for API errors
- **User not found?** Make sure the user exists in the project

## Browser Support
✅ Chrome/Edge (Recommended)
✅ Safari
❌ Firefox (Web Speech API not supported)
