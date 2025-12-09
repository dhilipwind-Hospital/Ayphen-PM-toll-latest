-- Add issueId to ai_stories table
ALTER TABLE ai_stories ADD COLUMN IF NOT EXISTS "issueId" VARCHAR;

-- Add epicKey and aiStoryId to issues table  
ALTER TABLE issues ADD COLUMN IF NOT EXISTS "epicKey" VARCHAR(50);
ALTER TABLE issues ADD COLUMN IF NOT EXISTS "aiStoryId" VARCHAR;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_stories' AND column_name = 'issueId';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'issues' AND column_name IN ('epicKey', 'aiStoryId');
