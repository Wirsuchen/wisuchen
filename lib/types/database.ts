// Database types for TalentPlus - Import from generated Supabase types
// NOTE: This file re-exports types from the automatically generated supabase.ts file.
// Do not manually modify the Database interface here. Run 'supabase gen types' to update supabase.ts instead.

import type { Database as SupabaseDatabase, Enums as SupaEnums } from './supabase'

// Enum aliases from generated Supabase types
// We use the Enums utility type from supabase.ts to safely extract enums
export type UserRole = SupaEnums<'user_role'>
export type OfferStatus = SupaEnums<'offer_status'>
export type OfferType = SupaEnums<'offer_type'>
export type EmploymentType = SupaEnums<'employment_type'>
export type ExperienceLevel = SupaEnums<'experience_level'>
export type PaymentStatus = SupaEnums<'payment_status'>
export type InvoiceStatus = SupaEnums<'invoice_status'>
export type ContentStatus = SupaEnums<'content_status'>
export type CategoryType = SupaEnums<'category_type'>

// Export the Database type from the generated file
export type Database = SupabaseDatabase

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
