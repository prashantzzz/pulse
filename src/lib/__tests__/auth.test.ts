import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { extractParamsFromUrl, formatAuthError } from '../auth';

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
    it('formats invalid login credentials', () => {
      const err = { message: 'Invalid login credentials' };
      expect(formatAuthError(err)).toBe('Invalid email or password.');
    });

    it('formats invalid_grant error', () => {
      const err = { message: 'invalid_grant: error verifying credentials' };
      expect(formatAuthError(err)).toBe('Invalid email or password.');
    });

    it('formats user already registered error', () => {
      const err = { message: 'User already registered' };
      expect(formatAuthError(err)).toBe('An account with this email already exists.');
    });

    it('formats short password error', () => {
      const err = { message: 'Password should be at least 6 characters' };
      expect(formatAuthError(err)).toBe('Password must be at least 6 characters.');
    });

    it('formats unconfirmed email error', () => {
      const err = { message: 'Email not confirmed' };
      expect(formatAuthError(err)).toBe('Please check your email to confirm your account.');
    });

    it('formats network / fetch failures', () => {
      const err = { message: 'TypeError: Failed to fetch' };
      expect(formatAuthError(err)).toBe('Network connection issue. Please check your internet connection.');
    });

    it('formats rate limit errors', () => {
      const err = { message: 'too many requests, rate limit exceeded' };
      expect(formatAuthError(err)).toBe('Too many attempts. Please wait a moment and try again.');
    });

    it('formats cancellation', () => {
      const err = { message: 'User cancelled authentication' };
      expect(formatAuthError(err)).toBe('Sign in was cancelled.');
    });

    it('returns custom message or fallback for unknown errors', () => {
      const err = { message: 'Something custom happened' };
      expect(formatAuthError(err)).toBe('Something custom happened');
      expect(formatAuthError(null)).toBe('An unexpected error occurred.');
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
