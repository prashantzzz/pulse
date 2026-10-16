import { playRestOverSound, resetRestSoundDeduplication } from '../sound';

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  createAudioPlayer: jest.fn(),
}));

import { createAudioPlayer } from 'expo-audio';

const mockCreate = createAudioPlayer as jest.Mock;

interface FakePlayer {
  play: jest.Mock;
  seekTo: jest.Mock;
  remove?: jest.Mock;
  release?: jest.Mock;
  volume: number;
}

function makePlayer(withRemove: boolean): FakePlayer {
  return {
    play: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
    ...(withRemove ? { remove: jest.fn() } : { release: jest.fn() }),
    volume: 1.0,
  };
}

describe('Rest chime player lifecycle (must never own the media session)', () => {
  let players: FakePlayer[];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    players = [];
    mockCreate.mockImplementation(() => {
      const p = makePlayer(true);
      players.push(p);
      return p;
    });
    resetRestSoundDeduplication();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('creates a fresh player per chime and releases it after playback', async () => {
    const played = await playRestOverSound(1001);
    expect(played).toBe(true);
    expect(players).toHaveLength(1);
    expect(players[0].play).toHaveBeenCalledTimes(1);
    expect(players[0].remove!).not.toHaveBeenCalled();

    // Still alive immediately after play (clip is ~1.15s)…
    jest.advanceTimersByTime(1000);
    expect(players[0].remove!).not.toHaveBeenCalled();

    // …released once the tail has passed.
    jest.advanceTimersByTime(2500);
    expect(players[0].remove!).toHaveBeenCalledTimes(1);
  });

  it('releases the previous chime synchronously before starting a new one', async () => {
    await playRestOverSound(2001);
    // Release timer has not fired yet — the old player is still lingering.
    jest.advanceTimersByTime(1000);
    expect(players[0].remove!).not.toHaveBeenCalled();

    // A new chime must clean up the lingering one immediately, not whenever
    // the suspended timer happens to run.
    await playRestOverSound(2002);
    expect(players).toHaveLength(2);
    expect(players[0].remove!).toHaveBeenCalledTimes(1);
    expect(players[1].play).toHaveBeenCalledTimes(1);
  });

  it('falls back to release() when remove() is absent', async () => {
    mockCreate.mockImplementationOnce(() => {
      const p = makePlayer(false);
      players.push(p);
      return p;
    });

    await playRestOverSound(3001);
    expect(players[0].play).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5000);
    expect(players[0].release!).toHaveBeenCalledTimes(1);
  });

  it('keeps the once-per-rest deduplication', async () => {
    expect(await playRestOverSound(4001)).toBe(true);
    expect(await playRestOverSound(4001)).toBe(false);
    expect(players).toHaveLength(1);
    expect(players[0].play).toHaveBeenCalledTimes(1);
  });
});
