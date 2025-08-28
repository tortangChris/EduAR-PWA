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

// Save progress
export function setModuleProgress(moduleId, progress) {
  const storedProgress =
    JSON.parse(localStorage.getItem("moduleProgress")) || {};
  storedProgress[moduleId] = progress;
  localStorage.setItem("moduleProgress", JSON.stringify(storedProgress));
}

export function getModuleProgress(moduleId) {
  const storedProgress =
    JSON.parse(localStorage.getItem("moduleProgress")) || {};
  return storedProgress[moduleId] ?? 0;
}

// Save last page position
export function setModulePosition(moduleId, page) {
  const storedPositions =
    JSON.parse(localStorage.getItem("modulePagePositions")) || {};
  storedPositions[moduleId] = page;
  localStorage.setItem("modulePagePositions", JSON.stringify(storedPositions));
}

export function getModulePosition(moduleId) {
  const storedPositions =
    JSON.parse(localStorage.getItem("modulePagePositions")) || {};
  return storedPositions[moduleId] ?? 0;
}
