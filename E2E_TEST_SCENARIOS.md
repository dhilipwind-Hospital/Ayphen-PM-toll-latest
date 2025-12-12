# 🧪 E2E COMPREHENSIVE TEST SCENARIOS (500+)

This document contains a comprehensive list of 500+ End-to-End (E2E) test scenarios covering the entire Ayphen Jira application, organized by module.

---

## 🔐 1. Authentication & User Management (50 Tests)

### **Registration & Onboarding**
1.  Verify user can register with a valid email and strong password.
2.  Verify user cannot register with an existing email address.
3.  Verify registration fails with a weak password (e.g., < 8 chars).
4.  Verify registration fails when passwords do not match.
5.  Verify invalid email format is rejected during registration.
6.  Verify successful email verification flow after registration.
7.  Verify user is redirected to Onboarding wizard after first login.
8.  Verify "Skip Onboarding" functionality works.
9.  Verify user can complete the onboarding steps (Role, Team size).
10. Verify default project is created if selected during onboarding.

### **Login & Access**
11. Verify user can login with valid credentials.
12. Verify login fails with incorrect password.
13. Verify login fails with non-existent email.
14. Verify "Remember Me" keeps user logged in after page refresh.
15. Verify session timeout logs user out automatically.
16. Verify user can log out successfully.
17. Verify accessing protected route redirects to login page.
18. Verify user cannot access login page if already authenticated.
19. Verify account lockout after N failed login attempts.
20. Verify OAuth/SSO login (Google/GitHub) if enabled.

### **Password Management**
21. Verify "Forgot Password" sends reset link to email.
22. Verify user can reset password using a valid token.
23. Verify password reset fails with expired/invalid token.
24. Verify user can change password from Profile settings.
25. Verify changing password requires current password verification.

### **User Profile & Settings**
26. Verify user can update profile picture (avatar upload).
27. Verify user can update display name and job title.
28. Verify user can update contact information.
29. Verify changes to profile reflect across the app (comments, header).
30. Verify user can switch application theme (Light/Dark mode).
31. Verify notification preferences can be updated.
32. Verify user can delete their own account (if allowed).
33. Verify user can download their personal data (GDPR).

### **Team & Members**
34. Verify admin can invite new team member via email.
35. Verify invited user receives invitation email.
36. Verify invited user can accept invitation and join organization.
37. Verify admin can revoke a pending invitation.
38. Verify admin can resend a pending invitation.
39. Verify admin can remove a member from the organization.
40. Verify admin can change a member's role (Member -> Admin).
41. Verify user can view list of all team members (`PeoplePage.tsx`).
42. Verify filtering team members by name or role.
43. Verify user can view another user's public profile.
44. Verify team capacity/availability settings.
45. Verify creating a new Team group.
46. Verify adding members to a Team group.
47. Verify removing members from a Team group.
48. Verify renaming a Team.
49. Verify user cannot perform admin actions as a standard member.
50. Verify audit log records user additions/removals.

---

## 📁 2. Project Management (40 Tests)

### **Create & Manage Projects**
51. Verify user can create a new "Scrum" project.
52. Verify user can create a new "Kanban" project.
53. Verify user can create a new "Bug Tracking" project.
54. Verify project key is auto-generated based on project name.
55. Verify project key can be manually overridden during creation.
56. Verify project key validation (unique, limits).
57. Verify default avatar is assigned to new project.
58. Verify user can upload custom project avatar.
59. Verify user can edit project name and description.
60. Verify user can change project category.
61. Verify user can change project lead.
62. Verify user can archive a project.
63. Verify archived project is read-only.
64. Verify user can restore an archived project.
65. Verify user can delete a project permanently.
66. Verify deleting a project also deletes associated issues (or warns).

### **Project Settings**
67. Verify admin can add members to a specific project.
68. Verify admin can remove members from a project.
69. Verify admin can assign specific roles (Viewer, Editor, Admin) in project.
70. Verify "Viewer" role cannot create or edit issues.
71. Verify project-specific notification settings.
72. Verify project-specific workflow configuration.
73. Verify project-specific issue type configuration.
74. Verify project-specific custom fields.

### **Project Exploration**
75. Verify viewing list of all projects (`ProjectsView.tsx`).
76. Verify filtering projects by type (Scrum/Kanban).
77. Verify searching projects by name or key.
78. Verify "Star" (favorite) a project links it in the sidebar.
79. Verify "Recent Projects" list updates correctly.
80. Verify accessing a non-existent project ID returns 404.
81. Verify accessing a project user is not a member of returns 403.
82. Verify project overview/summary page loads correctly.
83. Verify "Activity Feed" on project dashboard shows recent updates.
84. Verify project roadmap is visible (if enabled).
85. Verify project statistics (Issue count, completed) are accurate.
86. Verify quick creating an issue from project list.
87. Verify import project data from CSV/Jira.
88. Verify export project data to JSON/CSV.
89. Verify project specific Time Tracking settings.
90. Verify project automation rules access.

---

## 🎫 3. Issue Tracking (80 Tests)

### **Create Issues**
91.  Verify creating a "Story" issue with required fields.
92.  Verify creating a "Bug" issue with required fields.
93.  Verify creating an "Epic" issue with required fields.
94.  Verify creating a "Task" issue with required fields.
95.  Verify creating a "Subtask" under a parent issue.
96.  Verify "Create Another" checkbox keeps modal open.
97.  Verify issue creation fails if summary is missing.
98.  Verify linking an issue to an Epic during creation.
99.  Verify assigning a Sprint during creation.
100. Verify assigning a user during creation.
101. Verify attaching a file during issue creation.
102. Verify setting priority (Highest, High, Medium, Low, Lowest).
103. Verify estimating Story Points during creation.
104. Verify Labels auto-complete during creation.
105. Verify description supports markdown rendering.

### **Edit & View Issues**
106. Verify issue details page loads correctly (`IssueDetailView.tsx`).
107. Verify inline editing of Issue Summary.
108. Verify inline editing of Issue Description.
109. Verify changing status via dropdown (Transition).
110. Verify changing Assignee via dropdown.
111. Verify changing Reporter via dropdown.
112. Verify changing Priority updates the icon/color.
113. Verify adding a new Label to existing issue.
114. Verify removing a Label from existing issue.
115. Verify updating Story Points.
116. Verify updating Original Estimate (Time).
117. Verify logging work (Time Tracking modal).
118. Verify viewing Work Log history.
119. Verify "Assigned to Me" quick action.
120. Verify "Watch/Unwatch" issue functionality.
121. Verify "Vote/Unvote" issue functionality.

### **Issue Links & Hierarchy**
122. Verify linking two issues with "Blocks" relationship.
123. Verify linking two issues with "Relates to" relationship.
124. Verify removing an issue link.
125. Verify viewing linked issues list in detail panel.
126. Verify Epic link shows up in breadcrumbs.
127. Verify Parent issue shows up in Subtask breadcrumbs.
128. Verify creating a Subtask from Parent details view.
129. Verify Subtask progress bar on Parent issue updates.
130. Verify converting a Task to a Bug.
131. Verify converting a Subtask to a standard Task.
132. Verify cloning/duplicating an issue.
133. Verify moving an issue to a different project.

### **Attachments & Comments**
134. Verify uploading an image attachment.
135. Verify uploading a PDF/Doc attachment.
136. Verify previewing an image attachment.
137. Verify deleting an attachment.
138. Verify posting a text comment.
139. Verify posting a comment with mentions (@user).
140. Verify editing a self-posted comment.
141. Verify deleting a self-posted comment.
142. Verify admin can delete any comment.
143. Verify emoji reactions on comments.
144. Verify attachment size limits are enforced.

### **History & Deletion**
145. Verify "History" tab shows field changes.
146. Verify "History" shows status transitions.
147. Verify "History" shows assignment changes.
148. Verify deleting an issue moves it to trash/archives (if applicable) or permanent delete.
149. Verify warning prompt before deleting issue.
150. Verify deleting an Epic warns about child issues.

### **Advanced Issue Features**
151. Verify AI-generated description works.
152. Verify Voice Input for description works.
153. Verify Voice Assistant command execution ("Assign to me").
154. Verify flagging an issue (Impediment).
155. Verify un-flagging an issue.
156. Verify printing issue details (Print view).
157. Verify sharing issue via email/link.
158. Verify keyboard shortcuts (c to create, e to edit).
159. Verify bulk editing issues (Assignee/Status).
160. Verify bulk moving issues.
161. Verify bulk deleting issues.
162. Verify issue template selection fills fields fields.
163. Verify creating a new issue template.
164. Verify deleting an issue template.
165. Verify dependency visualization (if graph view exists).
166. Verify "Development" panel shows linked commits/PRs (if integrated).
167. Verify date picker for Due Date updates correctly.
168. Verify color coding for overdue issues.
169. Verify rich text editor toolbar functions (Bold, Italic, List).
170. Verify pasting image directly from clipboard into description.

---

## 📋 4. Board & Backlog (60 Tests)

### **Backlog Management**
171. Verify Backlog View loads correctly.
172. Verify issues in Backlog are ordered by rank.
173. Verify dragging issue to reorder in Backlog.
174. Verify dragging issue from Backlog to Sprint.
175. Verify dragging issue from Sprint to Backlog.
176. Verify "Create Issue" inline in Backlog.
177. Verify clicking issue in Backlog opens detail view.
178. Verify backlog count updates correctly.
179. Verify filtering Backlog by Assignee (User avatar).
180. Verify filtering Backlog by Epic.
181. Verify filtering Backlog by Label.
182. Verify "Epics" panel toggle in Backlog.
183. Verify "Versions" panel toggle in Backlog.
184. Verify dragging issue onto Epic panel to link it.
185. Verify dragging issue onto Version panel to assign fix version.

### **Board Functionality**
186. Verify Board View loads correctly.
187. Verify columns match workflow statuses.
188. Verify creating a new column in Board.
189. Verify deleting a column in Board.
190. Verify renaming a column in Board.
191. Verify dragging issue between columns (Status update).
192. Verify dragging issue updates status in backend.
193. Verify lane constraints (WIP limits) warn user.
194. Verify "Swimlanes" grouping by Assignee.
195. Verify "Swimlanes" grouping by Epic.
196. Verify "Swimlanes" grouping by Subtasks.
197. Verify card layout configuration (Show/Hide fields).
198. Verify flagging an issue highlights it on Board.
199. Verify Board filters (My Issues, Recently Updated).
200. Verify clearing all board filters.
201. Verify Board Search filters cards instantly.
202. Verify dragging issue to "Done" triggers completion animation (confetti?).
203. Verify clicking issue key on card opens new tab/modal.

### **Scrum vs Kanban Logic**
204. Verify Scrum board ONLY shows active sprint issues.
205. Verify Scrum board shows empty state if no active sprint.
206. Verify Kanban board shows ALL issues (minus backlog if configured).
207. Verify Kanban board "Backlog" column behavior.
208. Verify moving issue to "Done" column in Scrum updates burn-down today.
209. Verify changing project type changes board capability.
210. Verify Scrum board "Complete Sprint" button visibility.
211. Verify Kanban board "Release" button visibility.
212. Verify subtasks appear on board (if configured).
213. Verify subtasks move with parent (if parent is swimlane).
214. Verify collapsing columns.
215. Verify expanding columns.
216. Verify Quick Filters affect both Board and Backlog.
217. Verify Board settings are persisted per user.
218. Verify Board background/theme customization.
219. Verify full-screen board mode.
220. Verify "Days in column" indicator.

### **Advanced Board Features**
221. Verify multi-select cards (Cmd+Click).
222. Verify bulk dragging cards.
223. Verify right-click context menu on card.
224. Verify "Send to Top" action.
225. Verify "Send to Bottom" action.
226. Verify user avatar presence on cards.
227. Verify priority icon presence on cards.
228. Verify issue type icon presence on cards.
229. Verify story points badge on cards.
230. Verify due date indicator on cards.

---

## 🏃 5. Sprint Management (40 Tests)

### **Sprint Planning**
231. Verify creating a new Sprint in Backlog view.
232. Verify Sprint name auto-increments (Sprint 1, Sprint 2).
233. Verify renaming a Sprint.
234. Verify setting Sprint Goal.
235. Verify setting Start and End dates for Sprint.
236. Verify deleting a Future Sprint.
237. Verify deleting an Active Sprint (fail or warn).
238. Verify moving all issues from one sprint to another.
239. Verify "Start Sprint" modal works.
240. Verify "Start Sprint" validation (must have issues).
241. Verify "Start Sprint" validation (dates required).
242. Verify Sprint status changes to "Active" after start.
243. Verify footer summary (Story Points) updates as issues added.

### **Active Sprint**
244. Verify Board header shows Active Sprint name.
245. Verify Board header shows Days Remaining.
246. Verify adding issue to Active Sprint warns about scope change.
247. Verify removing issue from Active Sprint.
248. Verify Sprint Burndown chart updates daily.
249. Verify completing a Sprint modal works.
250. Verify identifying incomplete issues on closure.
251. Verify option to move incomplete issues to Backlog.
252. Verify option to move incomplete issues to Next Sprint.
253. Verify Sprint report generates after completion.
254. Verify completed sprint moves to history.
255. Verify multiple active sprints (if parallel sprints enabled).

### **Sprint Reporting**
256. Verify Velocity Chart updates after sprint close.
257. Verify Sprint Report shows committed vs completed points.
258. Verify Sprint Report shows scope changes (added issues).
259. Verify Burndown Chart renders correctly.
260. Verify Cumulative Flow Diagram for sprint.
261. Verify Epic Burndown based on sprints.
262. Verify Release Burndown based on sprints.
263. Verify "Control Chart" calculations.
264. Verify viewing past Sprint details.
265. Verify exporting Sprint Report to PDF.
266. Verify average team velocity calculation.
267. Verify accessing Sprint Retrospective page.
268. Verify creating a Retrospective board.
269. Verify adding items to Retrospective columns.
270. Verify archiving Retrospective.

---

## 🤖 6. AI Features (60 Tests)

### **AI Writing & Analysis**
271. Verify "AI Generate Description" populates field based on summary.
272. Verify AI creates Acceptance Criteria from description.
273. Verify "Rephrase" text function works.
274. Verify "Make Professional" text function works.
275. Verify "Summarize" long comment thread.
276. Verify "Sentiment Analysis" on comments warns on negative tone.
277. Verify AI suggests suitable Labels for issue.
278. Verify AI suggests suitable Assignee based on history.
279. Verify AI suggests priority based on keywords (e.g., "Crash").
280. Verify AI duplicate detection warns during creation.

### **AI Test Generation**
281. Verify "Generate Test Cases" button on Story detail.
282. Verify AI generates valid test steps.
283. Verify AI generates expected results.
284. Verify user can review and edit generated test cases.
285. Verify saving generated test cases links them to Story.
286. Verify regenerating test cases overwrites or appends.
287. Verify generating negative test scenarios.
288. Verify generating edge case scenarios.
289. Verify generating automated script skeleton (if supported).
290. Verify AI suggests regression suite impact.

### **Voice Assistant**
291. Verify clicking Microphone icon activates listener.
292. Verify speaking "Create a bug called..." opens modal.
293. Verify speaking description text transcribes correctly.
294. Verify voice command "Assign to me".
295. Verify voice command "Set priority to High".
296. Verify voice command "Add comment...".
297. Verify voice command "Go to Board".
298. Verify voice command "Search for...".
299. Verify voice error handling (unrecognized command).
300. Verify voice feedback (TTS response).

### **Meeting Scribe & Chat**
301. Verify converting meeting notes to Issues.
302. Verify extracting action items from text block.
303. Verify AI Chatbot answers "What is the status of X?".
304. Verify AI Chatbot answers "Who is working on Y?".
305. Verify AI Chatbot answers "Show me high priority bugs".
306. Verify PM Bot auto-comment on stale issues.
307. Verify PM Bot reminders for due dates.
308. Verify AI Sprint Analysis report generation.
309. Verify AI Risk Prediction alert.
310. Verify AI Estimation suggestion.

### **Predictive Features**
311. Verify predictive alert for potential sprint overflow.
312. Verify predictive alert for missed due date.
313. Verify team mood tracking based on interaction.
314. Verify outlier detection in story estimation.
315. Verify auto-linking related issues based on semantic similarity.
316. Verify smart sort of backlog.
317. Verify auto-response suggestion for support tickets.
318. Verify resource bottleneck prediction.
319. Verify release date prediction.
320. Verify flaky test prediction.

---

## 🧪 7. Test Management (50 Tests)

### **Test Suites & Cases**
321. Verify creating a Test Suite folder.
322. Verify creating a Manual Test Case with steps.
323. Verify editing test steps and expected results.
324. Verify deleting a test case.
325. Verify moving test cases between suites.
326. Verify cloning a test case.
327. Verify linking a Test Case to a User Story.
328. Verify linking a Test Case to a Bug (regression).
329. Verify import Test Cases from CSV.
330. Verify export Test Cases to CSV/PDF.

### **Test Execution**
331. Verify creating a Test Cycle / Test Plan.
332. Verify adding Test Cases to a Cycle.
333. Verify executing a Test Run.
334. Verify marking step as "Passed".
335. Verify marking step as "Failed".
336. Verify marking step as "Blocked".
337. Verify attaching screenshot to failed step.
338. Verify creating a Bug directly from failed step.
339. Verify auto-filling Bug details from failed step.
340. Verify pausing a Test Run timer.
341. Verify resuming a Test Run timer.
342. Verify completing a Test Run.

### **Test Reporting**
343. Verify Test Execution status bar (Pass/Fail rate).
344. Verify viewing Test History for a case.
345. Verify Test Traceability Matrix (Requirement -> Test -> Defect).
346. Verify Test Coverage Report generation.
347. Verify Defect Distribution by TestCase.
348. Verify Test Execution Time report.
349. Verify User Workload for testers.
350. Verify sending Test Report via email.

### **Test Automation Integration**
351. Verify viewing automated test results (if CI linked).
352. Verify linking automated test to manual test case.
353. Verify auto-updating status based on CI webhook.
354. Verify flaky test marking.
355. Verify rerun failed tests action.
356. Verify test data management metrics.
357. Verify environment configuration for runs.
358. Verify version control for test cases.
359. Verify reviewing changes in test steps.
360. Verify bulk status update for test run.
361. Verify commenting on test run execution.
362. Verify viewing all bugs found in a cycle.
363. Verify detailed test run dashboard.
364. Verify filtering test runs by assignee.
365. Verify filtering test runs by status.
366. Verify sorting test cases by priority.
367. Verify required fields enforcement in test cases.
368. Verify precondition and postcondition fields.
369. Verify data-driven test case support (parameters).
370. Verify archiving old test cycles.

---

## 📊 8. Reporting & Dashboards (40 Tests)

### **Dashboard Management**
371. Verify creating a new blank Dashboard.
372. Verify viewing default System Dashboard.
373. Verify renaming a Dashboard.
374. Verify sharing a Dashboard (Public/Private/Team).
375. Verify deleting a Dashboard.
376. Verify changing Dashboard layout (1 col, 2 col, 3 col).
377. Verify starring a Dashboard.
378. Verify setting a Dashboard as Homepage.
379. Verify Dashboard loads efficiently with multiple gadgets.
380. Verify Dashboard refresh button.

### **Gadgets & Widgets**
381. Verify adding "Assigned to Me" gadget.
382. Verify adding "Activity Stream" gadget.
383. Verify adding "Sprint Health" gadget.
384. Verify adding "Created vs Resolved" chart.
385. Verify adding "Pie Chart" (Issues by Status).
386. Verify adding "Filter Results" gadget.
387. Verify adding "Two Dimensional Filter Statistics".
388. Verify adding "Roadmap" gadget.
389. Verify configuring gadget settings (e.g., source project).
390. Verify moving gadget position (drag & drop).
391. Verify removing a gadget.
392. Verify minimizing a gadget.
393. Verify gadget color customization.
394. Verify "Time Since" chart gadget.
395. Verify "Average Age" chart gadget.
396. Verify "Recently Created Issues" gadget.
397. Verify "Team Velocity" gadget on dashboard.
398. Verify "Burndown" gadget on dashboard.
399. Verify "Countdown" gadget.
400. Verify "Text/HTML" announcement gadget.

### **Advanced Reports**
401. Verify generating "Single Level Group By" report.
402. Verify generating "Time Tracking" report.
403. Verify generating "User Workload" report.
404. Verify generating "Resolution Time" report.
405. Verify generating "Pie Chart" report page.
406. Verify export report to Excel.
407. Verify printing report view.
408. Verify drilling down into report data (clicking segments).
409. Verify report permission (who can view).
410. Verify scheduled report emails.

---

## 🔍 9. Search & Filtering (30 Tests)

### **Basic & Advanced Search**
411. Verify Quick Search bar finds issue by KEY-123.
412. Verify Quick Search bar finds issue by Summary text.
413. Verify Quick Search bar finds Project by name.
414. Verify Advanced Search View loads correctly.
415. Verify searching by Assignee + Status + Priority.
416. Verify text search fuzzy matching.
417. Verify sorting search results by created date.
418. Verify sorting search results by updated date.
419. Verify sorting search results by rank.
420. Verify pagination of search results.

### **Saved Filters**
421. Verify saving a current search query.
422. Verify naming a saved filter.
423. Verify editing a saved filter query.
424. Verify sharing a filter with public/group.
425. Verify subscribing to a filter (email updates).
426. Verify deleting a saved filter.
427. Verify "My Filters" list.
428. Verify "Popular Filters" list.
429. Verify accessing Saved Filter from sidebar.
430. Verify applying Saved Filter on Board view.

### **Contextual Filters**
431. Verify filtering by specific component.
432. Verify filtering by specific release (FIX VERSION).
433. Verify filtering by "Issue Type" = "Bug".
434. Verify filtering by "Is Unassigned".
435. Verify filtering by "Created Date" range.
436. Verify filtering by "Updated Date" range.
437. Verify JQL-like autocomplete functionality.
438. Verify error handling for invalid JQL.
439. Verify "in" operator (status in ( Open, Done)).
440. Verify "not equals" operator.

---

## ⚙️ 10. Admin & Settings (30 Tests)

### **Workflow Editor**
441. Verify creating a new Workflow Scheme.
442. Verify adding a new Status to workflow.
443. Verify adding a Transition between statuses.
444. Verify configuring Transition Screen.
445. Verify deleting a Status (validation if used).
446. Verify graphical workflow viewer renders.
447. Verify activating a workflow draft.
448. Verify associating workflow with Issue Type.
449. Verify restricting transition to specific role.
450. Verify post-functions (e.g., auto-assign on move).

### **Custom Fields**
451. Verify creating a Text custom field.
452. Verify creating a Number custom field.
453. Verify creating a Select List custom field.
454. Verify creating a Date Picker custom field.
455. Verify creating a User Picker custom field.
456. Verify adding help text to custom field.
457. Verify making a custom field required.
458. Verify associating custom field with screens.
459. Verify deleting a custom field.
460. Verify reordering fields on Issue Create screen.

### **System Settings**
461. Verify general settings (Company Name, URL).
462. Verify default language/locale settings.
463. Verify announcement banner configuration.
464. Verify maintenance mode toggle.
465. Verify SMTP email server settings.
466. Verify viewing System Info (Version, DB).
467. Verify viewing Audit Logs for system changes.
468. Verify configuring Global Permissions.
469. Verify modifying default priorities.
470. Verify modifying default resolutions.

---

## 💬 11. Collaboration & Miscellaneous (30 Tests)

### **Team Chat & Real-time**
471. Verify sending message in Team Chat.
472. Verify receiving message in Team Chat (real-time).
473. Verify creating channel for specific project.
474. Verify direct messaging another user.
475. Verify file sharing in chat.
476. Verify notifications for @mentions in chat.
477. Verify presence indicators (Online/Away/Offline).
478. Verify linking issue in chat expands details.
479. Verify typing indicators.
480. Verify chat history persistence.

### **Notifications & Mentions**
481. Verify in-app notification bell count increments.
482. Verify clicking notification opens relevant issue.
483. Verify "Mark all as read" button.
484. Verify email notification for assigned issue.
485. Verify email notification for comment mention.
486. Verify email notification for status change.
487. Verify batching of notifications.
488. Verify "Do Not Disturb" mode suppresses notifications.
489. Verify mobile push notification simulation.
490. Verify unsubscribe from specific issue notifications.

### **Integrations & API**
491. Verify creating API Login Token.
492. Verify revoking API Token.
493. Verify webhook triggers on Issue Created.
494. Verify webhook triggers on Issue Updated.
495. Verify webhook payload format.
496. Verify linking GitHub repository.
497. Verify linking Slack workspace.
498. Verify external calendar sync (Google/Outlook).
499. Verify importing data from Trello.
500. Verify importing data from Asana.
501. Verify app marketplace/add-on viewing.

