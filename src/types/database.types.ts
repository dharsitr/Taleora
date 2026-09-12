export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      authors: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      book_genres: {
        Row: {
          book_id: string;
          created_at: string;
          genre_id: string;
        };
        Insert: {
          book_id: string;
          created_at?: string;
          genre_id: string;
        };
        Update: {
          book_id?: string;
          created_at?: string;
          genre_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_genres_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_genres_genre_id_fkey";
            columns: ["genre_id"];
            isOneToOne: false;
            referencedRelation: "genres";
            referencedColumns: ["id"];
          },
        ];
      };
      books: {
        Row: {
          author_id: string;
          average_rating: number;
          cover_accent: string | null;
          cover_gradient: string | null;
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          estimated_read_time_minutes: number;
          featured: boolean;
          id: string;
          published_at: string | null;
          ratings_count: number;
          slug: string;
          status: "draft" | "published" | "archived";
          subtitle: string | null;
          title: string;
          total_chapters: number;
          trending: boolean;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          average_rating?: number;
          cover_accent?: string | null;
          cover_gradient?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_read_time_minutes?: number;
          featured?: boolean;
          id?: string;
          published_at?: string | null;
          ratings_count?: number;
          slug: string;
          status?: "draft" | "published" | "archived";
          subtitle?: string | null;
          title: string;
          total_chapters?: number;
          trending?: boolean;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          average_rating?: number;
          cover_accent?: string | null;
          cover_gradient?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_read_time_minutes?: number;
          featured?: boolean;
          id?: string;
          published_at?: string | null;
          ratings_count?: number;
          slug?: string;
          status?: "draft" | "published" | "archived";
          subtitle?: string | null;
          title?: string;
          total_chapters?: number;
          trending?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "books_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "authors";
            referencedColumns: ["id"];
          },
        ];
      };
      chapters: {
        Row: {
          book_id: string;
          chapter_number: number;
          content: string;
          created_at: string;
          estimated_read_minutes: number;
          id: string;
          slug: string;
          status: "draft" | "published" | "archived";
          title: string;
          updated_at: string;
          word_count: number;
        };
        Insert: {
          book_id: string;
          chapter_number: number;
          content: string;
          created_at?: string;
          estimated_read_minutes?: number;
          id?: string;
          slug: string;
          status?: "draft" | "published" | "archived";
          title: string;
          updated_at?: string;
          word_count?: number;
        };
        Update: {
          book_id?: string;
          chapter_number?: number;
          content?: string;
          created_at?: string;
          estimated_read_minutes?: number;
          id?: string;
          slug?: string;
          status?: "draft" | "published" | "archived";
          title?: string;
          updated_at?: string;
          word_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      genres: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          daily_reading_goal_minutes: number;
          full_name: string | null;
          id: string;
          last_read_date: string | null;
          streak_days: number;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          daily_reading_goal_minutes?: number;
          full_name?: string | null;
          id: string;
          last_read_date?: string | null;
          streak_days?: number;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          daily_reading_goal_minutes?: number;
          full_name?: string | null;
          id?: string;
          last_read_date?: string | null;
          streak_days?: number;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      reading_progress: {
        Row: {
          book_id: string;
          completed_at: string | null;
          created_at: string;
          current_chapter_id: string | null;
          id: string;
          is_completed: boolean;
          last_read_at: string;
          progress_percentage: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          book_id: string;
          completed_at?: string | null;
          created_at?: string;
          current_chapter_id?: string | null;
          id?: string;
          is_completed?: boolean;
          last_read_at?: string;
          progress_percentage?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          book_id?: string;
          completed_at?: string | null;
          created_at?: string;
          current_chapter_id?: string | null;
          id?: string;
          is_completed?: boolean;
          last_read_at?: string;
          progress_percentage?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_progress_current_chapter_id_fkey";
            columns: ["current_chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
