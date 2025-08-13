export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          approved_by: string | null
          check_in: string
          check_out: string | null
          created_at: string | null
          date: string
          id: string
          mechanic_id: string
          notes: string | null
          organization_id: string | null
          status: Database["public"]["Enums"]["attendance_status_enum"] | null
        }
        Insert: {
          approved_by?: string | null
          check_in: string
          check_out?: string | null
          created_at?: string | null
          date: string
          id?: string
          mechanic_id: string
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status_enum"] | null
        }
        Update: {
          approved_by?: string | null
          check_in?: string
          check_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          mechanic_id?: string
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          published: boolean | null
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          published?: boolean | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          published?: boolean | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          company_name: string | null
          company_size: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
        }
        Insert: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          last_visit: string | null
          lifetime_value: number | null
          name: string
          organization_id: string | null
          phone: string | null
          total_visits: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_visit?: string | null
          lifetime_value?: number | null
          name: string
          organization_id?: string | null
          phone?: string | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_visit?: string | null
          lifetime_value?: number | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          organization_id: string | null
          payment_method:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_status: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          organization_id?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          creates_inventory_part: boolean | null
          creates_task: boolean | null
          custom_labor_data: Json | null
          custom_part_data: Json | null
          description: string
          id: string
          invoice_id: string
          is_auto_added: boolean | null
          organization_id: string | null
          part_id: string | null
          price: number
          quantity: number
          task_id: string | null
          type: string
          unit_of_measure: string | null
        }
        Insert: {
          created_at?: string | null
          creates_inventory_part?: boolean | null
          creates_task?: boolean | null
          custom_labor_data?: Json | null
          custom_part_data?: Json | null
          description: string
          id?: string
          invoice_id: string
          is_auto_added?: boolean | null
          organization_id?: string | null
          part_id?: string | null
          price: number
          quantity: number
          task_id?: string | null
          type: string
          unit_of_measure?: string | null
        }
        Update: {
          created_at?: string | null
          creates_inventory_part?: boolean | null
          creates_task?: boolean | null
          custom_labor_data?: Json | null
          custom_part_data?: Json | null
          description?: string
          id?: string
          invoice_id?: string
          is_auto_added?: boolean | null
          organization_id?: string | null
          part_id?: string | null
          price?: number
          quantity?: number
          task_id?: string | null
          type?: string
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoice_items_part_id"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoice_items_task_id"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
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
          created_at: string | null
          customer_id: string
          date: string | null
          discount_type: string
          discount_value: number | null
          due_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          status: string
          tax_rate: number | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          date?: string | null
          discount_type?: string
          discount_value?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status: string
          tax_rate?: number | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          date?: string | null
          discount_type?: string
          discount_value?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: string
          tax_rate?: number | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          address: string | null
          created_at: string | null
          employment_type:
            | Database["public"]["Enums"]["employment_type_enum"]
            | null
          id: string
          id_card_image: string | null
          is_active: boolean | null
          name: string
          organization_id: string | null
          phone: string | null
          specialization: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type_enum"]
            | null
          id?: string
          id_card_image?: string | null
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type_enum"]
            | null
          id?: string
          id_card_image?: string | null
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          logo: string | null
          name: string
          phone: string | null
          subscription_level: string
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          name: string
          phone?: string | null
          subscription_level?: string
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          name?: string
          phone?: string | null
          subscription_level?: string
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          invoice_ids: string[] | null
          location: string | null
          manufacturer: string | null
          name: string
          organization_id: string | null
          part_number: string | null
          price: number
          quantity: number
          reorder_level: number | null
          unit: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_ids?: string[] | null
          location?: string | null
          manufacturer?: string | null
          name: string
          organization_id?: string | null
          part_number?: string | null
          price: number
          quantity?: number
          reorder_level?: number | null
          unit?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_ids?: string[] | null
          location?: string | null
          manufacturer?: string | null
          name?: string
          organization_id?: string | null
          part_number?: string | null
          price?: number
          quantity?: number
          reorder_level?: number | null
          unit?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          due_date: string | null
          expense_id: string | null
          id: string
          notes: string | null
          organization_id: string | null
          paid_amount: number | null
          payment_date: string | null
          payment_method: string | null
          reference_number: string | null
          status: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          due_date?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          due_date?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payables_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          date: string | null
          id: string
          invoice_id: string
          method: string
          notes: string | null
          organization_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string | null
          id?: string
          invoice_id: string
          method: string
          notes?: string | null
          organization_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string | null
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          lastLogin: string | null
          name: string | null
          organization_id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          lastLogin?: string | null
          name?: string | null
          organization_id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lastLogin?: string | null
          name?: string | null
          organization_id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          included_seats: number
          is_active: boolean
          name: string
          price_monthly: number
          price_per_additional_seat: number
          price_yearly: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          included_seats?: number
          is_active?: boolean
          name: string
          price_monthly?: number
          price_per_additional_seat?: number
          price_yearly?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          included_seats?: number
          is_active?: boolean
          name?: string
          price_monthly?: number
          price_per_additional_seat?: number
          price_yearly?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      superadmin_activity: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string
          superadmin_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type: string
          superadmin_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string
          superadmin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "superadmin_activity_superadmin_id_fkey"
            columns: ["superadmin_id"]
            isOneToOne: false
            referencedRelation: "superadmins"
            referencedColumns: ["id"]
          },
        ]
      }
      superadmin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          superadmin_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          superadmin_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          superadmin_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "superadmin_sessions_superadmin_id_fkey"
            columns: ["superadmin_id"]
            isOneToOne: false
            referencedRelation: "superadmins"
            referencedColumns: ["id"]
          },
        ]
      }
      superadmins: {
        Row: {
          _id: string | null
          created_at: string
          id: string
          last_login: string | null
          password_hash: string
          username: string
        }
        Insert: {
          _id?: string | null
          created_at?: string
          id?: string
          last_login?: string | null
          password_hash: string
          username: string
        }
        Update: {
          _id?: string | null
          created_at?: string
          id?: string
          last_login?: string | null
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          hours_estimated: number
          hours_spent: number | null
          id: string
          invoice_id: string | null
          labor_rate: number | null
          location: string | null
          mechanic_id: string | null
          organization_id: string | null
          price: number | null
          skill_level: string | null
          start_time: string | null
          status: string
          title: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_estimated: number
          hours_spent?: number | null
          id?: string
          invoice_id?: string | null
          labor_rate?: number | null
          location?: string | null
          mechanic_id?: string | null
          organization_id?: string | null
          price?: number | null
          skill_level?: string | null
          start_time?: string | null
          status: string
          title: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          hours_estimated?: number
          hours_spent?: number | null
          id?: string
          invoice_id?: string | null
          labor_rate?: number | null
          location?: string | null
          mechanic_id?: string | null
          organization_id?: string | null
          price?: number | null
          skill_level?: string | null
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string | null
          customer_id: string
          id: string
          license_plate: string
          make: string
          model: string
          organization_id: string | null
          updated_at: string | null
          vin: string | null
          year: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          license_plate: string
          make: string
          model: string
          organization_id?: string | null
          updated_at?: string | null
          vin?: string | null
          year: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          license_plate?: string
          make?: string
          model?: string
          organization_id?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          category: string | null
          contact_name: string
          created_at: string | null
          credit_limit: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          organization_id: string | null
          payment_terms: number | null
          phone: string
          tax_id: string | null
          updated_at: string | null
          vendor_type: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_name: string
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          organization_id?: string | null
          payment_terms?: number | null
          phone: string
          tax_id?: string | null
          updated_at?: string | null
          vendor_type?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_name?: string
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          payment_terms?: number | null
          phone?: string
          tax_id?: string | null
          updated_at?: string | null
          vendor_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_column_if_not_exists: {
        Args: {
          p_table_name: string
          p_column_name: string
          p_column_type: string
        }
        Returns: undefined
      }
      clean_user_data: {
        Args: { user_id: string }
        Returns: undefined
      }
      column_exists: {
        Args: { p_table_name: string; p_column_name: string }
        Returns: boolean
      }
      create_organization_and_assign_user: {
        Args: {
          p_user_id: string
          p_organization_name: string
          p_user_name: string
          p_user_role?: string
        }
        Returns: Json
      }
      current_user_org: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_inactive_users: {
        Args: { days_inactive?: number }
        Returns: {
          id: string
          name: string
          email: string
          last_login: string
          days_since_login: number
        }[]
      }
      get_user_profile: {
        Args: { user_id?: string }
        Returns: {
          id: string
          email: string
          name: string
          organization_id: string
          role: string
          is_active: boolean
          last_login: string
          created_at: string
          updated_at: string
        }[]
      }
      log_superadmin_activity: {
        Args: {
          p_superadmin_id: string
          p_action_type: string
          p_resource_type: string
          p_resource_id: string
          p_details: Json
        }
        Returns: string
      }
      superadmin_login: {
        Args: { username: string; password_hash: string }
        Returns: Json
      }
      superadmin_login_new: {
        Args: { userid: string }
        Returns: Json
      }
      user_is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      verify_superadmin_token: {
        Args: { token: string }
        Returns: boolean
      }
      verify_superadmin_token_new: {
        Args: { superadmin_token: string }
        Returns: boolean
      }
    }
    Enums: {
      attendance_status_enum:
        | "present"
        | "late"
        | "absent"
        | "half-day"
        | "pending"
        | "approved"
        | "rejected"
      employment_type_enum: "fulltime" | "contractor"
      payment_method_enum: "cash" | "card" | "bank-transfer" | "check" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status_enum: [
        "present",
        "late",
        "absent",
        "half-day",
        "pending",
        "approved",
        "rejected",
      ],
      employment_type_enum: ["fulltime", "contractor"],
      payment_method_enum: ["cash", "card", "bank-transfer", "check", "other"],
    },
  },
} as const
