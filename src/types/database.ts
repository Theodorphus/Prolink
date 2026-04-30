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

export interface Job {
  id: string
  customer_id: string
  title: string
  description: string
  budget: number | null
  status: JobStatus
  created_at: string
}

export interface Service {
  id: string
  provider_id: string
  title: string
  description: string
  price: number
  delivery_time: string
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
  created_at: string
}

export interface Message {
  id: string
  offer_id: string
  sender_id: string
  content: string
  attachment_url: string | null
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
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at'>
        Update: Partial<Omit<Job, 'id' | 'created_at'>>
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      job_status: JobStatus
      offer_status: OfferStatus
      price_type: PriceType
    }
    CompositeTypes: Record<string, never>
  }
}
