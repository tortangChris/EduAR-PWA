import modulesConfig from "../config/modulesConfig";

const STORAGE_KEY_PROGRESS = "moduleProgress";

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

export function finishModule(modules, index) {
  const updated = [...modules];
  updated[index] = { ...updated[index], progress: 100 };
  saveProgress(updated);
  return updated;
}

export function isUnlocked(modules, index) {
  if (index === 0) return true;
  return modules[index - 1].progress === 100;
}

// services/moduleService.js
export function getModuleProgress(route) {
  const stored = JSON.parse(localStorage.getItem("moduleProgress")) || {};
  return stored[route] ?? 0;
}

export function setModuleProgress(route, value) {
  const stored = JSON.parse(localStorage.getItem("moduleProgress")) || {};
  stored[route] = value;
  localStorage.setItem("moduleProgress", JSON.stringify(stored));
}

export function getModulePosition(route) {
  const stored = JSON.parse(localStorage.getItem("modulePagePositions")) || {};
  return stored[route] ?? 0;
}

export function setModulePosition(route, page) {
  const stored = JSON.parse(localStorage.getItem("modulePagePositions")) || {};
  stored[route] = page;
  localStorage.setItem("modulePagePositions", JSON.stringify(stored));
}
