
-- Seed admin role for the creator
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'omri855655@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
