-- ============================================================
-- Migration 007: social — friendships, challenges
-- Lightweight social graph. Leaderboard scores are DERIVED from
-- workout data, never stored here.
-- ============================================================

-- Friendship status enum
CREATE TYPE public.friendship_status AS ENUM (
  'pending', 'accepted', 'blocked'
);

-- Bidirectional friendship (requester → addressee, status gate)
CREATE TABLE public.friendships (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       public.friendship_status DEFAULT 'pending' NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Prevent self-friending
  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id),
  -- At most one friendship direction between two users
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

-- Challenge types enum
CREATE TYPE public.challenge_type AS ENUM (
  'most_workouts', 'longest_streak', 'strength_improvement', 'goal_completion'
);

-- Challenge status enum
CREATE TYPE public.challenge_status AS ENUM (
  'active', 'completed', 'cancelled'
);

-- Challenges created by users
CREATE TABLE public.challenges (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        public.challenge_type NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  status      public.challenge_status DEFAULT 'active' NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Challenge participation (many-to-many)
CREATE TABLE public.challenge_participants (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (challenge_id, user_id)
);

-- Query patterns
CREATE INDEX idx_friendships_requester
  ON public.friendships (requester_id, status);

CREATE INDEX idx_friendships_addressee
  ON public.friendships (addressee_id, status);

CREATE INDEX idx_challenge_participants_challenge
  ON public.challenge_participants (challenge_id);

CREATE INDEX idx_challenges_creator
  ON public.challenges (creator_id);

-- Trigger: auto-touch updated_at
CREATE TRIGGER set_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
