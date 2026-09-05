import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePulse } from '../../store/useStore';
import { useAuth } from '../../store/useAuth';
import { syncUserDataFromCloud } from '../sync';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn().mockResolvedValue(false),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
  isErrorWithCode: jest.fn(),
  isSuccessResponse: jest.fn(),
}));

const mockDelete = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();

let authStateChangeCallback: ((event: string, session: any) => Promise<void>) | null = null;

jest.mock('../supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-flow-123' } } }),
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-flow-123', email: 'test@example.com' },
          },
        },
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn((cb) => {
        authStateChangeCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
    },
    from: jest.fn((table: string) => ({
      delete: () => ({
        eq: (...args: any[]) => {
          mockDelete(table, ...args);
          return Promise.resolve({ data: null, error: null });
        },
      }),
      update: (...args: any[]) => ({
        eq: (...eqArgs: any[]) => {
          mockUpdate(table, ...args, ...eqArgs);
          return Promise.resolve({ data: null, error: null });
        },
      }),
      select: () => ({
        eq: () => {
          const res: any = Promise.resolve({ data: [], error: null });
          res.maybeSingle = () => Promise.resolve({ data: null, error: null });
          res.order = () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
            then: (fn: any) => Promise.resolve({ data: [], error: null }).then(fn),
          });
          return res;
        },
      }),
      upsert: () => {
        const res: any = Promise.resolve({ data: null, error: null });
        res.select = () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          then: (fn: any) => Promise.resolve({ data: null, error: null }).then(fn),
        });
        return res;
      },
    })),
  },
}));

describe('Clear Data & Instant App Open Lifecycle', () => {
  const TEST_USER_ID = 'test-user-flow-123';

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    usePulse.getState().clearSessionCache();
    useAuth.setState({
      session: null,
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,
      isVerifyingUser: false,
    });
  });

  describe('Clear All Data reset & sync with cloud', () => {
    it('clears active workout plans, active workout, exercise defaults, and resets onboarding', async () => {
      // Setup state with active workout, active plan, defaults, profile, and history
      usePulse.setState({
        plans: [
          {
            id: 'plan-custom-1',
            title: 'Custom Chest & Tris',
            exercises: [
              { exerciseId: 'bench-press', sets: 4, targetReps: '8-10', targetWeightKg: 85 },
            ],
          },
        ],
        activeWorkout: {
          id: 'w-running-1',
          planId: 'plan-custom-1',
          title: 'Active Workout',
          startTime: new Date().toISOString(),
          exercises: [],
        },
        exerciseDefaults: {
          'bench-press': { weightKg: 85, reps: 8 },
        },
        workouts: [
          {
            id: 'w-history-1',
            title: 'Past Workout',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            exercises: [],
          },
        ],
        measurements: [{ id: 'm-1', date: '2026-09-01', weightKg: 75 }],
        favorites: ['bench-press'],
        manualPRs: [{ id: 'pr-1', exerciseId: 'bench-press', weightKg: 100, reps: 1, date: '2026-09-01' }],
        profile: {
          name: 'Athlete One',
          gender: 'male',
          goal: ['Build Muscle'],
          experience: 'Intermediate',
          frequencyPerWeek: 4,
          equipment: ['Barbell', 'Dumbbell'],
          style: ['Push / Pull / Legs'],
          trainingAgeMonths: 12,
          onboarded: true,
        },
        onboarded: true,
        seeded: true,
      });

      // Verify state was populated
      expect(usePulse.getState().plans).toHaveLength(1);
      expect(usePulse.getState().activeWorkout).not.toBeNull();
      expect(usePulse.getState().exerciseDefaults['bench-press']).toBeDefined();

      // Trigger clearAllData
      await usePulse.getState().clearAllData();

      const cleared = usePulse.getState();
      expect(cleared.plans).toEqual([]);
      expect(cleared.activeWorkout).toBeNull();
      expect(cleared.exerciseDefaults).toEqual({});
      expect(cleared.workouts).toEqual([]);
      expect(cleared.measurements).toEqual([]);
      expect(cleared.favorites).toEqual([]);
      expect(cleared.manualPRs).toEqual([]);
      expect(cleared.profile).toBeNull();
      expect(cleared.onboarded).toBe(false);
      expect(cleared.seeded).toBe(false);

      // Verify cloud wipe occurred
      expect(mockDelete).toHaveBeenCalledWith('workout_plans', 'user_id', TEST_USER_ID);
      expect(mockDelete).toHaveBeenCalledWith('workouts', 'user_id', TEST_USER_ID);
    });

    it('syncUserDataFromCloud following clearAllData keeps plans empty and does not resurrect SEED_PLANS', async () => {
      // Start with cleared state
      usePulse.getState().clearSessionCache();
      expect(usePulse.getState().plans).toEqual([]);

      // Cloud returns 0 plans
      await syncUserDataFromCloud(TEST_USER_ID);

      const state = usePulse.getState();
      expect(state.plans).toEqual([]);
      expect(state.onboarded).toBe(false);
    });

    it('fresh onboarding on cleared state generates customized plans matching user profile', () => {
      usePulse.getState().clearSessionCache();
      expect(usePulse.getState().plans).toEqual([]);

      // User completes onboarding
      usePulse.getState().completeOnboarding({
        name: 'New Athlete',
        gender: 'female',
        goal: ['Strength'],
        experience: 'Beginner',
        frequencyPerWeek: 3,
        equipment: ['Barbell', 'Dumbbell', 'Bodyweight'],
        style: ['Full Body'],
        trainingAgeMonths: 3,
        onboarded: true,
      });

      const updated = usePulse.getState();
      expect(updated.onboarded).toBe(true);
      expect(updated.plans.length).toBeGreaterThan(0);
      expect(updated.profile?.name).toBe('New Athlete');
    });
  });

  describe('Instant App Open & Sign-in Loader isolation', () => {
    it('cold start initialize with cached session does NOT set isVerifyingUser to true', async () => {
      const unsubscribe = useAuth.getState().initialize();

      // Let microtasks run
      await new Promise((r) => setTimeout(r, 50));

      const auth = useAuth.getState();
      expect(auth.isAuthenticated).toBe(true);
      expect(auth.user?.id).toBe(TEST_USER_ID);
      expect(auth.isInitialized).toBe(true);
      // Crucial: isVerifyingUser MUST remain false so cold start opens instantly
      expect(auth.isVerifyingUser).toBe(false);

      unsubscribe();
    });

    it('onAuthStateChange SIGNED_IN event does NOT trigger isVerifyingUser when user was already verified on startup', async () => {
      const unsubscribe = useAuth.getState().initialize();
      await new Promise((r) => setTimeout(r, 50));

      expect(useAuth.getState().isAuthenticated).toBe(true);
      expect(useAuth.getState().isVerifyingUser).toBe(false);

      // Simulate Supabase emitting SIGNED_IN for the already-authenticated session
      if (authStateChangeCallback) {
        await authStateChangeCallback('SIGNED_IN', {
          user: { id: TEST_USER_ID, email: 'test@example.com' },
        });
      }

      // Must remain false - no loader flicker
      expect(useAuth.getState().isVerifyingUser).toBe(false);

      unsubscribe();
    });

    it('active sign-in flow properly activates and deactivates isVerifyingUser', async () => {
      // Simulate user signing in from login.tsx (starts unauthenticated)
      useAuth.setState({
        session: null,
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        isVerifyingUser: false,
      });

      // Login screen sets isVerifyingUser = true on credential submit
      useAuth.setState({ isVerifyingUser: true });
      expect(useAuth.getState().isVerifyingUser).toBe(true);

      // SIGNED_IN event fires for new user
      if (authStateChangeCallback) {
        await authStateChangeCallback('SIGNED_IN', {
          user: { id: 'new-user-id', email: 'new@example.com' },
        });
      }

      // After sync completes, isVerifyingUser reverts to false
      expect(useAuth.getState().isVerifyingUser).toBe(false);
      expect(useAuth.getState().isAuthenticated).toBe(true);
      expect(useAuth.getState().user?.id).toBe('new-user-id');
    });
  });
});
