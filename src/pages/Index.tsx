import { useState, useCallback, useRef } from "react";
import PyEditor from "@/components/PyEditor";
import Console from "@/components/Console";
import { usePyodide } from "@/hooks/usePyodide";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = {
  id: string;
  name: string;
  code: string;
};

// ─── Examples (sidebar) ───────────────────────────────────────────────────────

const EXAMPLES: { label: string; icon: string; code: string }[] = [
  {
    label: "Привет мир",
    icon: "Code2",
    code: `# Привет, Python!
print("Привет, мир!")
print("\\n".join([f"  {i}. Python — это мощно!" for i in range(1, 4)]))

import math
print(f"\\nπ = {math.pi:.10f}")
print(f"√2 = {math.sqrt(2):.10f}")
`,
  },
  {
    label: "Данные",
    icon: "BarChart2",
    code: `# Работа с данными
data = {
    "проект": "PySpace",
    "версия": "1.0",
    "фичи": ["Monaco", "Pyodide", "Библиотеки"]
}
for k, v in data.items():
    print(f"{k}: {v}")

числа = list(range(1, 11))
print(f"\\nЧисла: {числа}")
print(f"Сумма: {sum(числа)}, Среднее: {sum(числа)/len(числа):.1f}")
`,
  },
  {
    label: "NumPy",
    icon: "Cpu",
    code: `import numpy as np

a = np.array([1, 2, 3, 4, 5])
b = np.linspace(0, 1, 5)

print("Массив a:", a)
print("Массив b:", np.round(b, 2))
print("a * 2 =", a * 2)
print("Среднее:", np.mean(a))
print("Стандартное отклонение:", np.std(a))

m = np.ones((3, 3)) * np.arange(1, 4)
print("\\nМатрица:\\n", m)
`,
  },
  {
    label: "Алгоритмы",
    icon: "Zap",
    code: `def fibonacci(n):
    memo = {}
    def fib(k):
        if k in memo: return memo[k]
        if k <= 1: return k
        memo[k] = fib(k-1) + fib(k-2)
        return memo[k]
    return [fib(i) for i in range(n)]

def is_prime(n):
    if n < 2: return False
    return all(n % i != 0 for i in range(2, int(n**0.5)+1))

print("Фибоначчи:", fibonacci(15))
print("Простые до 50:", [n for n in range(2, 50) if is_prime(n)])
`,
  },
  {
    label: "Змейка",
    icon: "Gamepad2",
    code: `# 🎮 Змейка в консоли
WIDTH, HEIGHT = 20, 8
snake = [(5, 4), (4, 4), (3, 4)]
food = (12, 4)

def render(snake, food):
    grid = [['·'] * WIDTH for _ in range(HEIGHT)]
    fx, fy = food
    grid[fy][fx] = '★'
    for i, (x, y) in enumerate(snake):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            grid[y][x] = '█' if i > 0 else '▶'
    border = '─' * (WIDTH + 2)
    print(f'┌{border}┐')
    for row in grid:
        print(f'│ {"".join(row)} │')
    print(f'└{border}┘')
    print(f'  Длина: {len(snake)}')

render(snake, food)
print("\\n🎮 Это текстовая демо-версия!")
`,
  },
];

// ─── Initial tab ──────────────────────────────────────────────────────────────

const makeId = () => Math.random().toString(36).slice(2, 8);

const INIT_TABS: Tab[] = [
  { id: makeId(), name: "main.py", code: EXAMPLES[0].code },
];

// ─── Rename dialog ────────────────────────────────────────────────────────────

function RenameDialog({
  value,
  onSave,
  onClose,
}: {
  value: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(value);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0d1117] border border-border rounded-lg p-5 w-80 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-medium text-foreground mb-3">Переименовать вкладку</div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSave(name.trim());
            if (e.key === "Escape") onClose();
          }}
          className="w-full bg-[#161b22] border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-primary transition-colors"
          placeholder="Имя вкладки..."
        />
        <div className="flex gap-2 mt-3 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim())}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Index() {
  const [tabs, setTabs] = useState<Tab[]>(INIT_TABS);
  const [activeId, setActiveId] = useState<string>(INIT_TABS[0].id);
  const [renaming, setRenaming] = useState<string | null>(null);
  const { ready, running, logs, runCode, clearLogs } = usePyodide();
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  // ── Code change — only updates THIS tab ──
  const handleCodeChange = useCallback((code: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, code } : t))
    );
  }, [activeId]);

  // ── Switch tab — does NOT touch code ──
  const switchTab = (id: string) => {
    setActiveId(id);
    clearLogs();
  };

  // ── Add new tab ──
  const addTab = () => {
    const id = makeId();
    const n = tabsRef.current.length + 1;
    const tab: Tab = { id, name: `script_${n}.py`, code: `# Новый скрипт\nprint("Привет!")\n` };
    setTabs((prev) => [...prev, tab]);
    setActiveId(id);
    clearLogs();
  };

  // ── Close tab ──
  const closeTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fallback: Tab = { id: makeId(), name: "main.py", code: EXAMPLES[0].code };
        setActiveId(fallback.id);
        return [fallback];
      }
      if (id === activeId) {
        const idx = prev.findIndex((t) => t.id === id);
        const nextActive = next[Math.max(0, idx - 1)];
        setActiveId(nextActive.id);
      }
      return next;
    });
  };

  // ── Rename tab ──
  const renameTab = (id: string, name: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
    setRenaming(null);
  };

  // ── Load example into CURRENT tab ──
  const loadExample = (code: string, label: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, code, name: label.toLowerCase().replace(/\s+/g, "_") + ".py" } : t
      )
    );
    clearLogs();
  };

  const handleRun = useCallback(() => {
    runCode(activeTab.code);
  }, [activeTab.code, runCode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun]
  );

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0e14]"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{ outline: "none" }}
    >
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-border/60 bg-[#0d1117] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span className="font-bold text-foreground tracking-tight text-base font-sans">PySpace</span>
            <span className="text-muted-foreground/40 text-xs font-mono ml-1">v1.0</span>
          </div>
          <div className="flex items-center gap-1.5 ml-3">
            {!ready ? (
              <div className="flex items-center gap-1.5 text-xs text-yellow-400/80">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Загрузка Python...
              </div>
            ) : running ? (
              <div className="flex items-center gap-1.5 text-xs text-blue-400/80">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Выполняется...
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-green-400/70">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Готов
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground/40 font-mono hidden md:inline">Ctrl+Enter</span>
          <button
            onClick={handleRun}
            disabled={!ready || running}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
              ${ready && !running
                ? "bg-primary text-primary-foreground hover:bg-primary/90 run-pulse"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"}`}
          >
            {running
              ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Icon name="Play" size={14} />}
            {running ? "Выполняется" : "Запустить"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar ── */}
        <aside className="w-44 border-r border-border/60 bg-[#0d1117] flex-col flex-shrink-0 hidden md:flex">
          <div className="px-3 pt-4 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Примеры</span>
          </div>
          <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => loadExample(ex.code, ex.label)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <Icon name={ex.icon as "Code2"} size={14} fallback="Code2" />
                <span className="font-sans text-xs leading-tight">{ex.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-border/40">
            <div className="text-[10px] text-muted-foreground/35 font-mono leading-relaxed">
              numpy · scipy<br />pandas · PIL<br />sympy · json
            </div>
          </div>
        </aside>

        {/* ── Editor + Console ── */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          {/* ── Tabs bar ── */}
          <div className="flex items-end h-9 border-b border-border/60 bg-[#0d1117] flex-shrink-0 overflow-x-auto">
            <div className="flex items-end gap-0 min-w-0">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`group flex items-center gap-1.5 px-3 h-9 border-r border-border/40 cursor-pointer select-none flex-shrink-0 transition-all duration-150
                    ${tab.id === activeId
                      ? "bg-[#0a0e14] text-foreground border-b-2 border-b-primary"
                      : "bg-[#0d1117] text-muted-foreground hover:text-foreground hover:bg-[#0a0e14]/60"}`}
                  onClick={() => switchTab(tab.id)}
                  onDoubleClick={() => setRenaming(tab.id)}
                >
                  <Icon name="FileCode2" size={12} className="opacity-60" fallback="File" />
                  <span className="text-xs font-mono max-w-[100px] truncate">{tab.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ml-0.5 rounded p-0.5"
                  >
                    <Icon name="X" size={10} fallback="X" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addTab}
              className="flex items-center justify-center w-9 h-9 text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition-all flex-shrink-0"
              title="Новая вкладка"
            >
              <Icon name="Plus" size={14} />
            </button>
          </div>

          {/* ── Editor + Console split ── */}
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-w-0 min-h-0">
              <PyEditor
                key={activeTab.id}
                value={activeTab.code}
                onChange={handleCodeChange}
                height="100%"
              />
            </div>
            <div className="w-[380px] flex flex-col flex-shrink-0 border-l border-border/60">
              <Console logs={logs} onClear={clearLogs} />
            </div>
          </div>

          {/* ── Status bar ── */}
          <div className="flex items-center justify-between px-4 h-6 border-t border-border/40 bg-[#0d1117] flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-muted-foreground/35 font-mono">Python 3.11 · Pyodide</span>
              <span className="text-[11px] text-muted-foreground/25 font-mono hidden sm:inline">WebAssembly</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground/35 font-mono">
                {activeTab.code.split("\n").length} строк
              </span>
              <span className="text-[11px] text-muted-foreground/25 font-mono">UTF-8</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rename dialog ── */}
      {renaming && (
        <RenameDialog
          value={tabs.find((t) => t.id === renaming)?.name ?? ""}
          onSave={(name) => renameTab(renaming, name)}
          onClose={() => setRenaming(null)}
        />
      )}
    </div>
  );
}
