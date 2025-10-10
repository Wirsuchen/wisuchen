export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          offers_count: number | null
          parent_id: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          sort_order: number | null
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          offers_count?: number | null
          parent_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number | null
          type: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          offers_count?: number | null
          parent_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number | null
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          company_size: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          facebook_url: string | null
          founded_year: number | null
          id: string
          industry: string | null
          is_active: boolean | null
          is_verified: boolean | null
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          company_size?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          company_size?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          affiliate_url: string | null
          application_deadline: string | null
          application_email: string | null
          application_url: string | null
          applications_count: number | null
          benefits: string | null
          category_id: string | null
          clicks_count: number | null
          commission_rate: number | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_code: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          experience_level: Database["public"]["Enums"]["experience_level"] | null
          expires_at: string | null
          external_id: string | null
          featured: boolean | null
          featured_image_url: string | null
          gallery_urls: string[] | null
          id: string
          is_hybrid: boolean | null
          is_remote: boolean | null
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
          status: Database["public"]["Enums"]["offer_status"] | null
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string | null
          urgent: boolean | null
          views_count: number | null
        }
        Insert: {
          affiliate_url?: string | null
          application_deadline?: string | null
          application_email?: string | null
          application_url?: string | null
          applications_count?: number | null
          benefits?: string | null
          category_id?: string | null
          clicks_count?: number | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_code?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"] | null
          experience_level?: Database["public"]["Enums"]["experience_level"] | null
          expires_at?: string | null
          external_id?: string | null
          featured?: boolean | null
          featured_image_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_hybrid?: boolean | null
          is_remote?: boolean | null
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
          status?: Database["public"]["Enums"]["offer_status"] | null
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
          urgent?: boolean | null
          views_count?: number | null
        }
        Update: {
          affiliate_url?: string | null
          application_deadline?: string | null
          application_email?: string | null
          application_url?: string | null
          applications_count?: number | null
          benefits?: string | null
          category_id?: string | null
          clicks_count?: number | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_code?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"] | null
          experience_level?: Database["public"]["Enums"]["experience_level"] | null
          expires_at?: string | null
          external_id?: string | null
          featured?: boolean | null
          featured_image_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          is_hybrid?: boolean | null
          is_remote?: boolean | null
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
          status?: Database["public"]["Enums"]["offer_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
          urgent?: boolean | null
          views_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          github_url: string | null
          id: string
          is_active: boolean | null
          is_adult: boolean | null
          last_login_at: string | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          phone_verified: boolean | null
          resume_url: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          is_adult?: boolean | null
          last_login_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          resume_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          is_adult?: boolean | null
          last_login_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          resume_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
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
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type Profile = Tables<'profiles'>
export type Company = Tables<'companies'>
export type Category = Tables<'categories'>
export type Offer = Tables<'offers'>

// Extended types with relations
export type OfferWithRelations = Offer & {
  company?: Company
  category?: Category
  created_by_profile?: Profile
}
