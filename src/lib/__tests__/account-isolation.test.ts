import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { usePulse } from '../../store/useStore';
import type { UserProfile, Workout } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id-123'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  AndroidNotificationPriority: { HIGH: 'high' },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval', DAILY: 'daily', DATE: 'date' },
}));

describe('User Account Isolation & Cache Clearing on Logout', () => {
  beforeEach(() => {
    usePulse.getState().clearSessionCache();
  });

  it('should completely clear previous user profile, workouts, and plans on clearSessionCache', () => {
    const userAProfile: UserProfile = {
      name: 'User A',
      gender: 'male',
      goal: ['Build Muscle'],
      experience: 'Intermediate',
      frequencyPerWeek: 4,
      equipment: ['Barbell'],
      style: ['Strength'],
      trainingAgeMonths: 12,
      onboarded: true,
      avatarUrl: 'https://example.com/user-a-avatar.jpg',
    };

    const userAWorkout: Workout = {
      id: 'w-user-a',
      title: 'User A Heavy Bench',
      startTime: '2026-08-20T10:00:00Z',
      endTime: '2026-08-20T11:00:00Z',
      exercises: [],
    };

    usePulse.setState({
      profile: userAProfile,
      workouts: [userAWorkout],
      onboarded: true,
      seeded: true,
    });

    expect(usePulse.getState().profile?.name).toBe('User A');
    expect(usePulse.getState().profile?.avatarUrl).toBe('https://example.com/user-a-avatar.jpg');
    expect(usePulse.getState().workouts).toHaveLength(1);

    // Perform logout cache clear
    usePulse.getState().clearSessionCache();

    // Verify all User A cache is destroyed
    expect(usePulse.getState().profile).toBeNull();
    expect(usePulse.getState().workouts).toHaveLength(0);
    expect(usePulse.getState().plans).toHaveLength(0);
    expect(usePulse.getState().measurements).toHaveLength(0);
    expect(usePulse.getState().onboarded).toBe(false);
  });

  it('should ensure User B receives their own avatar and profile without retaining User A data', () => {
    // 1. User A is active
    usePulse.setState({
      profile: {
        name: 'User A',
        gender: 'male',
        goal: ['Strength'],
        experience: 'Advanced',
        frequencyPerWeek: 5,
        equipment: [],
        style: [],
        trainingAgeMonths: 24,
        onboarded: true,
        avatarUrl: 'https://example.com/user-a-pic.png',
      },
    });

    // 2. User A logs out
    usePulse.getState().clearSessionCache();

    // 3. User B logs in (User B has a different avatar)
    const userBProfile: UserProfile = {
      name: 'User B',
      gender: 'female',
      goal: ['Fat Loss'],
      experience: 'Beginner',
      frequencyPerWeek: 3,
      equipment: ['Dumbbell'],
      style: ['Hypertrophy'],
      trainingAgeMonths: 2,
      onboarded: true,
      avatarUrl: 'https://example.com/user-b-photo.jpg',
    };

    usePulse.setState({ profile: userBProfile, onboarded: true });

    const currentProfile = usePulse.getState().profile;
    expect(currentProfile?.name).toBe('User B');
    expect(currentProfile?.avatarUrl).toBe('https://example.com/user-b-photo.jpg');
    expect(currentProfile?.gender).toBe('female');
  });

  it('should ensure User C without an avatar gets undefined avatarUrl rather than inheriting previous avatar', () => {
    // 1. User B was active with an avatar
    usePulse.setState({
      profile: {
        name: 'User B',
        gender: 'female',
        goal: [],
        experience: 'Beginner',
        frequencyPerWeek: 3,
        equipment: [],
        style: [],
        trainingAgeMonths: 2,
        onboarded: true,
        avatarUrl: 'https://example.com/user-b-photo.jpg',
      },
    });

    // 2. User B logs out
    usePulse.getState().clearSessionCache();

    // 3. User C logs in with no custom avatar
    const userCProfile: UserProfile = {
      name: 'User C',
      gender: 'male',
      goal: ['Health'],
      experience: 'Beginner',
      frequencyPerWeek: 3,
      equipment: [],
      style: [],
      trainingAgeMonths: 0,
      onboarded: true,
      avatarUrl: undefined,
    };

    usePulse.setState({ profile: userCProfile, onboarded: true });

    const currentProfile = usePulse.getState().profile;
    expect(currentProfile?.name).toBe('User C');
    expect(currentProfile?.avatarUrl).toBeUndefined();
  });

  it('should maintain recorded weight and measurements across store updates', () => {
    // 1. User sets initial weight via onboarding or measurement
    usePulse.getState().completeOnboarding({
      name: 'Athlete X',
      gender: 'male',
      goal: ['Build Muscle'],
      experience: 'Intermediate',
      frequencyPerWeek: 4,
      equipment: ['Barbell'],
      style: ['Strength'],
      trainingAgeMonths: 12,
      onboarded: true,
      heightCm: 180,
      weightKg: 82.5,
      weightUnit: 'kg',
    });

    usePulse.getState().addMeasurement({
      id: 'm1',
      date: '2026-08-20T10:00:00Z',
      weightKg: 82.5,
      bodyFatPct: 15,
      chestCm: 104,
      waistCm: 82,
      bicepsCm: 38,
    });

    expect(usePulse.getState().profile?.weightKg).toBe(82.5);
    expect(usePulse.getState().profile?.heightCm).toBe(180);
    expect(usePulse.getState().measurements).toHaveLength(1);
    expect(usePulse.getState().measurements[0].weightKg).toBe(82.5);

    // 2. User logs a new measurement of 83.2 kg
    usePulse.getState().addMeasurement({
      id: 'm2',
      date: '2026-08-24T10:00:00Z',
      weightKg: 83.2,
      bodyFatPct: 14.8,
      chestCm: 105,
      waistCm: 81.5,
      bicepsCm: 38.5,
    });

    expect(usePulse.getState().profile?.weightKg).toBe(83.2);
    expect(usePulse.getState().measurements).toHaveLength(2);
    expect(usePulse.getState().measurements[1].weightKg).toBe(83.2);
  });

  it('should sync favorites and manual PRs in store', () => {
    // Toggle favorite
    usePulse.getState().toggleFavorite('bench-press');
    expect(usePulse.getState().favorites).toContain('bench-press');

    usePulse.getState().toggleFavorite('squat');
    expect(usePulse.getState().favorites).toEqual(['bench-press', 'squat']);

    usePulse.getState().toggleFavorite('bench-press');
    expect(usePulse.getState().favorites).toEqual(['squat']);

    // Manual PR
    usePulse.getState().addManualPR({
      exerciseId: 'bench-press',
      weightKg: 100,
      reps: 5,
      date: '2026-08-24T10:00:00Z',
    });

    expect(usePulse.getState().manualPRs).toHaveLength(1);
    expect(usePulse.getState().manualPRs[0].weightKg).toBe(100);
    expect(usePulse.getState().manualPRs[0].exerciseId).toBe('bench-press');
  });
});
