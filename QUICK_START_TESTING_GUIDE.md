# ⚡ QUICK START TESTING GUIDE - 30 MINUTES

**Get started testing Phase 1 & 2 features in 30 minutes!**

---

## 🚀 **APPLICATIONS STATUS**

✅ **Backend**: Running on http://localhost:8500  
✅ **Frontend**: Running on http://localhost:1600  
✅ **All APIs**: Live and ready

---

## 🎯 **30-MINUTE TEST PLAN**

### **MINUTE 0-5: Setup & Verification**

**1. Check Backend** (1 min)
```bash
curl http://localhost:8500/health
# Should return: {"status":"ok","message":"Ayphen Jira API is running"}
```

**2. Open Frontend** (1 min)
```
http://localhost:1600
```

**3. Login** (1 min)
- Use your credentials
- Verify dashboard loads

**4. Open Test Pages** (2 min)
```
Phase 1: http://localhost:1600/ai-features-test
Phase 2: http://localhost:1600/phase2-test
```

---

### **MINUTE 5-15: PHASE 1 QUICK TESTS**

#### **Test 1: AI Auto-Assignment** (3 min)

**Steps**:
1. Go to http://localhost:1600/ai-features-test
2. Enter any issue ID (or create one)
3. Click "Test Auto-Assignment API"
4. ✅ Verify: Response in < 3 seconds
5. ✅ Verify: Confidence score shown
6. ✅ Verify: Assignee recommended

**Quick UI Test**:
1. Open any issue
2. Find "🤖 AI Assistant" card
3. Click "AI Auto-Assign"
4. ✅ Verify: Modal opens with recommendation
5. Click "Assign"
6. ✅ Verify: Issue assigned successfully

---

#### **Test 2: Smart Prioritization** (3 min)

**Steps**:
1. On test page, click "Test Smart Prioritization API"
2. ✅ Verify: Priority suggested
3. ✅ Verify: Scores displayed (Urgency, Impact, Business Value)
4. ✅ Verify: Risk level shown

**Quick UI Test**:
1. Open any issue
2. Click "AI Priority" button
3. ✅ Verify: Analysis modal opens
4. Click "Apply Priority"
5. ✅ Verify: Priority updated

---

#### **Test 3: Auto-Tagging** (3 min)

**Steps**:
1. Click "Test Auto-Tagging API"
2. ✅ Verify: 3-7 tags suggested
3. ✅ Verify: Tags grouped by category
4. ✅ Verify: Confidence scores shown

**Quick UI Test**:
1. Open any issue
2. Click "AI Tags" button
3. ✅ Verify: Tags displayed with checkboxes
4. Select tags and click "Apply"
5. ✅ Verify: Tags added to issue

---

#### **Test 4: Duplicate Detection** (1 min)

**Steps**:
1. Click "Create Issue"
2. Type a summary similar to existing issue
3. Wait 500ms
4. ✅ Verify: Duplicate alert appears
5. ✅ Verify: Similar issues shown

---

### **MINUTE 15-25: PHASE 2 QUICK TESTS**

#### **Test 5: Email-to-Issue** (3 min)

**Steps**:
1. Go to http://localhost:1600/phase2-test
2. Click "Email to Issue" button
3. Fill form:
   ```
   From: test@example.com
   Subject: Bug: Login not working
   Body: When I try to login, the page crashes...
   ```
4. Click "Process Email"
5. ✅ Verify: Issue created in < 5 seconds
6. ✅ Verify: Type = bug
7. ✅ Verify: Priority = high
8. ✅ Verify: Tags applied
9. ✅ Verify: Auto-assigned

---

#### **Test 6: Sprint Auto-Population** (4 min)

**Steps**:
1. Click "Auto-Populate Sprint" button
2. Configure:
   - Team Capacity: 50
   - Sprint Duration: 14
   - Prioritize By: Balanced
3. Click "Preview"
4. ✅ Verify: Issues selected
5. ✅ Verify: Capacity utilization 80-95%
6. ✅ Verify: Team balance shown
7. Click "Apply to Sprint"
8. ✅ Verify: Sprint populated

---

#### **Test 7: Test Case Generation** (3 min)

**Steps**:
1. Click "Generate Test Cases" button
2. Wait for generation
3. ✅ Verify: 5-10 test cases generated
4. ✅ Verify: Coverage analysis shown
5. ✅ Verify: Test steps clear
6. Expand a test case
7. ✅ Verify: Steps and expected results detailed

---

#### **Test 8: Notification Filtering** (2 min)

**API Test**:
```bash
curl -X POST http://localhost:8500/api/ai-notification-filter/filter \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "notifications": [
      {
        "id": "1",
        "type": "mention",
        "title": "Production down",
        "message": "Server crashed",
        "priority": "critical"
      }
    ]
  }'
```

✅ Verify: Notifications categorized (critical, important, batched)

---

### **MINUTE 25-30: INTEGRATION & WRAP-UP**

#### **Integration Test** (3 min)

**Email → Issue → Assign → Tag Flow**:
1. Process an email
2. ✅ Verify: Issue created
3. ✅ Verify: Auto-assigned
4. ✅ Verify: Tags applied
5. ✅ Verify: All in one flow

---

#### **Performance Check** (2 min)

**Test Response Times**:
```bash
# Auto-Assignment (should be < 2s)
time curl -X POST http://localhost:8500/api/ai-auto-assignment/suggest/TEST-1

# Email-to-Issue (should be < 5s)
time curl -X POST http://localhost:8500/api/email-to-issue/process -d '{...}'
```

✅ Verify: All responses within target times

---

## ✅ **QUICK CHECKLIST**

### **Phase 1** (10 minutes)
- [ ] Auto-Assignment works
- [ ] Smart Prioritization works
- [ ] Auto-Tagging works
- [ ] Duplicate Detection works
- [ ] All UI components functional
- [ ] Response times < 3 seconds

### **Phase 2** (10 minutes)
- [ ] Email-to-Issue works
- [ ] Sprint Auto-Population works
- [ ] Test Case Generation works
- [ ] Notification Filtering works
- [ ] All UI components functional
- [ ] Response times < 10 seconds

### **Integration** (5 minutes)
- [ ] Phase 1 + Phase 2 work together
- [ ] No errors in console
- [ ] All features accessible
- [ ] Performance acceptable

### **Overall** (5 minutes)
- [ ] Backend stable
- [ ] Frontend responsive
- [ ] No critical bugs
- [ ] Ready for full testing

---

## 🎯 **SUCCESS CRITERIA**

**Pass if**:
- ✅ All 8 features working
- ✅ No critical errors
- ✅ Response times acceptable
- ✅ UI responsive and functional

**Fail if**:
- ❌ Any feature completely broken
- ❌ Critical errors in console
- ❌ Response times > 2x target
- ❌ UI not loading

---

## 🐛 **COMMON ISSUES & FIXES**

### **Backend Not Responding**
```bash
# Check if running
curl http://localhost:8500/health

# If not, restart
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira-backend
npm run dev
```

### **Frontend Not Loading**
```bash
# Check if running
open http://localhost:1600

# If not, restart
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira
npm run dev
```

### **API Errors**
- Check backend logs
- Verify Cerebras API key set
- Check database connection

### **UI Not Updating**
- Hard refresh (Cmd+Shift+R)
- Clear browser cache
- Check browser console for errors

---

## 📊 **QUICK METRICS**

After 30 minutes, you should have:

**Tests Completed**: 8/8 features  
**Time Spent**: 30 minutes  
**Coverage**: Basic functionality  
**Confidence**: Ready for full testing

---

## 🎉 **NEXT STEPS**

**If All Tests Pass**:
1. ✅ Proceed to comprehensive testing
2. ✅ Follow `COMPREHENSIVE_TESTING_PLAN.md`
3. ✅ Document results
4. ✅ Plan production deployment

**If Tests Fail**:
1. ❌ Document failures
2. ❌ Report to development team
3. ❌ Wait for fixes
4. ❌ Retest after fixes

---

## 📞 **QUICK HELP**

**Test Pages**:
- Phase 1: http://localhost:1600/ai-features-test
- Phase 2: http://localhost:1600/phase2-test

**Documentation**:
- Full Testing Plan: `COMPREHENSIVE_TESTING_PLAN.md`
- User Guide: `USER_TRAINING_GUIDE.md`
- Quick Reference: `QUICK_REFERENCE.md`

**APIs**:
- Backend: http://localhost:8500
- Health Check: http://localhost:8500/health

---

**⚡ START TESTING NOW!** ⚡

**Time Required**: 30 minutes  
**Difficulty**: Easy  
**Prerequisites**: Backend & Frontend running  
**Expected Result**: All features working

---

**Last Updated**: December 4, 2025  
**Status**: Ready to Execute  
**Version**: 1.0
