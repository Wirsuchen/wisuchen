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
            referencedColumns: ["user_id"]
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
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          seo_keywords: string[] | null
          slug: string
          status: Database["public"]["Enums"]["content_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          seo_keywords?: string[] | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          seo_keywords?: string[] | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          type: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
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
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_pages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id?: string | null
          quantity?: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_address: string | null
          client_email: string | null
          client_name: string
          created_at: string | null
          created_by: string | null
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          tax_amount: number
          tax_rate: number
          updated_at: string | null
        }
        Insert: {
          amount?: number
          client_address?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number
          tax_rate?: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number
          tax_rate?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      offers: {
        Row: {
          affiliate_link: string | null
          category_id: string | null
          company_id: string | null
          created_at: string | null
          currency: string
          description: string
          discount_percentage: number | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          expires_at: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          is_remote: boolean | null
          location: string | null
          original_price: number | null
          price: number | null
          publisher_id: string | null
          salary_max: number | null
          salary_min: number | null
          slug: string
          source: string | null
          source_id: string | null
          status: Database["public"]["Enums"]["offer_status"] | null
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string | null
          views: number | null
        }
        Insert: {
          affiliate_link?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string
          description: string
          discount_percentage?: number | null
          employment_type?: Database["public"]["Enums"]["employment_type"] | null
          expires_at?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_remote?: boolean | null
          location?: string | null
          original_price?: number | null
          price?: number | null
          publisher_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slug: string
          source?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          affiliate_link?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string
          discount_percentage?: number | null
          employment_type?: Database["public"]["Enums"]["employment_type"] | null
          expires_at?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_remote?: boolean | null
          location?: string | null
          original_price?: number | null
          price?: number | null
          publisher_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slug?: string
          source?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
          views?: number | null
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
            foreignKeyName: "offers_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      saved_offers: {
        Row: {
          created_at: string | null
          id: string
          offer_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          offer_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          offer_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
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
