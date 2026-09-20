import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { extractParamsFromUrl, formatAuthError, isValidEmail, withAuthTimeout } from '../auth';

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

describe('Auth Helpers', () => {
  describe('formatAuthError', () => {
    it('maps known Supabase/Google error messages to friendly copy', () => {
      const cases: [string, string][] = [
        ['Invalid login credentials', 'Invalid email or password.'],
        ['invalid_grant: error verifying credentials', 'Invalid email or password.'],
        ['User already registered', 'An account with this email already exists.'],
        ['Password should be at least 6 characters', 'Password must be at least 6 characters.'],
        ['Email not confirmed', 'Please check your email to confirm your account.'],
        ['TypeError: Failed to fetch', 'Network connection issue. Please check your internet connection.'],
        ['too many requests, rate limit exceeded', 'Too many attempts. Please wait a moment and try again.'],
        ['User cancelled authentication', 'Sign in was cancelled.'],
        ['Connection timed out', 'Connection timed out. Please check your internet connection and try again.'],
        ['user_banned by administrator', 'This account has been suspended or disabled.'],
        [
          'Google sign-in failed (Code: 10)',
          'Google Sign-In configuration mismatch (Code 10). Please verify Google Cloud SHA-1 fingerprint and Web Client ID.',
        ],
        ['Play services not available or outdated', 'Google Play Services is unavailable or needs to be updated.'],
      ];

      for (const [message, expected] of cases) {
        expect(formatAuthError({ message })).toBe(expected);
      }

      // Custom messages pass through; nullish falls back.
      expect(formatAuthError({ message: 'Something custom happened' })).toBe('Something custom happened');
      expect(formatAuthError(null)).toBe('An unexpected error occurred.');
    });
  });

  describe('isValidEmail', () => {
    it('validates correct email formats', () => {
      expect(isValidEmail('athlete@nextrep.com')).toBe(true);
      expect(isValidEmail('user.name+tag@gmail.com')).toBe(true);
      expect(isValidEmail('  athlete@domain.org  ')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });
  });

  describe('withAuthTimeout', () => {
    it('resolves quickly if promise fulfills within timeout', async () => {
      const fastPromise = Promise.resolve('ok');
      await expect(withAuthTimeout(fastPromise, 500)).resolves.toBe('ok');
    });

    it('rejects with friendly timeout message if promise takes too long', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 200));
      await expect(withAuthTimeout(slowPromise, 50, 'Request timed out')).rejects.toThrow('Request timed out');
    });
  });

  describe('extractParamsFromUrl', () => {
    it('extracts query parameters', () => {
      const url = 'nextrep://auth/callback?code=abc-123&state=xyz';
      const params = extractParamsFromUrl(url);
      expect(params.code).toBe('abc-123');
      expect(params.state).toBe('xyz');
    });

    it('extracts hash fragment tokens', () => {
      const url = 'nextrep://auth/callback#access_token=token-abc&refresh_token=refresh-xyz&token_type=bearer';
      const params = extractParamsFromUrl(url);
      expect(params.access_token).toBe('token-abc');
      expect(params.refresh_token).toBe('refresh-xyz');
      expect(params.token_type).toBe('bearer');
    });

    it('handles query and hash together', () => {
      const url = 'nextrep://auth/callback?type=recovery#access_token=token-123&refresh_token=token-456';
      const params = extractParamsFromUrl(url);
      expect(params.type).toBe('recovery');
      expect(params.access_token).toBe('token-123');
      expect(params.refresh_token).toBe('token-456');
    });

    it('returns empty object for empty or invalid url', () => {
      expect(extractParamsFromUrl('')).toEqual({});
    });
  });
});
