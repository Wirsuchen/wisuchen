// Database types for TalentPlus - Clean re-export from Supabase types
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './supabase'
export type { 
  Profile, 
  Company, 
  Category, 
  Offer, 
  OfferWithRelations 
} from './supabase'

// Additional helper types
export type UserRole = Database['public']['Enums']['user_role']
export type OfferStatus = Database['public']['Enums']['offer_status']
export type OfferType = Database['public']['Enums']['offer_type']
export type EmploymentType = Database['public']['Enums']['employment_type']
export type ExperienceLevel = Database['public']['Enums']['experience_level']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type InvoiceStatus = Database['public']['Enums']['invoice_status']
export type ContentStatus = Database['public']['Enums']['content_status']
export type CategoryType = Database['public']['Enums']['category_type']
