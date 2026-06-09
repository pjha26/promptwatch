export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          user_id: string
          site_url: string
          site_name: string
          api_key: string
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          site_url: string
          site_name: string
          api_key: string
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          site_url?: string
          site_name?: string
          api_key?: string
          settings?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_visits: {
        Row: {
          id: string
          workspace_id: string
          engine: string
          path: string
          timestamp: string
        }
        Insert: {
          id?: string
          workspace_id: string
          engine: string
          path: string
          timestamp?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          engine?: string
          path?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_visits_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      actions: {
        Row: {
          id: string
          workspace_id: string
          title: string
          category: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          category: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          category?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      prompts: {
        Row: {
          id: string
          workspace_id: string
          text: string
          status: string
          engines: string[]
          last_checked: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          text: string
          status?: string
          engines?: string[]
          last_checked?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          text?: string
          status?: string
          engines?: string[]
          last_checked?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      competitors: {
        Row: {
          id: string
          workspace_id: string
          name: string
          citations: number
          trend: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          citations?: number
          trend?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          citations?: number
          trend?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
