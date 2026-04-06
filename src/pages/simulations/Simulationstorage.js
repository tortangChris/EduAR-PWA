// ==================== SINGLETON: SimulationStorage ====================
// Reserve ng dati mong singleton pattern - isang instance lang sa buong app

class SimulationStorageClass {
  constructor() {
    if (SimulationStorageClass._instance) {
      return SimulationStorageClass._instance;
    }
    this.STORAGE_KEY_PROGRESS = "simulationProgress";
    this.STORAGE_KEY_POSITION = "simulationPagePositions";
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

  getSimulationPosition(route) {
    const stored =
      JSON.parse(localStorage.getItem(this.STORAGE_KEY_POSITION)) || {};
    return stored[route] ?? 0;
  }

  setSimulationPosition(route, page) {
    const stored =
      JSON.parse(localStorage.getItem(this.STORAGE_KEY_POSITION)) || {};
    stored[route] = page;
    localStorage.setItem(this.STORAGE_KEY_POSITION, JSON.stringify(stored));
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

// Export singleton instance
const SimulationStorage = SimulationStorageClass.getInstance();
export default SimulationStorage;
