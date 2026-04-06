import simulationsConfig from "../config/simulationsConfig";

const STORAGE_KEY_PROGRESS = "simulationProgress";

export function loadSimulationProgress() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS)) || {};
  return simulationsConfig.map((m) => ({
    ...m,
    progress: saved[m.route] ?? 0,
  }));
}

export function getSimulationProgress(route) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS)) || {};
  return stored[route] ?? 0;
}

export function setSimulationProgress(route, value) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS)) || {};
  stored[route] = Math.min(100, value);
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(stored));
}

export function finishSimulation(modules, index) {
  const updated = [...modules];
  updated[index] = { ...updated[index], progress: 100 };
  setSimulationProgress(updated[index].route, 100);
  return updated;
}

export function isSimulationUnlocked(modules, index) {
  if (index === 0) return true;
  return modules[index - 1].progress === 100;
}
