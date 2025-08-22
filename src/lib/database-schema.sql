-- Learning Sessions Database Schema for Supabase
-- This file contains the SQL commands to create the necessary tables

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create learning_sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('fast', 'depth')),
    topic VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    
    -- Session content
    flashcards JSONB,
    mcq_questions JSONB,
    evaluation_results JSONB,
    
    -- Session metadata
    total_flashcards INTEGER DEFAULT 0,
    studied_flashcards INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    final_score DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional fields for depth learning
    prerequisites JSONB,
    prerequisite_results JSONB,
    core_concepts JSONB,
    advanced_concepts JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_created_at ON learning_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status ON learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_type ON learning_sessions(session_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_learning_sessions_updated_at 
    BEFORE UPDATE ON learning_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own sessions" ON learning_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions" ON learning_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions" ON learning_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions" ON learning_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create session_flashcards table for detailed flashcard tracking
CREATE TABLE IF NOT EXISTS session_flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE NOT NULL,
    flashcard_index INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_studied BOOLEAN DEFAULT FALSE,
    study_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_questions table for detailed question tracking
CREATE TABLE IF NOT EXISTS session_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE NOT NULL,
    question_index INTEGER NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Additional fields for evaluation report
    topic_category VARCHAR(200),
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    explanation TEXT,
    why_wrong_explanation TEXT
);

-- Create topic_struggles table for tracking user difficulties
CREATE TABLE IF NOT EXISTS topic_struggles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    topic_name VARCHAR(200) NOT NULL,
    struggle_count INTEGER DEFAULT 1,
    total_attempts INTEGER DEFAULT 1,
    last_struggled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Composite unique constraint to prevent duplicates
    UNIQUE(user_id, topic_name)
);

-- Indexes for related tables
CREATE INDEX IF NOT EXISTS idx_session_flashcards_session_id ON session_flashcards(session_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id ON session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_topic_struggles_user_id ON topic_struggles(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_struggles_topic_name ON topic_struggles(topic_name);

-- RLS for related tables
ALTER TABLE session_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_struggles ENABLE ROW LEVEL SECURITY;

-- Policies for session_flashcards
CREATE POLICY "Users can view their own session flashcards" ON session_flashcards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE learning_sessions.id = session_flashcards.session_id 
            AND learning_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own session flashcards" ON session_flashcards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE learning_sessions.id = session_flashcards.session_id 
            AND learning_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own session flashcards" ON session_flashcards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE learning_sessions.id = session_flashcards.session_id 
            AND learning_sessions.user_id = auth.uid()
        )
    );

-- Policies for session_questions
CREATE POLICY "Users can view their own session questions" ON session_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE learning_sessions.id = session_questions.session_id 
            AND learning_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own session questions" ON session_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE learning_sessions.id = session_questions.session_id 
            AND learning_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own session questions" ON session_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM learning_sessions
            WHERE learning_sessions.id = session_questions.session_id
            AND learning_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own session questions" ON session_questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM learning_sessions
            WHERE learning_sessions.id = session_questions.session_id
            AND learning_sessions.user_id = auth.uid()
        )
    );

-- Policies for topic_struggles
CREATE POLICY "Users can view their own topic struggles" ON topic_struggles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own topic struggles" ON topic_struggles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own topic struggles" ON topic_struggles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own topic struggles" ON topic_struggles
    FOR DELETE USING (user_id = auth.uid());
