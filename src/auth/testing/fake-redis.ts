import { DECR_IF_EXISTS_SCRIPT, INCR_WITH_TTL_SCRIPT } from '../auth-limits';

/**
 * In-memory stand-in for the ioredis commands used by the auth limit helpers (tests only).
 * Every command completes synchronously inside its promise, so each call is atomic like a Redis command or script.
 */
export class FakeRedis {
  readonly store = new Map<string, { value: string; ttlSeconds: number | null }>();
  readonly calls: Array<{ command: string; args: unknown[] }> = [];
  readonly sets = new Map<string, { members: Set<string>; ttlSeconds: number | null }>();

  async get(key: string) {
    this.calls.push({ command: 'get', args: [key] });
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string, ...args: Array<string | number>) {
    this.calls.push({ command: 'set', args: [key, value, ...args] });
    let ttlSeconds: number | null = null;
    let nx = false;
    for (let i = 0; i < args.length; i++) {
      const flag = String(args[i]).toUpperCase();
      if (flag === 'EX') ttlSeconds = Number(args[++i]);
      else if (flag === 'PX') ttlSeconds = Number(args[++i]) / 1000;
      else if (flag === 'NX') nx = true;
    }
    if (nx && this.store.has(key)) {
      return null;
    }
    this.store.set(key, { value: String(value), ttlSeconds });
    return 'OK';
  }

  async del(...keys: string[]) {
    this.calls.push({ command: 'del', args: keys });
    let removed = 0;
    for (const key of keys) {
      const deleted = [this.store.delete(key), this.sets.delete(key)];
      if (deleted.some(Boolean)) removed++;
    }
    return removed;
  }

  async sadd(key: string, ...members: string[]) {
    this.calls.push({ command: 'sadd', args: [key, ...members] });
    const entry = this.sets.get(key) ?? { members: new Set<string>(), ttlSeconds: null };
    members.forEach(member => entry.members.add(member));
    this.sets.set(key, entry);
    return members.length;
  }

  async expire(key: string, seconds: number) {
    this.calls.push({ command: 'expire', args: [key, seconds] });
    const set = this.sets.get(key);
    if (set) set.ttlSeconds = seconds;
    const entry = this.store.get(key);
    if (entry) entry.ttlSeconds = seconds;
    return set || entry ? 1 : 0;
  }

  async smembers(key: string) {
    this.calls.push({ command: 'smembers', args: [key] });
    return [...(this.sets.get(key)?.members ?? [])];
  }

  async eval(script: string, numKeys: number, ...args: Array<string | number>) {
    this.calls.push({ command: 'eval', args: [numKeys, ...args] });
    const keys = args.slice(0, numKeys).map(String);
    const argv = args.slice(numKeys);
    if (script === INCR_WITH_TTL_SCRIPT) {
      return keys.map((key, i) => {
        const current = this.store.get(key);
        const next = Number(current?.value ?? 0) + 1;
        this.store.set(key, { value: String(next), ttlSeconds: next === 1 ? Number(argv[i]) : current.ttlSeconds });
        return next;
      });
    }
    if (script === DECR_IF_EXISTS_SCRIPT) {
      const current = this.store.get(keys[0]);
      if (!current) return 0;
      const next = Number(current.value) - 1;
      this.store.set(keys[0], { value: String(next), ttlSeconds: current.ttlSeconds });
      return next;
    }
    throw new Error('unexpected script');
  }

  ttl(key: string) {
    return this.store.get(key)?.ttlSeconds ?? this.sets.get(key)?.ttlSeconds ?? null;
  }

  keys(prefix = '') {
    return [...this.store.keys(), ...this.sets.keys()].filter(key => key.startsWith(prefix)).sort();
  }

  commandsFor(command: string) {
    return this.calls.filter(call => call.command === command);
  }
}
