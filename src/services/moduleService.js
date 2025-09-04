import modulesConfig from "../config/modulesConfig";

const STORAGE_KEY_PROGRESS = "moduleProgress";
const STORAGE_KEY_POSITION = "modulePagePositions";

// Load / Save All Progress
export function loadProgress() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS)) || {};
  return modulesConfig.map((m) => ({
    ...m,
    progress: saved[m.route] ?? 0,
  }));
}

export function saveProgress(modules) {
  const progressObj = {};
  modules.forEach((m) => {
    progressObj[m.route] = m.progress;
  });
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressObj));
}

// Per-Module Progress
export function getModuleProgress(route) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS)) || {};
  return stored[route] ?? 0;
}

export function setModuleProgress(route, value) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS)) || {};
  stored[route] = Math.min(100, value); // clamp to 100
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(stored));
}

// Module Page Position
export function getModulePosition(route) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_POSITION)) || {};
  return stored[route] ?? 0;
}

export function setModulePosition(route, page) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_POSITION)) || {};
  stored[route] = page;
  localStorage.setItem(STORAGE_KEY_POSITION, JSON.stringify(stored));
}

// Finish Module
export function finishModule(modules, index) {
  const updated = [...modules];
  updated[index] = { ...updated[index], progress: 100 };
  setModuleProgress(updated[index].route, 100); // ✅ persist finished state
  return updated;
}

// Unlock Condition
export function isUnlocked(modules, index) {
  if (index === 0) return true;
  return modules[index - 1].progress === 100;
}
