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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          title: string
          type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_permissions: {
        Row: {
          agent_id: string
          company_id: string | null
          created_at: string
          enabled: boolean
          id: string
          permission_key: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          company_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          permission_key: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          company_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          permission_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_holder: string
          bank_country: string
          bank_name: string
          bic: string
          company_id: string | null
          created_at: string
          iban: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder: string
          bank_country: string
          bank_name: string
          bic: string
          company_id?: string | null
          created_at?: string
          iban: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          bank_country?: string
          bank_name?: string
          bic?: string
          company_id?: string | null
          created_at?: string
          iban?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_deposit_info: {
        Row: {
          account_holder: string
          bank_name: string
          bic: string | null
          company_id: string | null
          created_at: string
          currency: string
          iban: string
          id: string
          instructions: string | null
          max_amount: number | null
          min_amount: number | null
          reference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder: string
          bank_name: string
          bic?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          iban: string
          id?: string
          instructions?: string | null
          max_amount?: number | null
          min_amount?: number | null
          reference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          bank_name?: string
          bic?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          iban?: string
          id?: string
          instructions?: string | null
          max_amount?: number | null
          min_amount?: number | null
          reference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          admin_user_id: string | null
          admin_username: string | null
          created_at: string
          created_by: string | null
          crypto_id_code: string
          default_currency: string | null
          id: string
          is_onboarded: boolean
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_user_id?: string | null
          admin_username?: string | null
          created_at?: string
          created_by?: string | null
          crypto_id_code: string
          default_currency?: string | null
          id?: string
          is_onboarded?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string | null
          admin_username?: string | null
          created_at?: string
          created_by?: string | null
          crypto_id_code?: string
          default_currency?: string | null
          id?: string
          is_onboarded?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          agent_id: string | null
          available_balance: number | null
          blocked_balance: number | null
          city: string | null
          company_id: string | null
          country: string | null
          created_at: string
          crypto_experience: string | null
          date_of_birth: string | null
          email: string
          employer: string | null
          first_name: string | null
          fund_source: string | null
          has_foreign_accounts: boolean | null
          id: string
          income_range: string | null
          investment_experience: string | null
          is_politically_exposed: boolean | null
          kyc_document_back_url: string | null
          kyc_document_front_url: string | null
          kyc_selfie_url: string | null
          kyc_status: string | null
          last_name: string | null
          nationality: string | null
          occupation: string | null
          phone: string | null
          postal_code: string | null
          tax_residence: string | null
          updated_at: string
          wealth_range: string | null
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          available_balance?: number | null
          blocked_balance?: number | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          crypto_experience?: string | null
          date_of_birth?: string | null
          email: string
          employer?: string | null
          first_name?: string | null
          fund_source?: string | null
          has_foreign_accounts?: boolean | null
          id: string
          income_range?: string | null
          investment_experience?: string | null
          is_politically_exposed?: boolean | null
          kyc_document_back_url?: string | null
          kyc_document_front_url?: string | null
          kyc_selfie_url?: string | null
          kyc_status?: string | null
          last_name?: string | null
          nationality?: string | null
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          tax_residence?: string | null
          updated_at?: string
          wealth_range?: string | null
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          available_balance?: number | null
          blocked_balance?: number | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          crypto_experience?: string | null
          date_of_birth?: string | null
          email?: string
          employer?: string | null
          first_name?: string | null
          fund_source?: string | null
          has_foreign_accounts?: boolean | null
          id?: string
          income_range?: string | null
          investment_experience?: string | null
          is_politically_exposed?: boolean | null
          kyc_document_back_url?: string | null
          kyc_document_front_url?: string | null
          kyc_selfie_url?: string | null
          kyc_status?: string | null
          last_name?: string | null
          nationality?: string | null
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          tax_residence?: string | null
          updated_at?: string
          wealth_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      required_actions: {
        Row: {
          amount: number | null
          attachments: string[] | null
          company_id: string | null
          consequences: string | null
          contact_info: string | null
          created_at: string
          crypto_symbol: string | null
          currency: string | null
          description: string | null
          documents: string[] | null
          due_date: string | null
          how_to_proceed: string[] | null
          id: string
          legal_basis: string | null
          legal_description: string | null
          legal_title: string | null
          sort_order: number | null
          status: string | null
          template_id: string | null
          title: string
          translations: Json
          updated_at: string
          user_id: string
          why_required: string[] | null
        }
        Insert: {
          amount?: number | null
          attachments?: string[] | null
          company_id?: string | null
          consequences?: string | null
          contact_info?: string | null
          created_at?: string
          crypto_symbol?: string | null
          currency?: string | null
          description?: string | null
          documents?: string[] | null
          due_date?: string | null
          how_to_proceed?: string[] | null
          id?: string
          legal_basis?: string | null
          legal_description?: string | null
          legal_title?: string | null
          sort_order?: number | null
          status?: string | null
          template_id?: string | null
          title: string
          translations?: Json
          updated_at?: string
          user_id: string
          why_required?: string[] | null
        }
        Update: {
          amount?: number | null
          attachments?: string[] | null
          company_id?: string | null
          consequences?: string | null
          contact_info?: string | null
          created_at?: string
          crypto_symbol?: string | null
          currency?: string | null
          description?: string | null
          documents?: string[] | null
          due_date?: string | null
          how_to_proceed?: string[] | null
          id?: string
          legal_basis?: string | null
          legal_description?: string | null
          legal_title?: string | null
          sort_order?: number | null
          status?: string | null
          template_id?: string | null
          title?: string
          translations?: Json
          updated_at?: string
          user_id?: string
          why_required?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "required_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachments: string[] | null
          company_id: string | null
          created_at: string
          id: string
          is_admin: boolean
          is_read: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean
          is_read?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: string[] | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean
          is_read?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          admin_id: string | null
          amount: number
          company_id: string | null
          created_at: string
          crypto_amount: number | null
          crypto_symbol: string | null
          currency: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          amount: number
          company_id?: string | null
          created_at?: string
          crypto_amount?: number | null
          crypto_symbol?: string | null
          currency?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          amount?: number
          company_id?: string | null
          created_at?: string
          crypto_amount?: number | null
          crypto_symbol?: string | null
          currency?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_addresses: {
        Row: {
          address: string
          company_id: string | null
          created_at: string
          crypto_name: string
          crypto_symbol: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          company_id?: string | null
          created_at?: string
          crypto_name: string
          crypto_symbol: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          company_id?: string | null
          created_at?: string
          crypto_name?: string
          crypto_symbol?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_addresses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_secure: {
        Row: {
          address: string | null
          agent_id: string | null
          available_balance: number | null
          blocked_balance: number | null
          city: string | null
          company_id: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          kyc_status: string | null
          last_name: string | null
          nationality: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          available_balance?: number | null
          blocked_balance?: number | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          kyc_status?: string | null
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          available_balance?: number | null
          blocked_balance?: number | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          kyc_status?: string | null
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_delete_transaction: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      agent_has_permission: {
        Args: { _agent_id: string; _permission_key: string }
        Returns: boolean
      }
      can_access_client: { Args: { _client_id: string }; Returns: boolean }
      check_rate_limit: { Args: { p_email: string }; Returns: Json }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      get_user_company_id: { Args: { _user_id?: string }; Returns: string }
      has_admin_access: { Args: { _user_id?: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_activity_log: {
        Args: {
          p_description?: string
          p_ip_address?: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_agent: { Args: { _user_id?: string }; Returns: boolean }
      is_company_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_platform_owner: { Args: { _user_id?: string }; Returns: boolean }
      is_same_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id?: string }; Returns: boolean }
      process_balance_transaction: {
        Args: {
          p_admin_id: string
          p_amount: number
          p_company_id?: string
          p_crypto_amount?: number
          p_crypto_symbol?: string
          p_description?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      process_withdrawal_request: {
        Args: { p_amount: number; p_description?: string }
        Returns: string
      }
      record_login_attempt: {
        Args: { p_email: string; p_success: boolean }
        Returns: undefined
      }
      validate_company_crypto_code: {
        Args: { p_crypto_id_code: string }
        Returns: {
          id: string
          name: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "client"
        | "super_admin"
        | "platform_owner"
        | "company_admin"
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
  public: {
    Enums: {
      app_role: [
        "admin",
        "client",
        "super_admin",
        "platform_owner",
        "company_admin",
      ],
    },
  },
} as const
