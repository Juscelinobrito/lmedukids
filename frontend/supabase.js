/**
 * Supabase Client Setup
 * Inicializa conexão com Supabase para autenticação e banco de dados
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ndmccxupbrplljalqegh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Validar chaves
if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL não configurada');
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não configurada');
}

// Cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Authentication Functions
 */

// Signup
export const signUpUser = async (email, password, name, role = 'student', grade = null) => {
  try {
    // 1. Criar user na autenticação
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;

    // 2. Criar perfil na tabela users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email,
        name,
        role,
        grade: role === 'student' ? grade : null,
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    // 3. Se for aluno, criar registro de progresso
    if (role === 'student') {
      await supabase
        .from('student_progress')
        .insert([{ student_id: user.id }]);
    }

    return { user, profile, error: null };
  } catch (error) {
    return { user: null, profile: null, error };
  }
};

// Login
export const loginUser = async (email, password) => {
  try {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Buscar perfil
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile, error: null };
  } catch (error) {
    return { user: null, profile: null, error };
  }
};

// Logout
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (!user) return { user: null, profile: null };

    // Buscar perfil
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile, error: null };
  } catch (error) {
    return { user: null, profile: null, error };
  }
};

// Reset Password
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Exercises Functions
 */

export const saveExercise = async (userId, imageUrl, imageHash, analysisData, exerciseText, subject, grade) => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .insert([{
        user_id: userId,
        image_url: imageUrl,
        image_hash: imageHash,
        analysis: JSON.stringify(analysisData),
        exercise_text: exerciseText,
        subject,
        grade,
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserExercises = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Exercise Responses Functions
 */

export const saveExerciseResponse = async (exerciseId, userId, studentAnswer, isCorrect, feedback, hint, earnedStars) => {
  try {
    const { data, error } = await supabase
      .from('exercise_responses')
      .insert([{
        exercise_id: exerciseId,
        user_id: userId,
        student_answer: studentAnswer,
        is_correct: isCorrect,
        feedback: JSON.stringify(feedback),
        hint,
        earned_stars: earnedStars,
      }])
      .select()
      .single();

    if (error) throw error;

    // Atualizar exercise: incrementar attempts
    await supabase
      .from('exercises')
      .update({
        attempts: supabase.raw('attempts + 1'),
        correct_attempts: isCorrect ? supabase.raw('correct_attempts + 1') : undefined,
        stars: isCorrect ? supabase.raw(`stars + ${earnedStars}`) : undefined,
      })
      .eq('id', exerciseId);

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Quiz Results Functions
 */

export const saveQuizResult = async (userId, imageId, totalQuestions, correctAnswers, score, timeSpent, quizData) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .insert([{
        user_id: userId,
        image_id: imageId,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score,
        time_spent_seconds: timeSpent,
        quiz_data: quizData,
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Teacher Content Functions
 */

export const createTeacherContent = async (teacherId, title, description, grade, subject, contentType, contentData, isPublic = false) => {
  try {
    const { data, error } = await supabase
      .from('teacher_content')
      .insert([{
        teacher_id: teacherId,
        title,
        description,
        grade,
        subject,
        content_type: contentType,
        content_data: contentData,
        is_public: isPublic,
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getTeacherContent = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('teacher_content')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Classroom Functions
 */

export const createClassroom = async (teacherId, name, description, grade, academicYear, inviteCode) => {
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .insert([{
        teacher_id: teacherId,
        name,
        description,
        grade,
        academic_year: academicYear,
        invite_code: inviteCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Storage Functions
 */

export const uploadExerciseImage = async (userId, file) => {
  try {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('exercise-images')
      .upload(fileName, file);

    if (error) throw error;

    // Gerar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(fileName);

    return { publicUrl, error: null };
  } catch (error) {
    return { publicUrl: null, error };
  }
};

export const uploadUserAvatar = async (userId, file) => {
  try {
    const fileName = `${userId}/avatar-${Date.now()}`;
    const { data, error } = await supabase.storage
      .from('user-avatars')
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(fileName);

    // Atualizar URL no perfil
    await supabase
      .from('users')
      .update({ profile_picture_url: publicUrl })
      .eq('id', userId);

    return { publicUrl, error: null };
  } catch (error) {
    return { publicUrl: null, error };
  }
};
