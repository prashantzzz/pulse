/**
 * Supabase database type definitions for PULSE.
 *
 * These types mirror the migration schema and enable type-safe Supabase
 * client queries. Update after schema changes.
 *
 * Usage:
 *   import { supabase } from '../lib/supabase'
 *   const { data } = await supabase.from('workouts').select('*')
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ──────────────────────────────────────────────────

export type MuscleGroup =
  | 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps'
  | 'Quads' | 'Hamstrings' | 'Glutes' | 'Calves'
  | 'Core' | 'Forearms' | 'Cardio';

export type EquipmentType =
  | 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable'
  | 'Bodyweight' | 'Kettlebell' | 'Band' | 'Cardio';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type ExerciseCategory = 'Compound' | 'Isolation';

export type MovementPattern = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio';

export type BodyRegion = 'Upper' | 'Lower' | 'Core' | 'Full Body';

export type AnimationKey =
  | 'bench' | 'press' | 'raise' | 'fly' | 'row' | 'pulldown'
  | 'curl' | 'pushdown' | 'squat' | 'deadlift' | 'lunge'
  | 'calf' | 'crunch' | 'plank' | 'run';

export type SetType =
  | 'warmup' | 'working' | 'failure' | 'drop' | 'cooldown' | 'cardio';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type ChallengeType =
  | 'most_workouts' | 'longest_streak' | 'strength_improvement' | 'goal_completion';

export type ChallengeStatus = 'active' | 'completed' | 'cancelled';

export type GoalType =
  | 'weight_target' | 'reps_target' | 'workout_count'
  | 'streak_target' | 'body_metric' | 'custom';

export type GoalStatus = 'active' | 'completed' | 'abandoned';

// ─── Database schema ────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          gender: 'male' | 'female' | null;
          goal: string[];
          experience_level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
          training_frequency: number | null;
          preferred_training_style: string[];
          training_age_months: number | null;
          equipment: string[];
          onboarded: boolean;
          height_cm?: number | null;
          weight_kg?: number | null;
          weight_unit?: 'kg' | 'lbs' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      exercises: {
        Row: {
          id: string;
          canonical_name: string;
          description: string | null;
          exercise_type: ExerciseCategory;
          difficulty: DifficultyLevel;
          movement_pattern: MovementPattern;
          body_region: BodyRegion;
          primary_muscle: MuscleGroup;
          secondary_muscles: MuscleGroup[];
          equipment: EquipmentType;
          location: 'Gym' | 'Home' | 'Both' | null;
          beginner_friendly: boolean;
          animation_key: AnimationKey;
          about: string | null;
          steps: Json;
          common_mistakes: string[];
          breathing: string | null;
          rep_range: string | null;
          beginner_tips: string[];
          progression_tips: string[];
          safety_tips: string[];
          alternatives: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };

      exercise_aliases: {
        Row: {
          exercise_id: string;
          alias: string;
        };
        Insert: {
          exercise_id: string;
          alias: string;
        };
        Update: Partial<Database['public']['Tables']['exercise_aliases']['Insert']>;
      };

      workout_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          emoji: string | null;
          muscles: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_plans']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workout_plans']['Insert']>;
      };

      workout_plan_exercises: {
        Row: {
          id: string;
          plan_id: string;
          exercise_id: string;
          order_index: number;
          target_sets: number;
          target_reps: string | null;
          target_weight: number | null;
          rest_seconds: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_plan_exercises']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workout_plan_exercises']['Insert']>;
      };

      workouts: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          title: string;
          description: string | null;
          started_at: string;
          completed_at: string | null;
          notes: string | null;
          source: 'seed' | 'user' | 'csv' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workouts']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>;
      };

      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          order_index: number;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_exercises']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workout_exercises']['Insert']>;
      };

      workout_sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_index: number;
          set_type: SetType;
          weight_kg: number | null;
          reps: number | null;
          distance_km: number | null;
          duration_seconds: number | null;
          rpe: number | null;
          completed: boolean;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sets']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workout_sets']['Insert']>;
      };

      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          measured_at: string;
          weight_kg: number | null;
          body_fat_pct: number | null;
          chest_cm: number | null;
          waist_cm: number | null;
          biceps_cm: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['body_measurements']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['body_measurements']['Insert']>;
      };

      user_favorite_exercises: {
        Row: {
          user_id: string;
          exercise_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_favorite_exercises']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_favorite_exercises']['Insert']>;
      };

      manual_prs: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          weight_kg: number;
          reps: number;
          date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['manual_prs']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['manual_prs']['Insert']>;
      };

      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['friendships']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['friendships']['Insert']>;
      };

      challenges: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          type: ChallengeType;
          starts_at: string;
          ends_at: string;
          status: ChallengeStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['challenges']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['challenges']['Insert']>;
      };

      challenge_participants: {
        Row: {
          challenge_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['challenge_participants']['Row'], 'joined_at'> & {
          joined_at?: string;
        };
        Update: Partial<Database['public']['Tables']['challenge_participants']['Insert']>;
      };

      user_goals: {
        Row: {
          id: string;
          user_id: string;
          type: GoalType;
          title: string;
          target_value: number | null;
          unit: string | null;
          exercise_id: string | null;
          start_date: string;
          target_date: string | null;
          status: GoalStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_goals']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_goals']['Insert']>;
      };
    };

    Functions: Record<string, never>;
  };
}
