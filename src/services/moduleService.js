import modulesConfig from "../config/modulesConfig";

const STORAGE_KEY_PROGRESS = "moduleProgress";

// Load the saved progress for all modules
// FSM concept: initializing all module "states" from storage
export function loadProgress() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS)) || {};
  return modulesConfig.map((m) => ({
    ...m,
    progress: saved[m.route] ?? 0, // FSM state = current progress
  }));
}

// Save all modules progress to storage
// FSM concept: persisting the current "states" after transitions
export function saveProgress(modules) {
  const progressObj = {};
  modules.forEach((m) => {
    progressObj[m.route] = m.progress; // FSM state
  });
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressObj));
}

// Mark a module as finished (progress = 100)
// FSM concept: transition to terminal state for a module
export function finishModule(modules, index) {
  const updated = [...modules];
  updated[index] = { ...updated[index], progress: 100 }; // FSM terminal state
  saveProgress(updated); // persist state
  return updated;
}

// Check if a module is unlocked based on previous module's completion
// FSM concept: conditional transitions, only allow next state if previous is terminal
export function isUnlocked(modules, index) {
  if (index === 0) return true; // first module always unlocked
  return modules[index - 1].progress === 100; // transition allowed only if previous module is finished
}

// Get a single module's progress
// FSM concept: read current state of a particular FSM
export function getModuleProgress(route) {
  const stored = JSON.parse(localStorage.getItem("moduleProgress")) || {};
  return stored[route] ?? 0; // default FSM state = 0
}

// Set a single module's progress
// FSM concept: update FSM state on transition
export function setModuleProgress(route, value) {
  const stored = JSON.parse(localStorage.getItem("moduleProgress")) || {};
  stored[route] = value; // FSM state transition
  localStorage.setItem("moduleProgress", JSON.stringify(stored));
}

// Get current page position of a module
// FSM concept: tracks FSM sub-state (current step/page)
export function getModulePosition(route) {
  const stored = JSON.parse(localStorage.getItem("modulePagePositions")) || {};
  return stored[route] ?? 0; // default FSM sub-state
}

// Set current page position of a module
// FSM concept: FSM transition between sub-states
export function setModulePosition(route, page) {
  const stored = JSON.parse(localStorage.getItem("modulePagePositions")) || {};
  stored[route] = page; // FSM sub-state transition
  localStorage.setItem("modulePagePositions", JSON.stringify(stored));
}
