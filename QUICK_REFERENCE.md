# 🚀 AI Features - Quick Reference Card

**Print this and keep it handy!**

---

## 📍 **WHERE TO FIND AI FEATURES**

**Issue Detail Page** → Right Sidebar → **"🤖 AI Assistant"** Card

---

## 🤖 **1. AI AUTO-ASSIGN**

**What**: Suggests best team member for the issue  
**When**: New issues, reassignments, bulk operations  
**Time Saved**: 5 min → 30 sec (90%)

**How to Use**:
1. Click **"AI Auto-Assign"** button
2. Review recommendation + confidence score
3. Click **"Assign to [Name]"**

**What You See**:
- Recommended assignee
- Confidence % (aim for >70%)
- Reasons why
- Alternative options

---

## ⚡ **2. SMART PRIORITY**

**What**: Analyzes and suggests optimal priority  
**When**: New issues, sprint planning, backlog review  
**Time Saved**: 10 min → 2 min (80%)

**How to Use**:
1. Click **"AI Priority"** button
2. Review urgency/impact/value scores
3. Click **"Apply [PRIORITY] Priority"**

**What You See**:
- Suggested priority (Highest → Lowest)
- Confidence %
- Urgency, Impact, Business Value scores
- Risk level (Critical/High/Medium/Low)

---

## 🏷️ **3. AUTO-TAGS**

**What**: Suggests relevant labels/tags  
**When**: Every new issue (takes 10 seconds!)  
**Time Saved**: 5 min → 15 sec (95%)

**How to Use**:
1. Click **"AI Tags"** button
2. Review suggested tags by category
3. Check/uncheck tags you want
4. Click **"Apply [X] Selected Tags"**

**What You See**:
- 3-7 suggested tags
- Grouped by category
- Confidence scores
- Pre-selected high-confidence tags

---

## 🎯 **CONFIDENCE SCORES**

| Score | Meaning | Action |
|-------|---------|--------|
| 80-100% | High confidence | Safe to apply |
| 60-79% | Good suggestion | Review first |
| <60% | Low confidence | Check carefully |

---

## ⚡ **KEYBOARD SHORTCUTS**

*Coming in Phase 2*

---

## 🧪 **TEST DASHBOARD**

**URL**: `/ai-features-test`

**Use For**:
- Testing features
- Creating test issues
- Viewing API responses
- Learning how it works

---

## 💡 **BEST PRACTICES**

✅ **DO**:
- Write clear issue descriptions
- Review AI suggestions before applying
- Use for bulk operations
- Provide feedback when wrong

❌ **DON'T**:
- Blindly accept all suggestions
- Skip issue descriptions
- Ignore low confidence scores

---

## 🐛 **TROUBLESHOOTING**

**Low confidence?**  
→ Add more details to description

**Wrong suggestion?**  
→ Manually correct, AI learns

**Button not showing?**  
→ Refresh page, check you're on issue detail

**API error?**  
→ Check backend is running on :8500

---

## 📊 **YOUR TIME SAVINGS**

**Per Issue**: 18 minutes saved  
**Per Day** (10 issues): 3 hours saved  
**Per Week**: 15 hours saved  
**Per Month**: 60 hours saved

---

## 📞 **GETTING HELP**

1. **User Guide**: `USER_TRAINING_GUIDE.md`
2. **Test Page**: `/ai-features-test`
3. **Support**: #ai-features-support
4. **Docs**: Check project root folder

---

## 🎓 **QUICK TRAINING**

**5-Minute Crash Course**:
1. Open any issue
2. Find "🤖 AI Assistant" card
3. Click each button once
4. Review suggestions
5. Apply one
6. Done! You're trained!

---

## 📈 **TRACK YOUR IMPACT**

**Before AI** (per issue):
- Assignment: 5 min
- Priority: 10 min
- Tags: 5 min
- **Total: 20 min**

**After AI** (per issue):
- Assignment: 30 sec
- Priority: 2 min
- Tags: 15 sec
- **Total: 2.75 min**

**You save: 17.25 min per issue!**

---

## 🎯 **COMMON SCENARIOS**

**New Bug Reported**:
1. Create issue with description
2. AI Auto-Assign → Expert
3. AI Priority → High
4. AI Tags → bug, frontend, critical
5. Done in 1 minute!

**Sprint Planning**:
1. Select 20 backlog issues
2. Bulk auto-assign
3. Bulk prioritize
4. Bulk tag
5. Sprint ready in 5 minutes!

**Cleaning Backlog**:
1. Filter unassigned
2. Bulk auto-assign all
3. Filter no priority
4. Bulk prioritize all
5. Organized in 10 minutes!

---

## 🚀 **API ENDPOINTS** (For Developers)

```
Auto-Assignment:
POST /api/ai-auto-assignment/suggest/:issueId
POST /api/ai-auto-assignment/assign/:issueId

Prioritization:
POST /api/ai-smart-prioritization/analyze/:issueId
POST /api/ai-smart-prioritization/apply/:issueId

Tagging:
POST /api/ai-auto-tagging/suggest/:issueId
POST /api/ai-auto-tagging/apply/:issueId
```

---

## 📝 **FEEDBACK**

**Help AI Get Smarter**:
- When AI is wrong, manually correct
- System learns from your changes
- Accuracy improves over time

---

## 🎉 **SUCCESS TIPS**

1. **Use it daily** - Becomes second nature
2. **Write good descriptions** - AI works better
3. **Review before applying** - You're still in control
4. **Share with team** - Everyone saves time
5. **Track your savings** - Celebrate wins!

---

## 🔗 **USEFUL LINKS**

- **Test Dashboard**: `/ai-features-test`
- **Full User Guide**: `USER_TRAINING_GUIDE.md`
- **Technical Docs**: `PHASE_1_COMPLETE_GUIDE.md`
- **Deployment Guide**: `DEPLOYMENT_SUMMARY.md`

---

**🎊 You're now an AI-powered Jira user!**

**Remember**: AI saves you time on boring tasks so you can focus on important work.

---

**Version**: 1.0 | **Updated**: Dec 4, 2025 | **Print & Share!** 📄
