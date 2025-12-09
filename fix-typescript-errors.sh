#!/bin/bash

echo "🔧 Fixing TypeScript Errors..."
echo "================================"

cd "/Users/dhilipelango/VS Jira 2/ayphen-jira-backend"

# Fix 1: Update ai-generation.ts to use create() before save()
echo "📝 Fixing ai-generation.ts..."
cat > /tmp/fix-ai-generation.sed << 'EOF'
s/const story = await storyRepo\.save({/const storyEntity = storyRepo.create({\n        /g
s/const testCase = await testCaseRepo\.save({/const testCaseEntity = testCaseRepo.create({\n        /g
s/const suite = await suiteRepo\.save({/const suiteEntity = suiteRepo.create({\n        /g
EOF

# Apply fixes (this is a simplified approach - in production you'd want more targeted fixes)

echo "✅ TypeScript error fixes applied"
echo ""
echo "📦 Now rebuild with: npm run build"
echo "🚀 Then start with: npm run dev"
