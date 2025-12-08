// src/utils/dsaModeProgress.js

// Order ng DSA AR modes (walang "Off", pang-learning lang ito)
export const DSA_MODES = ["Array", "Queue", "Stack", "Linked List", "Auto"];

const STORAGE_KEY_DSA_PROGRESS = "dsaModeProgress";

// 🔹 Load all DSA module progress from localStorage
export function loadDSAProgress() {
  const saved =
    JSON.parse(localStorage.getItem(STORAGE_KEY_DSA_PROGRESS)) || {};

  return DSA_MODES.map((name) => ({
    name,
    progress: saved[name] ?? 0, // 0–100
  }));
}

// 🔹 Save full array of modules back to localStorage
export function saveDSAProgress(modules) {
  const obj = {};
  modules.forEach((m) => {
    obj[m.name] = m.progress ?? 0;
  });
  localStorage.setItem(STORAGE_KEY_DSA_PROGRESS, JSON.stringify(obj));
}

// 🔹 Per-mode helpers
export function getDSAModeProgress(name) {
  const saved =
    JSON.parse(localStorage.getItem(STORAGE_KEY_DSA_PROGRESS)) || {};
  return saved[name] ?? 0;
}

export function setDSAModeProgress(name, value) {
  const clamped = Math.min(100, Math.max(0, value));
  const saved =
    JSON.parse(localStorage.getItem(STORAGE_KEY_DSA_PROGRESS)) || {};
  saved[name] = clamped;
  localStorage.setItem(STORAGE_KEY_DSA_PROGRESS, JSON.stringify(saved));
}

// 🔹 Mark a module as finished (100%) – like finishModule()
export function finishDSAMode(modules, index) {
  const updated = [...modules];
  if (!updated[index]) return updated;

  updated[index] = { ...updated[index], progress: 100 };
  setDSAModeProgress(updated[index].name, 100);
  return updated;
}

// 🔹 Unlock rules: first DSA module (Array) always unlocked,
// next module unlocks kapag previous progress === 100
export function isDSAModeUnlocked(modules, index) {
  if (index === 0) return true; // Array
  if (!modules[index - 1]) return false;
  return modules[index - 1].progress === 100;
}

// 🔹 Convenience: get list ng unlocked mode names based on saved progress
export function getUnlockedDSAModeNames() {
  const modules = loadDSAProgress();
  return modules
    .filter((m, idx) => isDSAModeUnlocked(modules, idx))
    .map((m) => m.name);
}

// Optional: pang-reset kung gusto mo i-clear yung AR progress
export function resetDSAProgress() {
  localStorage.removeItem(STORAGE_KEY_DSA_PROGRESS);
}
