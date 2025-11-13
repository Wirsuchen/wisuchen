-- Row Level Security (RLS) Policies for TalentPlus
-- These policies enforce role-based access control based on user roles

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
BEGIN
    RETURN (
        SELECT role 
        FROM profiles 
        WHERE user_id = v_uid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has admin privileges
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('supervisor', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has moderator privileges
CREATE OR REPLACE FUNCTION is_moderator_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('supervisor', 'admin', 'moderator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES TABLE POLICIES
-- Users can view all active profiles (public directory)
CREATE POLICY "profiles_select_public" ON profiles
    FOR SELECT USING (is_active = true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Admins can manage all profiles
CREATE POLICY "profiles_admin_all" ON profiles
    FOR ALL USING (is_admin());

-- COMPANIES TABLE POLICIES
-- Everyone can view active companies
CREATE POLICY "companies_select_public" ON companies
    FOR SELECT USING (is_active = true);

-- Company creators and admins can update companies
CREATE POLICY "companies_update_own" ON companies
    FOR UPDATE USING (created_by = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())) OR is_admin());

-- Employers and above can create companies
CREATE POLICY "companies_insert_employer" ON companies
    FOR INSERT WITH CHECK (
        get_user_role() IN ('supervisor', 'admin', 'moderator', 'lister', 'publisher', 'employer')
    );

-- CATEGORIES TABLE POLICIES
-- Everyone can view active categories
CREATE POLICY "categories_select_public" ON categories
    FOR SELECT USING (is_active = true);

-- Only admins can manage categories
CREATE POLICY "categories_admin_only" ON categories
    FOR ALL USING (is_admin());

-- OFFERS TABLE POLICIES
-- Everyone can view active published offers
CREATE POLICY "offers_select_public" ON offers
    FOR SELECT USING (status = 'active' AND published_at IS NOT NULL);

-- Users can view their own offers (any status)
CREATE POLICY "offers_select_own" ON offers
    FOR SELECT USING (created_by = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- Moderators and above can view all offers
CREATE POLICY "offers_select_moderator" ON offers
    FOR SELECT USING (is_moderator_or_above());

-- Publishers and above can create offers
CREATE POLICY "offers_insert_publisher" ON offers
    FOR INSERT WITH CHECK (
        get_user_role() IN ('supervisor', 'admin', 'moderator', 'lister', 'publisher')
    );

-- Users can update their own offers, moderators can update any
CREATE POLICY "offers_update_own_or_moderator" ON offers
    FOR UPDATE USING (
        created_by = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())) OR 
        is_moderator_or_above()
    );

-- Only admins can delete offers
CREATE POLICY "offers_delete_admin" ON offers
    FOR DELETE USING (is_admin());

-- JOB SOURCES TABLE POLICIES
-- Only admins can manage job sources
CREATE POLICY "job_sources_admin_only" ON job_sources
    FOR ALL USING (is_admin());

-- IMPORT RUNS TABLE POLICIES
-- Admins and analysts can view import runs
CREATE POLICY "import_runs_admin_analyst" ON import_runs
    FOR SELECT USING (
        get_user_role() IN ('supervisor', 'admin', 'analyst')
    );

-- Only admins can manage import runs
CREATE POLICY "import_runs_admin_manage" ON import_runs
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "import_runs_admin_update" ON import_runs
    FOR UPDATE USING (is_admin());

-- AFFILIATE PROGRAMS TABLE POLICIES
-- Only admins can manage affiliate programs
CREATE POLICY "affiliate_programs_admin_only" ON affiliate_programs
    FOR ALL USING (is_admin());

-- PRICING PLANS TABLE POLICIES
-- Everyone can view active pricing plans
CREATE POLICY "pricing_plans_select_public" ON pricing_plans
    FOR SELECT USING (is_active = true);

-- Only admins can manage pricing plans
CREATE POLICY "pricing_plans_admin_manage" ON pricing_plans
    FOR ALL USING (is_admin());

-- POINT PACKAGES TABLE POLICIES
-- Everyone can view active point packages
CREATE POLICY "point_packages_select_public" ON point_packages
    FOR SELECT USING (is_active = true);

-- Only admins can manage point packages
CREATE POLICY "point_packages_admin_manage" ON point_packages
    FOR ALL USING (is_admin());

-- INVOICES TABLE POLICIES
-- Users can view their own invoices
CREATE POLICY "invoices_select_own" ON invoices
    FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- Company users can view their company's invoices
CREATE POLICY "invoices_select_company" ON invoices
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies 
            WHERE created_by = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid()))
        )
    );

-- Admins can view all invoices
CREATE POLICY "invoices_select_admin" ON invoices
    FOR SELECT USING (is_admin());

-- Only admins can create invoices (service role can still bypass RLS for webhooks)
CREATE POLICY "invoices_insert_admin" ON invoices
    FOR INSERT WITH CHECK (is_admin());

-- Only admins can update invoices
CREATE POLICY "invoices_update_admin" ON invoices
    FOR UPDATE USING (is_admin());

-- INVOICE ITEMS TABLE POLICIES
-- Users can view items for their invoices
CREATE POLICY "invoice_items_select_own" ON invoice_items
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE user_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid()))
        )
    );

-- Admins can view all invoice items
CREATE POLICY "invoice_items_select_admin" ON invoice_items
    FOR SELECT USING (is_admin());

-- System can create invoice items
CREATE POLICY "invoice_items_insert_system" ON invoice_items
    FOR INSERT WITH CHECK (true);

-- PAYMENTS TABLE POLICIES
-- Users can view their own payments
CREATE POLICY "payments_select_own" ON payments
    FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- Admins can view all payments
CREATE POLICY "payments_select_admin" ON payments
    FOR SELECT USING (is_admin());

-- System can create and update payments
CREATE POLICY "payments_insert_system" ON payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "payments_update_system" ON payments
    FOR UPDATE USING (true);

-- BLOG POSTS TABLE POLICIES
-- Everyone can view published blog posts
CREATE POLICY "blog_posts_select_public" ON blog_posts
    FOR SELECT USING (status = 'published');

-- Authors can view their own posts (any status)
CREATE POLICY "blog_posts_select_own" ON blog_posts
    FOR SELECT USING (author_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- Moderators and above can view all posts
CREATE POLICY "blog_posts_select_moderator" ON blog_posts
    FOR SELECT USING (is_moderator_or_above());

-- Bloggers and editors can create posts
CREATE POLICY "blog_posts_insert_blogger" ON blog_posts
    FOR INSERT WITH CHECK (
        get_user_role() IN ('supervisor', 'admin', 'moderator', 'blogger', 'editor')
    );

-- Authors can update their own posts, moderators can update any
CREATE POLICY "blog_posts_update_own_or_moderator" ON blog_posts
    FOR UPDATE USING (
        author_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR 
        is_moderator_or_above()
    );

-- Only admins can delete blog posts
CREATE POLICY "blog_posts_delete_admin" ON blog_posts
    FOR DELETE USING (is_admin());

-- MEDIA FILES TABLE POLICIES
-- Users can view public media files
CREATE POLICY "media_files_select_public" ON media_files
    FOR SELECT USING (is_public = true);

-- Users can view their own media files
CREATE POLICY "media_files_select_own" ON media_files
    FOR SELECT USING (uploaded_by = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- Admins can view all media files
CREATE POLICY "media_files_select_admin" ON media_files
    FOR SELECT USING (is_admin());

-- Authenticated users can upload media files
CREATE POLICY "media_files_insert_auth" ON media_files
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own media files
CREATE POLICY "media_files_update_own" ON media_files
    FOR UPDATE USING (uploaded_by = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- IMPRESSIONS TABLE POLICIES
-- System can insert impressions (for analytics)
CREATE POLICY "impressions_insert_system" ON impressions
    FOR INSERT WITH CHECK (true);

-- Analysts and admins can view impressions
CREATE POLICY "impressions_select_analyst" ON impressions
    FOR SELECT USING (
        get_user_role() IN ('supervisor', 'admin', 'analyst')
    );

-- COOKIE CONSENTS TABLE POLICIES
-- System can insert cookie consents
CREATE POLICY "cookie_consents_insert_system" ON cookie_consents
    FOR INSERT WITH CHECK (true);

-- Users can view their own consents
CREATE POLICY "cookie_consents_select_own" ON cookie_consents
    FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- Admins can view all consents
CREATE POLICY "cookie_consents_select_admin" ON cookie_consents
    FOR SELECT USING (is_admin());

-- SETTINGS TABLE POLICIES
-- Everyone can view public settings
CREATE POLICY "settings_select_public" ON settings
    FOR SELECT USING (is_public = true);

-- Admins can view all settings
CREATE POLICY "settings_select_admin" ON settings
    FOR SELECT USING (is_admin());

-- Only admins can manage settings
CREATE POLICY "settings_admin_manage" ON settings
    FOR ALL USING (is_admin());

-- AUDIT LOGS TABLE POLICIES
-- Only admins can view audit logs
CREATE POLICY "audit_logs_admin_only" ON audit_logs
    FOR SELECT USING (is_admin());

-- System can insert audit logs
CREATE POLICY "audit_logs_insert_system" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id,
        ip_address
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())),
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_offers AFTER INSERT OR UPDATE OR DELETE ON offers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- SAVED OFFERS TABLE POLICIES
-- Owners can view, insert and delete their saved offers
CREATE POLICY "saved_offers_select_own" ON saved_offers
    FOR SELECT USING (user_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "saved_offers_insert_own" ON saved_offers
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "saved_offers_delete_own" ON saved_offers
    FOR DELETE USING (user_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

-- APPLICATIONS TABLE POLICIES
-- Applicants can view and update their own applications; moderators+ can view all
CREATE POLICY "applications_select_own_or_moderator" ON applications
    FOR SELECT USING (
        applicant_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())) OR is_moderator_or_above()
    );

CREATE POLICY "applications_insert_own" ON applications
    FOR INSERT WITH CHECK (applicant_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "applications_update_own_or_moderator" ON applications
    FOR UPDATE USING (
        applicant_id = (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())) OR is_moderator_or_above()
    );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role (for server-side operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
