/*
  # Add Foreign Key Constraints

  1. Foreign Key Relationships
    - Add foreign key from `tasks.company_id` to `companies.id`
    - Add foreign key from `tasks.selected_influencer_id` to `influencers.id`
    - Add foreign key from `task_applications.task_id` to `tasks.id`
    - Add foreign key from `task_applications.influencer_id` to `influencers.id`
    - Add foreign key from `reviews.task_id` to `tasks.id`
    - Add foreign key from `live_sessions.task_id` to `tasks.id`
    - Add foreign key from `live_sessions.influencer_id` to `influencers.id`

  2. Data Integrity
    - Ensures referential integrity across related tables
    - Enables proper JOIN operations in Supabase queries
    - Prevents orphaned records
*/

-- Add foreign key constraint from tasks.company_id to companies.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_company_id_fkey'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from tasks.selected_influencer_id to influencers.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_selected_influencer_id_fkey'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_selected_influencer_id_fkey 
    FOREIGN KEY (selected_influencer_id) REFERENCES influencers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key constraint from task_applications.task_id to tasks.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'task_applications_task_id_fkey'
  ) THEN
    ALTER TABLE task_applications ADD CONSTRAINT task_applications_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from task_applications.influencer_id to influencers.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'task_applications_influencer_id_fkey'
  ) THEN
    ALTER TABLE task_applications ADD CONSTRAINT task_applications_influencer_id_fkey 
    FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from reviews.task_id to tasks.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_task_id_fkey'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from live_sessions.task_id to tasks.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'live_sessions_task_id_fkey'
  ) THEN
    ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from live_sessions.influencer_id to influencers.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'live_sessions_influencer_id_fkey'
  ) THEN
    ALTER TABLE live_sessions ADD CONSTRAINT live_sessions_influencer_id_fkey 
    FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE;
  END IF;
END $$;