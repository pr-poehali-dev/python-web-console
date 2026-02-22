import { useCallback, useEffect, useRef, useState } from "react";

export type LogLine = {
  id: number;
  type: "output" | "error" | "info" | "success";
  text: string;
  ts: number;
};

let lineId = 0;

export function usePyodide() {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const pendingRef = useRef<Map<number, { resolve: () => void; reject: (e: string) => void }>>(new Map());
  const msgIdRef = useRef(0);

  const addLog = useCallback((type: LogLine["type"], text: string) => {
    setLogs((prev) => [...prev, { id: lineId++, type, text, ts: Date.now() }]);
  }, []);

  useEffect(() => {
    const worker = new Worker("/py-worker.js");

    worker.onmessage = (e) => {
      const { id, type, text } = e.data;

      if (type === "ready") {
        setReady(true);
        return;
      }
      if (type === "stdout") {
        addLog("output", text);
        return;
      }
      if (type === "stderr") {
        addLog("error", text);
        return;
      }
      if (type === "done" || type === "install_done") {
        const p = pendingRef.current.get(id);
        if (p) { p.resolve(); pendingRef.current.delete(id); }
        return;
      }
      if (type === "error") {
        const p = pendingRef.current.get(id);
        if (p) { p.reject(text); pendingRef.current.delete(id); }
        addLog("error", text);
        return;
      }
    };

    worker.onerror = (e) => {
      addLog("error", `Worker error: ${e.message}`);
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, [addLog]);

  const runCode = useCallback(async (code: string) => {
    if (!workerRef.current || running) return;
    setRunning(true);
    setLogs([]);
    addLog("info", "▶ Запуск...");

    const id = msgIdRef.current++;

    try {
      await new Promise<void>((resolve, reject) => {
        pendingRef.current.set(id, { resolve, reject });
        workerRef.current!.postMessage({ id, type: "run", code });
      });
      addLog("success", "✓ Выполнено успешно");
    } catch (err) {
      // error already logged via worker message
    } finally {
      setRunning(false);
    }
  }, [running, addLog]);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { ready, running, logs, runCode, clearLogs };
}
