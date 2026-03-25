export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      articles: {
        Row: {
          id: string;
          barcode: string;
          name: string;
          category_id: string | null;
          current_stock: number;
          minimum_stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          barcode: string;
          name: string;
          category_id?: string | null;
          current_stock?: number;
          minimum_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          barcode?: string;
          name?: string;
          category_id?: string | null;
          current_stock?: number;
          minimum_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };

      instances: {
        Row: {
          id: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      user_instances: {
        Row: {
          id: string;
          user_id: string;
          instance_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instance_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instance_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_instances_instance_id_fkey";
            columns: ["instance_id"];
            referencedRelation: "instances";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
