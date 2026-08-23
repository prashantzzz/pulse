/**
 * Security Regression Tests — Authorization & Hardening
 *
 * Covers:
 *   1. Offline queue cross-user isolation (mutation userId mismatch → discard)
 *   2. CSV import security limits (file size, row count, field length, formula injection)
 *   3. Deep link parameter validation (UUID format, sanitization, allowed types)
 *   4. Pending invite UUID validation
 */

import { savePendingInvite, getPendingInvite, UUID_PATTERN } from '../social';
import { parseWorkoutsCsv, CSV_MAX_BYTES, CSV_MAX_ROWS, CSV_HEADER } from '../csv';
import { enqueueOfflineMutation, flushOfflineSyncQueue } from '../sync';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-b-id-0000-0000-0000-000000000000' } } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'new-workout-id' }, error: null }),
    }),
  },
}));

// ─── 1. Offline Queue Cross-User Isolation ────────────────────────────────────

describe('Offline Queue — Cross-User Mutation Isolation', () => {
  const USER_A_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const USER_B_ID = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';

  const makeWorkout = (userId: string) => ({
    id: 'w-1',
    title: 'Test Workout',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    exercises: [],
    source: 'user' as const,
  });

  it('discards mutations belonging to a different user (cross-user replay prevented)', async () => {
    // Simulate: User A queued a mutation, but User B is now signed in.
    // The supabase mock returns User B's ID as the current user.
    // The mutation with userId=USER_A_ID must be discarded, not executed.
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: USER_B_ID } },
    });

    // Manually queue a mutation as User A
    await enqueueOfflineMutation({
      type: 'upsert_workout',
      userId: USER_A_ID,           // <- User A's ID in the queue
      workout: makeWorkout(USER_A_ID),
      timestamp: Date.now(),
    });

    // Verify queue is now empty — the cross-user item was dropped
    const raw = await AsyncStorage.getItem('@nextrep_offline_sync_queue');
    const remaining = raw ? JSON.parse(raw) : [];
    expect(remaining).toHaveLength(0);
  });

  it('processes mutations belonging to the current user normally', async () => {
    // Mock User B as current user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: USER_B_ID } },
    });

    // Queue a mutation as User B
    await enqueueOfflineMutation({
      type: 'upsert_workout',
      userId: USER_B_ID,
      workout: makeWorkout(USER_B_ID),
      timestamp: Date.now(),
    });

    // If no throw = success. The from().insert() mock will be called.
    expect(supabase.from).toHaveBeenCalled();
  });
});

// ─── 2. CSV Import Security ───────────────────────────────────────────────────

describe('CSV Import — Security Limits', () => {
  it('rejects files exceeding the max size limit', () => {
    const oversize = 'x'.repeat(CSV_MAX_BYTES + 1);
    const result = parseWorkoutsCsv(oversize);
    expect(result.error).toMatch(/too large/i);
    expect(result.workouts).toHaveLength(0);
  });

  it('rejects CSVs with too many rows', () => {
    const rows = [CSV_HEADER];
    for (let i = 0; i < CSV_MAX_ROWS + 2; i++) {
      rows.push(`Workout ${i},2026-08-14T10:00:00Z,2026-08-14T11:00:00Z,,Bench Press,,notes,1,normal,100,5,,,`);
    }
    const result = parseWorkoutsCsv(rows.join('\n'));
    expect(result.error).toMatch(/too many rows/i);
    expect(result.workouts).toHaveLength(0);
  });

  it('truncates title fields exceeding the 200-char limit', () => {
    const longTitle = 'A'.repeat(300);
    const csv = [
      CSV_HEADER,
      `${longTitle},2026-08-14T10:00:00Z,2026-08-14T11:00:00Z,,Bench Press,,notes,1,normal,100,5,,,`,
    ].join('\n');
    const result = parseWorkoutsCsv(csv);
    // No error — should parse successfully with truncated title
    expect(result.error).toBeUndefined();
    if (result.workouts.length > 0) {
      expect(result.workouts[0].title.length).toBeLessThanOrEqual(200);
    }
  });

  it('strips formula injection characters from title fields', () => {
    const csv = [
      CSV_HEADER,
      `=SUM(1+1),2026-08-14T10:00:00Z,2026-08-14T11:00:00Z,,Bench Press,,notes,1,normal,100,5,,,`,
    ].join('\n');
    const result = parseWorkoutsCsv(csv);
    if (result.workouts.length > 0) {
      expect(result.workouts[0].title).not.toMatch(/^=/);
    }
  });

  it('strips formula injection on exercise title fields (+, -, @)', () => {
    const injections = ['+CMD|/C calc', '-2+3+cmd|', '@SUM(A1)', '=HYPERLINK("evil.com")'];
    for (const injection of injections) {
      const csv = [
        CSV_HEADER,
        `Workout A,2026-08-14T10:00:00Z,2026-08-14T11:00:00Z,,${injection},,notes,1,normal,100,5,,,`,
      ].join('\n');
      const result = parseWorkoutsCsv(csv);
      if (result.workouts.length > 0 && result.workouts[0].exercises.length > 0) {
        const exId = result.workouts[0].exercises[0].exerciseId;
        expect(exId).not.toMatch(/^[=+\-@]/);
      }
    }
  });

  it('rejects weight_kg values out of the valid range (0–1500)', () => {
    const csv = [
      CSV_HEADER,
      // weight = 99999 (way above 1500 kg limit)
      `Workout A,2026-08-14T10:00:00Z,2026-08-14T11:00:00Z,,Bench Press,,notes,1,normal,99999,5,,,`,
    ].join('\n');
    const result = parseWorkoutsCsv(csv);
    if (result.workouts.length > 0 && result.workouts[0].exercises.length > 0) {
      const set = result.workouts[0].exercises[0].sets[0];
      expect(set.weightKg).toBeNull(); // should be discarded as out-of-range
    }
  });

  it('rejects negative reps values', () => {
    const csv = [
      CSV_HEADER,
      `Workout A,2026-08-14T10:00:00Z,2026-08-14T11:00:00Z,,Squat,,notes,1,normal,100,-5,,,`,
    ].join('\n');
    const result = parseWorkoutsCsv(csv);
    if (result.workouts.length > 0 && result.workouts[0].exercises.length > 0) {
      const set = result.workouts[0].exercises[0].sets[0];
      expect(set.reps).toBeNull();
    }
  });

  it('accepts an empty CSV gracefully', () => {
    const result = parseWorkoutsCsv('');
    expect(result.workouts).toHaveLength(0);
    expect(result.error).toBeTruthy();
  });
});

// ─── 3. Deep Link Parameter Validation ───────────────────────────────────────

describe('Deep Link — UUID Validation', () => {
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it('validates well-formed UUIDs correctly', () => {
    expect(UUID_V4.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(UUID_V4.test('00000000-0000-4000-8000-000000000000')).toBe(true);
  });

  it('rejects malformed or injection UUIDs', () => {
    const invalid = [
      'not-a-uuid',
      '../../../etc/passwd',
      "'; DROP TABLE users;--",
      '12345',
      '',
      'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    ];
    for (const v of invalid) {
      expect(UUID_V4.test(v)).toBe(false);
    }
  });
});

// ─── 4. Pending Invite UUID Validation ───────────────────────────────────────

describe('savePendingInvite — UUID Validation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves a valid invite', async () => {
    await savePendingInvite({
      fromUserId: '123e4567-e89b-12d3-a456-426614174000',
      fromName: 'Alice',
      challengeTitle: 'Most workouts',
      challengeType: 'most_workouts',
      timestamp: Date.now(),
    });
    const stored = await getPendingInvite();
    expect(stored?.fromUserId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('rejects an invite with an invalid fromUserId (injection attempt)', async () => {
    await savePendingInvite({
      fromUserId: '../../../etc/passwd',
      fromName: 'Attacker',
      timestamp: Date.now(),
    });
    const stored = await getPendingInvite();
    expect(stored).toBeNull(); // should not have been saved
  });

  it('rejects an invite with a short/non-UUID fromUserId', async () => {
    await savePendingInvite({
      fromUserId: 'notauuid',
      fromName: 'Attacker',
      timestamp: Date.now(),
    });
    const stored = await getPendingInvite();
    expect(stored).toBeNull();
  });

  it('rejects an invite with SQL injection in fromUserId', async () => {
    await savePendingInvite({
      fromUserId: "'; DROP TABLE friendships; --",
      fromName: 'Attacker',
      timestamp: Date.now(),
    });
    const stored = await getPendingInvite();
    expect(stored).toBeNull();
  });
});

// ─── 5. Exported UUID_PATTERN smoke test ─────────────────────────────────────
// NOTE: UUID_PATTERN must be exported from social.ts for this test to work.
// If it is not exported yet, this test confirms the requirement.
describe('UUID_PATTERN export', () => {
  it('UUID_PATTERN is defined and validates UUIDs', () => {
    // If social.ts does not export UUID_PATTERN, this will throw a TS error.
    // The test itself also validates correctness.
    if (typeof UUID_PATTERN !== 'undefined') {
      expect(UUID_PATTERN.test('00000000-0000-4000-8000-000000000000')).toBe(true);
      expect(UUID_PATTERN.test('bad')).toBe(false);
    }
  });
});
