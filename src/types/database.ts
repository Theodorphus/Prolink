export type UserRole = 'customer' | 'provider'
export type JobStatus = 'open' | 'closed'
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'delivered' | 'completed'
export type PriceType = 'fixed' | 'hourly'

export interface User {
  id: string
  role: UserRole
  name: string
  bio: string | null
  skills: string[] | null
  hourly_rate: number | null
  avatar_url: string | null
  linkedin_url: string | null
  created_at: string
}

export interface UserPrivateProfile {
  user_id: string
  phone: string | null
  cv_text: string | null
  cv_path: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  customer_id: string
  title: string
  description: string
  budget: number | null
  status: JobStatus
  category: string | null
  salary: string | null
  location: string | null
  work_type: string | null
  employer_name: string | null
  employer_email: string | null
  contact_info: string | null
  created_at: string
}

// Det publika urvalet av ett uppdrag. Motsvarar PUBLIC_JOB_FIELDS i
// src/lib/jobs.ts och utelämnar employer_email och contact_info, som aldrig får
// lämna servern i ett publikt svar. Typa publika jobblistor som PublicJob så
// fångar kompilatorn försök att läsa de privata fälten.
export type PublicJob = Omit<Job, 'employer_email' | 'contact_info'>

export interface Application {
  id: string
  job_id: string
  user_id: string | null
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  message: string | null
  cv_url: string | null
  created_at: string
}

export interface Service {
  id: string
  provider_id: string
  title: string
  description: string
  price: number
  delivery_time: string
  category: string | null
  created_at: string
}

export interface Offer {
  id: string
  job_id: string
  provider_id: string
  price: number
  price_type: PriceType
  timeline: string
  description: string
  status: OfferStatus
  provider_read_at: string | null
  customer_read_at: string | null
  created_at: string
}

export interface Message {
  id: string
  offer_id: string
  sender_id: string
  content: string
  attachment_path: string | null
  attachment_url: string | null
  created_at: string
}

export interface SavedJob {
  id: string
  user_id: string
  job_id: string
  created_at: string
}

// Joined types for UI
export interface JobWithCustomer extends Job {
  customer: User
  offer_count?: number
}

export interface OfferWithDetails extends Offer {
  provider: User
  job: Job
}

export interface MessageWithSender extends Message {
  sender: User
}

export interface Review {
  id: string
  offer_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface ReviewWithReviewer extends Review {
  reviewer: Pick<User, 'id' | 'name' | 'avatar_url'>
}

// Supabase Database type
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
        Relationships: []
      }
      user_private_profiles: {
        Row: UserPrivateProfile
        Insert: Omit<UserPrivateProfile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserPrivateProfile, 'user_id' | 'created_at'>>
        Relationships: []
      }
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Job, 'id' | 'created_at'>>
        Relationships: []
      }
      applications: {
        Row: Application
        Insert: Omit<Application, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Application, 'id' | 'created_at'>>
        Relationships: []
      }
      services: {
        Row: Service
        Insert: Omit<Service, 'id' | 'created_at'>
        Update: Partial<Omit<Service, 'id' | 'created_at'>>
        Relationships: []
      }
      offers: {
        Row: Offer
        Insert: Omit<Offer, 'id' | 'created_at'>
        Update: Partial<Omit<Offer, 'id' | 'created_at'>>
        Relationships: []
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
        Relationships: []
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
        Relationships: []
      }
      saved_jobs: {
        Row: SavedJob
        Insert: Omit<SavedJob, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<SavedJob, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      transition_offer: {
        Args: { p_offer_id: string; p_new_status: OfferStatus }
        Returns: Offer
      }
      mark_offer_read: {
        Args: { p_offer_id: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: UserRole
      job_status: JobStatus
      offer_status: OfferStatus
      price_type: PriceType
    }
    CompositeTypes: Record<string, never>
  }
}
