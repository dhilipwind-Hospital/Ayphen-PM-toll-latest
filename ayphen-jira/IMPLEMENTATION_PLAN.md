# Ayphen Implementation & Remediation Plan

**Based on:** `APPLICATION_COMPREHENSIVE_REVIEW.md`
**Start Date:** Immediately
**Target Completion:** 6 Weeks

---

## Phase 1: Critical Security & Infrastructure Hardening (Week 1)
**Goal:** mitigate all critical vulnerabilities and prevent data loss risks.

### 1.1 Credential & Secret Management
- [ ] **Audit Secrets:** Remove all `.env` files from git history (using BFG Repo-Cleaner or git filter-branch).
- [ ] **Rotate Keys:** Generate new API keys for Cerebras, SendGrid, and Database.
- [ ] **Environment Config:** Set up Vercel and Render environment variables properly.
- [ ] **Sanitization:** Ensure no secrets are hardcoded in source files (check `socketService.ts`, `chat-enhanced.ts`).

### 1.2 Authentication Enforcement
- [ ] **Middleware:** Create `auth.middleware.ts` using `jsonwebtoken`.
    - Verify `Authorization: Bearer <token>` header.
    - Validate session/token against Redis or JWT signature.
- [ ] **Route Protection:** Apply middleware to ALL routes in `src/routes/`.
    - Remove reliance on `req.query.userId`.
    - Extract `userId` securely from the validated token.
- [ ] **Token Standardization:**
    - Update frontend `api.ts` to send `sessionId` in headers.
    - Update backend to expect consistent header format.

### 1.3 Database Stability
- [ ] **Disable Synchronize:** Set `synchronize: false` in `database.ts`.
- [ ] **Migrations Setup:** Initialize TypeORM migrations.
    - Generate initial migration from current schema.
    - Create scripts for `npm run migration:generate` and `npm run migration:run`.

---

## Phase 2: Core Integration & Data Integrity (Week 2)
**Goal:** Ensure the application works reliably and data flows correctly between FE/BE.

### 2.1 Frontend-Backend Handshake
- [ ] **Fix Token Mismatch:** Refactor `AuthContext.tsx` and `api.ts` to use a single `TOKEN_KEY` constant.
- [ ] **Standardize Errors:**
    - Create `AppError` class on backend.
    - Update Axios interceptor on frontend to handle 401/403 globally (redirect to login).

### 2.2 Functional Fixes
- [ ] **Race Conditions:** Fix "Key Generation" logic (`PROJ-123`) to use database sequences or transactional locks.
- [ ] **Input Validation:** Add `class-validator` DTOs for Issue creation and updates to prevent XSS/bad data.

### 2.3 Real-Time Reliability
- [ ] **Socket Handler:** Update frontend `socketService.ts` to handle:
    - `issue.updated` -> Update specific item in Zustand store.
    - `sprint.updated` -> Refresh Board view.
- [ ] **Connection:** Ensure socket re-connects silently with new auth token if session refreshes.

---

## Phase 3: AI Persistence & Testing (Week 3-4)
**Goal:** Make "Demo" features production-ready and ensure stability.

### 3.1 AI Feature Completion
- [ ] **PMBot Logging:**
    - Create `PMBotLog` entity.
    - Update `PMBotService` to write actions to DB.
    - Update `PMBotDashboard` to query real data.
- [ ] **Meeting Scribe:**
    - Enhance error handling for transcript processing.
    - persist "Meeting Minutes" as a new entity type or page.

### 3.2 Testing Suite Implementation
- [ ] **Backend Tests:**
    - Install `jest` + `supertest`.
    - Write unit tests for `AuthService` and `IssueService`.
    - Write integration tests for `/api/issues` endpoints.
- [ ] **Frontend Tests:**
    - Set up `React Testing Library`.
    - Write tests for "Critical Path" components (Login, Board Column, Issue Card).

---

## Phase 4: Polish & Performance (Week 5-6)
**Goal:** Optimization and professional standards.

### 4.1 Performance
- [ ] **Indexing:** Add indices to `projectId`, `assigneeId`, `status` columns in Postgres.
- [ ] **Bundle:** Analyze Vite bundle size and implement code splitting (lazy loading for `Admin` or `Analytics` pages).

### 4.2 Documentation & Cleanup
- [ ] **API Docs:** Integrate Swagger/OpenAPI options in Express.
- [ ] **Cleanup:** Archive/Delete unused `.md` files in root.
- [ ] **Consolidation:** Merge documentation into a `/docs` folder structure.

---

## Action Plan Summary

| Week | Focus | Key Deliverable |
|------|-------|-----------------|
| **1** | **Security** | Secured API, Safe DB Config, Rotated Keys |
| **2** | **Stability** | Reliable Auth Handshake, Validated Inputs |
| **3** | **AI & Logs** | Working AI Dashboard, PMBot History |
| **4** | **Testing**| CI/CD Pipeline, Unit Tests |
| **5** | **Polish** | Faster Loads, Lazy Loading |
| **6** | **Docs** | Swagger API, Final Release |
