/**
 * Shared database types used by the scraper project.
 * They keep Supabase reads and writes typed consistently with the backend schema.
 */

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
      classification_entries: {
        Row: {
          draws: number
          draws_away: number
          draws_home: number
          goals_against: number
          goals_for: number
          group_id: number
          id: string
          losses: number
          losses_away: number
          losses_home: number
          penalties: number
          pj: number
          pj_away: number
          pj_home: number
          position: number
          pts: number
          pts_away: number
          pts_home: number
          pts_sanction: number
          round_date: string | null
          round_number: number
          team_id: number | null
          team_name: string
          team_shield_url: string | null
          updated_at: string
          wins: number
          wins_away: number
          wins_home: number
        }
        Insert: {
          draws?: number
          draws_away?: number
          draws_home?: number
          goals_against?: number
          goals_for?: number
          group_id: number
          id?: string
          losses?: number
          losses_away?: number
          losses_home?: number
          penalties?: number
          pj?: number
          pj_away?: number
          pj_home?: number
          position: number
          pts?: number
          pts_away?: number
          pts_home?: number
          pts_sanction?: number
          round_date?: string | null
          round_number: number
          team_id?: number | null
          team_name: string
          team_shield_url?: string | null
          updated_at?: string
          wins?: number
          wins_away?: number
          wins_home?: number
        }
        Update: {
          draws?: number
          draws_away?: number
          draws_home?: number
          goals_against?: number
          goals_for?: number
          group_id?: number
          id?: string
          losses?: number
          losses_away?: number
          losses_home?: number
          penalties?: number
          pj?: number
          pj_away?: number
          pj_home?: number
          position?: number
          pts?: number
          pts_away?: number
          pts_home?: number
          pts_sanction?: number
          round_date?: string | null
          round_number?: number
          team_id?: number | null
          team_name?: string
          team_shield_url?: string | null
          updated_at?: string
          wins?: number
          wins_away?: number
          wins_home?: number
        }
        Relationships: [
          {
            foreignKeyName: "classification_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "competition_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_form: {
        Row: {
          classification_entry_id: string
          position: number
          result: Database["public"]["Enums"]["form_result"]
        }
        Insert: {
          classification_entry_id: string
          position: number
          result: Database["public"]["Enums"]["form_result"]
        }
        Update: {
          classification_entry_id?: string
          position?: number
          result?: Database["public"]["Enums"]["form_result"]
        }
        Relationships: [
          {
            foreignKeyName: "classification_form_classification_entry_id_fkey"
            columns: ["classification_entry_id"]
            isOneToOne: false
            referencedRelation: "classification_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          home_venue_id: number | null
          id: number
          name: string
          phone: string | null
          postal_code: string | null
          province: string | null
          shield_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          home_venue_id?: number | null
          id: number
          name: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          shield_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          home_venue_id?: number | null
          id?: number
          name?: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          shield_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_home_venue_id_fkey"
            columns: ["home_venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_groups: {
        Row: {
          competition_id: number
          id: number
          name: string
          scraped_at: string | null
        }
        Insert: {
          competition_id: number
          id: number
          name: string
          scraped_at?: string | null
        }
        Update: {
          competition_id?: number
          id?: number
          name?: string
          scraped_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_groups_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          category_id: number | null
          category_name: string | null
          display_order: number
          end_date: string | null
          game_type_id: number | null
          group_category_id: number | null
          group_category_name: string | null
          id: number
          is_active: boolean
          match_minutes: number
          name: string
          num_parts: number
          points_draw: number
          points_loss: number
          points_win: number
          scraped_at: string | null
          season_id: number
          show_player_stats: boolean
          show_scorers: boolean
          show_standings: boolean
          start_date: string | null
          type: Database["public"]["Enums"]["competition_type"]
        }
        Insert: {
          category_id?: number | null
          category_name?: string | null
          display_order?: number
          end_date?: string | null
          game_type_id?: number | null
          group_category_id?: number | null
          group_category_name?: string | null
          id: number
          is_active?: boolean
          match_minutes?: number
          name: string
          num_parts?: number
          points_draw?: number
          points_loss?: number
          points_win?: number
          scraped_at?: string | null
          season_id: number
          show_player_stats?: boolean
          show_scorers?: boolean
          show_standings?: boolean
          start_date?: string | null
          type?: Database["public"]["Enums"]["competition_type"]
        }
        Update: {
          category_id?: number | null
          category_name?: string | null
          display_order?: number
          end_date?: string | null
          game_type_id?: number | null
          group_category_id?: number | null
          group_category_name?: string | null
          id?: number
          is_active?: boolean
          match_minutes?: number
          name?: string
          num_parts?: number
          points_draw?: number
          points_loss?: number
          points_win?: number
          scraped_at?: string | null
          season_id?: number
          show_player_stats?: boolean
          show_scorers?: boolean
          show_standings?: boolean
          start_date?: string | null
          type?: Database["public"]["Enums"]["competition_type"]
        }
        Relationships: [
          {
            foreignKeyName: "competitions_game_type_id_fkey"
            columns: ["game_type_id"]
            isOneToOne: false
            referencedRelation: "game_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      event_visibility: {
        Row: {
          event_id: string
          role: Database["public"]["Enums"]["visibility_role"]
        }
        Insert: {
          event_id: string
          role: Database["public"]["Enums"]["visibility_role"]
        }
        Update: {
          event_id?: string
          role?: Database["public"]["Enums"]["visibility_role"]
        }
        Relationships: [
          {
            foreignKeyName: "event_visibility_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          deleted_at: string | null
          description: string | null
          id: string
          location: string | null
          match_id: number | null
          time: string | null
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          match_id?: number | null
          time?: string | null
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          match_id?: number | null
          time?: string | null
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      game_types: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      kit_designs: {
        Row: {
          id: string
          kit_number: number
          shirt_color: string | null
          shirt_color1: string | null
          shirt_color2: string | null
          shirt_css_class: string | null
          shirt_type_code: number | null
          shorts_color: string | null
          shorts_color1: string | null
          shorts_css_class: string | null
          socks_color: string | null
          socks_color1: string | null
          socks_css_class: string | null
          team_id: number
        }
        Insert: {
          id?: string
          kit_number?: number
          shirt_color?: string | null
          shirt_color1?: string | null
          shirt_color2?: string | null
          shirt_css_class?: string | null
          shirt_type_code?: number | null
          shorts_color?: string | null
          shorts_color1?: string | null
          shorts_css_class?: string | null
          socks_color?: string | null
          socks_color1?: string | null
          socks_css_class?: string | null
          team_id: number
        }
        Update: {
          id?: string
          kit_number?: number
          shirt_color?: string | null
          shirt_color1?: string | null
          shirt_color2?: string | null
          shirt_css_class?: string | null
          shirt_type_code?: number | null
          shorts_color?: string | null
          shorts_color1?: string | null
          shorts_css_class?: string | null
          socks_color?: string | null
          socks_color1?: string | null
          socks_css_class?: string | null
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "kit_designs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_cards: {
        Row: {
          card_type_code: number
          id: string
          match_id: number
          minute: number | null
          player_id: number | null
          player_name: string
          side: Database["public"]["Enums"]["match_side"]
        }
        Insert: {
          card_type_code: number
          id?: string
          match_id: number
          minute?: number | null
          player_id?: number | null
          player_name: string
          side: Database["public"]["Enums"]["match_side"]
        }
        Update: {
          card_type_code?: number
          id?: string
          match_id?: number
          minute?: number | null
          player_id?: number | null
          player_name?: string
          side?: Database["public"]["Enums"]["match_side"]
        }
        Relationships: [
          {
            foreignKeyName: "match_cards_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_cards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_goals: {
        Row: {
          goal_type_code: number
          id: string
          is_own_goal: boolean
          match_id: number
          minute: number
          player_id: number | null
          player_name: string
          side: Database["public"]["Enums"]["match_side"]
        }
        Insert: {
          goal_type_code: number
          id?: string
          is_own_goal?: boolean
          match_id: number
          minute: number
          player_id?: number | null
          player_name: string
          side: Database["public"]["Enums"]["match_side"]
        }
        Update: {
          goal_type_code?: number
          id?: string
          is_own_goal?: boolean
          match_id?: number
          minute?: number
          player_id?: number | null
          player_name?: string
          side?: Database["public"]["Enums"]["match_side"]
        }
        Relationships: [
          {
            foreignKeyName: "match_goals_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_goals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineup_entries: {
        Row: {
          dorsal: number | null
          id: string
          is_captain: boolean
          is_goalkeeper: boolean
          is_starter: boolean
          is_substitute: boolean
          match_id: number
          player_id: number | null
          player_name: string
          pos_x: number | null
          pos_y: number | null
          position: string | null
          side: Database["public"]["Enums"]["match_side"]
        }
        Insert: {
          dorsal?: number | null
          id?: string
          is_captain?: boolean
          is_goalkeeper?: boolean
          is_starter?: boolean
          is_substitute?: boolean
          match_id: number
          player_id?: number | null
          player_name: string
          pos_x?: number | null
          pos_y?: number | null
          position?: string | null
          side: Database["public"]["Enums"]["match_side"]
        }
        Update: {
          dorsal?: number | null
          id?: string
          is_captain?: boolean
          is_goalkeeper?: boolean
          is_starter?: boolean
          is_substitute?: boolean
          match_id?: number
          player_id?: number | null
          player_name?: string
          pos_x?: number | null
          pos_y?: number | null
          position?: string | null
          side?: Database["public"]["Enums"]["match_side"]
        }
        Relationships: [
          {
            foreignKeyName: "match_lineup_entries_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_rounds: {
        Row: {
          group_id: number
          id: string
          round_date: string | null
          round_number: number
        }
        Insert: {
          group_id: number
          id?: string
          round_date?: string | null
          round_number: number
        }
        Update: {
          group_id?: number
          id?: string
          round_date?: string | null
          round_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_rounds_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "competition_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      match_staff_entries: {
        Row: {
          id: string
          match_id: number
          role_description: string | null
          side: Database["public"]["Enums"]["match_side"]
          staff_id: number | null
          staff_name: string
        }
        Insert: {
          id?: string
          match_id: number
          role_description?: string | null
          side: Database["public"]["Enums"]["match_side"]
          staff_id?: number | null
          staff_name: string
        }
        Update: {
          id?: string
          match_id?: number
          role_description?: string | null
          side?: Database["public"]["Enums"]["match_side"]
          staff_id?: number | null
          staff_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_staff_entries_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_staff_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_coach_id: number | null
          away_coach_name: string | null
          away_formation: string | null
          away_penalty_score: number | null
          away_score: number | null
          away_shield_url: string | null
          away_team_id: number | null
          away_team_name: string
          competition_id: number | null
          created_at: string
          date: string
          external_away_team_id: number | null
          external_home_team_id: number | null
          group_id: number | null
          home_coach_id: number | null
          home_coach_name: string | null
          home_delegate: string | null
          home_formation: string | null
          home_penalty_score: number | null
          home_score: number | null
          home_shield_url: string | null
          home_team_id: number | null
          home_team_name: string
          id: number
          is_closed: boolean
          is_suspended: boolean
          round_id: string | null
          round_number: number | null
          scraped_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          time: string | null
          updated_at: string
          venue_id: number | null
          venue_name: string | null
        }
        Insert: {
          away_coach_id?: number | null
          away_coach_name?: string | null
          away_formation?: string | null
          away_penalty_score?: number | null
          away_score?: number | null
          away_shield_url?: string | null
          away_team_id?: number | null
          away_team_name: string
          competition_id?: number | null
          created_at?: string
          date: string
          external_away_team_id?: number | null
          external_home_team_id?: number | null
          group_id?: number | null
          home_coach_id?: number | null
          home_coach_name?: string | null
          home_delegate?: string | null
          home_formation?: string | null
          home_penalty_score?: number | null
          home_score?: number | null
          home_shield_url?: string | null
          home_team_id?: number | null
          home_team_name: string
          id: number
          is_closed?: boolean
          is_suspended?: boolean
          round_id?: string | null
          round_number?: number | null
          scraped_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          time?: string | null
          updated_at?: string
          venue_id?: number | null
          venue_name?: string | null
        }
        Update: {
          away_coach_id?: number | null
          away_coach_name?: string | null
          away_formation?: string | null
          away_penalty_score?: number | null
          away_score?: number | null
          away_shield_url?: string | null
          away_team_id?: number | null
          away_team_name?: string
          competition_id?: number | null
          created_at?: string
          date?: string
          external_away_team_id?: number | null
          external_home_team_id?: number | null
          group_id?: number | null
          home_coach_id?: number | null
          home_coach_name?: string | null
          home_delegate?: string | null
          home_formation?: string | null
          home_penalty_score?: number | null
          home_score?: number | null
          home_shield_url?: string | null
          home_team_id?: number | null
          home_team_name?: string
          id?: number
          is_closed?: boolean
          is_suspended?: boolean
          round_id?: string | null
          round_number?: number | null
          scraped_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          time?: string | null
          updated_at?: string
          venue_id?: number | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_coach_id_fkey"
            columns: ["away_coach_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "competition_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_coach_id_fkey"
            columns: ["home_coach_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "match_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      media_images: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          location: string | null
          taken_at: string | null
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["media_type"]
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          taken_at?: string | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          taken_at?: string | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mvp_votes: {
        Row: {
          created_at: string
          id: string
          match_id: number
          player_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: number
          player_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: number
          player_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvp_votes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvp_votes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvp_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          author_id: string | null
          body: string
          category: string
          created_at: string
          deleted_at: string | null
          featured: boolean
          id: string
          image_url: string | null
          published_at: string | null
          read_time_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          category: string
          created_at?: string
          deleted_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: string
          created_at?: string
          deleted_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_season_stats: {
        Row: {
          double_yellow_cards: number
          goals_total: number
          id: string
          matches_called: number
          matches_played: number
          matches_starting: number
          matches_substitute: number
          minutes_total: number
          player_id: number
          red_cards: number
          season_id: number
          team_id: number
          yellow_cards: number
        }
        Insert: {
          double_yellow_cards?: number
          goals_total?: number
          id?: string
          matches_called?: number
          matches_played?: number
          matches_starting?: number
          matches_substitute?: number
          minutes_total?: number
          player_id: number
          red_cards?: number
          season_id: number
          team_id: number
          yellow_cards?: number
        }
        Update: {
          double_yellow_cards?: number
          goals_total?: number
          id?: string
          matches_called?: number
          matches_played?: number
          matches_starting?: number
          matches_substitute?: number
          minutes_total?: number
          player_id?: number
          red_cards?: number
          season_id?: number
          team_id?: number
          yellow_cards?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_season_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_season_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_season_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          birth_year: number | null
          created_at: string
          first_name: string | null
          full_name: string
          id: number
          is_goalkeeper: boolean
          last_name: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          first_name?: string | null
          full_name: string
          id: number
          is_goalkeeper?: boolean
          last_name?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          first_name?: string | null
          full_name?: string
          id?: number
          is_goalkeeper?: boolean
          last_name?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      points_config: {
        Row: {
          bet: number
          daily_login: number
          id: number
          register: number
          updated_at: string
          updated_by: string | null
          vote_mvp: number
          win_bet: number
        }
        Insert: {
          bet?: number
          daily_login?: number
          id?: number
          register?: number
          updated_at?: string
          updated_by?: string | null
          vote_mvp?: number
          win_bet?: number
        }
        Update: {
          bet?: number
          daily_login?: number
          id?: number
          register?: number
          updated_at?: string
          updated_by?: string | null
          vote_mvp?: number
          win_bet?: number
        }
        Relationships: [
          {
            foreignKeyName: "points_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          action: Database["public"]["Enums"]["points_action"]
          amount: number
          created_at: string
          id: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["points_action"]
          amount: number
          created_at?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["points_action"]
          amount?: number
          created_at?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          end_date: string | null
          id: number
          is_current: boolean
          name: string
          start_date: string | null
        }
        Insert: {
          end_date?: string | null
          id: number
          is_current?: boolean
          name: string
          start_date?: string | null
        }
        Update: {
          end_date?: string | null
          id?: number
          is_current?: boolean
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          full_name: string
          id: number
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: number
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: number
          photo_url?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
          username: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
          username: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_players: {
        Row: {
          dorsal: number | null
          id: string
          player_id: number
          position: string | null
          season_id: number
          team_id: number
        }
        Insert: {
          dorsal?: number | null
          id?: string
          player_id: number
          position?: string | null
          season_id: number
          team_id: number
        }
        Update: {
          dorsal?: number | null
          id?: string
          player_id?: number
          position?: string | null
          season_id?: number
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_staff: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          role_description: string | null
          season_id: number
          staff_id: number
          team_id: number
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["staff_role"]
          role_description?: string | null
          season_id: number
          staff_id: number
          team_id: number
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          role_description?: string | null
          season_id?: number
          staff_id?: number
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_staff_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_staff_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          category: string | null
          category_code: number | null
          club_id: number
          created_at: string
          home_venue_id: number | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          category_code?: number | null
          club_id: number
          created_at?: string
          home_venue_id?: number | null
          id: number
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          category_code?: number | null
          club_id?: number
          created_at?: string
          home_venue_id?: number | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_home_venue_id_fkey"
            columns: ["home_venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      top_scorers: {
        Row: {
          external_player_id: number
          external_team_id: number
          goals: number
          goals_per_match: number | null
          group_id: number
          id: string
          matches_played: number
          penalty_goals: number
          player_id: number | null
          player_name: string
          player_photo_url: string | null
          position: number
          scraped_at: string
          snapshot_date: string
          team_id: number | null
          team_name: string
          team_shield_url: string | null
        }
        Insert: {
          external_player_id: number
          external_team_id: number
          goals?: number
          goals_per_match?: number | null
          group_id: number
          id?: string
          matches_played?: number
          penalty_goals?: number
          player_id?: number | null
          player_name: string
          player_photo_url?: string | null
          position: number
          scraped_at?: string
          snapshot_date: string
          team_id?: number | null
          team_name: string
          team_shield_url?: string | null
        }
        Update: {
          external_player_id?: number
          external_team_id?: number
          goals?: number
          goals_per_match?: number | null
          group_id?: number
          id?: string
          matches_played?: number
          penalty_goals?: number
          player_id?: number | null
          player_name?: string
          player_photo_url?: string | null
          position?: number
          scraped_at?: string
          snapshot_date?: string
          team_id?: number | null
          team_name?: string
          team_shield_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "top_scorers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "competition_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_scorers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_scorers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bets: {
        Row: {
          created_at: string
          id: string
          match_id: number
          points_wagered: number
          points_won: number | null
          prediction: Database["public"]["Enums"]["bet_prediction"]
          result: Database["public"]["Enums"]["bet_result"]
          settled_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: number
          points_wagered: number
          points_won?: number | null
          prediction: Database["public"]["Enums"]["bet_prediction"]
          result?: Database["public"]["Enums"]["bet_result"]
          settled_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: number
          points_wagered?: number
          points_won?: number | null
          prediction?: Database["public"]["Enums"]["bet_prediction"]
          result?: Database["public"]["Enums"]["bet_result"]
          settled_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          banned: boolean
          banned_reason: string | null
          created_at: string
          deleted_at: string | null
          first_name: string
          id: string
          last_login_at: string | null
          last_name: string
          player_id: number | null
          points: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          banned_reason?: string | null
          created_at?: string
          deleted_at?: string | null
          first_name: string
          id?: string
          last_login_at?: string | null
          last_name: string
          player_id?: number | null
          points?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          banned_reason?: string | null
          created_at?: string
          deleted_at?: string | null
          first_name?: string
          id?: string
          last_login_at?: string | null
          last_name?: string
          player_id?: number | null
          points?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          id: number
          name: string
          photo_url: string | null
        }
        Insert: {
          address?: string | null
          id: number
          name: string
          photo_url?: string | null
        }
        Update: {
          address?: string | null
          id?: number
          name?: string
          photo_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      settle_match_bets: { Args: { p_match_id: number }; Returns: Json }
    }
    Enums: {
      bet_prediction: "home" | "draw" | "away"
      bet_result: "pending" | "win" | "loss"
      competition_type: "liga" | "copa" | "other"
      event_type:
        | "match"
        | "friendly"
        | "training"
        | "medical"
        | "dinner"
        | "meeting"
        | "other"
      form_result: "G" | "E" | "P"
      kit_slot: "titular" | "suplente"
      match_side: "home" | "away"
      match_status: "upcoming" | "live" | "finished" | "suspended"
      media_type: "photo" | "video"
      points_action:
        | "register"
        | "daily_login"
        | "vote_mvp"
        | "bet"
        | "win_bet"
        | "adjustment"
      staff_role:
        | "entrenador"
        | "segundo_entrenador"
        | "delegado"
        | "auxiliar"
        | "preparador_fisico"
        | "otro"
      user_role: "aficionado" | "jugador" | "admin" | "superadmin"
      visibility_role: "aficionado" | "jugador" | "admin" | "superadmin"
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
      bet_prediction: ["home", "draw", "away"],
      bet_result: ["pending", "win", "loss"],
      competition_type: ["liga", "copa", "other"],
      event_type: [
        "match",
        "friendly",
        "training",
        "medical",
        "dinner",
        "meeting",
        "other",
      ],
      form_result: ["G", "E", "P"],
      kit_slot: ["titular", "suplente"],
      match_side: ["home", "away"],
      match_status: ["upcoming", "live", "finished", "suspended"],
      media_type: ["photo", "video"],
      points_action: [
        "register",
        "daily_login",
        "vote_mvp",
        "bet",
        "win_bet",
        "adjustment",
      ],
      staff_role: [
        "entrenador",
        "segundo_entrenador",
        "delegado",
        "auxiliar",
        "preparador_fisico",
        "otro",
      ],
      user_role: ["aficionado", "jugador", "admin", "superadmin"],
      visibility_role: ["aficionado", "jugador", "admin", "superadmin"],
    },
  },
} as const
