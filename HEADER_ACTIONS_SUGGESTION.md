# Header Actions - Back Button & Copy Link Suggestion

## Current Situation

Looking at your screenshot, the issue detail view currently has:
- ✅ Issue key and title (KANBAN-1: Sign in)
- ✅ Description section
- ✅ Right sidebar with details
- ❌ No back navigation
- ❌ No way to copy issue link

## Suggested Solution

### Option A: Minimal Top Bar (RECOMMENDED) ⭐

Add a **very slim top bar** (32px height) with just essential actions:

```
┌────────────────────────────────────────────────────────────┐
│ ← Back                                    🔗 Copy Link  ×  │ ← 32px slim bar
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ KANBAN-1: Sign in                              [🎤 Voice]  │
│ Description...                                             │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- **← Back** button on the left (goes to previous page)
- **🔗 Copy Link** button on the right (copies issue URL)
- **× Close** button (for modal context)
- Ultra-minimal: only 32px height
- Transparent/glass background

---

### Option B: Integrated Title Bar

Put actions **inline with the issue title**:

```
┌────────────────────────────────────────────────────────────┐
│ ← KANBAN-1: Sign in                🔗 Copy Link  [🎤 Voice]│
└────────────────────────────────────────────────────────────┘
│ Description...                                             │
```

**Features:**
- Back button integrated with title
- Copy link next to voice button
- No separate header bar
- Most compact option

---

### Option C: Floating Action Buttons

Add **floating buttons** in the top-right corner:

```
┌────────────────────────────────────────────────────────────┐
│                                          [←] [🔗] [×]      │ ← Floating
│ KANBAN-1: Sign in                              [🎤 Voice]  │
│ Description...                                             │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Floating action buttons (FABs)
- Always visible, doesn't take vertical space
- Modern, clean look

---

## Detailed Implementation: Option A (Recommended)

### Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Board                          🔗 Copy Link    ×  │
└──────────────────────────────────────────────────────────────┘
  ↓ 16px gap
┌──────────────────────────────────────────────────────────────┐
│ [KANBAN-1] Sign in                              [🎤 Voice]   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Description...                                               │
└──────────────────────────────────────────────────────────────┘
```

### Component Structure

```typescript
<DetailContainer>
  {/* Minimal Action Bar */}
  <ActionBar>
    <LeftActions>
      <BackButton icon={<ArrowLeft />} onClick={handleBack}>
        Back to Board
      </BackButton>
    </LeftActions>
    
    <RightActions>
      <CopyLinkButton icon={<Link />} onClick={handleCopyLink}>
        Copy Link
      </CopyLinkButton>
      {onClose && (
        <CloseButton icon={<X />} onClick={onClose} />
      )}
    </RightActions>
  </ActionBar>
  
  {/* Main Content */}
  <MainContent>
    <IssueTitle>...</IssueTitle>
    <Description>...</Description>
  </MainContent>
</DetailContainer>
```

### Styling

```typescript
const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  min-height: 32px;
  max-height: 32px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
`;

const BackButton = styled(Button)`
  border: none;
  background: transparent;
  padding: 4px 12px;
  height: 28px;
  font-size: 13px;
  color: ${colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    color: ${colors.primary[600]};
    background: rgba(236, 72, 153, 0.1);
  }
`;

const CopyLinkButton = styled(Button)`
  border: 1px solid ${colors.glass.border};
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  height: 28px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: rgba(236, 72, 153, 0.1);
    border-color: ${colors.primary[600]};
    color: ${colors.primary[600]};
  }
`;
```

### Functionality

```typescript
// Back navigation
const handleBack = () => {
  navigate(-1); // Go to previous page
  // OR
  navigate('/board'); // Go to specific page
};

// Copy link to clipboard
const handleCopyLink = async () => {
  const url = window.location.href;
  // OR construct URL: const url = `${window.location.origin}/issue/${issue.key}`;
  
  try {
    await navigator.clipboard.writeText(url);
    message.success('Link copied to clipboard!');
  } catch (error) {
    message.error('Failed to copy link');
  }
};
```

---

## Comparison Table

| Feature | Option A (Slim Bar) | Option B (Inline) | Option C (Floating) |
|---------|---------------------|-------------------|---------------------|
| **Height** | 32px | 0px (inline) | 0px (overlay) |
| **Visibility** | Always visible | Always visible | Always visible |
| **Space Used** | Minimal | None | None |
| **Clarity** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Professional** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Easy to Find** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## Recommended Actions

### Essential Actions
1. **← Back** - Navigate to previous page
2. **🔗 Copy Link** - Copy issue URL to clipboard
3. **× Close** - Close modal (if applicable)

### Optional Actions (Can Add Later)
4. **⭐ Watch** - Subscribe to issue updates
5. **🔖 Bookmark** - Save to favorites
6. **📤 Share** - Share via email/Slack
7. **⚙️ More** - Dropdown with additional actions

---

## Implementation Priority

### Phase 1: Essential (Implement Now)
```typescript
<ActionBar>
  <BackButton>← Back</BackButton>
  <CopyLinkButton>🔗 Copy Link</CopyLinkButton>
  <CloseButton>×</CloseButton>
</ActionBar>
```

### Phase 2: Enhanced (Add Later)
```typescript
<ActionBar>
  <BackButton>← Back to Board</BackButton>
  <RightActions>
    <WatchButton>⭐ Watch</WatchButton>
    <CopyLinkButton>🔗 Copy Link</CopyLinkButton>
    <MoreButton>⚙️ More</MoreButton>
    <CloseButton>×</CloseButton>
  </RightActions>
</ActionBar>
```

---

## Visual Examples

### Minimal (32px)
```
┌────────────────────────────────────────────────────┐
│ ← Back              🔗 Copy Link  ×               │
└────────────────────────────────────────────────────┘
```

### With Labels (36px)
```
┌────────────────────────────────────────────────────┐
│ ← Back to Board     🔗 Copy Link  ⭐ Watch  ×     │
└────────────────────────────────────────────────────┘
```

### Icon Only (28px)
```
┌────────────────────────────────────────────────────┐
│ [←]                 [🔗] [⭐] [×]                 │
└────────────────────────────────────────────────────┘
```

---

## Benefits

### User Experience
- ✅ **Easy Navigation** - Quick back to previous page
- ✅ **Share Issues** - Copy link to share with team
- ✅ **Keyboard Shortcuts** - Esc to close, Cmd+K for actions
- ✅ **Familiar Pattern** - Matches Gmail, Notion, Linear

### Technical
- ✅ **Minimal Code** - Simple component
- ✅ **Reusable** - Works for all issue types
- ✅ **Performant** - No impact on page load
- ✅ **Accessible** - Keyboard navigable

---

## Keyboard Shortcuts (Bonus)

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Esc to close
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
    
    // Cmd/Ctrl + K to copy link
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      handleCopyLink();
    }
    
    // Alt + Left Arrow to go back
    if (e.altKey && e.key === 'ArrowLeft') {
      handleBack();
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## My Recommendation

**Implement Option A: Minimal Top Bar (32px)**

**Why?**
1. ✅ **Clear & Visible** - Users immediately see navigation options
2. ✅ **Professional** - Matches enterprise UIs (Jira, Linear, Notion)
3. ✅ **Minimal Space** - Only 32px, barely noticeable
4. ✅ **Extensible** - Easy to add more actions later
5. ✅ **Consistent** - Same pattern across all issue types

**What to Include:**
- **Left:** ← Back button
- **Right:** 🔗 Copy Link + × Close (if modal)

**Total Height:** 32px + 16px margin = 48px
**Space Trade-off:** Worth it for better UX!

---

## Code to Implement

```typescript
// Add to IssueDetailPanel.tsx and EpicDetailView.tsx

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  min-height: 32px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
`;

// In render:
<DetailContainer>
  <ActionBar>
    <Button icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
      Back
    </Button>
    <div style={{ display: 'flex', gap: 8 }}>
      <Button 
        icon={<Link size={14} />} 
        onClick={async () => {
          await navigator.clipboard.writeText(window.location.href);
          message.success('Link copied!');
        }}
      >
        Copy Link
      </Button>
      {onClose && <Button icon={<X size={14} />} onClick={onClose} />}
    </div>
  </ActionBar>
  
  {/* Rest of content */}
</DetailContainer>
```

---

**Ready to implement?** This will give you a clean, professional header with essential navigation and sharing functionality!
