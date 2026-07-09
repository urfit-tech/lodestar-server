import { isHeartbeatStale } from './watchdog';

describe('isHeartbeatStale', () => {
  it('is not stale when heartbeat is recent', () => {
    expect(isHeartbeatStale(1000, 1500, 120000)).toBe(false);
  });
  it('is not stale exactly at the boundary', () => {
    expect(isHeartbeatStale(1000, 1000 + 120000, 120000)).toBe(false);
  });
  it('is stale past the timeout', () => {
    expect(isHeartbeatStale(1000, 1000 + 120001, 120000)).toBe(true);
  });
  it('is never stale before the first heartbeat (lastBeat === 0)', () => {
    expect(isHeartbeatStale(0, 999999, 120000)).toBe(false);
  });
});
