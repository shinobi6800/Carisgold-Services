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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_no: number
          budget_range: string | null
          created_at: string
          customer_name: string
          email: string
          event_date: string
          event_type: string
          guests: number | null
          id: string
          message: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          paystack_reference: string | null
          phone: string
          quote_amount: number | null
          quote_note: string | null
          quote_sent_at: string | null
          service_type: string
          status: Database["public"]["Enums"]["booking_status"]
          terms_accepted_at: string
          terms_version: number
          updated_at: string
          user_id: string | null
          venue: string | null
        }
        Insert: {
          booking_no?: never
          budget_range?: string | null
          created_at?: string
          customer_name: string
          email: string
          event_date: string
          event_type: string
          guests?: number | null
          id?: string
          message?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_reference?: string | null
          phone: string
          quote_amount?: number | null
          quote_note?: string | null
          quote_sent_at?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["booking_status"]
          terms_accepted_at?: string
          terms_version: number
          updated_at?: string
          user_id?: string | null
          venue?: string | null
        }
        Update: {
          booking_no?: never
          budget_range?: string | null
          created_at?: string
          customer_name?: string
          email?: string
          event_date?: string
          event_type?: string
          guests?: number | null
          id?: string
          message?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_reference?: string | null
          phone?: string
          quote_amount?: number | null
          quote_note?: string | null
          quote_sent_at?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["booking_status"]
          terms_accepted_at?: string
          terms_version?: number
          updated_at?: string
          user_id?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_terms_version_fkey"
            columns: ["terms_version"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["version"]
          },
        ]
      }
      order_items: {
        Row: {
          description: string
          id: string
          item_type: string
          line_total: number | null
          order_id: string
          product_id: string | null
          quantity: number
          treat_id: string | null
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          description: string
          id?: string
          item_type: string
          line_total?: number | null
          order_id: string
          product_id?: string | null
          quantity?: number
          treat_id?: string | null
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          description?: string
          id?: string
          item_type?: string
          line_total?: number | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          treat_id?: string | null
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_treat_id_fkey"
            columns: ["treat_id"]
            isOneToOne: false
            referencedRelation: "treats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_name: string
          delivery_address: string | null
          email: string
          event_date: string | null
          fulfilment: string
          guests: number | null
          id: string
          is_late_order: boolean
          notes: string | null
          order_no: number
          order_type: Database["public"]["Enums"]["order_type"]
          package_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          paystack_reference: string | null
          phone: string
          status: Database["public"]["Enums"]["order_status"]
          terms_accepted_at: string
          terms_version: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_name: string
          delivery_address?: string | null
          email: string
          event_date?: string | null
          fulfilment?: string
          guests?: number | null
          id?: string
          is_late_order?: boolean
          notes?: string | null
          order_no?: never
          order_type: Database["public"]["Enums"]["order_type"]
          package_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_reference?: string | null
          phone: string
          status?: Database["public"]["Enums"]["order_status"]
          terms_accepted_at?: string
          terms_version: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_name?: string
          delivery_address?: string | null
          email?: string
          event_date?: string | null
          fulfilment?: string
          guests?: number | null
          id?: string
          is_late_order?: boolean
          notes?: string | null
          order_no?: never
          order_type?: Database["public"]["Enums"]["order_type"]
          package_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_reference?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["order_status"]
          terms_accepted_at?: string
          terms_version?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_terms_version_fkey"
            columns: ["terms_version"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["version"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          guests: number
          id: string
          includes: string
          is_active: boolean
          price: number
          updated_at: string
          varieties: number
        }
        Insert: {
          created_at?: string
          guests: number
          id?: string
          includes?: string
          is_active?: boolean
          price: number
          updated_at?: string
          varieties: number
        }
        Update: {
          created_at?: string
          guests?: number
          id?: string
          includes?: string
          is_active?: boolean
          price?: number
          updated_at?: string
          varieties?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          channel: string | null
          created_at: string
          currency: string
          id: string
          order_id: string | null
          paid_at: string | null
          raw: Json | null
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          booking_id?: string | null
          channel?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          raw?: Json | null
          reference: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          booking_id?: string | null
          channel?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          raw?: Json | null
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          id: string
          is_active: boolean
          price: number
          product_id: string
          size: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          price: number
          product_id: string
          size: string
        }
        Update: {
          id?: string
          is_active?: boolean
          price?: number
          product_id?: string
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available_in_packages: boolean
          available_in_shop: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_preorder: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          available_in_packages?: boolean
          available_in_shop?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_preorder?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          available_in_packages?: boolean
          available_in_shop?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_preorder?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      terms: {
        Row: {
          body: string
          created_at: string
          id: string
          is_current: boolean
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_current?: boolean
          version: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_current?: boolean
          version?: number
        }
        Relationships: []
      }
      treats: {
        Row: {
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "new"
        | "quoted"
        | "accepted"
        | "paid"
        | "completed"
        | "cancelled"
      order_status:
        | "new"
        | "confirmed"
        | "preparing"
        | "ready"
        | "delivered"
        | "cancelled"
      order_type: "juice" | "package"
      payment_status: "pending" | "paid" | "failed" | "refunded"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "new",
        "quoted",
        "accepted",
        "paid",
        "completed",
        "cancelled",
      ],
      order_status: [
        "new",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
      ],
      order_type: ["juice", "package"],
      payment_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
