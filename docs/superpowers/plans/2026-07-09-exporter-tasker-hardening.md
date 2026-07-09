# Exporter Tasker Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修復大量 orderLog 匯出把 exporter-tasker event loop 卡死的根因，並加上「同步卡死自動重啟」防護，避免佇列 head-of-line blocking 再度發生。

**Architecture:** 三段獨立改動，全在 lodestar-server。A：移除 debug console.log + 把 per-row `.find()` 換成 `Map`（純效能、行為不變）。B1：Bull export job 加 `timeout`。B2：worker_thread 心跳 watchdog，主線卡死超時 → `process.kill(process.pid,'SIGKILL')` → 因 `essential:true` ECS 自動重啟。

**Tech Stack:** NestJS, TypeORM, Bull, Node `worker_threads` (`SharedArrayBuffer` + `BigInt64Array` + `Atomics`), Jest + ts-jest。

## Global Constraints

- Repo: `lodestar-server`，分支 `fix/exporter-tasker-hang-hardening`（已建立）。
- Node 執行：dev/prod 皆由 `main.ts` 依 `WORKER_NAME` env 進入 tasker 模式；watchdog 僅在 tasker 模式啟動。
- 行為相容：範圍 A 不得改變任何 CSV 欄位、順序、值或 join 格式。
- 預設值（皆可用 env 覆寫）：`EXPORT_JOB_TIMEOUT_MS=600000`、`TASKER_WATCHDOG_TIMEOUT_MS=120000`、`WATCHDOG_HEARTBEAT_INTERVAL_MS=1000`。
- 測試：`yarn jest <path>` 執行；改動後 `yarn jest` 全綠、`yarn build` 通過。
- 每個 Task 結束 commit。

---

### Task 1: 抽出並測試付款方式解析純函式（移除兩處 per-row debug log）

**Files:**
- Create: `src/order/order.export.helper.ts`
- Create: `src/order/order.export.helper.spec.ts`
- Modify: `src/order/order.service.ts`（`orderLogToRawCsv` 內 paymentLogDetails 區塊，約 :362-385）

**Interfaces:**
- Produces:
  - `buildPaymentMethodDisplayMap(paymentMethods: Array<{ name: unknown; displayName?: string }>): Map<string, string>` — key = `name.toLowerCase()`（僅當 `typeof name === 'string'`），value = `displayName ?? name`。
  - `resolvePaymentMethodDisplay(rawMethod: unknown, displayMap: Map<string, string>): string` — `rawMethod` 非 string 時回傳 `rawMethod ?? ''`（轉字串前的原值行為：非 string 直接回原值或空字串）；為 string 時回傳 `displayMap.get(rawMethod.toLowerCase()) ?? rawMethod`。

- [ ] **Step 1: Write the failing test**

`src/order/order.export.helper.spec.ts`:
```ts
import { buildPaymentMethodDisplayMap, resolvePaymentMethodDisplay } from './order.export.helper';

describe('order export payment method helpers', () => {
  const methods = [
    { name: 'credit', displayName: '信用卡' },
    { name: 'ApplePay', displayName: 'Apple Pay' },
    { name: 123 as any, displayName: 'bogus' }, // non-string name ignored
    { name: 'noDisplay' } as any,
  ];

  it('builds a lowercased name -> display map, skipping non-string names', () => {
    const map = buildPaymentMethodDisplayMap(methods);
    expect(map.get('credit')).toBe('信用卡');
    expect(map.get('applepay')).toBe('Apple Pay');
    expect(map.get('nodisplay')).toBe('noDisplay'); // falls back to name
    expect([...map.keys()]).not.toContain(123);
  });

  it('resolves display name case-insensitively', () => {
    const map = buildPaymentMethodDisplayMap(methods);
    expect(resolvePaymentMethodDisplay('CREDIT', map)).toBe('信用卡');
    expect(resolvePaymentMethodDisplay('applepay', map)).toBe('Apple Pay');
  });

  it('falls back to the raw method string when unmatched', () => {
    const map = buildPaymentMethodDisplayMap(methods);
    expect(resolvePaymentMethodDisplay('unknown', map)).toBe('unknown');
  });

  it('returns the value (or empty string) for non-string methods', () => {
    const map = buildPaymentMethodDisplayMap(methods);
    expect(resolvePaymentMethodDisplay(null, map)).toBe('');
    expect(resolvePaymentMethodDisplay(undefined, map)).toBe('');
    expect(resolvePaymentMethodDisplay(42 as any, map)).toBe(42);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/order/order.export.helper.spec.ts`
Expected: FAIL — `Cannot find module './order.export.helper'`.

- [ ] **Step 3: Write minimal implementation**

`src/order/order.export.helper.ts`:
```ts
export function buildPaymentMethodDisplayMap(
  paymentMethods: Array<{ name: unknown; displayName?: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const pm of paymentMethods) {
    if (typeof pm.name === 'string') {
      map.set(pm.name.toLowerCase(), pm.displayName ?? pm.name);
    }
  }
  return map;
}

export function resolvePaymentMethodDisplay(rawMethod: unknown, displayMap: Map<string, string>): string {
  if (typeof rawMethod !== 'string') {
    return (rawMethod ?? '') as string;
  }
  return displayMap.get(rawMethod.toLowerCase()) ?? rawMethod;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/order/order.export.helper.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire helper into `orderLogToRawCsv`, removing the two per-row debug logs**

In `src/order/order.service.ts`:
1. Add import at top: `import { buildPaymentMethodDisplayMap, resolvePaymentMethodDisplay } from './order.export.helper';`
2. Near the start of `orderLogToRawCsv` (before `return orderLogs.map(...)`), add: `const paymentMethodDisplayMap = buildPaymentMethodDisplayMap(paymentMethods);`
3. Replace the `csvRawOrderLog.paymentLogDetails = each.paymentLogs.map(payment => { ... }).join('\n');` block (the one containing both `console.log('[DEBUG] RAW payment.method' ...)` and `console.log('[DEBUG] Matching result' ...)`) with:
```ts
        csvRawOrderLog.paymentLogDetails = each.paymentLogs
          .map(payment => resolvePaymentMethodDisplay(payment.method, paymentMethodDisplayMap))
          .join('\n');
```

- [ ] **Step 6: Run full order tests + build**

Run: `yarn jest src/order`
Expected: PASS (existing `order.service.spec.ts`, `class/csvHeaderMapping.spec.ts`, and new helper spec all green).
Run: `yarn build`
Expected: build succeeds, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/order/order.export.helper.ts src/order/order.export.helper.spec.ts src/order/order.service.ts
git commit -m "perf(order-export): map-based payment method lookup, drop per-row debug logs"
```

---

### Task 2: 其餘 per-row `.find()` 改 `Map` + 移除 PaymentMethods debug log

**Files:**
- Modify: `src/order/order.service.ts`（`orderLogToRawCsv` 的 aggregator 區塊、`orderProductToRawCsv`、`processOrderLogExportFromDatabase`）

**Interfaces:**
- Consumes: nothing new（純內部重構）。
- Produces: 無對外新介面。

行為必須完全不變：僅把迴圈內對陣列的 `.find()` 換成迴圈外建好的 `Map.get()`。

- [ ] **Step 1: Add a regression test capturing current `orderLogToRawCsv` output**

新增 `src/order/order.service.export.spec.ts`，建立 service 實例（沿用 `order.service.spec.ts` 的建構/mock 方式：只需要能直接呼叫 `orderLogToRawCsv`/`orderProductToRawCsv`，不需 DB）。用一筆代表性 fixture 呼叫，並用 `toMatchSnapshot()` 記錄輸出：
```ts
// 參考 order.service.spec.ts 既有的 TestingModule 設定建立 service
// fixture 需涵蓋：2 筆 orderLog，含 paymentLogs(命中/未命中 method)、orderProducts(含 product.target 對得到/對不到 owner)、
// orderDiscounts(target 對得到/對不到 coupon)、options.from 對得到/對不到 sharingCode、orderExecutors。
it('orderLogToRawCsv output is stable (regression snapshot)', async () => {
  const headerInfos = await new OrderLogCsvHeaderMapping().createHeader();
  const rows = await service.orderLogToRawCsv(headerInfos, orderLogsFixture, couponsFixture, sharingCodesFixture, productOwnersFixture, paymentMethodsFixture);
  expect(rows).toMatchSnapshot();
});

it('orderProductToRawCsv output is stable (regression snapshot)', async () => {
  const headerInfos = await new OrderProductCsvHeaderMapping().createHeader();
  const rows = await service.orderProductToRawCsv(headerInfos, orderProductsFixture, productOwnersFixture);
  expect(rows).toMatchSnapshot();
});
```
（fixture 依 `orderLogToRawCsv` 讀取的欄位建構：`OrderLog` → id,status,createdAt,options,shipping,invoiceOptions,paymentModel,member{name,username,email},paymentLogs[{no,method,paidAt,invoiceIssuedAt}],orderProducts[{name,options,price,product{target,type}}],orderDiscounts[{name,price,target}],orderExecutors[{ratio,member{name}}]；`Coupon`{id,couponCode{code}}；`SharingCode`{path,note}；`ProductOwner`{productId,memberName}；`PaymentMethod`{name,displayName}。）

- [ ] **Step 2: Run to capture baseline snapshot (green on current code)**

Run: `yarn jest src/order/order.service.export.spec.ts`
Expected: PASS，並在 `src/order/__snapshots__/` 產生 snapshot（此為改動前的黃金基準）。

- [ ] **Step 3: Refactor `.find()` → `Map` in `orderLogToRawCsv`**

在 `orderLogToRawCsv` 內、`return orderLogs.map(...)` 之前，建立查表：
```ts
    const couponById = new Map(coupons.map(c => [c.id, c]));
    const sharingCodeByPath = new Map(sharingCodes.map(sc => [sc.path, sc]));
    const productOwnerByProductId = new Map(productOwners.map(o => [o.productId, o]));
```
- `orderProductAggregator` 內 `productOwners.find(owner => owner.productId === orderProduct.product.target)?.memberName || ''` → `productOwnerByProductId.get(orderProduct.product.target)?.memberName || ''`
- `orderProductAggregator` 內 `sharingCodes.find(sharingCode => sharingCode.path === getValue(orderProduct.options, 'from'))?.note` → `sharingCodeByPath.get(getValue(orderProduct.options, 'from') as string)?.note`
- `orderDiscountsAggregator` 內 `coupons.find(coupon => coupon.id === orderDiscount.target)` → `couponById.get(orderDiscount.target)`

- [ ] **Step 4: Refactor `orderProductToRawCsv` `.find()` → `Map`**

在 `orderProductToRawCsv` 的 `return orderProducts.map(...)` 之前加：
```ts
    const productOwnerByProductId = new Map(productOwners.map(o => [o.productId, o]));
```
並將 `productOwners.find(owner => owner.productId === each.product.target)?.memberName || ''` → `productOwnerByProductId.get(each.product.target)?.memberName || ''`。

- [ ] **Step 5: Remove the `[DEBUG] PaymentMethods loaded` log**

在 `processOrderLogExportFromDatabase` 刪除整段 `console.log('[DEBUG] PaymentMethods loaded', JSON.stringify({ count: paymentMethods.length, methods: paymentMethods }))`。

- [ ] **Step 6: Run regression snapshots — must still match**

Run: `yarn jest src/order/order.service.export.spec.ts`
Expected: PASS，snapshot 未變（證明重構行為不變）。若 snapshot 不符即為 regression，需修正實作而非更新 snapshot。

- [ ] **Step 7: Full order tests + build**

Run: `yarn jest src/order`
Expected: PASS。
Run: `yarn build`
Expected: 成功。

- [ ] **Step 8: Commit**

```bash
git add src/order/order.service.ts src/order/order.service.export.spec.ts src/order/__snapshots__
git commit -m "perf(order-export): map-based coupon/sharingCode/owner lookups, drop payment methods debug log"
```

---

### Task 3: Bull export job timeout（B1）

**Files:**
- Create: `src/order/order.export.constants.ts`
- Modify: `src/order/order.controller.ts`（3 處 `exportQueue.add`）
- Modify: `src/member/member.controller.ts`（1 處 export `exportQueue.add`，約 :168）
- Create: `src/order/order.controller.timeout.spec.ts`

**Interfaces:**
- Produces: `EXPORT_JOB_TIMEOUT_MS: number`（讀 `process.env.EXPORT_JOB_TIMEOUT_MS`，預設 600000）。
- Consumes: 既有 `exportQueue.add(job, opts)`。

- [ ] **Step 1: Write the failing test**

`src/order/order.controller.timeout.spec.ts`:
```ts
import { OrderController } from './order.controller';
import { EXPORT_JOB_TIMEOUT_MS } from './order.export.constants';

describe('OrderController export job options', () => {
  it('adds export jobs with a timeout and removeOnComplete/removeOnFail', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const controller = new OrderController(
      {} as any,            // authService
      {} as any,            // orderService
      { add } as any,       // exportQueue
      {} as any,            // entityManager
    );
    const member = { appId: 'app1', memberId: 'm1' } as any;
    await controller.exportOrderLogs(member, { exportMime: 'xlsx' } as any);
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'app1', category: 'orderLog' }),
      expect.objectContaining({ removeOnComplete: true, removeOnFail: true, timeout: EXPORT_JOB_TIMEOUT_MS }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/order/order.controller.timeout.spec.ts`
Expected: FAIL — module `./order.export.constants` 不存在，或 `timeout` 未傳。

- [ ] **Step 3: Add the constant**

`src/order/order.export.constants.ts`:
```ts
export const EXPORT_JOB_TIMEOUT_MS = Number(process.env.EXPORT_JOB_TIMEOUT_MS) || 600000;
```

- [ ] **Step 4: Add `timeout` to all export `add` calls**

`src/order/order.controller.ts`：import `EXPORT_JOB_TIMEOUT_MS`，並將 3 處
`await this.exportQueue.add(exportJob, { removeOnComplete: true, removeOnFail: true });`
改為
`await this.exportQueue.add(exportJob, { removeOnComplete: true, removeOnFail: true, timeout: EXPORT_JOB_TIMEOUT_MS });`

`src/member/member.controller.ts`：同樣 import 常數，將 export 的那一行（`this.exportQueue.add(exportJob, { removeOnComplete: true, removeOnFail: true })`，約 :168）加上 `timeout: EXPORT_JOB_TIMEOUT_MS`。**注意：不要改 :151 的 `importerQueue.add`。**

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn jest src/order/order.controller.timeout.spec.ts`
Expected: PASS。

- [ ] **Step 6: Build**

Run: `yarn build`
Expected: 成功。

- [ ] **Step 7: Commit**

```bash
git add src/order/order.export.constants.ts src/order/order.controller.ts src/member/member.controller.ts src/order/order.controller.timeout.spec.ts
git commit -m "feat(export): add configurable Bull job timeout to export jobs"
```

---

### Task 4: Tasker event-loop watchdog（B2）

**Files:**
- Create: `src/tasker/watchdog.ts`
- Create: `src/tasker/watchdog.spec.ts`
- Modify: `src/main.ts`（tasker 分支）

**Interfaces:**
- Produces:
  - `isHeartbeatStale(lastBeatMs: number, nowMs: number, timeoutMs: number): boolean` — `lastBeatMs > 0 && nowMs - lastBeatMs > timeoutMs`。
  - `startTaskerWatchdog(options?: { timeoutMs?: number; intervalMs?: number }): { stop: () => void }` — 建 `SharedArrayBuffer`(8 bytes) + `BigInt64Array`；主線每 `intervalMs` `Atomics.store(view, 0, BigInt(Date.now()))`；spawn eval worker 每 `intervalMs` 檢查 stale，超時 `process.kill(process.pid,'SIGKILL')`。回傳可停止的 handle（清 interval + `worker.terminate()`）。

- [ ] **Step 1: Write the failing test**

`src/tasker/watchdog.spec.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/tasker/watchdog.spec.ts`
Expected: FAIL — `Cannot find module './watchdog'`.

- [ ] **Step 3: Implement `watchdog.ts`**

`src/tasker/watchdog.ts`:
```ts
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
  const timeoutMs = options?.timeoutMs ?? Number(process.env.TASKER_WATCHDOG_TIMEOUT_MS) || 120000;
  const intervalMs = options?.intervalMs ?? Number(process.env.WATCHDOG_HEARTBEAT_INTERVAL_MS) || 1000;

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/tasker/watchdog.spec.ts`
Expected: PASS (4 tests)。

- [ ] **Step 5: Wire watchdog into the tasker branch of `main.ts`**

在 `src/main.ts` top import：`import { startTaskerWatchdog } from './tasker/watchdog';`
在 `else if (TaskerType[workerName] !== undefined) { ... }` 區塊內、`app = await NestFactory.create(...TaskerModule.forRoot...)` 之後，加：
```ts
      startTaskerWatchdog();
```
（僅 tasker 分支；runner / api 分支不加。）

- [ ] **Step 6: Build + full suite**

Run: `yarn build`
Expected: 成功。
Run: `yarn jest`
Expected: 全綠。

- [ ] **Step 7: Commit**

```bash
git add src/tasker/watchdog.ts src/tasker/watchdog.spec.ts src/main.ts
git commit -m "feat(tasker): add event-loop watchdog that restarts a hung tasker"
```

---

## 完成後驗證

- [ ] `yarn jest` 全綠、`yarn build` 通過。
- [ ] 人工檢視 `git diff release...HEAD`：A 只動查表/移除 log、無行為改變；B1 只加 timeout；B2 只在 tasker 分支啟動。
- [ ] （部署後，另行）觀察 `/ecs/LodestarServerTaskerProduction` 出現 `[tasker-watchdog] started`；一段時間內無誤殺（無非預期 `event loop stalled` SIGKILL）。
