/**
 * Social, Friend Challenges & Deep Linking Service for NextRep
 *
 * Interfaces with Supabase tables:
 *   - `friendships` (requester_id, addressee_id, status)
 *   - `challenges` (id, creator_id, title, type, starts_at, ends_at, status)
 *   - `challenge_participants` (challenge_id, user_id, joined_at)
 *   - `profiles` (id, display_name, avatar_url, etc.)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from './supabase';
import type { Friend } from '../types';

export const PENDING_INVITE_KEY = '@nextrep_pending_invite';

export interface PendingInvite {
  fromUserId: string;
  fromName: string;
  challengeTitle?: string;
  challengeType?: string;
  challengeId?: string;
  timestamp: number;
}

export interface CloudChallenge {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'completed' | 'cancelled';
  participants: {
    userId: string;
    displayName: string;
    score: number;
  }[];
}

/**
 * Persist an incoming invite (e.g. from SMS / deep link) so it survives login/onboarding.
 */
export async function savePendingInvite(invite: PendingInvite): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(invite));
  } catch (e) {
    console.warn('Failed to save pending invite:', e);
  }
}

/**
 * Retrieve pending invite if one exists.
 */
export async function getPendingInvite(): Promise<PendingInvite | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_INVITE_KEY);
    if (!raw) return null;
    const invite: PendingInvite = JSON.parse(raw);
    // Expire invites older than 7 days
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    if (invite.timestamp && Date.now() - invite.timestamp > SEVEN_DAYS_MS) {
      await AsyncStorage.removeItem(PENDING_INVITE_KEY);
      return null;
    }
    return invite;
  } catch {
    return null;
  }
}

/**
 * Clear pending invite after it has been accepted or dismissed.
 */
export async function clearPendingInvite(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_INVITE_KEY);
  } catch (e) {
    console.warn('Failed to clear pending invite:', e);
  }
}

/**
 * Generate shareable challenge URL and deep link message for SMS / WhatsApp.
 */
export function generateChallengeShareText({
  creatorId,
  creatorName,
  title,
  type = 'most_workouts',
  challengeId,
}: {
  creatorId: string;
  creatorName: string;
  title: string;
  type?: string;
  challengeId?: string;
}): { webUrl: string; deepLinkUrl: string; shareMessage: string } {
  const encName = encodeURIComponent(creatorName || 'A friend');
  const encTitle = encodeURIComponent(title);
  const encType = encodeURIComponent(type);
  const cidParam = challengeId ? `&cid=${encodeURIComponent(challengeId)}` : '';

  const webUrl = `https://nextrep-app.vercel.app/challenge?from=${creatorId}&name=${encName}&title=${encTitle}&type=${encType}${cidParam}`;
  const deepLinkUrl = `nextrep://challenge?from=${creatorId}&name=${encName}&title=${encTitle}&type=${encType}${cidParam}`;

  const shareMessage = `🏋️ ${creatorName || 'Your friend'} challenged you to "${title}" on NextRep!\n\nAccept & track live here:\n${webUrl}`;

  return { webUrl, deepLinkUrl, shareMessage };
}

/**
 * Create a new challenge in Supabase and enroll the creator.
 */
export async function createCloudChallenge({
  creatorId,
  title,
  type = 'most_workouts',
  durationDays = 7,
}: {
  creatorId: string;
  title: string;
  type?: string;
  durationDays?: number;
}): Promise<string | null> {
  if (!isSupabaseConfigured || !creatorId) return null;

  try {
    const now = new Date();
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const { data: challengeRow, error: cErr } = await (supabase.from('challenges') as any)
      .insert({
        creator_id: creatorId,
        title,
        type,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'active',
      })
      .select('id')
      .single();

    if (cErr || !challengeRow) {
      console.warn('Failed to create cloud challenge:', cErr);
      return null;
    }

    // Enroll creator as participant
    await (supabase.from('challenge_participants') as any).insert({
      challenge_id: challengeRow.id,
      user_id: creatorId,
    });

    return challengeRow.id;
  } catch (err) {
    console.warn('Exception creating cloud challenge:', err);
    return null;
  }
}

/**
 * Accept / Join a cloud challenge.
 */
export async function joinCloudChallenge(challengeId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !challengeId || !userId) return false;

  try {
    const { error } = await (supabase.from('challenge_participants') as any).upsert({
      challenge_id: challengeId,
      user_id: userId,
    });

    return !error;
  } catch (err) {
    console.warn('Exception joining cloud challenge:', err);
    return false;
  }
}

/**
 * Connect two users as friends in Supabase.
 */
export async function addFriendConnection(userId: string, targetFriendId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !targetFriendId || userId === targetFriendId) return false;

  try {
    // Check if friendship already exists
    const { data: existing } = await (supabase.from('friendships') as any)
      .select('id, status')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetFriendId}),and(requester_id.eq.${targetFriendId},addressee_id.eq.${userId})`)
      .maybeSingle();

    if (existing) {
      if (existing.status !== 'accepted') {
        await (supabase.from('friendships') as any)
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
      return true;
    }

    const { error } = await (supabase.from('friendships') as any).insert({
      requester_id: userId,
      addressee_id: targetFriendId,
      status: 'accepted',
    });

    return !error;
  } catch (err) {
    console.warn('Exception adding friend connection:', err);
    return false;
  }
}

/**
 * Fetch friends list and their weekly stats from Supabase.
 */
export async function fetchCloudFriends(userId: string): Promise<Friend[]> {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    // 1. Fetch friendships where user is requester or addressee
    const { data: friendships, error: fErr } = await (supabase.from('friendships') as any)
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (fErr || !friendships || friendships.length === 0) {
      return [];
    }

    const friendIds = friendships.map((f: { requester_id: string; addressee_id: string }) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id,
    );

    // 2. Fetch profiles of friends
    const { data: profiles, error: pErr } = await (supabase.from('profiles') as any)
      .select('id, display_name, experience_level, training_frequency')
      .in('id', friendIds);

    if (pErr || !profiles) return [];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // 3. Fetch workouts for each friend over the past 7 days
    const { data: recentWorkouts } = await (supabase.from('workouts') as any)
      .select('user_id, id')
      .in('user_id', friendIds)
      .gte('started_at', weekAgo.toISOString());

    const workoutCounts = new Map<string, number>();
    for (const w of recentWorkouts || []) {
      workoutCounts.set(w.user_id, (workoutCounts.get(w.user_id) || 0) + 1);
    }

    return profiles.map((p: any, idx: number) => {
      const workoutsThisWeek = workoutCounts.get(p.id) || 0;
      const score = Math.min(100, workoutsThisWeek * 20 + 25);
      return {
        id: p.id,
        name: p.display_name || `Athlete #${p.id.slice(0, 4)}`,
        isContact: true,
        score,
        workoutsThisWeek,
        prsThisMonth: 2,
        streak: Math.max(1, workoutsThisWeek),
        volumeKg: workoutsThisWeek * 3200,
        avatarHue: (idx * 65 + 140) % 360,
      };
    });
  } catch (err) {
    console.warn('Exception fetching cloud friends:', err);
    return [];
  }
}
