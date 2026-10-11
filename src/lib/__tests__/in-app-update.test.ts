import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

import { shouldPromptForUpdate } from '../in-app-update';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

describe('Play Store update prompt — at most once per day per version', () => {
  it('prompts when nothing was stored yet', () => {
    expect(shouldPromptForUpdate(null, '42', NOW)).toBe(true);
  });

  it('does not prompt again for the same version within 24h', () => {
    expect(shouldPromptForUpdate({ version: '42', at: NOW - 60_000 }, '42', NOW)).toBe(false);
  });

  it('prompts again for the same version after 24h', () => {
    expect(shouldPromptForUpdate({ version: '42', at: NOW - DAY_MS }, '42', NOW)).toBe(true);
  });

  it('prompts for a newly published version even if prompted today', () => {
    expect(shouldPromptForUpdate({ version: '42', at: NOW - 60_000 }, '43', NOW)).toBe(true);
  });
});
