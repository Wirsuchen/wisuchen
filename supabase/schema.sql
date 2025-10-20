-- TalentPlus Job Portal - Complete Supabase Schema
-- This schema creates a comprehensive job portal with affiliate feeds, CMS, payments, and analytics

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types and enums
CREATE TYPE user_role AS ENUM ('supervisor', 'admin', 'moderator', 'lister', 'publisher', 'blogger', 'editor', 'analyst', 'job_seeker', 'employer');
CREATE TYPE offer_status AS ENUM ('draft', 'pending', 'active', 'expired', 'rejected', 'archived');
CREATE TYPE offer_type AS ENUM ('job', 'affiliate');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary');
CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE content_status AS ENUM ('draft', 'pending', 'published', 'archived');
CREATE TYPE category_type AS ENUM ('job', 'affiliate', 'blog');

-- 1. USERS & PROFILES TABLE
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    location VARCHAR(255),
    bio TEXT,
    website_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    resume_url TEXT,
    role user_role DEFAULT 'job_seeker',
    is_active BOOLEAN DEFAULT true,
    is_adult BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMPANIES TABLE
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    founded_year INTEGER,
    location VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    linkedin_url TEXT,
    twitter_url TEXT,
    facebook_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7), -- hex color
    type category_type NOT NULL,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    offers_count INTEGER DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. JOB SOURCES TABLE (for API imports)
CREATE TABLE job_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'api', 'csv', 'xml', 'rss'
    url TEXT,
    api_key_encrypted TEXT,
    headers JSONB,
    mapping_config JSONB, -- field mappings
    is_active BOOLEAN DEFAULT true,
    last_import_at TIMESTAMPTZ,
    import_frequency INTEGER DEFAULT 3600, -- seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OFFERS TABLE (jobs and affiliate offers)
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    type offer_type NOT NULL,
    status offer_status DEFAULT 'draft',
    
    -- Job specific fields
    employment_type employment_type,
    experience_level experience_level,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'EUR',
    salary_period VARCHAR(20), -- 'hourly', 'monthly', 'yearly'
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT false,
    is_hybrid BOOLEAN DEFAULT false,
    skills TEXT[], -- array of skills
    requirements TEXT,
    benefits TEXT,
    application_url TEXT,
    application_email VARCHAR(255),
    application_deadline DATE,
    
    -- Affiliate specific fields
    affiliate_url TEXT,
    commission_rate DECIMAL(5,2),
    price DECIMAL(10,2),
    discount_code VARCHAR(50),
    
    -- Common fields
    company_id UUID REFERENCES companies(id),
    category_id UUID REFERENCES categories(id),
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'api', 'import'
    external_id VARCHAR(255), -- for imports
    source_id UUID REFERENCES job_sources(id),
    featured BOOLEAN DEFAULT false,
    urgent BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    
    -- SEO fields
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    
    -- Media
    featured_image_url TEXT,
    gallery_urls TEXT[],
    
    -- Timestamps
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(source, external_id) -- prevent duplicate imports
);

-- 6. IMPORT RUNS TABLE
CREATE TABLE import_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES job_sources(id),
    status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed'
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    created_records INTEGER DEFAULT 0,
    updated_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_log TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 7. AFFILIATE PROGRAMS TABLE
CREATE TABLE affiliate_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- 'awin', 'adcell', 'commission_junction'
    api_url TEXT,
    api_key_encrypted TEXT,
    publisher_id VARCHAR(255),
    commission_rate DECIMAL(5,2),
    cookie_duration INTEGER, -- days
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRICING PLANS TABLE
CREATE TABLE pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    duration_days INTEGER NOT NULL, -- 30 for monthly
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. POINT PACKAGES TABLE
CREATE TABLE point_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    bonus_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INVOICES TABLE
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id),
    company_id UUID REFERENCES companies(id),
    status invoice_status DEFAULT 'draft',
    
    -- Invoice details
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 19.00, -- German VAT
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Billing info
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(2) DEFAULT 'DE',
    billing_vat_number VARCHAR(50),
    
    -- E-Invoice compliance (German law)
    xml_content TEXT, -- ZUGFeRD/XRechnung XML
    pdf_url TEXT,
    
    -- Payment
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    paid_at TIMESTAMPTZ,
    due_date DATE,
    
    -- Timestamps
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INVOICE ITEMS TABLE
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PAYMENTS TABLE
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    user_id UUID REFERENCES profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50), -- 'stripe', 'paypal', 'bank_transfer'
    payment_provider_id VARCHAR(255), -- Stripe payment intent ID
    payment_provider_data JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. BLOG POSTS TABLE
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    featured_image_url TEXT,
    status content_status DEFAULT 'draft',
    category_id UUID REFERENCES categories(id),
    author_id UUID REFERENCES profiles(id),
    
    -- SEO
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    
    -- Stats
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- Publishing
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MEDIA FILES TABLE
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    alt_text VARCHAR(255),
    uploaded_by UUID REFERENCES profiles(id),
    bucket_name VARCHAR(100) DEFAULT 'public-media',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. IMPRESSIONS TABLE (Analytics)
CREATE TABLE impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES offers(id),
    blog_post_id UUID REFERENCES blog_posts(id),
    user_id UUID REFERENCES profiles(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    event_type VARCHAR(50), -- 'view', 'click', 'apply', 'share'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. COOKIE CONSENTS TABLE (GDPR)
CREATE TABLE cookie_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    session_id VARCHAR(255),
    ip_address INET,
    consent_data JSONB, -- which cookies were accepted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. SETTINGS TABLE
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES profiles(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_type ON offers(type);
CREATE INDEX idx_offers_category_id ON offers(category_id);
CREATE INDEX idx_offers_company_id ON offers(company_id);
CREATE INDEX idx_offers_created_at ON offers(created_at DESC);
CREATE INDEX idx_offers_published_at ON offers(published_at DESC);
CREATE INDEX idx_offers_expires_at ON offers(expires_at);
CREATE INDEX idx_offers_source_external ON offers(source, external_id);

-- Full-text search indexes
CREATE INDEX idx_offers_search ON offers USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_blog_posts_search ON blog_posts USING GIN (to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Cleanup duplicate index if existed from prior migrations
DROP INDEX IF EXISTS idx_offers_title_description; -- or idx_offers_search, ensure only one remains

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

CREATE INDEX idx_impressions_offer_id ON impressions(offer_id);
CREATE INDEX idx_impressions_created_at ON impressions(created_at DESC);
CREATE INDEX idx_impressions_event_type ON impressions(event_type);

-- Additional foreign key indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_impressions_user_id ON impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_offers_source_id ON offers(source_id);

-- TRIGGERS AND FUNCTIONS

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_sources_updated_at BEFORE UPDATE ON job_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update category offers count
CREATE OR REPLACE FUNCTION update_category_offers_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old category count
    IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
        UPDATE categories 
        SET offers_count = (
            SELECT COUNT(*) 
            FROM offers 
            WHERE category_id = OLD.category_id 
            AND status = 'active'
        )
        WHERE id = OLD.category_id;
    END IF;
    
    -- Update new category count
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        UPDATE categories 
        SET offers_count = (
            SELECT COUNT(*) 
            FROM offers 
            WHERE category_id = NEW.category_id 
            AND status = 'active'
        )
        WHERE id = NEW.category_id;
    END IF;
    
    -- Update category count on delete
    IF TG_OP = 'DELETE' THEN
        UPDATE categories 
        SET offers_count = (
            SELECT COUNT(*) 
            FROM offers 
            WHERE category_id = OLD.category_id 
            AND status = 'active'
        )
        WHERE id = OLD.category_id;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_category_offers_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_category_offers_count();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence for invoice numbers
CREATE SEQUENCE invoice_number_seq START 1;

CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Function to set is_adult flag based on content
CREATE OR REPLACE FUNCTION set_is_adult_flag()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple keyword detection for adult content
    IF NEW.description ~* '(adult|18\+|mature|explicit)' OR 
       NEW.title ~* '(adult|18\+|mature|explicit)' THEN
        NEW.is_adult := true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Insert default settings
INSERT INTO settings (key, value, type, description, is_public) VALUES
('site_name', 'TalentPlus', 'string', 'Site name', true),
('site_description', 'Find your dream job or hire top talent', 'string', 'Site description', true),
('site_logo_url', '', 'string', 'Site logo URL', true),
('site_favicon_url', '', 'string', 'Site favicon URL', true),
('contact_email', 'contact@talentplus.com', 'string', 'Contact email', true),
('jobs_per_page', '20', 'number', 'Jobs per page', true),
('enable_job_alerts', 'true', 'boolean', 'Enable job alerts', false),
('enable_affiliate_offers', 'true', 'boolean', 'Enable affiliate offers', false),
('default_currency', 'EUR', 'string', 'Default currency', true),
('vat_rate', '19.00', 'number', 'VAT rate percentage', false);

-- Insert default categories
INSERT INTO categories (name, slug, type, description) VALUES
('Technology', 'technology', 'job', 'Software development, IT, and tech jobs'),
('Marketing', 'marketing', 'job', 'Digital marketing, content, and advertising roles'),
('Sales', 'sales', 'job', 'Sales representatives, account managers, and business development'),
('Design', 'design', 'job', 'UI/UX, graphic design, and creative roles'),
('Finance', 'finance', 'job', 'Accounting, financial analysis, and banking'),
('Healthcare', 'healthcare', 'job', 'Medical, nursing, and healthcare administration'),
('Education', 'education', 'job', 'Teaching, training, and educational roles'),
('Remote Work', 'remote-work', 'job', 'Fully remote job opportunities'),
('Career Tips', 'career-tips', 'blog', 'Career advice and professional development'),
('Industry News', 'industry-news', 'blog', 'Latest industry trends and news'),
('Company Culture', 'company-culture', 'blog', 'Workplace culture and employee experience');

-- Insert default pricing plans
INSERT INTO pricing_plans (name, description, price, duration_days, features) VALUES
('Basic Job Posting', 'Post a single job for 30 days', 29.99, 30, '{"job_posts": 1, "featured": false, "urgent": false}'),
('Premium Job Posting', 'Featured job posting with priority placement', 59.99, 30, '{"job_posts": 1, "featured": true, "urgent": false}'),
('Urgent Job Posting', 'Urgent job posting with top placement', 99.99, 30, '{"job_posts": 1, "featured": true, "urgent": true}'),
('Company Package', 'Multiple job postings for companies', 199.99, 30, '{"job_posts": 5, "featured": true, "company_profile": true}');

COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE offers IS 'Job offers and affiliate offers with comprehensive metadata';
COMMENT ON TABLE categories IS 'Hierarchical categories for jobs, affiliates, and blog posts';
COMMENT ON TABLE companies IS 'Company profiles for employers';
COMMENT ON TABLE impressions IS 'Analytics tracking for views, clicks, and interactions';
COMMENT ON TABLE invoices IS 'E-invoice compliant billing system';
COMMENT ON TABLE audit_logs IS 'System audit trail for compliance and debugging';

-- 19. SAVED OFFERS TABLE (Favorites)
CREATE TABLE IF NOT EXISTS saved_offers (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, offer_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_offers_user_id ON saved_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_offers_offer_id ON saved_offers(offer_id);

-- 20. APPLICATIONS TABLE (Job applications)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'submitted', -- submitted, reviewing, accepted, rejected
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_offer_id ON applications(offer_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
