# 🤖🎤 AI & VOICE ASSISTANT TEST SUITE
## Ayphen PM Tool - Complete AI/Voice Feature Testing

**Document Version:** 1.0  
**Created:** January 7, 2026  
**Application URL:** https://ayphen-pm-toll.vercel.app  
**Testing Framework:** Playwright / Manual Testing

---

## 📊 EXECUTIVE SUMMARY

| Feature Category | Total Tests | Completed | Pending | Coverage |
|-----------------|-------------|-----------|---------|----------|
| 🤖 PMBot Dashboard | 12 | 5 | 7 | 42% |
| ✨ AI Auto-Assignment | 10 | 2 | 8 | 20% |
| 🏷️ AI Auto-Tagging | 8 | 1 | 7 | 13% |
| 🎯 AI Smart Priority | 8 | 2 | 6 | 25% |
| 🐛 Bug AI Analysis | 12 | 4 | 8 | 33% |
| 📝 AI Story Generator | 10 | 5 | 5 | 50% |
| ✅ AI Test Case Generator | 10 | 4 | 6 | 40% |
| 🏃 Sprint Auto-Populate | 8 | 1 | 7 | 13% |
| 🔍 AI Duplicate Detection | 10 | 3 | 7 | 30% |
| 📋 Meeting Scribe | 10 | 5 | 5 | 50% |
| 🎤 Voice Commands | 20 | 0 | 20 | 0% |
| 🗣️ Voice Description | 10 | 0 | 10 | 0% |
| ⚠️ Predictive Alerts | 8 | 0 | 8 | 0% |
| 🤝 AI Copilot | 8 | 2 | 6 | 25% |
| 📧 Email-to-Issue AI | 6 | 0 | 6 | 0% |
| **TOTAL** | **140** | **34** | **106** | **24%** |

---

## 🔧 PREREQUISITES & SETUP

### Required Configuration

```env
# Backend .env requirements
CEREBRAS_API_KEY=your_cerebras_api_key
OPENAI_API_KEY=your_openai_api_key (fallback)
```

### Test Data Required

| Data Type | Quantity | Purpose |
|-----------|----------|---------|
| Project with Issues | 1 | AI context |
| Completed Sprints | 3+ | Velocity analysis |
| Team Members | 5+ | Assignment suggestions |
| Resolved Bugs | 20+ | Bug pattern analysis |
| Completed Stories | 30+ | Estimation learning |

### Browser Requirements

- Chrome/Edge with Microphone access
- Permission granted for audio recording
- Stable internet connection

---

# 📚 DETAILED TEST CASES

---

## SECTION 1: 🤖 PMBOT DASHBOARD (12 Tests)

### 1.1 PMBot Overview

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| PMB-001 | PMBot Dashboard Load | Logged in, project selected | 1. Navigate to `/ai-features`<br>2. Click PMBot tab | • Dashboard loads<br>• Activity metrics visible<br>• Recent actions list displayed | ✅ Completed | P0 |
| PMB-002 | Activity Metrics Display | PMBot has performed actions | 1. View PMBot dashboard<br>2. Check metric cards | • Auto-assignments count shown<br>• Stale issues detected count<br>• Recommendations made count<br>• Time saved metric | ✅ Completed | P0 |
| PMB-003 | Recent Activity Feed | PMBot has history | 1. View Activity section | • List of recent AI actions<br>• Timestamps shown<br>• Action types labeled<br>• Affected issues linked | ⏳ Pending | P1 |
| PMB-004 | Activity Filtering | Activity exists | 1. Filter by action type<br>2. Filter by date range | • List filters correctly<br>• Count updates | ⏳ Pending | P2 |
| PMB-005 | Refresh Activity | On dashboard | 1. Click refresh button | • Activity reloads<br>• New actions appear | ⏳ Pending | P2 |

### 1.2 PMBot Settings

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| PMB-006 | Settings Page Load | On PMBot page | 1. Click Settings tab | • Settings form loads<br>• All toggles visible<br>• Sliders functional | ✅ Completed | P0 |
| PMB-007 | Toggle Auto-Assignment | On settings | 1. Toggle "Enable Auto-Assignment"<br>2. Save | • Setting saved<br>• Toast confirmation<br>• Feature enabled/disabled | ⏳ Pending | P0 |
| PMB-008 | Toggle Auto-Tagging | On settings | 1. Toggle "Enable Auto-Tagging"<br>2. Save | • Setting saved<br>• Feature enabled/disabled | ⏳ Pending | P0 |
| PMB-009 | Toggle Stale Issue Detection | On settings | 1. Toggle "Detect Stale Issues"<br>2. Set threshold (days) | • Threshold saved<br>• Stale detection updated | ⏳ Pending | P1 |
| PMB-010 | Adjust Confidence Threshold | On settings | 1. Move confidence slider<br>2. Set to 80%<br>3. Save | • Threshold saved<br>• AI only acts above threshold | ✅ Completed | P1 |
| PMB-011 | Reset to Defaults | On settings | 1. Click "Reset to Defaults" | • All settings reset<br>• Confirmation dialog shown | ✅ Completed | P2 |
| PMB-012 | Save All Settings | Modified settings | 1. Change multiple settings<br>2. Click Save | • All changes saved<br>• Success toast<br>• Settings persist on reload | ⏳ Pending | P0 |

---

## SECTION 2: ✨ AI AUTO-ASSIGNMENT (10 Tests)

### Component: `AutoAssignButton.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| AAG-001 | Auto-Assign Button Visible | Issue detail open, no assignee | 1. Open unassigned issue<br>2. Look for AI button | • "AI Suggest" button visible near assignee field | ✅ Completed | P0 |
| AAG-002 | Trigger AI Assignment | Unassigned issue | 1. Click "AI Suggest Assignee"<br>2. Wait for analysis | • Loading spinner shown<br>• AI analyzes issue content<br>• Suggestion panel appears | ⏳ Pending | P0 |
| AAG-003 | View AI Suggestion | AI has analyzed | 1. Check suggestion panel | • Suggested user name<br>• Confidence percentage<br>• Reasoning shown (e.g., "Fixed 5 similar bugs") | ⏳ Pending | P0 |
| AAG-004 | Accept AI Suggestion | Suggestion shown | 1. Click "Accept" or user avatar | • Assignee set to suggested user<br>• Issue updated<br>• Success toast | ⏳ Pending | P0 |
| AAG-005 | Reject AI Suggestion | Suggestion shown | 1. Click "Dismiss" or X | • Suggestion dismissed<br>• Can manually assign | ⏳ Pending | P1 |
| AAG-006 | No Suggestion Available | New project, no history | 1. Trigger AI assignment | • Message: "Not enough data"<br>• Prompt to assign manually | ⏳ Pending | P1 |
| AAG-007 | Multiple Suggestions | Complex issue | 1. Trigger assignment<br>2. View suggestions | • Top 3 candidates shown<br>• Ranked by confidence<br>• Click to select any | ⏳ Pending | P2 |
| AAG-008 | Auto-Assign on Create | Setting enabled | 1. Create new bug<br>2. Don't set assignee | • Issue created<br>• Assignee auto-set by AI<br>• Notification sent | ⏳ Pending | P1 |
| AAG-009 | Assignment Reasoning | Suggestion made | 1. Click "Why?" or expand | • Detailed reasoning:<br>  - Similar issues fixed<br>  - Skill match<br>  - Current workload | ✅ Completed | P2 |
| AAG-010 | Override Auto-Assignment | Assigned by AI | 1. Manually change assignee | • New assignee set<br>• AI learns from correction | ⏳ Pending | P2 |

---

## SECTION 3: 🏷️ AI AUTO-TAGGING (8 Tests)

### Component: `AutoTagButton.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| TAG-001 | Auto-Tag Button Visible | Issue with description | 1. Open issue with content<br>2. Find labels section | • "AI Suggest Labels" button visible | ✅ Completed | P0 |
| TAG-002 | Trigger AI Tagging | Issue without labels | 1. Click "AI Suggest Labels" | • Loading state<br>• AI analyzes content<br>• Tags suggested | ⏳ Pending | P0 |
| TAG-003 | View Suggested Tags | AI analyzed | 1. View suggestion panel | • 3-5 tags suggested<br>• Confidence per tag<br>• Existing labels not duplicated | ⏳ Pending | P0 |
| TAG-004 | Accept All Tags | Tags suggested | 1. Click "Apply All" | • All tags added to issue<br>• Labels display updated<br>• Success message | ⏳ Pending | P0 |
| TAG-005 | Select Individual Tags | Tags suggested | 1. Click checkboxes on desired tags<br>2. Click "Apply Selected" | • Only selected tags added<br>• Others dismissed | ⏳ Pending | P1 |
| TAG-006 | Reject All Suggestions | Tags suggested | 1. Click "Dismiss" | • No tags added<br>• Can add manually | ⏳ Pending | P1 |
| TAG-007 | Auto-Tag on Create | Setting enabled | 1. Create issue with description<br>2. Don't add labels | • Labels auto-suggested<br>• Modal to confirm or dismiss | ⏳ Pending | P2 |
| TAG-008 | Tag Learning | Correction made | 1. Remove AI-added tag<br>2. Add different tag | • AI learns from correction<br>• Better suggestions next time | ⏳ Pending | P3 |

---

## SECTION 4: 🎯 AI SMART PRIORITY (8 Tests)

### Component: `SmartPrioritySelector.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| PRI-001 | Smart Priority Button | Issue creation/edit | 1. Open issue form<br>2. Find priority field | • "AI Suggest" icon visible next to priority | ✅ Completed | P0 |
| PRI-002 | Trigger Priority Analysis | Issue with content | 1. Click AI priority button | • AI analyzes:<br>  - Issue type<br>  - Keywords<br>  - Impact<br>  - Deadline | ⏳ Pending | P0 |
| PRI-003 | View Priority Suggestion | AI analyzed | 1. View suggestion | • Priority level shown (Critical/High/Medium/Low)<br>• Confidence %<br>• Reasoning | ✅ Completed | P0 |
| PRI-004 | Accept Priority | Suggestion shown | 1. Click "Apply" | • Priority set<br>• Dropdown updated<br>• Success toast | ⏳ Pending | P0 |
| PRI-005 | Priority Factors | Suggestion shown | 1. Expand "Factors" section | • List of factors:<br>  - "Contains 'critical' keyword"<br>  - "Affects production"<br>  - "Customer reported" | ⏳ Pending | P1 |
| PRI-006 | Override and Learn | Priority set by AI | 1. Change priority manually | • New priority saved<br>• AI learns the correction | ⏳ Pending | P2 |
| PRI-007 | Batch Priority Update | Multiple issues selected | 1. Select 5 issues<br>2. Click "AI Prioritize All" | • All analyzed<br>• Suggestions shown per issue<br>• Bulk apply option | ⏳ Pending | P2 |
| PRI-008 | Priority Context | Issue in sprint | 1. Trigger AI priority for sprint issue | • Considers sprint deadline<br>• Higher urgency if deadline near | ⏳ Pending | P2 |

---

## SECTION 5: 🐛 BUG AI ANALYSIS (12 Tests)

### Component: `BugAIPanel.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| BUG-001 | Bug AI Panel Visible | Bug issue open | 1. Open bug type issue<br>2. Scroll to AI section | • "AI Analysis" panel visible<br>• Different from Story AI panel | ✅ Completed | P0 |
| BUG-002 | Trigger Bug Analysis | Bug with description | 1. Click "Analyze Bug" | • Loading indicator<br>• AI processes bug content | ⏳ Pending | P0 |
| BUG-003 | Severity Assessment | Analysis complete | 1. View severity section | • Severity: Critical/High/Medium/Low<br>• Confidence %<br>• Impact description | ✅ Completed | P0 |
| BUG-004 | Root Cause Suggestion | Analysis complete | 1. View "Likely Cause" section | • Root cause type identified:<br>  - Race condition<br>  - Null pointer<br>  - API error<br>• Explanation provided | ⏳ Pending | P0 |
| BUG-005 | Similar Bugs Found | Historical data exists | 1. View "Similar Issues" | • List of similar resolved bugs<br>• Similarity %<br>• Click to view | ✅ Completed | P1 |
| BUG-006 | Suggested Fix | Analysis complete | 1. View "Suggested Fix" | • Code-level suggestion<br>• Best practice recommendation | ⏳ Pending | P1 |
| BUG-007 | Affected Components | Bug analyzed | 1. View components section | • Modules affected listed<br>• Impact scope shown | ⏳ Pending | P2 |
| BUG-008 | Apply AI Triage | Analysis shown | 1. Click "Apply AI Triage" | • Severity set<br>• Priority set<br>• Labels added<br>• Assignee suggested | ⏳ Pending | P0 |
| BUG-009 | Estimated Fix Time | Analysis complete | 1. View estimate section | • Time estimate: "4-6 hours"<br>• Based on similar bugs | ✅ Completed | P2 |
| BUG-010 | Bug Pattern Detection | Multiple similar bugs | 1. View patterns | • Pattern identified:<br>  - "Authentication issues trending"<br>  - "5 bugs this week" | ⏳ Pending | P2 |
| BUG-011 | Create from Stack Trace | Stack trace in description | 1. Paste stack trace<br>2. Click "Analyze" | • Functions identified<br>• File locations parsed<br>• Suggests affected code | ⏳ Pending | P2 |
| BUG-012 | Link to Documentation | Analysis complete | 1. View suggestions | • Links to relevant docs<br>• Error code explanations | ⏳ Pending | P3 |

---

## SECTION 6: 📝 AI STORY GENERATOR (10 Tests)

### Located in: AI Features Page

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| STY-001 | Story Generator Load | On AI Features page | 1. Click "Story Generator" tab | • Generator form visible<br>• Prompt field ready<br>• Options available | ✅ Completed | P0 |
| STY-002 | Generate from Prompt | Form ready | 1. Enter: "User login with email"<br>2. Click Generate | • Story title generated<br>• Description created<br>• Acceptance criteria listed | ✅ Completed | P0 |
| STY-003 | Include Epic Context | Epic selected | 1. Select parent Epic<br>2. Generate story | • Story aligns with Epic goal<br>• References Epic context | ⏳ Pending | P1 |
| STY-004 | Multiple Stories | Complex prompt | 1. Enter complex feature request<br>2. Generate | • Multiple stories suggested<br>• Can select which to create | ✅ Completed | P1 |
| STY-005 | Edit Generated Content | Story generated | 1. Modify title<br>2. Edit description<br>3. Adjust AC | • Content editable<br>• Changes preserved | ✅ Completed | P0 |
| STY-006 | Create Story | Content ready | 1. Click "Create Story" | • Issue created in project<br>• All fields populated<br>• Success message | ✅ Completed | P0 |
| STY-007 | Story Format Selection | Generating | 1. Select format: "As a... I want..."<br>2. Generate | • Standard user story format used | ⏳ Pending | P2 |
| STY-008 | Technical Story Generation | Select "Technical" | 1. Choose technical type<br>2. Enter: "Database optimization" | • Technical story generated<br>• No user persona | ⏳ Pending | P2 |
| STY-009 | Regenerate Content | Story shown | 1. Click "Regenerate" | • New content generated<br>• Previous not lost (undo option) | ⏳ Pending | P2 |
| STY-010 | Copy to Clipboard | Story generated | 1. Click "Copy" | • Content copied<br>• Can paste elsewhere | ⏳ Pending | P3 |

---

## SECTION 7: ✅ AI TEST CASE GENERATOR (10 Tests)

### Component: `TestCaseGeneratorButton.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| TCG-001 | Generator Button Visible | Story issue open | 1. Open story with AC<br>2. Find "Generate Tests" button | • Button visible in issue actions<br>• Or in test section | ✅ Completed | P0 |
| TCG-002 | Generate from Story | Story with description | 1. Click "Generate Test Cases" | • AI analyzes story<br>• Test cases generated<br>• Steps included | ✅ Completed | P0 |
| TCG-003 | Generate from AC | Story with AC | 1. Click generate<br>2. Select "From Acceptance Criteria" | • One test per AC<br>• Given-When-Then format | ⏳ Pending | P0 |
| TCG-004 | View Generated Tests | Tests generated | 1. Review test list | • Test name<br>• Steps (Action, Expected)<br>• Test data suggested | ✅ Completed | P0 |
| TCG-005 | Edit Before Create | Tests generated | 1. Click on test<br>2. Modify steps | • Inline editing<br>• Add/remove steps | ⏳ Pending | P1 |
| TCG-006 | Create All Tests | Tests approved | 1. Click "Create All Tests" | • Test cases created<br>• Linked to story<br>• Appear in Test Cases page | ✅ Completed | P0 |
| TCG-007 | Create Selected Tests | Multiple tests shown | 1. Select 3 of 5 tests<br>2. Click "Create Selected" | • Only selected created<br>• Others discarded | ⏳ Pending | P1 |
| TCG-008 | Create with Suite | Tests generated | 1. Select existing suite<br>2. Create tests | • Tests added to suite | ⏳ Pending | P2 |
| TCG-009 | Negative Test Cases | Complex story | 1. Check "Include Negative Tests"<br>2. Generate | • Error scenarios included<br>• Edge cases covered | ⏳ Pending | P2 |
| TCG-010 | Bug to Test Case | Bug issue open | 1. Open resolved bug<br>2. Generate test | • Regression test created<br>• Prevents recurrence | ⏳ Pending | P2 |

---

## SECTION 8: 🏃 SPRINT AUTO-POPULATE (8 Tests)

### Component: `SprintAutoPopulateButton.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| SAP-001 | Auto-Populate Button | Sprint planning view | 1. Open sprint with capacity<br>2. Find "AI Populate" button | • Button visible in sprint header | ✅ Completed | P0 |
| SAP-002 | Trigger Auto-Populate | Sprint empty or partial | 1. Click "AI Suggest Issues" | • AI analyzes:<br>  - Sprint capacity<br>  - Backlog priority<br>  - Team velocity | ⏳ Pending | P0 |
| SAP-003 | View Suggestions | AI analyzed | 1. View suggestion panel | • Issues listed with points<br>• Total vs capacity shown<br>• Priority indicated | ⏳ Pending | P0 |
| SAP-004 | Accept All | Suggestions shown | 1. Click "Add All to Sprint" | • All issues moved to sprint<br>• Capacity updated | ⏳ Pending | P0 |
| SAP-005 | Select Individual | Suggestions shown | 1. Uncheck some issues<br>2. Click "Add Selected" | • Only selected added<br>• Others stay in backlog | ⏳ Pending | P1 |
| SAP-006 | Capacity Warning | Over capacity | 1. AI suggests issues exceeding capacity | • Warning shown<br>• "Over by X points"<br>• Can still proceed | ⏳ Pending | P1 |
| SAP-007 | Consider Dependencies | Linked issues in backlog | 1. Trigger populate | • Related issues suggested together<br>• Blockers identified | ⏳ Pending | P2 |
| SAP-008 | Team Balance | Multiple team members | 1. View suggestions | • Work balanced across team<br>• No one overloaded | ⏳ Pending | P2 |

---

## SECTION 9: 🔍 AI DUPLICATE DETECTION (10 Tests)

### Components: `DuplicateAlert.tsx`, `MergeIssuesModal.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| DUP-001 | Duplicate Alert on Create | Creating similar issue | 1. Enter title similar to existing<br>2. Continue creating | • Alert appears<br>• "Possible duplicate found"<br>• Link to existing issue | ✅ Completed | P0 |
| DUP-002 | View Similar Issues | Alert shown | 1. Click "View Similar" | • List of potential duplicates<br>• Similarity % shown<br>• Preview content | ✅ Completed | P0 |
| DUP-003 | Dismiss False Positive | Alert shown | 1. Click "Not a duplicate"<br>2. Continue creating | • Alert dismissed<br>• Issue created normally | ⏳ Pending | P0 |
| DUP-004 | Link as Duplicate | Duplicate confirmed | 1. Click "Link as Duplicate"<br>2. Select parent issue | • New issue linked<br>• Relationship: "duplicates"<br>• Both issues updated | ✅ Completed | P0 |
| DUP-005 | Merge Issues | Two duplicates exist | 1. Open merge modal<br>2. Select primary issue<br>3. Merge | • Comments combined<br>• Attachments merged<br>• Secondary closed | ⏳ Pending | P1 |
| DUP-006 | Bulk Duplicate Scan | Project with many issues | 1. Go to AI Features<br>2. Click "Scan for Duplicates" | • Full project scan<br>• List of potential duplicates<br>• Action buttons | ⏳ Pending | P1 |
| DUP-007 | Duplicate Report | Scan complete | 1. View duplicate report | • Grouped by similarity<br>• Highest matches first<br>• Export option | ⏳ Pending | P2 |
| DUP-008 | Auto-Link Setting | PMBot settings | 1. Enable "Auto-link duplicates"<br>2. Create duplicate | • Auto-linked without prompt<br>• Notification sent | ⏳ Pending | P2 |
| DUP-009 | Semantic Matching | Different wording | 1. Create: "Login button doesn't work"<br>2. Existing: "Sign in fails" | • Semantic match detected<br>• Not just keyword match | ⏳ Pending | P2 |
| DUP-010 | Exclude Closed Issues | Scanning | 1. Configure to exclude closed | • Only open issues compared | ⏳ Pending | P3 |

---

## SECTION 10: 📋 MEETING SCRIBE (10 Tests)

### Component: `MeetingScribeForm.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| SCR-001 | Meeting Scribe Load | On AI Features | 1. Click "Meeting Scribe" tab | • Input form visible<br>• Large text area<br>• Process button | ✅ Completed | P0 |
| SCR-002 | Paste Meeting Notes | Form ready | 1. Paste meeting transcript | • Text appears in area<br>• Character count shown | ✅ Completed | P0 |
| SCR-003 | Process Transcript | Notes pasted | 1. Click "Process Meeting" | • AI analyzes notes<br>• Loading indicator<br>• Results appear | ✅ Completed | P0 |
| SCR-004 | Action Items Extracted | Processed | 1. View Action Items section | • Tasks identified<br>• Assignees detected (if mentioned)<br>• Deadlines parsed | ✅ Completed | P0 |
| SCR-005 | Decisions Highlighted | Processed | 1. View Decisions section | • Key decisions listed<br>• Context preserved | ⏳ Pending | P1 |
| SCR-006 | Attendees Identified | Names in transcript | 1. View Attendees section | • Names extracted<br>• Roles if mentioned | ⏳ Pending | P2 |
| SCR-007 | Create Issues from Actions | Action items shown | 1. Select action items<br>2. Click "Create Issues" | • Issues created<br>• Linked to meeting<br>• Assignees set if detected | ✅ Completed | P0 |
| SCR-008 | Edit Before Create | Actions extracted | 1. Click on action item<br>2. Edit content | • Inline editing<br>• Change assignee | ⏳ Pending | P1 |
| SCR-009 | Save Meeting Summary | Processed | 1. Click "Save Summary" | • Summary saved<br>• Accessible later | ⏳ Pending | P2 |
| SCR-010 | Export Meeting Notes | Summary generated | 1. Click "Export" | • Markdown/PDF export<br>• Includes actions, decisions | ⏳ Pending | P3 |

---

## SECTION 11: 🎤 VOICE COMMANDS (20 Tests)

### Components: `VoiceAssistant/`, `VoiceEnhanced/`, `VoiceCommand/`

### 11.1 Voice Activation

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| VC-001 | Voice Button Visible | Issue detail open | 1. Open any issue<br>2. Look for microphone icon | • 🎤 button visible<br>• Tooltip: "Voice Assistant" | ⏳ Pending | P0 |
| VC-002 | Microphone Permission | First use | 1. Click voice button | • Browser permission dialog<br>• Allow microphone access | ⏳ Pending | P0 |
| VC-003 | Activate Listening | Permission granted | 1. Click voice button | • Listening indicator active<br>• Waveform animation<br>• "Listening..." text | ⏳ Pending | P0 |
| VC-004 | Voice Waveform | Listening active | 1. Speak | • Waveform responds to voice<br>• Visual feedback | ⏳ Pending | P1 |
| VC-005 | Cancel Voice | Listening active | 1. Click X or cancel button | • Listening stops<br>• No action taken<br>• Returns to normal | ⏳ Pending | P0 |

### 11.2 Issue Update Commands

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| VC-006 | Command: Change Status | Issue open, listening | 1. Say: "Change status to in progress" | • Command recognized<br>• Preview shown<br>• Status changes on confirm | ⏳ Pending | P0 |
| VC-007 | Command: Set Priority | Issue open, listening | 1. Say: "Set priority to high" | • Priority updated<br>• Confirmation message | ⏳ Pending | P0 |
| VC-008 | Command: Assign User | Issue open, listening | 1. Say: "Assign to John" or "Assign to me" | • Assignee set<br>• User found by name | ⏳ Pending | P0 |
| VC-009 | Command: Add Comment | Issue open, listening | 1. Say: "Add comment working on this now" | • Comment added<br>• Text transcribed | ⏳ Pending | P0 |
| VC-010 | Command: Set Story Points | Story open, listening | 1. Say: "Set story points to 5" | • Points updated | ⏳ Pending | P1 |
| VC-011 | Command: Add Label | Issue open, listening | 1. Say: "Add label frontend" | • Label added or created | ⏳ Pending | P1 |

### 11.3 Navigation Commands

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| VC-012 | Command: Navigate | App active, listening | 1. Say: "Go to backlog" | • Navigation occurs<br>• Backlog page loads | ⏳ Pending | P1 |
| VC-013 | Command: Go to Issue | listening | 1. Say: "Open issue PROJ-45" | • Issue detail opens | ⏳ Pending | P1 |
| VC-014 | Command: Search | listening | 1. Say: "Search for login bug" | • Search executed<br>• Results shown | ⏳ Pending | P1 |

### 11.4 Create Commands

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| VC-015 | Command: Create Bug | listening | 1. Say: "Create new bug login button doesn't work" | • Bug created<br>• Title from speech | ⏳ Pending | P1 |
| VC-016 | Command: Create Task | listening | 1. Say: "Create task review pull request" | • Task created | ⏳ Pending | P1 |

### 11.5 Voice Intelligence

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| VC-017 | Command Preview | Command spoken | 1. Speak command | • Preview shows before apply<br>• Can confirm or cancel | ⏳ Pending | P0 |
| VC-018 | Confidence Indicator | Command spoken | 1. View confidence bar | • Green = high confidence<br>• Yellow = medium<br>• Red = low, ask to repeat | ⏳ Pending | P1 |
| VC-019 | Unknown Command | Unclear speech | 1. Mumble something | • "Sorry, I didn't understand"<br>• Suggestions shown<br>• Retry option | ⏳ Pending | P1 |
| VC-020 | Batch Command | listening | 1. Say: "Mark as done and assign to me" | • Multiple actions<br>• Both executed | ⏳ Pending | P2 |

---

## SECTION 12: 🗣️ VOICE DESCRIPTION (10 Tests)

### Components: `VoiceDescriptionButton.tsx`, `VoiceDescriptionModal.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| VD-001 | Voice Button in Description | Editing description | 1. Click edit on description<br>2. Find voice icon | • 🎤 icon near description field | ⏳ Pending | P0 |
| VD-002 | Open Voice Modal | Button visible | 1. Click voice icon | • Modal opens<br>• Large recording interface<br>• Instructions shown | ⏳ Pending | P0 |
| VD-003 | Start Recording | Modal open | 1. Click "Start Recording" | • Recording begins<br>• Timer running<br>• Waveform active | ⏳ Pending | P0 |
| VD-004 | Stop Recording | Recording active | 1. Click "Stop" | • Recording stops<br>• Audio processed<br>• Text transcription shown | ⏳ Pending | P0 |
| VD-005 | Preview Transcription | Recording stopped | 1. Review transcribed text | • Text displayed<br>• Can play back audio<br>• Edit if needed | ⏳ Pending | P0 |
| VD-006 | Insert into Description | Text ready | 1. Click "Insert" | • Text added to description<br>• Modal closes<br>• Can continue editing | ⏳ Pending | P0 |
| VD-007 | Append to Existing | Description has content | 1. Record voice<br>2. Insert | • Appends to existing<br>• Doesn't replace | ⏳ Pending | P1 |
| VD-008 | Edit Before Insert | Transcription shown | 1. Click on text<br>2. Make edits | • Inline editing works<br>• Changes preserved | ⏳ Pending | P1 |
| VD-009 | Re-record | Poor transcription | 1. Click "Record Again" | • Previous discarded<br>• New recording starts | ⏳ Pending | P1 |
| VD-010 | Long Recording | 2+ minute recording | 1. Speak for over 2 minutes | • Recording handles long duration<br>• Full transcription | ⏳ Pending | P2 |

---

## SECTION 13: ⚠️ PREDICTIVE ALERTS (8 Tests)

### Component: `PredictiveAlertsWidget.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| PA-001 | Alerts Widget Visible | Dashboard loaded | 1. View dashboard<br>2. Look for alerts widget | • Alert cards visible (if any)<br>• Or empty state | ⏳ Pending | P0 |
| PA-002 | Velocity Warning | Sprint behind pace | 1. Trigger velocity alert | • "Velocity Declining" alert<br>• Severity indicated<br>• Action button | ⏳ Pending | P0 |
| PA-003 | Workload Alert | Uneven distribution | 1. One member overloaded | • "Workload Imbalance" alert<br>• Affected member shown | ⏳ Pending | P0 |
| PA-004 | Deadline Risk | Issue past due | 1. Have overdue issues | • "Deadline Risk" alert<br>• Issues listed | ⏳ Pending | P0 |
| PA-005 | Quality Alert | Many bugs | 1. Bug count increases | • "Quality Concern" alert<br>• Bug pattern identified | ⏳ Pending | P1 |
| PA-006 | Dismiss Alert | Alert shown | 1. Click X on alert | • Alert dismissed<br>• Doesn't reappear (for period) | ⏳ Pending | P1 |
| PA-007 | Alert Action | Alert with action | 1. Click action button | • Navigates to fix<br>• Issue opened<br>• Or modal for bulk fix | ⏳ Pending | P1 |
| PA-008 | Alert Refresh | Alerts visible | 1. Wait or trigger refresh | • Alerts update<br>• New alerts appear<br>• Resolved alerts disappear | ⏳ Pending | P2 |

---

## SECTION 14: 🤝 AI COPILOT (8 Tests)

### Component: `AICopilot.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| COP-001 | Copilot Toggle | Issue detail open | 1. Find Copilot toggle/panel | • Copilot can be activated<br>• Panel slides in | ✅ Completed | P0 |
| COP-002 | Contextual Suggestions | Copilot active | 1. View while editing issue | • Suggestions appear<br>• Context-aware tips | ⏳ Pending | P0 |
| COP-003 | Apply Suggestion | Suggestion shown | 1. Click on suggestion | • Content applied<br>• E.g., better description | ✅ Completed | P0 |
| COP-004 | Dismiss Suggestion | Suggestion shown | 1. Click dismiss | • Suggestion hidden<br>• New ones can appear | ⏳ Pending | P1 |
| COP-005 | Ask Copilot | Copilot active | 1. Type question<br>2. Submit | • AI responds<br>• Helpful answer | ⏳ Pending | P1 |
| COP-006 | Copilot for Description | Writing description | 1. Pause typing | • Copilot suggests completion<br>• Tab to accept | ⏳ Pending | P2 |
| COP-007 | Copilot Learning | Multiple uses | 1. Accept/reject suggestions | • Suggestions improve<br>• Learns preferences | ⏳ Pending | P3 |
| COP-008 | Disable Copilot | Copilot active | 1. Toggle off Copilot | • Copilot deactivated<br>• No more suggestions | ⏳ Pending | P1 |

---

## SECTION 15: 📧 EMAIL-TO-ISSUE AI (6 Tests)

### Component: `EmailIntegrationPanel.tsx`

| ID | Test Name | Pre-conditions | Steps | Expected Result | Status | Priority |
|----|-----------|----------------|-------|-----------------|--------|----------|
| ETI-001 | Email Integration Panel | On settings or AI page | 1. Find Email Integration | • Panel visible<br>• Configuration options | ⏳ Pending | P0 |
| ETI-002 | Configure Email | Panel open | 1. Enter email settings<br>2. Test connection | • Connection tested<br>• Success/failure shown | ⏳ Pending | P0 |
| ETI-003 | Process Email | Email received | 1. System receives email | • Email parsed<br>• Issue created<br>• Sender notified | ⏳ Pending | P0 |
| ETI-004 | AI Field Extraction | Email processed | 1. View created issue | • Title from subject<br>• Description from body<br>• Priority detected<br>• Type inferred | ⏳ Pending | P0 |
| ETI-005 | Manual Review Queue | Uncertain email | 1. View review queue | • Low-confidence emails listed<br>• Manual confirmation | ⏳ Pending | P1 |
| ETI-006 | Reply Integration | Issue replied to | 1. Reply to issue email | • Reply becomes comment | ⏳ Pending | P2 |

---

## 📊 TEST EXECUTION CHECKLIST

### Priority Order

| Order | Section | Tests | Est. Time | Priority |
|-------|---------|-------|-----------|----------|
| 1 | Voice Commands Core | VC-001 to VC-005 | 30 min | 🔴 Critical |
| 2 | Voice Issue Updates | VC-006 to VC-011 | 45 min | 🔴 Critical |
| 3 | AI Auto-Assignment | AAG-001 to AAG-005 | 30 min | 🔴 Critical |
| 4 | Bug AI Analysis | BUG-001 to BUG-008 | 45 min | 🔴 Critical |
| 5 | PMBot Dashboard | PMB-001 to PMB-012 | 40 min | 🟠 High |
| 6 | Voice Description | VD-001 to VD-010 | 40 min | 🟠 High |
| 7 | AI Story Generator | STY-001 to STY-010 | 35 min | 🟠 High |
| 8 | Test Case Generator | TCG-001 to TCG-010 | 35 min | 🟠 High |
| 9 | Predictive Alerts | PA-001 to PA-008 | 30 min | 🟠 High |
| 10 | Auto-Tagging | TAG-001 to TAG-008 | 25 min | 🟡 Medium |
| 11 | Smart Priority | PRI-001 to PRI-008 | 25 min | 🟡 Medium |
| 12 | Sprint Auto-Populate | SAP-001 to SAP-008 | 30 min | 🟡 Medium |
| 13 | Duplicate Detection | DUP-001 to DUP-010 | 35 min | 🟡 Medium |
| 14 | Meeting Scribe | SCR-001 to SCR-010 | 30 min | 🟡 Medium |
| 15 | AI Copilot | COP-001 to COP-008 | 25 min | 🟢 Low |
| 16 | Email-to-Issue | ETI-001 to ETI-006 | 25 min | 🟢 Low |
| 17 | Voice Navigation | VC-012 to VC-016 | 25 min | 🟢 Low |
| 18 | Voice Intelligence | VC-017 to VC-020 | 20 min | 🟢 Low |
| **TOTAL** | | **140 Tests** | **~9.5 hours** | |

---

## ✅ SUCCESS CRITERIA

| Metric | Target | Notes |
|--------|--------|-------|
| Voice Recognition Accuracy | > 90% | Clear speech in quiet environment |
| AI Suggestion Acceptance Rate | > 70% | Users find suggestions helpful |
| AI Response Time | < 3 seconds | Time from trigger to result |
| False Positive Rate (Duplicates) | < 10% | Incorrect duplicate alerts |
| Voice Command Success Rate | > 85% | Commands correctly executed |
| AI Auto-Assignment Accuracy | > 80% | Correct assignee suggested |

---

## 🛠️ TROUBLESHOOTING GUIDE

### Voice Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Microphone not detected | Permission denied | Check browser permissions |
| Poor transcription | Background noise | Use in quiet environment |
| Commands not recognized | Speaking too fast | Speak clearly and slowly |
| No response | API timeout | Check internet connection |

### AI Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| "AI unavailable" | API key invalid | Check CEREBRAS_API_KEY |
| Slow responses | API rate limiting | Wait and retry |
| Poor suggestions | Insufficient data | Need more historical data |
| AI panel not showing | Feature disabled | Check PMBot settings |

---

## 📝 NOTES FOR TESTERS

1. **Voice Testing Environment**
   - Use headphones to prevent feedback
   - Test in quiet room
   - Chrome browser recommended
   - Allow 2-3 second pause after speaking

2. **AI Testing Data**
   - Ensure project has 20+ completed issues
   - Have 3+ team members for assignment testing
   - Previous sprints needed for velocity analysis

3. **Recording Test Evidence**
   - Screen record voice tests
   - Capture AI suggestions before accepting
   - Note confidence levels

---

*Document maintained by: QA Team*  
*Last Updated: January 7, 2026*  
*Next Review: January 14, 2026*
