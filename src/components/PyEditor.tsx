import { useEffect, useRef, useState } from "react";

interface PyEditorProps {
  value: string;
  onChange: (v: string) => void;
  height?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    require: any;
  }
}

const MONACO_CDN = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min";

export default function PyEditor({ value, onChange, height = "100%" }: PyEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const initEditor = () => {
      if (!containerRef.current || editorRef.current) return;

      window.monaco.editor.defineTheme("pyspace-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "C792EA", fontStyle: "bold" },
          { token: "string", foreground: "C3E88D" },
          { token: "number", foreground: "F78C6C" },
          { token: "comment", foreground: "546E7A", fontStyle: "italic" },
          { token: "identifier", foreground: "82AAFF" },
          { token: "type", foreground: "FFCB6B" },
          { token: "delimiter", foreground: "89DDFF" },
        ],
        colors: {
          "editor.background": "#0d1117",
          "editor.foreground": "#CDD9E5",
          "editor.lineHighlightBackground": "#161b22",
          "editor.selectionBackground": "#264f78",
          "editorCursor.foreground": "#58A6FF",
          "editorLineNumber.foreground": "#484f58",
          "editorLineNumber.activeForeground": "#8b949e",
          "editor.inactiveSelectionBackground": "#1f2937",
        },
      });

      const editor = window.monaco.editor.create(containerRef.current, {
        value,
        language: "python",
        theme: "pyspace-dark",
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
        fontLigatures: true,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        renderWhitespace: "selection",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        padding: { top: 16, bottom: 16 },
        lineNumbers: "on",
        glyphMargin: false,
        folding: true,
        renderLineHighlight: "all",
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      });

      editor.onDidChangeModelContent(() => {
        onChangeRef.current(editor.getValue());
      });

      editorRef.current = editor;
      setReady(true);
    };

    const loadMonaco = () => {
      if (window.monaco) {
        initEditor();
        return;
      }

      const existing = document.getElementById("monaco-loader");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "monaco-loader";
        script.src = `${MONACO_CDN}/vs/loader.js`;
        script.onload = () => {
          window.require.config({ paths: { vs: `${MONACO_CDN}/vs` } });
          window.require(["vs/editor/editor.main"], initEditor);
        };
        document.head.appendChild(script);
      } else {
        const check = setInterval(() => {
          if (window.monaco) {
            clearInterval(check);
            initEditor();
          }
        }, 100);
      }
    };

    loadMonaco();

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const current = editorRef.current.getValue();
      if (current !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [value]);

  return (
    <div style={{ height, position: "relative", overflow: "hidden" }}>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117] z-10">
          <div className="flex gap-2 items-center text-muted-foreground text-sm font-mono">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Загрузка редактора...
          </div>
        </div>
      )}
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
