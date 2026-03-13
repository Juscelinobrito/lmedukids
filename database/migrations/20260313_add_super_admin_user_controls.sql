ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) NOT NULL DEFAULT 'trial';

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_blocked BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_plan_type_check'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_plan_type_check
    CHECK (plan_type IN ('trial', 'paid'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_plan_type ON public.users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_trial_blocked ON public.users(trial_blocked);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Super admin can view all users'
  ) THEN
    CREATE POLICY "Super admin can view all users" ON public.users
      FOR SELECT
      USING ((auth.jwt() ->> 'email') = 'juscelinobritob@gmail.com');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Super admin can update all users'
  ) THEN
    CREATE POLICY "Super admin can update all users" ON public.users
      FOR UPDATE
      USING ((auth.jwt() ->> 'email') = 'juscelinobritob@gmail.com')
      WITH CHECK ((auth.jwt() ->> 'email') = 'juscelinobritob@gmail.com');
  END IF;
END $$;
