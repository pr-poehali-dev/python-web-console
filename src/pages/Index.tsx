import { useState, useCallback } from "react";
import PyEditor from "@/components/PyEditor";
import Console from "@/components/Console";
import { usePyodide } from "@/hooks/usePyodide";
import Icon from "@/components/ui/icon";

const EXAMPLES: Record<string, { label: string; icon: string; code: string }> = {
  hello: {
    label: "Привет мир",
    icon: "Code2",
    code: `# Привет, Python!
print("Привет, мир!")
print("\\n".join([f"  {i}. Python — это мощно!" for i in range(1, 4)]))

# Математика
import math
print(f"\\nπ = {math.pi:.10f}")
print(f"√2 = {math.sqrt(2):.10f}")
`,
  },
  data: {
    label: "Данные",
    icon: "BarChart2",
    code: `# Работа с данными
import json

data = {
    "проект": "PySpace",
    "версия": "1.0",
    "фичи": ["Monaco редактор", "Pyodide", "Библиотеки", "Игры"]
}

for ключ, значение in data.items():
    print(f"{ключ}: {значение}")

# Список
числа = list(range(1, 11))
print(f"\\nЧисла: {числа}")
print(f"Сумма: {sum(числа)}")
print(f"Среднее: {sum(числа)/len(числа):.1f}")
`,
  },
  numpy: {
    label: "NumPy",
    icon: "Cpu",
    code: `# NumPy — научные вычисления
import numpy as np

# Создание массивов
a = np.array([1, 2, 3, 4, 5])
b = np.linspace(0, 1, 5)

print("Массив a:", a)
print("Массив b:", np.round(b, 2))
print("a * 2 =", a * 2)
print("Сумма:", np.sum(a))
print("Среднее:", np.mean(a))
print("Стандартное отклонение:", np.std(a))

# Матрица
m = np.ones((3, 3)) * np.arange(1, 4)
print("\\nМатрица:\\n", m)
`,
  },
  game: {
    label: "Змейка",
    icon: "Gamepad2",
    code: `# 🎮 Змейка в консоли (текстовая версия)
import random

WIDTH, HEIGHT = 20, 10
snake = [(5, 5), (4, 5), (3, 5)]
food = (10, 5)

def render(snake, food):
    grid = [['·'] * WIDTH for _ in range(HEIGHT)]
    fx, fy = food
    grid[fy][fx] = '🍎'
    for i, (x, y) in enumerate(snake):
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            grid[y][x] = '█' if i > 0 else '▶'
    border = '─' * (WIDTH + 2)
    print(f'┌{border}┐')
    for row in grid:
        print(f'│ {"".join(row)} │')
    print(f'└{border}┘')
    print(f'  Длина змейки: {len(snake)}')

render(snake, food)
print("\\n🎮 Текстовая демо-версия змейки!")
print("Для pygame-игр открой 'Игры' в меню слева.")
`,
  },
  fibonacci: {
    label: "Алгоритмы",
    icon: "Zap",
    code: `# Алгоритмы и рекурсия

def fibonacci(n):
    """Числа Фибоначчи с мемоизацией"""
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

fibs = fibonacci(15)
print("Фибоначчи:", fibs)

primes = [n for n in range(2, 50) if is_prime(n)]
print("Простые числа до 50:", primes)

arr = [64, 34, 25, 12, 22, 11, 90]
for i in range(len(arr)):
    for j in range(len(arr)-i-1):
        if arr[j] > arr[j+1]:
            arr[j], arr[j+1] = arr[j+1], arr[j]
print("Отсортированный массив:", arr)
`,
  },
};

const DEFAULT_CODE = EXAMPLES.hello.code;

export default function Index() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [activeExample, setActiveExample] = useState("hello");
  const { ready, running, logs, runCode, clearLogs } = usePyodide();

  const handleRun = useCallback(() => {
    runCode(code);
  }, [code, runCode]);

  const handleExample = (key: string) => {
    setActiveExample(key);
    setCode(EXAMPLES[key].code);
    clearLogs();
  };

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
      {/* Header */}
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
          <span className="text-xs text-muted-foreground/40 font-mono hidden md:inline">
            Ctrl+Enter — запуск
          </span>
          <button
            onClick={handleRun}
            disabled={!ready || running}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
              ${
                ready && !running
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 run-pulse"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              }
            `}
          >
            {running ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="Play" size={14} />
            )}
            {running ? "Выполняется" : "Запустить"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-44 border-r border-border/60 bg-[#0d1117] flex-col flex-shrink-0 hidden md:flex">
          <div className="px-3 pt-4 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
              Примеры
            </span>
          </div>
          <nav className="flex-1 px-2 space-y-0.5">
            {Object.entries(EXAMPLES).map(([key, ex]) => (
              <button
                key={key}
                onClick={() => handleExample(key)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all duration-150
                  ${
                    activeExample === key
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }
                `}
              >
                <Icon name={ex.icon as "Code2"} size={14} fallback="Code2" />
                <span className="font-sans text-xs leading-tight">{ex.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-border/40">
            <div className="text-[10px] text-muted-foreground/35 font-mono leading-relaxed">
              Библиотеки:
              <br />
              numpy · scipy
              <br />
              pandas · PIL
              <br />
              sympy · json
            </div>
          </div>
        </aside>

        {/* Editor + Console */}
        <div className="flex flex-1 min-h-0 min-w-0">
          {/* Editor panel */}
          <div className="flex flex-col flex-1 min-w-0 border-r border-border/60">
            <div className="flex items-center gap-3 px-4 h-9 border-b border-border/40 bg-[#0d1117] flex-shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-muted-foreground/50 font-mono">main.py</span>
            </div>
            <div className="flex-1 min-h-0">
              <PyEditor value={code} onChange={setCode} height="100%" />
            </div>
          </div>

          {/* Console panel */}
          <div className="w-[380px] flex flex-col flex-shrink-0">
            <Console logs={logs} onClear={clearLogs} />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 h-6 border-t border-border/40 bg-[#0d1117] flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-muted-foreground/35 font-mono">Python 3.11 · Pyodide</span>
          <span className="text-[11px] text-muted-foreground/25 font-mono hidden sm:inline">WebAssembly</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground/35 font-mono">
            {code.split("\n").length} строк
          </span>
          <span className="text-[11px] text-muted-foreground/25 font-mono">UTF-8</span>
        </div>
      </div>
    </div>
  );
}
