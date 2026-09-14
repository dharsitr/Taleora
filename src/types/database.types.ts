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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon_name: string
          id: string
          order_index: number
          target_type: string
          target_value: number
          tier: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon_name?: string
          id: string
          order_index?: number
          target_type: string
          target_value: number
          tier?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          order_index?: number
          target_type?: string
          target_value?: number
          tier?: string
          title?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json | null
          id: string
          reason: string | null
          target_id: string
          target_title: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json | null
          id?: string
          reason?: string | null
          target_id: string
          target_title?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          reason?: string | null
          target_id?: string
          target_title?: string | null
          target_type?: string
        }
        Relationships: []
      }
      author_follows: {
        Row: {
          author_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_follows_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          follower_count: number
          id: string
          is_suspended: boolean
          is_verified: boolean
          moderated_at: string | null
          moderated_by: string | null
          name: string
          slug: string
          suspension_reason: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          follower_count?: number
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          name: string
          slug: string
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          follower_count?: number
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          name?: string
          slug?: string
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      book_genres: {
        Row: {
          book_id: string
          created_at: string
          genre_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          genre_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          genre_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_genres_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      book_reviews: {
        Row: {
          book_id: string
          comments_count: number
          content: string
          created_at: string
          id: string
          likes_count: number
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          moderation_status: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          book_id: string
          chapter_id: string
          created_at: string
          id: string
          label: string | null
          paragraph_index: number
          progress_percentage: number
          snippet: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          chapter_id: string
          created_at?: string
          id?: string
          label?: string | null
          paragraph_index?: number
          progress_percentage?: number
          snippet?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          chapter_id?: string
          created_at?: string
          id?: string
          label?: string | null
          paragraph_index?: number
          progress_percentage?: number
          snippet?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author_id: string
          average_rating: number
          cover_accent: string | null
          cover_gradient: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          estimated_read_time_minutes: number
          featured: boolean
          id: string
          is_suspended: boolean
          moderated_at: string | null
          moderated_by: string | null
          published_at: string | null
          ratings_count: number
          release_schedule: string
          slug: string
          status: string
          subtitle: string | null
          suspension_reason: string | null
          tags: string[] | null
          title: string
          total_chapters: number
          trending: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_id: string
          average_rating?: number
          cover_accent?: string | null
          cover_gradient?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          estimated_read_time_minutes?: number
          featured?: boolean
          id?: string
          is_suspended?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          published_at?: string | null
          ratings_count?: number
          release_schedule?: string
          slug: string
          status?: string
          subtitle?: string | null
          suspension_reason?: string | null
          tags?: string[] | null
          title: string
          total_chapters?: number
          trending?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_id?: string
          average_rating?: number
          cover_accent?: string | null
          cover_gradient?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          estimated_read_time_minutes?: number
          featured?: boolean
          id?: string
          is_suspended?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          published_at?: string | null
          ratings_count?: number
          release_schedule?: string
          slug?: string
          status?: string
          subtitle?: string | null
          suspension_reason?: string | null
          tags?: string[] | null
          title?: string
          total_chapters?: number
          trending?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          book_id: string
          chapter_number: number
          content: string
          created_at: string
          estimated_read_minutes: number
          id: string
          is_suspended: boolean
          moderated_at: string | null
          moderated_by: string | null
          published_at: string | null
          schedule_type: string
          scheduled_for: string | null
          slug: string
          status: string
          suspension_reason: string | null
          title: string
          updated_at: string
          user_id: string | null
          word_count: number
        }
        Insert: {
          book_id: string
          chapter_number: number
          content: string
          created_at?: string
          estimated_read_minutes?: number
          id?: string
          is_suspended?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          published_at?: string | null
          schedule_type?: string
          scheduled_for?: string | null
          slug: string
          status?: string
          suspension_reason?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
          word_count?: number
        }
        Update: {
          book_id?: string
          chapter_number?: number
          content?: string
          created_at?: string
          estimated_read_minutes?: number
          id?: string
          is_suspended?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          published_at?: string | null
          schedule_type?: string
          scheduled_for?: string | null
          slug?: string
          status?: string
          suspension_reason?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          book_id: string
          content: string
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          moderation_status: string
          parent_id: string | null
          review_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          content: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string
          parent_id?: string | null
          review_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string
          parent_id?: string | null
          review_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "book_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      highlights: {
        Row: {
          book_id: string
          chapter_id: string
          color: string
          created_at: string
          end_offset: number
          id: string
          note: string | null
          paragraph_index: number
          selected_text: string
          start_offset: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter_id: string
          color?: string
          created_at?: string
          end_offset: number
          id?: string
          note?: string | null
          paragraph_index: number
          selected_text: string
          start_offset: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter_id?: string
          color?: string
          created_at?: string
          end_offset?: number
          id?: string
          note?: string | null
          paragraph_index?: number
          selected_text?: string
          start_offset?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          daily_reading_goal_minutes: number
          full_name: string | null
          id: string
          is_suspended: boolean
          last_read_date: string | null
          role: string
          streak_days: number
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_reading_goal_minutes?: number
          full_name?: string | null
          id: string
          is_suspended?: boolean
          last_read_date?: string | null
          role?: string
          streak_days?: number
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_reading_goal_minutes?: number
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          last_read_date?: string | null
          role?: string
          streak_days?: number
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reading_goals: {
        Row: {
          annual_books_goal: number
          created_at: string
          daily_minutes_goal: number
          id: string
          updated_at: string
          user_id: string
          weekly_days_goal: number
        }
        Insert: {
          annual_books_goal?: number
          created_at?: string
          daily_minutes_goal?: number
          id?: string
          updated_at?: string
          user_id: string
          weekly_days_goal?: number
        }
        Update: {
          annual_books_goal?: number
          created_at?: string
          daily_minutes_goal?: number
          id?: string
          updated_at?: string
          user_id?: string
          weekly_days_goal?: number
        }
        Relationships: [
          {
            foreignKeyName: "reading_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_progress: {
        Row: {
          book_id: string
          completed_at: string | null
          created_at: string
          current_chapter_id: string | null
          id: string
          is_completed: boolean
          last_read_at: string
          progress_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          completed_at?: string | null
          created_at?: string
          current_chapter_id?: string | null
          id?: string
          is_completed?: boolean
          last_read_at?: string
          progress_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          completed_at?: string | null
          created_at?: string
          current_chapter_id?: string | null
          id?: string
          is_completed?: boolean
          last_read_at?: string
          progress_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_current_chapter_id_fkey"
            columns: ["current_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sessions: {
        Row: {
          book_id: string
          chapter_id: string | null
          created_at: string
          duration_seconds: number
          ended_at: string
          id: string
          pages_read: number
          session_date: string
          started_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string
          id?: string
          pages_read?: number
          session_date?: string
          started_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string
          id?: string
          pages_read?: number
          session_date?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_sessions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      review_likes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "book_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          is_unlocked: boolean
          progress_value: number
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          is_unlocked?: boolean
          progress_value?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          is_unlocked?: boolean
          progress_value?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_admin_or_moderator: { Args: { user_id: string }; Returns: boolean }
      publish_scheduled_chapters: { Args: never; Returns: number }
      reorder_chapters: {
        Args: { p_book_id: string; p_chapter_ids: string[] }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
