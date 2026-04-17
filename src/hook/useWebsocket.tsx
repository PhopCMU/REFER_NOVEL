import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseItem, MedicalFile, TStatus } from "../types/type";

// ─── Event Payload Types ──────────────────────────────────────────────────────

export interface WSUpdateStatusPayload {
  caseId: string;
  referenceNo?: string;
  oldStatus?: TStatus;
  newStatus?: TStatus;
  note?: string;
}

export type WSCreateNewCasePayload = CaseItem;

export interface WSDeleteCasePayload {
  caseId: string;
}

export interface WSUpdateFilePayload {
  caseId: string;
  files: MedicalFile[];
}

// ─── Discriminated union for incoming messages ────────────────────────────────

type WSMessage =
  | { event: "update-status"; data: WSUpdateStatusPayload }
  | { event: "create-newcase"; data: WSCreateNewCasePayload }
  | { event: "delete-usecase"; data: WSDeleteCasePayload }
  | { event: "update-file"; data: WSUpdateFilePayload }
  | { event: "update-followup"; data: WSUpdateFilePayload };

// ─── Hook Options ─────────────────────────────────────────────────────────────

export interface UseWebSocketOptions {
  /** Called when a case status changes */
  onUpdateStatus?: (data: WSUpdateStatusPayload) => void;
  /** Called when a new case is created */
  onCreateNewCase?: (data: WSCreateNewCasePayload) => void;
  /** Called when a case is deleted */
  onDeleteCase?: (data: WSDeleteCasePayload) => void;
  /** Called when a case's files are updated */
  onUpdateFile?: (data: WSUpdateFilePayload) => void;
  /** Called when a case's follow-up files are updated */
  onUpdateFileFollowUp?: (data: WSUpdateFilePayload) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RECONNECT_DELAY_MS = 3000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages a WebSocket connection with auto-reconnect.
 *
 * Handles events:
 * - `update-status`  — a case status changed
 * - `create-newcase` — a new case was created
 * - `delete-usecase` — a case was deleted
 * - `update-file`    — the files of a case were updated
 */
export function useWebSocket(url: string, options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  // Keep options ref in sync so handlers always see latest closures
  // without requiring a reconnect on every render.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const connect = useCallback(() => {
    if (!isMounted.current) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      setIsConnected(true);
    };

    ws.onmessage = (e: MessageEvent) => {
      let parsed: WSMessage;
      try {
        parsed = JSON.parse(e.data as string) as WSMessage;
      } catch {
        return;
      }

      const {
        onUpdateStatus,
        onCreateNewCase,
        onDeleteCase,
        onUpdateFile,
        onUpdateFileFollowUp,
      } = optionsRef.current;

      switch (parsed.event) {
        case "update-status":
          onUpdateStatus?.(parsed.data);
          break;
        case "create-newcase":
          onCreateNewCase?.(parsed.data);
          break;
        case "delete-usecase":
          onDeleteCase?.(parsed.data);
          break;
        case "update-file":
          onUpdateFile?.(parsed.data);
          break;
        case "update-followup":
          onUpdateFileFollowUp?.(parsed.data);
          break;
      }
    };

    ws.onerror = () => {
      // Closing the socket will trigger onclose which schedules reconnect
      ws.close();
    };

    ws.onclose = () => {
      if (!isMounted.current) return;
      setIsConnected(false);
      reconnectTimer.current = setTimeout(() => {
        connect();
      }, RECONNECT_DELAY_MS);
    };
  }, [url]);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected };
}
