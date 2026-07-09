# Exporter Tasker Hardening — 大量訂單匯出卡死修復

Date: 2026-07-09
Repo: lodestar-server
Branch: fix/exporter-tasker-hang-hardening

## 背景 / 事件

2026-07-08 17:06，某 app 送出一筆超大量 orderLog 匯出（Bull job 940）。`exporter-tasker`（ECS service `LodestarTasker`）處理時 Node event loop 被卡死；因容器**無 health check**、程式又未 crash 退出（`essential:true` 但沒退出），ECS 判定 RUNNING 不重啟，worker 靜默 18 小時，其間所有匯出 job 積在 `bull:ExporterTasker` 佇列不處理 → 使用者按匯出收不到信。已用兩次 `force-new-deployment` 觸發 Bull stalled 上限丟棄毒藥 job、清空 backlog 恢復。此 spec 處理**根因與防護**，避免再發生。

## 根因（依影響排序）

1. **debug console.log 未移除**：`order.service.ts` 每筆 paymentLog 印兩行 debug（含逐字元 `charCodeAt`）+ 每次匯出印整包 payment methods。數萬筆 → 數萬次同步 stdout 寫入，灌爆 log pipe、餓死 event loop。（acute trigger）
2. **一次全載入記憶體**：`exportOrderLogsFromDatabase` 用 TypeORM `find` 帶多層關聯，無分頁，大範圍逼近 2GB 容器上限 → GC thrashing。
3. **O(n×m) `.find()` in-memory join**：per-order 迴圈對 `coupons/sharingCodes/productOwners/paymentMethods` 線性搜尋。
4. **同步 `XLSX.write`**：`exporter.tasker.ts` 一次序列化整個 workbook，卡住 event loop。

本次修 #1、#3（範圍 A）與新增防護（B）。#2、#4 的根治（DB 分批 + XLSX 串流）列為後續階段 C，不在此次。

## 範圍

### A — 消除卡死主因（`src/order/order.service.ts`）

**A1 移除 debug log** 三處：
- `[DEBUG] RAW payment.method`（約 :368）
- `[DEBUG] Matching result`（約 :378）
- `[DEBUG] PaymentMethods loaded`（約 :541）

**A2 `.find()` → `Map` 查表**：在 `orderLogToRawCsv`（及其內部 aggregator closure）迴圈外預先建 Map，將 per-row 線性搜尋改 O(1)：
- `paymentMethodByName`: key = `pm.name.toLowerCase()`（僅 `typeof name === 'string'` 才入表）
- `couponById`: key = `coupon.id`
- `sharingCodeByPath`: key = `sharingCode.path`
- `productOwnerByProductId`: key = `owner.productId`（`orderProductToRawCsv` 也改用）

**不變的行為**：CSV 欄位、順序、值、join 格式一律與現行一致。paymentMethod 找不到時 fallback 維持 `methodName || payment.method`；找不到 owner/ coupon/sharingCode 的 undefined/'' 行為維持一致。

### B1 — Bull job timeout

`order.controller.ts`（`export`、`export/products`、`export/discounts` 共 3 處）與 `member.controller.ts`（export 1 處）的 `exportQueue.add(job, opts)`：
- opts 增加 `timeout: EXPORT_JOB_TIMEOUT_MS`，預設 **600000（10 分鐘）**，可用環境變數 `EXPORT_JOB_TIMEOUT_MS` 覆寫。
- 保留現有 `removeOnComplete: true, removeOnFail: true`。
- 限制：Bull timeout 為同 event loop 計時器，**僅能中斷 await 型 hang**，同步卡死由 B2 處理。

### B2 — worker_thread 心跳 watchdog（新檔 `src/tasker/watchdog.ts`）

偵測主執行緒 event loop 卡死並讓 ECS 自動重啟：
- **主執行緒**：`setInterval` 每 `HEARTBEAT_INTERVAL_MS`（預設 1000）用 `Atomics.store(view, 0, Date.now())` 寫心跳到 `SharedArrayBuffer`。
- **worker thread**（`worker_threads`，獨立 event loop，不受主線同步卡死影響）：每 `HEARTBEAT_INTERVAL_MS` 檢查 `Date.now() - Atomics.load(view, 0)`；若 > `WATCHDOG_TIMEOUT_MS`（預設 **120000**，env `TASKER_WATCHDOG_TIMEOUT_MS` 可調）→ 印明確錯誤日誌（含 stale 秒數）後 **`process.kill(process.pid, 'SIGKILL')`**。
  - 說明：worker_thread 與主線**共用 PID**；`process.exit()` 在 worker 只會結束該 worker、無法終止主行程，故用 `process.kill(process.pid, 'SIGKILL')` 由 OS 立即終止整個行程（SIGKILL 不可攔截，主線即使卡死也會被殺）。SIGKILL 為突然終止不做 graceful shutdown——可接受：Bull job lock 過期後，重啟的 worker 依既有 stalled 機制處理（與本次事件的恢復方式相同）。
- **啟動點**：僅在 tasker 模式啟動（`main.ts` 的 `TaskerModule.forRoot` 分支後）呼叫 `startWatchdog()`。runner / api 模式不啟用。
- 因 `exporter-tasker` 為 `essential:true`，主行程 exit → 容器退出 → ECS 重啟整個 task（含 importer-tasker）。
- **門檻取捨**：120s 遠大於正常匯出（含 XLSX.write）的合法同步停頓，避免誤殺；真正無限卡死必然超過而被重啟。在 C（串流化）完成前，超大匯出本就無法完成，被重啟屬預期。

## 測試

- **A2**：對 `orderLogToRawCsv`（及 `orderProductToRawCsv`）補單元測試，用含多筆 order/paymentLog/coupon/sharingCode/owner 的 fixture，斷言改 Map 前後輸出列完全一致；涵蓋 paymentMethod 命中/未命中、owner 找不到等分支。
- **B2**：單元測試 watchdog 判定邏輯——心跳新鮮 → 不觸發；心跳超過門檻 → 觸發退出 callback（以可注入的 exit function 驗證，不真的 exit）。
- **B1**：設定項，不特別測；以型別/編譯確保 options 正確。
- 全套 `yarn test` 綠燈；`yarn build` 通過。

## 風險 / 回滾

- A 為純效能重構，行為不變，風險低；以單元測試把關輸出一致性。
- B2 誤殺風險由 120s 門檻與 env 可調降低；若上線後發現誤殺，調高 `TASKER_WATCHDOG_TIMEOUT_MS`（例如設一個很大的值即可實質停用 watchdog）。注意：目前 `Number(env) || 120000` 的解析會把 `0` 視為未設而落回預設，**設 `0` 無法關閉** watchdog——要停用請改設很大的值。
- 皆為 lodestar-server 單一 repo，透過既有 deploy pipeline 上線；無 infra/terraform 變更。

## 不做（YAGNI）

- C：DB 分批/游標 + XLSX/CSV 串流寫入（另階段評估）。
- ECS 容器 health check（改採程式內 watchdog，避免動 infra）。
- 前端 `OrderExportModal.tsx` payload 型別小瑕疵（後端讀 `startedAt/endedAt`，實際相容，不動）。
