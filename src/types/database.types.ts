export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EcoShareRole = "user" | "moderator" | "verifier" | "admin";

export type ImpactSubmissionStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "appealed";

export type ImpactVerificationDecision =
  | "approved"
  | "rejected"
  | "changes_requested";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          cover_url: string | null;
          bio: string | null;
          location: string | null;
          website: string | null;
          allow_messages_from: string;
          total_xp: number;
          level: number;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          cover_url?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          allow_messages_from?: string;
          total_xp?: number;
          level?: number;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          cover_url?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          allow_messages_from?: string;
          total_xp?: number;
          level?: number;
          is_deleted?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: EcoShareRole;
          granted_by: string | null;
          granted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: EcoShareRole;
          granted_by?: string | null;
          granted_at?: string;
        };
        Update: {
          role?: EcoShareRole;
          granted_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      processed_webhook_events: {
        Row: {
          event_id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          event_id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      verification_audit_log: {
        Row: {
          id: string;
          submission_id: string | null;
          verifier_id: string | null;
          action: string;
          xp_awarded: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id?: string | null;
          verifier_id?: string | null;
          action: string;
          xp_awarded?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          submission_id?: string | null;
          verifier_id?: string | null;
          action?: string;
          xp_awarded?: number;
          metadata?: Json;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          category: string;
          location: string | null;
          is_verified_impact: boolean;
          likes_count: number;
          comments_count: number;
          bookmarks_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          content: string;
          category?: string;
          location?: string | null;
          is_verified_impact?: boolean;
          likes_count?: number;
          comments_count?: number;
          bookmarks_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          category?: string;
          location?: string | null;
          is_verified_impact?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      post_media: {
        Row: {
          id: string;
          post_id: string;
          media_type: string;
          url: string;
          alt_text: string;
          has_verified_badge: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          media_type?: string;
          url: string;
          alt_text?: string;
          has_verified_badge?: boolean;
          created_at?: string;
        };
        Update: {
          media_type?: string;
          url?: string;
          alt_text?: string;
          has_verified_badge?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_comment_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_comment_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
      post_bookmarks: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          title: string | null;
          is_group: boolean;
          created_by: string | null;
          initiated_by: string | null;
          recipient_id: string | null;
          status: string;
          declined_at: string | null;
          last_message_preview: string | null;
          last_message_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          is_group?: boolean;
          created_by?: string | null;
          initiated_by?: string | null;
          recipient_id?: string | null;
          status?: string;
          declined_at?: string | null;
          last_message_preview?: string | null;
          last_message_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          status?: string;
          declined_at?: string | null;
          last_message_preview?: string | null;
          last_message_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          is_archived: boolean;
          joined_at: string;
          last_read_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          is_archived?: boolean;
          joined_at?: string;
          last_read_at?: string;
        };
        Update: {
          is_archived?: boolean;
          last_read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      communities: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          category: string;
          country: string;
          city: string | null;
          campaign_goal: string | null;
          visibility: string;
          banner_url: string;
          members_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          category?: string;
          country?: string;
          city?: string | null;
          campaign_goal?: string | null;
          visibility?: string;
          banner_url?: string;
          members_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string;
          category?: string;
          country?: string;
          city?: string | null;
          campaign_goal?: string | null;
          visibility?: string;
          banner_url?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_members: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "communities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      challenges: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          category: string;
          thumbnail_url: string;
          participants_count: number;
          reward_xp: number;
          duration_label: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description: string;
          category?: string;
          thumbnail_url?: string;
          participants_count?: number;
          reward_xp?: number;
          duration_label?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          category?: string;
          thumbnail_url?: string;
          reward_xp?: number;
          duration_label?: string;
        };
        Relationships: [];
      };
      challenge_participants: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      impact_submissions: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string | null;
          title: string;
          description: string;
          category: string;
          country: string;
          activity_date: string;
          location: string | null;
          evidence_url: string;
          status: ImpactSubmissionStatus;
          reward_xp: number;
          reviewed_by: string | null;
          reviewer_notes: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id?: string | null;
          title: string;
          description: string;
          category?: string;
          country?: string;
          activity_date?: string;
          location?: string | null;
          evidence_url?: string;
          status?: ImpactSubmissionStatus;
          reward_xp?: number;
          reviewed_by?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          category?: string;
          country?: string;
          activity_date?: string;
          location?: string | null;
          evidence_url?: string;
          status?: ImpactSubmissionStatus;
          reviewed_by?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "impact_submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [];
      };
      points_ledger: {
        Row: {
          id: string;
          user_id: string;
          submission_id: string | null;
          points_delta: number;
          reason: string;
          awarded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          submission_id?: string | null;
          points_delta: number;
          reason: string;
          awarded_by?: string | null;
          created_at?: string;
        };
        Update: {
          reason?: string;
        };
        Relationships: [];
      };
      badges: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon_name: string;
          accent_ring: string;
          xp_threshold: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          icon_name?: string;
          accent_ring?: string;
          xp_threshold?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          awarded_at?: string;
        };
        Update: {
          awarded_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string | null;
          type: string;
          title: string;
          message: string;
          link_url: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id?: string | null;
          type: string;
          title: string;
          message: string;
          link_url?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [];
      };
      message_reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          conversation_id: string | null;
          message_id: string | null;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          conversation_id?: string | null;
          message_id?: string | null;
          reason: string;
          created_at?: string;
        };
        Update: {
          reason?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      has_role: {
        Args: {
          p_role: EcoShareRole;
        };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_verifier_or_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      calculate_user_level: {
        Args: {
          p_xp: number;
        };
        Returns: number;
      };
      is_conversation_participant: {
        Args: {
          p_conversation_id: string;
        };
        Returns: boolean;
      };
      is_blocked_between: {
        Args: {
          p_user_a: string;
          p_user_b: string;
        };
        Returns: boolean;
      };
      start_or_get_direct_conversation: {
        Args: {
          p_recipient_id: string;
          p_intro_message?: string | null;
        };
        Returns: Json;
      };
      respond_to_message_request: {
        Args: {
          p_conversation_id: string;
          p_action: string;
          p_reason?: string | null;
        };
        Returns: Json;
      };
      review_impact_submission: {
        Args: {
          p_submission_id: string;
          p_decision: string;
          p_notes?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: EcoShareRole;
      impact_submission_status: ImpactSubmissionStatus;
      impact_verification_decision: ImpactVerificationDecision;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
