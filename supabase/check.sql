SELECT u.email, p.role, p.active, p.business_id, p.full_name
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id;
