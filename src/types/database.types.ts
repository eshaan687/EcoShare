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
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_path: string | null;
          cover_path: string | null;
          country_code: string | null;
          region: string | null;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_path?: string | null;
          cover_path?: string | null;
          country_code?: string | null;
          region?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_path?: string | null;
          cover_path?: string | null;
          country_code?: string | null;
          region?: string | null;
          website_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: EcoShareRole;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: EcoShareRole;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          role?: EcoShareRole;
          assigned_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_impact_submission: {
        Args: {
          p_submission_id: string;
          p_reason?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      ecoshare_role: EcoShareRole;
      impact_submission_status: ImpactSubmissionStatus;
      impact_verification_decision: ImpactVerificationDecision;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
