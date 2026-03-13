DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert own data'
  ) THEN
    CREATE POLICY "Users can insert own data" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'student_progress' AND policyname = 'Students can view own progress'
  ) THEN
    CREATE POLICY "Students can view own progress" ON public.student_progress
      FOR SELECT USING (auth.uid() = student_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'student_progress' AND policyname = 'Students can insert own progress'
  ) THEN
    CREATE POLICY "Students can insert own progress" ON public.student_progress
      FOR INSERT WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'student_progress' AND policyname = 'Students can update own progress'
  ) THEN
    CREATE POLICY "Students can update own progress" ON public.student_progress
      FOR UPDATE USING (auth.uid() = student_id);
  END IF;
END $$;
