export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_programs: {
        Row: {
          api_key_encrypted: string | null
          api_url: string | null
          commission_rate: number | null
          cookie_duration: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          provider: string
          publisher_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_url?: string | null
          commission_rate?: number | null
          cookie_duration?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          provider: string
          publisher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_url?: string | null
          commission_rate?: number | null
          cookie_duration?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          provider?: string
          publisher_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          applicant_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          offer_id: string | null
          resume_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          offer_id?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          performed_at: string | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          comments_count: number
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          likes_count: number
          locale: string | null
          published_at: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          source_language: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          comments_count?: number
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          likes_count?: number
          locale?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          source_language?: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          comments_count?: number
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          likes_count?: number
          locale?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          source_language?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          offers_count: number
          parent_id: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          offers_count?: number
          parent_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          type: Database["public"]["Enums"]["category_type"]
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          offers_count?: number
          parent_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_size: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          facebook_url: string | null
          founded_year: number | null
          id: string
          industry: string | null
          is_active: boolean
          is_verified: boolean
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          company_size?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean
          is_verified?: boolean
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          company_size?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean
          is_verified?: boolean
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      cover_letters: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          job_title: string
          recipient_name: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          job_title: string
          recipient_name?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          job_title?: string
          recipient_name?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      impressions: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          offer_id: string | null
          page_url: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          offer_id?: string | null
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          offer_id?: string | null
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impressions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_name: string | null
          billing_postal_code: string | null
          billing_vat_number: string | null
          company_id: string | null
          created_at: string
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issued_at: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
          user_id: string | null
          xml_content: string | null
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          billing_vat_number?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          tax_rate?: number
          total_amount: number
          updated_at?: string
          user_id?: string | null
          xml_content?: string | null
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          billing_vat_number?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          alt_text: string | null
          bucket_name: string
          created_at: string
          file_path: string
          file_size: number
          filename: string
          id: string
          is_public: boolean
          mime_type: string
          original_filename: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          bucket_name: string
          created_at?: string
          file_path: string
          file_size: number
          filename: string
          id?: string
          is_public?: boolean
          mime_type: string
          original_filename: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          bucket_name?: string
          created_at?: string
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          is_public?: boolean
          mime_type?: string
          original_filename?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          affiliate_url: string | null
          application_deadline: string | null
          application_email: string | null
          application_url: string | null
          applications_count: number
          benefits: string | null
          category_id: string | null
          clicks_count: number
          commission_rate: number | null
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_code: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          experience_level: Database["public"]["Enums"]["experience_level"] | null
          expires_at: string | null
          external_id: string | null
          featured: boolean
          featured_image_url: string | null
          gallery_urls: string[] | null
          id: string
          is_hybrid: boolean
          is_remote: boolean
          locale: string | null
          location: string | null
          price: number | null
          published_at: string | null
          requirements: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          short_description: string | null
          skills: string[] | null
          slug: string
          source: string | null
          source_id: string | null
          source_language: string
          status: Database["public"]["Enums"]["offer_status"]
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string
          urgent: boolean
          views_count: number
        }
        Insert: {
          affiliate_url?: string | null
          application_deadline?: string | null
          application_email?: string | null
          application_url?: string | null
          applications_count?: number
          benefits?: string | null
          category_id?: string | null
          clicks_count?: number
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_code?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"] | null
          experience_level?: Database["public"]["Enums"]["experience_level"] | null
          expires_at?: string | null
          external_id?: string | null
          featured?: boolean
          featured_image_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_hybrid?: boolean
          is_remote?: boolean
          locale?: string | null
          location?: string | null
          price?: number | null
          published_at?: string | null
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          short_description?: string | null
          skills?: string[] | null
          slug: string
          source?: string | null
          source_id?: string | null
          source_language?: string
          status?: Database["public"]["Enums"]["offer_status"]
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          urgent?: boolean
          views_count?: number
        }
        Update: {
          affiliate_url?: string | null
          application_deadline?: string | null
          application_email?: string | null
          application_url?: string | null
          applications_count?: number
          benefits?: string | null
          category_id?: string | null
          clicks_count?: number
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_code?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"] | null
          experience_level?: Database["public"]["Enums"]["experience_level"] | null
          expires_at?: string | null
          external_id?: string | null
          featured?: boolean
          featured_image_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_hybrid?: boolean
          is_remote?: boolean
          locale?: string | null
          location?: string | null
          price?: number | null
          published_at?: string | null
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          short_description?: string | null
          skills?: string[] | null
          slug?: string
          source?: string | null
          source_id?: string | null
          source_language?: string
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          urgent?: boolean
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          email_verified: boolean
          full_name: string | null
          github_url: string | null
          id: string
          is_active: boolean
          is_adult: boolean
          last_login_at: string | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          phone_verified: boolean
          resume_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean
          is_adult?: boolean
          last_login_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          phone_verified?: boolean
          resume_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean
          is_adult?: boolean
          last_login_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          phone_verified?: boolean
          resume_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      recommendation_letters: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          relationship: string
          status: string | null
          target_program: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          relationship: string
          status?: string | null
          target_program: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          relationship?: string
          status?: string | null
          target_program?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string | null
          file_url: string
          id: string
          is_primary: boolean | null
          name: string
          parsed_data: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: string
          is_primary?: boolean | null
          name: string
          parsed_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          parsed_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_applications: {
        Row: {
          created_at: string | null
          id: string
          resume_id: string | null
          scholarship_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resume_id?: string | null
          scholarship_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resume_id?: string | null
          scholarship_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_requests: {
        Row: {
          additional_notes: string | null
          content: string | null
          created_at: string | null
          id: string
          status: string | null
          target_program: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_notes?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          target_program: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_notes?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          target_program?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          content: string | null
          created_at: string | null
          duration_weeks: number
          goals: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          duration_weeks: number
          goals?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          duration_weeks?: number
          goals?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          language: string
          metadata: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_moderator_or_above: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      category_type: "job" | "affiliate" | "blog"
      content_status: "draft" | "pending" | "published" | "archived"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "freelance"
        | "internship"
        | "temporary"
      experience_level:
        | "entry"
        | "junior"
        | "mid"
        | "senior"
        | "lead"
        | "executive"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      offer_status:
        | "draft"
        | "pending"
        | "active"
        | "expired"
        | "rejected"
        | "archived"
      offer_type: "job" | "affiliate"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
      user_role:
        | "supervisor"
        | "admin"
        | "moderator"
        | "lister"
        | "publisher"
        | "blogger"
        | "editor"
        | "analyst"
        | "job_seeker"
        | "employer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      category_type: ["job", "affiliate", "blog"],
      content_status: ["draft", "pending", "published", "archived"],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "freelance",
        "internship",
        "temporary",
      ],
      experience_level: [
        "entry",
        "junior",
        "mid",
        "senior",
        "lead",
        "executive",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      offer_status: [
        "draft",
        "pending",
        "active",
        "expired",
        "rejected",
        "archived",
      ],
      offer_type: ["job", "affiliate"],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      user_role: [
        "supervisor",
        "admin",
        "moderator",
        "lister",
        "publisher",
        "blogger",
        "editor",
        "analyst",
        "job_seeker",
        "employer",
      ],
    },
  },
} as const
