import { useEffect, useRef } from "react";
import { LogLine } from "@/hooks/usePyodide";
import Icon from "@/components/ui/icon";

interface ConsoleProps {
  logs: LogLine[];
  onClear: () => void;
}

export default function Console({ logs, onClear }: ConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#080c10]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Консоль</span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
        >
          <Icon name="Trash2" size={12} />
          Очистить
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-0.5 font-mono">
        {logs.length === 0 ? (
          <div className="flex items-center gap-3 text-muted-foreground/40 mt-4">
            <Icon name="Terminal" size={16} />
            <span className="text-sm">Вывод программы появится здесь</span>
          </div>
        ) : (
          logs.map((line) => (
            <div key={line.id} className={`console-line animate-fade-in console-line-${line.type}`} data-type={line.type}>
              <ConsoleLine line={line} />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function ConsoleLine({ line }: { line: LogLine }) {
  const colors: Record<string, string> = {
    output: "#CDD9E5",
    error: "#ff6b6b",
    info: "#6b7280",
    success: "#6ee7b7",
  };

  return (
    <div style={{ color: colors[line.type] ?? colors.output }} className="text-[13px] leading-relaxed whitespace-pre-wrap break-all">
      {line.type === "error" && (
        <span className="opacity-60 mr-2">✗</span>
      )}
      {line.text}
    </div>
  );
}
