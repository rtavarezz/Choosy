-- Add racing topic to plans table constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_topic_check;
ALTER TABLE plans ADD CONSTRAINT plans_topic_check 
CHECK (topic IN ('concerts', 'nightlife', 'foodie', 'datenight', 'sports', 'parks', 'gokart', 'swimming', 'drinks', 'racing')); 