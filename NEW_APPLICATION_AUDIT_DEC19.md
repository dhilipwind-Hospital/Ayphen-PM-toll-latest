# 🐛 NEW COMPREHENSIVE APPLICATION AUDIT - DEC 19
**Focus**: Architecture, UX Consistency, and Functional Gaps

## 🏗️ 1. ARCHITECTURAL DEBT: Hardcoded URLs & Direct Axios Usage
These issues bypass the centralized `api` service, making the app fragile to environment changes (e.g., local dev vs production).

| # | Component/File | Issue | Recommended Fix |
|---|----------------|-------|-----------------|
| A1 | `AdvancedSearchView.tsx` | Hardcoded `https://ayphen-pm-toll-latest.onrender.com/api` | Migrate to `api` service. |
| A2 | `TeamChatEnhanced.tsx` | Hardcoded `WS_URL` and `io` connection | Use `BASE_URL` from `api.ts`. |
| A3 | `VoiceAssistant.tsx` | Hardcoded endpoint for voice processing | Migrate to `api` service. |
| A4 | `PredictiveAlertsWidget.tsx` | Multiple hardcoded URLs | Migrate to `api` service. |
| A5 | `ManualTestCases.tsx` | Direct calls to `/manual-test-cases` | Add to `services/api.ts`. |
| A6 | `RoadmapView.tsx` | Mix of hardcoded and api service | Standardize on `api` service. |
| A7 | `AuthContext.tsx` | Hardcoded `API_URL` for auth | Use centralized service. |

## ⚠️ 2. UX & RELIABILITY: Silent Errors & Loading States
Many parts of the app "fail silently," leaving the user wondering why data isn't loading.

| # | Component | Issue | Recommended Fix |
|---|-----------|-------|-----------------|
| U1 | `ManualTestCases.tsx` | Catch block silently sets empty array | Add `message.error` notification. |
| U2 | `AdvancedSearchView.tsx` | Search export button has no loading state | Add `exporting` state. |
| U3 | `ProjectSettingsView.tsx` | Broad switch-case loading with no fallback | Add granular error states for each tab. |
| U4 | `BoardSettings.tsx` | Save button has no loading state if API call involved | Add loading state. |
| U5 | `BacklogView.tsx` | In-line edit failures for summary not shown to user | Add toast message on blur save failure. |

## 🧩 3. FUNCTIONAL GAPS: "Dead" Buttons & UI Inconsistencies
UI elements that don't trigger actions or behave unexpectedly.

| # | Area | Issue | Priority |
|---|------|-------|----------|
| F1 | `BoardSettings.tsx` | "Board Name" and "Show Empty Columns" are not persisted to backend/store. | Medium |
| F2 | `AdvancedSearchView.tsx` | Saved filters use `localStorage` instead of user-profile API. | Medium |
| F3 | `AllReportsView.tsx` | Several report cards are placeholders with no data hooks. | High |
| F4 | `IssueDetailPanel.tsx` | Subtask deletion has no confirmation. | Medium |
| F5 | `ProjectSettingsView.tsx` | "Add Member" modal doesn't validate if user exists before submit. | Medium |
| F6 | `VoiceAssistant.tsx` | Assistant continues listening even when tab is blurred. | Low |

## 🎨 4. VISUAL & STYLE: Inconsistency Audit
| # | Issue | File/Area |
|---|-------|-----------|
| S1 | Mixed Icon Libraries | Mixing `AntD Icons` with `Lucide-React`. Standardizing on Lucide is preferred for modern feel. |
| S2 | Color Inconsistency | Primary blue shades vary between `#1890ff` (AntD default) and custom brand blues. |
| S3 | Scrollbar Styling | Native scrollbars in some panels vs themed scrollbars in others. |
| S4 | Font Scaling | Tab headers in IssueDetail are larger than main navigation items. |

---

## 📅 ACTION PLAN (PHASE 1)
1.  **Centralize Communications**: Bulk refactor all hardcoded URLs to use `api` service.
2.  **User Feedback Protocol**: Update all `catch` blocks to include `message.error`.
3.  **Persist Board Settings**: Update Board store and API to handle the name and visibility flags.
4.  **Audit Team Chat**: Ensure Socket.io connection uses the correct centralized URL.
