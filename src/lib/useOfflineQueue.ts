"use client";

import { useState, useEffect, useCallback } from "react";

export interface QueuedRecord {
  id: string;
  endpoint: string;
  method: string;
  payload: unknown;
  queuedAt: string;
}

const QUEUE_KEY = "smj_sync_queue";
const JOBS_CACHE_KEY = "smj_jobs_cache";

function loadQueue(): QueuedRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRecord[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function useOfflineQueue() {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedRecord[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Initialise from localStorage on mount
  useEffect(() => {
    setOnline(navigator.onLine);
    setQueue(loadQueue());
  }, []);

  // Drain queue — attempt to POST/PATCH each record
  const drain = useCallback(async () => {
    const current = loadQueue();
    if (!current.length) return;

    setSyncing(true);
    const remaining: QueuedRecord[] = [];

    for (const record of current) {
      try {
        const res = await fetch(record.endpoint, {
          method: record.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record.payload),
        });
        if (!res.ok) remaining.push(record); // keep if server error
      } catch {
        remaining.push(record); // keep if network error
      }
    }

    saveQueue(remaining);
    setQueue(remaining);
    setSyncing(false);
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      drain();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [drain]);

  // Enqueue a record for later sync
  const enqueue = useCallback(
    (endpoint: string, method: string, payload: unknown): QueuedRecord => {
      const record: QueuedRecord = {
        id: crypto.randomUUID(),
        endpoint,
        method,
        payload,
        queuedAt: new Date().toISOString(),
      };
      const next = [...loadQueue(), record];
      saveQueue(next);
      setQueue(next);
      return record;
    },
    []
  );

  // Try online first, fall back to queue
  const syncOrQueue = useCallback(
    async (
      endpoint: string,
      method: string,
      payload: unknown
    ): Promise<{ queued: boolean; error?: string }> => {
      if (navigator.onLine) {
        try {
          const res = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) return { queued: false };
          // Server error — queue it
          enqueue(endpoint, method, payload);
          return { queued: true, error: `Server error ${res.status}` };
        } catch {
          // Network error despite navigator.onLine — queue it
          enqueue(endpoint, method, payload);
          return { queued: true };
        }
      } else {
        enqueue(endpoint, method, payload);
        return { queued: true };
      }
    },
    [enqueue]
  );

  return {
    online,
    syncing,
    pendingSync: queue.length,
    syncOrQueue,
    drain,
  };
}

// ─── Job cache helpers (used in page.tsx) ────────────────────────

export function getCachedJobs<T>(): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(JOBS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedJobs<T>(jobs: T[]) {
  try {
    localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(jobs));
  } catch {}
}
