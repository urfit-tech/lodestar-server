import { Worker } from 'worker_threads';

export function isHeartbeatStale(lastBeatMs: number, nowMs: number, timeoutMs: number): boolean {
  return lastBeatMs > 0 && nowMs - lastBeatMs > timeoutMs;
}

const WORKER_SOURCE = `
const { workerData } = require('worker_threads');
const view = new BigInt64Array(workerData.sab);
setInterval(() => {
  const last = Number(Atomics.load(view, 0));
  if (last > 0 && Date.now() - last > workerData.timeoutMs) {
    const staleSec = Math.round((Date.now() - last) / 1000);
    console.error('[tasker-watchdog] event loop stalled for ' + staleSec + 's, killing process (SIGKILL)');
    process.kill(process.pid, 'SIGKILL');
  }
}, workerData.intervalMs);
`;

export function startTaskerWatchdog(options?: { timeoutMs?: number; intervalMs?: number }): { stop: () => void } {
  const timeoutMs = options?.timeoutMs ?? (Number(process.env.TASKER_WATCHDOG_TIMEOUT_MS) || 120000);
  const intervalMs = options?.intervalMs ?? (Number(process.env.WATCHDOG_HEARTBEAT_INTERVAL_MS) || 1000);

  const sab = new SharedArrayBuffer(8);
  const view = new BigInt64Array(sab);
  Atomics.store(view, 0, BigInt(Date.now()));

  const beat = setInterval(() => {
    Atomics.store(view, 0, BigInt(Date.now()));
  }, intervalMs);
  // do not keep the process alive solely for the heartbeat timer
  beat.unref?.();

  const worker = new Worker(WORKER_SOURCE, { eval: true, workerData: { sab, timeoutMs, intervalMs } });
  worker.unref();

  console.log(`[tasker-watchdog] started (timeout=${timeoutMs}ms, interval=${intervalMs}ms)`);

  return {
    stop: () => {
      clearInterval(beat);
      void worker.terminate();
    },
  };
}
