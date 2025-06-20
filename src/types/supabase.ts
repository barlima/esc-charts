export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contests: {
        Row: {
          created_at: string | null
          host_city: string
          host_country: string
          id: number
          logo_url: string | null
          slogan: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          host_city: string
          host_country: string
          id?: number
          logo_url?: string | null
          slogan?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          host_city?: string
          host_country?: string
          id?: number
          logo_url?: string | null
          slogan?: string | null
          year?: number
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          first_participation_year: number | null
          flag_url: string | null
          id: number
          name: string
          slug: string | null
          wins: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          first_participation_year?: number | null
          flag_url?: string | null
          id?: number
          name: string
          slug?: string | null
          wins?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          first_participation_year?: number | null
          flag_url?: string | null
          id?: number
          name?: string
          slug?: string | null
          wins?: number | null
        }
        Relationships: []
      }
      songs: {
        Row: {
          artist: string
          contest_id: number
          country_id: number
          created_at: string | null
          final_place: number | null
          id: number
          lyrics: string | null
          points: number | null
          qualified: boolean | null
          running_order: number | null
          spotify_url: string | null
          title: string
          venue_type: Database["public"]["Enums"]["venue_type"]
          youtube_url: string | null
        }
        Insert: {
          artist: string
          contest_id: number
          country_id: number
          created_at?: string | null
          final_place?: number | null
          id?: number
          lyrics?: string | null
          points?: number | null
          qualified?: boolean | null
          running_order?: number | null
          spotify_url?: string | null
          title: string
          venue_type: Database["public"]["Enums"]["venue_type"]
          youtube_url?: string | null
        }
        Update: {
          artist?: string
          contest_id?: number
          country_id?: number
          created_at?: string | null
          final_place?: number | null
          id?: number
          lyrics?: string | null
          points?: number | null
          qualified?: boolean | null
          running_order?: number | null
          spotify_url?: string | null
          title?: string
          venue_type?: Database["public"]["Enums"]["venue_type"]
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          contest_id: number
          created_at: string | null
          id: number
          type: Database["public"]["Enums"]["venue_type"]
        }
        Insert: {
          contest_id: number
          created_at?: string | null
          id?: number
          type: Database["public"]["Enums"]["venue_type"]
        }
        Update: {
          contest_id?: number
          created_at?: string | null
          id?: number
          type?: Database["public"]["Enums"]["venue_type"]
        }
        Relationships: [
          {
            foreignKeyName: "venues_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          contest_id: number
          created_at: string | null
          from_country_id: number
          id: number
          jury_or_televote: Database["public"]["Enums"]["vote_type"]
          points: number
          song_id: number | null
          to_country_id: number
          venue_id: number
        }
        Insert: {
          contest_id: number
          created_at?: string | null
          from_country_id: number
          id?: number
          jury_or_televote: Database["public"]["Enums"]["vote_type"]
          points: number
          song_id?: number | null
          to_country_id: number
          venue_id: number
        }
        Update: {
          contest_id?: number
          created_at?: string | null
          from_country_id?: number
          id?: number
          jury_or_televote?: Database["public"]["Enums"]["vote_type"]
          points?: number
          song_id?: number | null
          to_country_id?: number
          venue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_from_country_id_fkey"
            columns: ["from_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_to_country_id_fkey"
            columns: ["to_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      country_performances: {
        Row: {
          contest_id: number | null
          country_id: number | null
          country_name: string | null
          final_place: number | null
          points_final: number | null
          points_semifinal: number | null
          qualified: boolean | null
          semifinal_place: number | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_country_performance_history: {
        Args: { country_id_param: number }
        Returns: {
          year: number
          final_place: number
          semifinal_place: number
          venue_type: Database["public"]["Enums"]["venue_type"]
          qualified: boolean
          artist: string
          title: string
        }[]
      }
      get_participating_countries_optimized: {
        Args: { contest_id_param: number; venue_type_param: string }
        Returns: {
          country_id: number
          country_name: string
        }[]
      }
      get_song_points: {
        Args: { song_id_param: number }
        Returns: {
          jury_points: number
          televote_points: number
          total_points: number
        }[]
      }
      get_song_position: {
        Args: {
          song_id_param: number
          venue_type_param: Database["public"]["Enums"]["venue_type"]
        }
        Returns: number
      }
      get_songs_with_points: {
        Args: { contest_id_param: number }
        Returns: {
          id: number
          country_name: string
          country_id: number
          artist: string
          title: string
          venue_type: Database["public"]["Enums"]["venue_type"]
          jury_points: number
          televote_points: number
          total_points: number
        }[]
      }
      get_votes_given_by_country: {
        Args: {
          country_id_param: number
          contest_id_param: number
          venue_type_param: string
        }
        Returns: {
          points: number
          to_country_name: string
          artist: string
          title: string
          jury_or_televote: string
        }[]
      }
      get_votes_received_by_country_optimized: {
        Args: { song_id_param: number }
        Returns: {
          from_country_name: string
          jury_points: number
          televote_points: number
        }[]
      }
    }
    Enums: {
      venue_type: "final" | "semifinal1" | "semifinal2"
      vote_type: "jury" | "televote" | "combined"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      venue_type: ["final", "semifinal1", "semifinal2"],
      vote_type: ["jury", "televote", "combined"],
    },
  },
} as const
