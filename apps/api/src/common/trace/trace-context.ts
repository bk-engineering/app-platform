import { AsyncLocalStorage } from "node:async_hooks";

interface TraceStore {
  traceId: string;
  userId?: string;
}

export const traceStorage = new AsyncLocalStorage<TraceStore>();

export const getTraceId = () => traceStorage.getStore()?.traceId ?? "no-trace";
export const getUserId = () => traceStorage.getStore()?.userId;

/** called after successful authentication so downstream logs know who acted */
export const setUserId = (userId: string) => {
  const store = traceStorage.getStore();
  if (store) store.userId = userId;
};
