-- ============================================================================
-- LM EDUKIDS DATABASE SCHEMA
-- Supabase PostgreSQL
-- ============================================================================

-- ============================================================================
-- 1. TABELA: USERS (Perfis de Usuários - Alunos e Professores)
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher')), -- 'student' ou 'teacher'
  grade INTEGER,  -- Série (1-9) - apenas para alunos
  whatsapp VARCHAR(20),
  school VARCHAR(255),
  profile_picture_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para melhor performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_grade ON users(grade);

-- ============================================================================
-- 2. TABELA: EXERCISES (Exercícios Resolvidos pelos Alunos)
-- ============================================================================

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,  -- URL da imagem no Supabase Storage
  image_hash VARCHAR(64),   -- SHA256 hash para cache
  analysis TEXT,            -- JSON da análise IA
  exercise_text TEXT,       -- Texto do exercício extraído
  subject VARCHAR(50),      -- 'math', 'portuguese', 'science', etc
  grade INTEGER,            -- Série do exercício
  attempts INTEGER DEFAULT 0,  -- Quantas vezes tentou responder
  correct_attempts INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,  -- Estrelas ganhas (0-5)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exercises_user ON exercises(user_id);
CREATE INDEX idx_exercises_created ON exercises(created_at DESC);
CREATE INDEX idx_exercises_subject ON exercises(subject);

-- ============================================================================
-- 3. TABELA: EXERCISE_RESPONSES (Respostas dos Alunos aos Exercícios)
-- ============================================================================

CREATE TABLE exercise_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_answer TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  feedback TEXT,            -- JSON com feedback da IA
  hint TEXT,               -- Dica fornecida
  earned_stars INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_responses_exercise ON exercise_responses(exercise_id);
CREATE INDEX idx_responses_user ON exercise_responses(user_id);

-- ============================================================================
-- 4. TABELA: QUIZ_RESULTS (Resultados de Quiz)
-- ============================================================================

CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  total_questions INTEGER,
  correct_answers INTEGER,
  score DECIMAL(5, 2),      -- Porcentagem (0-100)
  time_spent_seconds INTEGER,  -- Tempo gasto
  quiz_data JSONB,          -- Perguntas e respostas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quiz_user ON quiz_results(user_id);
CREATE INDEX idx_quiz_created ON quiz_results(created_at DESC);

-- ============================================================================
-- 5. TABELA: TEACHER_CONTENT (Conteúdo Criado por Professores)
-- ============================================================================

CREATE TABLE teacher_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  grade INTEGER,
  subject VARCHAR(50),
  content_type VARCHAR(50) CHECK (content_type IN ('exercise', 'worksheet', 'quiz', 'lesson')),
  content_data JSONB,       -- Dados estruturados do conteúdo
  is_public BOOLEAN DEFAULT FALSE,
  students_assigned UUID[] DEFAULT '{}', -- Array de UUIDs dos alunos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_teacher_content_teacher ON teacher_content(teacher_id);
CREATE INDEX idx_teacher_content_public ON teacher_content(is_public);

-- ============================================================================
-- 6. TABELA: CLASS_ROOMS (Turmas de Professores)
-- ============================================================================

CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  grade INTEGER,
  academic_year INTEGER,
  invite_code VARCHAR(10) UNIQUE,  -- Código para alunos entrar
  students_enrolled UUID[] DEFAULT '{}',  -- Array de IDs dos alunos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX idx_classrooms_invite ON classrooms(invite_code);

-- ============================================================================
-- 7. TABELA: STUDENT_PROGRESS (Progresso do Aluno)
-- ============================================================================

CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_exercises_completed INTEGER DEFAULT 0,
  total_stars INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,  -- Dias consecutivos
  last_activity_date DATE,
  subjects_stats JSONB,  -- {'math': {completed: 5, correct: 4}, ...}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_progress_student ON student_progress(student_id);

-- ============================================================================
-- 8. RLS (ROW LEVEL SECURITY) - Segurança por Linha
-- ============================================================================

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Alunos podem ver suas próprias respostas
CREATE POLICY "Students can view own exercises" ON exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can view own responses" ON exercise_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert responses" ON exercise_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Alunos podem ver seus resultados de quiz
CREATE POLICY "Students can view own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Professores podem ver conteúdo que criaram
CREATE POLICY "Teachers can view own content" ON teacher_content
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert content" ON teacher_content
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- ============================================================================
-- 9. FUNCIÓN: Update updated_at (Trigger Automático)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER exercises_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER teacher_content_updated_at BEFORE UPDATE ON teacher_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER classrooms_updated_at BEFORE UPDATE ON classrooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER student_progress_updated_at BEFORE UPDATE ON student_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. STORAGE: Supabase Storage Buckets
-- ============================================================================
-- (Criar manualmente no Supabase Dashboard)
-- Bucket 1: user-avatars (público)
-- Bucket 2: exercise-images (privado por usuário)
-- Bucket 3: teacher-content (privado por professor)

COMMENT ON TABLE users IS 'Perfis de usuários - alunos e professores';
COMMENT ON TABLE exercises IS 'Exercícios resolvidos pelos alunos';
COMMENT ON TABLE exercise_responses IS 'Respostas dos alunos aos exercícios';
COMMENT ON TABLE quiz_results IS 'Resultados de quiz dos alunos';
COMMENT ON TABLE teacher_content IS 'Conteúdo criado por professores';
COMMENT ON TABLE classrooms IS 'Turmas de professores';
COMMENT ON TABLE student_progress IS 'Progresso agregado dos alunos';
