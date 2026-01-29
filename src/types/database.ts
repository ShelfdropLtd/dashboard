export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          contact_email: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_email?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          brand_id: string | null
          role: 'brand' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          brand_id?: string | null
          role?: 'brand' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          brand_id?: string | null
          role?: 'brand' | 'admin'
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          brand_id: string
          po_number: string
          order_date: string
          status: 'pending' | 'approved' | 'dispatched' | 'delivered' | 'cancelled'
          warehouse: string
          carrier: string | null
          tracking_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          po_number: string
          order_date: string
          status?: 'pending' | 'approved' | 'dispatched' | 'delivered' | 'cancelled'
          warehouse: string
          carrier?: string | null
          tracking_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          po_number?: string
          order_date?: string
          status?: 'pending' | 'approved' | 'dispatched' | 'delivered' | 'cancelled'
          warehouse?: string
          carrier?: string | null
          tracking_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_lines: {
        Row: {
          id: string
          order_id: string
          sku: string
          product_name: string
          quantity_cases: number
          case_price: number
          line_total: number
        }
        Insert: {
          id?: string
          order_id: string
          sku: string
          product_name: string
          quantity_cases: number
          case_price: number
          line_total?: number
        }
        Update: {
          id?: string
          order_id?: string
          sku?: string
          product_name?: string
          quantity_cases?: number
          case_price?: number
          line_total?: number
        }
      }
      invoices: {
        Row: {
          id: string
          brand_id: string
          order_id: string | null
          invoice_number: string
          amount: number
          status: 'pending' | 'paid' | 'overdue'
          due_date: string
          paid_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          order_id?: string | null
          invoice_number: string
          amount: number
          status?: 'pending' | 'paid' | 'overdue'
          due_date: string
          paid_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          order_id?: string | null
          invoice_number?: string
          amount?: number
          status?: 'pending' | 'paid' | 'overdue'
          due_date?: string
          paid_date?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Brand = Database['public']['Tables']['brands']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderLine = Database['public']['Tables']['order_lines']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']

export type OrderStatus = Order['status']
export type InvoiceStatus = Invoice['status']
export type UserRole = User['role']

// Extended types with relations
export type OrderWithLines = Order & {
  order_lines: OrderLine[]
  brands?: Brand
}

export type OrderWithBrand = Order & {
  brands: Brand
}

export type InvoiceWithBrand = Invoice & {
  brands: Brand
}
