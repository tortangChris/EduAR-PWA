class SimulationStorageClass {
  constructor() {
    if (SimulationStorageClass._instance) {
      return SimulationStorageClass._instance;
    }
    this.STORAGE_KEY_PROGRESS = "simulationProgress";
    this.STORAGE_KEY_COMPLETED = "simulationCompleted";
    SimulationStorageClass._instance = this;
  }

  static getInstance() {
    if (!SimulationStorageClass._instance) {
      SimulationStorageClass._instance = new SimulationStorageClass();
    }
    return SimulationStorageClass._instance;
  }

  loadSimulationProgress(simulationsConfig) {
    const saved =
      JSON.parse(localStorage.getItem(this.STORAGE_KEY_PROGRESS)) || {};
    return simulationsConfig.map((m) => ({
      ...m,
      progress: saved[m.route] ?? 0,
    }));
  }

  saveSimulationProgress(modules) {
    const progressObj = {};
    modules.forEach((m) => {
      progressObj[m.route] = m.progress;
    });
    localStorage.setItem(
      this.STORAGE_KEY_PROGRESS,
      JSON.stringify(progressObj),
    );
  }

  getSimulationProgress(route) {
    const stored =
      JSON.parse(localStorage.getItem(this.STORAGE_KEY_PROGRESS)) || {};
    return stored[route] ?? 0;
  }

  setSimulationProgress(route, value) {
    const stored =
      JSON.parse(localStorage.getItem(this.STORAGE_KEY_PROGRESS)) || {};
    stored[route] = Math.min(100, value);
    localStorage.setItem(this.STORAGE_KEY_PROGRESS, JSON.stringify(stored));
  }

  // Track kung ilang tutorials na na-complete (hindi skip) sa isang route
  getCompletedCount(route) {
    const stored =
      JSON.parse(localStorage.getItem(this.STORAGE_KEY_COMPLETED)) || {};
    return stored[route] ?? 0;
  }

  incrementCompletedCount(route) {
    const stored =
      JSON.parse(localStorage.getItem(this.STORAGE_KEY_COMPLETED)) || {};
    stored[route] = (stored[route] ?? 0) + 1;
    localStorage.setItem(this.STORAGE_KEY_COMPLETED, JSON.stringify(stored));
    return stored[route];
  }

  finishSimulation(modules, index) {
    const updated = [...modules];
    updated[index] = { ...updated[index], progress: 100 };
    this.setSimulationProgress(updated[index].route, 100);
    return updated;
  }

  isSimulationUnlocked(modules, index) {
    if (index === 0) return true;
    return modules[index - 1].progress === 100;
  }
}

const SimulationStorage = SimulationStorageClass.getInstance();
export default SimulationStorage;
