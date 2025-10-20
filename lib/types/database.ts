// Database types for TalentPlus - Import from generated Supabase types
// NOTE: Do not re-export Database here to avoid conflicts with the local interface below.
// Instead, import the generated enum helper and derive enum aliases for use in this file.
import type { Enums as SupaEnums } from './database.generated'

// Enum aliases from generated Supabase types
export type UserRole = SupaEnums<'user_role'>
export type OfferStatus = SupaEnums<'offer_status'>
export type OfferType = SupaEnums<'offer_type'>
export type EmploymentType = SupaEnums<'employment_type'>
export type ExperienceLevel = SupaEnums<'experience_level'>
export type PaymentStatus = SupaEnums<'payment_status'>
export type InvoiceStatus = SupaEnums<'invoice_status'>
export type ContentStatus = SupaEnums<'content_status'>
export type CategoryType = SupaEnums<'category_type'>

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          location: string | null
          bio: string | null
          website_url: string | null
          linkedin_url: string | null
          github_url: string | null
          resume_url: string | null
          role: UserRole
          is_active: boolean
          is_adult: boolean
          email_verified: boolean
          phone_verified: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          website_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          resume_url?: string | null
          role?: UserRole
          is_active?: boolean
          is_adult?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          website_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          resume_url?: string | null
          role?: UserRole
          is_active?: boolean
          is_adult?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          website_url: string | null
          logo_url: string | null
          cover_image_url: string | null
          industry: string | null
          company_size: string | null
          founded_year: number | null
          location: string | null
          email: string | null
          phone: string | null
          linkedin_url: string | null
          twitter_url: string | null
          facebook_url: string | null
          is_verified: boolean
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          industry?: string | null
          company_size?: string | null
          founded_year?: number | null
          location?: string | null
          email?: string | null
          phone?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          facebook_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          industry?: string | null
          company_size?: string | null
          founded_year?: number | null
          location?: string | null
          email?: string | null
          phone?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          facebook_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          color: string | null
          type: CategoryType
          parent_id: string | null
          sort_order: number
          is_active: boolean
          offers_count: number
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string | null
          type: CategoryType
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
          offers_count?: number
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          type?: CategoryType
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
          offers_count?: number
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          short_description: string | null
          type: OfferType
          status: OfferStatus
          employment_type: EmploymentType | null
          experience_level: ExperienceLevel | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string | null
          salary_period: string | null
          location: string | null
          is_remote: boolean
          is_hybrid: boolean
          skills: string[] | null
          requirements: string | null
          benefits: string | null
          application_url: string | null
          application_email: string | null
          application_deadline: string | null
          affiliate_url: string | null
          commission_rate: number | null
          price: number | null
          discount_code: string | null
          company_id: string | null
          category_id: string | null
          source: string | null
          external_id: string | null
          source_id: string | null
          featured: boolean
          urgent: boolean
          views_count: number
          applications_count: number
          clicks_count: number
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string | null
          featured_image_url: string | null
          gallery_urls: string[] | null
          published_at: string | null
          expires_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          short_description?: string | null
          type: OfferType
          status?: OfferStatus
          employment_type?: EmploymentType | null
          experience_level?: ExperienceLevel | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          salary_period?: string | null
          location?: string | null
          is_remote?: boolean
          is_hybrid?: boolean
          skills?: string[] | null
          requirements?: string | null
          benefits?: string | null
          application_url?: string | null
          application_email?: string | null
          application_deadline?: string | null
          affiliate_url?: string | null
          commission_rate?: number | null
          price?: number | null
          discount_code?: string | null
          company_id?: string | null
          category_id?: string | null
          source?: string | null
          external_id?: string | null
          source_id?: string | null
          featured?: boolean
          urgent?: boolean
          views_count?: number
          applications_count?: number
          clicks_count?: number
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          featured_image_url?: string | null
          gallery_urls?: string[] | null
          published_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          type?: OfferType
          status?: OfferStatus
          employment_type?: EmploymentType | null
          experience_level?: ExperienceLevel | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          salary_period?: string | null
          location?: string | null
          is_remote?: boolean
          is_hybrid?: boolean
          skills?: string[] | null
          requirements?: string | null
          benefits?: string | null
          application_url?: string | null
          application_email?: string | null
          application_deadline?: string | null
          affiliate_url?: string | null
          commission_rate?: number | null
          price?: number | null
          discount_code?: string | null
          company_id?: string | null
          category_id?: string | null
          source?: string | null
          external_id?: string | null
          source_id?: string | null
          featured?: boolean
          urgent?: boolean
          views_count?: number
          applications_count?: number
          clicks_count?: number
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          featured_image_url?: string | null
          gallery_urls?: string[] | null
          published_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          featured_image_url: string | null
          status: ContentStatus
          category_id: string | null
          author_id: string | null
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string | null
          views_count: number
          likes_count: number
          comments_count: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          featured_image_url?: string | null
          status?: ContentStatus
          category_id?: string | null
          author_id?: string | null
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          views_count?: number
          likes_count?: number
          comments_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          featured_image_url?: string | null
          status?: ContentStatus
          category_id?: string | null
          author_id?: string | null
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          views_count?: number
          likes_count?: number
          comments_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          user_id: string | null
          company_id: string | null
          status: InvoiceStatus
          subtotal: number
          tax_rate: number
          tax_amount: number
          total_amount: number
          currency: string | null
          billing_name: string | null
          billing_email: string | null
          billing_address: string | null
          billing_city: string | null
          billing_postal_code: string | null
          billing_country: string | null
          billing_vat_number: string | null
          xml_content: string | null
          pdf_url: string | null
          payment_method: string | null
          payment_reference: string | null
          paid_at: string | null
          due_date: string | null
          issued_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number?: string
          user_id?: string | null
          company_id?: string | null
          status?: InvoiceStatus
          subtotal: number
          tax_rate?: number
          tax_amount: number
          total_amount: number
          currency?: string | null
          billing_name?: string | null
          billing_email?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_postal_code?: string | null
          billing_country?: string | null
          billing_vat_number?: string | null
          xml_content?: string | null
          pdf_url?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          paid_at?: string | null
          due_date?: string | null
          issued_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          user_id?: string | null
          company_id?: string | null
          status?: InvoiceStatus
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          currency?: string | null
          billing_name?: string | null
          billing_email?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_postal_code?: string | null
          billing_country?: string | null
          billing_vat_number?: string | null
          xml_content?: string | null
          pdf_url?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          paid_at?: string | null
          due_date?: string | null
          issued_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
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
      user_role: UserRole
      offer_status: OfferStatus
      offer_type: OfferType
      employment_type: EmploymentType
      experience_level: ExperienceLevel
      payment_status: PaymentStatus
      invoice_status: InvoiceStatus
      content_status: ContentStatus
      category_type: CategoryType
    }
  }
}

// Helper types for common operations
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Offer = Database['public']['Tables']['offers']['Row']
export type OfferInsert = Database['public']['Tables']['offers']['Insert']
export type OfferUpdate = Database['public']['Tables']['offers']['Update']

export type BlogPost = Database['public']['Tables']['blog_posts']['Row']
export type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert']
export type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

// Extended types with relations
export type OfferWithRelations = Offer & {
  company?: Company
  category?: Category
  created_by_profile?: Profile
}

export type BlogPostWithRelations = BlogPost & {
  category?: Category
  author?: Profile
}

export type CompanyWithRelations = Company & {
  created_by_profile?: Profile
  offers?: Offer[]
}
