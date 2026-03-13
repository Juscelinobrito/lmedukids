/**
 * Supabase Client Setup
 * Inicializa conexão com Supabase para autenticação e banco de dados
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

let _supabaseClient = null;

export function initSupabase({ url, anonKey }) {
  if (!url || !anonKey) {
    console.error('❌ Supabase URL/ANON_KEY não configurados');
    return;
  }

  _supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    if (!_supabaseClient) {
      throw new Error('Supabase não inicializado. Chame initSupabase() antes de usar.');
    }
    // @ts-ignore
    return _supabaseClient[prop];
  }
});

function getConfigFromWindow() {
  // Suporte a injeção de vars via <script> no index.html (útil para deploys estáticos)
  return {
    url: window.SUPABASE_URL || window.__LMEDUKIDS_SUPABASE_URL || null,
    anonKey: window.SUPABASE_ANON_KEY || window.__LMEDUKIDS_SUPABASE_ANON_KEY || null,
  };
}

export function getSupabaseConfig() {
  return getConfigFromWindow();
}

export const SUPER_ADMIN_EMAIL = 'juscelinobritob@gmail.com';

export function isSuperAdminEmail(email) {
  return (email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

/**
 * Authentication Functions
 */

// Signup
export const signUpUser = async (email, password, name, role = 'student', grade = null, whatsapp = null) => {
  try {
    // 1. Criar user na autenticação
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          grade: role === 'student' ? grade : null,
          whatsapp,
        },
      },
    });

    if (signUpError) throw signUpError;

    // 2. Criar perfil na tabela users
    const baseProfile = {
      id: user.id,
      email,
      name,
      role,
      grade: role === 'student' ? grade : null,
    };

    let profileResponse = await supabase
      .from('users')
      .insert([{
        ...baseProfile,
        whatsapp,
      }])
      .select()
      .single();

    // Fallback para bancos ainda sem a coluna whatsapp aplicada.
    if (profileResponse.error && whatsapp) {
      profileResponse = await supabase
        .from('users')
        .insert([baseProfile])
        .select()
        .single();
    }

    const { data: profile, error: profileError } = profileResponse;

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

export const signUpUserWithTrigger = async (
  email,
  password,
  name,
  role = 'student',
  grade = null,
  whatsapp = null
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          grade: role === 'student' ? grade : null,
          whatsapp,
        },
      },
    });

    if (error) throw error;

    let profile = null;
    const user = data.user;

    if (data.session && user) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const profileResponse = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileResponse.data) {
          profile = profileResponse.data;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    return { user, profile, pendingConfirmation: !data.session, error: null };
  } catch (error) {
    return { user: null, profile: null, pendingConfirmation: false, error };
  }
};

export const listAdminUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, grade, whatsapp, plan_type, trial_blocked, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

export const updateUserAdminSettings = async (userId, updates) => {
  try {
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(updates, 'plan_type')) {
      payload.plan_type = updates.plan_type;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'trial_blocked')) {
      payload.trial_blocked = updates.trial_blocked;
    }

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId)
      .select('id, email, name, role, grade, whatsapp, plan_type, trial_blocked, created_at')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
