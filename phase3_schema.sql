-- Optix Math & Handwriting Intelligence (Phase 3)
-- Supabase Schema & RLS Migrations

-- 1. Create math_history table
CREATE TABLE IF NOT EXISTS math_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_expression TEXT NOT NULL,
    solution_steps TEXT NOT NULL,
    final_answer TEXT NOT NULL,
    topic TEXT DEFAULT 'General Math',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE math_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own math history" 
    ON math_history FOR ALL 
    USING (auth.uid() = user_id);


-- 2. Create handwritten_notes table
CREATE TABLE IF NOT EXISTS handwritten_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Untitled Note',
    text_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE handwritten_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own handwritten notes" 
    ON handwritten_notes FOR ALL 
    USING (auth.uid() = user_id);
