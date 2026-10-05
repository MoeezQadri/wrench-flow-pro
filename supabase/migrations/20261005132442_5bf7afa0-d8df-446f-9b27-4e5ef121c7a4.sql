DROP POLICY IF EXISTS "Admin users can manage all blog posts" ON public.blog_posts;
CREATE POLICY "Super admins can manage blog posts" ON public.blog_posts FOR ALL TO authenticated
  USING (public.user_is_superadmin()) WITH CHECK (public.user_is_superadmin());

DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
CREATE POLICY "insert_own_subscription" ON public.subscribers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit a valid contact form" ON public.contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 200
    AND length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR length(phone) <= 50)
    AND (company_name IS NULL OR length(company_name) <= 200)
    AND (company_size IS NULL OR length(company_size) <= 50)
    AND (message IS NULL OR length(message) <= 5000)
  );

DROP POLICY IF EXISTS "Anyone can submit a demo lead" ON public.demo_leads;
CREATE POLICY "Anyone can submit a valid demo lead" ON public.demo_leads FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 200
    AND length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (shop_name IS NULL OR length(shop_name) <= 200)
    AND (phone IS NULL OR length(phone) <= 50)
    AND length(source) BETWEEN 1 AND 100
  );