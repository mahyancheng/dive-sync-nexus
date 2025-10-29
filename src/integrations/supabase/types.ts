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
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          is_group: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dive_buddies: {
        Row: {
          buddy_avatar: string | null
          buddy_name: string
          dive_log_id: string
          id: string
        }
        Insert: {
          buddy_avatar?: string | null
          buddy_name: string
          dive_log_id: string
          id?: string
        }
        Update: {
          buddy_avatar?: string | null
          buddy_name?: string
          dive_log_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dive_buddies_dive_log_id_fkey"
            columns: ["dive_log_id"]
            isOneToOne: false
            referencedRelation: "dive_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      dive_centers: {
        Row: {
          avatar_url: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dive_logs: {
        Row: {
          air_consumption: string | null
          avg_depth: string | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string | null
          duration: string
          id: string
          max_depth: string
          notes: string | null
          post_id: string
          site: string
          temperature: string | null
          visibility: string
        }
        Insert: {
          air_consumption?: string | null
          avg_depth?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string | null
          duration: string
          id?: string
          max_depth: string
          notes?: string | null
          post_id: string
          site: string
          temperature?: string | null
          visibility: string
        }
        Update: {
          air_consumption?: string | null
          avg_depth?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string | null
          duration?: string
          id?: string
          max_depth?: string
          notes?: string | null
          post_id?: string
          site?: string
          temperature?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "dive_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          badges: string[] | null
          created_at: string | null
          description: string | null
          difficulty: string
          dive_center_id: string | null
          duration: string
          id: string
          image_url: string | null
          includes: string[] | null
          location: string
          max_depth: string | null
          next_date: string | null
          price: number
          rating: number | null
          reviews_count: number | null
          spots_left: number
          title: string
          total_spots: number
          updated_at: string | null
        }
        Insert: {
          badges?: string[] | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          dive_center_id?: string | null
          duration: string
          id?: string
          image_url?: string | null
          includes?: string[] | null
          location: string
          max_depth?: string | null
          next_date?: string | null
          price: number
          rating?: number | null
          reviews_count?: number | null
          spots_left?: number
          title: string
          total_spots?: number
          updated_at?: string | null
        }
        Update: {
          badges?: string[] | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          dive_center_id?: string | null
          duration?: string
          id?: string
          image_url?: string | null
          includes?: string[] | null
          location?: string
          max_depth?: string | null
          next_date?: string | null
          price?: number
          rating?: number | null
          reviews_count?: number | null
          spots_left?: number
          title?: string
          total_spots?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_dive_center_id_fkey"
            columns: ["dive_center_id"]
            isOneToOne: false
            referencedRelation: "dive_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          caption: string | null
          comments_count: number | null
          created_at: string | null
          dive_center_id: string | null
          experience_id: string | null
          id: string
          image_url: string
          likes_count: number | null
          product_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          dive_center_id?: string | null
          experience_id?: string | null
          id?: string
          image_url: string
          likes_count?: number | null
          product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          dive_center_id?: string | null
          experience_id?: string | null
          id?: string
          image_url?: string
          likes_count?: number | null
          product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_dive_center_id_fkey"
            columns: ["dive_center_id"]
            isOneToOne: false
            referencedRelation: "dive_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badges: string[] | null
          brand: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          price: number
          rating: number | null
          reviews_count: number | null
          seller_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          badges?: string[] | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          price: number
          rating?: number | null
          reviews_count?: number | null
          seller_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          badges?: string[] | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          price?: number
          rating?: number | null
          reviews_count?: number | null
          seller_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string | null
          full_name: string | null
          id: string
          joined_date: string | null
          location: string | null
          total_dives: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          full_name?: string | null
          id: string
          joined_date?: string | null
          location?: string | null
          total_dives?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          joined_date?: string | null
          location?: string | null
          total_dives?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_or_get_direct_conversation: {
        Args: { target_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
