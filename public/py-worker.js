importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodide = null;
let loadedPackages = new Set();

async function initPyodide() {
  pyodide = await loadPyodide({
    stdout: (text) => self.postMessage({ type: "stdout", text }),
    stderr: (text) => self.postMessage({ type: "stderr", text }),
  });
  self.postMessage({ type: "ready" });
}

initPyodide();

self.onmessage = async (e) => {
  const { id, type, code, packages } = e.data;

  if (type === "install") {
    try {
      await pyodide.loadPackagesFromImports(code);
      if (packages && packages.length > 0) {
        const toInstall = packages.filter((p) => !loadedPackages.has(p));
        if (toInstall.length > 0) {
          self.postMessage({ type: "stdout", text: `📦 Установка пакетов: ${toInstall.join(", ")}...` });
          await pyodide.loadPackage(toInstall);
          toInstall.forEach((p) => loadedPackages.add(p));
          self.postMessage({ type: "stdout", text: `✅ Пакеты установлены.` });
        }
      }
      self.postMessage({ id, type: "install_done" });
    } catch (err) {
      self.postMessage({ id, type: "error", text: String(err) });
    }
    return;
  }

  if (type === "run") {
    try {
      await pyodide.loadPackagesFromImports(code);
      const result = await pyodide.runPythonAsync(code);
      if (result !== undefined && result !== null) {
        self.postMessage({ type: "stdout", text: String(result) });
      }
      self.postMessage({ id, type: "done" });
    } catch (err) {
      const errText = String(err);
      self.postMessage({ id, type: "error", text: errText });
    }
    return;
  }
};
